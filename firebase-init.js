import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc
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
  storageBucket: "nekorunail.firebasestorage.app",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8",
  measurementId: "G-MW8CBHGSLG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

window.loadBookings = async (date = null) => {
  const q = date
    ? query(collection(db, "bookings"), where("date", "==", date))
    : query(collection(db, "bookings"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.addBooking = data => addDoc(collection(db, "bookings"), data);

window.loadGalleryImages = async () => {
  const snap = await getDocs(query(collection(db, "gallery")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.uploadGalleryImage = async file => {
  const imgRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  return getDownloadURL(imgRef);
};

window.loadReviews = async () => {
  const snap = await getDocs(query(collection(db, "reviews")));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.addReview = data => addDoc(collection(db, "reviews"), data);

console.log("✅ Firebase 초기화 완료: bookings/gallery/reviews 헬퍼 준비됨");
