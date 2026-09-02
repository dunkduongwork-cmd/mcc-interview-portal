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
  let currentEvaluatingRegId = null;

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

    navLinks.forEach(link => {
      if (link.getAttribute('data-route') === routeName) {
        link.classList.add('bg-orange-50', 'text-orange-600', 'font-bold');
        link.classList.remove('text-slate-600');
      } else {
        link.classList.remove('bg-orange-50', 'text-orange-600', 'font-bold');
        link.classList.add('text-slate-600');
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
    if (navGen) navGen.textContent = activeCamp.gen || 'Gen XV';
    document.getElementById('hero-campaign-gen').textContent = activeCamp.academicYear ? `${activeCamp.gen} (${activeCamp.academicYear})` : (activeCamp.gen || 'Gen XV');
    document.getElementById('hero-campaign-name').innerHTML = `${activeCamp.name.split('-')[0]}: <br class="hidden sm:inline"><span class="text-amber-300 drop-shadow">${activeCamp.name.split('-')[1] || ''}</span>`;
    document.getElementById('hero-campaign-slogan').textContent = `"${activeCamp.slogan}"`;

    // Deadline Display
    if (activeCamp.registrationDeadline) {
      const d = new Date(activeCamp.registrationDeadline);
      document.getElementById('hero-deadline-text').textContent = d.toLocaleString('vi-VN');
      const isPast = store.isPastDeadline(activeCamp.id);
      const badge = document.getElementById('hero-deadline-badge');
      if (isPast) {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white';
        badge.textContent = 'Đã hết hạn';
      } else {
        badge.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white';
        badge.textContent = 'Đang nhận đơn ứng tuyển';
      }
    }

    renderStep2DepartmentsGrid();
    goToStep(1);
  }

  function goToStep(stepNum) {
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
      card.className = `p-5 rounded-3xl border transition-all flex flex-col justify-between cursor-pointer ${
        isChecked ? 'bg-orange-50/80 border-orange-500 ring-2 ring-orange-500 shadow-md' : 'bg-white border-slate-200 hover:border-orange-300'
      }`;

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-end mb-3">
            <button type="button" class="btn-open-jd text-[11px] font-bold text-orange-600 bg-orange-50 hover:bg-orange-600 hover:text-white px-2.5 py-1 rounded-xl transition-all" data-dept="${dept.id}">
              Xem chi tiết ↗
            </button>
          </div>
          <h4 class="font-black text-slate-900 text-base mb-1">${dept.name}</h4>
          <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">${dept.desc}</p>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-xs font-bold ${isChecked ? 'text-orange-600' : 'text-slate-500'}">
            ${isChecked ? '✓ Đã chọn ban này' : '+ Chọn ban này'}
          </span>
          <input type="checkbox" class="dept-checkbox w-4 h-4 rounded text-orange-600" ${isChecked ? 'checked' : ''}>
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

  const formReqOtp = document.getElementById('form-request-otp');
  if (formReqOtp) {
    formReqOtp.addEventListener('submit', (e) => {
      e.preventDefault();
      const stId = document.getElementById('lookup-studentid').value.trim();
      const email = document.getElementById('lookup-email').value.trim();

      try {
        const res = store.requestOtp(stId, email);

        // Kích hoạt gửi Email OTP tự động tới hòm thư sinh viên
        if (window.EmailService) {
          window.EmailService.sendOtpEmail({
            recipientEmail: res.email || email,
            candidateName: res.candidate?.fullName,
            studentId: res.candidate?.studentId || stId,
            otpCode: res.previewOtp
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
      const res = store.requestOtp(stId, email);
      if (window.EmailService) {
        window.EmailService.sendOtpEmail({
          recipientEmail: res.email || email,
          candidateName: res.candidate?.fullName,
          studentId: res.candidate?.studentId || stId,
          otpCode: res.previewOtp
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

  function openCandidateRescheduleModal(reg) {
    const activeCamp = store.getActiveCampaign();
    const availableSlots = store.getSlots(activeCamp.id).filter(s =>
      s.departmentId === reg.departmentId &&
      s.id !== reg.slotId &&
      s.isOpen &&
      !s.isFull
    );

    if (availableSlots.length === 0) {
      window.UI.showToast('Không còn ca phỏng vấn nào khác còn chỗ trống cho ban này.', 'warning');
      return;
    }

    const slotNames = availableSlots.map((s, idx) => {
      const [yy, mm, dd] = s.date.split('-');
      return `${idx + 1}. Ngày ${dd}/${mm} (${s.startTime} - ${s.endTime}) - ${s.type === 'online' ? 'Online' : s.location} [Còn ${s.remainingCount} chỗ]`;
    }).join('\n');

    const promptChoice = prompt(`Chọn số thứ tự ca phỏng vấn bạn muốn đổi sang:\n\n${slotNames}\n\nNhập số:`);
    if (!promptChoice) return;

    const chosenIdx = Number(promptChoice) - 1;
    if (isNaN(chosenIdx) || !availableSlots[chosenIdx]) {
      window.UI.showToast('Lựa chọn không hợp lệ.', 'error');
      return;
    }

    const newSlot = availableSlots[chosenIdx];
    try {
      store.rescheduleRegistration(reg.id, newSlot.id, 'Ứng viên tự đổi ca qua OTP');
      window.UI.showToast('Đã đổi ca phỏng vấn thành công!', 'success');
      authenticatedCandidateData = store.getCandidateFullDetails(authenticatedCandidateData.candidate.id);
      renderCandidateSelfServiceDashboard();
    } catch (err) {
      window.UI.showToast(err.message, 'error');
    }
  }

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
    const isMentor = currentAdmin && currentAdmin.isMentor;
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
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
          <div class="px-4 py-2 rounded-2xl text-xs font-black bg-orange-600 text-white shadow-md flex items-center gap-2">
            <span>🔒 Phân quyền Trưởng ban:</span>
            <span>${myDept ? myDept.name : ''} (Dành riêng cho ban của bạn)</span>
          </div>
        `;
      } else if (isMentor) {
        tabsContainer.innerHTML = `
          <div class="w-full mb-3 p-3 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold flex items-center gap-2">
            <span class="text-base">🎖️</span>
            <span>Phân quyền Cố vấn (Mentor): Theo dõi tiến độ toàn bộ 6 ban</span>
          </div>
          <div id="mentor-tabs-btn-box" class="flex flex-wrap gap-2">
            <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === 'all' ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-dept="all">
              👑 Tất cả 6 ban
            </button>
          </div>
        `;
        const btnBox = tabsContainer.querySelector('#mentor-tabs-btn-box');
        departments.forEach(dept => {
          const btn = document.createElement('button');
          btn.className = `px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === dept.id ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
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
      } else {
        tabsContainer.innerHTML = `
          <button class="px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === 'all' ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}" data-dept="all">
            👑 Tất cả 6 ban
          </button>
        `;
        departments.forEach(dept => {
          const btn = document.createElement('button');
          btn.className = `px-4 py-2 rounded-xl text-xs font-bold transition-all ${currentInterviewerDept === dept.id ? 'bg-orange-600 text-white shadow-sm ring-2 ring-orange-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`;
          btn.textContent = dept.short;
          btn.onclick = () => {
            currentInterviewerDept = dept.id;
            currentCheckinDate = 'all';
            currentCheckinShift = 'all';
            renderInterviewerWorkspace();
          };
          tabsContainer.appendChild(btn);
        });
        tabsContainer.querySelector('[data-dept="all"]').onclick = () => {
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

    form.onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById('admin-login-username').value;
      const p = document.getElementById('admin-login-password').value;

      try {
        const admin = store.authenticateAdmin(u, p);
        window.UI.showToast(`Xin chào ${admin.fullName} (${admin.role})!`, 'success');
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
    if (avatarEl) avatarEl.textContent = currentAdmin.avatar || '👨‍💼';
    if (nameEl) nameEl.textContent = currentAdmin.fullName;
    if (roleEl) roleEl.textContent = currentAdmin.role;

    // Logout Button
    const logoutBtn = document.getElementById('btn-admin-logout');
    if (logoutBtn) {
      logoutBtn.onclick = () => {
        store.logoutAdmin();
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

    // Set Deadline Input
    const deadlineInput = document.getElementById('admin-deadline-input');
    if (deadlineInput && activeCamp.registrationDeadline) {
      deadlineInput.value = activeCamp.registrationDeadline.slice(0, 16);
    }

    // Configure Action Buttons & Inputs for Mentor vs Ban Chủ Nhiệm
    const isMentor = currentAdmin && currentAdmin.isMentor;
    ['btn-open-new-campaign-modal', 'btn-open-import-modal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        if (isMentor || (currentAdmin && currentAdmin.deptId !== 'all')) el.classList.add('hidden');
        else el.classList.remove('hidden');
      }
    });

    // Configure Deadline Card Visibility (Exclusive to Ban Chủ Nhiệm - Hidden for Mentor and Dept Leads)
    const deadlineBox = document.getElementById('admin-deadline-card-box');
    if (deadlineBox) {
      if (currentAdmin && currentAdmin.deptId === 'all' && !isMentor) {
        deadlineBox.classList.remove('hidden');
      } else {
        deadlineBox.classList.add('hidden');
      }
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
    currentActiveAdminTab = tabId;
    const currentAdmin = store.getCurrentAdmin();
    const isMentor = currentAdmin && currentAdmin.isMentor;
    const isSuperAdmin = currentAdmin && currentAdmin.deptId === 'all' && !isMentor;
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';

    // Panes map
    const panes = {
      candidates: document.getElementById('admin-pane-candidates'),
      slots: document.getElementById('admin-pane-slots'),
      checkin: document.getElementById('admin-pane-checkin'),
      audit: document.getElementById('admin-pane-audit')
    };

    // Titles map
    const titles = {
      candidates: 'Tổng hợp các ca phỏng vấn ứng viên đăng ký',
      slots: 'Quản lý lịch phỏng vấn',
      checkin: 'Chi tiết ca & điểm danh',
      audit: 'Lịch sử hoạt động hệ thống'
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
      } else if (isDeptLead && bTab === 'audit') {
        isRestricted = true;
      } else if (isMentor && bTab === 'checkin') {
        isRestricted = true;
      }

      if (isRestricted) {
        btn.className = 'admin-nav-item hidden';
        return;
      }

      if (bTab === tabId) {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all bg-slate-900 text-white shadow-md font-bold whitespace-nowrap';
      } else {
        btn.className = 'admin-nav-item w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-slate-700 hover:bg-slate-100 font-bold whitespace-nowrap';
      }
    });

    // Trigger tab-specific refresh
    if (tabId === 'slots') renderAdminSlotsTable();
    else if (tabId === 'candidates') renderAdminCandidatesTable();
    else if (tabId === 'checkin') renderInterviewerWorkspace();
    else if (tabId === 'audit') renderAdminAuditLogs();
  }

  function setupAdminSidebarNav(currentAdmin) {
    const isMentor = currentAdmin && currentAdmin.isMentor;
    const isSuperAdmin = currentAdmin && currentAdmin.deptId === 'all' && !isMentor;
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    // 1. Default Tab Logic - Candidates is the universal landing tab
    if (isDeptLead && (currentActiveAdminTab === 'audit' || currentActiveAdminTab === 'dashboard' || currentActiveAdminTab === 'settings')) {
      currentActiveAdminTab = 'candidates';
    } else if (isMentor && (currentActiveAdminTab === 'checkin' || currentActiveAdminTab === 'dashboard' || currentActiveAdminTab === 'settings')) {
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
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
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
    if (selectAllCheckbox) selectAllCheckbox.checked = false;
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

      tr.innerHTML = `
        <td class="px-4 py-3 whitespace-nowrap">
          <input type="checkbox" value="${slot.id}" class="chk-slot-item rounded text-orange-600 cursor-pointer">
        </td>
        <td class="px-4 py-3 whitespace-nowrap font-bold text-orange-700">${slot.dept.name}</td>
        <td class="px-4 py-3 whitespace-nowrap font-bold">${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)} <span class="text-slate-400 font-normal">(${dd}/${mm})</span></td>
        <td class="px-4 py-3 whitespace-nowrap text-slate-600">${slot.type === 'online' ? 'Online Meet' : slot.location}</td>
        <td class="px-4 py-3 text-slate-600 truncate max-w-xs" title="${ivList}">
          ${(slot.interviewers && slot.interviewers.length >= 2) ? ivList : `<span class="text-rose-600 font-bold">⚠️ Cần ≥ 2 người (hiện có ${slot.interviewers?.length || 0})</span>`}
        </td>
        <td class="px-4 py-3 whitespace-nowrap">
          <div class="flex items-center gap-1.5 whitespace-nowrap">
            <span class="font-black ${slot.isFull ? 'text-rose-600' : 'text-slate-900'}">${slot.bookedCount}/2</span>
            ${slot.isFull ? '<span class="text-[10px] text-rose-600 font-bold">(Hết chỗ)</span>' : ''}
            ${slot.waitlistCount > 0 ? `
              <button type="button" onclick="window.__openWaitlistModal('${slot.id}')" class="btn-open-waitlist px-2.5 py-0.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-[10px] font-black inline-flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 shadow-sm whitespace-nowrap" title="Bấm để xem thông tin ứng viên đang chờ">
                <span>⏳</span>
                <span>${slot.waitlistCount} chờ (Xem)</span>
              </button>
            ` : ''}
          </div>
        </td>
        <td class="px-4 py-3 text-right whitespace-nowrap">
          <button class="btn-toggle-open px-3 py-1 text-[11px] font-bold rounded-xl transition-all whitespace-nowrap ${
            slot.isOpen ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }">
            ${slot.isOpen ? '✓ Đang Mở' : '🔒 Đã Khóa (Draft)'}
          </button>
        </td>
      `;

      const chk = tr.querySelector('.chk-slot-item');
      if (chk) chk.onchange = updateSlotSelectionBadge;

      tr.querySelector('.btn-toggle-open').onclick = () => {
        try {
          store.toggleSlotOpen(slot.id, !slot.isOpen);
          window.UI.showToast(`Đã ${!slot.isOpen ? 'mở' : 'khóa'} ca phỏng vấn!`, 'success');
          renderAdminSlotsTable();
        } catch (err) {
          window.UI.showToast(err.message, 'error');
        }
      };

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
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    const searchVal = (document.getElementById('admin-cand-search')?.value || '').toLowerCase();
    let deptVal = document.getElementById('admin-cand-filter-dept')?.value || 'all';
    if (isDeptLead) {
      deptVal = myDeptId;
    }

    const allRegs = store.data.registrations
      .filter(r => r.campaignId === activeCamp.id && (!isDeptLead || r.departmentId === myDeptId) && (r.status === 'confirmed' || r.status === 'waitlist'))
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
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50';

      tr.innerHTML = `
        <td class="px-4 py-3 font-mono font-black text-orange-700">${r.bookingCode}</td>
        <td class="px-4 py-3">
          <div class="font-bold text-slate-900">${cand.fullName || 'N/A'}</div>
          <div class="text-[11px] text-slate-500">MSV: ${cand.studentId} • ${cand.academicClass || ''}</div>
        </td>
        <td class="px-4 py-3 font-bold text-slate-700">${r.dept?.name}</td>
        <td class="px-4 py-3 font-medium">${slot?.shiftLabel ? `${slot.shiftLabel} (${slot.date})` : `${slot?.startTime} - ${slot?.endTime} (${slot?.date})`}</td>
        <td class="px-4 py-3">
          <div class="flex flex-col gap-1">
            ${r.status === 'waitlist' ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 inline-block w-fit animate-pulse">
                ⏳ Hàng chờ (Waitlist)
              </span>
            ` : `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold inline-block w-fit ${
                r.checkInStatus === 'checked-in' ? 'bg-emerald-100 text-emerald-800' : r.checkInStatus === 'absent' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
              }">
                ${r.checkInStatus === 'checked-in' ? 'Đã đến' : r.checkInStatus === 'absent' ? 'Vắng mặt' : 'Chờ đến'}
              </span>
            `}
          </div>
        </td>
        <td class="px-4 py-3 text-right">
          <button class="btn-open-override px-2.5 py-1 rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white font-bold transition-all">
            ⚙️ Can thiệp
          </button>
        </td>
      `;

      tr.querySelector('.btn-open-override').onclick = () => {
        openAdminOverrideModal(r);
      };

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
    document.getElementById('override-current-slot').textContent = `${slot?.startTime}-${slot?.endTime} (${slot?.date})`;

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
    const reason = document.getElementById('override-reason').value.trim();
    if (!reason) {
      window.UI.showToast('Vui lòng nhập lý do hủy ca vào ô lý do bên dưới.', 'warning');
      return;
    }

    if (confirm(`Bạn có chắc muốn hủy ca đăng ký này của [${currentOverrideReg.candidate?.fullName}]?`)) {
      try {
        store.cancelRegistration(currentOverrideReg.id, reason, true);
        window.UI.showToast('Đã hủy đăng ký ca thành công!', 'info');
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

  // Update Deadline Form
  document.getElementById('form-update-deadline')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const activeCamp = store.getActiveCampaign();
    const val = document.getElementById('admin-deadline-input').value;
    if (!val) return;

    try {
      store.updateCampaignDeadline(activeCamp.id, new Date(val).toISOString(), 'Admin cập nhật deadline đợt tuyển');
      window.UI.showToast('Đã cập nhật deadline thành công!', 'success');
      renderAdminWorkspace();
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
      const parsed = window.ExcelHelper.parseSlotsCsv(csvText);
      parsed.forEach(s => store.addSlot(s));
      window.UI.showToast(`Đã import thành công ${parsed.length} ca phỏng vấn (không có va chạm lịch)!`, 'success');
      document.getElementById('modal-import-slots')?.classList.add('hidden');
      document.getElementById('import-csv-textarea').value = '';
      renderAdminSlotsTable();
    } catch (err) {
      alert('LỖI IMPORT CSV:\n\n' + err.message);
    }
  });

  // Export Excel with RBAC scoping
  document.getElementById('btn-admin-export-excel')?.addEventListener('click', () => {
    const activeCamp = store.getActiveCampaign();
    const currentAdmin = store.getCurrentAdmin();
    const isDeptLead = currentAdmin && currentAdmin.deptId && currentAdmin.deptId !== 'all';
    const myDeptId = isDeptLead ? currentAdmin.deptId : null;

    let targetRegs = store.data.registrations
      .filter(r => r.campaignId === activeCamp.id && r.status === 'confirmed');

    if (isDeptLead) {
      targetRegs = targetRegs.filter(r => r.departmentId === myDeptId);
    }

    const mapped = targetRegs.map(r => ({
      ...r,
      candidate: store.data.candidates.find(c => c.id === r.candidateId),
      slot: store.getSlotById(r.slotId),
      dept: store.getDepartmentById(r.departmentId)
    }));

    window.ExcelHelper.exportCandidatesToCsv(mapped, activeCamp);
    window.UI.showToast(`Đã xuất file báo cáo ${isDeptLead ? 'ban của bạn' : 'toàn bộ 6 ban'} thành công!`, 'success');
  });

  // Close modals
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.add('hidden'));
    });
  });

  // Filter input listeners
  document.getElementById('admin-cand-search')?.addEventListener('input', renderAdminCandidatesTable);

  // Initial startup
  initCandidateWizard();
});