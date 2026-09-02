/**
 * Excel & CSV Helpers with UTF-8 BOM and Collision Validator for MCC.UEB
 */

window.ExcelHelper = {
  exportCandidatesToCsv(registrations, campaign) {
    if (!registrations || registrations.length === 0) {
      window.UI.showToast('Không có dữ liệu đăng ký để xuất file.', 'warning');
      return;
    }

    const headers = [
      'Mã Hồ Sơ',
      'Họ Và Tên',
      'Mã Sinh Viên (MSV)',
      'Email',
      'Số Điện Thoại',
      'Lớp / Khóa',
      'Ban Ứng Tuyển',
      'Ngày Phỏng Vấn',
      'Khung Giờ',
      'Hình Thức / Địa Điểm',
      'Hội Đồng Phỏng Vấn',
      'Điểm Danh',
      'Kết Quả Tuyển',
      'Thời Gian Đăng Ký'
    ];

    const rows = registrations.map(reg => {
      const cand = reg.candidate || {};
      const slot = reg.slot || {};
      const dept = reg.dept || {};
      const ivList = (slot.interviewers || []).map(i => i.fullName).join('; ');
      const res = reg.result || (reg.evaluation ? reg.evaluation.result : 'unreviewed');
      const resText = res === 'pass' ? 'ĐẠT (PASS)' : res === 'fail' ? 'KHÔNG ĐẠT (FAIL)' : res === 'hold' ? 'DỰ BỊ' : 'Chưa xét';

      return [
        reg.bookingCode || '',
        cand.fullName || '',
        cand.studentId || '',
        cand.email || '',
        cand.phone || '',
        cand.academicClass || '',
        dept.name || '',
        slot.date || '',
        `${slot.startTime || ''} - ${slot.endTime || ''}`,
        slot.type === 'online' ? `Online Meet (${slot.meetUrl || ''})` : (slot.location || ''),
        ivList,
        reg.checkInStatus === 'checked-in' ? 'Đã đến' : reg.checkInStatus === 'absent' ? 'Vắng mặt' : 'Chờ đến',
        resText,
        reg.registeredAt ? new Date(reg.registeredAt).toLocaleString('vi-VN') : ''
      ];
    });

    const csvContent = '\uFEFF' + [
      headers.join(','),
      ...rows.map(r => r.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MCC_DanhSachUngVien_${campaign?.gen || 'GenXV'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Parses and validates CSV import of slots.
   * Format: DepartmentId,Date(YYYY-MM-DD),StartTime(HH:mm),EndTime(HH:mm),Capacity(2/3),Location,Type(offline/online),MeetUrl,InterviewerEmails(comma-separated)
   */
  parseSlotsCsv(csvText) {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim());
    if (lines.length <= 1) {
      throw new Error('File CSV không có dữ liệu.');
    }

    const store = window.appStore;
    const interviewers = store.getInterviewers();
    const departments = store.getDepartments();

    const parsedSlots = [];
    const errors = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const lineNum = i + 1;
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted commas or basic split
      const parts = line.split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length < 5) {
        errors.push(`Dòng ${lineNum}: Thiếu cột dữ liệu bắt buộc.`);
        continue;
      }

      const [deptId, date, startTime, endTime, capacityStr, location, type, meetUrl, ...ivEmails] = parts;
      
      const dept = departments.find(d => d.id === deptId || d.name.toLowerCase() === deptId.toLowerCase());
      if (!dept) {
        errors.push(`Dòng ${lineNum}: Ban [${deptId}] không tồn tại.`);
        continue;
      }

      // Map Interviewers
      const matchedIvIds = [];
      const emailList = ivEmails.join(',').split(';').map(e => e.trim().toLowerCase()).filter(Boolean);
      emailList.forEach(mail => {
        const found = interviewers.find(iv => iv.email.toLowerCase() === mail || iv.fullName.toLowerCase() === mail);
        if (found) matchedIvIds.push(found.id);
      });

      parsedSlots.push({
        lineNum,
        departmentId: dept.id,
        date,
        startTime,
        endTime,
        capacity: 2, // Cố định tối đa 2 ứng viên / ca
        location: location || 'Phòng 501 - Nhà E4',
        type: type === 'online' ? 'online' : 'offline',
        meetUrl: meetUrl || '',
        interviewerIds: matchedIvIds
      });
    }

    if (errors.length > 0) {
      throw new Error('Lỗi trong file CSV:\n' + errors.join('\n'));
    }

    // CHECK INTERVIEWER OVERLAP AMONG IMPORTED SLOTS
    for (let a = 0; a < parsedSlots.length; a++) {
      for (let b = a + 1; b < parsedSlots.length; b++) {
        const slotA = parsedSlots[a];
        const slotB = parsedSlots[b];

        if (slotA.date === slotB.date && store.checkTimeOverlap(slotA.startTime, slotA.endTime, slotB.startTime, slotB.endTime)) {
          const commonIvs = slotA.interviewerIds.filter(id => slotB.interviewerIds.includes(id));
          if (commonIvs.length > 0) {
            const ivNames = commonIvs.map(id => store.getInterviewerById(id)?.fullName || id).join(', ');
            throw new Error(`Xung đột lịch phỏng vấn viên: [${ivNames}] bị xếp trùng giờ giữa dòng ${slotA.lineNum} (${slotA.startTime}-${slotA.endTime}) và dòng ${slotB.lineNum} (${slotB.startTime}-${slotB.endTime}) vào ngày ${slotA.date}.`);
          }
        }
      }
    }

    return parsedSlots;
  }
};