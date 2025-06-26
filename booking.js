document.addEventListener("DOMContentLoaded", () => {
  console.log('예약 페이지 로드 완료');
  
  const form = document.getElementById("reserve-form");
  
  function getLocalBookings() {
    const stored = localStorage.getItem('nekorunail_bookings');
    return stored ? JSON.parse(stored) : [];
  }
  
  function saveLocalBooking(bookingData) {
    const bookings = getLocalBookings();
    bookings.unshift(bookingData); 
    localStorage.setItem('nekorunail_bookings', JSON.stringify(bookings));
  }
  
  function checkTimeSlotAvailable(date, time) {
    const bookings = getLocalBookings();
    return !bookings.some(booking => 
      booking.date === date && 
      booking.time === time && 
      booking.status !== 'cancelled'
    );
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const date = document.getElementById("date").value;
      const timeInputs = document.querySelectorAll('input[name="time"]:checked');
      const time = timeInputs.length > 0 ? timeInputs[0].value : '';
      
      const serviceInputs = document.querySelectorAll('input[name="services"]:checked');
      const services = Array.from(serviceInputs).map(input => input.value);

      const notes = document.getElementById("notes").value.trim();

      console.log('입력값 확인:', { name, phone, date, time, services, notes });

      if (!name || !phone || !date || !time) {
        alert("모든 필수 정보를 입력해주세요.");
        return;
      }

      if (!checkTimeSlotAvailable(date, time)) {
        alert("⚠️ 해당 날짜와 시간에는 이미 예약이 존재합니다.\n다른 시간대를 선택해주세요.");
        return;
      }

      try {
        const bookingData = {
          id: Date.now(),
          name,
          phone,
          date,
          time,
          services: services.length > 0 ? services : ['기본 케어'],
          notes: notes || '',
          status: 'pending',
          createdAt: new Date().toISOString()
        };

        console.log('예약 데이터 저장 시작:', bookingData);
        
        saveLocalBooking(bookingData);

        console.log('예약 저장 완료!');
        
        const servicesText = services.length > 0 ? services.join(', ') : '기본 케어';
        alert(`✅ 예약 완료!\n\n👤 ${name}\n📞 ${phone}\n📅 ${date} ${time}\n💅 ${servicesText}\n\n곧 확인 연락을 드릴 예정입니다!`);
        
        form.reset();
        
      } catch (err) {
        console.error("예약 실패:", err);
        alert("예약 처리 중 오류가 발생했습니다: " + err.message);
      }
    });
  }
  
  console.log('예약 시스템 초기화 완료');
});