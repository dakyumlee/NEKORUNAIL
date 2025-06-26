import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.appspot.com",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8",
  measurementId: "G-MW8CBHGSLG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
window.db = db;

window.addOptimizedDocument = async function (col, data) {
  const docRef = await addDoc(collection(db, col), {
    ...data,
    createdAt: new Date()
  });
  return docRef.id;
};

window.loadOptimizedBookings = async function (max, selectedDate) {
  const colRef = collection(db, "bookings");
  const q = query(
    colRef,
    where("date", "==", selectedDate),
    orderBy("time", "asc"),
    limit(max)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
