import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Layout/AdminLayout';
import { getProducts } from '../../services/productService';
import { createPOSInvoice } from '../../services/productService';
import { getCustomers, createCustomer } from '../../services/customerService';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';
import { formatImageUrl } from '../../utils/imageUtils';

const AdminPOSPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  
  // Customer states
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ HoTen: '', Sdt: '' });

  // POS Shift states
  const [activeShift, setActiveShift] = useState(null);
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [discrepancyData, setDiscrepancyData] = useState(null);
  const [openingCash, setOpeningCash] = useState('');
  const [closingCash, setClosingCash] = useState('');

  const inputRef = useRef(null);

  const fetchActiveShift = async () => {
    try {
      const res = await axiosClient.get('/admin/pos/shifts/active');
      setActiveShift(res.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setShowOpenShiftModal(true);
      } else {
        console.error("Lỗi kiểm tra ca:", error);
      }
    }
  };

  const handleOpenShift = async () => {
    if (!openingCash || isNaN(openingCash) || Number(openingCash) < 0) {
      toast.warning("Vui lòng nhập số tiền hợp lệ!");
      return;
    }
    try {
      await axiosClient.post('/admin/pos/shifts/open', { opening_cash: Number(openingCash) });
      toast.success("Mở ca thành công!");
      setShowOpenShiftModal(false);
      fetchActiveShift();
    } catch (e) {
      toast.error("Lỗi mở ca: " + (e.response?.data?.error || e.message));
    }
  };

  const handleCloseShift = async (confirmDiscrepancy = false) => {
    if (!closingCash || isNaN(closingCash) || Number(closingCash) < 0) {
      toast.warning("Số tiền đóng ca không hợp lệ! Không được nhập số âm.");
      return;
    }
    try {
      const res = await axiosClient.post('/admin/pos/shifts/close', { 
        shift_id: activeShift.id, 
        actual_cash: Number(closingCash),
        confirm_discrepancy: confirmDiscrepancy
      });

      const data = res.data;

      if (data.requires_confirmation) {
        setDiscrepancyData(data);
        return;
      }

      toast.success(data.message || `Đóng ca thành công!`, 6000);
      setShowCloseShiftModal(false);
      setDiscrepancyData(null);
      setActiveShift(null);
      setClosingCash('');
      setShowOpenShiftModal(true); // Yêu cầu mở ca mới
    } catch (e) {
      toast.error("Lỗi đóng ca: " + (e.response?.data?.error || e.message));
    }
  };

  const fetchAllProducts = async () => {
    setIsLoading(true);
    try {
      const storeId = activeShift?.cuaHangId || currentUser?.nguoidung?.cuaHangId || currentUser?.macuahang || 1;
      const data = await getProducts({ size: 1000, store_id: storeId }); // Lấy sản phẩm & tồn kho của chi nhánh đang làm việc
      const raw = data.data || data;
      const productList = Array.isArray(raw) ? raw : (raw?.data || []);
      setProducts(productList);
    } catch (error) {
      console.error("Lỗi lấy danh sách sản phẩm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Lỗi lấy danh sách KH:", error);
    }
  };

  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef(null);
  const lastScanTimeRef = useRef(0);

  useEffect(() => {
    fetchActiveShift();
    fetchAllProducts();
    fetchAllCustomers();
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isScanning && window.Html5QrcodeScanner) {
      const html5QrcodeScanner = new window.Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      
      html5QrcodeScanner.render((decodedText) => {
        const now = Date.now();
        if (now - lastScanTimeRef.current > 1500) {
          lastScanTimeRef.current = now;
          setBarcodeInput(decodedText);
          processScannedCode(decodedText);
        }
      }, (error) => {
        // Ignore errors during scanning
      });

      scannerRef.current = html5QrcodeScanner;
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Lỗi khi tắt Camera. ", error);
        });
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log(e));
      }
    };
  }, [isScanning, products]);

  const processScannedCode = async (scannedCode) => {
    if (!scannedCode) return;
    let rawCode = String(scannedCode).trim();
    if (!rawCode) return;

    // 1. Trích xuất nếu mã là URL hoặc chứa param (vd: ?data=SP001 hoặc /san-pham/1 hoặc /san-pham/SP001)
    if (rawCode.includes('http://') || rawCode.includes('https://') || rawCode.includes('/san-pham/') || rawCode.includes('data=')) {
      try {
        const urlObj = new URL(rawCode, window.location.origin);
        const dataParam = urlObj.searchParams.get('data');
        if (dataParam) {
          rawCode = dataParam;
        } else {
          const parts = urlObj.pathname.split('/');
          const lastPart = parts.filter(Boolean).pop();
          if (lastPart) rawCode = lastPart;
        }
      } catch (e) {
        const match = rawCode.match(/(?:data=|\/san-pham\/)([^&/?#]+)/i);
        if (match && match[1]) rawCode = match[1];
      }
    }

    // 2. Trích xuất ID nếu QR code chứa JSON
    let extractedId = null;
    if (rawCode.startsWith('{') && rawCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(rawCode);
        extractedId = parsed.id || parsed.sanpham_id || parsed.maSP || parsed.MASP || parsed.ma_san_pham;
      } catch (e) {
        // Ignore parse error
      }
    }

    const cleanCode = String(extractedId || rawCode).trim().toUpperCase();
    const cleanWithoutHash = cleanCode.replace(/^#+/, '').trim();

    // Rút trích số ID thuần nếu có tiền tố SP hoặc # (vd: SP001 -> 1, #1 -> 1, SP1 -> 1)
    let extractedNumericId = null;
    const spMatch = cleanWithoutHash.match(/^SP0*(\d+)$/i) || cleanWithoutHash.match(/^0*(\d+)$/);
    if (spMatch && spMatch[1]) {
      extractedNumericId = parseInt(spMatch[1], 10);
    }

    // 3. Tìm trong danh sách products đã tải sẵn
    let product = products.find(p => {
      const pId = p.id !== undefined && p.id !== null ? Number(p.id) : null;
      const numId = parseInt(p.id || p.MASP, 10);

      // So khớp ID số
      if (extractedNumericId !== null && pId !== null && pId === extractedNumericId) {
        return true;
      }
      if (extractedNumericId !== null && !isNaN(numId) && numId === extractedNumericId) {
        return true;
      }

      const rawId = p.id !== undefined && p.id !== null ? String(p.id).toUpperCase() : '';
      const rawMaSP = p.ma_san_pham ? String(p.ma_san_pham).toUpperCase() : '';
      const rawMASP = p.MASP !== undefined && p.MASP !== null ? String(p.MASP).toUpperCase() : '';
      const rawMaSPUpper = p.maSP ? String(p.maSP).toUpperCase() : '';
      const rawSlug = p.slug ? String(p.slug).toUpperCase() : '';
      const rawTenSP = (p.ten_san_pham || p.tenSP || p.TenSP || p.TENSP || '').toUpperCase();

      const spPad3 = !isNaN(numId) ? `SP${String(numId).padStart(3, '0')}` : '';
      const spPad4 = !isNaN(numId) ? `SP${String(numId).padStart(4, '0')}` : '';
      const spPad5 = !isNaN(numId) ? `SP${String(numId).padStart(5, '0')}` : '';
      const spDirect = !isNaN(numId) ? `SP${numId}` : '';
      const hashId = !isNaN(numId) ? `#${numId}` : '';

      return (
        rawId === cleanCode ||
        rawId === cleanWithoutHash ||
        hashId === cleanCode ||
        rawMaSP === cleanCode ||
        rawMaSP === cleanWithoutHash ||
        rawMASP === cleanCode ||
        rawMASP === cleanWithoutHash ||
        rawMaSPUpper === cleanCode ||
        rawMaSPUpper === cleanWithoutHash ||
        spPad3 === cleanCode ||
        spPad3 === cleanWithoutHash ||
        spPad4 === cleanCode ||
        spPad4 === cleanWithoutHash ||
        spPad5 === cleanCode ||
        spPad5 === cleanWithoutHash ||
        spDirect === cleanCode ||
        spDirect === cleanWithoutHash ||
        rawSlug === cleanCode ||
        rawSlug === cleanWithoutHash ||
        rawTenSP === cleanCode ||
        (cleanCode.length >= 3 && rawTenSP.includes(cleanCode))
      );
    });

    // 4. Nếu chưa có trong danh sách bộ nhớ (vd do ca khác hoặc mới tạo), tự động tra cứu API Backend
    if (!product) {
      try {
        const lookupKey = extractedNumericId !== null ? extractedNumericId : cleanWithoutHash;
        const res = await axiosClient.get(`/products/${lookupKey}`);
        const found = res?.data?.data || res?.data;
        if (found && (found.id || found.MASP)) {
          product = found;
          setProducts(prev => {
            const exists = prev.some(p => (p.id || p.MASP) === (product.id || product.MASP));
            return exists ? prev : [product, ...prev];
          });
        }
      } catch (err) {
        // Không tìm thấy trên server
      }
    }

    if (product) {
      addToCart(product);
      toast.success(`Đã thêm vào giỏ: ${product.ten_san_pham || product.tenSP || product.TENSP || product.name || 'Sản phẩm'}`);
      setBarcodeInput('');
    } else {
      toast.warning(`Không tìm thấy sản phẩm với mã: ${cleanCode}`);
      setBarcodeInput('');
    }

    if (inputRef.current && !isScanning) {
      inputRef.current.focus();
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    processScannedCode(barcodeInput);
  };

  const addToCart = (product) => {
    const id = product.id || product.maSP || product.MaSP || product.MASP;
    const stock = product.TONKHO_THUCTE !== undefined 
      ? product.TONKHO_THUCTE 
      : (product.so_luong_ton !== undefined 
          ? product.so_luong_ton 
          : (product.soluong || product.SOLUONG || 999));
    
    if (stock !== null && stock !== undefined && Number(stock) <= 0) {
        toast.warning(`Sản phẩm "${product.ten_san_pham || product.tenSP || product.TENSP}" đã hết hàng trong kho!`);
        return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => 
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { 
        id, 
        name: product.ten_san_pham || product.tenSP || product.TenSP || product.TENSP,
        price: product.gia_ban || product.giaban || product.GIABAN || 0,
        quantity: 1,
        image: product.hinh_anh || product.hinhanh || product.HINHANH
      }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.warning("Giỏ hàng đang trống!");
      return;
    }
    
    try {
      const customerId = selectedCustomer ? (selectedCustomer.id || selectedCustomer.maKH) : null;
      
      await createPOSInvoice(cart, paymentMethod, customerId);
      toast.success(`Thanh toán thành công hóa đơn trị giá ${getTotal().toLocaleString('vi-VN')}₫!`);
      setCart([]); // Reset giỏ hàng
      setPaymentMethod('CASH'); // Reset phương thức thanh toán tiền mặt
      setSelectedCustomer(null); // Reset khách hàng
      setCustomerSearch(''); // Reset ô tìm kiếm
      fetchAllProducts(); // Cập nhật lại số lượng kho sau khi bán
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      toast.error("Có lỗi xảy ra khi tạo hóa đơn: " + (error.response?.data?.message || error.response?.data?.error || error.message));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Bán hàng tại quầy</h1>
        {activeShift && (
          <button className="admin-btn admin-btn-danger" onClick={() => setShowCloseShiftModal(true)}>
            <i className="fa-solid fa-lock" style={{ marginRight: '8px' }}></i>
            Đóng Ca (Đang mở)
          </button>
        )}
      </div>

      {/* MODAL MỞ CA */}
      {showOpenShiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}><i className="fa-solid fa-cash-register"></i> Bắt Đầu Ca Làm Việc</h2>
            <p style={{ marginBottom: '15px', color: '#555', fontSize: '18px', }}>Vui lòng kiểm đếm và nhập số tiền mặt có trong két hiện tại để mở ca.</p>
            <input 
              type="number" 
              className="admin-input" 
              placeholder="Nhập số tiền mặt đầu ca (VNĐ)" 
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="admin-btn admin-btn-primary" style={{ flex: 1, padding: '12px' }} onClick={handleOpenShift}>
                Xác Nhận Mở Ca
              </button>
              <button className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setShowOpenShiftModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ĐÓNG CA */}
      {showCloseShiftModal && !discrepancyData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '25px', borderRadius: '12px', width: '450px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '15px', color: '#dc3545' }}><i className="fa-solid fa-lock"></i> Kết Thúc Ca Làm Việc</h2>
            <p style={{ marginBottom: '15px', color: '#555', fontSize: '14px' }}>Báo cáo doanh thu ca & kiểm đếm tiền mặt thực tế trong két.</p>
            {activeShift && (
              <div style={{ marginBottom: '15px', padding: '12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', textAlign: 'left', fontSize: '14px' }}>
                <div style={{ marginBottom: '6px' }}><strong>Thời gian mở ca:</strong> {new Date(activeShift.opened_at).toLocaleString('vi-VN')}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Tiền mặt đầu ca:</span>
                  <strong>{Number(activeShift.opening_cash || 0).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Doanh thu Tiền mặt:</span>
                  <strong style={{ color: '#198754' }}>+{Number(activeShift.cash_sales || 0).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Doanh thu VietQR / Chuyển khoản:</span>
                  <strong style={{ color: '#0d6efd' }}>+{Number(activeShift.bank_sales || 0).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>Doanh thu Ví MoMo:</span>
                  <strong style={{ color: '#d63384' }}>+{Number(activeShift.momo_sales || 0).toLocaleString('vi-VN')} ₫</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #ccc', color: '#0d6efd', fontWeight: 'bold' }}>
                  <span>Tổng doanh thu cả ca:</span>
                  <span>{Number(activeShift.total_sales || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #dee2e6', color: '#212529', fontWeight: 'bold' }}>
                  <span>Két tiền mặt dự kiến (Hệ thống):</span>
                  <span style={{ color: '#dc3545' }}>{Number(activeShift.expected_cash || activeShift.opening_cash || 0).toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            )}
            <div style={{ textAlign: 'left', marginBottom: '5px', fontWeight: '500', fontSize: '14px', color: '#495057' }}>
              Nhập số tiền mặt thực tế kiểm đếm trong két:
            </div>
            <input 
              type="number" 
              className="admin-input" 
              placeholder="Nhập số tiền mặt thực tế (VNĐ)" 
              value={closingCash}
              onChange={(e) => setClosingCash(e.target.value)}
              style={{ fontSize: '18px', textAlign: 'center', fontWeight: 'bold' }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button className="admin-btn admin-btn-danger" style={{ flex: 1, padding: '12px' }} onClick={() => handleCloseShift(false)}>
                Chốt Sổ Đóng Ca
              </button>
              <button className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setShowCloseShiftModal(false)}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CẢNH BÁO CHÊNH LỆCH KÉT TIỀN */}
      {discrepancyData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', width: '500px', textAlign: 'center', boxShadow: '0 15px 30px rgba(0,0,0,0.3)', borderTop: '5px solid #ffc107' }}>
            <div style={{ fontSize: '48px', color: '#ffc107', marginBottom: '10px' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <h2 style={{ marginBottom: '15px', color: '#d39e00' }}>Cảnh Báo Chênh Lệch Két Tiền</h2>
            <p style={{ marginBottom: '15px', color: '#495057', fontSize: '14px' }}>
              Số tiền mặt thực tế bạn nhập <strong>không trùng khớp</strong> với két tiền mặt ghi nhận trong ca.
            </p>

            <div style={{ background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '8px', padding: '15px', marginBottom: '20px', textAlign: 'left', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tiền mặt đầu ca:</span>
                <strong>{Number(discrepancyData.opening_cash || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Doanh thu Tiền mặt:</span>
                <strong style={{ color: '#198754' }}>+{Number(discrepancyData.cash_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Doanh thu VietQR / Chuyển khoản:</span>
                <strong style={{ color: '#0d6efd' }}>+{Number(discrepancyData.bank_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Doanh thu Ví MoMo:</span>
                <strong style={{ color: '#d63384' }}>+{Number(discrepancyData.momo_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
                <span>Tổng doanh thu cả ca (Tất cả PT):</span>
                <strong style={{ color: '#0d6efd' }}>{Number(discrepancyData.total_sales || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', borderTop: '1px dashed #ccc', paddingTop: '6px' }}>
                <span>Két tiền mặt dự kiến (Hệ thống):</span>
                <strong style={{ color: '#212529' }}>{Number(discrepancyData.expected_cash || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span>Tiền mặt thực tế bạn nhập:</span>
                <strong style={{ color: '#212529' }}>{Number(discrepancyData.actual_cash || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #dee2e6', fontSize: '15px' }}>
                <span>Mức độ chênh lệch két mặt:</span>
                <strong style={{ color: discrepancyData.difference < 0 ? '#dc3545' : '#198754' }}>
                  {discrepancyData.difference < 0 
                    ? `THIẾU ${Math.abs(discrepancyData.difference).toLocaleString('vi-VN')} ₫` 
                    : `THỪA ${Math.abs(discrepancyData.difference).toLocaleString('vi-VN')} ₫`}
                </strong>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#6c757d', marginBottom: '20px', fontStyle: 'italic' }}>
              * Nếu không thể tìm lại số tiền chênh lệch, bạn vẫn có thể chọn "Ghi Nhận & Đóng Ca" để báo cáo lại cho quản lý.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                className="admin-btn admin-btn-secondary" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={() => setDiscrepancyData(null)}
              >
                <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '6px' }}></i>
                Đếm & Kiểm Tra Lại
              </button>
              <button 
                className="admin-btn admin-btn-danger" 
                style={{ flex: 1, padding: '12px' }} 
                onClick={() => handleCloseShift(true)}
              >
                <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>
                Ghi Nhận & Đóng Ca
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Left Side: Scanner & Products */}
        <div className="admin-card" style={{ flex: 2 }}>
          <h2 className="admin-card-title">Quét mã vạch sản phẩm</h2>
          
          <form onSubmit={handleScan} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              ref={inputRef}
              type="text" 
              className="admin-input" 
              placeholder="Sử dụng máy quét hoặc nhập MASP rồi nhấn Enter..." 
              style={{ marginBottom: 0, flex: 1, fontSize: '16px', padding: '12px' }}
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              autoFocus
            />
            <button type="submit" className="admin-btn admin-btn-primary" style={{ padding: '0 20px' }}>
              <i className="fa-solid fa-barcode" style={{ marginRight: '8px' }}></i>
              Enter
            </button>
            <button 
                type="button" 
                className={`admin-btn ${isScanning ? 'admin-btn-danger' : 'admin-btn-secondary'}`} 
                onClick={() => setIsScanning(!isScanning)}
            >
              <i className={`fa-solid ${isScanning ? 'fa-video-slash' : 'fa-camera'}`} style={{ marginRight: '8px' }}></i>
              {isScanning ? 'Tắt Camera' : 'Bật Camera'}
            </button>
          </form>

          {isScanning && (
            <div style={{ marginBottom: '20px', border: '2px solid var(--primary-color)', borderRadius: '8px', overflow: 'hidden' }}>
              <div id="reader" style={{ width: '100%' }}></div>
            </div>
          )}

          <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px dashed #ccc' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: '5px' }}></i>
              Mẹo: Nhấn vào ô nhập liệu bên trên, sau đó dùng máy quét mã vạch (Barcode Scanner) quét mã QR trên màn hình hoặc mã in trên tem sản phẩm. Sản phẩm sẽ tự động được thêm vào giỏ hàng bên phải.
            </p>
          </div>
          
          <h3 style={{ marginTop: '30px', marginBottom: '15px', fontSize: '18px' }}>Sản phẩm có sẵn (Click để thêm)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
             {isLoading ? <p>Đang tải dữ liệu...</p> : products.slice(0, 12).map(product => {
                const id = product.maSP || product.MaSP || product.MASP || product.id;
                const name = product.tenSP || product.TenSP || product.TENSP || product.ten_san_pham;
                const price = product.giaban || product.GIABAN || product.gia_ban;
                const image = product.hinhanh || product.HINHANH || product.hinh_anh;
                const imageUrl = formatImageUrl(image);
                
                return (
                    <div 
                        key={id} 
                        style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px', textAlign: 'center', cursor: 'pointer', transition: '0.2s', ':hover': { borderColor: 'var(--primary-color)' } }}
                        onClick={() => addToCart(product)}
                    >
                        <img src={imageUrl} alt={name} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>{Number(price).toLocaleString('vi-VN')}₫</div>
                    </div>
                );
             })}
          </div>
        </div>

        {/* Right Side: Cart / Invoice */}
        <div className="admin-card" style={{ flex: 1, position: 'sticky', top: '20px' }}>
          
          <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span><i className="fa-solid fa-user"></i> Khách hàng</span>
              {selectedCustomer && (
                <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer', fontSize: '13px' }}>Bỏ chọn</button>
              )}
            </h3>
            
            {selectedCustomer ? (
              <div style={{ backgroundColor: '#e6f7ff', padding: '12px', borderRadius: '6px', border: '1px solid #91d5ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <strong style={{ fontSize: '15px', color: '#003a8c' }}>{selectedCustomer.hoTen}</strong>
                    <div style={{ fontSize: '13px', color: '#555', marginTop: '2px' }}><i className="fa-solid fa-phone" style={{ marginRight: '5px' }}></i>{selectedCustomer.sdt}</div>
                    <div style={{ marginTop: '5px' }}>
                      <span className="admin-badge admin-badge-info">{selectedCustomer.membershipRank || 'Thành viên'}</span>
                      {selectedCustomer.diemTichLuy !== undefined && (
                        <span style={{ fontSize: '12px', marginLeft: '8px', color: '#666' }}>({selectedCustomer.diemTichLuy} điểm)</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Bỏ chọn</button>
                </div>
              </div>
            ) : isCreatingCustomer ? (
              <div>
                <input type="text" placeholder="Họ và tên..." className="admin-input" style={{ marginBottom: '10px' }} value={newCustomer.HoTen} onChange={e => setNewCustomer({...newCustomer, HoTen: e.target.value})} />
                <input type="text" placeholder="Số điện thoại..." className="admin-input" style={{ marginBottom: '10px' }} value={newCustomer.Sdt} onChange={e => setNewCustomer({...newCustomer, Sdt: e.target.value})} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={async () => {
                    if(!newCustomer.HoTen || !newCustomer.Sdt) return toast.warning("Vui lòng nhập Tên và SĐT");
                    try {
                      const res = await createCustomer({ hoTen: newCustomer.HoTen, sdt: newCustomer.Sdt });
                      toast.success("Tạo KH thành công!");
                      setIsCreatingCustomer(false);
                      fetchAllCustomers();
                      setSelectedCustomer({
                        id: res.id || res.maKH,
                        maKH: res.maKH || res.id,
                        hoTen: res.hoTen || newCustomer.HoTen,
                        sdt: res.sdt || newCustomer.Sdt,
                        membershipRank: res.membershipRank || 'Đồng'
                      });
                      setNewCustomer({ HoTen: '', Sdt: '' });
                    } catch(e) {
                      toast.error("Lỗi khi tạo KH: " + (e.response?.data?.message || e.message));
                    }
                  }}>Tạo Mới</button>
                  <button className="admin-btn admin-btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreatingCustomer(false)}>Hủy</button>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Tìm SĐT hoặc Tên khách hàng..." 
                    className="admin-input" 
                    style={{ marginBottom: 0, flex: 1 }}
                    value={customerSearch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCustomerSearch(val);
                      if (val.trim().length >= 10) {
                        const exact = customers.find(c => c.sdt && c.sdt.trim() === val.trim());
                        if (exact) {
                          setSelectedCustomer(exact);
                          setCustomerSearch('');
                        }
                      }
                    }}
                  />
                  {customerSearch && (
                    <button 
                      onClick={() => setCustomerSearch('')}
                      style={{ background: '#eee', border: '1px solid #ccc', borderRadius: '4px', padding: '0 10px', cursor: 'pointer', color: '#666' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Live Suggestions Dropdown */}
                {customerSearch.trim() !== '' && (
                  <div style={{ 
                    maxHeight: '180px', 
                    overflowY: 'auto', 
                    border: '1px solid #0052cc', 
                    borderRadius: '6px', 
                    marginBottom: '10px',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}>
                    {(() => {
                      const keyword = customerSearch.trim().toLowerCase();
                      const matches = customers.filter(c => 
                        (c.sdt && c.sdt.includes(keyword)) ||
                        (c.hoTen && c.hoTen.toLowerCase().includes(keyword))
                      );
                      if (matches.length === 0) {
                        return (
                          <div style={{ padding: '10px', fontSize: '13px', color: '#888', textAlign: 'center' }}>
                            Không tìm thấy khách hàng trùng khớp.
                          </div>
                        );
                      }
                      return matches.map(c => (
                        <div 
                          key={c.id || c.maKH}
                          style={{ 
                            padding: '8px 12px', 
                            borderBottom: '1px solid #f0f0f0', 
                            cursor: 'pointer',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f7ff'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                          onClick={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch('');
                          }}
                        >
                          <div>
                            <strong style={{ fontSize: '14px', color: '#333' }}>{c.hoTen}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>SĐT: {c.sdt}</div>
                          </div>
                          <span className="admin-badge admin-badge-info" style={{ fontSize: '11px' }}>
                            {c.membershipRank || 'Thành viên'}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                <button className="admin-btn admin-btn-secondary" style={{ width: '100%', fontSize: '13px' }} onClick={() => setIsCreatingCustomer(true)}>
                  + Khách mới (Tạo tài khoản tích điểm)
                </button>
              </div>
            )}
          </div>

          <h2 className="admin-card-title">Hóa đơn hiện tại</h2>
          
          <div style={{ minHeight: '200px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
            {cart.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                <i className="fa-solid fa-cart-arrow-down" style={{ fontSize: '40px', marginBottom: '10px' }}></i>
                <p>Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {cart.map(item => (
                  <li key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>{item.name}</div>
                      <div style={{ color: '#666', fontSize: '13px' }}>{Number(item.price).toLocaleString('vi-VN')}₫</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ display: 'flex', border: '1px solid #ddd', borderRadius: '4px', overflow: 'hidden' }}>
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ background: '#f5f5f5', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>-</button>
                        <input type="text" value={item.quantity} readOnly style={{ width: '30px', textAlign: 'center', border: 'none', borderLeft: '1px solid #ddd', borderRight: '1px solid #ddd' }} />
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ background: '#f5f5f5', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', fontSize: '16px' }}>
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div style={{ borderTop: '2px dashed #ddd', paddingTop: '20px' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>Hình thức thanh toán:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="CASH" checked={paymentMethod === 'CASH'} onChange={(e) => setPaymentMethod(e.target.value)} /> Tiền mặt (Thanh toán tại quầy)
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="VIETQR" checked={paymentMethod === 'VIETQR'} onChange={(e) => setPaymentMethod(e.target.value)} /> Chuyển khoản (VietQR / Ngân hàng)
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={(e) => setPaymentMethod(e.target.value)} /> Ví điện tử MoMo
                </label>
              </div>
            </div>

            {paymentMethod === 'VIETQR' && cart.length > 0 && (
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#0052cc', marginBottom: '10px' }}>Mã VietQR (Mọi App Ngân Hàng)</div>
                <img 
                  src={`https://img.vietqr.io/image/momo-0353144481-compact.png?amount=${getTotal()}&addInfo=GivralBakery&accountName=TRUONG%20NHUT%20HAO`} 
                  alt="VietQR" 
                  style={{ width: '200px', height: '200px', border: '3px solid #0052cc', borderRadius: '10px', padding: '5px', backgroundColor: '#fff' }}
                />
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>TRƯƠNG NHỰT HÀO</div>
                <div style={{ fontSize: '13px', marginTop: '5px', color: '#666' }}>Khách dùng app Ngân hàng (VCB, MB...) hoặc Momo quét đều được</div>
              </div>
            )}

            {paymentMethod === 'MOMO' && cart.length > 0 && (
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#ffe6e6', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#d82d8b', marginBottom: '10px' }}>Mã Momo P2P (Chỉ quét bằng Momo)</div>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0353144481|TRUONG NHUT HAO||0|0|${getTotal()}`)}`} 
                  alt="Momo QR" 
                  style={{ width: '200px', height: '200px', border: '3px solid #d82d8b', borderRadius: '10px', padding: '5px', backgroundColor: '#fff' }}
                />
                <div style={{ fontWeight: 'bold', marginTop: '10px' }}>TRƯƠNG NHỰT HÀO</div>
                <div style={{ fontSize: '13px', marginTop: '5px', color: '#666' }}>Nhân viên nhận được thông báo "Ting ting" ngay lập tức</div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
              <span>Tổng cộng ({cart.reduce((sum, i) => sum + i.quantity, 0)} sp):</span>
              <strong style={{ color: 'var(--primary-color)', fontSize: '20px' }}>{getTotal().toLocaleString('vi-VN')}₫</strong>
            </div>
            
            <button 
              className="admin-btn admin-btn-primary" 
              style={{ width: '100%', padding: '15px', fontSize: '16px', fontWeight: 'bold', marginTop: '10px' }}
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              {paymentMethod === 'CASH' ? 'Thanh Toán Tiền Mặt (F9)' : 'Đã nhận được tiền - Tạo hóa đơn (F9)'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPOSPage;

