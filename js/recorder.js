/* Vidsay recorder — screen + camera + mic, recorded in the browser.
   No server, no upload: the video is composited on a canvas, captured
   with MediaRecorder, and saved to this browser (IndexedDB) + downloaded
   as a .webm file. Free plan: 25 videos, 5-minute cap. */
(function () {
  'use strict';

  var FREE_LIMIT = 25;
  var FREE_MAX_SECONDS = 300; // 5:00
  var W = 1280, H = 720;
  var DB_NAME = 'vidsay', STORE = 'recordings';

  /* Mobile browsers cannot share their screen (no getDisplayMedia), so on
     a phone — or any browser without screen capture — the recorder runs in
     camera-only mode instead of showing a dead end. */
  var HAS_SCREEN = !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia);
  var IS_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '') ||
    (navigator.maxTouchPoints > 0 && Math.min(window.screen.width, window.screen.height) <= 820);
  var CAM_ONLY = !HAS_SCREEN;
  var facing = 'user'; // front camera by default on mobile; switchable to 'environment'

  var $ = function (id) { return document.getElementById(id); };
  var preview = $('preview'), placeholder = $('placeholder'), liveDot = $('liveDot'),
      timerEl = $('timer'), btnStart = $('btnStart'), btnPause = $('btnPause'),
      btnStop = $('btnStop'), btnDownload = $('btnDownload'), btnCamSwitch = $('btnCamSwitch'),
      errBox = $('errBox'), infoBox = $('infoBox'), warnBox = $('warnBox'),
      freeCount = $('freeCount'), canvas = $('mix'),
      screenVid = $('screenVid'), camVid = $('camVid'),
      recIntro = $('recIntro'), phNote = $('phNote'), camOnlyNote = $('camOnlyNote'),
      optScreenCam = $('optScreenCam'), optScreen = $('optScreen'), optSysRow = $('optSysRow');
  var ctx = canvas.getContext('2d');

  var state = 'idle'; // idle | recording | paused | done
  var mediaRecorder = null, chunks = [];
  var screenStream = null, camStream = null, micStream = null, mixedStream = null;
  var rafId = null, timerId = null, elapsed = 0, warned30 = false;
  var lastBlob = null, lastBlobUrl = null, lastMeta = null;

  /* ---------- IndexedDB ---------- */
  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function idbPut(rec) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(rec);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function idbCount() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(STORE, 'readonly').objectStore(STORE).count();
        req.onsuccess = function () { resolve(req.result); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function () { return 0; });
  }

  /* ---------- UI helpers ---------- */
  function show(el, msg) { el.textContent = msg; el.classList.add('show'); }
  function hide(el) { el.textContent = ''; el.classList.remove('show'); }
  function fmt(s) {
    var m = Math.floor(s / 60), ss = s % 60;
    return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function refreshCount() {
    idbCount().then(function (n) {
      freeCount.textContent = n + ' / ' + FREE_LIMIT;
    });
  }
  function setButtons() {
    btnStart.disabled = (state === 'recording' || state === 'paused');
    btnPause.disabled = (state !== 'recording' && state !== 'paused');
    btnPause.textContent = (state === 'paused') ? '▶ Resume' : '⏸ Pause';
    btnStop.disabled = (state !== 'recording' && state !== 'paused');
    btnDownload.disabled = !(state === 'done' && lastBlob);
  }

  /* ---------- canvas compositing ---------- */
  /* Draw a video to fill a rectangle without stretching (crop the overflow).
     Matters on phones: a portrait camera feed must fill the frame, not squash. */
  function drawCover(video, x, y, w, h) {
    var vw = video.videoWidth, vh = video.videoHeight;
    if (!vw || !vh) return;
    var scale = Math.max(w / vw, h / vh);
    var sw = w / scale, sh = h / scale;
    ctx.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, x, y, w, h);
  }

  function drawFrame() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    var mode = document.querySelector('input[name="src"]:checked').value;
    if (mode === 'cam') {
      if (camVid.readyState >= 2) drawCover(camVid, 0, 0, W, H);
    } else {
      if (screenVid.readyState >= 2) ctx.drawImage(screenVid, 0, 0, W, H);
      if (mode === 'screen-cam' && camVid.readyState >= 2) {
        var pw = 320, ph = 180, px = W - pw - 16, py = H - ph - 16;
        drawCover(camVid, px, py, pw, ph);
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.lineWidth = 3;
        ctx.strokeRect(px, py, pw, ph);
      }
    }
    // small free-plan mark, bottom-left
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.font = '600 20px sans-serif';
    ctx.fillText('Vidsay', 16, H - 16);
    if (state === 'recording' || state === 'paused') rafId = requestAnimationFrame(drawFrame);
  }

  /* ---------- recording ---------- */
  function pickMime() {
    var types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    for (var i = 0; i < types.length; i++) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return '';
  }

  function tick() {
    elapsed += 1;
    timerEl.textContent = fmt(elapsed);
    if (elapsed >= FREE_MAX_SECONDS - 30 && !warned30) {
      warned30 = true;
      show(warnBox, '30 seconds left on the free plan — this recording stops automatically at 5:00.');
    }
    if (elapsed >= FREE_MAX_SECONDS) stopRecording(true);
  }

  function stopStreams() {
    [screenStream, camStream, micStream].forEach(function (s) {
      if (s) s.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} });
    });
    screenStream = camStream = micStream = null;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (timerId) clearInterval(timerId);
    timerId = null;
    if (mixedStream) { mixedStream.getTracks().forEach(function (t) { try { t.stop(); } catch (e) {} }); mixedStream = null; }
    screenVid.srcObject = null; camVid.srcObject = null;
  }

  function startRecording() {
    hide(errBox); hide(infoBox); hide(warnBox);
    if (!window.MediaRecorder) {
      show(errBox, 'This browser cannot record video (MediaRecorder is not available). Try Chrome, Edge or Firefox.');
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      show(errBox, 'This browser cannot access your camera or microphone. Try Chrome, Edge or Firefox.');
      return;
    }
    idbCount().then(function (n) {
      if (n >= FREE_LIMIT) {
        show(warnBox, 'Free plan limit reached — you already have ' + FREE_LIMIT + ' videos saved. Delete an old recording in My videos to record again, or wait for Pro (coming soon).');
        return;
      }
      acquireAndRecord();
    });
  }

  function acquireAndRecord() {
    var mode = CAM_ONLY ? 'cam' : document.querySelector('input[name="src"]:checked').value;
    var wantMic = $('optMic').checked;
    var wantSys = $('optSysAudio').checked;
    var jobs = [];
    if (mode !== 'cam') {
      jobs.push(navigator.mediaDevices.getDisplayMedia({ video: true, audio: wantSys })
        .then(function (s) { screenStream = s; }));
    }
    if (mode !== 'screen') {
      var camConstraints = { video: true, audio: wantMic };
      if (IS_MOBILE) camConstraints.video = { facingMode: facing, width: { ideal: 720 }, height: { ideal: 1280 } };
      jobs.push(navigator.mediaDevices.getUserMedia(camConstraints)
        .then(function (s) { camStream = s; }));
    }
    if (mode === 'screen' && wantMic) {
      jobs.push(navigator.mediaDevices.getUserMedia({ audio: true })
        .then(function (s) { micStream = s; }));
    }
    Promise.all(jobs).then(function () {
      if (screenStream) {
        screenVid.srcObject = screenStream;
        screenStream.getVideoTracks()[0].addEventListener('ended', function () {
          if (state === 'recording' || state === 'paused') stopRecording(false, 'Screen sharing ended — recording stopped and saved.');
        });
      }
      if (camStream) camVid.srcObject = camStream;
      beginCapture(mode, wantMic, wantSys);
    }).catch(function (err) {
      stopStreams();
      var msg = 'Could not start recording. ';
      if (err && err.name === 'NotAllowedError') msg += 'Permission was denied — allow screen/camera access and try again.';
      else if (err && err.name === 'NotFoundError') msg += 'No camera or microphone was found on this device.';
      else msg += (err && err.message ? err.message : 'Unknown error.');
      show(errBox, msg);
    });
  }

  function beginCapture(mode, wantMic, wantSys) {
    mixedStream = canvas.captureStream(30);
    var audioTrack = null;
    if (wantMic) {
      if (camStream) audioTrack = camStream.getAudioTracks()[0] || null;
      else if (micStream) audioTrack = micStream.getAudioTracks()[0] || null;
    }
    if (!audioTrack && wantSys && screenStream) audioTrack = screenStream.getAudioTracks()[0] || null;
    if (audioTrack) mixedStream.addTrack(audioTrack);

    chunks = [];
    var mime = pickMime();
    try {
      mediaRecorder = mime ? new MediaRecorder(mixedStream, { mimeType: mime }) : new MediaRecorder(mixedStream);
    } catch (e) {
      show(errBox, 'Could not start the recorder in this browser: ' + e.message);
      stopStreams();
      return;
    }
    mediaRecorder.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = onStopped;
    mediaRecorder.onerror = function () { show(errBox, 'The recorder hit an error. Try again.'); };

    preview.srcObject = mixedStream;
    placeholder.style.display = 'none';
    preview.style.display = 'block';
    elapsed = 0; warned30 = false;
    timerEl.textContent = '00:00';
    state = 'recording';
    liveDot.classList.add('on');
    liveDot.innerHTML = '<i></i> REC';
    drawFrame();
    mediaRecorder.start(500);
    timerId = setInterval(tick, 1000);
    setButtons();
    show(infoBox, 'Recording… speak naturally. Pause any time; your video saves when you press Stop.');
  }

  function pauseResume() {
    if (!mediaRecorder) return;
    if (state === 'recording') {
      mediaRecorder.pause();
      state = 'paused';
      clearInterval(timerId); timerId = null;
      liveDot.innerHTML = '<i></i> PAUSED';
    } else if (state === 'paused') {
      mediaRecorder.resume();
      state = 'recording';
      timerId = setInterval(tick, 1000);
      liveDot.innerHTML = '<i></i> REC';
    }
    setButtons();
  }

  function stopRecording(auto, note) {
    if (!mediaRecorder || (state !== 'recording' && state !== 'paused')) return;
    hide(warnBox);
    if (auto) show(infoBox, 'Free plan: recording stopped at the 5:00 limit. Pro removes the cap (coming soon).');
    else if (note) show(infoBox, note);
    state = 'done-pending';
    setButtons();
    try { mediaRecorder.stop(); } catch (e) { onStopped(); }
  }

  function onStopped() {
    var blob = new Blob(chunks, { type: 'video/webm' });
    lastBlob = blob;
    if (lastBlobUrl) URL.revokeObjectURL(lastBlobUrl);
    lastBlobUrl = URL.createObjectURL(blob);
    stopStreams(); // stop capture tracks only after the final chunk is flushed
    preview.srcObject = null;
    preview.src = lastBlobUrl;
    preview.controls = true;
    preview.muted = false;
    preview.style.display = 'block';
    placeholder.style.display = 'none';
    liveDot.classList.remove('on');
    state = 'done';
    setButtons();

    var now = new Date();
    var stamp = now.toISOString().slice(0, 19).replace('T', ' ');
    lastMeta = {
      id: 'v' + now.getTime(),
      title: 'Recording — ' + stamp,
      date: stamp,
      duration: fmt(elapsed),
      seconds: elapsed,
      size: blob.size
    };
    idbPut({ id: lastMeta.id, blob: blob, meta: lastMeta }).then(function () {
      refreshCount();
      show(infoBox, 'Saved to My videos (' + lastMeta.duration + ', ' + (blob.size / 1048576).toFixed(1) + ' MB). Download the .webm file to share it anywhere.');
    }).catch(function () {
      show(warnBox, 'Video ready, but it could not be saved to this browser’s library (storage full or blocked). Download the file now so you don’t lose it.');
    });
  }

  function download() {
    if (!lastBlob) return;
    var a = document.createElement('a');
    var now = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    a.href = lastBlobUrl;
    a.download = 'vidsay-recording-' + now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + '-' + pad(now.getHours()) + pad(now.getMinutes()) + '.webm';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  /* ---------- front / rear camera switch (mobile) ---------- */
  function updateCamSwitchLabel() {
    btnCamSwitch.textContent = (facing === 'user') ? '🔄 Switch to rear camera' : '🔄 Switch to front camera';
  }

  function switchCamera() {
    facing = (facing === 'user') ? 'environment' : 'user';
    updateCamSwitchLabel();
    if (!camStream) return; // no camera open yet — the choice applies on Start
    var oldVideo = camStream.getVideoTracks()[0];
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false }).then(function (s) {
      var newVideo = s.getVideoTracks()[0];
      if (oldVideo) {
        try { camStream.removeTrack(oldVideo); } catch (e) {}
        try { oldVideo.stop(); } catch (e) {}
      }
      if (newVideo) camStream.addTrack(newVideo);
      // camVid is bound to camStream, so the preview (and the recording,
      // which draws from camVid) picks the new camera up live.
    }).catch(function (err) {
      facing = (facing === 'user') ? 'environment' : 'user';
      updateCamSwitchLabel();
      var msg = 'Could not switch camera. ';
      if (err && err.name === 'NotFoundError') msg += 'This device seems to have only one camera.';
      else if (err && err.name === 'NotAllowedError') msg += 'Camera permission was denied.';
      else msg += (err && err.message ? err.message : 'Unknown error.');
      show(errBox, msg);
    });
  }

  /* ---------- camera-only setup (phones, and any browser without screen capture) ---------- */
  if (CAM_ONLY) {
    if (optScreenCam) optScreenCam.style.display = 'none';
    if (optScreen) optScreen.style.display = 'none';
    var camRadio = document.querySelector('input[name="src"][value="cam"]');
    if (camRadio) camRadio.checked = true;
    if (optSysRow) optSysRow.style.display = 'none';
    if (camOnlyNote) {
      camOnlyNote.style.display = 'block';
      camOnlyNote.textContent = IS_MOBILE
        ? 'Screen sharing isn\u2019t available on phones, so Vidsay records your camera instead.'
        : 'Screen sharing isn\u2019t available in this browser, so Vidsay records your camera instead.';
    }
    if (IS_MOBILE) {
      // portrait canvas: phone video is vertical, like a reel
      canvas.width = 720; canvas.height = 1280; W = 720; H = 1280;
      var stage = document.querySelector('.rec-stage');
      if (stage) stage.classList.add('mobile');
      btnCamSwitch.style.display = '';
      updateCamSwitchLabel();
      if (recIntro) recIntro.textContent = 'Record with your phone camera and mic — right here in the browser. Phones can\u2019t share their screen, so Vidsay records your camera instead.';
      if (phNote) phNote.textContent = 'Camera recording on your phone — tap Start, then switch between front and rear camera any time.';
    } else if (recIntro) {
      recIntro.textContent = 'Record with your camera and mic — right here in the browser. This browser can\u2019t share its screen, so Vidsay records your camera instead.';
    }
  }

  btnStart.addEventListener('click', startRecording);
  btnCamSwitch.addEventListener('click', switchCamera);
  btnPause.addEventListener('click', pauseResume);
  btnStop.addEventListener('click', function () { stopRecording(false); });
  btnDownload.addEventListener('click', download);
  refreshCount();
  setButtons();
})();
