import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getBienBanHuys, getBienBanHuyDetail, duyetBienBanHuy } from '../../services/batchService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const AdminBienBanHuyPage = () => {
  const toast = useToast();
  const [bienBans, setBienBans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterLyDo, setFilterLyDo] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  // Modal View Printable Document
  const [selectedBb, setSelectedBb] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    import('../../services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(u => setCurrentUser(u)).catch(() => {});
    });
  }, []);

  const vaiTroId = Number(currentUser?.vaiTroId || currentUser?.vai_tro_id || 0);
  const maRole = currentUser?.MAROLE !== undefined ? Number(currentUser.MAROLE) : null;
  const isBranchManager = vaiTroId === 2 || maRole === 1;

  useEffect(() => {
    fetchData();
  }, [filterLyDo]);

  const handleApproveBienBan = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn phê duyệt biên bản hủy này? Số lượng sẽ được xuất hủy khỏi tồn kho chi nhánh.')) {
      return;
    }
    try {
      const res = await duyetBienBanHuy(id);
      if (res.success || res.status) {
        toast.success(res.message || 'Phê duyệt biên bản hủy thành công!');
        fetchData();
      } else {
        toast.error(res.message || 'Không thể phê duyệt');
      }
    } catch (e) {
      toast.error('Lỗi khi phê duyệt: ' + (e.response?.data?.message || e.message));
    }
  };

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
      toast.error('Lỗi tải danh sách biên bản hủy');
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
                    const maBbStr = b.MABB || b.maBienBan || `BBH${String(b.id || '').padStart(6, '0')}`;
                    const maLoStr = b.MALOHAN || b.chiTiets?.[0]?.loHang?.maLoHang || b.chi_tiets?.[0]?.lo_hang?.maLoHang || '-';
                    const prodName = b.TENSP || b.chiTiets?.[0]?.sanPham?.tenSanPham || b.chi_tiets?.[0]?.san_pham?.tenSanPham || b.MASP || '-';
                    const storeName = b.cuaHang?.tenCuaHang || b.cuahang?.TENCUAHANG || b.cua_hang?.TENCUAHANG || `Chi nhánh #${b.cuaHangId || b.MACUAHANG || 1}`;
                    const usernameStr = b.NGUOI_HUY || b.nguoiLap?.hoTen || b.nguoi_lap?.hoTen || b.nguoiLap?.HOTEN || b.nguoi_lap?.HOTEN || b.nguoiLap?.username || 'Nhân viên kho';
                    const rawDate = b.NGAY_HUY || b.ngayLap || b.ngay_lap || b.createdAt || b.created_at;
                    const dateStr = rawDate ? new Date(rawDate).toLocaleString('vi-VN') : '-';
                    const qtyHuy = b.SOLUONG_HUY ?? b.chiTiets?.[0]?.soLuongHuy ?? b.chi_tiets?.[0]?.soLuongHuy ?? 0;
                    const lyDoText = b.ly_do_label || (
                      b.lyDo === 'het_han' ? 'Hết hạn sử dụng (FEFO)' :
                      b.lyDo === 'hong_hong' ? 'Hư hỏng trong bảo quản' :
                      b.lyDo === 'thu_hoi' ? 'Thu hồi từ NCC' :
                      b.lyDo === 'khac' ? 'Lý do khác' : (b.lyDo || b.ly_do || 'Tiêu hủy định kỳ')
                    );

                    return (
                      <tr key={b.id || b.MABB || b.maBienBan}>
                        <td><b>{maBbStr}</b></td>
                        <td><span style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{maLoStr}</span></td>
                        <td style={{ fontWeight: 'bold' }}>{prodName}</td>
                        <td>{storeName}</td>
                        <td style={{ textAlign: 'center' }}>
                          <b style={{ color: '#dc3545' }}>{qtyHuy} cái</b>
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
                            {lyDoText}
                          </span>
                        </td>
                        <td><b>{usernameStr}</b></td>
                        <td>{dateStr}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-btn admin-btn-info"
                            style={{ padding: '3px 8px', fontSize: '11px', marginRight: '6px' }}
                            onClick={() => handleViewDetail(b.id || b.MABB || b.maBienBan)}
                          >
                            <i className="fa-solid fa-file-invoice"></i> Xem Chứng Từ
                          </button>
                          {isBranchManager && Number(b.trangThai ?? b.TRANGTHAI ?? 0) === 0 && (
                            <button
                              className="admin-btn admin-btn-success"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                              onClick={() => handleApproveBienBan(b.id || b.MABB || b.maBienBan)}
                            >
                              <i className="fa-solid fa-check"></i> Duyệt Hủy
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

      {/* MODAL PRINTABLE DOCUMENT WITH 3 SIGNATURE BLOCKS */}
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
              {/* Header Givral Bakery */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #5c3d2e', paddingBottom: '15px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src="/assets/IMG/Logo.jpg" alt="Givral Bakery" style={{ width: '54px', height: '54px', objectFit: 'contain', borderRadius: '6px' }} />
                  <div>
                    <h3 style={{ margin: 0, color: '#5c3d2e', fontSize: '1.4rem', fontWeight: 800 }}>GIVRAL BAKERY</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#555' }}>Chuyên bánh ngọt & bánh kem cao cấp</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#777' }}>
                      Chi nhánh: {selectedBb.cuaHang?.tenCuaHang || selectedBb.cuahang?.TENCUAHANG || selectedBb.cua_hang?.TENCUAHANG || `Cửa Hàng #${selectedBb.cuaHangId || selectedBb.MACUAHANG || 1}`}
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ margin: 0, color: '#c62828', fontSize: '1.3rem', textTransform: 'uppercase', fontWeight: 800 }}>BIÊN BẢN HỦY SẢN PHẨM</h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#444' }}>
                    Số phiếu: <b>{selectedBb.MABB || selectedBb.maBienBan || `BBH${String(selectedBb.id || '').padStart(6, '0')}`}</b>
                  </p>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#444' }}>
                    Ngày lập: {(() => {
                      const d = selectedBb.NGAY_HUY || selectedBb.ngayLap || selectedBb.ngay_lap || selectedBb.createdAt;
                      return d ? new Date(d).toLocaleDateString('vi-VN') : '-';
                    })()}
                  </p>
                </div>
              </div>

              {/* Chi tiết lô bánh */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc', width: '30%' }}>Mã Lô Hàng:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <b style={{ color: '#2563eb' }}>
                        {selectedBb.MALOHAN || selectedBb.chiTiets?.[0]?.loHang?.maLoHang || selectedBb.chi_tiets?.[0]?.lo_hang?.maLoHang || '-'}
                      </b>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Tên Sản Phẩm Bánh:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                      {selectedBb.TENSP || selectedBb.chiTiets?.[0]?.sanPham?.tenSanPham || selectedBb.chi_tiets?.[0]?.san_pham?.tenSanPham || selectedBb.san_pham?.TENSP || selectedBb.MASP || '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Số Lượng Tiêu Hủy:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <b style={{ color: '#dc2626', fontSize: '15px' }}>
                        {selectedBb.SOLUONG_HUY ?? selectedBb.chiTiets?.[0]?.soLuongHuy ?? selectedBb.chi_tiets?.[0]?.soLuongHuy ?? 0} cái bánh
                      </b>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Lý Do Hủy Bánh:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        {selectedBb.ly_do_label || (
                          selectedBb.lyDo === 'het_han' ? 'Hết hạn sử dụng (FEFO)' :
                          selectedBb.lyDo === 'hong_hong' ? 'Hư hỏng trong bảo quản' :
                          selectedBb.lyDo === 'thu_hoi' ? 'Thu hồi từ NCC' :
                          selectedBb.lyDo === 'khac' ? 'Lý do khác' : (selectedBb.lyDo || selectedBb.ly_do || 'Tiêu hủy định kỳ')
                        )}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Người Lập Phiếu:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <b>{selectedBb.NGUOI_HUY || selectedBb.nguoiLap?.hoTen || selectedBb.nguoi_lap?.hoTen || selectedBb.nguoiLap?.HOTEN || 'Nhân viên kho'}</b>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0', fontWeight: 'bold', backgroundColor: '#f8fafc' }}>Ghi Chú Chi Tiết:</td>
                    <td style={{ padding: '8px 12px', border: '1px solid #e2e8f0' }}>{selectedBb.GHICHU || selectedBb.ghiChu || 'Hủy theo quy trình kiểm soát chất lượng & HSD định kỳ'}</td>
                  </tr>
                </tbody>
              </table>

              {/* 3 Chữ Ký Số Các Bên (Nhân Viên Kho, Nhân Viên Kế Toán, Quản Lý Chi Nhánh) */}
              {(() => {
                const sigs = selectedBb.chu_ky_sos || selectedBb.chuKySos || [];
                const sigKho = sigs.find(s => Number(s.vaiTroKy || s.vai_tro_ky) === 2);
                const sigKeToan = sigs.find(s => Number(s.vaiTroKy || s.vai_tro_ky) === 1);
                const sigQuanLy = sigs.find(s => Number(s.vaiTroKy || s.vai_tro_ky) === 3);

                const isSignedKho = sigKho && Number(sigKho.trangThai) === 1;
                const isSignedKeToan = sigKeToan && Number(sigKeToan.trangThai) === 1;
                const isSignedQuanLy = sigQuanLy && Number(sigQuanLy.trangThai) === 1;

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '30px', textAlign: 'center', fontSize: '11px' }}>
                    <div>
                      <b style={{ fontSize: '12px' }}>NHÂN VIÊN KHO</b><br/>
                      <span style={{ color: '#666' }}>(Ký & ghi rõ họ tên)</span>
                      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                        {selectedBb.KY_THU_KHO ? (
                          <img src={selectedBb.KY_THU_KHO} alt="Chữ ký Nhân viên kho" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                        ) : isSignedKho ? (
                          <div style={{ padding: '4px 8px', backgroundColor: '#f0fdf4', border: '1px dashed #16a34a', borderRadius: '6px' }}>
                            <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>✓ ĐÃ KÝ SỐ</div>
                            <div style={{ fontSize: '9px', color: '#15803d' }}>{sigKho.ngayKy ? new Date(sigKho.ngayKy).toLocaleDateString('vi-VN') : 'Đã xác nhận'}</div>
                          </div>
                        ) : isSignedQuanLy ? (
                          <span style={{ color: '#16a34a', fontStyle: 'italic' }}>(Miễn ký do Quản lý CN đã duyệt)</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                        )}
                      </div>
                      <b style={{ fontSize: '12px' }}>{sigKho?.tenNguoiKy || sigKho?.nguoi_ky?.hoTen || selectedBb.NGUOI_HUY || selectedBb.nguoiLap?.hoTen || 'Nhân viên kho'}</b>
                    </div>

                    <div>
                      <b style={{ fontSize: '12px' }}>NHÂN VIÊN KẾ TOÁN</b><br/>
                      <span style={{ color: '#666' }}>(Ký & ghi rõ họ tên)</span>
                      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                        {selectedBb.KY_KE_TOAN ? (
                          <img src={selectedBb.KY_KE_TOAN} alt="Chữ ký Nhân viên kế toán" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                        ) : isSignedKeToan ? (
                          <div style={{ padding: '4px 8px', backgroundColor: '#f0fdf4', border: '1px dashed #16a34a', borderRadius: '6px' }}>
                            <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>✓ ĐÃ KÝ SỐ</div>
                            <div style={{ fontSize: '9px', color: '#15803d' }}>{sigKeToan.ngayKy ? new Date(sigKeToan.ngayKy).toLocaleDateString('vi-VN') : 'Đã xác nhận'}</div>
                          </div>
                        ) : isSignedQuanLy ? (
                          <span style={{ color: '#16a34a', fontStyle: 'italic' }}>(Miễn ký do Quản lý CN đã duyệt)</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                        )}
                      </div>
                      <b style={{ fontSize: '12px' }}>{sigKeToan?.tenNguoiKy || sigKeToan?.nguoi_ky?.hoTen || selectedBb.NGUOI_KY_KE_TOAN || 'Nhân viên kế toán'}</b>
                    </div>

                    <div>
                      <b style={{ fontSize: '12px' }}>QUẢN LÝ CHI NHÁNH</b><br/>
                      <span style={{ color: '#666' }}>(Ký duyệt chốt ngay)</span>
                      <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '4px 0' }}>
                        {selectedBb.KY_GIAM_DOC ? (
                          <img src={selectedBb.KY_GIAM_DOC} alt="Chữ ký Quản lý chi nhánh" style={{ maxHeight: '65px', objectFit: 'contain' }} />
                        ) : isSignedQuanLy ? (
                          <div style={{ padding: '4px 8px', backgroundColor: '#f0fdf4', border: '1px dashed #16a34a', borderRadius: '6px' }}>
                            <div style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>✓ ĐÃ PHÊ DUYỆT</div>
                            <div style={{ fontSize: '9px', color: '#15803d' }}>{sigQuanLy.ngayKy ? new Date(sigQuanLy.ngayKy).toLocaleDateString('vi-VN') : 'Đã xác nhận'}</div>
                          </div>
                        ) : (isSignedKho && isSignedKeToan) ? (
                          <span style={{ color: '#16a34a', fontStyle: 'italic' }}>(Đã đủ chữ ký Kho & Kế toán)</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>(Chưa ký)</span>
                        )}
                      </div>
                      <b style={{ fontSize: '12px' }}>{sigQuanLy?.tenNguoiKy || sigQuanLy?.nguoi_ky?.hoTen || selectedBb.NGUOI_KY_GIAM_DOC || 'Quản lý chi nhánh'}</b>
                    </div>
                  </div>
                );
              })()}
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
