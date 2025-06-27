import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js";

const cfg = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.firebasestorage.app"
};

const app     = initializeApp(cfg);
const db      = getFirestore(app);
const storage = getStorage(app);

window.loadGalleryImages = async () => {
  const snap = await getDocs(collection(db,"gallery"));
  return snap.docs.map(d=>({ id:d.id, ...d.data() }));
};

window.uploadGalleryImage = async file => {
  const imgRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);
  await addDoc(collection(db,"gallery"), {
    imageUrl:  url,
    createdAt: serverTimestamp()
  });
  return url;
};

console.log("✅ gallery helper ready");
