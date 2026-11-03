import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getProducts, createProduct, updateProduct, deleteProduct, restoreProduct } from '../../services/productService';
import { getStores } from '../../services/storeService';
import { getCurrentUser } from '../../services/authService';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';
import { formatImageUrl } from '../../utils/imageUtils';

const AdminProductPage = () => {
    const toast = useToast();
const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [searchStore, setSearchStore] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
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

  const [kpiStats, setKpiStats] = useState({ total: 0, active: 0, outOfStock: 0, disabled: 0 });

  const fetchKpiStats = async () => {
    // Stats are now fetched directly inside fetchProducts via fast backend SQL aggregation (< 5ms)
  };

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
      if (searchStore) params.store_id = searchStore;
      
      const data = await getProducts(params);
      
      let rawList = data?.data?.data || data?.data || data || [];
      if (rawList && typeof rawList === 'object' && Array.isArray(rawList.data)) {
        rawList = rawList.data;
      }
      setProducts(Array.isArray(rawList) ? rawList : []);

      if (data?.stats) {
        setKpiStats(data.stats);
      }
      
      const lastPage = data?.last_page || data?.data?.last_page || 1;
      setTotalPages(lastPage);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isBranchManager = currentUser && currentUser.nguoidung && currentUser.nguoidung.cuaHangId && (parseInt(currentUser.vaiTroId, 10) !== 1 && String(currentUser.username).toLowerCase() !== 'admin');

  useEffect(() => {
    fetchCategories();
    const initUserData = async () => {
      try {
        const u = await getCurrentUser();
        setCurrentUser(u);
        if (u && u.nguoidung && u.nguoidung.cuaHangId && (parseInt(u.vaiTroId, 10) !== 1 && String(u.username).toLowerCase() !== 'admin')) {
          setSearchStore(String(u.nguoidung.cuaHangId));
        }
      } catch (e) {}

      try {
        const stRes = await getStores();
        const rawSt = stRes?.data || stRes || [];
        const stList = Array.isArray(rawSt) ? rawSt : [];
        setStores(stList.map(st => ({ id: st.id || st.MACUAHANG, name: st.tenCuaHang || st.name || `Chi nhánh #${st.id}` })));
      } catch (e) {}
    };
    initUserData();
  }, []);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pageSize, searchStore]);

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
      MaSP: product.id || product.maSP || product.MaSP || product.MASP || '',
      TenSP: product.tenSanPham || product.tenSP || product.TenSP || product.TENSP || '',
      GIABAN: product.giaBan !== undefined ? product.giaBan : (product.giaban || product.GIABAN || ''),
      LOAISP: product.loaiId || product.loaisp || product.LOAISP || product.MALOAI || '',
      SOLUONG: product.soLuongTon !== undefined ? product.soLuongTon : (product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.soluong || product.SOLUONG || 0)),
      DVT: product.donViTinh || product.dvt || product.DVT || 'Cái',
      GHICHU: product.moTa || product.ghichu || product.GHICHU || '',
      IS_NEW: Boolean(product.isNew ?? product.IS_NEW ?? product.is_new ?? false),
      PHAN_TRAM_GIAM: product.phanTramGiam !== undefined ? product.phanTramGiam : (product.phan_tram_giam || product.PHAN_TRAM_GIAM || 0)
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
      MASP: product.id || product.maSP || product.MaSP || product.MASP,
      TENSP: product.tenSanPham || product.tenSP || product.TenSP || product.TENSP,
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
        const id = editingProduct.id || editingProduct.maSP || editingProduct.MaSP || editingProduct.MASP;
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
      fetchKpiStats();
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
        fetchKpiStats();
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
        fetchKpiStats();
      } catch (error) {
        console.error("Error restoring product:", error);
        toast.error('Có lỗi xảy ra khi kích hoạt lại! ' + (error.response?.data?.message || ''));
      }
    }
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: '4px', fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
            🍰 Quản lý sản phẩm
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Quản lý danh mục bánh, giá bán, tag khuyến mãi & theo dõi tồn kho thực tế
          </p>
        </div>
        <button className="admin-btn admin-btn-primary" 
          style={{ fontSize: '15px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
          onClick={openAddModal}>
          ✨ + Thêm sản phẩm mới
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            📦
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tổng sản phẩm</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{kpiStats.total} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>mặt hàng</span></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            ✅
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Đang kinh doanh</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>{kpiStats.active} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>mặt hàng</span></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fffbe6', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Hết hàng trong kho</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309' }}>{kpiStats.outOfStock} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>mặt hàng</span></div>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            🚫
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Đã vô hiệu hóa</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#991b1b' }}>{kpiStats.disabled} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>mặt hàng</span></div>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="admin-card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
        {/* Filter Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Input tìm kiếm */}
            <div style={{ position: 'relative', width: '240px' }}>
              <input 
                type="text" 
                className="admin-input" 
                placeholder="🔍 Tìm tên SP, mã SP..." 
                style={{ width: '100%', marginBottom: 0, fontSize: '14px', borderRadius: '8px', padding: '8px 12px' }} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleSearch(); }}
              />
            </div>

            {/* Lọc chi nhánh */}
            <select 
              className="admin-input" 
              style={{ 
                width: '200px', 
                marginBottom: 0, 
                fontSize: '14px', 
                borderRadius: '8px', 
                padding: '8px 12px', 
                backgroundColor: isBranchManager ? '#f1f5f9' : '#ffffff', 
                cursor: isBranchManager ? 'not-allowed' : 'pointer', 
                appearance: 'auto' 
              }}
              value={searchStore}
              onChange={(e) => setSearchStore(e.target.value)}
              disabled={isBranchManager}
            >
              {!isBranchManager && <option value="">Tất cả chi nhánh</option>}
              {stores.map(st => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>

            {/* Lọc danh mục */}
            <select 
              className="admin-input" 
              style={{ width: '180px', marginBottom: 0, fontSize: '14px', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#ffffff', cursor: 'pointer', appearance: 'auto' }}
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(cat => {
                const catId = cat.id || cat.MALOAI || cat.maloai;
                const catName = cat.tenLoai || cat.TENLOAI || cat.tenloai;
                return (
                  <option key={catId} value={catId}>{catName}</option>
                );
              })}
            </select>

            {/* Lọc trạng thái */}
            <select 
              className="admin-input" 
              style={{ width: '190px', marginBottom: 0, fontSize: '14px', borderRadius: '8px', padding: '8px 12px', backgroundColor: '#ffffff', cursor: 'pointer', appearance: 'auto' }}
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="con_hang">Còn hàng</option>
              <option value="het_hang">Hết hàng</option>
              <option value="vo_hieu_hoa">Đã vô hiệu hóa</option>
              <option value="is_new">Bánh mới (Tag New)</option>
              <option value="giam_gia">Đang giảm giá</option>
            </select>

            <button className="admin-btn admin-btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }} onClick={handleSearch}>
              🔍 Lọc
            </button>
          </div>

          {/* Phân trang size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' }}>
            <span>Hiển thị: </span>
            <select 
              className="admin-input" 
              style={{ width: 'auto', marginBottom: 0, padding: '6px 10px', borderRadius: '8px', fontSize: '14px' }}
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(0);
              }}
            >
              <option value={10}>10 dòng</option>
              <option value={20}>20 dòng</option>
              <option value={50}>50 dòng</option>
            </select>
          </div>
        </div>

        {/* Product Table Container */}
        <div className="admin-table-container" style={{ minHeight: '360px', position: 'relative' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>MÃ SP</th>
                <th style={{ width: '70px', textAlign: 'center' }}>QR CODE</th>
                <th style={{ width: '80px', textAlign: 'center' }}>HÌNH ÁNH</th>
                <th style={{ minWidth: '200px' }}>TÊN SẢN PHẨM</th>
                <th style={{ width: '140px' }}>DANH MỤC</th>
                <th style={{ width: '120px', textAlign: 'right' }}>GIÁ BÁN</th>
                <th style={{ width: '100px', textAlign: 'center' }}>TỒN KHO</th>
                <th style={{ width: '150px', textAlign: 'center' }}>PHÂN LOẠI (TAGS)</th>
                <th style={{ width: '130px', textAlign: 'center' }}>TRẠNG THÁI</th>
                <th style={{ width: '210px', textAlign: 'center' }}>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>⏳</div>
                    <span style={{ fontSize: '15px' }}>Đang tải danh sách sản phẩm...</span>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>🍰</div>
                    <span style={{ fontSize: '15px' }}>Không tìm thấy sản phẩm phù hợp với bộ lọc</span>
                  </td>
                </tr>
              ) : products.map(product => {
                const id = product.id;
                const numId = parseInt(product.id, 10);
                const code = product.MASP || product.maSP || product.MaSP || (!isNaN(numId) ? `SP${String(numId).padStart(3, '0')}` : `#${id}`);
                const name = product.tenSanPham || product.tenSP || product.TenSP || product.TENSP;
                const category = product.loai_san_pham ? (product.loai_san_pham.tenLoai || product.loai_san_pham.TENLOAI) : (product.loaiSanPham ? (product.loaiSanPham.tenLoai || product.loaiSanPham.TENLOAI) : (product.loaisp || product.LOAISP || product.MALOAI));
                const price = product.giaBan !== undefined ? product.giaBan : (product.giaban || product.GIABAN);
                const stock = product.soLuongTon !== undefined ? product.soLuongTon : (product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.soluong || product.SOLUONG || 0));
                const isDeactivated = product.trangThai === 0 || product.trangThai === '0';
                const status = isDeactivated ? 'Đã vô hiệu hóa' : (stock > 0 ? 'Còn hàng' : 'Hết hàng');
                const image = product.hinhAnh || product.hinh_anh || product.hinhanh || product.HINHANH;
                const imageUrl = formatImageUrl(image);
                
                const isNew = product.isNew || product.IS_NEW;
                const discount = product.phanTramGiam || product.PHAN_TRAM_GIAM || 0;

                return (
                  <tr key={id} style={{ opacity: isDeactivated ? 0.65 : 1, transition: 'background-color 0.15s ease' }}>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '3px 8px',
                        backgroundColor: '#eff6ff',
                        color: '#0284c7',
                        borderRadius: '6px',
                        border: '1px solid #bfdbfe',
                        fontWeight: 700,
                        fontSize: '13px'
                      }}>
                        {code}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <a href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(code)}`} target="_blank" rel="noreferrer" title={`Xem mã QR lớn (${code})`}>
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${encodeURIComponent(code)}`} 
                          alt={`QR-${code}`} 
                          style={{ border: '1px solid #e2e8f0', padding: '2px', borderRadius: '6px', width: '36px', height: '36px', cursor: 'pointer', backgroundColor: '#fff' }} 
                        />
                      </a>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {image ? (
                        <img src={imageUrl} alt={name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍰</div>
                      )}
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px' }}>
                      {name}
                    </td>
                    <td>
                      <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                        {category || 'Bánh ngọt'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                      {Number(price || 0).toLocaleString('vi-VN')}₫
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ backgroundColor: stock > 0 ? '#e0f2fe' : '#fef3c7', color: stock > 0 ? '#0369a1' : '#b45309', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', fontSize: '13px' }}>
                        {stock.toLocaleString('vi-VN')}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {isNew ? (
                          <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', border: '1px solid #fed7aa' }}>
                            ✨ MỚI
                          </span>
                        ) : null}
                        {discount > 0 ? (
                          <span style={{ backgroundColor: '#fce7f3', color: '#be185d', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', fontSize: '12px', border: '1px solid #fbcfe8' }}>
                            🏷️ -{discount}%
                          </span>
                        ) : null}
                        {!isNew && discount <= 0 && <span style={{ color: '#94a3b8', fontSize: '13px' }}>—</span>}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`admin-badge ${status === 'Còn hàng' ? 'admin-badge-success' : (status === 'Đã vô hiệu hóa' ? 'admin-badge-danger' : 'admin-badge-warning')}`}
                        style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '12px' }}>
                        {status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                        {isDeactivated ? (
                          <button className="admin-btn" style={{ padding: '5px 10px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#dcfce7', color: '#15803d', border: 'none', fontWeight: 600 }} onClick={() => handleRestore(id)}>
                            🔄 Kích hoạt
                          </button>
                        ) : (
                          <>
                            <button className="admin-btn" style={{ padding: '5px 10px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', fontWeight: 600 }} onClick={() => openEditModal(product)}>
                              ✏️ Sửa
                            </button>
                            <button className="admin-btn" style={{ padding: '5px 10px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', fontWeight: 600 }} onClick={() => handleDelete(id)}>
                              🚫 Vô hiệu hóa
                            </button>
                            <button className="admin-btn" style={{ padding: '5px 10px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', fontWeight: 600 }} onClick={() => openRestockModal(product)}>
                              🚚 Nhập thêm
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
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
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

      {/* ══════ MODAL THÊM / SỬA SẢN PHẨM ══════ */}
      {isModalOpen && (
        <div style={modalOverlayStyle}>
          <div style={modalContainerStyle}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>{editingProduct ? '✏️' : '🍰'}</span>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  {editingProduct ? `Chỉnh sửa thông tin sản phẩm (${editingProduct.MASP || (!isNaN(parseInt(editingProduct.id, 10)) ? `SP${String(parseInt(editingProduct.id, 10)).padStart(3, '0')}` : `#${editingProduct.id}`)})` : 'Thêm sản phẩm mới'}
                </h2>
              </div>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>✕</button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={modalBodyStyle}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label style={labelStyle}>Mã sản phẩm (Tự động)</label>
                    <input 
                      type="text" 
                      value={editingProduct ? (editingProduct.MASP || (!isNaN(parseInt(editingProduct.id, 10)) ? `SP${String(parseInt(editingProduct.id, 10)).padStart(3, '0')}` : `#${editingProduct.id}`)) : 'Hệ thống tự cấp (SPxxx)'} 
                      disabled 
                      className="admin-input" 
                      style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 700, color: '#0369a1' }} 
                    />
                  </div>
                  <div className="admin-form-group">
                    <label style={labelStyle}>Tên sản phẩm *</label>
                    <input type="text" name="TenSP" value={formData.TenSP} onChange={handleInputChange} className="admin-input" placeholder="Nhập tên bánh..." required />
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label style={labelStyle}>Giá bán (VNĐ) *</label>
                    <input type="number" name="GIABAN" min="0" value={formData.GIABAN} onChange={handleInputChange} className="admin-input" placeholder="VD: 50000" required />
                  </div>
                  <div className="admin-form-group">
                    <label style={labelStyle}>Đơn vị tính *</label>
                    <input type="text" name="DVT" value={formData.DVT} onChange={handleInputChange} className="admin-input" placeholder="VD: Cái, Hộp, Ôổ" required />
                  </div>
                </div>

                {/* Quản lý tồn kho theo lô hàng (Chỉ hiển thị đọc khi xem/sửa) */}
                {editingProduct && (
                  <div className="admin-form-group">
                    <label style={labelStyle}>Tổng số lượng tồn kho hiện tại</label>
                    <input type="number" name="SOLUONG" value={formData.SOLUONG} disabled className="admin-input" style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', fontWeight: 700, color: '#0369a1' }} />
                    <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '8px 12px', marginTop: '6px', fontSize: '13px', color: '#0369a1' }}>
                      🔒 <strong>Lưu ý nghiệp vụ:</strong> Tồn kho được cập nhật tự động khi <strong>Nhập lô hàng</strong>. Để bổ sung số lượng, vui lòng dùng tính năng <em>"Nhập lô hàng"</em> hoặc <em>"Nhập thêm"</em>.
                    </div>
                  </div>
                )}
                
                <div className="admin-form-group">
                  <label style={labelStyle}>Danh mục sản phẩm *</label>
                  <select name="LOAISP" value={formData.LOAISP} onChange={handleInputChange} className="admin-input" required style={{ width: '100%' }}>
                    <option value="">-- Chọn danh mục sản phẩm --</option>
                    {categories.map(cat => {
                      const catId = cat.id || cat.MALOAI || cat.maloai;
                      const catName = cat.tenLoai || cat.TENLOAI || cat.tenloai;
                      return (
                        <option key={catId} value={catId}>{catName}</option>
                      );
                    })}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="admin-form-group">
                    <label style={labelStyle}>Gắn Tag Bánh Mới (Tag New)</label>
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input 
                        type="checkbox" 
                        name="IS_NEW" 
                        checked={formData.IS_NEW} 
                        onChange={(e) => setFormData({...formData, IS_NEW: e.target.checked})} 
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '14px', color: '#334155', fontWeight: 600 }}>Hiển thị nhãn ✨ MỚI</span>
                    </div>
                  </div>
                  <div className="admin-form-group">
                    <label style={labelStyle}>% Giảm giá (Khuyến mãi)</label>
                    <input type="number" name="PHAN_TRAM_GIAM" min="0" max="100" value={formData.PHAN_TRAM_GIAM} onChange={handleInputChange} className="admin-input" placeholder="0 - 100%" />
                  </div>
                </div>
                
                <div className="admin-form-group">
                  <label style={labelStyle}>Hình ảnh sản phẩm {editingProduct ? '' : '*'}</label>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => setSelectedFile(e.target.files[0])} 
                    className="admin-input" 
                    style={{ padding: '6px' }}
                  />
                  {editingProduct && formData.HINHANH && (
                    <small style={{ color: '#64748b', marginTop: '4px', display: 'block' }}>Giữ nguyên ảnh hiện tại nếu không chọn tập tin mới.</small>
                  )}
                </div>
                
                <div className="admin-form-group">
                  <label style={labelStyle}>Mô tả / Ghi chú sản phẩm</label>
                  <textarea name="GHICHU" value={formData.GHICHU} onChange={handleInputChange} className="admin-input" rows="3" placeholder="Nhập mô tả bánh..." />
                </div>
              </div>

              <div style={modalFooterStyle}>
                <button type="button" className="admin-btn admin-btn-secondary" style={{ padding: '8px 18px' }} onClick={closeModal}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '8px 18px', fontWeight: 700 }}>
                  {editingProduct ? '💾 Cập nhật sản phẩm' : '✨ Tạo mới sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════ MODAL YÊU CẦU NHẬP HÀNG NHANH ══════ */}
      {showRestockModal && (
        <div style={modalOverlayStyle}>
          <div style={{ ...modalContainerStyle, maxWidth: '440px' }}>
            <div style={modalHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🚚</span>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#b45309' }}>Yêu Cầu Nhập Thêm Gấp</h3>
              </div>
              <button type="button" onClick={() => setShowRestockModal(false)} style={closeBtnStyle}>✕</button>
            </div>
            <form onSubmit={handleRestockSubmit}>
              <div style={{ padding: '20px' }}>
                <div className="admin-form-group">
                  <label style={labelStyle}>Sản phẩm cần nhập</label>
                  <input type="text" className="admin-input" value={`#${restockData.MASP} — ${restockData.TENSP}`} disabled style={{ backgroundColor: '#f8fafc', fontWeight: 700 }} />
                </div>
                <div className="admin-form-group">
                  <label style={labelStyle}>Số lượng muốn nhập thêm *</label>
                  <input type="number" min="1" className="admin-input" style={{ fontSize: '18px', fontWeight: 800, color: '#dc2626' }} value={restockData.SOLUONG} onChange={(e) => setRestockData({...restockData, SOLUONG: e.target.value})} required />
                </div>
                <div className="admin-form-group">
                  <label style={labelStyle}>Lý do / Ghi chú</label>
                  <textarea className="admin-input" rows="2" value={restockData.GHICHU} onChange={(e) => setRestockData({...restockData, GHICHU: e.target.value})}></textarea>
                </div>
              </div>
              <div style={modalFooterStyle}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setShowRestockModal(false)}>Hủy</button>
                <button type="submit" className="admin-btn" style={{ backgroundColor: '#16a34a', color: '#fff', padding: '8px 18px', fontWeight: 700, border: 'none', borderRadius: '8px' }}>
                  🚀 Gửi Yêu Cầu Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const labelStyle = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#334155',
  display: 'block',
  marginBottom: '4px'
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(15, 23, 42, 0.65)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '16px'
};

const modalContainerStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  border: '1px solid #e2e8f0',
  overflow: 'hidden'
};

const modalHeaderStyle = {
  padding: '16px 20px',
  borderBottom: '1px solid #e2e8f0',
  backgroundColor: '#ffffff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0
};

const modalBodyStyle = {
  padding: '20px',
  overflowY: 'auto',
  flex: 1,
  backgroundColor: '#ffffff'
};

const modalFooterStyle = {
  padding: '14px 20px',
  borderTop: '1px solid #e2e8f0',
  backgroundColor: '#f8fafc',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  flexShrink: 0
};

const closeBtnStyle = {
  background: '#f1f5f9',
  border: 'none',
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  fontSize: '16px',
  cursor: 'pointer',
  color: '#64748b',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default AdminProductPage;
