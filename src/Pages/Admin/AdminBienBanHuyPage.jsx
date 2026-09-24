import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getBienBanHuys, getBienBanHuyDetail } from '../../services/batchService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const AdminBienBanHuyPage = () => {
  const toast = useToast();
  const [bienBans, setBienBans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterLyDo, setFilterLyDo] = useState('');

  // Modal View Printable Document
  const [selectedBb, setSelectedBb] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterLyDo]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (filterLyDo) params.ly_do = filterLyDo;

      const res = await getBienBanHuys(params);
      let raw = res?.data?.data || res?.data || res || [];
      if (raw && typeof raw === 'object' && raw.data && Array.isArray(raw.data)) {
        raw = raw.data;
      }
      setBienBans(Array.isArray(raw) ? raw : []);
    } catch (e) {
      toast.error('Lỗi tải danh sách biên bản hủy sản phẩm!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetail = async (mabb) => {
    try {
      const res = await getBienBanHuyDetail(mabb);
      const data = res?.data || res;
      if (data) {
        setSelectedBb(data);
        setShowModal(true);
      }
    } catch (e) {
      toast.error('Không thể xem chi tiết biên bản: ' + e.message);
    }
  };

  const printDocument = () => {
    window.print();
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Biên Bản Hủy Sản Phẩm</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Minh bạch sản phẩm bị hủy (người hủy, thời gian, số lượng & lý do hủy bánh quá hạn)</p>
        </div>
        <div>
          <select
            className="admin-input"
            value={filterLyDo}
            onChange={(e) => setFilterLyDo(e.target.value)}
            style={{ marginBottom: 0, width: '220px' }}
          >
            <option value="">Tất cả Lý Do Hủy</option>
            <option value="het_han">Hết hạn sử dụng (FEFO Auto)</option>
            <option value="hong_hong">Hư hỏng trong bảo quản</option>
            <option value="thu_hoi">Thu hồi từ Nhà cung cấp</option>
            <option value="khac">Lý do khác</option>
          </select>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh Sách Chứng Từ Hủy Sản Phẩm</h2>
        {isLoading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Đang tải biên bản...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Biên Bản</th>
                  <th>Mã Lô Hàng</th>
                  <th>Sản Phẩm Hủy</th>
                  <th>Chi Nhánh</th>
                  <th style={{ textAlign: 'center' }}>Số Lượng Hủy</th>
                  <th>Lý Do Hủy</th>
                  <th>Người Thực Hiện</th>
                  <th>Thời Gian Hủy</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {bienBans.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Chưa có biên bản hủy sản phẩm nào
                    </td>
                  </tr>
                ) : (
                  bienBans.map(b => {
                    const maBbStr = b.MABB || `BBH${String(b.id || '').padStart(6, '0')}`;
                    const prodName = b.loHang?.sanpham?.TENSP || b.san_pham?.TENSP || b.MASP || '-';
                    const storeName = b.cuahang?.TENCUAHANG || b.cua_hang?.TENCUAHANG || `CH #${b.MACUAHANG}`;
                    const usernameStr = b.taikhoan?.USERNAME || b.USERNAME || b.NGUOI_HUY || 'Admin';
                    const dateStr = b.NGAY_HUY ? new Date(b.NGAY_HUY).toLocaleString('vi-VN') : '-';

                    return (
                      <tr key={b.id || b.MABB}>
                        <td><b>{maBbStr}</b></td>
                        <td><span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{b.MALOHAN}</span></td>
                        <td style={{ fontWeight: 'bold' }}>{prodName}</td>
                        <td>{storeName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <b style={{ color: '#dc3545' }}>{b.SOLUONG_HUY} cái</b>
                        </td>
                        <td>
                          <span style={{
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            padding: '3px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}>
                            {b.ly_do_label || b.LY_DO_TEXT || b.LY_DO}
                          </span>
                        </td>
                        <td><b>{usernameStr}</b></td>
                        <td>{dateStr}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-btn admin-btn-info"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleViewDetail(b.id || b.MABB)}
                          >
                            <i className="fa-solid fa-file-invoice"></i> Xem Chứng Từ
                          </button>
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

      {/* MODAL PRINTABLE DOCUMENT WITH 4 SIGNATURE BLOCKS */}
      {showModal && selectedBb && (
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
          <div className="admin-card" style={{ maxWidth: '750px', width: '100%', maxHeight: '90vh', overflowY: 'auto', margin: 0, backgroundColor: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', borderRadius: '12px', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Biên Bản Hủy Hàng Chuẩn ({selectedBb.MABB || `BBH${String(selectedBb.id || '').padStart(6, '0')}`})</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            
            <div style={{
              backgroundColor: '#fff',
              color: '#000',
              padding: '25px',
              borderRadius: '8px',
              fontFamily: "'Montserrat', sans-serif",
              marginBottom: '20px',
              border: '2px solid #5c3d2e'
            }}>
              {/* Header Dola Bakery */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #5c3d2e', paddingBottom: '15px', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#5c3d2e', fontSize: '1.4rem', fontWeight: 800 }}>DOLA BAKERY</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#555' }}>Chuyên bánh ngọt & bánh kem cao cấp</p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#777' }}>Chi nhánh: {selectedBb.cuahang?.TENCUAHANG || `Cửa Hàng #${selectedBb.MACUAHANG}`}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: '#c62828', fontSize: '1.3rem', textTransform: 'uppercase', fontWeight: 800 }}>BIÊN BẢN HỦY SẢN PHẨM</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#444' }}>
                    Số phiếu: <b>{selectedBb.MABB || `BBH${String(selectedBb.id || '').padStart(6, '0')}`}</b>
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#444' }}>
                    Ngày lập: {selectedBb.NGAY_HUY ? new Date(selectedBb.NGAY_HUY).toLocaleDateString('vi-VN') : '-'}
                  </p>
                </div>
              </div>

              {/* Chi tiết lô bánh */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '30%' }}>Mã Lô Hàng:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}><b style={{ color: '#2563eb' }}>{selectedBb.MALOHAN}</b></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Tên Sản Phẩm Bánh:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>{selectedBb.loHang?.sanpham?.TENSP || selectedBb.san_pham?.TENSP || selectedBb.MASP}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Số Lượng Tiêu Hủy:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}><b style={{ color: '#dc2626', fontSize: '15px' }}>{selectedBb.SOLUONG_HUY} cái bánh</b></td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Lý Do Hủy Bánh:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {selectedBb.ly_do_label || selectedBb.LY_DO_TEXT || selectedBb.LY_DO}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Ghi Chú Chi Tiết:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{selectedBb.GHICHU || 'Hủy tự động theo quy trình kiểm tra HSD định kỳ của cửa hàng'}</td>
                  </tr>
                </tbody>
              </table>

              {/* 3 Chữ Ký Số Các Bên (Thủ Kho, Kế Toán, Giám Đốc Chi Nhánh) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '30px', textAlign: 'center', fontSize: '11px' }}>
                <div>
                  <b style={{ fontSize: '12px' }}>THỦ KHO / NGƯỜI LẬP</b><br/>
                  <span style={{ color: '#666' }}>(Ký & ghi rõ họ tên)</span>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                    {selectedBb.KY_THU_KHO ? (
                      <img src={selectedBb.KY_THU_KHO} alt="Chữ ký Thủ kho" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                    )}
                  </div>
                  <b style={{ fontSize: '12px' }}>{selectedBb.nhanvien?.HOTEN || selectedBb.USERNAME || 'Thủ kho'}</b>
                </div>

                <div>
                  <b style={{ fontSize: '12px' }}>KẾ TOÁN HẠCH TOÁN</b><br/>
                  <span style={{ color: '#666' }}>(Ký & ghi rõ họ tên)</span>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                    {selectedBb.KY_KE_TOAN ? (
                      <img src={selectedBb.KY_KE_TOAN} alt="Chữ ký Kế toán" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                    )}
                  </div>
                  <b style={{ fontSize: '12px' }}>{selectedBb.NGUOI_KY_KE_TOAN || 'Kế toán trưởng'}</b>
                </div>

                <div>
                  <b style={{ fontSize: '12px' }}>GIÁM ĐỐC CHI NHÁNH</b><br/>
                  <span style={{ color: '#666' }}>(Ký & ghi rõ họ tên)</span>
                  <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                    {selectedBb.KY_GIAM_DOC ? (
                      <img src={selectedBb.KY_GIAM_DOC} alt="Chữ ký Giám đốc" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                    )}
                  </div>
                  <b style={{ fontSize: '12px' }}>{selectedBb.NGUOI_KY_GIAM_DOC || 'Giám đốc chi nhánh'}</b>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="admin-btn" onClick={() => setShowModal(false)}>Đóng</button>
              <button className="admin-btn admin-btn-success" onClick={printDocument}>
                <i className="fa-solid fa-print"></i> In Chứng Từ Hủy (PDF/Khổ A4)
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminBienBanHuyPage;
