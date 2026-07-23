import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import '../css/admin.css';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentUser();
        
        // Laravel trả về MAROLE thay vì role
        const role = Number(user.MAROLE !== undefined ? user.MAROLE : user.role);

        // 0: Admin, 1: Quản lý chi nhánh, 2: Nhân viên, 4: CSKH
        if (role === 0 || role === 1 || role === 2 || role === 4) {
          setUserRole(role);
          setIsAuthorized(true);
        } else {
          alert("Bạn không có quyền truy cập vào trang quản trị!");
          window.location.href = "/";
        }
      } catch (error) {
        alert("Vui lòng đăng nhập bằng tài khoản quản trị!");
        window.location.href = "/dang-nhap";
      }
    };
    checkAuth();
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert("Đăng xuất thành công!");
      window.location.href = "/dang-nhap";
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      alert("Có lỗi xảy ra khi đăng xuất.");
    }
  };

  if (!isAuthorized) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '40px', color: 'var(--primary-color)', marginBottom: '15px' }}></i>
        <h3>Đang kiểm tra quyền truy cập...</h3>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Mobile Overlay */}
      <div 
        className={`admin-sidebar-overlay ${isSidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{fontSize: '14px'}}>
        <Link to="/admin" className="sidebar-logo">
          Dola Bakery
        </Link>
        <nav>
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <Link 
              to="/admin/san-pham" 
              className={`nav-link ${location.pathname === '/admin/san-pham' ? 'active' : ''}`}
            >
              Quản lý sản phẩm
            </Link>
          )}
          <Link 
            to="/admin/khach-hang" 
            className={`nav-link ${location.pathname === '/admin/khach-hang' ? 'active' : ''}`}
          >
            Quản lý khách hàng
          </Link>
          {(userRole === 0 || userRole === 1) && (
            <Link 
              to="/admin/nhan-vien" 
              className={`nav-link ${location.pathname === '/admin/nhan-vien' ? 'active' : ''}`}
            >
              Quản lý nhân viên
            </Link>
          )}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <Link 
              to="/admin/hoa-don" 
              className={`nav-link ${location.pathname === '/admin/hoa-don' ? 'active' : ''}`}
            >
              Quản lý hóa đơn
            </Link>
          )}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <Link 
              to="/admin/chat" 
              className={`nav-link ${location.pathname === '/admin/chat' ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              Hỗ trợ trực tuyến
              <span style={{ backgroundColor: 'var(--admin-primary)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Live</span>
            </Link>
          )}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <Link 
              to="/admin/chat-noi-bo" 
              className={`nav-link ${location.pathname === '/admin/chat-noi-bo' ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              Chat Nội Bộ
              <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Nhóm</span>
            </Link>
          )}
          {(userRole === 0 || userRole === 1 || userRole === 2) && (
            <Link 
              to="/admin/pos" 
              className={`nav-link ${location.pathname === '/admin/pos' ? 'active' : ''}`}
            >
              Tạo hóa đơn (POS)
            </Link>
          )}
          {userRole === 0 && (
            <Link 
              to="/admin/cua-hang" 
              className={`nav-link ${location.pathname === '/admin/cua-hang' ? 'active' : ''}`}
            >
              Quản lý chuỗi chi nhánh
            </Link>
          )}
          {userRole === 0 && (
            <Link 
              to="/admin/nhat-ky-he-thong" 
              className={`nav-link ${location.pathname === '/admin/nhat-ky-he-thong' ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              Nhật ký hệ thống
              <span style={{ backgroundColor: '#855050', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Log</span>
            </Link>
          )}
          {(userRole === 0 || userRole === 1) && (
            <Link 
              to="/admin/dieu-chuyen" 
              className={`nav-link ${location.pathname === '/admin/dieu-chuyen' ? 'active' : ''}`}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              Điều chuyển kho
              <span style={{ backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Kho</span>
            </Link>
          )}
          {(userRole === 0 || userRole === 1) && (
            <Link 
              to="/admin/bao-cao" 
              className={`nav-link ${location.pathname === '/admin/bao-cao' || location.pathname === '/admin' ? 'active' : ''}`}
            >
              Báo cáo thống kê
            </Link>
          )}
        </nav>
        <div style={{ padding: '20px', marginTop: 'auto' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <i className="fa-solid fa-right-from-bracket"></i> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <button className="admin-mobile-toggle" onClick={toggleSidebar}>
          ☰ Menu
        </button>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
