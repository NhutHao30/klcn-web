import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getNhaCungCaps, createNhaCungCap, updateNhaCungCap, deleteNhaCungCap } from '../../services/batchService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const AdminNhaCungCapPage = () => {
  const toast = useToast();
  const [nccList, setNccList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Supplier
  const [isNccModalOpen, setIsNccModalOpen] = useState(false);
  const [editingNcc, setEditingNcc] = useState(null);
  const [nccForm, setNccForm] = useState({
    TENNCC: '',
    DIENTHOAI: '',
    EMAIL: '',
    DIACHI: ''
  });

  useEffect(() => {
    fetchNccs();
  }, []);

  const fetchNccs = async () => {
    setIsLoading(true);
    try {
      const val = await getNhaCungCaps();
      const nccs = val?.data || val || [];
      setNccList(Array.isArray(nccs) ? nccs : []);
    } catch (e) {
      toast.error('Lỗi khi tải danh sách Nhà Cung Cấp: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenNccModal = (ncc = null) => {
    if (ncc) {
      setEditingNcc(ncc);
      setNccForm({
        TENNCC: ncc.TENNCC || '',
        DIENTHOAI: ncc.DIENTHOAI || '',
        EMAIL: ncc.EMAIL || '',
        DIACHI: ncc.DIACHI || ''
      });
    } else {
      setEditingNcc(null);
      setNccForm({ TENNCC: '', DIENTHOAI: '', EMAIL: '', DIACHI: '' });
    }
    setIsNccModalOpen(true);
  };

  const handleSaveNcc = async (e) => {
    e.preventDefault();
    try {
      if (editingNcc) {
        const res = await updateNhaCungCap(editingNcc.MANCC, nccForm);
        toast.success(res.message || 'Đã cập nhật Nhà Cung Cấp!');
      } else {
        const res = await createNhaCungCap(nccForm);
        toast.success(res.message || 'Thêm Nhà Cung Cấp mới thành công!');
      }
      setIsNccModalOpen(false);
      fetchNccs();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra khi lưu Nhà Cung Cấp');
    }
  };

  const handleDeleteNcc = async (mancc) => {
    if (!window.confirm(`Bạn có chắc muốn xóa Nhà Cung Cấp ${mancc}?`)) return;
    try {
      const res = await deleteNhaCungCap(mancc);
      toast.success(res.message || 'Đã xóa Nhà Cung Cấp!');
      setNccList(prev => prev.filter(item => item.MANCC !== mancc));
    } catch (e) {
      toast.error('Lỗi xóa NCC: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
    }
  };

  const filteredNcc = nccList.filter(n => {
    const term = searchTerm.toLowerCase();
    return (
      (n.TENNCC || '').toLowerCase().includes(term) ||
      (n.MANCC || '').toString().toLowerCase().includes(term) ||
      (n.DIENTHOAI || '').toLowerCase().includes(term) ||
      (n.EMAIL || '').toLowerCase().includes(term)
    );
  });

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản Lý Nhà Cung Cấp</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Quản lý thông tin chi tiết các nhà cung cấp nguyên liệu, vỏ hộp và sản phẩm bánh</p>
        </div>
        <button className="admin-btn admin-btn-success" onClick={() => handleOpenNccModal()}>
          <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Thêm NCC Mới
        </button>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
          <h2 className="admin-card-title" style={{ margin: 0 }}>Danh Sách Nhà Cung Cấp ({filteredNcc.length})</h2>
          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo tên, mã NCC, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px' }}></i>
          </div>
        </div>

        {isLoading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Đang tải danh sách Nhà Cung Cấp...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã NCC</th>
                  <th>Tên Nhà Cung Cấp</th>
                  <th>Số Điện Thoại</th>
                  <th>Email</th>
                  <th>Địa Chỉ</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredNcc.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Chưa có Nhà Cung Cấp nào khớp với kết quả tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredNcc.map(n => (
                    <tr key={n.MANCC}>
                      <td><b>{n.MANCC}</b></td>
                      <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>{n.TENNCC}</td>
                      <td>{n.DIENTHOAI || '-'}</td>
                      <td>{n.EMAIL || '-'}</td>
                      <td>{n.DIACHI || '-'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="admin-btn admin-btn-info"
                          style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                          onClick={() => handleOpenNccModal(n)}
                        >
                          <i className="fa-solid fa-pen" style={{ marginRight: '4px' }}></i> Sửa
                        </button>
                        <button
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '4px 10px', fontSize: '12px' }}
                          onClick={() => handleDeleteNcc(n.MANCC)}
                        >
                          <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i> Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa NCC */}
      {isNccModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsNccModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingNcc ? 'Sửa Nhà Cung Cấp' : 'Thêm Nhà Cung Cấp Mới'}</h3>
              <button className="admin-modal-close" onClick={() => setIsNccModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSaveNcc}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Tên Nhà Cung Cấp <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    value={nccForm.TENNCC}
                    onChange={e => setNccForm({ ...nccForm, TENNCC: e.target.value })}
                    placeholder="VD: Công ty Bột mì ABC"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Số Điện Thoại</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={nccForm.DIENTHOAI}
                    onChange={e => setNccForm({ ...nccForm, DIENTHOAI: e.target.value })}
                    placeholder="VD: 0901234567"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Email Liên Hệ</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={nccForm.EMAIL}
                    onChange={e => setNccForm({ ...nccForm, EMAIL: e.target.value })}
                    placeholder="VD: contact@ncc.com"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Địa Chỉ</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={nccForm.DIACHI}
                    onChange={e => setNccForm({ ...nccForm, DIACHI: e.target.value })}
                    placeholder="VD: 123 Nguyễn Văn Cừ, Q.5, TP.HCM"
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsNccModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-success">
                  {editingNcc ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNhaCungCapPage;
