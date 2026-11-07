import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import {
  getAllUserAccounts,
  createUserAccount,
  updateUserAccount,
  resetUserPassword,
  toggleUserAccountStatus,
  mapRoleName,
} from '../../services/employeeService';
import { getStores } from '../../services/storeService';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const ROLE_OPTIONS = [
  { id: 1, label: 'Quản trị hệ thống (Admin)', badge: 'admin-badge-danger', group: 'staff' },
  { id: 8, label: 'Ban Giám đốc (Director)', badge: 'admin-badge-primary', group: 'staff' },
  { id: 2, label: 'Quản lý chi nhánh (Manager)', badge: 'admin-badge-warning', group: 'staff' },
  { id: 3, label: 'Nhân viên bán hàng POS (Cashier)', badge: 'admin-badge-info', group: 'staff' },
  { id: 4, label: 'Nhân viên kho (Warehouse)', badge: 'admin-badge-secondary', group: 'staff' },
  { id: 5, label: 'Nhân viên CSKH', badge: 'admin-badge-success', group: 'staff' },
  { id: 7, label: 'Nhân viên kế toán (Accountant)', badge: 'admin-badge-info', group: 'staff' },
  { id: 6, label: 'Khách hàng (Customer)', badge: 'admin-badge-secondary', group: 'customer' },
];

const getRoleBadgeClass = (roleId) => {
  const found = ROLE_OPTIONS.find((r) => Number(r.id) === Number(roleId));
  return found ? found.badge : 'admin-badge-secondary';
};

const getCustomerRank = (points = 0) => {
  const p = Number(points || 0);
  if (p >= 10000) return { name: 'Kim Cương', color: '#0284c7', bg: '#e0f2fe' };
  if (p >= 5000) return { name: 'Vàng', color: '#d97706', bg: '#fef3c7' };
  if (p >= 1000) return { name: 'Bạc', color: '#475569', bg: '#f1f5f9' };
  return { name: 'Đồng', color: '#9a3412', bg: '#ffedd5' };
};

const formatDateStr = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    return '—';
  }
};

const AdminAccountPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' | 'customer'
  const [accounts, setAccounts] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'LOCKED'
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Edit / Create Account Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    password: '',
    hoTen: '',
    soDienThoai: '',
    vaiTroId: 3,
    cuaHangId: 1,
    diemTichLuy: 0,
    trangThai: 1,
  });

  // Change / Reset Password Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUserAccounts();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Lỗi tải danh sách tài khoản:', error);
      toast.error('Không thể tải danh sách tài khoản người dùng!');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    getStores()
      .then((res) => {
        const list = Array.isArray(res) ? res : res?.data || [];
        setStores(
          list.map((st) => ({
            id: st.id || st.MACUAHANG,
            name: st.tenCuaHang || st.name || st.ten_cuahang || st.TENCUAHANG || `Chi nhánh #${st.id}`,
          }))
        );
      })
      .catch(() => {});

    getCurrentUser()
      .then((u) => setCurrentUser(u))
      .catch(() => {});
  }, []);

  // Normalize account helper
  const normalizedAccounts = useMemo(() => {
    return (accounts || []).map((u) => {
      const nd = u.nguoidung || u.nhanvien || u.khachhang || {};
      const roleId = Number(u.vaiTroId ?? 6);
      const isCustomer =
        roleId === 6 ||
        u.loaiTaiKhoan === 'CUSTOMER' ||
        (nd && Number(nd.loaiNguoiDung) === 0 && roleId === 6);
      const isActive = Number(u.trangThai ?? 1) === 1;
      const storeId = u.cuaHangId || nd?.cuaHangId || 1;
      const storeObj = stores.find((s) => Number(s.id) === Number(storeId));
      const storeName =
        u.tenCuaHang ||
        nd?.cuahang?.tenCuaHang ||
        nd?.cuahang?.TENCUAHANG ||
        storeObj?.name ||
        (isCustomer ? 'Khách hàng Online' : 'Chi nhánh trung tâm');

      return {
        id: u.id,
        username: u.username || u.USERNAME || '',
        email: u.email || u.EMAIL || '',
        hoTen: u.hoTen || nd?.hoTen || nd?.HOTEN || u.username || 'Chưa cập nhật',
        soDienThoai: u.soDienThoai || nd?.soDienThoai || nd?.SDT || '',
        vaiTroId: roleId,
        roleLabel: roleId === 6 ? 'Khách hàng' : mapRoleName(u.tenVaiTro || u.vaitro?.tenVaiTro, roleId),
        isCustomer,
        trangThai: isActive ? 1 : 0,
        isActive,
        cuaHangId: storeId,
        tenCuaHang: storeName,
        diemTichLuy: Number(u.diemTichLuy ?? nd?.diemTichLuy ?? 0),
        cccdNumber: u.cccdNumber || nd?.cccdNumber || '',
        createdAt: u.createdAt || u.created_at || nd?.createdAt,
        raw: u,
      };
    });
  }, [accounts, stores]);

  const staffAccounts = useMemo(
    () => normalizedAccounts.filter((a) => !a.isCustomer),
    [normalizedAccounts]
  );

  const customerAccounts = useMemo(
    () => normalizedAccounts.filter((a) => a.isCustomer),
    [normalizedAccounts]
  );

  const displayedAccounts = useMemo(() => {
    const source = activeTab === 'staff' ? staffAccounts : customerAccounts;
    return source.filter((acc) => {
      if (statusFilter === 'ACTIVE' && !acc.isActive) return false;
      if (statusFilter === 'LOCKED' && acc.isActive) return false;
      if (activeTab === 'staff' && roleFilter !== 'ALL' && Number(acc.vaiTroId) !== Number(roleFilter)) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const kw = searchTerm.trim().toLowerCase();
        const matchUser = acc.username.toLowerCase().includes(kw);
        const matchName = acc.hoTen.toLowerCase().includes(kw);
        const matchEmail = acc.email.toLowerCase().includes(kw);
        const matchPhone = acc.soDienThoai.toLowerCase().includes(kw);
        const matchId = String(acc.id).includes(kw);
        return matchUser || matchName || matchEmail || matchPhone || matchId;
      }
      return true;
    });
  }, [activeTab, staffAccounts, customerAccounts, statusFilter, roleFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = normalizedAccounts.length;
    const staffTotal = staffAccounts.length;
    const staffActive = staffAccounts.filter((a) => a.isActive).length;
    const custTotal = customerAccounts.length;
    const custActive = customerAccounts.filter((a) => a.isActive).length;
    const lockedTotal = normalizedAccounts.filter((a) => !a.isActive).length;
    return { total, staffTotal, staffActive, custTotal, custActive, lockedTotal };
  }, [normalizedAccounts, staffAccounts, customerAccounts]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAccount(null);
    const isStaffTab = activeTab === 'staff';
    const randSuffix = Math.floor(10000 + Math.random() * 90000);
    const defaultUsername = isStaffTab ? `nv_${randSuffix}` : `kh_${randSuffix}`;
    setAccountForm({
      username: defaultUsername,
      email: `${defaultUsername}@dolabakery.com`,
      password: defaultUsername,
      hoTen: '',
      soDienThoai: '',
      vaiTroId: isStaffTab ? 3 : 6,
      cuaHangId: stores[0]?.id || 1,
      diemTichLuy: 0,
      trangThai: 1,
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc) => {
    setEditingAccount(acc);
    setAccountForm({
      username: acc.username || '',
      email: acc.email || '',
      password: '',
      hoTen: acc.hoTen || '',
      soDienThoai: acc.soDienThoai || '',
      vaiTroId: acc.vaiTroId || (acc.isCustomer ? 6 : 3),
      cuaHangId: acc.cuaHangId || stores[0]?.id || 1,
      diemTichLuy: acc.diemTichLuy || 0,
      trangThai: acc.trangThai,
    });
    setIsEditModalOpen(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.username.trim()) {
      toast.warning('Vui lòng nhập Tên đăng nhập (Username)!');
      return;
    }
    if (!accountForm.hoTen.trim()) {
      toast.warning('Vui lòng nhập Họ và tên người dùng!');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        username: accountForm.username.trim(),
        email: accountForm.email.trim(),
        hoTen: accountForm.hoTen.trim(),
        soDienThoai: accountForm.soDienThoai.trim(),
        vaiTroId: Number(accountForm.vaiTroId),
        cuaHangId: Number(accountForm.cuaHangId),
        diemTichLuy: Number(accountForm.diemTichLuy || 0),
        trangThai: Number(accountForm.trangThai),
      };
      if (accountForm.password && accountForm.password.trim() !== '') {
        payload.password = accountForm.password.trim();
      }

      if (editingAccount) {
        const res = await updateUserAccount(editingAccount.id, payload);
        toast.success(res?.message || `Đã cập nhật tài khoản [${payload.username}] thành công!`);
      } else {
        const res = await createUserAccount(payload);
        toast.success(res?.message || `Đã tạo tài khoản [${payload.username}] thành công!`);
      }
      setIsEditModalOpen(false);
      await fetchAccounts();
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Có lỗi xảy ra khi lưu tài khoản';
      toast.error(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Open Change/Reset Password Modal
  const handleOpenPasswordModal = (acc) => {
    setPasswordTarget(acc);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordText(true);
    setIsPasswordModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pass);
    setConfirmPassword(pass);
    setShowPasswordText(true);
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!passwordTarget) return;
    if (!newPassword || newPassword.trim().length < 3) {
      toast.warning('Mật khẩu mới phải có ít nhất 3 ký tự!');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Mật khẩu xác nhận không khớp!');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await resetUserPassword(passwordTarget.id, {
        password: newPassword.trim(),
      });
      toast.success(res?.message || `Đã đổi mật khẩu cho tài khoản [${passwordTarget.username}]!`);
      setIsPasswordModalOpen(false);
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Không thể cập nhật mật khẩu';
      toast.error(errMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleResetDefaultPassword = async () => {
    if (!passwordTarget) return;
    if (
      !window.confirm(
        `Bạn có chắc muốn đặt lại mật khẩu của tài khoản "${passwordTarget.username}" về mặc định (trùng với tên đăng nhập "${passwordTarget.username}")?`
      )
    ) {
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await resetUserPassword(passwordTarget.id, {
        reset_to_default: true,
      });
      toast.success(
        res?.message ||
          `Đã đặt lại mật khẩu mặc định (${passwordTarget.username}) cho tài khoản [${passwordTarget.username}]!`
      );
      setIsPasswordModalOpen(false);
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Không thể đặt lại mật khẩu';
      toast.error(errMsg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Lock / Unlock Account
  const handleToggleLock = async (acc) => {
    if (currentUser && (currentUser.id === acc.id || currentUser.username === acc.username)) {
      toast.warning('Bạn không thể tự khóa tài khoản đang đăng nhập của chính mình!');
      return;
    }

    const actionText = acc.isActive ? 'KHÓA (vô hiệu hóa đăng nhập)' : 'MỞ KHÓA (kích hoạt lại)';
    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản "${acc.username}" (${acc.hoTen})?`)) {
      return;
    }

    try {
      const targetStatus = acc.isActive ? 0 : 1;
      const res = await toggleUserAccountStatus(acc.id, targetStatus);
      toast.success(res?.message || `Đã cập nhật trạng thái tài khoản [${acc.username}]!`);
      await fetchAccounts();
    } catch (error) {
      const errMsg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Lỗi khi thay đổi trạng thái tài khoản';
      toast.error(errMsg);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="admin-flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: '4px' }}>
            <i className="fa-solid fa-users-gear" style={{ marginRight: '10px', color: 'var(--primary-color)' }}></i>
            Quản lý Tài khoản Hệ thống (Users)
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
            Quản trị tập trung tài khoản Nhân viên và Khách hàng: chỉnh sửa thông tin, phân quyền, cấp lại mật khẩu và khóa/mở khóa tài khoản.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchAccounts}
            disabled={isLoading}
          >
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ marginRight: '6px' }}></i>
            Làm mới
          </button>
          <button type="button" className="admin-btn admin-btn-primary" onClick={handleOpenCreateModal}>
            <i className="fa-solid fa-user-plus" style={{ marginRight: '6px' }}></i>
            + Tạo tài khoản {activeTab === 'staff' ? 'Nhân viên' : 'Khách hàng'}
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="admin-card"
          style={{
            marginBottom: 0,
            padding: '16px 18px',
            borderLeft: '4px solid #2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Tổng tài khoản User
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#1e293b', marginTop: '4px' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '12px', color: '#16a34a', marginTop: '2px' }}>
              {stats.total - stats.lockedTotal} đang hoạt động
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#dbeafe',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <i className="fa-solid fa-users"></i>
          </div>
        </div>

        <div
          className="admin-card"
          onClick={() => setActiveTab('staff')}
          style={{
            marginBottom: 0,
            padding: '16px 18px',
            borderLeft: '4px solid #0d9488',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Tài khoản Nhân viên
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f766e', marginTop: '4px' }}>
              {stats.staffTotal}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Hoạt động: <b>{stats.staffActive}</b> / Khóa: <b>{stats.staffTotal - stats.staffActive}</b>
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ccfbf1',
              color: '#0d9488',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <i className="fa-solid fa-user-tie"></i>
          </div>
        </div>

        <div
          className="admin-card"
          onClick={() => setActiveTab('customer')}
          style={{
            marginBottom: 0,
            padding: '16px 18px',
            borderLeft: '4px solid #d97706',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Tài khoản Khách hàng
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#b45309', marginTop: '4px' }}>
              {stats.custTotal}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Hoạt động: <b>{stats.custActive}</b> / Khóa: <b>{stats.custTotal - stats.custActive}</b>
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <i className="fa-solid fa-user-check"></i>
          </div>
        </div>

        <div
          className="admin-card"
          onClick={() => setStatusFilter(statusFilter === 'LOCKED' ? 'ALL' : 'LOCKED')}
          style={{
            marginBottom: 0,
            padding: '16px 18px',
            borderLeft: '4px solid #dc2626',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Tài khoản Đang Khóa
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>
              {stats.lockedTotal}
            </div>
            <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '2px' }}>
              {statusFilter === 'LOCKED' ? 'Đang lọc TK bị khóa (Bấm để bỏ lọc)' : 'Bấm để xem các TK bị khóa'}
            </div>
          </div>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
            }}
          >
            <i className="fa-solid fa-user-lock"></i>
          </div>
        </div>
      </div>

      {/* Tabs: Tài khoản Nhân viên vs Tài khoản Khách hàng */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('staff');
            setRoleFilter('ALL');
          }}
          style={{
            padding: '11px 22px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            border: activeTab === 'staff' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
            backgroundColor: activeTab === 'staff' ? 'var(--primary-color)' : '#fff',
            color: activeTab === 'staff' ? '#fff' : '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'staff' ? '0 4px 12px rgba(200, 31, 52, 0.25)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <i className="fa-solid fa-user-shield"></i>
          <span>Tài khoản Nhân viên</span>
          <span
            style={{
              backgroundColor: activeTab === 'staff' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
              color: activeTab === 'staff' ? '#fff' : '#334155',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            {stats.staffTotal}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('customer');
            setRoleFilter('ALL');
          }}
          style={{
            padding: '11px 22px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            border: activeTab === 'customer' ? '2px solid var(--primary-color)' : '1px solid #cbd5e1',
            backgroundColor: activeTab === 'customer' ? 'var(--primary-color)' : '#fff',
            color: activeTab === 'customer' ? '#fff' : '#334155',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: activeTab === 'customer' ? '0 4px 12px rgba(200, 31, 52, 0.25)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          <i className="fa-solid fa-users"></i>
          <span>Tài khoản Khách hàng</span>
          <span
            style={{
              backgroundColor: activeTab === 'customer' ? 'rgba(255,255,255,0.22)' : '#e2e8f0',
              color: activeTab === 'customer' ? '#fff' : '#334155',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
            }}
          >
            {stats.custTotal}
          </span>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="admin-card">
        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '1rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '280px', flex: '1 1 280px', maxWidth: '420px' }}>
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              ></i>
              <input
                type="text"
                className="admin-input"
                placeholder={
                  activeTab === 'staff'
                    ? 'Tìm theo Username, Họ tên nhân viên, Email, SĐT...'
                    : 'Tìm theo Username, Họ tên khách hàng, Email, SĐT...'
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ marginBottom: 0, paddingLeft: '36px' }}
              />
            </div>

            {activeTab === 'staff' && (
              <select
                className="admin-input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: '230px', marginBottom: 0 }}
              >
                <option value="ALL">-- Tất cả vai trò nhân sự --</option>
                {ROLE_OPTIONS.filter((r) => r.group === 'staff').map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            )}

            <select
              className="admin-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '190px', marginBottom: 0 }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Đang hoạt động</option>
              <option value="LOCKED">🔴 Đã khóa</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || roleFilter !== 'ALL') && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setRoleFilter('ALL');
                }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
            Hiển thị <b>{displayedAccounts.length}</b> tài khoản
          </div>
        </div>

        {/* Table */}
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>ID</th>
                <th>Tên đăng nhập (Username)</th>
                <th>{activeTab === 'staff' ? 'Họ tên Nhân viên' : 'Họ tên Khách hàng'}</th>
                <th>Email & SĐT</th>
                {activeTab === 'staff' ? (
                  <>
                    <th>Vai trò hệ thống</th>
                    <th>Chi nhánh</th>
                  </>
                ) : (
                  <th>Điểm & Hạng TV</th>
                )}
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th style={{ textAlign: 'center', minWidth: '250px' }}>Thao tác quản trị</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === 'staff' ? 9 : 8} style={{ textAlign: 'center', padding: '32px' }}>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i>
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : displayedAccounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === 'staff' ? 9 : 8}
                    style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}
                  >
                    Không tìm thấy tài khoản nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                displayedAccounts.map((acc) => {
                  const isSelf =
                    currentUser &&
                    (Number(currentUser.id) === Number(acc.id) ||
                      String(currentUser.username).toLowerCase() === String(acc.username).toLowerCase());
                  const rankInfo = getCustomerRank(acc.diemTichLuy);

                  return (
                    <tr
                      key={acc.id || acc.username}
                      style={{
                        backgroundColor: !acc.isActive ? '#fff5f5' : 'transparent',
                        opacity: !acc.isActive ? 0.85 : 1,
                      }}
                    >
                      <td>
                        <span style={{ fontWeight: 700, color: '#64748b' }}>#{acc.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <code
                            style={{
                              backgroundColor: '#f1f5f9',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              color: '#0f172a',
                              fontSize: '13px',
                            }}
                          >
                            {acc.username}
                          </code>
                          {isSelf && (
                            <span
                              style={{
                                fontSize: '10px',
                                background: '#dbeafe',
                                color: '#1d4ed8',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontWeight: 700,
                              }}
                            >
                              Bạn
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{acc.hoTen}</div>
                        {acc.cccdNumber && (
                          <div style={{ fontSize: '11px', color: '#64748b' }}>CCCD: {acc.cccdNumber}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', color: '#334155' }}>
                          <i className="fa-regular fa-envelope" style={{ marginRight: '5px', color: '#94a3b8' }}></i>
                          {acc.email || '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                          <i className="fa-solid fa-phone" style={{ marginRight: '5px', color: '#94a3b8' }}></i>
                          {acc.soDienThoai || 'Chưa cập nhật'}
                        </div>
                      </td>

                      {activeTab === 'staff' ? (
                        <>
                          <td>
                            <span className={`admin-badge ${getRoleBadgeClass(acc.vaiTroId)}`}>
                              {acc.roleLabel}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>
                            {acc.tenCuaHang}
                          </td>
                        </>
                      ) : (
                        <td>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: 700,
                              backgroundColor: rankInfo.bg,
                              color: rankInfo.color,
                              marginRight: '6px',
                            }}
                          >
                            {rankInfo.name}
                          </span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            ({Number(acc.diemTichLuy || 0).toLocaleString('vi-VN')} điểm)
                          </span>
                        </td>
                      )}

                      <td style={{ fontSize: '12px', color: '#64748b' }}>{formatDateStr(acc.createdAt)}</td>

                      <td>
                        {acc.isActive ? (
                          <span className="admin-badge admin-badge-success">
                            <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i>
                            Hoạt động
                          </span>
                        ) : (
                          <span className="admin-badge admin-badge-danger">
                            <i className="fa-solid fa-lock" style={{ marginRight: '4px' }}></i>
                            Đã khóa
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-info"
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            title="Chỉnh sửa thông tin tài khoản & phân quyền"
                            onClick={() => handleOpenEditModal(acc)}
                          >
                            <i className="fa-solid fa-pen-to-square" style={{ marginRight: '4px' }}></i>
                            Sửa
                          </button>

                          <button
                            type="button"
                            className="admin-btn admin-btn-warning"
                            style={{
                              padding: '5px 10px',
                              fontSize: '12px',
                              backgroundColor: '#f59e0b',
                              color: '#fff',
                              border: 'none',
                            }}
                            title="Thay đổi hoặc cấp lại mật khẩu"
                            onClick={() => handleOpenPasswordModal(acc)}
                          >
                            <i className="fa-solid fa-key" style={{ marginRight: '4px' }}></i>
                            Đổi MK
                          </button>

                          <button
                            type="button"
                            className={`admin-btn ${acc.isActive ? 'admin-btn-danger' : 'admin-btn-success'}`}
                            style={{ padding: '5px 10px', fontSize: '12px' }}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? 'Không thể tự khóa tài khoản của chính mình'
                                : acc.isActive
                                ? 'Khóa tài khoản này'
                                : 'Mở khóa tài khoản này'
                            }
                            onClick={() => handleToggleLock(acc)}
                          >
                            <i
                              className={`fa-solid ${acc.isActive ? 'fa-lock' : 'fa-lock-open'}`}
                              style={{ marginRight: '4px' }}
                            ></i>
                            {acc.isActive ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: TẠO / CHỈNH SỬA TÀI KHOẢN USER */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div className="admin-flex-between" style={{ marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                <i className="fa-solid fa-user-pen" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                {editingAccount
                  ? `Chỉnh sửa Tài khoản #${editingAccount.id} (${editingAccount.username})`
                  : `Tạo Tài khoản ${activeTab === 'staff' ? 'Nhân viên' : 'Khách hàng'} Mới`}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveAccount}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="admin-label">Tên đăng nhập (Username) *</label>
                  <input
                    type="text"
                    className="admin-input"
                    required
                    value={accountForm.username}
                    onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                    placeholder="VD: nv_banhang01"
                  />
                </div>

                <div>
                  <label className="admin-label">Email đăng nhập / Khôi phục *</label>
                  <input
                    type="email"
                    className="admin-input"
                    required
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    placeholder="example@dolabakery.com"
                  />
                </div>

                <div>
                  <label className="admin-label">Họ và tên người dùng *</label>
                  <input
                    type="text"
                    className="admin-input"
                    required
                    value={accountForm.hoTen}
                    onChange={(e) => setAccountForm({ ...accountForm, hoTen: e.target.value })}
                    placeholder="Nhập họ và tên..."
                  />
                </div>

                <div>
                  <label className="admin-label">Số điện thoại</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={accountForm.soDienThoai}
                    onChange={(e) => setAccountForm({ ...accountForm, soDienThoai: e.target.value })}
                    placeholder="090xxxxxxx"
                  />
                </div>

                <div>
                  <label className="admin-label">Vai trò / Nhóm tài khoản *</label>
                  <select
                    className="admin-input"
                    value={accountForm.vaiTroId}
                    onChange={(e) => setAccountForm({ ...accountForm, vaiTroId: Number(e.target.value) })}
                  >
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="admin-label">Trạng thái tài khoản *</label>
                  <select
                    className="admin-input"
                    value={accountForm.trangThai}
                    onChange={(e) => setAccountForm({ ...accountForm, trangThai: Number(e.target.value) })}
                  >
                    <option value={1}>🟢 Đang hoạt động (Cho phép đăng nhập)</option>
                    <option value={0}>🔴 Đã khóa (Chặn đăng nhập)</option>
                  </select>
                </div>

                {Number(accountForm.vaiTroId) !== 6 ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">Chi nhánh làm việc</label>
                    <select
                      className="admin-input"
                      value={accountForm.cuaHangId}
                      onChange={(e) => setAccountForm({ ...accountForm, cuaHangId: Number(e.target.value) })}
                    >
                      {stores.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">Điểm tích lũy khách hàng</label>
                    <input
                      type="number"
                      min="0"
                      className="admin-input"
                      value={accountForm.diemTichLuy}
                      onChange={(e) => setAccountForm({ ...accountForm, diemTichLuy: Number(e.target.value) })}
                    />
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">
                    {editingAccount
                      ? 'Mật khẩu mới (Để trống nếu giữ nguyên mật khẩu hiện tại)'
                      : 'Mật khẩu khởi tạo *'}
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    required={!editingAccount}
                    value={accountForm.password}
                    onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                    placeholder={
                      editingAccount
                        ? 'Nhập mật khẩu mới nếu muốn thay đổi ngay...'
                        : 'Nhập mật khẩu khởi tạo cho tài khoản...'
                    }
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={isSaving}>
                  <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                  {isSaving ? 'Đang lưu...' : editingAccount ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ĐỔI / CẤP LẠI MẬT KHẨU */}
      {isPasswordModalOpen && passwordTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div className="admin-flex-between" style={{ marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>
                <i className="fa-solid fa-key" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
                Đổi / Cấp lại mật khẩu User
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                Tài khoản: <strong style={{ color: '#0f172a' }}>{passwordTarget.username}</strong> (#{passwordTarget.id})
              </div>
              <div style={{ marginTop: '4px' }}>
                Họ tên: <strong>{passwordTarget.hoTen}</strong> — Vai trò: <strong>{passwordTarget.roleLabel}</strong>
              </div>
            </div>

            <form onSubmit={handleSaveNewPassword}>
              <div style={{ marginBottom: '12px' }}>
                <div className="admin-flex-between" style={{ marginBottom: '6px' }}>
                  <label className="admin-label" style={{ marginBottom: 0 }}>
                    Mật khẩu mới *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPassword}
                      style={{
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      🎲 Tạo mật khẩu ngẫu nhiên
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordText(!showPasswordText)}
                      style={{
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {showPasswordText ? 'Ẩn' : 'Hiện'}
                    </button>
                  </div>
                </div>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  className="admin-input"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label className="admin-label">Xác nhận mật khẩu mới *</label>
                <input
                  type={showPasswordText ? 'text' : 'password'}
                  className="admin-input"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới..."
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  paddingTop: '12px',
                  borderTop: '1px solid #e2e8f0',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={handleResetDefaultPassword}
                  disabled={isUpdatingPassword}
                  style={{
                    backgroundColor: '#fff7ed',
                    color: '#c2410c',
                    border: '1px solid #fed7aa',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  🔄 Đặt về mặc định ({passwordTarget.username})
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-secondary"
                    onClick={() => setIsPasswordModalOpen(false)}
                  >
                    Đóng
                  </button>
                  <button type="submit" className="admin-btn admin-btn-primary" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminAccountPage;
