/**
 * 육아메이트 Cloud Functions — 전체 2세대(v2)
 * ------------------------------------------------------------------
 * 📍 리전 배치
 *  - kakaoCustomAuth  : us-central1     (앱의 getFunctions(app) 와 짝)
 *  - sendFamilyPush   : asia-northeast3 (서울)
 *  - deleteUserAccount: asia-northeast3 (서울)  ← 이번에 제대로 다시 씀
 *  - bedtimeReminder  : asia-northeast3 (서울 / 15분마다)
 * ------------------------------------------------------------------
 */

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// 서울 리전 옵션 (푸시 / 탈퇴)
const SEOUL = { region: "asia-northeast3", maxInstances: 10 };
// 리전 미지정 = us-central1 (카카오 로그인 — 앱의 getFunctions(app)와 짝이 맞음)
const US = { maxInstances: 10 };

// 스토리지 버킷 (명시해두면 환경이 바뀌어도 안 흔들린다)
const BUCKET = "happybaby-6de42.firebasestorage.app";

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
  const senderUid = request.auth && request.auth.uid;
  if (!senderUid) return { success: false, error: "로그인이 필요합니다." };

  const { syncCode, title, body } = request.data || {};
  if (!syncCode) return { success: false, error: "가족 코드가 없습니다." };

  try {
    const db = admin.firestore();

    const familyDoc = await db.collection("families").doc(String(syncCode)).get();
    if (!familyDoc.exists) return { success: false, error: "가족방이 없습니다." };

    const members = familyDoc.data().members || [];
    const targetUids = members.filter((uid) => uid !== senderUid);
    if (targetUids.length === 0) {
      return { success: false, error: "알림을 보낼 가족이 없습니다." };
    }

    const tokenMap = new Map();
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
 * 🧹 3. 회원 탈퇴 (2세대 / 서울)
 *
 *    예전 버전은 users 문서와 인증 계정만 지웠다.
 *    사진·소리·편지·기록은 파이어베이스에 그대로 남아 있었다.
 *    "계정을 지웠는데 아기 사진이 서버에 남아 있다" 는 건
 *    스토어 정책 위반이기도 하고, 무엇보다 약속을 어기는 일이다.
 *
 *    규칙은 단순하다.
 *      · 내가 그 방의 마지막 사람이면  → 방을 통째로 정리한다
 *      · 짝꿍이 남아 있으면            → 나만 빠진다 (짝꿍의 배냇함은 지킨다)
 *      · 내가 올린 파일                → 남겨둘 사람이 없으면 전부 삭제
 *                                        (있으면 사용자가 고른 대로)
 * ================================================================== */

// 가족코드마다 컬렉션이 따로 생기는 구조라 접두어를 모아둔다.
// 새 모듈을 만들면 여기에 한 줄 추가할 것.
const FAMILY_PREFIXES = [
  "tracker", "fever", "growth", "cube", "ledger", "routine", "settings",
  "nightduty", "baton", "photos", "voices", "sealed", "words", "notes",
  "parentNotice", "diary",
];

// 다둥이는 photos_TS-XXXX_2 처럼 뒤에 번호가 붙는다
const BABY_SUFFIXES = ["", "_2", "_3", "_4"];

// 내가 올린 파일이 사는 곳 (전부 uid 로 나뉘어 있다)
const STORAGE_ROOTS = ["memories", "voices", "profiles", "mamsuda"];

async function purgeFamilyData(db, code) {
  for (const prefix of FAMILY_PREFIXES) {
    for (const suffix of BABY_SUFFIXES) {
      const name = `${prefix}_${code}${suffix}`;
      try {
        await db.recursiveDelete(db.collection(name));
      } catch (e) {
        logger.warn("컬렉션 정리 실패", { name, message: e.message });
      }
    }
  }
  await db.collection("reminders").doc(code).delete().catch(() => {});
  await db.collection("families").doc(code).delete().catch(() => {});
}

async function purgeMyStorage(uid) {
  const bucket = admin.storage().bucket(BUCKET);
  for (const root of STORAGE_ROOTS) {
    try {
      await bucket.deleteFiles({ prefix: `${root}/${uid}/`, force: true });
    } catch (e) {
      logger.warn("파일 정리 실패", { root, message: e.message });
    }
  }
}

async function purgeMyPosts(db, uid) {
  const cols = ["community", "community_posts", "community_comments"];
  const fields = ["firebase_uid", "uid", "authorId"];
  for (const col of cols) {
    for (const field of fields) {
      try {
        const snap = await db.collection(col).where(field, "==", uid).get();
        await Promise.all(snap.docs.map((d) => d.ref.delete().catch(() => {})));
      } catch (e) { /* 인덱스 없거나 컬렉션 없음 — 넘어간다 */ }
    }
  }
}

exports.deleteUserAccount = onCall(SEOUL, async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) return { success: false, error: "권한이 없습니다." };

  const kakaoId = request.data && request.data.kakaoId;
  // 짝꿍이 남아 있어도 내가 올린 사진·소리까지 지울지 (앱에서 물어본다)
  const alsoPurgeUploads = !!(request.data && request.data.purgeUploads);

  const db = admin.firestore();
  const report = { rooms: 0, purged: 0, left: 0 };

  try {
    /* 1) 내가 속한 가족방 처리 */
    const fams = await db
      .collection("families")
      .where("members", "array-contains", uid)
      .get();
    report.rooms = fams.size;

    for (const fam of fams.docs) {
      const members = fam.data().members || [];
      if (members.length <= 1) {
        await purgeFamilyData(db, fam.id);      // 마지막 사람 → 방 정리
        report.purged++;
      } else {
        await fam.ref.update({                  // 짝꿍 있음 → 나만 빠짐
          members: admin.firestore.FieldValue.arrayRemove(uid),
        });
        report.left++;
      }
    }

    /* 2) 내 명부와 신청 기록 */
    if (kakaoId) {
      await db.collection("users").doc(String(kakaoId)).delete().catch(() => {});
    }
    const mine = await db.collection("users").where("firebase_uid", "==", uid).get();
    await Promise.all(mine.docs.map((d) => d.ref.delete().catch(() => {})));

    await db.collection("waitlist").doc(uid).delete().catch(() => {});
    await db.collection("waitlist_premium").doc(uid).delete().catch(() => {});
    await db.collection("kakao_users").doc(uid).delete().catch(() => {});

    /* 3) 맘수다에 쓴 글과 댓글 */
    await purgeMyPosts(db, uid);

    /* 4) 내가 올린 파일
          남겨둘 사람이 아무도 없으면 전부 삭제.
          짝꿍이 남아 있으면 사용자가 고른 대로. */
    if (report.left === 0 || alsoPurgeUploads) {
      await purgeMyStorage(uid);
      report.filesDeleted = true;
    } else {
      report.filesDeleted = false;
    }

    /* 5) 인증 계정 */
    await admin.auth().deleteUser(uid);

    logger.info("회원 탈퇴 완료", Object.assign({ uid }, report));
    return Object.assign(
      { success: true, message: "계정과 데이터가 삭제되었습니다." },
      report
    );
  } catch (error) {
    logger.error("회원 탈퇴 에러", error);
    return { success: false, error: error.message };
  }
});

