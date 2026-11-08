import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import AdminLayout from '../../Layout/AdminLayout';
import {
  getNhaCungCaps,
  getLoHangs,
  nhapLoHang,
  getHoaDonNhaps,
  getHoaDonNhapDetail,
  xacNhanNhapKho,
  getBranchRequests,
  duyetYeuCauNhapHang
} from '../../services/batchService';
import { getStores } from '../../services/storeService';
import { getProducts } from '../../services/productService';
import { getCurrentUser } from '../../services/authService';
import { useToast } from '../../components/Toast/Toast';
import SignatureCanvas from '../../components/Signature/SignatureCanvas';
import PhieuNhapKhoPrintModal from '../../components/PhieuNhapKhoPrintModal';
import '../../css/admin.css';

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

const AdminNhapLoPage = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const urlYeuCauId = searchParams.get('yeuCauId');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Dữ liệu dùng chung
  const [nccList, setNccList] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [recentLoHangs, setRecentLoHangs] = useState([]);
  const [branchRequests, setBranchRequests] = useState([]);
  const [selectedYeuCauId, setSelectedYeuCauId] = useState(null);

  // Tab điều hướng cho Quản lý chi nhánh: 'create_batch' | 'requests' | 'inspect'
  const [managerTab, setManagerTab] = useState('create_batch');

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [nhapForm, setNhapForm] = useState({
    MANCC: '',
    MACUAHANG: '',
    GHICHU: '',
    items: [
      {
        MASP: '',
        SOLUONGTCT: 30,
        DONGIANHAP: 15000,
        NGAYSX: todayStr,
        HSD_LO: defaultExpStr,
        GHICHU: ''
      }
    ]
  });

  // Tùy chọn ký duyệt ngay khi Quản lý chi nhánh tạo đơn nhập hàng
  const [signImmediately, setSignImmediately] = useState(true);
  const [kyQuanLyData, setKyQuanLyData] = useState(null);
  const [sigManagerKey, setSigManagerKey] = useState(0);

  // Kiểm đếm / Tra cứu phiếu nhập
  const [searchMaPhieu, setSearchMaPhieu] = useState('');
  const [branchInvoices, setBranchInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [checkItems, setCheckItems] = useState([]);
  const [tenVanChuyen, setTenVanChuyen] = useState('');
  const [kyVanChuyenData, setKyVanChuyenData] = useState(null);
  const [tenNguoiNhan, setTenNguoiNhan] = useState('');
  const [kyNguoiNhanData, setKyNguoiNhanData] = useState(null);
  const [ghiChuKiemDem, setGhiChuKiemDem] = useState('');
  const [sigCarrierKey, setSigCarrierKey] = useState(10);
  const [sigReceiverKey, setSigReceiverKey] = useState(20);
  const [historyStoreFilter, setHistoryStoreFilter] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printInvoiceData, setPrintInvoiceData] = useState(null);

  // Xác định vai trò người dùng hiện tại
  const vaiTroId = Number(currentUser?.vaiTroId || currentUser?.vai_tro_id || 0);
  const maRole = currentUser?.MAROLE !== undefined ? Number(currentUser.MAROLE) : null;
  const tenVaiTro = String(currentUser?.vaiTro?.tenVaiTro || currentUser?.vaitro?.tenVaiTro || '').toLowerCase();

  const isAdmin = vaiTroId === 1 || maRole === 0 || String(currentUser?.username).toLowerCase() === 'admin';
  const isDirector = !isAdmin && (vaiTroId === 8 || maRole === 5 || tenVaiTro.includes('giám đốc'));
  const isBranchManager = !isAdmin && !isDirector && (vaiTroId === 2 || maRole === 1 || tenVaiTro.includes('quản lý'));
  const isWarehouse = !isAdmin && !isDirector && !isBranchManager && (vaiTroId === 4 || maRole === 7 || tenVaiTro.includes('kho'));

  // Chi nhánh của người dùng hiện tại
  const userStoreId = currentUser?.nguoidung?.cuaHangId || currentUser?.cuaHangId || currentUser?.cuahang?.id || null;
  const savedSignature = currentUser?.nguoidung?.chuKySo || currentUser?.nguoidung?.chuKy || currentUser?.nhanvien?.chuKySo || currentUser?.chuKySo || currentUser?.chuKy || null;
  const currentStoreObj = stores.find(s => String(s.id ?? s.MACUAHANG) === String(userStoreId));
  const currentStoreName = currentStoreObj
    ? (currentStoreObj.tenCuaHang || currentStoreObj.TENCUAHANG || currentStoreObj.ten_cuahang)
    : (userStoreId ? `Chi nhánh #${userStoreId}` : 'Chi nhánh của bạn');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchBranchRequests();
      fetchStoreInvoices();
      if (userStoreId) {
        setNhapForm(prev => ({
          ...prev,
          MACUAHANG: prev.MACUAHANG || String(userStoreId)
        }));
      }
    }
  }, [currentUser, userStoreId]);

  useEffect(() => {
    if (urlYeuCauId && branchRequests.length > 0 && isBranchManager) {
      const targetReq = branchRequests.find(r => String(r.ID_YEUCAU) === String(urlYeuCauId));
      if (targetReq) {
        handleSelectRequestToImport(targetReq);
      }
    }
  }, [urlYeuCauId, branchRequests, isBranchManager]);

  const handleOpenPrintModal = async (invoiceOrId) => {
    if (!invoiceOrId) return;
    if (typeof invoiceOrId === 'object' && (invoiceOrId.chiTiets || invoiceOrId.chi_tiets)) {
      setPrintInvoiceData(invoiceOrId);
      setIsPrintModalOpen(true);
      return;
    }
    const id = typeof invoiceOrId === 'object'
      ? (invoiceOrId.hoa_don_nhap?.maHoaDonNhap || invoiceOrId.hoaDonNhap?.maHoaDonNhap || invoiceOrId.maHoaDonNhap || invoiceOrId.MAHDNHAP || invoiceOrId.id)
      : invoiceOrId;
    if (!id || id === '-') {
      toast.warning('Không tìm thấy mã phiếu nhập tương ứng với lô hàng này.');
      return;
    }
    try {
      const res = await getHoaDonNhapDetail(id);
      const inv = res?.data || res;
      if (inv && inv.id) {
        setPrintInvoiceData(inv);
        setIsPrintModalOpen(true);
      } else {
        toast.error('Không thể tải chi tiết phiếu nhập: ' + id);
      }
    } catch (e) {
      toast.error('Lỗi tải phiếu nhập: ' + (e.response?.data?.message || e.message));
    }
  };

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resUser, resNcc, resStores, resProds, resLo] = await Promise.allSettled([
        getCurrentUser(true),
        getNhaCungCaps(),
        getStores(),
        getProducts({ page: 1, size: 100 }),
        getLoHangs({ per_page: 20 })
      ]);

      if (resUser.status === 'fulfilled') {
        const u = resUser.value;
        setCurrentUser(u);
        setTenNguoiNhan(u?.nguoidung?.hoTen || u?.username || '');
        const uSig = u?.nguoidung?.chuKySo || u?.nguoidung?.chuKy || u?.nhanvien?.chuKySo || u?.chuKySo || u?.chuKy || null;
        if (uSig) {
          setKyQuanLyData(prev => prev || uSig);
          setKyNguoiNhanData(prev => prev || uSig);
        }
      }

      if (resNcc.status === 'fulfilled') {
        const val = resNcc.value;
        const nccs = val?.data || val || [];
        setNccList(Array.isArray(nccs) ? nccs : []);
      }

      if (resStores.status === 'fulfilled') {
        const val = resStores.value;
        const stList = val?.data || val || [];
        setStores(Array.isArray(stList) ? stList : []);
      }

      if (resProds.status === 'fulfilled') {
        const val = resProds.value;
        const prList = val?.data?.data || val?.data || val || [];
        setProducts(Array.isArray(prList) ? prList : []);
      }

      if (resLo.status === 'fulfilled') {
        const val = resLo.value;
        const loList = val?.data?.data || val?.data || val || [];
        setRecentLoHangs(Array.isArray(loList) ? loList : []);
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu khởi tạo:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentLoHangs = async (storeId = historyStoreFilter, search = historySearch) => {
    try {
      const params = { per_page: 50 };
      if (storeId) params.cuaHangId = storeId;
      if (search && search.trim()) params.search = search.trim();
      const res = await getLoHangs(params);
      const loList = res?.data?.data || res?.data || [];
      setRecentLoHangs(Array.isArray(loList) ? loList : []);
    } catch (e) {
      console.error('Lỗi tải lịch sử lô hàng:', e);
    }
  };

  const fetchBranchRequests = async () => {
    try {
      const res = await getBranchRequests();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setBranchRequests(list);
    } catch (e) {
      console.error('Lỗi tải yêu cầu chi nhánh:', e);
    }
  };

  const fetchStoreInvoices = async () => {
    try {
      const params = {};
      if (userStoreId) {
        params.cuaHangId = userStoreId;
      }
      const res = await getHoaDonNhaps(params);
      const list = res?.data?.data || res?.data || [];
      setBranchInvoices(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Lỗi tải phiếu nhập chi nhánh:', e);
    }
  };

  // Giám đốc duyệt yêu cầu nhập hàng khi cần thiết (không trực tiếp tạo đơn nhập hàng mới)
  const handleDirectorApproveRequest = async (req) => {
    if (!isDirector) {
      toast.error('Chỉ Giám đốc mới có quyền phê duyệt yêu cầu nhập hàng này!');
      return;
    }
    try {
      const res = await duyetYeuCauNhapHang(req.ID_YEUCAU, {
        ghi_chu: `Đã được Ban Giám Đốc phê duyệt yêu cầu nhập hàng #${req.ID_YEUCAU}`
      });
      if (res.success || res.status) {
        toast.success(res.message || `Đã phê duyệt Yêu cầu nhập hàng #YC-${req.ID_YEUCAU}! Quản lý chi nhánh có thể tiến hành tạo đơn nhập hàng.`);
        fetchBranchRequests();
      } else {
        toast.error(res.message || 'Không thể phê duyệt yêu cầu.');
      }
    } catch (e) {
      toast.error('Lỗi phê duyệt yêu cầu: ' + (e.response?.data?.message || e.message));
    }
  };

  // Quản lý chi nhánh nạp Yêu cầu đã duyệt vào form tạo đơn nhập hàng cho chi nhánh mình
  const handleSelectRequestToImport = (req) => {
    setSelectedYeuCauId(req.ID_YEUCAU);
    const storeId = userStoreId || req.MACUAHANG_YEUCAU;

    const newItems = (req.details && req.details.length > 0)
      ? req.details.map(d => ({
          MASP: d.MASP,
          SOLUONGTCT: parseInt(d.SOLUONG_YEUCAU) || 30,
          DONGIANHAP: 15000,
          NGAYSX: todayStr,
          HSD_LO: defaultExpStr,
          GHICHU: `Theo yêu cầu #${req.ID_YEUCAU}`
        }))
      : [
          {
            MASP: '',
            SOLUONGTCT: 30,
            DONGIANHAP: 15000,
            NGAYSX: todayStr,
            HSD_LO: defaultExpStr,
            GHICHU: `Theo yêu cầu #${req.ID_YEUCAU}`
          }
        ];

    setNhapForm({
      MANCC: nccList[0]?.id || nccList[0]?.MANCC || '',
      MACUAHANG: storeId || '',
      GHICHU: `Tạo đơn nhập hàng theo Yêu cầu #${req.ID_YEUCAU} của chi nhánh ${req.TENCUAHANG || currentStoreName}`,
      items: newItems
    });

    setManagerTab('create_batch');
    toast.info(`Đã nạp thông tin Yêu cầu #${req.ID_YEUCAU} vào form tạo đơn nhập hàng!`);
  };

  const handleAddItem = () => {
    setNhapForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          MASP: '',
          SOLUONGTCT: 30,
          DONGIANHAP: 15000,
          NGAYSX: todayStr,
          HSD_LO: defaultExpStr,
          GHICHU: ''
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (nhapForm.items.length <= 1) {
      toast.warning('Đơn nhập hàng phải có ít nhất 1 sản phẩm bánh!');
      return;
    }
    setNhapForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNhapForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  // ==========================================
  // XỬ LÝ TẠO ĐƠN NHẬP HÀNG MỚI CỦA QUẢN LÝ CHI NHÁNH / NHÂN VIÊN KHO
  // ==========================================
  const handleBranchManagerCreateImport = async (e) => {
    e.preventDefault();

    if (!isBranchManager && !isWarehouse) {
      toast.error('Chỉ Quản lý chi nhánh hoặc Nhân viên kho mới được phép tạo đơn nhập hàng cho chi nhánh của mình!');
      return;
    }

    const targetStoreId = userStoreId || nhapForm.MACUAHANG;
    if (!nhapForm.MANCC || !targetStoreId) {
      toast.warning('Vui lòng chọn Nhà Cung Cấp và Chi Nhánh Nhập Hàng!');
      return;
    }

    if (!nhapForm.items || nhapForm.items.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 sản phẩm bánh vào đơn nhập hàng!');
      return;
    }

    // Nếu người tạo là Quản lý chi nhánh -> tự động hoàn tất luôn, không cần phải duyệt nữa
    const autoCompleteByManager = isBranchManager;
    const finalKyQuanLy = kyQuanLyData || savedSignature || (isBranchManager ? 'BRANCH_MANAGER_AUTO_APPROVED' : null);

    for (let i = 0; i < nhapForm.items.length; i++) {
      const item = nhapForm.items[i];
      if (!item.MASP) {
        toast.warning(`Dòng thứ ${i + 1}: Vui lòng chọn sản phẩm bánh!`);
        return;
      }
      if (item.NGAYSX && item.HSD_LO < item.NGAYSX) {
        toast.error(`Dòng thứ ${i + 1}: Hạn sử dụng không được nhỏ hơn Ngày sản xuất!`);
        return;
      }
      if (item.HSD_LO < todayStr) {
        toast.error(`Dòng thứ ${i + 1}: Lô bánh mới nhập phải có Hạn sử dụng từ hôm nay trở về sau!`);
        return;
      }
    }

    const payload = {
      MANCC: nhapForm.MANCC,
      MACUAHANG_NHAP: targetStoreId,
      GHICHU: nhapForm.GHICHU,
      yeuCauId: selectedYeuCauId,
      auto_sign_all: autoCompleteByManager,
      ky_quan_ly: autoCompleteByManager ? finalKyQuanLy : null,
      chi_tiet: nhapForm.items.map(item => ({
        MASP: item.MASP,
        SOLUONGTCT: parseInt(item.SOLUONGTCT) || 0,
        SOLUONGTN: parseInt(item.SOLUONGTCT) || 0,
        DONGIANHAP: parseFloat(item.DONGIANHAP) || 0,
        NGAYSX: item.NGAYSX,
        HSD_LO: item.HSD_LO,
        GHICHU: item.GHICHU || ''
      }))
    };

    try {
      const res = await nhapLoHang(payload);
      if (res.success || res.status || res.message) {
        const maPhieu = res.data?.maHoaDonNhap || res.data?.MAHDNHAP || res.data?.hdnhap?.MAHDNHAP || '';
        if (isWarehouse) {
          toast.success(`Nhân viên kho đã tạo yêu cầu nhập lô hàng mới ${maPhieu} thành công! Đang chờ Quản lý chi nhánh phê duyệt.`);
        } else {
          toast.success(`Quản lý chi nhánh đã tạo Đơn Nhập Hàng ${maPhieu} thành công! Đơn được hoàn tất và cộng tồn kho ngay lập tức, không cần phải duyệt lại.`);
        }

        setNhapForm({
          MANCC: '',
          MACUAHANG: userStoreId ? String(userStoreId) : '',
          GHICHU: '',
          items: [
            {
              MASP: '',
              SOLUONGTCT: 30,
              DONGIANHAP: 15000,
              NGAYSX: todayStr,
              HSD_LO: defaultExpStr,
              GHICHU: ''
            }
          ]
        });
        setSelectedYeuCauId(null);
        setKyQuanLyData(savedSignature || null);
        setSigManagerKey(prev => prev + 1);
        fetchBranchRequests();
        fetchStoreInvoices();
        fetchRecentLoHangs();
      } else {
        toast.error(res.error || res.message || 'Lỗi tạo đơn nhập hàng');
      }
    } catch (e) {
      toast.error('Lỗi tạo đơn nhập hàng: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    }
  };

  // ==========================================
  // XỬ LÝ TRA CỨU & ĐỒNG KIỂM PHIẾU NHẬP
  // ==========================================
  const handleSearchInvoice = async (maCanTim) => {
    const ma = (maCanTim || searchMaPhieu || '').trim();
    if (!ma) {
      toast.warning('Vui lòng nhập Mã phiếu nhập (VD: HDN-...) hoặc chọn trong danh sách!');
      return;
    }

    setIsLoading(true);
    try {
      const res = await getHoaDonNhapDetail(ma);
      const invoice = res?.data || res;
      if (!invoice || !invoice.id) {
        toast.error(`Không tìm thấy thông tin phiếu nhập: "${ma}"`);
        setSelectedInvoice(null);
        return;
      }

      setSelectedInvoice(invoice);

      const details = invoice.chiTiets || invoice.chi_tiets || [];
      const preparedItems = details.map(d => {
        const lo = d.loHang || d.lo_hang;
        const sp = d.sanPham || d.san_pham;
        const slChungTu = Number(d.soLuong ?? lo?.soLuongNhap ?? 0);
        const slThucNhan = (invoice.trangThai === 1 && lo?.soLuongCon !== undefined)
          ? Number(lo.soLuongCon)
          : slChungTu;

        return {
          chiTietId: d.id,
          loHangId: d.loHangId || lo?.id,
          sanPhamId: d.sanPhamId || sp?.id,
          tenSanPham: sp?.tenSanPham || sp?.TENSP || `Bánh #${d.sanPhamId}`,
          donViTinh: sp?.donViTinh || 'Cái',
          hsd: lo?.hsd || '-',
          soLuongChungTu: slChungTu,
          soLuongThucNhan: slThucNhan,
          lyDoHaoHut: ''
        };
      });

      setCheckItems(preparedItems);
      setGhiChuKiemDem('');
      setKyVanChuyenData(null);
      setKyNguoiNhanData(savedSignature || null);
      setSigCarrierKey(prev => prev + 1);
      setSigReceiverKey(prev => prev + 1);

      toast.success(`Đã tải thành công Phiếu Nhập ${invoice.maHoaDonNhap}!`);
    } catch (e) {
      toast.error('Lỗi tra cứu phiếu nhập: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCheckQty = (index, value) => {
    const val = parseInt(value, 10);
    setCheckItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        soLuongThucNhan: isNaN(val) ? 0 : Math.max(0, val)
      };
      return copy;
    });
  };

  const handleUpdateCheckReason = (index, value) => {
    setCheckItems(prev => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        lyDoHaoHut: value
      };
      return copy;
    });
  };

  const handleBranchConfirmReceipt = async (e) => {
    e.preventDefault();

    if (!selectedInvoice) {
      toast.warning('Vui lòng tra cứu hoặc chọn một phiếu nhập để kiểm tra!');
      return;
    }

    if (selectedInvoice.trangThai === 1) {
      toast.info('Phiếu nhập này đã hoàn tất ký duyệt và nhập kho từ trước!');
      return;
    }

    const finalKyNguoiNhan = kyNguoiNhanData || savedSignature;
    if (!finalKyNguoiNhan) {
      toast.warning('Vui lòng vẽ Chữ ký xác nhận của bạn trước khi gửi (hoặc lưu sẵn chữ ký tại Thông tin cá nhân)!');
      return;
    }

    const payload = {
      ten_van_chuyen: tenVanChuyen,
      ky_van_chuyen: kyVanChuyenData,
      ten_nguoi_nhan: tenNguoiNhan,
      ky_nguoi_nhan: finalKyNguoiNhan,
      ghi_chu: ghiChuKiemDem || 'Đã kiểm đếm số lượng thực tế',
      items: checkItems.map(item => ({
        loHangId: item.loHangId,
        sanPhamId: item.sanPhamId,
        soLuongThucNhan: item.soLuongThucNhan,
        lyDoHaoHut: item.lyDoHaoHut
      }))
    };

    setIsLoading(true);
    try {
      const res = await xacNhanNhapKho(selectedInvoice.id, payload);
      if (res.success || res.status) {
        toast.success(res.message || `Đã ghi nhận chữ ký và kiểm đếm cho phiếu ${selectedInvoice.maHoaDonNhap}!`);
        setSelectedInvoice(res.data || selectedInvoice);
        fetchStoreInvoices();
        fetchInitialData();
      } else {
        toast.error(res.message || 'Lỗi xác nhận phiếu nhập');
      }
    } catch (e) {
      toast.error('Lỗi xác nhận: ' + (e.response?.data?.message || e.response?.data?.error || e.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Lọc yêu cầu nhập hàng cho Quản lý chi nhánh (ưu tiên chi nhánh của mình)
  const filteredBranchRequests = isBranchManager && userStoreId
    ? branchRequests.filter(r => !r.MACUAHANG_YEUCAU || String(r.MACUAHANG_YEUCAU) === String(userStoreId))
    : branchRequests;

  return (
    <AdminLayout>
      {/* HEADER TRANG */}
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>
            Nhập lô hàng
          </h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>
            {isDirector
              ? 'Ban Giám Đốc chỉ xem xét và phê duyệt các đơn yêu cầu nhập hàng từ chi nhánh khi cần thiết (không trực tiếp tạo đơn nhập hàng mới).'
              : isBranchManager
                ? `Quản lý chi nhánh chủ động tạo đơn nhập hàng mới cho ${currentStoreName}. Nếu Quản lý chi nhánh đã ký duyệt thì đơn hoàn tất ngay không cần các role khác ký.`
                : isAdmin
                  ? 'Quản trị viên (Admin) theo dõi lịch sử nhập hàng toàn hệ thống (không trực tiếp tạo đơn và không tham gia ký duyệt).'
                  : `Kiểm tra đối chiếu đơn nhập hàng tại ${currentStoreName}. Nếu Quản lý chi nhánh chưa ký duyệt thì cần chữ ký của Nhân viên kho và Nhân viên kế toán.`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {userStoreId && (
            <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fa-solid fa-store"></i> {currentStoreName}
            </div>
          )}
          {!isAdmin && !isDirector && (
            <Link
              to="/admin/duyet-ky-so"
              className="admin-btn admin-btn-primary"
              style={{ textDecoration: 'none', padding: '7px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <i className="fa-solid fa-file-signature"></i> Đi tới Duyệt & Ký số
            </Link>
          )}
        </div>
      </div>

      {/* BANNER QUY TẮC PHÂN QUYỀN */}
      <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem', fontSize: '13px', color: '#334155', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <i className="fa-solid fa-shield-halved" style={{ fontSize: '18px', color: '#2563eb', marginTop: '2px' }}></i>
        <div>
          <strong>Quy định phân quyền Tạo đơn nhập hàng & Ký duyệt:</strong>
          <ul style={{ margin: '4px 0 0 0', paddingLeft: '18px', lineHeight: 1.6 }}>
            <li><b>Quản lý chi nhánh:</b> Trực tiếp tạo đơn nhập hàng mới cho chi nhánh của mình. Nếu <b>Quản lý chi nhánh đã ký duyệt</b> (trên đơn nhập hàng hoặc biên bản hủy) thì <b>hoàn tất ngay</b>, không cần các role khác ký nữa.</li>
            <li><b>Nhân viên kho & Nhân viên kế toán:</b> Nếu không có chữ ký phê duyệt của Quản lý chi nhánh thì bắt buộc phải có đủ chữ ký của cả <b>Nhân viên kho</b> và <b>Nhân viên kế toán</b>. Mỗi tài khoản chỉ được ký đúng vị trí role của mình.</li>
            <li><b>Giám đốc:</b> Chỉ phê duyệt các đơn yêu cầu nhập hàng khi cần thiết, không trực tiếp tạo đơn nhập hàng mới. <b>Admin:</b> Không được phép tham gia ký duyệt.</li>
          </ul>
        </div>
      </div>

      {/* ========================================================
          GIAO DIỆN DÀNH CHO GIÁM ĐỐC HOẶC ADMIN:
          CHỈ DUYỆT YÊU CẦU NHẬP HÀNG KHI CẦN THIẾT (KHÔNG TẠO ĐƠN MỚI)
          ======================================================== */}
      {(isDirector || isAdmin) && (
        <div className="admin-card" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>
                Danh Sách Yêu Cầu Nhập Hàng Từ Các Chi Nhánh ({branchRequests.filter(r => r.TRANGTHAI_CODE === 0 || r.TRANGTHAI === 'Chờ tiếp nhận').length} chờ duyệt)
              </h2>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                {isDirector
                  ? 'Ban Giám Đốc phê duyệt chủ trương các đơn yêu cầu nhập hàng khi cần thiết. Sau khi duyệt, Quản lý chi nhánh sẽ tự tạo đơn nhập hàng cho chi nhánh của họ.'
                  : 'Danh sách các yêu cầu nhập hàng từ chi nhánh (Admin chỉ xem giám sát).'}
              </p>
            </div>
            <button type="button" className="admin-btn admin-btn-info" onClick={fetchBranchRequests} style={{ fontSize: '12px', padding: '6px 12px' }}>
              <i className="fa-solid fa-rotate-right" style={{ marginRight: '4px' }}></i> Làm mới
            </button>
          </div>

          <div className="admin-table-container">
            <table className="admin-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9' }}>
                  <th>Mã Yêu Cầu</th>
                  <th>Chi Nhánh Yêu Cầu</th>
                  <th>Người Tạo</th>
                  <th>Ngày Gửi</th>
                  <th>Danh Sách Sản Phẩm Cần Nhập</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'center' }}>Thao Tác Phê Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {branchRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                      Hiện tại không có yêu cầu nhập hàng nào từ các chi nhánh.
                    </td>
                  </tr>
                ) : (
                  branchRequests.map(req => {
                    const isPending = req.TRANGTHAI_CODE === 0 || req.TRANGTHAI === 'Chờ tiếp nhận';
                    return (
                      <tr key={req.ID_YEUCAU} style={{ backgroundColor: isPending ? '#fefce8' : 'transparent' }}>
                        <td><b>#YC-{req.ID_YEUCAU}</b></td>
                        <td>
                          <span style={{ fontWeight: 'bold', color: '#0369a1' }}>
                            <i className="fa-solid fa-store" style={{ marginRight: '5px' }}></i>
                            {req.TENCUAHANG}
                          </span>
                        </td>
                        <td>{req.TEN_NGUOITAO}</td>
                        <td>{formatDateOnly(req.NGAYTAO)}</td>
                        <td>
                          {req.details && req.details.length > 0 ? (
                            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#334155' }}>
                              {req.details.map((d, i) => (
                                <li key={i}>
                                  <b>{d.TENSP}</b>: <span style={{ color: '#059669', fontWeight: 'bold' }}>{d.SOLUONG_YEUCAU} cái</span>
                                </li>
                              ))}
                            </ul>
                          ) : <span style={{ color: '#888' }}>-</span>}
                        </td>
                        <td>
                          <span className={`admin-badge ${isPending ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                            {req.TRANGTHAI}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {isDirector ? (
                            isPending ? (
                              <button
                                type="button"
                                className="admin-btn admin-btn-success"
                                onClick={() => handleDirectorApproveRequest(req)}
                                style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}
                              >
                                <i className="fa-solid fa-check-double" style={{ marginRight: '5px' }}></i>
                                Phê Duyệt Yêu Cầu
                              </button>
                            ) : (
                              <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '12px' }}>
                                <i className="fa-solid fa-circle-check"></i> Đã phê duyệt
                              </span>
                            )
                          ) : (
                            <span style={{ color: '#64748b', fontSize: '12px', fontStyle: 'italic' }}>Chỉ xem</span>
                          )}
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

      {/* ========================================================
          GIAO DIỆN DÀNH CHO QUẢN LÝ CHI NHÁNH:
          TỰ TẠO ĐƠN NHẬP HÀNG MỚI CHO CHI NHÁNH CỦA MÌNH
          ======================================================== */}
      {(isBranchManager || isWarehouse) && (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`admin-btn ${managerTab === 'create_batch' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setManagerTab('create_batch')}
              style={{ padding: '8px 18px', fontSize: '14px', borderRadius: '8px' }}
            >
              <i className="fa-solid fa-plus-circle" style={{ marginRight: '6px' }}></i>
              {isWarehouse ? '1. Tạo Yêu Cầu Nhập Lô Hàng Mới' : '1. Tạo Đơn Nhập Hàng Mới Cho Chi Nhánh'}
            </button>
            <button
              type="button"
              className={`admin-btn ${managerTab === 'requests' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setManagerTab('requests')}
              style={{ padding: '8px 18px', fontSize: '14px', borderRadius: '8px' }}
            >
              <i className="fa-solid fa-clipboard-check" style={{ marginRight: '6px' }}></i>
              2. Tạo Nhanh Từ Yêu Cầu Nhập Hàng ({filteredBranchRequests.length})
            </button>
            <button
              type="button"
              className={`admin-btn ${managerTab === 'inspect' ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              onClick={() => setManagerTab('inspect')}
              style={{ padding: '8px 18px', fontSize: '14px', borderRadius: '8px' }}
            >
              <i className="fa-solid fa-boxes-packing" style={{ marginRight: '6px' }}></i>
              {isBranchManager
                ? `3. Duyệt & Kiểm Đếm Phiếu Nhập (${branchInvoices.filter(i => i.trangThai === 0).length} chờ xử lý)`
                : `3. Tra Cứu Phiếu Nhập (${branchInvoices.filter(i => i.trangThai === 0).length} chờ xử lý)`}
            </button>
          </div>

          {/* TAB 1: FORM TẠO ĐƠN NHẬP HÀNG MỚI CỦA QUẢN LÝ CHI NHÁNH */}
          {managerTab === 'create_batch' && (
            <div className="admin-card" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>
                    {isWarehouse
                      ? `Tạo Yêu Cầu Nhập Lô Hàng Mới Cho ${currentStoreName}`
                      : `Tạo Đơn Nhập Hàng Mới Cho ${currentStoreName}`}
                  </h2>
                  <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                    {isWarehouse
                      ? 'Nhân viên kho lập phiếu yêu cầu nhập lô hàng mới từ nhà cung cấp, trình Quản lý chi nhánh phê duyệt.'
                      : (selectedYeuCauId
                        ? `Đang lập đơn nhập hàng từ Yêu Cầu #${selectedYeuCauId}.`
                        : 'Quản lý chi nhánh trực tiếp lập đơn nhập hàng mới cho chi nhánh của mình.')}
                  </p>
                </div>

                {selectedYeuCauId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '4px 10px', borderRadius: '14px', fontSize: '12px', fontWeight: 'bold' }}>
                      Liên kết Yêu Cầu #{selectedYeuCauId}
                    </span>
                    <button
                      type="button"
                      className="admin-btn admin-btn-secondary"
                      style={{ padding: '3px 8px', fontSize: '11px' }}
                      onClick={() => setSelectedYeuCauId(null)}
                    >
                      Bỏ liên kết
                    </button>
                  </div>
                )}
              </div>

              <form onSubmit={handleBranchManagerCreateImport}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label className="admin-label">Nhà Cung Cấp Bánh <span style={{ color: 'red' }}>*</span></label>
                    <select
                      className="admin-select"
                      value={nhapForm.MANCC}
                      onChange={e => setNhapForm({ ...nhapForm, MANCC: e.target.value })}
                      required
                    >
                      <option value="">-- Chọn Nhà Cung Cấp --</option>
                      {nccList.map(n => {
                        const id = n.id ?? n.MANCC;
                        const name = n.tenNcc || n.TENNCC;
                        return (
                          <option key={id} value={id}>{name} (Mã: {id})</option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label className="admin-label">Chi Nhánh Nhập Kho <span style={{ color: 'red' }}>*</span></label>
                    {userStoreId ? (
                      <input
                        type="text"
                        className="admin-input"
                        value={`${currentStoreName} (#${userStoreId})`}
                        disabled
                        style={{ backgroundColor: '#e2e8f0', fontWeight: 'bold', color: '#0f172a', cursor: 'not-allowed' }}
                      />
                    ) : (
                      <select
                        className="admin-select"
                        value={nhapForm.MACUAHANG}
                        onChange={e => setNhapForm({ ...nhapForm, MACUAHANG: e.target.value })}
                        required
                      >
                        <option value="">-- Chọn Chi Nhánh Nhận --</option>
                        {stores.map(s => {
                          const id = s.id ?? s.MACUAHANG;
                          const name = s.tenCuaHang || s.TENCUAHANG || s.ten_cuahang || s.name;
                          return (
                            <option key={id} value={id}>{name} (#{id})</option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  <div className="admin-form-group" style={{ margin: 0 }}>
                    <label className="admin-label">Ghi Chú Đơn Nhập Hàng</label>
                    <input
                      type="text"
                      className="admin-input"
                      placeholder="VD: Nhập lô bánh mới phục vụ ca sáng tại chi nhánh..."
                      value={nhapForm.GHICHU}
                      onChange={e => setNhapForm({ ...nhapForm, GHICHU: e.target.value })}
                    />
                  </div>
                </div>

                {/* BẢNG CHI TIẾT SẢN PHẨM NHẬP */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--admin-primary)' }}>
                      Danh sách sản phẩm bánh trong đơn nhập ({nhapForm.items.length})
                    </h3>
                    <button type="button" className="admin-btn admin-btn-info" onClick={handleAddItem} style={{ padding: '5px 12px', fontSize: '12px' }}>
                      <i className="fa-solid fa-plus" style={{ marginRight: '4px' }}></i> Thêm Dòng Bánh
                    </button>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table" style={{ minWidth: '1150px', width: '100%', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f1f5f9' }}>
                          <th style={{ width: '45px', textAlign: 'center', whiteSpace: 'nowrap' }}>STT</th>
                          <th style={{ minWidth: '230px', width: '250px', whiteSpace: 'nowrap' }}>Sản Phẩm Bánh *</th>
                          <th style={{ minWidth: '135px', width: '145px', whiteSpace: 'nowrap', textAlign: 'center' }}>Số Lượng Nhập *</th>
                          <th style={{ minWidth: '175px', width: '190px', whiteSpace: 'nowrap' }}>Đơn Giá Nhập (đ) *</th>
                          <th style={{ minWidth: '145px', width: '150px', whiteSpace: 'nowrap' }}>Ngày Sản Xuất</th>
                          <th style={{ minWidth: '145px', width: '150px', whiteSpace: 'nowrap' }}>Hạn Sử Dụng *</th>
                          <th style={{ minWidth: '180px', width: '200px', whiteSpace: 'nowrap' }}>Ghi Chú</th>
                          <th style={{ width: '55px', textAlign: 'center', whiteSpace: 'nowrap' }}>Xóa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {nhapForm.items.map((item, idx) => (
                          <tr key={idx}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b', verticalAlign: 'middle' }}>{idx + 1}</td>
                            <td style={{ minWidth: '230px', verticalAlign: 'middle' }}>
                              <select
                                className="admin-select"
                                value={item.MASP}
                                onChange={e => handleItemChange(idx, 'MASP', e.target.value)}
                                required
                                style={{ padding: '8px 10px', width: '100%', minWidth: '210px', fontSize: '14px', marginBottom: 0, boxSizing: 'border-box' }}
                              >
                                <option value="">-- Chọn Bánh --</option>
                                {products.map(p => {
                                  const id = p.id ?? p.MASP;
                                  const name = p.tenSanPham || p.TENSP || p.name;
                                  return (
                                    <option key={id} value={id}>{name} (Mã: {id})</option>
                                  );
                                })}
                              </select>
                            </td>
                            <td style={{ minWidth: '135px', verticalAlign: 'middle' }}>
                              <input
                                type="number"
                                className="admin-input"
                                min="1"
                                value={item.SOLUONGTCT}
                                onChange={e => handleItemChange(idx, 'SOLUONGTCT', e.target.value)}
                                required
                                style={{
                                  padding: '8px 10px',
                                  width: '100%',
                                  minWidth: '120px',
                                  fontSize: '15px',
                                  fontWeight: 'bold',
                                  color: '#0369a1',
                                  textAlign: 'center',
                                  marginBottom: 0,
                                  boxSizing: 'border-box'
                                }}
                              />
                            </td>
                            <td style={{ minWidth: '175px', verticalAlign: 'middle' }}>
                              <input
                                type="number"
                                className="admin-input"
                                min="0"
                                step="500"
                                value={item.DONGIANHAP}
                                onChange={e => handleItemChange(idx, 'DONGIANHAP', e.target.value)}
                                required
                                style={{
                                  padding: '8px 10px',
                                  width: '100%',
                                  minWidth: '160px',
                                  fontSize: '15px',
                                  fontWeight: 'bold',
                                  color: '#b45309',
                                  marginBottom: 0,
                                  boxSizing: 'border-box'
                                }}
                              />
                              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                                {Number(item.DONGIANHAP || 0).toLocaleString('vi-VN')} ₫ / cái
                              </div>
                            </td>
                            <td style={{ minWidth: '145px', verticalAlign: 'middle' }}>
                              <input
                                type="date"
                                className="admin-input"
                                value={item.NGAYSX}
                                onChange={e => handleItemChange(idx, 'NGAYSX', e.target.value)}
                                style={{ padding: '8px 10px', width: '100%', minWidth: '135px', fontSize: '13px', marginBottom: 0, boxSizing: 'border-box' }}
                              />
                            </td>
                            <td style={{ minWidth: '145px', verticalAlign: 'middle' }}>
                              <input
                                type="date"
                                className="admin-input"
                                value={item.HSD_LO}
                                onChange={e => handleItemChange(idx, 'HSD_LO', e.target.value)}
                                required
                                style={{ padding: '8px 10px', width: '100%', minWidth: '135px', fontSize: '13px', marginBottom: 0, boxSizing: 'border-box', borderColor: item.HSD_LO < todayStr ? '#ef4444' : '' }}
                              />
                            </td>
                            <td style={{ minWidth: '180px', verticalAlign: 'middle' }}>
                              <input
                                type="text"
                                className="admin-input"
                                placeholder="Ghi chú quy cách..."
                                value={item.GHICHU}
                                onChange={e => handleItemChange(idx, 'GHICHU', e.target.value)}
                                style={{ padding: '8px 10px', width: '100%', minWidth: '165px', fontSize: '13px', marginBottom: 0, boxSizing: 'border-box' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn-danger"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                                onClick={() => handleRemoveItem(idx)}
                                title="Xóa dòng này"
                              >
                                <i className="fa-solid fa-xmark"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* THÔNG BÁO TỰ ĐỘNG HOÀN TẤT KHI QUẢN LÝ CHI NHÁNH LÀ NGƯỜI TẠO ĐƠN */}
                {isBranchManager && (
                  <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px 16px', marginBottom: '1.5rem', color: '#166534', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <i className="fa-solid fa-circle-check" style={{ fontSize: '18px', color: '#16a34a' }}></i>
                    <div>
                      <strong>Quyền Quản lý chi nhánh:</strong> Vì bạn là <b>Quản lý chi nhánh</b> trực tiếp tạo đơn nhập hàng này, hệ thống sẽ <b>tự động hoàn tất đơn và cộng tồn kho ngay lập tức</b> mà không cần phải qua bước chờ duyệt nữa.
                    </div>
                  </div>
                )}

                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-success"
                    style={{ padding: '10px 24px', fontSize: '15px' }}
                  >
                    <i className="fa-solid fa-stamp" style={{ marginRight: '8px' }}></i>
                    {isWarehouse
                      ? 'Gửi Yêu Cầu Nhập Lô Hàng Mới (Chờ Quản Lý Duyệt)'
                      : 'Tạo Đơn Nhập Hàng & Hoàn Tất Nhập Kho Ngay'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: DANH SÁCH YÊU CẦU NHẬP HÀNG CỦA CHI NHÁNH ĐỂ NẠP NHANH */}
          {managerTab === 'requests' && (
            <div className="admin-card" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>Danh Sách Yêu Cầu Nhập Hàng Của Chi Nhánh</h2>
                  <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                    Chọn một yêu cầu nhập hàng (đặc biệt các yêu cầu đã được Giám đốc duyệt) để nạp nhanh danh sách bánh vào form tạo đơn nhập hàng.
                  </p>
                </div>
                <button type="button" className="admin-btn admin-btn-info" onClick={fetchBranchRequests} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  <i className="fa-solid fa-rotate-right" style={{ marginRight: '4px' }}></i> Làm mới
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table" style={{ fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th>Mã Yêu Cầu</th>
                      <th>Chi Nhánh</th>
                      <th>Người Tạo</th>
                      <th>Ngày Gửi</th>
                      <th>Sản Phẩm Yêu Cầu</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: 'center' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBranchRequests.length === 0 ? (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: '#888' }}>
                          Chưa có yêu cầu nhập hàng nào cho chi nhánh.
                        </td>
                      </tr>
                    ) : (
                      filteredBranchRequests.map(req => {
                        const isPending = req.TRANGTHAI_CODE === 0 || req.TRANGTHAI === 'Chờ tiếp nhận';
                        return (
                          <tr key={req.ID_YEUCAU}>
                            <td><b>#YC-{req.ID_YEUCAU}</b></td>
                            <td><b>{req.TENCUAHANG}</b></td>
                            <td>{req.TEN_NGUOITAO}</td>
                            <td>{formatDateOnly(req.NGAYTAO)}</td>
                            <td>
                              {req.details && req.details.length > 0 ? (
                                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px' }}>
                                  {req.details.map((d, i) => (
                                    <li key={i}><b>{d.TENSP}</b>: {d.SOLUONG_YEUCAU} cái</li>
                                  ))}
                                </ul>
                              ) : '-'}
                            </td>
                            <td>
                              <span className={`admin-badge ${isPending ? 'admin-badge-warning' : 'admin-badge-success'}`}>
                                {req.TRANGTHAI}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className="admin-btn admin-btn-primary"
                                onClick={() => handleSelectRequestToImport(req)}
                                style={{ padding: '5px 12px', fontSize: '12px' }}
                              >
                                <i className="fa-solid fa-file-import" style={{ marginRight: '4px' }}></i>
                                Nạp Vào Form Tạo Đơn
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
          )}
        </>
      )}

      {/* ========================================================
          GIAO DIỆN KIỂM ĐẾM & TRA CỨU PHIẾU NHẬP
          (Hiển thị cho Nhân viên kho / Kế toán, hoặc khi Quản lý chi nhánh chọn tab 'inspect')
          ======================================================== */}
      {((!isDirector && !isAdmin && !isBranchManager) || (isBranchManager && managerTab === 'inspect')) && (
        <div className="admin-card" style={{ width: '100%', boxSizing: 'border-box', marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
            <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>
              Tra Cứu Phiếu Nhập Hàng & Kiểm Đếm Chi Nhánh
            </h2>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
              Tra cứu mã phiếu nhập hàng của chi nhánh để kiểm đếm số lượng thực tế và ký xác nhận theo đúng vai trò.
            </p>
          </div>

          <div style={{ backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '16px', marginBottom: '1.5rem' }}>
            <label className="admin-label" style={{ fontWeight: 'bold', fontSize: '14px', color: '#1e293b' }}>
              <i className="fa-solid fa-barcode" style={{ marginRight: '6px' }}></i>
              Nhập Mã Phiếu Nhập Hàng Để Kiểm Tra:
            </label>
            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <input
                type="text"
                className="admin-input"
                placeholder="Nhập mã phiếu nhập (VD: HDN-...) hoặc mã số ID..."
                value={searchMaPhieu}
                onChange={e => setSearchMaPhieu(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearchInvoice(); }}
                style={{ fontSize: '14px', padding: '8px 12px' }}
              />
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                onClick={() => handleSearchInvoice()}
                style={{ padding: '8px 20px', whiteSpace: 'nowrap' }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '6px' }}></i> Tra Cứu
              </button>
            </div>

            {branchInvoices.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'bold', marginRight: '8px' }}>
                  Các phiếu nhập tại {currentStoreName}:
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {branchInvoices.slice(0, 8).map(inv => {
                    const isPending = inv.trangThai === 0;
                    return (
                      <button
                        key={inv.id}
                        type="button"
                        onClick={() => {
                          setSearchMaPhieu(inv.maHoaDonNhap || inv.id);
                          handleSearchInvoice(inv.maHoaDonNhap || inv.id);
                        }}
                        style={{
                          backgroundColor: selectedInvoice?.id === inv.id ? '#0284c7' : (isPending ? '#fff7ed' : '#f1f5f9'),
                          color: selectedInvoice?.id === inv.id ? '#fff' : (isPending ? '#c2410c' : '#475569'),
                          border: `1px solid ${isPending ? '#fdba74' : '#cbd5e1'}`,
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: isPending ? 'bold' : 'normal'
                        }}
                      >
                        {inv.maHoaDonNhap} ({isPending ? 'Chờ ký duyệt' : 'Đã hoàn tất'})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {selectedInvoice && (
            <form onSubmit={handleBranchConfirmReceipt}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '14px', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ color: '#166534', fontWeight: 'bold' }}>Mã Phiếu Nhập:</span>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#14532d' }}>{selectedInvoice.maHoaDonNhap}</div>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn-info"
                    onClick={() => handleOpenPrintModal(selectedInvoice)}
                    style={{ padding: '5px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <i className="fa-solid fa-print"></i> In Phiếu
                  </button>
                </div>
                <div>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>Nhà Cung Cấp:</span>
                  <div>{selectedInvoice.nhaCungCap?.tenNcc || selectedInvoice.nhaCungCap?.TENNCC || '-'}</div>
                </div>
                <div>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>Ngày Lập Phiếu:</span>
                  <div>{formatDateOnly(selectedInvoice.ngayNhap)}</div>
                </div>
                <div>
                  <span style={{ color: '#166534', fontWeight: 'bold' }}>Trạng Thái:</span>
                  <div>
                    {selectedInvoice.trangThai === 1 ? (
                      <span className="admin-badge admin-badge-success">Đã Ký Duyệt & Nhập Kho Hoàn Tất</span>
                    ) : (
                      <span className="admin-badge admin-badge-warning">Chờ Ký Duyệt (Quản Lý CN hoặc Kho + Kế Toán)</span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', color: 'var(--admin-primary)' }}>
                  <i className="fa-solid fa-list-check" style={{ marginRight: '6px' }}></i>
                  Bảng Đối Chiếu Sản Phẩm: SL Chứng Từ vs SL Thực Nhận
                </h3>

                <div style={{ overflowX: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ width: '40px' }}>STT</th>
                        <th>Tên Bánh</th>
                        <th style={{ width: '120px' }}>Hạn Sử Dụng</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>SL Chứng Từ</th>
                        <th style={{ width: '160px', textAlign: 'center' }}>SL Thực Nhận *</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>Đối Chiếu</th>
                        <th>Ghi Chú Kiểm Đếm / Hao Hụt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {checkItems.map((item, idx) => {
                        const diff = item.soLuongThucNhan - item.soLuongChungTu;
                        const isMatch = diff === 0;
                        const isShort = diff < 0;

                        return (
                          <tr key={idx} style={{ backgroundColor: isShort ? '#fef2f2' : 'transparent' }}>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                            <td>
                              <b>{item.tenSanPham}</b>
                              <div style={{ fontSize: '11px', color: '#888' }}>ĐVT: {item.donViTinh}</div>
                            </td>
                            <td>{formatDateOnly(item.hsd)}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '14px' }}>
                              {item.soLuongChungTu}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {selectedInvoice.trangThai === 1 ? (
                                <span style={{ fontWeight: 'bold', fontSize: '14px', color: isShort ? '#dc2626' : '#16a34a' }}>
                                  {item.soLuongThucNhan}
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  className="admin-input"
                                  min="0"
                                  value={item.soLuongThucNhan}
                                  onChange={e => handleUpdateCheckQty(idx, e.target.value)}
                                  required
                                  style={{
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '14px',
                                    padding: '6px 8px',
                                    borderColor: isShort ? '#ef4444' : '#16a34a',
                                    color: isShort ? '#dc2626' : '#15803d'
                                  }}
                                />
                              )}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isMatch ? (
                                <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                  ✓ Đủ Hàng
                                </span>
                              ) : isShort ? (
                                <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                  Thiếu {Math.abs(diff)} cái
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                                  Dư +{diff} cái
                                </span>
                              )}
                            </td>
                            <td>
                              {selectedInvoice.trangThai === 1 ? (
                                <span>{item.lyDoHaoHut || '-'}</span>
                              ) : (
                                <input
                                  type="text"
                                  className="admin-input"
                                  placeholder={isShort ? 'Bắt buộc ghi lý do thiếu/hư hỏng...' : 'Ghi chú bao bì, nhiệt độ...'}
                                  value={item.lyDoHaoHut}
                                  onChange={e => handleUpdateCheckReason(idx, e.target.value)}
                                  style={{ padding: '6px 8px' }}
                                />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedInvoice.trangThai !== 1 && (
                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '14px', marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#1e40af', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-signature"></i> Chữ Ký Xác Nhận Theo Vai Trò Của Bạn <span style={{ color: 'red' }}>*</span>
                  </h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#1e3a8a' }}>
                    Hệ thống sẽ tự động ghi nhận chữ ký vào đúng vị trí role của bạn (Quản lý chi nhánh / Nhân viên kho / Nhân viên kế toán).
                  </p>
                  {(kyNguoiNhanData || savedSignature) && (
                    <div style={{ backgroundColor: '#dcfce7', border: '1px solid #86efac', color: '#166534', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', marginBottom: '10px', fontWeight: 600 }}>
                      <i className="fa-solid fa-circle-check" style={{ marginRight: '6px' }}></i>
                      Đã tự động nạp chữ ký số đã lưu của bạn. Bạn có thể bấm <b>Xác Nhận Kiểm Đếm & Ký Duyệt</b> ngay mà không cần ký lại.
                    </div>
                  )}
                  <SignatureCanvas
                    key={sigReceiverKey}
                    height={180}
                    initialSignature={kyNguoiNhanData || savedSignature}
                    onSave={(base64Img) => setKyNguoiNhanData(base64Img)}
                    onClear={() => setKyNguoiNhanData(null)}
                  />
                </div>
              )}

              {selectedInvoice.trangThai !== 1 && (
                <div style={{ textAlign: 'right' }}>
                  <button
                    type="submit"
                    className="admin-btn admin-btn-success"
                    disabled={isLoading}
                    style={{ padding: '10px 24px', fontSize: '15px' }}
                  >
                    <i className="fa-solid fa-box-open" style={{ marginRight: '8px' }}></i>
                    {isLoading ? 'Đang Xử Lý...' : 'Xác Nhận Kiểm Đếm & Ký Duyệt Phiếu Nhập'}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}

      {/* LỊCH SỬ CÁC LÔ HÀNG VỪA NHẬP KHO GẦN ĐÂY */}
      <div className="admin-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '1.25rem' }}>
          <div>
            <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>
              Lịch Sử Các Lô Hàng Đã Ghi Nhận Trong Hệ Thống
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              Danh sách chi tiết các lô hàng đã lập và phân bổ về các chi nhánh ({recentLoHangs.length} lô hàng hiển thị).
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155', whiteSpace: 'nowrap' }}>
                <i className="fa-solid fa-store" style={{ marginRight: '4px', color: '#6366f1' }}></i> Chi nhánh:
              </span>
              <select
                className="admin-select"
                style={{ width: 'auto', minWidth: '200px', padding: '6px 10px', fontSize: '13px' }}
                value={historyStoreFilter}
                onChange={e => {
                  setHistoryStoreFilter(e.target.value);
                  fetchRecentLoHangs(e.target.value, historySearch);
                }}
              >
                <option value="">-- Tất cả chi nhánh --</option>
                {stores.map(s => {
                  const id = s.id ?? s.MACUAHANG;
                  const name = s.tenCuaHang || s.TENCUAHANG;
                  return (
                    <option key={id} value={id}>{name}</option>
                  );
                })}
              </select>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="admin-input"
                placeholder="Tìm mã lô, mã phiếu, tên bánh..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    fetchRecentLoHangs(historyStoreFilter, historySearch);
                  }
                }}
                style={{ padding: '6px 10px', paddingRight: '28px', fontSize: '13px', minWidth: '230px' }}
              />
              {historySearch && (
                <i
                  className="fa-solid fa-xmark"
                  onClick={() => {
                    setHistorySearch('');
                    fetchRecentLoHangs(historyStoreFilter, '');
                  }}
                  style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#94a3b8' }}
                ></i>
              )}
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-primary"
              onClick={() => fetchRecentLoHangs(historyStoreFilter, historySearch)}
              style={{ padding: '6px 14px', fontSize: '13px' }}
              title="Tìm kiếm & Tải lại danh sách"
            >
              <i className="fa-solid fa-magnifying-glass" style={{ marginRight: '4px' }}></i> Lọc
            </button>
          </div>
        </div>

        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải lịch sử lô hàng...</p>
        ) : (
          <div className="admin-table-container" style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ minWidth: '1200px', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ width: '130px' }}>Mã Lô</th>
                  <th style={{ width: '140px' }}>Mã Phiếu Nhập</th>
                  <th style={{ minWidth: '170px' }}>Chi Nhánh Nhận</th>
                  <th style={{ minWidth: '200px' }}>Sản Phẩm Bánh</th>
                  <th style={{ minWidth: '180px' }}>NCC Cung Cấp</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>SL Chứng Từ</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>SL Thực Nhận</th>
                  <th style={{ width: '110px' }}>Đơn Giá Nhập</th>
                  <th style={{ width: '100px' }}>Ngày SX</th>
                  <th style={{ width: '110px' }}>Hạn Sử Dụng (HSD)</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>Trạng Thái</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>In Phiếu</th>
                </tr>
              </thead>
              <tbody>
                {recentLoHangs.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                      <i className="fa-solid fa-box-open" style={{ fontSize: '28px', display: 'block', marginBottom: '8px', color: '#cbd5e1' }}></i>
                      Không tìm thấy lô hàng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  recentLoHangs.map(lo => {
                    const maLo = lo.maLoHang || lo.MALOHAN || lo.MALO || lo.id;
                    const maHdn = lo.hoa_don_nhap?.maHoaDonNhap || lo.hoaDonNhap?.maHoaDonNhap || lo.maHoaDonNhap || lo.MAHDNHAP || lo.hdnhap?.MAHDNHAP || '-';
                    const tenStore = lo.cua_hang?.tenCuaHang || lo.cuaHang?.tenCuaHang || lo.cua_hang?.TENCUAHANG || lo.cuaHang?.TENCUAHANG || '-';
                    const tenSp = lo.san_pham?.tenSanPham || lo.sanPham?.tenSanPham || lo.san_pham?.TENSP || lo.sanPham?.TENSP || lo.TENSP || `Bánh #${lo.sanPhamId || lo.MASP}`;
                    const tenNcc = lo.nha_cung_cap?.tenNcc || lo.nhaCungCap?.tenNcc || lo.nha_cung_cap?.TENNCC || lo.nhaCungCap?.TENNCC || lo.hdnhap?.nha_cung_cap?.TENNCC || '-';
                    const slCt = lo.soLuongNhap ?? lo.SOLUONG_NHAP ?? lo.SOLUONGTCT ?? lo.SOLUONG ?? 0;
                    const slTn = lo.soLuongCon ?? lo.SOLUONG_CON ?? lo.SOLUONGTN ?? slCt;
                    const gia = Number(lo.giaNhap || lo.DONGIANHAP || lo.DONGIA_NHAP || 0);
                    const nsx = lo.ngaySanXuat || lo.NGAYSX;
                    const hsd = lo.hsd || lo.HSD_LO || lo.HSD;
                    const isExp = hsd && hsd < todayStr;

                    return (
                      <tr key={maLo}>
                        <td><b style={{ color: '#1e293b' }}>{maLo}</b></td>
                        <td>
                          {maHdn !== '-' ? (
                            <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#475569', fontWeight: '600' }}>
                              {maHdn}
                            </code>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontWeight: '600', color: '#0284c7', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <i className="fa-solid fa-store" style={{ fontSize: '11px' }}></i>
                            {tenStore}
                          </span>
                        </td>
                        <td><b>{tenSp}</b></td>
                        <td style={{ color: '#475569' }}>{tenNcc}</td>
                        <td style={{ textAlign: 'center', fontWeight: '600' }}>{slCt}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold', color: slTn < slCt ? '#ef4444' : '#16a34a' }}>
                          {slTn}
                        </td>
                        <td>{gia.toLocaleString()}đ</td>
                        <td>{formatDateOnly(nsx)}</td>
                        <td>
                          <span className={`admin-badge ${isExp ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                            {formatDateOnly(hsd)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`admin-badge ${lo.trangThai === 0 ? 'admin-badge-success' : 'admin-badge-secondary'}`}>
                            {lo.trangThai === 0 ? 'Trong kho' : 'Đã xuất bán'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {maHdn !== '-' ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn-info"
                              onClick={() => handleOpenPrintModal(maHdn)}
                              style={{ padding: '3px 8px', fontSize: '11px', whiteSpace: 'nowrap' }}
                              title="In phiếu nhập kho"
                            >
                              <i className="fa-solid fa-print" style={{ marginRight: '3px' }}></i> In
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>-</span>
                          )}
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

      {/* MODAL IN PHIẾU NHẬP KHO CHUẨN BIỂU MẪU GIVRAL BAKERY */}
      <PhieuNhapKhoPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        invoice={printInvoiceData}
      />
    </AdminLayout>
  );
};

export default AdminNhapLoPage;
