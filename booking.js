import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore, collection, query,
  where, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const cfg = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail"
};

const app = initializeApp(cfg);
const db  = getFirestore(app);

window.loadBookings = async (date = null) => {
  const q = date
    ? query(collection(db,"bookings"), where("date","==",date))
    : query(collection(db,"bookings"));
  const snap = await getDocs(q);
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
};

window.addBooking = data => addDoc(collection(db,"bookings"), data);

console.log("✅ booking helper ready");
