import { db, storage } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

document.addEventListener("DOMContentLoaded", async () => {
  const uploadForm = document.getElementById("upload-form");
  const fileInput = document.getElementById("file-input");
  const captionInput = document.getElementById("caption-input");
  const gallery = document.getElementById("user-gallery");

  async function loadGallery() {
    gallery.innerHTML = "";
    const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
      const data = doc.data();
      const card = document.createElement("div");
      card.className = "gallery-card";
      card.innerHTML = `
        <img src="${data.imageUrl}" alt="user image">
        <div class="info">
          <h4>${data.caption || "무제"}</h4>
        </div>
      `;
      gallery.appendChild(card);
    });
  }

  await loadGallery();

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = fileInput.files[0];
    const caption = captionInput.value;

    if (!file) return alert("파일을 선택해주세요!");

    try {
      const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "gallery"), {
        imageUrl: url,
        caption,
        createdAt: Date.now()
      });

      uploadForm.reset();
      await loadGallery();
    } catch (err) {
      console.error("업로드 실패:", err);
      alert("업로드 중 오류가 발생했습니다.");
    }
  });
});
