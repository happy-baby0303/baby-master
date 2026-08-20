const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

// 💛 1. 카카오 로그인 우회 서버 (기존 유지)
exports.kakaoCustomAuth = functions.https.onCall(async (data, context) => {
    const token = data.token;
    
    if (!token) {
        throw new functions.https.HttpsError('invalid-argument', '카카오 토큰이 전달되지 않았습니다.');
    }

    try {
        const kakaoResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const kakaoUser = kakaoResponse.data;
        const uid = `kakao:${kakaoUser.id}`; 

        const firebaseToken = await admin.auth().createCustomToken(uid);

        return { customToken: firebaseToken };
        
    } catch (error) {
        console.error("Kakao Auth Error:", error);
        throw new functions.https.HttpsError('internal', '카카오 로그인 처리 중 서버 에러가 발생했습니다.');
    }
});

// 🔔 2. [신규 추가됨] 가족에게 푸시 알림을 쏴주는 우체부 서버
exports.sendFamilyPush = functions.region("asia-northeast3").https.onCall(async (data, context) => {
    // 1. 누가 보냈는지 확인
    if (!context.auth) return { success: false, error: "로그인이 필요합니다." };

    const senderUid = context.auth.uid;
    const { syncCode, title, body } = data;

    if (!syncCode) return { success: false, error: "가족 코드가 없습니다." };

    try {
        // 2. 가족 방(families)에서 나를 제외한 다른 멤버들 찾기
        const familyDoc = await admin.firestore().collection("families").doc(syncCode).get();
        if (!familyDoc.exists) return { success: false, error: "가족방이 없습니다." };

        const members = familyDoc.data().members || [];
        const targetUids = members.filter(uid => uid !== senderUid); // 나(보낸 사람) 제외
        
        if (targetUids.length === 0) return { success: false, error: "알림을 보낼 가족이 없습니다." };

        // 3. 다른 가족들의 푸시 토큰(주소록) 가져오기
        const usersSnap = await admin.firestore().collection("users").where("firebase_uid", "in", targetUids).get();
        
        const tokens = [];
        usersSnap.forEach(doc => {
            const token = doc.data().fcm_token;
            if (token) tokens.push(token);
        });

        // 4. 토큰(주소)이 있으면 일괄적으로 알림 쏘기!
        if (tokens.length > 0) {
            const message = {
                notification: { title: title, body: body },
                tokens: tokens
            };
            
            // 최신 파이어베이스 문법과 구버전 문법 모두 호환되도록 안전장치 적용
            try {
                await admin.messaging().sendEachForMulticast(message);
            } catch (e) {
                await admin.messaging().sendMulticast(message);
            }
            return { success: true, message: "푸시 발송 성공!" };
        } else {
            return { success: false, error: "상대방의 푸시 알림이 꺼져있거나 토큰이 없습니다." };
        }
    } catch (error) {
        console.error("푸시 에러:", error);
        return { success: false, error: error.message };
    }
});

// 🧹 3. [신규 추가] 완벽한 회원 탈퇴 (애플 심사용 청소부)
exports.deleteUserAccount = functions.region("asia-northeast3").https.onCall(async (data, context) => {
    // 1. 로그인된 유저인지 확인
    if (!context.auth) return { success: false, error: "권한이 없습니다." };
    
    const uid = context.auth.uid;
    const kakaoId = data.kakaoId;

    try {
        // 2. users 명부에서 내 정보 삭제
        if (kakaoId) {
            await admin.firestore().collection("users").doc(String(kakaoId)).delete();
        }

        // 3. 파이어베이스 Auth(인증) 시스템에서 계정 영구 삭제
        await admin.auth().deleteUser(uid);
        
        return { success: true, message: "계정이 완벽하게 삭제되었습니다." };
    } catch (error) {
        console.error("회원 탈퇴 에러:", error);
        return { success: false, error: error.message };
    }
});