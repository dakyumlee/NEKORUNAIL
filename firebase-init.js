import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.appspot.com",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8",
  measurementId: "G-MW8CBHGSLG"
};

const app     = initializeApp(firebaseConfig);
const db      = getFirestore(app);
const storage = getStorage(app);

window.uploadGalleryImage = async (file) => {

  const imgRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);

  await addDoc(collection(db, "gallery"), {
    imageUrl:  url,
    createdAt: serverTimestamp()
  });

  return url;
};

console.log("✅ Firebase 초기화 완료: bookings/gallery/reviews 헬퍼 준비됨");
