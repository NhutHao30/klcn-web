import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getProducts, createProduct, updateProduct, deleteProduct, restoreProduct } from '../../services/productService';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminProductPage = () => {
    const toast = useToast();
const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Nút Thao tác nhanh yêu cầu nhập hàng
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({ MASP: '', TENSP: '', SOLUONG: 1, GHICHU: '' });

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Phân trang
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [formData, setFormData] = useState({
    MaSP: '',
    TenSP: '',
    GIABAN: '',
    LOAISP: '',
    SOLUONG: '0',
    DVT: 'Cái',
    GHICHU: '',
    IS_NEW: false,
    PHAN_TRAM_GIAM: 0
  });

  const fetchCategories = async () => {
    try {
      const res = await axiosClient.get('/categories');
      setCategories(res.data.data || res.data || []);
    } catch (e) {
      console.error("Lỗi lấy danh mục", e);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage + 1, // Laravel phân trang bắt đầu từ 1
        size: pageSize
      };
      if (searchQuery) params.keyword = searchQuery;
      if (searchCategory) params.category = searchCategory;
      if (searchStatus) params.status = searchStatus;
      
      const data = await getProducts(params);
      
      let rawList = data?.data?.data || data?.data || data || [];
      if (rawList && typeof rawList === 'object' && Array.isArray(rawList.data)) {
        rawList = rawList.data;
      }
      setProducts(Array.isArray(rawList) ? rawList : []);
      
      const lastPage = data?.last_page || data?.data?.last_page || 1;
      setTotalPages(lastPage);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize]);

  // Handle Search submit
  const handleSearch = () => {
    setCurrentPage(0); // Reset về trang đầu khi tìm kiếm
    fetchProducts();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    const defaultCat = categories.length > 0 ? (categories[0].MALOAI || categories[0].id || categories[0].maloai || '') : '';
    setFormData({ 
      MaSP: '', 
      TenSP: '', 
      GIABAN: '', 
      LOAISP: defaultCat, 
      SOLUONG: '0',
      DVT: 'Cái', 
      GHICHU: '',
      IS_NEW: false,
      PHAN_TRAM_GIAM: 0
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setSelectedFile(null);
    setFormData({
      MaSP: product.maSP || product.MaSP || product.MASP || '',
      TenSP: product.tenSP || product.TenSP || product.TENSP || '',
      GIABAN: product.giaban || product.GIABAN || '',
      LOAISP: product.loaisp || product.LOAISP || product.MALOAI || '',
      SOLUONG: product.soluong || product.SOLUONG || '0',
      DVT: product.dvt || product.DVT || 'Cái',
      GHICHU: product.ghichu || product.GHICHU || '',
      IS_NEW: product.is_new || product.IS_NEW || false,
      PHAN_TRAM_GIAM: product.phan_tram_giam || product.PHAN_TRAM_GIAM || 0
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setSelectedFile(null);
  };

  const openRestockModal = (product) => {
    setRestockData({
      MASP: product.maSP || product.MaSP || product.MASP,
      TENSP: product.tenSP || product.TenSP || product.TENSP,
      SOLUONG: 1,
      GHICHU: 'Yêu cầu nhập hàng bổ sung gấp'
    });
    setShowRestockModal(true);
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        GHICHU: restockData.GHICHU,
        details: [
          { MASP: restockData.MASP, SOLUONG: restockData.SOLUONG }
        ]
      };
      await axiosClient.post('/admin/transfers/requests', payload);
      toast.success('Tạo yêu cầu nhập hàng thành công!');
      setShowRestockModal(false);
    } catch (error) {
      console.error(error);
      toast.error('Lỗi: ' + (error.response?.data?.error || 'Có lỗi xảy ra khi tạo yêu cầu.'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Number(formData.GIABAN) < 0) {
      toast.info("Giá bán không được phép âm!");
      return;
    }

    try {
      // Dùng FormData để hỗ trợ upload ảnh
      const payload = new FormData();
      
      // Tự động tạo mã SP nếu chưa có (khi thêm mới)
      let masp = formData.MaSP;
      if (!masp && !editingProduct) {
        masp = 'SP' + Date.now().toString().slice(-6); // Ví dụ: SP123456
      }
      
      payload.append('MASP', masp);
      payload.append('TENSP', formData.TenSP);
      payload.append('ten_san_pham', formData.TenSP);
      payload.append('GIABAN', formData.GIABAN);
      payload.append('gia_ban', formData.GIABAN);
      payload.append('MALOAI', formData.LOAISP);
      payload.append('loai_id', formData.LOAISP);
      payload.append('DVT', formData.DVT);
      payload.append('don_vi_tinh', formData.DVT);
      payload.append('SOLUONG', formData.SOLUONG || 0);
      payload.append('GHICHU', formData.GHICHU || '');
      payload.append('mo_ta', formData.GHICHU || '');
      payload.append('IS_NEW', formData.IS_NEW ? 1 : 0);
      payload.append('PHAN_TRAM_GIAM', formData.PHAN_TRAM_GIAM || 0);
      
      if (selectedFile) {
        payload.append('HINHANH', selectedFile);
        payload.append('hinh_anh_file', selectedFile);
      }

      if (editingProduct) {
        const id = editingProduct.maSP || editingProduct.MaSP || editingProduct.MASP;
        await updateProduct(id, payload);
        toast.success('Cập nhật thành công!');
      } else {
        if (!selectedFile) {
          toast.warning('Vui lòng chọn hình ảnh cho sản phẩm!');
          return;
        }
        await createProduct(payload);
        toast.success('Thêm sản phẩm thành công!');
      }
      closeModal();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error('Có lỗi xảy ra! ' + (error.response?.data?.message || ''));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn vô hiệu hóa sản phẩm này? Sản phẩm sẽ bị ngừng bán.")) {
      try {
        await deleteProduct(id);
        toast.success('Vô hiệu hóa thành công!');
        fetchProducts();
      } catch (error) {
        console.error("Error deleting product:", error);
        toast.error('Có lỗi xảy ra khi vô hiệu hóa! ' + (error.response?.data?.message || ''));
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm("Bạn muốn kích hoạt lại sản phẩm này để tiếp tục bán?")) {
      try {
        await restoreProduct(id);
        toast.success('Kích hoạt lại thành công!');
        fetchProducts();
      } catch (error) {
        console.error("Error restoring product:", error);
        toast.error('Có lỗi xảy ra khi kích hoạt lại! ' + (error.response?.data?.message || ''));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản lý sản phẩm</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>+ Thêm sản phẩm</button>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh sách sản phẩm</h2>
        
        <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
          <div className="admin-flex-gap">
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Tìm kiếm sản phẩm..." 
              style={{ width: '250px', marginBottom: 0 }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
            />
            <select 
              className="admin-input" 
              style={{ width: '150px', marginBottom: 0 }}
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => (
                <option key={cat.MALOAI} value={cat.MALOAI}>{cat.TENLOAI}</option>
              ))}
            </select>
            <select 
              className="admin-input" 
              style={{ width: '150px', marginBottom: 0 }}
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="In Stock">Còn hàng</option>
              <option value="Out of Stock">Hết hàng</option>
            </select>
            <button className="admin-btn admin-btn-secondary" onClick={handleSearch}>Lọc</button>
          </div>
          
          <div className="admin-flex-gap">
            <span>Hiển thị: </span>
            <select 
              className="admin-input" 
              style={{ width: 'auto', marginBottom: 0, padding: '0.25rem 0.5rem' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã SP</th>
                <th>Mã QR</th>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá bán</th>
                <th>Tồn kho</th>
                <th>Tags</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Đang tải...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy dữ liệu</td></tr>
              ) : products.map(product => {
                const id = product.maSP || product.MaSP || product.MASP;
                const name = product.tenSP || product.TenSP || product.TENSP;
                const category = product.loaisanpham ? product.loaisanpham.TENLOAI : (product.loaisp || product.LOAISP || product.MALOAI);
                const price = product.giaban || product.GIABAN;
                const stock = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.soluong || product.SOLUONG || 0);
                const isDeactivated = !!product.deleted_at;
                const status = isDeactivated ? 'Ngừng bán' : (stock > 0 ? 'Còn hàng' : 'Hết hàng');
                const image = product.hinhanh || product.HINHANH;
                const filename = image ? image.split('/').pop() : 'productnew2.webp';
                // Nếu ảnh từ MinIO thì nó sẽ bắt đầu bằng http hoặc /api/proxy-image, nếu không thì lấy từ thư mục public/assets/IMG của Frontend
                const imageUrl = image ? ((image.startsWith('http') || image.startsWith('/api/')) ? image : `/assets/IMG/${filename}`) : `/assets/IMG/productnew2.webp`;
                
                return (
                  <tr key={id} style={{ opacity: isDeactivated ? 0.6 : 1 }}>
                    <td><strong>{id}</strong></td>
                    <td>
                      <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${id}`} target="_blank" rel="noreferrer" title="Click để xem và tải ảnh QR lớn">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${id}`} 
                          alt={`QR-${id}`} 
                          style={{ border: '1px solid #eee', padding: '2px', borderRadius: '4px', cursor: 'pointer' }} 
                        />
                      </a>
                    </td>
                    <td>
                      {image && <img src={imageUrl} alt={name} style={{width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px'}} />}
                    </td>
                    <td style={{ fontWeight: 600 }}>{name} {isDeactivated && <span style={{color:'red', fontSize:'12px'}}>(Đã vô hiệu hóa)</span>}</td>
                    <td>{category}</td>
                    <td>{Number(price).toLocaleString('vi-VN')}₫</td>
                    <td>{stock}</td>
                    <td>
                      <div className="admin-flex-gap" style={{ flexWrap: 'wrap' }}>
                        {product.IS_NEW ? <span className="admin-badge" style={{backgroundColor: '#fd7e14', color: '#fff'}}>New</span> : null}
                        {product.PHAN_TRAM_GIAM > 0 ? <span className="admin-badge" style={{backgroundColor: '#28a745', color: '#fff'}}>-{product.PHAN_TRAM_GIAM}%</span> : null}
                      </div>
                    </td>
                    <td>
                      <span className={`admin-badge ${status === 'Còn hàng' ? 'admin-badge-success' : (status === 'Ngừng bán' ? 'admin-badge-danger' : 'admin-badge-warning')}`} style={status === 'Ngừng bán' ? {backgroundColor: '#dc3545', color: '#fff'} : {}}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-flex-gap" style={{ flexWrap: 'wrap' }}>
                        {isDeactivated ? (
                          <button className="admin-btn admin-btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => handleRestore(id)}>Kích hoạt lại</button>
                        ) : (
                          <>
                            <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openEditModal(product)}>Sửa</button>
                            <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => handleDelete(id)}>Vô hiệu hóa</button>
                            <button className="admin-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '12px', backgroundColor: '#ffc107', color: '#000' }} onClick={() => openRestockModal(product)}>
                              <i className="fa-solid fa-truck-fast"></i> Nhập thêm
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* Phân trang */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
            <button 
              className="admin-btn admin-btn-secondary" 
              disabled={currentPage === 0} 
              onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            >
              &laquo; Trang trước
            </button>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>
              Trang {currentPage + 1} / {totalPages}
            </span>
            <button 
              className="admin-btn admin-btn-secondary" 
              disabled={currentPage >= totalPages - 1} 
              onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            >
              Trang sau &raquo;
            </button>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={modalStyle}>
            <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
                {editingProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}
              </h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="admin-form-group">
                <label>Tên sản phẩm *</label>
                <input type="text" name="TenSP" value={formData.TenSP} onChange={handleInputChange} className="admin-input" required />
              </div>
              
              <div style={{display: 'flex', gap: '15px'}}>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Giá bán *</label>
                  <input type="number" name="GIABAN" min="0" value={formData.GIABAN} onChange={handleInputChange} className="admin-input" required />
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Số lượng *</label>
                  <input type="number" name="SOLUONG" min="0" value={formData.SOLUONG} onChange={handleInputChange} className="admin-input" required />
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Đơn vị tính</label>
                  <input type="text" name="DVT" value={formData.DVT} onChange={handleInputChange} className="admin-input" placeholder="Ví dụ: Cái, Hộp" required />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label>Danh mục sản phẩm *</label>
                <select name="LOAISP" value={formData.LOAISP} onChange={handleInputChange} className="admin-input" required>
                  <option value="">-- Chọn danh mục sản phẩm --</option>
                  {categories.map(cat => {
                    const catId = cat.MALOAI || cat.id || cat.maloai;
                    const catName = cat.TENLOAI || cat.ten_loai || cat.tenloai;
                    return (
                      <option key={catId} value={catId}>{catName}</option>
                    );
                  })}
                </select>
              </div>

              <div style={{display: 'flex', gap: '15px'}}>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>Sản phẩm mới (Tag New)</label>
                  <div style={{marginTop: '10px'}}>
                    <input 
                      type="checkbox" 
                      name="IS_NEW" 
                      checked={formData.IS_NEW} 
                      onChange={(e) => setFormData({...formData, IS_NEW: e.target.checked})} 
                      style={{marginRight: '8px', transform: 'scale(1.2)'}}
                    />
                    <span>Bật tag "New"</span>
                  </div>
                </div>
                <div className="admin-form-group" style={{flex: 1}}>
                  <label>% Giảm giá</label>
                  <input type="number" name="PHAN_TRAM_GIAM" min="0" max="100" value={formData.PHAN_TRAM_GIAM} onChange={handleInputChange} className="admin-input" placeholder="0 - 100" />
                </div>
              </div>
              
              <div className="admin-form-group">
                <label>Hình ảnh sản phẩm {editingProduct ? '' : '*'}</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])} 
                  className="admin-input" 
                  style={{padding: '5px'}}
                />
                {editingProduct && formData.HINHANH && (
                  <small style={{color: '#666'}}>Để trống nếu không muốn thay đổi ảnh cũ.</small>
                )}
              </div>
              
              <div className="admin-form-group">
                <label>Ghi chú / Mô tả</label>
                <textarea name="GHICHU" value={formData.GHICHU} onChange={handleInputChange} className="admin-input" rows="3" />
              </div>
              
              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary">{editingProduct ? 'Cập nhật' : 'Thêm mới'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Nhập Hàng Nhanh */}
      {showRestockModal && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={modalStyle}>
            <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
              <h3 className="admin-card-title" style={{ marginBottom: 0, color: '#d9534f' }}>
                <i className="fa-solid fa-bolt"></i> Yêu Cầu Nhập Thêm Gấp
              </h3>
              <button type="button" onClick={() => setShowRestockModal(false)} style={closeBtnStyle}>&times;</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div className="admin-form-group">
                <label>Sản phẩm cần nhập</label>
                <input type="text" className="admin-input" value={`${restockData.MASP} - ${restockData.TENSP}`} disabled />
              </div>
              <div className="admin-form-group">
                <label>Số lượng muốn nhập thêm *</label>
                <input type="number" min="1" className="admin-input" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#dc3545' }} value={restockData.SOLUONG} onChange={(e) => setRestockData({...restockData, SOLUONG: e.target.value})} required />
              </div>
              <div className="admin-form-group">
                <label>Lý do / Ghi chú</label>
                <textarea className="admin-input" rows="2" value={restockData.GHICHU} onChange={(e) => setRestockData({...restockData, GHICHU: e.target.value})}></textarea>
              </div>
              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowRestockModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn" style={{ backgroundColor: '#28a745', color: '#fff' }}><i className="fa-solid fa-paper-plane"></i> Gửi Yêu Cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '0.5rem',
  width: '100%',
  maxWidth: '500px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

export default AdminProductPage;
