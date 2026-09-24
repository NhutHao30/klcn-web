import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/categoryService';
import { getProducts } from '../../services/productService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const AdminCategoryPage = () => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    TENLOAI: '',
    MO_TA: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resCat, resProd] = await Promise.allSettled([
        getCategories(),
        getProducts({ page: 1, size: 200 })
      ]);

      if (resCat.status === 'fulfilled') {
        const val = resCat.value;
        const list = val?.data || val || [];
        setCategories(Array.isArray(list) ? list : []);
      }

      if (resProd.status === 'fulfilled') {
        const val = resProd.value;
        const pList = val?.data?.data || val?.data || val || [];
        setProducts(Array.isArray(pList) ? pList : []);
      }
    } catch (e) {
      toast.error('Lỗi khi tải danh sách loại sản phẩm');
    } finally {
      setIsLoading(false);
    }
  };

  const getProductCountForCat = (maloai) => {
    if (!products.length) return 0;
    return products.filter(p => String(p.MALOAI) === String(maloai)).length;
  };

  const handleOpenModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        TENLOAI: cat.TENLOAI || cat.name || '',
        MO_TA: cat.MO_TA || cat.description || ''
      });
    } else {
      setEditingCategory(null);
      setFormData({ TENLOAI: '', MO_TA: '' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.TENLOAI.trim()) {
      toast.warning('Tên loại sản phẩm không được để trống!');
      return;
    }

    setIsSaving(true);
    try {
      const catId = editingCategory?.MALOAI || editingCategory?.id;
      if (editingCategory) {
        const res = await updateCategory(catId, formData);
        toast.success(res?.message || 'Đã cập nhật loại sản phẩm!');
      } else {
        const res = await createCategory(formData);
        toast.success(res?.message || 'Đã thêm loại sản phẩm mới!');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      toast.error('Lỗi lưu loại sản phẩm: ' + (e.response?.data?.message || e.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    const catId = cat.MALOAI || cat.id;
    const count = getProductCountForCat(catId);
    if (count > 0) {
      if (!window.confirm(`Loại sản phẩm "${cat.TENLOAI}" hiện đang chứa ${count} sản phẩm bánh. Bạn có chắc chắn muốn xóa không?`)) {
        return;
      }
    } else {
      if (!window.confirm(`Bạn có chắc chắn muốn xóa loại sản phẩm "${cat.TENLOAI}"?`)) return;
    }

    try {
      const res = await deleteCategory(catId);
      toast.success(res?.message || 'Đã xóa loại sản phẩm!');
      setCategories(prev => prev.filter(item => (item.MALOAI || item.id) !== catId));
    } catch (e) {
      toast.error('Lỗi khi xóa loại sản phẩm: ' + (e.response?.data?.message || e.message));
    }
  };

  const filteredCategories = categories.filter(c => {
    const term = searchTerm.toLowerCase();
    const name = (c.TENLOAI || c.name || '').toLowerCase();
    const desc = (c.MO_TA || c.description || '').toLowerCase();
    const code = String(c.MALOAI || c.id || '').toLowerCase();
    return name.includes(term) || desc.includes(term) || code.includes(term);
  });

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản Lý Loại Sản Phẩm</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Quản lý danh mục phân loại các loại bánh tươi, bánh ngọt, bánh kem và đồ uống</p>
        </div>
        <button className="admin-btn admin-btn-success" onClick={() => handleOpenModal()}>
          <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Thêm Loại Sản Phẩm Mới
        </button>
      </div>

      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
          <h2 className="admin-card-title" style={{ margin: 0 }}>Danh Sách Danh Mục Loại Sản Phẩm ({filteredCategories.length})</h2>
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo tên loại, mã, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '32px' }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '13px' }}></i>
          </div>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '30px 0', color: '#666' }}>
            <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)', marginBottom: '8px' }}></i><br />
            Đang tải danh sách loại sản phẩm...
          </p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Mã Loại</th>
                  <th style={{ width: '250px' }}>Tên Loại Sản Phẩm</th>
                  <th>Mô Tả Danh Mục</th>
                  <th style={{ width: '140px', textAlign: 'center' }}>Số Lượng SP</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Chưa có loại sản phẩm nào phù hợp với tìm kiếm
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map(cat => {
                    const catId = cat.MALOAI || cat.id;
                    const count = getProductCountForCat(catId);
                    return (
                      <tr key={catId}>
                        <td><b>{catId}</b></td>
                        <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>
                          <i className="fa-solid fa-cookie" style={{ marginRight: '8px', color: 'var(--admin-accent)' }}></i>
                          {cat.TENLOAI || cat.name}
                        </td>
                        <td style={{ color: '#475569', fontSize: '13px' }}>
                          {cat.MO_TA || cat.description || <span style={{ fontStyle: 'italic', color: '#cbd5e1' }}>Chưa có mô tả</span>}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-badge ${count > 0 ? 'admin-badge-info' : 'admin-badge-warning'}`}>
                            {count} sản phẩm
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-btn admin-btn-info"
                            style={{ padding: '4px 10px', fontSize: '12px', marginRight: '6px' }}
                            onClick={() => handleOpenModal(cat)}
                          >
                            <i className="fa-solid fa-pen" style={{ marginRight: '4px' }}></i> Sửa
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => handleDelete(cat)}
                          >
                            <i className="fa-solid fa-trash" style={{ marginRight: '4px' }}></i> Xóa
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

      {/* Modal Add / Edit Category */}
      {isModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {editingCategory ? 'Chỉnh Sửa Loại Sản Phẩm' : 'Thêm Loại Sản Phẩm Mới'}
              </h3>
              <button className="admin-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-label">Tên Loại Sản Phẩm <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    value={formData.TENLOAI}
                    onChange={(e) => setFormData({ ...formData, TENLOAI: e.target.value })}
                    placeholder="VD: Bánh Kem Sinh Nhật, Bánh Mì Sandwich..."
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Mô Tả Danh Mục</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={formData.MO_TA}
                    onChange={(e) => setFormData({ ...formData, MO_TA: e.target.value })}
                    placeholder="Ghi chú thêm về quy cách hoặc đặc thù nhóm bánh này..."
                  ></textarea>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-success" disabled={isSaving}>
                  {isSaving ? 'Đang lưu...' : (editingCategory ? 'Cập Nhật' : 'Tạo Mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminCategoryPage;
