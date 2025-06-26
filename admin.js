let db, storage;
let isLoggedIn = false;
let firebaseInitialized = false;

document.addEventListener('DOMContentLoaded', async function() {
    initializeAdmin();
    
    try {
        const firebaseModule = await import('./firebase.js');
        db = firebaseModule.db;
        storage = firebaseModule.storage;
        
        if (db && storage) {
            firebaseInitialized = true;
            showNotification('🔗 Firebase 연결 완료!', 'success');
            
            if (isLoggedIn) {
                loadRealDashboard();
            }
        } else {
            throw new Error('Firebase 객체 초기화 실패');
        }
    } catch (error) {
        console.error('Firebase 초기화 실패:', error);
        firebaseInitialized = false;
        showNotification('⚠️ 오프라인 모드로 실행', 'warning');
    }
});

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
        loadDemoDashboard();
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
        refreshBookings.onclick = () => loadBookings();
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
        reviewSort.addEventListener('change', () => loadReviews());
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
        
        if (firebaseInitialized) {
            loadRealDashboard();
        } else {
            loadDemoDashboard();
        }
    } else {
        showNotification('❌ 비밀번호가 틀렸습니다.', 'error');
        adminPass.value = '';
        adminPass.focus();
    }
}

function handleLogout(loginOverlay, adminPanel, adminPass) {
    isLoggedIn = false;
    sessionStorage.removeItem('admin_logged_in');
    
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
            if (firebaseInitialized) {
                loadRealDashboard();
            } else {
                loadDemoDashboard();
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

function loadDemoDashboard() {
    const stats = {
        'total-bookings': '?',
        'total-gallery': '?',
        'total-reviews': '?',
        'today-bookings': '?'
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    const recentBookings = document.getElementById('recent-bookings');
    if (recentBookings) {
        recentBookings.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #718096;">
                <h4>🔗 Firebase 연결 대기 중</h4>
                <p>연결되면 실제 데이터가 표시됩니다.</p>
            </div>
        `;
    }
}

async function loadRealDashboard() {
    if (!firebaseInitialized) {
        loadDemoDashboard();
        return;
    }
    
    try {
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const [bookingsSnapshot, gallerySnapshot, reviewsSnapshot] = await Promise.all([
            getDocs(collection(db, "bookings")),
            getDocs(collection(db, "gallery")),
            getDocs(collection(db, "reviews"))
        ]);
        
        const today = new Date().toISOString().split('T')[0];
        const todayQuery = query(collection(db, "bookings"), where("date", "==", today));
        const todaySnapshot = await getDocs(todayQuery);
        
        const stats = {
            'total-bookings': bookingsSnapshot.size,
            'total-gallery': gallerySnapshot.size,
            'total-reviews': reviewsSnapshot.size,
            'today-bookings': todaySnapshot.size
        };
        
        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
        
        await loadRecentBookings();
        showNotification('📊 실제 데이터로 업데이트됨!', 'success');
        
    } catch (error) {
        console.error('실제 대시보드 로드 실패:', error);
        loadDemoDashboard();
        showNotification('데이터 로드 실패 - 데모 모드', 'error');
    }
}

async function loadRecentBookings() {
    if (!firebaseInitialized) return;
    
    const recentBookings = document.getElementById('recent-bookings');
    if (!recentBookings) return;
    
    try {
        const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(5));
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
        
    } catch (error) {
        console.error('최근 예약 로드 실패:', error);
        recentBookings.innerHTML = '<p style="text-align: center; color: #ef4444;">로드 실패</p>';
    }
}

async function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;
    
    if (!firebaseInitialized) {
        bookingsList.innerHTML = `
            <div class="data-row data-header">
                <div><strong>이름</strong></div>
                <div><strong>연락처</strong></div>
                <div><strong>예약일시</strong></div>
                <div><strong>상태</strong></div>
                <div><strong>작업</strong></div>
            </div>
            <div style="text-align: center; padding: 2rem; color: #718096;">
                Firebase 연결 후 데이터가 표시됩니다.
            </div>
        `;
        return;
    }
    
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        bookingsList.innerHTML = `
            <div class="data-row data-header">
                <div><strong>이름</strong></div>
                <div><strong>연락처</strong></div>
                <div><strong>예약일시</strong></div>
                <div><strong>상태</strong></div>
                <div><strong>작업</strong></div>
            </div>
        `;
        
        if (snapshot.empty) {
            bookingsList.innerHTML += '<div style="text-align: center; padding: 2rem; color: #718096;">예약이 없습니다.</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const row = document.createElement('div');
            row.className = 'data-row';
            
            const status = data.status || 'pending';
            const statusClass = `status-${status}`;
            const statusText = status === 'confirmed' ? '확정' : status === 'cancelled' ? '취소' : '대기';
            
            row.innerHTML = `
                <div>${data.name}</div>
                <div>${data.phone}</div>
                <div>${data.date} ${data.time}</div>
                <div><span class="status-badge ${statusClass}">${statusText}</span></div>
                <div>
                    <select onchange="updateBookingStatus('${doc.id}', this.value)">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>대기</option>
                        <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>확정</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>취소</option>
                    </select>
                    <button class="delete-btn" onclick="deleteBooking('${doc.id}')">삭제</button>
                </div>
            `;
            bookingsList.appendChild(row);
        });
        
    } catch (error) {
        console.error('예약 로드 실패:', error);
        showNotification('예약 로드 실패', 'error');
    }
}

async function loadGallery() {
    const galleryList = document.getElementById('gallery-list');
    if (!galleryList) return;
    
    if (!firebaseInitialized) {
        galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">Firebase 연결 후 갤러리가 표시됩니다.</div>';
        return;
    }
    
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        galleryList.innerHTML = '';
        
        if (snapshot.empty) {
            galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">갤러리가 비어있습니다.</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-gallery-card';
            
            const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
            const dateString = createdAt.toLocaleDateString('ko-KR');
            
            card.innerHTML = `
                <img src="${data.imageUrl}" alt="갤러리 이미지" />
                <div class="card-content">
                    <div class="card-info">
                        <h4>${data.caption || '무제'}</h4>
                        <p>업로드: ${dateString}</p>
                    </div>
                    <div class="card-actions">
                        <button class="delete-btn" onclick="deleteGalleryItem('${doc.id}', '${data.imageUrl}')">삭제</button>
                    </div>
                </div>
            `;
            galleryList.appendChild(card);
        });
        
    } catch (error) {
        console.error('갤러리 로드 실패:', error);
        showNotification('갤러리 로드 실패', 'error');
    }
}

async function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    if (!firebaseInitialized) {
        reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">Firebase 연결 후 후기가 표시됩니다.</div>';
        return;
    }
    
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        reviewsList.innerHTML = '';
        
        if (snapshot.empty) {
            reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">후기가 없습니다.</div>';
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const card = document.createElement('div');
            card.className = 'admin-review-card';
            
            const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
            const dateString = createdAt.toLocaleDateString('ko-KR');
            
            const rating = data.rating || 5;
            const starsDisplay = '⭐'.repeat(rating);
            
            const imageHtml = data.imageUrl ? 
                `<div style="text-align: center; margin-top: 1rem;">
                   <img src="${data.imageUrl}" alt="후기 사진" style="max-width: 200px; max-height: 150px; border-radius: 8px;" />
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
                    <button class="delete-btn" onclick="deleteReview('${doc.id}')">삭제</button>
                </div>
            `;
            reviewsList.appendChild(card);
        });
        
    } catch (error) {
        console.error('후기 로드 실패:', error);
        showNotification('후기 로드 실패', 'error');
    }
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
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
        
        const { ref, uploadBytes, getDownloadURL } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js');
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        
        await addDoc(collection(db, "gallery"), {
            imageUrl,
            caption: caption || '무제',
            createdAt: serverTimestamp()
        });
        
        showNotification('✅ 업로드 완료!', 'success');
        
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) uploadForm.reset();
        
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) uploadSection.style.display = 'none';
        
        loadGallery();
        
    } catch (error) {
        console.error('업로드 실패:', error);
        showNotification('업로드 실패', 'error');
    }
}

window.updateBookingStatus = async function(bookingId, newStatus) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await updateDoc(doc(db, "bookings", bookingId), {
            status: newStatus
        });
        
        showNotification('상태 업데이트 완료!', 'success');
        loadBookings();
        
    } catch (error) {
        console.error('상태 업데이트 실패:', error);
        showNotification('상태 업데이트 실패', 'error');
    }
};

window.deleteBooking = async function(bookingId) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "bookings", bookingId));
        showNotification('삭제 완료!', 'success');
        loadBookings();
        
    } catch (error) {
        console.error('삭제 실패:', error);
        showNotification('삭제 실패', 'error');
    }
};

window.deleteGalleryItem = async function(docId, imageUrl) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js');
        
        await deleteDoc(doc(db, "gallery", docId));
        
        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (e) {
            console.log('Storage 삭제 실패:', e);
        }
        
        showNotification('삭제 완료!', 'success');
        loadGallery();
        
    } catch (error) {
        console.error('삭제 실패:', error);
        showNotification('삭제 실패', 'error');
    }
};

window.deleteReview = async function(reviewId) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "reviews", reviewId));
        showNotification('삭제 완료!', 'success');
        loadReviews();
        
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

console.log('=== Firebase v11.9.1 관리자 스크립트 로드 완료 ===');