/* ==================================================================
 * 🌙 4. 육퇴 알림 (2세대 / 서울 / 15분마다)
 *
 *    대형 앱은 저녁 8시에 전체 사용자에게 똑같이 쏜다.
 *    그 집 아이가 아직 안 잤으면 그건 알림이 아니라 방해다.
 *
 *    우리는 bedtime.js 가 배운 그 집 육퇴 시각에만 보낸다.
 *    그리고 오늘 사진을 이미 담았으면 안 보낸다.
 * ================================================================== */
exports.bedtimeReminder = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Seoul",
    region: "asia-northeast3",
    maxInstances: 2,
  },
  async () => {
    const db = admin.firestore();
    const pad = (n) => String(n).padStart(2, "0");

    const kst = new Date(Date.now() + 9 * 3600 * 1000);
    const today =
      kst.getUTCFullYear() + "-" + pad(kst.getUTCMonth() + 1) + "-" + pad(kst.getUTCDate());
    const bucket =
      pad(kst.getUTCHours()) + ":" + pad(Math.floor(kst.getUTCMinutes() / 15) * 15);

    const snap = await db
      .collection("reminders")
      .where("enabled", "==", true)
      .where("sendBucket", "==", bucket)
      .get();

    if (snap.empty) return;

    let sent = 0;

    for (const docSnap of snap.docs) {
      const code = docSnap.id;
      const d = docSnap.data() || {};

      try {
        if (d.lastSentAt === today) continue;      // 오늘 이미 보냄
        if (d.lastPhotoAt === today) continue;     // 오늘 사진을 담음
        if (d.snoozeUntil && today < d.snoozeUntil) continue;  // 쉬는 중

        const fam = await db.collection("families").doc(code).get();
        if (!fam.exists) continue;
        const members = (fam.data().members || []).slice(0, 10);
        if (!members.length) continue;

        const users = await db
          .collection("users")
          .where("firebase_uid", "in", members)
          .get();

        const tokenMap = new Map();
        users.forEach((u) => {
          const t = u.data().fcm_token;
          if (t) tokenMap.set(t, u.id);
        });
        const tokens = [...tokenMap.keys()];
        if (!tokens.length) continue;

        const name = d.babyName || "우리 아기";
        const title = "육퇴하셨네요 🌙";
        const body = `오늘 ${name} 사진이 아직 배냇함에 없어요`;

        const res = await admin.messaging().sendEachForMulticast({
          tokens,
          notification: { title, body },
          webpush: {
            notification: {
              title,
              body,
              icon: "/icon-192x192.png",
              badge: "/icon-192x192.png",
              tag: "yukamate-bedtime",
            },
          },
          android: { priority: "normal" },
          apns: { payload: { aps: { sound: "default" } } },
        });

        const dead = [];
        res.responses.forEach((r, i) => {
          if (r.success) return;
          const c = r.error && r.error.code;
          if (
            c === "messaging/registration-token-not-registered" ||
            c === "messaging/invalid-registration-token"
          ) {
            dead.push(tokens[i]);
          }
        });
        await Promise.all(
          dead.map((t) =>
            db
              .collection("users")
              .doc(tokenMap.get(t))
              .update({ fcm_token: admin.firestore.FieldValue.delete() })
              .catch(() => {})
          )
        );

        // 3번 연속 무시하면 일주일 쉰다
        const miss = (Number(d.missStreak) || 0) + 1;
        const update = { lastSentAt: today, missStreak: miss };
        if (miss >= 3) {
          const rest = new Date(kst.getTime() + 7 * 86400000);
          update.snoozeUntil =
            rest.getUTCFullYear() + "-" + pad(rest.getUTCMonth() + 1) + "-" + pad(rest.getUTCDate());
          update.missStreak = 0;
        }
        await docSnap.ref.update(update);

        sent += res.successCount;
      } catch (e) {
        logger.warn("육퇴 알림 개별 실패", { code, message: e.message });
      }
    }

    logger.info("육퇴 알림 발송", { bucket, families: snap.size, sent });
  }
);