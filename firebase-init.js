// Firebase 초기화 (일반 JavaScript 방식)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

console.log('✅ Firebase 초기화 완료!');

// 전역 변수로 설정
window.db = db;
window.storage = storage;
