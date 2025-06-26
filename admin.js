let db, storage;
let isLoggedIn = false;
let loginOverlay, adminPanel, loginBtn, adminPass, logoutBtn;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드 완료');
    
    loginOverlay = document.getElementById("login-overlay");
    adminPanel = document.getElementById("admin-panel");
    loginBtn = document.getElementById("login-btn");
    adminPass = document.getElementById("admin-pass");
    logoutBtn = document.getElementById("logout-btn");
    
    console.log('요소 찾기 결과:', {
        loginOverlay: !!loginOverlay,
        adminPanel: !!adminPanel,
        loginBtn: !!loginBtn,
        adminPass: !!adminPass,
        logoutBtn: !!logoutBtn
    });
    
    if (!loginOverlay || !adminPanel || !loginBtn || !adminPass) {
        console.error('필수 요소를 찾을 수 없습니다.');
        alert('페이지 로드 오류: 필수 요소를 찾을 수 없습니다.');
        return;
    }

    setupEventListeners();

    checkLoginStatus();

    try {
        await initializeFirebase();
    } catch (error) {
        console.log('Firebase 초기화 실패:', error);
        console.log('오프라인 모드로 실행됩니다.');
    }
});

async function initializeFirebase() {
    try {
        const { db: firebaseDb, storage: firebaseStorage } = await import('./firebase.js');
        db = firebaseDb;
        storage = firebaseStorage;
        console.log('Firebase 초기화 성공');
        return true;
    } catch (error) {
        console.log('Firebase 모듈 로드 실패:', error);
        return false;
    }
}

function setupEventListeners() {
    console.log('이벤트 리스너 설정 시작');

    if (loginBtn) {
        console.log('로그인 버튼 이벤트 리스너 추가');
 
        loginBtn.replaceWith(loginBtn.cloneNode(true));
        loginBtn = document.getElementById("login-btn");
        
        loginBtn.addEventListener('click', function(e) {
            console.log('로그인 버튼 클릭됨');
            e.preventDefault();
            e.stopPropagation();
            handleLogin();
        });
    } else {
        console.error('로그인 버튼을 찾을 수 없습니다');
    }

    if (adminPass) {
        console.log('패스워드 입력 필드 이벤트 리스너 추가');
        
        adminPass.addEventListener('keydown', function(e) {
            console.log('키 입력:', e.key);
            if (e.key === 'Enter') {
                console.log('엔터키 감지');
                e.preventDefault();
                handleLogin();
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }

    const navBtns = document.querySelectorAll('.nav-btn:not(.logout)');
    console.log('네비게이션 버튼 개수:', navBtns.length);
    navBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const tab = e.target.dataset.tab;
            if (tab) switchTab(tab);
        });
    });

    setupUploadEvents();

    setupFilterEvents();
}

