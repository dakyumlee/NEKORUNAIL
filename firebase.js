const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js");
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query, 
  orderBy, 
  limit,
  where,
  serverTimestamp
} = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
const {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js");

const firebaseConfig = {
  apiKey: "AIzaSyBGvgFrFl1DWpkgqbwRo-TUwJa6quvohmA",
  authDomain: "nekorunail.firebaseapp.com",
  projectId: "nekorunail",
  storageBucket: "nekorunail.appspot.com",
  messagingSenderId: "571846382457",
  appId: "1:571846382457:web:6c0f66ca63163473fd15a8",
  measurementId: "G-MW8CBHGSLG"
};

let app, db, storage;
let isInitialized = false;

async function loadFirebaseModules() {
  if (window.firebaseModulesLoaded) return;
  
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js");
  const { 
    getFirestore, 
    collection, 
    getDocs, 
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query, 
    orderBy, 
    limit,
    where,
    serverTimestamp
  } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js");
  const {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
  } = await import("https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js");
  
  window.firebaseModules = {
    initializeApp,
    getFirestore,
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    serverTimestamp,
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
  };
  
  window.firebaseModulesLoaded = true;
}

async function initializeFirebase() {
  if (isInitialized) return { app, db, storage };
  
  try {
    await loadFirebaseModules();
    const { 
      initializeApp, 
      getFirestore, 
      getStorage,
      collection,
      getDocs,
      addDoc,
      deleteDoc,
      doc,
      updateDoc,
      query,
      orderBy,
      limit,
      where,
      serverTimestamp,
      ref,
      uploadBytes,
      getDownloadURL,
      deleteObject
    } = window.firebaseModules;
    
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
    
    window.db = db;
    window.storage = storage;
    window.fbCollection = collection;
    window.fbGetDocs = getDocs;
    window.fbAddDoc = addDoc;
    window.fbDeleteDoc = deleteDoc;
    window.fbDoc = doc;
    window.fbUpdateDoc = updateDoc;
    window.fbQuery = query;
    window.fbOrderBy = orderBy;
    window.fbLimit = limit;
    window.fbWhere = where;
    window.fbServerTimestamp = serverTimestamp;
    window.fbRef = ref;
    window.fbUploadBytes = uploadBytes;
    window.fbGetDownloadURL = getDownloadURL;
    window.fbDeleteObject = deleteObject;
    
    isInitialized = true;
    console.log('✅ Firebase 초기화 완료');
    return { app, db, storage };
    
  } catch (error) {
    console.error('❌ Firebase 초기화 실패:', error);
    throw error;
  }
}

async function loadGalleryData(limitCount = 6) {
  try {
    await initializeFirebase();
    const { collection, query, orderBy, limit, getDocs } = window.firebaseModules;
    const q = query(
      collection(db, "gallery"), 
      orderBy("createdAt", "desc"), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const galleryData = [];
    snapshot.forEach(doc => {
      galleryData.push({ id: doc.id, ...doc.data() });
    });
    return galleryData;
  } catch (error) {
    console.error('갤러리 로드 실패:', error);
    return [];
  }
}

async function loadReviewsData(limitCount = 3) {
  try {
    await initializeFirebase();
    const { collection, query, orderBy, limit, getDocs } = window.firebaseModules;
    const q = query(
      collection(db, "reviews"), 
      orderBy("createdAt", "desc"), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const reviewsData = [];
    snapshot.forEach(doc => {
      reviewsData.push({ id: doc.id, ...doc.data() });
    });
    return reviewsData;
  } catch (error) {
    console.error('리뷰 로드 실패:', error);
    return [];
  }
}

async function loadBookingsData(date = null) {
  try {
    await initializeFirebase();
    const { collection, query, orderBy, where, getDocs } = window.firebaseModules;
    let q;
    if (date) {
      q = query(collection(db, "bookings"), where("date", "==", date));
    } else {
      q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
    }
    const snapshot = await getDocs(q);
    const bookingsData = [];
    snapshot.forEach(doc => {
      bookingsData.push({ id: doc.id, ...doc.data() });
    });
    return bookingsData;
  } catch (error) {
    console.error('예약 로드 실패:', error);
    return [];
  }
}

async function addBookingData(data) {
  try {
    await initializeFirebase();
    const { collection, addDoc, serverTimestamp } = window.firebaseModules;
    const docRef = await addDoc(collection(db, "bookings"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('예약 추가 실패:', error);
    throw error;
  }
}

async function addReviewData(data) {
  try {
    await initializeFirebase();
    const { collection, addDoc, serverTimestamp } = window.firebaseModules;
    const docRef = await addDoc(collection(db, "reviews"), {
      ...data,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('리뷰 추가 실패:', error);
    throw error;
  }
}

async function uploadImage(file, folder = 'uploads') {
  try {
    await initializeFirebase();
    const { ref, uploadBytes, getDownloadURL } = window.firebaseModules;
    const imageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(imageRef);
    return downloadURL;
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    throw error;
  }
}

window.initializeFirebase = initializeFirebase;
window.loadGalleryData = loadGalleryData;
window.loadReviewsData = loadReviewsData;
window.loadBookingsData = loadBookingsData;
window.addBookingData = addBookingData;
window.addReviewData = addReviewData;
window.uploadImage = uploadImage;

window.loadBookings = loadBookingsData;
window.addBooking = addBookingData;
window.loadReviews = loadReviewsData;
window.addReview = addReviewData;
window.loadGalleryImages = loadGalleryData;

document.addEventListener('DOMContentLoaded', function() {
  initializeFirebase().catch(console.error);
});