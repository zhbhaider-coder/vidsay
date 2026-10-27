/* Vidsay library — reads recordings from IndexedDB (same browser only). */
(function () {
  'use strict';
  var FREE_LIMIT = 25;
  var DB_NAME = 'vidsay', STORE = 'recordings';
  var $ = function (id) { return document.getElementById(id); };
  var listEl = $('libList'), emptyMsg = $('emptyMsg'), libCount = $('libCount'),
      infoBox = $('infoBox'), errBox = $('errBox'), importFile = $('importFile');
  var urls = {}; // id -> object URL, revoked on unload

  function show(el, msg) { el.textContent = msg; el.classList.add('show'); }
  function hide(el) { el.textContent = ''; el.classList.remove('show'); }
  function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }

  function openDb() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = function () { req.result.createObjectStore(STORE, { keyPath: 'id' }); };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }
  function getAll() {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var req = db.transaction(STORE, 'readonly').objectStore(STORE).getAll();
        req.onsuccess = function () { resolve(req.result || []); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }
  function delRec(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }
  function putRec(rec) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(rec);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
      });
    });
  }

  function render(recs) {
    listEl.innerHTML = '';
    recs.sort(function (a, b) { return (b.meta.date || '').localeCompare(a.meta.date || ''); });
    libCount.textContent = 'Free plan: ' + recs.length + ' / ' + FREE_LIMIT + ' videos used';
    emptyMsg.style.display = recs.length ? 'none' : 'block';
    recs.forEach(function (rec) {
      var m = rec.meta || {};
      var item = document.createElement('div');
      item.className = 'lib-item';
      var meta = document.createElement('div');
      meta.className = 'meta';
      var title = document.createElement('b');
      title.textContent = m.title || 'Recording';
      var sub = document.createElement('div');
      sub.textContent = (m.date || '') + ' · ' + (m.duration || '') + ' · ' + mb(rec.blob ? rec.blob.size : (m.size || 0));
      meta.appendChild(title);
      meta.appendChild(sub);
      item.appendChild(meta);

      var acts = document.createElement('div');
      acts.className = 'acts';

      var play = document.createElement('button');
      play.className = 'btn'; play.textContent = '▶ Play';
      play.addEventListener('click', function () {
        var url = urls[rec.id] || (urls[rec.id] = URL.createObjectURL(rec.blob));
        var v = document.createElement('video');
        v.src = url; v.controls = true; v.autoplay = true;
        v.style.cssText = 'width:100%;border-radius:10px;margin-top:12px;background:#000';
        var old = item.querySelector('video');
        if (old) { old.remove(); return; }
        item.appendChild(v);
      });
      acts.appendChild(play);

      var dl = document.createElement('button');
      dl.className = 'btn'; dl.textContent = '⬇ Download';
      dl.addEventListener('click', function () {
        var url = urls[rec.id] || (urls[rec.id] = URL.createObjectURL(rec.blob));
        var a = document.createElement('a');
        a.href = url;
        a.download = 'vidsay-' + (m.date || 'recording').replace(/[^0-9]/g, '').slice(0, 12) + '.webm';
        document.body.appendChild(a); a.click(); a.remove();
      });
      acts.appendChild(dl);

      var del = document.createElement('button');
      del.className = 'btn danger'; del.textContent = 'Delete';
      del.addEventListener('click', function () {
        if (!window.confirm('Delete this recording from this browser? The downloaded file on your device is not affected.')) return;
        delRec(rec.id).then(load).catch(function () { show(errBox, 'Could not delete the recording.'); });
      });
      acts.appendChild(del);

      item.appendChild(acts);
      listEl.appendChild(item);
    });
  }

  function load() {
    hide(infoBox); hide(errBox);
    getAll().then(render).catch(function () {
      show(errBox, 'Could not open the library in this browser (storage blocked or unavailable). Recordings still download as files when you record.');
      emptyMsg.style.display = 'block';
    });
  }

  importFile.addEventListener('change', function () {
    var f = importFile.files && importFile.files[0];
    if (!f) return;
    var now = new Date();
    var rec = {
      id: 'v' + now.getTime(),
      blob: f,
      meta: {
        id: 'v' + now.getTime(),
        title: 'Imported — ' + f.name,
        date: now.toISOString().slice(0, 19).replace('T', ' '),
        duration: 'imported file',
        seconds: 0,
        size: f.size
      }
    };
    putRec(rec).then(function () {
      show(infoBox, 'Imported “' + f.name + '” into your library.');
      load();
    }).catch(function () { show(errBox, 'Could not import the file (browser storage blocked or full).'); });
    importFile.value = '';
  });

  window.addEventListener('beforeunload', function () {
    Object.keys(urls).forEach(function (k) { URL.revokeObjectURL(urls[k]); });
  });

  load();
})();
