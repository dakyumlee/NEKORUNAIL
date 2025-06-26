console.log('=== 최적화된 관리자 스크립트 시작 ===');


let db, storage;
let isLoggedIn = false;
let firebaseInitialized = false;
let loadingCache = {};

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드됨!');
    

    initializeAdmin();

    initializeFirebaseAsync();
});

async function initializeFirebaseAsync() {
    try {
        showQuickNotification('🔗 Firebase 연결 중...', 'info');

        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('연결 시간 초과')), 10000)
        );
        
        const firebasePromise = import('./firebase.js');
        
        const firebaseModule = await Promise.race([firebasePromise, timeoutPromise]);
        
        db = firebaseModule.db;
        storage = firebaseModule.storage;
        
        if (!db || !storage) {
            throw new Error('Firebase 객체를 찾을 수 없습니다');
        }
        
        firebaseInitialized = true;
        console.log('✅ Firebase 초기화 성공!');
        
        showQuickNotification('✅ Firebase 연결 완료!', 'success');
        
        if (isLoggedIn) {
            loadOptimizedDashboard();
        }
        
    } catch (error) {
        console.warn('⚠️ Firebase 초기화 실패 - 데모 모드:', error);
        firebaseInitialized = false;
        showQuickNotification('⚠️ 오프라인 모드로 실행', 'warning');
    }
}

function initializeAdmin() {
    console.log('관리자 초기화 시작');
    
    const loginOverlay = document.getElementById('login-overlay');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const adminPass = document.getElementById('admin-pass');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!loginOverlay || !adminPanel || !loginBtn || !adminPass) {
        console.error('❌ 필수 요소를 찾을 수 없습니다!');
        return;
    }
    
    console.log('✅ 모든 요소를 찾았습니다!');
    
    checkLoginStatus(loginOverlay, adminPanel);
    setupEvents(loginBtn, adminPass, logoutBtn, loginOverlay, adminPanel);
}

function checkLoginStatus(loginOverlay, adminPanel) {
    const savedLogin = sessionStorage.getItem('admin_logged_in');
    
    if (savedLogin === 'true') {
        isLoggedIn = true;
        showAdminPanel(loginOverlay, adminPanel);
       
        loadQuickDashboard();
        
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
    setupUploadEvents();
    setupFilterEvents();
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

function setupUploadEvents() {
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
}

function setupFilterEvents() {
    const refreshBookings = document.getElementById('refresh-bookings');
    const dateFilter = document.getElementById('date-filter');
    const statusFilter = document.getElementById('status-filter');
    const reviewSort = document.getElementById('review-sort');
    
    if (refreshBookings) {
        refreshBookings.onclick = function() {
            loadBookings();
        };
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', function() {
            loadBookings();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            loadBookings();
        });
    }
    
    if (reviewSort) {
        reviewSort.addEventListener('change', function() {
            loadReviews();
        });
    }
}

function handleLogin(adminPass, loginOverlay, adminPanel) {
    const password = adminPass.value.trim();
    
    if (!password) {
        showQuickNotification('비밀번호를 입력해주세요.', 'error');
        adminPass.focus();
        return;
    }
    
    if (password === '0920') {
        isLoggedIn = true;
        sessionStorage.setItem('admin_logged_in', 'true');
        
        showQuickNotification('✅ 로그인 성공!', 'success');
        showAdminPanel(loginOverlay, adminPanel);

        loadQuickDashboard();
        
        if (firebaseInitialized) {
            setTimeout(() => loadOptimizedDashboard(), 500);
        }
        
    } else {
        showQuickNotification('❌ 비밀번호가 틀렸습니다.', 'error');
        adminPass.value = '';
        adminPass.focus();
    }
}

