import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2';

const supabaseUrl = 'https://kknhrvbgspfvohwqetuj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrbmhydmJnc3Bmdm9od3FldHVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU4MDUzMjQsImV4cCI6MjA1MTM4MTMyNH0.PZQqMUksaJSffzrm9jt1zzFWE5JCgSdJpb7n8WGMhw8';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('✅ Supabase 클라이언트 초기화 완료');

window.loadBookings = async (date = null) => {
  try {
    console.log('📅 예약 데이터 로드 중...', date ? `(날짜: ${date})` : '(전체)');
    
    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (date) {
      query = query.eq('date', date);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('예약 로드 에러:', error);
      throw error;
    }
    
    console.log('📅 예약 데이터 로드 완료:', data?.length || 0, '개');
    return data || [];
    
  } catch (error) {
    console.error('예약 로드 실패:', error);
    throw error;
  }
};

window.addBooking = async (bookingData) => {
  try {
    console.log('📝 예약 추가 중...', bookingData);
    
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select();
    
    if (error) {
      console.error('예약 추가 에러:', error);
      throw error;
    }
    
    console.log('✅ 예약 추가 완료:', data);
    return data[0];
    
  } catch (error) {
    console.error('예약 추가 실패:', error);
    throw error;
  }
};

window.updateBookingStatus = async (id, status) => {
  try {
    console.log('🔄 예약 상태 업데이트:', id, '→', status);
    
    const { data, error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('예약 상태 업데이트 에러:', error);
      throw error;
    }
    
    console.log('✅ 예약 상태 업데이트 완료:', data);
    return data[0];
    
  } catch (error) {
    console.error('예약 상태 업데이트 실패:', error);
    throw error;
  }
};

window.loadGalleryImages = async () => {
  try {
    console.log('🖼️ 갤러리 데이터 로드 중...');
    
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('갤러리 로드 에러:', error);
      throw error;
    }
    
    console.log('🖼️ 갤러리 데이터 로드 완료:', data?.length || 0, '개');
    return data || [];
    
  } catch (error) {
    console.error('갤러리 로드 실패:', error);
    throw error;
  }
};

window.addGalleryImage = async (imageData) => {
  try {
    console.log('📸 갤러리 이미지 추가 중...', imageData);
    
    const { data, error } = await supabase
      .from('gallery')
      .insert([imageData])
      .select();
    
    if (error) {
      console.error('갤러리 이미지 추가 에러:', error);
      throw error;
    }
    
    console.log('✅ 갤러리 이미지 추가 완료:', data);
    return data[0];
    
  } catch (error) {
    console.error('갤러리 이미지 추가 실패:', error);
    throw error;
  }
};

window.loadReviews = async (sortBy = 'newest', limit = null) => {
  try {
    console.log('💬 리뷰 데이터 로드 중...', { sortBy, limit });
    
    let query = supabase.from('reviews').select('*');
    
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
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
 
    if (limit && limit > 0) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('리뷰 로드 에러:', error);
      throw error;
    }
    
    console.log('💬 리뷰 데이터 로드 완료:', data?.length || 0, '개');
    console.log('리뷰 데이터 샘플:', data?.[0]);
    return data || [];
    
  } catch (error) {
    console.error('리뷰 로드 실패:', error);
    throw error;
  }
};

window.addReview = async (reviewData) => {
  try {
    console.log('📝 리뷰 추가 중...', reviewData);
    
    const { data, error } = await supabase
      .from('reviews')
      .insert([reviewData])
      .select();
    
    if (error) {
      console.error('리뷰 추가 에러:', error);
      throw error;
    }
    
    console.log('✅ 리뷰 추가 완료:', data);
    return data[0];
    
  } catch (error) {
    console.error('리뷰 추가 실패:', error);
    throw error;
  }
};

window.deleteRecord = async (table, id) => {
  try {
    console.log('🗑️ 데이터 삭제 중...', { table, id });
    
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('데이터 삭제 에러:', error);
      throw error;
    }
    
    console.log('✅ 데이터 삭제 완료:', data);
    return data;
    
  } catch (error) {
    console.error('데이터 삭제 실패:', error);
    throw error;
  }
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

async function testConnection() {
  try {
    console.log('🧪 Supabase 연결 테스트 중...');
    
    const { data, error } = await supabase
      .from('reviews')
      .select('count', { count: 'exact', head: true });
    
    if (error) throw error;
    
    console.log('✅ Supabase 연결 테스트 성공!');
    return true;
    
  } catch (error) {
    console.error('❌ Supabase 연결 테스트 실패:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  testConnection();
});

console.log('🚀 Supabase 연동 시스템 로드 완료!');