/**
 * Components.js - High-Craft UI Rendering Modules for MCC.UEB
 * Built upon Anthropic Frontend Design & UI/UX Pro Max standards
 */

window.UI = {
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-6 right-6 z-[1000] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full px-4 sm:px-0';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const typeConfigs = {
      success: {
        bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
        icon: '✓',
        iconBg: 'bg-emerald-500/20 text-emerald-400'
      },
      error: {
        bg: 'bg-rose-950/90 border-rose-500/40 text-rose-100',
        icon: '✕',
        iconBg: 'bg-rose-500/20 text-rose-400'
      },
      warning: {
        bg: 'bg-amber-950/90 border-amber-500/40 text-amber-100',
        icon: '⚠️',
        iconBg: 'bg-amber-500/20 text-amber-300'
      },
      info: {
        bg: 'bg-stone-900/95 border-stone-700/50 text-stone-100',
        icon: 'ℹ️',
        iconBg: 'bg-stone-800 text-stone-300'
      }
    }[type] || {
      bg: 'bg-stone-900/95 border-stone-700/50 text-stone-100',
      icon: 'ℹ️',
      iconBg: 'bg-stone-800 text-stone-300'
    };

    toast.className = `pointer-events-auto px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl text-xs font-semibold flex items-center gap-3 transition-all transform translate-y-2 opacity-0 animate-toast-in ${typeConfigs.bg}`;
    toast.innerHTML = `
      <span class="w-6 h-6 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0 ${typeConfigs.iconBg}">
        ${typeConfigs.icon}
      </span>
      <span class="flex-1 leading-snug">${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 320);
    }, 3600);
  },

  renderDateStrip(dates, selectedDate, onSelectDate) {
    const container = document.createElement('div');
    container.className = 'flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin';

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
          ? 'bg-gradient-to-r from-[#8B1E22] to-[#A6282E] text-white border-[#8B1E22] shadow-md shadow-[#8B1E22]/20 scale-[1.02]'
          : 'bg-white text-slate-700 border-slate-200 hover:border-red-300 hover:bg-red-50/40'
      }`;

      btn.innerHTML = `
        <div class="text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-amber-100' : 'text-slate-400'}">${dayName}</div>
        <div class="text-sm font-black mt-0.5">${dd}/${mm}/${yy}</div>
      `;

      btn.onclick = () => onSelectDate(dateStr);
      container.appendChild(btn);
    });

    return container;
  },

  renderTimelineColumn(department, slotsForDate, selectedSlotId, otherDeptSelectedSlot, onSelectSlot) {
    const col = document.createElement('div');
    col.className = 'flex-1 min-w-[300px] bg-white rounded-3xl p-5 border border-stone-200 shadow-sm space-y-4';

    // Header
    col.innerHTML = `
      <div class="flex items-center justify-between pb-3 border-b border-stone-100">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-stone-100 text-stone-900 border border-stone-200 font-black flex items-center justify-center text-xs">
            ${department.short.charAt(0)}
          </div>
          <div>
            <h4 class="font-extrabold text-stone-900 text-sm">${department.name}</h4>
            <p class="text-[11px] text-stone-500 font-medium">${slotsForDate.length} ca khả dụng</p>
          </div>
        </div>
      </div>
      <div class="slot-list-container space-y-3"></div>
    `;

    const listContainer = col.querySelector('.slot-list-container');

    if (slotsForDate.length === 0) {
      listContainer.innerHTML = `
        <div class="py-10 text-center bg-stone-50 rounded-2xl border border-dashed border-stone-200 text-stone-400 text-xs">
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
          ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/60 shadow-md'
          : 'bg-orange-50/90 border-[#C23B22] ring-2 ring-[#C23B22]/60 shadow-md';
      } else if (isOverlapping) {
        cardStateClasses = 'bg-rose-50/40 border-rose-200 opacity-65 cursor-not-allowed';
      } else if (isWaitlist) {
        cardStateClasses = 'bg-amber-50/40 border-amber-200 hover:border-amber-400 hover:bg-amber-50/80 hover:shadow-md cursor-pointer';
      } else if (isFull) {
        cardStateClasses = 'bg-stone-100/70 border-stone-200 opacity-60 cursor-not-allowed';
      } else {
        cardStateClasses = 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-md cursor-pointer';
      }

      card.className = `p-4 rounded-2xl border transition-all ${cardStateClasses}`;

      card.innerHTML = `
        <div class="flex items-center justify-between gap-2 mb-2">
          <div class="font-black text-stone-900 text-sm flex items-center gap-2">
            <span class="w-2 h-2 rounded-full ${isSelected ? (isWaitlist ? 'bg-amber-500' : 'bg-[#C23B22]') : isWaitlist ? 'bg-amber-400 animate-pulse' : isFull ? 'bg-stone-300' : isOverlapping ? 'bg-rose-500' : 'bg-emerald-500'}"></span>
            <span>${slot.shiftLabel || (slot.startTime + ' - ' + slot.endTime)}</span>
          </div>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black ${
            isWaitlist ? 'bg-amber-100 text-amber-900 border border-amber-300' : isFull ? 'bg-stone-200 text-stone-600' : isSelected ? 'bg-[#C23B22] text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }">
            ${isWaitlist ? '⏳ Hàng chờ (Waitlist)' : isFull ? 'Hết chỗ' : `Còn ${slot.remainingCount}/${slot.capacity} chỗ`}
          </span>
        </div>

        <div class="text-xs text-stone-600 mb-2.5">
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
            <span>📍</span>
            <span class="truncate">${slot.type === 'online' ? 'Online: Google Meet' : slot.location}</span>
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

        <div class="pt-2 border-t border-stone-100 flex items-center justify-between">
          <div class="text-[11px] font-medium text-stone-500">
            Sức chứa: <strong>${slot.capacity}</strong> ứng viên / ca
          </div>
          ${(!isFull || isWaitlist) && !isOverlapping ? `
            <button type="button" class="text-xs font-black ${isSelected ? (isWaitlist ? 'text-amber-800' : 'text-[#C23B22]') : isWaitlist ? 'text-amber-700 hover:underline' : 'text-stone-800 hover:text-[#C23B22]'}">
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

    card.className = 'bg-white rounded-3xl border border-stone-200 shadow-sm p-6 space-y-4';

    const checkInBadge = {
      'pending': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">Chờ phỏng vấn</span>',
      'checked-in': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">Đã điểm danh</span>',
      'absent': '<span class="px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">Vắng mặt</span>'
    }[reg.checkInStatus] || '';

    card.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <span class="text-[10px] font-black uppercase tracking-wider text-[#C23B22]">${dept?.name || 'Ban Chuyên Môn'}</span>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-mono font-black text-stone-900 text-base">${reg.bookingCode}</span>
            ${checkInBadge}
          </div>
        </div>
        <div class="flex gap-2">
          ${!isAfterDeadline ? `
            <button class="btn-reg-reschedule px-3.5 py-1.5 text-xs font-bold rounded-xl bg-stone-100 text-stone-800 hover:bg-[#C23B22] hover:text-white transition-all">
              Đổi ca khác
            </button>
            <button class="btn-reg-cancel px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-all">
              Hủy ca
            </button>
          ` : `
            <span class="text-xs text-stone-400 italic">Đã qua hạn chót đổi ca</span>
          `}
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-stone-700">
        <div class="p-4 rounded-2xl bg-stone-50 border border-stone-100">
          <div class="font-bold text-stone-400 uppercase text-[10px] mb-1 tracking-wider">THỜI GIAN & ĐỊA ĐIỂM</div>
          <div class="font-black text-stone-900 text-sm mb-1">${slot?.startTime} - ${slot?.endTime} (Ngày ${dd}/${mm}/${yy})</div>
          <div class="text-stone-600 font-medium">${slot?.type === 'online' ? 'Online: ' + (slot?.meetUrl || 'Google Meet') : slot?.location}</div>
        </div>

        <div class="p-4 rounded-2xl bg-stone-50 border border-stone-100">
          <div class="font-bold text-stone-400 uppercase text-[10px] mb-1 tracking-wider">HÌNH THỨC & LƯU Ý</div>
          <div class="font-bold text-stone-900 text-xs mb-1">${slot?.type === 'online' ? 'Phỏng vấn Online (Google Meet)' : 'Phỏng vấn Trực tiếp'}</div>
          <div class="text-stone-500 text-[11px]">Vui lòng có mặt trước 10 phút để điểm danh</div>
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