function handleLogout(loginOverlay, adminPanel, adminPass) {
    isLoggedIn = false;
    sessionStorage.removeItem('admin_logged_in');
    loadingCache = {};
    
    showQuickNotification('로그아웃되었습니다.', 'success');
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
    console.log('탭 전환:', tabName);
    
    const navBtns = document.querySelectorAll('.nav-btn:not(.logout)');
    navBtns.forEach(function(btn) {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function(content) {
        content.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    switch (tabName) {
        case 'dashboard':
            if (firebaseInitialized) {
                loadOptimizedDashboard();
            } else {
                loadQuickDashboard();
            }
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


function loadQuickDashboard() {
    console.log('⚡ 빠른 대시보드 로드');
    const stats = {
        'total-bookings': '...',
        'total-gallery': '...',
        'total-reviews': '...',
        'today-bookings': '...'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    const recentBookings = document.getElementById('recent-bookings');
    if (recentBookings) {
        recentBookings.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #718096;">
                <div class="loading-dots">데이터 로딩 중</div>
            </div>
        `;
    }
    
    addLoadingAnimation();
}

function addLoadingAnimation() {
    if (document.getElementById('loading-animation-style')) return;
    
    const style = document.createElement('style');
    style.id = 'loading-animation-style';
    style.textContent = `
        .loading-dots::after {
            content: '';
            animation: dots 1.5s infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: ''; }
            40% { content: '.'; }
            60% { content: '..'; }
            80%, 100% { content: '...'; }
        }
        
        .quick-notification {
            animation: quickSlide 0.2s ease !important;
        }
        
        @keyframes quickSlide {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

async function loadOptimizedDashboard() {
    if (!firebaseInitialized) return;
    
    console.log('🚀 최적화된 대시보드 로드');
    
    try {
        if (loadingCache.dashboard && Date.now() - loadingCache.dashboard.timestamp < 30000) {
            console.log('📋 캐시된 대시보드 데이터 사용');
            updateDashboardUI(loadingCache.dashboard.data);
            return;
        }
        
        const { collection, getDocs, query, where, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        const [bookingsSnapshot, gallerySnapshot, reviewsSnapshot, todaySnapshot] = await Promise.all([
            getDocs(query(collection(db, "bookings"), limit(1))), // 개수만 필요하면 limit 사용
            getDocs(query(collection(db, "gallery"), limit(1))),
            getDocs(query(collection(db, "reviews"), limit(1))),
            getDocs(query(collection(db, "bookings"), where("date", "==", new Date().toISOString().split('T')[0]), limit(10)))
        ]);
   
        const stats = {
            'total-bookings': bookingsSnapshot.size > 0 ? '로딩...' : '0',
            'total-gallery': gallerySnapshot.size > 0 ? '로딩...' : '0', 
            'total-reviews': reviewsSnapshot.size > 0 ? '로딩...' : '0',
            'today-bookings': todaySnapshot.size
        };
        
        loadingCache.dashboard = {
            data: stats,
            timestamp: Date.now()
        };
        
        updateDashboardUI(stats);
        
        loadRecentBookingsOptimized();
        
    } catch (error) {
        console.error('최적화된 대시보드 로드 실패:', error);
        loadQuickDashboard();
    }
}

function updateDashboardUI(stats) {
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);
        }
    });
}

async function loadRecentBookingsOptimized() {
    if (!firebaseInitialized) return;
    
    const recentBookings = document.getElementById('recent-bookings');
    if (!recentBookings) return;
    
    try {
        const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(
            collection(db, "bookings"), 
            orderBy("createdAt", "desc"), 
            limit(3)
        );
        const snapshot = await getDocs(q);
        
        recentBookings.innerHTML = '';
        
        if (snapshot.empty) {
            recentBookings.innerHTML = '<p style="text-align: center; color: #718096;">최근 예약이 없습니다.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            
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
            

            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 100);
        });
        
    } catch (error) {
        console.error('최근 예약 로드 실패:', error);
        recentBookings.innerHTML = '<p style="text-align: center; color: #ef4444;">로드 실패</p>';
    }
}


async function loadBookings() {
    if (!firebaseInitialized) {
        showPlaceholderBookings();
        return;
    }
    
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;
    
    bookingsList.innerHTML = `
        <div class="data-row data-header">
            <div><strong>이름</strong></div>
            <div><strong>연락처</strong></div>
            <div><strong>예약일시</strong></div>
            <div><strong>서비스</strong></div>
            <div><strong>상태</strong></div>
            <div><strong>작업</strong></div>
        </div>
        <div style="text-align: center; padding: 2rem; color: #718096;">
            <div class="loading-dots">예약 데이터 로딩 중</div>
        </div>
    `;
    
    try {
        const { collection, getDocs, query, orderBy, where, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');

        let q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(10));
        
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter && dateFilter.value) {
            q = query(
                collection(db, "bookings"), 
                where("date", "==", dateFilter.value), 
                orderBy("createdAt", "desc")
            );
        }
        
        const snapshot = await getDocs(q);
        
        bookingsList.innerHTML = `
            <div class="data-row data-header">
                <div><strong>이름</strong></div>
                <div><strong>연락처</strong></div>
                <div><strong>예약일시</strong></div>
                <div><strong>서비스</strong></div>
                <div><strong>상태</strong></div>
                <div><strong>작업</strong></div>
            </div>
        `;
        
        if (snapshot.empty) {
            bookingsList.innerHTML += '<div style="text-align: center; padding: 2rem; color: #718096;">예약 데이터가 없습니다.</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('div');
            row.className = 'data-row';
            
            const status = data.status || 'pending';
            const statusClass = `status-${status}`;
            const statusText = status === 'confirmed' ? '확정' : 
                             status === 'cancelled' ? '취소' : '대기';
            
            const services = data.services && data.services.length > 0 ? 
                data.services.join(', ') : '기본 케어';
            
            row.innerHTML = `
                <div>
                    <strong>${data.name}</strong>
                    ${data.notes ? `<br><small style="color: #666;">📝 ${data.notes.substring(0, 20)}${data.notes.length > 20 ? '...' : ''}</small>` : ''}
                </div>
                <div>${data.phone}</div>
                <div>${data.date}<br>${data.time}</div>
                <div>${services}</div>
                <div><span class="status-badge ${statusClass}">${statusText}</span></div>
                <div>
                    <select onchange="updateBookingStatus('${doc.id}', this.value)" style="margin-bottom: 0.5rem; font-size: 0.8rem;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>대기</option>
                        <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>확정</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>취소</option>
                    </select>
                    <br>
                    <button class="delete-btn" onclick="deleteBooking('${doc.id}')" style="font-size: 0.8rem; padding: 0.3rem 0.8rem;">삭제</button>
                </div>
            `;
            bookingsList.appendChild(row);
        });
        
    } catch (error) {
        console.error('예약 로드 실패:', error);
        showQuickNotification('예약 데이터 로드 실패', 'error');
    }
}

async function loadGallery() {
    if (!firebaseInitialized) {
        showPlaceholderGallery();
        return;
    }
    
    const galleryList = document.getElementById('gallery-list');
    if (!galleryList) return;
    
    galleryList.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="loading-dots">갤러리 로딩 중</div></div>';
    
    try {
        const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');

        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"), limit(6));
        const snapshot = await getDocs(q);
        
        galleryList.innerHTML = '';
        
        if (snapshot.empty) {
            galleryList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #718096; grid-column: 1 / -1;">
                    <h3>갤러리가 비어있습니다</h3>
                    <p>첫 번째 이미지를 업로드해보세요! 📷</p>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-gallery-card';
            
            const createdAt = data.createdAt && data.createdAt.toDate ? 
                data.createdAt.toDate() : new Date();
            const dateString = createdAt.toLocaleDateString('ko-KR');
            
            card.innerHTML = `
                <img src="${data.imageUrl}" alt="갤러리 이미지" loading="lazy" />
                <div class="card-content">
                    <div class="card-info">
                        <h4>${data.caption || '무제'}</h4>
                        <p>업로드: ${dateString}</p>
                    </div>
                    <div class="card-actions">
                        <button class="delete-btn" onclick="deleteGalleryItem('${doc.id}', '${data.imageUrl}')" style="font-size: 0.8rem;">삭제</button>
                    </div>
                </div>
            `;
            galleryList.appendChild(card);
        });
        
    } catch (error) {
        console.error('갤러리 로드 실패:', error);
        showQuickNotification('갤러리 로드 실패', 'error');
    }
}

