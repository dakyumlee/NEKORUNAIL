import { db, storage } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  limit,
  startAfter
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-storage.js";

let lastVisible = null;
let isLoading = false;
let selectedRating = 0;
const REVIEWS_PER_PAGE = 10;

document.addEventListener("DOMContentLoaded", function() {
  console.log('DOM 로드 완료');
  
  setTimeout(() => {
    initializeStarRating();
    initializeOtherFeatures();
  }, 200);
});

function initializeStarRating() {
  console.log('별점 초기화 시작');
  
  const starRating = document.getElementById('star-rating');
  const ratingInput = document.getElementById('rating');
  const ratingText = document.querySelector('.rating-text');
  
  if (!starRating) {
    console.error('star-rating 요소를 찾을 수 없습니다');
    return;
  }
  
  starRating.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.setAttribute('data-rating', i);
    star.setAttribute('tabindex', '0');
    star.textContent = '⭐';
    star.style.cursor = 'pointer';
    star.style.fontSize = '2rem';
    star.style.opacity = '0.3';
    star.style.transition = 'all 0.2s ease';
    star.style.userSelect = 'none';
    star.style.display = 'inline-block';
    star.style.padding = '0.2rem';
    starRating.appendChild(star);
  }
  
  const stars = starRating.querySelectorAll('.star');
  console.log('생성된 별 개수:', stars.length);
  
  stars.forEach(function(star, index) {
    const rating = parseInt(star.getAttribute('data-rating'));
    
    function selectStar() {
      selectedRating = rating;
      if (ratingInput) ratingInput.value = rating;
      updateStars(stars, rating);
      updateRatingText(ratingText, rating);
      console.log('별점 설정됨:', rating);
    }
    
    star.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      selectStar();
    });

    star.addEventListener('touchend', function(e) {
      e.preventDefault();
      e.stopPropagation();
      selectStar();
    });
    
    star.addEventListener('mouseenter', function() {
      highlightStars(stars, rating);
    });
    
    star.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectStar();
      }
    });
  });

  starRating.addEventListener('mouseleave', function() {
    updateStars(stars, selectedRating);
  });
  
  console.log('별점 초기화 완료');
}

function highlightStars(stars, rating) {
  stars.forEach(function(star, index) {
    if (index < rating) {
      star.style.opacity = '0.8';
      star.style.transform = 'scale(1.15)';
    } else if (index < selectedRating) {
      star.style.opacity = '1';
      star.style.transform = 'scale(1.1)';
    } else {
      star.style.opacity = '0.3';
      star.style.transform = 'scale(1)';
    }
  });
}

function updateStars(stars, rating) {
  stars.forEach(function(star, index) {
    if (index < rating) {
      star.style.opacity = '1';
      star.style.transform = 'scale(1.1)';
    } else {
      star.style.opacity = '0.3';
      star.style.transform = 'scale(1)';
    }
  });
}

function updateRatingText(ratingText, rating) {
  if (!ratingText) return;
  
  const texts = [
    '별을 클릭하여 평점을 매겨주세요',
    '⭐ 별로예요',
    '⭐⭐ 그저 그래요',
    '⭐⭐⭐ 보통이에요',
    '⭐⭐⭐⭐ 좋아요',
    '⭐⭐⭐⭐⭐ 최고예요!'
  ];
  
  ratingText.textContent = texts[rating] || texts[0];
}

async function initializeOtherFeatures() {
  console.log('다른 기능들 초기화');
  
  const reviewForm = document.getElementById("review-form");
  const reviewsContainer = document.getElementById("reviews-container");
  const imageInput = document.getElementById("review-image");
  const imagePreview = document.getElementById("image-preview");
  const previewImg = document.getElementById("preview-img");
  const removeImageBtn = document.getElementById("remove-image");
  const sortSelect = document.getElementById("review-sort");
  const loadMoreBtn = document.getElementById("load-more-btn");

  setupImagePreview(imageInput, imagePreview, previewImg, removeImageBtn);

  try {
    await loadReviews(true, reviewsContainer, sortSelect);
  } catch (error) {
    console.error('초기 리뷰 로드 실패:', error);
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", async function() {
      lastVisible = null;
      await loadReviews(true, reviewsContainer, sortSelect);
    });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function() {
      loadReviews(false, reviewsContainer, sortSelect);
    });
  }

  if (reviewForm) {
    reviewForm.addEventListener("submit", async function(e) {
      e.preventDefault();
      await handleReviewSubmit();
    });
  }
}

