# PowerShell script to create HUONG_DAN_SU_DUNG_MCC_UEB.docx
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$outputDir = "C:\Users\ADMIN\.gemini\antigravity\scratch\club-interview-portal"
$docxPath = Join-Path $outputDir "HUONG_DAN_SU_DUNG_MCC_UEB.docx"
$tempFolder = Join-Path $outputDir "temp_docx_build"

if (Test-Path $tempFolder) { Remove-Item -Recurse -Force $tempFolder }
New-Item -ItemType Directory -Path "$tempFolder\_rels" -Force | Out-Null
New-Item -ItemType Directory -Path "$tempFolder\word\_rels" -Force | Out-Null

$utf8 = [System.Text.UTF8Encoding]::new($false)

# 1. [Content_Types].xml
$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@
[System.IO.File]::WriteAllText("$tempFolder\[Content_Types].xml", $contentTypes, $utf8)

# 2. _rels/.rels
$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText("$tempFolder\_rels\.rels", $rels, $utf8)

# 3. word/_rels/document.xml.rels
$docRels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText("$tempFolder\word\_rels\document.xml.rels", $docRels, $utf8)

# 4. word/styles.xml
$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr>
      <w:spacing w:before="300" w:after="120"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="C2410C"/>
      <w:sz w:val="32"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr>
      <w:spacing w:before="240" w:after="80"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="0F172A"/>
      <w:sz w:val="26"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:pPr>
      <w:spacing w:before="160" w:after="60"/>
    </w:pPr>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:color w:val="EA580C"/>
      <w:sz w:val="23"/>
    </w:rPr>
  </w:style>
</w:styles>
'@
[System.IO.File]::WriteAllText("$tempFolder\word\styles.xml", $styles, $utf8)

