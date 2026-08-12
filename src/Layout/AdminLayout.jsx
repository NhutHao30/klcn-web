import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import { useToast } from '../components/Toast/Toast';
import '../css/admin.css';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const toast = useToast();

  const navigate = useNavigate();

  // Accordion state for sidebar dropdown groups
  const [openGroups, setOpenGroups] = useState({
    pos: true,
    inventory: true,
    business: true,
    communication: true,
    system: true,
  });

  const toggleGroup = (groupKey) => {
    setOpenGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

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
          toast.error("Bạn không có quyền truy cập vào trang quản trị!");
          window.location.href = "/";
        }
      } catch (error) {
        toast.warning("Vui lòng đăng nhập bằng tài khoản quản trị!");
        window.location.href = "/dang-nhap";
      }
    };
    checkAuth();
  }, []);

  // Automatically expand group containing the active page
  useEffect(() => {
    const path = location.pathname;
    if (['/admin/pos', '/admin/hoa-don'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, pos: true }));
    } else if (['/admin/san-pham', '/admin/khuyen-mai', '/admin/dieu-chuyen', '/admin/so-cai-ton-kho'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, inventory: true }));
    } else if (['/admin/bao-cao', '/admin', '/admin/khach-hang', '/admin/nhan-vien', '/admin/cua-hang'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, business: true }));
    } else if (['/admin/chat', '/admin/chat-noi-bo', '/admin/tin-tuc'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, communication: true }));
    } else if (['/admin/nhat-ky-nang-cao'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, system: true }));
    }
  }, [location.pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Đăng xuất thành công!");
      window.location.href = "/dang-nhap";
    } catch (error) {
      console.error("Lỗi đăng xuất:", error);
      toast.error("Có lỗi xảy ra khi đăng xuất.");
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

  // Check group active helper
  const isPosGroupActive = ['/admin/pos', '/admin/hoa-don'].includes(location.pathname);
  const isInventoryGroupActive = ['/admin/san-pham', '/admin/khuyen-mai', '/admin/dieu-chuyen', '/admin/so-cai-ton-kho'].includes(location.pathname);
  const isBusinessGroupActive = ['/admin/bao-cao', '/admin', '/admin/khach-hang', '/admin/nhan-vien', '/admin/cua-hang'].includes(location.pathname);
  const isCommGroupActive = ['/admin/chat', '/admin/chat-noi-bo', '/admin/tin-tuc'].includes(location.pathname);
  const isSystemGroupActive = ['/admin/nhat-ky-nang-cao'].includes(location.pathname);

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
          <i className="fa-solid fa-cookie-bite" style={{ color: '#ffc107' }}></i>
          Dola Bakery
        </Link>
        <nav>

          {/* NHÓM 1: BÁN HÀNG & POS */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.pos ? 'open' : ''} ${isPosGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('pos')}
              >
                <span className="header-title">
                  <i className="fa-solid fa-cash-register header-icon"></i>
                  Bán Hàng & POS
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              {openGroups.pos && (
                <div className="sidebar-group-items">
                  {(userRole === 0 || userRole === 1 || userRole === 2) && (
                    <Link 
                      to="/admin/pos" 
                      className={`nav-link ${location.pathname === '/admin/pos' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-calculator"></i>
                      Bán hàng tại quầy (POS)
                    </Link>
                  )}
                  <Link 
                    to="/admin/hoa-don" 
                    className={`nav-link ${location.pathname === '/admin/hoa-don' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                    Quản lý hóa đơn
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* NHÓM 2: QUẢN LÝ SẢN PHẨM & KHO */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.inventory ? 'open' : ''} ${isInventoryGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('inventory')}
              >
                <span className="header-title">
                  <i className="fa-solid fa-boxes-stacked header-icon"></i>
                  Sản Phẩm & Kho
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              {openGroups.inventory && (
                <div className="sidebar-group-items">
                  <Link 
                    to="/admin/san-pham" 
                    className={`nav-link ${location.pathname === '/admin/san-pham' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-box-open"></i>
                    Quản lý sản phẩm
                  </Link>

                  {userRole === 0 && (
                    <Link 
                      to="/admin/khuyen-mai" 
                      className={`nav-link ${location.pathname === '/admin/khuyen-mai' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-tags"></i>
                      Quản lý khuyến mãi
                    </Link>
                  )}

                  {(userRole === 0 || userRole === 1) && (
                    <Link 
                      to="/admin/dieu-chuyen" 
                      className={`nav-link ${location.pathname === '/admin/dieu-chuyen' ? 'active' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-truck-ramp-box"></i>
                        Điều chuyển kho
                      </span>
                      <span style={{ backgroundColor: '#ffc107', color: '#000', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Kho</span>
                    </Link>
                  )}

                  {(userRole === 0 || userRole === 1) && (
                    <Link 
                      to="/admin/so-cai-ton-kho" 
                      className={`nav-link ${location.pathname === '/admin/so-cai-ton-kho' ? 'active' : ''}`}
                      style={{ justifyContent: 'space-between' }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-book-open"></i>
                        Sổ cái tồn kho
                      </span>
                      <span style={{ backgroundColor: '#28a745', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Ledger</span>
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* NHÓM 3: VẬN HÀNH & KINH DOANH */}
          <div className="sidebar-group">
            <button 
              className={`sidebar-group-header ${openGroups.business ? 'open' : ''} ${isBusinessGroupActive ? 'active-group' : ''}`}
              onClick={() => toggleGroup('business')}
            >
              <span className="header-title">
                <i className="fa-solid fa-chart-line header-icon"></i>
                Vận Hành & Báo Cáo
              </span>
              <i className="fa-solid fa-chevron-down arrow-icon"></i>
            </button>

            {openGroups.business && (
              <div className="sidebar-group-items">
                {(userRole === 0 || userRole === 1) && (
                  <Link 
                    to="/admin/bao-cao" 
                    className={`nav-link ${location.pathname === '/admin/bao-cao' || location.pathname === '/admin' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-chart-pie"></i>
                    Báo cáo thống kê
                  </Link>
                )}

                <Link 
                  to="/admin/khach-hang" 
                  className={`nav-link ${location.pathname === '/admin/khach-hang' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-users"></i>
                  Quản lý khách hàng
                </Link>

                {(userRole === 0 || userRole === 1) && (
                  <Link 
                    to="/admin/nhan-vien" 
                    className={`nav-link ${location.pathname === '/admin/nhan-vien' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-user-tie"></i>
                    Quản lý nhân viên
                  </Link>
                )}

                {userRole === 0 && (
                  <Link 
                    to="/admin/cua-hang" 
                    className={`nav-link ${location.pathname === '/admin/cua-hang' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-store"></i>
                    Quản lý chi nhánh
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* NHÓM 4: TRUYỀN THÔNG & CSKH */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.communication ? 'open' : ''} ${isCommGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('communication')}
              >
                <span className="header-title">
                  <i className="fa-solid fa-comments header-icon"></i>
                  Giao Tiếp & CSKH
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              {openGroups.communication && (
                <div className="sidebar-group-items">
                  <Link 
                    to="/admin/chat" 
                    className={`nav-link ${location.pathname === '/admin/chat' ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-headset"></i>
                      Hỗ trợ trực tuyến
                    </span>
                    <span style={{ backgroundColor: 'var(--admin-primary)', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Live</span>
                  </Link>

                  <Link 
                    to="/admin/chat-noi-bo" 
                    className={`nav-link ${location.pathname === '/admin/chat-noi-bo' ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-people-arrows"></i>
                      Chat Nội Bộ
                    </span>
                    <span style={{ backgroundColor: '#17a2b8', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Nhóm</span>
                  </Link>

                  {(userRole === 0 || userRole === 1) && (
                    <Link 
                      to="/admin/tin-tuc" 
                      className={`nav-link ${location.pathname === '/admin/tin-tuc' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-newspaper"></i>
                      Quản lý tin tức
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* NHÓM 5: HỆ THỐNG */}
          {userRole === 0 && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.system ? 'open' : ''} ${isSystemGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('system')}
              >
                <span className="header-title">
                  <i className="fa-solid fa-shield-halved header-icon"></i>
                  Hệ Thống & Báo Cáo
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              {openGroups.system && (
                <div className="sidebar-group-items">
                  <Link 
                    to="/admin/nhat-ky-nang-cao" 
                    className={`nav-link ${location.pathname === '/admin/nhat-ky-nang-cao' ? 'active' : ''}`}
                    style={{ justifyContent: 'space-between' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <i className="fa-solid fa-clock-rotate-left"></i>
                      Nhật ký nâng cao
                    </span>
                    <span style={{ backgroundColor: '#6f42c1', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>Audit</span>
                  </Link>
                </div>
              )}
            </div>
          )}

        </nav>

        <div style={{ padding: '15px 0 0 0', marginTop: 'auto', borderTop: '1px solid rgba(255,248,245,0.1)' }}>
          <Link 
            to="/admin/thong-tin-ca-nhan" 
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: 'rgba(255,248,245,0.08)', 
              color: '#fff8f5', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px',
              textDecoration: 'none',
              transition: 'background 0.2s'
            }}
          >
            <i className="fa-solid fa-user-gear"></i> Thông tin cá nhân
          </Link>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              padding: '10px', 
              backgroundColor: '#dc3545', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13px',
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
