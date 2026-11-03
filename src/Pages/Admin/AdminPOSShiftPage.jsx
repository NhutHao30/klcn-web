import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminPOSShiftPage = () => {
  const toast = useToast();
  const [shifts, setShifts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);

  const fetchShifts = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/admin/pos/shifts', {
        params: {
          per_page: 100,
          trang_thai: statusFilter !== 'ALL' ? statusFilter : undefined
        }
      });
      const data = res.data.data || res.data;
      setShifts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Lỗi lấy danh sách ca làm việc:", error);
      toast.error("Không thể tải danh sách ca làm việc!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [statusFilter]);

  const filteredShifts = shifts.filter(s => {
    const nhanVienName = (s.nhanvien?.ho_ten || s.nhanvien?.name || '').toLowerCase();
    const cuaHangName = (s.cuahang?.ten_cuahang || s.cuahang?.ten_cua_hang || s.cuahang?.TENCUAHANG || s.cuahang?.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return nhanVienName.includes(search) || cuaHangName.includes(search) || String(s.id).includes(search);
  });

  // KPI Metrics
  const totalShifts = filteredShifts.length;
  const totalRevenues = filteredShifts.reduce((acc, s) => acc + Number(s.tong_doanh_thu || 0), 0);
  const totalDiscrepancy = filteredShifts.reduce((acc, s) => acc + Number(s.chenh_lech || 0), 0);
  const discrepancyCount = filteredShifts.filter(s => s.trang_thai === 1 && Number(s.chenh_lech || 0) !== 0).length;

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: '4px' }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '10px', color: 'var(--primary-color)' }}></i>
            Quản Lý Ca Làm Việc POS
          </h1>
          <p style={{ color: '#6c757d', margin: 0, fontSize: '14px' }}>
            Theo dõi, đối soát doanh thu ca và giám sát chênh lệch két tiền mặt thực tế.
          </p>
        </div>
        <button className="admin-btn admin-btn-secondary" onClick={fetchShifts}>
          <i className="fa-solid fa-rotate-right" style={{ marginRight: '6px' }}></i> Làm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '20px' }}>
        <div className="admin-card" style={{ padding: '15px', borderLeft: '4px solid #0d6efd' }}>
          <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>TỔNG SỐ CA LÀM VIỆC</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#0d6efd' }}>{totalShifts} ca</div>
        </div>

        <div className="admin-card" style={{ padding: '15px', borderLeft: '4px solid #198754' }}>
          <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>TỔNG DOANH THU CA</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#198754' }}>
            {totalRevenues.toLocaleString('vi-VN')} ₫
          </div>
        </div>

        <div className="admin-card" style={{ padding: '15px', borderLeft: '4px solid #ffc107' }}>
          <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>CA CÓ CHÊNH LỆCH KÉT</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: '#d39e00' }}>
            {discrepancyCount} ca
          </div>
        </div>

        <div className="admin-card" style={{ padding: '15px', borderLeft: `4px solid ${totalDiscrepancy < 0 ? '#dc3545' : '#0dcaf0'}` }}>
          <div style={{ fontSize: '13px', color: '#6c757d', fontWeight: '500' }}>TỔNG MỨC CHÊNH LỆCH KÉT</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginTop: '5px', color: totalDiscrepancy < 0 ? '#dc3545' : '#0dcaf0' }}>
            {totalDiscrepancy > 0 ? '+' : ''}{totalDiscrepancy.toLocaleString('vi-VN')} ₫
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="admin-card" style={{ marginBottom: '20px', padding: '15px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo tên nhân viên, cửa hàng hoặc ID ca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ width: '200px' }}>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ marginBottom: 0 }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="0">🟢 Ca đang mở</option>
              <option value="1">🔒 Ca đã đóng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Shift Table */}
      <div className="admin-card" style={{ overflowX: 'auto' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ marginBottom: '10px' }}></i>
            <div>Đang tải dữ liệu ca làm việc...</div>
          </div>
        ) : filteredShifts.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <i className="fa-solid fa-folder-open fa-2x" style={{ marginBottom: '10px' }}></i>
            <div>Không tìm thấy dữ liệu ca làm việc nào.</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Ca</th>
                <th>Nhân Viên</th>
                <th>Cửa Hàng</th>
                <th>Thời Gian</th>
                <th>Tiền Đầu Ca</th>
                <th>Doanh Thu Tiền Mặt</th>
                <th>Tổng Doanh Thu</th>
                <th>Két Tiền Dự Kiến</th>
                <th>Két Thực Tế</th>
                <th>Chênh Lệch</th>
                <th>Trạng Thái</th>
                <th>Chi Tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredShifts.map(s => {
                const isClosed = s.trang_thai === 1;
                const diff = Number(s.chenh_lech || 0);
                const hasDiff = isClosed && diff !== 0;

                return (
                  <tr key={s.id} style={{ backgroundColor: hasDiff ? 'rgba(255, 193, 7, 0.05)' : undefined }}>
                    <td><strong>#CA-{s.id}</strong></td>
                    <td>
                      <strong>{s.nhanvien?.ho_ten || s.nhanvien?.name || `ID: ${s.nhanvien_id}`}</strong>
                    </td>
                    <td>{s.cuahang?.ten_cuahang || s.cuahang?.ten_cua_hang || s.cuahang?.TENCUAHANG || s.cuahang?.name || `CH #${s.cuahang_id}`}</td>
                    <td style={{ fontSize: '13px' }}>
                      <div><i className="fa-regular fa-clock" style={{ color: '#198754', marginRight: '4px' }}></i> {new Date(s.thoi_gian_mo_ca).toLocaleString('vi-VN')}</div>
                      {s.thoi_gian_dong_ca && (
                        <div style={{ color: '#6c757d', marginTop: '2px' }}>
                          <i className="fa-solid fa-lock" style={{ color: '#dc3545', marginRight: '4px' }}></i> {new Date(s.thoi_gian_dong_ca).toLocaleString('vi-VN')}
                        </div>
                      )}
                    </td>
                    <td>{Number(s.tien_mat_dau_ca || 0).toLocaleString('vi-VN')} ₫</td>
                    <td style={{ color: '#198754', fontWeight: '500' }}>
                      +{Number(s.doanh_thu_tien_mat || s.cash_sales || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td style={{ color: '#0d6efd', fontWeight: 'bold' }}>
                      {Number(s.tong_doanh_thu || s.total_sales || 0).toLocaleString('vi-VN')} ₫
                    </td>
                    <td>{Number(s.tien_mat_sach || s.expected_cash || 0).toLocaleString('vi-VN')} ₫</td>
                    <td>
                      {isClosed ? (
                        <strong>{Number(s.tien_mat_thuc_te || 0).toLocaleString('vi-VN')} ₫</strong>
                      ) : (
                        <span style={{ color: '#999', fontStyle: 'italic' }}>Đang làm việc</span>
                      )}
                    </td>
                    <td>
                      {!isClosed ? (
                        <span className="admin-badge admin-badge-secondary">---</span>
                      ) : diff === 0 ? (
                        <span className="admin-badge admin-badge-success">
                          <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> Khớp 100%
                        </span>
                      ) : diff < 0 ? (
                        <span className="admin-badge admin-badge-danger" style={{ fontSize: '13px', padding: '6px 10px' }}>
                          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '4px' }}></i> THIẾU {Math.abs(diff).toLocaleString('vi-VN')} ₫
                        </span>
                      ) : (
                        <span className="admin-badge admin-badge-warning" style={{ fontSize: '13px', padding: '6px 10px', color: '#856404', backgroundColor: '#fff3cd' }}>
                          <i className="fa-solid fa-circle-plus" style={{ marginRight: '4px' }}></i> THỪA {Math.abs(diff).toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </td>
                    <td>
                      {isClosed ? (
                        <span className="admin-badge admin-badge-secondary">Đã đóng</span>
                      ) : (
                        <span className="admin-badge admin-badge-success">Đang mở</span>
                      )}
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '13px' }}
                        onClick={() => setSelectedShift(s)}
                      >
                        <i className="fa-solid fa-eye"></i> Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedShift && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '550px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', pb: '10px' }}>
              <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>
                <i className="fa-solid fa-receipt" style={{ marginRight: '8px' }}></i>
                Chi Tiết Ca Làm Việc #CA-{selectedShift.id}
              </h2>
              <button style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: '#999' }} onClick={() => setSelectedShift(null)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Nhân viên phụ trách:</span>
                <strong>{selectedShift.nhanvien?.ho_ten || selectedShift.nhanvien?.name || `ID: ${selectedShift.nhanvien_id}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Cửa hàng:</span>
                <strong>{selectedShift.cuahang?.ten_cua_hang || selectedShift.cuahang?.name || `ID: ${selectedShift.cuahang_id}`}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Thời gian mở ca:</span>
                <strong>{new Date(selectedShift.thoi_gian_mo_ca).toLocaleString('vi-VN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Thời gian đóng ca:</span>
                <strong>{selectedShift.thoi_gian_dong_ca ? new Date(selectedShift.thoi_gian_dong_ca).toLocaleString('vi-VN') : 'Đang mở'}</strong>
              </div>
            </div>

            <h4 style={{ marginBottom: '10px', color: '#495057' }}>Phân Rã Doanh Thu Ca:</h4>
            <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>1. Doanh thu Tiền mặt:</span>
                <strong style={{ color: '#198754' }}>+{Number(selectedShift.doanh_thu_tien_mat || selectedShift.cash_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>2. Doanh thu VietQR / Chuyển khoản:</span>
                <strong style={{ color: '#0d6efd' }}>+{Number(selectedShift.doanh_thu_chuyen_khoan || selectedShift.bank_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>3. Doanh thu Ví MoMo:</span>
                <strong style={{ color: '#d63384' }}>+{Number(selectedShift.doanh_thu_momo || selectedShift.momo_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #ccc', fontWeight: 'bold', color: '#0d6efd' }}>
                <span>TỔNG DOANH THU CẢ CA:</span>
                <span>{Number(selectedShift.tong_doanh_thu || selectedShift.total_sales || 0).toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <h4 style={{ marginBottom: '10px', color: '#495057' }}>Đối Soát Két Tiền Mặt:</h4>
            <div style={{ background: '#fff', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', marginBottom: '20px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tiền mặt đầu ca:</span>
                <strong>{Number(selectedShift.tien_mat_dau_ca || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Doanh thu tiền mặt thêm vào két:</span>
                <strong style={{ color: '#198754' }}>+{Number(selectedShift.doanh_thu_tien_mat || selectedShift.cash_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc' }}>
                <span>Két tiền mặt dự kiến (Hệ thống):</span>
                <strong>{Number(selectedShift.tien_mat_sach || selectedShift.expected_cash || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Két tiền mặt thực tế (Nhân viên đếm):</span>
                <strong>{Number(selectedShift.tien_mat_thuc_te || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #dee2e6', fontWeight: 'bold', fontSize: '16px' }}>
                <span>KẾT QUẢ CHÊNH LỆCH:</span>
                <span style={{ color: Number(selectedShift.chenh_lech || 0) < 0 ? '#dc3545' : (Number(selectedShift.chenh_lech || 0) > 0 ? '#d39e00' : '#198754') }}>
                  {Number(selectedShift.chenh_lech || 0) < 0
                    ? `THIẾU ${Math.abs(Number(selectedShift.chenh_lech)).toLocaleString('vi-VN')} ₫`
                    : (Number(selectedShift.chenh_lech || 0) > 0
                      ? `THỪA ${Math.abs(Number(selectedShift.chenh_lech)).toLocaleString('vi-VN')} ₫`
                      : 'KHỚP 100% (0 ₫)')}
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedShift(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminPOSShiftPage;
