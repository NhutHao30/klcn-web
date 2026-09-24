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

  const handleSign = async (vaitroKy) => {
    if (!selectedDoc) return;
    setIsSigning(true);
    try {
      const res = await axiosClient.post('/chu-ky/xac-nhan', {
        loai_phieu: docType,
        id: docType === 'hdnhap' ? selectedDoc.MAHDNHAP : selectedDoc.id,
        vaitro_ky: vaitroKy
      });

      if (res.data?.status) {
        toast.success(res.data.message || 'Đã ký duyệt thành công!');
        setShowModal(false);
        fetchPendingSignatures();
      }
    } catch (e) {
      toast.error('Lỗi khi ký: ' + (e.response?.data?.error || e.message));
    } finally {
      setIsSigning(false);
    }
  };

  const getRoleLabel = (role) => {
    const r = Number(role);
    if (r === 0) return 'Giám đốc / Quản lý tổng';
    if (r === 1) return 'Quản lý chi nhánh / Kế toán';
    if (r === 2) return 'Thủ kho / Nhân viên';
    return 'Nhân viên';
  };

  const getDocStatusBadge = (status) => {
    if (status === 'hoan_tat_ky') {
      return <span style={{ backgroundColor: '#22c55e', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>✓ Đã Ký Đủ Các Bên</span>;
    } else if (status === 'da_ky_mot_phan') {
      return <span style={{ backgroundColor: '#f59e0b', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>⏳ Đã Ký Một Phần</span>;
    }
    return <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>⚠️ Chờ Ký Duyệt</span>;
  };

  const currentList = activeTab === 'hdnhap' 
    ? (data.hd_nhap?.[filterType] || [])
    : (data.bien_ban_huy?.[filterType] || []);

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>
            Quản Lý Duyệt & Ký Số Nội Bộ
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>
            Theo dõi, phê duyệt và đóng dấu chữ ký số 4 bên (Thủ kho, NCC, Kế toán, Giám đốc)
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={fetchPendingSignatures}>
          <i className="fa-solid fa-rotate" style={{ marginRight: '6px' }}></i> Làm Mới
        </button>
      </div>

      {/* Metrics Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #ef4444', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>CẦN TÔI KÝ DUYỆT</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#ef4444', marginTop: '4px' }}>
            {data.total_pending}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Phiếu đang chờ chữ ký của bạn</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #3b82f6', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>PHIẾU NHẬP KHO CHỜ KÝ</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#3b82f6', marginTop: '4px' }}>
            {data.hd_nhap?.pending?.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duyệt hạch toán tiền hàng nhập</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #f59e0b', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold' }}>BIÊN BẢN HỦY LÔ CHỜ KÝ</div>
          <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>
            {data.bien_ban_huy?.pending?.length || 0}
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>Duyệt giảm số lượng tồn kho hủy</div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #e2e8f0', marginBottom: '20px', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className={`admin-btn ${activeTab === 'hdnhap' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setActiveTab('hdnhap')}
              style={{ position: 'relative' }}
            >
              <i className="fa-solid fa-file-invoice-dollar" style={{ marginRight: '6px' }}></i>
              Phiếu Nhập Kho ({data.hd_nhap?.all?.length || 0})
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
              style={{ marginBottom: 0, width: '180px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="pending">⚠️ Cần Tôi Ký</option>
              <option value="signed">✓ Đã Ký Xong</option>
              <option value="all">Tất Cả Phiếu</option>
            </select>
          </div>
        </div>

        {/* Table List */}
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '30px' }}>Đang tải danh sách cần ký...</p>
        ) : currentList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <i className="fa-solid fa-folder-open" style={{ fontSize: '40px', marginBottom: '10px', color: '#cbd5e1' }}></i>
            <p>Không có phiếu nào trong mục này</p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Phiếu</th>
                  <th>Ngày Lập</th>
                  <th>Người Lập (Thủ Kho)</th>
                  {activeTab === 'hdnhap' ? <th>Nhà Cung Cấp</th> : <th>Mã Lô Hàng</th>}
                  {activeTab === 'hdnhap' ? <th style={{ textAlign: 'right' }}>Tổng Tiền</th> : <th style={{ textAlign: 'center' }}>SL Hủy</th>}
                  <th style={{ textAlign: 'center' }}>Các Bên Đã Ký</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái Ký</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {currentList.map(item => {
                  const id = activeTab === 'hdnhap' ? item.MAHDNHAP : item.id;
                  const dateStr = activeTab === 'hdnhap' ? item.NGAYLAP : item.NGAY_HUY;
                  const creator = item.nhanvien?.HOTEN || item.USERNAME || 'Thủ kho';
                  const nccOrLo = activeTab === 'hdnhap' ? (item.nhacungcap?.TENNCC || item.MANCC || '-') : item.MALOHAN;

                  const hasThuKho = !!item.KY_THU_KHO;
                  const hasNcc = activeTab === 'hdnhap' ? !!item.KY_NCC : true;
                  const hasKeToan = !!item.KY_KE_TOAN;
                  const hasGiamDoc = !!item.KY_GIAM_DOC;

                  return (
                    <tr key={id}>
                      <td><b>{id}</b></td>
                      <td>{dateStr ? new Date(dateStr).toLocaleString('vi-VN') : '-'}</td>
                      <td>{creator}</td>
                      <td><b>{nccOrLo}</b></td>
                      {activeTab === 'hdnhap' ? (
                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d82d8b' }}>
                          {Number(item.TONGTIEN_NHAP || 0).toLocaleString('vi-VN')} ₫
                        </td>
                      ) : (
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#ef4444' }}>
                          {item.SOLUONG_HUY} cái
                        </td>
                      )}
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: hasThuKho ? '#dcfce7' : '#f1f5f9', color: hasThuKho ? '#15803d' : '#94a3b8' }}>Thủ kho</span>
                          {activeTab === 'hdnhap' && (
                            <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: hasNcc ? '#dcfce7' : '#f1f5f9', color: hasNcc ? '#15803d' : '#94a3b8' }}>NCC</span>
                          )}
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: hasKeToan ? '#dcfce7' : '#f1f5f9', color: hasKeToan ? '#15803d' : '#94a3b8' }}>Kế toán</span>
                          <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', backgroundColor: hasGiamDoc ? '#dcfce7' : '#f1f5f9', color: hasGiamDoc ? '#15803d' : '#94a3b8' }}>Giám đốc</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {getDocStatusBadge(item.TRANGTHAI_KY)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="admin-btn admin-btn-info"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setSelectedDoc(item);
                            setDocType(activeTab);
                            setShowModal(true);
                          }}
                        >
                          <i className="fa-solid fa-signature" style={{ marginRight: '4px' }}></i> Xem & Ký Duyệt
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
          <div className="admin-card" style={{ maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                Chi Tiết & Xác Nhận Ký Duyệt ({docType === 'hdnhap' ? `Phiếu Nhập ${selectedDoc.MAHDNHAP}` : `Biên Bản Hủy ${selectedDoc.id}`})
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>

            {/* General Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '15px' }}>
              <div><b>Người Lập:</b> {selectedDoc.nhanvien?.HOTEN || selectedDoc.USERNAME}</div>
              <div><b>Thời Gian:</b> {new Date(selectedDoc.created_at || selectedDoc.NGAYLAP || selectedDoc.NGAY_HUY).toLocaleString('vi-VN')}</div>
              {docType === 'hdnhap' ? (
                <>
                  <div><b>Nhà Cung Cấp:</b> {selectedDoc.nhacungcap?.TENNCC || selectedDoc.MANCC}</div>
                  <div><b>Tổng Tiền Nhập:</b> <b style={{ color: '#d82d8b' }}>{Number(selectedDoc.TONGTIEN_NHAP || 0).toLocaleString('vi-VN')} ₫</b></div>
                </>
              ) : (
                <>
                  <div><b>Mã Lô Hàng:</b> {selectedDoc.MALOHAN}</div>
                  <div><b>Số Lượng Hủy:</b> <b style={{ color: '#ef4444' }}>{selectedDoc.SOLUONG_HUY} cái</b></div>
                </>
              )}
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
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', fontWeight: 'bold' }}>{ct.sanpham?.TENSP || ct.MASP}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{ct.SOLUONGTCT}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#16a34a', fontWeight: 'bold' }}>{ct.SOLUONGTN}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>{Number(ct.DONGIANHAP || 0).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 'bold', color: '#d82d8b' }}>{(ct.SOLUONGTN * ct.DONGIANHAP).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #cbd5e1' }}>{formatDateOnly(ct.HSD_LO)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signature Grid Display */}
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '15px 0 10px 0', color: '#1e293b' }}>
              Bảng Đóng Dấu Chữ Ký Số Các Bên
            </h3>

            {(() => {
              const myUsername = currentUser?.USERNAME;
              const chucVu = (currentUser?.nhanvien?.CHUCVU || '').toLowerCase();
              const role = Number(currentUser?.MAROLE);

              const isKeToanUser = chucVu.includes('kế toán') || chucVu.includes('ke toan');
              const isGiamDocUser = chucVu.includes('giám đốc') || chucVu.includes('giam doc') || chucVu.includes('quản lý chi nhánh') || chucVu.includes('quan ly chi nhanh') || (role === 1 && !isKeToanUser) || (role === 0 && !isKeToanUser && !chucVu.includes('thủ kho'));
              const isThuKhoUser = chucVu.includes('thủ kho') || chucVu.includes('thu kho') || chucVu.includes('người lập') || (role === 2 && !isKeToanUser);

              const creatorUsername = selectedDoc.USERNAME || selectedDoc.nhanvien?.USERNAME;
              const signedAsCreator = (creatorUsername === myUsername && !!selectedDoc.KY_THU_KHO);
              const signedAsKeToan = (selectedDoc.NGUOI_KY_KE_TOAN === myUsername);
              const signedAsGiamDoc = (selectedDoc.NGUOI_KY_GIAM_DOC === myUsername);
              const hasSignedAnySlot = signedAsCreator || signedAsKeToan || signedAsGiamDoc;

              return (
                <div style={{ display: 'grid', gridTemplateColumns: docType === 'hdnhap' ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  
                  {/* 1. Thủ Kho */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>THỦ KHO / NGƯỜI LẬP</div>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', my: '6px' }}>
                      {selectedDoc.KY_THU_KHO ? (
                        <img src={selectedDoc.KY_THU_KHO} alt="Chữ ký thủ kho" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{selectedDoc.nhanvien?.HOTEN || selectedDoc.USERNAME}</div>
                    {!selectedDoc.KY_THU_KHO && (
                      isThuKhoUser && !hasSignedAnySlot ? (
                        <button
                          className="admin-btn admin-btn-primary"
                          style={{ padding: '3px 8px', fontSize: '11px', marginTop: '6px', width: '100%' }}
                          onClick={() => handleSign('thu_kho')}
                          disabled={isSigning}
                        >
                          Ký Xác Nhận (Thủ Kho)
                        </button>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                          {hasSignedAnySlot ? 'Đã ký vị trí khác' : 'Cần vai trò Thủ kho'}
                        </div>
                      )
                    )}
                  </div>

                  {/* 2. Đại diện NCC (Chỉ với Phiếu Nhập) */}
                  {docType === 'hdnhap' && (
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>ĐẠI DIỆN NCC</div>
                      <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', my: '6px' }}>
                        {selectedDoc.KY_NCC ? (
                          <img src={selectedDoc.KY_NCC} alt="Chữ ký NCC" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký live)</span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{selectedDoc.nhacungcap?.TENNCC || 'Bên giao hàng'}</div>
                    </div>
                  )}

                  {/* 3. Kế Toán */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>KẾ TOÁN HẠCH TOÁN</div>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', my: '6px' }}>
                      {selectedDoc.KY_KE_TOAN ? (
                        <img src={selectedDoc.KY_KE_TOAN} alt="Chữ ký Kế toán" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Chưa duyệt)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{selectedDoc.NGUOI_KY_KE_TOAN || 'Bộ phận Kế toán'}</div>
                    {!selectedDoc.KY_KE_TOAN && (
                      isKeToanUser && !hasSignedAnySlot ? (
                        <button
                          className="admin-btn admin-btn-success"
                          style={{ padding: '3px 8px', fontSize: '11px', marginTop: '6px', width: '100%' }}
                          onClick={() => handleSign('ke_toan')}
                          disabled={isSigning}
                        >
                          Ký Xác Nhận (Kế Toán)
                        </button>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                          {hasSignedAnySlot ? 'Đã ký vị trí khác' : 'Cần vai trò Kế toán'}
                        </div>
                      )
                    )}
                  </div>

                  {/* 4. Giám Đốc Chi Nhánh */}
                  <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', textAlign: 'center', backgroundColor: '#ffffff' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569' }}>GIÁM ĐỐC CHI NHÁNH</div>
                    <div style={{ height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', my: '6px' }}>
                      {selectedDoc.KY_GIAM_DOC ? (
                        <img src={selectedDoc.KY_GIAM_DOC} alt="Chữ ký Giám đốc" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>(Chưa phê duyệt)</span>
                      )}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>{selectedDoc.NGUOI_KY_GIAM_DOC || 'Giám đốc chi nhánh'}</div>
                    {!selectedDoc.KY_GIAM_DOC && (
                      isGiamDocUser && !hasSignedAnySlot ? (
                        <button
                          className="admin-btn admin-btn-warning"
                          style={{ padding: '3px 8px', fontSize: '11px', marginTop: '6px', width: '100%', color: '#000' }}
                          onClick={() => handleSign('giam_doc')}
                          disabled={isSigning}
                        >
                          Ký Phê Duyệt (Giám Đốc)
                        </button>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px' }}>
                          {hasSignedAnySlot ? 'Đã ký vị trí khác' : 'Cần vai trò Giám đốc'}
                        </div>
                      )
                    )}
                  </div>

                </div>
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
                In {docType === 'hdnhap' ? 'Phiếu Nhập Kho' : 'Biên Bản Hủy'} (PDF/Khổ A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminSignatureApprovalPage;
