import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./Layout/Header";
import Modal from "./components/Modal";
import ChatBox from "./components/ChatBox";
import { getCurrentUser, clearUserCache } from "./services/authService";
import { ToastProvider } from "./components/Toast/Toast";
import { ConfirmProvider } from "./components/ConfirmModal/ConfirmModal";
import PageViewTracker from './components/PageViewTracker';
import VisitActivityTracker from './components/VisitActivityTracker';

// Lazy load các trang (Chỉ tải code khi người dùng thực sự vào trang đó)
const HomePage = lazy(() => import("./Pages/HomePage"));
const AboutPage = lazy(() => import("./Pages/AboutPage"));
const ProductPage = lazy(() => import("./Pages/Productpage"));
const ProductDetailPage = lazy(() => import("./Pages/ProductDetailPage"));
const PostPage = lazy(() => import("./Pages/PostPage"));
const ContactPage = lazy(() => import("./Pages/ContactPage"));
const FAQPage = lazy(() => import("./Pages/FAQPage"));
const StorePage = lazy(() => import("./Pages/StorePage"));
const CartPage = lazy(() => import("./Pages/CartPage"));
const WishlistPage = lazy(() => import("./Pages/WishlistPage"));
const LoginPage = lazy(() => import("./Pages/LoginPage"));
const RegisterPage = lazy(() => import("./Pages/RegisterPage"));
const RegisterGooglePage = lazy(() => import("./Pages/RegisterGooglePage"));
const MyOrdersPage = lazy(() => import("./Pages/MyOrdersPage"));
const ProfilePage = lazy(() => import("./Pages/ProfilePage"));
const PostDetailPage = lazy(() => import("./Pages/PostDetailPage"));

// Lazy load Admin Pages
const AdminProductPage = lazy(() => import("./Pages/Admin/AdminProductPage"));
const AdminCustomerPage = lazy(() => import("./Pages/Admin/AdminCustomerPage"));
const AdminEmployeePage = lazy(() => import("./Pages/Admin/AdminEmployeePage"));
const AdminTransferPage = lazy(() => import("./Pages/Admin/AdminTransferPage"));
const AdminInvoicePage = lazy(() => import("./Pages/Admin/AdminInvoicePage"));
const AdminPOSPage = lazy(() => import("./Pages/Admin/AdminPOSPage"));
const AdminPOSShiftPage = lazy(() => import("./Pages/Admin/AdminPOSShiftPage"));
const AdminReportPage = lazy(() => import("./Pages/Admin/AdminReportPage"));
const AdminChatPage = lazy(() => import("./Pages/Admin/AdminChatPage"));
const AdminInternalChatPage = lazy(() => import("./Pages/Admin/AdminInternalChatPage"));
const AdminStorePage = lazy(() => import("./Pages/Admin/AdminStorePage"));
const AdminProfilePage = lazy(() => import("./Pages/Admin/AdminProfilePage"));
const AdminVoucherPage = lazy(() => import("./Pages/Admin/AdminVoucherPage"));
const AdminNewsPage = lazy(() => import("./Pages/Admin/AdminNewsPage"));
const AdminInventoryLedgerPage = lazy(() => import("./Pages/Admin/AdminInventoryLedgerPage"));
const AdminAdvancedAuditPage = lazy(() => import("./Pages/Admin/AdminAdvancedAuditPage"));
const AdminFeatureLockPage = lazy(() => import("./Pages/Admin/AdminFeatureLockPage"));
const AdminPreOrderPage = lazy(() => import("./Pages/Admin/AdminPreOrderPage"));
const AdminLoHangPage = lazy(() => import("./Pages/Admin/AdminLoHangPage"));
const AdminNhaCungCapPage = lazy(() => import("./Pages/Admin/AdminNhaCungCapPage"));
const AdminBienBanHuyPage = lazy(() => import("./Pages/Admin/AdminBienBanHuyPage"));
const AdminSignatureApprovalPage = lazy(() => import("./Pages/Admin/AdminSignatureApprovalPage"));
const AdminNhapLoPage = lazy(() => import("./Pages/Admin/AdminNhapLoPage"));
const AdminCategoryPage = lazy(() => import("./Pages/Admin/AdminCategoryPage"));
const AdminOnlineOrderPage = lazy(() => import("./Pages/Admin/AdminOnlineOrderPage"));
const AdminReviewPage = lazy(() => import("./Pages/Admin/AdminReviewPage"));
const AdminSystemMonitorPage = lazy(() => import("./Pages/Admin/AdminSystemMonitorPage"));
const AdminAnalyticsPage = lazy(() => import("./Pages/Admin/AdminAnalyticsPage"));
const AdminAccountPage = lazy(() => import("./Pages/Admin/AdminAccountPage"));

