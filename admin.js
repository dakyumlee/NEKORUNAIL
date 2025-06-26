import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import { getStorage, ref, deleteObject, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.appspot.com",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function loadCollection(colName, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  try {
    const snapshot = await getDocs(collection(db, colName));
    if (snapshot.empty) {
      container.innerHTML = "<p>데이터가 없습니다.</p>";
      return;
    }

    const frag = document.createDocumentFragment();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const id = docSnap.id;
      const div = document.createElement("div");
      div.className = "admin-card";

      if (colName === "gallery") {
        const url = await getDownloadURL(ref(storage, data.url));
        div.innerHTML = `
          <img src="${url}" alt="갤러리 이미지" />
          <p>${data.description || ""}</p>
          <button onclick="deleteGallery('${id}', '${data.url}')">삭제</button>
        `;
      } else if (colName === "reviews") {
        let imgHTML = "";
        if (data.imagePath) {
          try {
            const imgUrl = await getDownloadURL(ref(storage, data.imagePath));
            imgHTML = `<img src="${imgUrl}" alt="리뷰 이미지" />`;
          } catch {}
        }
        div.innerHTML = `
          <h3>${data.name || "익명"}</h3>
          <p>${data.content || ""}</p>
          ${imgHTML}
          <button onclick="deleteReview('${id}', '${data.imagePath || ""}')">삭제</button>
        `;
      } else if (colName === "bookings") {
        div.innerHTML = `
          <h3>${data.name}</h3>
          <p>${data.date} ${data.time}</p>
          <p>${data.phone}</p>
          <p>${(data.services || []).join(", ")}</p>
          <p>${data.notes}</p>
          <p>상태: ${data.status}</p>
          <button onclick="deleteBooking('${id}')">삭제</button>
        `;
      }

      frag.appendChild(div);
    }

    container.appendChild(frag);
  } catch (err) {
    console.error(`"${colName}" 불러오기 실패:`, err);
    container.innerHTML = `<p>${colName} 불러오기 실패</p>`;
  }
}

window.deleteGallery = async (id, path) => {
  try {
    await deleteDoc(doc(db, "gallery", id));
    await deleteObject(ref(storage, path));
    alert("삭제 완료");
    loadCollection("gallery", "gallery-list");
  } catch (err) {
    alert("삭제 실패: " + err.message);
  }
};

window.deleteReview = async (id, imagePath) => {
  try {
    await deleteDoc(doc(db, "reviews", id));
    if (imagePath) await deleteObject(ref(storage, imagePath));
    alert("삭제 완료");
    loadCollection("reviews", "review-list");
  } catch (err) {
    alert("삭제 실패: " + err.message);
  }
};

window.deleteBooking = async (id) => {
  try {
    await deleteDoc(doc(db, "bookings", id));
    alert("삭제 완료");
    loadCollection("bookings", "booking-list");
  } catch (err) {
    alert("삭제 실패: " + err.message);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  loadCollection("gallery", "gallery-list");
  loadCollection("reviews", "review-list");
  loadCollection("bookings", "booking-list");
});
