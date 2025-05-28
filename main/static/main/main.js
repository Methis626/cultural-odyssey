mapboxgl.accessToken = 'pk.eyJ1IjoibWV0aGlzIiwiYSI6ImNtNnM0OHg1ajA0ZXMyaXNkcml1enBvNHoifQ.KkPNkbPI9L0OqI2xslQI4A';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [29.0, 41.0],
  zoom: 2,
  projection: 'globe',
  interactive: true
});

map.on('load', () => {
  console.log('Harita yüklendi!');
  map.dragRotate.enable();
  map.touchZoomRotate.enable();
  map.doubleClickZoom.enable();
  map.scrollZoom.enable();
  map.dragPan.enable();
});

window.selectedCountryCode = null;

// Haritaya tıklanınca konum & yemek verilerini çekme
map.on('click', (e) => {
  const { lat, lng } = e.lngLat;

  // 1) Konum bilgilerini çek
  fetch(`/explore/get_location_info/?lat=${lat}&lng=${lng}`)
    .then(res => {
      if (!res.ok) throw new Error(`Location HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      // 2) Ekranı güncelleyen fonksiyonlar
      updateLocationInfo(data);
      window.selectedCountryCode = data.country_info?.iso2;
      console.log('Seçilen ülke kodu:', window.selectedCountryCode);
      updateWeatherInfo(data.weather || {});
      updateCulturalInfo(data.cultural?.religion);
      if (data.iso2 && window.updateCalendar) window.updateCalendar(data.iso2);
      if (window.loadPlaces) window.loadPlaces(lat, lng);

      // 3) Meşhur yemekleri ayrı başlıklarla çek ve göster
      const country  = data.location?.country;
      const city     = data.location?.city;
      updateFoods(country, city); // YENİ FONKSİYONUMUZ
    })
    .catch(err => {
      console.error('❌ Location verisi hatası:', err);
    });
});

// --- YENİ FONKSİYON: Meşhur yemekleri başlıklı şekilde göster ---
function updateFoods(country, city) {
  const foodList = document.querySelector('.famous-foods-list');
  if (!foodList || !country) return;

  foodList.innerHTML = '<li>foods are loading…</li>';
  const params = new URLSearchParams({ country });
  if (city) params.append('city', city);

  fetch(`/explore/get_food_info/?${params}`)
    .then(r => {
      if (!r.ok) throw new Error(`Food HTTP ${r.status}`);
      return r.json();
    })
    .then(json => {
      let html = '';

      // Türkiye'nin genel/top yemekleri (ilk başlık ve liste)
      if (json.top_foods && json.top_foods.length) {
        html += `
          <div class="food-section">
            <h4 style="color:#00ffff; margin-bottom:0.5rem;">Famous Dishes</h4>
            <ul>
              ${json.top_foods.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // Seçili şehir varsa, şehir yemekleri (ikinci başlık ve liste)
      if (json.city_foods && json.city_foods.length) {
        html += `
          <div class="food-section">
            <h4 style="color:#5ce1e6; margin-bottom:0.5rem;">🍽️ ${json.city_name} Şehrinin En Meşhur Yemekleri</h4>
            <ul>
              ${json.city_foods.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      foodList.innerHTML = html || '<li>Yemek bulunamadı.</li>';
    })
    .catch(err => {
      console.error('❌ Yemek verisi hatası:', err);
      foodList.innerHTML = '<li>Yemek yüklenirken hata oluştu.</li>';
    });
}





  



// 4) DOM hazır olunca: TAB geçişleri ve "Gelenekler" sekmesini dinamik yükle
document.addEventListener('DOMContentLoaded', () => {
  const tabs     = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // 4a) Aktif buton / içerik toggle
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      contents.forEach(c => c.classList.toggle('active', c.id === tab.dataset.target));

      // 4b) Eğer Gelenekler sekmesi açıldıysa veriyi çek
      if (tab.dataset.target === 'traditions-tab') {
        loadTraditions();
      }
    });
  });
});

// DOM hazır olunca tab geçişleri, arama, chat vs. ayarları
document.addEventListener('DOMContentLoaded', () => {
  console.log('▶ main.js yüklendi');

  // — TAB GEÇİŞLERİ —
  const tabs     = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // tıklanan butonu aktif yap, diğerlerini pasif yap
      tabs.forEach(t => t.classList.toggle('active-btn', t === tab));
      // ilgili içeriği göster, diğerlerini gizle
      contents.forEach(c => c.classList.toggle('active', c.id === tab.dataset.target));
    });
  });


  // (Buraya dilerseniz arama, chat vb. diğer listener’ları da ekleyebilirsiniz.)
});





document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('countrySearch');
  if (searchInput) {
    searchInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);

              map.flyTo({
                center: [lng, lat],
                zoom: 6,
                speed: 1.2,
                curve: 1,
                easing(t) { return t; }
              });

              // İsteğe bağlı: detayları güncelle
              fetch(`/get_location_info?lat=${lat}&lng=${lng}`)
                .then(response => response.json())
                .then(data => {
                  updateLocationInfo(data);
                  updateWeatherInfo(data.weather || {});
                  updateCulturalInfo(data.cultural?.religion);
                  if (data.iso2 && window.updateCalendar) window.updateCalendar(data.iso2);
                  if (window.loadPlaces) window.loadPlaces(lat, lng);
                })
                .catch(error => console.error('Veri alınamadı:', error));
            } else {
              alert("Konum bulunamadı 😥");
            }
          })
          .catch(error => {
            console.error("Nominatim API hatası:", error);
            alert("Bir hata oluştu, lütfen tekrar dene.");
          });
      }
    });
  }
});










// Konum bilgilerini güncelle
function updateLocationInfo(data) {
  const country = data.location?.country || '-';
  const city = data.location?.city || '-';
  const capital = data.country_info?.capital || '-';

  document.getElementById('location-line').textContent = `${country.toUpperCase()} / ${city}`;
  document.getElementById('capital-line').textContent = `Capital: ${capital}`;

  const locationBox = document.getElementById('location-box');
  locationBox.classList.remove('animate');
  void locationBox.offsetWidth; // Reflow tetikleme
  locationBox.classList.add('animate');

  const flagImg = document.getElementById('flag');
  if (data.country_info?.flag) {
    flagImg.src = data.country_info.flag;
    document.querySelector('.flag-box').style.display = 'block';
  } else {
    document.querySelector('.flag-box').style.display = 'none';
  }

  document.getElementById('currency').textContent = data.country_info.currency || '-';
  document.getElementById('language').textContent = data.country_info.languages || '-';
  document.getElementById('population').textContent = data.country_info.population?.toLocaleString() || '-';
  document.getElementById('region').textContent = data.country_info.region || '-';
  document.getElementById('subregion').textContent = data.country_info.subregion || '-';
  document.getElementById('area').textContent = data.country_info.area?.toLocaleString() || '-';
  document.getElementById('borders').textContent = data.country_info.borders?.join(', ') || 'Yok';

  document.getElementById('country-summary').textContent = data.wiki.country_summary || 'No summary found.';
  document.getElementById('city-summary').textContent = data.wiki.city_summary || 'No summary found.';
  document.getElementById('summary-box').classList.add('expanded');

  document.getElementById('local-time').textContent = `Saat: ${data.time_info.local_time?.split(' ')[1] || '--:--'}`;
  document.getElementById('timezone').textContent = `(${data.time_info.timezone || 'UTC'})`;
}

// Hava durumu bilgilerini güncelle
function updateWeatherInfo(weather) {
  document.getElementById('temperature').textContent = `${weather.temperature ?? '--'}°C`;
  document.getElementById('description').textContent = weather.description || '--';
  document.getElementById('humidity').textContent = `💧: %${weather.humidity ?? '--'}`;
  document.getElementById('wind-speed').textContent = `💨: ${weather.wind_speed ?? '--'} km/s`;

  const icon = document.getElementById('weather-icon');
  if (weather.icon) {
    icon.src = `https://openweathermap.org/img/wn/${weather.icon}@4x.png`;
    icon.style.display = 'block';
  } else {
    icon.style.display = 'none';
  }
}

// Kültürel (din) bilgilerini güncelle
function updateCulturalInfo(religions) {
  const religionList = document.getElementById('religion-list');
  religionList.innerHTML = '';

  if (religions && typeof religions === 'object' && !Array.isArray(religions)) {
    Object.entries(religions).forEach(([name, ratio]) => {
      const li = document.createElement('li');
      li.textContent = `${name}: ${ratio}%`;
      religionList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = religions || 'No religion data.';
    religionList.appendChild(li);
  }
}
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('authModal');
  const container = document.getElementById('authContainer');

  document.getElementById('login-btn').addEventListener('click', () => {
    modal.classList.remove('hidden');
    container.classList.remove('sign-up-mode');
  });

  document.getElementById('signup-btn').addEventListener('click', () => {
    modal.classList.remove('hidden');
    container.classList.add('sign-up-mode');
  });

  document.getElementById('toSignup').addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.add('sign-up-mode');
  });

  document.getElementById('toLogin').addEventListener('click', (e) => {
    e.preventDefault();
    container.classList.remove('sign-up-mode');
  });

  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden');
    }
  });
});




  document.getElementById('chat-toggle').addEventListener('click', () => {
    document.getElementById('chat-panel').classList.toggle('hidden');
  });

  document.getElementById('chat-close').addEventListener('click', () => {
    document.getElementById('chat-panel').classList.add('hidden');
  });

  document.getElementById('chat-send').addEventListener('click', async () => {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const body = document.getElementById('chat-body');

    // Kullanıcı mesajı göster
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = msg;
    body.appendChild(userMsg);

    input.value = "";

    // Sunucuya gönder
    const response = await fetch('/explore/chatbot/', {

      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': '{{ csrf_token }}'
      },
      body: JSON.stringify({ message: msg })
    });

    const data = await response.json();

    // Bot cevabı göster
    const botMsg = document.createElement('div');
    botMsg.className = 'chat-message bot';
    botMsg.textContent = data.reply || 'Cevap alınamadı.';
    body.appendChild(botMsg);
   


    body.scrollTop = body.scrollHeight;
  });
