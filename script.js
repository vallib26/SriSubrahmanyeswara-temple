// Mobile menu toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => navLinks.classList.remove('open'));
});

// Gallery tabs
const tabs = document.querySelectorAll('.gtab');
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.querySelectorAll('.gallery-panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => observer.observe(el));

// Also reveal story-card and cards on scroll
document.querySelectorAll('.story-card, .card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Language toggle
(function(){
  const htmlRoot = document.getElementById('htmlRoot');
  const body = document.body;
  const btn = document.getElementById('langToggle');
  const label = document.getElementById('langToggleLabel');
  if(!btn) return;

  function setLang(lang){
    body.setAttribute('data-lang', lang);
    htmlRoot.setAttribute('lang', lang);
    label.textContent = lang === 'te' ? 'English' : 'తెలుగు';
    try{ localStorage.setItem('templeLang', lang); }catch(e){}
  }

  let saved = 'te';
  try{ saved = localStorage.getItem('templeLang') || 'te'; }catch(e){}
  setLang(saved);

  btn.addEventListener('click', () => {
    const current = body.getAttribute('data-lang');
    setLang(current === 'te' ? 'en' : 'te');
  });
})();

// Hero image slider
(function(){
  const slider = document.getElementById('heroSlider');
  const dotsWrap = document.getElementById('heroDots');
  if(!slider) return;
  const slides = slider.querySelectorAll('.hero-slide');
  if(slides.length === 0) return;
  let idx = 0;

  slides.forEach((s, i) => {
    const dot = document.createElement('button');
    if(i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => showSlide(i));
    dotsWrap.appendChild(dot);
  });
  const dots = dotsWrap.querySelectorAll('button');

  function showSlide(i){
    slides[idx].classList.remove('active');
    dots[idx].classList.remove('active');
    idx = i;
    slides[idx].classList.add('active');
    dots[idx].classList.add('active');
  }

  slides[0].classList.add('active');

  setInterval(() => {
    showSlide((idx + 1) % slides.length);
  }, 4500);
})();

// ================= Data Layer: Supabase (with localStorage fallback) =================
// ---- CONFIGURATION ----
// Set SUPABASE_ENABLED to true and fill in your project's URL + anon key
// (find both in Supabase Dashboard > Project Settings > API) to make
// logins, seva bookings, donations and the admin dashboard use a real
// shared database instead of each visitor's own browser storage.
// Until then, everything works as a local demo (data stays on each device).
const SUPABASE_ENABLED = false; // EDIT: set to true once configured below
const SUPABASE_URL = "https://YOUR-PROJECT-REF.supabase.co"; // EDIT
const SUPABASE_ANON_KEY = "YOUR-ANON-PUBLIC-KEY"; // EDIT

let supabase = null;
if (SUPABASE_ENABLED && window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ================= Seva Booking, Login & Dashboard =================
(function(){
  const TEMPLE_WHATSAPP = "911234567890"; // EDIT: temple's WhatsApp number, country code + number, no + or spaces
  const MAP_LAT = 16.5780; // EDIT: replace with real temple latitude
  const MAP_LNG = 82.0092; // EDIT: replace with real temple longitude

  const loginModal = document.getElementById('loginModal');
  const bookingModal = document.getElementById('bookingModal');
  const dashboardOverlay = document.getElementById('dashboardOverlay');
  const toast = document.getElementById('toast');
  const navAuthLink = document.getElementById('navAuthLink');

  // Devotee "login" is just a locally remembered name+mobile (not a security
  // boundary) — it's how the site knows whose bookings to show/submit.
  function getUser(){
    try{ return JSON.parse(localStorage.getItem('templeUser') || 'null'); }catch(e){ return null; }
  }
  function setUser(u){
    try{ localStorage.setItem('templeUser', JSON.stringify(u)); }catch(e){}
  }
  function showToast(html, ms){
    toast.innerHTML = html;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), ms || 6000);
  }
  function openModal(el){ el.classList.add('open'); }
  function closeModal(el){ el.classList.remove('open'); }

  // ---- Local (demo) fallback storage helpers ----
  function localGetBookings(){ try{ return JSON.parse(localStorage.getItem('templeBookings') || '[]'); }catch(e){ return []; } }
  function localSaveBookings(list){ try{ localStorage.setItem('templeBookings', JSON.stringify(list)); }catch(e){} }

  // ---- Data layer: insert a booking (Supabase or local) ----
  async function insertBooking(b){
    if(SUPABASE_ENABLED && supabase){
      const { data, error } = await supabase.from('bookings').insert({
        seva: b.seva, name: b.name, mobile: b.mobile,
        seva_date: b.date || null, gotra: b.gotra, pilgrim_names: b.pilgrimNames, notes: b.notes
      }).select().single();
      if(error){ console.error(error); throw error; }
      return data;
    }else{
      const list = localGetBookings();
      const rec = { id: 'SV' + Date.now(), ...b, seva_date: b.date, pilgrim_names: b.pilgrimNames, created_at: new Date().toISOString() };
      list.push(rec);
      localSaveBookings(list);
      return rec;
    }
  }

  // ---- Data layer: get my bookings ----
  async function getMyBookings(mobile){
    if(SUPABASE_ENABLED && supabase){
      const { data, error } = await supabase.rpc('get_my_bookings', { p_mobile: mobile });
      if(error){ console.error(error); return []; }
      return data.map(d => ({ id: d.id, seva: d.seva, name: d.name, mobile: d.mobile, date: d.seva_date, gotra: d.gotra, pilgrimNames: d.pilgrim_names, notes: d.notes, createdAt: d.created_at }));
    }else{
      return localGetBookings().filter(b => b.mobile === mobile);
    }
  }

  // ---- Data layer: update my booking's gotra/pilgrim names ----
  async function updateMyBooking(id, mobile, gotra, pilgrimNames){
    if(SUPABASE_ENABLED && supabase){
      const { error } = await supabase.rpc('update_my_booking', { p_id: id, p_mobile: mobile, p_gotra: gotra, p_pilgrim_names: pilgrimNames });
      if(error){ console.error(error); throw error; }
    }else{
      const list = localGetBookings().map(b => b.id === id ? {...b, gotra, pilgrimNames} : b);
      localSaveBookings(list);
    }
  }

  function updateNavAuth(){
    const u = getUser();
    if(navAuthLink){
      navAuthLink.querySelectorAll('.t-en, .t-te').forEach(s => s.remove());
      const en = document.createElement('span'); en.className='t-en';
      const te = document.createElement('span'); te.className='t-te';
      if(u){ en.textContent = 'My Sevas'; te.textContent = 'నా సేవలు'; }
      else{ en.textContent = 'Login'; te.textContent = 'లాగిన్'; }
      navAuthLink.appendChild(en); navAuthLink.appendChild(te);
    }
  }

  let pendingSeva = null;

  document.querySelectorAll('.btn-book-seva').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingSeva = btn.dataset.seva;
      const u = getUser();
      if(!u){ openModal(loginModal); }
      else{
        document.getElementById('bookingSevaName').textContent = pendingSeva;
        openModal(bookingModal);
      }
    });
  });

  if(navAuthLink){
    navAuthLink.addEventListener('click', async (e) => {
      e.preventDefault();
      const u = getUser();
      if(u){ await renderDashboard(); openModal(dashboardOverlay); }
      else{ openModal(loginModal); }
    });
  }

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('loginName').value.trim();
    const mobile = document.getElementById('loginMobile').value.trim();
    if(!/^[0-9]{10}$/.test(mobile)){
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    setUser({ name, mobile });
    updateNavAuth();
    closeModal(loginModal);
    if(pendingSeva){
      document.getElementById('bookingSevaName').textContent = pendingSeva;
      openModal(bookingModal);
    }
  });

  document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = getUser();
    if(!u) return;
    const booking = {
      seva: pendingSeva, mobile: u.mobile, name: u.name,
      date: document.getElementById('bookingDate').value,
      gotra: document.getElementById('bookingGotra').value.trim(),
      pilgrimNames: document.getElementById('bookingNames').value.trim(),
      notes: document.getElementById('bookingNotes').value.trim()
    };
    try{
      await insertBooking(booking);
    }catch(err){
      showToast('⚠️ Could not save booking. Please try again.', 5000);
      return;
    }
    closeModal(bookingModal);
    document.getElementById('bookingForm').reset();

    const waText = encodeURIComponent(
      `🙏 Seva Booking Request\nSeva: ${booking.seva}\nDate: ${booking.date}\nName: ${booking.name}\nMobile: ${booking.mobile}\nGotra: ${booking.gotra || '-'}\nPilgrims: ${booking.pilgrimNames || '-'}\nNotes: ${booking.notes || '-'}`
    );
    const waLink = `https://wa.me/${TEMPLE_WHATSAPP}?text=${waText}`;
    showToast(`✅ Seva booked! <a href="${waLink}" target="_blank" rel="noopener">Notify temple on WhatsApp →</a>`, 9000);
    pendingSeva = null;
  });

  async function renderDashboard(){
    const u = getUser();
    const listEl = document.getElementById('dashboardList');
    listEl.innerHTML = '<div class="empty-state">Loading…</div>';
    if(!u){ listEl.innerHTML = ''; return; }
    const mine = await getMyBookings(u.mobile);
    listEl.innerHTML = '';
    if(mine.length === 0){
      listEl.innerHTML = `<div class="empty-state"><span class="t-en">No sevas booked yet.</span><span class="t-te">ఇంకా సేవలు బుక్ చేయలేదు.</span></div>`;
      return;
    }
    mine.forEach(b => {
      const card = document.createElement('div');
      card.className = 'booking-card';
      card.innerHTML = `
        <h4>${b.seva}</h4>
        <div class="meta">${b.date || '—'} &nbsp;•&nbsp; Booking ID: ${String(b.id).slice(0,8)}</div>
        <label>Gotra</label>
        <input type="text" value="${b.gotra || ''}" data-field="gotra">
        <label>Pilgrim Name(s)</label>
        <textarea rows="2" data-field="pilgrimNames">${b.pilgrimNames || ''}</textarea>
        <div class="booking-actions">
          <button type="button" data-save="${b.id}">Save Details</button>
          <button type="button" data-invoice="${b.id}">View Receipt</button>
        </div>`;
      listEl.appendChild(card);

      card.querySelector('[data-save]').addEventListener('click', async () => {
        const gotra = card.querySelector('[data-field="gotra"]').value;
        const pilgrimNames = card.querySelector('[data-field="pilgrimNames"]').value;
        try{
          await updateMyBooking(b.id, u.mobile, gotra, pilgrimNames);
          showToast('✅ Details saved.', 3000);
        }catch(err){
          showToast('⚠️ Could not save. Please try again.', 4000);
        }
      });
      card.querySelector('[data-invoice]').addEventListener('click', () => printReceipt({...b, gotra: card.querySelector('[data-field="gotra"]').value, pilgrimNames: card.querySelector('[data-field="pilgrimNames"]').value}));
    });
  }

  function printReceipt(b){
    const w = window.open('', '_blank', 'width=480,height=640');
    w.document.write(`
      <html><head><title>Seva Booking Receipt</title>
      <style>
        body{font-family: Georgia, serif; padding:32px; color:#2B2320;}
        h2{color:#7A1F2B; margin-bottom:0;}
        .sub{color:#0F5257; font-size:.85rem; margin-bottom:24px;}
        table{width:100%; border-collapse:collapse;}
        td{padding:8px 0; border-bottom:1px solid #DED0AC;}
        td:first-child{font-weight:bold; width:40%;}
        .note{margin-top:24px; font-size:.78rem; color:#666;}
      </style></head><body>
      <h2>Sri Sri Sri Valli Devasena Sametha Subrahmanyeswara Swamy Temple, Vilasavilli</h2>
      <div class="sub">Seva Booking Receipt (not a payment invoice)</div>
      <table>
        <tr><td>Seva</td><td>${b.seva}</td></tr>
        <tr><td>Date</td><td>${b.date || '-'}</td></tr>
        <tr><td>Devotee Name</td><td>${b.name}</td></tr>
        <tr><td>Mobile</td><td>${b.mobile}</td></tr>
        <tr><td>Gotra</td><td>${b.gotra || '-'}</td></tr>
        <tr><td>Pilgrim(s)</td><td>${b.pilgrimNames || '-'}</td></tr>
        <tr><td>Notes</td><td>${b.notes || '-'}</td></tr>
      </table>
      <div class="note">This is a booking confirmation only. It is not a GST payment invoice — connect a payment gateway to issue those automatically.</div>
      </body></html>
    `);
    w.document.close();
    w.print();
  }

  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('templeUser');
    updateNavAuth();
    closeModal(dashboardOverlay);
    window.location.hash = '#home';
    showToast('👋 Logged out.', 3000);
  });

  document.getElementById('closeDashboard').addEventListener('click', () => closeModal(dashboardOverlay));

  document.querySelectorAll('.modal-close[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(document.getElementById(btn.dataset.close)));
  });
  [loginModal, bookingModal].forEach(m => {
    m.addEventListener('click', (e) => { if(e.target === m) closeModal(m); });
  });

  updateNavAuth();

  // ===== Map =====
  if(document.getElementById('templeMap') && window.L){
    const map = L.map('templeMap', { scrollWheelZoom: false }).setView([MAP_LAT, MAP_LNG], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    const velIcon = L.icon({
      iconUrl: '__IMG_VEL__',
      iconSize: [34, 56],
      iconAnchor: [17, 56],
      popupAnchor: [0, -50]
    });
    L.marker([MAP_LAT, MAP_LNG], { icon: velIcon }).addTo(map)
      .bindPopup('Sri Sri Sri Valli Devasena Sametha Subrahmanyeswara Swamy Temple').openPopup();
  }
})();