function setupUploadEvents() {
    const uploadToggle = document.getElementById('upload-toggle');
    const uploadSection = document.getElementById('upload-section');
    const cancelUpload = document.getElementById('cancel-upload');
    const uploadForm = document.getElementById('upload-form');
    
    if (uploadToggle && uploadSection) {
        uploadToggle.addEventListener('click', function() {
            const isHidden = uploadSection.style.display === 'none' || !uploadSection.style.display;
            uploadSection.style.display = isHidden ? 'block' : 'none';
        });
    }
    
    if (cancelUpload && uploadSection) {
        cancelUpload.addEventListener('click', function() {
            uploadSection.style.display = 'none';
            if (uploadForm) uploadForm.reset();
        });
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
        refreshBookings.addEventListener('click', function() {
            loadBookings();
        });
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

function handleLogin() {
    console.log('handleLogin 함수 실행');
    
    if (!adminPass) {
        console.error('패스워드 입력 필드를 찾을 수 없습니다');
        showNotification('패스워드 입력 필드를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const password = adminPass.value.trim();
    console.log('입력된 패스워드 길이:', password.length);
    
    if (!password) {
        console.log('빈 패스워드');
        showNotification('비밀번호를 입력해주세요.', 'error');
        adminPass.focus();
        return;
    }


    setLoginButtonLoading(true);
    
    setTimeout(() => {
        if (password === '0920') {
            console.log('올바른 패스워드');

            isLoggedIn = true;
            sessionStorage.setItem('admin_logged_in', 'true');

            if (loginOverlay) {
                loginOverlay.style.display = 'none';
            }
            
            if (adminPanel) {
                adminPanel.style.display = 'block';
            }

            showNotification('로그인 성공!', 'success');
            setTimeout(() => {
                loadDashboard();
            }, 500);
            
        } else {
            console.log('잘못된 패스워드');
            showNotification('비밀번호가 틀렸습니다.', 'error');
            adminPass.value = '';
            adminPass.focus();
        }

        setLoginButtonLoading(false);
    }, 300);
}

function setLoginButtonLoading(isLoading) {
    if (!loginBtn) return;
    
    const btnText = loginBtn.querySelector('.btn-text');
    const loading = loginBtn.querySelector('.loading');
    
    if (isLoading) {
        loginBtn.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (loading) {
            loading.style.display = 'inline-block';
        } else {
            loginBtn.innerHTML = '<span class="btn-text">로그인 중...</span>';
        }
        loginBtn.style.opacity = '0.7';
        loginBtn.style.cursor = 'not-allowed';
    } else {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span class="btn-text">로그인</span><div class="loading" style="display: none;"></div>';
        loginBtn.style.opacity = '1';
        loginBtn.style.cursor = 'pointer';
    }
}

function handleLogout() {
    console.log('로그아웃 실행');
    
    isLoggedIn = false;
    sessionStorage.removeItem('admin_logged_in');
    
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
    }
    
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    
    if (adminPass) {
        adminPass.value = '';
        adminPass.focus();
    }
    
    showNotification('로그아웃되었습니다.', 'success');
}

function checkLoginStatus() {
    console.log('로그인 상태 확인');
    
    const logged = sessionStorage.getItem('admin_logged_in');
    console.log('저장된 로그인 상태:', logged);
    
    if (logged === 'true') {
        console.log('이미 로그인됨');
        isLoggedIn = true;
        
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (adminPanel) adminPanel.style.display = 'block';
        
        setTimeout(() => {
            loadDashboard();
        }, 100);
    } else {
        console.log('로그인 필요');
        if (loginOverlay) loginOverlay.style.display = 'flex';
        if (adminPanel) adminPanel.style.display = 'none';
        if (adminPass) adminPass.focus();
    }
}

function switchTab(tabName) {
    console.log('탭 전환:', tabName);

    document.querySelectorAll('.nav-btn:not(.logout)').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

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
    console.log('대시보드 로드 시작');
    
    try {
        let stats = {
            'total-bookings': '0',
            'total-gallery': '0',
            'total-reviews': '0',
            'today-bookings': '0'
        };

        if (db) {
            console.log('Firebase 연결됨 - 실제 데이터 로드');
            const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
            
            try {
                const bookingsSnapshot = await getDocs(collection(db, "bookings"));
                stats['total-bookings'] = bookingsSnapshot.size;

                const gallerySnapshot = await getDocs(collection(db, "gallery"));
                stats['total-gallery'] = gallerySnapshot.size;

                const reviewsSnapshot = await getDocs(collection(db, "reviews"));
                stats['total-reviews'] = reviewsSnapshot.size;

                const today = new Date().toISOString().split('T')[0];
                const todayQuery = query(collection(db, "bookings"), where("date", "==", today));
                const todaySnapshot = await getDocs(todayQuery);
                stats['today-bookings'] = todaySnapshot.size;

                await loadRecentBookings();
            } catch (firebaseError) {
                console.log('Firebase 데이터 로드 실패:', firebaseError);
                
            }
        } else {
            console.log('Firebase 미연결 - 더미 데이터 표시');
            stats = {
                'total-bookings': '12',
                'total-gallery': '8',
                'total-reviews': '15',
                'today-bookings': '3'
            };
        }

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        console.log('대시보드 로드 완료');

    } catch (error) {
        console.error('대시보드 로드 실패:', error);
        showNotification('대시보드 데이터 로드에 실패했습니다.', 'error');
    }
}

async function loadRecentBookings() {
    const recentBookings = document.getElementById('recent-bookings');
    if (!recentBookings) return;
    
    if (!db) {
        recentBookings.innerHTML = '<p style="text-align: center; color: #718096;">Firebase 연결 후 데이터가 표시됩니다.</p>';
        return;
    }

    try {
        const { collection, getDocs, query, orderBy, limit } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(
            collection(db, "bookings"), 
            orderBy("createdAt", "desc"), 
            limit(5)
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
            
            const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
            const timeString = createdAt.toLocaleDateString('ko-KR');

            const servicesText = data.services && data.services.length > 0 ? 
                ` | 💅 ${data.services.join(', ')}` : '';

            const notesText = data.notes ? ` | 📝 ${data.notes.substring(0, 30)}${data.notes.length > 30 ? '...' : ''}` : '';

            item.innerHTML = `
                <div class="recent-item-header">
                    <span class="recent-item-name">${data.name}</span>
                    <span class="recent-item-time">${timeString}</span>
                </div>
                <div class="recent-item-details">
                    📅 ${data.date} ${data.time} | 📞 ${data.phone}${servicesText}${notesText}
                </div>
            `;
            recentBookings.appendChild(item);
        });

    } catch (error) {
        console.error('최근 예약 로드 실패:', error);
        recentBookings.innerHTML = '<p style="text-align: center; color: #ef4444;">데이터 로드 실패</p>';
    }
}

async function loadBookings() {
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;

    if (!db) {
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
                Firebase 연결 후 예약 데이터가 표시됩니다.
            </div>
        `;
        return;
    }

    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        let q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
        
        const dateFilter = document.getElementById('date-filter');
        if (dateFilter && dateFilter.value) {
            q = query(collection(db, "bookings"), where("date", "==", dateFilter.value), orderBy("createdAt", "desc"));
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
            const statusText = status === 'confirmed' ? '확정' : status === 'cancelled' ? '취소' : '대기';

            const services = data.services && data.services.length > 0 ? 
                data.services.join(', ') : '기본 케어';

            row.innerHTML = `
                <div>
                    <strong>${data.name}</strong>
                    ${data.notes ? `<br><small style="color: #666;">📝 ${data.notes}</small>` : ''}
                </div>
                <div>${data.phone}</div>
                <div>${data.date}<br>${data.time}</div>
                <div>${services}</div>
                <div><span class="status-badge ${statusClass}">${statusText}</span></div>
                <div>
                    <select onchange="updateBookingStatus('${doc.id}', this.value)" style="margin-bottom: 0.5rem;">
                        <option value="pending" ${status === 'pending' ? 'selected' : ''}>대기</option>
                        <option value="confirmed" ${status === 'confirmed' ? 'selected' : ''}>확정</option>
                        <option value="cancelled" ${status === 'cancelled' ? 'selected' : ''}>취소</option>
                    </select>
                    <br>
                    <button class="delete-btn" onclick="deleteBooking('${doc.id}')">삭제</button>
                </div>
            `;
            bookingsList.appendChild(row);
        });

    } catch (error) {
        console.error('예약 로드 실패:', error);
        showNotification('예약 데이터 로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadGallery() {
    const galleryList = document.getElementById('gallery-list');
    if (!galleryList) return;

    if (!db) {
        galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">Firebase 연결 후 갤러리 이미지가 표시됩니다.</div>';
        return;
    }

    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);

        galleryList.innerHTML = '';

        if (snapshot.empty) {
            galleryList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">갤러리 이미지가 없습니다.</div>';
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
        showNotification('갤러리 데이터 로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadReviews() {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    if (!db) {
        reviewsList.innerHTML = '<div style="text-align: center; padding: 2rem; color: #718096;">Firebase 연결 후 후기가 표시됩니다.</div>';
        return;
    }

    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const sortSelect = document.getElementById('review-sort');
        const sortValue = sortSelect ? sortSelect.value : 'newest';
        
        let orderDirection = sortValue === 'oldest' ? 'asc' : 'desc';

        const q = query(collection(db, "reviews"), orderBy('createdAt', orderDirection));
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
        showNotification('후기 데이터 로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleFileUpload(e) {
    e.preventDefault();
    
    if (!db || !storage) {
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

    if (file.size > 5 * 1024 * 1024) {
        showNotification('파일 크기는 5MB 이하여야 합니다.', 'error');
        return;
    }

    try {
        showLoading();

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

        showNotification('이미지가 성공적으로 업로드되었습니다!', 'success');
        
        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) uploadForm.reset();
        
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) uploadSection.style.display = 'none';

        loadGallery();

    } catch (error) {
        console.error('파일 업로드 실패:', error);
        showNotification('파일 업로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

window.updateBookingStatus = async function(bookingId, newStatus) {
    if (!db) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }

    try {
        const { doc, updateDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await updateDoc(doc(db, "bookings", bookingId), {
            status: newStatus
        });

        showNotification('예약 상태가 업데이트되었습니다.', 'success');
        loadBookings();

    } catch (error) {
        console.error('상태 업데이트 실패:', error);
        showNotification('상태 업데이트에 실패했습니다.', 'error');
    }
};

window.deleteBooking = async function(bookingId) {
    if (!db) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }

    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
        return;
    }

    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "bookings", bookingId));
        showNotification('예약이 삭제되었습니다.', 'success');
        loadBookings();

    } catch (error) {
        console.error('예약 삭제 실패:', error);
        showNotification('예약 삭제에 실패했습니다.', 'error');
    }
};

window.deleteGalleryItem = async function(docId, imageUrl) {
    if (!db || !storage) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }

    if (!confirm('정말로 이 이미지를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        const { ref, deleteObject } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js');

        await deleteDoc(doc(db, "gallery", docId));

        try {
            const imageRef = ref(storage, imageUrl);
            await deleteObject(imageRef);
        } catch (storageError) {
            console.log('Storage 이미지 삭제 실패 (계속 진행):', storageError);
        }

        showNotification('이미지가 삭제되었습니다.', 'success');
        loadGallery();

    } catch (error) {
        console.error('이미지 삭제 실패:', error);
        showNotification('이미지 삭제에 실패했습니다.', 'error');
    }
};

window.deleteReview = async function(reviewId) {
    if (!db) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }

    if (!confirm('정말로 이 후기를 삭제하시겠습니까?')) {
        return;
    }

    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "reviews", reviewId));
        showNotification('후기가 삭제되었습니다.', 'success');
        loadReviews();

    } catch (error) {
        console.error('후기 삭제 실패:', error);
        showNotification('후기 삭제에 실패했습니다.', 'error');
    }
};

function showNotification(message, type = 'success') {
    console.log('알림 표시:', message, type);
    
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }

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
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '0.9rem',
        maxWidth: '300px',
        animation: 'slideInRight 0.3s ease'
    });
    
    if (type === 'success') {
        notification.style.background = '#10b981';
    } else if (type === 'error') {
        notification.style.background = '#ef4444';
    } else {
        notification.style.background = '#6366f1';
    }
    
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 3000);

    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

function showLoading() {
    const existing = document.querySelector('.loading-overlay');
    if (existing) return;

    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = '<div class="loading-spinner"></div>';
    
    document.body.appendChild(loadingOverlay);
}

function hideLoading() {
    const loadingOverlay = document.querySelector('.loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}