// Enter tuşu ile gönderme desteği
document.getElementById('chat-input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault(); // Sayfanın yenilenmesini önler
    document.getElementById('chat-send').click(); // Gönder butonuna tıkla
  }
});












// Gezilecek önemli yerleri (landmark) Geoapify ile çek
function loadPlaces(lat, lng) {
  const radius = 5000; // metre cinsinden yarıçap
  const apiKey = "fc2fa47684884c1991e2ac90599d7d67";
  const apiUrl = `https://api.geoapify.com/v2/places?categories=tourism.sights&filter=circle:${lng},${lat},${radius}&limit=20&apiKey=${apiKey}`;

  fetch(apiUrl)
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('places-google-list');
      container.innerHTML = '';

      const places = data.features || [];
      if (places.length === 0) {
        container.innerHTML = '<li>Yakında gezilecek önemli bir yer bulunamadı.</li>';
        return;
      }

      places.forEach(place => {
        const name = place.properties.name || "İsimsiz yer";
        const address = place.properties.address_line1 || "Adres bilgisi yok";
        const category = place.properties.categories?.join(', ') || "Kategori bilgisi yok";

        const placeCard = document.createElement('div');
        placeCard.classList.add('place-card');

        placeCard.innerHTML = `
          <div class="place-content" style="display: flex; gap: 20px; align-items: flex-start;">
            <div class="place-info">
              <h3 style="margin: 0 0 8px;">${name}</h3>
              <p><strong>Adres:</strong> ${address}</p>
              <p><strong>Tür:</strong> ${category}</p>
            </div>
          </div>
        `;

        container.appendChild(placeCard);
      });
    })
    .catch(error => console.error('Landmark verisi alınamadı:', error));
}

