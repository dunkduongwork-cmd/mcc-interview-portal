/**
 * App.js - Application Controller & Interaction Logic for MCC.UEB
 */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.appStore;

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

  // --- NAVIGATION ROUTER ---
  const navLinks = document.querySelectorAll('[data-route]');
  const views = {
    candidate: document.getElementById('view-candidate'),
    lookup: document.getElementById('view-lookup'),
    admin: document.getElementById('view-admin')
  };

  function switchRoute(routeName) {
    Object.keys(views).forEach(k => {
      if (views[k]) {
        if (k === routeName) views[k].classList.remove('hidden');
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
      const isActive = (route === routeName);
      const icon = btn.querySelector('svg');

      if (isActive) {
        btn.className = 'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-gradient-to-r from-[#8B1E22] to-[#A6282E] text-white shadow-xs flex items-center gap-1.5 cursor-pointer border border-transparent';
        if (icon) icon.className = 'w-4 h-4 text-amber-200';
      } else {
        btn.className = `px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 cursor-pointer border ${hasBorder ? 'border-slate-200' : 'border-transparent'}`;
        if (icon) icon.className = 'w-4 h-4 text-slate-400';
      }
    });

    if (routeName === 'candidate') initCandidateWizard();
    if (routeName === 'admin') renderAdminWorkspace();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchRoute(link.getAttribute('data-route'));
    });
  });

  // --- CANDIDATE WIZARD CONTROLLER ---
  function initCandidateWizard() {
    const activeCamp = store.getActiveCampaign();
    const navGen = document.getElementById('nav-active-gen');
    if (navGen) navGen.textContent = activeCamp.gen || 'Gen XVI';
    const heroGenEl = document.getElementById('hero-campaign-gen');
    if (heroGenEl) {
      heroGenEl.textContent = activeCamp.academicYear ? `CHECK IN ${activeCamp.gen.toUpperCase()} (${activeCamp.academicYear})` : (activeCamp.gen || 'CHECK IN GEN XVI');
    }
    const heroNameEl = document.getElementById('hero-campaign-name');
    if (heroNameEl) {
      heroNameEl.innerHTML = `<span class="text-[#FFF8EB] uppercase">${activeCamp.name}</span>`;
    }
    const heroSloganEl = document.getElementById('hero-campaign-slogan');
    if (heroSloganEl) {
      heroSloganEl.textContent = `"${activeCamp.slogan}"`;
    }

    // Deadline Display & Lock Wizard
    if (activeCamp.registrationDeadline) {
      const d = new Date(activeCamp.registrationDeadline);
      const dlText = document.getElementById('hero-deadline-text');
      if (dlText) dlText.textContent = d.toLocaleString('vi-VN');
      
      const isPast = store.isPastDeadline(activeCamp.id);
      const badge = document.getElementById('hero-deadline-badge');
      const wizardCard = document.getElementById('candidate-wizard-card');
      const expiredCard = document.getElementById('candidate-expired-card');
      const expiredCampName = document.getElementById('expired-camp-name');
      if (expiredCampName) expiredCampName.textContent = activeCamp.name || 'FRAMEJUMP';

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
    wizardState.currentStep = stepNum;
    for (let i = 1; i <= 4; i++) {
      const pane = document.getElementById(`step-${i}-content`);
      if (pane) {
        if (i === stepNum) pane.classList.remove('hidden');
        else pane.classList.add('hidden');
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

  // STEP 1 NAVIGATION
  document.getElementById('btn-next-step-1')?.addEventListener('click', () => {
    const fn = document.getElementById('wiz-fullname').value.trim();
    const stId = document.getElementById('wiz-studentid').value.trim();
    const em = document.getElementById('wiz-email').value.trim();
    const ph = document.getElementById('wiz-phone').value.trim();

    if (!fn || !stId || !em || !ph) {
      window.UI.showToast('Vui lòng điền đầy đủ các thông tin bắt buộc (*)', 'warning');
      return;
    }

    wizardState.personalInfo = {
      fullName: fn,
      studentId: stId,
      email: em,
      phone: ph,
      academicClass: document.getElementById('wiz-class').value.trim()
    };

    goToStep(2);
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
      card.className = `p-6 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer pro-card-interactive mouse-glow-card ${
        isChecked ? 'bg-orange-50/70 border-[#C23B22] ring-2 ring-[#C23B22]/60 shadow-md' : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-card'
      }`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 font-black flex items-center justify-center text-xs">
              ${dept.short.charAt(0)}
            </span>
            <button type="button" class="btn-open-jd text-[11px] font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 px-3 py-1 rounded-xl transition-all" data-dept="${dept.id}">
              Chi tiết JD ↗
            </button>
          </div>
          <h4 class="font-black text-stone-900 text-base mb-1.5">${dept.name}</h4>
          <p class="text-xs text-stone-600 line-clamp-3 leading-relaxed mb-4">${dept.desc}</p>
        </div>
        <div class="pt-3.5 border-t border-stone-100 flex items-center justify-between">
          <span class="text-xs font-black ${isChecked ? 'text-[#C23B22]' : 'text-stone-500'}">
            ${isChecked ? '✓ Đã chọn ban này' : '+ Chọn ban này'}
          </span>
          <input type="checkbox" class="dept-checkbox w-4 h-4 rounded text-[#C23B22] cursor-pointer" ${isChecked ? 'checked' : ''}>
        </div>
      `;

      card.onclick = (e) => {
        if (e.target.closest('.btn-open-jd')) return;
        toggleDeptSelection(dept.id);
      };

      card.querySelector('.btn-open-jd').onclick = (e) => {
        e.stopPropagation();
        openJdModal(dept.id);
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

    const formatSlotDetail = (slot) => {
      const [yy, mm, dd] = (slot.date || '').split('-');
      const ivNames = (slot.interviewers || []).map(i => i.fullName).join(', ') || 'Ban Tuyển Quân';
      const isWaitlist = slot.isFull || (slot.bookedCount >= slot.capacity);

      return `
        <div class="p-4 rounded-2xl border text-xs text-slate-700 space-y-2 ${
          isWaitlist ? 'bg-amber-50/80 border-amber-300 shadow-sm' : 'bg-orange-50/70 border-orange-200'
        }">
          <div class="flex items-center justify-between font-black">
            <span class="text-orange-700 uppercase tracking-wider text-[11px]">${slot.dept.name}</span>
            ${isWaitlist ? `
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 animate-pulse">
                ⏳ Đăng Ký Hàng Chờ (Waitlist)
              </span>
            ` : `
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                ✓ Ca Chính Thức
              </span>
            `}
          </div>

          <div class="font-black text-slate-900 text-sm">${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} (Ngày ${dd}/${mm}/${yy})</div>
          <div>📍 ${slot.type === 'online' ? 'Online: ' + (slot.meetUrl || 'Google Meet') : slot.location}</div>
          <div>📌 Sức chứa: <strong>${slot.capacity} ứng viên / ca</strong></div>

          ${isWaitlist ? `
            <div class="mt-2.5 p-3 rounded-xl bg-amber-100/90 text-amber-950 font-medium text-[11px] border border-amber-300/80 leading-relaxed text-left space-y-1">
              <div class="font-bold flex items-center gap-1.5 text-amber-900">
                <span>⚠️</span>
                <span>LƯU Ý VỀ CA HÀNG CHỜ (WAITLIST):</span>
              </div>
              <p>
                Ca phỏng vấn này hiện đã đủ 2/2 slot. Bạn đang đăng ký vào <strong>Hàng chờ</strong>. Hệ thống sẽ tự động đôn bạn lên khi có người hủy, đồng thời bạn hãy <strong>nhắn tin ngay cho Fanpage MCC.UEB</strong> sau khi hoàn tất để được ưu tiên hỗ trợ nhé!
              </p>
            </div>
          ` : ''}
        </div>
      `;
    };

    const hasAnyWaitlist = (slot1 && (slot1.isFull || slot1.bookedCount >= slot1.capacity)) || 
                           (slot2 && (slot2.isFull || slot2.bookedCount >= slot2.capacity));

    const submitBtn = document.getElementById('btn-submit-registration');
    if (submitBtn) {
      if (hasAnyWaitlist) {
        submitBtn.innerHTML = '⏳ Xác nhận đăng ký Hàng chờ (Waitlist)';
        submitBtn.className = 'px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-sm shadow-xl shadow-amber-600/30 transition-all flex items-center gap-2';
      } else {
        submitBtn.innerHTML = '🔥 Xác nhận đăng ký ca';
        submitBtn.className = 'px-8 py-3.5 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black text-sm shadow-xl shadow-orange-600/30 transition-all flex items-center gap-2';
      }
    }

    container.innerHTML = `
      <div class="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
        <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Thông Tin Cá Nhân:</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
          <div>Họ và tên: <strong class="text-slate-900">${info.fullName}</strong></div>
          <div>Mã sinh viên (MSV): <strong class="text-slate-900">${info.studentId}</strong></div>
          <div>Email: <strong class="text-slate-900">${info.email}</strong></div>
          <div>SĐT: <strong class="text-slate-900">${info.phone}</strong></div>
          ${info.academicClass ? `<div>Lớp: <strong>${info.academicClass}</strong></div>` : ''}
        </div>
      </div>

      <div class="space-y-3">
        <h4 class="font-bold text-slate-800 text-xs uppercase tracking-wider">Lịch Phỏng Vấn Đã Chọn:</h4>
        ${slot1 ? formatSlotDetail(slot1) : ''}
        ${slot2 ? formatSlotDetail(slot2) : ''}
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

      // Tự động kích hoạt gửi Email xác nhận lịch phỏng vấn
      if (window.EmailService) {
        result.registrations.forEach(r => {
          const slot = store.getSlotById(r.slotId);
          const dept = store.getDepartmentById(r.departmentId);
          window.EmailService.sendBookingConfirmationEmail({
            recipientEmail: result.candidate.email,
            candidateName: result.candidate.fullName,
            bookingCode: r.bookingCode,
            deptName: dept?.name,
            slotTime: slot?.shiftLabel || `${slot?.startTime} - ${slot?.endTime}`,
            slotDate: slot?.date,
            location: slot?.type === 'online' ? 'Online Google Meet' : slot?.location
          });
        });
      }

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

    const container = document.getElementById('success-registrations-list');
    container.innerHTML = '';
    const activeCamp = store.getActiveCampaign();

    const badge = document.getElementById('success-modal-badge');
    const title = document.getElementById('success-modal-title');
    const subtitle = document.getElementById('success-modal-subtitle');
    const hasWaitlist = registrations.some(r => r.status === 'waitlist');

    if (hasWaitlist) {
      if (badge) {
        badge.className = 'text-[10px] font-black uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300 inline-block';
        badge.textContent = '⏳ ĐÃ GHI NHẬN VÀO HÀNG CHỜ (WAITLIST)';
      }
      if (title) {
        title.textContent = 'Hồ Sơ Đang Trong Danh Sách Chờ!';
      }
      if (subtitle) {
        subtitle.textContent = 'Ca bạn chọn hiện đã đủ 2/2. Bạn vui lòng chờ thông báo hoặc nhắn tin Fanpage để được hỗ trợ sắp xếp nhé.';
      }
    } else {
      if (badge) {
        badge.className = 'text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200 inline-block';
        badge.textContent = 'ĐĂNG KÝ THÀNH CÔNG';
      }
      if (title) {
        title.textContent = 'Hẹn Gặp Bạn Tại Buổi Phỏng Vấn!';
      }
      if (subtitle) {
        subtitle.textContent = 'Hãy lưu lại mã hồ sơ hoặc dùng MSV + Email để tra cứu / đổi ca khi cần.';
      }
    }

    registrations.forEach(reg => {
      const slot = store.getSlotById(reg.slotId);
      const dept = store.getDepartmentById(reg.departmentId);
      const [yy, mm, dd] = (slot?.date || '').split('-');
      const isWaitlist = reg.status === 'waitlist';

      const item = document.createElement('div');
      item.className = `p-4 rounded-2xl border text-xs text-slate-700 space-y-2.5 ${
        isWaitlist ? 'bg-amber-50/80 border-amber-300 shadow-sm' : 'bg-orange-50 border-orange-200'
      }`;
      item.innerHTML = `
        <div class="flex items-center justify-between font-black mb-1">
          <span class="text-orange-700 uppercase font-bold">${dept.name}</span>
          <div class="flex items-center gap-1.5">
            ${isWaitlist ? '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-200 text-amber-950 border border-amber-400 animate-pulse">⏳ Hàng chờ (Waitlist)</span>' : ''}
            <span class="font-mono bg-white px-2 py-0.5 rounded-lg border border-orange-200">${reg.bookingCode}</span>
          </div>
        </div>
        <div>Thời gian ca chờ: <strong>${slot?.shiftLabel || (slot?.startTime + ' - ' + slot?.endTime)} (Ngày ${dd}/${mm}/${yy})</strong></div>
        <div class="text-slate-500">Địa điểm: ${slot?.type === 'online' ? 'Online Meet' : slot?.location}</div>
        ${isWaitlist ? `
          <div class="mt-2 p-3.5 rounded-2xl bg-amber-100/90 text-amber-950 font-medium text-[11px] border border-amber-300/80 leading-relaxed text-left space-y-2">
            <div class="font-bold flex items-center gap-1.5 text-amber-900">
              <span>📢</span>
              <span>BẠN VUI LÒNG CHỜ & NHẮN TIN FANPAGE NHÉ:</span>
            </div>
            <p>
              Hệ thống sẽ tự động đôn bạn lên khi có người đổi ca hoặc nhường chỗ. Để chúng mình ghi nhận trường hợp đặc biệt của bạn, <strong>bạn hãy nhắn tin ngay cho Fanpage MCC.UEB</strong> kèm MSV: <strong>${candidate.studentId}</strong> nhé!
            </p>
            <div class="pt-1">
              <a href="https://www.facebook.com/MCC.UEB" target="_blank" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all">
                <span>💬</span> Nhắn tin Fanpage MCC.UEB ngay →
              </a>
            </div>
          </div>
        ` : ''}
      `;
      container.appendChild(item);
    });

    const gcalBtn = document.getElementById('btn-success-gcal');
    if (gcalBtn) {
      gcalBtn.onclick = () => {
        const reg = registrations[0];
        const slot = store.getSlotById(reg.slotId);
        const url = window.CalendarHelper.createGoogleCalendarUrl(candidate, slot, activeCamp);
        window.open(url, '_blank');
      };
    }

    const icsBtn = document.getElementById('btn-success-ics');
    if (icsBtn) {
      icsBtn.onclick = () => {
        const reg = registrations[0];
        const slot = store.getSlotById(reg.slotId);
        window.CalendarHelper.downloadIcsFile(candidate, slot, activeCamp);
        window.UI.showToast('Đã tải file lịch .ics', 'info');
      };
    }

    modal.classList.remove('hidden');
  }

  function openJdModal(deptId) {
    const dept = store.getDepartmentById(deptId);
    if (!dept || !dept.jd) return;

    document.getElementById('jd-dept-name').textContent = dept.name;
    document.getElementById('jd-overview').textContent = dept.jd.overview || dept.desc;

    document.getElementById('jd-tasks-list').innerHTML = (dept.jd.tasks || []).map(t => `<li class="flex items-start gap-2"><span>📌</span><span>${t}</span></li>`).join('');
    document.getElementById('jd-reqs-list').innerHTML = (dept.jd.requirements || []).map(r => `<li class="flex items-start gap-2"><span>✨</span><span>${r}</span></li>`).join('');
    document.getElementById('jd-benefits-list').innerHTML = (dept.jd.benefits || []).map(b => `<li class="flex items-start gap-2"><span>🎁</span><span>${b}</span></li>`).join('');

    document.getElementById('jd-modal')?.classList.remove('hidden');
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
    formReqOtp.addEventListener('submit', (e) => {
      e.preventDefault();
      const stId = document.getElementById('lookup-studentid').value.trim();
      const email = document.getElementById('lookup-email').value.trim();

      try {
        checkDeviceOtpSpam();
        const res = store.requestOtp(stId, email);

        // Kích hoạt gửi Email OTP tự động tới hòm thư sinh viên
        if (window.EmailService) {
          window.EmailService.sendOtpEmail({
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
      }
    });
  }

  // Nút gửi lại mã OTP
  document.getElementById('btn-resend-otp')?.addEventListener('click', () => {
    const stId = document.getElementById('lookup-studentid').value.trim();
    const email = document.getElementById('lookup-email').value.trim();
    try {
      checkDeviceOtpSpam();
      const res = store.requestOtp(stId, email);
      if (window.EmailService) {
        window.EmailService.sendOtpEmail({
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

      if (!otpCode || otpCode.length < 6) {
        window.UI.showToast('Vui lòng nhập đủ 6 chữ số mã OTP.', 'warning');
        return;
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
              <span>${s.type === 'online' ? '🌐 Google Meet Online' : '📍 ' + s.location}</span>
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
    const activeCamp = store.getActiveCampaign();
    const currentAdmin = store.getCurrentAdmin();
    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    const isDeptLead = !isSuperAdmin && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

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

    // 3. Registrations query (Strictly confirmed only - Exclude waitlist)
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

      const checkInClasses = {
        'pending': 'bg-slate-100 text-slate-600',
        'checked-in': 'bg-emerald-100 text-emerald-800 font-bold',
        'absent': 'bg-rose-100 text-rose-700 font-bold'
      };

      tr.innerHTML = `
        <td class="px-4 py-3 font-mono font-black text-slate-800">${reg.bookingCode}</td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900">${cand.fullName || 'N/A'}</div>
          <div class="text-[11px] text-slate-500">MSV: ${cand.studentId} • ${cand.academicClass || ''}</div>
        </td>
        <td class="px-4 py-3 font-bold text-orange-700">${reg.dept?.name}</td>
        <td class="px-4 py-3">
          <div class="font-bold">${slot?.shiftLabel || (slot?.startTime + ' - ' + slot?.endTime)}</div>
          <div class="text-[11px] text-slate-500">${dd}/${mm} • ${slot?.type === 'online' ? 'Online Meet' : slot?.location}</div>
        </td>
        <td class="px-4 py-3 text-slate-600 font-medium">
          <div>${cand.phone || '-'}</div>
          <div class="text-[10px] text-slate-400">${cand.email || ''}</div>
        </td>
        <td class="px-4 py-3 text-right">
          <select class="checkin-select text-xs rounded-xl border border-slate-200 py-1.5 px-3 ${checkInClasses[reg.checkInStatus]} outline-none font-bold cursor-pointer transition-all">
            <option value="pending" ${reg.checkInStatus === 'pending' ? 'selected' : ''}>⏳ Chờ đến</option>
            <option value="checked-in" ${reg.checkInStatus === 'checked-in' ? 'selected' : ''}>🟢 Đã đến</option>
            <option value="absent" ${reg.checkInStatus === 'absent' ? 'selected' : ''}>🔴 Vắng mặt</option>
          </select>
        </td>
      `;

      tr.querySelector('.checkin-select').onchange = (e) => {
        store.updateCheckInStatus(reg.id, e.target.value);
        window.UI.showToast(`Đã cập nhật trạng thái điểm danh cho [${cand.fullName}]`, 'success');
        renderInterviewerWorkspace();
      };

      tbody.appendChild(tr);
    });
  }

  // --- ADMIN AUTHENTICATION CONTROLLER ---
  function setupAdminLoginForm() {
    const form = document.getElementById('form-admin-login');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const u = document.getElementById('admin-login-username').value;
      const p = document.getElementById('admin-login-password').value;

      try {
        const admin = await store.authenticateAdmin(u, p);
        const roleStr = admin.role ? ` (${admin.role})` : '';
        window.UI.showToast(`Xin chào ${admin.fullName}${roleStr}!`, 'success');
        currentActiveAdminTab = 'slots';
        currentInterviewerDept = (admin.deptId && admin.deptId !== 'all') ? admin.deptId : 'all';
        renderAdminWorkspace();
      } catch (err) {
        window.UI.showToast(err.message, 'error');
      }
    };

    // Toggle password visibility button
    const btnTogglePass = document.getElementById('btn-toggle-admin-password');
    if (btnTogglePass) {
      btnTogglePass.onclick = () => {
        const passInput = document.getElementById('admin-login-password');
        if (passInput) {
          const isPass = passInput.type === 'password';
          passInput.type = isPass ? 'text' : 'password';
          btnTogglePass.textContent = isPass ? '🙈' : '👁️';
          btnTogglePass.title = isPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
        }
      };
    }

    // Quick demo login buttons
    document.querySelectorAll('.btn-quick-admin-login').forEach(btn => {
      btn.onclick = () => {
        const u = btn.getAttribute('data-user');
        const p = btn.getAttribute('data-pass');
        document.getElementById('admin-login-username').value = u;
        document.getElementById('admin-login-password').value = p;
        try {
          const admin = store.authenticateAdmin(u, p);
          window.UI.showToast(`Đăng nhập nhanh thành công: ${admin.fullName}`, 'success');
          currentActiveAdminTab = 'slots';
          currentInterviewerDept = (admin.deptId && admin.deptId !== 'all') ? admin.deptId : 'all';
          renderAdminWorkspace();
        } catch (err) {
          window.UI.showToast(err.message, 'error');
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
      campSelect.onchange = () => {
        store.setActiveCampaign(campSelect.value);
        window.UI.showToast(`Đã chuyển sang đợt tuyển [${campSelect.options[campSelect.selectedIndex].text}]`, 'info');
        renderAdminWorkspace();
      };
    }

    // Set Deadline Inputs (Separated Date & Time)
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

    // Configure Action Buttons & Inputs for Full Access (Ban Chủ Nhiệm, Mentor, Ban Nhân Sự)
    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    ['btn-open-new-campaign-modal', 'btn-open-import-modal', 'sidebar-create-campaign-container'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (!isSuperAdmin) el.classList.add('hidden');
        else el.classList.remove('hidden');
      }
    });

    // Configure Deadline Card Visibility (Exclusive to Ban Chủ Nhiệm, Mentor, Ban Nhân Sự)
    const deadlineBox = document.getElementById('admin-deadline-card-box');
    if (deadlineBox) {
      if (isSuperAdmin) {
        deadlineBox.classList.remove('hidden');
      } else {
        deadlineBox.classList.add('hidden');
      }
    }

    // Dropdown tùy chọn mở/khóa/xóa ca: chỉ mở cho Full quyền
    const slotActionsDropdown = document.getElementById('slot-actions-dropdown-container');
    if (slotActionsDropdown) {
      if (!isSuperAdmin) slotActionsDropdown.classList.add('hidden');
      else slotActionsDropdown.classList.remove('hidden');
    }

    // Populate filter dropdowns with strict RBAC scoping
    const deptSelect = document.getElementById('admin-filter-slot-dept');
    const candDeptSelect = document.getElementById('admin-cand-filter-dept');
    const departments = store.getDepartments();
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;
    const myDept = isDeptLead ? store.getDepartmentById(myDeptId) : null;

    if (deptSelect) {
      deptSelect.innerHTML = '';
      if (isDeptLead && myDept) {
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
      if (isDeptLead && myDept) {
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

    renderAdminSlotsTable();
    renderAdminCandidatesTable();

    // Setup Sidebar Navigation & Tabs Router
    setupAdminSidebarNav(currentAdmin);
  }

  let currentActiveAdminTab = 'slots';

  function switchAdminTab(tabId) {
    if (tabId === 'dashboard') tabId = 'slots';
    const currentAdmin = store.getCurrentAdmin();
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );

    // Chức năng Tùy chọn chỉ duy nhất tài khoản admin được phép truy cập
    if (tabId === 'options' && !isRootAdmin) {
      tabId = 'candidates';
    }
    currentActiveAdminTab = tabId;

    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    const isDeptLead = !isSuperAdmin && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';

    // Panes map
    const panes = {
      candidates: document.getElementById('admin-pane-candidates'),
      slots: document.getElementById('admin-pane-slots'),
      checkin: document.getElementById('admin-pane-checkin'),
      audit: document.getElementById('admin-pane-audit'),
      options: document.getElementById('admin-pane-options')
    };

    // Titles map
    const titles = {
      candidates: 'Tổng hợp các ca phỏng vấn ứng viên đăng ký',
      slots: 'Quản lý lịch phỏng vấn',
      checkin: 'Chi tiết ca & điểm danh',
      audit: 'Lịch sử hoạt động hệ thống',
      options: 'Cấu hình tùy chọn hệ thống'
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
      if (bTab === 'dashboard' || bTab === 'settings') {
        isRestricted = true;
      } else if (bTab === 'options' && !isRootAdmin) {
        // Chức năng tùy chọn CHỈ HIỆN ở tài khoản admin
        isRestricted = true;
      } else if (isDeptLead && bTab === 'audit') {
        isRestricted = true;
      }

      if (isRestricted) {
        btn.className = 'admin-nav-item hidden';
        return;
      }

      const badge = btn.querySelector('span[id^="badge-tab-"]');
      if (bTab === tabId) {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all bg-gradient-to-r from-[#8B1E22] to-[#A6282E] text-white shadow-md shadow-[#8B1E22]/25 font-bold whitespace-nowrap';
        if (badge) badge.className = 'shrink-0 px-2 py-0.5 text-[10px] font-black rounded-full bg-white/25 text-white ml-1';
      } else {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-slate-700 hover:bg-red-50/70 hover:text-[#8B1E22] font-bold whitespace-nowrap';
        if (badge) badge.className = 'shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-600 ml-1';
      }
    });

    // Trigger tab-specific refresh
    if (tabId === 'slots') renderAdminSlotsTable();
    else if (tabId === 'candidates') renderAdminCandidatesTable();
    else if (tabId === 'checkin') renderInterviewerWorkspace();
    else if (tabId === 'audit') renderAdminAuditLogs();
    else if (tabId === 'options') renderAdminOptionsPane();
  }

  function setupAdminSidebarNav(currentAdmin) {
    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    const isDeptLead = !isSuperAdmin && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;
    const isRootAdmin = currentAdmin && (
      currentAdmin.id === 'adm-root-admin' || 
      currentAdmin.username?.toLowerCase() === 'admin.mcc@gmail.com' ||
      currentAdmin.role === 'Admin' ||
      currentAdmin.fullName?.toLowerCase() === 'admin'
    );

    // 1. Default Tab Logic - Candidates is the universal landing tab
    if (!isRootAdmin && currentActiveAdminTab === 'options') {
      currentActiveAdminTab = 'candidates';
    } else if (isDeptLead && (currentActiveAdminTab === 'audit' || currentActiveAdminTab === 'dashboard' || currentActiveAdminTab === 'settings')) {
      currentActiveAdminTab = 'candidates';
    } else if (!currentActiveAdminTab || currentActiveAdminTab === 'dashboard') {
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
      slotsCountBadge.textContent = `${campSlots.length} ca`;
    }
    if (candsCountBadge) {
      if (isDeptLead) {
        const deptRegs = (store.data.registrations || []).filter(r => r.campaignId === activeCamp.id && r.departmentId === myDeptId && (r.status === 'confirmed' || r.status === 'waitlist'));
        candsCountBadge.textContent = `${deptRegs.length} đơn`;
      } else {
        candsCountBadge.textContent = `${stats.totalRegistrations} đơn`;
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
    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    const isCanEditCapacity = currentAdmin && (currentAdmin.role === 'Ban Chủ Nhiệm' || currentAdmin.role === 'Mentor');
    const isDeptLead = !isSuperAdmin && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    let deptFilter = document.getElementById('admin-filter-slot-dept')?.value || 'all';
    if (isDeptLead) {
      deptFilter = myDeptId;
    }
    const slots = store.getSlots(activeCamp.id, deptFilter);

    // Sync badge count
    const slotsCountBadge = document.getElementById('badge-tab-slots-count');
    if (slotsCountBadge) {
      const allLeadSlots = store.getSlots(activeCamp.id, isDeptLead ? myDeptId : null);
      slotsCountBadge.textContent = `${allLeadSlots.length} ca`;
    }

    const tbody = document.getElementById('admin-slots-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const selectAllCheckbox = document.getElementById('chk-select-all-slots');
    if (selectAllCheckbox) {
      selectAllCheckbox.checked = false;
      if (isDeptLead) selectAllCheckbox.disabled = true;
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

      const checkColHtml = isSuperAdmin
        ? `<input type="checkbox" value="${slot.id}" class="chk-slot-item rounded text-orange-600 cursor-pointer">`
        : `<span class="text-slate-300">•</span>`;

      const actionColHtml = isSuperAdmin
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
          <select class="sel-slot-capacity text-xs font-black bg-white border border-slate-300 rounded-lg px-1.5 py-0.5 text-slate-800 cursor-pointer shadow-2xs hover:border-[#8B1E22] transition-colors" title="Ban Chủ Nhiệm / Mentor: Bấm để đổi số lượng ứng viên cho ca này (1-3)">
            <option value="1" ${slot.capacity === 1 ? 'selected' : ''}>1</option>
            <option value="2" ${slot.capacity === 2 || !slot.capacity ? 'selected' : ''}>2</option>
            <option value="3" ${slot.capacity === 3 ? 'selected' : ''}>3</option>
          </select>
          ${slot.isFull ? '<span class="text-[10px] text-rose-600 font-bold">(Hết chỗ)</span>' : ''}
          ${slot.waitlistCount > 0 ? `
            <button type="button" onclick="window.__openWaitlistModal('${slot.id}')" class="btn-open-waitlist px-2 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 shadow-sm whitespace-nowrap" title="Bấm để xem thông tin ứng viên đang chờ">
              <span>⏳</span>
              <span>${slot.waitlistCount} chờ</span>
            </button>
          ` : ''}
        </div>
      ` : `
        <div class="flex items-center gap-1.5 whitespace-nowrap">
          <span class="font-black ${slot.isFull ? 'text-rose-600' : 'text-slate-900'}">${slot.bookedCount}/${slot.capacity || 2}</span>
          ${slot.isFull ? '<span class="text-[10px] text-rose-600 font-bold">(Hết chỗ)</span>' : ''}
          ${slot.waitlistCount > 0 ? `
            <button type="button" onclick="window.__openWaitlistModal('${slot.id}')" class="btn-open-waitlist px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 shadow-sm whitespace-nowrap" title="Bấm để xem thông tin ứng viên đang chờ">
              <span>⏳</span>
              <span>${slot.waitlistCount} chờ (Xem)</span>
            </button>
          ` : ''}
        </div>
      `;

      tr.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap text-center">
          ${checkColHtml}
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-bold text-[#8B1E22]">${slot.dept.name}</td>
        <td class="px-4 py-3 whitespace-nowrap font-bold">${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} <span class="text-slate-400 font-normal">(${dd}/${mm})</span></td>
        <td class="px-4 py-3 whitespace-nowrap text-slate-600">${slot.type === 'online' ? 'Online Meet' : slot.location}</td>
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

      if (isSuperAdmin) {
        const chk = tr.querySelector('.chk-slot-item');
        if (chk) chk.onchange = updateSlotSelectionBadge;

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

  window.__openWaitlistModal = function(slotId, e) {
    if (e && e.stopPropagation) e.stopPropagation();
    const slot = store.getSlots().find(s => s.id === slotId) || store.getSlotById(slotId);
    if (!slot) {
      console.warn('Slot not found:', slotId);
      return;
    }
    openWaitlistDetailModal(slot);
  };

  function openWaitlistDetailModal(slot) {
    const modal = document.getElementById('modal-waitlist-detail');
    if (!modal) return;

    modal.classList.remove('hidden');

    const [yy, mm, dd] = (slot.date || '').split('-');
    const titleEl = document.getElementById('waitlist-modal-slot-title');
    if (titleEl) {
      titleEl.textContent = `${slot.dept?.name || 'Phỏng vấn'} • ${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} (Ngày ${dd}/${mm}/${yy})`;
    }

    const container = document.getElementById('waitlist-modal-candidates-list');
    if (!container) return;
    container.innerHTML = '';

    const waitlistRegs = (store.data.registrations || []).filter(r => r.slotId === slot.id && r.status === 'waitlist');

    if (waitlistRegs.length === 0) {
      container.innerHTML = '<div class="p-6 text-center text-slate-400">Không có ứng viên nào trong hàng chờ của ca này.</div>';
    } else {
      waitlistRegs.forEach(reg => {
        const cand = (store.getCandidateById ? store.getCandidateById(reg.candidateId) : store.data.candidates.find(c => c.id === reg.candidateId)) || {};
        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-slate-800 space-y-3';
        card.innerHTML = `
          <div class="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
              <strong class="text-sm text-slate-900">${cand.fullName || 'Chưa có tên'}</strong>
              <span class="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black">Hàng chờ #1</span>
            </div>
            <span class="font-mono font-bold bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-orange-700">${reg.bookingCode || 'MCC-WAIT'}</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700">
            <div>Mã sinh viên (MSV): <strong class="text-slate-900">${cand.studentId || '-'}</strong></div>
            <div>Lớp / Khóa: <strong class="text-slate-900">${cand.academicClass || '-'}</strong></div>
            <div>Email: <a href="mailto:${cand.email || ''}" class="text-indigo-600 hover:underline font-bold">${cand.email || '-'}</a></div>
            <div>SĐT / Zalo: <a href="tel:${cand.phone || ''}" class="text-emerald-700 hover:underline font-bold">${cand.phone || '-'}</a></div>
          </div>

          <div class="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-amber-200/60">
            <button type="button" class="btn-promote-waitlist px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all">
              <span>⚡</span> Duyệt vào ca chính thức ngay
            </button>
            <button type="button" class="btn-reschedule-waitlist px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-all">
              <span>🔄</span> Đổi sang ca khác
            </button>
          </div>
        `;

        const btnPromote = card.querySelector('.btn-promote-waitlist');
        if (btnPromote) {
          btnPromote.onclick = () => {
            if (confirm(`Bạn có chắc chắn muốn DUYỆT ứng viên [${cand.fullName}] từ Waitlist vào ca chính thức không?`)) {
              try {
                store.promoteWaitlistToConfirmed(reg.id, 'Admin duyệt thủ công từ danh sách Waitlist');
                window.UI.showToast(`Đã duyệt [${cand.fullName}] vào ca chính thức thành công!`, 'success');
                modal.classList.add('hidden');
                renderAdminSlotsTable();
                renderAdminCandidatesTable();
              } catch (err) {
                window.UI.showToast(err.message, 'error');
              }
            }
          };
        }

        const btnReschedule = card.querySelector('.btn-reschedule-waitlist');
        if (btnReschedule) {
          btnReschedule.onclick = () => {
            modal.classList.add('hidden');
            openAdminOverrideModal(reg);
          };
        }

        container.appendChild(card);
      });
    }

    modal.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.onclick = () => modal.classList.add('hidden');
    });

    modal.onclick = (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    };
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
    const isSuperAdmin = currentAdmin && (currentAdmin.hasFullAccess || currentAdmin.deptId === 'all');
    const isDeptLead = !isSuperAdmin && currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    const searchVal = (document.getElementById('admin-cand-search')?.value || '').toLowerCase();
    let deptVal = document.getElementById('admin-cand-filter-dept')?.value || 'all';
    if (isDeptLead) {
      deptVal = myDeptId;
    }

    const allRegs = store.data.registrations
      .filter(r => r.campaignId === activeCamp.id && (!isDeptLead || r.departmentId === myDeptId) && r.status !== 'cancelled')
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
          (r.bookingCode || '').toLowerCase().includes(searchVal) ||
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
      const isWaitlist = (r.status === 'waitlist');
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
      } else if (isWaitlist) {
        statusBadge = `
          <span class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1 w-fit animate-pulse">
            <span>⏳</span>
            <span>Hàng chờ (Waitlist)</span>
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

      const actionHtml = isSuperAdmin
        ? `<button class="btn-open-override px-2.5 py-1 rounded-xl ${isCancelled ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-red-50 text-[#8B1E22] hover:bg-[#8B1E22] hover:text-white'} font-bold transition-all text-xs cursor-pointer">
            ${isCancelled ? '🔄 Đặt lại ca' : '⚙️ Can thiệp'}
          </button>`
        : `<span class="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs">
            Chỉ xem
          </span>`;

      tr.innerHTML = `
        <td class="px-4 py-3 font-mono font-black ${isCancelled ? 'text-slate-400' : 'text-[#8B1E22]'}">${r.bookingCode}</td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900 ${isCancelled ? 'line-through text-slate-500' : ''}">${cand.fullName || 'N/A'}</div>
          <div class="text-[11px] text-slate-500">MSV: ${cand.studentId} • ${cand.academicClass || ''}</div>
        </td>
        <td class="px-4 py-3 font-bold text-slate-700">${r.dept?.name || ''}</td>
        <td class="px-4 py-3 font-medium ${isCancelled ? 'line-through text-slate-400' : ''}">
          ${slot ? (slot.shiftLabel ? `${slot.shiftLabel} (${slot.date})` : `${slot.startTime} - ${slot.endTime} (${slot.date})`) : '<span class="text-slate-400 italic font-normal">Chưa có ca (Đã hủy)</span>'}
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

      if (isSuperAdmin) {
        tr.querySelector('.btn-open-override').onclick = () => {
          openAdminOverrideModal(r);
        };
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

    document.getElementById('override-code').textContent = reg.bookingCode;
    document.getElementById('override-name').textContent = cand.fullName || '';
    document.getElementById('override-mssv').textContent = cand.studentId || '';
    document.getElementById('override-dept').textContent = reg.dept?.name || '';
    document.getElementById('override-current-slot').textContent = slot ? `${slot.startTime}-${slot.endTime} (${slot.date})` : 'Chưa có ca (Đơn này đã hủy)';

    // Ẩn nút hủy nếu đơn đã ở trạng thái hủy rồi
    const cancelBtn = document.getElementById('btn-override-cancel-reg');
    if (cancelBtn) {
      if (reg.status === 'cancelled') {
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
        <td class="px-4 py-2 text-slate-400 whitespace-nowrap">${new Date(log.timestamp).toLocaleString('vi-VN')}</td>
        <td class="px-4 py-2 font-bold text-slate-800">${log.adminName}</td>
        <td class="px-4 py-2"><span class="px-2 py-0.5 rounded-md bg-orange-50 text-orange-800 font-mono font-bold">${log.action}</span></td>
        <td class="px-4 py-2 text-slate-600">${log.entityType} [${log.entityId}]</td>
        <td class="px-4 py-2 text-slate-700 italic font-medium">${log.reason || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderAdminOptionsPane() {
    const toggle = document.getElementById('toggle-waitlist-feature');
    const badge = document.getElementById('badge-waitlist-status');
    if (toggle) {
      const isEnabled = store.isWaitlistEnabled();
      toggle.checked = isEnabled;
      if (badge) {
        badge.textContent = isEnabled ? 'Đang Bật' : 'Đã Tắt';
        badge.className = isEnabled
          ? 'px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200'
          : 'px-2.5 py-0.5 text-[10px] font-black rounded-full bg-slate-200 text-slate-600 border border-slate-300';
      }
    }
  }

  document.getElementById('toggle-waitlist-feature')?.addEventListener('change', (e) => {
    const isEnabled = e.target.checked;
    store.setWaitlistEnabled(isEnabled);
    const badge = document.getElementById('badge-waitlist-status');
    if (badge) {
      badge.textContent = isEnabled ? 'Đang Bật' : 'Đã Tắt';
      badge.className = isEnabled
        ? 'px-2.5 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200'
        : 'px-2.5 py-0.5 text-[10px] font-black rounded-full bg-slate-200 text-slate-600 border border-slate-300';
    }
    window.UI.showToast(`Đã ${isEnabled ? 'BẬT' : 'TẮT'} chức năng Waitlist trên toàn bộ hệ thống!`, isEnabled ? 'success' : 'info');
    renderAdminSlotsTable();
  });

  // Deadline Quick Preset Handler
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
    window.UI.showToast(`Đã chọn mốc: ${dd}/${mm}/${yyyy} lúc ${timeStr}. Hãy bấm "Lưu Hạn Chót"!`, 'info');
  };

  // Update Deadline Form
  document.getElementById('form-update-deadline')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeCamp = store.getActiveCampaign();
    const dateVal = document.getElementById('admin-deadline-date')?.value;
    const timeVal = document.getElementById('admin-deadline-time')?.value || '23:59';
    if (!dateVal) {
      window.UI.showToast('Vui lòng chọn ngày hết hạn.', 'warning');
      return;
    }

    try {
      const isoStr = new Date(`${dateVal}T${timeVal}:00`).toISOString();
      store.updateCampaignDeadline(activeCamp.id, isoStr, 'Admin cập nhật deadline đợt tuyển');
      window.UI.showToast('Đã cập nhật deadline thành công!', 'success');
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
    const template = 'DepartmentId,Date,StartTime,EndTime,Capacity,Location,Type,MeetUrl,Interviewers\nmedia,2026-09-05,08:00,10:00,2,Phòng 501 - Nhà E4,offline,,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,10:00,12:00,2,Phòng 501 - Nhà E4,offline,,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,14:00,16:00,2,Phòng 501 - Nhà E4,offline,,Nguyễn Việt Hoàng;Trần Thảo Linh\nmedia,2026-09-05,16:00,17:30,2,Phòng 501 - Nhà E4,offline,,Nguyễn Việt Hoàng;Trần Thảo Linh';
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
      let locColIdx = headerParts.findIndex(h => ['location', 'dia_diem'].includes(h));
      let typeColIdx = headerParts.findIndex(h => ['type', 'hinh_thuc'].includes(h));

      // Thứ tự mặc định nếu file không có header chuẩn:
      // Dept(0), Date(1), StartTime(2), EndTime(3), Capacity(4), Location(5), Type(6)
      if (deptColIdx === -1) deptColIdx = 0;
      if (dateColIdx === -1) dateColIdx = 1;
      if (startColIdx === -1) startColIdx = 2;
      if (endColIdx === -1) endColIdx = 3;
      if (capColIdx === -1) capColIdx = 4;
      if (locColIdx === -1) locColIdx = 5;
      if (typeColIdx === -1) typeColIdx = 6;

      const activeCamp = store.getActiveCampaign();
      const slotsToAdd = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length < 4 || (parts.length === 1 && !parts[0])) continue;

        const deptId = parts[deptColIdx] || '';
        const deptObj = store.getDepartmentById(deptId);
        const deptName = deptObj ? deptObj.name : (deptId || `Ban dòng ${i + 1}`);
        const date = parts[dateColIdx] || '';
        const startTime = parts[startColIdx] || '';
        const endTime = parts[endColIdx] || '';

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

        slotsToAdd.push({
          campaignId: activeCamp.id,
          departmentId: deptId,
          date: date,
          startTime: startTime,
          endTime: endTime,
          capacity: cap,
          location: (locColIdx < parts.length && parts[locColIdx]) || 'Phòng 501 - E4',
          type: (typeColIdx < parts.length && parts[typeColIdx]) || 'offline',
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
      if (newCap > oldCap && slot.waitlistCount > 0) {
        noteEl.innerHTML = `💡 <strong>Lưu ý:</strong> Ca này đang có <strong>${slot.waitlistCount} ứng viên trong hàng chờ</strong>. Khi nâng sức chứa lên ${newCap}, ứng viên hàng chờ sẽ được <strong>tự động đôn lên chính thức</strong>.`;
      } else {
        noteEl.textContent = 'Bạn có chắc chắn muốn thay đổi số lượng ứng viên tối đa cho ca phỏng vấn này không?';
      }
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

  // Initial startup
  initCandidateWizard();
});