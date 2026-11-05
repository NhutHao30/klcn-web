import React, { useState, useEffect } from 'react';
import Header from '../Layout/Header';
import Footer from '../Layout/Footer';
import { getMyOrders, getMyOrderDetails, getGhnTrackingDetail } from '../services/invoiceService';
import { useToast } from '../components/Toast/Toast';
import { formatImageUrl } from '../utils/imageUtils';

const CANCEL_REASONS = [
  "Không còn nhu cầu mua hàng.",
  "Muốn thay đổi sản phẩm hoặc số lượng.",
  "Muốn áp dụng voucher khác.",
  "Đặt nhầm sản phẩm.",
  "Muốn đổi địa chỉ nhận hàng.",
  "Thời gian giao hàng quá lâu.",
  "Tìm được sản phẩm phù hợp hơn.",
  "Lý do khác"
];

const RETURN_REASONS = [
  "Bánh bị hỏng hóc, dập nát, biến dạng khi vận chuyển",
  "Giao sai mẫu mã, chủng loại hoặc kích thước bánh",
  "Bánh có dấu hiệu không đảm bảo chất lượng / cận hạn sử dụng",
  "Giao thiếu sản phẩm hoặc phụ kiện đi kèm",
  "Lý do khác (vui lòng mô tả chi tiết)"
];

