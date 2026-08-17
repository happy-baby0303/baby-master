/* ============================================================
   육아메이트 — 배냇함 사진 (photos.js)

   사진은 두 갈래로 담긴다.
     · 그날의 사진    — 아무 날에나, 하루 세 장까지
     · 첫 순간의 사진 — 도감 항목 하나에 딱 한 장

   갤러리에 3000장 있어도 "이게 첫 목욕이었나"는 아무도 모른다.
   여기 담긴 사진은 스스로 무슨 날인지 알고 있다.

   index.html 에서 memorybox.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var IDX_KEY     = "tosil_day_photos";
    var MAX_SIDE    = 1080;   // 긴 변 기준
    var QUALITY     = 0.72;
    var MAX_PER_DAY = 3;      // '그날의 사진'만 해당. 첫 순간 사진은 항목마다 1장씩 따로.
    var DAY         = 86400000;

    /* ---------- 작은 도구들 ---------- */

    function esc(s) {
        return String(s == null ? "" : s)
            .replace(/&/g, "&amp;").replace(/</g, "&lt;")
            .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    function babyName() {
        return localStorage.getItem("tosil_babyName") || "우리 아기";
    }

    function dayKeyOf(ts) {
        var d = new Date(ts);
        return d.getFullYear() + "-" +
               String(d.getMonth() + 1).padStart(2, "0") + "-" +
               String(d.getDate()).padStart(2, "0");
    }

    function todayKey() { return dayKeyOf(Date.now()); }

    function parseKey(key) {
        var p = String(key).split("-");
        return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
    }

    function ddayOf(key) {
        var d = localStorage.getItem("tosil_startDate");
        if (!d) return "";
        var b = new Date(d + "T00:00:00").getTime();
        if (isNaN(b)) return "";
        var diff = Math.floor((parseKey(key).getTime() - b) / DAY);
        return diff >= 0 ? "D+" + diff + "일" : "";
    }

    function prettyKey(key) {
        var d = parseKey(key);
        return d.getFullYear() + "년 " + (d.getMonth() + 1) + "월 " + d.getDate() + "일";
    }

    function toast(msg) {
        if (typeof window.showToast === "function") window.showToast(msg);
    }

    function uid8() {
        return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    // 도감 항목 제목 (MILESTONE_DATA 는 const 라 window 에 안 붙는다)
    function milestoneTitle(msId) {
        var list = null;
        try { if (typeof MILESTONE_DATA !== "undefined" && MILESTONE_DATA) list = MILESTONE_DATA; } catch (e) {}
        if (!list) list = window.MILESTONE_DATA;
        if (!list) return "";
        for (var i = 0; i < list.length; i++) if (list[i].id === msId) return list[i].title || "";
        return "";
    }

    /* ---------- 저장소 ----------
       무거운 사진은 스토리지에. 로컬에는 주소만.
       photo = { id, url, path, ts, caption, msId }
       msId 가 있으면 그 도감 항목의 사진, 없으면 그날의 사진. -------- */

    function loadIndex() {
        try {
            var v = JSON.parse(localStorage.getItem(IDX_KEY));
            return (v && typeof v === "object") ? v : {};
        } catch (e) { return {}; }
    }

    function saveIndex(idx) {
        try { localStorage.setItem(IDX_KEY, JSON.stringify(idx)); } catch (e) {}
    }

    window.getDayPhotos = function (key) {
        var arr = loadIndex()[key];
        return Array.isArray(arr) ? arr : [];
    };

    // 도감에 매이지 않은, 그냥 그날의 사진
    window.getLoosePhotos = function (key) {
        return window.getDayPhotos(key).filter(function (p) { return !p.msId; });
    };

    // 도감 항목의 사진. 나중에 도감 날짜를 고쳐도 따라오도록 전체를 훑는다.
    window.getMilestonePhoto = function (msId) {
        if (!msId) return null;
        var idx = loadIndex();
        var keys = Object.keys(idx);
        for (var i = 0; i < keys.length; i++) {
            var arr = idx[keys[i]];
            if (!Array.isArray(arr)) continue;
            for (var j = 0; j < arr.length; j++) {
                if (arr[j] && arr[j].msId === msId) return { photo: arr[j], key: keys[i] };
            }
        }
        return null;
    };

    window.photoDays = function () {
        var idx = loadIndex();
        return Object.keys(idx).filter(function (k) {
            return Array.isArray(idx[k]) && idx[k].length;
        });
    };

    window.photoCount = function () {
        var idx = loadIndex(), n = 0;
        Object.keys(idx).forEach(function (k) { if (Array.isArray(idx[k])) n += idx[k].length; });
        return n;
    };

    // 첫 순간 중 사진이 붙은 개수
    window.milestonePhotoCount = function () {
        var idx = loadIndex(), seen = {};
        Object.keys(idx).forEach(function (k) {
            (idx[k] || []).forEach(function (p) { if (p && p.msId) seen[p.msId] = 1; });
        });
        return Object.keys(seen).length;
    };

    function putPhoto(key, photo) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) idx[key] = [];
        idx[key].push(photo);
        saveIndex(idx);
    }

    function dropPhoto(key, id) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) return;
        idx[key] = idx[key].filter(function (p) { return p.id !== id; });
        if (!idx[key].length) delete idx[key];
        saveIndex(idx);
    }

    function setCaption(key, id, text) {
        var idx = loadIndex();
        if (!Array.isArray(idx[key])) return;
        idx[key].forEach(function (p) { if (p.id === id) p.caption = text; });
        saveIndex(idx);
    }

    function repaint() {
        if (typeof window.renderMemoryBox === "function") {
            try { window.renderMemoryBox(); } catch (e) {}
        }
    }

    /* ---------- 사진 캐시 ----------
       스토리지 URL 을 캔버스로 옮기려면 crossOrigin 이 필요하고,
       그건 버킷에 CORS 가 열려 있어야 한다. 열기 전에도 엽서가 되도록
       올릴 때 압축본을 이 기기에 같이 남겨둔다. 용량 제한이 사실상
       없는 IndexedDB 를 쓴다 (localStorage 는 사진 몇 장에 터진다). -------- */

    var DB_NAME = "tosil-photos", STORE = "thumbs";

    function idb() {
        return new Promise(function (res, rej) {
            if (!window.indexedDB) return rej(new Error("no indexedDB"));
            var req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = function () {
                var db = req.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
            };
            req.onsuccess = function () { res(req.result); };
            req.onerror = function () { rej(req.error); };
        });
    }

    window.cachePhotoData = async function (id, dataUrl) {
        try {
            var db = await idb();
            await new Promise(function (res, rej) {
                var tx = db.transaction(STORE, "readwrite");
                tx.objectStore(STORE).put(dataUrl, id);
                tx.oncomplete = res;
                tx.onerror = function () { rej(tx.error); };
            });
        } catch (e) { console.warn("[사진 캐시] 저장 실패", e); }
    };

    window.dropCachedPhotoData = async function (id) {
        try {
            var db = await idb();
            await new Promise(function (res) {
                var tx = db.transaction(STORE, "readwrite");
                tx.objectStore(STORE).delete(id);
                tx.oncomplete = res; tx.onerror = res;
            });
        } catch (e) {}
    };

    /* ---------- 못 올린 것들 ----------
       지하철에서 옹알이를 녹음했는데 업로드가 실패하면 그대로 날아갔다.
       실패하면 기기에 재워뒀다가, 연결이 돌아오면 다시 올린다. -------- */

    var QSTORE = "pending";

    function qdb() {
        return new Promise(function (res, rej) {
            if (!window.indexedDB) return rej(new Error("no indexedDB"));
            var req = indexedDB.open(DB_NAME, 2);
            req.onupgradeneeded = function () {
                var db = req.result;
                if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
                if (!db.objectStoreNames.contains(QSTORE)) db.createObjectStore(QSTORE);
            };
            req.onsuccess = function () { res(req.result); };
            req.onerror = function () { rej(req.error); };
        });
    }

    // job = { id, kind:'photo'|'voice', path, dataUrl, meta }
    window.queueUpload = async function (job) {
        try {
            var db = await qdb();
            await new Promise(function (res) {
                var tx = db.transaction(QSTORE, "readwrite");
                tx.objectStore(QSTORE).put(job, job.id);
                tx.oncomplete = res; tx.onerror = res;
            });
            toast("📡 연결이 돌아오면 자동으로 담을게요");
        } catch (e) { console.warn("[대기열] 저장 실패", e); }
    };

    window.pendingUploads = async function () {
        try {
            var db = await qdb();
            return await new Promise(function (res) {
                var tx = db.transaction(QSTORE, "readonly");
                var r = tx.objectStore(QSTORE).getAll();
                r.onsuccess = function () { res(r.result || []); };
                r.onerror = function () { res([]); };
            });
        } catch (e) { return []; }
    };

    async function dropJob(id) {
        try {
            var db = await qdb();
            await new Promise(function (res) {
                var tx = db.transaction(QSTORE, "readwrite");
                tx.objectStore(QSTORE).delete(id);
                tx.oncomplete = res; tx.onerror = res;
            });
        } catch (e) {}
    }

    window.flushUploads = async function () {
        if (!navigator.onLine) return;
        var jobs = await window.pendingUploads();
        if (!jobs.length) return;
        if (!window.storage || !window.uploadString || !window.getDownloadURL || !window.storageRef) return;

        for (var i = 0; i < jobs.length; i++) {
            var j = jobs[i];
            try {
                var ref = window.storageRef(window.storage, j.path);
                await window.uploadString(ref, j.dataUrl, "data_url");
                var url = await window.getDownloadURL(ref);

                if (j.kind === "voice" && typeof window.acceptQueuedVoice === "function") {
                    window.acceptQueuedVoice(j, url);
                } else {
                    putPhoto(j.meta.key, {
                        id: j.id, url: url, path: j.path, ts: j.meta.ts,
                        caption: j.meta.caption || "", msId: j.meta.msId || null
                    });
                    if (window.cachePhotoData) window.cachePhotoData(j.id, j.dataUrl);
                    window.syncPhotosToFirebase();
                }
                await dropJob(j.id);
                toast("📡 미뤄뒀던 " + (j.kind === "voice" ? "목소리" : "사진") + "를 담았어요");
                repaint();
            } catch (e) {
                console.warn("[대기열] 재시도 실패", e);
                break;                       // 아직 안 되면 다음 기회에
            }
        }
    };

    window.addEventListener("online", function () { setTimeout(window.flushUploads, 1500); });

    window.getCachedPhotoData = async function (id) {
        try {
            var db = await idb();
            return await new Promise(function (res) {
                var tx = db.transaction(STORE, "readonly");
                var r = tx.objectStore(STORE).get(id);
                r.onsuccess = function () { res(r.result || null); };
                r.onerror = function () { res(null); };
            });
        } catch (e) { return null; }
    };

    /* ---------- 가족 동기화 ---------- */

    function syncCode() { return localStorage.getItem("family_sync_code"); }
    function suffix() { return window.currentBabySuffix || ""; }

    window.syncPhotosToFirebase = async function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.setDoc !== "function" || typeof window.doc !== "function") return;
        try {
            await window.setDoc(window.doc(window.db, "photos_" + code + suffix(), "status"), { days: loadIndex() });
        } catch (e) { console.warn("[배냇함 사진] 동기화 실패", e); }
    };

    var photoUnsub = null;
    window.startPhotoRealtimeSync = function () {
        var code = syncCode();
        if (!code || !window.db || typeof window.onSnapshot !== "function" || typeof window.doc !== "function") return;
        if (photoUnsub) { try { photoUnsub(); } catch (e) {} }

        var ref = window.doc(window.db, "photos_" + code + suffix(), "status");
        var unsub = window.onSnapshot(ref, function (snap) {
            if (!snap.exists()) return;
            var remote = (snap.data() || {}).days || {};
            var local = loadIndex();
            var merged = {};

            Object.keys(local).concat(Object.keys(remote)).forEach(function (k) {
                if (merged[k]) return;
                var seen = {}, out = [];
                (local[k] || []).concat(remote[k] || []).forEach(function (p) {
                    if (!p || !p.id || seen[p.id]) return;
                    seen[p.id] = 1;
                    out.push(p);
                });
                out.sort(function (a, b) { return (a.ts || 0) - (b.ts || 0); });
                if (out.length) merged[k] = out;
            });

            if (JSON.stringify(merged) === JSON.stringify(local)) return;
            saveIndex(merged);
            repaint();
        });

        photoUnsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(unsub) : unsub;
    };

    /* ---------- 담기 ---------- */

    var pendingKey = null, pendingMs = null;

    function fileInput() {
        var el = document.getElementById("mb-photo-input");
        if (el) return el;
        el = document.createElement("input");
        el.type = "file";
        el.id = "mb-photo-input";
        el.accept = "image/*";
        el.multiple = true;
        el.style.display = "none";
        el.addEventListener("change", function () {
            var files = Array.prototype.slice.call(this.files || []);
            this.value = "";
            if (files.length) handleFiles(pendingKey || todayKey(), pendingMs, files);
        });
        document.body.appendChild(el);
        return el;
    }

    // 그날의 사진
    window.addDayPhoto = function (key) {
        pendingKey = key || todayKey();
        pendingMs = null;
        if (window.getLoosePhotos(pendingKey).length >= MAX_PER_DAY) {
            toast("이 날은 이미 " + MAX_PER_DAY + "장이 담겨 있어요");
            return;
        }
        fileInput().click();
    };

    // 첫 순간의 사진 — 항목 하나에 한 장. 이미 있으면 그 사진을 연다.
    window.addMilestonePhoto = function (key, msId) {
        var have = window.getMilestonePhoto(msId);
        if (have) { openViewer([have.photo], 0, have.key); return; }
        pendingKey = key || todayKey();
        pendingMs = msId;
        fileInput().click();
    };

    function handleFiles(key, msId, files) {
        var picked;
        if (msId) {
            picked = files.slice(0, 1);           // 첫 순간은 한 장이면 된다
        } else {
            var room = MAX_PER_DAY - window.getLoosePhotos(key).length;
            if (room <= 0) return;
            picked = files.slice(0, room);
            if (files.length > room) toast("이 날은 " + MAX_PER_DAY + "장까지만 담겨요");
        }

        var uidNow = window.auth && window.auth.currentUser && window.auth.currentUser.uid;
        if (!uidNow) { toast("🔐 사진 저장은 로그인 후 이용할 수 있어요"); return; }
        if (!window.storage || !window.uploadString || !window.getDownloadURL || !window.storageRef) {
            toast("스토리지를 불러오지 못했어요. 새로고침해 주세요");
            return;
        }

        toast("⏳ 배냇함에 담는 중이에요…");
        var done = 0;
        picked.forEach(function (file) {
            shrink(file, function (dataUrl) {
                if (!dataUrl) return;
                upload(key, msId, uidNow, dataUrl, function () {
                    done++;
                    if (done === picked.length) {
                        var t = msId ? milestoneTitle(msId) : "";
                        toast(t ? "🧺 '" + t + "'에 사진을 붙였어요"
                                : "🧺 " + babyName() + "의 배냇함에 담겼어요");
                        window.syncPhotosToFirebase();
                    }
                    repaint();
                });
            });
        });
    }

    // 긴 변 1080px, 품질 0.72. 화면에서 보기엔 충분하고 통신비는 가볍다.
    function shrink(file, cb) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                var w = img.width, h = img.height;
                if (w > h) { if (w > MAX_SIDE) { h *= MAX_SIDE / w; w = MAX_SIDE; } }
                else       { if (h > MAX_SIDE) { w *= MAX_SIDE / h; h = MAX_SIDE; } }
                var c = document.createElement("canvas");
                c.width = Math.round(w); c.height = Math.round(h);
                c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
                try { cb(c.toDataURL("image/jpeg", QUALITY)); }
                catch (err) { console.warn("[배냇함 사진] 변환 실패", err); cb(null); }
            };
            img.onerror = function () { cb(null); };
            img.src = e.target.result;
        };
        reader.onerror = function () { cb(null); };
        reader.readAsDataURL(file);
    }

    async function upload(key, msId, uidNow, dataUrl, done) {
        var id = uid8();
        var path = "memories/" + uidNow + "/" + key + "_" + id + ".jpg";
        try {
            var ref = window.storageRef(window.storage, path);
            await window.uploadString(ref, dataUrl, "data_url");
            var url = await window.getDownloadURL(ref);
            putPhoto(key, { id: id, url: url, path: path, ts: Date.now(), caption: "", msId: msId || null });
            if (window.cachePhotoData) window.cachePhotoData(id, dataUrl);   // 엽서용
            done();
        } catch (err) {
            console.error("[배냇함 사진] 업로드 실패", err);
            if (window.queueUpload) {
                await window.queueUpload({
                    id: id, kind: "photo", path: path, dataUrl: dataUrl,
                    meta: { key: key, ts: Date.now(), msId: msId || null, caption: "" }
                });
            } else {
                toast("사진을 담지 못했어요. 연결을 확인해 주세요");
            }
        }
    }

    /* ---------- 날짜 카드 안의 사진 줄 (그날의 사진만) ---------- */

    window.renderPhotoStrip = function (key) {
        var list = window.getLoosePhotos(key);
        if (!list.length) return "";

        if (list.length === 1) {
            return '<div onclick="window.openLoosePhoto(\'' + key + '\',0)" style="margin-bottom:16px; border-radius:16px; overflow:hidden; cursor:pointer; background:var(--bg-sub);">' +
                '<img src="' + esc(list[0].url) + '" loading="lazy" alt="" style="width:100%; display:block; object-fit:cover; max-height:340px;">' +
                (list[0].caption ? '<div style="font-family:\'Nanum Pen Script\',cursive; font-size:19px; line-height:1.5; color:var(--text-m); padding:12px 14px 14px; word-break:keep-all;">' + esc(list[0].caption) + '</div>' : '') +
            '</div>';
        }

        var cells = list.map(function (p, i) {
            return '<div onclick="window.openLoosePhoto(\'' + key + '\',' + i + ')" style="flex:1; aspect-ratio:1/1; border-radius:13px; overflow:hidden; cursor:pointer; background:var(--bg-sub);">' +
                '<img src="' + esc(p.url) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
            '</div>';
        }).join("");

        return '<div style="display:flex; gap:7px; margin-bottom:16px;">' + cells + '</div>';
    };

    window.renderPhotoAdd = function (key) {
        var n = window.getLoosePhotos(key).length;
        if (n >= MAX_PER_DAY) return "";
        return '<div onclick="event.stopPropagation(); window.addDayPhoto(\'' + key + '\')" style="margin-top:14px; padding-top:13px; border-top:1px dashed var(--border); font-size:12px; font-weight:700; color:var(--text-sub); cursor:pointer;">' +
            (n ? "사진 한 장 더 담기" : "이 날의 사진 담기") + ' +</div>';
    };

    /* ---------- 첫 순간 옆의 작은 사진 ----------
       도감 항목마다 딱 한 장. 없으면 점선 자리가 남아
       "여기 아직 비었다"고 말해준다. -------- */

    window.renderMilestonePhoto = function (key, msId) {
        if (!msId) return "";
        var found = window.getMilestonePhoto(msId);
        var tap = 'onclick="event.stopPropagation(); window.addMilestonePhoto(\'' + key + '\',\'' + msId + '\')"';

        if (found) {
            return '<div ' + tap + ' style="width:62px; height:62px; border-radius:13px; overflow:hidden; flex-shrink:0; cursor:pointer; background:var(--bg-sub);">' +
                '<img src="' + esc(found.photo.url) + '" loading="lazy" alt="" style="width:100%; height:100%; object-fit:cover; display:block;">' +
            '</div>';
        }

        return '<div ' + tap + ' style="width:62px; height:62px; border-radius:13px; flex-shrink:0; cursor:pointer; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center;">' +
            '<span style="font-size:18px; font-weight:300; color:var(--text-sub); line-height:1;">+</span>' +
        '</div>';
    };

    /* ---------- 사진 보기 ---------- */

    var vList = [], vIdx = 0, vKey = null;

    function openViewer(list, idx, key) {
        if (!list || !list.length) return;
        vList = list;
        vIdx = Math.max(0, Math.min(idx || 0, list.length - 1));
        vKey = key;
        drawViewer();
        document.body.style.overflow = "hidden";
    }

    window.openLoosePhoto = function (key, idx) {
        openViewer(window.getLoosePhotos(key), idx, key);
    };

    // 예전 이름도 살려둔다
    window.openPhotoViewer = window.openLoosePhoto;

    window.closePhotoViewer = function () {
        var w = document.getElementById("mb-photo-viewer");
        if (w) w.remove();
        document.body.style.overflow = "";
        vList = []; vKey = null;
    };

    window.photoStep = function (delta) {
        var next = vIdx + delta;
        if (next < 0 || next >= vList.length) return;
        vIdx = next;
        drawViewer();
    };

    window.savePhotoCaption = function () {
        var el = document.getElementById("mb-caption-input");
        var p = vList[vIdx];
        if (!el || !p) return;
        setCaption(vKey, p.id, el.value.trim());
        p.caption = el.value.trim();
        window.syncPhotosToFirebase();
        drawViewer();
        repaint();
        toast("적어두었어요");
    };

    window.removePhoto = function () {
        var p = vList[vIdx];
        if (!p) return;

        var go = function () {
            if (window.deleteObject && window.storage && window.storageRef && p.path) {
                try { window.deleteObject(window.storageRef(window.storage, p.path)); } catch (e) {}
            }
            if (window.dropCachedPhotoData) window.dropCachedPhotoData(p.id);
            dropPhoto(vKey, p.id);
            window.syncPhotosToFirebase();
            vList = vList.filter(function (x) { return x.id !== p.id; });
            if (!vList.length) window.closePhotoViewer();
            else { vIdx = Math.min(vIdx, vList.length - 1); drawViewer(); }
            repaint();
        };

        if (typeof window.showConfirm === "function") {
            window.showConfirm("이 사진을 배냇함에서 빼낼까요?\n되돌릴 수 없어요.", go, "🧺", "빼내기", "#F04452");
        } else if (confirm("이 사진을 배냇함에서 빼낼까요?")) { go(); }
    };

    function drawViewer() {
        var p = vList[vIdx];
        if (!p) return;

        var w = document.getElementById("mb-photo-viewer");
        if (!w) {
            w = document.createElement("div");
            w.id = "mb-photo-viewer";
            document.body.appendChild(w);
        }
        w.setAttribute("style", "position:fixed; inset:0; z-index:100000; background:#191512; overflow-y:auto; -webkit-overflow-scrolling:touch;");
        w.onclick = function (e) { if (e.target === w) window.closePhotoViewer(); };

        var msTitle = p.msId ? milestoneTitle(p.msId) : "";
        var dday = ddayOf(vKey);
        var pager = vList.length > 1
            ? '<div style="display:flex; justify-content:center; align-items:center; gap:18px; margin-top:16px;">' +
                '<div onclick="window.photoStep(-1)" style="font-size:20px; color:' + (vIdx > 0 ? "#FFF" : "#4A3F36") + '; cursor:pointer; padding:4px 12px;">‹</div>' +
                '<div style="font-size:12px; font-weight:700; color:#A3958A;">' + (vIdx + 1) + ' / ' + vList.length + '</div>' +
                '<div onclick="window.photoStep(1)" style="font-size:20px; color:' + (vIdx < vList.length - 1 ? "#FFF" : "#4A3F36") + '; cursor:pointer; padding:4px 12px;">›</div>' +
              '</div>'
            : '';

        w.innerHTML =
        '<div style="max-width:520px; margin:0 auto; padding:0 18px 50px;">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; padding:20px 2px 16px;">' +
                '<div>' +
                    (msTitle ? '<div style="font-size:10px; font-weight:800; color:#B3ABF0; letter-spacing:2px; margin-bottom:7px;">처음 해낸 일</div>' : '') +
                    '<div style="font-family:\'Nanum Myeongjo\',serif; font-size:19px; font-weight:700; color:#FFF;">' + esc(msTitle || prettyKey(vKey)) + '</div>' +
                    '<div style="font-size:12px; font-weight:600; color:#A3958A; margin-top:5px;">' +
                        (msTitle ? esc(prettyKey(vKey)) + "  ·  " : "") + esc(babyName()) + (dday ? " · " + esc(dday) : "") +
                    '</div>' +
                '</div>' +
                '<div onclick="window.closePhotoViewer()" style="font-size:24px; font-weight:300; color:#A3958A; cursor:pointer; padding:0 6px; line-height:1;">×</div>' +
            '</div>' +

            '<img src="' + esc(p.url) + '" alt="" style="width:100%; border-radius:18px; display:block; background:#241E19;">' +
            pager +

            '<div style="margin-top:24px;">' +
                '<div style="font-size:10.5px; font-weight:800; color:#8A7C71; letter-spacing:2px; margin-bottom:10px;">이 날의 한 줄</div>' +
                '<textarea id="mb-caption-input" rows="3" placeholder="나중에 다시 읽을 한 줄을 남겨두세요" style="width:100%; box-sizing:border-box; padding:15px; border-radius:14px; border:1px solid #362C24; background:#231D18; color:#EDE7E1; font-family:\'Nanum Pen Script\',cursive; font-size:20px; line-height:1.6; outline:none; resize:none;">' + esc(p.caption || "") + '</textarea>' +
                '<div style="display:flex; gap:9px; margin-top:11px;">' +
                    '<div onclick="window.savePhotoCaption()" style="flex:1; text-align:center; padding:14px; background:#7F77DD; color:#FFF; border-radius:13px; font-size:14px; font-weight:800; cursor:pointer;">적어두기</div>' +
                    (typeof window.downloadPhotoCard === "function"
                        ? '<div onclick="window.downloadPhotoCard(\'' + vKey + '\',\'' + p.id + '\')" style="padding:14px 20px; background:#332B24; color:#EDE7E1; border-radius:13px; font-size:14px; font-weight:700; cursor:pointer; white-space:nowrap;">엽서로 저장</div>'
                        : '') +
                '</div>' +
                '<div onclick="window.removePhoto()" style="text-align:center; margin-top:16px; font-size:12.5px; font-weight:700; color:#8A7C71; cursor:pointer;">배냇함에서 빼내기</div>' +
            '</div>' +
        '</div>';
    }

    /* ---------- 손글씨 폰트 ---------- */

    (function ensureFont() {
        if (document.getElementById("mb-pen-font")) return;
        var link = document.createElement("link");
        link.id = "mb-pen-font";
        link.rel = "stylesheet";
        link.href = "https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap";
        document.head.appendChild(link);
    })();

    /* ---------- 시작 ---------- */

    function boot() {
        fileInput();
        window.startPhotoRealtimeSync();
        setTimeout(window.flushUploads, 3000);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.photoDebug = function () {
        console.log("사진 담긴 날:", window.photoDays().length + "일");
        console.log("총 장수:", window.photoCount());
        console.log("첫 순간에 붙은 사진:", window.milestonePhotoCount() + "개");
        console.log("동기화 코드:", syncCode() || "없음 (이 기기에만 저장됨)");
        return loadIndex();
    };
})();