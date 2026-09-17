/**
 * Store.js - Multi-Campaign Enterprise Architecture for MCC.UEB Interview Portal
 * Media & Communication Club - VNU University of Economics and Business (UEB)
 */

const STORAGE_KEY = 'MCC_UEB_CLEAN_SLATE_V7';

// --- ENTERPRISE SECURITY & INPUT SANITIZATION UTILITIES ---
function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

const SECURITY_REGEX = {
  // Vietnamese & Latin characters with standard accents, spaces only, 2 to 50 chars
  FULL_NAME: /^[a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]{2,50}$/u,
  // Standard UEB student ID: exactly 8 digits
  STUDENT_ID: /^\d{8}$/,
  // Standard RFC 5322 email
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  // Vietnamese mobile numbers: 10 digits starting with 03, 05, 07, 08, 09
  PHONE: /^0(3|5|7|8|9)[0-9]{8}$/
};
window.SECURITY_REGEX = SECURITY_REGEX;

// Generate 50 Slots across 6 departments
const generate50Slots = () => {
  const dates = ['2026-09-05', '2026-09-06', '2026-09-07'];
  const shifts = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '13:30', end: '15:30' },
    { start: '15:30', end: '17:30' },
    { start: '18:30', end: '20:30' }
  ];
  const depts = ['media', 'projects', 'tech', 'relations', 'events', 'hr'];
  const ivMap = {
    media: ['iv-1', 'iv-2'],
    projects: ['iv-11', 'iv-12'],
    tech: ['iv-3', 'iv-4'],
    relations: ['iv-7', 'iv-8'],
    events: ['iv-5', 'iv-6'],
    hr: ['iv-9', 'iv-10']
  };

  const slots = [];
  let idCount = 1;

  // Exact 50 slots: media: 9, projects: 9, tech: 8, relations: 8, events: 8, hr: 8 = 50
  const targetPerDept = {
    media: 9,
    projects: 9,
    tech: 8,
    relations: 8,
    events: 8,
    hr: 8
  };

  const deptCounts = { media: 0, projects: 0, tech: 0, relations: 0, events: 0, hr: 0 };

  for (const date of dates) {
    for (const shift of shifts) {
      for (const deptId of depts) {
        if (deptCounts[deptId] < targetPerDept[deptId]) {
          slots.push({
            id: `slot-${idCount++}`,
            campaignId: 'camp-gen16',
            departmentId: deptId,
            date: date,
            startTime: shift.start,
            endTime: shift.end,
            capacity: 2,
            type: 'offline',
            location: 'Phòng 501 - Nhà E4, 144 Xuân Thủy',
            isOpen: true,
            interviewerIds: ivMap[deptId] || ['iv-1', 'iv-2']
          });
          deptCounts[deptId]++;
        }
      }
    }
  }
  return slots;
};

const INITIAL_SLOTS = generate50Slots();
const INITIAL_CANDIDATES = [];
const INITIAL_REGISTRATIONS = [];

// Initial Audit Logs
const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-init-1',
    campaignId: 'camp-gen16',
    adminName: 'Ban Quản Trị MCC',
    action: 'CREATE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: 'camp-gen16',
    reason: 'Khởi tạo đợt tuyển Gen XVI - FRAMEJUMP',
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'audit-init-2',
    campaignId: 'camp-gen16',
    adminName: 'Ban Quản Trị MCC',
    action: 'BULK_OPEN_SLOTS',
    entityType: 'Slot',
    entityId: '50-slots',
    reason: 'Mở công khai các ca phỏng vấn cho 6 ban',
    timestamp: new Date(Date.now() - 86400000).toISOString()
  }
];
const DEPARTMENTS = [
  { 
    id: 'media', 
    name: 'Ban Truyền Thông', 
    short: 'Truyền Thông', 
    color: 'rose', 
    icon: 'megaphone', 
    desc: 'Sáng tạo content đa nền tảng, thiết kế ấn phẩm visual đồ họa và định hình chiến dịch truyền thông viral.',
    jd: {
      overview: 'Gương mặt đại diện của CLB, chịu trách nhiệm xây dựng tiếng nói, hình ảnh và lan tỏa thông điệp tới cộng đồng sinh viên.',
      tasks: [
        'Lên ý tưởng, biên soạn bài viết chuẩn SEO, bắt trend Gen Z trên Fanpage và TikTok.',
        'Thiết kế bộ nhận diện thương hiệu, ấn phẩm truyền thông 2D/3D (Photoshop, Illustrator, Canva).',
        'Lập kế hoạch và thực thi các chiến dịch truyền thông đa kênh cho CLB và các sự kiện lớn.',
        'Quản lý tương tác, đo lường hiệu quả bài viết và tối ưu hóa lượt tiếp cận (Reach/Engagement).'
      ],
      requirements: [
        'Có tư duy thẩm mỹ, gu hình ảnh tốt hoặc khả năng viết lách linh hoạt, sáng tạo.',
        'Biết sử dụng cơ bản các công cụ thiết kế (Ps, Ai, Canva) hoặc viết bài là lợi thế lớn.',
        'Nhanh nhạy với xu hướng mạng xã hội, có tinh thần cầu tiến và tiếp thu feedback nhanh.'
      ],
      benefits: [
        'Nâng cao tư duy Marketing & Branding thực chiến trong môi trường chuyên nghiệp.',
        'Làm chủ các công cụ thiết kế đồ họa, sáng tạo nội dung hàng đầu.',
        'Sở hữu portfolio ấn phẩm truyền thông ấn tượng.'
      ]
    }
  },
  { 
    id: 'projects', 
    name: 'Ban Dự Án', 
    short: 'Dự Án', 
    color: 'purple', 
    icon: 'briefcase', 
    desc: 'Lập đề án chiến lược, quản trị tiến độ và hiện thực hóa các dự án, chiến dịch đặc thù của CLB từ A-Z.',
    jd: {
      overview: 'Đầu não hoạch định và điều hành, biến những ý tưởng táo bạo thành các dự án thực tế mang lại giá trị cao.',
      tasks: [
        'Nghiên cứu thị trường sinh viên, phân tích nhu cầu và xây dựng đề án dự án (Proposal chi tiết).',
        'Lập kế hoạch phân bổ nguồn lực, thời gian (Timeline) và quản trị rủi ro phát sinh.',
        'Điều phối các ban chuyên môn phối hợp nhịp nhàng trong suốt quá trình chạy dự án.',
        'Tổng kết, đánh giá KPI và nghiệm thu báo cáo tổng thể sau mỗi chiến dịch.'
      ],
      requirements: [
        'Tư duy logic, có khả năng nhìn nhận tổng quan và lập kế hoạch bài bản.',
        'Kỹ năng giải quyết vấn đề, bao quát công việc và chịu được áp lực tiến độ.',
        'Tinh thần trách nhiệm cao, chủ động và có khả năng dẫn dắt nhóm.'
      ],
      benefits: [
        'Rèn luyện tư duy quản trị dự án (Project Management) chuẩn doanh nghiệp.',
        'Nâng cao kỹ năng ra quyết định, phân tích dữ liệu và quản trị nhân sự.',
        'Kinh nghiệm thực chiến triển khai các đề án lớn từ con số 0.'
      ]
    }
  },
  { 
    id: 'relations', 
    name: 'Ban Đối Ngoại', 
    short: 'Đối Ngoại', 
    color: 'blue', 
    icon: 'handshake', 
    desc: 'Cầu nối kết nối doanh nghiệp, mời diễn giả chuyên môn, tìm kiếm nhà tài trợ và mở rộng hợp tác bảo trợ.',
    jd: {
      overview: 'Cánh tay kết nối ngoại giao, mở rộng mạng lưới đối tác, mang lại nguồn lực tài chính và bảo trợ cho CLB.',
      tasks: [
        'Lập hồ sơ mời tài trợ (Sponsorship Proposal) và gửi thư ngỏ tới các doanh nghiệp.',
        'Liên hệ, kết nối và đàm phán hợp đồng tài trợ tiền mặt / hiện vật với đối tác.',
        'Tìm kiếm, mời và chăm sóc Diễn giả (Guest Speakers) uy tín cho các talkshow.',
        'Duy trì mối quan hệ bền vững với các tổ chức sinh viên và đơn vị bảo trợ truyền thông.'
      ],
      requirements: [
        'Kỹ năng giao tiếp tự tin, phong thái lịch sự, đĩnh đạc và tác phong chuyên nghiệp.',
        'Khả năng viết email trang trọng, đàm phán và thuyết phục đối tác.',
        'Kiên trì, nhạy bén và có khả năng xử lý tình huống ngoại giao khéo léo.'
      ],
      benefits: [
        'Mở rộng networking cá nhân với các tập đoàn, doanh nghiệp và diễn giả hàng đầu.',
        'Nâng cao bản lĩnh đàm phán, giao tiếp thương mại và soạn thảo hợp đồng.',
        'Cơ hội việc làm, thực tập sớm tại các doanh nghiệp đối tác của MCC.'
      ]
    }
  },
  { 
    id: 'tech', 
    name: 'Ban Kỹ Thuật', 
    short: 'Kỹ Thuật', 
    color: 'indigo', 
    icon: 'cpu', 
    desc: 'Quay dựng video chất lượng cao, chụp ảnh sự kiện, vận hành âm thanh ánh sáng và livestream chuyên nghiệp.',
    jd: {
      overview: 'Hậu phương công nghệ và hình ảnh sống động, bảo đảm chất lượng nghe nhìn và kỹ thuật hoàn hảo cho CLB.',
      tasks: [
        'Chụp ảnh sự kiện, bắt trọn những khoảnh khắc cảm xúc và chân thực nhất của các chương trình.',
        'Quay phim và dựng video recap, viral clip, trailer (CapCut, Premiere, After Effects).',
        'Vận hành bàn mixer âm thanh, ánh sáng sân khấu và hệ thống livestream OBS/vMix.',
        'Quản lý, bảo quản và hỗ trợ thiết bị kỹ thuật số cho toàn bộ các hoạt động CLB.'
      ],
      requirements: [
        'Đam mê nhiếp ảnh, quay phim hoặc kỹ thuật công nghệ âm thanh/ánh sáng.',
        'Biết sử dụng cơ bản máy ảnh/máy quay hoặc phần mềm dựng video là lợi thế.',
        'Nhanh nhẹn, cẩn thận, có trách nhiệm với thiết bị và sẵn sàng lăn xả.'
      ],
      benefits: [
        'Được đào tạo bài bản về nhiếp ảnh, quay phim, dựng video và âm thanh ánh sáng chuyên nghiệp.',
        'Trực tiếp làm việc với các trang thiết bị kỹ thuật hiện đại.',
        'Sở hữu kho sản phẩm video/ảnh chất lượng cao ghi dấu ấn cá nhân.'
      ]
    }
  },
  { 
    id: 'events', 
    name: 'Ban Sự Kiện', 
    short: 'Sự Kiện', 
    color: 'amber', 
    icon: 'calendar', 
    desc: 'Lên concept độc đáo, viết kịch bản chi tiết, điều phối sân khấu và hiện thực hóa các chương trình quy mô lớn.',
    jd: {
      overview: 'Những người thổi lửa và hiện thực hóa giấc mơ sân khấu, mang đến trải nghiệm thăng hoa cho người tham dự.',
      tasks: [
        'Lên ý tưởng chủ đề (Concept), kịch bản chi tiết (Timeline, Checklist, Kịch bản MC).',
        'Khảo sát địa điểm tổ chức, lên sơ đồ bố trí không gian và dự trù ngân sách sự kiện.',
        'Điều phối chương trình, chạy sân khấu (Stage Manager) và quản lý đạo cụ.',
        'Ứng biến và xử lý linh hoạt các tình huống phát sinh trong suốt thời gian diễn ra sự kiện.'
      ],
      requirements: [
        'Năng động, nhiệt huyết, giàu năng lượng và yêu thích các hoạt động tập thể.',
        'Tư duy tổ chức tốt, chịu được áp lực và linh hoạt ứng biến sự cố.',
        'Có khả năng làm việc nhóm ăn ý và tinh thần trách nhiệm cao độ.'
      ],
      benefits: [
        'Tích lũy kinh nghiệm tổ chức sự kiện quy mô từ hàng trăm đến hàng nghìn người.',
        'Luyện phản xạ sân khấu, kỹ năng quản lý rủi ro và điều phối hậu cần.',
        'Trải nghiệm cảm giác vỡ òa khi chương trình hoàn thành xuất sắc.'
      ]
    }
  },
  { 
    id: 'hr', 
    name: 'Ban Nhân Sự', 
    short: 'Nhân Sự', 
    color: 'emerald', 
    icon: 'users', 
    desc: 'Quản trị hồ sơ, đánh giá hiệu suất, gắn kết nội bộ và gìn giữ văn hóa "Gia đình MCC" bền chặt.',
    jd: {
      overview: 'Trái tim kết nối của MCC, người giữ lửa tinh thần, chăm sóc đời sống thành viên và xây dựng văn hóa CLB vững mạnh.',
      tasks: [
        'Quản lý cơ sở dữ liệu thành viên, điểm danh và theo dõi tiến độ công việc.',
        'Xây dựng tiêu chí đánh giá hiệu suất (KPI) và ghi nhận đóng góp của từng cá nhân.',
        'Lên kế hoạch tổ chức các hoạt động nội bộ: Bonding, Sinh nhật, Team building, Tri ân.',
        'Lắng nghe tâm tư, giải quyết xung đột nội bộ và duy trì ngọn lửa gắn kết trong gia đình MCC.'
      ],
      requirements: [
        'Khả năng quan sát tinh tế, thấu hiểu tâm lý và kỹ năng lắng nghe tốt.',
        'Hoạt bát, cởi mở, có tinh thần kết nối mọi người và kỹ năng hoạt náo.',
        'Công tâm, trung thực, cẩn trọng và có trách nhiệm bảo mật thông tin nội bộ.'
      ],
      benefits: [
        'Nắm vững kỹ năng quản trị nguồn nhân lực (Human Resource Management) thực tế.',
        'Nâng cao kỹ năng thấu hiểu tâm lý, giải quyết mâu thuẫn và truyền cảm hứng.',
        'Là người thân thiết, gắn bó và được mọi thành viên trong CLB yêu quý.'
      ]
    }
  }
];