# 5. word/document.xml
$docXml = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>

    <!-- TITLE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="60"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="38"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>MCC.UEB RECRUITMENT PORTAL</w:t>
      </w:r>
    </w:p>

    <!-- SUBTITLE -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="240"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="24"/>
          <w:color w:val="EA580C"/>
        </w:rPr>
        <w:t>CLB TRUYỀN THÔNG MCC - TRƯỜNG ĐẠI HỌC KINH TẾ, ĐHQGHN</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="20"/>
          <w:color w:val="64748B"/>
        </w:rPr>
        <w:t>Cẩm Nang Hướng Dẫn Sử Dụng Chi Tiết &amp; Danh Sách Tài Khoản Quản Trị Test (Gen XV)</w:t>
      </w:r>
    </w:p>

    <!-- SECTION 1 -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>🔐 1. DANH SÁCH TÀI KHOẢN QUẢN TRỊ TEST (FULL DEMO)</w:t></w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:t>Tại màn hình Quản Trị Admin, bạn có thể bấm 1 chạm vào các nút đăng nhập Demo hoặc nhập theo bảng thông tin dưới đây:</w:t>
      </w:r>
    </w:p>

    <!-- TABLE -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="5000" w:type="pct"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
        </w:tblBorders>
      </w:tblPr>
      
      <!-- HEADER ROW -->
      <w:tr>
        <w:trPr><w:tblHeader/></w:trPr>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>STT</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>Vai Trò</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>Họ và Tên</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>Email Đăng Nhập</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>Mật Khẩu</w:t></w:r></w:p></w:tc>
        <w:tc><w:tcPr><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="20"/></w:rPr><w:t>Phạm Vi Phân Quyền</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 1 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>1</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="DC2626"/></w:rPr><w:t>👑 Chủ Nhiệm CLB</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Nguyễn Việt Hoàng</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>chunhiem.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>mcc@admin2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Toàn quyền 6 ban + Xuất Excel + Import CSV + Cài Deadline</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 2 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>2</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="4F46E5"/></w:rPr><w:t>🎖️ Cố Vấn (Mentor)</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Mentor MCC</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>mentor.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>mentor@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Theo dõi tiến độ 6 ban + Xuất Excel + Xem Audit Log</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 3 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>3</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>🎨 TB Truyền Thông</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Trần Thảo Linh</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>bantruyenthong.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>media@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Truyền Thông</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 4 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>4</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>🚀 TB Dự Án</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Trịnh Hoài Nam</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>banduan.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>projects@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Dự Án</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 5 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>5</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>🤝 TB Đối Ngoại</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Hoàng Phương Mai</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>bandoingoai.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>relations@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Đối Ngoại</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 6 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>6</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>💻 TB Kỹ Thuật</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Đặng Quang Minh</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>bankythuat.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>tech@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Kỹ Thuật</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 7 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>7</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>🎉 TB Sự Kiện</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Vũ Minh Tuấn</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>bansukien.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>events@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Sự Kiện</w:t></w:r></w:p></w:tc>
      </w:tr>

      <!-- ROW 8 -->
      <w:tr>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>8</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="16A34A"/></w:rPr><w:t>📋 TB Nhân Sự</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Bùi Minh Đức</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>bannhansu.mcc@gmail.com</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>hr@mcc2026</w:t></w:r></w:p></w:tc>
        <w:tc><w:p><w:r><w:t>Mở/khóa ca, xem đơn &amp; điểm danh Ban Nhân Sự</w:t></w:r></w:p></w:tc>
      </w:tr>
    </w:tbl>

    <!-- SECTION 2 -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>👩‍🎓 2. HƯỚNG DẪN DÀNH CHO ỨNG VIÊN (SINH VIÊN ĐĂNG KÝ)</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>A. Quy Trình 4 Bước Đăng Ký Ca Phỏng Vấn:</w:t></w:r>
    </w:p>

    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>• Bước 1 (Thông tin cá nhân): </w:t></w:r><w:r><w:t>Nhập Họ và tên, Mã sinh viên (MSV), Email, Số điện thoại và Lớp.</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>• Bước 2 (Chọn ban chuyên môn): </w:t></w:r><w:r><w:t>Cho phép ứng tuyển tối đa 2 ban chuyên môn (NV1 &amp; NV2) thuộc 6 ban của CLB.</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>• Bước 3 (Chọn ca phỏng vấn trên Timeline): </w:t></w:r><w:r><w:t>Chọn ngày phỏng vấn (05/09, 06/09, 07/09) và chọn khung giờ còn trống (sức chứa tối đa 2 ứng viên / ca). Hệ thống có thuật toán chống trùng giờ giữa 2 ban và hỗ trợ đăng ký Hàng chờ (Waitlist) khi ca đã đầy.</w:t></w:r></w:p>
    <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>• Bước 4 (Xác nhận &amp; Nhận mã booking): </w:t></w:r><w:r><w:t>Hệ thống cấp mã hồ sơ (MCC-XXXXXX), hỗ trợ 1-click thêm vào Google Calendar hoặc tải file .ics.</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>B. Tra Cứu, Tự Đổi Ca &amp; Hủy Ca Qua Mã Xác Thực OTP:</w:t></w:r>
    </w:p>

    <w:p><w:r><w:t>1. Bấm vào nút </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>[Tra Cứu / Đổi Ca] </w:t></w:r><w:r><w:t>ở góc trên website.</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Nhập chính xác cả </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Mã sinh viên (MSV) </w:t></w:r><w:r><w:t>và </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Email </w:t></w:r><w:r><w:t>đã nộp đơn lúc đăng ký.</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Nhận mã OTP xác thực để vào Dashboard cá nhân: tự đổi sang ca khác còn trống hoặc hủy ca khi có việc bận đột xuất.</w:t></w:r></w:p>

    <!-- SECTION 3 -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>⚙️ 3. HƯỚNG DẪN DÀNH CHO QUẢN TRỊ VIÊN (ADMIN &amp; TRƯỞNG BAN)</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>1️⃣ Tab: 📅 Quản Lý Lịch Phỏng Vấn (Đứng đầu tiên - Mở mặc định)</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Mở / Khóa ca: </w:t></w:r><w:r><w:t>Gạt nút bật/tắt ở từng ca. Chỉ cho phép mở khi ca đã có từ 2 người phỏng vấn trở lên.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Tạo ca: </w:t></w:r><w:r><w:t>Hỗ trợ tạo ca thủ công từng khung giờ hoặc tạo tự động hàng loạt 5 ca/ngày cho ban.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>Nhập CSV &amp; Xuất Excel: </w:t></w:r><w:r><w:t>Hỗ trợ nạp lịch phỏng vấn từ file CSV và tải báo cáo danh sách hoàn chỉnh ra file Excel chuẩn UTF-8.</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>2️⃣ Tab: 📑 Ca Ứng Viên Đăng Ký</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• Tra cứu nhanh theo tên, MSV, email, mã hồ sơ booking.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Hỗ trợ Admin can thiệp đổi ca hoặc hủy đơn trực tiếp cho thí sinh khi nhận được liên hệ hotline.</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>3️⃣ Tab: 📋 Chi Tiết Ca &amp; Điểm Danh (Tại Bàn Phỏng Vấn)</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• Bộ lọc 2 tầng 1 chạm trực quan: Tầng 1 chọn Ngày &rarr; Tầng 2 chọn Khung Ca.</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Điểm danh tức thì: [Chờ đến] &rarr; [Đã đến] &rarr; [Vắng mặt].</w:t></w:r></w:p>
    <w:p><w:r><w:t>• Bảo mật tuyệt đối: Không hiển thị danh tính người phỏng vấn ra ngoài thí sinh.</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:pStyle w:val="Heading2"/></w:pPr>
      <w:r><w:t>4️⃣ Tab: 📜 Lịch Sử Hoạt Động (Audit Logs)</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>• Ghi lại đầy đủ mọi lịch sử thao tác của các tài khoản để Ban Chủ Nhiệm và Cố Vấn kiểm tra minh bạch.</w:t></w:r></w:p>

    <!-- SECTION 4 -->
    <w:p>
      <w:pPr><w:pStyle w:val="Heading1"/></w:pPr>
      <w:r><w:t>🚀 4. HƯỚNG DẪN TRIỂN KHAI LÊN NETLIFY DROP</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>1. Mở trình duyệt vào trang: </w:t></w:r><w:r><w:rPr><w:b/><w:color w:val="EA580C"/></w:rPr><w:t>https://app.netlify.com/drop</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Kéo toàn bộ thư mục </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>club-interview-portal </w:t></w:r><w:r><w:t>thả vào khung Netlify.</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Nhận ngay đường link online để gửi cho mọi người truy cập!</w:t></w:r></w:p>

  </w:body>
</w:document>
'@
[System.IO.File]::WriteAllText("$tempFolder\word\document.xml", $docXml, $utf8)

# Compress to .docx
if (Test-Path $docxPath) { Remove-Item -Force $docxPath }
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempFolder, $docxPath)
Remove-Item -Recurse -Force $tempFolder

Write-Host "SUCCESS: Created $docxPath"
