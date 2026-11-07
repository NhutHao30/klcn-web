import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import {
    getPreOrders,
    getPreOrderById,
    createPreOrder,
    updatePreOrder,
    updatePreOrderStatus,
    completePreOrderPayment,
    createPreOrderGhn,
} from '../../services/preOrderService';
import { lookupCustomerBySdt } from '../../services/customerService';
import { getProducts } from '../../services/productService';
import { useToast } from '../../components/Toast/Toast';
import { useConfirm } from '../../components/ConfirmModal/ConfirmModal';
import axiosClient from '../../services/axiosClient';
import { DatBanhTruocPrintModal } from '../../components/PrintForms';

// ─── Component Chọn địa chỉ & Tính phí ship GHN (2 cấp: Tỉnh/Thành -> Phường/Xã) ─────────────
const GhnDeliverySelector = ({ form, setForm, formErrors }) => {
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [loadingWards, setLoadingWards] = useState(false);

    const [selProvince, setSelProvince] = useState('');
    const [selWard, setSelWard] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [calculatingFee, setCalculatingFee] = useState(false);

    // Fetch Provinces on mount (lọc bỏ các tỉnh test của GHN Sandbox)
    useEffect(() => {
        axiosClient.get('/ghn/provinces').then(res => {
            if (res.data?.data) {
                const cleanList = res.data.data.filter(p => {
                    const id = Number(p.ProvinceID);
                    const name = String(p.ProvinceName || '').toLowerCase();
                    return id !== 298 && id !== 2002 && !/test|alert|demo|fake|hà nội 02/i.test(name);
                });
                setProvinces(cleanList);
            }
        }).catch(() => {});
    }, []);

    // Khi Tỉnh/Thành thay đổi -> Nạp trực tiếp toàn bộ Phường/Xã thuộc Tỉnh/Thành (bỏ qua Quận/Huyện)
    useEffect(() => {
        if (selProvince) {
            setLoadingWards(true);
            setWards([]);
            setSelWard('');
            axiosClient.get(`/ghn/wards-by-province?province_id=${selProvince}`).then(res => {
                if (res.data?.data) setWards(res.data.data);
                else setWards([]);
            }).catch(() => setWards([])).finally(() => setLoadingWards(false));
        } else {
            setWards([]);
            setSelWard('');
        }
    }, [selProvince]);

    // Tự động ghép chuỗi địa chỉ mới (Số nhà/Đường, Phường/Xã, Tỉnh/Thành)
    useEffect(() => {
        if (!selProvince && !selWard && !detailAddress.trim()) return;

        const pObj = provinces.find(p => String(p.ProvinceID) === String(selProvince));
        const wObj = wards.find(w => String(w.WardCode) === String(selWard));

        const fullAddr = [
            detailAddress.trim(),
            wObj?.WardName,
            pObj?.ProvinceName
        ].filter(Boolean).join(', ');

        setForm(f => ({
            ...f,
            dia_chi_giao: fullAddr
        }));
    }, [detailAddress, selWard, selProvince, provinces, wards, setForm]);

    // Tính phí ship GHN tự động khi chọn Phường/Xã (tự ánh xạ DistrictID ngầm)
    useEffect(() => {
        if (selProvince && selWard) {
            const wObj = wards.find(w => String(w.WardCode) === String(selWard));
            const districtId = parseInt(wObj?.DistrictID) || 1444;

            setCalculatingFee(true);
            axiosClient.post('/ghn/fee', {
                to_ward_code: String(selWard),
                to_district_id: districtId,
                weight: 1000
            }).then(res => {
                const fee = res.data?.code === 200 && res.data?.data?.total ? res.data.data.total : 30000;

                setForm(f => {
                    const newPhiGiao = fee;
                    const tongBanh = f.chi_tiet.reduce((s, r) => s + (parseInt(r.so_luong || 0) * parseInt(r.don_gia || 0)), 0);
                    const minCocBanh = tongBanh > 200000 ? 50000 : 0;
                    const minTotalCoc = minCocBanh + newPhiGiao;

                    return {
                        ...f,
                        to_ward_code: String(selWard),
                        to_district_id: districtId,
                        phi_giao_hang: newPhiGiao,
                        tien_coc: f.tien_coc ? f.tien_coc : (minTotalCoc > 0 ? minTotalCoc : '')
                    };
                });
            }).catch(() => {
                setForm(f => ({ ...f, to_ward_code: String(selWard), to_district_id: districtId, phi_giao_hang: 30000 }));
            }).finally(() => setCalculatingFee(false));
        }
    }, [selWard, selProvince, wards, setForm]);

    return (
        <div style={{ backgroundColor: '#f0f9ff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>
                🚚 Địa chỉ giao hàng (Tích hợp Giao Hàng Nhanh GHN):
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '10px' }}>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Tỉnh / Thành phố *</label>
                    <select className="admin-input" style={{ width: '100%', padding: '7px 10px', fontSize: '14px' }}
                        value={selProvince} onChange={e => setSelProvince(e.target.value)}>
                        <option value="">-- Chọn Tỉnh/Thành phố --</option>
                        {provinces.map(p => (
                            <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Phường / Xã *</label>
                    <select className="admin-input" style={{ width: '100%', padding: '7px 10px', fontSize: '14px' }}
                        disabled={!selProvince || loadingWards} value={selWard} onChange={e => setSelWard(e.target.value)}>
                        <option value="">
                            {loadingWards ? '⏳ Đang tải danh sách Phường/Xã...' : '-- Chọn Phường/Xã --'}
                        </option>
                        {wards.map(w => (
                            <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Số nhà, tên đường *</label>
                <input className="admin-input" style={{ width: '100%', padding: '7px 10px', fontSize: '14px' }}
                    placeholder="VD: 123 Lê Hồng Phong..."
                    value={detailAddress}
                    onChange={e => setDetailAddress(e.target.value)} />
            </div>

            {formErrors.dia_chi_giao && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px' }}>{formErrors.dia_chi_giao}</div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a' }}>
                    Phí ship GHN tính tự động:
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0284c7' }}>
                    {calculatingFee ? '⏳ Đang tính phí GHN...' : (form.phi_giao_hang ? `${Number(form.phi_giao_hang).toLocaleString('vi-VN')} ₫` : '0 ₫')}
                </span>
            </div>
        </div>
    );
};

// ─── Hằng số ────────────────────────────────────────────────
const TRANG_THAI_OPTIONS = [
    { value: '',              label: 'Tất cả trạng thái' },
    { value: 'cho_xac_nhan', label: 'Chờ xác nhận' },
    { value: 'da_coc',       label: 'Đã đặt cọc' },
    { value: 'san_sang',     label: 'Sẵn sàng' },
    { value: 'dang_giao',    label: 'Đang giao (GHN)' },
    { value: 'da_giao',      label: 'Đã giao' },
    { value: 'da_huy',       label: 'Đã hủy' },
];

const BADGE_MAP = {
    cho_xac_nhan: { cls: 'admin-badge-secondary', label: 'Chờ xác nhận' },
    da_coc:       { cls: 'admin-badge-warning',   label: 'Đã cọc' },
    san_sang:     { cls: 'admin-badge-info',       label: 'Sẵn sàng' },
    dang_giao:    { cls: 'admin-badge-primary',    label: 'Đang giao (GHN)' },
    da_giao:      { cls: 'admin-badge-success',    label: 'Đã giao' },
    da_huy:       { cls: 'admin-badge-danger',     label: 'Đã hủy' },
};

const LY_DO_LABEL = { het_hang: '🚫 Hết hàng', hen_ngay: '📅 Hẹn ngày' };

const fmt = (n) => Number(n || 0).toLocaleString('vi-VN') + ' ₫';

const minPickupDatetime = () => {
    const d = new Date(Date.now() + 60000); // +1 phút để đảm bảo > now
    return d.toISOString().slice(0, 16);
};

// ─── Empty form state ────────────────────────────────────────
const emptyForm = () => ({
    hoten_kh:        '',
    sdt_kh:          '',
    makh:            '',
    ngay_hen_lay:    '',
    hinh_thuc_nhan:  'tai_cua_hang',
    dia_chi_giao:    '',
    phi_giao_hang:   '',
    ghi_chu:         '',
    tien_coc:        '',
    phuong_thuc_coc: 'Tiền mặt',
    chu_ky:          '',
    chi_tiet: [{ ten_sp: '', masp: '', so_luong: 1, don_gia: '', ghi_chu_sp: '' }],
});

// ─── Component Chữ Ký Điện Tử (Canvas) ──────────────────────
const SignatureCanvas = ({ value, onChange }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSigned, setHasSigned] = useState(Boolean(value));

    // Tự động căn chỉnh độ phân giải canvas bằng với kích thước hiển thị DOM
    const resizeCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const rect = container.getBoundingClientRect();
        if (rect.width > 0) {
            // Giữ lại nội dung cũ nếu có
            const tempCtx = canvas.getContext('2d');
            const data = canvas.toDataURL();

            canvas.width = rect.width;
            canvas.height = 180; // Chiều cao rộng rãi 180px

            if (data && data !== 'data:,' && hasSigned) {
                const img = new Image();
                img.onload = () => tempCtx.drawImage(img, 0, 0);
                img.src = data;
            }
        }
    }, [hasSigned]);

    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    // Tính tọa độ con chuột / cảm ứng chính xác theo tỉ lệ hiển thị
    const getPos = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
        };
    };

    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const pos = getPos(e);

        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#1e3a8a'; // Xanh navy chuẩn chữ ký bút mực
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        setHasSigned(true);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const dataUrl = canvas.toDataURL('image/png');
            onChange(dataUrl);
        }
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasSigned(false);
        onChange('');
    };

    return (
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                    ✍️ Chữ ký xác nhận của khách hàng (Ký tên trực tiếp):
                </span>
                {hasSigned && (
                    <button
                        type="button"
                        onClick={clearSignature}
                        style={{
                            background: '#fef2f2',
                            border: '1px solid #fca5a5',
                            color: '#dc2626',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        🔄 Xóa ký lại
                    </button>
                )}
            </div>
            <div
                ref={containerRef}
                style={{
                    border: '2px dashed #94a3b8',
                    borderRadius: '10px',
                    backgroundColor: '#ffffff',
                    position: 'relative',
                    overflow: 'hidden',
                    touchAction: 'none',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.03)'
                }}
            >
                <canvas
                    ref={canvasRef}
                    height={180}
                    style={{ width: '100%', height: '180px', cursor: 'crosshair', display: 'block' }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
                {!hasSigned && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        color: '#cbd5e1',
                        fontSize: '16px',
                        fontWeight: 500,
                        fontStyle: 'italic',
                        userSelect: 'none'
                    }}>
                        ✍️ Ký tên xác nhận tại đây...
                    </div>
                )}
            </div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '6px', fontStyle: 'italic' }}>
                💡 Dùng chuột hoặc ngón tay (màn hình cảm ứng) vẽ chữ ký vào ô trắng ở trên. Chữ ký sẽ tự động bám sát đầu con chuột.
            </div>
        </div>
    );
};