// Interviewers Pool (Hội Đồng Phỏng Vấn)
const INITIAL_INTERVIEWERS = [
  { id: 'iv-1', fullName: 'Nguyễn Kiều Anh', role: 'Ban Chủ Nhiệm MCC', email: 'nguyenkieuanh.mcc@gmail.com', phone: '0912345001', deptId: 'media' },
  { id: 'iv-2', fullName: 'Trần Thảo Linh', role: 'Trưởng Ban Truyền Thông', email: 'bantruyenthong.mcc@gmail.com', phone: '0912345002', deptId: 'media' },
  { id: 'iv-3', fullName: 'Đặng Quang Minh', role: 'Trưởng Ban Kỹ Thuật', email: 'bankythuat.mcc@gmail.com', phone: '0912345003', deptId: 'tech' },
  { id: 'iv-4', fullName: 'Phạm Hải Nam', role: 'Phó Ban Kỹ Thuật', email: 'bankythuat.mcc@gmail.com', phone: '0912345004', deptId: 'tech' },
  { id: 'iv-5', fullName: 'Vũ Minh Tuấn', role: 'Trưởng Ban Sự Kiện', email: 'bansukien.mcc@gmail.com', phone: '0912345005', deptId: 'events' },
  { id: 'iv-6', fullName: 'Lê Thu Trang', role: 'Phó Ban Sự Kiện', email: 'bansukien.mcc@gmail.com', phone: '0912345006', deptId: 'events' },
  { id: 'iv-7', fullName: 'Hoàng Phương Mai', role: 'Trưởng Ban Đối Ngoại', email: 'bandoingoai.mcc@gmail.com', phone: '0912345007', deptId: 'relations' },
  { id: 'iv-8', fullName: 'Nguyễn Đức Anh', role: 'Phó Ban Đối Ngoại', email: 'bandoingoai.mcc@gmail.com', phone: '0912345008', deptId: 'relations' },
  { id: 'iv-9', fullName: 'Nguyễn Khánh Linh', role: 'Ban Nhân Sự', email: 'nguyenkhanhlinh.mcc@gmail.com', phone: '0912345009', deptId: 'hr' },
  { id: 'iv-10', fullName: 'Nguyễn Đăng Dương', role: 'Ban Nhân Sự', email: 'nguyendangduong.mcc@gmail.com', phone: '0912345010', deptId: 'hr' },
  { id: 'iv-11', fullName: 'Trịnh Hoài Nam', role: 'Trưởng Ban Dự Án', email: 'banduan.mcc@gmail.com', phone: '0912345011', deptId: 'projects' },
  { id: 'iv-12', fullName: 'Nguyễn Lan Anh', role: 'Phó Ban Dự Án', email: 'banduan.mcc@gmail.com', phone: '0912345012', deptId: 'projects' }
];

