import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getInvoices, updateInvoiceStatus, getInvoiceDetails, getGhnTrackingDetail, updateOrderItemsApi, refundOrderApi, approveReturnOrderApi, rejectReturnOrderApi } from '../../services/invoiceService';
import { useToast } from '../../components/Toast/Toast';
import { formatImageUrl } from '../../utils/imageUtils';
import axiosClient from '../../services/axiosClient';
import { DatHangOnlinePrintModal } from '../../components/PrintForms';
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
    title: 'Đang chuẩn bị',
    icon: 'fa-fire-burner',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fef3c7',
    nextStatus: 'CHO_LAY_HANG',
    nextLabel: 'Chuẩn Bị Xong (Tạo GHN)'
  },
  {
    id: 'CHO_LAY_HANG',
    title: 'Chờ Lấy Hàng',
    icon: 'fa-boxes-packing',
    color: '#d97706',
    bgColor: '#fffbe6',
    borderColor: '#ffe58f',
    nextStatus: 'DANG_GIAO',
    nextLabel: '🚚 Bàn Giao Shipper'
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
    id: 'YEU_CAU_HOAN_TRA',
    title: 'Yêu Cầu Trả Hàng',
    icon: 'fa-rotate-left',
    color: '#ea580c',
    bgColor: '#fff7ed',
    borderColor: '#fed7aa',
    nextStatus: null,
    nextLabel: null
  },
  {
    id: 'DA_HUY',
    title: 'Đã Hủy / Hoàn Hàng',
    icon: 'fa-circle-xmark',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    nextStatus: null,
    nextLabel: null
  }
];

const normalizeStatus = (st) => {
  if (st === null || st === undefined) return 'CHO_XAC_NHAN';
  const clean = String(st).toUpperCase().trim();
  if (clean === '8' || clean.includes('YEU_CAU') || clean.includes('HOAN_TRA')) return 'YEU_CAU_HOAN_TRA';
  if (clean === '6' || clean.includes('HOAN_HANG')) return 'DA_HOAN_HANG';
  if (clean.includes('HUY') || clean.includes('CANCEL') || clean === '0') return 'DA_HUY';
  if (clean.includes('HOAN') || clean.includes('THANH') || clean.includes('DELIVERED') || clean === '4' || clean === '5') return 'HOAN_THANH';
  if (clean.includes('GIAO') || clean.includes('SHIPPING') || clean === '3') return 'DANG_GIAO';
  if (clean.includes('LAY_HANG') || clean.includes('CHO_LAY') || clean.includes('READY_TO_PICK') || clean === '7') return 'CHO_LAY_HANG';
  if (clean.includes('BIEN') || clean.includes('CHUAN_BI') || clean.includes('CHE_BIEN') || clean === '2') return 'DANG_CHE_BIEN';
  if (clean.includes('CHO') || clean.includes('XAC_NHAN') || clean.includes('PENDING') || clean === '1') return 'CHO_XAC_NHAN';
  return 'CHO_XAC_NHAN';
};

const getBankBin = (bankName) => {
  if (!bankName) return 'MB';
  const str = String(bankName).toUpperCase();
  if (str.includes('MB')) return 'MB';
  if (str.includes('VIETCOMBANK') || str.includes('VCB')) return 'VCB';
  if (str.includes('TECHCOMBANK') || str.includes('TCB')) return 'TCB';
  if (str.includes('BIDV')) return 'BIDV';
  if (str.includes('VIETINBANK') || str.includes('CTG') || str.includes('ICB')) return 'ICB';
  if (str.includes('ACB')) return 'ACB';
  if (str.includes('VPBANK') || str.includes('VPB')) return 'VPB';
  if (str.includes('TPBANK') || str.includes('TPB')) return 'TPB';
  if (str.includes('SACOMBANK') || str.includes('STB')) return 'STB';
  if (str.includes('MOMO')) return 'momo';
  return 'MB';
};

