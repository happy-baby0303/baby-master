/**
 * 육아메이트 Cloud Functions — 전체 2세대(v2) 통일본
 * ------------------------------------------------------------------
 * ⚠️ 왜 또 바꾸나요?
 * 한 파일에 1세대(v1)와 2세대(v2)를 섞어 쓰면 Firebase CLI가
 * "Cannot set CPU on the functions ... because they are GCF gen 1"
 * 에러를 냅니다. (firebase-tools의 오래된 알려진 버그)
 *
 * ✅ 해결: 세 함수 모두 2세대(onCall)로 통일 → 섞임 자체를 없앰
 *
 * 📍 리전 배치
 *  - kakaoCustomAuth  : us-central1  (앱 코드를 안 바꿔도 되도록 기존 위치 유지)
 *  - sendFamilyPush   : asia-northeast3 (서울)
 *  - deleteUserAccount: asia-northeast3 (서울)
 * ------------------------------------------------------------------
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// 서울 리전 옵션 (푸시 / 탈퇴)
const SEOUL = { region: "asia-northeast3", maxInstances: 10 };
// 리전 미지정 = us-central1 (카카오 로그인 — 앱의 getFunctions(app)와 짝이 맞음)
const US = { maxInstances: 10 };

/* ==================================================================
 * 💛 1. 카카오 로그인 우회 서버 (2세대 / us-central1)
 * ================================================================== */
exports.kakaoCustomAuth = onCall(US, async (request) => {
  const token = request.data && request.data.token;

  if (!token) {
    throw new HttpsError("invalid-argument", "카카오 토큰이 전달되지 않았습니다.");
  }

  try {
    const kakaoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const kakaoUser = kakaoResponse.data;
    const uid = `kakao:${kakaoUser.id}`;

    const firebaseToken = await admin.auth().createCustomToken(uid);
    return { customToken: firebaseToken };
  } catch (error) {
    logger.error("카카오 로그인 에러", error);
    throw new HttpsError("internal", "카카오 로그인 처리 중 서버 에러가 발생했습니다.");
  }
});

/* ==================================================================
 * 🔔 2. 가족에게 푸시 알림 보내기 (2세대 / 서울)
 * ================================================================== */
exports.sendFamilyPush = onCall(SEOUL, async (request) => {
  // ⚠️ 2세대는 (data, context) 가 아니라 request 하나만 받습니다.
  //    data → request.data / context.auth → request.auth
  const senderUid = request.auth && request.auth.uid;
  if (!senderUid) return { success: false, error: "로그인이 필요합니다." };

  const { syncCode, title, body } = request.data || {};
  if (!syncCode) return { success: false, error: "가족 코드가 없습니다." };

  try {
    const db = admin.firestore();

    // 1) 가족방에서 나를 제외한 멤버 찾기
    const familyDoc = await db.collection("families").doc(String(syncCode)).get();
    if (!familyDoc.exists) return { success: false, error: "가족방이 없습니다." };

    const members = familyDoc.data().members || [];
    const targetUids = members.filter((uid) => uid !== senderUid);
    if (targetUids.length === 0) {
      return { success: false, error: "알림을 보낼 가족이 없습니다." };
    }

    // 2) 상대방의 푸시 토큰 수집 (in 쿼리 제한 → 10개씩 잘라서 조회)
    const tokenMap = new Map(); // token → 저장된 문서 ID (실패 시 정리용)
    for (let i = 0; i < targetUids.length; i += 10) {
      const chunk = targetUids.slice(i, i + 10);
      const snap = await db
        .collection("users")
        .where("firebase_uid", "in", chunk)
        .get();
      snap.forEach((doc) => {
        const t = doc.data().fcm_token;
        if (t) tokenMap.set(t, doc.id);
      });
    }

    const tokens = [...tokenMap.keys()];
    if (tokens.length === 0) {
      logger.warn("푸시 토큰 없음", { syncCode, targetUids });
      return {
        success: false,
        error: "상대방이 알림 허용을 안 했거나 토큰이 저장되지 않았습니다.",
      };
    }

    // 3) 발송
    const response = await admin.messaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        notification: {
          title,
          body,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
        },
      },
      android: { priority: "high" },
      apns: { payload: { aps: { sound: "default" } } },
    });

    // 4) 죽은 토큰 정리 (앱 삭제 / 브라우저 초기화된 주소 제거)
    const deadTokens = [];
    response.responses.forEach((r, idx) => {
      if (r.success) return;
      const code = r.error && r.error.code;
      logger.warn("푸시 개별 실패", { code, message: r.error && r.error.message });
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token" ||
        code === "messaging/invalid-argument"
      ) {
        deadTokens.push(tokens[idx]);
      }
    });

    await Promise.all(
      deadTokens.map((t) =>
        db
          .collection("users")
          .doc(tokenMap.get(t))
          .update({ fcm_token: admin.firestore.FieldValue.delete() })
          .catch(() => {})
      )
    );

    logger.info("푸시 발송 결과", {
      total: tokens.length,
      success: response.successCount,
      fail: response.failureCount,
    });

    // 실제로 성공한 게 있을 때만 success: true
    return {
      success: response.successCount > 0,
      sent: response.successCount,
      failed: response.failureCount,
    };
  } catch (error) {
    logger.error("푸시 에러", error);
    return { success: false, error: error.message };
  }
});

/* ==================================================================
 * 🧹 3. 회원 탈퇴 (2세대 / 서울) — 애플 심사 대응
 * ================================================================== */
exports.deleteUserAccount = onCall(SEOUL, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) return { success: false, error: "권한이 없습니다." };

  const kakaoId = request.data && request.data.kakaoId;

  try {
    // users 명부에서 삭제 (문서 ID가 kakaoId 인 구조)
    if (kakaoId) {
      await admin.firestore().collection("users").doc(String(kakaoId)).delete();
    }
    // 문서 ID 규칙이 달랐을 경우를 대비해 uid 기준으로도 한 번 더 정리
    const bySnap = await admin
      .firestore()
      .collection("users")
      .where("firebase_uid", "==", uid)
      .get();
    await Promise.all(bySnap.docs.map((d) => d.ref.delete().catch(() => {})));

    // 인증 계정 영구 삭제
    await admin.auth().deleteUser(uid);

    return { success: true, message: "계정이 완벽하게 삭제되었습니다." };
  } catch (error) {
    logger.error("회원 탈퇴 에러", error);
    return { success: false, error: error.message };
  }
});