import CookieSpinner from "./components/CookieSpinner";

// Tạo hiệu ứng Loading nhẹ khi đang tải file JS
const LoadingFallback = () => <CookieSpinner fullPage text="Đang tải trang..." />;

// Error Boundary chống sập ứng dụng và chống màn hình trắng khi tải tài nguyên thất bại
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("GlobalErrorBoundary phát hiện sự cố giao diện:", error, errorInfo);
    const msg = error?.message || String(error || '');
    if (
      msg.includes('Failed to load module script') ||
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk')
    ) {
      const lastReload = parseInt(sessionStorage.getItem('last_auto_reload') || '0', 10);
      const now = Date.now();
      if (now - lastReload > 8000) {
        sessionStorage.setItem('last_auto_reload', String(now));
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          backgroundColor: '#fffdf9',
          fontFamily: "'Inter', sans-serif"
        }}>
          <div style={{ fontSize: '56px', marginBottom: '16px' }}>🥐</div>
          <h2 style={{ color: '#8a5829', marginBottom: '8px', fontSize: '22px', fontWeight: '700' }}>
            Hệ thống đang tải lại tài nguyên mới nhất...
          </h2>
          <p style={{ color: '#666', maxWidth: '480px', marginBottom: '24px', fontSize: '14px', lineHeight: 1.6 }}>
            Trình duyệt của bạn đang lưu bộ nhớ đệm cũ hoặc vừa có bản cập nhật mới từ hệ thống Givral Bakery. Vui lòng bấm nút bên dưới để tải lại dữ liệu mới nhất.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('last_auto_reload');
              window.location.reload();
            }}
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--primary-color, #c81f34)',
              color: '#fff',
              border: 'none',
              borderRadius: '25px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(200, 31, 52, 0.3)'
            }}
          >
            🔄 Tải lại trang ngay
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Tạo component điều hướng cho /admin
const DashboardRouter = () => {
  const [role, setRole] = React.useState(null);
  const [vaiTroId, setVaiTroId] = React.useState(null);
  React.useEffect(() => {
    import('./services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        setRole(Number(user.MAROLE !== undefined ? user.MAROLE : user.role));
        setVaiTroId(Number(user.vaiTroId || user.vai_tro_id || user.role_id || 0));
      }).catch(() => {
        if (window.location.pathname !== '/dang-nhap') {
          window.location.href = '/dang-nhap';
        }
      });
    });
  }, []);

  if (role === null && vaiTroId === null) return <LoadingFallback />;
  if (vaiTroId === 4 || role === 7) return <Navigate to="/admin/lo-hang" replace />; // WAREHOUSE -> Lô hàng (Không vào báo cáo)
  if (vaiTroId === 3 || role === 2) return <Navigate to="/admin/pos" replace />; // CASHIER -> Bán hàng POS
  if (role === 4 || vaiTroId === 5) return <Navigate to="/admin/chat" replace />; // CSKH -> Chat
  if (role === 6 || vaiTroId === 7) return <Navigate to="/admin/hoa-don" replace />; // KẾ TOÁN -> Hóa đơn
  if (role === 0 || role === 1 || vaiTroId === 1 || vaiTroId === 2 || vaiTroId === 8 || role === 5) return <AdminReportPage />;
  return <Navigate to="/admin/lo-hang" replace />;
};

