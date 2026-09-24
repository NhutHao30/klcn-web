import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getInvoices, updateInvoiceStatus, getInvoiceDetails } from '../../services/invoiceService';
import { useToast } from '../../components/Toast/Toast';
import '../../css/admin.css';

const STATUS_COLUMNS = [
  {
    id: 'CHO_XAC_NHAN',
    title: 'Chờ Xác Nhận',
    icon: 'fa-clock',
    color: '#3b82f6',
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    nextStatus: 'DANG_CHE_BIEN',
    nextLabel: 'Xác Nhận & Chế Biến'
  },
  {
    id: 'DANG_CHE_BIEN',
    title: 'Đang Chế Biến Bánh',
    icon: 'fa-fire-burner',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fef3c7',
    nextStatus: 'DANG_GIAO',
    nextLabel: 'Bàn Giao Shipper'
  },
  {
    id: 'DANG_GIAO',
    title: 'Đang Giao Hàng',
    icon: 'fa-truck-fast',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    nextStatus: 'HOAN_THANH',
    nextLabel: 'Giao Thành Công'
  },
  {
    id: 'HOAN_THANH',
    title: 'Đã Hoàn Thành',
    icon: 'fa-circle-check',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    nextStatus: null,
    nextLabel: null
  },
  {
    id: 'DA_HUY',
    title: 'Đã Hủy Đơn',
    icon: 'fa-circle-xmark',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    nextStatus: null,
    nextLabel: null
  }
];

const normalizeStatus = (st) => {
  if (!st) return 'CHO_XAC_NHAN';
  const clean = String(st).toUpperCase().trim();
  if (clean.includes('CHO') || clean === '0' || clean === 'PENDING') return 'CHO_XAC_NHAN';
  if (clean.includes('BIEN') || clean.includes('XU_LY') || clean === '1' || clean === 'PROCESSING') return 'DANG_CHE_BIEN';
  if (clean.includes('GIAO') || clean.includes('SHIPPING') || clean === '2') return 'DANG_GIAO';
  if (clean.includes('HOAN') || clean.includes('THANH') || clean.includes('DELIVERED') || clean === '3') return 'HOAN_THANH';
  if (clean.includes('HUY') || clean.includes('CANCEL') || clean === '4') return 'DA_HUY';
  return 'CHO_XAC_NHAN';
};

const AdminOnlineOrderPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getInvoices({ page: 0, size: 200 });
      const list = res?.content || res?.data || (Array.isArray(res) ? res : []);
      // Direct online orders (HinhThuc !== POS or MAROLE khach hang)
      setOrders(list);
    } catch (e) {
      toast.error('Không thể tải danh sách đơn hàng online');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (maHD, newStatus) => {
    try {
      await updateInvoiceStatus(maHD, { TRANGTHAI: newStatus, TRANG_THAI: newStatus });
      toast.success(`Đã chuyển đơn hàng ${maHD} sang trạng thái mới thành công!`);
      // Update local state
      setOrders(prev => prev.map(o => {
        const orderId = o.MAHD || o.MAHDBAN || o.id;
        if (orderId === maHD) {
          return { ...o, TRANGTHAI: newStatus, TRANG_THAI: newStatus };
        }
        return o;
      }));
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleOpenDetailModal = async (order) => {
    setSelectedOrder(order);
    setIsLoadingDetails(true);
    const orderId = order.MAHD || order.MAHDBAN || order.id;
    try {
      const details = await getInvoiceDetails(orderId);
      const items = details?.chi_tiet || details?.data || (Array.isArray(details) ? details : []);
      setOrderDetails(items);
    } catch (e) {
      setOrderDetails(order.chi_tiet || order.details || []);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const code = String(o.MAHD || o.MAHDBAN || o.id || '').toLowerCase();
    const customer = String(o.khach_hang?.HOTEN || o.HOTEN_KH || o.TENKH || '').toLowerCase();
    const phone = String(o.khach_hang?.SDT || o.SDT || '').toLowerCase();
    return code.includes(term) || customer.includes(term) || phone.includes(term);
  });

  const getOrdersByColumn = (colId) => {
    return filteredOrders.filter(o => normalizeStatus(o.TRANGTHAI || o.TRANG_THAI) === colId);
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản Lý Đơn Hàng Online (Kanban Board)</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Theo dõi và xử lý đơn đặt hàng trực tuyến của khách theo quy trình 5 bước</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="admin-btn admin-btn-secondary" onClick={fetchOrders} disabled={isLoading}>
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ marginRight: '6px' }}></i> Làm Mới Board
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="admin-card" style={{ padding: '0.8rem 1.2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', justifyContent: 'space-between' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Tìm theo mã đơn HD..., tên KH, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '34px' }}
            />
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}></i>
          </div>

          <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: '#64748b' }}>
            <span>Tổng đơn hàng: <b>{filteredOrders.length}</b></span>
            <span>•</span>
            <span style={{ color: '#3b82f6' }}>Chờ duyệt: <b>{getOrdersByColumn('CHO_XAC_NHAN').length}</b></span>
            <span>•</span>
            <span style={{ color: '#f59e0b' }}>Đang nướng bánh: <b>{getOrdersByColumn('DANG_CHE_BIEN').length}</b></span>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)', marginBottom: '10px' }}></i>
          <p>Đang đồng bộ luồng đơn hàng trực tuyến...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', alignItems: 'start', overflowX: 'auto', paddingBottom: '1rem' }}>
          {STATUS_COLUMNS.map(col => {
            const colOrders = getOrdersByColumn(col.id);

            return (
              <div
                key={col.id}
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: `1px solid ${col.borderColor}`,
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                  minWidth: '240px'
                }}
              >
                {/* Column Header */}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: col.bgColor,
                  borderBottom: `2px solid ${col.color}`,
                  borderRadius: '10px 10px 0 0',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fa-solid ${col.icon}`} style={{ color: col.color, fontSize: '15px' }}></i>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                      {col.title}
                    </h3>
                  </div>
                  <span style={{
                    backgroundColor: col.color,
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Order Cards Container */}
                <div style={{ padding: '10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#cbd5e1', fontSize: '13px' }}>
                      <i className="fa-solid fa-inbox" style={{ fontSize: '24px', marginBottom: '6px', display: 'block' }}></i>
                      Không có đơn
                    </div>
                  ) : (
                    colOrders.map(order => {
                      const orderId = order.MAHD || order.MAHDBAN || order.id;
                      const khName = order.khach_hang?.HOTEN || order.HOTEN_KH || order.TENKH || 'Khách Vãng Lai';
                      const khSdt = order.khach_hang?.SDT || order.SDT || '-';
                      const tongTien = Number(order.TONGTIEN || order.TONG_TIEN || 0);
                      const ngayTao = order.CREATED_AT || order.NGAYTAO || order.ngay_tao;

                      return (
                        <div
                          key={orderId}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                            border: '1px solid #e2e8f0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleOpenDetailModal(order)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--admin-primary)', fontSize: '13px' }}>
                              #{orderId}
                            </span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {ngayTao ? new Date(ngayTao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px', color: '#0f172a' }}>
                            <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#64748b', fontSize: '11px' }}></i>
                            {khName}
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#64748b', fontSize: '11px' }}></i>
                            {khSdt}
                          </div>

                          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Tổng tiền</span>
                              <b style={{ color: '#b45309', fontSize: '14px' }}>{tongTien.toLocaleString()}đ</b>
                            </div>

                            {col.nextStatus && (
                              <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: col.color, borderColor: col.color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(orderId, col.nextStatus);
                                }}
                                title={col.nextLabel}
                              >
                                {col.nextLabel} <i className="fa-solid fa-arrow-right" style={{ marginLeft: '4px' }}></i>
                              </button>
                            )}
                          </div>

                          {/* Quick Cancel button for early stages */}
                          {['CHO_XAC_NHAN', 'DANG_CHE_BIEN'].includes(col.id) && (
                            <div style={{ marginTop: '8px', textAlign: 'right' }}>
                              <button
                                type="button"
                                style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Hủy đơn hàng ${orderId}?`)) {
                                    handleStatusChange(orderId, 'DA_HUY');
                                  }
                                }}
                              >
                                Hủy đơn này
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Chi Tiết Đơn Hàng Online #{selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.id}
              </h3>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="admin-modal-body">
              {/* Customer & Shipping Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '13px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>👤 THÔNG TIN KHÁCH HÀNG</h4>
                  <p style={{ margin: '0 0 4px 0' }}><b>Họ tên:</b> {selectedOrder.khach_hang?.HOTEN || selectedOrder.HOTEN_KH || selectedOrder.TENKH || 'Khách hàng'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>SĐT:</b> {selectedOrder.khach_hang?.SDT || selectedOrder.SDT || '-'}</p>
                  <p style={{ margin: 0 }}><b>Email:</b> {selectedOrder.khach_hang?.user?.EMAIL || selectedOrder.EMAIL || '-'}</p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>📍 GIAO HÀNG & THANH TOÁN</h4>
                  <p style={{ margin: '0 0 4px 0' }}><b>Địa chỉ:</b> {selectedOrder.DIACHI_GIAO || selectedOrder.khach_hang?.DIACHI || 'Nhận tại cửa hàng'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Phương thức TT:</b> <span className="admin-badge admin-badge-info">{selectedOrder.PHUONGTHUCTHANHTOAN || 'COD (Tiền mặt)'}</span></p>
                  <p style={{ margin: 0 }}><b>Trạng thái:</b> <span className="admin-badge admin-badge-success">{selectedOrder.TRANGTHAI || 'Chờ xác nhận'}</span></p>
                </div>
              </div>

              {/* Items List Table */}
              <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🍰 Danh Sách Bánh Trong Đơn Hàng</h4>
              {isLoadingDetails ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách món...</p>
              ) : (
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th>Sản Phẩm Bánh</th>
                      <th style={{ textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ textAlign: 'right' }}>Đơn Giá</th>
                      <th style={{ textAlign: 'right' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderDetails.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', padding: '15px', color: '#888' }}>
                          Chi tiết sản phẩm chưa được tải hoặc trống
                        </td>
                      </tr>
                    ) : (
                      orderDetails.map((item, idx) => {
                        const ten = item.san_pham?.TENSP || item.TENSP || `Sản phẩm ${item.MASP}`;
                        const sl = item.SOLUONG || item.SO_LUONG || 1;
                        const gia = Number(item.DONGIA || item.DON_GIA || item.GIABAN || 0);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>{ten}</td>
                            <td style={{ textAlign: 'center' }}>{sl}</td>
                            <td style={{ textAlign: 'right' }}>{gia.toLocaleString()}đ</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(sl * gia).toLocaleString()}đ</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '16px' }}>
                Tổng cộng thanh toán: <b style={{ color: '#b45309', fontSize: '18px' }}>
                  {Number(selectedOrder.TONGTIEN || selectedOrder.TONG_TIEN || 0).toLocaleString()}đ
                </b>
              </div>
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminOnlineOrderPage;
