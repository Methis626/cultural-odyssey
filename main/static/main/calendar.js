// ============================
// 📅 DÜZENLENMİŞ calendar.js
// ============================
document.addEventListener('DOMContentLoaded', () => {
  const API_KEY = "e50iTUdlVTCI4KIicURyfRUEbM7zHc2Z";
  const monthNames = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let country = 'US';
  let isCalendarInitialized = false;

  // — DOM elemanları (opsiyonel chaining ile null‐guard)
  const yearDisplay     = document.getElementById('year-display');
  const monthList       = document.getElementById('month-list');
  const monthYearEl     = document.getElementById('month-year');
  const prevYearBtn     = document.getElementById('prev-year');
  const nextYearBtn     = document.getElementById('next-year');
  const countrySelect   = document.getElementById('country-select');
  const calendarGrid    = document.getElementById('calendar-grid');
  const eventDate       = document.getElementById('event-date');
  const eventList       = document.getElementById('event-list');
  const tabContentBox   = document.getElementById('tab-content-box');

  // Eğer temel elemanlar yoksa takvimi hiç başlatma
  if (!yearDisplay || !monthList || !monthYearEl || !prevYearBtn ||
      !nextYearBtn  || !countrySelect || !calendarGrid ||
      !eventDate    || !eventList   || !tabContentBox) {
    console.warn('⚠️ calendar.js: eksik DOM elemanı, takvim init atlandı.');
    return;
  }

  // Yılları, ay listesini ve event listener’ları kuran init fonksiyonu
  function initCalendar() {
    if (isCalendarInitialized) return;
    // Yıl gösterimi
    yearDisplay.textContent = currentYear;
    // Ay listesi
    monthList.innerHTML = '';
    monthNames.forEach((name, idx) => {
      const li = document.createElement('li');
      li.textContent = name;
      if (idx === currentMonth) li.classList.add('active');
      li.addEventListener('click', () => {
        currentMonth = idx;
        renderCalendar();
      });
      monthList.appendChild(li);
    });
    // Yıl değiştir butonları
    prevYearBtn.addEventListener('click', () => {
      currentYear--;
      yearDisplay.textContent = currentYear;
      renderCalendar();
    });
    nextYearBtn.addEventListener('click', () => {
      currentYear++;
      yearDisplay.textContent = currentYear;
      renderCalendar();
    });
    // Ülke seçimi
    fetch(`https://calendarific.com/api/v2/countries?api_key=${API_KEY}`)
      .then(r => r.json())
      .then(d => {
        countrySelect.innerHTML = d.response.countries.map(c => 
          `<option value="${c['iso-3166']}">${c.country_name} (${c['iso-3166']})</option>`
        ).join('');
        countrySelect.value = country;
      })
      .catch(console.error);
    countrySelect.addEventListener('change', () => {
      country = countrySelect.value;
      renderCalendar();
    });

    isCalendarInitialized = true;
  }

  // Tatilleri çek ve takvimi oluştur
  function renderCalendar() {
    // Ay/Yıl başlığı
    monthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    // Takvim ızgarasını temizle
    calendarGrid.innerHTML = '';
    // İlk gün offset
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    for (let i = 0; i < firstDay; i++) {
      calendarGrid.appendChild(document.createElement('div'));
    }
    // Ayın gün sayısı
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Tatilleri çek
    fetchHolidays(currentYear, currentMonth + 1)
      .then(holidays => {
        for (let d = 1; d <= daysInMonth; d++) {
          const cell = document.createElement('div');
          cell.textContent = d;
          cell.classList.add('day');
          const iso = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const todayHols = holidays.filter(h => h.date.iso === iso);
          if (todayHols.length) cell.classList.add('has-event');
          cell.addEventListener('click', () => showEvents(d, todayHols));
          calendarGrid.appendChild(cell);
        }
      })
      .catch(console.error);
  }

  function fetchHolidays(y, m) {
    return fetch(`https://calendarific.com/api/v2/holidays?api_key=${API_KEY}&country=${country}&year=${y}&month=${m}`)
      .then(r => r.json())
      .then(d => d.response.holidays || []);
  }

  function showEvents(day, holidays) {
    // Seçimi güncelle
    calendarGrid.querySelectorAll('.day.selected').forEach(e => e.classList.remove('selected'));
    const selectedCell = Array.from(calendarGrid.children)
      .find(c => c.textContent == day);
    if (selectedCell) selectedCell.classList.add('selected');

    // Event listesi
    eventDate.textContent = `${monthNames[currentMonth]} ${day}, ${currentYear}`;
    eventList.innerHTML = '';
    if (holidays.length) {
      holidays.forEach(h => {
        const li = document.createElement('li');
        li.textContent = h.name;
        eventList.appendChild(li);
      });
    } else {
      eventList.innerHTML = `<li>No events today, enjoy your free time! 😊</li>`;
    }
  }

  // Tab butonları ve otomatik “Takvim” sekmesini açma
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
      const tgt = document.getElementById(btn.dataset.target);
      if (tgt) tgt.style.display = 'block';
      if (btn.dataset.target === 'calendar-tab') {
        initCalendar();
        renderCalendar();
      }
    });
  });

  // Başlangıçta “Takvim” sekmesini gizle değil, gösterelim:
  tabContentBox.style.display = 'block';
  // Sizin template’deki Takvim butonunuzun ID’si “holidays-btn” ise:
  const calBtn = document.getElementById('holidays-btn')
               || document.querySelector('button[data-target="calendar-tab"]');
  if (calBtn) calBtn.click();
});
