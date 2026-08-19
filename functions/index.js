const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

admin.initializeApp();

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