 console.log('=== Firebase 연동 관리자 스크립트 시작 ===');

 
let db, storage;
let isLoggedIn = false;
let firebaseInitialized = false;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM 로드됨!');
    
 
    initializeAdmin();
 
    try {
        await initializeFirebase();
        console.log('✅ Firebase 초기화 성공!');
        firebaseInitialized = true;
 
        if (isLoggedIn) {
            loadRealDashboard();
        }
    } catch (error) {
        console.warn('⚠️ Firebase 초기화 실패 - 데모 모드로 계속:', error);
        firebaseInitialized = false;
    }
});

async function initializeFirebase() {
    try {
 
        const firebaseModule = await import('./firebase.js');
        db = firebaseModule.db;
        storage = firebaseModule.storage;
        
        console.log('Firebase DB:', db);
        console.log('Firebase Storage:', storage);
        
        if (!db || !storage) {
            throw new Error('Firebase 객체를 찾을 수 없습니다');
        }
        
        return true;
    } catch (error) {
        console.error('Firebase 모듈 로드 실패:', error);
        throw error;
    }
}

function initializeAdmin() {
    console.log('관리자 초기화 시작');
    
    const loginOverlay = document.getElementById('login-overlay');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const adminPass = document.getElementById('admin-pass');
    const logoutBtn = document.getElementById('logout-btn');
    
    console.log('요소 찾기 결과:');
    console.log('- 로그인 오버레이:', loginOverlay ? '✅' : '❌');
    console.log('- 관리자 패널:', adminPanel ? '✅' : '❌');
    console.log('- 로그인 버튼:', loginBtn ? '✅' : '❌');
    console.log('- 비밀번호 입력:', adminPass ? '✅' : '❌');
    console.log('- 로그아웃 버튼:', logoutBtn ? '✅' : '❌');
    
    if (!loginOverlay || !adminPanel || !loginBtn || !adminPass) {
        console.error('❌ 필수 요소를 찾을 수 없습니다!');
        alert('페이지 로드 오류: 필수 요소를 찾을 수 없습니다.');
        return;
    }
    
    console.log('✅ 모든 요소를 찾았습니다!');
    
    checkLoginStatus(loginOverlay, adminPanel);
    setupEvents(loginBtn, adminPass, logoutBtn, loginOverlay, adminPanel);
}

function checkLoginStatus(loginOverlay, adminPanel) {
    console.log('로그인 상태 확인 중...');
    
    const savedLogin = sessionStorage.getItem('admin_logged_in');
    console.log('저장된 로그인 상태:', savedLogin);
    
    if (savedLogin === 'true') {
        console.log('이미 로그인됨 - 관리자 패널 표시');
        isLoggedIn = true;
        showAdminPanel(loginOverlay, adminPanel);
 
        if (firebaseInitialized) {
            loadRealDashboard();
        } else {
            loadDemoDashboard();
        }
    } else {
        console.log('로그인 필요 - 로그인 화면 표시');
        showLoginScreen(loginOverlay, adminPanel);
    }
}

