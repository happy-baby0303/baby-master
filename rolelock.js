/* ============================================================
   배냇함 — 역할 자물쇠 (rolelock.js)

   화면에서 가리는 건 잠금이 아니다.
   시터가 설정 탭에서 '엄마'를 누르면 그만이었다.
   그러면 가계부도 문답도 다 보인다. 돈 받고 파는 기능인데.

   진짜 자물쇠는 서버에 있어야 한다.
   families/{코드}.members[내uid] 가 유일한 진실이다.

   하는 일 셋
     1. 앱을 켤 때마다 서버에 내 역할을 다시 묻는다
     2. viewer 면 기기에 자물쇠를 채운다 (앱 데이터를 지워도 다시 채워진다)
     3. 서버에서 역할이 바뀌면 즉시 따라간다 (부모가 권한을 회수할 수 있다)

   ⚠️ 이건 1차 방어선이다.
      진짜 방어는 보안 규칙이 시터에게 데이터를 안 내려주는 것이다.
      화면 잠금은 실수를 막고, 보안 규칙은 고의를 막는다.

   index.html 에서 script.js 다음에 로드하세요.
   ============================================================ */
(function () {
    'use strict';

    var LOCK = "tosil_role_locked";

    function syncCode() { return localStorage.getItem("family_sync_code"); }

    function myUid() {
        return (window.auth && window.auth.currentUser && window.auth.currentUser.uid) ||
               localStorage.getItem("firebase_uid") || "";
    }

    /* ---------- 서버가 정한 역할 ---------- */

    function applyRole(serverRole) {
        if (!serverRole) return;

        if (serverRole === "viewer") {
            localStorage.setItem(LOCK, "viewer");

            // 다른 모드로 켜져 있으면 즉시 되돌린다
            if (localStorage.getItem("user_role") !== "senior") {
                localStorage.setItem("user_role", "senior");
                document.body.classList.remove("mode-dad");
                document.body.classList.add("mode-senior");
                if (typeof window.renderSettingsTab === "function") window.renderSettingsTab();
                if (typeof window.showToast === "function") {
                    window.showToast("돌봄 도우미 모드로 연결되어 있어요");
                }
            }
        } else {
            // 부모가 권한을 올려줬으면 자물쇠를 푼다
            if (localStorage.getItem(LOCK)) {
                localStorage.removeItem(LOCK);
                if (typeof window.showToast === "function") {
                    window.showToast("가족 권한이 열렸어요");
                }
                if (typeof window.renderSettingsTab === "function") window.renderSettingsTab();
            }
        }
    }

    /* ---------- 켤 때 한 번 물어본다 ---------- */

    window.verifyMyRole = async function () {
        var code = syncCode(), uid = myUid();
        if (!code || !uid) return null;
        if (!window.db || typeof window.getDoc !== "function") return null;

        try {
            var snap = await window.getDoc(window.doc(window.db, "families", code));
            if (!snap.exists()) return null;

            var m = (snap.data() || {}).members;
            if (!m) return null;

            // 옛 구조(배열)면 아직 이전 전이다. 건드리지 않는다.
            if (Array.isArray(m)) return null;

            var role = m[uid] || null;
            applyRole(role);
            return role;
        } catch (e) {
            console.warn("[역할] 확인 실패", e);
            return null;
        }
    };

    /* ---------- 서버에서 바뀌면 따라간다 ----------
       부모가 시터 권한을 회수하면 그 폰에서 바로 반영된다. -------- */

    var unsub = null;

    window.watchMyRole = function () {
        var code = syncCode(), uid = myUid();
        if (!code || !uid) return;
        if (!window.db || typeof window.onSnapshot !== "function") return;
        if (unsub) { try { unsub(); } catch (e) {} unsub = null; }

        var u = window.onSnapshot(window.doc(window.db, "families", code), function (snap) {
            if (!snap.exists()) return;
            var m = (snap.data() || {}).members;
            if (!m || Array.isArray(m)) return;
            applyRole(m[uid] || null);
        }, function (e) {
            console.warn("[역할] 실시간 확인 에러", e);
        });

        unsub = (typeof window.addLiveListener === "function") ? window.addLiveListener(u) : u;
    };

    /* ---------- 도우미 ---------- */

    window.isViewerLocked = function () {
        return localStorage.getItem(LOCK) === "viewer";
    };

    /* ---------- 시작 ---------- */

    function boot() {
        setTimeout(function () {
            window.verifyMyRole();
            window.watchMyRole();
        }, 3000);

        // 앱으로 돌아올 때마다 다시 확인한다
        document.addEventListener("visibilitychange", function () {
            if (!document.hidden) setTimeout(window.verifyMyRole, 500);
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
    else boot();

    /* ---------- 점검용 ---------- */
    window.roleDebug = async function () {
        console.log("가족 코드:", syncCode() || "없음");
        console.log("내 uid:", myUid() || "없음");
        console.log("기기의 역할:", localStorage.getItem("user_role") || "없음");
        console.log("자물쇠:", localStorage.getItem(LOCK) || "없음");
        var r = await window.verifyMyRole();
        console.log("서버가 정한 역할:", r === null ? "확인 실패 또는 옛 구조" : r);
    };
})();