# 🌟 MCC.UEB - Cổng Đăng Ký & Quản Trị Ca Phỏng Vấn Tuyển Quân Gen XVI
**CLB Truyền Thông MCC - Trường Đại học Kinh tế, ĐHQGHN (VNU-UEB)**

Hệ thống web portal chuyên nghiệp phục vụ công tác tuyển quân: Đăng ký ca phỏng vấn trực tuyến cho ứng viên (xác thực OTP qua email, chống trùng lịch, chống spam hạn mức) và Hệ thống Quản trị & Điểm danh thực địa thời gian thực (Real-time Firebase Firestore & Firebase Authentication).

---

## 🔐 Danh Sách Tài Khoản & Phân Quyền Quản Trị

Toàn bộ tài khoản đã được bảo mật và xác thực trực tiếp qua **Google Firebase Authentication** (Mã nguồn JavaScript không lưu mật khẩu thô, đảm bảo an toàn tuyệt đối khi xem F12).

### 🔑 Mật khẩu ban đầu mặc định: `mcc@admin2026`
*(Quản trị viên có thể tự đổi mật khẩu cá nhân trong mục Cài đặt ⚙️ trên hệ thống)*

### 1. Nhóm FULL QUYỀN (Toàn bộ 6 ban):
* **⚡ Tài Khoản Admin Cấp Cao:**
  - `admin.mcc@gmail.com` | Tên: **admin** (Toàn quyền quản trị + Tab Tùy chọn bật/tắt Waitlist toàn hệ thống)
* **👑 Ban Chủ Nhiệm (3 thành viên):**
  - `nguyenkieuanh.mcc@gmail.com` | Nguyễn Kiều Anh
  - `nguyennhatlinh.mcc@gmail.com` | Nguyễn Nhật Linh
  - `hoduongkhanhvy.mcc@gmail.com` | Hồ Dương Khánh Vy
  - *(Tài khoản dùng chung: `banchunhiem.mcc@gmail.com`)*
* **🎖️ Mentor (5 thành viên):**
  - `phambaonguyen.mcc@gmail.com` | Phạm Bảo Nguyên
  - `nguyenhuonglinh.mcc@gmail.com` | Nguyễn Hương Linh
  - `nguyenhoanganh.mcc@gmail.com` | Nguyễn Hoàng Anh
  - `nguyenphuonganh.mentor.mcc@gmail.com` | Nguyễn Phương Anh
  - `nguyenngocanh.mcc@gmail.com` | Nguyễn Ngọc Anh
  - *(Tài khoản dùng chung: `mentor.mcc@gmail.com`)*
* **📋 Ban Nhân Sự (13 thành viên):**
  - `nguyenkhanhlinh.mcc@gmail.com` | Nguyễn Khánh Linh
  - `nguyendangduong.mcc@gmail.com` | Nguyễn Đăng Dương
  - `nguyenphuongthao.mcc@gmail.com` | Nguyễn Phương Thảo
  - `nguyenphuonganh.hr.mcc@gmail.com` | Nguyễn Phương Anh
  - `luugialinh.mcc@gmail.com` | Lưu Gia Linh
  - `doanthiminhthu.mcc@gmail.com` | Đoàn Thị Minh Thư
  - `vuphuongthuylinh.mcc@gmail.com` | Vũ Phương Thuỳ Linh
  - `tranthicamtu.mcc@gmail.com` | Trần Thị Cẩm Tú
  - `dangquangdung.mcc@gmail.com` | Đặng Quang Dũng
  - `phamthithuhuyen.mcc@gmail.com` | Phạm Thị Thu Huyền
  - `nguyenphuongnhi.mcc@gmail.com` | Nguyễn Phương Nhi
  - `luyenminhanh.mcc@gmail.com` | Luyện Minh Anh
  - `tranleducanh.mcc@gmail.com` | Trần Lê Đức Anh
  - *(Tài khoản dùng chung: `bannhansu.mcc@gmail.com`)*

### 2. Nhóm 5 Ban Chuyên Môn (Xem lịch, xem ứng viên & Điểm danh ban mình):
* 🎨 **Ban Truyền Thông:** `bantruyenthong.mcc@gmail.com`
* 🎉 **Ban Sự Kiện:** `bansukien.mcc@gmail.com`
* 💻 **Ban Kỹ Thuật:** `bankythuat.mcc@gmail.com`
* 🚀 **Ban Dự Án:** `banduan.mcc@gmail.com`
* 🤝 **Ban Đối Ngoại:** `bandoingoai.mcc@gmail.com`

---

## 🛡️ Các Tính Năng Nghiệp Vụ & Kỹ Thuật Nổi Bật:

1. **Sức Chứa Ca Linh Hoạt & Độc Quyền Phân Quyền:**
   - Mỗi ca phỏng vấn có thể tùy chỉnh từ **1, 2 đến tối đa 3 ứng viên**.
   - **Chỉ Ban Chủ Nhiệm và Mentor** mới có quyền thay đổi sức chứa của ca (Ban Nhân Sự và 5 ban chuyên môn chỉ xem).
   - Thao tác đổi số ứng viên có **Hộp thoại Modal xác nhận 2 bước** kèm cảnh báo tự động đôn hàng chờ hoặc chặn hạ sức chứa khi đã có thí sinh xác nhận.

2. **Bắt Buộc Nhập Sức Chứa Khi Import CSV:**
   - Cột `Capacity` (hoặc `so_ung_vien`) là bắt buộc (1 - 3 ứng viên).
   - Dòng nào bỏ trống sẽ tự động dừng import và **bắn thông báo lỗi chỉ rõ ca nào, giờ nào, ngày nào bị thiếu**.

3. **Công Tắc Bật / Tắt Chức Năng Waitlist Toàn Hệ Thống:**
   - Tab **"⚙️ Tùy chọn"** ở menu bên trái cho phép Admin bật/tắt cơ chế hàng chờ toàn hệ thống trong thời gian thực.
   - Khi tắt, các ca đủ chỗ chỉ hiển thị "Hết chỗ" và không nhận thêm bất kỳ ứng viên nào vào hàng chờ.

4. **Phòng Vệ EmailJS 4 Lớp (Bảo Vệ Hạn Mức 200 Mail/Tháng):**
   - Chỉ gửi OTP khi Email và MSV khớp với hồ sơ ứng viên đã nộp.
   - Giới hạn tối đa 3 lần yêu cầu OTP / 15 phút trên mỗi hồ sơ.
   - Thời gian chờ (Cooldown) 60 giây giữa mỗi lần gửi lại.
   - Đóng băng theo thiết bị nếu gửi quá 5 lần trong 10 phút.

5. **Đồng Bộ Thời Gian Thực & An Toàn F12:**
   - Đồng bộ dữ liệu ca và điểm danh qua Firebase Firestore.
   - **Xóa sạch 100% mật khẩu thô trong mã nguồn JS**, xác thực bảo mật chuẩn qua Google Firebase Auth.

---

## 🚀 Hướng Dẫn Deploy Lên GitHub & Production:
* **Cấu trúc thư mục:** Bảo đảm `index.html` nằm ở thư mục gốc của repository.
* **Hosting khuyến nghị:**
  - **GitHub Pages:** Vào Settings -> Pages -> Chọn branch `main` -> Save.
  - **Vercel:** Kết nối GitHub repo -> Deploy tự động 1 chạm.
  - **Netlify:** Kéo thả toàn bộ thư mục lên [app.netlify.com/drop](https://app.netlify.com/drop).
