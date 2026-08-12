import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminVoucherPage = () => {
    const toast = useToast();
const [vouchers, setVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);

  const [formData, setFormData] = useState({
    MA_VOUCHER: '',
    TEN_VOUCHER: '',
    LOAI_GIAM: 'PHAN_TRAM',
    GIA_TRI: '',
    DON_TOI_THIEU: '0',
    GIAM_TOI_DA: '',
    SO_LUONG_GIOI_HAN: '100',
    NGAY_BAT_DAU: '',
    NGAY_KET_THUC: '',
    TRANG_THAI: true
  });

  const fetchVouchers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosClient.get('/admin/vouchers');
      setVouchers(res.data);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải danh sách voucher. Bạn có phải Quản lý tổng?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const openAddModal = () => {
    setEditingVoucher(null);
    setFormData({
      MA_VOUCHER: '',
      TEN_VOUCHER: '',
      LOAI_GIAM: 'PHAN_TRAM',
      GIA_TRI: '',
      DON_TOI_THIEU: '0',
      GIAM_TOI_DA: '',
      SO_LUONG_GIOI_HAN: '100',
      NGAY_BAT_DAU: new Date().toISOString().slice(0, 16),
      NGAY_KET_THUC: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      TRANG_THAI: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (v) => {
    setEditingVoucher(v);
    setFormData({
      MA_VOUCHER: v.MA_VOUCHER,
      TEN_VOUCHER: v.TEN_VOUCHER,
      LOAI_GIAM: v.LOAI_GIAM,
      GIA_TRI: v.GIA_TRI,
      DON_TOI_THIEU: v.DON_TOI_THIEU || 0,
      GIAM_TOI_DA: v.GIAM_TOI_DA || '',
      SO_LUONG_GIOI_HAN: v.SO_LUONG_GIOI_HAN,
      NGAY_BAT_DAU: new Date(v.NGAY_BAT_DAU).toISOString().slice(0, 16),
      NGAY_KET_THUC: new Date(v.NGAY_KET_THUC).toISOString().slice(0, 16),
      TRANG_THAI: v.TRANG_THAI
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (!payload.GIAM_TOI_DA) payload.GIAM_TOI_DA = null;

      if (editingVoucher) {
        await axiosClient.put(`/admin/vouchers/${editingVoucher.MA_VOUCHER}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await axiosClient.post('/admin/vouchers', payload);
        toast.success('Thêm mới thành công!');
      }
      setIsModalOpen(false);
      fetchVouchers();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi: ' + (e.response?.data?.message || e.message));
    }
  };

  const toggleStatus = async (id) => {
    try {
      await axiosClient.delete(`/admin/vouchers/${id}`);
      fetchVouchers();
    } catch (e) {
      console.error(e);
      toast.error('Lỗi thay đổi trạng thái');
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản lý Khuyến Mãi / Voucher</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>+ Thêm Voucher Mới</button>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh sách Voucher</h2>
        
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã Voucher</th>
                <th>Tên chương trình</th>
                <th>Loại giảm</th>
                <th>Giá trị</th>
                <th>Đơn tối thiểu</th>
                <th>Đã dùng / Tổng</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>Đang tải...</td></tr>
              ) : vouchers.length === 0 ? (
                <tr><td colSpan="9" style={{textAlign: 'center', padding: '20px'}}>Chưa có voucher nào</td></tr>
              ) : vouchers.map(v => (
                <tr key={v.MA_VOUCHER}>
                  <td><strong>{v.MA_VOUCHER}</strong></td>
                  <td>{v.TEN_VOUCHER}</td>
                  <td>{v.LOAI_GIAM === 'PHAN_TRAM' ? 'Phần trăm (%)' : 'Tiền mặt (đ)'}</td>
                  <td style={{color: 'red', fontWeight: 'bold'}}>
                    {v.LOAI_GIAM === 'PHAN_TRAM' ? `${v.GIA_TRI}%` : `${Number(v.GIA_TRI).toLocaleString()}đ`}
                  </td>
                  <td>{Number(v.DON_TOI_THIEU).toLocaleString()}đ</td>
                  <td>
                    {v.SO_LUONG_DA_DUNG} / {v.SO_LUONG_GIOI_HAN}
                    {v.SO_LUONG_DA_DUNG >= v.SO_LUONG_GIOI_HAN && <span style={{color:'red', display:'block', fontSize:'12px'}}>(Hết lượt)</span>}
                  </td>
                  <td style={{fontSize: '13px'}}>
                    Từ: {new Date(v.NGAY_BAT_DAU).toLocaleString('vi-VN')}<br/>
                    Đến: {new Date(v.NGAY_KET_THUC).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    {v.TRANG_THAI ? (
                      <span className="admin-badge admin-badge-success">Đang hoạt động</span>
                    ) : (
                      <span className="admin-badge admin-badge-danger">Đã vô hiệu hóa</span>
                    )}
                  </td>
                  <td>
                    <div className="admin-flex-gap">
                      <button className="admin-btn admin-btn-secondary" style={{padding: '4px 8px'}} onClick={() => openEditModal(v)}>Sửa</button>
                      <button 
                        className={`admin-btn ${v.TRANG_THAI ? 'admin-btn-danger' : 'admin-btn-success'}`} 
                        style={{padding: '4px 8px'}} 
                        onClick={() => toggleStatus(v.MA_VOUCHER)}
                      >
                        {v.TRANG_THAI ? 'Tạm dừng' : 'Kích hoạt'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
          <div className="admin-modal" style={{backgroundColor: '#fff', padding: '2rem', borderRadius: '0.5rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'}}>
            <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
                {editingVoucher ? 'Sửa Voucher' : 'Tạo Voucher Mới'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer'}}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Mã Voucher (Code) *</label>
                <input type="text" name="MA_VOUCHER" value={formData.MA_VOUCHER} onChange={handleInputChange} className="admin-input" disabled={!!editingVoucher} required style={{textTransform: 'uppercase'}} />
              </div>
              
              <div className="admin-form-group">
                <label>Tên chương trình khuyến mãi *</label>
                <input type="text" name="TEN_VOUCHER" value={formData.TEN_VOUCHER} onChange={handleInputChange} className="admin-input" required />
              </div>

              <div style={{display: 'flex', gap: '15px'}}>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Loại giảm *</label>
                  <select name="LOAI_GIAM" value={formData.LOAI_GIAM} onChange={handleInputChange} className="admin-input" required>
                    <option value="PHAN_TRAM">Phần trăm (%)</option>
                    <option value="TIEN_MAT">Tiền mặt (đ)</option>
                  </select>
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Giá trị giảm *</label>
                  <input type="number" name="GIA_TRI" min="1" value={formData.GIA_TRI} onChange={handleInputChange} className="admin-input" required />
                </div>
              </div>

              <div style={{display: 'flex', gap: '15px'}}>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Đơn tối thiểu (đ) *</label>
                  <input type="number" name="DON_TOI_THIEU" min="0" value={formData.DON_TOI_THIEU} onChange={handleInputChange} className="admin-input" required />
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Giảm tối đa (đ) - <i>Chỉ cho %</i></label>
                  <input type="number" name="GIAM_TOI_DA" min="0" value={formData.GIAM_TOI_DA} onChange={handleInputChange} className="admin-input" disabled={formData.LOAI_GIAM !== 'PHAN_TRAM'} />
                </div>
              </div>

              <div className="admin-form-group">
                <label>Tổng lượt sử dụng *</label>
                <input type="number" name="SO_LUONG_GIOI_HAN" min="1" value={formData.SO_LUONG_GIOI_HAN} onChange={handleInputChange} className="admin-input" required />
              </div>

              <div style={{display: 'flex', gap: '15px'}}>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Ngày bắt đầu *</label>
                  <input type="datetime-local" name="NGAY_BAT_DAU" value={formData.NGAY_BAT_DAU} onChange={handleInputChange} className="admin-input" required />
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Ngày kết thúc *</label>
                  <input type="datetime-local" name="NGAY_KET_THUC" value={formData.NGAY_KET_THUC} onChange={handleInputChange} className="admin-input" required />
                </div>
              </div>

              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary">{editingVoucher ? 'Cập nhật' : 'Tạo Voucher'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVoucherPage;
