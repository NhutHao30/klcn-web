import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/authService';
import { useToast } from '../components/Toast/Toast';
import '../css/admin.css';

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const toast = useToast();
  const navigate = useNavigate();

  // Read initial cache from sessionStorage to avoid flickering "Đang kiểm tra quyền truy cập..."
  const getCachedAuth = () => {
    try {
      const raw = sessionStorage.getItem('current_user');
      if (raw) {
        const u = JSON.parse(raw);
        const role = Number(u.MAROLE !== undefined ? u.MAROLE : u.role);
        const vtId = Number(u.vaiTroId || u.role_id || (u.vaitro ? u.vaitro.id : 1));
        if ([1, 2, 3, 4, 5, 7, 8].includes(vtId) || [0, 1, 2, 4, 5, 6].includes(role)) {
          return { isAuth: true, role, vtId };
        }
      }
    } catch (e) {}
    return { isAuth: false, role: null, vtId: 1 };
  };

  const initialAuth = getCachedAuth();
  const [isAuthorized, setIsAuthorized] = useState(initialAuth.isAuth);
  const [userRole, setUserRole] = useState(initialAuth.role);
  const [vaitroId, setVaitroId] = useState(initialAuth.vtId);

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
        
        // Laravel trả về MAROLE và vaiTroId
        const role = Number(user.MAROLE !== undefined ? user.MAROLE : user.role);
        const vtId = Number(user.vaiTroId || user.role_id || (user.vaitro ? user.vaitro.id : 1));

        // Allow all internal roles: 1: Admin, 2: Manager, 3: Cashier, 4: Warehouse, 5: CSKH, 7: Accountant, 8: Director
        if ([1, 2, 3, 4, 5, 7, 8].includes(vtId) || [0, 1, 2, 4, 5, 6].includes(role)) {
          setUserRole(role);
          setVaitroId(vtId);
          setIsAuthorized(true);
        } else {
          toast.error("Bạn không có quyền truy cập vào trang quản trị!");
          window.location.href = "/";
        }
      } catch (error) {
        toast.warning("Vui lòng đăng nhập bằng tài khoản quản trị!");
        if (window.location.pathname !== '/dang-nhap') {
          window.location.href = "/dang-nhap";
        }
      }
    };
    checkAuth();
  }, []);

  // Helper flags for roles
  const isAdmin = vaitroId === 1 || userRole === 0;
  const isDirector = vaitroId === 8 || userRole === 5;
  const isManager = vaitroId === 2 || userRole === 1;
  const isCashier = vaitroId === 3;
  const isWarehouse = vaitroId === 4;
  const isCskh = vaitroId === 5 || userRole === 4;
  const isAccountant = vaitroId === 7 || userRole === 6;

  // Automatically expand group containing the active page
  useEffect(() => {
    const path = location.pathname;
    if (['/admin/pos', '/admin/ca-lam-viec', '/admin/dat-hang-truoc', '/admin/don-hang-online', '/admin/hoa-don'].includes(path)) {
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
    } else if (['/admin/nhat-ky-nang-cao', '/admin/bao-tri-he-thong', '/admin/giam-sat-he-thong', '/admin/phan-tich-nguoi-dung'].includes(path)) {
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
  const isSalesGroupActive = ['/admin/pos', '/admin/ca-lam-viec', '/admin/dat-hang-truoc', '/admin/don-hang-online', '/admin/hoa-don'].includes(location.pathname);
  const isWarehouseGroupActive = ['/admin/dieu-chuyen', '/admin/so-cai-ton-kho'].includes(location.pathname);
  const isSupplierGroupActive = ['/admin/nha-cung-cap', '/admin/nhap-lo-hang', '/admin/lo-hang'].includes(location.pathname);
  const isProductsGroupActive = ['/admin/san-pham', '/admin/loai-san-pham', '/admin/khuyen-mai'].includes(location.pathname);
  const isApprovalGroupActive = ['/admin/duyet-ky-so', '/admin/bien-ban-huy'].includes(location.pathname);
  const isBusinessGroupActive = ['/admin/bao-cao', '/admin', '/admin/khach-hang', '/admin/nhan-vien', '/admin/cua-hang'].includes(location.pathname);
  const isCommGroupActive = ['/admin/chat', '/admin/chat-noi-bo', '/admin/tin-tuc'].includes(location.pathname);
  const isSystemGroupActive = ['/admin/nhat-ky-nang-cao', '/admin/bao-tri-he-thong', '/admin/giam-sat-he-thong', '/admin/phan-tich-nguoi-dung'].includes(location.pathname);

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
          <img src="/assets/IMG/Logo.png" alt="Givral Bakery Logo" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '6px' }} />
          <span>Givral Bakery</span>
        </Link>

        <nav>
          {/* ═══ SECTION: KINH DOANH ═══ */}
          <div className="sidebar-section-label">
            <span>Kinh doanh</span>
          </div>

          {/* NHÓM 1: BÁN HÀNG */}
          {(isAdmin || isDirector || isManager || isCashier || isCskh || isAccountant) && (
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
                {(isAdmin || isDirector || isManager || isCashier) && (
                  <>
                    <Link 
                      to="/admin/pos" 
                      className={`nav-link ${location.pathname === '/admin/pos' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-calculator"></i>
                      Bán hàng tại quầy
                    </Link>
                    <Link 
                      to="/admin/ca-lam-viec" 
                      className={`nav-link ${location.pathname === '/admin/ca-lam-viec' ? 'active' : ''}`}
                    >
                      <i className="fa-solid fa-clock-rotate-left"></i>
                      Quản lý Ca làm việc POS
                    </Link>
                  </>
                )}
                {(isAdmin || isDirector || isManager || isCashier) && (
                  <Link 
                    to="/admin/dat-hang-truoc" 
                    className={`nav-link ${location.pathname === '/admin/dat-hang-truoc' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-calendar-check"></i>
                    Đặt hàng trước
                  </Link>
                )}
                {(isAdmin || isDirector || isManager || isCashier || isCskh || isAccountant) && (
                  <Link 
                    to="/admin/don-hang-online" 
                    className={`nav-link ${location.pathname === '/admin/don-hang-online' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-globe"></i>
                    Đơn hàng Online
                  </Link>
                )}
                {(isAdmin || isDirector || isManager || isCashier || isAccountant) && (
                  <Link 
                    to="/admin/hoa-don" 
                    className={`nav-link ${location.pathname === '/admin/hoa-don' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-file-invoice-dollar"></i>
                    Hóa đơn bán hàng
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ═══ SECTION: HÀNG HÓA & KHO ═══ */}
          <div className="sidebar-section-label">
            <span>Hàng hóa & Kho</span>
          </div>

          {/* NHÓM 2: QUẢN LÝ SẢN PHẨM */}
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
                Danh sách sản phẩm
              </Link>
              <Link 
                to="/admin/loai-san-pham" 
                className={`nav-link ${location.pathname === '/admin/loai-san-pham' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-layer-group"></i>
                Loại sản phẩm
              </Link>
              {(isAdmin || isDirector || isManager || isAccountant) && (
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

          {/* NHÓM 3: QUẢN LÝ KHO */}
          {(isAdmin || isDirector || isManager || isWarehouse) && (
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
          {(isAdmin || isDirector || isManager || isWarehouse) && (
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
                {isManager ? (
                  <Link 
                    to="/admin/nhap-lo-hang" 
                    className={`nav-link ${location.pathname === '/admin/nhap-lo-hang' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-boxes-packing"></i>
                    Tạo đơn nhập hàng
                    <span className="nav-badge nav-badge-hot">QL Chi nhánh</span>
                  </Link>
                ) : isDirector ? (
                  <Link 
                    to="/admin/nhap-lo-hang" 
                    className={`nav-link ${location.pathname === '/admin/nhap-lo-hang' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-clipboard-check"></i>
                    Duyệt yêu cầu nhập
                    <span className="nav-badge nav-badge-info">Giám đốc</span>
                  </Link>
                ) : (
                  <Link 
                    to="/admin/nhap-lo-hang" 
                    className={`nav-link ${location.pathname === '/admin/nhap-lo-hang' ? 'active' : ''}`}
                  >
                    <i className="fa-solid fa-clipboard-check"></i>
                    Đơn nhập hàng
                  </Link>
                )}
                <Link 
                  to="/admin/lo-hang" 
                  className={`nav-link ${location.pathname === '/admin/lo-hang' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-chart-bar"></i>
                  Quản lý lô hàng & HSD
                </Link>
              </div>
            </div>
          )}

          {/* ═══ SECTION: NỘI BỘ ═══ */}
          <div className="sidebar-section-label">
            <span>Nội bộ</span>
          </div>

          {/* NHÓM 5: DUYỆT & KÝ SỔ */}
          {(isAdmin || isDirector || isManager || isAccountant || isWarehouse) && (
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
              {(isAdmin || isDirector || isManager || isAccountant) && (
                <Link 
                  to="/admin/bao-cao" 
                  className={`nav-link ${location.pathname === '/admin/bao-cao' || location.pathname === '/admin' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-chart-pie"></i>
                  Báo cáo thống kê
                </Link>
              )}

              {(isAdmin || isDirector || isManager || isCashier || isCskh) && (
                <Link 
                  to="/admin/khach-hang" 
                  className={`nav-link ${location.pathname === '/admin/khach-hang' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-users"></i>
                  Quản lý khách hàng
                </Link>
              )}

              {(isAdmin || isDirector || isManager) && (
                <Link 
                  to="/admin/nhan-vien" 
                  className={`nav-link ${location.pathname === '/admin/nhan-vien' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-user-tie"></i>
                  Quản lý nhân viên
                </Link>
              )}

              {(isAdmin || isDirector) && (
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
              {(isAdmin || isDirector || isManager || isCskh) && (
                <Link 
                  to="/admin/chat" 
                  className={`nav-link ${location.pathname === '/admin/chat' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-headset"></i>
                  Hỗ trợ trực tuyến
                  <span className="nav-badge nav-badge-live">Live</span>
                </Link>
              )}

              <Link 
                to="/admin/chat-noi-bo" 
                className={`nav-link ${location.pathname === '/admin/chat-noi-bo' ? 'active' : ''}`}
              >
                <i className="fa-solid fa-people-arrows"></i>
                Chat nội bộ
                <span className="nav-badge nav-badge-info">Nhóm</span>
              </Link>

              {(isAdmin || isDirector || isManager || isCskh) && (
                <Link 
                  to="/admin/tin-tuc" 
                  className={`nav-link ${location.pathname === '/admin/tin-tuc' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-newspaper"></i>
                  Quản lý tin tức
                </Link>
              )}

              {(isAdmin || isDirector || isManager || isCskh) && (
                <Link 
                  to="/admin/danh-gia" 
                  className={`nav-link ${location.pathname === '/admin/danh-gia' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-star"></i>
                  Quản lý đánh giá
                </Link>
              )}
            </div>
          </div>

          {/* NHÓM 8: HỆ THỐNG */}
          {(isAdmin || isDirector || isManager) && (
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
                  to="/admin/giam-sat-he-thong" 
                  className={`nav-link ${location.pathname === '/admin/giam-sat-he-thong' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-server"></i>
                  Giám sát & Hiệu năng
                  <span className="nav-badge nav-badge-live">Live</span>
                </Link>

                <Link 
                  to="/admin/phan-tich-nguoi-dung" 
                  className={`nav-link ${location.pathname === '/admin/phan-tich-nguoi-dung' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-chart-simple"></i>
                  Phân tích người dùng & Hành vi
                  <span className="nav-badge nav-badge-info">Analytics</span>
                </Link>

                <Link 
                  to="/admin/nhat-ky-nang-cao" 
                  className={`nav-link ${location.pathname === '/admin/nhat-ky-nang-cao' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-clock-rotate-left"></i>
                  Audit Logs
                  <span className="nav-badge nav-badge-purple">Audit</span>
                </Link>

                <Link 
                  to="/admin/bao-tri-he-thong" 
                  className={`nav-link ${location.pathname === '/admin/bao-tri-he-thong' ? 'active' : ''}`}
                >
                  <i className="fa-solid fa-lock"></i>
                  Bảo trì / Khóa chức năng
                  <span className="nav-badge nav-badge-danger">Lock</span>
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
