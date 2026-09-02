/**
 * Components.js - UI Rendering Modules for MCC.UEB
 */

window.UI = {
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const colorClasses = {
      success: 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20',
      error: 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20',
      warning: 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20',
      info: 'bg-slate-900 text-white border-slate-700 shadow-slate-900/20'
    }[type] || 'bg-slate-900 text-white border-slate-700 shadow-slate-900/20';

    toast.className = `pointer-events-auto px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 transition-all transform translate-y-2 opacity-0 animate-toast-in ${colorClasses}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  renderDateStrip(dates, selectedDate, onSelectDate) {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin';

    dates.forEach(dateStr => {
      const [yy, mm, dd] = dateStr.split('-');
      const dObj = new Date(dateStr);
      const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
      const dayName = daysOfWeek[dObj.getDay()] || 'Ngày';

      const isSelected = (dateStr === selectedDate);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `px-5 py-3 rounded-2xl text-left flex-shrink-0 transition-all border ${
        isSelected
          ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500 shadow-lg shadow-orange-600/20 scale-[1.02]'
          : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/30'
      }`;

      btn.innerHTML = `
        <div class="text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-orange-200' : 'text-slate-400'}">${dayName}</div>
        <div class="text-sm font-black mt-0.5">${dd}/${mm}/${yy}</div>
      `;

      btn.onclick = () => onSelectDate(dateStr);
      container.appendChild(btn);
    });

    return container;
  },

  renderTimelineColumn(department, slotsForDate, selectedSlotId, otherDeptSelectedSlot, onSelectSlot) {
    const col = document.createElement('div');
    col.className = 'flex-1 min-w-[300px] bg-slate-50/80 rounded-3xl p-5 border border-slate-200 space-y-4';

    // Header
    col.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-slate-200">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 font-black flex items-center justify-center text-xs">
            ${department.short.charAt(0)}
          </div>
          <div>
            <h4 class="font-extrabold text-slate-900 text-sm">${department.name}</h4>
            <p class="text-[11px] text-slate-500">${slotsForDate.length} ca khả dụng</p>
          </div>
        </div>
      </div>
      <div class="slot-list-container space-y-3"></div>
    `;

    const listContainer = col.querySelector('.slot-list-container');

    if (slotsForDate.length === 0) {
      listContainer.innerHTML = `
        <div class="py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
          Không có ca phỏng vấn nào mở trong ngày này.
        </div>
      `;
      return col;
    }

    slotsForDate.sort((a, b) => a.startTime.localeCompare(b.startTime)).forEach(slot => {
      const isSelected = (slot.id === selectedSlotId);
      const isFull = slot.isFull;

      // Check overlap with other dept selected slot
      let isOverlapping = false;
      let overlapReason = '';

      if (otherDeptSelectedSlot && otherDeptSelectedSlot.date === slot.date) {
        if (window.appStore.checkTimeOverlap(slot.startTime, slot.endTime, otherDeptSelectedSlot.startTime, otherDeptSelectedSlot.endTime)) {
          isOverlapping = true;
          overlapReason = `Trùng giờ với ca ${otherDeptSelectedSlot.dept.name} (${otherDeptSelectedSlot.startTime} - ${otherDeptSelectedSlot.endTime})`;
        }
      }

      const card = document.createElement('div');
      
      const isWaitlist = isFull && slot.isWaitlistAvailable;

      let cardStateClasses = '';
      if (isSelected) {
        cardStateClasses = isWaitlist
          ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500 shadow-md'
          : 'bg-orange-50 border-orange-500 ring-2 ring-orange-500 shadow-md';
      } else if (isOverlapping) {
        cardStateClasses = 'bg-rose-50/40 border-rose-200 opacity-70 cursor-not-allowed';
      } else if (isWaitlist) {
        cardStateClasses = 'bg-amber-50/30 border-amber-200 hover:border-amber-400 hover:bg-amber-50/60 hover:shadow-md cursor-pointer';
      } else if (isFull) {
        cardStateClasses = 'bg-slate-100/60 border-slate-200 opacity-60 cursor-not-allowed';
      } else {
        cardStateClasses = 'bg-white border-slate-200 hover:border-orange-300 hover:shadow-md cursor-pointer';
      }

      card.className = `p-4 rounded-2xl border transition-all ${cardStateClasses}`;

      const interviewersBadges = (slot.interviewers || []).map(iv => `<span class="inline-block px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold">${iv.fullName}</span>`).join(' ');

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="font-black text-slate-900 text-sm flex items-center gap-1.5">
            <span class="w-2 h-2 rounded-full ${isSelected ? (isWaitlist ? 'bg-amber-500' : 'bg-orange-600') : isWaitlist ? 'bg-amber-400 animate-pulse' : isFull ? 'bg-slate-300' : isOverlapping ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
            ${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)}
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${
            isWaitlist ? 'bg-amber-100 text-amber-900 border border-amber-300' : isFull ? 'bg-slate-200 text-slate-600' : isSelected ? 'bg-orange-600 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }">
            ${isWaitlist ? '⏳ Hàng chờ (Waitlist)' : isFull ? 'Hết chỗ' : `Còn ${slot.remainingCount}/${slot.capacity} chỗ`}
          </span>
        </div>

        <div class="text-xs text-slate-600 mb-2.5">
          <div class="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span>📍</span>
            <span>${slot.type === 'online' ? 'Online: Google Meet' : slot.location}</span>
          </div>
        </div>

        ${isOverlapping ? `
          <div class="p-2 rounded-xl bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center gap-1.5 mb-2">
            <span>⚠️</span>
            <span>${overlapReason}</span>
          </div>
        ` : ''}

        ${isWaitlist ? `
          <div class="p-2 rounded-xl bg-amber-100/70 text-amber-900 text-[10.5px] font-medium flex items-center gap-1.5 mb-2">
            <span>ℹ️</span>
            <span>Ca đã đủ 2/2. Bạn có thể đăng ký vào <strong>Hàng chờ (Waitlist)</strong> để tự động đôn ca khi có người hủy.</span>
          </div>
        ` : ''}

        <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div class="text-[11px] font-medium text-slate-500">
            Sức chứa: <strong>${slot.capacity}</strong> ứng viên / ca
          </div>
          ${(!isFull || isWaitlist) && !isOverlapping ? `
            <button type="button" class="text-xs font-bold ${isSelected ? (isWaitlist ? 'text-amber-800 font-black' : 'text-orange-600 font-black') : isWaitlist ? 'text-amber-700 hover:underline' : 'text-slate-700'}">
              ${isSelected ? (isWaitlist ? '✓ Đã chọn Waitlist' : '✓ Đã chọn') : (isWaitlist ? 'Đăng ký chờ →' : 'Chọn ca →')}
            </button>
          ` : ''}
        </div>
      `;

      if ((!isFull || isWaitlist) && !isOverlapping) {
        card.onclick = () => onSelectSlot(slot);
      }

      listContainer.appendChild(card);
    });

    return col;
  },

  renderCandidateRegistrationCard(reg, isAfterDeadline, onReschedule, onCancel) {
    const card = document.createElement('div');
    const slot = reg.slot;
    const dept = reg.dept;
    const [yy, mm, dd] = (slot?.date || '').split('-');

    card.className = 'bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4';

    const checkInBadge = {
      'pending': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Chờ phỏng vấn</span>',
      'checked-in': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đã điểm danh</span>',
      'absent': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Vắng mặt</span>'
    }[reg.checkInStatus] || '';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-orange-600">${dept?.name || 'Ban Chuyên Môn'}</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-mono font-black text-slate-800 text-base">${reg.bookingCode}</span>
            ${checkInBadge}
          </div>
        </div>
        <div class="flex gap-2">
          ${!isAfterDeadline ? `
            <button class="btn-reg-reschedule px-3.5 py-1.5 text-xs font-bold rounded-xl bg-orange-50 text-orange-700 hover:bg-orange-600 hover:text-white transition-all">
              Đổi ca khác
            </button>
            <button class="btn-reg-cancel px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all">
              Hủy ca
            </button>
          ` : `
            <span class="text-xs text-slate-400 italic">Đã qua hạn chót đổi ca</span>
          `}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700">
        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="font-bold text-slate-500 uppercase text-[10px] mb-1">THỜI GIAN & ĐỊA ĐIỂM</div>
          <div class="font-black text-slate-900 text-sm mb-1">${slot?.startTime} - ${slot?.endTime} (Ngày ${dd}/${mm}/${yy})</div>
          <div class="text-slate-600">${slot?.type === 'online' ? 'Online: ' + (slot?.meetUrl || 'Google Meet') : slot?.location}</div>
        </div>

        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div class="font-bold text-slate-500 uppercase text-[10px] mb-1">HÌNH THỨC & LƯU Ý</div>
          <div class="font-bold text-slate-800 text-xs mb-1">${slot?.type === 'online' ? 'Phỏng vấn Online (Google Meet)' : 'Phỏng vấn Trực tiếp'}</div>
          <div class="text-slate-500 text-[11px]">Vui lòng có mặt trước 10 phút để điểm danh</div>
        </div>
      </div>
    `;

    if (!isAfterDeadline) {
      card.querySelector('.btn-reg-reschedule')?.addEventListener('click', () => onReschedule(reg));
      card.querySelector('.btn-reg-cancel')?.addEventListener('click', () => onCancel(reg));
    }

    return card;
  }
};