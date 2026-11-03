import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';
import { getCurrentUser } from '../../services/authService';
import SignatureCanvas from '../../components/Signature/SignatureCanvas';
import '../../css/admin.css';

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

const renderSignaturePreview = (sigVal, label, signerName) => {
  if (!sigVal) {
    return <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>;
  }
  if (String(sigVal).startsWith('data:image/') || String(sigVal).startsWith('http') || String(sigVal).startsWith('/')) {
    return (
      <img
        src={sigVal}
        alt={`Chữ ký ${label}`}
        style={{ maxHeight: '75px', maxWidth: '88%', objectFit: 'contain', display: 'block', margin: '0 auto' }}
      />
    );
  }
  // Con dấu chữ ký số điện tử (hash SHA-256)
  return (
    <div style={{
      border: '2px double #16a34a',
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      padding: '6px 10px',
      borderRadius: '6px',
      fontSize: '11px',
      fontWeight: 'bold',
      lineHeight: 1.35,
      maxWidth: '92%'
    }}>
      <div>✓ ĐÃ KÝ SỐ ĐIỆN TỬ</div>
      <div style={{ fontSize: '10px', color: '#166534', fontWeight: 'normal', marginTop: '2px' }}>
        {signerName || label}
      </div>
      <div style={{ fontSize: '9px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
        #{String(sigVal).slice(0, 12).toUpperCase()}
      </div>
    </div>
  );
};

const AdminSignatureApprovalPage = () => {
  const toast = useToast();
  const [currentUser, setCurrentUser] = useState(null);
  const [data, setData] = useState({
    total_pending: 0,
    hd_nhap: { pending: [], signed: [], all: [] },
    bien_ban_huy: { pending: [], signed: [], all: [] }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('hdnhap'); // 'hdnhap' | 'bien_ban_huy'
  const [filterType, setFilterType] = useState('pending'); // 'pending' | 'signed' | 'all'

  // Modal Detail
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [docType, setDocType] = useState('hdnhap'); // 'hdnhap' | 'bien_ban_huy'
  const [showModal, setShowModal] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState(null);
  const [sigCanvasKey, setSigCanvasKey] = useState(1);

  useEffect(() => {
    fetchCurrentUser();
    fetchPendingSignatures();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const u = await getCurrentUser();
      setCurrentUser(u);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPendingSignatures = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/chu-ky/danh-sach-cho-ky');
      if (res.data?.status) {
        setData(res.data);
      }
    } catch (e) {
      toast.error('Lỗi khi tải danh sách phiếu chờ ký: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Xác định vai trò tài khoản hiện tại theo đúng bảng vaiTro
  const vtId = Number(currentUser?.vaiTroId ?? currentUser?.vai_tro_id ?? currentUser?.vaitro?.id ?? 0);
  const maRole = Number(currentUser?.MAROLE ?? -1);
  const usernameLower = String(currentUser?.username || currentUser?.USERNAME || '').toLowerCase();

  // Admin (vaiTroId = 1) tuyệt đối không được tham gia ký duyệt
  const isAdminUser = vtId === 1 || maRole === 0 || usernameLower === 'admin';
  // Giám đốc (vaiTroId = 8) chỉ duyệt yêu cầu nhập hàng khi cần, không ký vào vị trí chi nhánh
  const isDirectorUser = !isAdminUser && (vtId === 8 || maRole === 5);
  // 3 vai trò được phép ký đúng vị trí của mình:
  const isBranchManagerUser = !isAdminUser && !isDirectorUser && (vtId === 2 || maRole === 1);
  const isWarehouseUser = !isAdminUser && !isDirectorUser && vtId === 4;
  const isAccountantUser = !isAdminUser && !isDirectorUser && vtId === 7;

  const getMyRoleSummary = () => {
    if (isAdminUser) return { label: 'Quản trị viên (Admin)', canSign: false, note: 'Role Admin chỉ giám sát hệ thống, KHÔNG được phép tham gia vào việc ký duyệt chứng từ.' };
    if (isDirectorUser) return { label: 'Ban Giám Đốc', canSign: false, note: 'Ban Giám Đốc chỉ duyệt đơn yêu cầu nhập hàng khi cần thiết, không ký trực tiếp đơn nhập/biên bản hủy của chi nhánh.' };
    if (isBranchManagerUser) return { label: 'Quản lý chi nhánh', canSign: true, slotLabel: 'QUẢN LÝ CHI NHÁNH', note: 'Khi bạn ký duyệt, đơn nhập hàng / biên bản hủy sẽ hoàn tất ngay mà không cần các vai trò khác ký thêm.' };
    if (isWarehouseUser) return { label: 'Nhân viên kho', canSign: true, slotLabel: 'NHÂN VIÊN KHO', note: 'Bạn chỉ được ký vào vị trí Nhân viên kho. Nếu chưa có chữ ký của Quản lý chi nhánh, cần thêm chữ ký của Nhân viên kế toán.' };
    if (isAccountantUser) return { label: 'Nhân viên kế toán', canSign: true, slotLabel: 'NHÂN VIÊN KẾ TOÁN', note: 'Bạn chỉ được ký vào vị trí Nhân viên kế toán. Nếu chưa có chữ ký của Quản lý chi nhánh, cần thêm chữ ký của Nhân viên kho.' };
    return { label: 'Nhân viên', canSign: false, note: 'Vai trò hiện tại không tham gia ký duyệt chứng từ kho/kế toán.' };
  };

  const roleSummary = getMyRoleSummary();

  const handleSign = async (vaitroKy) => {
    if (!selectedDoc) return;
    if (isAdminUser) {
      toast.error('Tài khoản Quản trị viên (Admin) không được phép tham gia vào việc ký duyệt!');
      return;
    }
    setIsSigning(true);
    try {
      const res = await axiosClient.post('/chu-ky/xac-nhan', {
        loai_phieu: docType,
        id: docType === 'hdnhap' ? selectedDoc.MAHDNHAP : selectedDoc.id,
        vaitro_ky: vaitroKy,
        signature_data: drawnSignature || null,
      });

      if (res.data?.status) {
        toast.success(res.data.message || 'Đã ký duyệt thành công!');
        setShowModal(false);
        setDrawnSignature(null);
        fetchPendingSignatures();
      } else {
        toast.error(res.data?.error || res.data?.message || 'Không thể ký duyệt');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || e.message);
    } finally {
      setIsSigning(false);
    }
  };

  const getDocStatusBadge = (item) => {
    const status = item.TRANGTHAI_KY;
    const hasQuanLy = !!(item.KY_QUAN_LY || item.KY_GIAM_DOC);
    if (status === 'hoan_tat_ky') {
      return (
        <span style={{ backgroundColor: '#22c55e', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
          ✓ {hasQuanLy ? 'QL Chi Nhánh Đã Duyệt' : 'Kho & Kế Toán Đã Ký Đủ'}
        </span>
      );
    } else if (status === 'da_ky_mot_phan') {
      return (
        <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
          ⏳ Đã Ký 1/2 (Chờ Bên Còn Lại)
        </span>
      );
    }
    return (
      <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' }}>
        ⚠️ Chờ Ký Duyệt
      </span>
    );
  };

  const currentList = activeTab === 'hdnhap'
    ? (data.hd_nhap?.[filterType] || [])
    : (data.bien_ban_huy?.[filterType] || []);

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>
            Duyệt & Ký Số Chứng Từ Chi Nhánh
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>
            Quản lý chi nhánh ký duyệt trực tiếp (không cần các vai trò khác ký thêm) — hoặc Nhân viên kho & Nhân viên kế toán cùng ký xác nhận
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={fetchPendingSignatures}>
          <i className="fa-solid fa-rotate" style={{ marginRight: '6px' }}></i> Làm Mới
        </button>
      </div>

      {/* Banner Quy tắc phân quyền ký duyệt */}
      <div style={{
        backgroundColor: isAdminUser ? '#fef2f2' : '#eff6ff',
        border: `1px solid ${isAdminUser ? '#fecaca' : '#bfdbfe'}`,
        color: isAdminUser ? '#991b1b' : '#1e3a8a',
        padding: '12px 16px',
        borderRadius: '10px',
        marginBottom: '18px',
        fontSize: '13px',
        lineHeight: 1.5
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          <i className={`fa-solid ${isAdminUser ? 'fa-ban' : 'fa-shield-halved'}`} style={{ marginRight: '6px' }}></i>
          Vai trò hiện tại của bạn: <span style={{ textDecoration: 'underline' }}>{roleSummary.label}</span>
        </div>
        <div>{roleSummary.note}</div>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #ef4444', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>TỔNG CHỨNG TỪ CHỜ DUYỆT</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>
            {data.total_pending}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Chờ QL Chi nhánh hoặc (Kho + Kế toán) ký</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>ĐƠN NHẬP HÀNG CHỜ KÝ</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
            {data.hd_nhap?.pending?.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duyệt nhập kho chi nhánh</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>BIÊN BẢN HỦY CHỜ KÝ</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
            {data.bien_ban_huy?.pending?.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duyệt giảm số lượng tồn kho hủy</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', paddingBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              className={`admin-btn ${activeTab === 'hdnhap' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveTab('hdnhap')}
              style={{ position: 'relative' }}
            >
              <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '6px' }}></i>
              Đơn Nhập Hàng ({data.hd_nhap?.all?.length || 0})
              {data.hd_nhap?.pending?.length > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', marginLeft: '6px' }}>
                  {data.hd_nhap.pending.length}
                </span>
              )}
            </button>

            <button
              className={`admin-btn ${activeTab === 'bien_ban_huy' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveTab('bien_ban_huy')}
              style={{ position: 'relative' }}
            >
              <i className="fa-solid fa-file-excel" style={{ marginRight: '6px' }}></i>
              Biên Bản Hủy Lô Bánh ({data.bien_ban_huy?.all?.length || 0})
              {data.bien_ban_huy?.pending?.length > 0 && (
                <span style={{ backgroundColor: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', marginLeft: '6px' }}>
                  {data.bien_ban_huy.pending.length}
                </span>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              className="admin-input"
              style={{ marginBottom: 0, width: '190px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="pending">⚠️ Đang Chờ Ký Duyệt</option>
              <option value="signed">✓ Đã Duyệt Hoàn Tất</option>
              <option value="all">Tất Cả Chứng Từ</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách chứng từ...</p>
        ) : currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i className="fa-solid fa-folder-open" style={{ fontSize: '40px', marginBottom: '10px', color: '#cbd5e1' }}></i>
            <p>Không có chứng từ nào trong mục này</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Chứng Từ</th>
                  <th>Chi Nhánh</th>
                  <th>Ngày Lập</th>
                  <th>Người Lập</th>
                  {activeTab === 'hdnhap' ? <th>Nhà Cung Cấp</th> : <th>Mã Lô Hàng</th>}
                  {activeTab === 'hdnhap' ? <th style={{ textAlign: 'right' }}>Tổng Tiền</th> : <th style={{ textAlign: 'center' }}>SL Hủy</th>}
                  <th style={{ textAlign: 'center' }}>Chữ Ký Các Vai Trò</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái Duyệt</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(item => {
                  const id = activeTab === 'hdnhap' ? item.MAHDNHAP : (item.MABB || `BBH-${item.id}`);
                  const dateStr = activeTab === 'hdnhap' ? item.NGAYLAP : item.NGAY_HUY;
                  const creator = item.nhanvien?.HOTEN || item.USERNAME || 'Quản lý CN';
                  const branchName = item.cuahang?.TENCUAHANG || `Chi nhánh #${item.cuaHangId || 1}`;
                  const nccOrLo = activeTab === 'hdnhap' ? (item.nhacungcap?.TENNCC || item.MANCC || '-') : item.MALOHAN;

                  const hasQuanLy = !!(item.KY_QUAN_LY || item.KY_GIAM_DOC);
                  const hasThuKho = !!item.KY_THU_KHO;
                  const hasKeToan = !!item.KY_KE_TOAN;

                  return (
                    <tr key={id}>
                      <td><b>{id}</b></td>
                      <td><span style={{ color: '#0369a1', fontWeight: 600, fontSize: '12px' }}>{branchName}</span></td>
                      <td>{dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '-'}</td>
                      <td>{creator}</td>
                      <td><b>{nccOrLo}</b></td>
                      {activeTab === 'hdnhap' ? (
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d82d8b' }}>
                          {Number(item.TONGTIEN_NHAP ?? item.TONGTIEN ?? 0).toLocaleString('vi-VN')} ₫
                        </td>
                      ) : (
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>
                          {item.SOLUONG_HUY ?? item.SO_LUONG_HUY ?? 0} cái
                        </td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <span
                            title="Quản lý chi nhánh ký duyệt sẽ hoàn tất ngay, không cần Kho & Kế toán ký"
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: hasQuanLy ? 'bold' : 'normal',
                              backgroundColor: hasQuanLy ? '#dcfce7' : '#f1f5f9',
                              color: hasQuanLy ? '#15803d' : '#94a3b8',
                              border: hasQuanLy ? '1px solid #86efac' : '1px solid #e2e8f0'
                            }}
                          >
                            {hasQuanLy ? '✓ ' : ''}QL Chi nhánh
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: hasThuKho ? 'bold' : 'normal',
                              backgroundColor: hasThuKho ? '#dcfce7' : '#f1f5f9',
                              color: hasThuKho ? '#15803d' : (hasQuanLy ? '#cbd5e1' : '#94a3b8'),
                              textDecoration: (!hasThuKho && hasQuanLy) ? 'line-through' : 'none'
                            }}
                          >
                            {hasThuKho ? '✓ ' : ''}NV Kho
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontWeight: hasKeToan ? 'bold' : 'normal',
                              backgroundColor: hasKeToan ? '#dcfce7' : '#f1f5f9',
                              color: hasKeToan ? '#15803d' : (hasQuanLy ? '#cbd5e1' : '#94a3b8'),
                              textDecoration: (!hasKeToan && hasQuanLy) ? 'line-through' : 'none'
                            }}
                          >
                            {hasKeToan ? '✓ ' : ''}NV Kế toán
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getDocStatusBadge(item)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="admin-btn admin-btn-info"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setSelectedDoc(item);
                            setDocType(activeTab);
                            setDrawnSignature(null);
                            setSigCanvasKey(prev => prev + 1);
                            setShowModal(true);
                          }}
                        >
                          <i className="fa-solid fa-signature" style={{ marginRight: '4px' }}></i>
                          {isAdminUser || isDirectorUser ? 'Xem Chi Tiết' : 'Xem & Ký Duyệt'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL VIEW & SIGN DOCUMENT */}
      {showModal && selectedDoc && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(3px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="admin-card" style={{ maxWidth: '840px', width: '100%', maxHeight: '92vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/assets/IMG/Logo.jpg" alt="Givral Bakery" style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '6px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#5c3d2e' }}>GIVRAL BAKERY</h3>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
                    Chi Tiết & Xác Nhận Ký Duyệt ({docType === 'hdnhap' ? `Đơn Nhập ${selectedDoc.MAHDNHAP}` : `Biên Bản Hủy ${selectedDoc.MABB || selectedDoc.id}`})
                  </h2>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* General Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px', fontSize: '13px' }}>
              <div><b>Người Lập:</b> {selectedDoc.nhanvien?.HOTEN || selectedDoc.USERNAME}</div>
              <div><b>Chi Nhánh:</b> {selectedDoc.cuahang?.TENCUAHANG || `Chi nhánh #${selectedDoc.cuaHangId || 1}`}</div>
              <div><b>Thời Gian:</b> {new Date(selectedDoc.created_at || selectedDoc.NGAYLAP || selectedDoc.NGAY_HUY).toLocaleString('vi-VN')}</div>
              {docType === 'hdnhap' ? (
                <>
                  <div><b>Nhà Cung Cấp:</b> {selectedDoc.nhacungcap?.TENNCC || selectedDoc.MANCC}</div>
                  <div><b>Tổng Tiền Nhập:</b> <b style={{ color: '#d82d8b' }}>{Number(selectedDoc.TONGTIEN_NHAP ?? selectedDoc.TONGTIEN ?? 0).toLocaleString('vi-VN')} ₫</b></div>
                </>
              ) : (
                <>
                  <div><b>Mã Lô Hàng:</b> {selectedDoc.MALOHAN}</div>
                  <div><b>Số Lượng Hủy:</b> <b style={{ color: '#ef4444' }}>{selectedDoc.SOLUONG_HUY ?? selectedDoc.SO_LUONG_HUY ?? 0} cái</b></div>
                </>
              )}
              <div style={{ gridColumn: '1 / -1', color: '#0369a1', fontWeight: 600 }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                Cơ chế duyệt: {selectedDoc.PHUONG_THUC_DUYET || 'Quản lý chi nhánh ký duyệt (1 chữ ký là hoàn tất) HOẶC Nhân viên kho + Nhân viên kế toán cùng ký.'}
              </div>
            </div>

            {/* Product Items Table for HdNhap */}
            {docType === 'hdnhap' && selectedDoc.chitiets && selectedDoc.chitiets.length > 0 && (
              <div style={{ marginBottom: '15px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 6px 0', color: '#334155' }}>Danh Sách Bánh Nhập Kho:</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>STT</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>Sản Phẩm Bánh</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>SL Chứng Từ</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>SL Thực Nhận</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Đơn Giá</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Thành Tiền</th>
                      <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>HSD Lô</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoc.chitiets.map((ct, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{idx + 1}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{ct.sanpham?.TENSP || ct.TENSP || ct.MASP}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{ct.SOLUONGTCT ?? ct.SOLUONG}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{ct.SOLUONGTN ?? ct.SOLUONG}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{Number(ct.DONGIANHAP ?? ct.DONGIA ?? 0).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#d82d8b' }}>{((ct.SOLUONGTN ?? ct.SOLUONG ?? 0) * (ct.DONGIANHAP ?? ct.DONGIA ?? 0)).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{formatDateOnly(ct.HSD_LO || ct.HSD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Pad cho đúng vai trò được phép ký */}
            {(() => {
              const hasQuanLy = !!(selectedDoc.KY_QUAN_LY || selectedDoc.KY_GIAM_DOC);
              const hasThuKho = !!selectedDoc.KY_THU_KHO;
              const hasKeToan = !!selectedDoc.KY_KE_TOAN;
              const isCompleted = selectedDoc.TRANGTHAI_KY === 'hoan_tat_ky' || hasQuanLy || (hasThuKho && hasKeToan);

              const canCurrentUserSignThisDoc = !isCompleted && (
                (isBranchManagerUser && !hasQuanLy) ||
                (isWarehouseUser && !hasThuKho) ||
                (isAccountantUser && !hasKeToan)
              );

              return (
                <>
                  {canCurrentUserSignThisDoc && (
                    <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginBottom: '15px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>
                        <i className="fa-solid fa-pen-nib" style={{ marginRight: '6px', color: '#0284c7' }}></i>
                        Vẽ chữ ký tay của bạn ({roleSummary.label}) trước khi bấm Ký Xác Nhận (Tùy chọn — nếu để trống hệ thống sẽ đóng dấu chữ ký số điện tử):
                      </div>
                      <SignatureCanvas
                        key={sigCanvasKey}
                        height={140}
                        onSave={(img) => setDrawnSignature(img)}
                        onClear={() => setDrawnSignature(null)}
                      />
                    </div>
                  )}

                  <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#1e293b' }}>
                    Bảng Đóng Dấu Chữ Ký Số Theo Vai Trò
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '14px',
                    marginBottom: '20px',
                    alignItems: 'stretch'
                  }}>
                    {/* Ô 1: QUẢN LÝ CHI NHÁNH */}
                    <div style={{
                      border: isBranchManagerUser ? '2px solid #f59e0b' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '14px 12px',
                      backgroundColor: hasQuanLy ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                      minHeight: '240px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#b45309', textTransform: 'uppercase' }}>
                          QUẢN LÝ CHI NHÁNH
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          (Nếu đã ký duyệt → Hoàn tất ngay, không cần Kho & Kế toán ký)
                        </div>
                      </div>

                      <div style={{ height: '90px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                        {renderSignaturePreview(selectedDoc.KY_QUAN_LY || selectedDoc.KY_GIAM_DOC, 'Quản lý chi nhánh', selectedDoc.NGUOI_KY_QUAN_LY || selectedDoc.NGUOI_KY_GIAM_DOC)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                        {selectedDoc.NGUOI_KY_QUAN_LY || selectedDoc.NGUOI_KY_GIAM_DOC || 'Quản lý chi nhánh'}
                      </div>

                      <div style={{ width: '100%', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                        {hasQuanLy ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                            <i className="fa-solid fa-circle-check"></i> Đã ký phê duyệt (Hoàn tất)
                          </span>
                        ) : isCompleted ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>
                            Kho & Kế toán đã ký đủ (Không cần ký thêm)
                          </span>
                        ) : isBranchManagerUser ? (
                          <button
                            className="admin-btn admin-btn-warning"
                            style={{ padding: '6px 12px', fontSize: '12px', width: '100%', color: '#000', fontWeight: '700' }}
                            onClick={() => handleSign('quan_ly')}
                            disabled={isSigning}
                          >
                            <i className="fa-solid fa-stamp" style={{ marginRight: '4px' }}></i>
                            Ký Duyệt (Quản Lý Chi Nhánh)
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chỉ dành cho Quản lý chi nhánh
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ô 2: NHÂN VIÊN KHO */}
                    <div style={{
                      border: isWarehouseUser ? '2px solid #0284c7' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '14px 12px',
                      backgroundColor: hasThuKho ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                      minHeight: '240px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase' }}>
                          NHÂN VIÊN KHO
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          (Ký cùng Kế toán nếu chưa có chữ ký Quản lý CN)
                        </div>
                      </div>

                      <div style={{ height: '90px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                        {renderSignaturePreview(selectedDoc.KY_THU_KHO, 'Nhân viên kho', selectedDoc.NGUOI_KY_THU_KHO)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                        {selectedDoc.NGUOI_KY_THU_KHO || 'Nhân viên kho'}
                      </div>

                      <div style={{ width: '100%', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                        {hasThuKho ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                            <i className="fa-solid fa-circle-check"></i> Đã ký xác nhận
                          </span>
                        ) : hasQuanLy ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>
                            QL Chi nhánh đã duyệt (Không cần ký thêm)
                          </span>
                        ) : isWarehouseUser ? (
                          <button
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '6px 12px', fontSize: '12px', width: '100%', fontWeight: '700' }}
                            onClick={() => handleSign('thu_kho')}
                            disabled={isSigning}
                          >
                            <i className="fa-solid fa-signature" style={{ marginRight: '4px' }}></i>
                            Ký Xác Nhận (Nhân Viên Kho)
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chỉ dành cho Nhân viên kho
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ô 3: NHÂN VIÊN KẾ TOÁN */}
                    <div style={{
                      border: isAccountantUser ? '2px solid #16a34a' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '14px 12px',
                      backgroundColor: hasKeToan ? '#f0fdf4' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      textAlign: 'center',
                      minHeight: '240px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' }}>
                          NHÂN VIÊN KẾ TOÁN
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                          (Ký cùng Nhân viên kho nếu chưa có chữ ký Quản lý CN)
                        </div>
                      </div>

                      <div style={{ height: '90px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '8px 0', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px dashed #cbd5e1' }}>
                        {renderSignaturePreview(selectedDoc.KY_KE_TOAN, 'Nhân viên kế toán', selectedDoc.NGUOI_KY_KE_TOAN)}
                      </div>

                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: '600' }}>
                        {selectedDoc.NGUOI_KY_KE_TOAN || 'Nhân viên kế toán'}
                      </div>

                      <div style={{ width: '100%', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '8px' }}>
                        {hasKeToan ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>
                            <i className="fa-solid fa-circle-check"></i> Đã ký hạch toán
                          </span>
                        ) : hasQuanLy ? (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontStyle: 'italic' }}>
                            QL Chi nhánh đã duyệt (Không cần ký thêm)
                          </span>
                        ) : isAccountantUser ? (
                          <button
                            className="admin-btn admin-btn-success"
                            style={{ padding: '6px 12px', fontSize: '12px', width: '100%', fontWeight: '700' }}
                            onClick={() => handleSign('ke_toan')}
                            disabled={isSigning}
                          >
                            <i className="fa-solid fa-signature" style={{ marginRight: '4px' }}></i>
                            Ký Xác Nhận (Nhân Viên Kế Toán)
                          </button>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
                            Chỉ dành cho Nhân viên kế toán
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowModal(false)}>
                Đóng
              </button>
              <button
                className="admin-btn admin-btn-success"
                onClick={() => window.print()}
              >
                <i className="fa-solid fa-print" style={{ marginRight: '6px' }}></i>
                In {docType === 'hdnhap' ? 'Đơn Nhập Hàng' : 'Biên Bản Hủy'} (PDF/Khổ A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSignatureApprovalPage;
