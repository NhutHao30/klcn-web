import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import '../../css/admin.css';
import { useToast } from '../../components/Toast/Toast';
import { formatImageUrl } from '../../utils/imageUtils';

/* ───────────────────────────────────────────────
   Status badge helpers
   ─────────────────────────────────────────────── */
const STATUS_STYLES = {
  'Chờ tiếp nhận':    { bg: '#fff3cd', color: '#856404', icon: 'fa-clock' },
  'Đã được tiếp nhận':{ bg: '#d1ecf1', color: '#0c5460', icon: 'fa-handshake' },
  'Hoàn thành':       { bg: '#d4edda', color: '#155724', icon: 'fa-circle-check' },
  'Đã hủy':           { bg: '#f8d7da', color: '#721c24', icon: 'fa-ban' },
  'Đang xử lý':       { bg: '#cce5ff', color: '#004085', icon: 'fa-gears' },
  'Đang vận chuyển':  { bg: '#fff3cd', color: '#856404', icon: 'fa-truck-fast' },
  'Đã nhận hàng':     { bg: '#d4edda', color: '#155724', icon: 'fa-box-open' },
  'Hủy':              { bg: '#f8d7da', color: '#721c24', icon: 'fa-ban' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || { bg: '#e2e3e5', color: '#383d41', icon: 'fa-question' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      <i className={`fa-solid ${s.icon}`} /> {status}
    </span>
  );
};

/* ───────────────────────────────────────────────
   Stat Card (mini KPI)
   ─────────────────────────────────────────────── */
const StatCard = ({ icon, label, value, color }) => (
  <div style={{ flex: '1 1 180px', background: '#fff', borderRadius: 14, padding: '18px 22px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
    <div style={{ width: 46, height: 46, borderRadius: 12, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <i className={`fa-solid ${icon}`} style={{ fontSize: 20, color }} />
    </div>
    <div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#1a1217' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */
const AdminTransferPage = () => {
  const toast = useToast();

  // ── State ──
  const [activeTab, setActiveTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [storeEmployees, setStoreEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedReq, setExpandedReq] = useState(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRequest, setNewRequest] = useState({ GHICHU: '', details: [{ MASP: '', SOLUONG: 1 }] });

  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [acceptData, setAcceptData] = useState({ reqId: null, items: [], HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });

  const [showCoordModal, setShowCoordModal] = useState(false);
  const [coordData, setCoordData] = useState({ reqId: null, items: [], MACUAHANG_XUAT: '', HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });

  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveData, setReceiveData] = useState({ transferId: null, details: [] });

  const [detailTransfer, setDetailTransfer] = useState(null);

  // ── Data Fetch ──
  const fetchEmployees = async (storeId) => {
    try {
      const res = await axiosClient.get(`/admin/transfers/employees?store_id=${storeId || ''}`);
      setStoreEmployees(res.data);
    } catch (e) { /* silent */ }
  };

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userRes = await axiosClient.get('/me');
      setCurrentUser(userRes.data);

      const prodRes = await axiosClient.get('/products');
      setProducts(prodRes.data.data ? prodRes.data.data : prodRes.data);

      try {
        const storeRes = await axiosClient.get('/admin/stores');
        const list = Array.isArray(storeRes.data) ? storeRes.data : (storeRes.data?.data || []);
        setStores(list);
      } catch (err) {
        try {
          const storeRes = await axiosClient.get('/stores');
          const list = Array.isArray(storeRes.data) ? storeRes.data : (storeRes.data?.data || []);
          setStores(list);
        } catch (e2) {}
      }

      if (activeTab === 'requests') {
        const res = await axiosClient.get('/admin/transfers/requests');
        setRequests(res.data);
      } else {
        const res = await axiosClient.get('/admin/transfers');
        setTransfers(res.data);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // ── Stats ──
  const stats = useMemo(() => {
    const pending = requests.filter(r => r.TRANGTHAI === 'Chờ tiếp nhận').length;
    const processing = requests.filter(r => r.TRANGTHAI === 'Đã được tiếp nhận').length;
    const completed = requests.filter(r => r.TRANGTHAI === 'Hoàn thành').length;
    const transfersInTransit = transfers.filter(t => t.TRANGTHAI === 'Đang vận chuyển').length;
    return { pending, processing, completed, transfersInTransit };
  }, [requests, transfers]);

  // ── Handlers ──
  const handleCreateRequest = async (e) => {
    e.preventDefault();
    const validDetails = newRequest.details.filter(d => d.MASP && d.SOLUONG > 0);
    if (validDetails.length === 0) { toast.warning('Vui lòng chọn ít nhất 1 sản phẩm!'); return; }

    const targetStoreId = newRequest.MACUAHANG_YEUCAU || userStoreId;
    if (!targetStoreId) {
      toast.warning('Vui lòng chọn chi nhánh yêu cầu nhận hàng!');
      return;
    }

    try {
      await axiosClient.post('/admin/transfers/requests', {
        ...newRequest,
        MACUAHANG_YEUCAU: targetStoreId,
        details: validDetails
      });
      toast.success('Tạo yêu cầu nhập hàng thành công!');
      setShowCreateModal(false);
      setNewRequest({ GHICHU: '', MACUAHANG_YEUCAU: '', details: [{ MASP: '', SOLUONG: 1 }] });
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenAcceptModal = (req) => {
    const items = req.details.map(d => ({ MASP: d.MASP, TENSP: d.TENSP, SOLUONG: d.SOLUONG_YEUCAU, selected: true }));
    setAcceptData({ reqId: req.ID_YEUCAU, items, HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });
    fetchEmployees(currentUser?.nhanvien?.MACUAHANG);
    setShowAcceptModal(true);
  };

  const handleAcceptRequest = async (e) => {
    e.preventDefault();
    const selectedItems = acceptData.items.filter(i => i.selected).map(i => ({ MASP: i.MASP, SOLUONG: i.SOLUONG }));
    if (selectedItems.length === 0) { toast.warning('Chọn ít nhất 1 sản phẩm để điều chuyển!'); return; }
    try {
      await axiosClient.post(`/admin/transfers/requests/${acceptData.reqId}/accept`, { ...acceptData, items: selectedItems });
      toast.success('Tiếp nhận thành công! Phiếu điều chuyển đã tạo.');
      setShowAcceptModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleOpenCoordModal = (req) => {
    const items = req.details.map(d => ({ MASP: d.MASP, TENSP: d.TENSP, SOLUONG: d.SOLUONG_YEUCAU, selected: true }));
    setCoordData({ reqId: req.ID_YEUCAU, items, MACUAHANG_XUAT: '', HINHTHUC_VANCHUYEN: 'Tự vận chuyển', MA_VANDON: '', NGUOI_VANCHUYEN: '', PHI_VANCHUYEN: 0, GHICHU: '' });
    setShowCoordModal(true);
  };

  const handleCoordinateRequest = async (e) => {
    e.preventDefault();
    const selectedItems = coordData.items.filter(i => i.selected).map(i => ({ MASP: i.MASP, SOLUONG: i.SOLUONG }));
    if (selectedItems.length === 0) { toast.warning('Chọn ít nhất 1 sản phẩm!'); return; }
    try {
      await axiosClient.post(`/admin/transfers/requests/${coordData.reqId}/coordinate`, { ...coordData, items: selectedItems });
      toast.success('Điều phối thành công!');
      setShowCoordModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const updateTransferStatus = async (id, status, extra = null) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái thành: ${status}?`)) return;
    try {
      let payload = { TRANGTHAI: status };
      if (extra) payload = { ...payload, ...extra };
      await axiosClient.put(`/admin/transfers/${id}/status`, payload);
      toast.success('Cập nhật thành công!');
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleReceiveRequest = async (e) => {
    e.preventDefault();
    const invalid = receiveData.details.some(d => parseInt(d.SOLUONG_NHAN) < parseInt(d.SOLUONG_XUAT) && (!d.LYDO_HAOHUT || !d.LYDO_HAOHUT.trim()));
    if (invalid) { toast.warning('Vui lòng nhập lý do hao hụt cho sản phẩm nhận thiếu!'); return; }
    try {
      await axiosClient.put(`/admin/transfers/${receiveData.transferId}/status`, {
        TRANGTHAI: 'Đã nhận hàng',
        details: receiveData.details.map(d => ({ ID_CHITIET: d.ID_CHITIET, MASP: d.MASP, SOLUONG_NHAN: d.SOLUONG_NHAN, LYDO_HAOHUT: d.LYDO_HAOHUT }))
      });
      toast.success('Xác nhận nhận hàng thành công!');
      setShowReceiveModal(false);
      fetchData();
    } catch (error) {
      toast.error('Lỗi: ' + (error.response?.data?.error || error.message));
    }
  };

  // ── Product dropdown helpers ──
  const selectedMASP = newRequest.details.map(d => d.MASP).filter(Boolean);
  const getAvailableProducts = (currentMASP) => products.filter(p => {
    const id = String(p.MASP || p.id);
    return id === String(currentMASP) || !selectedMASP.includes(id);
  });

  const userStoreId = currentUser?.nguoidung?.cuaHangId ?? currentUser?.nguoidung?.MACUAHANG ?? currentUser?.nhanvien?.MACUAHANG;
  const isDirector = parseInt(currentUser?.vaiTroId, 10) === 8 || currentUser?.MAROLE === 5;
  const isAdmin = parseInt(currentUser?.vaiTroId, 10) === 1 || currentUser?.MAROLE === 0 || String(currentUser?.username).toLowerCase() === 'admin';
  const isDirectorOrAdmin = isAdmin || isDirector;

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <AdminLayout>
      <div style={{ padding: '28px 32px', maxWidth: 1400, margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 28, fontWeight: 700, color: '#1a1217', margin: 0 }}>
              <i className="fa-solid fa-right-left" style={{ color: 'var(--admin-primary)', marginRight: 12 }} />
              Điều chuyển kho
            </h1>
            <p style={{ margin: '6px 0 0', color: '#888', fontSize: 14 }}>Quản lý yêu cầu nhập hàng & phiếu điều chuyển giữa các chi nhánh</p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', background: 'linear-gradient(135deg, var(--admin-primary), #683838)', color: '#fff', border: 'none', borderRadius: 12, fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(133,80,80,0.3)', transition: 'transform 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <i className="fa-solid fa-plus" /> Tạo yêu cầu mới
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <StatCard icon="fa-hourglass-half" label="Chờ tiếp nhận" value={stats.pending} color="#e6a817" />
          <StatCard icon="fa-arrows-rotate" label="Đang xử lý" value={stats.processing} color="#0d6efd" />
          <StatCard icon="fa-truck-fast" label="Đang vận chuyển" value={stats.transfersInTransit} color="#fd7e14" />
          <StatCard icon="fa-circle-check" label="Hoàn thành" value={stats.completed} color="#198754" />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #eee' }}>
          {[
            { key: 'requests', label: 'Yêu cầu nhập hàng', icon: 'fa-file-import' },
            { key: 'transfers', label: 'Phiếu điều chuyển', icon: 'fa-truck-ramp-box' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '14px 28px', border: 'none', borderBottom: activeTab === tab.key ? '3px solid var(--admin-primary)' : '3px solid transparent',
              background: 'transparent', color: activeTab === tab.key ? 'var(--admin-primary)' : '#888', fontWeight: activeTab === tab.key ? 700 : 500, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              <i className={`fa-solid ${tab.icon}`} /> {tab.label}
            </button>
          ))}
        </div>

        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#888' }}><i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24 }} /> Đang tải...</div>}

        {/* ═══ TAB: YÊU CẦU NHẬP HÀNG ═══ */}
        {!loading && activeTab === 'requests' && (
          <div>
            {requests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <i className="fa-solid fa-box-open" style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
                <p style={{ color: '#999', fontSize: 16, margin: 0 }}>Chưa có yêu cầu nhập hàng nào</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {requests.map(req => (
                  <div key={req.ID_YEUCAU} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #f0ede8', transition: 'box-shadow 0.2s' }}>
                    {/* Header row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', cursor: 'pointer', background: expandedReq === req.ID_YEUCAU ? '#faf6f3' : '#fff', transition: 'background 0.15s' }}
                      onClick={() => setExpandedReq(expandedReq === req.ID_YEUCAU ? null : req.ID_YEUCAU)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, var(--admin-primary), #683838)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          #{req.ID_YEUCAU}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1217' }}>
                            <i className="fa-solid fa-store" style={{ color: 'var(--admin-primary)', marginRight: 6 }} />
                            {req.TENCUAHANG}
                          </div>
                          <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>
                            <i className="fa-regular fa-user" style={{ marginRight: 4 }} /> {req.TEN_NGUOITAO}
                            <span style={{ margin: '0 8px' }}>•</span>
                            <i className="fa-regular fa-clock" style={{ marginRight: 4 }} /> {req.NGAYTAO ? new Date(req.NGAYTAO).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                        <StatusBadge status={req.TRANGTHAI} />
                        {req.SO_PHIEU > 0 && (
                          <span style={{ background: '#e8f4fd', color: '#0d6efd', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600 }}>
                            {req.SO_PHIEU} phiếu
                          </span>
                        )}
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#aaa' }}>
                          {req.details.length} SP
                          <i className={`fa-solid fa-chevron-${expandedReq === req.ID_YEUCAU ? 'up' : 'down'}`} style={{ transition: 'transform 0.2s' }} />
                        </span>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {expandedReq === req.ID_YEUCAU && (
                      <div style={{ padding: '0 24px 20px', borderTop: '1px solid #f0ede8' }}>
                        {/* Product list */}
                        <div style={{ marginTop: 16, marginBottom: 16 }}>
                          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                            <i className="fa-solid fa-list" style={{ marginRight: 6 }} /> Danh sách sản phẩm cần nhập
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                            {req.details.map(d => (
                              <div key={d.ID_CHITIET} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#faf6f3', borderRadius: 10, border: '1px solid #f0ede8' }}>
                                <img src={formatImageUrl(d.HINHANH)} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{d.TENSP}</div>
                                  <div style={{ fontSize: 13, color: 'var(--admin-primary)', fontWeight: 700 }}>×{d.SOLUONG_YEUCAU}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {req.GHICHU && (
                          <div style={{ padding: '10px 14px', background: '#fffbe6', borderRadius: 8, fontSize: 13, color: '#8a6d3b', marginBottom: 14 }}>
                            <i className="fa-solid fa-note-sticky" style={{ marginRight: 6 }} /> {req.GHICHU}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          {req.TRANGTHAI === 'Chờ tiếp nhận' && (
                            <>
                              {isDirectorOrAdmin && (
                                <>
                                  <button onClick={() => handleOpenCoordModal(req)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                    <i className="fa-solid fa-people-arrows" /> Chỉ định chi nhánh xuất
                                  </button>
                                  <Link to={`/admin/nhap-lo-hang?yeuCauId=${req.ID_YEUCAU}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', textDecoration: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 2px 8px rgba(16,185,129,0.3)' }}>
                                    <i className="fa-solid fa-boxes-packing" /> Duyệt & Tạo lô mới từ NCC
                                  </Link>
                                </>
                              )}
                              {!isDirectorOrAdmin && userStoreId !== req.MACUAHANG_YEUCAU && (
                                <button onClick={() => handleOpenAcceptModal(req)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#198754', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                  <i className="fa-solid fa-hand-holding-heart" /> Hỗ trợ điều chuyển
                                </button>
                              )}
                              {!isDirectorOrAdmin && userStoreId === req.MACUAHANG_YEUCAU && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: '#f8f9fa', color: '#6c757d', borderRadius: 10, fontSize: 13, fontWeight: 500, border: '1px dashed #ced4da' }}>
                                  <i className="fa-solid fa-hourglass-half" style={{ color: '#f59e0b' }} /> Đang chờ chi nhánh khác hỗ trợ hoặc Ban Giám Đốc duyệt cấp lô mới
                                </span>
                              )}
                            </>
                          )}
                          {req.TRANGTHAI === 'Đã được tiếp nhận' && (
                            <>
                              {!isAdmin && userStoreId !== req.MACUAHANG_YEUCAU && (
                                <button onClick={() => handleOpenAcceptModal(req)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                  <i className="fa-solid fa-plus" /> Hỗ trợ thêm
                                </button>
                              )}
                              <button onClick={() => setActiveTab('transfers')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                                <i className="fa-solid fa-arrow-right" /> Xem phiếu điều chuyển
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ TAB: PHIẾU ĐIỀU CHUYỂN ═══ */}
        {!loading && activeTab === 'transfers' && (
          <div>
            {transfers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                <i className="fa-solid fa-truck-ramp-box" style={{ fontSize: 48, color: '#ddd', marginBottom: 16 }} />
                <p style={{ color: '#999', fontSize: 16, margin: 0 }}>Chưa có phiếu điều chuyển nào</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {transfers.map(t => (
                  <div key={t.ID_PHIEU} style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', border: '1px solid #f0ede8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', cursor: 'pointer', background: detailTransfer === t.ID_PHIEU ? '#faf6f3' : '#fff' }}
                      onClick={() => setDetailTransfer(detailTransfer === t.ID_PHIEU ? null : t.ID_PHIEU)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, minWidth: 0 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0d6efd, #0a58ca)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          P{t.ID_PHIEU}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#333', flexWrap: 'wrap' }}>
                            <span style={{ color: '#dc3545' }}><i className="fa-solid fa-arrow-right-from-bracket" style={{ marginRight: 4 }} />{t.TEN_CH_XUAT}</span>
                            <i className="fa-solid fa-arrow-right" style={{ color: '#aaa' }} />
                            <span style={{ color: '#198754' }}><i className="fa-solid fa-arrow-right-to-bracket" style={{ marginRight: 4 }} />{t.TEN_CH_NHAP}</span>
                          </div>
                          <div style={{ fontSize: 12, color: '#999', marginTop: 3 }}>
                            YC #{t.ID_YEUCAU} • {t.TEN_NGUOITAO} • {t.NGAYTAO ? new Date(t.NGAYTAO).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        <StatusBadge status={t.TRANGTHAI} />
                        <span style={{ fontSize: 12, color: '#aaa' }}>
                          <i className={`fa-solid fa-chevron-${detailTransfer === t.ID_PHIEU ? 'up' : 'down'}`} />
                        </span>
                      </div>
                    </div>

                    {detailTransfer === t.ID_PHIEU && (
                      <div style={{ padding: '0 24px 20px', borderTop: '1px solid #f0ede8' }}>
                        {/* Shipping info */}
                        <div style={{ display: 'flex', gap: 16, marginTop: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px', padding: '12px 16px', background: '#f8f9fa', borderRadius: 10 }}>
                            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Hình thức vận chuyển</div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>
                              <i className={`fa-solid ${t.HINHTHUC_VANCHUYEN === 'Tự vận chuyển' ? 'fa-person-biking' : 'fa-truck'}`} style={{ marginRight: 6, color: 'var(--admin-primary)' }} />
                              {t.HINHTHUC_VANCHUYEN || 'Chưa xác định'}
                            </div>
                          </div>
                          {t.NGUOI_VANCHUYEN && (
                            <div style={{ flex: '1 1 200px', padding: '12px 16px', background: '#f8f9fa', borderRadius: 10 }}>
                              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Người vận chuyển</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{t.NGUOI_VANCHUYEN}</div>
                            </div>
                          )}
                          {t.MA_VANDON && (
                            <div style={{ flex: '1 1 200px', padding: '12px 16px', background: '#f8f9fa', borderRadius: 10 }}>
                              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Mã vận đơn</div>
                              <div style={{ fontSize: 14, fontWeight: 600, color: '#0d6efd' }}>{t.MA_VANDON}</div>
                            </div>
                          )}
                        </div>

                        {/* Products */}
                        <h4 style={{ fontSize: 13, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                          <i className="fa-solid fa-boxes-stacked" style={{ marginRight: 6 }} /> Chi tiết sản phẩm
                        </h4>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: 14 }}>
                            <thead>
                              <tr>
                                <th style={{ textAlign: 'left', padding: '10px 14px', background: '#f8f6f3', borderBottom: '2px solid #eee', color: '#666', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sản phẩm</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', background: '#f8f6f3', borderBottom: '2px solid #eee', color: '#666', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', width: 100 }}>SL Xuất</th>
                                <th style={{ textAlign: 'center', padding: '10px 14px', background: '#f8f6f3', borderBottom: '2px solid #eee', color: '#666', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', width: 100 }}>SL Nhận</th>
                                <th style={{ textAlign: 'left', padding: '10px 14px', background: '#f8f6f3', borderBottom: '2px solid #eee', color: '#666', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>Ghi chú</th>
                              </tr>
                            </thead>
                            <tbody>
                              {t.details.map(d => {
                                const isShort = d.SOLUONG_NHAN !== null && d.SOLUONG_NHAN < d.SOLUONG_XUAT;
                                return (
                                  <tr key={d.ID_CHITIET}>
                                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <img src={formatImageUrl(d.HINHANH)} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                                        <span style={{ fontWeight: 600 }}>{d.TENSP}</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, color: '#dc3545', fontSize: 16 }}>{d.SOLUONG_XUAT}</td>
                                    <td style={{ textAlign: 'center', padding: '10px 14px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, color: isShort ? '#e6a817' : '#198754', fontSize: 16 }}>
                                      {d.SOLUONG_NHAN !== null ? d.SOLUONG_NHAN : <span style={{ color: '#ccc' }}>—</span>}
                                    </td>
                                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #f0f0f0', color: '#888', fontStyle: 'italic', fontSize: 13 }}>
                                      {d.LYDO_HAOHUT || '—'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {t.GHICHU && (
                          <div style={{ padding: '10px 14px', background: '#fffbe6', borderRadius: 8, fontSize: 13, color: '#8a6d3b', marginTop: 14 }}>
                            <i className="fa-solid fa-note-sticky" style={{ marginRight: 6 }} /> {t.GHICHU}
                          </div>
                        )}

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                          {t.TRANGTHAI === 'Đang xử lý' && (isDirectorOrAdmin || userStoreId == t.MACUAHANG_XUAT) && (
                            <button onClick={() => updateTransferStatus(t.ID_PHIEU, 'Đang vận chuyển')} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#fd7e14', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                              <i className="fa-solid fa-truck-fast" /> Bàn giao vận chuyển
                            </button>
                          )}
                          {t.TRANGTHAI === 'Đang vận chuyển' && (isDirectorOrAdmin || userStoreId == t.MACUAHANG_NHAP) && (
                            <button onClick={() => {
                              const details = t.details.map(d => ({ ID_CHITIET: d.ID_CHITIET, TENSP: d.TENSP, MASP: d.MASP, HINHANH: d.HINHANH, SOLUONG_XUAT: d.SOLUONG_XUAT, SOLUONG_NHAN: d.SOLUONG_XUAT, LYDO_HAOHUT: '' }));
                              setReceiveData({ transferId: t.ID_PHIEU, details });
                              setShowReceiveModal(true);
                            }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#198754', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                              <i className="fa-solid fa-clipboard-check" /> Xác nhận nhận hàng
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════
         MODAL: TẠO YÊU CẦU NHẬP HÀNG
         ═══════════════════════════════════════════════ */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '95%', maxWidth: 720, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <form onSubmit={handleCreateRequest}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1a1217' }}>
                  <i className="fa-solid fa-file-import" style={{ color: 'var(--admin-primary)', marginRight: 10 }} />
                  Tạo yêu cầu nhập hàng
                </h3>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{ padding: '14px 18px', background: '#e8f4fd', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#0c5460', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <i className="fa-solid fa-circle-info" style={{ marginTop: 2 }} />
                  <span>Chọn sản phẩm cần nhập. Yêu cầu sẽ được gửi đến tất cả chi nhánh khác. Chi nhánh nào có hàng có thể hỗ trợ điều chuyển.</span>
                </div>

                {newRequest.details.map((d, index) => (
                  <div key={index} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      {index === 0 && <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Sản phẩm</label>}
                      <select value={d.MASP} onChange={e => { const nd = [...newRequest.details]; nd[index].MASP = e.target.value; setNewRequest({ ...newRequest, details: nd }); }} required
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none', transition: 'border 0.2s' }}>
                        <option value="">-- Chọn sản phẩm --</option>
                        {getAvailableProducts(d.MASP).map(p => <option key={p.MASP || p.id} value={p.MASP || p.id}>{p.TENSP || p.tenSanPham}</option>)}
                      </select>
                    </div>
                    <div style={{ width: 100 }}>
                      {index === 0 && <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Số lượng</label>}
                      <input type="number" min="1" value={d.SOLUONG} onChange={e => { const nd = [...newRequest.details]; nd[index].SOLUONG = parseInt(e.target.value) || 1; setNewRequest({ ...newRequest, details: nd }); }} required
                        style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, textAlign: 'center', outline: 'none' }} />
                    </div>
                    {index > 0 && (
                      <button type="button" onClick={() => { const nd = newRequest.details.filter((_, i) => i !== index); setNewRequest({ ...newRequest, details: nd }); }}
                        style={{ width: 40, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fee2e2', color: '#dc3545', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
                        <i className="fa-solid fa-trash" />
                      </button>
                    )}
                  </div>
                ))}

                <button type="button" onClick={() => setNewRequest({ ...newRequest, details: [...newRequest.details, { MASP: '', SOLUONG: 1 }] })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'none', border: '1.5px dashed #bbb', borderRadius: 10, color: '#666', fontWeight: 500, fontSize: 13, cursor: 'pointer', marginBottom: 20, transition: 'all 0.2s' }}>
                  <i className="fa-solid fa-plus" /> Thêm sản phẩm
                </button>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Ghi chú</label>
                  <textarea value={newRequest.GHICHU} onChange={e => setNewRequest({ ...newRequest, GHICHU: e.target.value })} placeholder="Nhập ghi chú (tùy chọn)..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, minHeight: 80, resize: 'vertical', outline: 'none' }} />
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ padding: '10px 24px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 24px', background: 'linear-gradient(135deg, var(--admin-primary), #683838)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <i className="fa-solid fa-paper-plane" style={{ marginRight: 6 }} /> Gửi yêu cầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
         MODAL: TIẾP NHẬN (Chi nhánh nhận đơn)
         ═══════════════════════════════════════════════ */}
      {showAcceptModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '95%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <form onSubmit={handleAcceptRequest}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#198754' }}>
                  <i className="fa-solid fa-hand-holding-heart" style={{ marginRight: 10 }} />
                  Hỗ trợ điều chuyển
                </h3>
                <button type="button" onClick={() => setShowAcceptModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{ padding: '14px 18px', background: '#d1ecf1', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#0c5460' }}>
                  <i className="fa-solid fa-circle-info" style={{ marginRight: 6 }} />
                  Chọn sản phẩm mà chi nhánh bạn có thể hỗ trợ. Không bắt buộc phải đáp ứng tất cả.
                </div>

                {/* Product selection */}
                {acceptData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8, background: item.selected ? '#f0fdf4' : '#f8f8f8', borderRadius: 10, border: `1.5px solid ${item.selected ? '#86efac' : '#eee'}`, cursor: 'pointer', transition: 'all 0.15s' }}
                    onClick={() => { const items = [...acceptData.items]; items[idx].selected = !items[idx].selected; setAcceptData({ ...acceptData, items }); }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.selected ? '#198754' : '#ccc'}`, background: item.selected ? '#198754' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.selected && <i className="fa-solid fa-check" style={{ color: '#fff', fontSize: 11 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#333' }}>{item.TENSP}</span>
                    </div>
                    <div style={{ width: 80 }}>
                      <input type="number" min="1" max={item.SOLUONG} value={item.SOLUONG} onClick={e => e.stopPropagation()}
                        onChange={e => { const items = [...acceptData.items]; items[idx].SOLUONG = parseInt(e.target.value) || 1; setAcceptData({ ...acceptData, items }); }}
                        style={{ width: '100%', padding: '6px 10px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, textAlign: 'center', outline: 'none' }} />
                    </div>
                  </div>
                ))}

                {/* Shipping */}
                <div style={{ marginTop: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Hình thức vận chuyển</label>
                  <select value={acceptData.HINHTHUC_VANCHUYEN} onChange={e => setAcceptData({ ...acceptData, HINHTHUC_VANCHUYEN: e.target.value, MA_VANDON: '', NGUOI_VANCHUYEN: '' })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                    <option value="Tự vận chuyển">🏍️ Tự vận chuyển (NV giao)</option>
                    <option value="Giao hàng nhanh (GHN)">🚛 Giao hàng nhanh (GHN)</option>
                  </select>
                </div>

                {acceptData.HINHTHUC_VANCHUYEN === 'Tự vận chuyển' ? (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Nhân viên giao hàng</label>
                    <select value={acceptData.NGUOI_VANCHUYEN} onChange={e => setAcceptData({ ...acceptData, NGUOI_VANCHUYEN: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                      <option value="">-- Chọn nhân viên --</option>
                      {storeEmployees.map(emp => <option key={emp.USERNAME} value={emp.HOTEN}>{emp.HOTEN} - {emp.USERNAME}</option>)}
                    </select>
                  </div>
                ) : (
                  <div style={{ marginTop: 12, padding: '12px 16px', background: '#e8f4fd', borderRadius: 10, fontSize: 13, color: '#0d6efd' }}>
                    <i className="fa-solid fa-info-circle" style={{ marginRight: 6 }} /> Hệ thống sẽ tự động tạo đơn giao hàng GHN
                  </div>
                )}

                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Ghi chú</label>
                  <textarea value={acceptData.GHICHU} onChange={e => setAcceptData({ ...acceptData, GHICHU: e.target.value })} placeholder="Ghi chú thêm..."
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, minHeight: 60, resize: 'vertical', outline: 'none' }} />
                </div>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowAcceptModal(false)} style={{ padding: '10px 24px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#198754', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <i className="fa-solid fa-check" style={{ marginRight: 6 }} /> Xác nhận & tạo phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
         MODAL: ĐIỀU PHỐI (Giám đốc)
         ═══════════════════════════════════════════════ */}
      {showCoordModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '95%', maxWidth: 680, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <form onSubmit={handleCoordinateRequest}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#17a2b8' }}>
                  <i className="fa-solid fa-people-arrows" style={{ marginRight: 10 }} />
                  Chỉ định chi nhánh xuất hàng
                </h3>
                <button type="button" onClick={() => setShowCoordModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{ padding: '14px 18px', background: '#fff3cd', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#856404' }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 6 }} />
                  Với quyền Giám đốc, bạn có thể chỉ định chi nhánh cung cấp hàng khi không có chi nhánh nào tự nhận.
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Chi nhánh xuất hàng</label>
                  <select value={coordData.MACUAHANG_XUAT} onChange={e => { setCoordData({ ...coordData, MACUAHANG_XUAT: e.target.value }); fetchEmployees(e.target.value); }} required
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                    <option value="">-- Chọn chi nhánh --</option>
                    {(Array.isArray(stores) ? stores : []).map(s => <option key={s.id} value={s.id}>{s.ten_cuahang || s.tenCuaHang || s.TENCUAHANG || s.name || `Chi nhánh #${s.id}`}</option>)}
                  </select>
                </div>

                {/* Product selection */}
                {coordData.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8, background: item.selected ? '#e8f4fd' : '#f8f8f8', borderRadius: 10, border: `1.5px solid ${item.selected ? '#86b7fe' : '#eee'}`, cursor: 'pointer' }}
                    onClick={() => { const items = [...coordData.items]; items[idx].selected = !items[idx].selected; setCoordData({ ...coordData, items }); }}>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.selected ? '#0d6efd' : '#ccc'}`, background: item.selected ? '#0d6efd' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.selected && <i className="fa-solid fa-check" style={{ color: '#fff', fontSize: 11 }} />}
                    </div>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{item.TENSP}</span>
                    <input type="number" min="1" value={item.SOLUONG} onClick={e => e.stopPropagation()}
                      onChange={e => { const items = [...coordData.items]; items[idx].SOLUONG = parseInt(e.target.value) || 1; setCoordData({ ...coordData, items }); }}
                      style={{ width: 80, padding: '6px 10px', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 14, textAlign: 'center', outline: 'none' }} />
                  </div>
                ))}

                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Hình thức vận chuyển</label>
                  <select value={coordData.HINHTHUC_VANCHUYEN} onChange={e => setCoordData({ ...coordData, HINHTHUC_VANCHUYEN: e.target.value, MA_VANDON: '', NGUOI_VANCHUYEN: '' })}
                    style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                    <option value="Tự vận chuyển">🏍️ Tự vận chuyển (NV giao)</option>
                    <option value="Giao hàng nhanh (GHN)">🚛 Giao hàng nhanh (GHN)</option>
                  </select>
                </div>

                {coordData.HINHTHUC_VANCHUYEN === 'Tự vận chuyển' && (
                  <div style={{ marginTop: 12 }}>
                    <label style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6, display: 'block' }}>Nhân viên giao hàng</label>
                    <select value={coordData.NGUOI_VANCHUYEN} onChange={e => setCoordData({ ...coordData, NGUOI_VANCHUYEN: e.target.value })}
                      style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #ddd', borderRadius: 10, fontSize: 14, outline: 'none' }}>
                      <option value="">-- Chọn nhân viên --</option>
                      {storeEmployees.map(emp => <option key={emp.USERNAME} value={emp.HOTEN}>{emp.HOTEN} - {emp.USERNAME}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowCoordModal(false)} style={{ padding: '10px 24px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <i className="fa-solid fa-gavel" style={{ marginRight: 6 }} /> Xác nhận & tạo phiếu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
         MODAL: KIỂM ĐẾM & NHẬN HÀNG
         ═══════════════════════════════════════════════ */}
      {showReceiveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', borderRadius: 20, width: '95%', maxWidth: 780, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            <form onSubmit={handleReceiveRequest}>
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#198754' }}>
                  <i className="fa-solid fa-clipboard-check" style={{ marginRight: 10 }} />
                  Kiểm đếm & Nhận hàng <span style={{ color: '#0d6efd' }}>P{receiveData.transferId}</span>
                </h3>
                <button type="button" onClick={() => setShowReceiveModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, color: '#aaa', cursor: 'pointer' }}><i className="fa-solid fa-xmark" /></button>
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{ padding: '14px 18px', background: '#fff3cd', borderRadius: 10, marginBottom: 20, fontSize: 13, color: '#856404', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <i className="fa-solid fa-triangle-exclamation" style={{ marginTop: 2 }} />
                  <span>Kiểm tra kỹ số lượng thực tế. Nếu nhận thiếu, <strong>bắt buộc</strong> ghi lý do (hư hỏng, thất lạc, móp méo...).</span>
                </div>

                {receiveData.details.map((d, index) => {
                  const isShort = parseInt(d.SOLUONG_NHAN) < parseInt(d.SOLUONG_XUAT);
                  return (
                    <div key={d.ID_CHITIET} style={{ padding: '16px 18px', marginBottom: 12, background: isShort ? '#fff5f5' : '#f0fdf4', borderRadius: 12, border: `1.5px solid ${isShort ? '#fecaca' : '#bbf7d0'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                        <img src={formatImageUrl(d.HINHANH)} alt="" style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover' }} />
                        <span style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>{d.TENSP}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>SL Xuất</div>
                          <div style={{ width: 56, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0', borderRadius: 8, fontSize: 18, fontWeight: 700, color: '#dc3545' }}>{d.SOLUONG_XUAT}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>SL Thực nhận</div>
                          <input type="number" min="0" max={d.SOLUONG_XUAT} value={d.SOLUONG_NHAN}
                            onChange={e => { const nd = [...receiveData.details]; nd[index].SOLUONG_NHAN = e.target.value; setReceiveData({ ...receiveData, details: nd }); }} required
                            style={{ width: 80, padding: '8px 12px', border: `2px solid ${isShort ? '#dc3545' : '#198754'}`, borderRadius: 8, fontSize: 16, fontWeight: 700, textAlign: 'center', outline: 'none', color: isShort ? '#dc3545' : '#198754' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          {isShort && (
                            <>
                              <div style={{ fontSize: 11, color: '#dc3545', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>Lý do hao hụt *</div>
                              <input type="text" value={d.LYDO_HAOHUT} placeholder="Bắt buộc: lý do thiếu hụt..."
                                onChange={e => { const nd = [...receiveData.details]; nd[index].LYDO_HAOHUT = e.target.value; setReceiveData({ ...receiveData, details: nd }); }} required
                                style={{ width: '100%', padding: '8px 12px', border: '2px solid #fecaca', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button type="button" onClick={() => setShowReceiveModal(false)} style={{ padding: '10px 24px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Hủy</button>
                <button type="submit" style={{ padding: '10px 24px', background: '#198754', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  <i className="fa-solid fa-check-double" style={{ marginRight: 6 }} /> Xác nhận hàng vào kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default AdminTransferPage;
