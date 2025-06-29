let isLoggedIn = false;
let firebaseLoaded = false;
let db, storage;
let dataCache = {
  bookings: { data: null, timestamp: 0 },
  gallery: { data: null, timestamp: 0 },
  reviews: { data: null, timestamp: 0 }
};
const CACHE_DURATION = 2 * 60 * 1000;

document.addEventListener('DOMContentLoaded', function() {
  initializeAdmin();
});

async function loadFirebase() {
  if (firebaseLoaded) return;

  try {
    const [
      { initializeApp },
      { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, orderBy, serverTimestamp, where },
      { getStorage, ref, uploadBytes, getDownloadURL, deleteObject }
    ] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js")
    ]);

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
    db = getFirestore(app);
    storage = getStorage(app);

    window.fbCollection = collection;
    window.fbAddDoc = addDoc;
    window.fbGetDocs = getDocs;
    window.fbDeleteDoc = deleteDoc;
    window.fbDoc = doc;
    window.fbUpdateDoc = updateDoc;
    window.fbQuery = query;
    window.fbOrderBy = orderBy;
    window.fbServerTimestamp = serverTimestamp;
    window.fbWhere = where;
    window.fbRef = ref;
    window.fbUploadBytes = uploadBytes;
    window.fbGetDownloadURL = getDownloadURL;
    window.fbDeleteObject = deleteObject;

    firebaseLoaded = true;
    console.log('Firebase 초기화 완료');
  } catch (error) {
    console.error('Firebase 로드 실패:', error);
    showNotification('Firebase 연결 실패', 'error');
    throw error;
  }
}