function setupEvents(loginBtn, adminPass, logoutBtn, loginOverlay, adminPanel) {
    console.log('이벤트 설정 시작...');
 
    if (loginBtn) {
        loginBtn.onclick = function(e) {
            console.log('🔥 로그인 버튼 클릭됨!');
            e.preventDefault();
            handleLogin(adminPass, loginOverlay, adminPanel);
        };
    }
 
    if (adminPass) {
        adminPass.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                console.log('🔥 엔터키 감지!');
                e.preventDefault();
                handleLogin(adminPass, loginOverlay, adminPanel);
            }
        });
    }
   
    if (logoutBtn) {
        logoutBtn.onclick = function(e) {
            console.log('🔥 로그아웃 버튼 클릭됨!');
            e.preventDefault();
            handleLogout(loginOverlay, adminPanel, adminPass);
        };
    }
    
    setupNavigation();
    setupUploadEvents();
    setupFilterEvents();
    
    console.log('✅ 모든 이벤트 설정 완료!');
}

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn:not(.logout)');
    console.log('네비게이션 버튼 개수:', navBtns.length);
    
    navBtns.forEach(function(btn) {
        btn.onclick = function() {
            const tab = btn.dataset.tab;
            console.log('탭 전환:', tab);
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
    console.log('🔐 로그인 처리 시작');
    
    const password = adminPass.value.trim();
    console.log('입력된 비밀번호 길이:', password.length);
    
    if (!password) {
        showNotification('비밀번호를 입력해주세요.', 'error');
        adminPass.focus();
        return;
    }
    
    if (password === '0920') {
        console.log('✅ 올바른 비밀번호!');
        
        isLoggedIn = true;
        sessionStorage.setItem('admin_logged_in', 'true');
        
        showNotification('로그인 성공! 🎉', 'success');
        showAdminPanel(loginOverlay, adminPanel);
         
        if (firebaseInitialized) {
            loadRealDashboard();
        } else {
            loadDemoDashboard();
        }
        
    } else {
        console.log('❌ 잘못된 비밀번호');
        showNotification('비밀번호가 틀렸습니다.', 'error');
        adminPass.value = '';
        adminPass.focus();
    }
}

function handleLogout(loginOverlay, adminPanel, adminPass) {
    console.log('🚪 로그아웃 처리');
    
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
 

async function loadRealDashboard() {
    console.log('🔥 실제 Firebase 데이터로 대시보드 로드');
    
    if (!firebaseInitialized) {
        loadDemoDashboard();
        return;
    }
    
    try {
        showLoading();
        
        const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
     
        const stats = {
            'total-bookings': 0,
            'total-gallery': 0,
            'total-reviews': 0,
            'today-bookings': 0
        };
      
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

        Object.entries(stats).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        await loadRecentBookings();
        
        showNotification('📊 실제 데이터로 대시보드가 업데이트되었습니다!', 'success');
        
    } catch (error) {
        console.error('실제 대시보드 로드 실패:', error);
        showNotification('데이터 로드 중 오류가 발생했습니다.', 'error');
        loadDemoDashboard();
    } finally {
        hideLoading();
    }
}

async function loadRecentBookings() {
    if (!firebaseInitialized) return;
    
    const recentBookings = document.getElementById('recent-bookings');
    if (!recentBookings) return;
    
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
            

            const notesText = data.notes ? 
                ` | 📝 ${data.notes.substring(0, 30)}${data.notes.length > 30 ? '...' : ''}` : '';
            
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
    console.log('📅 예약 데이터 로드');
    
    const bookingsList = document.getElementById('bookings-list');
    if (!bookingsList) return;
    
    if (!firebaseInitialized) {
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
                Firebase 연결 후 실제 예약 데이터가 표시됩니다.
            </div>
        `;
        return;
    }
    
    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy, where } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        let q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
        
        const dateFilter = document.getElementById('date-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (dateFilter && dateFilter.value) {
            q = query(
                collection(db, "bookings"), 
                where("date", "==", dateFilter.value), 
                orderBy("createdAt", "desc")
            );
        }
        
        if (statusFilter && statusFilter.value) {

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
        
        let filteredCount = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            
            if (statusFilter && statusFilter.value && data.status !== statusFilter.value) {
                return;
            }
            
            filteredCount++;
            
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
        
        if (filteredCount === 0) {
            bookingsList.innerHTML += '<div style="text-align: center; padding: 2rem; color: #718096;">필터 조건에 맞는 예약이 없습니다.</div>';
        }
        
    } catch (error) {
        console.error('예약 로드 실패:', error);
        showNotification('예약 데이터 로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}

async function loadGallery() {
    console.log('🖼️ 갤러리 데이터 로드');
    
    const galleryList = document.getElementById('gallery-list');
    if (!galleryList) return;
    
    if (!firebaseInitialized) {
        galleryList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #718096; grid-column: 1 / -1;">
                <h3>갤러리 관리</h3>
                <p>Firebase 연결 후 이미지 업로드 및 관리가 가능합니다.</p>
                <p>현재는 데모 모드입니다.</p>
            </div>
        `;
        return;
    }
    
    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const q = query(collection(db, "gallery"), orderBy("createdAt", "desc"));
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
    console.log('💬 후기 데이터 로드');
    
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;
    
    if (!firebaseInitialized) {
        reviewsList.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #718096;">
                <h3>후기 관리</h3>
                <p>Firebase 연결 후 후기 데이터가 표시됩니다.</p>
                <p>현재는 데모 모드입니다.</p>
            </div>
        `;
        return;
    }
    
    try {
        showLoading();
        
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        const sortSelect = document.getElementById('review-sort');
        const sortValue = sortSelect ? sortSelect.value : 'newest';
        
        let orderField = 'createdAt';
        let orderDirection = 'desc';
        
        if (sortValue === 'oldest') {
            orderDirection = 'asc';
        }
        
        const q = query(collection(db, "reviews"), orderBy(orderField, orderDirection));
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
        
        showNotification('✅ 이미지가 성공적으로 업로드되었습니다!', 'success');
        

        const uploadForm = document.getElementById('upload-form');
        if (uploadForm) uploadForm.reset();
        
        const uploadSection = document.getElementById('upload-section');
        if (uploadSection) uploadSection.style.display = 'none';
 
        loadGallery();
        
        if (firebaseInitialized) {
            loadRealDashboard();
        }
        
    } catch (error) {
        console.error('파일 업로드 실패:', error);
        showNotification('파일 업로드에 실패했습니다.', 'error');
    } finally {
        hideLoading();
    }
}


function loadDemoDashboard() {
    console.log('📊 데모 데이터로 대시보드 로드');
    
    const stats = {
        'total-bookings': '?',
        'total-gallery': '?',
        'total-reviews': '?',
        'today-bookings': '?'
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
                <h4>🔗 Firebase 연결 필요</h4>
                <p>실제 예약 데이터를 보려면 Firebase가 연결되어야 합니다.</p>
                <p>현재는 데모 모드입니다.</p>
            </div>
        `;
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
        
        showNotification('✅ 예약 상태가 업데이트되었습니다.', 'success');
        
        loadBookings();
        if (firebaseInitialized) {
            loadRealDashboard();
        }
        
    } catch (error) {
        console.error('상태 업데이트 실패:', error);
        showNotification('상태 업데이트에 실패했습니다.', 'error');
    }
};

window.deleteBooking = async function(bookingId) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 예약을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "bookings", bookingId));
        showNotification('✅ 예약이 삭제되었습니다.', 'success');
        
        loadBookings();
        if (firebaseInitialized) {
            loadRealDashboard();
        }
        
    } catch (error) {
        console.error('예약 삭제 실패:', error);
        showNotification('예약 삭제에 실패했습니다.', 'error');
    }
};