function getFutureDate(days = 0, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

function getDateStr(days = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Multi-Campaign List
const INITIAL_CAMPAIGNS = [
  {
    id: 'camp-gen16',
    name: 'FRAMEJUMP',
    gen: 'Gen XVI',
    academicYear: '2026 - 2027',
    slogan: 'JUMP THE FRAME - OWN THE SCENE',
    locationOffline: 'Phòng 501 - Nhà E4, Trường ĐH Kinh tế - ĐHQGHN (144 Xuân Thủy, Cầu Giấy, HN)',
    contactEmail: 'mcc.ueb.vnu@gmail.com',
    contactHotline: '0987.654.321 (Ban Tuyển Quân MCC)',
    fanpageUrl: 'https://www.facebook.com/MCC.UEB',
    startDate: getDateStr(0),
    endDate: getDateStr(7),
    registrationDeadline: getFutureDate(4, 0), // 4 days from now
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

// Firebase Configuration for MCC.UEB Interview Portal
const firebaseConfig = {
  apiKey: "AIzaSyD-Qt4dlZDRnSZV0BcyH7ovaLHviMgCDaU",
  authDomain: "mcc-ueb-interview.firebaseapp.com",
  projectId: "mcc-ueb-interview",
  storageBucket: "mcc-ueb-interview.firebasestorage.app",
  messagingSenderId: "953966798642",
  appId: "1:953966798642:web:2456c811df7b75a4af192b",
  measurementId: "G-F18F2WSRWC"
};

let cloudDb = null;
try {
  if (typeof firebase !== 'undefined') {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    cloudDb = firebase.firestore();
    console.log('🔥 [Firebase Cloud] Kết nối thành công tới Firestore project: mcc-ueb-interview');
  }
} catch (err) {
  console.warn('🔥 [Firebase Cloud] Không thể khởi tạo Firebase, dùng tạm localStorage cục bộ:', err);
}

class Store {
  constructor() {
    this.listeners = [];
    this.otpStore = {}; // Temporary in-memory OTP cache { email: { code, expiresAt } }
    this.isSyncingFromCloud = false;
    this.data = this.loadData();
    this.initCloudSync();
  }

  initCloudSync() {
    if (!cloudDb) return;
    try {
      const docRef = cloudDb.collection('mcc_portal').doc('live_data');

      // Realtime Listener
      docRef.onSnapshot((doc) => {
        if (doc.exists) {
          const cloudData = doc.data();
          if (cloudData && Array.isArray(cloudData.campaigns) && cloudData.campaigns.length > 0) {
            // Tự động dọn dẹp các hồ sơ ứng viên mồ côi (không có đơn đăng ký nào)
            if (Array.isArray(cloudData.candidates) && Array.isArray(cloudData.registrations)) {
              cloudData.candidates = cloudData.candidates.filter(c =>
                cloudData.registrations.some(r => r.candidateId === c.id && r.status !== 'cancelled')
              );
            }

            // Loại bỏ hoàn toàn Gen XV và Gen XIV, cố định Gen XVI
            if (Array.isArray(cloudData.campaigns)) {
              cloudData.campaigns = cloudData.campaigns.filter(c => c.id !== 'camp-gen15' && c.id !== 'camp-gen14');
              const hasActive = cloudData.campaigns.some(c => c.isActive);
              if (!hasActive && cloudData.campaigns.length > 0) {
                cloudData.campaigns[0].isActive = true;
              }
            }

            // Loại bỏ hoàn toàn tài khoản dùng chung (banchunhiem, mentor, bannhansu) nếu có lưu trên Cloud
            if (Array.isArray(cloudData.admins)) {
              cloudData.admins = cloudData.admins.filter(a => 
                !['adm-bcn-shared', 'adm-mentor-shared', 'adm-hr-shared'].includes(a.id) &&
                !['banchunhiem.mcc@gmail.com', 'mentor.mcc@gmail.com', 'bannhansu.mcc@gmail.com'].includes(a.username)
              );
            }

            this.isSyncingFromCloud = true;
            this.data = cloudData;
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(cloudData));
            } catch (e) {}
            this.notify();
            this.isSyncingFromCloud = false;
            console.log('⚡ [Firebase Realtime] Đồng bộ dữ liệu toàn hệ thống thành công!');
          }
        } else {
          // Khởi tạo dữ liệu gốc lên Firestore lần đầu tiên
          console.log('⚡ [Firebase Realtime] Đang đẩy dữ liệu khởi tạo lên Cloud Firestore...');
          docRef.set(this.data).catch(e => console.error('Lỗi khi seed dữ liệu lên Firestore:', e));
        }
      }, (err) => {
        console.warn('⚡ [Firebase Realtime] Lỗi lắng nghe đồng bộ:', err);
      });
    } catch (e) {
      console.error('Error in initCloudSync', e);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    if (!Array.isArray(this.listeners)) return;
    this.listeners.forEach(fn => {
      try { fn(this.data); } catch (e) { console.error('Listener error', e); }
    });
  }

  loadData() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Tự động chuẩn hóa và gán unique ID cho từng ca nếu có trùng lặp ID
        const seenIds = new Set();
        let hasDuplicates = false;
        if (Array.isArray(parsed.slots)) {
          parsed.slots.forEach((s, idx) => {
            if (!s.id || seenIds.has(s.id)) {
              hasDuplicates = true;
              s.id = `slot-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            }
            seenIds.add(s.id);
            // 100% Offline chỉ phỏng vấn trực tiếp tại trường
            s.type = 'offline';
            if (!s.location || s.location.includes('Google Meet') || s.location.toLowerCase().includes('online')) {
              s.location = 'Phòng 501 - Nhà E4, 144 Xuân Thủy';
            }
            delete s.meetUrl;
          });
        }
        if (hasDuplicates) {
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch (e) {}
        }

        // Tự động dọn dẹp các hồ sơ ứng viên mồ côi (không có đơn đăng ký nào)
        if (Array.isArray(parsed.candidates) && Array.isArray(parsed.registrations)) {
          parsed.candidates = parsed.candidates.filter(c =>
            parsed.registrations.some(r => r.candidateId === c.id && r.status !== 'cancelled')
          );
        }

        // Tự động dọn dẹp các đơn waitlist cũ nếu có
        if (Array.isArray(parsed.registrations)) {
          parsed.registrations = parsed.registrations.filter(r => r.status !== 'waitlist');
        }

        parsed.systemSettings = { isWaitlistEnabled: false };

        // Loại bỏ hoàn toàn Gen XV và Gen XIV khỏi bộ nhớ lưu trữ, cố định Gen XVI
        if (Array.isArray(parsed.campaigns)) {
          parsed.campaigns = parsed.campaigns.filter(c => c.id !== 'camp-gen15' && c.id !== 'camp-gen14');
          const hasActive = parsed.campaigns.some(c => c.isActive);
          if (!hasActive && parsed.campaigns.length > 0) {
            parsed.campaigns[0].isActive = true;
          }
        }

        // Loại bỏ hoàn toàn tài khoản dùng chung (banchunhiem, mentor, bannhansu) khỏi bộ nhớ lưu trữ
        if (Array.isArray(parsed.admins)) {
          parsed.admins = parsed.admins.filter(a => 
            !['adm-bcn-shared', 'adm-mentor-shared', 'adm-hr-shared'].includes(a.id) &&
            !['banchunhiem.mcc@gmail.com', 'mentor.mcc@gmail.com', 'bannhansu.mcc@gmail.com'].includes(a.username)
          );
        }

        return parsed;
      }
    } catch (e) {
      console.error('Error loading localStorage', e);
    }

    const defaultData = {
      campaigns: INITIAL_CAMPAIGNS,
      departments: DEPARTMENTS,
      interviewers: INITIAL_INTERVIEWERS,
      slots: INITIAL_SLOTS,
      candidates: INITIAL_CANDIDATES,
      registrations: INITIAL_REGISTRATIONS,
      auditLogs: INITIAL_AUDIT_LOGS,
      systemSettings: { isWaitlistEnabled: false }
    };
    this.saveData(defaultData);
    return defaultData;
  }

  saveData(data = this.data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      this.data = data;
      this.notify();

      // Đẩy dữ liệu lên Firebase Firestore cho tất cả máy khác cùng thấy
      if (cloudDb && !this.isSyncingFromCloud) {
        cloudDb.collection('mcc_portal').doc('live_data').set(data)
          .catch(e => console.error('Lỗi khi lưu dữ liệu lên Firebase Cloud:', e));
      }
    } catch (e) {
      console.error('Error saving data', e);
    }
  }

  resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.loadData();
    this.notify();
    if (cloudDb) {
      cloudDb.collection('mcc_portal').doc('live_data').set(this.data)
        .catch(e => console.error('Error resetting cloud data', e));
    }
    return this.data;
  }

  // --- TIME OVERLAP ALGORITHM ---
  /**
   * Checks if two time intervals on the same day overlap.
   * Format of start/end: "HH:mm" (e.g. "08:30")
   * Overlap when: StartA < EndB AND StartB < EndA
   */
  checkTimeOverlap(startA, endA, startB, endB) {
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    const sA = toMinutes(startA);
    const eA = toMinutes(endA);
    const sB = toMinutes(startB);
    const eB = toMinutes(endB);

    return sA < eB && sB < eA;
  }

  // --- CAMPAIGN MANAGEMENT ---
  getActiveCampaign() {
    const valid = (this.data.campaigns || []).filter(c => c.id !== 'camp-gen15' && c.id !== 'camp-gen14');
    return valid.find(c => c.isActive) || valid[0] || INITIAL_CAMPAIGNS[0];
  }

  getCampaigns() {
    return (this.data.campaigns || []).filter(c => c.id !== 'camp-gen15' && c.id !== 'camp-gen14');
  }

  setActiveCampaign(campaignId) {
    const prev = this.getActiveCampaign();
    this.data.campaigns.forEach(c => {
      c.isActive = (c.id === campaignId);
    });
    this.logAudit('Admin', 'SWITCH_ACTIVE_CAMPAIGN', 'Campaign', campaignId, { activeId: prev?.id }, { activeId: campaignId }, 'Chuyển mùa tuyển active');
    this.saveData();
    return this.getActiveCampaign();
  }

  createCampaign(campaignData) {
    const newCamp = {
      id: 'camp-' + Date.now(),
      name: campaignData.name,
      gen: campaignData.gen || 'Gen New',
      academicYear: campaignData.academicYear || '2025 - 2026',
      slogan: campaignData.slogan || 'Trẻ - Nhiệt Huyết - Chuyên Nghiệp',
      locationOffline: campaignData.locationOffline || 'Phòng 501 - Nhà E4, 144 Xuân Thủy',
      contactEmail: campaignData.contactEmail || 'mcc.ueb.vnu@gmail.com',
      contactHotline: campaignData.contactHotline || '0987.654.321',
      fanpageUrl: 'https://www.facebook.com/MCC.UEB',
      startDate: campaignData.startDate,
      endDate: campaignData.endDate,
      registrationDeadline: campaignData.registrationDeadline,
      isActive: Boolean(campaignData.isActive),
      createdAt: new Date().toISOString()
    };

    if (newCamp.isActive) {
      this.data.campaigns.forEach(c => c.isActive = false);
    }
    this.data.campaigns.unshift(newCamp);
    this.logAudit('Admin', 'CREATE_CAMPAIGN', 'Campaign', newCamp.id, null, newCamp, 'Tạo đợt tuyển quân mới');
    this.saveData();
    return newCamp;
  }

  updateCampaignDeadline(campaignId, newDeadline, reason = '') {
    const camp = this.data.campaigns.find(c => c.id === campaignId);
    if (!camp) throw new Error('Không tìm thấy đợt tuyển.');
    const oldDeadline = camp.registrationDeadline;
    camp.registrationDeadline = newDeadline;
    this.logAudit('Admin', 'UPDATE_DEADLINE', 'Campaign', campaignId, { deadline: oldDeadline }, { deadline: newDeadline }, reason || 'Điều chỉnh hạn chót đăng ký');
    this.saveData();
    return camp;
  }

  isPastDeadline(campaignId = null) {
    const camp = campaignId ? this.data.campaigns.find(c => c.id === campaignId) : this.getActiveCampaign();
    if (!camp || !camp.registrationDeadline) return false;
    return new Date() > new Date(camp.registrationDeadline);
  }

  // --- DEPARTMENTS & INTERVIEWERS ---
  getDepartments() {
    return this.data.departments;
  }

  getDepartmentById(id) {
    return this.data.departments.find(d => d.id === id) || { id, name: id, short: id, color: 'gray' };
  }

  getInterviewers() {
    return this.data.interviewers;
  }

  getInterviewerById(id) {
    return this.data.interviewers.find(iv => iv.id === id) || null;
  }

  // --- SYSTEM SETTINGS & WAITLIST FEATURE TOGGLE ---
  isWaitlistEnabled() {
    return false;
  }

  setWaitlistEnabled(enabled) {
    return false;
  }

  // --- SLOTS MANAGEMENT ---
  getSlots(campaignId = null, deptId = null) {
    const campId = campaignId || this.getActiveCampaign()?.id;
    return this.data.slots
      .filter(s => (!campId || s.campaignId === campId) && (!deptId || deptId === 'all' || s.departmentId === deptId))
      .map(slot => {
        const dept = this.getDepartmentById(slot.departmentId);
        const interviewers = (slot.interviewerIds || []).map(id => this.getInterviewerById(id)).filter(Boolean);
        const activeRegs = this.data.registrations.filter(r => r.slotId === slot.id && r.status === 'confirmed');
        const bookedCount = activeRegs.length;
        const remainingCount = Math.max(0, slot.capacity - bookedCount);
        const isFull = remainingCount === 0;
        const isEligible = (slot.interviewerIds && slot.interviewerIds.length >= 2);

        return {
          ...slot,
          dept,
          interviewers,
          bookedCount,
          waitlistCount: 0,
          isWaitlistAvailable: false,
          remainingCount,
          isFull,
          isEligible,
          shiftLabel: this.getShiftLabel(slot.startTime, slot.endTime),
          registrations: activeRegs,
          waitlistRegistrations: []
        };
      });
  }

  getShiftLabel(startTime, endTime) {
    const s = (startTime || '').slice(0, 5);
    const e = (endTime || '').slice(0, 5);
    if (s >= '08:00' && s < '10:00') return `Ca 1 (${s} - ${e})`;
    if (s >= '10:00' && s < '13:00') return `Ca 2 (${s} - ${e})`;
    if (s >= '13:00' && s < '15:30') return `Ca 3 (${s} - ${e})`;
    if (s >= '15:30' && s < '18:00') return `Ca 4 (${s} - ${e})`;
    if (s >= '18:00') return `Ca 5 (${s} - ${e})`;
    return `${s} - ${e}`;
  }

  getSlotById(slotId) {
    const all = this.getSlots();
    return all.find(s => s.id === slotId) || null;
  }

  toggleSlotOpen(slotId, isOpen) {
    const slot = this.data.slots.find(s => s.id === slotId);
    if (!slot) throw new Error('Ca phỏng vấn không tồn tại.');

    if (isOpen) {
      if (!slot.interviewerIds || slot.interviewerIds.length < 2) {
        throw new Error('Ca phỏng vấn cần ít nhất 2 phỏng vấn viên để có thể mở ca.');
      }
      if (![1, 2, 3].includes(slot.capacity)) {
        throw new Error('Capacity của ca phải từ 1 đến 3 ứng viên.');
      }
    }

    const oldVal = slot.isOpen;
    slot.isOpen = Boolean(isOpen);
    this.logAudit('Admin', isOpen ? 'OPEN_SLOT' : 'LOCK_SLOT', 'Slot', slotId, { isOpen: oldVal }, { isOpen: slot.isOpen }, isOpen ? 'Mở ca công khai' : 'Khóa ca phỏng vấn');
    this.saveData();
    return slot;
  }

  bulkToggleSlotsOpen(campaignId, deptId = 'all', isOpen = true) {
    const slots = this.data.slots.filter(s => {
      if (s.campaignId !== campaignId) return false;
      if (deptId !== 'all' && s.departmentId !== deptId) return false;
      return true;
    });

    let count = 0;
    let skipped = 0;

    slots.forEach(slot => {
      if (isOpen) {
        if (slot.interviewerIds && slot.interviewerIds.length >= 2) {
          slot.isOpen = true;
          count++;
        } else {
          skipped++;
        }
      } else {
        slot.isOpen = false;
        count++;
      }
    });

    this.logAudit('Admin', isOpen ? 'BULK_OPEN_SLOTS' : 'BULK_LOCK_SLOTS', 'Campaign', campaignId, null, { count, skipped }, isOpen ? `Mở hàng loạt ${count} ca phỏng vấn` : `Khóa hàng loạt ${count} ca phỏng vấn`);
    this.saveData();
    return { count, skipped, total: slots.length };
  }

  addSlot(slotData) {
    const rawCap = slotData.capacity !== undefined ? parseInt(slotData.capacity, 10) : 2;
    const capacity = Math.min(3, Math.max(1, isNaN(rawCap) ? 2 : rawCap));

    const interviewerIds = Array.isArray(slotData.interviewerIds) ? slotData.interviewerIds : [];

    // Check interviewer collisions with existing slots on the same date
    this.validateInterviewerOverlap(slotData.date, slotData.startTime, slotData.endTime, interviewerIds);

    const activeCamp = this.getActiveCampaign();
    const newSlot = {
      id: 'slot-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8),
      campaignId: slotData.campaignId || activeCamp.id,
      departmentId: slotData.departmentId,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      location: slotData.location || 'Phòng 501 - Nhà E4, 144 Xuân Thủy',
      type: 'offline',
      capacity: capacity,
      bookedCount: 0,
      isOpen: Boolean(slotData.isOpen && interviewerIds.length >= 2),
      interviewerIds
    };

    this.data.slots.push(newSlot);
    this.logAudit('Admin', 'CREATE_SLOT', 'Slot', newSlot.id, null, newSlot, `Tạo ca phỏng vấn mới (Sức chứa: ${capacity} ứng viên)`);
    this.saveData();
    return newSlot;
  }

  updateSlotCapacity(slotId, newCapacity) {
    const currentAdmin = this.getCurrentAdmin();
    // Phân quyền Granular: Kiểm tra quyền slots:edit_capacity
    const isAuthorized = this.hasPermission('slots:edit_capacity', currentAdmin);
    if (!isAuthorized) {
      throw new Error('Bạn không có quyền thay đổi số lượng ứng viên trong ca phỏng vấn.');
    }

    const slot = this.data.slots.find(s => s.id === slotId);
    if (!slot) throw new Error('Không tìm thấy ca phỏng vấn.');

    const cap = parseInt(newCapacity, 10);
    if (![1, 2, 3].includes(cap)) {
      throw new Error('Số lượng ứng viên chỉ được phép từ 1 đến 3 ứng viên.');
    }

    const activeRegs = this.data.registrations.filter(r => r.slotId === slotId && r.status === 'confirmed');
    if (cap < activeRegs.length) {
      throw new Error(`Ca này hiện đã có ${activeRegs.length} ứng viên xác nhận. Không thể giảm sức chứa xuống ${cap}.`);
    }

    const oldCap = slot.capacity || 2;
    slot.capacity = cap;

    this.saveData();
    this.logAudit(currentAdmin.fullName, 'UPDATE_SLOT_CAPACITY', 'Slot', slotId, { capacity: oldCap }, { capacity: cap }, `Đổi sức chứa ca từ ${oldCap} thành ${cap} ứng viên`);
    return slot;
  }

  deleteSlot(slotId) {
    const hasActiveRegs = this.data.registrations.some(r => r.slotId === slotId && r.status === 'confirmed');
    if (hasActiveRegs) {
      throw new Error('Không thể xóa ca này vì đã có ứng viên đăng ký. Vui lòng đổi ca cho ứng viên trước.');
    }

    const idx = this.data.slots.findIndex(s => s.id === slotId);
    if (idx === -1) throw new Error('Ca không tồn tại.');
    const deleted = this.data.slots.splice(idx, 1)[0];
    this.logAudit('Admin', 'DELETE_SLOT', 'Slot', slotId, deleted, null, 'Xóa ca phỏng vấn');
    this.saveData();
    return true;
  }

  toggleMultipleSlotsOpen(slotIds, isOpen) {
    let count = 0;
    let skipped = 0;
    slotIds.forEach(id => {
      const slot = this.data.slots.find(s => s.id === id);
      if (slot) {
        if (isOpen) {
          if (slot.interviewerIds && slot.interviewerIds.length >= 2) {
            slot.isOpen = true;
            count++;
          } else {
            skipped++;
          }
        } else {
          slot.isOpen = false;
          count++;
        }
      }
    });
    this.logAudit('Admin', isOpen ? 'BULK_OPEN_SELECTED' : 'BULK_LOCK_SELECTED', 'Slots', `${count} slots`, null, { count, skipped }, isOpen ? `Mở ${count} ca đã chọn` : `Khóa ${count} ca đã chọn`);
    this.saveData();
    return { count, skipped };
  }

  deleteMultipleSlots(slotIds) {
    const activeSlotIdsWithRegs = new Set(
      this.data.registrations.filter(r => r.status === 'confirmed').map(r => r.slotId)
    );

    let deletedCount = 0;
    let skippedCount = 0;

    for (let i = this.data.slots.length - 1; i >= 0; i--) {
      const slot = this.data.slots[i];
      if (slotIds.includes(slot.id)) {
        if (activeSlotIdsWithRegs.has(slot.id)) {
          skippedCount++;
        } else {
          this.data.slots.splice(i, 1);
          deletedCount++;
        }
      }
    }

    this.logAudit('Admin', 'DELETE_MULTIPLE_SLOTS', 'Slots', `${deletedCount} slots`, null, null, `Xóa ${deletedCount} ca phỏng vấn (Bỏ qua ${skippedCount} ca đã có ứng viên)`);
    this.saveData();
    return { deletedCount, skippedCount };
  }

  deleteAllSlots(campaignId, deptId = 'all') {
    const activeSlotIdsWithRegs = new Set(
      this.data.registrations.filter(r => r.status === 'confirmed' && r.campaignId === campaignId).map(r => r.slotId)
    );

    let deletedCount = 0;
    let skippedCount = 0;

    for (let i = this.data.slots.length - 1; i >= 0; i--) {
      const slot = this.data.slots[i];
      if (slot.campaignId === campaignId) {
        if (deptId !== 'all' && slot.departmentId !== deptId) continue;
        if (activeSlotIdsWithRegs.has(slot.id)) {
          skippedCount++;
        } else {
          this.data.slots.splice(i, 1);
          deletedCount++;
        }
      }
    }

    this.logAudit('Admin', 'DELETE_ALL_SLOTS', 'Campaign', campaignId, null, null, `Xóa toàn bộ ${deletedCount} ca phỏng vấn (Bỏ qua ${skippedCount} ca đã có ứng viên)`);
    this.saveData();
    return { deletedCount, skippedCount };
  }

  validateInterviewerOverlap(date, startTime, endTime, interviewerIds, ignoreSlotId = null) {
    const activeCamp = this.getActiveCampaign();
    const sameDateSlots = this.data.slots.filter(s => s.campaignId === activeCamp.id && s.date === date && s.id !== ignoreSlotId);

    for (const slot of sameDateSlots) {
      if (this.checkTimeOverlap(startTime, endTime, slot.startTime, slot.endTime)) {
        for (const ivId of interviewerIds) {
          if (slot.interviewerIds && slot.interviewerIds.includes(ivId)) {
            const iv = this.getInterviewerById(ivId);
            const dept = this.getDepartmentById(slot.departmentId);
            throw new Error(`Phỏng vấn viên [${iv?.fullName || ivId}] đã bị trùng lịch với ca khác (${slot.startTime} - ${slot.endTime} của ${dept.name}). Vui lòng chọn người khác hoặc đổi giờ.`);
          }
        }
      }
    }
  }

  // --- INPUT VALIDATION & SANITIZATION (ZERO TRUST DEFENSE) ---
  validateCandidateInput(personalInfo) {
    if (!personalInfo || typeof personalInfo !== 'object') {
      throw new Error('Thông tin đăng ký không hợp lệ.');
    }

    const fullName = (personalInfo.fullName || '').trim();
    const studentId = (personalInfo.studentId || '').trim();
    const email = (personalInfo.email || '').trim().toLowerCase();
    const phone = (personalInfo.phone || '').trim();
    const academicClass = (personalInfo.academicClass || '').trim();

    // 1. Họ và tên: 2 - 50 ký tự, chỉ chữ cái tiếng Việt/Latin và khoảng trắng
    if (!fullName) throw new Error('Vui lòng điền họ và tên.');
    if (fullName.length < 2 || fullName.length > 50) {
      throw new Error('Họ và tên phải từ 2 đến 50 ký tự.');
    }
    if (!SECURITY_REGEX.FULL_NAME.test(fullName)) {
      throw new Error('Họ và tên chỉ được chứa chữ cái và khoảng trắng, không chứa số, thẻ HTML hay ký tự đặc biệt.');
    }

    // 2. Mã sinh viên (MSV): Đúng 8 chữ số chuẩn UEB
    if (!studentId) throw new Error('Vui lòng điền mã sinh viên (MSV).');
    if (!SECURITY_REGEX.STUDENT_ID.test(studentId)) {
      throw new Error('Mã sinh viên (MSV) phải gồm đúng 8 chữ số (Ví dụ: 24050001).');
    }

    // 3. Email cá nhân: Định dạng chuẩn RFC, tối đa 80 ký tự
    if (!email) throw new Error('Vui lòng điền địa chỉ email.');
    if (email.length > 80 || !SECURITY_REGEX.EMAIL.test(email)) {
      throw new Error('Địa chỉ email không đúng định dạng chuẩn (Ví dụ: name@gmail.com).');
    }

    // 4. Số điện thoại (Zalo): 10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09
    if (!phone) throw new Error('Vui lòng điền số điện thoại.');
    if (!SECURITY_REGEX.PHONE.test(phone)) {
      throw new Error('Số điện thoại không hợp lệ (Bắt buộc gồm 10 chữ số, ví dụ 0912345678).');
    }

    // 5. Lớp / Khóa (Tùy chọn): Tối đa 30 ký tự, lọc bỏ thẻ HTML
    if (academicClass && academicClass.length > 30) {
      throw new Error('Tên lớp / khóa không được vượt quá 30 ký tự.');
    }

    return {
      fullName,
      studentId,
      email,
      phone,
      academicClass: academicClass.replace(/[<>]/g, '').trim()
    };
  }

  // --- CANDIDATE & REGISTRATION (ATOMIC BOOKING & OVERLAP PREVENTION) ---
  /**
   * Registers a candidate with 1 or 2 chosen department slots.
   * Enforces:
   * 1. Strict Input Whitelisting (Anti-Injection / Anti-XSS).
   * 2. Unique Student ID & Email in campaign.
   * 3. Overlap check between Dept 1 slot and Dept 2 slot.
   * 4. Atomic capacity check on both slots (Anti-Overbooking).
   */
  registerCandidate({ personalInfo, dept1SlotId, dept2SlotId }) {
    const camp = this.getActiveCampaign();
    if (this.isPastDeadline(camp.id)) {
      throw new Error('Đợt tuyển quân đã hết hạn nhận đăng ký phỏng vấn.');
    }

    // Validation 2 tầng: Làm sạch và chuẩn hóa dữ liệu
    const cleanInfo = this.validateCandidateInput(personalInfo);
    const studentId = cleanInfo.studentId.toLowerCase();
    const email = cleanInfo.email.toLowerCase();

    // Kiểm tra xem MSV hoặc Email này đã có đơn đăng ký ĐANG HOẠT ĐỘNG trong mùa này chưa
    const existingActiveReg = this.data.registrations.find(r => {
      if (r.campaignId !== camp.id || r.status === 'cancelled') return false;
      const c = this.data.candidates.find(cand => cand.id === r.candidateId);
      if (!c) return false;
      return (
        c.studentId.trim().toLowerCase() === studentId ||
        c.email.trim().toLowerCase() === email
      );
    });

    if (existingActiveReg) {
      throw new Error(`Mã sinh viên (MSV) hoặc Email này đã có ca đăng ký trước đó. Vui lòng vào mục "Tra Cứu / Đổi Ca" để quản lý lịch hẹn.`);
    }

    // Dọn dẹp hồ sơ cũ nếu trước đó đơn đã bị xóa hoặc hủy
    this.data.candidates = this.data.candidates.filter(c => {
      if (c.campaignId !== camp.id) return true;
      const isMatch = (c.studentId.trim().toLowerCase() === studentId || c.email.trim().toLowerCase() === email);
      if (!isMatch) return true;
      return this.data.registrations.some(r => r.candidateId === c.id && r.status !== 'cancelled');
    });

    if (!dept1SlotId) {
      throw new Error('Vui lòng chọn ca phỏng vấn cho Ban thứ nhất.');
    }

    const slot1 = this.getSlotById(dept1SlotId);
    if (!slot1 || !slot1.isOpen) throw new Error('Ca phỏng vấn Ban 1 không hợp lệ hoặc chưa mở.');
    if (slot1.isFull) {
      throw new Error(`Ca phỏng vấn ${slot1.dept.name} (${slot1.startTime} - ${slot1.endTime}) đã hết chỗ. Vui lòng chọn ca khác.`);
    }

    let slot2 = null;
    if (dept2SlotId) {
      if (dept2SlotId === dept1SlotId) {
        throw new Error('Hai ban không thể chọn cùng một ca phỏng vấn.');
      }
      slot2 = this.getSlotById(dept2SlotId);
      if (!slot2 || !slot2.isOpen) throw new Error('Ca phỏng vấn Ban 2 không hợp lệ hoặc chưa mở.');
      if (slot2.isFull) {
        throw new Error(`Ca phỏng vấn ${slot2.dept.name} (${slot2.startTime} - ${slot2.endTime}) đã hết chỗ. Vui lòng chọn ca khác.`);
      }

      // OVERLAP CHECK
      if (slot1.date === slot2.date && this.checkTimeOverlap(slot1.startTime, slot1.endTime, slot2.startTime, slot2.endTime)) {
        throw new Error(`Hai ca phỏng vấn bạn chọn bị trùng thời gian (${slot1.dept.name}: ${slot1.startTime}-${slot1.endTime} và ${slot2.dept.name}: ${slot2.startTime}-${slot2.endTime}). Vui lòng chọn 2 khung giờ khác nhau.`);
      }
    }

    // CREATE CANDIDATE
    const candId = 'cand-' + Date.now();
    const newCandidate = {
      id: candId,
      campaignId: camp.id,
      fullName: cleanInfo.fullName,
      studentId: cleanInfo.studentId,
      email: cleanInfo.email,
      phone: cleanInfo.phone,
      academicClass: cleanInfo.academicClass,
      createdAt: new Date().toISOString()
    };

    // CREATE REGISTRATIONS
    const randomHex = Math.floor(1000 + Math.random() * 9000);
    const createdRegistrations = [];

    const reg1 = {
      id: 'reg-' + Date.now() + '-1',
      candidateId: candId,
      campaignId: camp.id,
      departmentId: slot1.departmentId,
      slotId: slot1.id,
      bookingCode: `MCC-${randomHex}-${slot1.dept.short.replace(/\s+/g, '').toUpperCase().slice(0, 2)}`,
      checkInStatus: 'pending',
      status: 'confirmed',
      registeredAt: new Date().toISOString(),
      evaluation: null
    };
    createdRegistrations.push(reg1);

    if (slot2) {
      const reg2 = {
        id: 'reg-' + Date.now() + '-2',
        candidateId: candId,
        campaignId: camp.id,
        departmentId: slot2.departmentId,
        slotId: slot2.id,
        bookingCode: `MCC-${randomHex}-${slot2.dept.short.replace(/\s+/g, '').toUpperCase().slice(0, 2)}`,
        checkInStatus: 'pending',
        status: 'confirmed',
        registeredAt: new Date().toISOString(),
        evaluation: null
      };
      createdRegistrations.push(reg2);
    }

    // ATOMIC SAVE
    this.data.candidates.unshift(newCandidate);
    this.data.registrations.unshift(...createdRegistrations);
    this.saveData();

    this.logAudit(newCandidate.fullName, 'REGISTER_SUCCESS', 'Candidate', candId, null, { candidate: newCandidate, registrations: createdRegistrations }, 'Đăng ký ca phỏng vấn thành công');

    return {
      candidate: newCandidate,
      registrations: createdRegistrations,
      hasWaitlist: false
    };
  }

  autoPromoteWaitlist(slotId) {
    return null;
  }

  promoteWaitlistToConfirmed(registrationId, reason = '') {
    return null;
  }

  getCandidateById(candidateId) {
    return this.data.candidates.find(c => c.id === candidateId) || null;
  }

  // --- CANDIDATE LOOKUP & EMAIL OTP SYSTEM ---
  requestOtp(studentId, email) {
    const camp = this.getActiveCampaign();
    const cleanId = (studentId || '').trim().toLowerCase();
    const cleanMail = (email || '').trim().toLowerCase();

    if (!cleanId || !cleanMail) {
      throw new Error('Vui lòng nhập đầy đủ cả Mã sinh viên (MSV) và Email đã đăng ký.');
    }

    // Yêu cầu bắt buộc khớp chính xác 100% cả MSV và Email đã đăng ký
    const cand = this.data.candidates.find(c =>
      c.campaignId === camp.id &&
      c.studentId.trim().toLowerCase() === cleanId &&
      c.email.trim().toLowerCase() === cleanMail
    );

    if (!cand) {
      throw new Error('Không tìm thấy hồ sơ đăng ký khớp với MSV và Email đã nhập.');
    }

    // --- BẢO VỆ HẠN MỨC EMAILJS (ANTI-SPAM RATE LIMITING) ---
    if (!this.otpRateLimit) this.otpRateLimit = {};
    const now = Date.now();
    const rate = this.otpRateLimit[cleanMail] || { count: 0, firstAttemptAt: now, lastAttemptAt: 0 };

    // 1. Cooldown bắt buộc tối thiểu 60 giây giữa 2 lần bấm
    const timeSinceLast = (now - rate.lastAttemptAt) / 1000;
    if (rate.lastAttemptAt > 0 && timeSinceLast < 60) {
      const waitSec = Math.ceil(60 - timeSinceLast);
      throw new Error(`Vui lòng chờ ${waitSec} giây nữa trước khi yêu cầu gửi lại mã OTP.`);
    }

    // 2. Reset cửa sổ sau 15 phút
    if (now - rate.firstAttemptAt > 15 * 60 * 1000) {
      rate.count = 0;
      rate.firstAttemptAt = now;
    }

    // 3. Khóa cứng tối đa 3 lần / 15 phút trên mỗi Email/MSV để chống cạn kiệt Quota
    if (rate.count >= 3) {
      const waitMin = Math.ceil((15 * 60 * 1000 - (now - rate.firstAttemptAt)) / (60 * 1000));
      throw new Error(`Bạn đã yêu cầu OTP 3 lần trong thời gian ngắn. Để bảo vệ hòm thư CLB, vui lòng thử lại sau ${waitMin} phút hoặc liên hệ Ban Tuyển Quân.`);
    }

    rate.count++;
    rate.lastAttemptAt = now;
    this.otpRateLimit[cleanMail] = rate;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    this.otpStore[cleanMail] = { otp, expiresAt, candidateId: cand.id };

    return {
      success: true,
      email: cleanMail,
      candidate: cand,
      message: `Mã OTP đã được gửi đến email ${cleanMail}.`,
      otpCode: otp // Truyền vào EmailService gửi ngầm, không lộ ra UI hay log
    };
  }

  verifyOtp(email, otpCode) {
    const cleanMail = (email || '').trim().toLowerCase();
    const record = this.otpStore[cleanMail];

    if (!record) {
      throw new Error('Mã OTP chưa được yêu cầu hoặc đã hết hiệu lực.');
    }

    if (Date.now() > record.expiresAt) {
      delete this.otpStore[cleanMail];
      throw new Error('Mã OTP đã hết hạn. Vui lòng gửi lại yêu cầu.');
    }

    if (record.otp !== (otpCode || '').trim()) {
      throw new Error('Mã OTP không chính xác. Vui lòng kiểm tra lại.');
    }

    const candId = record.candidateId;
    delete this.otpStore[cleanMail];

    return this.getCandidateFullDetails(candId);
  }

  getCandidateFullDetails(candidateId) {
    const candidate = this.data.candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    const registrations = this.data.registrations
      .filter(r => r.candidateId === candidateId && r.status === 'confirmed')
      .map(reg => {
        const slot = this.getSlotById(reg.slotId);
        const dept = this.getDepartmentById(reg.departmentId);
        return {
          ...reg,
          slot,
          dept
        };
      });

    return {
      candidate,
      registrations
    };
  }

  // --- RESCHEDULE & CANCEL REGISTRATION ---
  rescheduleRegistration(registrationId, newSlotId, reason = '', isAdmin = false) {
    const reg = this.data.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Không tìm thấy thông tin đăng ký.');

    const camp = this.getActiveCampaign();
    if (!isAdmin && this.isPastDeadline(camp.id)) {
      throw new Error('Đã quá thời hạn thay đổi ca phỏng vấn. Vui lòng liên hệ Hotline/Admin CLB để được hỗ trợ.');
    }

    if (reg.slotId === newSlotId) {
      throw new Error('Bạn đang ở ca phỏng vấn này rồi.');
    }

    const newSlot = this.getSlotById(newSlotId);
    if (!newSlot || !newSlot.isOpen) throw new Error('Ca phỏng vấn mới không hợp lệ hoặc chưa mở.');
    if (newSlot.departmentId !== reg.departmentId) throw new Error('Chỉ có thể đổi sang ca khác cùng ban.');
    if (newSlot.isFull) throw new Error('Ca phỏng vấn mới đã hết chỗ.');

    // CHECK OVERLAP WITH OTHER REGISTRATION OF SAME CANDIDATE
    const otherReg = this.data.registrations.find(r =>
      r.candidateId === reg.candidateId &&
      r.id !== reg.id &&
      r.status === 'confirmed'
    );
    if (otherReg) {
      const otherSlot = this.getSlotById(otherReg.slotId);
      if (otherSlot && otherSlot.date === newSlot.date && this.checkTimeOverlap(newSlot.startTime, newSlot.endTime, otherSlot.startTime, otherSlot.endTime)) {
        throw new Error(`Ca mới bị trùng thời gian với ca bạn đã đăng ký ở ${otherSlot.dept.name} (${otherSlot.startTime} - ${otherSlot.endTime}).`);
      }
    }

    const oldSlotId = reg.slotId;
    reg.slotId = newSlotId;
    reg.status = 'confirmed'; // Confirmed once moved
    reg.rescheduledAt = new Date().toISOString();

    if (isAdmin) {
      this.logAudit('Admin', 'ADMIN_RESCHEDULE', 'Registration', registrationId, { slotId: oldSlotId }, { slotId: newSlotId }, reason || 'Admin đổi ca cho ứng viên');
    }

    this.saveData();

    return reg;
  }

  cancelRegistration(registrationId, reason = '', isAdmin = false) {
    const regIndex = this.data.registrations.findIndex(r => r.id === registrationId);
    if (regIndex === -1) throw new Error('Không tìm thấy thông tin đăng ký.');

    const reg = this.data.registrations[regIndex];
    const camp = this.getActiveCampaign();
    if (!isAdmin && this.isPastDeadline(camp.id)) {
      throw new Error('Đã quá thời hạn hủy ca phỏng vấn. Vui lòng liên hệ Ban Tuyển Quân để báo vắng.');
    }

    const oldSlotId = reg.slotId;
    const cand = this.data.candidates.find(c => c.id === reg.candidateId);

    // Xóa hoàn toàn đơn đăng ký khỏi danh sách
    this.data.registrations.splice(regIndex, 1);

    // Nếu ứng viên không còn đơn nào khác, xóa luôn khỏi danh sách ứng viên
    const hasOtherRegs = this.data.registrations.some(r => r.candidateId === reg.candidateId && r.status !== 'cancelled');
    if (!hasOtherRegs) {
      this.data.candidates = this.data.candidates.filter(c => c.id !== reg.candidateId);
    }

    if (isAdmin) {
      this.logAudit('Admin', 'ADMIN_DELETE_REG', 'Registration', registrationId, { bookingCode: reg.bookingCode }, null, reason || `Admin đã xóa vĩnh viễn đơn đăng ký của ${cand?.fullName || ''}`);
    }

    this.saveData();

    return reg;
  }

  // --- ĐIỂM DANH ỨNG VIÊN (CHECK-IN) ---
  updateCheckInStatus(registrationId, status) {
    const reg = this.data.registrations.find(r => r.id === registrationId);
    if (!reg) throw new Error('Không tìm thấy đăng ký.');
    reg.checkInStatus = status;
    this.saveData();
    return reg;
  }

  // --- AUDIT LOGS ---
  logAudit(adminName, action, entityType, entityId, oldValue, newValue, reason = '') {
    const camp = this.getActiveCampaign();
    const log = {
      id: 'audit-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      campaignId: camp?.id || '',
      adminName: adminName || 'Admin',
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      reason: reason || '',
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
  }

  getAuditLogs(campaignId = null) {
    const campId = campaignId || this.getActiveCampaign()?.id;
    return this.data.auditLogs.filter(l => !campId || l.campaignId === campId);
  }

  // --- STATS ---
  getStats(campaignId = null) {
    const campId = campaignId || this.getActiveCampaign()?.id;
    const slots = this.getSlots(campId);
    const candidates = this.data.candidates.filter(c => !campId || c.campaignId === campId);
    const registrations = this.data.registrations.filter(r => (!campId || r.campaignId === campId) && r.status === 'confirmed');

    const totalCapacity = slots.reduce((acc, s) => acc + s.capacity, 0);
    const totalBooked = registrations.length;
    const fillRate = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0;

    const evaluatedRegs = registrations.filter(r => r.evaluation && typeof r.evaluation === 'object');
    const passCount = evaluatedRegs.filter(r => r.evaluation?.result === 'pass').length;
    const failCount = evaluatedRegs.filter(r => r.evaluation?.result === 'fail').length;
    const holdCount = evaluatedRegs.filter(r => r.evaluation?.result === 'hold').length;

    const deptStats = this.data.departments.map(dept => {
      const deptRegs = registrations.filter(r => r.departmentId === dept.id);
      const passed = deptRegs.filter(r => r.evaluation?.result === 'pass').length;
      return {
        ...dept,
        totalApplied: deptRegs.length,
        passedCount: passed
      };
    });

    return {
      totalCandidates: candidates.length,
      totalRegistrations: registrations.length,
      totalSlots: slots.length,
      totalCapacity,
      totalBooked,
      fillRate,
      evaluatedCount: evaluatedRegs.length,
      passCount,
      failCount,
      holdCount,
      deptStats
    };
  }
}

// ==================== HỆ THỐNG PHÂN QUYỀN TÍNH NĂNG (GRANULAR FEATURE PERMISSIONS) ====================
const ALL_PERMISSIONS = {
  // 1. Quản lý Ca & Lịch Phỏng Vấn
  'slots:view_all': { key: 'slots:view_all', name: 'Xem lịch toàn bộ 6 ban', category: '📅 Quản Lý Ca & Lịch' },
  'slots:create': { key: 'slots:create', name: 'Tạo ca phỏng vấn mới', category: '📅 Quản Lý Ca & Lịch' },
  'slots:import_csv': { key: 'slots:import_csv', name: 'Import lịch từ file CSV', category: '📅 Quản Lý Ca & Lịch' },
  'slots:edit_capacity': { key: 'slots:edit_capacity', name: 'Điều chỉnh số lượng ứng viên (1 - 3)', category: '📅 Quản Lý Ca & Lịch' },
  'slots:toggle_open': { key: 'slots:toggle_open', name: 'Khóa / Mở ca phỏng vấn', category: '📅 Quản Lý Ca & Lịch' },
  'slots:delete': { key: 'slots:delete', name: 'Xóa ca phỏng vấn', category: '📅 Quản Lý Ca & Lịch' },
  'slots:set_deadline': { key: 'slots:set_deadline', name: 'Cài đặt Deadline đăng ký & đổi ca', category: '📅 Quản Lý Ca & Lịch' },

  // 2. Quản lý Ứng Viên & Đơn Đăng Ký
  'candidates:view_all': { key: 'candidates:view_all', name: 'Xem ứng viên toàn bộ 6 ban', category: '📑 Quản Lý Ứng Viên' },
  'candidates:override_slot': { key: 'candidates:override_slot', name: 'Can thiệp đổi ca thủ công (Override)', category: '📑 Quản Lý Ứng Viên' },
  'candidates:cancel_reg': { key: 'candidates:cancel_reg', name: 'Hủy / Xóa đơn đăng ký của ứng viên', category: '📑 Quản Lý Ứng Viên' },

  // 3. Điểm Danh Phỏng Vấn
  'checkin:view_all': { key: 'checkin:view_all', name: 'Xem & Điểm danh toàn bộ 6 ban', category: '📋 Điểm Danh' },
  'checkin:mark_status': { key: 'checkin:mark_status', name: 'Thực hiện điểm danh (Có mặt / Vắng)', category: '📋 Điểm Danh' },

  // 4. Cấu Hình & Quản Trị Hệ Thống
  'system:manage_campaign': { key: 'system:manage_campaign', name: 'Tạo đợt tuyển mới (Gen mới)', category: '⚙️ Quản Trị Hệ Thống' },
  'system:audit_log': { key: 'system:audit_log', name: 'Xem Lịch sử hoạt động (Audit Logs)', category: '⚙️ Quản Trị Hệ Thống' }
};

const ALL_PERMISSION_KEYS = Object.keys(ALL_PERMISSIONS);
window.ALL_PERMISSIONS = ALL_PERMISSIONS;
window.ALL_PERMISSION_KEYS = ALL_PERMISSION_KEYS;

window.appStore = new Store();
// Danh mục quyền và thông tin vai trò Admin (KHÔNG CHỨA MẬT KHẨU THÔ)
// --- DANH SÁCH TÀI KHOẢN QUẢN TRỊ ĐÃ ĐƯỢC XÁC THỰC TRÊN GOOGLE FIREBASE ---
const INITIAL_ADMINS = [
  // --- 0. TÀI KHOẢN ADMIN TỔNG (FULL QUYỀN + TÙY CHỌN HỆ THỐNG) ---
  {
    id: 'adm-root-admin',
    username: 'admin.mcc@gmail.com',
    fullName: 'admin',
    role: 'Admin',
    avatar: '⚡',
    deptId: 'all',
    hasFullAccess: true
  },

  // --- 1. BAN CHỦ NHIỆM (3 THÀNH VIÊN - FULL QUYỀN) ---
  {
    id: 'adm-bcn-1',
    username: 'nguyenkieuanh.mcc@gmail.com',
    fullName: 'Nguyễn Kiều Anh',
    role: 'Ban Chủ Nhiệm',
    avatar: '👑',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-bcn-2',
    username: 'nguyennhatlinh.mcc@gmail.com',
    fullName: 'Nguyễn Nhật Linh',
    role: 'Ban Chủ Nhiệm',
    avatar: '👑',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-bcn-3',
    username: 'hoduongkhanhvy.mcc@gmail.com',
    fullName: 'Hồ Dương Khánh Vy',
    role: 'Ban Chủ Nhiệm',
    avatar: '👑',
    deptId: 'all',
    hasFullAccess: true
  },

  // --- 2. MENTOR (5 THÀNH VIÊN - FULL QUYỀN) ---
  {
    id: 'adm-mentor-1',
    username: 'phambaonguyen.mcc@gmail.com',
    fullName: 'Phạm Bảo Nguyên',
    role: 'Mentor',
    avatar: '🎖️',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-mentor-2',
    username: 'nguyenhuonglinh.mcc@gmail.com',
    fullName: 'Nguyễn Hương Linh',
    role: 'Mentor',
    avatar: '🎖️',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-mentor-3',
    username: 'nguyenhoanganh.mcc@gmail.com',
    fullName: 'Nguyễn Hoàng Anh',
    role: 'Mentor',
    avatar: '🎖️',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-mentor-4',
    username: 'nguyenphuonganh.mentor.mcc@gmail.com',
    fullName: 'Nguyễn Phương Anh',
    role: 'Mentor',
    avatar: '🎖️',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-mentor-5',
    username: 'nguyenngocanh.mcc@gmail.com',
    fullName: 'Nguyễn Ngọc Anh',
    role: 'Mentor',
    avatar: '🎖️',
    deptId: 'all',
    hasFullAccess: true
  },

  // --- 3. BAN NHÂN SỰ (13 THÀNH VIÊN - FULL QUYỀN) ---
  {
    id: 'adm-hr-1',
    username: 'nguyenkhanhlinh.mcc@gmail.com',
    fullName: 'Nguyễn Khánh Linh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-2',
    username: 'nguyendangduong.mcc@gmail.com',
    fullName: 'Nguyễn Đăng Dương',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-3',
    username: 'nguyenphuongthao.mcc@gmail.com',
    fullName: 'Nguyễn Phương Thảo',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-4',
    username: 'nguyenphuonganh.hr.mcc@gmail.com',
    fullName: 'Nguyễn Phương Anh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-5',
    username: 'luugialinh.mcc@gmail.com',
    fullName: 'Lưu Gia Linh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-6',
    username: 'doanthiminhthu.mcc@gmail.com',
    fullName: 'Đoàn Thị Minh Thư',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-7',
    username: 'vuphuongthuylinh.mcc@gmail.com',
    fullName: 'Vũ Phương Thuỳ Linh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-8',
    username: 'tranthicamtu.mcc@gmail.com',
    fullName: 'Trần Thị Cẩm Tú',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-9',
    username: 'dangquangdung.mcc@gmail.com',
    fullName: 'Đặng Quang Dũng',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-10',
    username: 'phamthithuhuyen.mcc@gmail.com',
    fullName: 'Phạm Thị Thu Huyền',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-11',
    username: 'nguyenphuongnhi.mcc@gmail.com',
    fullName: 'Nguyễn Phương Nhi',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-12',
    username: 'luyenminhanh.mcc@gmail.com',
    fullName: 'Luyện Minh Anh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },
  {
    id: 'adm-hr-13',
    username: 'tranleducanh.mcc@gmail.com',
    fullName: 'Trần Lê Đức Anh',
    role: 'Ban Nhân Sự',
    avatar: '📋',
    deptId: 'all',
    hasFullAccess: true
  },

  // --- 4. 5 BAN CHUYÊN MÔN (CHỈ HIỂN THỊ TÊN BAN, XEM LỊCH + ỨNG VIÊN & ĐIỂM DANH BAN MÌNH) ---
  {
    id: 'adm-media',
    username: 'bantruyenthong.mcc@gmail.com',
    fullName: 'Ban Truyền Thông',
    role: '',
    avatar: '🎨',
    deptId: 'media',
    hasFullAccess: false
  },
  {
    id: 'adm-events',
    username: 'bansukien.mcc@gmail.com',
    fullName: 'Ban Sự Kiện',
    role: '',
    avatar: '🎉',
    deptId: 'events',
    hasFullAccess: false
  },
  {
    id: 'adm-tech',
    username: 'bankythuat.mcc@gmail.com',
    fullName: 'Ban Kỹ Thuật',
    role: '',
    avatar: '💻',
    deptId: 'tech',
    hasFullAccess: false
  },
  {
    id: 'adm-projects',
    username: 'banduan.mcc@gmail.com',
    fullName: 'Ban Dự Án',
    role: '',
    avatar: '🚀',
    deptId: 'projects',
    hasFullAccess: false
  },
  {
    id: 'adm-relations',
    username: 'bandoingoai.mcc@gmail.com',
    fullName: 'Ban Đối Ngoại',
    role: '',
    avatar: '🤝',
    deptId: 'relations',
    hasFullAccess: false
  }
];

// Quản lý danh mục quản trị viên & Hệ thống phân quyền tính năng
Store.prototype.getDefaultPermissionsForRole = function(admin) {
  if (!admin) return [];
  if (admin.id === 'adm-root-admin' || admin.username === 'admin.mcc@gmail.com' || admin.role === 'Admin' || admin.fullName?.toLowerCase() === 'admin') {
    return [...ALL_PERMISSION_KEYS];
  }
  if (admin.role === 'Ban Chủ Nhiệm' || admin.role === 'Mentor') {
    return [...ALL_PERMISSION_KEYS];
  }
  if (admin.role === 'Ban Nhân Sự' || admin.deptId === 'all') {
    return [
      'slots:view_all', 'slots:create', 'slots:import_csv', 'slots:toggle_open', 'slots:set_deadline',
      'candidates:view_all', 'candidates:override_slot', 'candidates:cancel_reg',
      'checkin:view_all', 'checkin:mark_status',
      'system:audit_log'
    ];
  }
  // 5 Ban Chuyên Môn
  return ['checkin:mark_status'];
};

Store.prototype.getAdmins = function() {
  const admins = JSON.parse(JSON.stringify(INITIAL_ADMINS));
  const permsMap = this.data.adminPermissions || {};
  return admins.map(a => {
    const custom = permsMap[a.id];
    return {
      ...a,
      permissions: Array.isArray(custom) ? custom : this.getDefaultPermissionsForRole(a)
    };
  });
};

Store.prototype.getAdminPermissions = function(adminId) {
  if (!this.data.adminPermissions) this.data.adminPermissions = {};
  if (Array.isArray(this.data.adminPermissions[adminId])) {
    return this.data.adminPermissions[adminId];
  }
  const admin = INITIAL_ADMINS.find(a => a.id === adminId);
  return this.getDefaultPermissionsForRole(admin);
};

Store.prototype.updateAdminPermissions = function(adminId, newPermissions) {
  if (!this.data.adminPermissions) this.data.adminPermissions = {};
  const perms = Array.isArray(newPermissions) ? newPermissions : [];
  this.data.adminPermissions[adminId] = perms;
  const targetAdmin = INITIAL_ADMINS.find(a => a.id === adminId);
  const current = this.getCurrentAdmin();
  this.logAudit(
    current?.fullName || 'admin',
    'UPDATE_PERMISSIONS',
    'Admin',
    adminId,
    null,
    { permissionsCount: perms.length, permissions: perms },
    `Cập nhật phân quyền cho tài khoản [${targetAdmin?.fullName || adminId}] (${perms.length} tính năng)`
  );
  this.saveData();
  this.notify();
  return perms;
};

Store.prototype.hasPermission = function(permKey, admin = null) {
  const current = admin || this.getCurrentAdmin();
  if (!current) return false;
  // Tài khoản admin cấp cao luôn có toàn bộ quyền
  if (current.id === 'adm-root-admin' || current.username === 'admin.mcc@gmail.com' || current.role === 'Admin' || current.fullName?.toLowerCase() === 'admin') {
    return true;
  }
  const perms = this.getAdminPermissions(current.id);
  return perms.includes(permKey);
};

Store.prototype.updateAdminProfile = async function(adminId, { currentPassword, newPassword }) {
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    const user = firebase.auth().currentUser;
    try {
      // Xác thực lại với mật khẩu hiện tại trước khi đổi
      const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
      await user.reauthenticateWithCredential(cred);
      await user.updatePassword(newPassword);
    } catch (err) {
      if (err.code === 'auth/wrong-password') throw new Error('Mật khẩu hiện tại không chính xác.');
      if (err.code === 'auth/weak-password') throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      throw new Error(err.message || 'Không thể đổi mật khẩu trên Firebase.');
    }
  }

  const current = this.getCurrentAdmin();
  this.logAudit(current?.fullName || 'Admin', 'UPDATE_PROFILE', 'Admin', adminId, null, null, 'Đổi mật khẩu tài khoản thành công');
};

Store.prototype.authenticateAdmin = async function(username, password) {
  const cleanU = (username || '').trim().toLowerCase();
  const cleanP = (password || '').trim();

  if (!cleanU || !cleanP) {
    throw new Error('Vui lòng nhập đầy đủ Email và Mật khẩu quản trị.');
  }

  // 1. Kiểm tra tài khoản có nằm trong Danh Sách Trắng 26 người của CLB hay không
  const admins = this.getAdmins();
  const profile = admins.find(a => a.username.toLowerCase() === cleanU);

  if (!profile) {
    throw new Error('Tài khoản này không thuộc danh sách quản trị viên tuyển quân của CLB.');
  }

  // 2. Xác thực an toàn tuyệt đối qua Google Firebase Authentication
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(cleanU, cleanP);
      const user = userCredential.user;

      const session = {
        id: profile.id,
        uid: user.uid,
        username: profile.username,
        fullName: profile.fullName,
        role: profile.role,
        avatar: profile.avatar,
        deptId: profile.deptId,
        hasFullAccess: Boolean(profile.hasFullAccess),
        isMentor: Boolean(profile.role === 'Mentor'),
        loggedInAt: new Date().toISOString()
      };

      sessionStorage.setItem('MCC_ADMIN_SESSION', JSON.stringify(session));
      this.logAudit(profile.fullName, 'ADMIN_LOGIN', 'Admin', profile.id, null, { username: profile.username }, 'Đăng nhập Firebase Auth thành công');
      return session;

    } catch (err) {
      console.warn('Firebase Auth Login Error:', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Mật khẩu quản trị không chính xác.');
      }
      if (err.code === 'auth/user-not-found') {
        throw new Error('Tài khoản chưa tồn tại trên Firebase.');
      }
      if (err.code === 'auth/too-many-requests') {
        throw new Error('Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau vài phút.');
      }
      throw new Error(err.message || 'Lỗi xác thực Firebase.');
    }
  }

  throw new Error('Dịch vụ xác thực máy chủ chưa sẵn sàng. Vui lòng kiểm tra kết nối mạng.');
};

Store.prototype.getCurrentAdmin = function() {
  if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
    const user = firebase.auth().currentUser;
    const cleanEmail = (user.email || '').toLowerCase();
    const admins = this.getAdmins();
    const profile = admins.find(a => a.username.toLowerCase() === cleanEmail);
    if (profile) {
      return {
        id: profile.id,
        uid: user.uid,
        username: profile.username,
        fullName: profile.fullName,
        role: profile.role,
        avatar: profile.avatar,
        deptId: profile.deptId,
        hasFullAccess: Boolean(profile.hasFullAccess),
        isMentor: Boolean(profile.role === 'Mentor')
      };
    }
  }

  try {
    const s = sessionStorage.getItem('MCC_ADMIN_SESSION');
    if (s) return JSON.parse(s);
    return null;
  } catch (e) {
    return null;
  }
};

Store.prototype.logoutAdmin = async function() {
  const current = this.getCurrentAdmin();
  if (current) {
    this.logAudit(current.fullName, 'ADMIN_LOGOUT', 'Admin', current.id, null, null, 'Đăng xuất khỏi hệ thống');
  }
  if (typeof firebase !== 'undefined' && firebase.auth) {
    try { await firebase.auth().signOut(); } catch (e) {}
  }
  sessionStorage.removeItem('MCC_ADMIN_SESSION');
};

Store.prototype.resetSystemData = function() {
  localStorage.removeItem(STORAGE_KEY);
  const freshSlots = generate50Slots();
  const defaultData = {
    campaigns: INITIAL_CAMPAIGNS,
    departments: DEPARTMENTS,
    interviewers: INITIAL_INTERVIEWERS,
    slots: freshSlots,
    candidates: [],
    registrations: [],
    auditLogs: INITIAL_AUDIT_LOGS
  };
  this.saveData(defaultData);
  this.otpStore = {};
  return defaultData;
};