document.addEventListener('DOMContentLoaded', () => {
  const chatSend = document.getElementById('chat-send');
  const chatInput = document.getElementById('chat-input');
  const chatBody = document.getElementById('chat-body');

  chatSend?.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage('user', message);
    chatInput.value = '';

    try {
      const response = await fetch('/explore/chatbot/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({ message })
      });

      if (!response.ok) throw new Error('Sunucu hatası');
      const data = await response.json();
      appendMessage('bot', data.reply || 'Cevap alınamadı.');
    } catch (error) {
      appendMessage('bot', '⚠️ Hata: Mesaj gönderilemedi.');
      console.error(error);
    }
  });

  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') chatSend.click();
  });

  function appendMessage(sender, message) {
    const msg = document.createElement('div');
    msg.className = `chat-message ${sender}`;
    msg.textContent = message;
    chatBody.appendChild(msg);
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      document.cookie.split(';').forEach(cookie => {
        const [cName, cValue] = cookie.trim().split('=');
        if (cName === name) cookieValue = decodeURIComponent(cValue);
      });
    }
    return cookieValue;
  }
});

console.log('Seçilen ülke kodu:', window.selectedCountryCode);


function loadTraditions() {
  const code = window.selectedCountryCode;
  const listDiv = document.getElementById('traditions-list');
  if (!code) {
    listDiv.innerHTML = "<p>Please first select a country from the map.</p>";
    return;
  }

  fetch(`/explore/get_traditions/?country_code=${code}`)
    .then(res => res.json())
    .then(data => {
      const traditions = data.traditions;
      if (!traditions || !traditions.length) {
        listDiv.innerHTML = "<p>No traditions belonging to this country were found.</p>";
        return;
      }
      // Her gelenek için kutu oluştur
      listDiv.innerHTML = traditions.map(t => `
        <div class="tradition-box">
          <h4>${t.title}</h4>
          <p>${t.description}</p>
        </div>
      `).join('');
    })
    .catch(err => {
      listDiv.innerHTML = "<p>An error occurred while loading traditions./p>";
      console.error(err);
    });
}

// TAB geçişlerinde traditions-tab aktifse loadTraditions çağır
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.toggle('active-btn', t === tab));
      contents.forEach(c => c.classList.toggle('active', c.id === tab.dataset.target));
      if (tab.dataset.target === 'traditions-tab') loadTraditions();
    });
  });
});