function setupImagePreview(imageInput, imagePreview, previewImg, removeImageBtn) {
  if (!imageInput) return;
  
  imageInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("파일 크기는 5MB 이하여야 합니다.");
        imageInput.value = '';
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert("이미지 파일만 업로드 가능합니다.");
        imageInput.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = function(e) {
        if (previewImg) previewImg.src = e.target.result;
        if (imagePreview) imagePreview.style.display = 'block';
        const uploadArea = document.querySelector('.image-upload-area');
        if (uploadArea) uploadArea.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  if (removeImageBtn) {
    removeImageBtn.addEventListener("click", function() {
      imageInput.value = '';
      if (imagePreview) imagePreview.style.display = 'none';
      const uploadArea = document.querySelector('.image-upload-area');
      if (uploadArea) uploadArea.style.display = 'block';
    });
  }
}

async function handleReviewSubmit() {
  console.log('리뷰 제출 시작');
  
  const name = document.getElementById("reviewer").value.trim();
  const content = document.getElementById("review-content").value.trim();
  const rating = selectedRating;
  const imageInput = document.getElementById("review-image");
  const imageFile = imageInput ? imageInput.files[0] : null;
  
  console.log('입력값:', { name, content, rating });
  
  if (!name || !content) {
    alert("이름과 후기 내용을 입력해주세요.");
    return;
  }

  if (!rating || rating < 1 || rating > 5) {
    alert("별점을 선택해주세요.");
    return;
  }

  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn ? submitBtn.querySelector('.btn-text') : null;
  const loading = submitBtn ? submitBtn.querySelector('.loading') : null;

  try {
    if (btnText) btnText.style.display = 'none';
    if (loading) loading.style.display = 'block';
    if (submitBtn) submitBtn.disabled = true;

    let imageUrl = null;

    if (imageFile) {
      console.log('이미지 업로드 시작');
      const imageRef = ref(storage, `reviews/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
      console.log('이미지 업로드 완료:', imageUrl);
    }

    console.log('Firestore에 데이터 저장 시작');
    const docRef = await addDoc(collection(db, "reviews"), {
      name,
      content,
      rating,
      imageUrl,
      createdAt: serverTimestamp()
    });
    
    console.log('문서 저장 완료:', docRef.id);
    alert("후기가 등록되었습니다! 감사합니다 💖");

    resetForm();
    
    lastVisible = null;
    const reviewsContainer = document.getElementById("reviews-container");
    const sortSelect = document.getElementById("review-sort");
    await loadReviews(true, reviewsContainer, sortSelect);

  } catch (error) {
    console.error("후기 등록 실패:", error);
    alert("후기 등록 중 오류가 발생했습니다: " + error.message);
  } finally {
    if (btnText) btnText.style.display = 'block';
    if (loading) loading.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
  }
}

function resetForm() {

  const reviewForm = document.getElementById("review-form");
  if (reviewForm) reviewForm.reset();
  
  selectedRating = 0;
  const ratingInput = document.getElementById("rating");
  if (ratingInput) ratingInput.value = '';
  
  const stars = document.querySelectorAll('.star');
  updateStars(stars, 0);
  
  const ratingText = document.querySelector('.rating-text');
  updateRatingText(ratingText, 0);
  
  const imagePreview = document.getElementById("image-preview");
  if (imagePreview) imagePreview.style.display = 'none';
  
  const uploadArea = document.querySelector('.image-upload-area');
  if (uploadArea) uploadArea.style.display = 'block';
}

async function loadReviews(reset = false, reviewsContainer, sortSelect) {
  if (isLoading) return;
  isLoading = true;

  try {
    if (reset) {
      if (reviewsContainer) {
        reviewsContainer.innerHTML = '<div class="loading-reviews">후기를 불러오는 중...</div>';
      }
      lastVisible = null;
    }

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
    
    let q;
    if (lastVisible) {
      q = query(
        collection(db, "reviews"), 
        orderBy(orderField, orderDirection),
        startAfter(lastVisible),
        limit(REVIEWS_PER_PAGE)
      );
    } else {
      q = query(
        collection(db, "reviews"), 
        orderBy(orderField, orderDirection),
        limit(REVIEWS_PER_PAGE)
      );
    }

    const snapshot = await getDocs(q);

    if (reset && reviewsContainer) {
      reviewsContainer.innerHTML = '';
    }

    if (snapshot.empty && reset) {
      if (reviewsContainer) {
        reviewsContainer.innerHTML = `
          <div class="no-reviews">
            <p>아직 등록된 후기가 없습니다.</p>
            <p>첫 번째 후기를 남겨보세요! ✨</p>
          </div>
        `;
      }
      const loadMoreBtn = document.getElementById("load-more-btn");
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

    snapshot.forEach(function(doc) {
      const data = doc.data();
      const reviewBox = document.createElement("div");
      reviewBox.className = "review-box";
      
      const createdAt = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
      const dateString = createdAt.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const rating = data.rating || 5;
      const starsDisplay = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

      const imageHtml = data.imageUrl ? 
        `<div class="review-image-container">
           <img src="${data.imageUrl}" alt="후기 사진" class="review-image" onclick="openImageModal('${data.imageUrl}')" />
         </div>` : '';

      reviewBox.innerHTML = `
        <div class="review-header">
          <strong class="review-author">👤 ${data.name}</strong>
          <span class="review-date">📅 ${dateString}</span>
        </div>
        <div class="review-rating">${starsDisplay}</div>
        <div class="review-content">${data.content}</div>
        ${imageHtml}
      `;
      
      if (reviewsContainer) {
        reviewsContainer.appendChild(reviewBox);
      }
      lastVisible = doc;
    });

    const loadMoreBtn = document.getElementById("load-more-btn");
    if (loadMoreBtn) {
      if (snapshot.docs.length === REVIEWS_PER_PAGE) {
        loadMoreBtn.style.display = 'block';
      } else {
        loadMoreBtn.style.display = 'none';
      }
    }

  } catch (error) {
    console.error("후기 로드 실패:", error);
    if (reset && reviewsContainer) {
      reviewsContainer.innerHTML = `
        <div class="error-message">
          <p>후기를 불러오는데 실패했습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      `;
    }
  } finally {
    isLoading = false;
  }
}

window.openImageModal = function(imageUrl) {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <img src="${imageUrl}" alt="후기 사진 크게보기" />
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = function() {
    document.body.removeChild(modal);
  };
  
  modal.querySelector('.close-modal').onclick = closeModal;
  modal.onclick = function(e) {
    if (e.target === modal) closeModal();
  };
};