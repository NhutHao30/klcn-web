import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getLoHangs, getCanhBaoHsd, updateTrangThaiLo } from '../../services/batchService';
import { getStores } from '../../services/storeService';
import { getProducts } from '../../services/productService';
import { useToast } from '../../components/Toast/Toast';
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

const AdminLoHangPage = () => {
  const toast = useToast();
  const [loHangs, setLoHangs] = useState([]);
  const [canhBao, setCanhBao] = useState({ tong_canh_bao: 0, so_lo_sap_het_han: 0, so_lo_het_han: 0 });
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal Cancel
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedLo, setSelectedLo] = useState(null);
  const [cancelReason, setCancelReason] = useState('hu_hong');
  const [cancelNotes, setCancelNotes] = useState('');

  // FEFO Simulation Modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simProduct, setSimProduct] = useState('');
  const [simQty, setSimQty] = useState(5);
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    fetchStoresAndProducts();
    fetchData();
  }, []);

  const fetchStoresAndProducts = async () => {
    try {
      const [resStores, resProds] = await Promise.allSettled([
        getStores(),
        getProducts({ page: 1, size: 100 })
      ]);
      if (resStores.status === 'fulfilled') {
        const val = resStores.value;
        setStores(val?.data || val || []);
      }
      if (resProds.status === 'fulfilled') {
        const val = resProds.value;
        setProducts(val?.data?.data || val?.data || val || []);
      }
    } catch (e) {
      console.error('Lỗi tải danh mục cửa hàng/sản phẩm:', e);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (selectedStore) params.macuahang = selectedStore;

      const [resLo, resCB] = await Promise.allSettled([
        getLoHangs(params),
        getCanhBaoHsd()
      ]);

      if (resLo.status === 'fulfilled') {
        const val = resLo.value;
        let rawLo = val?.data?.data || val?.data || val || [];
        if (rawLo && typeof rawLo === 'object' && rawLo.data && Array.isArray(rawLo.data)) {
          rawLo = rawLo.data;
        }
        setLoHangs(Array.isArray(rawLo) ? rawLo : []);
      }

      if (resCB.status === 'fulfilled') {
        const val = resCB.value;
        const cbData = val?.data || val || {};
        setCanhBao(cbData);
      }
    } catch (e) {
      toast.error('Lỗi khi tải dữ liệu lô hàng: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelLo = async (e) => {
    e.preventDefault();
    if (!selectedLo) return;

    try {
      const res = await updateTrangThaiLo(selectedLo.MALOHAN, {
        trangthai: 'bi_huy',
        ly_do: cancelReason,
        ghichu: cancelNotes
      });

      if (res.status || res.message) {
        toast.success(`Đã xuất biên bản hủy cho lô ${selectedLo.MALOHAN}!`);
        setShowCancelModal(false);
        fetchData();
      } else {
        toast.error(res.message || 'Không thể hủy lô hàng!');
      }
    } catch (e) {
      toast.error('Lỗi khi hủy lô: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    }
  };

  const runFefoSimulation = () => {
    if (!simProduct) {
      toast.warning('Vui lòng chọn sản phẩm cần mô phỏng!');
      return;
    }

    const availableBatches = loHangs
      .filter(l => l.MASP === simProduct && l.SOLUONG_CON > 0 && l.TRANGTHAI === 'con_hang')
      .sort((a, b) => new Date(a.HSD || a.HSD_LO) - new Date(b.HSD || b.HSD_LO));

    if (availableBatches.length === 0) {
      setSimResult({
        success: false,
        message: 'Không tìm thấy lô bánh nào còn hạn cho sản phẩm này!'
      });
      return;
    }

    const chosen = availableBatches[0];
    const store = stores.find(s => s.MACUAHANG == chosen.MACUAHANG);

    setSimResult({
      success: true,
      batch: chosen,
      storeName: store ? store.TENCUAHANG : (chosen.cuahang?.TENCUAHANG || `Cửa Hàng #${chosen.MACUAHANG}`),
      daysRemaining: chosen.so_ngay_con_lai || 0
    });
  };

  // Helper status determination
  const getLoStatusInfo = (l) => {
    const days = l.so_ngay_con_lai;
    const isBiHuy = l.TRANGTHAI === 'bi_huy';
    const isHetHan = !isBiHuy && (l.TRANGTHAI === 'het_han' || l.muc_canh_bao === 'het_han' || (days !== null && days !== undefined && days < 0));
    const isSapHetHan = !isBiHuy && !isHetHan && (l.muc_canh_bao === 'canh_bao' || l.muc_canh_bao === 'nguy_hiem' || (days !== null && days !== undefined && days >= 0 && days <= 3));
    const isConHan = !isBiHuy && !isHetHan && !isSapHetHan && l.TRANGTHAI === 'con_hang';
    return { isBiHuy, isHetHan, isSapHetHan, isConHan };
  };

  // Filtering
  const filteredLoHangs = loHangs.filter(l => {
    const prodName = l.sanpham?.TENSP || l.san_pham?.TENSP || '';
    const matchSearch = (l.MALOHAN || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                        prodName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const { isBiHuy, isHetHan, isSapHetHan, isConHan } = getLoStatusInfo(l);

    let matchStatus = true;
    if (selectedStatus === 'con_han') matchStatus = isConHan && l.SOLUONG_CON > 0;
    else if (selectedStatus === 'sap_het_han') matchStatus = isSapHetHan && l.SOLUONG_CON > 0;
    else if (selectedStatus === 'het_han') matchStatus = isHetHan;
    else if (selectedStatus === 'bi_huy') matchStatus = isBiHuy;
    else if (selectedStatus === 'het_hang') matchStatus = l.SOLUONG_CON == 0;

    return matchSearch && matchStatus;
  });

  const totalLo = loHangs.length;
  const conHanCount = loHangs.filter(l => {
    const { isConHan } = getLoStatusInfo(l);
    return isConHan && l.SOLUONG_CON > 0;
  }).length;

  const sapHetHanCount = loHangs.filter(l => {
    const { isSapHetHan } = getLoStatusInfo(l);
    return isSapHetHan && l.SOLUONG_CON > 0;
  }).length;

  const hetHanCount = loHangs.filter(l => {
    const { isHetHan } = getLoStatusInfo(l);
    return isHetHan;
  }).length;

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản Lý Lô Hàng & Hạn Sử Dụng (FEFO)</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Theo dõi từng đợt nhập hàng, HSD bánh mì và xuất bán ưu tiên FEFO</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-btn admin-btn-info" onClick={() => setShowSimModal(true)}>
            <i className="fa-solid fa-compass" style={{ marginRight: '6px' }}></i> Mô Phỏng Xuất FEFO
          </button>
          <button className="admin-btn admin-btn-primary" onClick={fetchData}>
            <i className="fa-solid fa-rotate" style={{ marginRight: '6px' }}></i> Làm Mới
          </button>
        </div>
      </div>

      {/* Urgent Warning Banner */}
      {canhBao.tong_canh_bao > 0 && (
        <div style={{
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h4 style={{ color: '#856404', margin: '0 0 4px 0', fontSize: '15px' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i>
              CẢNH BÁO HẠN SỬ DỤNG BÁNH MÌ / BÁNH NGỌT
            </h4>
            <p style={{ margin: 0, color: '#856404', fontSize: '13px' }}>
              Hệ thống phát hiện <b>{canhBao.so_lo_sap_het_han || 0} lô bánh sắp hết hạn</b> (≤ 3 ngày) và <b>{canhBao.so_lo_het_han || 0} lô bánh quá hạn</b> chưa lập biên bản hủy!
            </p>
          </div>
          <button className="admin-btn admin-btn-danger" onClick={() => setSelectedStatus('het_han')}>
            Xem Lô Cần Xử Lý
          </button>
        </div>
      )}

      {/* Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="admin-card" style={{ borderLeft: '4px solid #17a2b8', padding: '15px' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>TỔNG LÔ HÀNG</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#17a2b8', marginTop: '5px' }}>{totalLo}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Đang lưu trong kho</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #28a745', padding: '15px' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>CÒN HẠN DÙNG TỐT</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginTop: '5px' }}>{conHanCount}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Hạn dùng &gt; 3 ngày</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #ffc107', padding: '15px' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>SẮP HẾT HẠN (≤ 3 NGÀY)</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ffc107', marginTop: '5px' }}>{sapHetHanCount}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Ưu tiên xuất bán FEFO</div>
        </div>

        <div className="admin-card" style={{ borderLeft: '4px solid #dc3545', padding: '15px' }}>
          <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>ĐÃ HẾT HẠN / CẦN HỦY</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc3545', marginTop: '5px' }}>{hetHanCount}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>Lập biên bản hủy hàng</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="admin-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo Mã Lô hoặc Tên Bánh..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ width: '220px' }}>
            <select
              className="admin-input"
              value={selectedStore}
              onChange={(e) => { setSelectedStore(e.target.value); fetchData(); }}
              style={{ marginBottom: 0 }}
            >
              <option value="">Tất cả Chi Nhánh</option>
              {stores.map(s => (
                <option key={s.MACUAHANG || s.id} value={s.MACUAHANG || s.id}>
                  {s.TENCUAHANG || s.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ width: '200px' }}>
            <select
              className="admin-input"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="">Tất cả Trạng Thái</option>
              <option value="con_han">🟢 Còn hạn tốt</option>
              <option value="sap_het_han">⚠️ Sắp hết hạn (≤ 3 ngày)</option>
              <option value="het_han">❌ Hết hạn / Cần hủy</option>
              <option value="bi_huy">🚫 Đã lập biên bản hủy</option>
              <option value="het_hang">⚪ Đã bán hết</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Batches Table */}
      <div className="admin-card">
        <h2 className="admin-card-title">Danh Sách Lô Hàng</h2>
        {isLoading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải danh sách lô hàng...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Lô</th>
                  <th>Sản Phẩm</th>
                  <th>Chi Nhánh</th>
                  <th>Nhà Cung Cấp</th>
                  <th style={{ textAlign: 'center' }}>SL Nhập / Còn</th>
                  <th>Ngày SX</th>
                  <th>HSD Lô</th>
                  <th>Thời Gian Còn Lại</th>
                  <th style={{ textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoHangs.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Không tìm thấy lô hàng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredLoHangs.map(l => {
                    const { isBiHuy, isHetHan, isSapHetHan } = getLoStatusInfo(l);
                    let badgeBg = '#28a745';
                    let badgeText = 'Còn Hạn';

                    if (l.TRANGTHAI === 'bi_huy' || isBiHuy) {
                      badgeBg = '#6c757d'; badgeText = '🚫 Đã Hủy';
                    } else if (isHetHan) {
                      badgeBg = '#dc3545'; badgeText = '❌ Đã Hết Hạn';
                    } else if (isSapHetHan) {
                      badgeBg = '#ffc107'; badgeText = '⚠️ Sắp Hết Hạn';
                    } else if (l.SOLUONG_CON == 0) {
                      badgeBg = '#6c757d'; badgeText = '⚪ Đã Bán Hết';
                    }

                    const storeName = l.cuahang?.TENCUAHANG || l.cua_hang?.TENCUAHANG || `CH #${l.MACUAHANG}`;
                    const nccName = l.hdnhap?.nhacungcap?.TENNCC || l.hd_nhap?.nha_cung_cap?.TENNCC || '-';
                    const productName = l.sanpham?.TENSP || l.san_pham?.TENSP || l.MASP;
                    const expDate = l.HSD || l.HSD_LO || '-';
                    const daysText = l.so_ngay_con_lai !== null && l.so_ngay_con_lai !== undefined ? `${l.so_ngay_con_lai} ngày` : '-';

                    return (
                      <tr key={l.MALOHAN}>
                        <td><b>{l.MALOHAN}</b></td>
                        <td style={{ fontWeight: 'bold' }}>{productName}</td>
                        <td>{storeName}</td>
                        <td>{nccName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <b style={{ color: '#17a2b8' }}>{l.SOLUONG_CON}</b> / {l.SOLUONG_NHAP}
                        </td>
                        <td>{formatDateOnly(l.NGAYSX)}</td>
                        <td><b style={{ color: '#d82d8b' }}>{formatDateOnly(expDate)}</b></td>
                        <td>{daysText}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{
                            backgroundColor: badgeBg,
                            color: badgeBg === '#ffc107' ? '#000' : '#fff',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {badgeText}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {l.SOLUONG_CON > 0 && l.TRANGTHAI !== 'bi_huy' && (
                            <button
                              className="admin-btn admin-btn-danger"
                              style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}
                              onClick={() => {
                                setSelectedLo(l);
                                if (isHetHan) setCancelReason('het_han');
                                else setCancelReason('hong_hong');
                                setShowCancelModal(true);
                              }}
                            >
                              <i className="fa-solid fa-ban" style={{ marginRight: '4px' }}></i>
                              {isHetHan ? 'Lập Biên Bản Hủy' : 'Hủy Lô'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL CANCEL BATCH */}
      {showCancelModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="admin-card" style={{ maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 0, backgroundColor: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Lập Biên Bản Hủy Lô Bánh ({selectedLo?.MALOHAN})</h2>
              <button onClick={() => setShowCancelModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <form onSubmit={handleCancelLo}>
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>
                  Sản phẩm: <b>{selectedLo?.sanpham?.TENSP || selectedLo?.san_pham?.TENSP || selectedLo?.MASP}</b> | Số lượng hủy: <b style={{ color: 'red' }}>{selectedLo?.SOLUONG_CON} cái</b>
                </p>
                <label className="admin-label">Lý Do Hủy *</label>
                <select
                  className="admin-input"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  required
                >
                  <option value="het_han">Hết Hạn Sử Dụng (Quá HSD)</option>
                  <option value="hong_hong">Hư Hỏng Trong Quá Trình Bảo Quản</option>
                  <option value="thu_hoi">Thu Hồi Theo Yêu Cầu NCC</option>
                  <option value="khac">Lý Do Khác</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="admin-label">Ghi Chú Chi Tiết</label>
                <textarea
                  className="admin-input"
                  rows="3"
                  placeholder="Nhập chi tiết tình trạng bánh khi hủy..."
                  value={cancelNotes}
                  onChange={(e) => setCancelNotes(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                <button type="button" className="admin-btn" onClick={() => setShowCancelModal(false)}>Hủy Bỏ</button>
                <button type="submit" className="admin-btn admin-btn-danger">Xác Nhận Hủy & Xuất Biên Bản</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FEFO SIMULATION */}
      {showSimModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(3px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="admin-card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 0, backgroundColor: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Mô Phỏng Thuật Toán Xuất Bánh FEFO</h2>
              <button onClick={() => setShowSimModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: '10px 0' }}>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                Thuật toán FEFO sẽ quét các lô còn hạn của sản phẩm, tự động chọn <b>lô bánh gần hết hạn nhất</b> để ưu tiên bán trước nhằm giảm thiểu tỷ lệ lãng phí.
              </p>

              <div style={{ marginBottom: '15px' }}>
                <label className="admin-label">Chọn Loại Bánh Cần Mua *</label>
                <select
                  className="admin-input"
                  value={simProduct}
                  onChange={(e) => setSimProduct(e.target.value)}
                >
                  <option value="">-- Chọn Sản Phẩm --</option>
                  {products.map(p => (
                    <option key={p.MASP} value={p.MASP}>{p.TENSP} ({p.MASP})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label className="admin-label">Số Lượng Mua (Cái)</label>
                <input
                  type="number"
                  className="admin-input"
                  value={simQty}
                  onChange={(e) => setSimQty(e.target.value)}
                  min="1"
                />
              </div>

              <button className="admin-btn admin-btn-success" style={{ width: '100%', marginBottom: '15px' }} onClick={runFefoSimulation}>
                ▶ Chạy Thuật Toán FEFO
              </button>

              {simResult && (
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  backgroundColor: simResult.success ? '#e8f5e9' : '#ffebee',
                  border: `1px solid ${simResult.success ? '#81c784' : '#e57373'}`
                }}>
                  {simResult.success ? (
                    <div>
                      <h4 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>✅ LÔ BÁNH ĐƯỢC ƯU TIÊN XUẤT BÁN:</h4>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><b>Mã Lô:</b> <span style={{ color: '#d82d8b', fontWeight: 'bold' }}>{simResult.batch.MALOHAN}</span></p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><b>Cửa Hàng Phục Vụ:</b> {simResult.storeName}</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><b>Tồn Kho Lô Này:</b> {simResult.batch.SOLUONG_CON} cái</p>
                      <p style={{ margin: '4px 0', fontSize: '14px' }}><b>HSD Lô Này:</b> {formatDateOnly(simResult.batch.HSD || simResult.batch.HSD_LO)} (Còn {simResult.daysRemaining} ngày HSD - Đảm bảo ngon & tươi khi giao)</p>
                    </div>
                  ) : (
                    <p style={{ color: '#c62828', margin: 0 }}>{simResult.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminLoHangPage;
