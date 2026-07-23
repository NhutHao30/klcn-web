import React, { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import { getMyOrders, getMyOrderDetails } from '../services/invoiceService';

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        if (error.response?.status === 401) {
          alert('Vui lòng đăng nhập để xem đơn hàng của bạn!');
          window.location.href = '/dang-nhap';
        } else {
          console.error("Error fetching orders:", error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const openDetailModal = async (order) => {
    setViewingOrder(order);
    setIsDetailModalOpen(true);
    setIsDetailsLoading(true);
    try {
      const details = await getMyOrderDetails(order.maHD);
      setOrderDetails(details);
    } catch (error) {
      console.error("Error fetching order details:", error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setViewingOrder(null);
    setOrderDetails([]);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
        return { backgroundColor: '#e6f4ea', color: '#1e8e3e', border: '1px solid #1e8e3e' };
      case 'Chờ xử lý':
        return { backgroundColor: '#fef7e0', color: '#f29900', border: '1px solid #f29900' };
      case 'Đã hủy':
        return { backgroundColor: '#fce8e6', color: '#d93025', border: '1px solid #d93025' };
      case 'Đang giao':
        return { backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #1a73e8' };
      default:
        return { backgroundColor: '#f1f3f4', color: '#5f6368', border: '1px solid #5f6368' };
    }
  };

  return (
    <>
      {/* <Header /> */}
      <main style={{ minHeight: '60vh', backgroundColor: '#f8f9fa', padding: '40px 0' }}>
        <div className="grid wide">
          <div className="row">
            <div className="col l-10 m-12 c-12 l-o-1">
              <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2 style={{ marginBottom: '24px', borderBottom: '2px solid var(--primary-color)', paddingBottom: '12px', color: '#333' }}>
                  Lịch sử đơn hàng của tôi
                </h2>

                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Đang tải danh sách đơn hàng...</div>
                ) : orders.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px', color: '#888' }}>
                    <i className="fa-solid fa-box-open" style={{ fontSize: '48px', marginBottom: '16px', color: '#ccc' }}></i>
                    <p style={{ fontSize: '18px' }}>Bạn chưa có đơn hàng nào.</p>
                    <a href="/" style={{ color: 'var(--primary-color)', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' }}>Tiếp tục mua sắm</a>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Mã đơn hàng</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Ngày đặt</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Tiếp nhận bởi</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Tổng tiền</th>
                          <th style={{ padding: '12px', textAlign: 'left', color: '#555' }}>Trạng thái</th>
                          <th style={{ padding: '12px', textAlign: 'center', color: '#555' }}>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.map(order => (
                          <tr key={order.maHD} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '16px 12px', fontWeight: 'bold', color: '#333' }}>#{order.maHD}</td>
                            <td style={{ padding: '16px 12px' }}>{order.ngayLap}</td>
                            <td style={{ padding: '16px 12px', fontWeight: '500' }}>{order.tenCuaHang || 'Dola Bakery'}</td>
                            <td style={{ padding: '16px 12px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                              {Number(order.tongTien).toLocaleString('vi-VN')} ₫
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              <span style={{ 
                                padding: '4px 10px', 
                                borderRadius: '20px', 
                                fontSize: '13px', 
                                fontWeight: '600',
                                ...getStatusBadgeStyle(order.trangThai || 'Chờ xử lý')
                              }}>
                                {order.trangThai || 'Chờ xử lý'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                              <button 
                                onClick={() => openDetailModal(order)}
                                style={{ 
                                  backgroundColor: 'transparent', 
                                  border: '1px solid var(--primary-color)', 
                                  color: 'var(--primary-color)', 
                                  padding: '6px 16px', 
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontWeight: '600',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.target.style.backgroundColor = 'var(--primary-color)'; e.target.style.color = '#fff'; }}
                                onMouseOut={(e) => { e.target.style.backgroundColor = 'transparent'; e.target.style.color = 'var(--primary-color)'; }}
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Modal Chi tiết đơn hàng */}
      {isDetailModalOpen && viewingOrder && (
        <div style={modalOverlayStyle}>
          <div style={modalStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', color: '#333' }}>Chi tiết đơn hàng #{viewingOrder.maHD}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '6px' }}>
              <div>
                <p style={{ margin: '0 0 8px 0' }}><strong>Ngày đặt:</strong> {viewingOrder.ngayLap}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Tiếp nhận bởi:</strong> <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>{viewingOrder.tenCuaHang || 'Dola Bakery'}</span></p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Ghi chú:</strong> {viewingOrder.ghiChu || 'Không có'}</p>
                <p style={{ margin: '0 0 8px 0' }}><strong>Vận chuyển:</strong> {viewingOrder.donViVanChuyen || 'Giao hàng tiêu chuẩn'}</p>
                {viewingOrder.maVanDon && (
                  <p style={{ margin: 0 }}>
                    <strong>Mã vận đơn:</strong> <span style={{ color: '#d82d8b', fontWeight: 'bold' }}>{viewingOrder.maVanDon}</span>
                    <a 
                      href={`https://donhang.ghn.vn/?order_code=${viewingOrder.maVanDon}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ marginLeft: '10px', fontSize: '12px', color: '#fff', backgroundColor: '#d82d8b', padding: '2px 8px', borderRadius: '4px', textDecoration: 'none' }}
                    >
                      Tra cứu GHN
                    </a>
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 8px 0' }}><strong>Trạng thái:</strong></p>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  ...getStatusBadgeStyle(viewingOrder.trangThai || 'Chờ xử lý')
                }}>
                  {viewingOrder.trangThai || 'Chờ xử lý'}
                </span>
              </div>
            </div>

            <h4 style={{ marginBottom: '15px', color: '#555' }}>Sản phẩm đã mua:</h4>
            {isDetailsLoading ? (
              <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải...</p>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Sản phẩm</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>SL</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ fontWeight: '600', color: '#333' }}>{item.tenSP}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>Mã: {item.maSP}</div>
                        </td>
                        <td style={{ padding: '12px 10px', textAlign: 'center' }}>{item.soLuong}</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right' }}>{Number(item.donGia).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold' }}>{Number(item.thanhTien).toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #eee', textAlign: 'right' }}>
              <p style={{ fontSize: '16px', margin: 0 }}>
                Tổng thanh toán: 
                <span style={{ color: 'var(--primary-color)', fontSize: '24px', fontWeight: 'bold', marginLeft: '15px' }}>
                  {Number(viewingOrder.tongTien).toLocaleString('vi-VN')} ₫
                </span>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.6)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  backdropFilter: 'blur(3px)'
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '25px',
  borderRadius: '8px',
  width: '90%',
  maxWidth: '700px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default MyOrdersPage;