// ─── Component chính ─────────────────────────────────────────
const AdminPreOrderPage = () => {
    const toast = useToast();
    const confirm = useConfirm();
    const printRef = useRef(null);

    const [orders, setOrders]                 = useState([]);
    const [isLoading, setIsLoading]           = useState(false);
    const [searchQuery, setSearchQuery]       = useState('');
    const [filterStatus, setFilterStatus]     = useState('');

    // Modal tạo đơn
    const [showCreate, setShowCreate]         = useState(false);
    const [form, setForm]                     = useState(emptyForm());
    const [creating, setCreating]             = useState(false);
    const [formErrors, setFormErrors]         = useState({});

    // Tự động tra cứu thông tin khách hàng khi nhập SĐT
    const [customerLookupStatus, setCustomerLookupStatus] = useState({ loading: false, found: null, data: null });

    useEffect(() => {
        const sdt = form.sdt_kh.trim();
        if (sdt.length >= 9) {
            const timer = setTimeout(async () => {
                setCustomerLookupStatus({ loading: true, found: null, data: null });
                try {
                    const res = await lookupCustomerBySdt(sdt);
                    if (res.found) {
                        setForm(f => ({
                            ...f,
                            makh: res.customer.maKH,
                            hoten_kh: f.hoten_kh ? f.hoten_kh : res.customer.hoTen
                        }));
                        setCustomerLookupStatus({ loading: false, found: true, data: res.customer });
                    } else {
                        setForm(f => ({ ...f, makh: '' }));
                        setCustomerLookupStatus({ loading: false, found: false, data: null });
                    }
                } catch {
                    setCustomerLookupStatus({ loading: false, found: false, data: null });
                }
            }, 400);
            return () => clearTimeout(timer);
        } else {
            setForm(f => ({ ...f, makh: '' }));
        }
    }, [form.sdt_kh]);

    // Danh sách sản phẩm từ hệ thống dùng để tra cứu / chọn nhanh
    const [productList, setProductList]       = useState([]);
    const [activeSuggestIdx, setActiveSuggestIdx] = useState(null);
    const [quickCakeSearch, setQuickCakeSearch]   = useState('');
    const [showQuickCakePicker, setShowQuickCakePicker] = useState(true);

    useEffect(() => {
        if (showCreate && productList.length === 0) {
            getProducts({ size: 200, limit: 200 }).then(res => {
                const list = Array.isArray(res) ? res : (res.content || res.data || []);
                setProductList(list);
            }).catch(() => {});
        }
    }, [showCreate, productList.length]);

    const getProductNumericId = (p) => {
        if (p?.id && !isNaN(Number(p.id))) return Number(p.id);
        const raw = String(p?.MASP || p?.maSanPham || p?.id || '');
        const m = raw.match(/\d+/);
        return m ? Number(m[0]) : raw;
    };

    // Lọc sản phẩm theo từ khóa gợi ý thời gian thực
    const filterProducts = (query, maxItems = 40) => {
        if (!query || !query.trim()) return productList.slice(0, maxItems);
        const q = query.toLowerCase().trim();
        return productList.filter(p => {
            const name = String(p.TENSP || p.tenSanPham || '').toLowerCase();
            const code = String(p.MASP || p.maSanPham || p.id || '').toLowerCase();
            const cat = String(p.TENLOAI || p.tenDanhMuc || '').toLowerCase();
            return name.includes(q) || code.includes(q) || cat.includes(q);
        }).slice(0, maxItems);
    };

    // Chọn nhanh bánh từ danh sách gợi ý
    const handlePickSuggestedCake = (p, targetIdx = null) => {
        const tenSp = p.TENSP || p.tenSanPham || '';
        const maSp = getProductNumericId(p);
        const donGia = Number(p.GIABAN || p.giaBan || 0);

        setForm(f => {
            const ct = [...f.chi_tiet];
            if (targetIdx !== null && ct[targetIdx]) {
                ct[targetIdx] = { ...ct[targetIdx], ten_sp: tenSp, masp: maSp, don_gia: donGia };
                return { ...f, chi_tiet: ct };
            }

            // Nếu đang có dòng trống thì điền vào dòng trống đó
            const emptyIdx = ct.findIndex(r => !String(r.ten_sp || '').trim());
            if (emptyIdx !== -1) {
                ct[emptyIdx] = { ...ct[emptyIdx], ten_sp: tenSp, masp: maSp, don_gia: donGia };
                return { ...f, chi_tiet: ct };
            }

            // Nếu bánh đã có trong danh sách thì tăng số lượng +1
            const existIdx = ct.findIndex(r => String(r.masp) === String(maSp) || r.ten_sp === tenSp);
            if (existIdx !== -1) {
                ct[existIdx] = { ...ct[existIdx], so_luong: (parseInt(ct[existIdx].so_luong || 1) + 1) };
                return { ...f, chi_tiet: ct };
            }

            // Nếu chưa có thì thêm dòng mới
            return {
                ...f,
                chi_tiet: [...ct, { ten_sp: tenSp, masp: maSp, so_luong: 1, don_gia: donGia, ghi_chu_sp: '' }]
            };
        });
        setActiveSuggestIdx(null);
    };

    // Modal chi tiết / in phiếu
    const [detail, setDetail]                 = useState(null);
    const [showDetail, setShowDetail]         = useState(false);
    const [detailLoading, setDetailLoading]   = useState(false);
    const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

    // Trạng thái sửa đơn
    const [editingMaDHT, setEditingMaDHT]     = useState(null);

    // Modal thu tiền còn lại
    const [showPayment, setShowPayment]       = useState(false);
    const [paymentMethod, setPaymentMethod]   = useState('Tiền mặt');
    const [paying, setPaying]                 = useState(false);

    // ── Mở modal tạo mới ────────────────────────────────────
    const openCreateModal = () => {
        setEditingMaDHT(null);
        setForm(emptyForm());
        setFormErrors({});
        setShowCreate(true);
    };

    // ── Mở modal sửa ────────────────────────────────────────
    const openEditModal = async (orderOrMaDHT) => {
        let orderObj = typeof orderOrMaDHT === 'object' ? orderOrMaDHT : null;
        if (!orderObj || !orderObj.chiTiets) {
            const ma = typeof orderOrMaDHT === 'string' ? orderOrMaDHT : orderOrMaDHT?.maDHT;
            try {
                const res = await getPreOrderById(ma);
                orderObj = res?.data || res;
            } catch {
                toast.error('Không thể lấy thông tin chi tiết đơn để sửa.');
                return;
            }
        }
        setEditingMaDHT(orderObj.maDHT || orderObj.id);

        let ngayHenVal = orderObj.ngayHenLay || '';
        if (ngayHenVal && !ngayHenVal.includes('T')) {
            ngayHenVal = ngayHenVal.replace(' ', 'T').substring(0, 16);
        }

        setForm({
            hoten_kh: orderObj.hoTenKH || '',
            sdt_kh: orderObj.sdtKH || '',
            makh: orderObj.maKH || '',
            ngay_hen_lay: ngayHenVal,
            hinh_thuc_nhan: orderObj.hinhThucNhan || 'tai_cua_hang',
            dia_chi_giao: orderObj.diaChiGiao || '',
            phi_giao_hang: orderObj.phiGiaoHang || 0,
            ghi_chu: orderObj.ghiChu || '',
            tien_coc: orderObj.tienCoc || 0,
            phuong_thuc_coc: orderObj.phuongThucCoc || 'Tiền mặt',
            chu_ky: orderObj.chuKy || '',
            chi_tiet: (orderObj.chiTiets && orderObj.chiTiets.length > 0)
                ? orderObj.chiTiets.map(ct => ({
                    ten_sp: ct.tenSP || '',
                    masp: ct.maSP || '',
                    so_luong: ct.soLuong || 1,
                    don_gia: ct.donGia || 0,
                    ghi_chu_sp: ct.ghiChuSP || ''
                }))
                : [{ ten_sp: '', masp: '', so_luong: 1, don_gia: '', ghi_chu_sp: '' }]
        });
        setFormErrors({});
        setShowCreate(true);
    };

    // ── Fetch list (Lấy danh sách master của tất cả đơn đặt trước) ────
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getPreOrders({ size: 500 });
            const list = Array.isArray(res) ? res : (res.data || res.content || []);
            setOrders(list);
        } catch {
            toast.error('Không thể tải danh sách đơn đặt trước.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

    // ── Lọc danh sách hiển thị theo Tab & Ô tìm kiếm ─────────
    const filteredOrders = orders.filter(o => {
        const matchStatus = !filterStatus || o.trangThai === filterStatus;
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q ||
            (o.maDHT && o.maDHT.toLowerCase().includes(q)) ||
            (o.hoTenKH && o.hoTenKH.toLowerCase().includes(q)) ||
            (o.sdtKH && o.sdtKH.toLowerCase().includes(q));
        return matchStatus && matchSearch;
    });

    // ── Tính tổng tiền form ──────────────────────────────────
    const phiGiaoForm = form.hinh_thuc_nhan === 'giao_tan_noi' ? parseInt(form.phi_giao_hang || 0) : 0;
    const tongTienForm = form.chi_tiet.reduce(
        (s, r) => s + (parseInt(r.so_luong || 0) * parseInt(r.don_gia || 0)), 0
    ) + phiGiaoForm;
    const canRequireDeposit = tongTienForm > 200000;

    // ── Xử lý form chi tiết sản phẩm ────────────────────────
    const setRow = (idx, field, val) => {
        setForm(f => {
            const ct = [...f.chi_tiet];
            ct[idx] = { ...ct[idx], [field]: val };
            return { ...f, chi_tiet: ct };
        });
    };

    const addRow = () => {
        const nextIdx = form.chi_tiet.length;
        setForm(f => ({ ...f, chi_tiet: [...f.chi_tiet, { ten_sp: '', masp: '', so_luong: 1, don_gia: '', ghi_chu_sp: '' }] }));
        setActiveSuggestIdx(nextIdx);
        setShowQuickCakePicker(true);
    };

    const removeRow = (idx) =>
        setForm(f => ({ ...f, chi_tiet: f.chi_tiet.filter((_, i) => i !== idx) }));

    // ── Validate client-side ─────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.hoten_kh.trim()) errs.hoten_kh = 'Vui lòng nhập tên khách hàng.';
        if (!form.sdt_kh.trim())   errs.sdt_kh   = 'Vui lòng nhập số điện thoại.';
        if (!form.ngay_hen_lay)    errs.ngay_hen_lay = 'Vui lòng chọn ngày hẹn lấy.';

        if (form.hinh_thuc_nhan === 'giao_tan_noi') {
            if (!form.dia_chi_giao.trim()) errs.dia_chi_giao = 'Vui lòng nhập địa chỉ giao hàng.';
        }

        if (form.chi_tiet.length === 0) errs.chi_tiet = 'Phải có ít nhất 1 sản phẩm.';
        form.chi_tiet.forEach((r, i) => {
            if (!r.ten_sp.trim()) errs[`sp_ten_${i}`] = 'Tên sản phẩm bắt buộc.';
            if (!r.don_gia || r.don_gia <= 0) errs[`sp_gia_${i}`] = 'Đơn giá phải > 0.';
        });

        const coc = parseInt(form.tien_coc || 0);
        if (coc > 0 && tongTienForm > 0 && coc >= tongTienForm) {
            errs.tien_coc = 'Tiền cọc phải nhỏ hơn tổng tiền đơn hàng.';
        }
        return errs;
    };

    // ── Submit tạo/sửa đơn ──────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setFormErrors({});
        setCreating(true);
        try {
            const payload = {
                hoten_kh:        form.hoten_kh,
                sdt_kh:          form.sdt_kh,
                makh:            form.makh || undefined,
                ngay_hen_lay:    form.ngay_hen_lay,
                hinh_thuc_nhan:  form.hinh_thuc_nhan,
                dia_chi_giao:    form.hinh_thuc_nhan === 'giao_tan_noi' ? form.dia_chi_giao : undefined,
                phi_giao_hang:   form.hinh_thuc_nhan === 'giao_tan_noi' ? parseInt(form.phi_giao_hang || 0) : 0,
                ghi_chu:         form.ghi_chu,
                tien_coc:        parseInt(form.tien_coc || 0),
                phuong_thuc_coc: parseInt(form.tien_coc || 0) > 0 ? form.phuong_thuc_coc : 'Tiền mặt',
                chu_ky:          form.chu_ky || undefined,
                chi_tiet: form.chi_tiet.map(r => ({
                    ten_sp:     r.ten_sp,
                    masp:       r.masp || undefined,
                    so_luong:   parseInt(r.so_luong),
                    don_gia:    parseInt(r.don_gia),
                    ghi_chu_sp: r.ghi_chu_sp || undefined,
                })),
            };

            if (editingMaDHT) {
                await updatePreOrder(editingMaDHT, payload);
                toast.success('Cập nhật đơn đặt bánh trước thành công!');
            } else {
                await createPreOrder(payload);
                toast.success('Tạo đơn đặt trước thành công!');
            }

            setShowCreate(false);
            setEditingMaDHT(null);
            setForm(emptyForm());
            fetchOrders();
            if (showDetail && detail?.maDHT) {
                openDetail(detail.maDHT);
            }
        } catch (err) {
            const resData = err?.response?.data;
            let msg = resData?.message || resData?.error || 'Có lỗi xảy ra khi lưu đơn.';
            if (resData?.errors && typeof resData.errors === 'object') {
                const firstField = Object.keys(resData.errors)[0];
                if (firstField && resData.errors[firstField]?.[0]) {
                    msg = `${msg}: ${resData.errors[firstField][0]}`;
                }
            }
            toast.error(msg);
        } finally {
            setCreating(false);
        }
    };

    // ── Mở modal chi tiết ────────────────────────────────────
    const openDetail = async (maDHT) => {
        setShowDetail(true);
        setDetailLoading(true);
        try {
            const data = await getPreOrderById(maDHT);
            setDetail(data?.data || data);
        } catch { toast.error('Không thể tải chi tiết đơn.'); }
        finally { setDetailLoading(false); }
    };

    // ── Cập nhật trạng thái ──────────────────────────────────
    const handleUpdateStatus = async (maDHT, trangThai) => {
        try {
            const res = await updatePreOrderStatus(maDHT, trangThai);
            toast.success(res?.message || 'Cập nhật trạng thái thành công!');
            setShowDetail(false);
            fetchOrders();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi cập nhật trạng thái.');
        }
    };

    // ── Tạo vận đơn GHN cho đơn giao tận nơi ──────────────────
    const handleCreateGhnOrder = async (maDHT) => {
        try {
            const res = await createPreOrderGhn(maDHT);
            if (res?.order_code || res?.success) {
                toast.success(res?.message || `Tạo đơn GHN thành công! Mã: ${res?.order_code}`);
                const updated = await getPreOrderById(maDHT);
                setDetail(updated);
                fetchOrders();
            } else {
                toast.error(res?.message || 'Không thể tạo đơn GHN');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Lỗi khi tạo vận đơn GHN');
        }
    };

    // ── Thu tiền còn lại ─────────────────────────────────────
    const handleCompletePayment = async () => {
        if (!detail) return;
        setPaying(true);
        try {
            const res = await completePreOrderPayment(detail.maDHT, paymentMethod);
            toast.success(res?.message || `Hoàn tất thu tiền còn lại thành công!`);
            setShowPayment(false);
            setShowDetail(false);
            fetchOrders();
        } catch (err) {
            toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Lỗi thanh toán.');
        } finally {
            setPaying(false);
        }
    };

    // ── In phiếu chuẩn biểu mẫu Givral Bakery ──────────────────
    const handlePrint = () => {
        if (!detail) return;
        setIsPrintModalOpen(true);
    };

    // Tính toán thống kê KPI nhanh
    const stats = {
        total: orders.length,
        pending: orders.filter(o => ['cho_xac_nhan', 'da_coc'].includes(o.trangThai)).length,
        ready: orders.filter(o => o.trangThai === 'san_sang').length,
        totalDeposit: orders.reduce((s, o) => s + (Number(o.tienCoc) || 0), 0)
    };

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            {/* Page Header */}
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="admin-title" style={{ marginBottom: '4px', fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>
                        🎂 Quản lý đơn đặt bánh trước
                    </h1>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                        Theo dõi lịch hẹn lấy bánh, đặt cọc và xử lý phiếu giao nhận hàng hàng ngày
                    </p>
                </div>
                <button className="admin-btn admin-btn-primary" 
                    style={{ fontSize: '15px', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)' }}
                    onClick={openCreateModal}>
                    ✨ + Tạo đơn đặt bánh mới
                </button>
            </div>

            {/* KPI Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '1.5rem' }}>
                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#eff6ff', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        📋
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tổng đơn đặt</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>{stats.total} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>đơn</span></div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fffbe6', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        ⏳
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Đang chờ / Đã cọc</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#b45309' }}>{stats.pending} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>đơn</span></div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        🎂
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Sẵn sàng giao</div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#15803d' }}>{stats.ready} <span style={{ fontSize: '14px', fontWeight: 500, color: '#94a3b8' }}>đơn</span></div>
                    </div>
                </div>

                <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px 20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#fdf2f8', color: '#db2777', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                        💰
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Tổng cọc đã thu</div>
                        <div style={{ fontSize: '20px', fontWeight: 800, color: '#be185d' }}>{fmt(stats.totalDeposit)}</div>
                    </div>
                </div>
            </div>

            {/* Filter & Data Card */}
            <div className="admin-card" style={{ padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
                {/* Status Tabs & Search Input */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', gap: '16px', flexWrap: 'wrap' }}>
                    {/* Status Filter Tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {TRANG_THAI_OPTIONS.map(opt => {
                            const isSelected = filterStatus === opt.value;
                            let count = 0;
                            if (!opt.value) count = orders.length;
                            else count = orders.filter(o => o.trangThai === opt.value).length;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setFilterStatus(opt.value)}
                                    style={{
                                        padding: '7px 14px',
                                        borderRadius: '20px',
                                        fontSize: '13px',
                                        fontWeight: isSelected ? 700 : 500,
                                        border: isSelected ? '1px solid #0284c7' : '1px solid #e2e8f0',
                                        backgroundColor: isSelected ? '#0284c7' : '#ffffff',
                                        color: isSelected ? '#ffffff' : '#475569',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <span>{opt.label}</span>
                                    <span style={{
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                                        color: isSelected ? '#ffffff' : '#64748b',
                                        padding: '1px 7px',
                                        borderRadius: '10px',
                                        fontSize: '12px',
                                        fontWeight: 700
                                    }}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search Field */}
                    <div style={{ position: 'relative', width: '280px' }}>
                        <input
                            type="text"
                            className="admin-input"
                            placeholder="🔍 Tìm mã DHT, tên KH, SĐT..."
                            style={{ width: '100%', marginBottom: 0, fontSize: '14px', paddingLeft: '12px', borderRadius: '8px' }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Orders Table */}
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Mã DHT</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Khách hàng</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>SĐT liên hệ</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Thời gian đặt</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Hẹn lấy bánh</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Tổng tiền</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Đã đặt cọc</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px' }}>Trạng thái</th>
                                <th style={{ fontSize: '13px', textTransform: 'uppercase', color: '#475569', padding: '12px 14px', textAlign: 'center' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', fontSize: '15px', color: '#64748b' }}>⏳ Đang tải danh sách đơn đặt trước...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '36px', fontSize: '15px', color: '#94a3b8' }}>Không tìm thấy đơn đặt hàng trước nào</td></tr>
                            ) : filteredOrders.map(o => {
                                const badge = BADGE_MAP[o.trangThai] || { cls: 'admin-badge-secondary', label: o.trangThai };
                                return (
                                    <tr key={o.maDHT} style={{ transition: 'background-color 0.15s ease' }}>
                                        <td style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                                            <div>{o.maDHT}</div>
                                            {o.hinhThucNhan === 'giao_tan_noi' ? (
                                                <div style={{ marginTop: '3px' }}>
                                                    <span style={{ fontSize: '11px', color: '#0369a1', backgroundColor: '#e0f2fe', padding: '1px 6px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                                        🚚 GHN {o.maVanDonGhn ? `(${o.maVanDonGhn})` : ''}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: '3px' }}>
                                                    <span style={{ fontSize: '11px', color: '#15803d', backgroundColor: '#f0fdf4', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                                        🏢 Tại tiệm
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '14px', fontWeight: 600 }}>{o.hoTenKH}</td>
                                        <td style={{ fontSize: '14px', color: '#0284c7' }}>📞 {o.sdtKH}</td>
                                        <td style={{ fontSize: '13px', color: '#64748b' }}>{o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN') : '-'}</td>
                                        <td style={{ fontSize: '14px' }}>
                                            <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', padding: '4px 8px', borderRadius: '6px', color: '#b45309', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                📅 {o.ngayHenLay ? new Date(o.ngayHenLay).toLocaleString('vi-VN') : '-'}
                                            </div>
                                        </td>
                                        <td style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{fmt(o.tongTien)}</td>
                                        <td style={{ fontSize: '14px', fontWeight: 600, color: '#16a34a' }}>{fmt(o.tienCoc)}</td>
                                        <td>
                                            <span className={`admin-badge ${badge.cls}`} style={{ fontSize: '13px', padding: '4px 12px', borderRadius: '12px' }}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button className="admin-btn"
                                                    style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#e0f2fe', color: '#0369a1', border: 'none', fontWeight: 600 }}
                                                    onClick={() => openDetail(o.maDHT)}>
                                                    👁️ Chi tiết
                                                </button>
                                                {!['da_giao', 'da_huy'].includes(o.trangThai) && (
                                                    <button className="admin-btn"
                                                        style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', fontWeight: 600 }}
                                                        onClick={() => openEditModal(o)}>
                                                        ✏️ Sửa
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════ MODAL TẠO / SỬA ĐƠN ══════ */}
            {showCreate && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modalContainer, maxWidth: '1000px' }}>
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={styles.iconCircle}>{editingMaDHT ? '✏️' : '🍰'}</div>
                                <h2 style={styles.modalHeaderTitle}>
                                    {editingMaDHT ? `Chỉnh sửa đơn đặt bánh trước (${editingMaDHT})` : 'Tạo đơn đặt bánh trước mới'}
                                </h2>
                            </div>
                            <button style={styles.closeBtn} onClick={() => setShowCreate(false)}>✕</button>
                        </div>

                        <div style={styles.modalBody}>
                            <form id="preOrderForm" onSubmit={handleCreate}>
                                {/* Thông tin khách */}
                                <SectionTitle>👤 Thông tin khách hàng</SectionTitle>
                                <div style={styles.grid2}>
                                    <Field label="Số điện thoại *" error={formErrors.sdt_kh}>
                                        <input className="admin-input" style={styles.inp} value={form.sdt_kh}
                                            onChange={e => setForm(f => ({ ...f, sdt_kh: e.target.value }))}
                                            placeholder="09xxxxxxxx" />
                                        {customerLookupStatus.loading && <span style={{ fontSize: '12px', color: '#0284c7' }}>🔍 Đang tìm khách hàng...</span>}
                                        {customerLookupStatus.found && <span style={{ fontSize: '12px', color: '#16a34a' }}>✅ Khách thân thiết (Mã: {customerLookupStatus.data?.maKH})</span>}
                                    </Field>
                                    <Field label="Tên khách hàng *" error={formErrors.hoten_kh}>
                                        <input className="admin-input" style={styles.inp} value={form.hoten_kh}
                                            onChange={e => setForm(f => ({ ...f, hoten_kh: e.target.value }))}
                                            placeholder="Nguyễn Văn A" />
                                    </Field>
                                </div>

                                {/* Thời gian & Hình thức nhận */}
                                <SectionTitle>📅 Thời gian & Hình thức nhận bánh</SectionTitle>
                                <div style={styles.grid2}>
                                    <Field label="Ngày & Giờ hẹn lấy *" error={formErrors.ngay_hen_lay}>
                                        <input type="datetime-local" className="admin-input" style={styles.inp}
                                            min={minPickupDatetime()}
                                            value={form.ngay_hen_lay}
                                            onChange={e => setForm(f => ({ ...f, ngay_hen_lay: e.target.value }))} />
                                    </Field>

                                    <Field label="Hình thức nhận bánh">
                                        <select className="admin-input" style={styles.inp} value={form.hinh_thuc_nhan}
                                            onChange={e => setForm(f => ({ ...f, hinh_thuc_nhan: e.target.value }))}>
                                            <option value="tai_cua_hang">🏢 Nhận tại cửa hàng</option>
                                            <option value="giao_tan_noi">🚚 Giao tận nơi (GHN)</option>
                                        </select>
                                    </Field>
                                </div>

                                {form.hinh_thuc_nhan === 'giao_tan_noi' && (
                                    <GhnDeliverySelector form={form} setForm={setForm} formErrors={formErrors} />
                                )}

                                {/* Chi tiết sản phẩm đặt bánh */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0, borderLeft: '4px solid #0284c7', paddingLeft: '10px' }}>
                                        🎂 Danh sách sản phẩm đặt bánh
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickCakePicker(v => !v)}
                                        style={{
                                            backgroundColor: showQuickCakePicker ? '#e0f2fe' : '#f1f5f9',
                                            color: showQuickCakePicker ? '#0369a1' : '#475569',
                                            border: '1px solid #bae6fd',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: 700,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {showQuickCakePicker ? '🔼 Thu gọn bảng gợi ý bánh' : '🍰 Mở bảng tìm & chọn bánh gợi ý'}
                                    </button>
                                </div>
                                {formErrors.chi_tiet && <ErrMsg msg={formErrors.chi_tiet} />}

                                {/* Bảng gợi ý & tìm kiếm nhanh bánh */}
                                {showQuickCakePicker && (
                                    <div style={{
                                        backgroundColor: '#fffbeb',
                                        border: '1px solid #fde68a',
                                        borderRadius: '10px',
                                        padding: '12px 14px',
                                        marginBottom: '14px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#92400e' }}>
                                                🍰 Tìm kiếm & Chọn nhanh bánh có sẵn (Nhấp vào bánh để thêm vào đơn):
                                            </div>
                                            <div style={{ flex: '1 1 280px', maxWidth: '400px' }}>
                                                <input
                                                    type="text"
                                                    className="admin-input"
                                                    style={{ ...styles.inp, padding: '7px 12px', fontSize: '14px', backgroundColor: '#ffffff', border: '1px solid #f59e0b' }}
                                                    placeholder="🔍 Gõ tên bánh hoặc mã SP để lọc nhanh..."
                                                    value={quickCakeSearch}
                                                    onChange={e => setQuickCakeSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(235px, 1fr))',
                                            gap: '8px',
                                            maxHeight: '220px',
                                            overflowY: 'auto',
                                            paddingRight: '4px'
                                        }}>
                                            {filterProducts(quickCakeSearch, 50).map((p, pi) => {
                                                const pName = p.TENSP || p.tenSanPham || 'Bánh ngọt';
                                                const pPrice = Number(p.GIABAN || p.giaBan || 0);
                                                const pCode = p.MASP || `SP${p.id}`;
                                                const pImg = p.HINHANH || p.hinhAnh || p.anhDaiDien || '/assets/IMG/Logo.jpg';
                                                return (
                                                    <div
                                                        key={pi}
                                                        onClick={() => handlePickSuggestedCake(p)}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            backgroundColor: '#ffffff',
                                                            border: '1px solid #e2e8f0',
                                                            borderRadius: '8px',
                                                            padding: '8px 10px',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease',
                                                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                                        }}
                                                        title="Nhấp để chọn bánh này"
                                                    >
                                                        <img
                                                            src={pImg}
                                                            alt={pName}
                                                            onError={e => { e.target.onerror = null; e.target.src = '/assets/IMG/Logo.jpg'; }}
                                                            style={{ width: '44px', height: '44px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid #f1f5f9' }}
                                                        />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {pName}
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '3px' }}>
                                                                <span style={{ fontSize: '11.5px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                                                    {pCode}
                                                                </span>
                                                                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0284c7' }}>
                                                                    {fmt(pPrice)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div style={{ border: '1px solid #cbd5e1', borderRadius: '10px', overflow: 'visible', marginBottom: '12px', backgroundColor: '#ffffff' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                                        <thead>
                                            <tr style={{ background: '#f1f5f9' }}>
                                                <th style={{ ...styles.th, width: '44%', fontSize: '14px', padding: '12px' }}>Tên bánh / Sản phẩm *</th>
                                                <th style={{ ...styles.th, width: '130px', minWidth: '120px', textAlign: 'center', fontSize: '14px', padding: '12px 8px' }}>Số lượng</th>
                                                <th style={{ ...styles.th, width: '195px', minWidth: '180px', textAlign: 'right', fontSize: '14px', padding: '12px' }}>Đơn giá (đ) *</th>
                                                <th style={{ ...styles.th, width: '155px', minWidth: '140px', textAlign: 'right', fontSize: '14px', padding: '12px' }}>Thành tiền</th>
                                                <th style={{ ...styles.th, width: '44px', textAlign: 'center' }}>Xóa</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {form.chi_tiet.map((row, idx) => {
                                                const suggestions = filterProducts(row.ten_sp, 40);
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', verticalAlign: 'top' }}>
                                                        <td style={{ padding: '12px', position: 'relative' }}>
                                                            <div style={{ position: 'relative' }}>
                                                                <input className="admin-input"
                                                                    style={{
                                                                        ...styles.inp,
                                                                        fontSize: '15px',
                                                                        fontWeight: 600,
                                                                        padding: '10px 12px',
                                                                        border: activeSuggestIdx === idx ? '2px solid #0284c7' : '1px solid #cbd5e1'
                                                                    }}
                                                                    placeholder="🔍 Nhập tên bánh hoặc nhấp để chọn bánh gợi ý..."
                                                                    value={row.ten_sp}
                                                                    onFocus={() => setActiveSuggestIdx(idx)}
                                                                    onBlur={() => setTimeout(() => setActiveSuggestIdx(cur => (cur === idx ? null : cur)), 200)}
                                                                    onChange={e => {
                                                                        setRow(idx, 'ten_sp', e.target.value);
                                                                        setRow(idx, 'masp', '');
                                                                        setActiveSuggestIdx(idx);
                                                                    }} />
                                                            </div>
                                                            {row.masp && (
                                                                <div style={{ fontSize: '12.5px', color: '#0369a1', fontWeight: 600, marginTop: '4px' }}>
                                                                    🏷️ Mã SP: #{row.masp}
                                                                </div>
                                                            )}
                                                            {formErrors[`sp_ten_${idx}`] && <ErrMsg msg={formErrors[`sp_ten_${idx}`]} />}

                                                            {activeSuggestIdx === idx && suggestions.length > 0 && (
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    top: '100%',
                                                                    left: '12px',
                                                                    minWidth: '420px',
                                                                    width: 'calc(100% - 24px)',
                                                                    zIndex: 350,
                                                                    backgroundColor: '#ffffff',
                                                                    border: '2px solid #0284c7',
                                                                    borderRadius: '10px',
                                                                    maxHeight: '300px',
                                                                    overflowY: 'auto',
                                                                    boxShadow: '0 12px 28px rgba(15, 23, 42, 0.22)'
                                                                }}>
                                                                    <div style={{
                                                                        position: 'sticky',
                                                                        top: 0,
                                                                        backgroundColor: '#f0f9ff',
                                                                        padding: '7px 12px',
                                                                        fontSize: '12.5px',
                                                                        fontWeight: 700,
                                                                        color: '#0369a1',
                                                                        borderBottom: '1px solid #bae6fd',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center'
                                                                    }}>
                                                                        <span>🍰 Gợi ý bánh có sẵn ({suggestions.length} sản phẩm)</span>
                                                                        <span style={{ cursor: 'pointer', color: '#64748b' }} onMouseDown={() => setActiveSuggestIdx(null)}>✕ Đóng</span>
                                                                    </div>
                                                                    {suggestions.map((p, pi) => {
                                                                        const pName = p.TENSP || p.tenSanPham || '';
                                                                        const pPrice = Number(p.GIABAN || p.giaBan || 0);
                                                                        const pCode = p.MASP || `SP${p.id}`;
                                                                        const pImg = p.HINHANH || p.hinhAnh || p.anhDaiDien || '/assets/IMG/Logo.jpg';
                                                                        return (
                                                                            <div key={pi}
                                                                                style={{
                                                                                    padding: '10px 12px',
                                                                                    cursor: 'pointer',
                                                                                    borderBottom: '1px solid #f1f5f9',
                                                                                    display: 'flex',
                                                                                    alignItems: 'center',
                                                                                    gap: '10px'
                                                                                }}
                                                                                onMouseDown={() => handlePickSuggestedCake(p, idx)}
                                                                            >
                                                                                <img
                                                                                    src={pImg}
                                                                                    alt={pName}
                                                                                    onError={e => { e.target.onerror = null; e.target.src = '/assets/IMG/Logo.jpg'; }}
                                                                                    style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }}
                                                                                />
                                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                                    <div style={{ fontSize: '14.5px', fontWeight: 700, color: '#0f172a' }}>{pName}</div>
                                                                                    <div style={{ fontSize: '12px', color: '#64748b' }}>Mã: {pCode}</div>
                                                                                </div>
                                                                                <span style={{
                                                                                    color: '#0284c7',
                                                                                    fontWeight: 800,
                                                                                    fontSize: '14.5px',
                                                                                    backgroundColor: '#f0f9ff',
                                                                                    padding: '4px 10px',
                                                                                    borderRadius: '6px',
                                                                                    whiteSpace: 'nowrap'
                                                                                }}>
                                                                                    {fmt(pPrice)}
                                                                                </span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '12px 8px', textAlign: 'center', minWidth: '120px' }}>
                                                            <input type="number" min="1" className="admin-input"
                                                                style={{
                                                                    ...styles.inp,
                                                                    textAlign: 'center',
                                                                    padding: '10px 8px',
                                                                    fontSize: '16px',
                                                                    fontWeight: 700,
                                                                    color: '#0284c7',
                                                                    minWidth: '95px'
                                                                }}
                                                                value={row.so_luong}
                                                                onChange={e => setRow(idx, 'so_luong', e.target.value)} />
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'right', minWidth: '180px' }}>
                                                            <input type="number" min="0" step="1000" className="admin-input"
                                                                style={{
                                                                    ...styles.inp,
                                                                    textAlign: 'right',
                                                                    padding: '10px 12px',
                                                                    fontSize: '16px',
                                                                    fontWeight: 700,
                                                                    color: '#b45309',
                                                                    minWidth: '155px'
                                                                }}
                                                                placeholder="0"
                                                                value={row.don_gia}
                                                                onChange={e => setRow(idx, 'don_gia', e.target.value)} />
                                                            {Number(row.don_gia) > 0 && (
                                                                <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '4px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                    {Number(row.don_gia).toLocaleString('vi-VN')} ₫ / bánh
                                                                </div>
                                                            )}
                                                            {formErrors[`sp_gia_${idx}`] && <ErrMsg msg={formErrors[`sp_gia_${idx}`]} />}
                                                        </td>
                                                        <td style={{ padding: '18px 12px', textAlign: 'right', fontWeight: 800, fontSize: '16px', color: '#0f172a', whiteSpace: 'nowrap' }}>
                                                            {fmt((parseInt(row.so_luong || 0) * parseInt(row.don_gia || 0)))}
                                                        </td>
                                                        <td style={{ padding: '16px 8px', textAlign: 'center' }}>
                                                            {form.chi_tiet.length > 1 && (
                                                                <button type="button" onClick={() => removeRow(idx)}
                                                                    style={{
                                                                        background: '#fef2f2',
                                                                        border: '1px solid #fecaca',
                                                                        color: '#dc2626',
                                                                        borderRadius: '6px',
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        cursor: 'pointer',
                                                                        fontSize: '15px',
                                                                        fontWeight: 700
                                                                    }}
                                                                    title="Xóa dòng này">✕</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <button type="button" className="admin-btn admin-btn-secondary"
                                    style={{ fontSize: '14px', fontWeight: 700, padding: '8px 16px', marginBottom: '14px', borderRadius: '8px' }}
                                    onClick={addRow}>+ Thêm dòng bánh mới</button>

                                {/* Tính tiền & Tiền cọc */}
                                <SectionTitle>💳 Tính tiền & Đặt cọc</SectionTitle>
                                <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                                        <span>Tổng tiền đơn bánh:</span>
                                        <strong style={{ fontSize: '17px', color: '#0f172a' }}>{fmt(tongTienForm)}</strong>
                                    </div>
                                    <div style={styles.grid2}>
                                        <Field label="Số tiền đặt cọc (đ)" error={formErrors.tien_coc}>
                                            <input type="number" min="0" className="admin-input" style={styles.inp}
                                                placeholder="VD: 100000" value={form.tien_coc}
                                                onChange={e => setForm(f => ({ ...f, tien_coc: e.target.value }))} />
                                        </Field>
                                        <Field label="Phương thức cọc">
                                            <select className="admin-input" style={styles.inp} value={form.phuong_thuc_coc}
                                                onChange={e => setForm(f => ({ ...f, phuong_thuc_coc: e.target.value }))}>
                                                <option>Tiền mặt</option>
                                                <option>Chuyển khoản</option>
                                            </select>
                                        </Field>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed #e2e8f0', fontSize: '15px', color: '#dc2626', fontWeight: 700 }}>
                                        <span>Số tiền còn lại cần thanh toán:</span>
                                        <span>{fmt(Math.max(0, tongTienForm - parseInt(form.tien_coc || 0)))}</span>
                                    </div>
                                </div>

                                {/* Ghi chú */}
                                <Field label="Ghi chú đơn hàng">
                                    <textarea className="admin-input" style={{ ...styles.inp, height: '70px', resize: 'vertical' }}
                                        placeholder="Yêu cầu đặc biệt..."
                                        value={form.ghi_chu}
                                        onChange={e => setForm(f => ({ ...f, ghi_chu: e.target.value }))} />
                                </Field>

                                {/* Chữ ký điện tử */}
                                <SignatureCanvas
                                    value={form.chu_ky}
                                    onChange={v => setForm(f => ({ ...f, chu_ky: v }))}
                                />
                            </form>
                        </div>

                        <div style={styles.modalFooter}>
                            <button type="button" className="admin-btn" style={styles.btnClose}
                                onClick={() => setShowCreate(false)}>Hủy</button>
                            <button type="submit" form="preOrderForm" className="admin-btn" style={styles.btnSuccess}
                                disabled={creating}>
                                {creating ? '⏳ Đang lưu...' : (editingMaDHT ? '💾 Lưu thay đổi' : '✅ Tạo đơn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════ MODAL CHI TIẾT ══════ */}
            {showDetail && (
                <div style={styles.overlay}>
                    <div style={styles.modalContainer}>
                        {/* Header (Sticky / Fixed) */}
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={styles.iconCircle}>📋</div>
                                <div>
                                    <h2 style={styles.modalHeaderTitle}>Chi tiết đơn đặt trước</h2>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>Mã phiếu: <strong>{detail?.maDHT}</strong></span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {detail && (
                                    <span className={`admin-badge ${(BADGE_MAP[detail.trangThai] || {}).cls}`}
                                        style={{ fontSize: '14px', padding: '6px 14px', borderRadius: '20px' }}>
                                        {(BADGE_MAP[detail.trangThai] || {}).label || detail.trangThai}
                                    </span>
                                )}
                                <button style={styles.closeBtn} onClick={() => setShowDetail(false)}>✕</button>
                            </div>
                        </div>

                        {/* Scrollable Body */}
                        <div style={styles.modalBody}>
                            {detailLoading ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
                                    <p style={{ fontSize: '16px', margin: 0 }}>Đang tải chi tiết đơn hàng...</p>
                                </div>
                            ) : detail && (
                                <div ref={printRef}>
                                    {/* Printable Header Banner */}
                                    <div style={styles.receiptBanner}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '8px' }}>
                                            <img src="/assets/IMG/Logo.jpg" alt="Givral Bakery" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '6px' }} />
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>
                                                    🍰 Givral Bakery — Phiếu Đặt Bánh Trước
                                                </h2>
                                                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                                                    Chuyên bánh ngọt tươi & bánh kem nghệ thuật cao cấp
                                                </p>
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>
                                            Mã đặt hàng: <strong style={{ fontSize: '16px', color: '#0f172a' }}>{detail.maDHT}</strong>
                                            &nbsp;•&nbsp;
                                            Ngày đặt: {detail.ngayDat ? new Date(detail.ngayDat).toLocaleString('vi-VN') : '-'}
                                        </p>
                                    </div>

                                    {/* Customer & Pickup Info Grid */}
                                    <div style={styles.gridCards}>
                                        {/* Card Khách hàng */}
                                        <div style={styles.infoCard}>
                                            <div style={styles.cardHeaderTitle}>👤 Thông tin khách hàng</div>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>Khách hàng:</span>
                                                <strong style={styles.infoValue}>{detail.hoTenKH}</strong>
                                            </div>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>Số điện thoại:</span>
                                                <span style={styles.infoValue}>
                                                    <a href={`tel:${detail.sdtKH}`} style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                                                        📞 {detail.sdtKH}
                                                    </a>
                                                </span>
                                            </div>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>Ghi chú đơn:</span>
                                                <span style={styles.infoValue}>{detail.ghiChu || '—'}</span>
                                            </div>
                                        </div>

                                        {/* Card Giao nhận & Cửa hàng */}
                                        <div style={styles.infoCard}>
                                            <div style={styles.cardHeaderTitle}>🏪 Thông tin giao nhận</div>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>Chi nhánh:</span>
                                                <span style={styles.infoValue}>{detail.cuaHang?.tenCuaHang || '—'}</span>
                                            </div>
                                            <div style={styles.henLayBox}>
                                                <span style={{ fontSize: '22px' }}>⏰</span>
                                                <div>
                                                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', textTransform: 'uppercase' }}>Lịch hẹn lấy bánh</div>
                                                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                                                        {detail.ngayHenLay ? new Date(detail.ngayHenLay).toLocaleString('vi-VN') : '—'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>Hình thức:</span>
                                                <span style={styles.infoValue}>
                                                    {detail.hinhThucNhan === 'giao_tan_noi' ? '🚚 Giao tận nơi' : '🏢 Nhận tại tiệm'}
                                                </span>
                                            </div>
                                            {detail.hinhThucNhan === 'giao_tan_noi' && (
                                                <>
                                                    <div style={styles.infoRow}>
                                                        <span style={styles.infoLabel}>Địa chỉ giao:</span>
                                                        <span style={styles.infoValue}>{detail.diaChiGiao || '—'}</span>
                                                    </div>
                                                    <div style={styles.infoRow}>
                                                        <span style={styles.infoLabel}>Phí vận chuyển:</span>
                                                        <span style={styles.infoValue}>{fmt(detail.phiGiaoHang)}</span>
                                                    </div>
                                                    <div style={styles.infoRow}>
                                                        <span style={styles.infoLabel}>Vận chuyển GHN:</span>
                                                        <span style={styles.infoValue}>
                                                            {detail.maVanDonGhn ? (
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                    <b style={{ color: '#d82d8b', fontSize: '14px' }}>{detail.maVanDonGhn}</b>
                                                                    <span className="admin-badge admin-badge-info" style={{ fontSize: '11px' }}>GHN Express</span>
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    className="admin-btn admin-btn-sm"
                                                                    style={{ backgroundColor: '#f97316', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                                                    onClick={() => handleCreateGhnOrder(detail.maDHT)}
                                                                >
                                                                    🚀 Tạo đơn GHN ngay
                                                                </button>
                                                            )}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Ordered Products Table Card */}
                                    <div style={styles.tableCard}>
                                        <div style={{ ...styles.cardHeaderTitle, marginBottom: '12px' }}>🎂 Danh sách sản phẩm đặt bánh</div>
                                        <table style={styles.detailTable}>
                                            <thead>
                                                <tr>
                                                    <th style={{ ...styles.thCell, width: '45px', textAlign: 'center' }}>STT</th>
                                                    <th style={styles.thCell}>Sản phẩm</th>
                                                    <th style={{ ...styles.thCell, textAlign: 'center', width: '70px' }}>SL</th>
                                                    <th style={{ ...styles.thCell, textAlign: 'right', width: '120px' }}>Đơn giá</th>
                                                    <th style={{ ...styles.thCell, textAlign: 'right', width: '130px' }}>Thành tiền</th>
                                                    <th style={styles.thCell}>Ghi chú SP</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(detail.chiTiets || []).map((ct, i) => (
                                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                        <td style={{ ...styles.tdCell, textAlign: 'center', color: '#64748b' }}>{i + 1}</td>
                                                        <td style={{ ...styles.tdCell, fontWeight: 600, color: '#1e293b' }}>{ct.tenSP}</td>
                                                        <td style={{ ...styles.tdCell, textAlign: 'center' }}>
                                                            <span style={styles.qtyBadge}>{ct.soLuong}</span>
                                                        </td>
                                                        <td style={{ ...styles.tdCell, textAlign: 'right', color: '#475569' }}>{fmt(ct.donGia)}</td>
                                                        <td style={{ ...styles.tdCell, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{fmt(ct.thanhTien)}</td>
                                                        <td style={{ ...styles.tdCell, color: '#64748b', fontSize: '13px' }}>{ct.ghiChuSP || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Summary & Signature */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                        {/* Chữ ký */}
                                        {detail.chuKy ? (
                                            <div style={styles.signatureBox}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                                                    ✍️ Chữ ký xác nhận của khách hàng:
                                                </div>
                                                <img src={detail.chuKy} alt="Chữ ký" style={{ height: '70px', maxWidth: '240px', objectFit: 'contain' }} />
                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginTop: '6px' }}>{detail.hoTenKH}</div>
                                            </div>
                                        ) : <div />}

                                        {/* Tổng tiền */}
                                        <div style={styles.summaryCard}>
                                            <div style={styles.summaryRow}>
                                                <span>Tổng giá trị đơn:</span>
                                                <strong style={{ fontSize: '16px', color: '#1e293b' }}>{fmt(detail.tongTien)}</strong>
                                            </div>
                                            <div style={styles.summaryRow}>
                                                <span>Tiền đã cọc ({detail.phuongThucCoc || 'Tiền mặt'}):</span>
                                                <strong style={{ fontSize: '16px', color: '#16a34a' }}>{fmt(detail.tienCoc)}</strong>
                                            </div>
                                            <div style={{ ...styles.summaryRow, borderTop: '2px dashed #cbd5e1', paddingTop: '10px', marginTop: '8px' }}>
                                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>Số tiền còn lại cần thu:</span>
                                                <strong style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626' }}>{fmt(detail.tienConLai)}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sticky Footer Action Bar */}
                        {detail && (
                            <div style={styles.modalFooter}>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                    {['cho_xac_nhan', 'da_coc'].includes(detail.trangThai) && (
                                        <button className="admin-btn" style={styles.btnInfo} onClick={() => handleUpdateStatus(detail.maDHT, 'san_sang')}>
                                            ✅ Đánh dấu Sẵn sàng {detail.hinhThucNhan === 'giao_tan_noi' ? '(Tự tạo đơn GHN)' : ''}
                                        </button>
                                    )}
                                    {detail.hinhThucNhan === 'giao_tan_noi' && ['san_sang', 'dang_giao'].includes(detail.trangThai) && (
                                        <button className="admin-btn" style={{ ...styles.btnSuccess, backgroundColor: '#0284c7' }} onClick={() => handleUpdateStatus(detail.maDHT, 'da_giao')}>
                                            📦 Xác nhận khách đã nhận hàng
                                        </button>
                                    )}
                                    {['cho_xac_nhan', 'da_coc', 'san_sang', 'dang_giao'].includes(detail.trangThai) && detail.tienConLai > 0 && (
                                        <button className="admin-btn" style={styles.btnSuccess} onClick={() => { setPaymentMethod('Tiền mặt'); setShowPayment(true); }}>
                                            💰 Thu tiền còn lại ({fmt(detail.tienConLai)})
                                        </button>
                                    )}
                                    {!['da_giao', 'da_huy'].includes(detail.trangThai) && (
                                        <button className="admin-btn" style={styles.btnDanger} onClick={async () => {
                                            const ok = await confirm({
                                                title: 'Xác nhận hủy đơn đặt bánh',
                                                subtitle: 'Đơn đặt hàng trước Givral Bakery',
                                                message: `Bạn có chắc chắn muốn HỦY đơn đặt bánh ${detail.maDHT} của khách hàng ${detail.hoTenKH}?`,
                                                note: 'Nếu đơn hàng đã được trừ tồn kho, số lượng bánh sẽ tự động được hoàn trả vào kho.',
                                                confirmText: 'Xác nhận hủy đơn',
                                                cancelText: 'Đóng',
                                                type: 'danger',
                                                icon: <i className="fa-solid fa-ban" style={{ color: '#dc2626' }}></i>,
                                            });
                                            if (ok) {
                                                handleUpdateStatus(detail.maDHT, 'da_huy');
                                            }
                                        }}>
                                            🚫 Hủy đơn
                                        </button>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <button className="admin-btn" style={styles.btnPrint} onClick={handlePrint}>
                                        🖨 In phiếu
                                    </button>
                                    <button className="admin-btn" style={styles.btnClose} onClick={() => setShowDetail(false)}>
                                        Đóng
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════ MODAL THU TIỀN CÒN LẠI ══════ */}
            {showPayment && detail && (
                <div style={{ ...styles.overlay, zIndex: 1100 }}>
                    <div style={{ ...styles.modalContainer, maxWidth: '440px' }}>
                        <div style={styles.modalHeader}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>💰</span>
                                <h2 style={styles.modalHeaderTitle}>Thu tiền còn lại</h2>
                            </div>
                            <button style={styles.closeBtn} onClick={() => setShowPayment(false)}>✕</button>
                        </div>
                        <div style={styles.modalBody}>
                            <p style={{ fontSize: '15px', marginBottom: '8px', color: '#475569' }}>
                                Đơn hàng: <strong style={{ color: '#0f172a' }}>{detail.maDHT}</strong> — {detail.hoTenKH}
                            </p>
                            <div style={{ backgroundColor: '#ffffff', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                                    <span>Tổng tiền đơn bánh:</span>
                                    <strong>{fmt(detail.tongTien)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: '#16a34a' }}>
                                    <span>Đã cọc trước:</span>
                                    <strong>{fmt(detail.tienCoc)}</strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px dashed #cbd5e1', fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>
                                    <span>Còn lại phải thu:</span>
                                    <span>{fmt(detail.tienConLai)}</span>
                                </div>
                            </div>
                            {detail.hinhThucNhan === 'giao_tan_noi' ? (
                                <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '6px', padding: '10px', fontSize: '13px', color: '#1e40af', marginBottom: '12px', lineHeight: 1.5 }}>
                                    🚚 <b>Đơn giao tận nơi:</b> Khách thanh toán nốt tiền còn lại. Đơn hàng tiếp tục theo dõi giao qua GHN (không tự động đổi thành "Đã giao" cho tới khi giao thành công).
                                </div>
                            ) : (
                                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', fontSize: '13px', color: '#166534', marginBottom: '12px', lineHeight: 1.5 }}>
                                    🏢 <b>Đơn nhận tại cửa hàng:</b> Khách thanh toán nốt tiền và nhận bánh tại quầy &rarr; Đơn hàng chuyển sang <b>Đã giao</b> hoàn tất.
                                </div>
                            )}
                            <Field label="Hình thức thanh toán nhận tiền">
                                <select className="admin-input" style={styles.inp} value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}>
                                    <option>Tiền mặt</option>
                                    <option>Chuyển khoản</option>
                                    <option>Ví Momo P2P</option>
                                </select>
                            </Field>
                        </div>
                        <div style={styles.modalFooter}>
                            <button className="admin-btn" style={styles.btnClose}
                                onClick={() => setShowPayment(false)}>Hủy</button>
                            <button className="admin-btn" style={styles.btnSuccess}
                                disabled={paying} onClick={handleCompletePayment}>
                                {paying ? '⏳ Đang xử lý...' : '✅ Xác nhận thu tiền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL IN PHIẾU ĐẶT BÁNH TRƯỚC CHUẨN GIVRAL BAKERY */}
            <DatBanhTruocPrintModal
                isOpen={isPrintModalOpen}
                onClose={() => setIsPrintModalOpen(false)}
                order={detail}
            />
        </AdminLayout>
    );
};

// ── Sub-components ───────────────────────────────────────────
const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '10px', marginTop: '16px',
        borderLeft: '4px solid #0284c7', paddingLeft: '10px' }}>
        {children}
    </h3>
);

const Field = ({ label, error, children }) => (
    <div style={{ marginBottom: '12px' }}>
        <label style={styles.label}>{label}</label>
        {children}
        {error && <ErrMsg msg={error} />}
    </div>
);

const ErrMsg = ({ msg }) => (
    <span style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginTop: '3px' }}>{msg}</span>
);

// ── Styles ───────────────────────────────────────────────────
const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '16px',
    },
    modalContainer: {
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '880px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
    },
    modalHeader: {
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
    },
    modalHeaderTitle: {
        margin: 0,
        fontSize: '20px',
        fontWeight: 700,
        color: '#0f172a',
    },
    modalBody: {
        padding: '24px',
        overflowY: 'auto',
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalFooter: {
        padding: '14px 24px',
        borderTop: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        flexWrap: 'wrap',
        flexShrink: 0,
    },
    closeBtn: {
        background: '#f1f5f9',
        border: 'none',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        fontSize: '18px',
        cursor: 'pointer',
        color: '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
    },
    receiptBanner: {
        textAlign: 'center',
        padding: '16px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    gridCards: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '16px',
        marginBottom: '16px',
    },
    infoCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    cardHeaderTitle: {
        fontSize: '15px',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
    },
    infoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: '14px',
        borderBottom: '1px dashed #f1f5f9',
    },
    infoLabel: {
        color: '#64748b',
        fontWeight: 500,
    },
    infoValue: {
        color: '#0f172a',
        fontWeight: 600,
        textAlign: 'right',
    },
    henLayBox: {
        backgroundColor: '#fffbe6',
        border: '1px solid #ffe58f',
        borderRadius: '10px',
        padding: '10px 14px',
        margin: '10px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    tableCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        marginBottom: '16px',
    },
    detailTable: {
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '14px',
    },
    thCell: {
        padding: '10px 12px',
        textAlign: 'left',
        fontWeight: 600,
        color: '#475569',
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0',
    },
    tdCell: {
        padding: '10px 12px',
        color: '#1e293b',
    },
    qtyBadge: {
        display: 'inline-block',
        backgroundColor: '#e2e8f0',
        color: '#0f172a',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '13px',
    },
    signatureBox: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
    },
    summaryCard: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        padding: '16px',
        border: '1px solid #e2e8f0',
    },
    summaryRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 0',
        fontSize: '14px',
        color: '#475569',
    },
    btnEdit: {
        backgroundColor: '#f59e0b',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    btnInfo: {
        backgroundColor: '#0284c7',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    btnSuccess: {
        backgroundColor: '#16a34a',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    btnDanger: {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    btnPrint: {
        backgroundColor: '#475569',
        color: '#ffffff',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    btnClose: {
        backgroundColor: '#e2e8f0',
        color: '#334155',
        padding: '8px 16px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        border: 'none',
        cursor: 'pointer',
    },
    iconCircle: {
        width: '40px', height: '40px', borderRadius: '10px',
        backgroundColor: '#eff6ff', color: '#0284c7',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '20px',
    },
    grid2: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    },
    inp: { marginBottom: 0, fontSize: '14px', width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' },
    label: { fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#374151' },
    th: { padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' },
};

export default AdminPreOrderPage;
