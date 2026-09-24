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
    sales: true,
    warehouse: false,
    supplier: false,
    products: false,
    approval: false,
    business: false,
    communication: false,
    system: false,
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
    if (['/admin/pos', '/admin/dat-hang-truoc', '/admin/don-hang-online', '/admin/hoa-don'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, sales: true }));
    } else if (['/admin/dieu-chuyen', '/admin/so-cai-ton-kho'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, warehouse: true }));
    } else if (['/admin/nha-cung-cap', '/admin/lo-hang'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, supplier: true }));
    } else if (['/admin/san-pham', '/admin/loai-san-pham', '/admin/khuyen-mai'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, products: true }));
    } else if (['/admin/duyet-ky-so', '/admin/bien-ban-huy'].includes(path)) {
      setOpenGroups(prev => ({ ...prev, approval: true }));
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

  // Check group active helpers
  const isSalesGroupActive = ['/admin/pos', '/admin/dat-hang-truoc', '/admin/don-hang-online', '/admin/hoa-don'].includes(location.pathname);
  const isWarehouseGroupActive = ['/admin/dieu-chuyen', '/admin/so-cai-ton-kho'].includes(location.pathname);
  const isSupplierGroupActive = ['/admin/nha-cung-cap', '/admin/nhap-lo-hang', '/admin/lo-hang'].includes(location.pathname);
  const isProductsGroupActive = ['/admin/san-pham', '/admin/loai-san-pham', '/admin/khuyen-mai'].includes(location.pathname);
  const isApprovalGroupActive = ['/admin/duyet-ky-so', '/admin/bien-ban-huy'].includes(location.pathname);
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
      <aside className={`admin-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <Link to="/admin" className="sidebar-logo">
          <img src="../../assets/IMG/logo_header.webp" alt="Dola Bakery Logo" style={{ width: '42px', height: '42px' }} />
          <span>Dola Bakery</span>
        </Link>

        <nav>
          {/* ═══ SECTION: KINH DOANH ═══ */}
          <div className="sidebar-section-label">
            <span>Kinh doanh</span>
          </div>

          {/* NHÓM 1: BÁN HÀNG */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.sales ? 'open' : ''} ${isSalesGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('sales')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-cash-register header-icon"></i></span>
                  Bán hàng
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.sales ? 'expanded' : ''}`}>
                {(userRole === 0 || userRole === 1 || userRole === 2) && (
                  <Link 
                    to="/admin/pos" 
                    className={`nav-link ${location.pathname === '/admin/pos' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-calculator"></i>
                    Bán hàng tại quầy
                  </Link>
                )}
                <Link 
                  to="/admin/dat-hang-truoc" 
                  className={`nav-link ${location.pathname === '/admin/dat-hang-truoc' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-calendar-check"></i>
                  Đặt hàng trước
                </Link>
                <Link 
                  to="/admin/don-hang-online" 
                  className={`nav-link ${location.pathname === '/admin/don-hang-online' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-globe"></i>
                  Đơn hàng Online
                </Link>
                <Link 
                  to="/admin/hoa-don" 
                  className={`nav-link ${location.pathname === '/admin/hoa-don' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-file-invoice-dollar"></i>
                  Hóa đơn bán hàng
                </Link>
              </div>
            </div>
          )}

          {/* ═══ SECTION: HÀNG HÓA & KHO ═══ */}
          <div className="sidebar-section-label">
            <span>Hàng hóa & Kho</span>
          </div>

          {/* NHÓM 2: QUẢN LÝ SẢN PHẨM */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.products ? 'open' : ''} ${isProductsGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('products')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-box-open header-icon"></i></span>
                  Quản lý sản phẩm
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.products ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/san-pham" 
                  className={`nav-link ${location.pathname === '/admin/san-pham' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-cake-candles"></i>
                  Thông tin sản phẩm
                </Link>
                <Link 
                  to="/admin/loai-san-pham" 
                  className={`nav-link ${location.pathname === '/admin/loai-san-pham' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-layer-group"></i>
                  Loại sản phẩm
                </Link>
                {userRole === 0 && (
                  <Link 
                    to="/admin/khuyen-mai" 
                    className={`nav-link ${location.pathname === '/admin/khuyen-mai' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-tags"></i>
                    Khuyến mãi sản phẩm
                    <span className="nav-badge nav-badge-hot">KM</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* NHÓM 3: QUẢN LÝ KHO */}
          {(userRole === 0 || userRole === 1) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.warehouse ? 'open' : ''} ${isWarehouseGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('warehouse')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-warehouse header-icon"></i></span>
                  Quản lý kho
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.warehouse ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/dieu-chuyen" 
                  className={`nav-link ${location.pathname === '/admin/dieu-chuyen' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-truck-ramp-box"></i>
                  Điều chuyển kho
                </Link>
                <Link 
                  to="/admin/so-cai-ton-kho" 
                  className={`nav-link ${location.pathname === '/admin/so-cai-ton-kho' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-book-open"></i>
                  Sổ cái tồn kho
                  <span className="nav-badge nav-badge-info">Ledger</span>
                </Link>
              </div>
            </div>
          )}

          {/* NHÓM 4: NHÀ CUNG CẤP & LÔ HÀNG */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.supplier ? 'open' : ''} ${isSupplierGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('supplier')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-truck-field header-icon"></i></span>
                  NCC & Lô hàng
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.supplier ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/nha-cung-cap" 
                  className={`nav-link ${location.pathname === '/admin/nha-cung-cap' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-building"></i>
                  Quản lý nhà cung cấp
                </Link>
                <Link 
                  to="/admin/nhap-lo-hang" 
                  className={`nav-link ${location.pathname === '/admin/nhap-lo-hang' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-boxes-packing"></i>
                  Nhập lô hàng mới
                </Link>
                <Link 
                  to="/admin/lo-hang" 
                  className={`nav-link ${location.pathname === '/admin/lo-hang' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-chart-bar"></i>
                  Thống kê lô hàng & HSD
                  <span className="nav-badge nav-badge-warning">FEFO</span>
                </Link>
              </div>
            </div>
          )}

          {/* ═══ SECTION: NỘI BỘ ═══ */}
          <div className="sidebar-section-label">
            <span>Nội bộ</span>
          </div>

          {/* NHÓM 5: DUYỆT & KÝ SỔ */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.approval ? 'open' : ''} ${isApprovalGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('approval')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-file-signature header-icon"></i></span>
                  Duyệt & Ký sổ
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.approval ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/duyet-ky-so" 
                  className={`nav-link ${location.pathname === '/admin/duyet-ky-so' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-file-invoice"></i>
                  Hóa đơn nhập
                </Link>
                <Link 
                  to="/admin/bien-ban-huy" 
                  className={`nav-link ${location.pathname === '/admin/bien-ban-huy' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-file-excel"></i>
                  Biên bản hủy
                </Link>
              </div>
            </div>
          )}

          {/* NHÓM 6: VẬN HÀNH & BÁO CÁO */}
          <div className="sidebar-group">
            <button 
              className={`sidebar-group-header ${openGroups.business ? 'open' : ''} ${isBusinessGroupActive ? 'active-group' : ''}`}
              onClick={() => toggleGroup('business')}
            >
              <span className="header-title">
                <span className="header-icon-wrapper"><i className="fa-solid fa-chart-line header-icon"></i></span>
                Vận hành & Báo cáo
              </span>
              <i className="fa-solid fa-chevron-down arrow-icon"></i>
            </button>

            <div className={`sidebar-group-items ${openGroups.business ? 'expanded' : ''}`}>
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
          </div>

          {/* ═══ SECTION: HỆ THỐNG ═══ */}
          <div className="sidebar-section-label">
            <span>Hệ thống</span>
          </div>

          {/* NHÓM 7: GIAO TIẾP & CSKH */}
          {(userRole === 0 || userRole === 1 || userRole === 2 || userRole === 4) && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.communication ? 'open' : ''} ${isCommGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('communication')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-comments header-icon"></i></span>
                  Giao tiếp & CSKH
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.communication ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/chat" 
                  className={`nav-link ${location.pathname === '/admin/chat' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-headset"></i>
                  Hỗ trợ trực tuyến
                  <span className="nav-badge nav-badge-live">Live</span>
                </Link>

                <Link 
                  to="/admin/chat-noi-bo" 
                  className={`nav-link ${location.pathname === '/admin/chat-noi-bo' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-people-arrows"></i>
                  Chat nội bộ
                  <span className="nav-badge nav-badge-info">Nhóm</span>
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
            </div>
          )}

          {/* NHÓM 8: HỆ THỐNG */}
          {userRole === 0 && (
            <div className="sidebar-group">
              <button 
                className={`sidebar-group-header ${openGroups.system ? 'open' : ''} ${isSystemGroupActive ? 'active-group' : ''}`}
                onClick={() => toggleGroup('system')}
              >
                <span className="header-title">
                  <span className="header-icon-wrapper"><i className="fa-solid fa-shield-halved header-icon"></i></span>
                  Hệ thống
                </span>
                <i className="fa-solid fa-chevron-down arrow-icon"></i>
              </button>

              <div className={`sidebar-group-items ${openGroups.system ? 'expanded' : ''}`}>
                <Link 
                  to="/admin/nhat-ky-nang-cao" 
                  className={`nav-link ${location.pathname === '/admin/nhat-ky-nang-cao' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  Nhật ký nâng cao
                  <span className="nav-badge nav-badge-purple">Audit</span>
                </Link>
              </div>
            </div>
          )}

        </nav>

        <div className="sidebar-footer">
          <Link 
            to="/admin/thong-tin-ca-nhan" 
            className="sidebar-footer-btn sidebar-footer-profile"
          >
            <i className="fa-solid fa-user-gear"></i> Thông tin cá nhân
          </Link>
          <button 
            onClick={handleLogout}
            className="sidebar-footer-btn sidebar-footer-logout"
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
