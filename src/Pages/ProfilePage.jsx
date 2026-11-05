import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, updateProfile } from '../services/authService';
import axiosClient from '../services/axiosClient';
import { useToast } from '../components/Toast/Toast';
import SignatureCanvas from '../components/Signature/SignatureCanvas';
import { formatImageUrl } from '../utils/imageUtils';

const ProfilePage = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orders, setOrders] = useState([]);
  const [signatureData, setSignatureData] = useState(null);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
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

  // Address Book state (2 cấp hành chính mới: Tỉnh/Thành -> Phường/Xã, không còn Quận/Huyện)
  const [addresses, setAddresses] = useState([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addrProvinces, setAddrProvinces] = useState([]);
  const [addrWards, setAddrWards] = useState([]);
  const [isLoadingAddrWards, setIsLoadingAddrWards] = useState(false);
  const [addressForm, setAddressForm] = useState({
    hoTenNguoiNhan: '',
    soDienThoai: '',
    diaChiChiTiet: '',
    maTinh: '',
    maHuyen: '',
    maXa: '',
    isDefault: false,
  });

  // Voucher Wallet state
  const [voucherTab, setVoucherTab] = useState('wallet'); // 'wallet' | 'discover'
  const [savedVouchers, setSavedVouchers] = useState([]);
  const [availableVouchers, setAvailableVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [collectCodeInput, setCollectCodeInput] = useState('');
  const [isCollectingVoucher, setIsCollectingVoucher] = useState(false);

  // Change password state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordOtp, setPasswordOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSendingPasswordOtp, setIsSendingPasswordOtp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const isEmployee = user && (
    [0, 1, 2, 4, 5, 6].includes(Number(user.MAROLE)) && Number(user.MAROLE) !== 3 && Number(user.vaiTroId) !== 6
  );
  const isCustomer = user && (Number(user.MAROLE) === 3 || Number(user.vaiTroId) === 6 || !isEmployee);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await axiosClient.get('/addresses');
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setAddresses(list);
    } catch (e) {
      console.error('Lỗi lấy danh sách địa chỉ:', e);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const fetchVoucherWallet = async () => {
    setIsLoadingVouchers(true);
    try {
      const res = await axiosClient.get('/vouchers/my-wallet');
      const data = res.data || {};
      const saved = Array.isArray(data) ? data : (data.saved_vouchers || data.data || []);
      const avail = Array.isArray(data.available_vouchers) ? data.available_vouchers : saved;
      setSavedVouchers(saved);
      setAvailableVouchers(avail);
    } catch (e) {
      console.error('Lỗi tải Ví Voucher:', e);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const handleCollectVoucher = async (codeToSave) => {
    const cleanCode = String(codeToSave || collectCodeInput || '').trim().toUpperCase();
    if (!cleanCode) {
      toast.warning('Vui lòng nhập hoặc chọn mã Voucher cần lưu vào ví!');
      return;
    }
    setIsCollectingVoucher(true);
    try {
      const res = await axiosClient.post('/vouchers/collect', { maVoucher: cleanCode });
      toast.success(res.data?.message || `Đã lưu Voucher ${cleanCode} vào Ví Voucher!`);
      setCollectCodeInput('');
      fetchVoucherWallet();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Không thể lưu mã Voucher này');
    } finally {
      setIsCollectingVoucher(false);
    }
  };

  const handleOpenAddAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      hoTenNguoiNhan: profileData?.HOTEN || user?.HOTEN || '',
      soDienThoai: profileData?.SDT || user?.SDT || '',
      diaChiChiTiet: '',
      maTinh: '',
      maHuyen: '',
      maXa: '',
      isDefault: addresses.length === 0,
    });
    setAddrWards([]);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = async (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      hoTenNguoiNhan: addr.hoTenNguoiNhan || '',
      soDienThoai: addr.soDienThoai || '',
      diaChiChiTiet: addr.diaChiChiTiet || addr.diaChi || '',
      maTinh: addr.maTinh ? String(addr.maTinh) : '',
      maHuyen: addr.maHuyen ? String(addr.maHuyen) : '',
      maXa: addr.maXa ? String(addr.maXa) : '',
      isDefault: Number(addr.isDefault ?? addr.is_default) === 1,
    });

    setIsAddressModalOpen(true);

    if (addr.maTinh) {
      setIsLoadingAddrWards(true);
      try {
        const wRes = await axiosClient.get('/ghn/wards-by-province?province_id=' + addr.maTinh);
        const wardList = wRes.data?.data || [];
        setAddrWards(wardList);
        if (addr.maXa) {
          const foundW = wardList.find(w => String(w.WardCode) === String(addr.maXa));
          if (foundW && foundW.DistrictID) {
            setAddressForm(prev => ({ ...prev, maHuyen: String(foundW.DistrictID) }));
          }
        }
      } catch (err) {
        console.error('Lỗi tải phường/xã theo tỉnh khi chỉnh sửa địa chỉ:', err);
      } finally {
        setIsLoadingAddrWards(false);
      }
    } else {
      setAddrWards([]);
    }
  };

  const handleProvinceChange = async (provId) => {
    setAddressForm(prev => ({ ...prev, maTinh: provId, maHuyen: '', maXa: '' }));
    setAddrWards([]);
    if (!provId) return;
    setIsLoadingAddrWards(true);
    try {
      const res = await axiosClient.get('/ghn/wards-by-province?province_id=' + provId);
      if (res.data?.data) setAddrWards(res.data.data);
    } catch (e) {
      console.error('Lỗi lấy danh sách phường/xã:', e);
    } finally {
      setIsLoadingAddrWards(false);
    }
  };

  const handleWardChange = (wardCode) => {
    const foundWard = addrWards.find(w => String(w.WardCode) === String(wardCode));
    setAddressForm(prev => ({
      ...prev,
      maXa: wardCode,
      maHuyen: foundWard?.DistrictID ? String(foundWard.DistrictID) : prev.maHuyen,
    }));
  };

  const handleSaveAddress = async (e) => {
    e?.preventDefault();
    if (!addressForm.diaChiChiTiet.trim()) {
      toast.warning('Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)!');
      return;
    }
    setIsSavingAddress(true);
    try {
      const payload = {
        ...addressForm,
        maTinh: addressForm.maTinh ? Number(addressForm.maTinh) : 0,
        maHuyen: addressForm.maHuyen ? Number(addressForm.maHuyen) : 0,
        maXa: addressForm.maXa ? String(addressForm.maXa) : '',
      };

      if (editingAddressId) {
        await axiosClient.put(`/addresses/${editingAddressId}`, payload);
        toast.success('Cập nhật địa chỉ thành công!');
      } else {
        await axiosClient.post('/addresses', payload);
        toast.success('Thêm địa chỉ mới thành công!');
      }
      setIsAddressModalOpen(false);
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Không thể lưu địa chỉ');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleSetDefaultAddress = async (addrId) => {
    try {
      await axiosClient.put(`/addresses/${addrId}/default`);
      toast.success('Đã đặt làm địa chỉ mặc định!');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi đặt địa chỉ mặc định');
    }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này khỏi sổ địa chỉ?')) return;
    try {
      await axiosClient.delete(`/addresses/${addrId}`);
      toast.success('Đã xóa địa chỉ!');
      fetchAddresses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Lỗi khi xóa địa chỉ');
    }
  };

  const handleRequestPasswordOtp = async () => {
    const emailToUse = user?.EMAIL || user?.email || formData.EMAIL;
    if (!emailToUse) {
      toast.warning("Vui lòng cập nhật địa chỉ Email trước khi thực hiện đổi mật khẩu.");
      return;
    }
    setIsSendingPasswordOtp(true);
    try {
        const { forgotPassword } = await import('../services/authService');
        await forgotPassword(emailToUse);
        setPasswordOtpSent(true);
        toast.success("Đã gửi mã OTP đến email của bạn.");
    } catch(e) {
        toast.error(e.response?.data?.error || "Lỗi khi gửi OTP.");
    } finally {
        setIsSendingPasswordOtp(false);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordOtp || !newPassword) {
        toast.warning("Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.");
        return;
    }
    setIsChangingPassword(true);
    const emailToUse = user?.EMAIL || user?.email || formData.EMAIL;
    try {
        const { resetPassword } = await import('../services/authService');
        await resetPassword(emailToUse, passwordOtp, newPassword);
        toast.success("Đổi mật khẩu thành công!");
        setShowPasswordChange(false);
        setPasswordOtpSent(false);
        setPasswordOtp('');
        setNewPassword('');
    } catch(e) {
        toast.error(e.response?.data?.error || "Mã OTP không chính xác.");
    } finally {
        setIsChangingPassword(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await getCurrentUser(true);
        setUser(userData);

        const profile = userData.nguoidung || userData.khachhang || userData.nhanvien;
        if (profile) {
          setProfileData(profile);
          setFormData({
            HOTEN: profile.HOTEN || profile.hoTen || profile.ho_ten || '',
            SDT: profile.SDT || profile.soDienThoai || profile.so_dien_thoai || '',
            DIACHI: profile.DIACHI || profile.dia_chi || '',
            GioiTinh: profile.GioiTinh !== undefined ? profile.GioiTinh : (profile.gioi_tinh === 1 ? 'Nam' : profile.gioi_tinh === 0 ? 'Nữ' : ''),
            NGAYSINH: profile.NGAYSINH || profile.ngay_sinh || '',
            EMAIL: userData.email || userData.EMAIL || ''
          });
        }
      } catch (e) {
        navigate('/dang-nhap');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
    fetchAddresses();
    fetchVoucherWallet();
    axiosClient.get('/ghn/provinces').then(res => {
      if (res.data?.data) setAddrProvinces(res.data.data);
    }).catch(() => {});
  }, [navigate]);

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

  const handleSaveSignature = async () => {
    if (!signatureData) {
      toast.warning('Vui lòng vẽ chữ ký số trước khi lưu!');
      return;
    }
    setIsSavingSignature(true);
    try {
      const res = await axiosClient.post('/profile/chu-ky', { chu_ky: signatureData });
      if (res.data?.status) {
        toast.success('Đã lưu chữ ký số cá nhân thành công!');
        const userData = await getCurrentUser(true);
        setUser(userData);
        if (userData.nhanvien) setProfileData(userData.nhanvien);
      }
    } catch (e) {
      toast.error('Lỗi khi lưu chữ ký: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsSavingSignature(false);
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

      if (avatarFile) {
        payload.append('AVATAR', avatarFile);
        payload.append('avatar', avatarFile);
      }
      if (cccdTruocFile) payload.append('CCCD_TRUOC', cccdTruocFile);
      if (cccdSauFile) payload.append('CCCD_SAU', cccdSauFile);

      await updateProfile(payload);
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      const userData = await getCurrentUser(true);
      setUser(userData);
      setProfileData(userData.nguoidung || userData.khachhang || userData.nhanvien);
      document.dispatchEvent(new Event('authUpdated'));
      setCccdTruocFile(null);
      setCccdSauFile(null);
      setCccdTruocPreview(null);
      setCccdSauPreview(null);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (e) {
      console.error(e);
      toast.error('Lỗi cập nhật: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleName = (role) => {
    const roles = { 0: 'Quản lý tổng', 1: 'Quản lý chi nhánh', 2: 'Nhân viên bán hàng', 3: 'Khách hàng', 4: 'CSKH', 5: 'Giám đốc', 6: 'Kế toán' };
    return roles[role] || 'Khách hàng';
  };

  const getMembershipRank = (points) => {
    const pts = Number(points || 0);
    if (pts >= 1000) return { name: 'Thách đấu', color: '#e74c3c', icon: '🏆', nextName: null, nextPoints: 1000 };
    if (pts >= 500) return { name: 'Kim cương', color: '#2980b9', icon: '💎', nextName: 'Thách đấu', nextPoints: 1000 };
    if (pts >= 200) return { name: 'Vàng', color: '#d97706', icon: '🥇', nextName: 'Kim cương', nextPoints: 500 };
    if (pts >= 50) return { name: 'Bạc', color: '#64748b', icon: '🥈', nextName: 'Vàng', nextPoints: 200 };
    return { name: 'Đồng', color: '#b45309', icon: '🥉', nextName: 'Bạc', nextPoints: 50 };
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

  // Tính toán điểm tích lũy thực tế (lấy từ profileData.DIEMTICHLUY hoặc tính từ các đơn hoàn thành)
  const completedOrdersTotal = orders
    .filter(o => {
      const st = String(o.trangThai || o.TRANGTHAI || '').toLowerCase();
      return Number(o.trangThaiDonHang) === 4 || Number(o.trangThaiDonHang) === 5 || st.includes('hoàn thành');
    })
    .reduce((sum, o) => sum + Number(o.tongTien || o.TONGTIEN || o.total || 0), 0);

  const loyaltyPoints = Math.max(
    Number(profileData.DIEMTICHLUY ?? profileData.diemTichLuy ?? 0),
    Math.floor(completedOrdersTotal / 10000)
  );
  const totalSpent = Math.max(
    Number(profileData.TONGCHITIEU ?? profileData.tongChiTieu ?? 0),
    completedOrdersTotal
  );
  const rank = isCustomer ? getMembershipRank(loyaltyPoints) : null;
  const progressPercent = rank?.nextName
    ? Math.min(100, Math.round((loyaltyPoints / rank.nextPoints) * 100))
    : 100;

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
                  {avatarPreview || user?.AVATAR || user?.avatar || profileData?.avatar || profileData?.AVATAR ? (
                    <img 
                      src={avatarPreview || formatImageUrl(user?.AVATAR || user?.avatar || profileData?.avatar || profileData?.AVATAR)} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    getInitials(profileData.HOTEN || profileData.hoTen || user?.username)
                  )}
                  <div style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: 'var(--primary-color)', color: '#fff', padding: '6px', borderRadius: '50%', fontSize: '14px' }}>
                    <i className="fa-solid fa-camera"></i>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'AVATAR')} style={{ display: 'none' }} />
                </label>
              ) : (
                <div style={styles.avatar}>
                  {user?.AVATAR || user?.avatar || profileData?.avatar || profileData?.AVATAR ? (
                    <img 
                      src={formatImageUrl(user?.AVATAR || user?.avatar || profileData?.avatar || profileData?.AVATAR)} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    getInitials(profileData.HOTEN || profileData.hoTen || user?.username)
                  )}
                </div>
              )}
              {isCustomer && rank && (
                <span style={{ ...styles.rankBadge, backgroundColor: rank.color }}>
                  {rank.icon} Hạng {rank.name}
                </span>
              )}
            </div>
            <h1 style={styles.heroName}>{profileData.HOTEN || profileData.hoTen || 'Chưa cập nhật'}</h1>
            <p style={styles.heroRole}>
              <i className="fa-solid fa-shield-halved" style={{ marginRight: '6px' }}></i>
              {getRoleName(Number(user.MAROLE ?? 3))}
            </p>
            <p style={styles.heroId}>
              {isEmployee ? `Mã NV: ${user.USERNAME || user.username}` : `Mã KH: ${profileData.MAKH || ('KH_' + profileData.id)}`}
            </p>
          </div>
        </div>

        {/* ===== CONTENT GRID ===== */}
        <div style={styles.contentGrid} className="profile-content-grid">

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

            {/* Customer-specific: Điểm tích lũy + Hạng thành viên */}
            {isCustomer && rank && (
              <div style={{ marginTop: '24px', padding: '18px', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderRadius: '14px', border: '1px solid #fde68a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: '#92400e' }}>
                    <i className="fa-solid fa-crown" style={{ marginRight: '8px', color: '#d97706' }}></i>
                    Điểm Tích Lũy & Hạng Thành Viên
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#b45309', backgroundColor: '#fff', padding: '3px 10px', borderRadius: '12px', border: '1px solid #fcd34d' }}>
                    10.000đ = 1 điểm
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Điểm tích lũy</span>
                    <span style={{ ...styles.statValue, color: '#d97706', fontSize: '19px', fontWeight: '800' }}>
                      {loyaltyPoints.toLocaleString('vi-VN')} điểm
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Hạng thành viên</span>
                    <span style={{ ...styles.statValue, color: rank.color, fontSize: '18px', fontWeight: '800' }}>
                      {rank.icon} {rank.name}
                    </span>
                  </div>
                  <div style={styles.statItem}>
                    <span style={styles.statLabel}>Tổng chi tiêu tích lũy</span>
                    <span style={{ ...styles.statValue, color: '#15803d', fontSize: '16px', fontWeight: '700' }}>
                      {totalSpent.toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                </div>

                {/* Thanh tiến trình lên hạng tiếp theo */}
                <div style={{ marginTop: '14px', backgroundColor: '#fff', padding: '10px 12px', borderRadius: '10px', border: '1px solid #fde68a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#78350f', marginBottom: '6px', fontWeight: '600' }}>
                    {rank.nextName ? (
                      <>
                        <span>Tiến trình lên hạng <b>{rank.nextName}</b></span>
                        <span>Còn thiếu <b>{Math.max(0, rank.nextPoints - loyaltyPoints)} điểm</b> ({loyaltyPoints}/{rank.nextPoints})</span>
                      </>
                    ) : (
                      <span>🎉 Bạn đã đạt hạng thành viên cao nhất (Thách đấu)!</span>
                    )}
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#fef3c7', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #d97706)', borderRadius: '999px', transition: 'width 0.4s ease' }}></div>
                  </div>
                </div>

                <div style={{ marginTop: '10px', fontSize: '12px', color: '#856404', lineHeight: '1.6' }}>
                  <p style={{ margin: 0 }}>🥉 Đồng: 0 - 49 điểm &nbsp;|&nbsp; 🥈 Bạc: 50 - 199 điểm &nbsp;|&nbsp; 🥇 Vàng: 200 - 499 điểm</p>
                  <p style={{ margin: 0 }}>💎 Kim cương: 500 - 999 điểm &nbsp;|&nbsp; 🏆 Thách đấu: 1000+ điểm</p>
                </div>
              </div>
            )}

            {/* SỔ ĐỊA CHỈ NHẬN HÀNG (CUSTOMER & ALL USERS) */}
            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
              <div style={styles.cardHeader}>
                <h2 style={styles.cardTitle}>
                  <i className="fa-solid fa-location-dot" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>
                  Sổ địa chỉ nhận hàng ({addresses.length})
                </h2>
                <button
                  type="button"
                  style={{ ...styles.saveBtn, backgroundColor: 'var(--primary-color)', fontSize: '12px', padding: '6px 12px' }}
                  onClick={handleOpenAddAddress}
                >
                  <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Thêm địa chỉ mới
                </button>
              </div>

              {isLoadingAddresses ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  <i className="fa fa-spinner fa-spin"></i> Đang tải sổ địa chỉ...
                </div>
              ) : addresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#888', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <i className="fa-solid fa-map-location-dot" style={{ fontSize: '30px', color: '#cbd5e1', marginBottom: '8px', display: 'block' }}></i>
                  Bạn chưa có địa chỉ nào được lưu. Bấm "Thêm địa chỉ mới" để không phải nhập lại mỗi lần đặt hàng!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {addresses.map((addr) => {
                    const isDef = Number(addr.isDefault ?? addr.is_default) === 1;
                    return (
                      <div
                        key={addr.id}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isDef ? '2px solid var(--primary-color)' : '1px solid #e2e8f0',
                          backgroundColor: isDef ? '#fffaf5' : '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                              {addr.hoTenNguoiNhan || 'Người nhận'}
                            </span>
                            {addr.soDienThoai && (
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                • {addr.soDienThoai}
                              </span>
                            )}
                            {isDef && (
                              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px' }}>
                                Mặc định
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                            {addr.diaChiChiTiet || addr.diaChi || addr.address}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {!isDef && (
                            <button
                              type="button"
                              title="Đặt làm mặc định"
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                              onClick={() => handleSetDefaultAddress(addr.id)}
                            >
                              Đặt mặc định
                            </button>
                          )}
                          <button
                            type="button"
                            title="Chỉnh sửa"
                            style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={() => handleOpenEditAddress(addr)}
                          >
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button
                            type="button"
                            title="Xóa địa chỉ"
                            style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            onClick={() => handleDeleteAddress(addr.id)}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* VÍ VOUCHER CỦA KHÁCH HÀNG & KHO SĂN VOUCHER */}
            {isCustomer && (
              <div style={styles.infoCard}>
                <div style={{ ...styles.cardHeader, flexWrap: 'wrap', gap: '10px' }}>
                  <h2 style={{ ...styles.cardTitle, whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                    <i className="fa-solid fa-ticket" style={{ marginRight: '8px', color: '#d97706' }}></i>
                    Ví Voucher Của Tôi ({savedVouchers.length})
                  </h2>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setVoucherTab('wallet')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: voucherTab === 'wallet' ? 'var(--primary-color)' : '#f1f5f9',
                        color: voucherTab === 'wallet' ? '#fff' : '#475569'
                      }}
                    >
                      Ví đã lưu ({savedVouchers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVoucherTab('discover')}
                      style={{
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: voucherTab === 'discover' ? 'var(--primary-color)' : '#f1f5f9',
                        color: voucherTab === 'discover' ? '#fff' : '#475569'
                      }}
                    >
                      Kho săn Voucher ({availableVouchers.length})
                    </button>
                  </div>
                </div>

                {/* Ô nhập mã Voucher để lưu nhanh vào ví */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                  <input
                    type="text"
                    placeholder="Nhập mã Voucher để lưu vào ví (VD: GIAM20K)..."
                    value={collectCodeInput}
                    onChange={e => setCollectCodeInput(e.target.value.toUpperCase())}
                    style={{ ...styles.infoInput, flex: 1, textTransform: 'uppercase', fontWeight: '600' }}
                  />
                  <button
                    type="button"
                    disabled={isCollectingVoucher}
                    onClick={() => handleCollectVoucher(collectCodeInput)}
                    style={{ ...styles.saveBtn, whiteSpace: 'nowrap', fontWeight: '700', padding: '8px 16px' }}
                  >
                    {isCollectingVoucher ? <i className="fa fa-spinner fa-spin"></i> : '+ Lưu vào ví'}
                  </button>
                </div>

                {isLoadingVouchers ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: '#999' }}>
                    <i className="fa fa-spinner fa-spin"></i> Đang tải Ví Voucher...
                  </div>
                ) : voucherTab === 'wallet' ? (
                  savedVouchers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px 16px', backgroundColor: '#fffbeb', borderRadius: '10px', border: '1px dashed #fcd34d', color: '#92400e' }}>
                      <i className="fa-solid fa-ticket" style={{ fontSize: '28px', color: '#f59e0b', display: 'block', marginBottom: '8px' }}></i>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>Ví Voucher của bạn đang trống</div>
                      <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '10px' }}>
                        Hãy chuyển sang tab <b>"Kho săn Voucher"</b> để lưu các mã giảm giá hấp dẫn về ví nhé!
                      </div>
                      <button
                        type="button"
                        onClick={() => setVoucherTab('discover')}
                        style={{ ...styles.saveBtn, fontSize: '12px', padding: '6px 14px' }}
                      >
                        Khám phá Kho Voucher ngay →
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                      {savedVouchers.map(v => (
                        <div
                          key={v.MA_VOUCHER}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid #fde68a',
                            background: 'linear-gradient(90deg, #fffbeb 0%, #ffffff 100%)'
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                              <span style={{ backgroundColor: '#d97706', color: '#fff', fontWeight: '800', fontSize: '12px', padding: '2px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>
                                {v.MA_VOUCHER}
                              </span>
                              <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                                {v.TEN_VOUCHER}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                              {v.LOAI_GIAM === 'PHAN_TRAM'
                                ? `Giảm ${v.GIA_TRI}%${v.GIAM_TOI_DA ? ` (tối đa ${Number(v.GIAM_TOI_DA).toLocaleString('vi-VN')}đ)` : ''}`
                                : `Giảm trực tiếp ${Number(v.GIA_TRI).toLocaleString('vi-VN')}đ`}
                              {' • '}Đơn tối thiểu {Number(v.DON_TOI_THIEU || 0).toLocaleString('vi-VN')}đ
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                              HSD: {formatDate(v.NGAY_KET_THUC)}
                            </div>
                          </div>

                          <Link
                            to={`/gio-hang?voucher=${encodeURIComponent(v.MA_VOUCHER)}`}
                            style={{
                              backgroundColor: '#16a34a',
                              color: '#fff',
                              textDecoration: 'none',
                              padding: '7px 14px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: '700',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Dùng ngay
                          </Link>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                    {availableVouchers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                        Hiện chưa có chương trình Voucher mới.
                      </div>
                    ) : (
                      availableVouchers.map(v => {
                        const isSaved = Boolean(v.is_saved) || savedVouchers.some(sv => sv.MA_VOUCHER === v.MA_VOUCHER);
                        return (
                          <div
                            key={v.MA_VOUCHER}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '12px 14px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#f8fafc'
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                <span style={{ backgroundColor: '#0284c7', color: '#fff', fontWeight: '800', fontSize: '12px', padding: '2px 8px', borderRadius: '4px' }}>
                                  {v.MA_VOUCHER}
                                </span>
                                <span style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
                                  {v.TEN_VOUCHER}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569' }}>
                                {v.LOAI_GIAM === 'PHAN_TRAM'
                                  ? `Giảm ${v.GIA_TRI}%${v.GIAM_TOI_DA ? ` (tối đa ${Number(v.GIAM_TOI_DA).toLocaleString('vi-VN')}đ)` : ''}`
                                  : `Giảm trực tiếp ${Number(v.GIA_TRI).toLocaleString('vi-VN')}đ`}
                                {' • '}Đơn từ {Number(v.DON_TOI_THIEU || 0).toLocaleString('vi-VN')}đ
                              </div>
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                                Còn lại: <b>{v.con_lai ?? (v.SO_LUONG_GIOI_HAN - v.SO_LUONG_DA_DUNG)}</b> lượt • HSD: {formatDate(v.NGAY_KET_THUC)}
                              </div>
                            </div>

                            {isSaved ? (
                              <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                ✓ Đã có trong ví
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isCollectingVoucher}
                                onClick={() => handleCollectVoucher(v.MA_VOUCHER)}
                                style={{
                                  backgroundColor: '#d97706',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '7px 14px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                + Lưu Voucher
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

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
                  <CccdUploadCard
                    label="Mặt trước"
                    currentImage={profileData.CCCD_TRUOC}
                    previewImage={cccdTruocPreview}
                    isEditing={isEditing}
                    onFileChange={(e) => handleFileChange(e, 'CCCD_TRUOC')}
                  />
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

            {/* Digital Signature Section (Employee only) */}
            {isEmployee && (
              <div style={styles.infoCard}>
                <div style={styles.cardHeader}>
                  <h2 style={styles.cardTitle}>
                    <i className="fa-solid fa-signature" style={{ marginRight: '8px', color: '#16a085' }}></i>
                    Chữ Ký Số Cá Nhân (Ký 1 lần - Sử dụng tự động khi duyệt phiếu)
                  </h2>
                </div>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                  Vẽ chữ ký của bạn vào khung bên dưới. Chữ ký này sẽ được lưu cố định vào tài khoản của bạn để tự động đóng dấu vào các <b>Phiếu Nhập Kho</b> và <b>Biên Bản Hủy</b> khi bạn thực hiện duyệt phiếu.
                </p>

                {profileData.CHU_KY && (
                  <div style={{ marginBottom: '15px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginBottom: '6px' }}>
                      <i className="fa-solid fa-circle-check" style={{ color: '#22c55e', marginRight: '6px' }}></i>
                      Chữ ký đã lưu hiện tại:
                    </div>
                    <div style={{ textAlign: 'center', background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <img src={profileData.CHU_KY} alt="Chữ ký đã lưu" style={{ maxHeight: '100px', objectFit: 'contain' }} />
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ ...styles.statLabel, marginBottom: '6px', display: 'block' }}>
                    {profileData.CHU_KY ? 'Vẽ chữ ký mới để thay đổi:' : 'Vẽ chữ ký số của bạn:'}
                  </label>
                  <SignatureCanvas
                    onSave={(dataUrl) => setSignatureData(dataUrl)}
                    height={160}
                  />
                  <button
                    type="button"
                    style={{ ...styles.saveBtn, width: '100%', marginTop: '12px', backgroundColor: '#16a085' }}
                    onClick={handleSaveSignature}
                    disabled={isSavingSignature}
                  >
                    {isSavingSignature ? (
                      <i className="fa fa-spinner fa-spin"></i>
                    ) : (
                      <>
                        <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>
                        Lưu Chữ Ký Số Cá Nhân
                      </>
                    )}
                  </button>
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
                  <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                    {orders.slice(0, 10).map((order, idx) => {
                      const maHD = order.MAHD || order.maHD || order.mahd;
                      const ngayLap = order.NGAYLAP || order.ngayLap || order.created_at;
                      const tongTien = order.TONGTIEN || order.tongTien || order.total || 0;
                      const trangThai = order.TRANGTHAITHANHTOAN || order.trangThai || order.status || 'Đang xử lý';
                      return (
                        <div key={idx} style={styles.orderItem}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '600', fontSize: '14px', color: '#2c3e50' }}>{maHD}</div>
                            <div style={{ fontSize: '12px', color: '#999', marginTop: '2px' }}>{ngayLap}</div>
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
                            <p style={{ fontSize: '13px', color: '#666', lineHeight: 1.5, margin: 0 }}>Hệ thống sẽ gửi một mã xác nhận (OTP) đến email <b>{user?.EMAIL || user?.email || formData.EMAIL}</b> của bạn để thực hiện đổi mật khẩu.</p>
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
                                <input type="password" style={styles.infoInput} placeholder="Tối thiểu 10 ký tự, chữ hoa, số, ký tự đb" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
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

      {/* MODAL THÊM / SỬA ĐỊA CHỈ (2 CẤP: TỈNH/THÀNH -> PHƯỜNG/XÃ, ĐÃ BỎ QUẬN/HUYỆN) */}
      {isAddressModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px' }} onClick={() => setIsAddressModalOpen(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--primary-color)', marginRight: '8px' }}></i>
                {editingAddressId ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
              </h3>
              <button type="button" style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: '#64748b' }} onClick={() => setIsAddressModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSaveAddress} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Họ tên người nhận *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    value={addressForm.hoTenNguoiNhan}
                    onChange={e => setAddressForm({ ...addressForm, hoTenNguoiNhan: e.target.value })}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    value={addressForm.soDienThoai}
                    onChange={e => setAddressForm({ ...addressForm, soDienThoai: e.target.value })}
                    placeholder="VD: 0901234567"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>
                  Khu vực giao hàng (Tỉnh/Thành & Phường/Xã mới)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <select
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      value={addressForm.maTinh}
                      onChange={e => handleProvinceChange(e.target.value)}
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {addrProvinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                    </select>
                  </div>
                  <div>
                    <select
                      style={{ width: '100%', padding: '9px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      value={addressForm.maXa}
                      onChange={e => handleWardChange(e.target.value)}
                      disabled={!addressForm.maTinh || isLoadingAddrWards}
                    >
                      <option value="">
                        {isLoadingAddrWards ? 'Đang tải Phường/Xã...' : '-- Chọn Phường/Xã --'}
                      </option>
                      {addrWards.map(w => (
                        <option key={`${w.WardCode}-${w.DistrictID || ''}`} value={w.WardCode}>
                          {w.FullName || `${w.WardName}${w.DistrictName ? ` (${w.DistrictName})` : ''}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '4px' }}>Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà...) *</label>
                <input
                  type="text"
                  required
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  value={addressForm.diaChiChiTiet}
                  onChange={e => setAddressForm({ ...addressForm, diaChiChiTiet: e.target.value })}
                  placeholder="VD: 140 Lê Trọng Tấn"
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#334155' }}>
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)' }}
                />
                <span style={{ fontWeight: '600' }}>Đặt làm địa chỉ nhận hàng mặc định</span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#475569', fontWeight: '600', cursor: 'pointer', fontSize: '13px' }}
                  onClick={() => setIsAddressModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: '700', cursor: isSavingAddress ? 'not-allowed' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSavingAddress ? <i className="fa fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk"></i>}
                  Lưu địa chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
    fontFamily: "'Roboto', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '-20px', position: 'relative', zIndex: 1,
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

const mediaQuery = window.matchMedia('(max-width: 768px)');
if (mediaQuery.matches) {
  styles.contentGrid.gridTemplateColumns = '1fr';
}

export default ProfilePage;
