import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore, collection, getDocs, addDoc
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const cfg = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail"
};

const app = initializeApp(cfg);
const db  = getFirestore(app);

window.loadReviews = async () => {
  const snap = await getDocs(collection(db,"reviews"));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
};

window.addReview = data => addDoc(collection(db,"reviews"), data);

console.log("✅ review helper ready");
