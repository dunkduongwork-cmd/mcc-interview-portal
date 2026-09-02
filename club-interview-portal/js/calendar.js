/**
 * Calendar.js - Calendar integration utilities
 * Supports Google Calendar web links and downloadable .ics files
 */

const CalendarHelper = {
  formatDateForCalendar(dateStr, timeStr) {
    // dateStr: "YYYY-MM-DD", timeStr: "HH:MM"
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(year, month - 1, day, hours, minutes);
    
    // Format to YYYYMMDDTHHmmssZ
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  },

  createGoogleCalendarUrl(candidate, slot, settings) {
    const title = encodeURIComponent(`[Phỏng Vấn CLB] ${settings.clubName} - ${candidate.fullName}`);
    
    const startIso = CalendarHelper.formatDateForCalendar(slot.date, slot.startTime);
    const endIso = CalendarHelper.formatDateForCalendar(slot.date, slot.endTime);
    const dates = `${startIso}/${endIso}`;

    const locationStr = slot.type === 'online' 
      ? `Online: ${slot.meetUrl || settings.onlineMeetLink}`
      : `${slot.room} - ${settings.locationOffline}`;
    
    const details = encodeURIComponent(
      `Chào bạn ${candidate.fullName},\n\n` +
      `Lịch phỏng vấn Câu lạc bộ: ${settings.clubName}\n` +
      `Đợt tuyển: ${settings.recruitmentSeason}\n` +
      `Mã hồ sơ: ${candidate.code}\n` +
      `Ban ứng tuyển: ${candidate.dept1?.name || candidate.deptChoice1}\n` +
      `Thời gian: ${slot.startTime} - ${slot.endTime} ngày ${slot.date}\n` +
      `Địa điểm / Link: ${locationStr}\n\n` +
      `Hotline hỗ trợ: ${settings.contactHotline} (${settings.contactEmail})\n` +
      `Chúc bạn có một buổi phỏng vấn thật tự tin và thành công!`
    );

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${encodeURIComponent(locationStr)}`;
  },

  downloadIcsFile(candidate, slot, settings) {
    const startIso = CalendarHelper.formatDateForCalendar(slot.date, slot.startTime);
    const endIso = CalendarHelper.formatDateForCalendar(slot.date, slot.endTime);
    const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const locationStr = slot.type === 'online' 
      ? `Online Meet: ${slot.meetUrl || settings.onlineMeetLink}`
      : `${slot.room} - ${settings.locationOffline}`;

    const description = `Lịch phỏng vấn CLB: ${settings.clubName}\\n` +
      `Mã ứng viên: ${candidate.code}\\n` +
      `Ứng viên: ${candidate.fullName} (MSV: ${candidate.studentId})\\n` +
      `Ban ứng tuyển: ${candidate.dept1?.name || candidate.deptChoice1}\\n` +
      `Hotline: ${settings.contactHotline}`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Club Interview Portal//VN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:interview-${candidate.code}-${Date.now()}@clubportal.local`,
      `DTSTAMP:${nowIso}`,
      `DTSTART:${startIso}`,
      `DTEND:${endIso}`,
      `SUMMARY:[Phỏng Vấn CLB] ${settings.clubName} - ${candidate.fullName}`,
      `DESCRIPTION:${description}`,
      `LOCATION:${locationStr}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      'DESCRIPTION:Nhắc nhở phỏng vấn CLB sau 30 phút',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Lich-Phong-Van-${candidate.code}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

window.CalendarHelper = CalendarHelper;