window.deleteGalleryItem = async function(docId, imageUrl) {
    if (!firebaseInitialized) {
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
        
        showNotification('✅ 이미지가 삭제되었습니다.', 'success');

        loadGallery();
        if (firebaseInitialized) {
            loadRealDashboard();
        }
        
    } catch (error) {
        console.error('이미지 삭제 실패:', error);
        showNotification('이미지 삭제에 실패했습니다.', 'error');
    }
};

window.deleteReview = async function(reviewId) {
    if (!firebaseInitialized) {
        showNotification('Firebase 연결이 필요합니다.', 'error');
        return;
    }
    
    if (!confirm('정말로 이 후기를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js');
        
        await deleteDoc(doc(db, "reviews", reviewId));
        showNotification('✅ 후기가 삭제되었습니다.', 'success');
   
        loadReviews();
        if (firebaseInitialized) {
            loadRealDashboard();
        }
        
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
        maxWidth: '350px',
        animation: 'slideInRight 0.3s ease',
        cursor: 'pointer',
        lineHeight: '1.4'
    });
    

    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
    }
    
    document.body.appendChild(notification);
    
    const duration = type === 'success' ? 4000 : 5000;
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, duration);
    
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


function showFirebaseStatus() {
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'firebase-status';
    statusIndicator.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        padding: 0.5rem 1rem;
        border-radius: 50px;
        font-size: 0.8rem;
        font-weight: 600;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transition: all 0.3s ease;
    `;
    
    if (firebaseInitialized) {
        statusIndicator.textContent = '🔗 Firebase 연결됨';
        statusIndicator.style.background = 'rgba(16, 185, 129, 0.9)';
        statusIndicator.style.color = 'white';
    } else {
        statusIndicator.textContent = '❌ Firebase 연결 안됨';
        statusIndicator.style.background = 'rgba(239, 68, 68, 0.9)';
        statusIndicator.style.color = 'white';
    }
    
    document.body.appendChild(statusIndicator);
    
    setTimeout(() => {
        if (statusIndicator.parentNode) {
            statusIndicator.remove();
        }
    }, 5000);
}

window.addEventListener('load', function() {
    setTimeout(showFirebaseStatus, 1000);
});

console.log('=== Firebase 연동 관리자 스크립트 로드 완료 ===');