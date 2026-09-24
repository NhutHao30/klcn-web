import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getCurrentUser, updateProfile } from '../../services/authService';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';
import SignatureCanvas from '../../components/Signature/SignatureCanvas';
import '../../css/admin.css';

const AdminProfilePage = () => {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureData, setSignatureData] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    HOTEN: '',
    SDT: '',
    DIACHI: '',
    GioiTinh: '',
    NGAYSINH: '',
    EMAIL: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Change password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      const nv = userData.nhanvien || userData.khachhang || {};
      setFormData({
        HOTEN: nv.HOTEN || userData.HOTEN || '',
        SDT: nv.SDT || userData.SDT || '',
        DIACHI: nv.DIACHI || userData.DIACHI || '',
        GioiTinh: nv.GioiTinh || userData.GioiTinh || 'Nam',
        NGAYSINH: nv.NGAYSINH ? String(nv.NGAYSINH).split('T')[0] : '',
        EMAIL: userData.EMAIL || nv.EMAIL || ''
      });
      if (nv.HINHANH) setAvatarPreview(nv.HINHANH);
    } catch (e) {
      toast.error('Không thể tải thông tin cá nhân: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('HOTEN', formData.HOTEN);
      payload.append('SDT', formData.SDT);
      payload.append('EMAIL', formData.EMAIL);
      payload.append('DIACHI', formData.DIACHI);
      payload.append('GioiTinh', formData.GioiTinh);
      if (formData.NGAYSINH) payload.append('NGAYSINH', formData.NGAYSINH);
      if (avatarFile) payload.append('HINHANH', avatarFile);

      const res = await updateProfile(payload);
      toast.success(res.message || 'Cập nhật thông tin thành công!');
      fetchProfile();
    } catch (e) {
      toast.error('Lỗi khi lưu thông tin: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSignature = async () => {
    if (!signatureData) {
      toast.warning('Vui lòng vẽ chữ ký số trước khi lưu!');
      return;
    }
    setIsSavingSignature(true);
    try {
      const res = await axiosClient.post('/profile/chu-ky', { chu_ky: signatureData });
      if (res.data?.status || res.data?.message) {
        toast.success('Đã lưu chữ ký số cá nhân thành công!');
        fetchProfile();
      }
    } catch (e) {
      toast.error('Lỗi khi lưu chữ ký: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleRequestOtp = async () => {
    const emailToUse = formData.EMAIL || user?.EMAIL;
    if (!emailToUse) {
      toast.warning('Vui lòng cập nhật email trước khi đổi mật khẩu.');
      return;
    }
    setIsSendingPasswordOtp(true);
    try {
      const { forgotPassword } = await import('../../services/authService');
      await forgotPassword(emailToUse);
      setPasswordOtpSent(true);
      toast.success('Mã OTP đã được gửi đến email ' + emailToUse);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Lỗi gửi mã OTP.');
    } finally {
      setIsSendingPasswordOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordOtp || !newPassword) {
      toast.warning('Vui lòng điền đầy đủ mã OTP và mật khẩu mới!');
      return;
    }
    setIsChangingPassword(true);
    const emailToUse = formData.EMAIL || user?.EMAIL;
    try {
      const { resetPassword } = await import('../../services/authService');
      await resetPassword(emailToUse, passwordOtp, newPassword);
      toast.success('Đổi mật khẩu thành công!');
      setShowPasswordModal(false);
      setPasswordOtpSent(false);
      setPasswordOtp('');
      setNewPassword('');
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getRoleBadge = (marole) => {
    switch (Number(marole)) {
      case 0: return <span className="admin-badge admin-badge-danger">Quản trị viên (Admin)</span>;
      case 1: return <span className="admin-badge admin-badge-primary">Quản lý (Manager)</span>;
      case 2: return <span className="admin-badge admin-badge-success">Thu ngân (Cashier)</span>;
      case 4: return <span className="admin-badge admin-badge-info">Nhân viên kho (Stockist)</span>;
      default: return <span className="admin-badge admin-badge-warning">Khách hàng / Nhân viên</span>;
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '50px 0', color: '#666' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)', marginBottom: '12px' }}></i>
          <p>Đang tải thông tin cá nhân...</p>
        </div>
      </AdminLayout>
    );
  }

  const employeeData = user?.nhanvien || {};

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Hồ Sơ Cá Nhân Administrator</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Quản lý thông tin tài khoản, chữ ký số và bảo mật cá nhân</p>
        </div>
        <button
          className="admin-btn admin-btn-secondary"
          onClick={() => setShowPasswordModal(true)}
        >
          <i className="fa-solid fa-key" style={{ marginRight: '6px' }}></i> Đổi Mật Khẩu
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: Avatar & Account Info */}
        <div>
          <div className="admin-card" style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px', margin: '0 auto 1rem auto' }}>
              <img
                src={avatarPreview || 'https://via.placeholder.com/130?text=Avatar'}
                alt="Avatar"
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--admin-primary)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(formData.HOTEN || 'User'); }}
              />
              <label
                htmlFor="avatar-upload"
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  backgroundColor: 'var(--admin-primary)',
                  color: '#fff',
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
                title="Tải ảnh đại diện mới"
              >
                <i className="fa-solid fa-camera" style={{ fontSize: '14px' }}></i>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
            </div>

            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 'bold' }}>
              {formData.HOTEN || user?.USERNAME || 'Tài khoản Quản trị'}
            </h3>
            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '13px' }}>
              @{user?.USERNAME || 'admin'}
            </p>

            <div style={{ marginBottom: '1rem' }}>
              {getRoleBadge(user?.MAROLE)}
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '1rem', textAlign: 'left', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <span style={{ color: '#888' }}>Mã nhân viên: </span>
                <b>{employeeData.MANV || user?.MANV || 'NV-ADMIN'}</b>
              </div>
              <div>
                <span style={{ color: '#888' }}>Email: </span>
                <b>{formData.EMAIL || user?.EMAIL || 'Chưa cập nhật'}</b>
              </div>
              <div>
                <span style={{ color: '#888' }}>Số điện thoại: </span>
                <b>{formData.SDT || 'Chưa cập nhật'}</b>
              </div>
              {employeeData.cuahang && (
                <div>
                  <span style={{ color: '#888' }}>Chi nhánh: </span>
                  <b>{employeeData.cuahang.TENCUAHANG}</b>
                </div>
              )}
            </div>
          </div>

          {/* Chữ ký số hiện tại */}
          <div className="admin-card" style={{ marginTop: '1.5rem' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '15px' }}>
              <i className="fa-solid fa-file-signature" style={{ marginRight: '6px', color: 'var(--admin-primary)' }}></i>
              Chữ Ký Số Đã Lưu
            </h4>
            {employeeData.CHU_KY ? (
              <div style={{ textAlign: 'center', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                <img
                  src={employeeData.CHU_KY}
                  alt="Chữ ký số"
                  style={{ maxHeight: '100px', maxWidth: '100%', objectFit: 'contain' }}
                />
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#16a34a' }}>
                  <i className="fa-solid fa-circle-check" style={{ marginRight: '4px' }}></i> Chữ ký số đang có hiệu lực
                </p>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, fontStyle: 'italic' }}>
                Chưa có chữ ký số cá nhân. Vui lòng ký vào ô bên phải để khởi tạo.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Profile Edit Form & Signature Canvas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Edit Form */}
          <div className="admin-card">
            <h2 className="admin-card-title">Cập Nhật Thông Tin Cá Nhân</h2>
            <form onSubmit={handleSaveProfile}>
              <div className="admin-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Họ và Tên <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.HOTEN}
                    onChange={(e) => setFormData({ ...formData, HOTEN: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Email Liên Hệ <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="email"
                    className="admin-input"
                    value={formData.EMAIL}
                    onChange={(e) => setFormData({ ...formData, EMAIL: e.target.value })}
                    placeholder="VD: admin@dolabakery.com"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Số Điện Thoại <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.SDT}
                    onChange={(e) => setFormData({ ...formData, SDT: e.target.value })}
                    placeholder="VD: 0901234567"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Giới Tính</label>
                  <select
                    className="admin-select"
                    value={formData.GioiTinh}
                    onChange={(e) => setFormData({ ...formData, GioiTinh: e.target.value })}
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Ngày Sinh</label>
                  <input
                    type="date"
                    className="admin-input"
                    value={formData.NGAYSINH}
                    onChange={(e) => setFormData({ ...formData, NGAYSINH: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Địa Chỉ Thường Trú</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.DIACHI}
                    onChange={(e) => setFormData({ ...formData, DIACHI: e.target.value })}
                    placeholder="Nhập địa chỉ đầy đủ"
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right', marginTop: '1.2rem' }}>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i> Lưu Thay Đổi
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Digital Signature Canvas Form */}
          <div className="admin-card">
            <h2 className="admin-card-title">Cập Nhật Chữ Ký Số Cá Nhân</h2>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-8px', marginBottom: '1rem' }}>
              Chữ ký số sẽ được tự động gắn vào các phiếu duyệt, biên bản giao nhận và hóa đơn bán hàng trực tiếp.
            </p>

            <SignatureCanvas
              onSave={(data) => setSignatureData(data)}
              initialSignature={employeeData.CHU_KY}
              height={160}
            />

            <div style={{ textAlign: 'right', marginTop: '1rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-success"
                onClick={handleSaveSignature}
                disabled={isSavingSignature}
              >
                {isSavingSignature ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Đang lưu chữ ký...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-signature" style={{ marginRight: '6px' }}></i> Lưu Chữ Ký Số
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="admin-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Đổi Mật Khẩu Tài Khoản</h3>
              <button className="admin-modal-close" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>

            <div className="admin-modal-body">
              <p style={{ color: '#666', fontSize: '13px', marginBottom: '1rem' }}>
                Mã xác thực OTP sẽ được gửi tới Email: <b>{formData.EMAIL || user?.EMAIL}</b>
              </p>

              {!passwordOtpSent ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <button
                    type="button"
                    className="admin-btn admin-btn-primary"
                    onClick={handleRequestOtp}
                    disabled={isSendingPasswordOtp}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    {isSendingPasswordOtp ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Đang gửi mã OTP...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane" style={{ marginRight: '6px' }}></i> Gửi Mã OTP Xác Thực
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="admin-form-group">
                    <label className="admin-label">Mã OTP (6 chữ số) <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="text"
                      className="admin-input"
                      value={passwordOtp}
                      onChange={(e) => setPasswordOtp(e.target.value)}
                      placeholder="Nhập mã OTP từ Email"
                      maxLength={6}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-label">Mật Khẩu Mới <span style={{ color: 'red' }}>*</span></label>
                    <input
                      type="password"
                      className="admin-input"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Hủy
              </button>
              {passwordOtpSent && (
                <button
                  className="admin-btn admin-btn-primary"
                  onClick={handleChangePassword}
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? 'Đang đổi...' : 'Đổi Mật Khẩu'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminProfilePage;
