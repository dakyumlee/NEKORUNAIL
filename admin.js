let isLoggedIn = false;

document.addEventListener('DOMContentLoaded', function() {
    initializeAdmin();
});

// 로컬스토리지 데이터 가져오기 가져온나. 가져온나어이.
function getLocalData(key) {
    const stored = localStorage.getItem(`nekorunail_${key}`);
    return stored ? JSON.parse(stored) : [];
}

function saveLocalData(key, data) {
    localStorage.setItem(`nekorunail_${key}`, JSON.stringify(data));
}

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
        loadLocalDashboard();
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
        loadLocalDashboard();
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
            loadLocalDashboard();
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

function loadLocalDashboard() {
    const bookings = getLocalData('bookings');
    const gallery = getLocalData('gallery');
    const reviews = getLocalData('reviews');
    
    // 오늘 예약 계산
    const today = new Date().toISOString().split('T')[0];
    const todayBookings = bookings.filter(booking => booking.date === today);
    
    const stats = {
        'total-bookings': bookings.length,
        'total-gallery': gallery.length,
        'total-reviews': reviews.length,
        'today-bookings': todayBookings.length
    };
    
    Object.entries(stats).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
    
    loadRecentBookings();
    showNotification('📊 로컬 데이터로 업데이트됨!', 'success');
}

function loadRecentBookings() {
    const recentBookings = document.getElementById('recent-bookings');
    if (!recentBookings) return;
    
    const bookings = getLocalData('bookings');
    const recentList = bookings.slice(0, 5); // 최근 5개만...
    
    recentBookings.innerHTML = '';
    
    if (recentList.length === 0) {
        recentBookings.innerHTML = '<p style="text-align: center; color: #718096;">최근 예약이 없습니다.</p>';
        return;
    }
    
    recentList.forEach(data => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        
        const createdAt = new Date(data.createdAt);
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

function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;
    
    const bookings = getLocalData('bookings');
    
    bookingsList.innerHTML = `
        <div class="data-row data-header">
            <div><strong>이름</strong></div>
            <div><strong>연락처</strong></div>
            <div><strong>예약일시</strong></div>
            <div><strong>상태</strong></div>
            <div><strong>작업</strong></div>
        </div>
    `;
    
    if (bookings.length === 0) {
        bookingsList.innerHTML += '<div style="text-align: center; padding: 2rem; color: #718096;">예약이 없습니다.</div>';
        return;
    }
    
    bookings.forEach((data, index) => {
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
                <select onchange="updateBookingStatus(${index}, this.value)">
                    <option value="pending" ${status === 'pending' ? 'selected' : ''}>대기</option>
                    <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>확정</option>
                    <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>취소</option>
                </select>
                <button class="delete-btn" onclick="deleteBooking(${index})">삭제</button>
            </div>
        `;
        bookingsList.appendChild(row);
    });
}

function loadGallery() {
    const galleryList = document.getElementById('gallery-list');
    if (!galleryList) return;
    
    const gallery = getLocalData('gallery');
    
    galleryList.innerHTML = '';
    
    if (gallery.length === 0) {
        galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">갤러리가 비어있습니다.</div>';
        return;
    }
    
    gallery.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'admin-gallery-card';
        
        const createdAt = new Date(data.createdAt);
        const dateString = createdAt.toLocaleDateString('ko-KR');
        
        card.innerHTML = `
            <img src="${data.imageUrl}" alt="갤러리 이미지" />
            <div class="card-content">
                <div class="card-info">
                    <h4>${data.caption || '무제'}</h4>
                    <p>업로드: ${dateString}</p>
                </div>
                <div class="card-actions">
                    <button class="delete-btn" onclick="deleteGalleryItem(${index})">삭제</button>
                </div>
            </div>
        `;
        galleryList.appendChild(card);
    });
}

function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    const reviews = getLocalData('reviews');
    
    reviewsList.innerHTML = '';
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">후기가 없습니다.</div>';
        return;
    }
    
    reviews.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'admin-review-card';
        
        const createdAt = new Date(data.createdAt);
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
                <button class="delete-btn" onclick="deleteReview(${index})">삭제</button>
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
        
        // 파일을 Base64로 변환
        const imageUrl = await fileToBase64(file);
        
        const galleryData = {
            id: Date.now(),
            imageUrl,
            caption: caption || '무제',
            createdAt: new Date().toISOString()
        };
        
        // 로컬스토리지에 저장
        const gallery = getLocalData('gallery');
        gallery.unshift(galleryData);
        saveLocalData('gallery', gallery);
        
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

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

window.updateBookingStatus = function(index, newStatus) {
    const bookings = getLocalData('bookings');
    if (bookings[index]) {
        bookings[index].status = newStatus;
        saveLocalData('bookings', bookings);
        showNotification('상태 업데이트 완료!', 'success');
        loadBookings();
    }
};

window.deleteBooking = function(index) {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    const bookings = getLocalData('bookings');
    bookings.splice(index, 1);
    saveLocalData('bookings', bookings);
    showNotification('삭제 완료!', 'success');
    loadBookings();
    loadLocalDashboard(); // 통계 업데이트
};

window.deleteGalleryItem = function(index) {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    const gallery = getLocalData('gallery');
    gallery.splice(index, 1);
    saveLocalData('gallery', gallery);
    showNotification('삭제 완료!', 'success');
    loadGallery();
    loadLocalDashboard(); // 통계 업데이트
};

window.deleteReview = function(index) {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    
    const reviews = getLocalData('reviews');
    reviews.splice(index, 1);
    saveLocalData('reviews', reviews);
    showNotification('삭제 완료!', 'success');
    loadReviews();
    loadLocalDashboard(); // 통계 업데이트
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

console.log('=== 로컬스토리지 관리자 스크립트 로드 완료 ===');