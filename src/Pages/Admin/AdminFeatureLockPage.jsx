import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const FEATURE_ICONS = {
  POS: 'fa-cash-register',
  ONLINE_ORDER: 'fa-cart-shopping',
  INVENTORY_TRANSFER: 'fa-right-left',
  PROMOTION: 'fa-ticket',
  STAFF_MGMT: 'fa-users-gear',
  STORE_MGMT: 'fa-store',
  PRODUCT_CATALOG: 'fa-boxes-stacked',
};

const QUICK_REASONS = [
  'Nâng cấp và bảo trì hệ thống định kỳ',
  'Cập nhật tính năng mới & tối ưu hiệu năng',
  'Tạm dừng để kiểm kê dữ liệu & kho hàng',
  'Khắc phục sự cố kỹ thuật khẩn cấp',
];

const AdminFeatureLockPage = () => {
  const toast = useToast();
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeGroupFilter, setActiveGroupFilter] = useState('ALL');

  // Modal State
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [reasonModalOpen, setReasonModalOpen] = useState(false);
  const [reasonInput, setReasonInput] = useState('');
  const [targetLockState, setTargetLockState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFeatures = async () => {
    setIsLoading(true);
    try {
      const response = await axiosClient.get('/system/features');
      const list = response.data?.data || [];
      setFeatures(list);
    } catch (error) {
      console.error("Lỗi lấy danh sách khóa chức năng:", error);
      toast.error("Không thể tải trạng thái bảo trì chức năng!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const openToggleModal = (feature, willLock) => {
    setSelectedFeature(feature);
    setTargetLockState(willLock);
    setReasonInput(feature.lyDoKhoa || QUICK_REASONS[0]);
    setReasonModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!selectedFeature) return;
    setIsSubmitting(true);
    try {
      const payload = {
        maChucNang: selectedFeature.maChucNang,
        isLocked: targetLockState,
        lyDoKhoa: targetLockState ? reasonInput : null
      };

      const res = await axiosClient.post('/admin/system/features/toggle', payload);
      toast.success(res.data?.message || 'Cập nhật trạng thái thành công!');
      setReasonModalOpen(false);
      fetchFeatures();
    } catch (error) {
      console.error("Lỗi toggle khóa chức năng:", error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thay đổi trạng thái!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Group list
  const groups = useMemo(() => {
    const setGroup = new Set();
    features.forEach(f => { if (f.nhomChucNang) setGroup.add(f.nhomChucNang); });
    return ['ALL', ...Array.from(setGroup)];
  }, [features]);

  // Filtered list
  const filteredFeatures = useMemo(() => {
    return features.filter(f => {
      const matchSearch = f.tenChucNang?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.maChucNang?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchGroup = activeGroupFilter === 'ALL' || f.nhomChucNang === activeGroupFilter;
      return matchSearch && matchGroup;
    });
  }, [features, searchTerm, activeGroupFilter]);

  // KPI Stats
  const totalCount = features.length;
  const lockedCount = features.filter(f => f.isLocked).length;
  const activeCount = totalCount - lockedCount;

  return (
    <AdminLayout>
      <div style={{ padding: '24px 32px', maxWidth: 1400, margin: '0 auto' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 800, color: '#1a1217', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #ef4444, #991b1b)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                <i className="fa-solid fa-shield-halved" style={{ fontSize: 20 }} />
              </div>
              Quản lý Khóa & Bảo trì Chức năng
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
              Kiểm soát trạng thái hoạt động của các Module / Chức năng hệ thống. Bật bảo trì tức thì khi nâng cấp hoặc khắc phục sự cố.
            </p>
          </div>

          <button 
            onClick={fetchFeatures}
            disabled={isLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#ffffff', color: '#334155', border: '1px solid #e2e8f0', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
          >
            <i className={`fa-solid fa-rotate-right ${isLoading ? 'fa-spin' : ''}`} style={{ color: 'var(--admin-primary)' }} />
            {isLoading ? 'Đang cập nhật...' : 'Làm mới'}
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <i className="fa-solid fa-cubes" />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Tổng số Module</div>
            </div>
          </div>

          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px 24px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <i className="fa-solid fa-circle-check" />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#16a34a' }}>{activeCount}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Đang Hoạt Động</div>
            </div>
          </div>

          <div style={{ background: lockedCount > 0 ? '#fff5f5' : '#ffffff', borderRadius: 16, padding: '20px 24px', border: lockedCount > 0 ? '1px solid #fecaca' : '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: lockedCount > 0 ? '#fee2e2' : '#f8fafc', color: lockedCount > 0 ? '#dc2626' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
              <i className="fa-solid fa-triangle-exclamation" />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: lockedCount > 0 ? '#dc2626' : '#64748b' }}>{lockedCount}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: lockedCount > 0 ? '#dc2626' : '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Đang Khóa Bảo Trì</div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          
          {/* Group Filter Pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {groups.map(grp => {
              const label = grp === 'ALL' ? 'Tất cả nhóm' : grp;
              const isSelected = activeGroupFilter === grp;
              return (
                <button
                  key={grp}
                  onClick={() => setActiveGroupFilter(grp)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    fontSize: 13,
                    fontWeight: 600,
                    border: 'none',
                    cursor: 'pointer',
                    background: isSelected ? 'var(--admin-primary)' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: 260 }}>
            <input 
              type="text" 
              placeholder="🔍 Tìm mã hoặc tên module..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none' }}
            />
          </div>
        </div>

        {/* Features Grid */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)' }} />
            <p style={{ marginTop: 12, fontSize: 15 }}>Đang lấy trạng thái khóa chức năng...</p>
          </div>
        ) : filteredFeatures.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
            <i className="fa-solid fa-circle-notch" style={{ fontSize: 40, color: '#94a3b8', marginBottom: 12 }} />
            <p style={{ color: '#64748b', fontSize: 15, margin: 0 }}>Không tìm thấy chức năng phù hợp</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
            {filteredFeatures.map(feat => {
              const iconClass = FEATURE_ICONS[feat.maChucNang] || 'fa-cubes';
              const isLocked = Boolean(feat.isLocked);

              return (
                <div 
                  key={feat.maChucNang}
                  style={{
                    background: isLocked ? '#fffdfd' : '#ffffff',
                    borderRadius: 16,
                    border: isLocked ? '2px solid #fca5a5' : '1px solid #e2e8f0',
                    padding: 24,
                    boxShadow: isLocked ? '0 8px 24px rgba(239, 68, 68, 0.08)' : '0 2px 10px rgba(0,0,0,0.03)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {/* Category Accent Bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: isLocked ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #22c55e, #16a34a)' }} />

                  <div>
                    {/* Top Row: Icon + Code + Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: isLocked ? '#fee2e2' : '#f1f5f9', color: isLocked ? '#dc2626' : 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          <i className={`fa-solid ${iconClass}`} />
                        </div>
                        <div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 6, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            {feat.nhomChucNang || 'Hệ thống'}
                          </span>
                          <div style={{ fontSize: 12, fontWeight: 700, color: isLocked ? '#b91c1c' : '#0284c7', marginTop: 2 }}>
                            {feat.maChucNang}
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 12px',
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        background: isLocked ? '#fee2e2' : '#dcfce7',
                        color: isLocked ? '#991b1b' : '#166534',
                      }}>
                        <i className={`fa-solid ${isLocked ? 'fa-lock' : 'fa-check'}`} />
                        {isLocked ? 'ĐANG BẢO TRÌ' : 'HOẠT ĐỘNG'}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 12px 0' }}>
                      {feat.tenChucNang}
                    </h3>

                    {/* Locked reason display */}
                    {isLocked && (
                      <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 13, color: '#991b1b', marginBottom: 16 }}>
                        <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                        <strong>Thông báo bảo trì:</strong> {feat.lyDoKhoa || 'Bảo trì hệ thống'}
                      </div>
                    )}
                  </div>

                  {/* Bottom Toggle Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTop: '1px dashed #e2e8f0', marginTop: 12 }}>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      <i className="fa-regular fa-clock" style={{ marginRight: 4 }} />
                      Cập nhật: {feat.updatedBy || 'Hệ thống'}
                    </span>

                    {/* Action Button */}
                    <button
                      onClick={() => openToggleModal(feat, !isLocked)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 16px',
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        background: isLocked ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: '#ffffff',
                        boxShadow: isLocked ? '0 2px 8px rgba(22, 163, 74, 0.3)' : '0 2px 8px rgba(220, 38, 38, 0.3)',
                        transition: 'transform 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <i className={`fa-solid ${isLocked ? 'fa-lock-open' : 'fa-lock'}`} />
                      {isLocked ? 'Mở khóa module' : 'Khóa bảo trì'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Confirmation & Reason Modal */}
      {reasonModalOpen && selectedFeature && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 520, background: '#ffffff', borderRadius: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '20px 24px', background: targetLockState ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #16a34a, #15803d)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 700 }}>
                <i className={`fa-solid ${targetLockState ? 'fa-lock' : 'fa-lock-open'}`} />
                {targetLockState ? 'Khóa bảo trì Chức năng' : 'Mở khóa Chức năng'}
              </div>
              <button onClick={() => setReasonModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: 0.8 }}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              <p style={{ color: '#334155', fontSize: 15, margin: '0 0 16px 0', lineHeight: 1.5 }}>
                Bạn đang chuẩn bị {targetLockState ? <strong style={{ color: '#dc2626' }}>TẠM KHÓA BẢO TRÌ</strong> : <strong style={{ color: '#16a34a' }}>MỞ KHÓA HOẠT ĐỘNG</strong>} module:
              </p>

              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{selectedFeature.tenChucNang}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Mã module: <code>{selectedFeature.maChucNang}</code></div>
              </div>

              {targetLockState && (
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 14, color: '#334155', marginBottom: 8 }}>
                    Lý do khóa / Thông báo hiển thị cho người dùng:
                  </label>
                  
                  {/* Quick reason choices */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    {QUICK_REASONS.map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setReasonInput(r)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 12px',
                          borderRadius: 8,
                          fontSize: 13,
                          border: reasonInput === r ? '1px solid #ef4444' : '1px solid #e2e8f0',
                          background: reasonInput === r ? '#fef2f2' : '#ffffff',
                          color: reasonInput === r ? '#991b1b' : '#475569',
                          cursor: 'pointer',
                          fontWeight: reasonInput === r ? 600 : 400,
                        }}
                      >
                        • {r}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={3}
                    value={reasonInput}
                    onChange={(e) => setReasonInput(e.target.value)}
                    placeholder="Nhập thông báo tùy chỉnh cho người dùng khi truy cập..."
                    style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, outline: 'none', resize: 'vertical' }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                onClick={() => setReasonModalOpen(false)}
                disabled={isSubmitting}
                style={{ padding: '10px 20px', borderRadius: 10, background: '#ffffff', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmToggle}
                disabled={isSubmitting}
                style={{
                  padding: '10px 24px',
                  borderRadius: 10,
                  background: targetLockState ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {isSubmitting ? 'Đang xử lý...' : (targetLockState ? 'Xác nhận Khóa' : 'Xác nhận Mở khóa')}
              </button>
            </div>

          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminFeatureLockPage;