const AdminOnlineOrderPage = () => {
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // View modes: 'LIST', 'KANBAN', 'REFUND_AUDIT'
  const [activeTabMode, setActiveTabMode] = useState('LIST');
  const [listStatusFilter, setListStatusFilter] = useState('ALL');

  // Refund states
  const [refundNoteInput, setRefundNoteInput] = useState('');
  const [refundAmountInput, setRefundAmountInput] = useState('');
  const [refundTxCodeInput, setRefundTxCodeInput] = useState('');
  const [refundProofFile, setRefundProofFile] = useState(null);
  const [refundProofPreview, setRefundProofPreview] = useState(null);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [copiedStkAdmin, setCopiedStkAdmin] = useState(false);
  const [isOnlinePrintOpen, setIsOnlinePrintOpen] = useState(false);

  // Return & Refund approval states
  const [isProcessingReturnAction, setIsProcessingReturnAction] = useState(false);
  const [returnRestock, setReturnRestock] = useState(false);
  const [returnApprovalNote, setReturnApprovalNote] = useState('');
  const [showRejectReturnModal, setShowRejectReturnModal] = useState(false);
  const [returnRejectReason, setReturnRejectReason] = useState('');

  // GHN Live Tracking states
  const [ghnTrackingCode, setGhnTrackingCode] = useState(null);
  const [ghnTrackingData, setGhnTrackingData] = useState(null);
  const [isLoadingTracking, setIsLoadingTracking] = useState(false);

  // Order Item Editing states
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [editableItems, setEditableItems] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [previewReceiptModalUrl, setPreviewReceiptModalUrl] = useState(null);

  const handleFetchGhnTracking = async (code) => {
    setGhnTrackingCode(code);
    setIsLoadingTracking(true);
    try {
      const res = await getGhnTrackingDetail(code);
      setGhnTrackingData(res?.data || null);
      await fetchOrders();
      if (selectedOrder) {
        const orderId = selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id;
        const freshRes = await import('../../services/axiosClient').then(m => m.default.get(`/hoa-don/${orderId}`));
        if (freshRes?.data) {
          setSelectedOrder(prev => ({ ...prev, ...freshRes.data }));
        }
      }
    } catch (e) {
      toast.error('Không thể lấy dữ liệu tra cứu GHN');
    } finally {
      setIsLoadingTracking(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    import('../../services/axiosClient').then(m => {
      m.default.get('/products').then(res => {
        const list = res.data?.content || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        setAllProducts(list);
      }).catch(() => {});
    });
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await getInvoices({ page: 0, size: 200 });
      const list = res?.content || res?.data || (Array.isArray(res) ? res : []);
      setOrders(list);
    } catch (e) {
      toast.error('Không thể tải danh sách đơn hàng online');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (maHD, newStatus) => {
    try {
      const res = await updateInvoiceStatus(maHD, { TRANGTHAI: newStatus, TRANG_THAI: newStatus });
      const updatedOrder = res?.data;
      const maVanDon = updatedOrder?.maVanDonGhn;
      const msg = res?.message || `Đã chuyển đơn hàng ${maHD} sang trạng thái mới thành công!`;
      toast.success(maVanDon ? `${msg} (Mã vận đơn: ${maVanDon})` : msg);
      // Refresh danh sách đơn hàng để cập nhật mã vận đơn GHN
      await fetchOrders();
    } catch (e) {
      toast.error('Lỗi khi cập nhật trạng thái đơn hàng: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
    }
  };

  const handleCreateGhnOrder = async (orderId) => {
    try {
      toast.info('Đang gửi yêu cầu tạo vận đơn Giao Hàng Nhanh...');
      const res = await axiosClient.post(`/ghn/create-order/${orderId}`);
      if (res.data?.success) {
        toast.success(res.data.message || 'Đã tạo vận đơn GHN thành công!');
        await fetchOrders();
      } else {
        toast.warning(res.data?.message || 'Không thể tạo vận đơn GHN');
      }
    } catch (e) {
      toast.error('Lỗi tạo vận đơn GHN: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleOpenDetailModal = async (order) => {
    setSelectedOrder(order);
    setIsEditingOrder(false);
    setIsLoadingDetails(true);

    const initialAmt = Number(order.soTienHoan || order.TONGTIEN || order.tongTien || order.tongThanhToan || 0);
    setRefundAmountInput(initialAmt > 0 ? String(initialAmt) : '');
    setRefundTxCodeInput(order.maGiaoDichHoanTien || '');
    setRefundNoteInput(order.ghiChuHoanTien || '');
    setRefundProofFile(null);
    setRefundProofPreview(null);

    const orderId = order.MAHD || order.MAHDBAN || order.maHD || order.id;
    try {
      const freshRes = await import('../../services/axiosClient').then(m => m.default.get(`/hoa-don/${orderId}`));
      if (freshRes.data) {
        setSelectedOrder(prev => ({ ...prev, ...freshRes.data }));
        if (freshRes.data.soTienHoan) setRefundAmountInput(String(freshRes.data.soTienHoan));
        if (freshRes.data.maGiaoDichHoanTien) setRefundTxCodeInput(freshRes.data.maGiaoDichHoanTien);
        if (freshRes.data.ghiChuHoanTien) setRefundNoteInput(freshRes.data.ghiChuHoanTien);
      }

      const details = await getInvoiceDetails(orderId);
      const items = details?.chi_tiet || details?.data || (Array.isArray(details) ? details : []);
      setOrderDetails(items);

      const formatted = items.map(it => ({
        id: it.maSP || it.MASP || it.sanPhamId || it.id,
        sanPhamId: it.sanPhamId || it.masp || it.MASP || it.maSP,
        tenSP: it.san_pham?.TENSP || it.TENSP || it.tenSP || `Sản phẩm ${it.MASP || it.maSP}`,
        soLuong: Number(it.SOLUONG || it.SO_LUONG || it.soLuong || 1),
        donGia: Number(it.DONGIA || it.DON_GIA || it.donGia || it.GIABAN || 0),
        thanhTien: Number((it.SOLUONG || it.soLuong || 1) * (it.DONGIA || it.donGia || 0))
      }));
      setEditableItems(formatted);
    } catch (e) {
      setOrderDetails(order.chi_tiet || order.details || []);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleItemQtyChange = (idx, newQty) => {
    const qty = Math.max(1, Number(newQty) || 1);
    setEditableItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, soLuong: qty, thanhTien: qty * item.donGia };
      }
      return item;
    }));
  };

  const handleItemPriceChange = (idx, newPrice) => {
    const price = Math.max(0, Number(newPrice) || 0);
    setEditableItems(prev => prev.map((item, i) => {
      if (i === idx) {
        return { ...item, donGia: price, thanhTien: item.soLuong * price };
      }
      return item;
    }));
  };

  const handleRemoveItem = (idx) => {
    if (editableItems.length <= 1) {
      toast.warning('Đơn hàng cần có ít nhất 1 sản phẩm bánh!');
      return;
    }
    setEditableItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddProductToEdit = () => {
    if (!selectedProductToAdd) return;
    const prod = allProducts.find(p => String(p.id || p.MASP || p.ma_san_pham) === String(selectedProductToAdd));
    if (!prod) return;

    const price = Number(prod.giaBan || prod.GIABAN || prod.gia_ban || 0);
    const newEntry = {
      id: prod.id || prod.MASP,
      sanPhamId: prod.id || prod.MASP,
      tenSP: prod.tenSanPham || prod.TENSP || prod.ten_san_pham,
      soLuong: 1,
      donGia: price,
      thanhTien: price
    };

    setEditableItems(prev => [...prev, newEntry]);
    setSelectedProductToAdd('');
  };

  const handleSaveOrderChanges = async () => {
    if (!selectedOrder) return;
    const orderId = selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id;
    setIsSavingOrder(true);
    try {
      const res = await updateOrderItemsApi(orderId, { items: editableItems });
      toast.success(res.message || 'Cập nhật nội dung đơn hàng thành công!');
      
      const subtotal = editableItems.reduce((acc, it) => acc + (it.soLuong * it.donGia), 0);
      const shipping = Number(selectedOrder.phiVanChuyen || 0);
      const discount = Number(selectedOrder.soTienGiam || 0);
      const newTotal = Math.max(0, (subtotal + shipping) - discount);
      
      setSelectedOrder(prev => ({
        ...prev,
        tongTien: newTotal,
        TONGTIEN: newTotal,
        TONG_TIEN: newTotal
      }));

      setOrderDetails(editableItems.map(it => ({
        ...it,
        san_pham: { TENSP: it.tenSP }
      })));

      setOrders(prev => prev.map(o => {
        const oid = o.MAHD || o.MAHDBAN || o.maHD || o.id;
        if (oid === orderId) {
          return { ...o, tongTien: newTotal, TONGTIEN: newTotal, TONG_TIEN: newTotal };
        }
        return o;
      }));

      setIsEditingOrder(false);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Không thể lưu thay đổi đơn hàng');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleConfirmRefund = async (orderId) => {
    if (!orderId) return;
    const amt = Number(refundAmountInput) || Number(selectedOrder.TONGTIEN || selectedOrder.tongTien || selectedOrder.tongThanhToan || 0);
    if (!window.confirm(`Xác nhận bạn đã chuyển khoản hoàn tiền ${amt.toLocaleString('vi-VN')}đ cho đơn hàng #${orderId}?`)) {
      return;
    }
    setIsProcessingRefund(true);
    try {
      const formData = new FormData();
      formData.append('soTienHoan', amt);
      if (refundTxCodeInput.trim()) {
        formData.append('maGiaoDichHoanTien', refundTxCodeInput.trim());
      }
      formData.append('ghiChu', refundNoteInput.trim() || 'Đã hoàn tiền cho khách qua chuyển khoản');
      if (refundProofFile) {
        formData.append('minhChungHoanTien', refundProofFile);
      }

      const res = await refundOrderApi(orderId, formData);
      toast.success(res.message || `Đã xác nhận hoàn tiền cho đơn #${orderId}!`);
      
      const updatedOrder = {
        ...selectedOrder,
        trangThaiThanhToan: 3,
        trangThaiHoanTien: 'DA_HOAN_TIEN',
        soTienHoan: res.data?.soTienHoan ?? amt,
        maGiaoDichHoanTien: res.data?.maGiaoDichHoanTien || refundTxCodeInput.trim(),
        minhChungHoanTien: res.data?.minhChungHoanTien || (refundProofPreview || selectedOrder.minhChungHoanTien),
        tenNhanVienHoan: res.data?.tenNhanVienHoan || 'Nhân viên',
        ngayHoanTien: res.data?.ngayHoanTien || new Date().toLocaleString('vi-VN'),
        ghiChuHoanTien: refundNoteInput.trim() || 'Đã hoàn tiền cho khách qua chuyển khoản'
      };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => {
        const id = o.MAHD || o.MAHDBAN || o.maHD || o.id;
        return id === orderId ? { ...o, ...updatedOrder } : o;
      }));
      setRefundProofFile(null);
      setRefundProofPreview(null);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Có lỗi xảy ra khi xác nhận hoàn tiền');
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleApproveReturn = async (orderId) => {
    if (!orderId) return;
    if (!window.confirm(`Xác nhận DUYỆT yêu cầu trả hàng và hoàn tiền cho đơn #${orderId}?`)) return;
    setIsProcessingReturnAction(true);
    try {
      const res = await approveReturnOrderApi(orderId, {
        restock: returnRestock,
        note: returnApprovalNote.trim() || 'Đã duyệt yêu cầu trả hàng và hoàn tiền cho khách',
        maGiaoDich: refundTxCodeInput.trim()
      });
      toast.success(res.message || 'Đã duyệt yêu cầu hoàn trả & hoàn tiền thành công!');
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder(prev => ({
          ...prev,
          trangThaiDonHang: 6,
          trangThaiHoanHang: 'DA_DUYET',
          trangThaiThanhToan: 3,
          trangThaiHoanTien: 'DA_HOAN_TIEN',
          soTienHoan: prev.TONGTIEN || prev.tongTien || prev.tongThanhToan,
          ngayHoanTien: new Date().toLocaleString('vi-VN'),
          ghiChuHoanTien: returnApprovalNote.trim() || 'Đã duyệt trả hàng & hoàn tiền'
        }));
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Có lỗi xảy ra khi duyệt trả hàng');
    } finally {
      setIsProcessingReturnAction(false);
    }
  };

  const handleRejectReturn = async (orderId) => {
    if (!orderId) return;
    if (!returnRejectReason.trim()) {
      toast.warning('Vui lòng nhập lý do từ chối yêu cầu trả hàng!');
      return;
    }
    setIsProcessingReturnAction(true);
    try {
      const res = await rejectReturnOrderApi(orderId, {
        lyDoTuChoi: returnRejectReason.trim()
      });
      toast.success(res.message || 'Đã từ chối yêu cầu trả hàng');
      setShowRejectReturnModal(false);
      setReturnRejectReason('');
      await fetchOrders();
      if (selectedOrder) {
        setSelectedOrder(prev => ({
          ...prev,
          trangThaiDonHang: 4,
          trangThaiHoanHang: 'TU_CHOI',
          lyDoTuChoiHoanTra: returnRejectReason.trim()
        }));
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Có lỗi khi từ chối trả hàng');
    } finally {
      setIsProcessingReturnAction(false);
    }
  };

  const getStatusBadge = (order) => {
    const st = order.trangThaiDonHang !== undefined && order.trangThaiDonHang !== null ? order.trangThaiDonHang : (order.TRANGTHAI || order.TRANG_THAI || order.trangThai);
    const normalized = normalizeStatus(st);
    switch (normalized) {
      case 'CHO_XAC_NHAN':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-clock"></i> Chờ xác nhận</span>;
      case 'DANG_CHE_BIEN':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fffbeb', color: '#b45309', border: '1px solid #fef3c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-fire-burner"></i> Đang chuẩn bị</span>;
      case 'CHO_LAY_HANG':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fffbe6', color: '#d97706', border: '1px solid #ffe58f', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-boxes-packing"></i> Chờ lấy hàng</span>;
      case 'DANG_GIAO':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-truck-fast"></i> Đang giao</span>;
      case 'HOAN_THANH':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-circle-check"></i> Hoàn thành</span>;
      case 'YEU_CAU_HOAN_TRA':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fdba74', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-rotate-left"></i> Yêu cầu hoàn trả</span>;
      case 'DA_HOAN_HANG':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fdf2f8', color: '#be185d', border: '1px solid #fbcfe8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-box-open"></i> Đã hoàn hàng</span>;
      case 'DA_HUY':
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><i className="fa-solid fa-circle-xmark"></i> Đã hủy</span>;
      default:
        return <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', backgroundColor: '#f1f5f9', color: '#475569' }}>{String(st)}</span>;
    }
  };

  const filteredOrders = orders.filter(o => {
    const isOnline = Number(o.loaiDonHang) === 0 || o.loaiDonHang === 'Trực tuyến' || String(o.loaiDonHang) === '0';
    if (!isOnline) return false;

    const term = searchTerm.toLowerCase();
    const code = String(o.MAHD || o.MAHDBAN || o.maHD || o.id || '').toLowerCase();
    const customer = String(o.khach_hang?.HOTEN || o.HOTEN_KH || o.TENKH || o.tenKH || '').toLowerCase();
    const phone = String(o.khach_hang?.SDT || o.SDT || o.sdtKH || '').toLowerCase();
    return code.includes(term) || customer.includes(term) || phone.includes(term);
  });

  const getOrdersByColumn = (colId) => {
    return filteredOrders.filter(o => {
      const isReturnReq = Number(o.trangThaiDonHang) === 8 || o.trangThaiHoanHang === 'CHO_DUYET';
      if (colId === 'YEU_CAU_HOAN_TRA') {
        return isReturnReq;
      }
      if (isReturnReq) return false;
      const st = o.trangThaiDonHang !== undefined && o.trangThaiDonHang !== null ? o.trangThaiDonHang : (o.TRANGTHAI || o.TRANG_THAI || o.trangThai);
      const norm = normalizeStatus(st);
      if (colId === 'DA_HUY') {
        return norm === 'DA_HUY' || norm === 'DA_HOAN_HANG';
      }
      return norm === colId;
    });
  };

  const refundAuditOrders = filteredOrders.filter(o => 
    o.trangThaiThanhToan === 2 || 
    o.trangThaiThanhToan === 3 || 
    o.trangThaiHoanTien === 'CHO_HOAN_TIEN' || 
    o.trangThaiHoanTien === 'DA_HOAN_TIEN' || 
    o.soTienHoan || 
    o.nganHangHoanTien
  );

  const totalRefundedSum = refundAuditOrders
    .filter(o => o.trangThaiThanhToan === 3 || o.trangThaiHoanTien === 'DA_HOAN_TIEN')
    .reduce((acc, o) => acc + (Number(o.soTienHoan) || Number(o.TONGTIEN || o.tongTien || o.tongThanhToan || 0)), 0);

  const pendingRefundCount = refundAuditOrders.filter(o => o.trangThaiThanhToan === 2 || o.trangThaiHoanTien === 'CHO_HOAN_TIEN').length;
  const completedRefundCount = refundAuditOrders.filter(o => o.trangThaiThanhToan === 3 || o.trangThaiHoanTien === 'DA_HOAN_TIEN').length;

  return (
    <AdminLayout>
      <style>{`
        /* An triet de toan bo thanh cuon scrollbar */
        .admin-online-order-page,
        .admin-online-order-page *,
        .no-scrollbar,
        .no-scrollbar *,
        .admin-main,
        .admin-main * {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        .admin-online-order-page::-webkit-scrollbar,
        .admin-online-order-page *::-webkit-scrollbar,
        .no-scrollbar::-webkit-scrollbar,
        .no-scrollbar *::-webkit-scrollbar,
        .admin-main::-webkit-scrollbar,
        .admin-main *::-webkit-scrollbar {
          width: 0px !important;
          height: 0px !important;
          display: none !important;
        }
      `}</style>
      <div className="admin-online-order-page no-scrollbar">
      <div className="admin-flex-between" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Đơn hàng Online</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Theo dõi và xử lý đơn đặt hàng trực tuyến của khách dạng danh sách bảng hoặc Kanban</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            type="button"
            className={`admin-btn ${activeTabMode === 'LIST' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setActiveTabMode('LIST')}
            style={{ fontWeight: activeTabMode === 'LIST' ? 'bold' : 'normal' }}
          >
            <i className="fa-solid fa-list" style={{ marginRight: '6px' }}></i> Dạng Danh Sách (List)
          </button>

          <button
            type="button"
            className={`admin-btn ${activeTabMode === 'KANBAN' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setActiveTabMode('KANBAN')}
            style={{ fontWeight: activeTabMode === 'KANBAN' ? 'bold' : 'normal' }}
          >
            <i className="fa-solid fa-table-columns" style={{ marginRight: '6px' }}></i> Dạng Bảng (Kanban)
          </button>

          <button
            type="button"
            className={`admin-btn ${activeTabMode === 'REFUND_AUDIT' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
            onClick={() => setActiveTabMode('REFUND_AUDIT')}
            style={{
              fontWeight: activeTabMode === 'REFUND_AUDIT' ? 'bold' : 'normal',
              position: 'relative'
            }}
          >
            <i className="fa-solid fa-receipt" style={{ marginRight: '6px' }}></i> Sổ Hoàn Tiền & Trả Hàng
            {pendingRefundCount > 0 && (
              <span style={{
                marginLeft: '6px',
                padding: '2px 6px',
                fontSize: '10px',
                backgroundColor: '#dc2626',
                color: '#fff',
                borderRadius: '10px',
                fontWeight: 'bold'
              }}>
                {pendingRefundCount}
              </span>
            )}
          </button>
          <button className="admin-btn admin-btn-secondary" onClick={fetchOrders} disabled={isLoading}>
            <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`} style={{ marginRight: '6px' }}></i> Làm Mới
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

          <div style={{ display: 'flex', gap: '1rem', fontSize: '13px', color: '#64748b', flexWrap: 'wrap' }}>
            <span>Tổng đơn hàng: <b>{filteredOrders.length}</b></span>
            <span>•</span>
            <span style={{ color: '#3b82f6' }}>Chờ duyệt: <b>{getOrdersByColumn('CHO_XAC_NHAN').length}</b></span>
            <span>•</span>
            <span style={{ color: '#f59e0b' }}>Đang chuẩn bị: <b>{getOrdersByColumn('DANG_CHE_BIEN').length}</b></span>
            <span>•</span>
            <span style={{ color: '#d97706' }}>Chờ lấy hàng (GHN): <b>{getOrdersByColumn('CHO_LAY_HANG').length}</b></span>
            {filteredOrders.filter(o => Number(o.trangThaiDonHang) === 8 || o.trangThaiHoanHang === 'CHO_DUYET').length > 0 && (
              <>
                <span>•</span>
                <span style={{ color: '#ea580c', fontWeight: 'bold' }}>
                  🔄 Yêu cầu trả hàng: {filteredOrders.filter(o => Number(o.trangThaiDonHang) === 8 || o.trangThaiHoanHang === 'CHO_DUYET').length}
                </span>
              </>
            )}
            {filteredOrders.filter(o => o.trangThaiThanhToan === 2 || o.trangThaiHoanTien === 'CHO_HOAN_TIEN').length > 0 && (
              <>
                <span>•</span>
                <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  ⚠️ Cần hoàn tiền: {filteredOrders.filter(o => o.trangThaiThanhToan === 2 || o.trangThaiHoanTien === 'CHO_HOAN_TIEN').length}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NỘI DUNG CHÍNH: DẠNG LIST / KANBAN / SỔ TRUY VẾT */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: 'var(--admin-primary)', marginBottom: '10px' }}></i>
          <p>Đang đồng bộ luồng đơn hàng trực tuyến...</p>
        </div>
      ) : activeTabMode === 'LIST' ? (
        /* GIAO DIỆN DẠNG LIST / BẢNG CHI TIẾT (Task 3) */
        <div className="admin-card" style={{ padding: '1.2rem', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* Status Filter Tabs for List View */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `Tất cả (${filteredOrders.length})` },
              { id: 'CHO_XAC_NHAN', label: `Chờ xác nhận (${getOrdersByColumn('CHO_XAC_NHAN').length})`, color: '#3b82f6' },
              { id: 'DANG_CHE_BIEN', label: `Đang chuẩn bị (${getOrdersByColumn('DANG_CHE_BIEN').length})`, color: '#f59e0b' },
              { id: 'CHO_LAY_HANG', label: `Chờ lấy hàng (${getOrdersByColumn('CHO_LAY_HANG').length})`, color: '#d97706' },
              { id: 'DANG_GIAO', label: `Đang giao (${getOrdersByColumn('DANG_GIAO').length})`, color: '#8b5cf6' },
              { id: 'HOAN_THANH', label: `Hoàn thành (${getOrdersByColumn('HOAN_THANH').length})`, color: '#10b981' },
              {
                id: 'YEU_CAU_HOAN_TRA',
                label: `Yêu cầu trả hàng (${filteredOrders.filter(o => Number(o.trangThaiDonHang) === 8 || o.trangThaiHoanHang === 'CHO_DUYET').length})`,
                color: '#ea580c',
                highlight: filteredOrders.filter(o => Number(o.trangThaiDonHang) === 8 || o.trangThaiHoanHang === 'CHO_DUYET').length > 0
              },
              { id: 'DA_HOAN_HANG', label: `Đã hoàn hàng (${getOrdersByColumn('DA_HOAN_HANG').length})`, color: '#db2777' },
              { id: 'DA_HUY', label: `Đã hủy (${getOrdersByColumn('DA_HUY').length})`, color: '#ef4444' }
            ].map(pill => {
              const active = listStatusFilter === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => setListStatusFilter(pill.id)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    border: active ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                    backgroundColor: active ? '#eff6ff' : '#f8fafc',
                    color: active ? '#1d4ed8' : '#475569',
                    fontWeight: active || pill.highlight ? 'bold' : 'normal',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {pill.label}
                  {pill.highlight && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }}></span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ overflowX: 'auto' }} className="no-scrollbar">
            <table className="admin-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th style={{ width: '130px' }}>Mã Đơn / Ngày</th>
                  <th style={{ width: '220px' }}>Khách Hàng</th>
                  <th style={{ width: '150px' }}>Thanh Toán</th>
                  <th style={{ width: '140px' }}>Vận Đơn GHN</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '160px', textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.filter(o => {
                  if (listStatusFilter === 'ALL') return true;
                  const st = o.trangThaiDonHang !== undefined && o.trangThaiDonHang !== null ? o.trangThaiDonHang : (o.TRANGTHAI || o.TRANG_THAI || o.trangThai);
                  return normalizeStatus(st) === listStatusFilter;
                }).length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px 10px', color: '#94a3b8' }}>
                      <i className="fa-solid fa-inbox" style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}></i>
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                    </td>
                  </tr>
                ) : (
                  filteredOrders.filter(o => {
                    if (listStatusFilter === 'ALL') return true;
                    const st = o.trangThaiDonHang !== undefined && o.trangThaiDonHang !== null ? o.trangThaiDonHang : (o.TRANGTHAI || o.TRANG_THAI || o.trangThai);
                    return normalizeStatus(st) === listStatusFilter;
                  }).map(order => {
                    const orderId = order.MAHD || order.MAHDBAN || order.maHD || order.id;
                    const khName = order.khach_hang?.HOTEN || order.HOTEN_KH || order.TENKH || order.tenKH || 'Khách Vãng Lai';
                    const khPhone = order.khach_hang?.SDT || order.SDT || order.sdtKH || order.soDienThoai || '';
                    const diaChi = order.DIACHI_GIAO || order.diaChiGiao || 'Nhận tại cửa hàng';
                    const tongTien = Number(order.TONGTIEN || order.TONG_TIEN || order.tongTien || order.tongThanhToan || 0);
                    const isPaid = Number(order.trangThaiThanhToan) === 1 || Boolean(order.minhChungThanhToan);
                    const isRefundPending = Number(order.trangThaiThanhToan) === 2 || order.trangThaiHoanTien === 'CHO_HOAN_TIEN';
                    const isRefundDone = Number(order.trangThaiThanhToan) === 3 || order.trangThaiHoanTien === 'DA_HOAN_TIEN';
                    const isReturnReq = Number(order.trangThaiDonHang) === 8 || order.trangThaiHoanHang === 'CHO_DUYET';
                    const maVanDon = order.maVanDon || order.maVanDonGhn;
                    const normSt = normalizeStatus(order.trangThaiDonHang ?? order.TRANGTHAI);
                    const colConfig = STATUS_COLUMNS.find(c => c.id === normSt);

                    return (
                      <tr key={orderId} style={{ backgroundColor: isReturnReq ? '#fffbeb' : undefined }}>
                        <td>
                          <div style={{ fontWeight: 'bold', color: 'var(--admin-primary)', fontSize: '13px' }}>
                            #{orderId}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                            {order.CREATED_AT || order.ngayLap || 'Mới đặt'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>{khName}</div>
                          {khPhone && <div style={{ fontSize: '11px', color: '#2563eb' }}>📞 {khPhone}</div>}
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={diaChi}>
                            📍 {diaChi}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 'bold', color: '#dc2626', fontSize: '14px' }}>
                            {tongTien.toLocaleString('vi-VN')} đ
                          </div>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                            {order.PHUONGTHUCTHANHTOAN || order.phuongThucTT || 'COD'}
                          </div>
                          <div>
                            {isRefundDone ? (
                              <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                Đã hoàn tiền
                              </span>
                            ) : isRefundPending ? (
                              <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ⏳ Chờ hoàn tiền
                              </span>
                            ) : isPaid ? (
                              <span style={{ fontSize: '10px', backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                                ✓ Đã thanh toán
                              </span>
                            ) : (
                              <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 6px', borderRadius: '4px' }}>
                                Chưa thanh toán
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          {maVanDon ? (
                            <div>
                              <code style={{ fontSize: '11px', backgroundColor: '#fff0f6', color: '#c41d7f', padding: '2px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                                {maVanDon}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleFetchGhnTracking(maVanDon)}
                                style={{
                                  display: 'block',
                                  marginTop: '4px',
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  backgroundColor: '#d82d8b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                              >
                                🚚 Tra cứu live
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa phát sinh</span>
                              {['DANG_CHE_BIEN', 'CHO_LAY_HANG'].includes(normSt) && (
                                <button
                                  type="button"
                                  onClick={() => handleCreateGhnOrder(orderId)}
                                  style={{
                                    padding: '2px 8px',
                                    fontSize: '11px',
                                    backgroundColor: '#d82d8b',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px'
                                  }}
                                  title="Khởi tạo mã vận đơn GHN cho đơn hàng này"
                                >
                                  🚚 Tạo mã GHN
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getStatusBadge(order)}
                          {isReturnReq && (
                            <div style={{ fontSize: '11px', color: '#ea580c', fontWeight: 'bold', marginTop: '4px' }}>
                              ⚠️ Khách gửi yêu cầu trả bánh
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary"
                              onClick={() => handleOpenDetailModal(order)}
                              style={{ padding: '3px 8px', fontSize: '11px', width: '100%', fontWeight: '600' }}
                            >
                              <i className="fa-solid fa-eye" style={{ marginRight: '4px' }}></i> Chi tiết
                            </button>

                            {colConfig?.nextStatus && (
                              <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={() => handleStatusChange(orderId, colConfig.nextStatus)}
                                style={{ padding: '3px 8px', fontSize: '11px', width: '100%', backgroundColor: colConfig.color, borderColor: colConfig.color }}
                              >
                                {colConfig.nextLabel || 'Tiếp tục'}
                              </button>
                            )}

                            {isReturnReq && (
                              <button
                                type="button"
                                onClick={() => handleOpenDetailModal(order)}
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  width: '100%',
                                  backgroundColor: '#ea580c',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                              >
                                ⚡ Duyệt hoàn trả
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
      ) : activeTabMode === 'REFUND_AUDIT' ? (
        <div className="admin-card" style={{ padding: '1.2rem', backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          {/* 3 Thẻ thống kê hoàn tiền */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#166534', fontWeight: '700', marginBottom: '4px' }}>
                <i className="fa-solid fa-money-bill-wave" style={{ marginRight: '6px' }}></i> TỔNG TIỀN ĐÃ HOÀN TRẢ
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#15803d' }}>
                {totalRefundedSum.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '2px' }}>
                Đã hoàn tất chuyển khoản và có minh chứng
              </div>
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: '700', marginBottom: '4px' }}>
                <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i> ĐÃ HOÀN TIỀN THÀNH CÔNG
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#1d4ed8' }}>
                {completedRefundCount} đơn
              </div>
              <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '2px' }}>
                Lưu vết đầy đủ mã GD, ngày hoàn & nhân viên
              </div>
            </div>

            <div style={{ backgroundColor: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: '8px', padding: '14px 16px' }}>
              <div style={{ fontSize: '12px', color: '#92400e', fontWeight: '700', marginBottom: '4px' }}>
                <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '6px' }}></i> ĐANG CHỜ CHUYỂN HOÀN
              </div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#b45309' }}>
                {pendingRefundCount} đơn
              </div>
              <div style={{ fontSize: '11px', color: '#d97706', marginTop: '2px' }}>
                Cần bộ phận kế toán / nhân viên giải ngân
              </div>
            </div>
          </div>

          {/* Tiêu đề & Danh sách đối soát */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>
              📋 Danh Sách Đối Soát & Truy Vết Hoàn Tiền ({refundAuditOrders.length} đơn)
            </h3>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              Ghi nhận minh chứng và biên lai chuyển khoản theo quy định
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569' }}>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th>Số Tiền Hoàn</th>
                  <th>Tài Khoản Nhận</th>
                  <th>Trạng Thái</th>
                  <th>Mã GD / Tham Chiếu</th>
                  <th>Nhân Viên Hoàn</th>
                  <th>Ngày Hoàn</th>
                  <th style={{ textAlign: 'center' }}>Minh Chứng</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {refundAuditOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                      <i className="fa-solid fa-receipt fa-2x" style={{ marginBottom: '10px', color: '#cbd5e1', display: 'block' }}></i>
                      Chưa có đơn hàng nào yêu cầu hoàn tiền hoặc đã hoàn tiền.
                    </td>
                  </tr>
                ) : (
                  refundAuditOrders.map(order => {
                    const orderId = order.MAHD || order.MAHDBAN || order.maHD || order.id;
                    const khName = order.khach_hang?.HOTEN || order.HOTEN_KH || order.TENKH || order.tenKH || 'Khách lẻ';
                    const khSdt = order.khach_hang?.SDT || order.SDT || order.sdtKH || '-';
                    const isRefunded = order.trangThaiThanhToan === 3 || order.trangThaiHoanTien === 'DA_HOAN_TIEN';
                    const amt = Number(order.soTienHoan || order.TONGTIEN || order.tongTien || order.tongThanhToan || 0);

                    return (
                      <tr key={orderId} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>
                          #{orderId}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#0f172a' }}>{khName}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>{khSdt}</div>
                        </td>
                        <td style={{ fontWeight: 'bold', color: '#dc2626' }}>
                          {amt.toLocaleString('vi-VN')} đ
                        </td>
                        <td>
                          {order.soTaiKhoanHoanTien ? (
                            <div>
                              <div style={{ fontWeight: '600', color: '#2563eb' }}>
                                {order.nganHangHoanTien || 'Ngân hàng'} - {order.soTaiKhoanHoanTien}
                              </div>
                              <div style={{ fontSize: '11px', color: '#475569' }}>
                                Chủ TK: {order.tenNguoiNhanHoanTien || '-'}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Chưa cung cấp</span>
                          )}
                        </td>
                        <td>
                          {isRefunded ? (
                            <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              ✓ Đã hoàn tiền
                            </span>
                          ) : (
                            <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                              ⏳ Chờ hoàn tiền
                            </span>
                          )}
                        </td>
                        <td>
                          {order.maGiaoDichHoanTien ? (
                            <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#0f172a' }}>
                              {order.maGiaoDichHoanTien}
                            </code>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td>
                          {order.tenNhanVienHoan ? (
                            <span style={{ color: '#0f172a', fontWeight: '500' }}>{order.tenNhanVienHoan}</span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', color: '#475569' }}>
                          {order.ngayHoanTien || (isRefunded ? 'Đã hoàn' : (
                            <span style={{ color: '#b45309', fontWeight: 'bold' }}>⏳ Đang chờ</span>
                          ))}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {order.minhChungHoanTien ? (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptModalUrl(formatImageUrl(order.minhChungHoanTien))}
                              style={{
                                border: '1px solid #86efac',
                                backgroundColor: '#f0fdf4',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#166534',
                                fontWeight: 'bold'
                              }}
                              title="Xem ảnh biên lai hoàn tiền"
                            >
                              <i className="fa-solid fa-image"></i> Xem ảnh
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>Chưa có</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => handleOpenDetailModal(order)}
                            style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 'bold' }}
                          >
                            {isRefunded ? 'Chi tiết' : '⚡ Xử lý hoàn'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTabMode === 'KANBAN' ? (
        /* GIAO DIỆN DẠNG BẢNG (KANBAN) */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${STATUS_COLUMNS.length}, minmax(260px, 1fr))`,
            gap: '1rem',
            alignItems: 'start',
            overflowX: 'auto',
            paddingBottom: '1rem'
          }}
          className="no-scrollbar"
        >
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
                  minWidth: '260px'
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: col.bgColor,
                    borderBottom: `2px solid ${col.color}`,
                    borderRadius: '10px 10px 0 0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className={`fa-solid ${col.icon}`} style={{ color: col.color, fontSize: '15px' }}></i>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>
                      {col.title}
                    </h3>
                  </div>
                  <span
                    style={{
                      backgroundColor: col.color,
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                  >
                    {colOrders.length}
                  </span>
                </div>

                {/* Column Order Cards Container */}
                <div
                  className="no-scrollbar"
                  style={{
                    padding: '10px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    flex: 1
                  }}
                >
                  {colOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 10px', color: '#cbd5e1', fontSize: '13px' }}>
                      <i className="fa-solid fa-inbox" style={{ fontSize: '24px', marginBottom: '6px', display: 'block' }}></i>
                      Không có đơn
                    </div>
                  ) : (
                    colOrders.map(order => {
                      const orderId = order.MAHD || order.MAHDBAN || order.maHD || order.id;
                      const khName = order.khach_hang?.HOTEN || order.HOTEN_KH || order.TENKH || order.tenKH || 'Khách Vãng Lai';
                      const khSdt = order.khach_hang?.SDT || order.SDT || order.sdtKH || order.soDienThoai || '-';
                      const diaChi = order.DIACHI_GIAO || order.diaChiGiao || 'Nhận tại cửa hàng';
                      const tongTien = Number(order.TONGTIEN || order.TONG_TIEN || order.tongTien || order.tongThanhToan || 0);
                      const ngayTao = order.CREATED_AT || order.NGAYTAO || order.ngay_tao || order.ngayLap;
                      const maVanDon = order.maVanDon || order.maVanDonGhn;
                      const isPaid = Number(order.trangThaiThanhToan) === 1 || Boolean(order.minhChungThanhToan);
                      const isRefundPending = Number(order.trangThaiThanhToan) === 2 || order.trangThaiHoanTien === 'CHO_HOAN_TIEN';
                      const isRefundDone = Number(order.trangThaiThanhToan) === 3 || order.trangThaiHoanTien === 'DA_HOAN_TIEN';
                      const isReturnReq = Number(order.trangThaiDonHang) === 8 || order.trangThaiHoanHang === 'CHO_DUYET';

                      return (
                        <div
                          key={orderId}
                          style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            padding: '12px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                            border: isReturnReq ? '1.5px solid #fdba74' : '1px solid #e2e8f0',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleOpenDetailModal(order)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 'bold', color: 'var(--admin-primary)', fontSize: '13px' }}>
                                #{orderId}
                              </span>
                              {isReturnReq && (
                                <span style={{ fontSize: '10px', backgroundColor: '#ffedd5', color: '#ea580c', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  🔄 Yêu cầu trả
                                </span>
                              )}
                              {isRefundPending && (
                                <span style={{ fontSize: '10px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ⚠️ Hoàn tiền
                                </span>
                              )}
                              {isRefundDone && (
                                <span style={{ fontSize: '10px', backgroundColor: '#dcfce7', color: '#16a34a', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ✓ Đã hoàn
                                </span>
                              )}
                              {isPaid ? (
                                <span style={{ fontSize: '10px', backgroundColor: '#eff6ff', color: '#2563eb', padding: '1px 5px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ✓ Đã TT
                                </span>
                              ) : (
                                <span style={{ fontSize: '10px', backgroundColor: '#fef3c7', color: '#b45309', padding: '1px 5px', borderRadius: '4px' }}>
                                  Chưa TT
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {ngayTao ? (new Date(ngayTao).toString() !== 'Invalid Date' ? new Date(ngayTao).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : String(ngayTao).slice(11, 16)) : ''}
                            </span>
                          </div>

                          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '3px', color: '#0f172a' }}>
                            <i className="fa-solid fa-user" style={{ marginRight: '6px', color: '#64748b', fontSize: '11px' }}></i>
                            {khName}
                          </div>

                          <div style={{ fontSize: '12px', color: '#475569', marginBottom: '3px' }}>
                            <i className="fa-solid fa-phone" style={{ marginRight: '6px', color: '#64748b', fontSize: '11px' }}></i>
                            {khSdt}
                          </div>

                          <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={diaChi}>
                            <i className="fa-solid fa-location-dot" style={{ marginRight: '6px', color: '#94a3b8', fontSize: '11px' }}></i>
                            {diaChi}
                          </div>

                          {/* GHN Tracking info if available */}
                          {maVanDon ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                              <code style={{ fontSize: '10px', backgroundColor: '#fff0f6', color: '#c41d7f', padding: '1px 4px', borderRadius: '3px', fontWeight: 'bold' }}>
                                {maVanDon}
                              </code>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleFetchGhnTracking(maVanDon);
                                }}
                                style={{
                                  padding: '1px 6px',
                                  fontSize: '10px',
                                  backgroundColor: '#d82d8b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer'
                                }}
                                title="Tra cứu lộ trình live GHN"
                              >
                                🚚 GHN
                              </button>
                            </div>
                          ) : (['DANG_CHE_BIEN', 'CHO_LAY_HANG'].includes(col.id) && (
                            <div style={{ marginBottom: '8px' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateGhnOrder(orderId);
                                }}
                                style={{
                                  padding: '2px 6px',
                                  fontSize: '10px',
                                  backgroundColor: '#d82d8b',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold'
                                }}
                                title="Khởi tạo mã vận đơn GHN"
                              >
                                🚚 Tạo mã GHN
                              </button>
                            </div>
                          ))}

                          <div style={{ borderTop: '1px dashed #e2e8f0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Tổng tiền</span>
                              <b style={{ color: '#b45309', fontSize: '13px' }}>{tongTien.toLocaleString('vi-VN')}đ</b>
                            </div>

                            {col.nextStatus ? (
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
                            ) : isReturnReq ? (
                              <button
                                type="button"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '11px',
                                  backgroundColor: '#ea580c',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  cursor: 'pointer'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDetailModal(order);
                                }}
                              >
                                ⚡ Duyệt trả
                              </button>
                            ) : null}
                          </div>

                          {/* Quick Cancel button for early stages */}
                          {['CHO_XAC_NHAN', 'DANG_CHE_BIEN'].includes(col.id) && (
                            <div style={{ marginTop: '8px', textAlign: 'right' }}>
                              {(Number(order.trangThaiThanhToan) === 1 || Boolean(order.minhChungThanhToan)) ? (
                                <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 'bold' }}>
                                  🔒 Đã thanh toán (Không được hủy)
                                </span>
                              ) : (
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
                              )}
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
      ) : null}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                Chi Tiết Đơn Hàng Online #{selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id}
              </h3>
              <button className="admin-modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="admin-modal-body">
              {/* Customer & Shipping Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.2rem', fontSize: '13px' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>👤 THÔNG TIN KHÁCH HÀNG</h4>
                  <p style={{ margin: '0 0 4px 0' }}><b>Họ tên:</b> {selectedOrder.khach_hang?.HOTEN || selectedOrder.HOTEN_KH || selectedOrder.TENKH || selectedOrder.tenKH || 'Khách hàng'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>SĐT:</b> {selectedOrder.khach_hang?.SDT || selectedOrder.SDT || selectedOrder.sdtKH || selectedOrder.soDienThoai || selectedOrder.receiverPhone || '-'}</p>
                  <p style={{ margin: 0 }}><b>Email:</b> {selectedOrder.khach_hang?.user?.EMAIL || selectedOrder.EMAIL || '-'}</p>
                </div>

                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#64748b' }}>GIAO HÀNG & THANH TOÁN</h4>
                  <p style={{ margin: '0 0 4px 0' }}><b>Địa chỉ:</b> {selectedOrder.DIACHI_GIAO || selectedOrder.diaChiGiao || selectedOrder.khach_hang?.DIACHI || 'Nhận tại cửa hàng'}</p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Phương thức TT:</b> <span className="admin-badge admin-badge-info">{selectedOrder.PHUONGTHUCTHANHTOAN || selectedOrder.phuongThucTT || 'COD (Tiền mặt)'}</span></p>
                  <p style={{ margin: '0 0 4px 0' }}><b>Trạng thái:</b> <span className="admin-badge admin-badge-success">{selectedOrder.TRANGTHAI || selectedOrder.trangThai || 'Chờ xác nhận'}</span></p>
                  {(selectedOrder.maVanDon || selectedOrder.maVanDonGhn) && (
                    <p style={{ margin: '4px 0 0 0' }}>
                      <b>Vận đơn GHN:</b> <span style={{ color: '#d82d8b', fontWeight: 'bold' }}>{selectedOrder.maVanDon || selectedOrder.maVanDonGhn}</span>
                      <button
                        type="button"
                        className="admin-btn"
                        onClick={() => handleFetchGhnTracking(selectedOrder.maVanDon || selectedOrder.maVanDonGhn)}
                        style={{ marginLeft: '8px', padding: '2px 8px', fontSize: '11px', backgroundColor: '#d82d8b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        🚚 Tra cứu GHN
                      </button>
                    </p>
                  )}
                </div>
              </div>

              {/* Thanh điều khiển nhân viên chủ động cập nhật trạng thái đơn hàng */}
              <div style={{ backgroundColor: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#166534' }}>
                    <i className="fa-solid fa-arrows-rotate" style={{ marginRight: '6px' }}></i>
                    Chủ động cập nhật trạng thái:
                  </span>
                  <select
                    value={normalizeStatus(selectedOrder.TRANGTHAI || selectedOrder.trangThai || selectedOrder.trangThaiDonHang)}
                    onChange={async (e) => {
                      const newSt = e.target.value;
                      const oId = selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id;
                      await handleStatusChange(oId, newSt);
                      setSelectedOrder(prev => prev ? ({ ...prev, TRANGTHAI: newSt, trangThai: newSt, trangThaiDonHang: newSt }) : null);
                    }}
                    style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', border: '1.5px solid #16a34a', backgroundColor: '#fff', color: '#166534', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="CHO_XAC_NHAN">⏳ Chờ xác nhận</option>
                    <option value="DANG_CHE_BIEN">👨‍🍳 Đang chuẩn bị (Chế biến)</option>
                    <option value="CHO_LAY_HANG">📦 Chờ lấy hàng (Sẵn sàng GHN)</option>
                    <option value="DANG_GIAO">🚚 Đang giao hàng (Bàn giao Shipper)</option>
                    <option value="HOAN_THANH">✅ Giao thành công (Hoàn thành)</option>
                    <option value="DA_HUY">❌ Hủy đơn hàng</option>
                  </select>
                </div>

                {!(selectedOrder.maVanDon || selectedOrder.maVanDonGhn) && ['DANG_CHE_BIEN', 'CHO_LAY_HANG'].includes(normalizeStatus(selectedOrder.TRANGTHAI || selectedOrder.trangThai)) && (
                  <button
                    type="button"
                    onClick={() => handleCreateGhnOrder(selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id)}
                    style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 'bold', backgroundColor: '#d82d8b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    🚚 Tạo / Đồng bộ mã GHN
                  </button>
                )}
              </div>

              {/* Thông tin hủy đơn nếu đơn đã hủy */}
              {(selectedOrder.lyDoHuy || normalizeStatus(selectedOrder.TRANGTHAI || selectedOrder.trangThai) === 'DA_HUY') && (
                <div style={{ marginBottom: '1.2rem', padding: '12px 16px', backgroundColor: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 'bold', fontSize: '13px' }}>
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    ĐƠN HÀNG ĐÃ BỊ HỦY
                  </div>
                  <div style={{ marginTop: '6px', fontSize: '13px', color: '#7f1d1d' }}>
                    <b>Lý do hủy:</b> {selectedOrder.lyDoHuy || 'Khách hàng hủy đơn'}
                  </div>
                  {selectedOrder.ghiChuHuy && (
                    <div style={{ marginTop: '4px', fontSize: '12px', color: '#991b1b', fontStyle: 'italic' }}>
                      <b>Ghi chú bổ sung:</b> {selectedOrder.ghiChuHuy}
                    </div>
                  )}
                </div>
              )}

              {/* PHẦN DUYỆT TRẢ HÀNG & HOÀN TIỀN CHO KHÁCH HÀNG (Task 2) */}
              {(Number(selectedOrder.trangThaiDonHang) === 8 || Number(selectedOrder.trangThaiDonHang) === 6 || Boolean(selectedOrder.trangThaiHoanHang) || Boolean(selectedOrder.lyDoHoanTra)) && (
                <div style={{
                  marginBottom: '1.2rem',
                  padding: '16px',
                  backgroundColor: Number(selectedOrder.trangThaiDonHang) === 6 || selectedOrder.trangThaiHoanHang === 'DA_DUYET'
                    ? '#f0fdf4'
                    : selectedOrder.trangThaiHoanHang === 'TU_CHOI'
                    ? '#fef2f2'
                    : '#fff7ed',
                  border: Number(selectedOrder.trangThaiDonHang) === 6 || selectedOrder.trangThaiHoanHang === 'DA_DUYET'
                    ? '1.5px solid #86efac'
                    : selectedOrder.trangThaiHoanHang === 'TU_CHOI'
                    ? '1.5px solid #fecaca'
                    : '1.5px solid #fdba74',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: Number(selectedOrder.trangThaiDonHang) === 6 || selectedOrder.trangThaiHoanHang === 'DA_DUYET'
                        ? '#166534'
                        : selectedOrder.trangThaiHoanHang === 'TU_CHOI'
                        ? '#b91c1c'
                        : '#c2410c',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="fa-solid fa-arrow-rotate-left"></i>
                      XỬ LÝ YÊU CẦU TRẢ HÀNG & HOÀN TIỀN CỦA KHÁCH HÀNG
                    </div>
                    {Number(selectedOrder.trangThaiDonHang) === 6 || selectedOrder.trangThaiHoanHang === 'DA_DUYET' ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ✓ ĐÃ DUYỆT TRẢ HÀNG
                      </span>
                    ) : selectedOrder.trangThaiHoanHang === 'TU_CHOI' ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ✕ ĐÃ TỪ CHỐI
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', backgroundColor: '#ffedd5', color: '#c2410c', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ⏳ CHỜ DUYỆT HOÀN TRẢ
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
                    <div>
                      <b>Lý do khách trả hàng:</b> <span style={{ color: '#c2410c', fontWeight: '600' }}>{selectedOrder.lyDoHoanTra || 'Chưa cung cấp'}</span>
                    </div>
                    {selectedOrder.ghiChuHoanTra && (
                      <div>
                        <b>Mô tả chi tiết sự cố bánh:</b> <span>{selectedOrder.ghiChuHoanTra}</span>
                      </div>
                    )}
                    {selectedOrder.ngayYeuCauHoanTra && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        <b>Thời gian gửi yêu cầu:</b> {selectedOrder.ngayYeuCauHoanTra}
                      </div>
                    )}
                    {selectedOrder.lyDoTuChoiHoanTra && (
                      <div style={{ color: '#dc2626', fontWeight: 'bold', marginTop: '4px' }}>
                        <b>Lý do cửa hàng từ chối:</b> {selectedOrder.lyDoTuChoiHoanTra}
                      </div>
                    )}

                    {/* Ảnh minh chứng bánh lỗi / hỏng do khách upload */}
                    {selectedOrder.hinhAnhHoanTra && (
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#9a3412', marginBottom: '4px' }}>
                          📸 Ảnh minh chứng bánh hỏng từ khách:
                        </div>
                        <div
                          onClick={() => setPreviewReceiptModalUrl(formatImageUrl(selectedOrder.hinhAnhHoanTra))}
                          style={{ cursor: 'pointer', display: 'inline-block' }}
                          title="Nhấp để xem toàn màn hình"
                        >
                          <img
                            src={formatImageUrl(selectedOrder.hinhAnhHoanTra)}
                            alt="Minh chứng bánh lỗi"
                            style={{ maxWidth: '100%', maxHeight: '160px', objectFit: 'contain', borderRadius: '6px', border: '1.5px solid #ea580c', backgroundColor: '#fff' }}
                          />
                        </div>
                        <span style={{ fontSize: '11px', color: '#c2410c', display: 'block', marginTop: '2px' }}>🔍 Nhấp vào ảnh để phóng to</span>
                      </div>
                    )}
                  </div>

                  {/* Hành động duyệt / từ chối nếu đơn đang ở trạng thái Chờ duyệt */}
                  {(Number(selectedOrder.trangThaiDonHang) === 8 || selectedOrder.trangThaiHoanHang === 'CHO_DUYET') && (
                    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #fdba74' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={returnRestock}
                            onChange={(e) => setReturnRestock(e.target.checked)}
                          />
                          <span style={{ fontWeight: '600' }}>
                            Nhập trả lại số lượng bánh vào kho tồn chi nhánh (Chỉ tích nếu bánh còn nguyên vẹn/chưa hư hỏng)
                          </span>
                        </label>
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <input
                          type="text"
                          placeholder="Ghi chú duyệt hoàn trả (tùy chọn)..."
                          value={returnApprovalNote}
                          onChange={(e) => setReturnApprovalNote(e.target.value)}
                          style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => setShowRejectReturnModal(true)}
                          disabled={isProcessingReturnAction}
                          style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 14px', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          ✕ Từ Chối Hoàn Trả
                        </button>
                        <button
                          type="button"
                          className="admin-btn"
                          onClick={() => handleApproveReturn(selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id)}
                          disabled={isProcessingReturnAction}
                          style={{ backgroundColor: '#16a34a', color: '#fff', border: 'none', padding: '6px 16px', fontSize: '12px', fontWeight: 'bold' }}
                        >
                          {isProcessingReturnAction ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check" style={{ marginRight: '6px' }}></i>}
                          ✓ Duyệt Trả Hàng & Hoàn Tiền
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* QUẢN LÝ HOÀN TIỀN CHO KHÁCH HÀNG (Nếu đơn có thông tin hoàn tiền hoặc đang ở trạng thái Chờ hoàn tiền / Đã hoàn tiền) */}
              {(selectedOrder.nganHangHoanTien || selectedOrder.soTaiKhoanHoanTien || selectedOrder.trangThaiThanhToan === 2 || selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien) && (
                <div style={{
                  marginBottom: '1.2rem',
                  padding: '16px',
                  backgroundColor: (selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') ? '#f0fdf4' : '#fffbeb',
                  border: (selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') ? '1.5px solid #86efac' : '1.5px solid #fcd34d',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      color: (selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') ? '#166534' : '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <i className="fa-solid fa-money-bill-transfer"></i>
                      NGHIỆP VỤ HOÀN TIỀN CHO KHÁCH HÀNG
                    </div>
                    {(selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') ? (
                      <span style={{ fontSize: '11px', backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ✓ ĐÃ HOÀN TIỀN
                      </span>
                    ) : (
                      <span style={{ fontSize: '11px', backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                        ⏳ CẦN HOÀN TIỀN
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: selectedOrder.soTaiKhoanHoanTien ? '1fr 180px' : '1fr', gap: '16px', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', lineHeight: '1.8', color: '#334155' }}>
                      <div>
                        <b>Số tiền cần hoàn:</b> <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '15px' }}>{Number(selectedOrder.soTienHoan || selectedOrder.TONGTIEN || selectedOrder.tongTien || selectedOrder.tongThanhToan || 0).toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div>
                        <b>Ngân hàng thụ hưởng:</b> <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedOrder.nganHangHoanTien || 'Chưa cung cấp'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <b>Số tài khoản:</b>
                        <span style={{ color: '#2563eb', fontWeight: 'bold', fontSize: '14px' }}>{selectedOrder.soTaiKhoanHoanTien || 'Chưa cung cấp'}</span>
                        {selectedOrder.soTaiKhoanHoanTien && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.soTaiKhoanHoanTien);
                              setCopiedStkAdmin(true);
                              setTimeout(() => setCopiedStkAdmin(false), 2000);
                            }}
                            style={{ padding: '1px 6px', fontSize: '10px', backgroundColor: '#e2e8f0', border: '1px solid #cbd5e1', borderRadius: '3px', cursor: 'pointer' }}
                          >
                            {copiedStkAdmin ? "✓ Đã copy" : "Sao chép"}
                          </button>
                        )}
                      </div>
                      <div>
                        <b>Chủ tài khoản:</b> <span style={{ color: '#0f172a', fontWeight: '600' }}>{selectedOrder.tenNguoiNhanHoanTien || 'Chưa cung cấp'}</span>
                      </div>
                      {selectedOrder.ngayHoanTien && (
                        <div style={{ color: '#16a34a', marginTop: '4px' }}>
                          <b>Ngày xác nhận hoàn:</b> {selectedOrder.ngayHoanTien}
                        </div>
                      )}
                      {selectedOrder.tenNhanVienHoan && (
                        <div style={{ color: '#16a34a', marginTop: '2px' }}>
                          <b>Nhân viên hoàn:</b> {selectedOrder.tenNhanVienHoan}
                        </div>
                      )}
                      {selectedOrder.maGiaoDichHoanTien && (
                        <div style={{ color: '#2563eb', marginTop: '2px' }}>
                          <b>Mã GD hoàn tiền:</b> {selectedOrder.maGiaoDichHoanTien}
                        </div>
                      )}
                      {selectedOrder.ghiChuHoanTien && (
                        <div style={{ color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                          <b>Ghi chú:</b> {selectedOrder.ghiChuHoanTien}
                        </div>
                      )}
                    </div>

                    {/* VietQR hoàn tiền nhanh cho nhân viên quét bằng app ngân hàng */}
                    {selectedOrder.soTaiKhoanHoanTien && !(selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') && (
                      <div style={{ textAlign: 'center', backgroundColor: '#fff', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <img
                          src={`https://img.vietqr.io/image/${getBankBin(selectedOrder.nganHangHoanTien)}-${selectedOrder.soTaiKhoanHoanTien}-compact.png?amount=${Number(refundAmountInput || selectedOrder.TONGTIEN || selectedOrder.tongTien || selectedOrder.tongThanhToan || 0)}&addInfo=Hoan%20tien%20don%20${selectedOrder.MAHD || selectedOrder.maHD || selectedOrder.id}&accountName=${encodeURIComponent(selectedOrder.tenNguoiNhanHoanTien || '')}`}
                          alt="VietQR hoàn tiền"
                          style={{ width: '130px', height: '130px', objectFit: 'contain', margin: '0 auto', display: 'block' }}
                        />
                        <span style={{ fontSize: '10px', color: '#64748b', marginTop: '4px', display: 'block' }}>Quét app Bank để hoàn tiền</span>
                      </div>
                    )}
                  </div>

                  {/* Minh chứng hoàn tiền nếu đã hoàn và có ảnh */}
                  {selectedOrder.minhChungHoanTien && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', backgroundColor: '#fff', borderRadius: '6px', border: '1px solid #86efac' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#166534', marginBottom: '6px' }}>
                        📸 Minh chứng chuyển tiền hoàn (Ủy nhiệm chi / Biên lai):
                      </div>
                      <div
                        onClick={() => setPreviewReceiptModalUrl(formatImageUrl(selectedOrder.minhChungHoanTien))}
                        style={{ cursor: 'pointer', display: 'inline-block' }}
                        title="Nhấp để phóng to toàn màn hình"
                      >
                        <img
                          src={formatImageUrl(selectedOrder.minhChungHoanTien)}
                          alt="Minh chứng hoàn tiền"
                          style={{ maxWidth: '100%', maxHeight: '180px', objectFit: 'contain', borderRadius: '6px', border: '1.5px solid #16a34a', backgroundColor: '#fff' }}
                        />
                      </div>
                      <span style={{ fontSize: '11px', color: '#15803d', display: 'block', marginTop: '4px' }}>🔍 Nhấp vào ảnh để xem toàn màn hình</span>
                    </div>
                  )}

                  {/* Form xác nhận hoàn tiền nếu chưa hoàn */}
                  {!(selectedOrder.trangThaiThanhToan === 3 || selectedOrder.trangThaiHoanTien === 'DA_HOAN_TIEN') && (
                    <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #fcd34d' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                            Số tiền hoàn trả (VNĐ):
                          </label>
                          <input
                            type="number"
                            placeholder="Số tiền hoàn..."
                            value={refundAmountInput}
                            onChange={(e) => setRefundAmountInput(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                            Mã giao dịch ngân hàng / tham chiếu:
                          </label>
                          <input
                            type="text"
                            placeholder="VD: FT2610309999..."
                            value={refundTxCodeInput}
                            onChange={(e) => setRefundTxCodeInput(e.target.value)}
                            style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                          Ghi chú đối soát hoàn tiền:
                        </label>
                        <input
                          type="text"
                          placeholder="Nhập ghi chú chuyển hoàn (ví dụ: Chuyển khoản hoàn tiền qua Vietcombank)..."
                          value={refundNoteInput}
                          onChange={(e) => setRefundNoteInput(e.target.value)}
                          style={{ width: '100%', padding: '7px 10px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                        />
                      </div>

                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', display: 'block', marginBottom: '3px' }}>
                          📸 Đính kèm ảnh minh chứng chuyển khoản (Ủy nhiệm chi / Biên lai App ngân hàng):
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setRefundProofFile(file);
                              setRefundProofPreview(URL.createObjectURL(file));
                            }
                          }}
                          style={{ fontSize: '12px', width: '100%' }}
                        />
                        {refundProofPreview && (
                          <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <img
                              src={refundProofPreview}
                              alt="Xem trước minh chứng"
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                            />
                            <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 'bold' }}>✓ Đã chọn ảnh minh chứng</span>
                          </div>
                        )}
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleConfirmRefund(selectedOrder.MAHD || selectedOrder.MAHDBAN || selectedOrder.maHD || selectedOrder.id)}
                          disabled={isProcessingRefund}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#16a34a',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            cursor: isProcessingRefund ? 'not-allowed' : 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          {isProcessingRefund ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-check"></i>}
                          Xác nhận đã chuyển hoàn tiền & Lưu minh chứng
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Proof Receipt Image if available */}
              {selectedOrder.minhChungThanhToan && (
                <div style={{ marginTop: '0', marginBottom: '1.2rem', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#065f46' }}>📷 MINH CHỨNG CHUYỂN KHOẢN KHÁCH HÀNG</h4>
                  <div
                    onClick={() => setPreviewReceiptModalUrl(formatImageUrl(selectedOrder.minhChungThanhToan))}
                    style={{ cursor: 'pointer', display: 'inline-block' }}
                    title="Nhấp để xem toàn màn hình"
                  >
                    <img
                      src={formatImageUrl(selectedOrder.minhChungThanhToan)}
                      alt="Minh chứng chuyển khoản"
                      style={{ maxWidth: '100%', maxHeight: '260px', minHeight: '100px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #10b981', backgroundColor: '#fff', display: 'block' }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block', fontWeight: '500' }}>🔍 Nhấp vào ảnh để xem toàn màn hình</span>
                </div>
              )}

              {/* Items List Header & Mode Toggle */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#1e293b' }}>🍰 Danh Sách Bánh Trong Đơn Hàng</h4>
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setIsEditingOrder(!isEditingOrder)}
                  style={{ padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}
                >
                  <i className={`fa-solid ${isEditingOrder ? 'fa-xmark' : 'fa-pen-to-square'}`} style={{ marginRight: '4px' }}></i>
                  {isEditingOrder ? 'Hủy chỉnh sửa' : '✏️ Chỉnh sửa đơn hàng'}
                </button>
              </div>

              {isLoadingDetails ? (
                <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải danh sách món...</p>
              ) : isEditingOrder ? (
                /* EDITABLE ITEMS TABLE FOR STAFF / ADMIN */
                <div style={{ backgroundColor: '#fffbe0', padding: '12px', borderRadius: '8px', border: '1px solid #ffe58f' }}>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#855900', fontWeight: 'bold' }}>
                    ⚡ Đang ở chế độ chỉnh sửa hóa đơn (Thay đổi số lượng, đơn giá hoặc xóa/thêm sản phẩm theo thỏa thuận với khách hàng):
                  </p>
                  <table className="admin-table" style={{ fontSize: '13px', backgroundColor: '#fff' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#fff7e6' }}>
                        <th>Tên bánh</th>
                        <th style={{ textAlign: 'center', width: '130px' }}>Số lượng</th>
                        <th style={{ textAlign: 'right', width: '120px' }}>Đơn giá (đ)</th>
                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                        <th style={{ textAlign: 'center', width: '50px' }}>Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editableItems.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: '600' }}>{item.tenSP}</td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                              <button
                                type="button"
                                style={{ width: '24px', height: '24px', border: '1px solid #ccc', background: '#f0f0f0', cursor: 'pointer', borderRadius: '3px' }}
                                onClick={() => handleItemQtyChange(idx, item.soLuong - 1)}
                              >-</button>
                              <input
                                type="number"
                                min="1"
                                value={item.soLuong}
                                onChange={(e) => handleItemQtyChange(idx, e.target.value)}
                                style={{ width: '45px', textAlign: 'center', padding: '2px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                              <button
                                type="button"
                                style={{ width: '24px', height: '24px', border: '1px solid #ccc', background: '#f0f0f0', cursor: 'pointer', borderRadius: '3px' }}
                                onClick={() => handleItemQtyChange(idx, item.soLuong + 1)}
                              >+</button>
                            </div>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              value={item.donGia}
                              onChange={(e) => handleItemPriceChange(idx, e.target.value)}
                              style={{ width: '90px', textAlign: 'right', padding: '2px', border: '1px solid #ccc', borderRadius: '3px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#b45309' }}>
                            {(item.soLuong * item.donGia).toLocaleString('vi-VN')}đ
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '15px' }}
                              title="Xóa món này"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add New Product Dropdown */}
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select
                      className="admin-input"
                      value={selectedProductToAdd}
                      onChange={(e) => setSelectedProductToAdd(e.target.value)}
                      style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                    >
                      <option value="">-- Chọn thêm sản phẩm bánh khác vào đơn --</option>
                      {allProducts.map(p => (
                        <option key={p.id || p.MASP} value={p.id || p.MASP}>
                          {p.tenSanPham || p.TENSP} ({Number(p.giaBan || p.GIABAN || 0).toLocaleString('vi-VN')}đ)
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      onClick={handleAddProductToEdit}
                      disabled={!selectedProductToAdd}
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      ➕ Thêm vào đơn
                    </button>
                  </div>

                  {/* Save Changes Button */}
                  <div style={{ marginTop: '14px', textAlign: 'right' }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn-primary"
                      onClick={handleSaveOrderChanges}
                      disabled={isSavingOrder}
                      style={{ padding: '8px 18px', backgroundColor: '#16a34a', borderColor: '#16a34a', fontSize: '13px', fontWeight: 'bold' }}
                    >
                      {isSavingOrder ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-floppy-disk" style={{ marginRight: '6px' }}></i>}
                      💾 Lưu Thay Đổi Đơn Hàng
                    </button>
                  </div>
                </div>
              ) : (
                /* READ-ONLY ITEMS TABLE */
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
                        const ten = item.san_pham?.TENSP || item.TENSP || item.tenSP || `Sản phẩm ${item.MASP || item.maSP}`;
                        const sl = item.SOLUONG || item.SO_LUONG || item.soLuong || 1;
                        const gia = Number(item.DONGIA || item.DON_GIA || item.donGia || item.GIABAN || 0);
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: '600' }}>{ten}</td>
                            <td style={{ textAlign: 'center' }}>{sl}</td>
                            <td style={{ textAlign: 'right' }}>{gia.toLocaleString('vi-VN')}đ</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{(sl * gia).toLocaleString('vi-VN')}đ</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              )}

              {(() => {
                const lineSum = orderDetails && orderDetails.length > 0
                  ? orderDetails.reduce((sum, it) => {
                      const sl = Number(it.SOLUONG || it.SO_LUONG || it.soLuong || 1);
                      const gia = Number(it.DONGIA || it.DON_GIA || it.donGia || it.GIABAN || 0);
                      return sum + (Number(it.thanhTien) || (sl * gia));
                    }, 0)
                  : 0;
                const shipping = Number(selectedOrder.phiVanChuyen || selectedOrder.phi_van_chuyen || 0);
                const discount = Number(selectedOrder.soTienGiam || selectedOrder.so_tien_giam || 0);
                const totalDisplay = lineSum > 0 ? Math.max(0, lineSum + shipping - discount) : Number(selectedOrder.TONGTIEN || selectedOrder.TONG_TIEN || selectedOrder.tongTien || selectedOrder.tongThanhToan || 0);

                return (
                  <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    {lineSum > 0 && (
                      <div style={{ color: '#64748b' }}>
                        Tiền hàng: <b>{lineSum.toLocaleString('vi-VN')} đ</b>
                      </div>
                    )}
                    {shipping > 0 && (
                      <div style={{ color: '#64748b' }}>
                        Phí vận chuyển: <b>{shipping.toLocaleString('vi-VN')} đ</b>
                      </div>
                    )}
                    {discount > 0 && (
                      <div style={{ color: '#16a34a', fontWeight: 'bold' }}>
                        Voucher giảm giá: <b>-{discount.toLocaleString('vi-VN')} đ</b>
                      </div>
                    )}
                    <div style={{ fontSize: '15px', marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #eee', width: '220px' }}>
                      Tổng cộng: <b style={{ color: '#b45309', fontSize: '18px' }}>
                        {totalDisplay.toLocaleString('vi-VN')} đ
                      </b>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                style={{ backgroundColor: '#4e1a0f', borderColor: '#4e1a0f', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsOnlinePrintOpen(true)}
              >
                <i className="fa-solid fa-print"></i> In Đơn Hàng (Chuẩn Biểu Mẫu)
              </button>
              <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal In Đơn Hàng Trực Tuyến chuẩn biểu mẫu Givral Bakery */}
      <DatHangOnlinePrintModal
        isOpen={isOnlinePrintOpen}
        onClose={() => setIsOnlinePrintOpen(false)}
        order={{ ...selectedOrder, chiTietDonHangs: orderDetails }}
      />

      {/* Admin GHN Live Tracking Modal */}
      {ghnTrackingCode && (
        <div className="admin-modal-overlay" onClick={() => setGhnTrackingCode(null)}>
          <div className="admin-modal" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                🚚 Hành Trình Tra Cứu GHN #{ghnTrackingCode}
              </h3>
              <button className="admin-modal-close" onClick={() => setGhnTrackingCode(null)}>×</button>
            </div>

            <div className="admin-modal-body">
              {isLoadingTracking ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin fa-2x" style={{ color: '#d82d8b', marginBottom: '12px' }}></i>
                  <p style={{ margin: 0 }}>Đang truy vấn dữ liệu vận chuyển từ GHN Gateway...</p>
                </div>
              ) : ghnTrackingData ? (
                <div>
                  <div style={{ backgroundColor: '#fff0f6', padding: '14px', borderRadius: '8px', border: '1px solid #ffadd2', marginBottom: '15px', fontSize: '13px' }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: 'bold', color: '#c41d7f', fontSize: '15px' }}>
                      Trạng thái GHN: {
                        ({
                          'ready_to_pick': '📦 Sẵn sàng lấy hàng (Chờ bưu tá GHN qua lấy)',
                          'picking': '🚚 Bưu tá GHN đang đến lấy hàng',
                          'picked': '🏬 Đã lấy hàng - Đã nhập kho GHN',
                          'storing': '🏬 Hàng đang ở kho bưu cục GHN',
                          'transporting': '🚚 Đang luân chuyển liên kho GHN',
                          'delivering': '🛵 Bưu tá đang giao hàng cho khách',
                          'delivered': '✅ Giao hàng thành công',
                          'cancel': '❌ Đơn hàng đã bị hủy trên GHN',
                          'cancelled': '❌ Đơn hàng đã bị hủy trên GHN',
                          'return': '↩️ Đơn hàng đang hoàn trả',
                          'returned': '↩️ Đã hoàn trả về shop'
                        })[ghnTrackingData.status] || ghnTrackingData.status || 'Đang vận chuyển'
                      }
                    </p>
                    {ghnTrackingData.shipper_info && (
                      <p style={{ margin: '0 0 6px 0' }}>
                        👤 Shipper phụ trách: <b>{ghnTrackingData.shipper_info.name || 'GHN Express'}</b> ({ghnTrackingData.shipper_info.phone || 'N/A'})
                      </p>
                    )}
                    {ghnTrackingData.leadtime && (
                      <p style={{ margin: 0, color: '#475569' }}>
                        🕒 Dự kiến thời gian hoàn thành: <b>{new Date(ghnTrackingData.leadtime).toLocaleString('vi-VN')}</b>
                      </p>
                    )}
                  </div>

                  <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#1e293b' }}>Lịch sử cập nhật bưu cục GHN:</h4>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', paddingLeft: '10px' }}>
                    {Array.isArray(ghnTrackingData.log) && ghnTrackingData.log.length > 0 ? (
                      ghnTrackingData.log.map((item, idx) => (
                        <div key={idx} style={{ borderLeft: '2px solid #d82d8b', paddingLeft: '14px', marginBottom: '14px', position: 'relative' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#d82d8b', position: 'absolute', left: '-6px', top: '3px' }}></div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0f172a' }}>{item.status}</div>
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.updated_date ? new Date(item.updated_date).toLocaleString('vi-VN') : ''}</div>
                        </div>
                      ))
                    ) : (
                      <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>Đơn hàng đã bàn giao thành công cho bưu tá GHN.</p>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  <i className="fa-solid fa-box-open" style={{ fontSize: '36px', color: '#cbd5e1', marginBottom: '10px', display: 'block' }}></i>
                  <p style={{ margin: 0 }}>Mã vận đơn hiện chưa phát sinh lịch sử trên hệ thống GHN.</p>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-secondary" onClick={() => setGhnTrackingCode(null)}>
                Đóng
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
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <a href={previewReceiptModalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'underline', fontSize: '14px' }}>
                🔗 Mở hình ảnh này trong tab trình duyệt mới
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Reject Return Reason Modal */}
      {showRejectReturnModal && (
        <div className="admin-modal-overlay" onClick={() => setShowRejectReturnModal(false)}>
          <div className="admin-modal" style={{ maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Từ Chối Yêu Cầu Trả Hàng</h3>
              <button className="admin-modal-close" onClick={() => setShowRejectReturnModal(false)}>×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>
                Vui lòng nhập lý do từ chối yêu cầu trả hàng của khách hàng (lý do này sẽ hiển thị cho khách xem trên App & Website):
              </p>
              <textarea
                className="admin-input"
                rows="3"
                placeholder="VD: Đơn hàng đã quá hạn 3 ngày đổi trả theo quy định, hoặc bánh đã bị tác động ngoại lực không do lỗi vận chuyển..."
                value={returnRejectReason}
                onChange={(e) => setReturnRejectReason(e.target.value)}
                style={{ width: '100%', fontSize: '13px', minHeight: '80px', padding: '8px' }}
              />
            </div>
            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="admin-btn admin-btn-secondary" onClick={() => setShowRejectReturnModal(false)}>
                Hủy bỏ
              </button>
              <button
                className="admin-btn"
                style={{ backgroundColor: '#dc2626', color: '#fff' }}
                onClick={() => handleRejectReturn(selectedOrder?.MAHD || selectedOrder?.MAHDBAN || selectedOrder?.maHD || selectedOrder?.id)}
                disabled={isProcessingReturnAction}
              >
                {isProcessingReturnAction ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-ban" style={{ marginRight: '6px' }}></i>}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default AdminOnlineOrderPage;
