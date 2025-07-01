const firebaseConfig = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.firebasestorage.app",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8",
  measurementId: "G-MW8CBHGSLG"
};

async function initializeFirebase() {
  try {
    const [
      { initializeApp },
      { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp },
      { getStorage, ref, uploadBytes, getDownloadURL }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/9.22.1/firebase-storage.js")
    ]);

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const storage = getStorage(app);

    return { db, storage, collection, query, where, getDocs, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL };
  } catch (error) {
    console.error('Firebase 초기화 실패:', error);
    throw error;
  }
}

let firebaseApp = null;

window.loadBookings = async (date = null) => {
  if (!firebaseApp) {
    firebaseApp = await initializeFirebase();
  }
  
  const { db, collection, query, where, getDocs } = firebaseApp;
  const q = date
    ? query(collection(db, "bookings"), where("date", "==", date))
    : query(collection(db, "bookings"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.addBooking = async (data) => {
  if (!firebaseApp) {
    firebaseApp = await initializeFirebase();
  }
  
  const { db, collection, addDoc, serverTimestamp } = firebaseApp;
  return await addDoc(collection(db, "bookings"), {
    ...data,
    createdAt: serverTimestamp()
  });
};

window.loadGalleryImages = async () => {
  if (!firebaseApp) {
    firebaseApp = await initializeFirebase();
  }
  
  const { db, collection, getDocs } = firebaseApp;
  const snap = await getDocs(collection(db, "gallery"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

window.uploadGalleryImage = async (file) => {
  if (!firebaseApp) {
    firebaseApp = await initializeFirebase();
  }
  
  const { db, storage, collection, addDoc, serverTimestamp, ref, uploadBytes, getDownloadURL } = firebaseApp;
  const imgRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
  await uploadBytes(imgRef, file);
  const url = await getDownloadURL(imgRef);
  await addDoc(collection(db, "gallery"), {
    imageUrl: url,
    createdAt: serverTimestamp()
  });
  return url;
};

window.showNotification = function(message, type = 'success') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '10px',
    color: 'white',
    fontWeight: '600',
    zIndex: '10001',
    fontSize: '0.9rem',
    maxWidth: '300px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    cursor: 'pointer'
  });

  if (type === 'success') {
    notification.style.background = '#10b981';
  } else if (type === 'error') {
    notification.style.background = '#ef4444';
  } else if (type === 'warning') {
    notification.style.background = '#f59e0b';
  } else {
    notification.style.background = '#3b82f6';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
  
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.remove();
    }
  });
};

console.log('✅ Firebase 헬퍼 로드 완료');