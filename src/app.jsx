import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Layout/Header";
import Modal from "./components/Modal";
import ChatBox from "./Components/ChatBox";
import { getCurrentUser } from "./services/authService";

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
const AdminReportPage = lazy(() => import("./Pages/Admin/AdminReportPage"));
const AdminChatPage = lazy(() => import("./Pages/Admin/AdminChatPage"));
const AdminInternalChatPage = lazy(() => import("./Pages/Admin/AdminInternalChatPage"));
const AdminStorePage = lazy(() => import("./Pages/Admin/AdminStorePage"));
const AdminNhatKyPage = lazy(() => import("./Pages/Admin/AdminNhatKyPage"));
const AdminProfilePage = lazy(() => import("./Pages/Admin/AdminProfilePage"));
const AdminVoucherPage = lazy(() => import("./Pages/Admin/AdminVoucherPage"));
const AdminNewsPage = lazy(() => import("./Pages/Admin/AdminNewsPage"));

// Tạo hiệu ứng Loading nhẹ khi đang tải file JS
const LoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", flexDirection: "column" }}>
    <i className="fa fa-spinner fa-spin" style={{ fontSize: "40px", color: "var(--primary-color)", marginBottom: "10px" }}></i>
    <p style={{ color: "#555" }}>Đang tải trang...</p>
  </div>
);

// Tạo component điều hướng cho /admin
const DashboardRouter = () => {
  const [role, setRole] = React.useState(null);
  React.useEffect(() => {
    import('./services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => {
        setRole(Number(user.MAROLE !== undefined ? user.MAROLE : user.role));
      }).catch(() => window.location.href = '/dang-nhap');
    });
  }, []);

  if (role === null) return <LoadingFallback />;
  if (role === 0 || role === 1) return <AdminReportPage />;
  if (role === 2) return <AdminPOSPage />;
  if (role === 4) return <AdminChatPage />;
  return <AdminReportPage />;
};

function App() {
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    // Kiem tra URL xem co tra ve token tu Google khong
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    if (token) {
        localStorage.setItem("access_token", token);
        // Xoa token khoi URL cho dep
        window.history.replaceState({}, document.title, window.location.pathname + "?google=true");
    }

    getCurrentUser().then(user => setCurrentUser(user)).catch(() => setCurrentUser(null));
    
    if (params.get("google") === "true") {
        setTimeout(() => alert("Đăng nhập bằng Google thành công!"), 500);
    }
  }, []);

  return (
    <Router>
      <Header />
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
        <Route path="/admin/bao-cao" element={<AdminReportPage />} />
        <Route path="/admin/cua-hang" element={<AdminStorePage />} />
        <Route path="/admin/nhat-ky-he-thong" element={<AdminNhatKyPage />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/chat-noi-bo" element={<AdminInternalChatPage />} />
        <Route path="/admin/thong-tin-ca-nhan" element={<AdminProfilePage />} />
        <Route path="/admin/khuyen-mai" element={<AdminVoucherPage />} />
        <Route path="/admin/tin-tuc" element={<AdminNewsPage />} />
      </Routes>
      </Suspense>
      <Modal />
      <ChatBox currentUser={currentUser} />
    </Router>
  );
}

export default App;
