// booking.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reserve-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value;
    const time = document.getElementById("time").value;

    if (!name || !phone || !date || !time) {
      alert("모든 정보를 입력해주세요.");
      return;
    }

    try {
      const q = query(
        collection(db, "bookings"),
        where("date", "==", date),
        where("time", "==", time)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        alert("⚠️ 해당 날짜와 시간에는 이미 예약이 존재합니다.\n다른 시간대를 선택해주세요.");
        return;
      }

      await addDoc(collection(db, "bookings"), {
        name,
        phone,
        date,
        time,
        createdAt: serverTimestamp()
      });

      alert(`✅ 예약 완료!\n\n👤 ${name}\n📞 ${phone}\n📅 ${date} ${time}`);
      form.reset();
    } catch (err) {
      console.error("예약 실패:", err);
      alert("예약 처리 중 오류가 발생했습니다.");
    }
  });
});
