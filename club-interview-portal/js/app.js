/**
 * App.js - Application Controller & Interaction Logic for MCC.UEB
 */

function initApp() {
  const store = window.appStore;
  const escapeHtml = window.escapeHtml || function(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Global Wizard State
  const wizardState = {
    currentStep: 1,
    personalInfo: {},
    selectedDeptIds: [],
    selectedDate: null,
    dept1Slot: null,
    dept2Slot: null
  };

  // Lookup State
  let authenticatedCandidateData = null;

  // Interviewer State
  let currentInterviewerDept = 'all';
  let currentInterviewerSlotId = 'all';

  // Admin Override Target
  let currentOverrideReg = null;

  // --- ANIMATION SYSTEM HELPERS ---
  function triggerConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        // Concept Palette: Tím mận, vàng ánh kim, cam nhiệt huyết, xanh lá, chocolate & hồng kẹo
        const makerHatColors = [
          '#581C87', '#7E22CE', // Plum Purple (Tím mận ma thuật)
          '#F59E0B', '#FBBF24', '#FDE68A', // Gold & Amber (Vàng ánh kim & Phép màu)
          '#EA580C', '#C23B22', '#8B1E22', // Orange & MCC Crimson (Cam & Đỏ rượu MCC)
          '#22C55E', '#10B981', // Apple Green (Xanh lá độc bản)
          '#78350F', '#451A03', // Rich Chocolate Brown (Nâu chocolate Wonka)
          '#EC4899', '#F472B6'  // Sweet Candy Pink (Hồng kẹo ngọt)
        ];
        
        // Stage 1: The Maker's Hat High-Velocity Vertical Eruption (Bắn vút từ chiếc mũ ở đáy màn hình)
        window.confetti({
          particleCount: 120,
          angle: 90,
          spread: 65,
          startVelocity: 65,
          origin: { x: 0.5, y: 0.88 },
          colors: makerHatColors,
          gravity: 0.9,
          scalar: 1.15,
          ticks: 320
        });

        // Stage 2: Dual Symmetrical Arc Wing Bursts (Cánh cung bung tỏa hai bên)
        setTimeout(() => {
          window.confetti({
            particleCount: 65,
            angle: 55,
            spread: 60,
            startVelocity: 55,
            origin: { x: 0.1, y: 0.8 },
            colors: ['#F59E0B', '#FBBF24', '#7E22CE', '#EA580C', '#22C55E']
          });
          window.confetti({
            particleCount: 65,
            angle: 125,
            spread: 60,
            startVelocity: 55,
            origin: { x: 0.9, y: 0.8 },
            colors: ['#F59E0B', '#FBBF24', '#7E22CE', '#EA580C', '#22C55E']
          });
        }, 160);

        // Stage 3: Sweet Candy Balls & Stardust Shower (Mưa kẹo ngọt và bụi sao rơi chầm chậm)
        setTimeout(() => {
          window.confetti({
            particleCount: 60,
            spread: 120,
            origin: { x: 0.5, y: 0.25 },
            colors: ['#FDE68A', '#FBBF24', '#FFFFFF', '#EC4899', '#22C55E'],
            shapes: ['circle'],
            gravity: 0.6,
            scalar: 0.85,
            ticks: 280
          });
        }, 380);
      } catch (err) {
        console.warn('Confetti trigger warning:', err);
      }
    }
  }

  function animateCounter(element, targetValue, duration = 750, suffix = '') {
    if (!element) return;
    const start = 0;
    const end = parseInt(targetValue, 10) || 0;
    if (end === 0) {
      element.textContent = `0 ${suffix}`.trim();
      return;
    }
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = Math.round(start + (end - start) * easeProgress);
      element.textContent = `${currentVal} ${suffix}`.trim();
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // Universal Material Ripple click effect on interactive buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button, .btn-primary-pro, .btn-secondary-pro, .btn-shimmer, [data-route]');
    if (!btn || btn.disabled) return;

    const computedPos = window.getComputedStyle(btn).position;
    if (computedPos === 'static') {
      btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const wave = document.createElement('span');
    wave.className = 'ripple-wave';
    wave.style.width = `${size}px`;
    wave.style.height = `${size}px`;
    wave.style.left = `${x}px`;
    wave.style.top = `${y}px`;

    btn.appendChild(wave);
    setTimeout(() => {
      wave.remove();
    }, 600);
  });

  // --- NAVIGATION ROUTER & DEEP LINKING (HASH ROUTING) ---
  const navLinks = document.querySelectorAll('[data-route]');
  const views = {
    candidate: document.getElementById('view-candidate'),
    lookup: document.getElementById('view-lookup'),
    admin: document.getElementById('view-admin')
  };

  // Route alias mappings (Bilingual support for URLs)
  const ROUTE_MAP = {
    'dang-ky': 'candidate',
    'candidate': 'candidate',
    'home': 'candidate',
    '': 'candidate',
    'tra-cuu': 'lookup',
    'lookup': 'lookup',
    'doi-ca': 'lookup',
    'admin': 'admin',
    'admin/checkin': 'admin',
    'admin-checkin': 'admin',
    'quan-tri': 'admin'
  };

  const REVERSE_ROUTE_MAP = {
    'candidate': 'dang-ky',
    'lookup': 'tra-cuu',
    'admin': 'admin'
  };

  function switchRoute(routeName, updateHash = true) {
    const resolvedRoute = ROUTE_MAP[routeName] || (routeName.startsWith('admin') ? 'admin' : routeName);

    Object.keys(views).forEach(k => {
      if (views[k]) {
        if (k === resolvedRoute) views[k].classList.remove('hidden');
        else views[k].classList.add('hidden');
      }
    });

    // Update Header Navigation Active State
    const navButtons = [
      { id: 'nav-btn-candidate', route: 'candidate', hasBorder: false },
      { id: 'nav-btn-lookup', route: 'lookup', hasBorder: false },
      { id: 'nav-btn-admin', route: 'admin', hasBorder: true }
    ];

    navButtons.forEach(({ id, route, hasBorder }) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const isActive = (route === resolvedRoute);
      const icon = btn.querySelector('svg');

      if (isActive) {
        btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-gradient-to-r from-[#8B1E22] to-[#A6282E] text-white shadow-xs flex items-center gap-1.5 cursor-pointer border border-transparent';
        if (icon) icon.className = 'w-4 h-4 text-amber-200';
      } else {
        btn.className = `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer border ${hasBorder ? 'border-slate-200' : 'border-transparent'}`;
        if (icon) icon.className = 'w-4 h-4 text-slate-400';
      }
    });

    // Update browser URL hash for deep linking & bookmarking
    if (updateHash) {
      const targetHash = REVERSE_ROUTE_MAP[resolvedRoute] || resolvedRoute;
      if (window.location.hash !== `#${targetHash}`) {
        window.location.hash = targetHash;
      }
    }

    if (resolvedRoute === 'candidate') initCandidateWizard();
    if (resolvedRoute === 'admin') renderAdminWorkspace();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleHashChange() {
    const rawHash = (window.location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
    if (rawHash === 'admin/checkin' || rawHash === 'admin-checkin' || rawHash === 'checkin') {
      currentActiveAdminTab = 'checkin';
    }
    const targetRoute = ROUTE_MAP[rawHash] || (rawHash.startsWith('admin') ? 'admin' : 'candidate');
    switchRoute(targetRoute, false);
    if (rawHash === 'admin/checkin' || rawHash === 'admin-checkin' || rawHash === 'checkin') {
      if (typeof window.switchAdminTab === 'function') {
        window.switchAdminTab('checkin');
      }
    }
  }

  // Global access for programmatic switching
  window.switchRoute = switchRoute;

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const r = link.getAttribute('data-route');
      const targetHash = REVERSE_ROUTE_MAP[r] || r;
      if (window.location.hash === `#${targetHash}`) {
        switchRoute(r, false);
      } else {
        window.location.hash = targetHash;
      }
    });
  });

  // --- 24-HOUR TIME & DEADLINE FORMATTING UTILITIES (STRICT 24H, NO AM/PM) ---
  function formatDeadlineDisplay24h(isoDate) {
    if (!isoDate) return '--:-- --/--/----';
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return '--:-- --/--/----';
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${hh}:${mm} - ${dd}/${MM}/${yyyy}`;
  }

  // --- 24-HOUR DEADLINE TIME INPUT HELPER (STRICT 24H, KHÔNG AM/PM) ---
  function initDeadlineTimeInput() {
    const timeInput = document.getElementById('admin-deadline-time');
    if (!timeInput || timeInput.dataset.bound) return;
    timeInput.dataset.bound = 'true';

    // Auto-formatting as user types (e.g. 2359 -> 23:59)
    timeInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9:]/g, '');
      if (!val.includes(':') && val.length >= 3) {
        val = val.slice(0, 2) + ':' + val.slice(2, 4);
      }
      if (val.length > 5) val = val.slice(0, 5);
      e.target.value = val;
    });

    // Auto-normalize on blur to strict HH:mm
    timeInput.addEventListener('blur', (e) => {
      let val = e.target.value.trim();
      if (!val) {
        e.target.value = '23:59';
        return;
      }
      const parts = val.split(':');
      let h = 23, m = 59;
      if (parts.length === 2) {
        h = parseInt(parts[0], 10) || 0;
        m = parseInt(parts[1], 10) || 0;
      } else if (val.length <= 2) {
        h = parseInt(val, 10) || 0;
        m = 0;
      } else if (val.length === 4) {
        h = parseInt(val.slice(0, 2), 10) || 0;
        m = parseInt(val.slice(2, 4), 10) || 0;
      }
      if (h < 0) h = 0;
      if (h > 23) h = 23;
      if (m < 0) m = 0;
      if (m > 59) m = 59;
      e.target.value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    });

    // Support Arrow Up / Down keys to easily increment / decrement minutes
    timeInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        let parts = (e.target.value || '23:59').split(':').map(Number);
        let h = isNaN(parts[0]) ? 23 : parts[0];
        let m = isNaN(parts[1]) ? 59 : parts[1];
        let totalMin = h * 60 + m;
        if (e.key === 'ArrowUp') totalMin = (totalMin + 1) % 1440;
        else totalMin = (totalMin - 1 + 1440) % 1440;
        const newH = Math.floor(totalMin / 60);
        const newM = totalMin % 60;
        e.target.value = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
      }
    });
  }

  // --- CANDIDATE WIZARD CONTROLLER ---
  function initCandidateWizard() {
    const activeCamp = store.getActiveCampaign();
    const navGen = document.getElementById('nav-active-gen');
    if (navGen) navGen.textContent = activeCamp.gen || 'Gen XVII';
    const heroGenEl = document.getElementById('hero-campaign-gen');
    if (heroGenEl) {
      heroGenEl.textContent = activeCamp.academicYear ? `CHECK IN ${activeCamp.gen.toUpperCase()} (${activeCamp.academicYear})` : (activeCamp.gen || 'CHECK IN GEN XVII');
    }
    const heroNameEl = document.getElementById('hero-campaign-name');
    if (heroNameEl) {
      heroNameEl.innerHTML = `<span class="title-gold-shimmer">${escapeHtml(activeCamp.name)}</span>`;
    }
    const heroSloganEl = document.getElementById('hero-campaign-slogan');
    if (heroSloganEl) {
      heroSloganEl.innerHTML = `<span>✨</span> <span>"${escapeHtml(activeCamp.slogan)}"</span>`;
    }
    const heroBgImg = document.getElementById('hero-campaign-bg-img');
    if (heroBgImg && activeCamp.backgroundImage) {
      heroBgImg.src = activeCamp.backgroundImage;
    }

    // Deadline Display & Lock Wizard (Strict 24h Format: HH:mm - DD/MM/YYYY)
    if (activeCamp.registrationDeadline) {
      const dlText = document.getElementById('hero-deadline-text');
      if (dlText) dlText.textContent = formatDeadlineDisplay24h(activeCamp.registrationDeadline);
      
      const isPast = store.isPastDeadline(activeCamp.id);
      const badge = document.getElementById('hero-deadline-badge');
      const wizardCard = document.getElementById('candidate-wizard-card');
      const expiredCard = document.getElementById('candidate-expired-card');
      const expiredCampName = document.getElementById('expired-camp-name');
      if (expiredCampName) expiredCampName.textContent = activeCamp.name || 'THE WONDER BOUND';

      if (isPast) {
        if (badge) {
          badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-sm';
          badge.textContent = 'Đã hết hạn';
        }
        if (wizardCard) wizardCard.classList.add('hidden');
        if (expiredCard) expiredCard.classList.remove('hidden');
        return;
      } else {
        if (badge) {
          badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white shadow-sm';
          badge.textContent = 'Đang nhận đơn ứng tuyển';
        }
        if (wizardCard) wizardCard.classList.remove('hidden');
        if (expiredCard) expiredCard.classList.add('hidden');
      }
    }

    renderStep2DepartmentsGrid();
    goToStep(1);
  }

  function goToStep(stepNum) {
    const activeCamp = store.getActiveCampaign();
    if (store.isPastDeadline(activeCamp.id)) {
      window.UI.showToast('Đã hết hạn nhận đơn & chọn ca phỏng vấn!', 'error');
      initCandidateWizard();
      return;
    }
    const prevStep = wizardState.currentStep || 1;
    wizardState.currentStep = stepNum;

    for (let i = 1; i <= 4; i++) {
      const pane = document.getElementById(`step-${i}-content`);
      if (pane) {
        pane.classList.remove('animate-slide-right', 'animate-slide-left');
        if (i === stepNum) {
          pane.classList.remove('hidden');
          if (stepNum > prevStep) {
            pane.classList.add('animate-slide-right');
          } else if (stepNum < prevStep) {
            pane.classList.add('animate-slide-left');
          }
        } else {
          pane.classList.add('hidden');
        }
      }
    }

    document.querySelectorAll('.step-indicator').forEach(ind => {
      const s = Number(ind.getAttribute('data-step'));
      const circle = ind.querySelector('div');
      if (s === stepNum) {
        ind.className = 'step-indicator flex items-center gap-2 text-orange-600 font-bold text-xs';
        circle.className = 'w-7 h-7 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-black';
      } else if (s < stepNum) {
        ind.className = 'step-indicator flex items-center gap-2 text-emerald-600 font-bold text-xs';
        circle.className = 'w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black';
      } else {
        ind.className = 'step-indicator flex items-center gap-2 text-slate-400 font-bold text-xs';
        circle.className = 'w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-black';
      }
    });

    if (stepNum === 3) renderStep3ParallelTimelines();
    if (stepNum === 4) renderStep4Summary();
  }

  window.goToStep = goToStep;
  window.wizardState = wizardState;
  window.toggleDeptSelection = toggleDeptSelection;

  // STEP 1 NAVIGATION (STRICT VALIDATION & ANTI-XSS / INJECTION)
  document.getElementById('btn-next-step-1')?.addEventListener('click', () => {
    const rawFn = document.getElementById('wiz-fullname').value.trim();
    const rawStId = document.getElementById('wiz-studentid').value.trim();
    const rawEm = document.getElementById('wiz-email').value.trim();
    const rawPh = document.getElementById('wiz-phone').value.trim();
    const rawCl = document.getElementById('wiz-class').value.trim();

    try {
      const cleanInfo = store.validateCandidateInput({
        fullName: rawFn,
        studentId: rawStId,
        email: rawEm,
        phone: rawPh,
        academicClass: rawCl
      });

      wizardState.personalInfo = cleanInfo;
      goToStep(2);
    } catch (err) {
      window.UI.showToast(err.message, 'warning');
    }
  });

  // STEP 2: Departments Grid
  function renderStep2DepartmentsGrid() {
    const container = document.getElementById('wizard-depts-grid');
    if (!container) return;
    container.innerHTML = '';
    const departments = store.getDepartments();

    departments.forEach(dept => {
      const isChecked = wizardState.selectedDeptIds.includes(dept.id);
      const card = document.createElement('div');
      card.className = `p-5 sm:p-6 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer pro-card-interactive mouse-glow-card select-none ${
        isChecked ? 'bg-orange-50/70 border-[#C23B22] ring-2 ring-[#C23B22]/60 shadow-md animate-pop' : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-card'
      }`;

      card.innerHTML = `
        <div class="flex items-center justify-between gap-3 mb-3">
          <h4 class="font-black text-stone-900 text-base sm:text-lg tracking-tight">${dept.name}</h4>
          <input type="checkbox" class="dept-checkbox w-4 h-4 rounded text-[#C23B22] cursor-pointer pointer-events-none" ${isChecked ? 'checked' : ''}>
        </div>
        <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
          <span class="text-xs font-black ${isChecked ? 'text-[#C23B22]' : 'text-stone-500'}">
            ${isChecked ? '✓ Đã chọn ban này' : '+ Bấm để chọn ban này'}
          </span>
          <span class="text-xs font-bold ${isChecked ? 'text-orange-700' : 'text-stone-400'}">${isChecked ? 'Đã chọn' : 'Chưa chọn'}</span>
        </div>
      `;

      card.onclick = () => {
        toggleDeptSelection(dept.id);
      };

      container.appendChild(card);
    });

    updateDeptCountBadge();
  }

  function toggleDeptSelection(deptId) {
    const idx = wizardState.selectedDeptIds.indexOf(deptId);
    if (idx > -1) {
      wizardState.selectedDeptIds.splice(idx, 1);
      if (wizardState.dept1Slot?.departmentId === deptId) wizardState.dept1Slot = null;
      if (wizardState.dept2Slot?.departmentId === deptId) wizardState.dept2Slot = null;
    } else {
      if (wizardState.selectedDeptIds.length >= 2) {
        window.UI.showToast('Bạn chỉ được chọn tối đa 2 ban ứng tuyển.', 'warning');
        return;
      }
      wizardState.selectedDeptIds.push(deptId);
    }
    renderStep2DepartmentsGrid();
  }

  function updateDeptCountBadge() {
    const badge = document.getElementById('selected-dept-count-badge');
    if (badge) {
      badge.textContent = `Đã chọn: ${wizardState.selectedDeptIds.length}/2 ban`;
      badge.className = `px-3 py-1 text-xs font-bold rounded-full ${
        wizardState.selectedDeptIds.length > 0 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-500'
      }`;
    }
  }

  document.getElementById('btn-prev-step-2')?.addEventListener('click', () => goToStep(1));
  document.getElementById('btn-next-step-2')?.addEventListener('click', () => {
    if (wizardState.selectedDeptIds.length === 0) {
      window.UI.showToast('Vui lòng chọn ít nhất 1 ban ứng tuyển.', 'warning');
      return;
    }
    goToStep(3);
  });

  // STEP 3: PARALLEL TIMELINE & OVERLAP LOGIC
  function renderStep3ParallelTimelines() {
    const activeCamp = store.getActiveCampaign();
    const openSlots = store.getSlots(activeCamp.id).filter(s => s.isOpen);

    const uniqueDates = [...new Set(openSlots.map(s => s.date))].sort();
    if (!wizardState.selectedDate || !uniqueDates.includes(wizardState.selectedDate)) {
      wizardState.selectedDate = uniqueDates[0] || activeCamp.startDate || new Date().toISOString().split('T')[0];
    }

    // Render Date Strip
    const dateStripContainer = document.getElementById('timeline-date-strip');
    dateStripContainer.innerHTML = '';
    const dateStripEl = window.UI.renderDateStrip(uniqueDates.length ? uniqueDates : [wizardState.selectedDate], wizardState.selectedDate, (newDate) => {
      wizardState.selectedDate = newDate;
      renderStep3ParallelTimelines();
    });
    dateStripContainer.appendChild(dateStripEl);

    // Render Parallel Columns
    const parallelContainer = document.getElementById('timeline-parallel-container');
    parallelContainer.innerHTML = '';

    const dept1 = store.getDepartmentById(wizardState.selectedDeptIds[0]);
    const dept2 = wizardState.selectedDeptIds[1] ? store.getDepartmentById(wizardState.selectedDeptIds[1]) : null;

    // Column 1
    const slots1 = openSlots.filter(s => s.departmentId === dept1.id && s.date === wizardState.selectedDate);
    const col1 = window.UI.renderTimelineColumn(dept1, slots1, wizardState.dept1Slot?.id, wizardState.dept2Slot, (chosenSlot) => {
      wizardState.dept1Slot = chosenSlot;
      renderStep3ParallelTimelines();
      window.UI.showToast(`Đã chọn ca [${chosenSlot.startTime} - ${chosenSlot.endTime}] cho ${dept1.name}`, 'success');
    });
    parallelContainer.appendChild(col1);

    // Column 2 (if selected 2 depts)
    if (dept2) {
      const slots2 = openSlots.filter(s => s.departmentId === dept2.id && s.date === wizardState.selectedDate);
      const col2 = window.UI.renderTimelineColumn(dept2, slots2, wizardState.dept2Slot?.id, wizardState.dept1Slot, (chosenSlot) => {
        wizardState.dept2Slot = chosenSlot;
        renderStep3ParallelTimelines();
        window.UI.showToast(`Đã chọn ca [${chosenSlot.startTime} - ${chosenSlot.endTime}] cho ${dept2.name}`, 'success');
      });
      parallelContainer.appendChild(col2);
    }
  }

  document.getElementById('btn-prev-step-3')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btn-next-step-3')?.addEventListener('click', () => {
    if (!wizardState.dept1Slot) {
      const dept1 = store.getDepartmentById(wizardState.selectedDeptIds[0]);
      window.UI.showToast(`Vui lòng chọn 1 ca phỏng vấn cho ${dept1.name}.`, 'warning');
      return;
    }
    if (wizardState.selectedDeptIds[1] && !wizardState.dept2Slot) {
      const dept2 = store.getDepartmentById(wizardState.selectedDeptIds[1]);
      window.UI.showToast(`Vui lòng chọn 1 ca phỏng vấn cho ${dept2.name}.`, 'warning');
      return;
    }
    goToStep(4);
  });
  // STEP 4: REVIEW & ATOMIC SUBMIT
  function renderStep4Summary() {
    const container = document.getElementById('registration-summary-box');
    if (!container) return;

    const info = wizardState.personalInfo;
    const slot1 = wizardState.dept1Slot;
    const slot2 = wizardState.dept2Slot;

    const formatSlotDate = (dateStr) => {
      if (!dateStr) return '';
      const [yy, mm, dd] = dateStr.split('-');
      try {
        const d = new Date(parseInt(yy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()] || '';
        return `${dayName ? dayName + ', ' : ''}${dd}/${mm}/${yy}`;
      } catch (e) {
        return `${dd}/${mm}/${yy}`;
      }
    };

    const dept1 = slot1 ? (slot1.dept || store.getDepartmentById(slot1.departmentId)) : null;
    const dept2 = slot2 ? (slot2.dept || store.getDepartmentById(slot2.departmentId)) : null;

    const submitBtn = document.getElementById('btn-submit-registration');
    if (submitBtn) {
      submitBtn.innerHTML = '🔥 Xác nhận đăng ký ca';
      submitBtn.className = 'px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2 cursor-pointer';
    }

    // Dynamic slot HTML: 2 slots stacked or 1 single roomy slot
    let slotsHtml = '';
    if (slot1 && slot2) {
      slotsHtml = `
        <div class="sm:col-span-7 space-y-1.5 flex flex-col justify-center">
          <!-- NV1 -->
          <div class="bg-white/60 backdrop-blur-xs rounded-xl p-2 border-l-4 border-l-[#8B1E22] border border-amber-600/25 shadow-2xs">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-black uppercase text-[#8B1E22] flex items-center gap-1 truncate">
                <span>🎯 NV1:</span> <span class="truncate">${escapeHtml(dept1?.name || 'Ban 1')}</span>
              </span>
              <span class="text-[9px] font-mono font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                ${escapeHtml(slot1.shiftLabel || (slot1.startTime + ' – ' + slot1.endTime))}
              </span>
            </div>
            <div class="flex items-center justify-between text-[9.5px] sm:text-[10px] text-[#78350f] mt-0.5 font-medium">
              <span>📅 ${formatSlotDate(slot1.date)}</span>
              <span class="truncate max-w-[130px] sm:max-w-[150px]">📍 ${escapeHtml(slot1.location || 'P.501 - Nhà E4')}</span>
            </div>
          </div>

          <!-- NV2 -->
          <div class="bg-white/60 backdrop-blur-xs rounded-xl p-2 border-l-4 border-l-amber-600 border border-amber-600/25 shadow-2xs">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[10px] font-black uppercase text-amber-900 flex items-center gap-1 truncate">
                <span>🎯 NV2:</span> <span class="truncate">${escapeHtml(dept2?.name || 'Ban 2')}</span>
              </span>
              <span class="text-[9px] font-mono font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300 shrink-0">
                ${escapeHtml(slot2.shiftLabel || (slot2.startTime + ' – ' + slot2.endTime))}
              </span>
            </div>
            <div class="flex items-center justify-between text-[9.5px] sm:text-[10px] text-[#78350f] mt-0.5 font-medium">
              <span>📅 ${formatSlotDate(slot2.date)}</span>
              <span class="truncate max-w-[130px] sm:max-w-[150px]">📍 ${escapeHtml(slot2.location || 'P.501 - Nhà E4')}</span>
            </div>
          </div>
        </div>
      `;
    } else {
      const activeSlot = slot1 || slot2;
      const activeDept = dept1 || dept2;
      slotsHtml = `
        <div class="sm:col-span-7 flex flex-col justify-center">
          <div class="bg-white/65 backdrop-blur-xs rounded-xl p-2.5 sm:p-3 border-l-4 border-l-[#8B1E22] border border-amber-600/25 shadow-2xs space-y-1 sm:space-y-1.5">
            <div class="flex items-center justify-between gap-1">
              <span class="text-[11px] sm:text-xs font-black uppercase text-[#8B1E22] flex items-center gap-1.5 truncate">
                <span>🎯 NGUYỆN VỌNG:</span> <span class="truncate">${escapeHtml(activeDept?.name || 'Ban ứng tuyển')}</span>
              </span>
              <span class="text-[9.5px] sm:text-[10px] font-mono font-bold text-amber-950 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-300 shrink-0">
                ${escapeHtml(activeSlot?.shiftLabel || (activeSlot?.startTime + ' – ' + activeSlot?.endTime))}
              </span>
            </div>
            <div class="text-[11px] sm:text-xs text-[#451a03] font-bold">
              📅 ${formatSlotDate(activeSlot?.date)}
            </div>
            <div class="text-[10px] sm:text-[11px] text-[#78350f] font-medium">
              📍 Địa điểm: <strong>${escapeHtml(activeSlot?.location || 'Phòng 501 - Nhà E4, 144 Xuân Thủy')}</strong>
            </div>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="wonka-ticket-wrapper">
        <div class="wonka-ticket-content">
          
          <!-- 1. HEADER (Giãn dòng thoáng + Kéo xuống + Chỉ giữ Slogan) -->
          <div class="text-center pt-2 sm:pt-3 space-y-1 sm:space-y-1.5">
            <div>
              <span class="text-[10px] sm:text-[11.5px] font-black uppercase tracking-[0.3em] text-[#8B1E22]">
                ★ WONKA GOLDEN TICKET ★
              </span>
            </div>
            <h1 class="text-lg sm:text-[25px] font-black tracking-normal text-[#451a03] uppercase drop-shadow-xs leading-snug py-0.5">
              TẤM VÉ BƯỚC VÀO VÒNG PHỎNG VẤN
            </h1>
            <div class="text-[11px] sm:text-xs font-bold text-[#78350f] tracking-wider italic">
              “Be The Flavor We're Missing”
            </div>
          </div>

          <!-- 2. BODY CONTENT: CANDIDATE INFO + INTERVIEW SLOTS -->
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5 my-auto">
            
            <!-- Left Column: Thông tin ứng viên (5/12 cols) -->
            <div class="sm:col-span-5 bg-white/50 backdrop-blur-xs rounded-xl p-2 sm:p-2.5 border border-amber-600/25 flex flex-col justify-between shadow-2xs">
              <div>
                <div class="flex items-center justify-between pb-1 mb-1 border-b border-amber-600/20">
                  <span class="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#8B1E22]">👤 ỨNG VIÊN</span>
                  <span class="text-[9px] font-mono font-bold bg-amber-200/80 text-[#78350f] px-1.5 py-0.2 rounded">MSV: ${escapeHtml(info.studentId)}</span>
                </div>
                <div class="text-xs sm:text-sm font-black text-[#451a03] leading-snug">
                  ${escapeHtml(info.fullName)}
                </div>
                ${info.academicClass ? `
                <div class="text-[10px] text-[#78350f] font-medium leading-tight mt-0.5">
                  ${escapeHtml(info.academicClass)}
                </div>` : ''}
              </div>

              <div class="space-y-0.5 pt-1.5 border-t border-amber-600/15 text-[9.5px] sm:text-[10px] text-[#78350f]">
                <div class="flex items-center gap-1 truncate">
                  <span class="text-amber-800">✉</span> <span class="font-medium truncate">${escapeHtml(info.email)}</span>
                </div>
                <div class="flex items-center gap-1">
                  <span class="text-amber-800">☎</span> <span class="font-bold">${escapeHtml(info.phone)}</span>
                </div>
              </div>
            </div>

            <!-- Right Column: Ca phỏng vấn đã chọn (7/12 cols) -->
            ${slotsHtml}

          </div>

        </div>
      </div>
    `;
  }

  document.getElementById('btn-prev-step-4')?.addEventListener('click', () => goToStep(3));

  function executeRegistrationSubmit() {
    const submitBtn = document.getElementById('btn-submit-registration');
    if (!submitBtn || submitBtn.disabled) return;
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Đang xử lý đăng ký...';

    try {
      if (!wizardState.personalInfo || !wizardState.personalInfo.fullName || !wizardState.personalInfo.studentId) {
        window.UI.showToast('Vui lòng điền đầy đủ thông tin cá nhân ở Bước 1.', 'warning');
        goToStep(1);
        return;
      }

      if (!wizardState.dept1Slot) {
        window.UI.showToast('Vui lòng chọn ca phỏng vấn ở Bước 3.', 'warning');
        goToStep(3);
        return;
      }

      const result = store.registerCandidate({
        personalInfo: wizardState.personalInfo,
        dept1SlotId: wizardState.dept1Slot?.id,
        dept2SlotId: wizardState.dept2Slot?.id
      });

      showSuccessModal(result.candidate, result.registrations);
      window.UI.showToast('Đăng ký ca phỏng vấn thành công!', 'success');

      // Reset Wizard
      document.getElementById('wizard-form')?.reset();
      wizardState.personalInfo = {};
      wizardState.selectedDeptIds = [];
      wizardState.dept1Slot = null;
      wizardState.dept2Slot = null;
      goToStep(1);

    } catch (err) {
      window.UI.showToast(err.message || 'Lỗi khi đăng ký', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  document.getElementById('btn-submit-registration')?.addEventListener('click', (e) => {
    e.preventDefault();
    executeRegistrationSubmit();
  });

  document.getElementById('wizard-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    executeRegistrationSubmit();
  });

  function showSuccessModal(candidate, registrations) {
    const modal = document.getElementById('success-modal');
    if (!modal) return;

    // Trigger celebration confetti cannon
    triggerConfetti();

    const container = document.getElementById('success-registrations-list');
    container.innerHTML = '';
    const activeCamp = store.getActiveCampaign();

    const badge = document.getElementById('success-modal-badge');
    const title = document.getElementById('success-modal-title');
    const subtitle = document.getElementById('success-modal-subtitle');

    if (badge) {
      badge.className = 'text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block';
      badge.textContent = 'ĐĂNG KÝ THÀNH CÔNG';
    }
    if (title) {
      title.textContent = 'Hẹn Gặp Bạn Tại Buổi Phỏng Vấn!';
    }
    if (subtitle) {
      subtitle.textContent = 'Dùng Mã sinh viên (MSV) + Email để tra cứu hoặc đổi ca khi cần.';
    }

    const formatSlotDate = (dateStr) => {
      if (!dateStr) return '';
      const [yy, mm, dd] = dateStr.split('-');
      try {
        const d = new Date(parseInt(yy, 10), parseInt(mm, 10) - 1, parseInt(dd, 10));
        const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        const dayName = days[d.getDay()] || '';
        return `${dayName ? dayName + ', ' : ''}${dd}/${mm}/${yy}`;
      } catch (e) {
        return `${dd}/${mm}/${yy}`;
      }
    };

    registrations.forEach(reg => {
      const slot = store.getSlotById(reg.slotId);
      const dept = store.getDepartmentById(reg.departmentId);

      const item = document.createElement('div');
      item.className = 'p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-300/80 text-xs text-amber-950 space-y-2 shadow-2xs';
      item.innerHTML = `
        <div class="flex items-center justify-between gap-2 border-b border-amber-200/70 pb-2">
          <div class="flex items-center gap-2">
            <span class="text-base">🎯</span>
            <span class="text-amber-950 uppercase font-black tracking-wide text-xs sm:text-sm">
              ${escapeHtml(dept?.name || 'Ban Chuyên Môn')}
            </span>
          </div>
          <span class="font-mono font-bold text-[11px] text-amber-950 bg-white/95 px-2.5 py-1 rounded-xl border border-amber-300 shadow-2xs shrink-0">
            ${escapeHtml(slot?.shiftLabel || (slot?.startTime + ' – ' + slot?.endTime))}
          </span>
        </div>
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11.5px] text-[#78350f]">
          <div class="flex items-center gap-1.5 font-bold text-amber-950">
            <span>📅</span>
            <span>${formatSlotDate(slot?.date)}</span>
          </div>
          <div class="flex items-center gap-1.5 font-medium truncate">
            <span>📍</span>
            <span class="truncate">${escapeHtml(slot?.location || 'Phòng 501 - Nhà E4, 144 Xuân Thủy')}</span>
          </div>
        </div>
      `;

      container.appendChild(item);
    });

    modal.classList.remove('hidden');
  }

  // --- CANDIDATE LOOKUP & EMAIL OTP FLOW ---
  function maskEmail(email) {
    if (!email || !email.includes('@')) return email;
    const [user, domain] = email.split('@');
    if (user.length <= 3) return `${user.slice(0, 1)}***@${domain}`;
    return `${user.slice(0, 3)}***${user.slice(-2)}@${domain}`;
  }

  let resendTimer = null;
  function startResendCountdown() {
    let timeLeft = 60;
    const resendBtn = document.getElementById('btn-resend-otp');
    if (!resendBtn) return;

    resendBtn.disabled = true;
    resendBtn.innerHTML = `Gửi lại mã (<span id="resend-countdown">${timeLeft}s</span>)`;

    if (resendTimer) clearInterval(resendTimer);
    resendTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft <= 0) {
        clearInterval(resendTimer);
        resendBtn.disabled = false;
        resendBtn.innerHTML = '🔄 Gửi lại mã OTP';
      } else {
        resendBtn.innerHTML = `Gửi lại mã (<span id="resend-countdown">${timeLeft}s</span>)`;
      }
    }, 1000);
  }

  // Chặn Enter tự động submit khi đang nhập dở MSV
  document.getElementById('lookup-studentid')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('lookup-email')?.focus();
    }
  });

  function checkDeviceOtpSpam() {
    const KEY = 'mcc_device_otp_history';
    const now = Date.now();
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch(e) { history = []; }

    // Lọc các lần gửi trong vòng 10 phút qua
    history = history.filter(t => (now - t) < 10 * 60 * 1000);
    if (history.length >= 5) {
      throw new Error('Thiết bị này đã yêu cầu OTP 5 lần liên tiếp. Vui lòng thử lại sau 10 phút.');
    }
    history.push(now);
    try { localStorage.setItem(KEY, JSON.stringify(history)); } catch(e) {}
  }

  const formReqOtp = document.getElementById('form-request-otp');
  if (formReqOtp) {
    formReqOtp.addEventListener('submit', async (e) => {
      e.preventDefault();
      const stId = document.getElementById('lookup-studentid').value.trim();
      const email = document.getElementById('lookup-email').value.trim().toLowerCase();
      const btnSubmitReq = document.getElementById('btn-submit-request-otp') || formReqOtp.querySelector('button[type="submit"]');

      // Ràng buộc kiểm tra đầu vào trước khi cấp mã OTP
      if (!stId || !SECURITY_REGEX.STUDENT_ID.test(stId)) {
        window.UI.showToast('Mã sinh viên (MSV) phải gồm đúng 8 chữ số (Ví dụ: 24050001).', 'warning');
        return;
      }
      if (!email || email.length > 80 || !SECURITY_REGEX.EMAIL.test(email)) {
        window.UI.showToast('Địa chỉ email không đúng định dạng chuẩn (Ví dụ: name@gmail.com).', 'warning');
        return;
      }

      if (btnSubmitReq) {
        btnSubmitReq.disabled = true;
        btnSubmitReq.classList.add('opacity-85', 'cursor-wait');
        btnSubmitReq.innerHTML = `
          <svg class="animate-spin -ml-0.5 h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="tracking-wide animate-pulse">Đang gửi mã xác thực OTP...</span>
        `;
      }

      try {
        checkDeviceOtpSpam();
        const res = store.requestOtp(stId, email);

        // Kích hoạt gửi Email OTP tự động tới hòm thư sinh viên
        if (window.EmailService) {
          await window.EmailService.sendOtpEmail({
            recipientEmail: res.email || email,
            candidateName: res.candidate?.fullName,
            studentId: res.candidate?.studentId || stId,
            otpCode: res.otpCode
          });
        }

        window.UI.showToast(`Mã OTP đã được gửi đến email ${maskEmail(res.email || email)}!`, 'success');

        if (res.email) {
          document.getElementById('lookup-email').value = res.email;
        }

        // Cập nhật email bị ẩn bảo mật
        const maskedEl = document.getElementById('otp-sent-masked-email');
        if (maskedEl) {
          maskedEl.textContent = maskEmail(res.email || email);
        }

        // Xóa trống ô nhập để người dùng tự nhập mã OTP nhận được
        const otpInput = document.getElementById('lookup-otp-input');
        if (otpInput) {
          otpInput.value = '';
        }

        document.getElementById('lookup-request-box').classList.add('hidden');
        document.getElementById('lookup-verify-box').classList.remove('hidden');
        startResendCountdown();
        otpInput?.focus();

      } catch (err) {
        window.UI.showToast(err.message, 'error');
      } finally {
        if (btnSubmitReq) {
          btnSubmitReq.disabled = false;
          btnSubmitReq.classList.remove('opacity-85', 'cursor-wait');
          btnSubmitReq.innerHTML = `<span>✉️</span> <span>Gửi mã OTP xác thực</span>`;
        }
      }
    });
  }

  // Nút gửi lại mã OTP
  document.getElementById('btn-resend-otp')?.addEventListener('click', async () => {
    const stId = document.getElementById('lookup-studentid').value.trim();
    const email = document.getElementById('lookup-email').value.trim().toLowerCase();
    const btnResend = document.getElementById('btn-resend-otp');

    if (!stId || !SECURITY_REGEX.STUDENT_ID.test(stId)) {
      window.UI.showToast('Mã sinh viên (MSV) phải gồm đúng 8 chữ số.', 'warning');
      return;
    }
    if (!email || email.length > 80 || !SECURITY_REGEX.EMAIL.test(email)) {
      window.UI.showToast('Địa chỉ email không đúng định dạng.', 'warning');
      return;
    }

    if (btnResend) {
      btnResend.disabled = true;
      btnResend.textContent = 'Đang gửi lại...';
    }

    try {
      checkDeviceOtpSpam();
      const res = store.requestOtp(stId, email);
      if (window.EmailService) {
        await window.EmailService.sendOtpEmail({
          recipientEmail: res.email || email,
          candidateName: res.candidate?.fullName,
          studentId: res.candidate?.studentId || stId,
          otpCode: res.otpCode
        });
      }
      window.UI.showToast('Đã gửi lại mã OTP thành công!', 'success');
      startResendCountdown();
      const otpInput = document.getElementById('lookup-otp-input');
      if (otpInput) { otpInput.value = ''; otpInput.focus(); }
    } catch (err) {
      window.UI.showToast(err.message, 'error');
      if (btnResend) btnResend.disabled = false;
    }
  });

  document.getElementById('btn-back-to-request-otp')?.addEventListener('click', () => {
    if (resendTimer) clearInterval(resendTimer);
    document.getElementById('lookup-verify-box').classList.add('hidden');
    document.getElementById('lookup-request-box').classList.remove('hidden');
  });

  const formVerifyOtp = document.getElementById('form-verify-otp');
  if (formVerifyOtp) {
    formVerifyOtp.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('lookup-email').value.trim();
      const otpCode = document.getElementById('lookup-otp-input').value.trim();
      const btnVerify = document.getElementById('btn-submit-verify-otp');

      if (!otpCode || otpCode.length < 6) {
        window.UI.showToast('Vui lòng nhập đủ 6 chữ số mã OTP.', 'warning');
        return;
      }

      if (btnVerify) {
        btnVerify.disabled = true;
        btnVerify.classList.add('opacity-85', 'cursor-wait');
        btnVerify.innerHTML = `
          <svg class="animate-spin -ml-0.5 h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="tracking-wide animate-pulse">Đang kiểm tra mã OTP...</span>
        `;
      }

      try {
        const details = store.verifyOtp(email, otpCode);
        authenticatedCandidateData = details;
        window.UI.showToast('Xác thực OTP thành công!', 'success');

        if (resendTimer) clearInterval(resendTimer);
        document.getElementById('lookup-verify-box').classList.add('hidden');
        renderCandidateSelfServiceDashboard();

      } catch (err) {
        window.UI.showToast(err.message, 'error');
      } finally {
        if (btnVerify) {
          btnVerify.disabled = false;
          btnVerify.classList.remove('opacity-85', 'cursor-wait');
          btnVerify.innerHTML = `✓ Xác thực & Mở lịch hẹn`;
        }
      }
    });
  }

  function renderCandidateSelfServiceDashboard() {
    if (!authenticatedCandidateData) return;
    const { candidate, registrations } = authenticatedCandidateData;

    document.getElementById('dash-cand-name').textContent = candidate.fullName;
    document.getElementById('dash-cand-class').textContent = candidate.academicClass || 'UEB Student';
    document.getElementById('dash-cand-info').textContent = `MSV: ${candidate.studentId} • Email: ${candidate.email} • SĐT: ${candidate.phone}`;

    const container = document.getElementById('candidate-registrations-container');
    container.innerHTML = '';

    const isAfterDeadline = store.isPastDeadline(candidate.campaignId);

    if (registrations.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-500 py-6 text-center col-span-full">Bạn không có ca phỏng vấn nào đang hoạt động.</p>';
    } else {
      registrations.forEach(reg => {
        const card = window.UI.renderCandidateRegistrationCard(reg, isAfterDeadline, (targetReg) => {
          openCandidateRescheduleModal(targetReg);
        }, (targetReg) => {
          if (confirm(`Bạn có chắc chắn muốn hủy ca phỏng vấn ban [${targetReg.dept.name}]?`)) {
            try {
              store.cancelRegistration(targetReg.id);
              window.UI.showToast('Đã hủy đăng ký ca thành công.', 'info');
              // Refresh details
              authenticatedCandidateData = store.getCandidateFullDetails(candidate.id);
              renderCandidateSelfServiceDashboard();
            } catch (err) {
              window.UI.showToast(err.message, 'error');
            }
          }
        });
        container.appendChild(card);
      });
    }

    document.getElementById('lookup-dashboard').classList.remove('hidden');
  }

  let currentCandidateRescheduleReg = null;
  let selectedNewSlotIdForCandidate = null;

  function openCandidateRescheduleModal(reg) {
    currentCandidateRescheduleReg = reg;
    selectedNewSlotIdForCandidate = null;

    const modal = document.getElementById('modal-candidate-reschedule');
    if (!modal) return;

    const dept = reg.dept || store.getDepartmentById(reg.departmentId);
    const curSlot = reg.slot || store.getSlotById(reg.slotId);

    document.getElementById('reschedule-modal-dept-title').textContent = dept?.name || 'Ban Ứng Tuyển';
    document.getElementById('reschedule-modal-current-slot').textContent = curSlot
      ? `${curSlot.shiftLabel || `${curSlot.startTime} - ${curSlot.endTime}`} (Ngày ${curSlot.date})`
      : 'Chưa xác định';

    const activeCamp = store.getActiveCampaign();
    const availableSlots = store.getSlots(activeCamp.id).filter(s =>
      s.departmentId === reg.departmentId &&
      s.id !== reg.slotId &&
      s.isOpen &&
      !s.isFull
    );

    const slotsListEl = document.getElementById('reschedule-slots-list');
    const confirmBtn = document.getElementById('btn-confirm-candidate-reschedule');
    slotsListEl.innerHTML = '';
    confirmBtn.disabled = true;

    if (availableSlots.length === 0) {
      slotsListEl.innerHTML = `
        <div class="p-6 text-center text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
          <span class="text-2xl block mb-2">⚠️</span>
          <p class="font-bold text-slate-700">Rất tiếc, các ca phỏng vấn khác của ban này đã kín chỗ.</p>
          <p class="text-[11px] text-slate-400">Vui lòng liên hệ Hotline Ban Tuyển Quân để được hỗ trợ đặc biệt.</p>
        </div>
      `;
      modal.classList.remove('hidden');
      return;
    }

    availableSlots.forEach((s, idx) => {
      const [yy, mm, dd] = s.date.split('-');
      const card = document.createElement('div');
      card.className = 'reschedule-slot-card p-3.5 rounded-2xl border-2 border-slate-200 hover:border-[#8B1E22]/60 bg-white hover:bg-red-50/20 transition-all cursor-pointer flex items-center justify-between gap-3';
      card.dataset.slotId = s.id;

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
            ${idx + 1}
          </div>
          <div>
            <div class="font-bold text-slate-900 text-xs">
              ${s.shiftLabel ? `${s.shiftLabel} (${s.startTime} - ${s.endTime})` : `${s.startTime} - ${s.endTime}`} • Ngày ${dd}/${mm}/${yy}
            </div>
            <div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
              <span>📍 ${escapeHtml(s.location || 'Phòng 501 - Nhà E4')}</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Còn ${s.remainingCount} chỗ
          </span>
          <div class="selection-circle w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-white text-[10px] font-black transition-all"></div>
        </div>
      `;

      card.addEventListener('click', () => {
        selectedNewSlotIdForCandidate = s.id;
        document.querySelectorAll('.reschedule-slot-card').forEach(c => {
          c.classList.remove('border-[#8B1E22]', 'bg-red-50/30', 'shadow-xs');
          c.classList.add('border-slate-200');
          const circle = c.querySelector('.selection-circle');
          if (circle) {
            circle.className = 'selection-circle w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-white text-[10px] font-black transition-all';
            circle.textContent = '';
          }
        });

        card.classList.remove('border-slate-200');
        card.classList.add('border-[#8B1E22]', 'bg-red-50/30', 'shadow-xs');
        const circle = card.querySelector('.selection-circle');
        if (circle) {
          circle.className = 'selection-circle w-5 h-5 rounded-full border-2 border-[#8B1E22] bg-[#8B1E22] flex items-center justify-center text-white text-[10px] font-black transition-all';
          circle.textContent = '✓';
        }

        confirmBtn.disabled = false;
      });

      slotsListEl.appendChild(card);
    });

    modal.classList.remove('hidden');
  }

  document.getElementById('btn-confirm-candidate-reschedule')?.addEventListener('click', () => {
    if (!currentCandidateRescheduleReg || !selectedNewSlotIdForCandidate) return;

    try {
      store.rescheduleRegistration(currentCandidateRescheduleReg.id, selectedNewSlotIdForCandidate, 'Ứng viên tự đổi ca qua cổng tra cứu');
      window.UI.showToast('Chúc mừng bạn đã đổi ca phỏng vấn thành công!', 'success');
      document.getElementById('modal-candidate-reschedule')?.classList.add('hidden');

      if (authenticatedCandidateData) {
        authenticatedCandidateData = store.getCandidateFullDetails(authenticatedCandidateData.candidate.id);
        renderCandidateSelfServiceDashboard();
      }
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-logout-candidate')?.addEventListener('click', () => {
    authenticatedCandidateData = null;
    document.getElementById('lookup-dashboard').classList.add('hidden');
    document.getElementById('lookup-request-box').classList.remove('hidden');
    document.getElementById('form-request-otp').reset();
  });
  // --- INTERVIEWER WORKSPACE ---
  let currentCheckinDate = 'all';
  let currentCheckinShift = 'all';

  function renderInterviewerWorkspace() {
    const currentAdmin = store.getCurrentAdmin();
    if (!currentAdmin) return;
    const activeCamp = store.getActiveCampaign();
    const canCheckinAll = store.hasPermission('checkin:view_all');
    const hasDept = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const isDeptLead = !canCheckinAll && hasDept;
    const myDeptId = hasDept ? currentAdmin.deptId : null;

    if (isDeptLead) {
      currentInterviewerDept = myDeptId;
    } else if (!currentInterviewerDept) {
      currentInterviewerDept = 'all';
    }

    const departments = store.getDepartments();
    const slots = store.getSlots(activeCamp.id, isDeptLead ? myDeptId : (currentInterviewerDept === 'all' ? null : currentInterviewerDept));

    // Department tabs with RBAC enforcement
    const tabsContainer = document.getElementById('interviewer-dept-tabs');
    if (tabsContainer) {
      if (isDeptLead) {
        const myDept = store.getDepartmentById(myDeptId);
        tabsContainer.innerHTML = `
          <div class="px-4 py-2 rounded-2xl text-xs font-black bg-[#8B1E22] text-white shadow-md flex items-center gap-2">
            <span>🔒 Phân quyền Ban chuyên môn:</span>
            <span>${myDept ? myDept.name : ''} (Điểm danh ca phỏng vấn ban của bạn)</span>
          </div>
        `;
      } else {
        // Ban Chủ Nhiệm, Mentor, Ban Nhân Sự: Toàn quyền điểm danh cả 6 ban
        tabsContainer.innerHTML = `
          <div class="w-full mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <span class="text-base">👑</span>
            <span>Toàn quyền quản trị (${currentAdmin?.fullName || 'Ban Quản Trị'}): Điểm danh và theo dõi tiến độ toàn bộ 6 ban</span>
          </div>
          <div id="full-access-tabs-btn-box" class="flex flex-wrap gap-2">
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === 'all' ? 'bg-[#8B1E22] text-white shadow-sm ring-2 ring-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-dept="all">
              Tất cả 6 ban
            </button>
          </div>
        `;
        const btnBox = tabsContainer.querySelector('#full-access-tabs-btn-box');
        departments.forEach(dept => {
          const btn = document.createElement('button');
          btn.className = `px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === dept.id ? 'bg-[#8B1E22] text-white shadow-sm ring-2 ring-red-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
          btn.textContent = dept.short;
          btn.onclick = () => {
            currentInterviewerDept = dept.id;
            currentCheckinDate = 'all';
            currentCheckinShift = 'all';
            renderInterviewerWorkspace();
          };
          btnBox.appendChild(btn);
        });
        btnBox.querySelector('[data-dept="all"]').onclick = () => {
          currentInterviewerDept = 'all';
          currentCheckinDate = 'all';
          currentCheckinShift = 'all';
          renderInterviewerWorkspace();
        };
      }
    }

    // --- 2-TIER FILTER PILLS: DATE & SHIFTS ---
    // 1. Date Pills
    const dateContainer = document.getElementById('checkin-date-pills');
    if (dateContainer) {
      dateContainer.innerHTML = '';
      const uniqueDates = Array.from(new Set(slots.map(s => s.date))).filter(Boolean).sort();

      const allDateBtn = document.createElement('button');
      allDateBtn.type = 'button';
      allDateBtn.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
        currentCheckinDate === 'all'
          ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400'
          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
      }`;
      allDateBtn.textContent = '📅 Tất cả ngày';
      allDateBtn.onclick = () => {
        currentCheckinDate = 'all';
        renderInterviewerWorkspace();
      };
      dateContainer.appendChild(allDateBtn);

      uniqueDates.forEach(dStr => {
        const [y, m, d] = dStr.split('-');
        const dt = new Date(Number(y), Number(m) - 1, Number(d));
        const days = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const dayName = days[dt.getDay()];

        const dateBtn = document.createElement('button');
        dateBtn.type = 'button';
        dateBtn.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
          currentCheckinDate === dStr
            ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400'
            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
        }`;
        dateBtn.textContent = `${d}/${m} (${dayName})`;
        dateBtn.onclick = () => {
          currentCheckinDate = dStr;
          renderInterviewerWorkspace();
        };
        dateContainer.appendChild(dateBtn);
      });
    }

    // 2. Shift Pills
    const shiftContainer = document.getElementById('checkin-shift-pills');
    if (shiftContainer) {
      shiftContainer.innerHTML = '';
      const uniqueShifts = Array.from(new Set(slots.map(s => s.shiftLabel || (s.startTime + ' - ' + s.endTime)))).filter(Boolean).sort();

      const allShiftBtn = document.createElement('button');
      allShiftBtn.type = 'button';
      allShiftBtn.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
        currentCheckinShift === 'all'
          ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400'
          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
      }`;
      allShiftBtn.textContent = '🕒 Tất cả ca';
      allShiftBtn.onclick = () => {
        currentCheckinShift = 'all';
        renderInterviewerWorkspace();
      };
      shiftContainer.appendChild(allShiftBtn);

      uniqueShifts.forEach(shiftName => {
        const shiftBtn = document.createElement('button');
        shiftBtn.type = 'button';
        shiftBtn.className = `px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
          currentCheckinShift === shiftName
            ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400'
            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
        }`;
        shiftBtn.textContent = shiftName;
        shiftBtn.onclick = () => {
          currentCheckinShift = shiftName;
          renderInterviewerWorkspace();
        };
        shiftContainer.appendChild(shiftBtn);
      });
    }

    // 3. Registrations query (Strictly confirmed only)
    const allRegs = store.data.registrations
      .filter(r => r.campaignId === activeCamp.id && r.status === 'confirmed')
      .map(r => ({
        ...r,
        candidate: store.data.candidates.find(c => c.id === r.candidateId),
        slot: store.getSlotById(r.slotId),
        dept: store.getDepartmentById(r.departmentId)
      }));

    const filtered = allRegs.filter(r => {
      if (isDeptLead && r.departmentId !== myDeptId) return false;
      if (!isDeptLead && currentInterviewerDept !== 'all' && r.departmentId !== currentInterviewerDept) return false;
      if (currentCheckinDate !== 'all' && r.slot?.date !== currentCheckinDate) return false;
      if (currentCheckinShift !== 'all' && r.slot?.shiftLabel !== currentCheckinShift && (r.slot?.startTime + ' - ' + r.slot?.endTime) !== currentCheckinShift) return false;
      return true;
    });

    // 4. Quick stats badge
    const quickStatsBadge = document.getElementById('checkin-quick-stats-badge');
    if (quickStatsBadge) {
      quickStatsBadge.innerHTML = `📋 Hiển thị: <strong>${filtered.length}</strong> ứng viên chính thức`;
    }

    const tbody = document.getElementById('interviewer-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="py-12 text-center text-slate-400 text-xs">Chưa có ứng viên chính thức nào trong ca đã chọn.</td></tr>';
      return;
    }

    filtered.forEach(reg => {
      const slot = reg.slot;
      const cand = reg.candidate || {};
      const [yy, mm, dd] = (slot?.date || '').split('-');
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/70 transition-all text-xs';

      const isCheckedIn = (reg.checkInStatus === 'checked-in' || reg.checkInStatus === 'attended');
      const checkInClasses = {
        'pending': 'bg-slate-100 text-slate-600',
        'checked-in': 'bg-emerald-100 text-emerald-800 font-bold',
        'attended': 'bg-emerald-100 text-emerald-800 font-bold',
        'absent': 'bg-rose-100 text-rose-700 font-bold'
      };

      tr.innerHTML = `
        <td class="px-4 py-3 font-mono font-black text-slate-900">${escapeHtml(cand.studentId || '-')}</td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900">${escapeHtml(cand.fullName || 'N/A')}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(cand.academicClass || '')}</div>
        </td>
        <td class="px-4 py-3 font-bold text-orange-700">${escapeHtml(reg.dept?.name || '')}</td>
        <td class="px-4 py-3">
          <div class="font-bold">${escapeHtml(slot?.shiftLabel || (slot?.startTime + ' - ' + slot?.endTime) || '')}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(dd)}/${escapeHtml(mm)} • 📍 ${escapeHtml(slot?.location || 'Phòng 501 - Nhà E4')}</div>
        </td>
        <td class="px-4 py-3 text-slate-600 font-medium">
          <div>${escapeHtml(cand.phone || '-')}</div>
          <div class="text-[10px] text-slate-400">${escapeHtml(cand.email || '')}</div>
        </td>
        <td class="px-4 py-3 text-right">
          ${store.hasPermission('checkin:mark_status') ? `
            <select class="checkin-select text-xs rounded-xl border border-slate-200 py-1.5 px-3 ${checkInClasses[reg.checkInStatus] || checkInClasses['pending']} outline-none font-bold cursor-pointer transition-all">
              <option value="pending" ${reg.checkInStatus === 'pending' ? 'selected' : ''}>⏳ Chờ đến</option>
              <option value="checked-in" ${isCheckedIn ? 'selected' : ''}>🟢 Đã đến</option>
              <option value="absent" ${reg.checkInStatus === 'absent' ? 'selected' : ''}>🔴 Vắng mặt</option>
            </select>
          ` : `
            <span class="inline-block px-3 py-1 text-xs rounded-xl ${checkInClasses[reg.checkInStatus] || checkInClasses['pending']} font-bold">
              ${isCheckedIn ? '🟢 Đã đến' : reg.checkInStatus === 'absent' ? '🔴 Vắng mặt' : '⏳ Chờ đến'}
            </span>
          `}
        </td>
      `;

      if (store.hasPermission('checkin:mark_status')) {
        const sel = tr.querySelector('.checkin-select');
        if (sel) {
          sel.onchange = (e) => {
            store.updateCheckInStatus(reg.id, e.target.value);
            window.UI.showToast(`Đã cập nhật trạng thái điểm danh cho [${cand.fullName}]`, 'success');
            renderInterviewerWorkspace();
          };
        }
      }

      tbody.appendChild(tr);
    });
  }

  // --- ADMIN AUTHENTICATION CONTROLLER ---
  function setupAdminLoginForm() {
    const form = document.getElementById('form-admin-login');
    if (!form) return;

    const btnSubmit = document.getElementById('btn-admin-login-submit') || form.querySelector('button[type="submit"]');
    const userInput = document.getElementById('admin-login-username');
    const passInput = document.getElementById('admin-login-password');
    const quickButtons = document.querySelectorAll('.btn-quick-admin-login');

    const setAdminLoginLoading = (isLoading) => {
      if (btnSubmit) {
        if (isLoading) {
          btnSubmit.disabled = true;
          btnSubmit.classList.add('opacity-85', 'cursor-wait', 'scale-[0.99]');
          btnSubmit.classList.remove('cursor-pointer', 'hover:from-[#721418]', 'hover:to-[#8B1E22]');
          btnSubmit.innerHTML = `
            <svg class="animate-spin -ml-0.5 h-4 w-4 text-white shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="tracking-wide animate-pulse">Đang kiểm tra tài khoản...</span>
          `;
        } else {
          btnSubmit.disabled = false;
          btnSubmit.classList.remove('opacity-85', 'cursor-wait', 'scale-[0.99]');
          btnSubmit.classList.add('cursor-pointer', 'hover:from-[#721418]', 'hover:to-[#8B1E22]');
          btnSubmit.innerHTML = `
            <span id="admin-login-btn-icon">🔐</span>
            <span id="admin-login-btn-text">Đăng nhập</span>
          `;
        }
      }
      if (userInput) userInput.readOnly = isLoading;
      if (passInput) passInput.readOnly = isLoading;
      quickButtons.forEach(btn => {
        btn.disabled = isLoading;
        if (isLoading) {
          btn.classList.add('pointer-events-none', 'opacity-50');
        } else {
          btn.classList.remove('pointer-events-none', 'opacity-50');
        }
      });
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const u = userInput ? userInput.value : '';
      const p = passInput ? passInput.value : '';

      setAdminLoginLoading(true);
      try {
        const admin = await store.authenticateAdmin(u, p);
        const roleStr = admin.role ? ` (${admin.role})` : '';
        window.UI.showToast(`Xin chào ${admin.fullName}${roleStr}!`, 'success');
        currentActiveAdminTab = 'slots';
        currentInterviewerDept = (admin.deptId && admin.deptId !== 'all') ? admin.deptId : 'all';
        renderAdminWorkspace();
      } catch (err) {
        window.UI.showToast(err.message, 'error');
      } finally {
        setAdminLoginLoading(false);
      }
    };

    // Toggle password visibility button
    const btnTogglePass = document.getElementById('btn-toggle-admin-password');
    if (btnTogglePass) {
      btnTogglePass.onclick = () => {
        const passEl = document.getElementById('admin-login-password');
        if (passEl) {
          const isPass = passEl.type === 'password';
          passEl.type = isPass ? 'text' : 'password';
          btnTogglePass.textContent = isPass ? '🙈' : '👁️';
          btnTogglePass.title = isPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
        }
      };
    }

    // Quick demo login buttons
    quickButtons.forEach(btn => {
      btn.onclick = async () => {
        const u = btn.getAttribute('data-user');
        const p = btn.getAttribute('data-pass');
        if (userInput) userInput.value = u;
        if (passInput) passInput.value = p;
        setAdminLoginLoading(true);
        try {
          const admin = await store.authenticateAdmin(u, p);
          window.UI.showToast(`Đăng nhập nhanh thành công: ${admin.fullName}`, 'success');
          currentActiveAdminTab = 'slots';
          currentInterviewerDept = (admin.deptId && admin.deptId !== 'all') ? admin.deptId : 'all';
          renderAdminWorkspace();
        } catch (err) {
          window.UI.showToast(err.message, 'error');
        } finally {
          setAdminLoginLoading(false);
        }
      };
    });
  }

  // --- ADMIN WORKSPACE (PROTECTED WITH AUTHENTICATION) ---
  function renderAdminWorkspace() {
    const currentAdmin = store.getCurrentAdmin();

    const loginCard = document.getElementById('admin-login-card');
    const dashboardView = document.getElementById('admin-dashboard-view');
    const navAdminBtn = document.getElementById('nav-btn-admin');
    const navProfileBadge = document.getElementById('nav-admin-profile-badge');

    // 1. If not logged in -> Show Login Card, hide Dashboard
    if (!currentAdmin) {
      if (loginCard) loginCard.classList.remove('hidden');
      if (dashboardView) dashboardView.classList.add('hidden');
      setupAdminLoginForm();
      return;
    }

    // 2. If authenticated -> Hide Login Card, show Dashboard
    if (loginCard) loginCard.classList.add('hidden');
    if (dashboardView) dashboardView.classList.remove('hidden');

    // Update Admin Profile Badge (Placed right below Quản Trị Admin 🔒)
    const avatarEl = document.getElementById('admin-profile-avatar');
    const nameEl = document.getElementById('admin-profile-name');
    const roleEl = document.getElementById('admin-profile-role');
    if (avatarEl) avatarEl.textContent = currentAdmin.avatar || '👑';
    if (nameEl) nameEl.textContent = currentAdmin.fullName;
    if (roleEl) {
      if (currentAdmin.role && currentAdmin.role.trim()) {
        roleEl.textContent = currentAdmin.role;
        roleEl.classList.remove('hidden');
      } else {
        roleEl.textContent = '';
        roleEl.classList.add('hidden');
      }
    }

    // Profile Settings Button
    const profileBtn = document.getElementById('btn-open-admin-profile-modal');
    if (profileBtn) {
      profileBtn.onclick = (e) => {
        if (e) e.preventDefault();
        const cur = store.getCurrentAdmin();
        if (!cur) return;
        document.getElementById('profile-admin-username').value = cur.username;
        document.getElementById('profile-admin-role').value = `${cur.role} ${cur.deptId && cur.deptId !== 'all' ? `(${store.getDepartmentById(cur.deptId)?.name || cur.deptId})` : ''}`;
        document.getElementById('profile-admin-fullname').value = cur.fullName || '';
        document.getElementById('profile-admin-curr-pass').value = '';
        document.getElementById('profile-admin-new-pass').value = '';
        document.getElementById('profile-admin-confirm-pass').value = '';
        document.getElementById('modal-admin-profile')?.classList.remove('hidden');
        document.getElementById('profile-admin-fullname')?.focus();
      };
    }

    // Logout Button
    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        await store.logoutAdmin();
        window.UI.showToast('Đã đăng xuất khỏi tài khoản quản trị.', 'info');
        renderAdminWorkspace();
      };
    }

    const activeCamp = store.getActiveCampaign();
    const campaigns = store.getCampaigns();
    const stats = store.getStats(activeCamp.id);

    // Campaign Selector
    const campSelect = document.getElementById('admin-campaign-selector');
    if (campSelect) {
      campSelect.innerHTML = '';
      campaigns.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.gen || c.name}`;
        campSelect.appendChild(opt);
      });
      campSelect.value = activeCamp.id;

      // Khi chỉ có 1 mùa tuyển (Gen XVII), khóa selector thành badge cố định đẹp mắt để tránh bấm nhầm
      if (campaigns.length <= 1) {
        campSelect.disabled = true;
        campSelect.className = 'px-3 py-1 text-xs font-black rounded-xl border border-orange-200 bg-orange-100 text-[#8B1E22] cursor-default select-none shadow-xs';
      } else {
        campSelect.disabled = false;
        campSelect.className = 'px-3 py-1 text-xs font-bold rounded-xl border border-orange-200 bg-orange-50 text-orange-800 outline-none cursor-pointer';
      }

      campSelect.onchange = () => {
        const targetCampId = campSelect.value;
        const targetName = campSelect.options[campSelect.selectedIndex]?.text || '';
        if (confirm(`Bạn có chắc chắn muốn chuyển sang đợt tuyển [${targetName}] không?\n\n(Thao tác này sẽ thay đổi đợt tuyển hiển thị trên toàn hệ thống)`)) {
          store.setActiveCampaign(targetCampId);
          window.UI.showToast(`Đã chuyển sang đợt tuyển [${targetName}]`, 'info');
          renderAdminWorkspace();
        } else {
          campSelect.value = store.getActiveCampaign().id;
        }
      };
    }

    // Set Deadline Inputs (Strict 24-Hour text input, NO AM/PM)
    initDeadlineTimeInput();
    const dateInput = document.getElementById('admin-deadline-date');
    const timeInput = document.getElementById('admin-deadline-time');

    if (activeCamp.registrationDeadline) {
      const d = new Date(activeCamp.registrationDeadline);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const min = String(d.getMinutes()).padStart(2, '0');
      if (dateInput) dateInput.value = `${yyyy}-${mm}-${dd}`;
      if (timeInput) timeInput.value = `${hh}:${min}`;
    }

    // Configure Action Buttons based on Granular Permissions
    const canCreateCampaign = store.hasPermission('system:manage_campaign');
    ['btn-open-new-campaign-modal', 'sidebar-create-campaign-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (!canCreateCampaign) el.classList.add('hidden');
        else el.classList.remove('hidden');
      }
    });

    const canImportCsv = store.hasPermission('slots:import_csv');
    const btnImportModal = document.getElementById('btn-open-import-modal');
    if (btnImportModal) {
      if (!canImportCsv) btnImportModal.classList.add('hidden');
      else btnImportModal.classList.remove('hidden');
    }

    // Configure Deadline Card Visibility
    const deadlineBox = document.getElementById('admin-deadline-card-box');
    if (deadlineBox) {
      const canSetDeadline = store.hasPermission('slots:set_deadline');
      if (canSetDeadline) {
        deadlineBox.classList.remove('hidden');
      } else {
        deadlineBox.classList.add('hidden');
      }
    }

    // Dropdown tùy chọn mở/khóa/xóa ca: mở nếu có quyền toggle_open hoặc delete
    const slotActionsDropdown = document.getElementById('slot-actions-dropdown-container');
    if (slotActionsDropdown) {
      const canManageSlots = store.hasPermission('slots:toggle_open') || store.hasPermission('slots:delete');
      if (!canManageSlots) slotActionsDropdown.classList.add('hidden');
      else slotActionsDropdown.classList.remove('hidden');
    }

    // Seed test data button: CHỈ DÀNH RIÊNG CHO TÀI KHOẢN ADMIN
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );
    const menuSeedContainer = document.getElementById('menu-seed-container');
    if (menuSeedContainer) {
      if (isRootAdmin) menuSeedContainer.classList.remove('hidden');
      else menuSeedContainer.classList.add('hidden');
    }

    // Populate filter dropdowns with Granular Permissions scoping
    const deptSelect = document.getElementById('admin-filter-slot-dept');
    const candDeptSelect = document.getElementById('admin-cand-filter-dept');
    const departments = store.getDepartments();
    const canViewAllSlots = store.hasPermission('slots:view_all');
    const canViewAllCands = store.hasPermission('candidates:view_all');
    const hasDept = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = hasDept ? currentAdmin.deptId : null;
    const myDept = hasDept ? store.getDepartmentById(myDeptId) : null;

    if (deptSelect) {
      deptSelect.innerHTML = '';
      if (!canViewAllSlots && hasDept && myDept) {
        deptSelect.innerHTML = `<option value="${myDept.id}">${myDept.name}</option>`;
        deptSelect.value = myDept.id;
        deptSelect.disabled = true;
      } else {
        deptSelect.disabled = false;
        deptSelect.innerHTML = '<option value="all">Tất cả các ban</option>';
        departments.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.name;
          deptSelect.appendChild(opt);
        });
      }
      deptSelect.onchange = renderAdminSlotsTable;
    }

    if (candDeptSelect) {
      candDeptSelect.innerHTML = '';
      if (!canViewAllCands && hasDept && myDept) {
        candDeptSelect.innerHTML = `<option value="${myDept.id}">${myDept.name}</option>`;
        candDeptSelect.value = myDept.id;
        candDeptSelect.disabled = true;
      } else {
        candDeptSelect.disabled = false;
        candDeptSelect.innerHTML = '<option value="all">Tất cả các ban</option>';
        departments.forEach(d => {
          const opt = document.createElement('option');
          opt.value = d.id;
          opt.textContent = d.name;
          candDeptSelect.appendChild(opt);
        });
      }
      candDeptSelect.onchange = renderAdminCandidatesTable;
    }

    // Setup Sidebar Navigation & Tabs Router FIRST so navigation is always interactive
    setupAdminSidebarNav(currentAdmin);

    try {
      renderAdminSlotsTable();
    } catch (e) {
      console.error('Lỗi khi render bảng ca phỏng vấn:', e);
    }

    try {
      renderAdminCandidatesTable();
    } catch (e) {
      console.error('Lỗi khi render danh sách ứng viên:', e);
    }
  }

  let currentActiveAdminTab = 'slots';

  function switchAdminTab(tabId) {
    if (!tabId) return;
    if (tabId === 'dashboard') tabId = 'slots';
    const currentAdmin = store.getCurrentAdmin();
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );

    // Chức năng Phân quyền chỉ duy nhất tài khoản admin được phép truy cập
    if (tabId === 'permissions' && !isRootAdmin) {
      tabId = 'candidates';
    }
    currentActiveAdminTab = tabId;

    const canViewAllSlots = store.hasPermission('slots:view_all');
    const isDeptLead = !canViewAllSlots && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';

    // Panes map
    const panes = {
      candidates: document.getElementById('admin-pane-candidates'),
      slots: document.getElementById('admin-pane-slots'),
      checkin: document.getElementById('admin-pane-checkin'),
      audit: document.getElementById('admin-pane-audit'),
      permissions: document.getElementById('admin-pane-permissions')
    };

    // Titles map
    const titles = {
      candidates: 'Tổng hợp các ca phỏng vấn ứng viên đăng ký',
      slots: 'Quản lý lịch phỏng vấn',
      checkin: 'Chi tiết ca & điểm danh',
      audit: 'Lịch sử hoạt động hệ thống',
      permissions: 'Phân quyền tính năng từng tài khoản'
    };

    const titleEl = document.getElementById('admin-pane-title');
    if (titleEl && titles[tabId]) {
      titleEl.textContent = titles[tabId];
    }

    // Toggle Panes
    Object.keys(panes).forEach(k => {
      const pane = panes[k];
      if (pane) {
        if (k === tabId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      }
    });

    // Update Sidebar Navigation buttons style (Ensuring hidden tabs STAY hidden)
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      const bTab = btn.getAttribute('data-admin-tab');

      // Check role restrictions
      let isRestricted = false;
      if (bTab === 'dashboard' || bTab === 'settings' || bTab === 'options') {
        isRestricted = true;
      } else if (bTab === 'permissions' && !isRootAdmin) {
        // Chức năng phân quyền CHỈ HIỆN ở tài khoản admin
        isRestricted = true;
      } else if (bTab === 'audit' && !store.hasPermission('system:audit_log')) {
        isRestricted = true;
      }

      if (isRestricted) {
        btn.className = 'admin-nav-item hidden';
        return;
      }

      const badge = btn.querySelector('span[id^="badge-tab-"]');
      if (bTab === tabId) {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all bg-gradient-to-r from-[#8B1E22] to-[#A6282E] text-white shadow-md shadow-[#8B1E22]/25 font-bold whitespace-nowrap cursor-pointer';
        if (badge) badge.className = 'shrink-0 px-2 py-0.5 text-[10px] font-black rounded-full bg-white/25 text-white ml-1';
      } else {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-slate-700 hover:bg-red-50/70 hover:text-[#8B1E22] font-bold whitespace-nowrap cursor-pointer';
        if (badge) badge.className = 'shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 ml-1';
      }
    });

    // Trigger tab-specific refresh safely
    try {
      if (tabId === 'slots') renderAdminSlotsTable();
      else if (tabId === 'candidates') renderAdminCandidatesTable();
      else if (tabId === 'checkin') renderInterviewerWorkspace();
      else if (tabId === 'audit') renderAdminAuditLogs();
      else if (tabId === 'permissions') renderAdminPermissionsWorkspace();
    } catch (err) {
      console.error(`Lỗi khi tải nội dung tab [${tabId}]:`, err);
    }
  }

  // Luôn công khai hàm switchAdminTab ra window để click trên HTML hay JS đều hoạt động 100%
  window.switchAdminTab = switchAdminTab;

  function setupAdminSidebarNav(currentAdmin) {
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );

    const canViewAllSlots = store.hasPermission('slots:view_all');
    const isDeptLead = !canViewAllSlots && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    // 1. Default Tab Logic - Candidates is the universal landing tab
    if (!isRootAdmin && currentActiveAdminTab === 'permissions') {
      currentActiveAdminTab = 'candidates';
    } else if (!store.hasPermission('system:audit_log') && currentActiveAdminTab === 'audit') {
      currentActiveAdminTab = 'candidates';
    } else if (!currentActiveAdminTab || currentActiveAdminTab === 'dashboard' || currentActiveAdminTab === 'options') {
      currentActiveAdminTab = 'candidates';
    }

    // 2. Attach Click Handlers
    document.querySelectorAll('.admin-nav-item').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.getAttribute('data-admin-tab');
        if (tab) switchAdminTab(tab);
      };
    });

    // 3. Update count badges strictly scoped by RBAC
    const activeCamp = store.getActiveCampaign();
    const stats = store.getStats(activeCamp.id);
    const slotsCountBadge = document.getElementById('badge-tab-slots-count');
    const candsCountBadge = document.getElementById('badge-tab-cands-count');
    if (slotsCountBadge) {
      const campSlots = store.getSlots(activeCamp.id, isDeptLead ? myDeptId : null);
      animateCounter(slotsCountBadge, campSlots.length, 650, 'ca');
    }
    if (candsCountBadge) {
      if (isDeptLead) {
        const deptRegs = (store.data.registrations || []).filter(r => r.campaignId === activeCamp.id && r.departmentId === myDeptId && r.status === 'confirmed');
        animateCounter(candsCountBadge, deptRegs.length, 650, 'đơn');
      } else {
        animateCounter(candsCountBadge, stats.totalRegistrations, 650, 'đơn');
      }
    }

    // 4. Activate the current tab (which enforces correct hidden states and active styles)
    switchAdminTab(currentActiveAdminTab);
  }

  function updateSlotSelectionBadge() {
    const checkedBoxes = document.querySelectorAll('.chk-slot-item:checked');
    const badge = document.getElementById('admin-slot-selected-badge');
    const selectAllCheckbox = document.getElementById('chk-select-all-slots');
    const totalCheckboxes = document.querySelectorAll('.chk-slot-item');

    if (badge) {
      if (checkedBoxes.length > 0) {
        badge.textContent = `Đã chọn: ${checkedBoxes.length} ca`;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (selectAllCheckbox) {
      selectAllCheckbox.checked = (totalCheckboxes.length > 0 && checkedBoxes.length === totalCheckboxes.length);
      selectAllCheckbox.indeterminate = (checkedBoxes.length > 0 && checkedBoxes.length < totalCheckboxes.length);
    }
  }

  function renderAdminSlotsTable() {
    const activeCamp = store.getActiveCampaign();
    const currentAdmin = store.getCurrentAdmin();
    const canViewAllSlots = store.hasPermission('slots:view_all');
    const isCanEditCapacity = store.hasPermission('slots:edit_capacity');
    const canToggleOpen = store.hasPermission('slots:toggle_open');
    const canDeleteSlots = store.hasPermission('slots:delete');
    const hasDept = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = hasDept ? currentAdmin.deptId : null;

    let deptFilter = document.getElementById('admin-filter-slot-dept')?.value || 'all';
    if (!canViewAllSlots && hasDept) {
      deptFilter = myDeptId;
    }
    const slots = store.getSlots(activeCamp.id, deptFilter);

    // Sync badge count
    const slotsCountBadge = document.getElementById('badge-tab-slots-count');
    if (slotsCountBadge) {
      const allLeadSlots = store.getSlots(activeCamp.id, (!canViewAllSlots && hasDept) ? myDeptId : null);
      slotsCountBadge.textContent = `${allLeadSlots.length} ca`;
    }

    const tbody = document.getElementById('admin-slots-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const selectAllCheckbox = document.getElementById('chk-select-all-slots');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      if (!canToggleOpen && !canDeleteSlots) selectAllCheckbox.disabled = true;
      else selectAllCheckbox.disabled = false;
    }
    updateSlotSelectionBadge();

    if (slots.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-slate-400">Không có ca phỏng vấn nào.</td></tr>';
      return;
    }

    slots.forEach(slot => {
      const [yy, mm, dd] = slot.date.split('-');
      const ivList = (slot.interviewers || []).map(i => i.fullName).join(', ') || 'Chưa gán';
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50';

      const checkColHtml = (canToggleOpen || canDeleteSlots)
        ? `<input type="checkbox" value="${slot.id}" class="chk-slot-item rounded text-orange-600 cursor-pointer">`
        : `<span class="text-slate-300">•</span>`;

      const actionColHtml = canToggleOpen
        ? `<button class="btn-toggle-open px-3 py-1 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap cursor-pointer ${
            slot.isOpen ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }">
            ${slot.isOpen ? '✓ Đang Mở' : '🔒 Đã Khóa'}
          </button>`
        : `<span class="px-2.5 py-1 text-[11px] font-bold rounded-xl whitespace-nowrap ${
            slot.isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
          }">
            ${slot.isOpen ? '✓ Đang Mở' : '🔒 Đã Khóa'}
          </span>`;

      const capacityColHtml = isCanEditCapacity ? `
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="font-black ${slot.isFull ? 'text-rose-600' : 'text-slate-900'}">${slot.bookedCount}/</span>
          <select class="sel-slot-capacity text-xs font-black bg-white border border-slate-300 rounded-lg px-1.5 py-0.5 text-slate-800 cursor-pointer shadow-2xs hover:border-[#8B1E22] transition-colors" title="Đổi số lượng ứng viên cho ca này (1-3)">
            <option value="1" ${slot.capacity === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${slot.capacity === 2 || !slot.capacity ? 'selected' : ''}>2</option>
            <option value="3" ${slot.capacity === 3 ? 'selected' : ''}>3</option>
          </select>
          ${slot.isFull ? '<span class="text-[10px] text-rose-600 font-bold">(Hết chỗ)</span>' : ''}
        </div>
      ` : `
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="font-black ${slot.isFull ? 'text-rose-600' : 'text-slate-900'}">${slot.bookedCount}/${slot.capacity || 2}</span>
          ${slot.isFull ? '<span class="text-[10px] text-rose-600 font-bold">(Hết chỗ)</span>' : ''}
        </div>
      `;

      tr.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap text-center">
          ${checkColHtml}
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-bold text-[#8B1E22]">${slot.dept.name}</td>
        <td class="px-4 py-3 whitespace-nowrap font-bold">${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} <span class="text-slate-400 font-normal">(${dd}/${mm})</span></td>
        <td class="px-4 py-3 whitespace-nowrap text-slate-600">📍 ${escapeHtml(slot.location || 'Phòng 501 - Nhà E4')}</td>
        <td class="px-4 py-3 text-slate-600 truncate max-w-xs" title="${ivList}">
          ${(slot.interviewers && slot.interviewers.length >= 2) ? ivList : `<span class="text-rose-600 font-bold">⚠️ Cần ≥ 2 người (hiện có ${slot.interviewers?.length || 0})</span>`}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          ${capacityColHtml}
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          ${actionColHtml}
        </td>
      `;

      if (isCanEditCapacity) {
        const selCap = tr.querySelector('.sel-slot-capacity');
        if (selCap) {
          selCap.onchange = (e) => {
            const newCap = parseInt(e.target.value, 10);
            const oldCap = slot.capacity || 2;
            if (newCap === oldCap) return;

            // Kiểm tra an toàn: Không cho giảm sức chứa thấp hơn số ứng viên đã xác nhận
            const activeRegs = (store.data.registrations || []).filter(r => r.slotId === slot.id && r.status === 'confirmed');
            if (newCap < activeRegs.length) {
              window.UI.showToast(`Ca này hiện đã có ${activeRegs.length} bạn xác nhận. Không thể giảm sức chứa xuống ${newCap}!`, 'warning');
              e.target.value = oldCap;
              return;
            }

            // Mở modal xác nhận thay đổi
            window.__openCapacityConfirmModal(slot, oldCap, newCap, selCap);
          };
        }
      }

      if (canToggleOpen || canDeleteSlots) {
        const chk = tr.querySelector('.chk-slot-item');
        if (chk) chk.onchange = updateSlotSelectionBadge;
      }

      if (canToggleOpen) {
        const toggleBtn = tr.querySelector('.btn-toggle-open');
        if (toggleBtn) {
          toggleBtn.onclick = () => {
            try {
              store.toggleSlotOpen(slot.id, !slot.isOpen);
              window.UI.showToast(`Đã ${!slot.isOpen ? 'mở' : 'khóa'} ca phỏng vấn!`, 'success');
              renderAdminSlotsTable();
            } catch (err) {
              window.UI.showToast(err.message, 'error');
            }
          };
        }
      }

      tbody.appendChild(tr);
    });
  }


  // Handle Select All Checkbox
  document.getElementById('chk-select-all-slots')?.addEventListener('change', (e) => {
    const isChecked = e.target.checked;
    document.querySelectorAll('.chk-slot-item').forEach(chk => {
      chk.checked = isChecked;
    });
    updateSlotSelectionBadge();
  });

  // Toggle Dropdown Menu "Tùy chọn"
  const btnSlotDropdown = document.getElementById('btn-slot-actions-dropdown');
  const slotActionsMenu = document.getElementById('slot-actions-menu');
  btnSlotDropdown?.addEventListener('click', (e) => {
    e.stopPropagation();
    slotActionsMenu?.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!document.getElementById('slot-actions-dropdown-container')?.contains(e.target)) {
      slotActionsMenu?.classList.add('hidden');
    }
  });

  function getSelectedSlotIds() {
    const checked = document.querySelectorAll('.chk-slot-item:checked');
    return Array.from(checked).map(c => c.value);
  }

  // Action Seed Mock Data: CHỈ DÀNH CHO TÀI KHOẢN ADMIN CẤP CAO
  const handleSeedTestData = () => {
    slotActionsMenu?.classList.add('hidden');
    const currentAdmin = store.getCurrentAdmin();
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );
    if (!isRootAdmin) {
      window.UI.showToast('Tính năng này chỉ dành riêng cho tài khoản Quản trị viên (Admin).', 'error');
      return;
    }

    if (confirm('Bạn có muốn nạp bộ dữ liệu thử nghiệm chuẩn (30 ứng viên, phân bổ đều 6 ban: mỗi ban 6 đơn đăng ký) không?\n\n- Đầy đủ điểm danh, nhận xét phỏng vấn, điểm số\n- Phân bổ đều cho Ban Truyền Thông, Dự Án, Kỹ Thuật, Đối Ngoại, Sự Kiện, Nhân Sự')) {
      try {
        const res = store.seedTestData(true);
        window.UI.showToast(`Đã nạp thành công ${res.candidateCount} ứng viên và ${res.registrationCount} lượt đăng ký đều cho 6 ban!`, 'success');
        renderAdminCandidatesTable();
        renderAdminSlotsTable();
        if (typeof renderInterviewerWorkspace === 'function') renderInterviewerWorkspace();
        setupAdminSidebarNav(currentAdmin);
      } catch (err) {
        window.UI.showToast(err.message, 'error');
      }
    }
  };

  document.getElementById('menu-btn-seed-test-data')?.addEventListener('click', handleSeedTestData);

  // Action 1: Open Selected Slots
  document.getElementById('btn-action-open-selected')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const selectedIds = getSelectedSlotIds();
    if (selectedIds.length === 0) {
      window.UI.showToast('Vui lòng tick chọn ít nhất 1 ca phỏng vấn để mở.', 'warning');
      return;
    }
    const res = store.toggleMultipleSlotsOpen(selectedIds, true);
    if (res.skipped > 0) {
      window.UI.showToast(`Đã mở ${res.count} ca. (Bỏ qua ${res.skipped} ca do chưa đủ 2 người phỏng vấn)`, 'info');
    } else {
      window.UI.showToast(`Đã mở ${res.count} ca phỏng vấn đã chọn!`, 'success');
    }
    renderAdminSlotsTable();
  });

  // Action 2: Close Selected Slots
  document.getElementById('btn-action-close-selected')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const selectedIds = getSelectedSlotIds();
    if (selectedIds.length === 0) {
      window.UI.showToast('Vui lòng tick chọn ít nhất 1 ca phỏng vấn để khóa.', 'warning');
      return;
    }
    const res = store.toggleMultipleSlotsOpen(selectedIds, false);
    window.UI.showToast(`Đã khóa ${res.count} ca phỏng vấn đã chọn!`, 'info');
    renderAdminSlotsTable();
  });

  // Action 3: Open All Slots
  document.getElementById('btn-action-open-all')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const activeCamp = store.getActiveCampaign();
    const deptVal = document.getElementById('admin-filter-slot-dept')?.value || 'all';
    const deptObj = deptVal !== 'all' ? store.getDepartmentById(deptVal) : null;
    const scopeName = deptObj ? `của ${deptObj.name}` : 'toàn bộ các ban';

    if (confirm(`Bạn có chắc chắn muốn MỞ TẤT CẢ các ca phỏng vấn ${scopeName} không? (Chỉ những ca có đủ từ 2 người phỏng vấn mới được mở)`)) {
      const res = store.bulkToggleSlotsOpen(activeCamp.id, deptVal, true);
      if (res.skipped > 0) {
        window.UI.showToast(`Đã mở ${res.count} ca. (Bỏ qua ${res.skipped} ca do chưa đủ 2 người phỏng vấn)`, 'info');
      } else {
        window.UI.showToast(`Đã mở toàn bộ ${res.count} ca phỏng vấn thành công!`, 'success');
      }
      renderAdminSlotsTable();
    }
  });

  // Action 4: Close All Slots
  document.getElementById('btn-action-close-all')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const activeCamp = store.getActiveCampaign();
    const deptVal = document.getElementById('admin-filter-slot-dept')?.value || 'all';
    const deptObj = deptVal !== 'all' ? store.getDepartmentById(deptVal) : null;
    const scopeName = deptObj ? `của ${deptObj.name}` : 'toàn bộ các ban';

    if (confirm(`Bạn có chắc chắn muốn KHÓA TẤT CẢ các ca phỏng vấn ${scopeName} không?`)) {
      const res = store.bulkToggleSlotsOpen(activeCamp.id, deptVal, false);
      window.UI.showToast(`Đã khóa toàn bộ ${res.count} ca phỏng vấn!`, 'info');
      renderAdminSlotsTable();
    }
  });

  // Action 5: Delete Selected Slots
  document.getElementById('btn-action-delete-selected')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const selectedIds = getSelectedSlotIds();
    if (selectedIds.length === 0) {
      window.UI.showToast('Vui lòng tick chọn ít nhất 1 ca để xóa.', 'warning');
      return;
    }

    if (confirm(`Bạn có chắc chắn muốn XÓA ${selectedIds.length} ca phỏng vấn đã chọn không?`)) {
      const res = store.deleteMultipleSlots(selectedIds);
      if (res.skippedCount > 0) {
        window.UI.showToast(`Đã xóa ${res.deletedCount} ca. (Không thể xóa ${res.skippedCount} ca do đã có ứng viên đăng ký)`, 'warning');
      } else {
        window.UI.showToast(`Đã xóa thành công ${res.deletedCount} ca phỏng vấn!`, 'success');
      }
      renderAdminSlotsTable();
    }
  });

  // Action 6: Delete All Slots (Reset if imported wrong)
  document.getElementById('btn-action-delete-all')?.addEventListener('click', () => {
    slotActionsMenu?.classList.add('hidden');
    const activeCamp = store.getActiveCampaign();
    const deptVal = document.getElementById('admin-filter-slot-dept')?.value || 'all';
    const deptObj = deptVal !== 'all' ? store.getDepartmentById(deptVal) : null;
    const scopeName = deptObj ? `thuộc ${deptObj.name}` : 'TOÀN BỘ các ban';

    if (confirm(`⚠️ CẢNH BÁO: Bạn có chắc chắn muốn XÓA SẠCH toàn bộ ca phỏng vấn ${scopeName} của mùa tuyển này không?\n\n(Chỉ xóa các ca chưa có ứng viên đăng ký - Thao tác này phù hợp khi import nhầm file CSV)`)) {
      const res = store.deleteAllSlots(activeCamp.id, deptVal);
      if (res.skippedCount > 0) {
        window.UI.showToast(`Đã xóa sạch ${res.deletedCount} ca. (Giữ lại ${res.skippedCount} ca đã có ứng viên)`, 'warning');
      } else {
        window.UI.showToast(`Đã xóa sạch ${res.deletedCount} ca phỏng vấn!`, 'success');
      }
      renderAdminSlotsTable();
    }
  });

  function renderAdminCandidatesTable() {
    const activeCamp = store.getActiveCampaign();
    const currentAdmin = store.getCurrentAdmin();
    const canViewAllCands = store.hasPermission('candidates:view_all');
    const canOverrideSlot = store.hasPermission('candidates:override_slot');
    const hasDept = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = hasDept ? currentAdmin.deptId : null;

    const searchVal = (document.getElementById('admin-cand-search')?.value || '').toLowerCase();
    let deptVal = document.getElementById('admin-cand-filter-dept')?.value || 'all';
    if (!canViewAllCands && hasDept) {
      deptVal = myDeptId;
    }

    const allRegs = store.data.registrations
      .filter(r => r.campaignId === activeCamp.id && (canViewAllCands || !hasDept || r.departmentId === myDeptId) && r.status !== 'cancelled')
      .map(r => ({
        ...r,
        candidate: store.data.candidates.find(c => c.id === r.candidateId),
        slot: store.getSlotById(r.slotId),
        dept: store.getDepartmentById(r.departmentId)
      }));

    const filtered = allRegs.filter(r => {
      const cand = r.candidate || {};
      if (searchVal) {
        const matches = (cand.fullName || '').toLowerCase().includes(searchVal) ||
          (cand.studentId || '').toLowerCase().includes(searchVal) ||
          (cand.academicClass || '').toLowerCase().includes(searchVal) ||
          (cand.phone || '').toLowerCase().includes(searchVal) ||
          (cand.email || '').toLowerCase().includes(searchVal);
        if (!matches) return false;
      }
      if (deptVal !== 'all' && r.departmentId !== deptVal) return false;
      return true;
    });

    const tbody = document.getElementById('admin-cand-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    document.getElementById('admin-cand-count').textContent = `Hiển thị ${filtered.length}/${allRegs.length} bản ghi đăng ký`;

    filtered.forEach(r => {
      const cand = r.candidate || {};
      const slot = r.slot;
      const isCancelled = (r.status === 'cancelled');
      const tr = document.createElement('tr');
      tr.className = `border-b border-slate-100 hover:bg-slate-50 transition-colors ${isCancelled ? 'bg-slate-50/60' : ''}`;

      let statusBadge = '';
      if (isCancelled) {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 w-fit">
            <span>❌</span>
            <span>Đã hủy ca</span>
          </span>
        `;
      } else {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block w-fit ${
            r.checkInStatus === 'checked-in' ? 'bg-emerald-100 text-emerald-800' : r.checkInStatus === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
          }">
            ${r.checkInStatus === 'checked-in' ? 'Đã đến' : r.checkInStatus === 'absent' ? 'Vắng mặt' : 'Chờ đến'}
          </span>
        `;
      }

      const actionHtml = canOverrideSlot
        ? `<button class="btn-open-override px-2.5 py-1 rounded-xl ${isCancelled ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-[#8B1E22] hover:bg-[#8B1E22] hover:text-white'} font-bold transition-all text-xs cursor-pointer">
            ${isCancelled ? '🔄 Đặt lại ca' : '⚙️ Can thiệp'}
          </button>`
        : `<span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
            Chỉ xem
          </span>`;

      tr.innerHTML = `
        <td class="px-4 py-3 font-mono font-black ${isCancelled ? 'text-slate-400' : 'text-slate-900'}">${escapeHtml(cand.studentId || '-')}</td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 ${isCancelled ? 'line-through text-slate-500' : ''}">${escapeHtml(cand.fullName || 'N/A')}</div>
          <div class="text-[11px] text-slate-500">${escapeHtml(cand.academicClass || '')}${cand.academicClass && cand.phone ? ' • ' : ''}${escapeHtml(cand.phone || '')}</div>
        </td>
        <td class="px-4 py-3 font-bold text-slate-700">${escapeHtml(r.dept?.name || '')}</td>
        <td class="px-4 py-3 font-medium ${isCancelled ? 'line-through text-slate-400' : ''}">
          ${slot ? escapeHtml(slot.shiftLabel ? `${slot.shiftLabel} (${slot.date})` : `${slot.startTime} - ${slot.endTime} (${slot.date})`) : '<span class="text-slate-400 italic font-normal">Chưa có ca (Đã hủy)</span>'}
        </td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-1">
            ${statusBadge}
          </div>
        </td>
        <td class="px-4 py-3 text-right">
          ${actionHtml}
        </td>
      `;

      if (canOverrideSlot) {
        const btnOverride = tr.querySelector('.btn-open-override');
        if (btnOverride) {
          btnOverride.onclick = () => {
            openAdminOverrideModal(r);
          };
        }
      }

      tbody.appendChild(tr);
    });
  }

  function openAdminOverrideModal(reg) {
    currentOverrideReg = reg;
    const modal = document.getElementById('modal-admin-override');
    if (!modal) return;

    const cand = reg.candidate || {};
    const slot = reg.slot;

    const codeEl = document.getElementById('override-code');
    if (codeEl) codeEl.textContent = reg.bookingCode || '';
    document.getElementById('override-name').textContent = cand.fullName || '';
    document.getElementById('override-mssv').textContent = cand.studentId || '';
    document.getElementById('override-dept').textContent = reg.dept?.name || '';
    document.getElementById('override-current-slot').textContent = slot ? `${slot.startTime}-${slot.endTime} (${slot.date})` : 'Chưa có ca (Đơn này đã hủy)';

    // Ẩn nút hủy nếu đơn đã ở trạng thái hủy rồi hoặc không có quyền candidates:cancel_reg
    const canCancel = store.hasPermission('candidates:cancel_reg');
    const cancelBtn = document.getElementById('btn-override-cancel-reg');
    if (cancelBtn) {
      if (reg.status === 'cancelled' || !canCancel) {
        cancelBtn.classList.add('hidden');
      } else {
        cancelBtn.classList.remove('hidden');
      }
    }

    const activeCamp = store.getActiveCampaign();
    const availableSlots = store.getSlots(activeCamp.id).filter(s =>
      s.departmentId === reg.departmentId &&
      s.id !== reg.slotId
    );

    const slotSelect = document.getElementById('override-new-slot-select');
    slotSelect.innerHTML = '';
    availableSlots.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.date} | ${s.startTime}-${s.endTime} | ${s.location} [${s.bookedCount}/${s.capacity}]`;
      slotSelect.appendChild(opt);
    });

    document.getElementById('override-reason').value = '';
    modal.classList.remove('hidden');
  }

  document.getElementById('form-admin-override')?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentOverrideReg) return;

    const newSlotId = document.getElementById('override-new-slot-select').value;
    const reason = document.getElementById('override-reason').value.trim();

    if (!reason) {
      window.UI.showToast('Vui lòng nhập lý do can thiệp để lưu vào Audit Log.', 'warning');
      return;
    }

    try {
      store.rescheduleRegistration(currentOverrideReg.id, newSlotId, reason, true);
      window.UI.showToast('Admin đã đổi ca cho ứng viên thành công!', 'success');
      document.getElementById('modal-admin-override')?.classList.add('hidden');
      renderAdminWorkspace();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  });

  document.getElementById('btn-override-cancel-reg')?.addEventListener('click', () => {
    if (!currentOverrideReg) return;
    const reason = (document.getElementById('override-reason')?.value || '').trim() || 'Admin xóa đơn đăng ký';
    const candName = currentOverrideReg.candidate?.fullName || 'ứng viên này';

    if (confirm(`Bạn có chắc chắn muốn XÓA HOÀN TOÀN đơn đăng ký của [${candName}] khỏi danh sách không?`)) {
      try {
        store.cancelRegistration(currentOverrideReg.id, reason, true);
        window.UI.showToast(`Đã xóa thành công đơn đăng ký của ${candName}!`, 'success');
        document.getElementById('modal-admin-override')?.classList.add('hidden');
        renderAdminWorkspace();
      } catch (err) {
        window.UI.showToast(err.message, 'error');
      }
    }
  });

  function renderAdminAuditLogs() {
    const activeCamp = store.getActiveCampaign();
    const logs = store.getAuditLogs(activeCamp.id);
    const tbody = document.getElementById('admin-audit-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="py-6 text-center text-slate-400">Chưa có lịch sử hoạt động nào được ghi nhận.</td></tr>';
      return;
    }

    logs.forEach(log => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 text-[11px]';
      tr.innerHTML = `
        <td class="px-4 py-2 text-slate-400 whitespace-nowrap">${escapeHtml(new Date(log.timestamp).toLocaleString('vi-VN'))}</td>
        <td class="px-4 py-2 font-bold text-slate-800">${escapeHtml(log.adminName || '')}</td>
        <td class="px-4 py-2"><span class="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 font-mono font-bold">${escapeHtml(log.action || '')}</span></td>
        <td class="px-4 py-2 text-slate-600">${escapeHtml(log.entityType || '')} [${escapeHtml(log.entityId || '')}]</td>
        <td class="px-4 py-2 text-slate-700 italic font-medium">${escapeHtml(log.reason || '-')}</td>
      `;
      tbody.appendChild(tr);
    });
  }



  // Deadline Quick Preset Handler (24h)
  window.__setDeadlinePreset = function(preset) {
    const now = new Date();
    let target = new Date();
    let timeStr = '23:59';

    if (preset === 'today') {
      target = now;
      timeStr = '23:59';
    } else if (preset === '3days') {
      target.setDate(now.getDate() + 3);
      timeStr = '23:59';
    } else if (preset === '7days') {
      target.setDate(now.getDate() + 7);
      timeStr = '23:59';
    } else if (preset === 'now') {
      target.setMinutes(now.getMinutes() - 2);
      const hh = String(target.getHours()).padStart(2, '0');
      const min = String(target.getMinutes()).padStart(2, '0');
      timeStr = `${hh}:${min}`;
    }

    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');

    const dateEl = document.getElementById('admin-deadline-date');
    const timeEl = document.getElementById('admin-deadline-time');

    if (dateEl) dateEl.value = `${yyyy}-${mm}-${dd}`;
    if (timeEl) timeEl.value = timeStr;

    window.UI.showToast(`Đã chọn mốc 24h: ${timeStr} ngày ${dd}/${mm}/${yyyy}. Hãy bấm "Lưu Hạn Chót"!`, 'info');
  };

  // Update Deadline Form (Strict 24h, NO AM/PM)
  document.getElementById('form-update-deadline')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeCamp = store.getActiveCampaign();
    const dateVal = document.getElementById('admin-deadline-date')?.value;
    let timeVal = document.getElementById('admin-deadline-time')?.value?.trim() || '23:59';

    // Normalize timeVal to strict HH:mm
    const parts = timeVal.split(':');
    let h = 23, m = 59;
    if (parts.length === 2) {
      h = parseInt(parts[0], 10) || 0;
      m = parseInt(parts[1], 10) || 0;
    } else if (timeVal.length <= 2) {
      h = parseInt(timeVal, 10) || 0;
      m = 0;
    } else if (timeVal.length === 4) {
      h = parseInt(timeVal.slice(0, 2), 10) || 0;
      m = parseInt(timeVal.slice(2, 4), 10) || 0;
    }
    if (h < 0) h = 0;
    if (h > 23) h = 23;
    if (m < 0) m = 0;
    if (m > 59) m = 59;
    timeVal = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    const timeInputEl = document.getElementById('admin-deadline-time');
    if (timeInputEl) timeInputEl.value = timeVal;

    if (!dateVal) {
      window.UI.showToast('Vui lòng chọn ngày hết hạn.', 'warning');
      return;
    }

    try {
      const isoStr = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      store.updateCampaignDeadline(activeCamp.id, isoStr, 'Admin cập nhật deadline đợt tuyển (24h)');
      window.UI.showToast(`Đã lưu hạn chót 24h: ${timeVal} - ${dateVal.split('-').reverse().join('/')} thành công!`, 'success');
      renderAdminWorkspace();
      initCandidateWizard();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  });

  // Create Campaign Modal
  document.getElementById('btn-open-new-campaign-modal')?.addEventListener('click', () => {
    document.getElementById('modal-create-campaign')?.classList.remove('hidden');
  });

  document.getElementById('form-create-campaign')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById('camp-name').value,
      gen: document.getElementById('camp-gen').value,
      academicYear: document.getElementById('camp-year').value,
      registrationDeadline: new Date(document.getElementById('camp-deadline').value).toISOString(),
      startDate: document.getElementById('camp-start-date').value,
      endDate: document.getElementById('camp-end-date').value,
      isActive: document.getElementById('camp-set-active').checked
    };

    try {
      const camp = store.createCampaign(data);
      window.UI.showToast(`Đã tạo mùa tuyển mới [${camp.gen}] thành công!`, 'success');
      document.getElementById('modal-create-campaign')?.classList.add('hidden');
      renderAdminWorkspace();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  });

  // Import CSV Modal & Collision Detection
  document.getElementById('btn-open-import-modal')?.addEventListener('click', () => {
    document.getElementById('modal-import-slots')?.classList.remove('hidden');
  });

  // Import CSV File Picker & Template
  const fileInput = document.getElementById('import-csv-file-input');
  document.getElementById('btn-pick-csv-file')?.addEventListener('click', () => {
    fileInput?.click();
  });
  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      document.getElementById('import-csv-textarea').value = text;
      window.UI.showToast(`Đã đọc nội dung từ file [${file.name}]`, 'info');
    };
    reader.readAsText(file, 'UTF-8');
  });

  document.getElementById('btn-download-csv-template')?.addEventListener('click', () => {
    const template = 'DepartmentId,Date,StartTime,EndTime,Capacity,Location,Interviewers\nmedia,2026-09-05,08:00,10:00,2,Phòng 501 - Nhà E4,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,10:00,12:00,2,Phòng 501 - Nhà E4,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,14:00,16:00,2,Phòng 501 - Nhà E4,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,16:00,17:30,2,Phòng 501 - Nhà E4,Nguyễn Việt Hoàng;Trần Thảo Linh';
    const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'MCC_Template_Import_Ca_Phong_Van.csv';
    link.click();
  });

  document.getElementById('form-import-csv')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const csvText = document.getElementById('import-csv-textarea').value.trim();
    if (!csvText) return;

    try {
      const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) {
        throw new Error('Dữ liệu CSV không hợp lệ hoặc thiếu dòng dữ liệu.');
      }

      // Xác định vị trí các cột theo tiêu đề (hỗ trợ cả tiếng Anh và tiếng Việt)
      const headerParts = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^"|"$/g, ''));
      let deptColIdx = headerParts.findIndex(h => ['departmentid', 'dept', 'ban'].includes(h));
      let dateColIdx = headerParts.findIndex(h => ['date', 'ngay'].includes(h));
      let startColIdx = headerParts.findIndex(h => ['starttime', 'gio_bat_dau', 'gio_batdau'].includes(h));
      let endColIdx = headerParts.findIndex(h => ['endtime', 'gio_ket_thuc', 'gio_ketthuc'].includes(h));
      let capColIdx = headerParts.findIndex(h => ['capacity', 'so_ung_vien', 'so_luong', 'so_cho'].includes(h));
      let locColIdx = headerParts.findIndex(h => ['location', 'dia_diem', 'phong'].includes(h));

      // Thứ tự mặc định nếu file không có header chuẩn:
      // Dept(0), Date(1), StartTime(2), EndTime(3), Capacity(4), Location(5)
      if (deptColIdx === -1) deptColIdx = 0;
      if (dateColIdx === -1) dateColIdx = 1;
      if (startColIdx === -1) startColIdx = 2;
      if (endColIdx === -1) endColIdx = 3;
      if (capColIdx === -1) capColIdx = 4;
      if (locColIdx === -1) locColIdx = 5;

      const activeCamp = store.getActiveCampaign();
      const slotsToAdd = [];

      // Sanitize fields against CSV Formula Injection (=, +, -, @)
      const sanitizeCsvField = (str) => {
        if (!str || typeof str !== 'string') return '';
        let s = str.trim();
        if (/^[=+\-@\t\r]/.test(s)) {
          s = s.replace(/^[=+\-@\t\r]+/, '');
        }
        return s;
      };

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 4 || (parts.length === 1 && !parts[0])) continue;

        const deptId = sanitizeCsvField(parts[deptColIdx] || '');
        const deptObj = store.getDepartmentById(deptId);
        const deptName = deptObj ? deptObj.name : (deptId || `Ban dòng ${i + 1}`);
        const date = sanitizeCsvField(parts[dateColIdx] || '');
        const startTime = sanitizeCsvField(parts[startColIdx] || '');
        const endTime = sanitizeCsvField(parts[endColIdx] || '');

        // ĐỌC VÀ KIỂM TRA BẮT BUỘC SỐ LƯỢNG ỨNG VIÊN
        const rawCap = (capColIdx < parts.length && parts[capColIdx] !== undefined) ? parts[capColIdx].trim() : '';

        // NẾU BỎ TRỐNG: DỪNG IMPORT VÀ BẬT THÔNG BÁO RÕ RÀNG CA NÀO BỊ THIẾU
        if (!rawCap || rawCap === '') {
          throw new Error(`Dòng ${i + 1}: Ca ${deptName} lúc ${startTime || '??'} - ${endTime || '??'} (ngày ${date || '??'}) chưa có số lượng ứng viên! Vui lòng điền số lượng (1 - 3) cho ca này.`);
        }

        const cap = parseInt(rawCap, 10);
        if (isNaN(cap) || ![1, 2, 3].includes(cap)) {
          throw new Error(`Dòng ${i + 1}: Ca ${deptName} (${startTime} - ${endTime}) có số lượng ứng viên không hợp lệ ("${rawCap}"). Sức chứa mỗi ca chỉ được phép từ 1 đến 3 ứng viên!`);
        }

        const location = sanitizeCsvField((locColIdx < parts.length && parts[locColIdx]) || 'Phòng 501 - Nhà E4, 144 Xuân Thủy');

        slotsToAdd.push({
          campaignId: activeCamp.id,
          departmentId: deptId,
          date: date,
          startTime: startTime,
          endTime: endTime,
          capacity: cap,
          location: location,
          type: 'offline',
          isOpen: true
        });
      }

      if (slotsToAdd.length === 0) {
        throw new Error('Không tìm thấy ca phỏng vấn hợp lệ nào để import.');
      }

      slotsToAdd.forEach(s => store.addSlot(s));
      window.UI.showToast(`Đã import thành công ${slotsToAdd.length} ca phỏng vấn!`, 'success');
      document.getElementById('modal-import-slots')?.classList.add('hidden');
      document.getElementById('import-csv-textarea').value = '';
      renderAdminSlotsTable();

    } catch (err) {
      window.UI.showToast(err.message, 'error');
      alert('⚠️ LỖI DỮ LIỆU IMPORT CSV:\n\n' + err.message);
    }
  });

  // --- ADMIN PROFILE SETTINGS & CHANGE PASSWORD ---
  window.__openAdminProfileModal = function(e) {
    if (e && e.preventDefault) e.preventDefault();
    const current = store.getCurrentAdmin();
    if (!current) {
      window.UI.showToast('Vui lòng đăng nhập vào tài khoản quản trị trước.', 'warning');
      return;
    }

    const usernameEl = document.getElementById('profile-admin-username');
    const roleEl = document.getElementById('profile-admin-role');
    if (usernameEl) usernameEl.value = current.username || '';
    if (roleEl) roleEl.value = `${current.role || ''} ${current.deptId && current.deptId !== 'all' ? `(${store.getDepartmentById(current.deptId)?.name || current.deptId})` : ''}`;
    
    // Clear password fields
    const currP = document.getElementById('profile-admin-curr-pass');
    const newP = document.getElementById('profile-admin-new-pass');
    const confP = document.getElementById('profile-admin-confirm-pass');
    if (currP) currP.value = '';
    if (newP) newP.value = '';
    if (confP) confP.value = '';

    const modal = document.getElementById('modal-admin-profile');
    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => { currP?.focus(); }, 50);
    }
  };

  document.getElementById('btn-open-admin-profile-modal')?.addEventListener('click', window.__openAdminProfileModal);

  // Toggle password visibility for profile modal
  document.querySelectorAll('.btn-toggle-eye').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          btn.textContent = '🙈';
        } else {
          input.type = 'password';
          btn.textContent = '👁️';
        }
      }
    });
  });

  document.getElementById('form-update-admin-profile')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const current = store.getCurrentAdmin();
    if (!current) return;

    const currPass = document.getElementById('profile-admin-curr-pass').value.trim();
    const newPass = document.getElementById('profile-admin-new-pass').value.trim();
    const confirmPass = document.getElementById('profile-admin-confirm-pass').value.trim();

    if (!newPass) {
      window.UI.showToast('Tên hiển thị đã được cố định bởi Ban Tổ Chức. Không có thay đổi mật khẩu nào được thực hiện.', 'info');
      document.getElementById('modal-admin-profile')?.classList.add('hidden');
      return;
    }

    if (!currPass) {
      window.UI.showToast('Vui lòng nhập mật khẩu hiện tại để xác nhận đổi mật khẩu mới.', 'warning');
      return;
    }
    if (newPass.length < 6) {
      window.UI.showToast('Mật khẩu mới phải có ít nhất 6 ký tự.', 'warning');
      return;
    }
    if (newPass !== confirmPass) {
      window.UI.showToast('Xác nhận mật khẩu mới không khớp.', 'error');
      return;
    }

    try {
      await store.updateAdminProfile(current.id, {
        currentPassword: currPass,
        newPassword: newPass
      });
      window.UI.showToast('Đã đổi mật khẩu tài khoản thành công trên máy chủ Google Firebase!', 'success');
      document.getElementById('modal-admin-profile')?.classList.add('hidden');
      document.getElementById('profile-admin-curr-pass').value = '';
      document.getElementById('profile-admin-new-pass').value = '';
      document.getElementById('profile-admin-confirm-pass').value = '';
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  });

  // Close modals
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  // --- CONFIRM CHANGE SLOT CAPACITY MODAL ---
  let pendingCapacityChange = null;

  window.__openCapacityConfirmModal = function(slot, oldCap, newCap, selectElement) {
    pendingCapacityChange = { slot, oldCap, newCap, selectElement };

    const modal = document.getElementById('modal-confirm-capacity');
    if (!modal) return;

    const [yy, mm, dd] = (slot.date || '').split('-');
    const deptEl = document.getElementById('confirm-cap-dept');
    if (deptEl) deptEl.textContent = slot.dept?.name || 'Ban chuyên môn';

    const timeEl = document.getElementById('confirm-cap-time');
    if (timeEl) timeEl.textContent = `${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} (Ngày ${dd}/${mm}/${yy})`;

    const oldEl = document.getElementById('confirm-cap-old');
    if (oldEl) oldEl.textContent = `${oldCap} ứng viên`;

    const newEl = document.getElementById('confirm-cap-new');
    if (newEl) newEl.textContent = `${newCap} ứng viên`;

    const noteEl = document.getElementById('confirm-cap-note');
    if (noteEl) {
      noteEl.textContent = 'Bạn có chắc chắn muốn thay đổi số lượng ứng viên tối đa cho ca phỏng vấn này không?';
    }

    modal.classList.remove('hidden');
  };

  function closeCapacityConfirmModal(revert = false) {
    const modal = document.getElementById('modal-confirm-capacity');
    if (modal) modal.classList.add('hidden');
    if (revert && pendingCapacityChange && pendingCapacityChange.selectElement) {
      pendingCapacityChange.selectElement.value = pendingCapacityChange.oldCap;
    }
    pendingCapacityChange = null;
  }

  document.getElementById('btn-close-confirm-capacity')?.addEventListener('click', () => closeCapacityConfirmModal(true));
  document.getElementById('btn-cancel-confirm-capacity')?.addEventListener('click', () => closeCapacityConfirmModal(true));

  document.getElementById('btn-accept-confirm-capacity')?.addEventListener('click', () => {
    if (!pendingCapacityChange) return;
    const { slot, newCap } = pendingCapacityChange;
    try {
      store.updateSlotCapacity(slot.id, newCap);
      window.UI.showToast(`Đã cập nhật sức chứa ca ${slot.dept?.name} thành ${newCap} ứng viên!`, 'success');
      closeCapacityConfirmModal(false);
      renderAdminSlotsTable();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
      closeCapacityConfirmModal(true);
    }
  });

  function getTotalPermissionsCount() {
    if (window.ALL_PERMISSION_KEYS && window.ALL_PERMISSION_KEYS.length) {
      return window.ALL_PERMISSION_KEYS.length;
    }
    if (window.ALL_PERMISSIONS) {
      return Object.keys(window.ALL_PERMISSIONS).length;
    }
    return 18;
  }

  // ==================== GRANULAR PERMISSIONS WORKSPACE CONTROLLER ====================
  let currentPermSelectedAdminId = null;

  function renderAdminPermissionsWorkspace() {
    const adminListEl = document.getElementById('perm-admin-list');
    const searchInput = document.getElementById('perm-search-admin');
    const countBadge = document.getElementById('perm-admin-count');
    const featuresContainer = document.getElementById('perm-features-container');

    if (!adminListEl || !featuresContainer) return;

    const allAdmins = store.getAdmins();
    if (countBadge) countBadge.textContent = `${allAdmins.length} tài khoản`;

    // Filter by search term
    const searchTerm = (searchInput?.value || '').trim().toLowerCase();
    const filteredAdmins = allAdmins.filter(a => {
      if (!searchTerm) return true;
      return (a.fullName || '').toLowerCase().includes(searchTerm) ||
             (a.username || '').toLowerCase().includes(searchTerm) ||
             (a.role || '').toLowerCase().includes(searchTerm);
    });

    // Default selection
    if (!currentPermSelectedAdminId || !allAdmins.some(a => a.id === currentPermSelectedAdminId)) {
      const firstNonRoot = allAdmins.find(a => a.id !== 'adm-root-admin');
      currentPermSelectedAdminId = firstNonRoot ? firstNonRoot.id : allAdmins[0]?.id;
    }

    const totalCount = getTotalPermissionsCount();

    // Render left column (Admin accounts list)
    adminListEl.innerHTML = '';
    if (filteredAdmins.length === 0) {
      adminListEl.innerHTML = '<div class="p-4 text-center text-xs text-slate-400">Không tìm thấy tài khoản phù hợp.</div>';
    } else {
      filteredAdmins.forEach(adm => {
        const isSelected = (adm.id === currentPermSelectedAdminId);
        const perms = store.getAdminPermissions(adm.id);
        const isRoot = (adm.id === 'adm-root-admin' || adm.username === 'admin.mcc@gmail.com');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between border cursor-pointer ${
          isSelected
            ? 'bg-white border-[#8B1E22] ring-2 ring-[#8B1E22]/20 shadow-sm'
            : 'bg-white/60 border-slate-200/80 hover:bg-white hover:border-slate-300'
        }`;

        btn.innerHTML = `
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="w-8 h-8 rounded-xl ${isSelected ? 'bg-red-50 text-[#8B1E22]' : 'bg-slate-100 text-slate-700'} flex items-center justify-center text-sm font-bold shrink-0">
              ${adm.avatar || '👤'}
            </span>
            <div class="min-w-0">
              <div class="font-bold text-xs text-slate-900 truncate flex items-center gap-1.5">
                <span>${adm.fullName}</span>
                ${isRoot ? '<span class="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-mono font-bold">ROOT</span>' : ''}
              </div>
              <div class="text-[10px] text-slate-500 truncate font-mono">${adm.username}</div>
            </div>
          </div>
          <span class="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ml-1 ${
            perms.length === totalCount
              ? 'bg-emerald-100 text-emerald-800'
              : perms.length === 0
              ? 'bg-slate-100 text-slate-500'
              : 'bg-orange-100 text-orange-800'
          }">
            ${perms.length}/${totalCount}
          </span>
        `;

        btn.onclick = () => {
          currentPermSelectedAdminId = adm.id;
          renderAdminPermissionsWorkspace();
        };

        adminListEl.appendChild(btn);
      });
    }

    // Render right column for currentPermSelectedAdminId
    const targetAdmin = allAdmins.find(a => a.id === currentPermSelectedAdminId);
    if (!targetAdmin) return;

    const isRoot = (targetAdmin.id === 'adm-root-admin' || targetAdmin.username === 'admin.mcc@gmail.com');

    // Header info
    const avatarEl = document.getElementById('perm-target-avatar');
    const nameEl = document.getElementById('perm-target-name');
    const roleEl = document.getElementById('perm-target-role');
    const emailEl = document.getElementById('perm-target-email');
    if (avatarEl) avatarEl.textContent = targetAdmin.avatar || '👤';
    if (nameEl) nameEl.textContent = targetAdmin.fullName;
    if (roleEl) roleEl.textContent = targetAdmin.role || (targetAdmin.deptId ? `Ban ${targetAdmin.deptId}` : 'Ban Chuyên Môn');
    if (emailEl) emailEl.textContent = targetAdmin.username;

    const currentPerms = store.getAdminPermissions(targetAdmin.id);

    // Group ALL_PERMISSIONS by category
    const categories = {};
    const permsDict = window.ALL_PERMISSIONS || {};
    Object.keys(permsDict).forEach(key => {
      const p = permsDict[key];
      if (!categories[p.category]) categories[p.category] = [];
      categories[p.category].push(p);
    });

    featuresContainer.innerHTML = '';

    Object.keys(categories).forEach(catName => {
      const permsList = categories[catName];
      const catBox = document.createElement('div');
      catBox.className = 'border border-slate-200/90 rounded-2xl p-3.5 bg-slate-50/50 space-y-2.5';

      catBox.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
          <span class="font-black text-xs text-slate-800">${catName}</span>
          <span class="text-[10px] text-slate-400 font-bold">${permsList.length} tính năng</span>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          ${permsList.map(p => {
            const isChecked = currentPerms.includes(p.key);
            return `
              <label class="flex items-start gap-3 p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#8B1E22] hover:bg-orange-50/40 transition-all cursor-pointer select-none shadow-2xs group">
                <input type="checkbox" value="${p.key}" class="chk-feature-perm mt-0.5 rounded text-[#8B1E22] focus:ring-0 cursor-pointer w-4 h-4 shrink-0 accent-[#8B1E22]" ${isChecked ? 'checked' : ''}>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-bold text-slate-800 group-hover:text-[#8B1E22] leading-snug">
                    ${p.name}
                  </div>
                  <div class="text-[10px] font-mono text-slate-400 mt-0.5">${p.key}</div>
                </div>
              </label>
            `;
          }).join('')}
        </div>
      `;

      featuresContainer.appendChild(catBox);
    });

    // Update count indicator
    function updateSelectedCount() {
      const checkedBoxes = featuresContainer.querySelectorAll('.chk-feature-perm:checked');
      const countEl = document.getElementById('perm-selected-count');
      if (countEl) countEl.textContent = `${checkedBoxes.length} / ${totalCount}`;
    }
    updateSelectedCount();

    featuresContainer.querySelectorAll('.chk-feature-perm').forEach(chk => {
      chk.onchange = updateSelectedCount;
    });

    // Quick action buttons and Save button are always active
    const quickActionsBox = document.getElementById('perm-quick-actions');
    const saveBtn = document.getElementById('btn-save-admin-permissions');
    if (quickActionsBox) quickActionsBox.classList.remove('hidden');
    if (saveBtn) saveBtn.classList.remove('hidden');
  }

  // Event Listeners for Granular Permissions UI
  document.getElementById('perm-search-admin')?.addEventListener('input', renderAdminPermissionsWorkspace);

  document.getElementById('btn-perm-preset-all')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-feature-perm:not(:disabled)').forEach(chk => chk.checked = true);
    const countEl = document.getElementById('perm-selected-count');
    const tc = getTotalPermissionsCount();
    if (countEl) countEl.textContent = `${tc} / ${tc}`;
  });

  document.getElementById('btn-perm-preset-none')?.addEventListener('click', () => {
    document.querySelectorAll('.chk-feature-perm:not(:disabled)').forEach(chk => chk.checked = false);
    const countEl = document.getElementById('perm-selected-count');
    if (countEl) countEl.textContent = `0 / ${getTotalPermissionsCount()}`;
  });

  document.getElementById('btn-perm-preset-hr')?.addEventListener('click', () => {
    const hrPerms = [
      'slots:view_all', 'slots:create', 'slots:import_csv', 'slots:toggle_open', 'slots:set_deadline',
      'candidates:view_all', 'candidates:override_slot', 'candidates:cancel_reg',
      'checkin:view_all', 'checkin:mark_status',
      'system:audit_log'
    ];
    document.querySelectorAll('.chk-feature-perm:not(:disabled)').forEach(chk => {
      chk.checked = hrPerms.includes(chk.value);
    });
    const countEl = document.getElementById('perm-selected-count');
    if (countEl) countEl.textContent = `${hrPerms.length} / ${getTotalPermissionsCount()}`;
  });

  document.getElementById('btn-perm-preset-dept')?.addEventListener('click', () => {
    const deptPerms = ['checkin:mark_status'];
    document.querySelectorAll('.chk-feature-perm:not(:disabled)').forEach(chk => {
      chk.checked = deptPerms.includes(chk.value);
    });
    const countEl = document.getElementById('perm-selected-count');
    if (countEl) countEl.textContent = `${deptPerms.length} / ${getTotalPermissionsCount()}`;
  });

  document.getElementById('btn-save-admin-permissions')?.addEventListener('click', () => {
    if (!currentPermSelectedAdminId) return;
    const checked = Array.from(document.querySelectorAll('.chk-feature-perm:checked')).map(c => c.value);
    const targetAdmin = store.getAdmins().find(a => a.id === currentPermSelectedAdminId);
    try {
      store.updateAdminPermissions(currentPermSelectedAdminId, checked);
      window.UI.showToast(`Đã lưu phân quyền (${checked.length} tính năng) cho [${targetAdmin?.fullName || currentPermSelectedAdminId}] thành công!`, 'success');
      renderAdminPermissionsWorkspace();
    } catch (err) {
      window.UI.showToast(err.message || 'Lỗi khi lưu phân quyền', 'error');
    }
  });

  // Filter input listeners
  document.getElementById('admin-cand-search')?.addEventListener('input', renderAdminCandidatesTable);

  // Dynamic Mouse Spotlight Glow for interactive cards
  document.addEventListener('pointermove', (e) => {
    const cards = document.querySelectorAll('.mouse-glow-card');
    cards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  // Subscribe to real-time Cloud updates from Firebase
  store.subscribe(() => {
    // If admin view is active and user is logged in, refresh tables
    const viewAdmin = document.getElementById('view-admin');
    if (viewAdmin && !viewAdmin.classList.contains('hidden')) {
      const activeAdmin = store.getCurrentAdmin();
      if (activeAdmin) {
        renderAdminWorkspace();
      }
    }
    // If candidate view is at step 3, refresh slot columns and date strip
    const step3 = document.getElementById('step-3-content');
    if (step3 && !step3.classList.contains('hidden')) {
      renderStep3Timeline();
    }
    // If lookup view is active and authenticated, refresh details
    const viewLookup = document.getElementById('view-lookup');
    if (viewLookup && !viewLookup.classList.contains('hidden') && authenticatedCandidateData) {
      renderLookupDetails(authenticatedCandidateData.candidate.id);
    }
  });

  // --- 3D COSMIC STARFIELD CANVAS ANIMATION (WHIMSICAL THEATRE FACTORY) ---
  function initHero3DStarfield() {
    const canvas = document.getElementById('hero-3d-starfield');
    const banner = document.getElementById('hero-campaign-banner-container');
    if (!canvas || !banner) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resizeCanvas() {
      const rect = banner.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      if (width === 0 || height === 0) return;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    }
    resizeCanvas();
    window.addEventListener('resize', () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      resizeCanvas();
    });

    const STAR_COUNT = 160;
    const palette = [
      { r: 251, g: 191, b: 36 },  // Amber gold #FBBF24
      { r: 253, g: 230, b: 138 }, // Soft cream gold #FDE68A
      { r: 245, g: 158, b: 11 },  // Deep warm gold #F59E0B
      { r: 225, g: 195, b: 255 }, // Lavender lilac #E1C3FF
      { r: 200, g: 145, b: 255 }, // Magical purple #C891FF
      { r: 254, g: 175, b: 190 }, // Soft candy rose #FEAFBE
      { r: 255, g: 255, b: 255 }, // Pure diamond sparkle #FFFFFF
    ];

    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      const col = palette[Math.floor(Math.random() * palette.length)];
      stars.push({
        x: (Math.random() - 0.5) * 1600,
        y: (Math.random() - 0.5) * 1000,
        z: Math.random() * 950 + 50,
        size: Math.random() * 1.8 + 1.0,
        color: col,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.04 + 0.018,
        isHero: i < 8, // 8 hero stars with 4-point sparkle cross
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.015
      });
    }

    // Shooting Star Manager
    let shootingStar = null;
    let nextShootingTime = Date.now() + 1500;

    function spawnShootingStar() {
      const startX = Math.random() * (width * 0.7) + width * 0.3;
      const startY = Math.random() * (height * 0.35);
      const angle = (Math.PI / 4) + (Math.random() * 0.2 - 0.1);
      const speed = Math.random() * 9 + 11;
      shootingStar = {
        x: startX,
        y: startY,
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        length: Math.random() * 60 + 80,
        life: 1.0,
        decay: 0.022,
        color: palette[Math.floor(Math.random() * 3)]
      };
      nextShootingTime = Date.now() + Math.random() * 6000 + 7000;
    }

    // Mouse Parallax tracking
    let targetParallaxX = 0;
    let targetParallaxY = 0;
    let currParallaxX = 0;
    let currParallaxY = 0;

    banner.addEventListener('mousemove', (e) => {
      const rect = banner.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      targetParallaxX = (mx / rect.width - 0.5) * 2;
      targetParallaxY = (my / rect.height - 0.5) * 2;
    });

    banner.addEventListener('mouseleave', () => {
      targetParallaxX = 0;
      targetParallaxY = 0;
    });

    // Animation loop with IntersectionObserver
    let isVisible = true;
    let animId = null;

    function renderStarfield() {
      if (!isVisible) return;

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation (LERP factor 0.05)
      currParallaxX += (targetParallaxX - currParallaxX) * 0.05;
      currParallaxY += (targetParallaxY - currParallaxY) * 0.05;

      const centerX = width / 2;
      const centerY = height / 2;
      const fov = 440;

      // Render 3D Stars
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // Cosmic forward drift
        s.z -= 0.35;
        if (s.z <= 10) {
          s.z = 1000;
          s.x = (Math.random() - 0.5) * 1600;
          s.y = (Math.random() - 0.5) * 1000;
        }

        s.twinklePhase += s.twinkleSpeed;
        if (s.isHero) s.rotation += s.rotSpeed;

        // 3D Parallax offset: foreground stars shift substantially more than background stars
        const parallaxFactor = (1000 - s.z) * 0.045;
        const projectedX = s.x + currParallaxX * parallaxFactor;
        const projectedY = s.y + currParallaxY * parallaxFactor;

        // Perspective Projection
        const scale = fov / s.z;
        const sx = centerX + projectedX * scale;
        const sy = centerY + projectedY * scale;

        // Skip if outside canvas bounds (with padding)
        if (sx < -30 || sx > width + 30 || sy < -30 || sy > height + 30) continue;

        // Visual depth calculations
        const depthAlpha = Math.max(0.22, Math.min(1, (1000 - s.z) / 720));
        const twinkle = 0.5 + 0.5 * Math.sin(s.twinklePhase);
        const alpha = depthAlpha * (0.45 + 0.55 * twinkle);
        const r = Math.max(0.7, s.size * scale * 1.05);

        // Soft Glowing Core
        const { r: cr, g: cg, b: cb } = s.color;
        
        if (r > 1.3 || s.isHero) {
          // Radial glow for larger / closer stars
          const glowRadius = Math.max(2, r * 2.8);
          const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowRadius);
          grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.95})`);
          grad.addColorStop(0.35, `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.4})`);
          grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Solid star center
        ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, r), 0, Math.PI * 2);
        ctx.fill();

        // 4-pointed sparkle flare for Hero stars (✦)
        if (s.isHero && alpha > 0.4) {
          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(s.rotation);
          const flareLen = r * 5.2 * twinkle;
          const flareWidth = Math.max(0.8, r * 0.65);
          
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.75})`;
          ctx.lineWidth = flareWidth;
          ctx.beginPath();
          // Horizontal & vertical flare lines
          ctx.moveTo(-flareLen, 0);
          ctx.lineTo(flareLen, 0);
          ctx.moveTo(0, -flareLen);
          ctx.lineTo(0, flareLen);
          ctx.stroke();

          // Delicate 45deg mini diagonal flares
          const miniFlare = flareLen * 0.45;
          ctx.beginPath();
          ctx.moveTo(-miniFlare, -miniFlare);
          ctx.lineTo(miniFlare, miniFlare);
          ctx.moveTo(-miniFlare, miniFlare);
          ctx.lineTo(miniFlare, -miniFlare);
          ctx.stroke();

          ctx.restore();
        }
      }

      // Check & Draw Shooting Star
      const now = Date.now();
      if (!shootingStar && now >= nextShootingTime) {
        spawnShootingStar();
      }

      if (shootingStar) {
        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.life -= shootingStar.decay;

        if (shootingStar.life <= 0 || shootingStar.x < -100 || shootingStar.y > height + 100) {
          shootingStar = null;
        } else {
          const tailX = shootingStar.x - (shootingStar.vx / 15) * shootingStar.length;
          const tailY = shootingStar.y - (shootingStar.vy / 15) * shootingStar.length;
          const { r: cr, g: cg, b: cb } = shootingStar.color;

          const grad = ctx.createLinearGradient(tailX, tailY, shootingStar.x, shootingStar.y);
          grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0)`);
          grad.addColorStop(0.7, `rgba(${cr}, ${cg}, ${cb}, ${shootingStar.life * 0.5})`);
          grad.addColorStop(1, `rgba(255, 255, 255, ${shootingStar.life * 0.95})`);

          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.8 * shootingStar.life;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(tailX, tailY);
          ctx.lineTo(shootingStar.x, shootingStar.y);
          ctx.stroke();

          // Shooting star head spark
          ctx.fillStyle = `rgba(255, 255, 255, ${shootingStar.life})`;
          ctx.beginPath();
          ctx.arc(shootingStar.x, shootingStar.y, 2 * shootingStar.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(renderStarfield);
    }

    // IntersectionObserver to pause loop when scrolled out of view
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            if (!isVisible) {
              isVisible = true;
              if (!animId) animId = requestAnimationFrame(renderStarfield);
            }
          } else {
            isVisible = false;
            if (animId) {
              cancelAnimationFrame(animId);
              animId = null;
            }
          }
        });
      }, { threshold: 0.05 });
      observer.observe(banner);
    }

    // Start loop
    animId = requestAnimationFrame(renderStarfield);
  }

  // --- 3D INTERACTIVE PARALLAX TILT & THEATRICAL FOLLOW SPOTLIGHT FOR HERO BANNER ---
  function initHeroParallax() {
    const banner = document.getElementById('hero-campaign-banner-container');
    const bgImg = document.getElementById('hero-campaign-bg-img');
    const content = document.getElementById('hero-content-layer');
    const medallion = document.getElementById('hero-top-medallion');
    const spotlight = document.getElementById('hero-theatrical-spotlight');

    if (!banner || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let isHovering = false;
    let rafId = null;

    banner.addEventListener('mouseenter', () => {
      isHovering = true;
      if (bgImg) bgImg.style.transition = 'none';
      if (content) content.style.transition = 'none';
      if (medallion) medallion.style.transition = 'none';
      if (!rafId) rafId = requestAnimationFrame(updateParallax);
    });

    banner.addEventListener('mousemove', (e) => {
      const rect = banner.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      targetX = mouseX / rect.width - 0.5; // -0.5 to 0.5
      targetY = mouseY / rect.height - 0.5;

      if (spotlight) {
        spotlight.style.background = `radial-gradient(circle 350px at ${mouseX}px ${mouseY}px, rgba(254, 240, 138, 0.22) 0%, rgba(168, 85, 247, 0.1) 45%, transparent 80%)`;
      }

      if (!rafId) rafId = requestAnimationFrame(updateParallax);
    });

    banner.addEventListener('mouseleave', () => {
      isHovering = false;
      targetX = 0;
      targetY = 0;
      const easeReset = 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)';
      if (bgImg) bgImg.style.transition = easeReset;
      if (content) content.style.transition = easeReset;
      if (medallion) medallion.style.transition = easeReset;
      if (bgImg) bgImg.style.transform = '';
      if (content) content.style.transform = '';
      if (medallion) medallion.style.transform = '';
      if (spotlight) spotlight.style.background = '';
    });

    function updateParallax() {
      // Smooth Damped Interpolation (LERP factor 0.08)
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (bgImg) {
        bgImg.style.transform = `scale(1.04) translate(${currentX * -14}px, ${currentY * -10}px)`;
      }
      if (content) {
        content.style.transform = `translate(${currentX * 10}px, ${currentY * 8}px)`;
      }
      if (medallion) {
        medallion.style.transform = `translate(${currentX * 16}px, ${currentY * 10}px) rotateY(${currentX * 14}deg) rotateX(${-currentY * 14}deg) scale(1.02)`;
      }

      if (isHovering || Math.abs(targetX - currentX) > 0.001 || Math.abs(targetY - currentY) > 0.001) {
        rafId = requestAnimationFrame(updateParallax);
      } else {
        rafId = null;
      }
    }
  }

  // Initialize Hero Interactive Parallax & 3D Starfield
  initHeroParallax();
  initHero3DStarfield();

  // Initial startup & Hash Route Listener
  handleHashChange();
  window.addEventListener('hashchange', handleHashChange);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}