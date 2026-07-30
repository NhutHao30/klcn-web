import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile } from '../services/authService';
import axiosClient from '../services/axiosClient';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    HOTEN: '', SDT: '', DIACHI: '', GioiTinh: '', NGAYSINH: '', EMAIL: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cccdTruocFile, setCccdTruocFile] = useState(null);
  const [cccdSauFile, setCccdSauFile] = useState(null);
  const [cccdTruocPreview, setCccdTruocPreview] = useState(null);
  const [cccdSauPreview, setCccdSauPreview] = useState(null);

  // Change password state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isEmployee = user && [0, 1, 2, 4].includes(Number(user.MAROLE));
  const isCustomer = user && Number(user.MAROLE) === 3;

  const handleRequestPasswordOtp = async () => {
    const emailToUse = user?.EMAIL || formData.EMAIL;
    if (!emailToUse) {
      alert("Vui lòng cập nhật địa chỉ Email trước khi thực hiện đổi mật khẩu.");
      return;
    }
    setIsSendingPasswordOtp(true);
    try {
        const { forgotPassword } = await import('../services/authService');
        await forgotPassword(emailToUse);
        setPasswordOtpSent(true);
        alert("Đã gửi mã OTP đến email của bạn.");
    } catch(e) {
        alert(e.response?.data?.error || "Lỗi khi gửi OTP.");
    } finally {
        setIsSendingPasswordOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordOtp || !newPassword) {
        alert("Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.");
        return;
    }
    setIsChangingPassword(true);
    const emailToUse = user?.EMAIL || formData.EMAIL;
    try {
        const { resetPassword } = await import('../services/authService');
        await resetPassword(emailToUse, passwordOtp, newPassword);
        alert("Đổi mật khẩu thành công!");
        setShowPasswordChange(false);
        setPasswordOtpSent(false);
        setPasswordOtp('');
        setNewPassword('');
    } catch(e) {
        alert(e.response?.data?.error || "Mã OTP không chính xác.");
    } finally {
        setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (Number(userData.MAROLE) === 3 && userData.khachhang) {
          setProfileData(userData.khachhang);
          setFormData({
            HOTEN: userData.khachhang.HOTEN || '',
            SDT: userData.khachhang.SDT || '',
            DIACHI: userData.khachhang.DIACHI || '',
            GioiTinh: userData.khachhang.GioiTinh || '',
            NGAYSINH: userData.khachhang.NGAYSINH || '',
            EMAIL: userData.EMAIL || ''
          });
        } else if (userData.nhanvien) {
          setProfileData(userData.nhanvien);
          setFormData({
            HOTEN: userData.nhanvien.HOTEN || '',
            SDT: userData.nhanvien.SDT || '',
            DIACHI: userData.nhanvien.DIACHI || '',
            GioiTinh: userData.nhanvien.GioiTinh || '',
            NGAYSINH: userData.nhanvien.NGAYSINH || '',
            EMAIL: userData.EMAIL || ''
          });
        }
      } catch (e) {
        navigate('/dang-nhap');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  // Fetch orders for customer
  useEffect(() => {
    if (isCustomer) {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        try {
          const res = await axiosClient.get('/my-orders');
          const data = res.data;
          setOrders(data?.content || data?.data || (Array.isArray(data) ? data : []));
        } catch (e) {
          console.error('Lỗi lấy đơn hàng:', e);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [isCustomer]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === 'CCCD_TRUOC') {
      setCccdTruocFile(file);
      setCccdTruocPreview(preview);
    } else if (type === 'AVATAR') {
      setAvatarFile(file);
      setAvatarPreview(preview);
    } else if (type === 'CCCD_SAU') {
      setCccdSauFile(file);
      setCccdSauPreview(preview);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = new FormData();
      payload.append('HOTEN', formData.HOTEN);
      payload.append('SDT', formData.SDT || '');
      payload.append('DIACHI', formData.DIACHI || '');
      payload.append('GioiTinh', formData.GioiTinh || '');
      payload.append('NGAYSINH', formData.NGAYSINH || '');
      payload.append('EMAIL', formData.EMAIL || '');

      if (avatarFile) payload.append('AVATAR', avatarFile);

      if (cccdTruocFile) payload.append('CCCD_TRUOC', cccdTruocFile);
      if (cccdSauFile) payload.append('CCCD_SAU', cccdSauFile);

      await updateProfile(payload);
      alert('Cập nhật thông tin thành công!');
      setIsEditing(false);
      // Reload profile
      const userData = await getCurrentUser();
      setUser(userData);
      setProfileData(Number(userData.MAROLE) === 3 ? userData.khachhang : userData.nhanvien);
      setCccdTruocFile(null);
      setCccdSauFile(null);
      setCccdTruocPreview(null);
      setCccdSauPreview(null);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (role) => {
    const roles = { 0: 'Quản lý tổng', 1: 'Quản lý chi nhánh', 2: 'Nhân viên bán hàng', 3: 'Khách hàng', 4: 'CSKH' };
    return roles[role] || 'Không xác định';
  };

  const getMembershipRank = (points) => {
    if (points >= 1000) return { name: 'Thách đấu', color: '#e74c3c', icon: '🏆' };
    if (points >= 500) return { name: 'Kim cương', color: '#3498db', icon: '💎' };
    if (points >= 200) return { name: 'Vàng', color: '#f39c12', icon: '🥇' };
    if (points >= 50) return { name: 'Bạc', color: '#95a5a6', icon: '🥈' };
    return { name: 'Đồng', color: '#cd7f32', icon: '🥉' };
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts[parts.length - 1]?.charAt(0)?.toUpperCase() || '?';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Chưa cập nhật';
    return new Date(dateStr).toLocaleDateString('vi-VN');
  };

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <i className="fa fa-spinner fa-spin" style={{ fontSize: '40px', color: 'var(--primary-color)' }}></i>
        <p style={{ color: '#666', marginTop: '10px' }}>Đang tải thông tin...</p>
      </div>
    );
  }

  if (!user || !profileData) {
    return (
      <div style={styles.loadingContainer}>
        <p>Không thể tải thông tin. <Link to="/dang-nhap">Đăng nhập lại</Link></p>
      </div>
    );
  }

  const rank = isCustomer ? getMembershipRank(profileData.DIEMTICHLUY || 0) : null;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageWrapper}>

        {/* ===== HERO SECTION ===== */}
        <div style={styles.heroSection}>
          <div style={styles.heroOverlay}></div>
          <div style={styles.heroContent}>
            <div style={styles.avatarWrapper}>
              {isEditing ? (
                <label style={{ ...styles.avatar, cursor: 'pointer', position: 'relative' }}>
                  {avatarPreview || user?.AVATAR ? (
                    <img src={avatarPreview || (user.AVATAR.startsWith('http') ? user.AVATAR : `../../assets/IMG/${user.AVATAR.split('/').pop()}`)} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(profileData.HOTEN)
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--primary-color)', color: '#fff', padding: '6px', borderRadius: '50%', fontSize: '14px' }}>
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'AVATAR')} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={styles.avatar}>
                  {user?.AVATAR ? (
                    <img src={user.AVATAR.startsWith('http') ? user.AVATAR : `../../assets/IMG/${user.AVATAR.split('/').pop()}`} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    getInitials(profileData.HOTEN)
                  )}
                </div>
              )}
              {isCustomer && rank && (
                <span style={{ ...styles.rankBadge, backgroundColor: rank.color }}>
                  {rank.icon} {rank.name}
                </span>
              )}
            </div>
            <h1 style={styles.heroName}>{profileData.HOTEN || 'Chưa cập nhật'}</h1>
            <p style={styles.heroRole}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i>
              {getRoleName(Number(user.MAROLE))}
            </p>
            <p style={styles.heroId}>
              {isEmployee ? `Mã NV: ${user.USERNAME}` : `Mã KH: ${profileData.MAKH}`}
            </p>
          </div>
        </div>

        {/* ===== CONTENT GRID ===== */}
        <div style={styles.contentGrid}>

          {/* LEFT COLUMN - Info Card */}
          <div style={styles.infoCard}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>
                <i className="fa-solid fa-user" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                Thông tin cá nhân
              </h2>
              {!isEditing ? (
                <button style={styles.editBtn} onClick={() => setIsEditing(true)}>
                  <i className="fa-solid fa-pen-to-square"></i> Chỉnh sửa
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={styles.cancelBtn} onClick={() => { setIsEditing(false); setCccdTruocFile(null); setCccdSauFile(null); setCccdTruocPreview(null); setCccdSauPreview(null); setAvatarFile(null); setAvatarPreview(null); }}>Hủy</button>
                  <button style={styles.saveBtn} onClick={handleSave} disabled={isSaving}>
                    {isSaving ? <i className="fa fa-spinner fa-spin"></i> : <><i className="fa-solid fa-floppy-disk"></i> Lưu</>}
                  </button>
                </div>
              )}
            </div>

            <div style={styles.infoGrid}>
              <InfoRow icon="fa-solid fa-signature" label="Họ tên" value={formData.HOTEN}
                isEditing={isEditing} onChange={(v) => setFormData({ ...formData, HOTEN: v })} />
              <InfoRow icon="fa-solid fa-envelope" label="Email" value={formData.EMAIL}
                isEditing={isEditing} onChange={(v) => setFormData({ ...formData, EMAIL: v })} />
              <InfoRow icon="fa-solid fa-phone" label="Số điện thoại" value={formData.SDT}
                isEditing={isEditing} onChange={(v) => setFormData({ ...formData, SDT: v })} />
              <InfoRow icon="fa-solid fa-location-dot" label="Địa chỉ" value={formData.DIACHI}
                isEditing={isEditing} onChange={(v) => setFormData({ ...formData, DIACHI: v })} />
              <InfoRow icon="fa-solid fa-venus-mars" label="Giới tính" value={formData.GioiTinh}
                isEditing={isEditing} type="select" options={['', 'Nam', 'Nữ']}
                onChange={(v) => setFormData({ ...formData, GioiTinh: v })} />
              <InfoRow icon="fa-solid fa-cake-candles" label="Ngày sinh" value={formData.NGAYSINH}
                isEditing={isEditing} type="date"
                onChange={(v) => setFormData({ ...formData, NGAYSINH: v })} displayValue={formatDate(formData.NGAYSINH)} />
            </div>

            {/* Employee-specific: Chức vụ + Chi nhánh */}
            {isEmployee && profileData && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#495057' }}>
                  <i className="fa-solid fa-briefcase" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                  Thông tin công việc
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Chức vụ</span>
                    <span style={styles.statValue}>{profileData.CHUCVU || getRoleName(Number(user.MAROLE))}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Ca làm việc</span>
                    <span style={styles.statValue}>{profileData.CALAMVIEC || 'Chưa xếp'}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>CCCD</span>
                    <span style={styles.statValue}>{profileData.CCCD || 'Chưa cập nhật'}</span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Trạng thái</span>
                    <span style={{ ...styles.statValue, color: profileData.TRANGTHAI === 'Đang làm' ? '#27ae60' : '#e74c3c' }}>
                      {profileData.TRANGTHAI || 'Đang làm'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer-specific: Điểm + Hạng */}
            {isCustomer && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)', borderRadius: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', color: '#856404' }}>
                  <i className="fa-solid fa-crown" style={{ marginRight: '8px', color: '#f39c12' }}></i>
                  Thành viên thân thiết
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Điểm tích lũy</span>
                    <span style={{ ...styles.statValue, color: '#f39c12', fontSize: '20px' }}>
                      {(profileData.DIEMTICHLUY || 0).toLocaleString('vi-VN')} điểm
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Hạng thành viên</span>
                    <span style={{ ...styles.statValue, color: rank.color, fontSize: '20px' }}>
                      {rank.icon} {rank.name}
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#856404', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>🥉 Đồng: 0 - 49 điểm &nbsp;|&nbsp; 🥈 Bạc: 50 - 199 điểm &nbsp;|&nbsp; 🥇 Vàng: 200 - 499 điểm</p>
                  <p style={{ margin: 0 }}>💎 Kim cương: 500 - 999 điểm &nbsp;|&nbsp; 🏆 Thách đấu: 1000+ điểm</p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* CCCD Upload Section (Employee only) */}
            {isEmployee && (
              <div style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>
                    <i className="fa-solid fa-id-card" style={{ marginRight: '8px', color: '#e67e22' }}></i>
                    Ảnh CCCD / CMND
                  </h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* CCCD Mặt trước */}
                  <CccdUploadCard
                    label="Mặt trước"
                    currentImage={profileData.CCCD_TRUOC}
                    previewImage={cccdTruocPreview}
                    isEditing={isEditing}
                    onFileChange={(e) => handleFileChange(e, 'CCCD_TRUOC')}
                  />
                  {/* CCCD Mặt sau */}
                  <CccdUploadCard
                    label="Mặt sau"
                    currentImage={profileData.CCCD_SAU}
                    previewImage={cccdSauPreview}
                    isEditing={isEditing}
                    onFileChange={(e) => handleFileChange(e, 'CCCD_SAU')}
                  />
                </div>
              </div>
            )}

            {/* Order History (Customer only) */}
            {isCustomer && (
              <div style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>
                    <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: '#3498db' }}></i>
                    Lịch sử đơn hàng
                  </h2>
                  <Link to="/my-orders" style={{ fontSize: '13px', color: 'var(--primary-color)', textDecoration: 'none' }}>
                    Xem tất cả <i className="fa-solid fa-arrow-right" style={{ fontSize: '11px' }}></i>
                  </Link>
                </div>
                {isLoadingOrders ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                    <i className="fa fa-spinner fa-spin" style={{ fontSize: '24px' }}></i>
                    <p>Đang tải đơn hàng...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: '40px', marginBottom: '10px', display: 'block' }}></i>
                    <p>Bạn chưa có đơn hàng nào</p>
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {orders.slice(0, 10).map((order, idx) => {
                      const maHD = order.MAHD || order.maHD || order.mahd;
                      const ngayLap = order.NGAYLAP || order.ngayLap || order.created_at;
                      const tongTien = order.TONGTIEN || order.tongTien || order.total || 0;
                      const trangThai = order.TRANGTHAITHANHTOAN || order.trangThai || order.status || 'Đang xử lý';
                      return (
                        <div key={idx} style={styles.orderItem}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#2c3e50' }}>{maHD}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{formatDate(ngayLap)}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--primary-color)' }}>
                              {Number(tongTien).toLocaleString('vi-VN')}₫
                            </div>
                            <span style={{
                              fontSize: '11px', padding: '2px 8px', borderRadius: '10px',
                              backgroundColor: trangThai.includes('hoàn thành') || trangThai.includes('Hoàn thành') ? '#d4edda' :
                                trangThai.includes('hủy') || trangThai.includes('Hủy') ? '#f8d7da' : '#fff3cd',
                              color: trangThai.includes('hoàn thành') || trangThai.includes('Hoàn thành') ? '#155724' :
                                trangThai.includes('hủy') || trangThai.includes('Hủy') ? '#721c24' : '#856404',
                            }}>
                              {trangThai}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Password Change Card */}
            <div style={styles.infoCard}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  <i className="fa-solid fa-lock" style={{ marginRight: '8px', color: '#e74c3c' }}></i>
                  Bảo mật tài khoản
                </h2>
              </div>
              
              {!showPasswordChange ? (
                  <button style={{...styles.editBtn, width: '100%', borderColor: '#e74c3c', color: '#e74c3c'}} onClick={() => setShowPasswordChange(true)}>
                    <i className="fa-solid fa-key" style={{marginRight: '6px'}}></i> Đổi mật khẩu
                  </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {!passwordOtpSent ? (
                        <>
                            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, margin: 0 }}>Hệ thống sẽ gửi một mã xác nhận (OTP) đến email <b>{user?.EMAIL || formData.EMAIL}</b> của bạn để thực hiện đổi mật khẩu.</p>
                            <button style={{...styles.saveBtn, width: '100%', backgroundColor: '#e74c3c'}} onClick={handleRequestPasswordOtp} disabled={isSendingPasswordOtp}>
                                {isSendingPasswordOtp ? <i className="fa fa-spinner fa-spin"></i> : 'Gửi mã OTP'}
                            </button>
                            <button style={{...styles.cancelBtn, width: '100%'}} onClick={() => setShowPasswordChange(false)}>
                                Hủy
                            </button>
                        </>
                    ) : (
                        <>
                            <p style={{ fontSize: '13px', color: '#27ae60', margin: 0 }}>Mã OTP đã được gửi. Vui lòng kiểm tra email.</p>
                            <div>
                                <label style={{...styles.statLabel, marginBottom: '4px'}}>Mã OTP</label>
                                <input type="text" style={styles.infoInput} placeholder="Nhập mã 6 số từ email" value={passwordOtp} onChange={e => setPasswordOtp(e.target.value)} />
                            </div>
                            <div>
                                <label style={{...styles.statLabel, marginBottom: '4px'}}>Mật khẩu mới</label>
                                <input type="password" style={styles.infoInput} placeholder="Tối thiểu 12 ký tự, chữ hoa, số, ký tự đb" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                <button style={{...styles.saveBtn, flex: 1, backgroundColor: '#e74c3c'}} onClick={handleChangePassword} disabled={isChangingPassword}>
                                    {isChangingPassword ? <i className="fa fa-spinner fa-spin"></i> : 'Xác nhận'}
                                </button>
                                <button style={{...styles.cancelBtn, flex: 1}} onClick={() => {setShowPasswordChange(false); setPasswordOtpSent(false);}}>
                                    Hủy
                                </button>
                            </div>
                        </>
                    )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================ */
/* COMPONENT: Info Row (Hiển thị / Chỉnh sửa) */
/* ============================================ */
const InfoRow = ({ icon, label, value, isEditing, onChange, readOnly, type, options, displayValue }) => (
  <div style={styles.infoRow}>
    <div style={styles.infoIcon}><i className={icon}></i></div>
    <div style={{ flex: 1 }}>
      <span style={styles.infoLabel}>{label}</span>
      {isEditing && !readOnly ? (
        type === 'select' ? (
          <select style={styles.infoInput} value={value || ''} onChange={(e) => onChange(e.target.value)}>
            <option value="">Chọn giới tính</option>
            {options?.filter(o => o).map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input
            type={type || 'text'}
            style={styles.infoInput}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )
      ) : (
        <span style={styles.infoValue}>{displayValue || value || 'Chưa cập nhật'}</span>
      )}
    </div>
  </div>
);

/* ============================================ */
/* COMPONENT: CCCD Upload Card                  */
/* ============================================ */
const CccdUploadCard = ({ label, currentImage, previewImage, isEditing, onFileChange }) => {
  const imageToShow = previewImage || currentImage;
  return (
    <div style={styles.cccdCard}>
      <p style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#495057' }}>{label}</p>
      {imageToShow ? (
        <img src={imageToShow} alt={`CCCD ${label}`} style={styles.cccdImage} />
      ) : (
        <div style={styles.cccdPlaceholder}>
          <i className="fa-solid fa-id-card" style={{ fontSize: '36px', color: '#ccc' }}></i>
          <span style={{ fontSize: '12px', color: '#aaa', marginTop: '8px' }}>Chưa tải lên</span>
        </div>
      )}
      {isEditing && (
        <label style={styles.uploadLabel}>
          <i className="fa-solid fa-cloud-arrow-up" style={{ marginRight: '6px' }}></i>
          Chọn ảnh
          <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        </label>
      )}
    </div>
  );
};

/* ============================================ */
/* STYLES                                        */
/* ============================================ */
const styles = {
  pageContainer: {
    minHeight: '80vh',
    backgroundColor: '#f0f2f5',
    paddingBottom: '40px',
  },
  pageWrapper: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '0 15px',
  },
  loadingContainer: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '60vh',
  },
  // Hero
  heroSection: {
    position: 'relative',
    background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #CD853F 100%)',
    borderRadius: '0 0 24px 24px',
    padding: '50px 20px 40px',
    textAlign: 'center',
    overflow: 'hidden',
  },
  heroOverlay: {
    position: 'absolute', inset: 0,
    background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.6,
  },
  heroContent: { position: 'relative', zIndex: 1 },
  avatarWrapper: { display: 'inline-block', position: 'relative', marginBottom: '16px' },
  avatar: {
    width: '100px', height: '100px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #fff 0%, #f8f0e3 100%)',
    color: '#8B4513', fontSize: '42px', fontWeight: '700',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '4px solid rgba(255,255,255,0.4)',
    boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
  },
  rankBadge: {
    position: 'absolute', bottom: '-6px', left: '50%', transform: 'translateX(-50%)',
    color: '#fff', fontSize: '11px', fontWeight: '600', padding: '3px 10px',
    borderRadius: '12px', whiteSpace: 'nowrap', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  heroName: { color: '#fff', fontSize: '24px', fontWeight: '700', marginBottom: '4px' },
  heroRole: { color: 'rgba(255,255,255,0.85)', fontSize: '14px', marginBottom: '2px' },
  heroId: { color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'monospace' },

  // Content Grid
  contentGrid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '-20px', position: 'relative', zIndex: 2,
  },

  // Cards
  infoCard: {
    backgroundColor: '#fff', borderRadius: '16px', padding: '24px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #eee',
  },
  cardHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px',
    borderBottom: '1px solid #f0f0f0', paddingBottom: '12px',
  },
  cardTitle: { fontSize: '16px', fontWeight: '700', color: '#2c3e50', margin: 0 },

  // Buttons
  editBtn: {
    background: 'none', border: '1px solid var(--primary-color)', color: 'var(--primary-color)',
    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
    transition: 'all 0.2s',
  },
  cancelBtn: {
    background: '#f0f0f0', border: 'none', color: '#666', padding: '6px 14px',
    borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  },
  saveBtn: {
    background: 'var(--primary-color)', border: 'none', color: '#fff', padding: '6px 14px',
    borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
  },

  // Info Rows
  infoGrid: { display: 'flex', flexDirection: 'column', gap: '12px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0' },
  infoIcon: {
    width: '36px', height: '36px', borderRadius: '10px',
    backgroundColor: '#fef5ee', color: 'var(--primary-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
  },
  infoLabel: { display: 'block', fontSize: '12px', color: '#999', marginBottom: '2px' },
  infoValue: { display: 'block', fontSize: '14px', color: '#2c3e50', fontWeight: '500' },
  infoInput: {
    display: 'block', width: '100%', padding: '6px 10px', border: '1px solid #ddd',
    borderRadius: '6px', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },

  // Stats
  statItem: {
    padding: '10px 12px', backgroundColor: '#fff', borderRadius: '8px',
    border: '1px solid #eee',
  },
  statLabel: { display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' },
  statValue: { display: 'block', fontSize: '14px', fontWeight: '600', color: '#2c3e50' },

  // CCCD
  cccdCard: {
    border: '1px solid #eee', borderRadius: '12px', padding: '12px', textAlign: 'center',
    backgroundColor: '#fafafa',
  },
  cccdImage: {
    width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px',
    border: '1px solid #eee',
  },
  cccdPlaceholder: {
    width: '100%', height: '140px', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f5f5f5', borderRadius: '8px', border: '2px dashed #ddd',
  },
  uploadLabel: {
    display: 'inline-block', marginTop: '8px', padding: '6px 14px',
    backgroundColor: 'var(--primary-color)', color: '#fff', borderRadius: '8px',
    fontSize: '12px', cursor: 'pointer', fontWeight: '500',
  },

  // Orders
  orderItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 0', borderBottom: '1px solid #f5f5f5',
  },
};

// Responsive: On small screens, switch to single column
const mediaQuery = window.matchMedia('(max-width: 768px)');
if (mediaQuery.matches) {
  styles.contentGrid.gridTemplateColumns = '1fr';
}

export default ProfilePage;