function App() {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    const updateUser = () => {
      getCurrentUser(true).then(user => setCurrentUser(user)).catch(() => setCurrentUser(null));
    };

    // Kiem tra URL xem co tra ve token tu Google khong
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || params.get("access_token");
    if (token) {
        clearUserCache();
        localStorage.setItem("access_token", token);
        document.dispatchEvent(new Event('authUpdated'));
        // Xoa token khoi URL cho dep
        window.history.replaceState({}, document.title, window.location.pathname + "?google=true");
    }

    updateUser();
    window.addEventListener('authUpdated', updateUser);
    document.addEventListener('authUpdated', updateUser);

    return () => {
      window.removeEventListener('authUpdated', updateUser);
      document.removeEventListener('authUpdated', updateUser);
    };
  }, []);

  return (
    <GlobalErrorBoundary>
      <ToastProvider>
        <ConfirmProvider>
          <Router>
            <Header />
            <VisitActivityTracker />
            <PageViewTracker />
            <Suspense fallback={<LoadingFallback />}>
            <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trang-chu" element={<HomePage />} />
            <Route path="/gioi-thieu" element={<AboutPage />} />
            <Route path="/san-pham" element={<ProductPage />} />
            <Route path="/san-pham/:id" element={<ProductDetailPage />} />
            <Route path="/tin-tuc" element={<PostPage />} />
            <Route path="/tin-tuc/:id" element={<PostDetailPage />} />
            <Route path="/lien-he" element={<ContactPage />} />
            <Route path="/Cau-hoi-thuong-gap" element={<FAQPage />} />
            <Route path="/he-thong-cua-hang" element={<StorePage />} />
            <Route path="/gio-hang" element={<CartPage />} />
            <Route path="/yeu-thich" element={<WishlistPage />} />
            <Route path="/dang-nhap" element={<LoginPage />} />
            <Route path="/dang-ky" element={<RegisterPage />} />
            <Route path="/dang-ky-google" element={<RegisterGooglePage />} />
            <Route path="/my-orders" element={<MyOrdersPage />} />
            <Route path="/thong-tin-ca-nhan" element={<ProfilePage />} />
            
            <Route path="/admin" element={<DashboardRouter />} />
            <Route path="/admin/san-pham" element={<AdminProductPage />} />
            <Route path="/admin/khach-hang" element={<AdminCustomerPage />} />
            <Route path="/admin/nhan-vien" element={<AdminEmployeePage />} />
            <Route path="/admin/dieu-chuyen" element={<AdminTransferPage />} />
            <Route path="/admin/hoa-don" element={<AdminInvoicePage />} />
            <Route path="/admin/pos" element={<AdminPOSPage />} />
            <Route path="/admin/ca-lam-viec" element={<AdminPOSShiftPage />} />
            <Route path="/admin/bao-cao" element={<AdminReportPage />} />
            <Route path="/admin/cua-hang" element={<AdminStorePage />} />
            <Route path="/admin/chat" element={<AdminChatPage />} />
            <Route path="/admin/chat-noi-bo" element={<AdminInternalChatPage />} />
            <Route path="/admin/thong-tin-ca-nhan" element={<AdminProfilePage />} />
            <Route path="/admin/khuyen-mai" element={<AdminVoucherPage />} />
            <Route path="/admin/tin-tuc" element={<AdminNewsPage />} />
            <Route path="/admin/so-cai-ton-kho" element={<AdminInventoryLedgerPage />} />
            <Route path="/admin/nhat-ky-nang-cao" element={<AdminAdvancedAuditPage />} />
            <Route path="/admin/bao-tri-he-thong" element={<AdminFeatureLockPage />} />
            <Route path="/admin/dat-hang-truoc" element={<AdminPreOrderPage />} />
            <Route path="/admin/lo-hang" element={<AdminLoHangPage />} />
            <Route path="/admin/nha-cung-cap" element={<AdminNhaCungCapPage />} />
            <Route path="/admin/bien-ban-huy" element={<AdminBienBanHuyPage />} />
            <Route path="/admin/duyet-ky-so" element={<AdminSignatureApprovalPage />} />
            <Route path="/admin/nhap-lo-hang" element={<AdminNhapLoPage />} />
            <Route path="/admin/loai-san-pham" element={<AdminCategoryPage />} />
            <Route path="/admin/don-hang-online" element={<AdminOnlineOrderPage />} />
            <Route path="/admin/danh-gia" element={<AdminReviewPage />} />
            <Route path="/admin/giam-sat-he-thong" element={<AdminSystemMonitorPage />} />
            <Route path="/admin/phan-tich-nguoi-dung" element={<AdminAnalyticsPage />} />
            <Route path="/admin/tai-khoan" element={<AdminAccountPage />} />
          </Routes>
          </Suspense>
          <Modal />
          <ChatBox currentUser={currentUser} />
        </Router>
        </ConfirmProvider>
      </ToastProvider>
    </GlobalErrorBoundary>
  );
}

export default App;