const REFUND_BANKS = [
  { id: 'VCB', name: 'Vietcombank (Ngoại thương VN)' },
  { id: 'VIKKI', name: 'Vikki (Ngân hàng số Vikki)' },
  { id: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { id: 'TCB', name: 'Techcombank (Kỹ thương VN)' },
  { id: 'BIDV', name: 'BIDV (Đầu tư & Phát triển VN)' },
  { id: 'CTG', name: 'VietinBank (Công thương VN)' },
  { id: 'ACB', name: 'ACB (Á Châu)' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)' },
  { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)' },
  { id: 'HDB', name: 'HDBank (Phát triển TP.HCM)' },
  { id: 'VIB', name: 'VIB (Quốc Tế)' },
  { id: 'MSB', name: 'MSB (Hàng Hải)' },
  { id: 'SHB', name: 'SHB (Sài Gòn - Hà Nội)' },
  { id: 'OCB', name: 'OCB (Phương Đông)' },
  { id: 'MOMO', name: 'Ví Điện Tử MoMo' },
  { id: 'OTHER', name: 'Ngân hàng khác' }
];

const MyOrdersPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  // Cancellation States
  const [cancelReason, setCancelReason] = useState("");
  const [cancelNote, setCancelNote] = useState("");
  const [refundBank, setRefundBank] = useState("MB");
  const [refundAccountNo, setRefundAccountNo] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Return & Refund States
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnNote, setReturnNote] = useState("");
  const [returnProofFile, setReturnProofFile] = useState(null);
  const [returnProofPreview, setReturnProofPreview] = useState(null);
  const [returnBank, setReturnBank] = useState("MB");
  const [returnAccountNo, setReturnAccountNo] = useState("");
  const [returnAccountName, setReturnAccountName] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Review states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewingProduct, setReviewingProduct] = useState(null);

  // GHN Tracking states
  const [trackingOrderCode, setTrackingOrderCode] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [isTrackingLoading, setIsTrackingLoading] = useState(false);

  // Lightbox modal state for receipt proof preview
  const [previewReceiptModalUrl, setPreviewReceiptModalUrl] = useState(null);

  const handleFetchTracking = async (code) => {
    setTrackingOrderCode(code);
    setIsTrackingLoading(true);
    try {
      const res = await getGhnTrackingDetail(code);
      setTrackingData(res?.data || null);
      const freshOrders = await getMyOrders();
      setOrders(freshOrders);
      if (viewingOrder) {
        const updated = freshOrders.find(o => o.maHD === viewingOrder.maHD || o.id === viewingOrder.id);
        if (updated) setViewingOrder(updated);
      }
    } catch (e) {
      toast.error("Không thể kết nối dịch vụ tra cứu GHN");
    } finally {
      setIsTrackingLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getMyOrders();
        setOrders(data);
      } catch (error) {
        if (error.response?.status === 401) {
          toast.warning('Vui lòng đăng nhập để xem đơn hàng của bạn!');
          if (window.location.pathname !== '/dang-nhap') {
            window.location.href = '/dang-nhap';
          }
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
    setCancelReason("");
    setCancelNote("");
    setIsDetailModalOpen(true);
    setIsDetailsLoading(true);
    try {
      const details = await getMyOrderDetails(order.maHD);
      setOrderDetails(details);
      // Tự động làm mới đơn hàng để cập nhật số lượng và tổng tiền chuẩn xác nhất sau khi nhân viên chỉnh sửa
      const freshOrders = await getMyOrders();
      setOrders(freshOrders);
      const freshOrder = freshOrders.find(o => o.maHD === order.maHD || o.id === order.id);
      if (freshOrder) {
        setViewingOrder(freshOrder);
      }
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
    setIsReviewModalOpen(false);
    setCancelReason("");
    setCancelNote("");
  };

  const openReviewModal = (product = null) => {
    setReviewingProduct(product);
    setIsReviewModalOpen(true);
    if (product && product.daDanhGia) {
      setReviewRating(product.soSao || 5);
      setReviewComment(product.noiDung || "");
    } else {
      setReviewRating(5);
      setReviewComment("");
    }
    setReviewImage(null);
  };

  const closeReviewModal = () => {
    setIsReviewModalOpen(false);
    setReviewingProduct(null);
  };

  const submitReview = async () => {
    if (!reviewRating) {
      toast.warning("Vui lòng chọn số sao đánh giá!");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append('MAHD', viewingOrder.maHD || viewingOrder.id || viewingOrder.maDonHang);
      formData.append('donHangId', viewingOrder.id || viewingOrder.maHD || viewingOrder.maDonHang);
      if (reviewingProduct) {
        formData.append('sanPhamId', reviewingProduct.sanPhamId || reviewingProduct.id);
        formData.append('MASP', reviewingProduct.maSP || reviewingProduct.sanPhamId);
      }
      formData.append('SO_SAO', reviewRating);
      formData.append('so_sao', reviewRating);
      formData.append('NOI_DUNG', reviewComment || '');
      formData.append('noi_dung', reviewComment || '');
      if (reviewImage) {
        formData.append('image', reviewImage);
      }

      const m = await import('../services/axiosClient.js');
      const res = await m.default.post('/reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(res.data.message || "Đánh giá sản phẩm thành công!");
      closeReviewModal();
      
      const details = await getMyOrderDetails(viewingOrder.maHD);
      setOrderDetails(details);
    } catch (e) {
      toast.error(e.response?.data?.message || e.response?.data?.error || "Có lỗi xảy ra khi đánh giá");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Hủy đơn hàng với lý do đã chọn (Chỉ cho phép khi đơn hàng CHƯA THANH TOÁN)
  const handleCancelOrder = async () => {
    if (!cancelReason) {
      toast.warning("Vui lòng chọn 1 trong các lý do hủy đơn!");
      return;
    }

    if (Number(viewingOrder?.trangThaiThanhToan) === 1) {
      toast.warning("Đơn hàng đã thanh toán không thể hủy trực tiếp. Quý khách vui lòng nhận hàng hoặc yêu cầu Trả hàng & Hoàn tiền theo chính sách!");
      return;
    }

    const confirmMsg = `Bạn có chắc chắn muốn hủy đơn hàng #${viewingOrder.maHD} không?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsCancelling(true);
    try {
      const m = await import('../services/axiosClient.js');
      const res = await m.default.post(`/my-orders/${viewingOrder.maHD}/cancel`, {
        lyDoHuy: cancelReason,
        ghiChuHuy: cancelNote,
      });

      toast.success(res.data.message || "Đã hủy đơn hàng thành công!");

      const updated = {
        ...viewingOrder,
        trangThai: 'Đã hủy',
        trangThaiDonHang: 0,
        lyDoHuy: cancelReason,
        ghiChuHuy: cancelNote
      };
      setViewingOrder(updated);
      setOrders(orders.map(o => (o.maHD === viewingOrder.maHD || o.id === viewingOrder.id) ? updated : o));
    } catch (error) {
      toast.error(error.response?.data?.error || "Có lỗi xảy ra khi hủy đơn hàng.");
    } finally {
      setIsCancelling(false);
    }
  };

  // Mở modal yêu cầu hoàn trả
  const handleOpenReturnModal = () => {
    setReturnReason(RETURN_REASONS[0]);
    setReturnNote("");
    setReturnProofFile(null);
    setReturnProofPreview(null);
    setReturnBank("MB");
    setReturnAccountNo("");
    setReturnAccountName(viewingOrder?.hoTenKH || viewingOrder?.tenKH || "");
    setIsReturnModalOpen(true);
  };

  // Khách gửi yêu cầu trả hàng & hoàn tiền
  const handleSubmitReturn = async () => {
    if (!returnReason) {
      toast.warning("Vui lòng chọn lý do trả hàng!");
      return;
    }
    if (!returnNote.trim()) {
      toast.warning("Vui lòng nhập mô tả chi tiết tình trạng bánh hỏng / lý do hoàn!");
      return;
    }

    const isPaid = Number(viewingOrder?.trangThaiThanhToan) === 1 || 
      viewingOrder?.phuongThucTT?.includes('Chuyển khoản') || 
      viewingOrder?.phuongThucTT?.includes('MoMo') || 
      viewingOrder?.phuongThucTT?.includes('VietQR');

    if (isPaid) {
      if (!returnAccountNo.trim()) {
        toast.warning("Vui lòng nhập Số tài khoản ngân hàng để nhận tiền hoàn!");
        return;
      }
      if (!returnAccountName.trim()) {
        toast.warning("Vui lòng nhập Tên chủ tài khoản người nhận tiền hoàn!");
        return;
      }
    }

    setIsSubmittingReturn(true);
    try {
      const formData = new FormData();
      formData.append('lyDoHoanTra', returnReason);
      formData.append('ghiChuHoanTra', returnNote.trim());
      formData.append('nganHangHoanTien', returnBank);
      formData.append('soTaiKhoanHoanTien', returnAccountNo.trim());
      formData.append('tenNguoiNhanHoanTien', returnAccountName.trim().toUpperCase());
      if (returnProofFile) {
        formData.append('hinhAnhHoanTra', returnProofFile);
      }

      const m = await import('../services/axiosClient.js');
      const res = await m.default.post(`/my-orders/${viewingOrder.maHD}/request-return`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success(res.data.message || "Đã gửi yêu cầu Trả hàng & Hoàn tiền thành công!");
      setIsReturnModalOpen(false);
      
      const updatedOrder = {
        ...viewingOrder,
        trangThai: 'Yêu cầu hoàn trả',
        trangThaiDonHang: 8,
        trangThaiHoanHang: 'CHO_DUYET',
        lyDoHoanTra: returnReason,
        ghiChuHoanTra: returnNote.trim(),
        nganHangHoanTien: returnBank,
        soTaiKhoanHoanTien: returnAccountNo.trim(),
        tenNguoiNhanHoanTien: returnAccountName.trim().toUpperCase(),
        trangThaiThanhToan: isPaid ? 2 : viewingOrder.trangThaiThanhToan,
        trangThaiHoanTien: isPaid ? 'CHO_HOAN_TIEN' : null,
      };
      setViewingOrder(updatedOrder);
      setOrders(orders.map(o => (o.maHD === viewingOrder.maHD || o.id === viewingOrder.id) ? updatedOrder : o));
    } catch (err) {
      toast.error(err.response?.data?.error || "Có lỗi xảy ra khi gửi yêu cầu hoàn trả.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Đã hoàn thành':
        return { backgroundColor: '#e6f4ea', color: '#1e8e3e', border: '1px solid #1e8e3e' };
      case 'Chờ xử lý':
      case 'Chờ xác nhận':
        return { backgroundColor: '#fef7e0', color: '#f29900', border: '1px solid #f29900' };
      case 'Đang chuẩn bị':
      case 'Chờ lấy hàng':
        return { backgroundColor: '#fffbe6', color: '#d97706', border: '1px solid #d97706' };
      case 'Đã hủy':
        return { backgroundColor: '#fce8e6', color: '#d93025', border: '1px solid #d93025' };
      case 'Đang giao':
        return { backgroundColor: '#e8f0fe', color: '#1a73e8', border: '1px solid #1a73e8' };
      case 'Yêu cầu hoàn trả':
      case 'Yêu cầu trả hàng':
        return { backgroundColor: '#f3e8ff', color: '#7e22ce', border: '1px solid #c084fc' };
      case 'Đã hoàn hàng':
        return { backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc' };
      default:
        return { backgroundColor: '#f1f3f4', color: '#5f6368', border: '1px solid #5f6368' };
    }
  };

  // Đơn hàng chỉ được hủy khi trạng thái là đang xử lý VÀ CHƯA THANH TOÁN
  const isCancellable = viewingOrder && 
    (viewingOrder.trangThaiDonHang === 1 || viewingOrder.trangThaiDonHang === 2 || viewingOrder.trangThaiDonHang === 7 || 
     ['Chờ xử lý', 'Chờ xác nhận', 'Đang chuẩn bị', 'Chờ lấy hàng'].includes(viewingOrder.trangThai)) &&
    !['Đang giao', 'Đã hoàn thành', 'Đã hủy', 'Đã hoàn hàng', 'Yêu cầu hoàn trả'].includes(viewingOrder.trangThai) &&
    Number(viewingOrder.trangThaiThanhToan) === 0;

  // Đơn hàng đang xử lý nhưng ĐÃ THANH TOÁN -> Khóa hủy, hướng dẫn hoàn hàng
  const isProcessingPaid = viewingOrder && 
    (viewingOrder.trangThaiDonHang === 1 || viewingOrder.trangThaiDonHang === 2 || viewingOrder.trangThaiDonHang === 7 || 
     ['Chờ xử lý', 'Chờ xác nhận', 'Đang chuẩn bị', 'Chờ lấy hàng'].includes(viewingOrder.trangThai)) &&
    !['Đang giao', 'Đã hoàn thành', 'Đã hủy', 'Đã hoàn hàng', 'Yêu cầu hoàn trả'].includes(viewingOrder.trangThai) &&
    Number(viewingOrder.trangThaiThanhToan) === 1;

  // Đơn hàng có thể yêu cầu trả hàng & hoàn tiền (Đã giao đến khách)
  const isReturnable = viewingOrder && 
    (viewingOrder.trangThaiDonHang === 4 || viewingOrder.trangThaiDonHang === 5 || ['Đã hoàn thành', 'Đã giao'].includes(viewingOrder.trangThai)) &&
    !viewingOrder.trangThaiHoanHang &&
    viewingOrder.trangThaiDonHang !== 6 &&
    viewingOrder.trangThaiDonHang !== 8;

  return (
    <>
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
                    <a href="/san-pham" style={{ color: 'var(--primary-color)', textDecoration: 'underline', marginTop: '10px', display: 'inline-block' }}>Tiếp tục mua sắm</a>
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
                            <td style={{ padding: '16px 12px', fontWeight: '500' }}>{order.tenCuaHang || 'Givral Bakery'}</td>
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
        <div style={modalOverlayStyle} onClick={closeModal}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '14px', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', color: '#222', fontWeight: '700' }}>
                Chi tiết đơn hàng #{viewingOrder.maHD}
              </h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>
                &times;
              </button>
            </div>
            
            {/* Khối Header tóm tắt đơn */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', backgroundColor: '#faf8f5', padding: '14px 16px', borderRadius: '6px', border: '1px solid #f0eae1' }}>
              <div style={{ fontSize: '13px', color: '#444' }}>
                <p style={{ margin: '0 0 6px 0' }}><strong>Ngày đặt:</strong> {viewingOrder.ngayLap}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Tiếp nhận bởi:</strong> <span style={{ color: '#c89968', fontWeight: '700' }}>{viewingOrder.tenCuaHang || 'Givral Bakery'}</span></p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Ghi chú:</strong> {viewingOrder.ghiChu || 'Không có'}</p>
                <p style={{ margin: '0 0 6px 0' }}><strong>Vận chuyển:</strong> {viewingOrder.donViVanChuyen || 'Giao hàng tiêu chuẩn'}</p>
                {viewingOrder.maVanDon && (
                  <p style={{ margin: 0 }}>
                    <strong>Mã vận đơn:</strong> <span style={{ color: '#d82d8b', fontWeight: 'bold' }}>{viewingOrder.maVanDon}</span>
                    <button
                      type="button"
                      onClick={() => handleFetchTracking(viewingOrder.maVanDon)}
                      style={{ marginLeft: '10px', fontSize: '12px', color: '#fff', backgroundColor: '#d82d8b', padding: '2px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                      🚚 Tra cứu GHN
                    </button>
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Trạng thái:</div>
                <span style={{ 
                  display: 'inline-block',
                  padding: '4px 12px', 
                  borderRadius: '20px', 
                  fontSize: '13px', 
                  fontWeight: '600',
                  ...getStatusBadgeStyle(viewingOrder.trangThai || 'Chờ xử lý')
                }}>
                  {viewingOrder.trangThai || 'Chờ xử lý'}
                </span>
              </div>
            </div>

            {/* Bổ sung Thông tin khách hàng và Thông tin thanh toán (2 Cột chuẩn theo hình mẫu) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#fcfcfc', border: '1px solid #eee', padding: '16px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
              {/* Cột 1: Thông tin khách hàng */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333', fontWeight: '700' }}>
                  Thông tin khách hàng
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#555' }}>
                  <div>
                    <span style={{ color: '#888' }}>Họ tên:</span>
                    <div style={{ fontWeight: '600', color: '#222' }}>
                      {viewingOrder.hoTenKH || viewingOrder.tenKH || viewingOrder.khach_hang?.HOTEN || 'Khách Hàng'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Số điện thoại:</span>
                    <div style={{ fontWeight: '600', color: '#222' }}>
                      {viewingOrder.sdtKH || viewingOrder.SDT || viewingOrder.khach_hang?.SDT || '0987654320'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Ngày đặt:</span>
                    <div style={{ color: '#333' }}>{viewingOrder.ngayLap}</div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Chi nhánh:</span>
                    <div style={{ color: '#333', fontWeight: '500' }}>{viewingOrder.tenCuaHang || 'Dola Bakery'}</div>
                  </div>
                </div>
              </div>

              {/* Cột 2: Giao hàng và thanh toán */}
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333', fontWeight: '700' }}>
                  Giao hàng và thanh toán
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#555' }}>
                  <div>
                    <span style={{ color: '#888' }}>Địa chỉ:</span>
                    <div style={{ fontWeight: '500', color: '#222' }}>
                      {viewingOrder.diaChiGiao || viewingOrder.diaChiGiaoHang || viewingOrder.DIACHI_GIAO || 'Nhận tại cửa hàng'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Phương thức:</span>
                    <div style={{ fontWeight: '500', color: '#222' }}>
                      {viewingOrder.phuongThucTT || viewingOrder.PHUONGTHUCTHANHTOAN || 'COD — thanh toán khi nhận hàng'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Khách thanh toán:</span>
                    <div style={{ color: '#333' }}>
                      {viewingOrder.trangThaiThanhToan === 1 ? 'Đã thanh toán' : 'Thanh toán khi nhận hàng'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>Ghi chú đơn hàng:</span>
                    <div style={{ color: '#666' }}>
                      {viewingOrder.ghiChu && viewingOrder.ghiChu !== 'Không có' ? viewingOrder.ghiChu : 'Không có ghi chú'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Thông báo nếu đơn hàng đã bị hủy */}
            {(viewingOrder.lyDoHuy || viewingOrder.trangThai === 'Đã hủy' || viewingOrder.trangThaiDonHang === 0) && (
              <div style={{ marginBottom: '18px', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '6px' }}>
                <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-circle-xmark"></i> ĐƠN HÀNG ĐÃ ĐƯỢC HỦY
                </div>
                <div style={{ fontSize: '13px', color: '#991b1b', marginTop: '6px' }}>
                  <b>Lý do hủy:</b> {viewingOrder.lyDoHuy || "Khách hàng không còn nhu cầu"}
                </div>
                {viewingOrder.ghiChuHuy && (
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '4px', fontStyle: 'italic' }}>
                    <b>Ghi chú:</b> {viewingOrder.ghiChuHuy}
                  </div>
                )}

                {/* Thông tin hoàn tiền nếu có */}
                {(viewingOrder.nganHangHoanTien || viewingOrder.trangThaiThanhToan === 2 || viewingOrder.trangThaiThanhToan === 3 || viewingOrder.trangThaiHoanTien) && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed #fca5a5', fontSize: '12px', color: '#7f1d1d' }}>
                    <div style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', marginBottom: '4px' }}>
                      <i className="fa-solid fa-money-bill-transfer"></i> TIẾN TRÌNH HOÀN TIỀN:
                    </div>
                    {viewingOrder.nganHangHoanTien && (
                      <div>
                        <b>Tài khoản nhận hoàn:</b> {viewingOrder.nganHangHoanTien} — STK: <b>{viewingOrder.soTaiKhoanHoanTien}</b> ({viewingOrder.tenNguoiNhanHoanTien})
                      </div>
                    )}
                    <div style={{ marginTop: '4px' }}>
                      <b>Trạng thái: </b>
                      {(viewingOrder.trangThaiThanhToan === 3 || viewingOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') ? (
                        <div style={{ marginTop: '4px' }}>
                          <span style={{ color: '#16a34a', fontWeight: '700' }}>
                            ✓ Đã hoàn tiền thành công {viewingOrder.ngayHoanTien ? `ngày ${viewingOrder.ngayHoanTien}` : ''}
                          </span>
                          <div style={{ marginTop: '4px', color: '#15803d' }}>
                            <b>Số tiền hoàn: </b> 
                            <span style={{ fontWeight: 'bold' }}>
                              {Number(viewingOrder.soTienHoan || viewingOrder.tongTien).toLocaleString('vi-VN')} đ
                            </span>
                            {viewingOrder.maGiaoDichHoanTien && (
                              <span style={{ marginLeft: '10px' }}>
                                (Mã GD: <code>{viewingOrder.maGiaoDichHoanTien}</code>)
                              </span>
                            )}
                          </div>
                          {viewingOrder.ghiChuHoanTien && (
                            <div style={{ marginTop: '2px', fontStyle: 'italic', color: '#4b5563' }}>
                              Ghi chú: {viewingOrder.ghiChuHoanTien}
                            </div>
                          )}
                          {viewingOrder.minhChungHoanTien && (
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type="button"
                                onClick={() => setPreviewReceiptModalUrl(formatImageUrl(viewingOrder.minhChungHoanTien))}
                                style={{
                                  padding: '5px 12px',
                                  backgroundColor: '#dcfce7',
                                  border: '1px solid #86efac',
                                  borderRadius: '4px',
                                  color: '#166534',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <i className="fa-solid fa-receipt"></i> 📸 Xem biên lai hoàn tiền từ cửa hàng
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: '#d97706', fontWeight: '700' }}>
                          ⏳ Đang chờ bộ phận Kế toán chuyển khoản hoàn tiền ({Number(viewingOrder.tongTien).toLocaleString('vi-VN')} đ)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Minh chứng chuyển khoản (nếu có) */}
            {viewingOrder.minhChungThanhToan && (
              <div style={{ marginBottom: '18px', padding: '10px 14px', backgroundColor: '#f0fdf4', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#166534', marginBottom: '6px' }}>
                  📷 Minh chứng thanh toán chuyển khoản:
                </div>
                <div 
                  onClick={() => setPreviewReceiptModalUrl(formatImageUrl(viewingOrder.minhChungThanhToan))}
                  style={{ cursor: 'pointer', display: 'inline-block' }}
                  title="Nhấp để xem phóng to toàn màn hình"
                >
                  <img 
                    src={formatImageUrl(viewingOrder.minhChungThanhToan)} 
                    alt="Minh chứng thanh toán" 
                    style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1.5px solid #16a34a', backgroundColor: '#fff' }} 
                  />
                </div>
              </div>
            )}

            {/* Phần Thao tác Hủy Đơn / Khóa Hủy & Danh sách Sản phẩm */}
            <div style={{ display: 'grid', gridTemplateColumns: (isCancellable || isProcessingPaid) ? '310px 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>
              {/* 1. Khối Hủy Đơn Hàng (Chỉ hiển thị khi đơn đang xử lý VÀ CHƯA THANH TOÁN) */}
              {isCancellable && (
                <div style={{
                  backgroundColor: '#fff',
                  border: '1.5px solid #fecaca',
                  borderRadius: '6px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#dc2626', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    Hủy đơn hàng này
                  </div>

                  <div style={{ marginBottom: '12px', fontSize: '11px', color: '#666', lineHeight: '1.4' }}>
                    Đơn hàng chưa thanh toán. Bạn có thể hủy đơn nếu muốn thay đổi sản phẩm hoặc địa chỉ.
                  </div>
                  
                  {/* Dropdown chọn lý do hủy */}
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '2px' }}>Lý do hủy (*):</label>
                    <select
                      value={cancelReason}
                      onChange={e => setCancelReason(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        border: '1px solid #dcd6ce',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: '#fff',
                        outline: 'none',
                        color: cancelReason ? '#222' : '#888'
                      }}
                    >
                      <option value="">-- Chọn lý do hủy --</option>
                      {CANCEL_REASONS.map((r, i) => (
                        <option key={i} value={r} style={{ color: '#222' }}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Textarea ghi chú bổ sung */}
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '2px' }}>Ghi chú thêm:</label>
                    <textarea
                      placeholder="Nội dung bổ sung (tùy chọn)..."
                      value={cancelNote}
                      onChange={e => setCancelNote(e.target.value)}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        border: '1px solid #dcd6ce',
                        borderRadius: '4px',
                        fontSize: '12px',
                        resize: 'none',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Nút hủy đơn hàng màu đỏ */}
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={isCancelling}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      backgroundColor: isCancelling ? '#b91c1c' : '#dc3545',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: isCancelling ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 2px 4px rgba(220,53,69,0.3)'
                    }}
                  >
                    {isCancelling ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-ban"></i>
                        <span>Xác nhận hủy đơn hàng</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* 2. Khối Khóa Hủy khi đơn ĐÃ THANH TOÁN */}
              {isProcessingPaid && (
                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1.5px solid #fde68a',
                  borderRadius: '6px',
                  padding: '16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#b45309', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-shield-halved"></i>
                    Đơn hàng đã thanh toán
                  </div>
                  <p style={{ fontSize: '12px', color: '#78350f', lineHeight: '1.5', margin: 0 }}>
                    Đơn hàng này đã được thanh toán (<b>{Number(viewingOrder.tongTien).toLocaleString('vi-VN')} đ</b>) và đang trong quy trình chế biến / đóng gói. Theo quy định hệ thống, <b>không thể hủy đơn trực tiếp</b>.
                  </p>
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#92400e', backgroundColor: '#fef3c7', padding: '8px 10px', borderRadius: '4px', lineHeight: '1.4' }}>
                    💡 Sau khi nhận bánh, nếu có bất kỳ hỏng hóc hoặc sự cố nào, quý khách có thể gửi <b>Yêu cầu Trả hàng & Hoàn tiền</b> (trong vòng 3 ngày) để được nhân viên chuyển khoản hoàn tiền.
                  </div>
                </div>
              )}

              {/* Bảng Danh sách Bánh trong đơn */}
              <div>
                {/* Trạng thái & Nút Yêu cầu Trả hàng & Hoàn tiền */}
                {isReturnable && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ fontWeight: '700', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <i className="fa-solid fa-box-open"></i> Đơn hàng đã giao thành công
                      </div>
                      <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
                        Bánh có sự cố hoặc bị hỏng hóc? Bạn có thể yêu cầu đổi trả & hoàn tiền trong vòng 3 ngày.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleOpenReturnModal}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#ea580c',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="fa-solid fa-rotate-left"></i> Yêu cầu Trả hàng & Hoàn tiền
                    </button>
                  </div>
                )}

                {viewingOrder.trangThaiDonHang === 8 && (
                  <div style={{
                    backgroundColor: '#faf5ff',
                    border: '1.5px solid #d8b4fe',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#7e22ce', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <i className="fa-solid fa-clock-rotate-left"></i> Đang chờ cửa hàng xét duyệt Yêu cầu Trả hàng & Hoàn tiền
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b21a8', lineHeight: '1.5' }}>
                      <div>• <b>Lý do:</b> {viewingOrder.lyDoHoanTra}</div>
                      {viewingOrder.ghiChuHoanTra && <div>• <b>Mô tả:</b> {viewingOrder.ghiChuHoanTra}</div>}
                      {viewingOrder.nganHangHoanTien && (
                        <div>• <b>Tài khoản nhận tiền:</b> {viewingOrder.nganHangHoanTien} - {viewingOrder.soTaiKhoanHoanTien} ({viewingOrder.tenNguoiNhanHoanTien})</div>
                      )}
                    </div>
                  </div>
                )}

                {viewingOrder.trangThaiDonHang === 6 && (
                  <div style={{
                    backgroundColor: '#ecfeff',
                    border: '1.5px solid #a5f3fc',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#0e7490', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-check"></i> Đơn hàng đã được duyệt Hoàn trả & Hoàn tiền thành công
                    </div>
                    {viewingOrder.ghiChuHoanTien && (
                      <div style={{ fontSize: '12px', color: '#155e75', marginTop: '4px' }}>
                        Ghi chú nhân viên: {viewingOrder.ghiChuHoanTien}
                      </div>
                    )}
                  </div>
                )}

                {viewingOrder.trangThaiHoanHang === 'TU_CHOI' && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1.5px solid #fecaca',
                    borderRadius: '6px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontWeight: '700', color: '#b91c1c', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <i className="fa-solid fa-circle-xmark"></i> Yêu cầu trả hàng đã bị từ chối
                    </div>
                    <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '4px' }}>
                      Lý do: {viewingOrder.lyDoTuChoiHoanTra || 'Sản phẩm không đáp ứng điều kiện đổi trả theo quy định.'}
                    </div>
                  </div>
                )}
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#444', marginBottom: '10px' }}>
                  Danh sách sản phẩm:
                </div>
                {isDetailsLoading ? (
                  <p style={{ textAlign: 'center', padding: '20px', color: '#888' }}>Đang tải chi tiết...</p>
                ) : (
                  <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#faf8f5', borderBottom: '1px solid #eee' }}>
                          <th style={{ padding: '8px 10px', textAlign: 'left', color: '#555' }}>Sản phẩm</th>
                          <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555' }}>SL</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555' }}>Đơn giá</th>
                          <th style={{ padding: '8px 10px', textAlign: 'right', color: '#555' }}>Thành tiền</th>
                          {(viewingOrder.trangThai === 'Đã hoàn thành' || viewingOrder.trangThaiDonHang === 4 || viewingOrder.trangThaiDonHang === 5) && (
                            <th style={{ padding: '8px 10px', textAlign: 'center', color: '#555', width: '130px' }}>Đánh giá</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: idx === orderDetails.length - 1 ? 'none' : '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>
                              <div style={{ fontWeight: '600', color: '#333' }}>{item.tenSP}</div>
                              <div style={{ fontSize: '11px', color: '#888' }}>#{item.maSP}</div>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.soLuong}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{Number(item.donGia).toLocaleString('vi-VN')} đ</td>
                            <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>{Number(item.thanhTien).toLocaleString('vi-VN')} đ</td>
                            {(viewingOrder.trangThai === 'Đã hoàn thành' || viewingOrder.trangThaiDonHang === 4 || viewingOrder.trangThaiDonHang === 5) && (
                              <td style={{ padding: '10px', textAlign: 'center' }}>
                                {item.daDanhGia ? (
                                  <div>
                                    <div style={{ fontSize: '12px', color: '#f39c12', fontWeight: '700' }}>
                                      {item.soSao || 5} ⭐
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => openReviewModal(item)}
                                      style={{ marginTop: '2px', padding: '2px 8px', fontSize: '11px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', color: '#555' }}
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openReviewModal(item)}
                                    style={{ padding: '5px 10px', fontSize: '12px', backgroundColor: '#f39c12', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <i className="fa-solid fa-star"></i> Đánh giá
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tóm tắt tiền đơn hàng */}
                {(() => {
                  const calculatedSubtotal = orderDetails && orderDetails.length > 0 
                    ? orderDetails.reduce((sum, item) => sum + (Number(item.thanhTien) || (Number(item.donGia || item.price || 0) * Number(item.soLuong || item.quantity || 0))), 0)
                    : null;
                  const displaySubtotal = calculatedSubtotal !== null 
                    ? calculatedSubtotal 
                    : Number(viewingOrder.tongTienHang || (viewingOrder.tongTien - (viewingOrder.phiVanChuyen || 0) + (viewingOrder.soTienGiam || 0)));
                  const displayTotal = calculatedSubtotal !== null 
                    ? Math.max(0, calculatedSubtotal + Number(viewingOrder.phiVanChuyen || 0) - Number(viewingOrder.soTienGiam || 0)) 
                    : Number(viewingOrder.tongTien);

                  return (
                    <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', gap: '40px', color: '#555' }}>
                        <span>Tiền hàng:</span>
                        <span>{Number(displaySubtotal).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div style={{ display: 'flex', gap: '40px', color: '#555' }}>
                        <span>Phí vận chuyển:</span>
                        <span>{Number(viewingOrder.phiVanChuyen || 0).toLocaleString('vi-VN')} đ</span>
                      </div>
                      {Number(viewingOrder.soTienGiam) > 0 && (
                        <div style={{ display: 'flex', gap: '40px', color: '#15803d', fontWeight: '600' }}>
                          <span>Voucher giảm giá:</span>
                          <span>-{Number(viewingOrder.soTienGiam).toLocaleString('vi-VN')} đ</span>
                        </div>
                      )}
                      <div style={{ borderTop: '1px solid #eee', width: '220px', margin: '4px 0' }}></div>
                      <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#222' }}>Tổng thanh toán:</span>
                        <span style={{ color: '#c89968', fontSize: '18px', fontWeight: '700' }}>
                          {Number(displayTotal).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Chức năng đánh giá đơn hàng (khi đã hoàn thành) */}
            {viewingOrder.trangThai === 'Đã hoàn thành' && (
              <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee', textAlign: 'right' }}>
                {orderDetails.some(item => item.daDanhGia) ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#e6f4ea', borderRadius: '6px', border: '1px solid #1e8e3e' }}>
                    <i className="fa-solid fa-circle-check" style={{ color: '#1e8e3e' }}></i>
                    <span style={{ fontSize: '13px', color: '#1e8e3e', fontWeight: '600' }}>Đã đánh giá ({orderDetails.find(item => item.daDanhGia)?.soSao || 5} ⭐)</span>
                    <button
                      onClick={openReviewModal}
                      style={{ marginLeft: '6px', padding: '3px 10px', fontSize: '11px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Sửa đánh giá
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={openReviewModal}
                    style={{ padding: '8px 16px', background: '#f39c12', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-star"></i> Đánh giá đơn hàng
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Đánh giá đơn hàng */}
      {isReviewModalOpen && viewingOrder && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }} onClick={closeReviewModal}>
          <div style={{ ...modalStyle, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#333' }}>
                ⭐ {reviewingProduct ? `Đánh giá: ${reviewingProduct.tenSP}` : `Đánh giá đơn hàng #${viewingOrder.maHD}`}
              </h3>
              <button onClick={closeReviewModal} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '15px', padding: '10px 14px', backgroundColor: '#f9f9f9', borderRadius: '6px', border: '1px solid #eee' }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 6px 0', fontSize: '13px', color: '#555' }}>Sản phẩm trong đơn hàng:</p>
              {orderDetails.map((item, idx) => (
                <div key={idx} style={{ fontSize: '13px', color: '#333', marginBottom: '3px' }}>
                  • {item.tenSP} <span style={{ color: '#888' }}>x{item.soLuong}</span>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Chất lượng sản phẩm</label>
              <div style={{ display: 'flex', gap: '5px', fontSize: '26px', cursor: 'pointer' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <i 
                    key={star} 
                    className={star <= reviewRating ? "fa-solid fa-star" : "fa-regular fa-star"} 
                    style={{ color: '#f39c12' }}
                    onClick={() => setReviewRating(star)}
                  ></i>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>Nhận xét</label>
              <textarea 
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', minHeight: '70px', resize: 'vertical', fontSize: '13px' }}
                placeholder="Hãy chia sẻ nhận xét của bạn về món bánh này nhé..."
              ></textarea>
            </div>

            {/* Upload ảnh thực tế của bánh */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px' }}>
                <i className="fa-solid fa-camera" style={{ marginRight: '6px', color: '#7a5230' }}></i>
                Ảnh chụp thực tế sản phẩm (tùy chọn)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) setReviewImage(f);
                }}
                style={{ fontSize: '12px', width: '100%' }}
              />
              {reviewImage && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img
                    src={URL.createObjectURL(reviewImage)}
                    alt="Review preview"
                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <button
                    type="button"
                    onClick={() => setReviewImage(null)}
                    style={{ fontSize: '11px', color: '#c5221f', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Xóa ảnh
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closeReviewModal} style={{ padding: '8px 16px', background: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
              <button 
                onClick={submitReview} 
                disabled={isSubmittingReview}
                style={{ padding: '8px 16px', background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: isSubmittingReview ? 0.7 : 1, fontWeight: 'bold' }}
              >
                {isSubmittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tra cứu hành trình GHN */}
      {trackingOrderCode && (
        <div style={{ ...modalOverlayStyle, zIndex: 1200 }} onClick={() => setTrackingOrderCode(null)}>
          <div style={{ ...modalStyle, maxWidth: '560px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#333' }}>🚚 Hành Trình Vận Chuyển GHN #{trackingOrderCode}</h3>
              <button onClick={() => setTrackingOrderCode(null)} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>

            {isTrackingLoading ? (
              <div style={{ textAlign: 'center', padding: '30px' }}>
                <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', color: '#d82d8b', marginBottom: '10px' }}></i>
                <p style={{ margin: 0, color: '#666' }}>Đang tra cứu từ GHN API...</p>
              </div>
            ) : trackingData ? (
              <div>
                <div style={{ padding: '10px', backgroundColor: '#fdf2f8', borderRadius: '6px', border: '1px solid #fbcfe8', marginBottom: '15px', fontSize: '13px' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Mã vận đơn:</strong> {trackingData.order_code}</p>
                  <p style={{ margin: '0 0 4px 0' }}><strong>Trạng thái:</strong> <span style={{ color: '#d82d8b', fontWeight: 'bold' }}>{trackingData.status_name || trackingData.status}</span></p>
                  <p style={{ margin: 0 }}><strong>Dự kiến giao:</strong> {trackingData.leadtime ? new Date(trackingData.leadtime * 1000).toLocaleString('vi-VN') : 'Đang cập nhật'}</p>
                </div>
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#888', padding: '20px' }}>Chưa có thông tin vận đơn GHN.</p>
            )}

            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button onClick={() => setTrackingOrderCode(null)} style={{ padding: '8px 18px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Yêu Cầu Trả Hàng & Hoàn Tiền */}
      {isReturnModalOpen && viewingOrder && (
        <div style={{ ...modalOverlayStyle, zIndex: 1100 }} onClick={() => setIsReturnModalOpen(false)}>
          <div style={{ ...modalStyle, maxWidth: '540px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', color: '#b45309', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-rotate-left"></i>
                Yêu Cầu Trả Hàng & Hoàn Tiền #{viewingOrder.maHD}
              </h3>
              <button onClick={() => setIsReturnModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
            </div>

            {/* Thông tin chính sách đổi trả */}
            <div style={{ padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', fontSize: '12px', color: '#92400e', marginBottom: '16px', lineHeight: '1.4' }}>
              <b>Chính sách đổi trả 3 ngày:</b> Áp dụng cho các sản phẩm bánh bị hỏng hóc, dập nát, giao sai quy cách hoặc có vấn đề chất lượng. Cửa hàng sẽ hoàn tiền 100% (<b>{Number(viewingOrder.tongTien).toLocaleString('vi-VN')} đ</b>) về tài khoản ngân hàng của bạn.
            </div>

            {/* Dropdown Lý do hoàn trả */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                Lý do hoàn trả (*):
              </label>
              <select
                value={returnReason}
                onChange={e => setReturnReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #dcd6ce',
                  borderRadius: '6px',
                  fontSize: '13px',
                  backgroundColor: '#fff',
                  outline: 'none'
                }}
              >
                {RETURN_REASONS.map((r, i) => (
                  <option key={i} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Mô tả chi tiết */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                Mô tả chi tiết tình trạng bánh hỏng (*):
              </label>
              <textarea
                placeholder="Vui lòng mô tả cụ thể tình trạng bánh khi nhận (bị méo, hỏng kem, sai vị, hết date...)..."
                value={returnNote}
                onChange={e => setReturnNote(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  border: '1px solid #dcd6ce',
                  borderRadius: '6px',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Upload ảnh minh chứng bánh hỏng */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#333', marginBottom: '6px' }}>
                📷 Ảnh chụp bánh hỏng thực tế (Minh chứng đối soát):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setReturnProofFile(file);
                    setReturnProofPreview(URL.createObjectURL(file));
                  }
                }}
                style={{ fontSize: '12px' }}
              />
              {returnProofPreview && (
                <div style={{ marginTop: '8px', position: 'relative', display: 'inline-block' }}>
                  <img
                    src={returnProofPreview}
                    alt="Ảnh minh chứng bánh hỏng"
                    style={{ maxWidth: '160px', maxHeight: '120px', borderRadius: '6px', border: '1px solid #ddd', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReturnProofFile(null);
                      setReturnProofPreview(null);
                    }}
                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Khối kê khai thông tin tài khoản ngân hàng để nhân viên chuyển khoản hoàn tiền */}
            {(Number(viewingOrder.trangThaiThanhToan) === 1 || viewingOrder.phuongThucTT?.includes('Chuyển khoản') || viewingOrder.phuongThucTT?.includes('MoMo') || viewingOrder.phuongThucTT?.includes('VietQR')) && (
              <div style={{ padding: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-building-columns" style={{ color: '#0284c7' }}></i>
                  Tài khoản ngân hàng nhận tiền hoàn:
                </div>

                {/* Chọn ngân hàng */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '3px' }}>Ngân hàng (*):</label>
                  <select
                    value={returnBank}
                    onChange={e => setReturnBank(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '50px',
                      fontSize: '12px',
                      backgroundColor: '#fff',
                      outline: 'none'
                    }}
                  >
                    {REFUND_BANKS.map(b => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Số tài khoản */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '3px' }}>Số tài khoản (*):</label>
                  <input
                    type="text"
                    placeholder="Nhập số tài khoản ngân hàng..."
                    value={returnAccountNo}
                    onChange={e => setReturnAccountNo(e.target.value.replace(/\s+/g, ''))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      backgroundColor: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Tên chủ tài khoản */}
                <div>
                  <label style={{ fontSize: '12px', color: '#475569', display: 'block', marginBottom: '3px' }}>Tên chủ tài khoản (*):</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: NGUYEN VAN A"
                    value={returnAccountName}
                    onChange={e => setReturnAccountName(e.target.value.toUpperCase())}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      backgroundColor: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Nút hành động */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsReturnModalOpen(false)}
                style={{ padding: '9px 18px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#475569' }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmitReturn}
                disabled={isSubmittingReturn}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#ea580c',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isSubmittingReturn ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: '700',
                  opacity: isSubmittingReturn ? 0.7 : 1,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)'
                }}
              >
                {isSubmittingReturn ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    <span>Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i>
                    <span>Gửi Yêu Cầu Hoàn Trả</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal preview full size image */}
      {previewReceiptModalUrl && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setPreviewReceiptModalUrl(null)}>
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setPreviewReceiptModalUrl(null)}
              style={{ position: 'absolute', top: '-40px', right: '0', background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            >&times; Đóng</button>
            <img
              src={previewReceiptModalUrl}
              alt="Full Size Receipt"
              style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px', border: '2px solid #fff', backgroundColor: '#fff', display: 'block', margin: 'auto' }}
            />
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
  padding: '24px',
  borderRadius: '8px',
  width: '92%',
  maxWidth: '780px',
  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

export default MyOrdersPage;