// ================= Donations + Admin Dashboard =================
(function(){
  const ADMIN_PASSWORD = "temple2026"; // used only when SUPABASE_ENABLED is false (local demo mode)

  const donationForm = document.getElementById('donationForm');
  const openDonationFormBtn = document.getElementById('openDonationForm');
  const adminLoginModal = document.getElementById('adminLoginModal');
  const adminDashboard = document.getElementById('adminDashboard');
  const adminLink = document.getElementById('adminLink');
  const toast = document.getElementById('toast');

  function showToast(html, ms){
    toast.innerHTML = html;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), ms || 6000);
  }
  function localGetDonations(){ try{ return JSON.parse(localStorage.getItem('templeDonations') || '[]'); }catch(e){ return []; } }
  function localSaveDonations(list){ try{ localStorage.setItem('templeDonations', JSON.stringify(list)); }catch(e){} }
  function localGetBookingsAll(){ try{ return JSON.parse(localStorage.getItem('templeBookings') || '[]'); }catch(e){ return []; } }

  async function insertDonation(d){
    if(SUPABASE_ENABLED && supabase){
      const { data, error } = await supabase.from('donations').insert({
        name: d.name, mobile: d.mobile, amount: d.amount, purpose: d.purpose
      }).select().single();
      if(error){ console.error(error); throw error; }
      return data;
    }else{
      const rec = { id: 'DN' + Date.now(), ...d, created_at: new Date().toISOString() };
      const list = localGetDonations();
      list.push(rec);
      localSaveDonations(list);
      return rec;
    }
  }

  // Admin-only: fetch everything (requires real Supabase Auth session when enabled)
  async function adminGetAllBookings(){
    if(SUPABASE_ENABLED && supabase){
      const { data, error } = await supabase.from('bookings').select('*').order('created_at', { ascending: false });
      if(error){ console.error(error); return []; }
      return data.map(d => ({ id: d.id, seva: d.seva, name: d.name, mobile: d.mobile, date: d.seva_date, gotra: d.gotra, pilgrimNames: d.pilgrim_names }));
    }else{
      return localGetBookingsAll();
    }
  }
  async function adminGetAllDonations(){
    if(SUPABASE_ENABLED && supabase){
      const { data, error } = await supabase.from('donations').select('*').order('created_at', { ascending: false });
      if(error){ console.error(error); return []; }
      return data.map(d => ({ id: d.id, name: d.name, mobile: d.mobile, amount: Number(d.amount), purpose: d.purpose, createdAt: d.created_at }));
    }else{
      return localGetDonations();
    }
  }

  if(openDonationFormBtn){
    openDonationFormBtn.addEventListener('click', () => {
      donationForm.style.display = donationForm.style.display === 'none' ? 'flex' : 'none';
    });
  }

  if(donationForm){
    donationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const donation = {
        name: document.getElementById('donorName').value.trim(),
        mobile: document.getElementById('donorMobile').value.trim(),
        amount: parseFloat(document.getElementById('donorAmount').value) || 0,
        purpose: document.getElementById('donorPurpose').value.trim() || 'General'
      };
      try{
        await insertDonation(donation);
        donationForm.reset();
        donationForm.style.display = 'none';
        showToast('🙏 Thank you! Your donation has been recorded.', 5000);
      }catch(err){
        showToast('⚠️ Could not record donation. Please try again.', 5000);
      }
    });
  }

  // ---- Admin auth ----
  async function isAdminLoggedIn(){
    if(SUPABASE_ENABLED && supabase){
      const { data } = await supabase.auth.getSession();
      return !!data.session;
    }else{
      return sessionStorage.getItem('templeAdmin') === 'yes';
    }
  }

  if(adminLink){
    adminLink.addEventListener('click', async (e) => {
      e.preventDefault();
      if(await isAdminLoggedIn()){
        await renderAdminDashboard();
        adminDashboard.classList.add('open');
      }else{
        adminLoginModal.classList.add('open');
      }
    });
  }

  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if(SUPABASE_ENABLED && supabase){
      const email = document.getElementById('adminEmail') ? document.getElementById('adminEmail').value : '';
      const pw = document.getElementById('adminPassword').value;
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if(error){ alert('Login failed: ' + error.message); return; }
    }else{
      const pw = document.getElementById('adminPassword').value;
      if(pw !== ADMIN_PASSWORD){ alert('Incorrect password.'); return; }
      sessionStorage.setItem('templeAdmin', 'yes');
    }
    adminLoginModal.classList.remove('open');
    document.getElementById('adminLoginForm').reset();
    await renderAdminDashboard();
    adminDashboard.classList.add('open');
  });

  document.getElementById('adminLogoutBtn').addEventListener('click', async () => {
    if(SUPABASE_ENABLED && supabase){ await supabase.auth.signOut(); }
    else{ sessionStorage.removeItem('templeAdmin'); }
    adminDashboard.classList.remove('open');
    showToast('Admin logged out.', 3000);
  });
  document.getElementById('closeAdminDashboard').addEventListener('click', () => {
    adminDashboard.classList.remove('open');
  });

  document.querySelectorAll('.admin-tabs .gtab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tabs .gtab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('adminPanel-' + tab.dataset.atab).classList.add('active');
    });
  });

  async function renderAdminDashboard(){
    document.getElementById('adminStats').innerHTML = '<div class="empty-state">Loading…</div>';
    const bookings = await adminGetAllBookings();
    const donations = await adminGetAllDonations();
    const totalAmount = donations.reduce((sum, d) => sum + (d.amount || 0), 0);

    const byPerson = {};
    donations.forEach(d => {
      const key = d.mobile;
      if(!byPerson[key]) byPerson[key] = { name: d.name, mobile: d.mobile, total: 0, count: 0 };
      byPerson[key].total += d.amount || 0;
      byPerson[key].count += 1;
    });

    document.getElementById('adminStats').innerHTML = `
      <div class="stat-box"><span class="num">${bookings.length}</span><span class="label">Total Sevas Booked</span></div>
      <div class="stat-box"><span class="num">₹${totalAmount.toLocaleString('en-IN')}</span><span class="label">Total Donations</span></div>
      <div class="stat-box"><span class="num">${donations.length}</span><span class="label">Donation Entries</span></div>
      <div class="stat-box"><span class="num">${Object.keys(byPerson).length}</span><span class="label">Unique Donors</span></div>
    `;

    let bookingsHtml = '';
    if(bookings.length === 0){
      bookingsHtml = '<div class="empty-state">No sevas booked yet.</div>';
    }else{
      bookingsHtml = `<table class="admin-table"><thead><tr>
        <th>Seva</th><th>Date</th><th>Devotee</th><th>Mobile</th><th>Gotra</th><th>Pilgrims</th>
        </tr></thead><tbody>`;
      bookings.forEach(b => {
        bookingsHtml += `<tr><td>${b.seva}</td><td>${b.date || '-'}</td><td>${b.name}</td><td>${b.mobile}</td><td>${b.gotra || '-'}</td><td>${b.pilgrimNames || '-'}</td></tr>`;
      });
      bookingsHtml += '</tbody></table>';
    }
    document.getElementById('adminPanel-bookings').innerHTML = bookingsHtml;

    let donationsHtml = '';
    if(donations.length === 0){
      donationsHtml = '<div class="empty-state">No donations recorded yet.</div>';
    }else{
      donationsHtml = '<h4 style="margin-bottom:12px;">All Donation Entries</h4>';
      donationsHtml += `<table class="admin-table"><thead><tr><th>Donor</th><th>Mobile</th><th>Amount</th><th>Purpose</th><th>Date</th></tr></thead><tbody>`;
      donations.forEach(d => {
        const dt = d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-IN') : '-';
        donationsHtml += `<tr><td>${d.name}</td><td>${d.mobile}</td><td>₹${d.amount.toLocaleString('en-IN')}</td><td>${d.purpose}</td><td>${dt}</td></tr>`;
      });
      donationsHtml += '</tbody></table>';

      donationsHtml += '<h4 style="margin:28px 0 12px;">Totals by Individual Donor</h4>';
      donationsHtml += `<table class="admin-table"><thead><tr><th>Donor</th><th>Mobile</th><th>Total Donated</th><th>Number of Donations</th></tr></thead><tbody>`;
      Object.values(byPerson).sort((a,b) => b.total - a.total).forEach(p => {
        donationsHtml += `<tr><td>${p.name}</td><td>${p.mobile}</td><td>₹${p.total.toLocaleString('en-IN')}</td><td>${p.count}</td></tr>`;
      });
      donationsHtml += '</tbody></table>';
    }
    document.getElementById('adminPanel-donations').innerHTML = donationsHtml;
  }
})();
