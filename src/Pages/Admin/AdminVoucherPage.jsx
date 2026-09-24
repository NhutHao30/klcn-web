import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { getProducts, updateProduct } from '../../services/productService';
import { getCategories } from '../../services/categoryService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const DEFAULT_CAKE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><rect width="24" height="24" rx="6" fill="%23f1f5f9"/><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-size="14">🍰</text></svg>`;

const formatDateStr = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN');
  } catch (e) {
    return 'N/A';
  }
};

const AdminVoucherPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('voucher'); // 'voucher' | 'product_discount' | 'category_discount'
  
  // Tab 1: Global Vouchers
  const [vouchers, setVouchers] = useState([]);
  const [isLoadingVouchers, setIsLoadingVouchers] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
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

  // Tab 2 & 3 Data: Products & Categories
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingProds, setIsLoadingProds] = useState(false);

  // Tab 2 Form: Product Discount & Per-Row inputs
  const [selectedProdIds, setSelectedProdIds] = useState([]);
  const [prodDiscountPercent, setProdDiscountPercent] = useState(10);
  const [rowDiscountInputs, setRowDiscountInputs] = useState({});
  const [isApplyingProdDiscount, setIsApplyingProdDiscount] = useState(false);
  const [updatingProdId, setUpdatingProdId] = useState(null);
  const [prodSearchTerm, setProdSearchTerm] = useState('');

  // Tab 3 Form: Category Discount
  const [selectedCatId, setSelectedCatId] = useState('');
  const [catDiscountPercent, setCatDiscountPercent] = useState(15);
  const [isApplyingCatDiscount, setIsApplyingCatDiscount] = useState(false);

  useEffect(() => {
    fetchVouchers();
    fetchProductsAndCategories();
  }, []);

  const fetchVouchers = async () => {
    setIsLoadingVouchers(true);
    try {
      const res = await axiosClient.get('/admin/vouchers');
      const vData = res?.data;
      const vList = vData?.data || vData?.content || (Array.isArray(vData) ? vData : []);
      setVouchers(Array.isArray(vList) ? vList : []);
    } catch (e) {
      console.error('Lỗi tải vouchers:', e);
      setVouchers([]);
    } finally {
      setIsLoadingVouchers(false);
    }
  };

  const fetchProductsAndCategories = async () => {
    setIsLoadingProds(true);
    try {
      const [resProds, resCats] = await Promise.allSettled([
        getProducts({ page: 1, size: 200 }),
        getCategories()
      ]);

      if (resProds.status === 'fulfilled') {
        const val = resProds.value;
        const pList = val?.data?.data || val?.data || val || [];
        const arr = Array.isArray(pList) ? pList : [];
        setProducts(arr);

        // Pre-fill row discount inputs from product data
        const initialRowInputs = {};
        arr.forEach(p => {
          initialRowInputs[p.MASP] = p.PHAN_TRAM_GIAM !== undefined && p.PHAN_TRAM_GIAM !== null ? p.PHAN_TRAM_GIAM : 10;
        });
        setRowDiscountInputs(initialRowInputs);
      }

      if (resCats.status === 'fulfilled') {
        const val = resCats.value;
        const cList = val?.data || val || [];
        setCategories(Array.isArray(cList) ? cList : []);
      }
    } catch (e) {
      console.error('Lỗi tải danh mục / sản phẩm:', e);
    } finally {
      setIsLoadingProds(false);
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(p => {
    const term = (prodSearchTerm || '').toLowerCase();
    const name = (p.TENSP || p.name || '').toLowerCase();
    const code = (p.MASP || p.id || '').toString().toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  // --- TAB 1 HANDLERS ---
  const handleVoucherInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setVoucherForm({ 
      ...voucherForm, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const openAddVoucherModal = () => {
    setEditingVoucher(null);
    setVoucherForm({
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
    setIsVoucherModalOpen(true);
  };

  const openEditVoucherModal = (v) => {
    setEditingVoucher(v);
    setVoucherForm({
      MA_VOUCHER: v.MA_VOUCHER || '',
      TEN_VOUCHER: v.TEN_VOUCHER || '',
      LOAI_GIAM: v.LOAI_GIAM || 'PHAN_TRAM',
      GIA_TRI: v.GIA_TRI || '',
      DON_TOI_THIEU: v.DON_TOI_THIEU || 0,
      GIAM_TOI_DA: v.GIAM_TOI_DA || '',
      SO_LUONG_GIOI_HAN: v.SO_LUONG_GIOI_HAN || 100,
      NGAY_BAT_DAU: v.NGAY_BAT_DAU ? new Date(v.NGAY_BAT_DAU).toISOString().slice(0, 16) : '',
      NGAY_KET_THUC: v.NGAY_KET_THUC ? new Date(v.NGAY_KET_THUC).toISOString().slice(0, 16) : '',
      TRANG_THAI: !!v.TRANG_THAI
    });
    setIsVoucherModalOpen(true);
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...voucherForm };
      if (!payload.GIAM_TOI_DA) payload.GIAM_TOI_DA = null;

      if (editingVoucher) {
        await axiosClient.put(`/admin/vouchers/${editingVoucher.MA_VOUCHER}`, payload);
        toast.success('Cập nhật Voucher thành công!');
      } else {
        await axiosClient.post('/admin/vouchers', payload);
        toast.success('Thêm mới Voucher thành công!');
      }
      setIsVoucherModalOpen(false);
      fetchVouchers();
    } catch (e) {
      toast.error('Lỗi: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDeleteVoucher = async (code) => {
    if (!window.confirm(`Bạn có chắc muốn xóa voucher ${code}?`)) return;
    try {
      await axiosClient.delete(`/admin/vouchers/${code}`);
      toast.success('Đã xóa voucher thành công!');
      fetchVouchers();
    } catch (e) {
      toast.error('Lỗi khi xóa: ' + (e.response?.data?.message || e.message));
    }
  };

  // --- TAB 2 HANDLERS: Product Specific Discount ---
  const toggleSelectProd = (masp) => {
    setSelectedProdIds(prev => 
      prev.includes(masp) ? prev.filter(id => id !== masp) : [...prev, masp]
    );
  };

  const handleSelectAllProds = () => {
    if (selectedProdIds.length === filteredProducts.length) {
      setSelectedProdIds([]);
    } else {
      setSelectedProdIds(filteredProducts.map(p => p.MASP));
    }
  };

  // Batch Apply Discount to Selected Products
  const handleApplyBatchProductDiscount = async () => {
    if (selectedProdIds.length === 0) {
      toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để áp dụng giảm giá!');
      return;
    }
    const pct = Number(prodDiscountPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.warning('% Giảm giá phải từ 0 đến 100%!');
      return;
    }

    setIsApplyingProdDiscount(true);
    let successCount = 0;
    try {
      for (const masp of selectedProdIds) {
        const p = products.find(prod => prod.MASP === masp);
        if (!p) continue;
        
        const fd = new FormData();
        fd.append('TENSP', p.TENSP);
        fd.append('GIABAN', p.GIABAN);
        fd.append('MALOAI', p.MALOAI);
        fd.append('PHAN_TRAM_GIAM', pct);

        try {
          await updateProduct(masp, fd);
          successCount++;
        } catch (err) {
          await axiosClient.put(`/admin/products/${masp}`, { PHAN_TRAM_GIAM: pct }).catch(() => {});
          successCount++;
        }
      }
      toast.success(`🎉 Đã cập nhật giảm giá ${pct}% cho ${successCount} sản phẩm thành công!`);
      setSelectedProdIds([]);
      fetchProductsAndCategories();
    } catch (e) {
      toast.error('Có lỗi xảy ra khi cập nhật giảm giá sản phẩm');
    } finally {
      setIsApplyingProdDiscount(false);
    }
  };

  // Single Row Apply Discount
  const handleApplySingleProductDiscount = async (masp) => {
    const customPct = Number(rowDiscountInputs[masp]);
    if (isNaN(customPct) || customPct < 0 || customPct > 100) {
      toast.warning('Mức giảm giá phải từ 0 đến 100%!');
      return;
    }

    const p = products.find(prod => prod.MASP === masp);
    if (!p) return;

    setUpdatingProdId(masp);
    try {
      const fd = new FormData();
      fd.append('TENSP', p.TENSP);
      fd.append('GIABAN', p.GIABAN);
      fd.append('MALOAI', p.MALOAI);
      fd.append('PHAN_TRAM_GIAM', customPct);

      try {
        await updateProduct(masp, fd);
      } catch (err) {
        await axiosClient.put(`/admin/products/${masp}`, { PHAN_TRAM_GIAM: customPct });
      }
      toast.success(`🎉 Đã thiết lập giảm giá ${customPct}% cho "${p.TENSP}"!`);
      fetchProductsAndCategories();
    } catch (e) {
      toast.error('Có lỗi khi lưu giảm giá cho sản phẩm ' + p.TENSP);
    } finally {
      setUpdatingProdId(null);
    }
  };

  const handleRemoveProductDiscount = async (masp) => {
    const p = products.find(prod => prod.MASP === masp);
    if (!p) return;

    setUpdatingProdId(masp);
    try {
      const fd = new FormData();
      fd.append('TENSP', p.TENSP);
      fd.append('GIABAN', p.GIABAN);
      fd.append('MALOAI', p.MALOAI);
      fd.append('PHAN_TRAM_GIAM', 0);

      try {
        await updateProduct(masp, fd);
      } catch (err) {
        await axiosClient.put(`/admin/products/${masp}`, { PHAN_TRAM_GIAM: 0 });
      }
      toast.success(`Đã hủy giảm giá cho sản phẩm "${p.TENSP}"`);
      fetchProductsAndCategories();
    } catch (e) {
      toast.error('Lỗi khi bỏ giảm giá sản phẩm');
    } finally {
      setUpdatingProdId(null);
    }
  };

  // --- TAB 3 HANDLERS: Category Discount ---
  const handleApplyCategoryDiscount = async () => {
    if (!selectedCatId) {
      toast.warning('Vui lòng chọn loại sản phẩm!');
      return;
    }
    const pct = Number(catDiscountPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      toast.warning('% Giảm giá phải từ 0 đến 100%!');
      return;
    }

    const catProds = products.filter(p => String(p.MALOAI) === String(selectedCatId));
    if (catProds.length === 0) {
      toast.warning('Danh mục này hiện chưa có sản phẩm nào!');
      return;
    }

    setIsApplyingCatDiscount(true);
    let successCount = 0;
    try {
      for (const p of catProds) {
        const fd = new FormData();
        fd.append('TENSP', p.TENSP);
        fd.append('GIABAN', p.GIABAN);
        fd.append('MALOAI', p.MALOAI);
        fd.append('PHAN_TRAM_GIAM', pct);

        try {
          await updateProduct(p.MASP, fd);
          successCount++;
        } catch (err) {
          await axiosClient.put(`/admin/products/${p.MASP}`, { PHAN_TRAM_GIAM: pct }).catch(() => {});
          successCount++;
        }
      }
      const catObj = categories.find(c => String(c.MALOAI || c.id) === String(selectedCatId));
      toast.success(`🎉 Đã tự động cập nhật giảm giá ${pct}% cho tất cả ${successCount} sản phẩm thuộc loại "${catObj?.TENLOAI || catObj?.name}"!`);
      fetchProductsAndCategories();
    } catch (e) {
      toast.error('Lỗi khi cập nhật giảm giá danh mục');
    } finally {
      setIsApplyingCatDiscount(false);
    }
  };

  const voucherList = Array.isArray(vouchers) ? vouchers : [];

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản Lý Khuyến Mãi & Giảm Giá Bánh</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Tạo voucher toàn sàn hoặc thiết lập chương trình giảm giá theo từng sản phẩm/loại bánh</p>
        </div>
        {activeTab === 'voucher' && (
          <button className="admin-btn admin-btn-success" onClick={openAddVoucherModal}>
            <i className="fa-solid fa-plus" style={{ marginRight: '6px' }}></i> Tạo Voucher Mới
          </button>
        )}
      </div>

      {/* Main Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className={`admin-btn ${activeTab === 'voucher' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'voucher' ? '#f8f9fa' : '', color: activeTab !== 'voucher' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('voucher')}
        >
          🎟️ Voucher & Mã Giảm Giá
        </button>
        <button
          className={`admin-btn ${activeTab === 'product_discount' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'product_discount' ? '#f8f9fa' : '', color: activeTab !== 'product_discount' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('product_discount')}
        >
          🧁 Giảm Giá Theo Sản Phẩm Bánh
        </button>
        <button
          className={`admin-btn ${activeTab === 'category_discount' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'category_discount' ? '#f8f9fa' : '', color: activeTab !== 'category_discount' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('category_discount')}
        >
          🏷️ Giảm Giá Theo Loại Bánh
        </button>
      </div>

      {/* TAB 1: VOUCHER TOÀN SÀN */}
      {activeTab === 'voucher' && (
        <div className="admin-card">
          <h2 className="admin-card-title">Danh Sách Mã Voucher Hiện Có</h2>
          {isLoadingVouchers ? (
            <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách voucher...</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Mã Voucher</th>
                    <th>Tên Chương Trình</th>
                    <th>Mức Giảm</th>
                    <th>Đơn Tối Thiểu</th>
                    <th>Giảm Tối Đa</th>
                    <th>Số Lượng Còn</th>
                    <th>Thời Gian Hạn</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'center' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherList.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                        Chưa có Voucher nào trong hệ thống
                      </td>
                    </tr>
                  ) : (
                    voucherList.map((v) => (
                      <tr key={v.MA_VOUCHER || Math.random()}>
                        <td><b style={{ color: 'var(--admin-primary)' }}>{v.MA_VOUCHER || '-'}</b></td>
                        <td style={{ fontWeight: '500' }}>{v.TEN_VOUCHER || '-'}</td>
                        <td style={{ color: '#d97706', fontWeight: 'bold' }}>
                          {v.LOAI_GIAM === 'PHAN_TRAM' ? `${v.GIA_TRI}%` : `${Number(v.GIA_TRI || 0).toLocaleString()}đ`}
                        </td>
                        <td>{Number(v.DON_TOI_THIEU || 0).toLocaleString()}đ</td>
                        <td>{v.GIAM_TOI_DA ? `${Number(v.GIAM_TOI_DA).toLocaleString()}đ` : 'Không Hạn Chế'}</td>
                        <td>{v.SO_LUONG_DA_DUNG || 0} / {v.SO_LUONG_GIOI_HAN || 100}</td>
                        <td style={{ fontSize: '12px' }}>
                          {formatDateStr(v.NGAY_BAT_DAU)} - {formatDateStr(v.NGAY_KET_THUC)}
                        </td>
                        <td>
                          {v.TRANG_THAI ? (
                            <span className="admin-badge admin-badge-success">Đang Hoạt Động</span>
                          ) : (
                            <span className="admin-badge admin-badge-danger">Đã Khóa</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-btn admin-btn-info"
                            style={{ padding: '3px 8px', fontSize: '11px', marginRight: '5px' }}
                            onClick={() => openEditVoucherModal(v)}
                          >
                            <i className="fa-solid fa-pen"></i> Sửa
                          </button>
                          <button
                            className="admin-btn admin-btn-danger"
                            style={{ padding: '3px 8px', fontSize: '11px' }}
                            onClick={() => handleDeleteVoucher(v.MA_VOUCHER)}
                          >
                            <i className="fa-solid fa-trash"></i> Xóa
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
      )}

      {/* TAB 2: GIẢM GIÁ CHO TỪNG SẢN PHẨM BÁNH CỤ THỂ */}
      {activeTab === 'product_discount' && (
        <div className="admin-card">
          <h2 className="admin-card-title">Thiết Lập Giảm Giá Trực Tiếp Cho Sản Phẩm Bánh</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-8px', marginBottom: '1.2rem' }}>
            Nhập trực tiếp % giảm giá tại từng dòng bánh hoặc tích chọn nhiều bánh để áp dụng giảm giá hàng loạt.
          </p>

          {/* Control bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px 220px', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'end' }}>
            <div>
              <label className="admin-label">Tìm kiếm bánh cần giảm giá</label>
              <input
                type="text"
                className="admin-input"
                placeholder="Nhập tên bánh hoặc mã SP..."
                value={prodSearchTerm}
                onChange={(e) => setProdSearchTerm(e.target.value)}
              />
            </div>

            <div>
              <label className="admin-label">Mức Giảm Giá Hàng Loạt (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="number"
                  className="admin-input"
                  min="0"
                  max="100"
                  value={prodDiscountPercent}
                  onChange={(e) => setProdDiscountPercent(e.target.value)}
                />
                <span style={{ fontWeight: 'bold' }}>%</span>
              </div>
            </div>

            <div>
              <button
                type="button"
                className="admin-btn admin-btn-success"
                style={{ width: '100%', padding: '10px' }}
                onClick={handleApplyBatchProductDiscount}
                disabled={isApplyingProdDiscount}
              >
                {isApplyingProdDiscount ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Đang áp dụng...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-bolt" style={{ marginRight: '6px' }}></i> Áp Dụng Cho ({selectedProdIds.length}) SP Đã Chọn
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Table Products Selection */}
          <div className="admin-table-container">
            <table className="admin-table" style={{ tableLayout: 'fixed', width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedProdIds.length === filteredProducts.length}
                      onChange={handleSelectAllProds}
                    />
                  </th>
                  <th style={{ width: '80px' }}>Mã Bánh</th>
                  <th style={{ width: '240px' }}>Tên Sản Phẩm Bánh</th>
                  <th style={{ width: '110px' }}>Giá Gốc</th>
                  <th style={{ width: '150px' }}>Thiết Lập Mức Giảm (%)</th>
                  <th style={{ width: '140px' }}>Giá Sau Giảm (Tự động)</th>
                  <th style={{ width: '200px', textAlign: 'center' }}>Thao Tác Trực Tiếp</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingProds ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                      <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)', marginBottom: '8px' }}></i><br />
                      Đang tải danh sách sản phẩm...
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                      Không tìm thấy sản phẩm bánh nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isSelected = selectedProdIds.includes(p.MASP);
                    const pctGiamActual = Number(p.PHAN_TRAM_GIAM || 0);
                    const currentInputPct = rowDiscountInputs[p.MASP] !== undefined ? rowDiscountInputs[p.MASP] : pctGiamActual;
                    const pctGiamNumber = Number(currentInputPct) || 0;

                    const giaGoc = Number(p.GIABAN || 0);
                    const giaSauGiam = Math.round(giaGoc * (1 - pctGiamNumber / 100));
                    const isUpdatingThis = updatingProdId === p.MASP;

                    return (
                      <tr key={p.MASP} style={{ backgroundColor: isSelected ? '#f0fdf4' : '' }}>
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProd(p.MASP)}
                          />
                        </td>
                        <td><b>{p.MASP}</b></td>
                        <td style={{ fontWeight: '600' }}>
                          <img
                            src={p.HINHANH || DEFAULT_CAKE_SVG}
                            alt={p.TENSP}
                            style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover', verticalAlign: 'middle', marginRight: '8px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_CAKE_SVG;
                            }}
                          />
                          {p.TENSP}
                        </td>
                        <td style={{ textDecoration: pctGiamActual > 0 ? 'line-through' : 'none', color: pctGiamActual > 0 ? '#94a3b8' : '#000' }}>
                          {giaGoc.toLocaleString()}đ
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              className="admin-input"
                              min="0"
                              max="100"
                              style={{ width: '75px', padding: '4px 8px', fontWeight: 'bold' }}
                              value={currentInputPct}
                              onChange={(e) => setRowDiscountInputs({ ...rowDiscountInputs, [p.MASP]: e.target.value })}
                            />
                            <span style={{ fontWeight: 'bold', fontSize: '13px', color: pctGiamActual > 0 ? '#ef4444' : '#64748b' }}>%</span>
                            {pctGiamActual > 0 && (
                              <span className="admin-badge admin-badge-danger" style={{ fontSize: '10px', padding: '2px 5px' }}>Đang KM</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <b style={{ color: pctGiamNumber > 0 ? '#16a34a' : '#000', fontSize: '14px' }}>
                            {giaSauGiam.toLocaleString()}đ
                          </b>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-success"
                              style={{ padding: '4px 10px', fontSize: '12px' }}
                              onClick={() => handleApplySingleProductDiscount(p.MASP)}
                              disabled={isUpdatingThis}
                              title="Áp dụng giảm giá cho duy nhất sản phẩm này"
                            >
                              {isUpdatingThis ? (
                                <i className="fa-solid fa-spinner fa-spin"></i>
                              ) : (
                                <>
                                  <i className="fa-solid fa-check" style={{ marginRight: '4px' }}></i> Lưu %
                                </>
                              )}
                            </button>

                            {pctGiamActual > 0 && (
                              <button
                                type="button"
                                className="admin-btn admin-btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={() => handleRemoveProductDiscount(p.MASP)}
                                disabled={isUpdatingThis}
                                title="Bỏ giảm giá sản phẩm này"
                              >
                                <i className="fa-solid fa-xmark" style={{ marginRight: '4px' }}></i> Hủy KM
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: GIẢM GIÁ THEO LOẠI SẢN PHẨM (CATEGORY) */}
      {activeTab === 'category_discount' && (
        <div className="admin-card" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <h2 className="admin-card-title">Thiết Lập Giảm Giá Hàng Loạt Cho Loại Sản Phẩm Bánh</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '-8px', marginBottom: '1.5rem' }}>
            Khi chọn 1 loại bánh (VD: Bánh Kem Sinh Nhật) và mức giảm %, toàn bộ các sản phẩm thuộc danh mục đó sẽ được tự động cập nhật giảm giá ngay lập tức.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-label">Chọn Danh Mục Loại Sản Phẩm Bánh <span style={{ color: 'red' }}>*</span></label>
              <select
                className="admin-select"
                value={selectedCatId}
                onChange={(e) => setSelectedCatId(e.target.value)}
              >
                <option value="">-- Chọn Loại Sản Phẩm --</option>
                {categories.map(c => {
                  const catId = c.MALOAI || c.id;
                  const catName = c.TENLOAI || c.name;
                  const count = products.filter(p => String(p.MALOAI) === String(catId)).length;
                  return (
                    <option key={catId} value={catId}>
                      {catName} ({count} sản phẩm)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-label">Mức Giảm Giá Cho Toàn Bộ Loại Bánh (%) <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  className="admin-input"
                  min="0"
                  max="100"
                  value={catDiscountPercent}
                  onChange={(e) => setCatDiscountPercent(e.target.value)}
                />
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>%</span>
              </div>
            </div>

            {selectedCatId && (
              <div style={{ backgroundColor: '#eff6ff', padding: '12px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '13px', color: '#1e40af' }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '6px' }}></i>
                Sẽ có <b>{products.filter(p => String(p.MALOAI) === String(selectedCatId)).length} sản phẩm bánh</b> thuộc loại này được tự động cập nhật giảm <b>{catDiscountPercent}%</b>.
              </div>
            )}

            <button
              type="button"
              className="admin-btn admin-btn-success"
              style={{ padding: '12px', fontSize: '15px', marginTop: '6px' }}
              onClick={handleApplyCategoryDiscount}
              disabled={isApplyingCatDiscount}
            >
              {isApplyingCatDiscount ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }}></i> Đang tự động cập nhật giá...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-wand-magic-sparkles" style={{ marginRight: '8px' }}></i> Áp Dụng Giảm Giá Cho Toàn Bộ Danh Mục
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Voucher */}
      {isVoucherModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setIsVoucherModalOpen(false)}>
          <div className="admin-modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editingVoucher ? 'Chỉnh Sửa Voucher' : 'Thêm Voucher Mới'}</h3>
              <button className="admin-modal-close" onClick={() => setIsVoucherModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleVoucherSubmit}>
              <div className="admin-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label className="admin-label">Mã Voucher (Nhập Viết Hoa) <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    name="MA_VOUCHER"
                    value={voucherForm.MA_VOUCHER}
                    onChange={handleVoucherInputChange}
                    disabled={!!editingVoucher}
                    placeholder="VD: BANHTET20"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Tên Chương Trình <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    className="admin-input"
                    name="TEN_VOUCHER"
                    value={voucherForm.TEN_VOUCHER}
                    onChange={handleVoucherInputChange}
                    placeholder="VD: Khuyến mãi mừng Xuân"
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Loại Giảm Giá</label>
                  <select
                    className="admin-select"
                    name="LOAI_GIAM"
                    value={voucherForm.LOAI_GIAM}
                    onChange={handleVoucherInputChange}
                  >
                    <option value="PHAN_TRAM">Phần Trăm (%)</option>
                    <option value="TIEN_MAT">Tiền Mặt (VNĐ)</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Giá Trị Giảm <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="number"
                    className="admin-input"
                    name="GIA_TRI"
                    value={voucherForm.GIA_TRI}
                    onChange={handleVoucherInputChange}
                    placeholder={voucherForm.LOAI_GIAM === 'PHAN_TRAM' ? 'VD: 15' : 'VD: 50000'}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Đơn Hàng Tối Thiểu (VNĐ)</label>
                  <input
                    type="number"
                    className="admin-input"
                    name="DON_TOI_THIEU"
                    value={voucherForm.DON_TOI_THIEU}
                    onChange={handleVoucherInputChange}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Giảm Tối Đa (Dành cho %)</label>
                  <input
                    type="number"
                    className="admin-input"
                    name="GIAM_TOI_DA"
                    value={voucherForm.GIAM_TOI_DA}
                    onChange={handleVoucherInputChange}
                    placeholder="Bỏ trống nếu không hạn chế"
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Số Lượng Giới Hạn</label>
                  <input
                    type="number"
                    className="admin-input"
                    name="SO_LUONG_GIOI_HAN"
                    value={voucherForm.SO_LUONG_GIOI_HAN}
                    onChange={handleVoucherInputChange}
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Trạng Thái</label>
                  <select
                    className="admin-select"
                    name="TRANG_THAI"
                    value={voucherForm.TRANG_THAI}
                    onChange={handleVoucherInputChange}
                  >
                    <option value={true}>Hoạt Động</option>
                    <option value={false}>Tạm Tắt / Khóa</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Thời Gian Bắt Đầu</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    name="NGAY_BAT_DAU"
                    value={voucherForm.NGAY_BAT_DAU}
                    onChange={handleVoucherInputChange}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label className="admin-label">Thời Gian Kết Thúc</label>
                  <input
                    type="datetime-local"
                    className="admin-input"
                    name="NGAY_KET_THUC"
                    value={voucherForm.NGAY_KET_THUC}
                    onChange={handleVoucherInputChange}
                    required
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsVoucherModalOpen(false)}>
                  Hủy
                </button>
                <button type="submit" className="admin-btn admin-btn-success">
                  {editingVoucher ? 'Cập Nhật' : 'Tạo Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminVoucherPage;