function getCachedData(type) {
  const cached = dataCache[type];
  if (cached.data && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  return null;
}

function setCachedData(type, data) {
  dataCache[type] = {
    data: data,
    timestamp: Date.now()
  };
}

function clearCache(type = null) {
  if (type) {
    dataCache[type] = { data: null, timestamp: 0 };
  } else {
    Object.keys(dataCache).forEach(key => {
      dataCache[key] = { data: null, timestamp: 0 };
    });
  }
}

window.showBookingDetails = function(docId, bookingData) {
  const services = Array.isArray(bookingData.services) ? bookingData.services.join(', ') : (bookingData.services || '기본 케어');
  const notes = bookingData.notes || '특이사항 없음';
  const createdAt = bookingData.createdAt && bookingData.createdAt.toDate ? bookingData.createdAt.toDate() : new Date();
  const createdDate = createdAt.toLocaleDateString('ko-KR');
  const createdTime = createdAt.toLocaleTimeString('ko-KR');
  
  const modal = document.createElement('div');
  modal.id = 'booking-detail-modal';
  modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
  `;
  
  modal.innerHTML = `
      <div style="
          background: white;
          border-radius: 18px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid #f3f4f6; padding-bottom: 1rem;">
              <h3 style="margin: 0; color: #333; font-size: 1.5rem;">📋 예약 상세정보</h3>
              <span onclick="closeBookingModal()" style="
                  font-size: 1.5rem;
                  cursor: pointer;
                  color: #666;
                  width: 30px;
                  height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border-radius: 50%;
                  background: #f3f4f6;
                  transition: all 0.3s ease;
              " onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">&times;</span>
          </div>
          
          <div style="display: grid; gap: 1.5rem;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                  <div style="background: #f8fafc; padding: 1rem; border-radius: 10px; border-left: 4px solid hotpink;">
                      <strong style="color: #333; display: block; margin-bottom: 0.5rem;">👤 고객 정보</strong>
                      <div style="color: #666;">이름: ${bookingData.name}</div>
                      <div style="color: #666;">연락처: ${bookingData.phone}</div>
                  </div>
                  
                  <div style="background: #f0fdf4; padding: 1rem; border-radius: 10px; border-left: 4px solid #22c55e;">
                      <strong style="color: #333; display: block; margin-bottom: 0.5rem;">📅 예약 일정</strong>
                      <div style="color: #666;">날짜: ${bookingData.date}</div>
                      <div style="color: #666;">시간: ${bookingData.time}</div>
                  </div>
              </div>
              
              <div style="background: #fef3c7; padding: 1rem; border-radius: 10px; border-left: 4px solid #f59e0b;">
                  <strong style="color: #333; display: block; margin-bottom: 0.5rem;">💅 선택 서비스</strong>
                  <div style="color: #666; line-height: 1.5;">${services}</div>
              </div>
              
              <div style="background: #e0f2fe; padding: 1rem; border-radius: 10px; border-left: 4px solid #0ea5e9;">
                  <strong style="color: #333; display: block; margin-bottom: 0.5rem;">📝 고객 요청사항</strong>
                  <div style="color: #666; line-height: 1.6; white-space: pre-wrap;">${notes}</div>
              </div>
              
              <div style="background: #f3f4f6; padding: 1rem; border-radius: 10px; border-left: 4px solid #6b7280;">
                  <strong style="color: #333; display: block; margin-bottom: 0.5rem;">ℹ️ 접수 정보</strong>
                  <div style="color: #666;">접수일: ${createdDate}</div>
                  <div style="color: #666;">접수시간: ${createdTime}</div>
              </div>
          </div>
          
          <div style="margin-top: 2rem; text-align: center;">
              <button onclick="closeBookingModal()" style="
                  background: hotpink;
                  color: white;
                  border: none;
                  padding: 0.8rem 2rem;
                  border-radius: 50px;
                  cursor: pointer;
                  font-size: 1rem;
                  font-weight: 600;
                  transition: all 0.3s ease;
              " onmouseover="this.style.background='#ff69b4'" onmouseout="this.style.background='hotpink'">확인</button>
          </div>
      </div>
  `;
  
  document.body.appendChild(modal);
  
  const escHandler = function(e) {
      if (e.key === 'Escape') {
          closeBookingModal();
          document.removeEventListener('keydown', escHandler);
      }
  };
  document.addEventListener('keydown', escHandler);
  
  modal.addEventListener('click', function(e) {
      if (e.target === modal) {
          closeBookingModal();
      }
  });
};

window.closeBookingModal = function() {
  const modal = document.getElementById('booking-detail-modal');
  if (modal) {
      document.body.removeChild(modal);
  }
};

function initializeAdmin() {
  const loginOverlay = document.getElementById('login-overlay');
  const adminPanel = document.getElementById('admin-panel');
  const loginBtn = document.getElementById('login-btn');
  const adminPass = document.getElementById('admin-pass');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (!loginOverlay || !adminPanel || !loginBtn || !adminPass) {
      console.error('필수 요소를 찾을 수 없습니다');
      return;
  }
  
  checkLoginStatus(loginOverlay, adminPanel);
  setupEvents(loginBtn, adminPass, logoutBtn, loginOverlay, adminPanel);
}

function checkLoginStatus(loginOverlay, adminPanel) {
  const savedLogin = sessionStorage.getItem('admin_logged_in');
  
  if (savedLogin === 'true') {
      isLoggedIn = true;
      showAdminPanel(loginOverlay, adminPanel);
      loadDashboard();
  } else {
      showLoginScreen(loginOverlay, adminPanel);
  }
}

function setupEvents(loginBtn, adminPass, logoutBtn, loginOverlay, adminPanel) {
  if (loginBtn) {
      loginBtn.onclick = function(e) {
          e.preventDefault();
          handleLogin(adminPass, loginOverlay, adminPanel);
      };
  }
  
  if (adminPass) {
      adminPass.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') {
              e.preventDefault();
              handleLogin(adminPass, loginOverlay, adminPanel);
          }
      });
  }
  
  if (logoutBtn) {
      logoutBtn.onclick = function(e) {
          e.preventDefault();
          handleLogout(loginOverlay, adminPanel, adminPass);
      };
  }
  
  setupNavigation();
  setupOtherEvents();
}

function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn:not(.logout)');
  
  navBtns.forEach(function(btn) {
      btn.onclick = function() {
          const tab = btn.dataset.tab;
          switchTab(tab);
      };
  });
}

function setupOtherEvents() {
  const uploadToggle = document.getElementById('upload-toggle');
  const uploadSection = document.getElementById('upload-section');
  const cancelUpload = document.getElementById('cancel-upload');
  const uploadForm = document.getElementById('upload-form');
  
  if (uploadToggle && uploadSection) {
      uploadToggle.onclick = function() {
          const isHidden = uploadSection.style.display === 'none' || !uploadSection.style.display;
          uploadSection.style.display = isHidden ? 'block' : 'none';
      };
  }
  
  if (cancelUpload && uploadSection) {
      cancelUpload.onclick = function() {
          uploadSection.style.display = 'none';
          if (uploadForm) uploadForm.reset();
      };
  }
  
  if (uploadForm) {
      uploadForm.addEventListener('submit', handleFileUpload);
  }
  
  const refreshBookings = document.getElementById('refresh-bookings');
  if (refreshBookings) {
      refreshBookings.onclick = () => {
          clearCache('bookings');
          loadBookings();
      };
  }
  
  const dateFilter = document.getElementById('date-filter');
  const statusFilter = document.getElementById('status-filter');
  const reviewSort = document.getElementById('review-sort');
  
  if (dateFilter) {
      dateFilter.addEventListener('change', () => loadBookings());
  }
  
  if (statusFilter) {
      statusFilter.addEventListener('change', () => loadBookings());
  }
  
  if (reviewSort) {
      reviewSort.addEventListener('change', () => {
          clearCache('reviews');
          loadReviews();
      });
  }
}

function handleLogin(adminPass, loginOverlay, adminPanel) {
  const password = adminPass.value.trim();
  
  if (!password) {
      showNotification('비밀번호를 입력해주세요.', 'error');
      adminPass.focus();
      return;
  }
  
  if (password === '0920') {
      isLoggedIn = true;
      sessionStorage.setItem('admin_logged_in', 'true');
      
      showNotification('✅ 로그인 성공!', 'success');
      showAdminPanel(loginOverlay, adminPanel);
      loadDashboard();
  } else {
      showNotification('❌ 비밀번호가 틀렸습니다.', 'error');
      adminPass.value = '';
      adminPass.focus();
  }
}

function handleLogout(loginOverlay, adminPanel, adminPass) {
  isLoggedIn = false;
  sessionStorage.removeItem('admin_logged_in');
  clearCache();
  
  showNotification('로그아웃되었습니다.', 'success');
  showLoginScreen(loginOverlay, adminPanel);
  
  if (adminPass) {
      adminPass.value = '';
  }
}

function showLoginScreen(loginOverlay, adminPanel) {
  if (loginOverlay) loginOverlay.style.display = 'flex';
  if (adminPanel) adminPanel.style.display = 'none';
}

function showAdminPanel(loginOverlay, adminPanel) {
  if (loginOverlay) loginOverlay.style.display = 'none';
  if (adminPanel) adminPanel.style.display = 'block';
}

function switchTab(tabName) {
  const navBtns = document.querySelectorAll('.nav-btn:not(.logout)');
  navBtns.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
  if (activeBtn) activeBtn.classList.add('active');
  
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => content.classList.remove('active'));
  
  const activeTab = document.getElementById(`${tabName}-tab`);
  if (activeTab) activeTab.classList.add('active');
  
  switch (tabName) {
      case 'dashboard':
          loadDashboard();
          break;
      case 'bookings':
          loadBookings();
          break;
      case 'gallery':
          loadGallery();
          break;
      case 'reviews':
          loadReviews();
          break;
  }
}

async function loadDashboard() {
  try {
      const cachedBookings = getCachedData('bookings');
      const cachedGallery = getCachedData('gallery');
      const cachedReviews = getCachedData('reviews');

      if (cachedBookings && cachedGallery && cachedReviews) {
          updateDashboardStats(cachedBookings, cachedGallery, cachedReviews);
          loadRecentBookings(cachedBookings);
          showNotification('📊 캐시된 데이터로 업데이트됨!', 'success');
          return;
      }

      await loadFirebase();
      
      const [bookingsSnapshot, gallerySnapshot, reviewsSnapshot] = await Promise.all([
          window.fbGetDocs(window.fbCollection(db, "bookings")),
          window.fbGetDocs(window.fbCollection(db, "gallery")),
          window.fbGetDocs(window.fbCollection(db, "reviews"))
      ]);
      
      const bookingsData = [];
      const galleryData = [];
      const reviewsData = [];
      
      bookingsSnapshot.forEach(doc => bookingsData.push({ id: doc.id, ...doc.data() }));
      gallerySnapshot.forEach(doc => galleryData.push({ id: doc.id, ...doc.data() }));
      reviewsSnapshot.forEach(doc => reviewsData.push({ id: doc.id, ...doc.data() }));
      
      setCachedData('bookings', bookingsData);
      setCachedData('gallery', galleryData);
      setCachedData('reviews', reviewsData);
      
      updateDashboardStats(bookingsData, galleryData, reviewsData);
      loadRecentBookings(bookingsData);
      
      showNotification('📊 Firebase 데이터로 업데이트됨!', 'success');
  } catch (error) {
      console.error('대시보드 로드 실패:', error);
      showNotification('대시보드 로드 실패', 'error');
  }
}

function updateDashboardStats(bookingsData, galleryData, reviewsData) {
  const today = new Date().toISOString().split('T')[0];
  const todayBookingsCount = bookingsData.filter(booking => booking.date === today).length;
  
  const stats = {
      'total-bookings': bookingsData.length,
      'total-gallery': galleryData.length,
      'total-reviews': reviewsData.length,
      'today-bookings': todayBookingsCount
  };
  
  Object.entries(stats).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
  });
}

function loadRecentBookings(bookingsData) {
  const recentBookings = document.getElementById('recent-bookings');
  if (!recentBookings) return;
  
  const sortedBookings = bookingsData
      .sort((a, b) => {
          const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          return bTime - aTime;
      })
      .slice(0, 5);
  
  recentBookings.innerHTML = '';
  
  if (sortedBookings.length === 0) {
      recentBookings.innerHTML = '<p style="text-align: center; color: #718096;">최근 예약이 없습니다.</p>';
      return;
  }
  
  sortedBookings.forEach(data => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
      const timeString = createdAt.toLocaleDateString('ko-KR');
      
      item.innerHTML = `
          <div class="recent-item-header">
              <span class="recent-item-name">${data.name}</span>
              <span class="recent-item-time">${timeString}</span>
          </div>
          <div class="recent-item-details">
              📅 ${data.date} ${data.time} | 📞 ${data.phone}
          </div>
      `;
      recentBookings.appendChild(item);
  });
}

async function loadBookings() {
  const bookingsList = document.getElementById('bookings-list');
  if (!bookingsList) return;
  
  try {
      let bookingsData = getCachedData('bookings');
      
      if (!bookingsData) {
          await loadFirebase();
          const q = window.fbQuery(window.fbCollection(db, "bookings"), window.fbOrderBy("createdAt", "desc"));
          const snapshot = await window.fbGetDocs(q);
          
          bookingsData = [];
          snapshot.forEach(doc => {
              bookingsData.push({ id: doc.id, ...doc.data() });
          });
          
          setCachedData('bookings', bookingsData);
      }
      
      displayBookings(bookingsData);
      
  } catch (error) {
      console.error('예약 로드 실패:', error);
      bookingsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">로드 실패</div>';
  }
}

function displayBookings(bookingsData) {
  const bookingsList = document.getElementById('bookings-list');
  
  bookingsList.innerHTML = `
      <div class="data-row data-header" style="grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto;">
          <div><strong>이름</strong></div>
          <div><strong>연락처</strong></div>
          <div><strong>예약일시</strong></div>
          <div><strong>서비스</strong></div>
          <div><strong>상태</strong></div>
          <div><strong>작업</strong></div>
      </div>
  `;
  
  if (bookingsData.length === 0) {
      bookingsList.innerHTML += '<div style="text-align: center; padding: 2rem; color: #718096;">예약이 없습니다.</div>';
      return;
  }
  
  bookingsData.forEach(data => {
      const row = document.createElement('div');
      row.className = 'data-row';
      row.style.gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr auto';
      
      const status = data.status || 'pending';
      const statusClass = `status-${status}`;
      const statusText = status === 'confirmed' ? '확정' : status === 'cancelled' ? '취소' : '대기';
      
      const services = Array.isArray(data.services) ? data.services.join(', ') : (data.services || '기본 케어');
      
      row.innerHTML = `
          <div>
              <strong>${data.name}</strong>
              ${data.notes ? `<br><small style="color: #666; font-size: 0.8rem;">💬 ${data.notes.substring(0, 30)}${data.notes.length > 30 ? '...' : ''}</small>` : ''}
          </div>
          <div>${data.phone}</div>
          <div>${data.date}<br><small>${data.time}</small></div>
          <div style="font-size: 0.9rem; color: #666;">${services}</div>
          <div><span class="status-badge ${statusClass}">${statusText}</span></div>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <select onchange="updateBookingStatus('${data.id}', this.value)" style="font-size: 0.9rem;">
                  <option value="pending" ${status === 'pending' ? 'selected' : ''}>대기</option>
                  <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>확정</option>
                  <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>취소</option>
              </select>
              <button onclick="showBookingDetails('${data.id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})" style="
                  background: #3b82f6; 
                  color: white; 
                  border: none; 
                  padding: 0.3rem 0.8rem; 
                  border-radius: 5px; 
                  cursor: pointer; 
                  font-size: 0.8rem;
              ">상세</button>
              <button class="delete-btn" onclick="deleteBooking('${data.id}')" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">삭제</button>
          </div>
      `;
      bookingsList.appendChild(row);
  });
}

async function loadGallery() {
  const galleryList = document.getElementById('gallery-list');
  if (!galleryList) return;
  
  try {
      let galleryData = getCachedData('gallery');
      
      if (!galleryData) {
          await loadFirebase();
          const q = window.fbQuery(window.fbCollection(db, "gallery"), window.fbOrderBy("createdAt", "desc"));
          const snapshot = await window.fbGetDocs(q);
          
          galleryData = [];
          snapshot.forEach(doc => {
              galleryData.push({ id: doc.id, ...doc.data() });
          });
          
          setCachedData('gallery', galleryData);
      }
      
      displayGallery(galleryData);
      
  } catch (error) {
      console.error('갤러리 로드 실패:', error);
      galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">로드 실패</div>';
  }
}

function displayGallery(galleryData) {
  const galleryList = document.getElementById('gallery-list');
  
  galleryList.innerHTML = '';
  
  if (galleryData.length === 0) {
      galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">갤러리가 비어있습니다.</div>';
      return;
  }
  
  galleryData.forEach(data => {
      const card = document.createElement('div');
      card.className = 'admin-gallery-card';
      
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
      const dateString = createdAt.toLocaleDateString('ko-KR');
      
      card.innerHTML = `
          <img src="${data.imageUrl}" alt="갤러리 이미지" loading="lazy" />
          <div class="card-content">
              <div class="card-info">
                  <h4>${data.caption || '무제'}</h4>
                  <p>업로드: ${dateString}</p>
              </div>
              <div class="card-actions">
                  <button class="delete-btn" onclick="deleteGalleryItem('${data.id}', '${data.imageUrl}')">삭제</button>
              </div>
          </div>
      `;
      galleryList.appendChild(card);
  });
}

async function loadReviews() {
  const reviewsList = document.getElementById('reviews-list');
  if (!reviewsList) return;
  
  try {
      let reviewsData = getCachedData('reviews');
      
      if (!reviewsData) {
          await loadFirebase();
          
          const sortSelect = document.getElementById('review-sort');
          const sortValue = sortSelect ? sortSelect.value : 'newest';
          
          let orderField = 'createdAt';
          let orderDirection = 'desc';
          
          switch (sortValue) {
              case 'oldest':
                  orderDirection = 'asc';
                  break;
              case 'highest':
                  orderField = 'rating';
                  orderDirection = 'desc';
                  break;
              case 'lowest':
                  orderField = 'rating';
                  orderDirection = 'asc';
                  break;
          }
          
          const q = window.fbQuery(window.fbCollection(db, "reviews"), window.fbOrderBy(orderField, orderDirection));
          const snapshot = await window.fbGetDocs(q);
          
          reviewsData = [];
          snapshot.forEach(doc => {
              reviewsData.push({ id: doc.id, ...doc.data() });
          });
          
          setCachedData('reviews', reviewsData);
      }
      
      displayReviews(reviewsData);
      
  } catch (error) {
      console.error('후기 로드 실패:', error);
      reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #ef4444;">로드 실패</div>';
  }
}

function displayReviews(reviewsData) {
  const reviewsList = document.getElementById('reviews-list');
  
  reviewsList.innerHTML = '';
  
  if (reviewsData.length === 0) {
      reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">후기가 없습니다.</div>';
      return;
  }
  
  reviewsData.forEach(data => {
      const card = document.createElement('div');
      card.className = 'admin-review-card';
      
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
      const dateString = createdAt.toLocaleDateString('ko-KR');
      
      const rating = data.rating || 5;
      const starsDisplay = '⭐'.repeat(rating);
      
      const imageHtml = data.imageUrl ? 
          `<div style="text-align: center; margin-top: 1rem;">
             <img src="${data.imageUrl}" alt="후기 사진" style="max-width: 200px; max-height: 150px; border-radius: 8px;" loading="lazy" />
           </div>` : '';
      
      card.innerHTML = `
          <div class="review-header">
              <span class="review-author">${data.name}</span>
              <span class="review-date">${dateString}</span>
          </div>
          <div style="margin: 1rem 0; font-size: 1.2rem;">${starsDisplay}</div>
          <div class="review-content">${data.content}</div>
          ${imageHtml}
          <div class="review-actions">
              <button class="delete-btn" onclick="deleteReview('${data.id}', '${data.imageUrl || ''}')">삭제</button>
          </div>
      `;
      reviewsList.appendChild(card);
  });
}

async function handleFileUpload(e) {
  e.preventDefault();
  
  const fileInput = document.getElementById('file-input');
  const captionInput = document.getElementById('caption-input');
  const file = fileInput.files[0];
  const caption = captionInput.value.trim();
  
  if (!file) {
      showNotification('파일을 선택해주세요.', 'error');
      return;
  }
  
  if (!file.type.startsWith('image/')) {
      showNotification('이미지 파일만 업로드 가능합니다.', 'error');
      return;
  }
  
  try {
      showNotification('업로드 중...', 'info');
      
      await loadFirebase();
      
      const imageRef = window.fbRef(storage, `gallery/${Date.now()}_${file.name}`);
      await window.fbUploadBytes(imageRef, file);
      const imageUrl = await window.fbGetDownloadURL(imageRef);
      
      await window.fbAddDoc(window.fbCollection(db, "gallery"), {
          imageUrl,
          caption: caption || '무제',
          createdAt: window.fbServerTimestamp()
      });
      
      showNotification('✅ 업로드 완료!', 'success');
      
      const uploadForm = document.getElementById('upload-form');
      if (uploadForm) uploadForm.reset();
      
      const uploadSection = document.getElementById('upload-section');
      if (uploadSection) uploadSection.style.display = 'none';
      
      clearCache('gallery');
      loadGallery();
      loadDashboard();
      
  } catch (error) {
      console.error('업로드 실패:', error);
      showNotification('업로드 실패', 'error');
  }
}

window.updateBookingStatus = async function(docId, newStatus) {
  try {
      await loadFirebase();
      await window.fbUpdateDoc(window.fbDoc(db, "bookings", docId), {
          status: newStatus
      });
      showNotification('상태 업데이트 완료!', 'success');
      clearCache('bookings');
      loadBookings();
  } catch (error) {
      console.error('상태 업데이트 실패:', error);
      showNotification('상태 업데이트 실패', 'error');
  }
};

window.deleteBooking = async function(docId) {
  if (!confirm('정말로 삭제하시겠습니까?')) return;
  
  try {
      await loadFirebase();
      await window.fbDeleteDoc(window.fbDoc(db, "bookings", docId));
      showNotification('삭제 완료!', 'success');
      clearCache('bookings');
      loadBookings();
      loadDashboard();
  } catch (error) {
      console.error('삭제 실패:', error);
      showNotification('삭제 실패', 'error');
  }
};

window.deleteGalleryItem = async function(docId, imageUrl) {
  if (!confirm('정말로 삭제하시겠습니까?')) return;
  
  try {
      await loadFirebase();
      await window.fbDeleteDoc(window.fbDoc(db, "gallery", docId));
      
      if (imageUrl) {
          try {
              const imageRef = window.fbRef(storage, imageUrl);
              await window.fbDeleteObject(imageRef);
          } catch (imageError) {
              console.warn('이미지 삭제 실패:', imageError);
          }
      }
      
      showNotification('삭제 완료!', 'success');
      clearCache('gallery');
      loadGallery();
      loadDashboard();
  } catch (error) {
      console.error('삭제 실패:', error);
      showNotification('삭제 실패', 'error');
  }
};

window.deleteReview = async function(docId, imageUrl) {
  if (!confirm('정말로 삭제하시겠습니까?')) return;
  
  try {
      await loadFirebase();
      await window.fbDeleteDoc(window.fbDoc(db, "reviews", docId));
      
      if (imageUrl) {
          try {
              const imageRef = window.fbRef(storage, imageUrl);
              await window.fbDeleteObject(imageRef);
          } catch (imageError) {
              console.warn('이미지 삭제 실패:', imageError);
          }
      }
      
      showNotification('삭제 완료!', 'success');
      clearCache('reviews');
      loadReviews();
      loadDashboard();
  } catch (error) {
      console.error('삭제 실패:', error);
      showNotification('삭제 실패', 'error');
  }
};

function showNotification(message, type = 'success') {
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
}

console.log('=== 최적화된 Firebase 관리자 스크립트 로드 완료 ===');
<script type="module" src="optimized-firebase.js"></script>