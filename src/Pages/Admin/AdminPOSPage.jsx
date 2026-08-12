import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../Layout/AdminLayout';
import { getProducts } from '../../services/productService';
import { createPOSInvoice } from '../../services/productService';
import { getCustomers, createCustomer } from '../../services/customerService';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminPOSPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
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

  const handleCloseShift = async () => {
    if (!closingCash || isNaN(closingCash) || Number(closingCash) < 0) {
      toast.warning("Số tiền đóng ca không hợp lệ! Không được nhập số âm.");
      return;
    }
    try {
      const res = await axiosClient.post('/admin/pos/shifts/close', { 
        shift_id: activeShift.id, 
        actual_cash: Number(closingCash) 
      });
      const data = res.data;
      toast.success(`✅ Đóng ca thành công! Két tiền cân bằng ở mức ${Number(data.actual_cash).toLocaleString('vi-VN')} ₫`, 6000);
      setShowCloseShiftModal(false);
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
      const data = await getProducts({ size: 1000 }); // Lấy nhiều sản phẩm để tra cứu nhanh
      const productList = data.data || data;
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
        setBarcodeInput(decodedText);
        processScannedCode(decodedText);
        // Tùy chọn: Dừng quét sau khi quét thành công 1 lần
        // setIsScanning(false);
        // html5QrcodeScanner.clear();
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

    // Cleanup khi component unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.log(e));
      }
    };
  }, [isScanning]);

  const processScannedCode = (scannedCode) => {
    if (!scannedCode) return;
    const code = scannedCode.trim().toUpperCase();
    
    const product = products.find(p => {
      const id = p.maSP || p.MaSP || p.MASP;
      return id.toUpperCase() === code;
    });

    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast.warning(`Không tìm thấy sản phẩm với mã: ${code}`);
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
    const id = product.maSP || product.MaSP || product.MASP;
    const stock = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.soluong || product.SOLUONG || 0);
    
    if (stock <= 0) {
        toast.warning("Sản phẩm này đã hết hàng trong kho!");
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
        name: product.tenSP || product.TenSP || product.TENSP,
        price: product.giaban || product.GIABAN,
        quantity: 1,
        image: product.hinhanh || product.HINHANH
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
      // Lấy mã khách hàng nếu có
      const customerId = selectedCustomer ? selectedCustomer.maKH : null;
      
      // Gọi service kèm theo thông tin phương thức thanh toán
      await createPOSInvoice(cart, paymentMethod, customerId);
      toast.success(`Thanh toán thành công hóa đơn trị giá ${getTotal().toLocaleString('vi-VN')}₫!`);
      setCart([]); // Reset giỏ hàng
      setPaymentMethod('COD'); // Reset phương thức
      setSelectedCustomer(null); // Reset khách hàng
      setCustomerSearch(''); // Reset ô tìm kiếm
      fetchAllProducts(); // Cập nhật lại số lượng kho sau khi bán
      navigate('/admin/hoa-don'); // Chuyển sang trang Quản lý hóa đơn
    } catch (error) {
      console.error("Lỗi khi thanh toán:", error);
      toast.error("Có lỗi xảy ra khi tạo hóa đơn: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Máy tính tiền (POS)</h1>
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
            <p style={{ marginBottom: '15px', color: '#555' }}>Vui lòng kiểm đếm và nhập số tiền mặt có trong két hiện tại để mở ca.</p>
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
      {showCloseShiftModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fff', padding: '30px', borderRadius: '10px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h2 style={{ marginBottom: '20px', color: '#dc3545' }}><i className="fa-solid fa-lock"></i> Kết Thúc Ca Làm Việc</h2>
            <p style={{ marginBottom: '15px', color: '#555' }}>Vui lòng kiểm đếm két và nhập số tiền mặt thực tế hiện có để chốt sổ.</p>
            <div style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '5px', textAlign: 'left' }}>
              <div><strong>Thời gian mở ca:</strong> {new Date(activeShift.opened_at).toLocaleString('vi-VN')}</div>
              <div><strong>Tiền đầu ca:</strong> {Number(activeShift.opening_cash).toLocaleString('vi-VN')} ₫</div>
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
              <button className="admin-btn admin-btn-danger" style={{ flex: 1, padding: '12px' }} onClick={handleCloseShift}>
                Chốt Sổ Đóng Ca
              </button>
              <button className="admin-btn admin-btn-secondary" style={{ flex: 1, padding: '12px' }} onClick={() => setShowCloseShiftModal(false)}>
                Hủy
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
                const id = product.maSP || product.MaSP || product.MASP;
                const name = product.tenSP || product.TenSP || product.TENSP;
                const price = product.giaban || product.GIABAN;
                const image = product.hinhanh || product.HINHANH;
                const filename = image ? image.split('/').pop() : 'productnew2.webp';
                const imageUrl = image ? ((image.startsWith('http') || image.startsWith('/api/')) ? image : `/assets/IMG/${filename}`) : `/assets/IMG/productnew2.webp`;
                
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
              <div style={{ backgroundColor: '#e6f7ff', padding: '10px', borderRadius: '5px', border: '1px solid #91d5ff' }}>
                <strong>{selectedCustomer.hoTen}</strong> - {selectedCustomer.sdt}<br/>
                <small>Điểm/Hạng: <span className="admin-badge admin-badge-info">{selectedCustomer.membershipRank || 'Thành viên'}</span></small>
              </div>
            ) : isCreatingCustomer ? (
              <div>
                <input type="text" placeholder="Họ và tên..." className="admin-input" style={{ marginBottom: '10px' }} value={newCustomer.HoTen} onChange={e => setNewCustomer({...newCustomer, HoTen: e.target.value})} />
                <input type="text" placeholder="Số điện thoại..." className="admin-input" style={{ marginBottom: '10px' }} value={newCustomer.Sdt} onChange={e => setNewCustomer({...newCustomer, Sdt: e.target.value})} />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button className="admin-btn admin-btn-primary" style={{ flex: 1 }} onClick={async () => {
                    if(!newCustomer.HoTen || !newCustomer.Sdt) return toast.warning("Vui lòng nhập Tên và SĐT");
                    try {
                      // Tạo mã KH random hoặc để backend tự gen
                      const maKH = 'KH' + Math.floor(Math.random() * 1000000);
                      const res = await createCustomer({...newCustomer, maKH});
                      toast.success("Tạo KH thành công!");
                      setIsCreatingCustomer(false);
                      fetchAllCustomers();
                      setSelectedCustomer({ maKH, hoTen: newCustomer.HoTen, sdt: newCustomer.Sdt });
                    } catch(e) { toast.error("Lỗi khi tạo KH"); }
                  }}>Tạo Mới</button>
                  <button className="admin-btn admin-btn-secondary" style={{ flex: 1 }} onClick={() => setIsCreatingCustomer(false)}>Hủy</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Tìm SĐT khách hàng..." 
                    className="admin-input" 
                    style={{ marginBottom: 0, flex: 1 }}
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      const found = customers.find(c => c.sdt && c.sdt.includes(e.target.value));
                      if (found && e.target.value.length >= 4) setSelectedCustomer(found);
                    }}
                  />
                </div>
                {customerSearch && !selectedCustomer && (
                  <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>Không tìm thấy khách hàng.</div>
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
                  <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'} onChange={(e) => setPaymentMethod(e.target.value)} /> Tiền mặt (Khách lấy tại quầy)
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="COD_GIAO" checked={paymentMethod === 'COD_GIAO'} onChange={(e) => setPaymentMethod(e.target.value)} /> COD (Giao hàng thu tiền)
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="VIETQR" checked={paymentMethod === 'VIETQR'} onChange={(e) => setPaymentMethod(e.target.value)} /> Chuyển khoản (Mọi Ngân Hàng - VietQR)
                </label>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <input type="radio" name="payment" value="MOMO" checked={paymentMethod === 'MOMO'} onChange={(e) => setPaymentMethod(e.target.value)} /> Chuyển khoản (Chỉ app Momo - Nhận thông báo)
                </label>
              </div>
            </div>

            {paymentMethod === 'VIETQR' && cart.length > 0 && (
              <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#e6f7ff', borderRadius: '8px', marginBottom: '15px' }}>
                <div style={{ fontWeight: 'bold', color: '#0052cc', marginBottom: '10px' }}>Mã VietQR (Mọi App Ngân Hàng)</div>
                <img 
                  src={`https://img.vietqr.io/image/momo-0353144481-compact.png?amount=${getTotal()}&addInfo=DolaBakery&accountName=TRUONG%20NHUT%20HAO`} 
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
              {paymentMethod === 'COD' ? 'Thanh Toán (F9)' : 
               paymentMethod === 'COD_GIAO' ? 'Tạo đơn giao hàng (F9)' : 
               'Đã nhận được tiền - Tạo hóa đơn (F9)'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminPOSPage;
