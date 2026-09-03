/**
 * Email.js - Automatic Real-time Email Dispatcher for MCC.UEB Recruitment Portal
 * Powered by EmailJS SDK (Free 200 emails/month, connects with Gmail directly)
 */

const EMAILJS_CONFIG = {
  PUBLIC_KEY: 'fduCbSpaMKcclhHgP',      // Public Key từ EmailJS của bạn
  SERVICE_ID: 'service_lki5l9z',        // Service ID kết nối Gmail dunkduong06@gmail.com
  TEMPLATE_OTP_ID: 'template_h3qv7sj',  // Template ID One-Time Password của bạn
  TEMPLATE_CONFIRM_ID: 'template_h3qv7sj', // Template xác nhận lịch
  CLUB_SENDER_EMAIL: 'dunkduong06@gmail.com',
  CLUB_NAME: 'CLB Truyền Thông MCC - UEB'
};

window.EmailService = {
  isInitialized: false,

  init() {
    if (typeof emailjs !== 'undefined') {
      try {
        emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
        this.isInitialized = true;
        console.log('✅ EmailJS Service Initialized successfully with Key:', EMAILJS_CONFIG.PUBLIC_KEY);
      } catch (err) {
        console.warn('⚠️ EmailJS init warning:', err);
      }
    }
  },

  /**
   * Tự động gửi mã OTP xác thực qua Email
   */
  async sendOtpEmail({ recipientEmail, candidateName, studentId, otpCode }) {
    console.log(`📨 Đang gửi Email OTP thật qua EmailJS tới: ${recipientEmail} (Mã: ${otpCode})`);

    const now = new Date();
    const expireTime = new Date(now.getTime() + 5 * 60 * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const templateParams = {
      to_email: recipientEmail,
      email: recipientEmail,
      reply_to: recipientEmail,
      to_name: candidateName || 'Bạn',
      name: candidateName || 'Bạn',
      student_id: studentId || '',
      otp_code: otpCode,
      otp: otpCode,
      passcode: otpCode,
      code: otpCode,
      OTP: otpCode,
      token: otpCode,
      verify_code: otpCode,
      time: expireTime,
      club_name: EMAILJS_CONFIG.CLUB_NAME,
      sender_email: EMAILJS_CONFIG.CLUB_SENDER_EMAIL,
      subject: `[MCC.UEB] Mã OTP xác thực ca phỏng vấn: ${otpCode}`,
      message: `Chào bạn ${candidateName || ''},\n\nMã OTP xác thực đổi / tra cứu ca phỏng vấn của bạn là: ${otpCode}\n\nMã này có hiệu lực trong vòng 5 phút (đến ${expireTime}) để bảo vệ thông tin hồ sơ của bạn.\n\nThân mến,\nCLB Truyền Thông MCC - Trường ĐH Kinh tế, ĐHQGHN.`
    };

    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY) {
      try {
        const response = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_OTP_ID, templateParams);
        console.log('🎉 Email OTP đã được gửi THẬT thành công qua Gmail!', response.status, response.text);
        return { success: true, mode: 'real_email', response };
      } catch (error) {
        console.error('❌ Lỗi khi gửi qua EmailJS:', error);
        if (error && (error.status === 412 || error.status === 429 || (error.text && error.text.includes('quota')))) {
          window.UI?.showToast('Hạn mức gửi thư trong tháng đã đầy. Vui lòng liên hệ Hotline Ban Tuyển Quân để nhận hỗ trợ trực tiếp!', 'error');
        }
      }
    }

    return {
      success: true,
      mode: 'fallback'
    };
  },

  /**
   * Tự động gửi Email xác nhận đăng ký / đổi ca phỏng vấn thành công
   */
  async sendBookingConfirmationEmail({ recipientEmail, candidateName, bookingCode, deptName, slotTime, slotDate, location }) {
    // Chỉ gửi khi có template xác nhận riêng (khác template OTP), tránh gửi nhầm nội dung OTP khi đăng ký ca
    if (!EMAILJS_CONFIG.TEMPLATE_CONFIRM_ID || EMAILJS_CONFIG.TEMPLATE_CONFIRM_ID === EMAILJS_CONFIG.TEMPLATE_OTP_ID) {
      console.log('ℹ️ Bỏ qua gửi email xác nhận vì chưa cấu hình template xác nhận riêng, tránh gửi nhầm template OTP.');
      return { success: true, mode: 'skipped' };
    }

    console.log(`📨 Đang gửi Email xác nhận lịch phỏng vấn tới: ${recipientEmail}`);

    const templateParams = {
      to_email: recipientEmail,
      email: recipientEmail,
      reply_to: recipientEmail,
      to_name: candidateName,
      name: candidateName,
      booking_code: bookingCode,
      department_name: deptName,
      slot_time: slotTime,
      slot_date: slotDate,
      slot_location: location,
      club_name: EMAILJS_CONFIG.CLUB_NAME,
      subject: `[MCC.UEB] Xác nhận lịch phỏng vấn tuyển quân - Mã đơn: ${bookingCode}`,
      message: `Chào bạn ${candidateName},\n\nBạn đã đăng ký thành công ca phỏng vấn ${deptName} vào lúc ${slotTime} (ngày ${slotDate}) tại ${location}.\nMã hồ sơ của bạn là: ${bookingCode}.\n\nHẹn gặp lại bạn tại buổi phỏng vấn!\nCLB Truyền Thông MCC - UEB.`
    };

    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.PUBLIC_KEY) {
      try {
        const response = await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, EMAILJS_CONFIG.TEMPLATE_CONFIRM_ID, templateParams);
        return { success: true, mode: 'real_email', response };
      } catch (error) {
        console.warn('⚠️ Gửi email xác nhận:', error);
      }
    }

    return { success: true, mode: 'simulated' };
  }
};

// Tự động khởi tạo ngay khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  window.EmailService.init();
});
