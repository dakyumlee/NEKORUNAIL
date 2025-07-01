const SUPABASE_URL = 'https://erxxsytwhapgmoyepber.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyeHhzeXR3aGFwZ21veWVwYmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzNzA3MDEsImV4cCI6MjA2Njk0NjcwMX0.qNQx04OHqt-kpqUE4yK9Kb1A1YWZRbGHIQ7rsW574_Q'

let supabase = null;

async function initSupabase() {
  if (supabase) return supabase;
  
  try {
    const { createClient } = await import('https://cdn.skypack.dev/@supabase/supabase-js@2');
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase 초기화 완료');
    return supabase;
  } catch (error) {
    console.error('❌ Supabase 초기화 실패:', error);
    throw error;
  }
}

window.loadBookings = async (date = null) => {
  try {
    const client = await initSupabase();
    let query = client.from('bookings').select('*').order('created_at', { ascending: false });
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Booking load error:', error);
      return [];
    }
    
    console.log('예약 데이터:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('예약 로드 실패:', error);
    return [];
  }
};

window.addBooking = async (bookingData) => {
  try {
    const client = await initSupabase();
    const { data, error } = await client
      .from('bookings')
      .insert([{
        ...bookingData,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Booking add error:', error);
      throw error;
    }
    return data[0];
  } catch (error) {
    console.error('예약 추가 실패:', error);
    throw error;
  }
};

window.loadGalleryImages = async () => {
  try {
    const client = await initSupabase();
    const { data, error } = await client
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Gallery load error:', error);
      return [];
    }
    
    console.log('갤러리 데이터:', data);
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('갤러리 로드 실패:', error);
    return [];
  }
};

window.addGalleryImage = async (imageData) => {
  try {
    const client = await initSupabase();
    const { data, error } = await client
      .from('gallery')
      .insert([{
        ...imageData,
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (error) {
      console.error('Gallery add error:', error);
      throw error;
    }
    return data[0];
  } catch (error) {
    console.error('갤러리 추가 실패:', error);
    throw error;
  }
};

window.loadReviews = async (sortBy = 'newest', limit = null) => {
  try {
    console.log('리뷰 로드 시작:', { sortBy, limit });
    const client = await initSupabase();
    let query = client.from('reviews').select('*');
    
    switch (sortBy) {
      case 'oldest':
        query = query.order('created_at', { ascending: true });
        break;
      case 'highest':
        query = query.order('rating', { ascending: false });
        break;
      case 'lowest':
        query = query.order('rating', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }
    
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Reviews load error:', error);
      return [];
    }
    
    console.log('리뷰 데이터:', data);
    const result = Array.isArray(data) ? data : [];
    console.log('반환할 리뷰 배열:', result, '길이:', result.length);
    return result;
  } catch (error) {
    console.error('리뷰 로드 실패:', error);
    return [];
  }
};

window.addReview = async (reviewData) => {
  try {
    const client = await initSupabase();
    
    const cleanData = {
      name: String(reviewData.name || '익명'),
      content: String(reviewData.content || ''),
      rating: parseInt(reviewData.rating) || 5,
      image_url: reviewData.image_url || null,
      created_at: new Date().toISOString()
    };
    
    console.log('추가할 리뷰 데이터:', cleanData);
    
    const { data, error } = await client
      .from('reviews')
      .insert([cleanData])
      .select();
    
    if (error) {
      console.error('Review add error:', error);
      throw new Error(`리뷰 추가 실패: ${error.message}`);
    }
    
    console.log('리뷰 추가 성공:', data);
    return data[0];
  } catch (error) {
    console.error('리뷰 추가 실패:', error);
    throw error;
  }
};

window.deleteRecord = async (table, id) => {
  try {
    const client = await initSupabase();
    const { error } = await client
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
    return true;
  } catch (error) {
    console.error('삭제 실패:', error);
    throw error;
  }
};

window.updateBookingStatus = async (id, status) => {
  try {
    const client = await initSupabase();
    const { data, error } = await client
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Status update error:', error);
      throw error;
    }
    return data[0];
  } catch (error) {
    console.error('상태 업데이트 실패:', error);
    throw error;
  }
};

window.showNotification = function(message, type = 'success') {
  console.log('알림:', message, type);
  
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

initSupabase().then(() => {
  console.log('Supabase 준비 완료');
}).catch(error => {
  console.error('Supabase 초기화 오류:', error);
});

console.log('Supabase 클라이언트 로드 완료');