async function loadReviews() {
    if (!firebaseInitialized) {
        showPlaceholderReviews();
        return;
    }
    
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem;"><div class="loading-dots">후기 로딩 중</div></div>';
    
    try {
        const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
   
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(5));
        const snapshot = await getDocs(q);
        
        reviewsList.innerHTML = '';
        
        if (snapshot.empty) {
            reviewsList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #718096;">
                    <h3>후기가 없습니다</h3>
                    <p>첫 번째 후기가 등록되기를 기다리고 있어요! ⭐</p>
                </div>
            `;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-review-card';
            
            const createdAt = data.createdAt && data.createdAt.toDate ? 
                data.createdAt.toDate() : new Date();
            const dateString = createdAt.toLocaleDateString('ko-KR');
            
            const rating = data.rating || 5;
            const starsDisplay = '⭐'.repeat(rating);
            
            const imageHtml = data.imageUrl ? 
                `<div style="text-align: center; margin-top: 1rem;">
                   <img src="${data.imageUrl}" alt="후기 사진" style="max-width: 150px; max-height: 100px; border-radius: 8px;" loading="lazy" />
                 </div>` : '';
            
            card.innerHTML = `
                <div class="review-header">
                    <span class="review-author">${data.name}</span>
                    <span class="review-date">${dateString}</span>
                </div>
                <div style="margin: 1rem 0; font-size: 1.1rem;">${starsDisplay}</div>
                <div class="review-content">${data.content.length > 100 ? data.content.substring(0, 100) + '...' : data.content}</div>
                ${imageHtml}
                <div class="review-actions">
                    <button class="delete-btn" onclick="deleteReview('${doc.id}')" style="font-size: 0.8rem;">삭제</button>
                </div>
            `;
            reviewsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('후기 로드 실패:', error);
        showQuickNotification('후기 로드 실패', 'error');
    }
}


function showPlaceholderBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (bookingsList) {
        bookingsList.innerHTML = `
            <div class="data-row data-header">
                <div><strong>이름</strong></div>
                <div><strong>연락처</strong></div>
                <div><strong>예약일시</strong></div>
                <div><strong>서비스</strong></div>
                <div><strong>상태</strong></div>
                <div><strong>작업</strong></div>
            </div>
            <div style="text-align: center; padding: 2rem; color: #718096;">
                🔗 Firebase 연결 대기 중...
            </div>
        `;
    }
}

function showPlaceholderGallery() {
    const galleryList = document.getElementById('gallery-list');
    if (galleryList) {
        galleryList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #718096; grid-column: 1 / -1;">
                <h3>🔗 Firebase 연결 대기 중</h3>
                <p>연결되면 갤러리 데이터가 표시됩니다.</p>
            </div>
        `;
    }
}

function showPlaceholderReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (reviewsList) {
        reviewsList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #718096;">
                <h3>🔗 Firebase 연결 대기 중</h3>
                <p>연결되면 후기 데이터가 표시됩니다.</p>
            </div>
        `;
    }
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    if (!firebaseInitialized) {
        showQuickNotification('Firebase 연결 대기 중...', 'warning');
        return;
    }
    
    const fileInput = document.getElementById('file-input');
    const captionInput = document.getElementById('caption-input');
    const file = fileInput.files[0];
    const caption = captionInput.value.trim();
    
    if (!file) {
        showQuickNotification('파일을 선택해주세요.', 'error');
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        showQuickNotification('이미지 파일만 업로드 가능합니다.', 'error');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
        showQuickNotification('파일 크기는 5MB 이하여야 합니다.', 'error');
        return;
    }
    
    try {
        showQuickNotification('📤 이미지 압축 및 업로드 중...', 'info');
        

        const compressedFile = await compressImage(file);
        
        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js');
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');

        const storageRef = ref(storage, `gallery/${Date.now()}_compressed_${file.name}`);
        await uploadBytes(storageRef, compressedFile);
        const imageUrl = await getDownloadURL(storageRef);

        await addDoc(collection(db, "gallery"), {
            imageUrl,
            caption: caption || '무제',
            createdAt: serverTimestamp(),
            originalSize: file.size,
            compressedSize: compressedFile.size
        });
        
        showQuickNotification('✅ 업로드 완료!', 'success');
        
        
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) uploadForm.reset();
        
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) uploadSection.style.display = 'none';
  
        loadGallery();

        delete loadingCache.dashboard;
        
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        showQuickNotification('업로드 실패: ' + error.message, 'error');
    }
}

async function compressImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {

            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.drawImage(img, 0, 0, width, height);
            
            
            canvas.toBlob(resolve, 'image/jpeg', quality);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

window.updateBookingStatus = async function(bookingId, newStatus) {
    if (!firebaseInitialized) {
        showQuickNotification('Firebase 연결 대기 중...', 'warning');
        return;
    }
    
    try {
        showQuickNotification('📝 상태 업데이트 중...', 'info');
        
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await updateDoc(doc(db, "bookings", bookingId), {
            status: newStatus,
            updatedAt: new Date()
        });
        
        showQuickNotification('✅ 상태 업데이트 완료!', 'success');
   
        delete loadingCache.dashboard;

        updateBookingRowStatus(bookingId, newStatus);
        
    } catch (error) {
        console.error('상태 업데이트 실패:', error);
        showQuickNotification('상태 업데이트 실패', 'error');
    }
};

function updateBookingRowStatus(bookingId, newStatus) {
    const statusText = newStatus === 'confirmed' ? '확정' : 
                      newStatus === 'cancelled' ? '취소' : '대기';
    const statusClass = `status-${newStatus}`;

    const selects = document.querySelectorAll('select[onchange*="' + bookingId + '"]');
    selects.forEach(select => {
        const statusBadge = select.closest('.data-row').querySelector('.status-badge');
        if (statusBadge) {
            statusBadge.className = `status-badge ${statusClass}`;
            statusBadge.textContent = statusText;
        }
    });
}

window.deleteBooking = async function(bookingId) {
    if (!firebaseInitialized) {
        showQuickNotification('Firebase 연결 대기 중...', 'warning');
        return;
    }
    
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        showQuickNotification('🗑️ 삭제 중...', 'info');
        
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "bookings", bookingId));
        showQuickNotification('✅ 삭제 완료!', 'success');

        delete loadingCache.dashboard;

        const buttons = document.querySelectorAll('button[onclick*="' + bookingId + '"]');
        buttons.forEach(button => {
            const row = button.closest('.data-row');
            if (row) {
                row.style.transition = 'all 0.3s ease';
                row.style.opacity = '0';
                row.style.transform = 'translateX(-100%)';
                setTimeout(() => row.remove(), 300);
            }
        });
        
    } catch (error) {
        console.error('예약 삭제 실패:', error);
        showQuickNotification('삭제 실패', 'error');
    }
};

window.deleteGalleryItem = async function(docId, imageUrl) {
    if (!firebaseInitialized) {
        showQuickNotification('Firebase 연결 대기 중...', 'warning');
        return;
    }
    
    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        showQuickNotification('🗑️ 이미지 삭제 중...', 'info');
        
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js');
        

        await deleteDoc(doc(db, "gallery", docId));

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (storageError) {
            console.log('Storage 이미지 삭제 실패 (계속 진행):', storageError);
        }
        
        showQuickNotification('✅ 이미지 삭제 완료!', 'success');
        
        delete loadingCache.dashboard;
 
        const buttons = document.querySelectorAll('button[onclick*="' + docId + '"]');
        buttons.forEach(button => {
            const card = button.closest('.admin-gallery-card');
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'scale(0.8)';
                setTimeout(() => card.remove(), 300);
            }
        });
        
    } catch (error) {
        console.error('이미지 삭제 실패:', error);
        showQuickNotification('이미지 삭제 실패', 'error');
    }
};

window.deleteReview = async function(reviewId) {
    if (!firebaseInitialized) {
        showQuickNotification('Firebase 연결 대기 중...', 'warning');
        return;
    }
    
    if (!confirm('정말로 이 후기를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        showQuickNotification('🗑️ 후기 삭제 중...', 'info');
        
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "reviews", reviewId));
        showQuickNotification('✅ 후기 삭제 완료!', 'success');
        
        delete loadingCache.dashboard;
        
        const buttons = document.querySelectorAll('button[onclick*="' + reviewId + '"]');
        buttons.forEach(button => {
            const card = button.closest('.admin-review-card');
            if (card) {
                card.style.transition = 'all 0.3s ease';
                card.style.opacity = '0';
                card.style.transform = 'translateY(-20px)';
                setTimeout(() => card.remove(), 300);
            }
        });
        
    } catch (error) {
        console.error('후기 삭제 실패:', error);
        showQuickNotification('후기 삭제 실패', 'error');
    }
};


function showQuickNotification(message, type = 'success') {

    const existing = document.querySelector('.quick-notification');
    if (existing) {
        existing.remove();
    }

    const notification = document.createElement('div');
    notification.className = `quick-notification ${type}`;
    notification.textContent = message;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '0.8rem 1.2rem',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10001',
        fontSize: '0.85rem',
        maxWidth: '300px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        transform: 'translateX(100%)',
        transition: 'transform 0.2s ease'
    });

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    notification.style.background = colors[type] || colors.info;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);

    const durations = {
        success: 2000,
        error: 4000,
        warning: 3000,
        info: 2500
    };
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 200);
        }
    }, durations[type] || 2500);
    
    notification.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 200);
    });
}


function logPerformance(label, startTime) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    console.log(`⚡ ${label}: ${duration}ms`);
    
    if (duration > 2000) {
        console.warn(`🐌 ${label}이 느립니다: ${duration}ms`);
    }
}


function showFirebaseStatus() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'firebase-status';
    statusIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 0.4rem 0.8rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
        cursor: pointer;
    `;
    
    if (firebaseInitialized) {
        statusIndicator.textContent = '🟢 연결됨';
        statusIndicator.style.background = 'rgba(16, 185, 129, 0.9)';
        statusIndicator.style.color = 'white';
    } else {
        statusIndicator.textContent = '🔴 오프라인';
        statusIndicator.style.background = 'rgba(239, 68, 68, 0.9)';
        statusIndicator.style.color = 'white';
    }

    statusIndicator.addEventListener('click', () => {
        const details = firebaseInitialized ? 
            'Firebase 정상 연결\n실시간 데이터 사용 중' : 
            'Firebase 연결 실패\n데모 모드로 실행 중';
        showQuickNotification(details, firebaseInitialized ? 'success' : 'warning');
    });
    
    document.body.appendChild(statusIndicator);

    setTimeout(() => {
        if (statusIndicator.parentNode) {
            statusIndicator.style.opacity = '0';
            setTimeout(() => {
                if (statusIndicator.parentNode) {
                    statusIndicator.remove();
                }
            }, 300);
        }
    }, 3000);
}

window.addEventListener('load', function() {
    setTimeout(showFirebaseStatus, 800);
});

const scriptStartTime = Date.now();
window.addEventListener('load', function() {
    logPerformance('전체 스크립트 로드', scriptStartTime);
});

console.log('=== 최적화된 관리자 스크립트 로드 완료 ===');