import React, { useState, useEffect, useRef, useCallback } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import {
    getPreOrders,
    getPreOrderById,
    createPreOrder,
    updatePreOrderStatus,
    completePreOrderPayment,
} from '../../services/preOrderService';
import { lookupCustomerBySdt } from '../../services/customerService';
import { getProducts } from '../../services/productService';
import { useToast } from '../../components/Toast/Toast';
import axiosClient from '../../services/axiosClient';

// ─── Component Chọn địa chỉ & Tính phí ship GHN ─────────────
const GhnDeliverySelector = ({ form, setForm, formErrors }) => {
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selProvince, setSelProvince] = useState('');
    const [selDistrict, setSelDistrict] = useState('');
    const [selWard, setSelWard] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [calculatingFee, setCalculatingFee] = useState(false);

    // Fetch Provinces on mount
    useEffect(() => {
        axiosClient.get('/ghn/provinces').then(res => {
            if (res.data?.data) setProvinces(res.data.data);
        }).catch(() => {});
    }, []);

    // Fetch Districts when Province changes
    useEffect(() => {
        if (selProvince) {
            axiosClient.get(`/ghn/districts?province_id=${selProvince}`).then(res => {
                if (res.data?.data) setDistricts(res.data.data);
                else setDistricts([]);
            }).catch(() => setDistricts([]));
            setWards([]);
            setSelDistrict('');
            setSelWard('');
        } else {
            setDistricts([]);
            setWards([]);
        }
    }, [selProvince]);

    // Fetch Wards when District changes
    useEffect(() => {
        if (selDistrict) {
            axiosClient.get(`/ghn/wards?district_id=${selDistrict}`).then(res => {
                if (res.data?.data) setWards(res.data.data);
                else setWards([]);
            }).catch(() => setWards([]));
            setSelWard('');
        } else {
            setWards([]);
        }
    }, [selDistrict]);

    // Calculate GHN fee & update full address string
    useEffect(() => {
        if (selDistrict && selWard) {
            setCalculatingFee(true);
            axiosClient.post('/ghn/fee', {
                to_ward_code: String(selWard),
                to_district_id: parseInt(selDistrict),
                weight: 1000
            }).then(res => {
                const fee = res.data?.code === 200 && res.data?.data?.total ? res.data.data.total : 30000;
                
                const pObj = provinces.find(p => String(p.ProvinceID) === String(selProvince));
                const dObj = districts.find(d => String(d.DistrictID) === String(selDistrict));
                const wObj = wards.find(w => String(w.WardCode) === String(selWard));

                const fullAddr = [
                    detailAddress.trim(),
                    wObj?.WardName,
                    dObj?.DistrictName,
                    pObj?.ProvinceName
                ].filter(Boolean).join(', ');

                setForm(f => {
                    const newPhiGiao = fee;
                    const tongBanh = f.chi_tiet.reduce((s, r) => s + (parseInt(r.so_luong || 0) * parseInt(r.don_gia || 0)), 0);
                    const minCocBanh = tongBanh > 200000 ? 50000 : 0;
                    const minTotalCoc = minCocBanh + newPhiGiao;

                    return {
                        ...f,
                        phi_giao_hang: newPhiGiao,
                        dia_chi_giao: fullAddr,
                        tien_coc: f.tien_coc ? f.tien_coc : (minTotalCoc > 0 ? minTotalCoc : '')
                    };
                });
            }).catch(() => {
                setForm(f => ({ ...f, phi_giao_hang: 30000 }));
            }).finally(() => setCalculatingFee(false));
        }
    }, [selWard, selDistrict, detailAddress, provinces, districts, wards, selProvince, setForm]);

    return (
        <div style={{ backgroundColor: '#f0f9ff', padding: '14px 16px', borderRadius: '8px', border: '1px solid #bae6fd', marginBottom: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>
                🚚 Địa chỉ giao hàng (Tích hợp Giao Hàng Nhanh GHN):
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Tỉnh / Thành *</label>
                    <select className="admin-input" style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
                        value={selProvince} onChange={e => setSelProvince(e.target.value)}>
                        <option value="">-- Chọn Tỉnh/Thành --</option>
                        {provinces.map(p => (
                            <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Quận / Huyện *</label>
                    <select className="admin-input" style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
                        disabled={!selProvince} value={selDistrict} onChange={e => setSelDistrict(e.target.value)}>
                        <option value="">-- Chọn Quận/Huyện --</option>
                        {districts.map(d => (
                            <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Phường / Xã *</label>
                    <select className="admin-input" style={{ width: '100%', padding: '6px 8px', fontSize: '14px' }}
                        disabled={!selDistrict} value={selWard} onChange={e => setSelWard(e.target.value)}>
                        <option value="">-- Chọn Phường/Xã --</option>
                        {wards.map(w => (
                            <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>Số nhà, tên đường *</label>
                <input className="admin-input" style={{ width: '100%', padding: '6px 10px', fontSize: '14px' }}
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
    { value: 'da_giao',      label: 'Đã giao' },
    { value: 'da_huy',       label: 'Đã hủy' },
];

const BADGE_MAP = {
    cho_xac_nhan: { cls: 'admin-badge-secondary', label: 'Chờ xác nhận' },
    da_coc:       { cls: 'admin-badge-warning',   label: 'Đã cọc' },
    san_sang:     { cls: 'admin-badge-info',       label: 'Sẵn sàng' },
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
    ly_do_dat_truoc: 'hen_ngay',
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

    useEffect(() => {
        if (showCreate && productList.length === 0) {
            getProducts({ size: 200, limit: 200 }).then(res => {
                const list = Array.isArray(res) ? res : (res.content || res.data || []);
                setProductList(list);
            }).catch(() => {});
        }
    }, [showCreate, productList.length]);

    // Lọc sản phẩm theo từ khóa gợi ý thời gian thực
    const filterProducts = (query) => {
        if (!query || !query.trim()) return productList.slice(0, 8);
        const q = query.toLowerCase().trim();
        return productList.filter(p => 
            (p.TENSP && p.TENSP.toLowerCase().includes(q)) ||
            (p.MASP && p.MASP.toLowerCase().includes(q))
        ).slice(0, 10);
    };

    // Modal chi tiết / in phiếu
    const [detail, setDetail]                 = useState(null);
    const [showDetail, setShowDetail]         = useState(false);
    const [detailLoading, setDetailLoading]   = useState(false);

    // Modal thu tiền còn lại
    const [showPayment, setShowPayment]       = useState(false);
    const [paymentMethod, setPaymentMethod]   = useState('Tiền mặt');
    const [paying, setPaying]                 = useState(false);

    // ── Fetch list ──────────────────────────────────────────
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getPreOrders({ search: searchQuery, trangThai: filterStatus, size: 100 });
            setOrders(data.content || []);
        } catch {
            toast.error('Không thể tải danh sách đơn đặt trước.');
        } finally {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filterStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);

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

    const addRow = () =>
        setForm(f => ({ ...f, chi_tiet: [...f.chi_tiet, { ten_sp: '', masp: '', so_luong: 1, don_gia: '', ghi_chu_sp: '' }] }));

    const removeRow = (idx) =>
        setForm(f => ({ ...f, chi_tiet: f.chi_tiet.filter((_, i) => i !== idx) }));

    // ── Validate client-side ─────────────────────────────────
    const validate = () => {
        const errs = {};
        if (!form.hoten_kh.trim()) errs.hoten_kh = 'Vui lòng nhập tên khách hàng.';
        if (!form.sdt_kh.trim())   errs.sdt_kh   = 'Vui lòng nhập số điện thoại.';
        if (!form.ngay_hen_lay)    errs.ngay_hen_lay = 'Vui lòng chọn ngày hẹn lấy.';
        else if (new Date(form.ngay_hen_lay) <= new Date())
            errs.ngay_hen_lay = 'Ngày hẹn phải sau thời điểm hiện tại.';

        if (form.hinh_thuc_nhan === 'giao_tan_noi') {
            if (!form.dia_chi_giao.trim()) errs.dia_chi_giao = 'Vui lòng nhập địa chỉ giao hàng.';
        }

        if (form.chi_tiet.length === 0) errs.chi_tiet = 'Phải có ít nhất 1 sản phẩm.';
        form.chi_tiet.forEach((r, i) => {
            if (!r.ten_sp.trim()) errs[`sp_ten_${i}`] = 'Tên sản phẩm bắt buộc.';
            if (!r.don_gia || r.don_gia <= 0) errs[`sp_gia_${i}`] = 'Đơn giá phải > 0.';
        });

        if (canRequireDeposit) {
            const coc = parseInt(form.tien_coc || 0);
            if (coc < 50000) errs.tien_coc = 'Đơn > 200,000đ phải cọc tối thiểu 50,000đ.';
            if (coc >= tongTienForm) errs.tien_coc = 'Tiền cọc phải nhỏ hơn tổng tiền.';
        }
        return errs;
    };

    // ── Submit tạo đơn ───────────────────────────────────────
    const handleCreate = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setFormErrors(errs); return; }
        setFormErrors({});
        setCreating(true);
        try {
            await createPreOrder({
                hoten_kh:        form.hoten_kh,
                sdt_kh:          form.sdt_kh,
                makh:            form.makh || undefined,
                ngay_hen_lay:    form.ngay_hen_lay,
                ly_do_dat_truoc: form.ly_do_dat_truoc,
                hinh_thuc_nhan:  form.hinh_thuc_nhan,
                dia_chi_giao:    form.hinh_thuc_nhan === 'giao_tan_noi' ? form.dia_chi_giao : undefined,
                phi_giao_hang:   form.hinh_thuc_nhan === 'giao_tan_noi' ? parseInt(form.phi_giao_hang || 0) : 0,
                ghi_chu:         form.ghi_chu,
                tien_coc:        canRequireDeposit ? parseInt(form.tien_coc || 0) : 0,
                phuong_thuc_coc: canRequireDeposit && parseInt(form.tien_coc || 0) > 0
                    ? form.phuong_thuc_coc : undefined,
                chu_ky:          form.chu_ky || undefined,
                chi_tiet: form.chi_tiet.map(r => ({
                    ten_sp:     r.ten_sp,
                    masp:       r.masp || undefined,
                    so_luong:   parseInt(r.so_luong),
                    don_gia:    parseInt(r.don_gia),
                    ghi_chu_sp: r.ghi_chu_sp || undefined,
                })),
            });
            toast.success('Tạo đơn đặt trước thành công!');
            setShowCreate(false);
            setForm(emptyForm());
            fetchOrders();
        } catch (err) {
            const resData = err?.response?.data;
            let msg = resData?.message || resData?.error || 'Có lỗi xảy ra khi tạo đơn.';
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
            setDetail(data);
        } catch { toast.error('Không thể tải chi tiết đơn.'); }
        finally { setDetailLoading(false); }
    };

    // ── Cập nhật trạng thái ──────────────────────────────────
    const handleUpdateStatus = async (maDHT, trangThai) => {
        try {
            await updatePreOrderStatus(maDHT, trangThai);
            toast.success('Cập nhật trạng thái thành công!');
            setShowDetail(false);
            fetchOrders();
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi cập nhật trạng thái.');
        }
    };

    // ── Thu tiền còn lại ─────────────────────────────────────
    const handleCompletePayment = async () => {
        if (!detail) return;
        setPaying(true);
        try {
            const res = await completePreOrderPayment(detail.maDHT, paymentMethod);
            toast.success(`Hoàn tất! Hóa đơn ${res.mahd} đã được tạo.`);
            setShowPayment(false);
            setShowDetail(false);
            fetchOrders();
        } catch (err) {
            toast.error(err?.response?.data?.error || 'Lỗi thanh toán.');
        } finally {
            setPaying(false);
        }
    };

    // ── In phiếu ─────────────────────────────────────────────
    const handlePrint = () => {
        if (!printRef.current) return;
        const win = window.open('', '', 'width=900,height=650');
        win.document.write(`<html><head><title>Phieu_${detail?.maDHT || ''}</title><style>
            body{font-family:Arial,sans-serif;padding:20px;font-size:15px;color:#222}
            h2{margin:0 0 4px}p{margin:3px 0;font-size:15px}
            table{width:100%;border-collapse:collapse;margin:12px 0;font-size:14px}
            th,td{border:1px solid #ccc;padding:8px;text-align:left}
            th{background:#f5f5f5;font-size:14px}
            .total{text-align:right;font-size:17px;font-weight:bold}
            .section{margin-bottom:14px;padding-bottom:10px;border-bottom:1px dashed #ccc}
            .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:13px;background:#fef3c7;color:#92400e}
        </style></head><body>`);
        win.document.write(printRef.current.innerHTML);
        win.document.write('</body></html>');
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); win.close(); }, 300);
    };

    // ─────────────────────────────────────────────────────────
    // RENDER
    // ─────────────────────────────────────────────────────────
    return (
        <AdminLayout>
            {/* Header */}
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                <h1 className="admin-title" style={{ marginBottom: 0, fontSize: '22px' }}>
                    📋 Đặt Hàng Trước
                </h1>
                <button className="admin-btn admin-btn-primary" style={{ fontSize: '15px' }}
                    onClick={() => { setShowCreate(true); setForm(emptyForm()); setFormErrors({}); }}>
                    + Tạo đơn mới
                </button>
            </div>

            {/* Filter bar */}
            <div className="admin-card">
                <div className="admin-flex-gap" style={{ marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text" className="admin-input"
                        placeholder="Tìm mã DHT, tên KH, SĐT..."
                        style={{ width: '260px', marginBottom: 0, fontSize: '15px' }}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    <select
                        className="admin-input"
                        style={{ width: '200px', marginBottom: 0, fontSize: '15px' }}
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        {TRANG_THAI_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th style={{ fontSize: '14px' }}>Mã DHT</th>
                                <th style={{ fontSize: '14px' }}>Khách hàng</th>
                                <th style={{ fontSize: '14px' }}>SĐT</th>
                                <th style={{ fontSize: '14px' }}>Ngày đặt</th>
                                <th style={{ fontSize: '14px' }}>Ngày hẹn lấy</th>
                                <th style={{ fontSize: '14px' }}>Tổng tiền</th>
                                <th style={{ fontSize: '14px' }}>Đã cọc</th>
                                <th style={{ fontSize: '14px' }}>Lý do</th>
                                <th style={{ fontSize: '14px' }}>Trạng thái</th>
                                <th style={{ fontSize: '14px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', fontSize: '15px' }}>Đang tải...</td></tr>
                            ) : orders.length === 0 ? (
                                <tr><td colSpan="10" style={{ textAlign: 'center', padding: '24px', fontSize: '15px', color: '#888' }}>Không có đơn đặt trước nào</td></tr>
                            ) : orders.map(o => {
                                const badge = BADGE_MAP[o.trangThai] || { cls: 'admin-badge-secondary', label: o.trangThai };
                                return (
                                    <tr key={o.maDHT}>
                                        <td style={{ fontSize: '14px', fontWeight: 700 }}>{o.maDHT}</td>
                                        <td style={{ fontSize: '14px' }}>{o.hoTenKH}</td>
                                        <td style={{ fontSize: '14px' }}>{o.sdtKH}</td>
                                        <td style={{ fontSize: '14px' }}>{o.ngayDat ? new Date(o.ngayDat).toLocaleString('vi-VN') : '-'}</td>
                                        <td style={{ fontSize: '14px', fontWeight: 600, color: '#d97706' }}>
                                            {o.ngayHenLay ? new Date(o.ngayHenLay).toLocaleString('vi-VN') : '-'}
                                        </td>
                                        <td style={{ fontSize: '14px', fontWeight: 600, color: 'var(--admin-primary)' }}>{fmt(o.tongTien)}</td>
                                        <td style={{ fontSize: '14px', color: '#059669' }}>{fmt(o.tienCoc)}</td>
                                        <td style={{ fontSize: '14px' }}>{LY_DO_LABEL[o.lyDo] || o.lyDo}</td>
                                        <td>
                                            <span className={`admin-badge ${badge.cls}`} style={{ fontSize: '13px' }}>{badge.label}</span>
                                        </td>
                                        <td>
                                            <button className="admin-btn admin-btn-info"
                                                style={{ padding: '4px 12px', fontSize: '14px' }}
                                                onClick={() => openDetail(o.maDHT)}>
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════ MODAL TẠO ĐƠN ══════ */}
            {showCreate && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, maxWidth: '760px' }}>
                        <div className="admin-flex-between" style={{ marginBottom: '1.2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Tạo đơn đặt bánh trước</h2>
                            <button style={styles.closeBtn} onClick={() => setShowCreate(false)}>✕</button>
                        </div>

                        <form onSubmit={handleCreate}>
                            {/* Thông tin khách */}
                            <SectionTitle>👤 Thông tin khách hàng</SectionTitle>
                            <div style={styles.grid2}>
                                <Field label="Số điện thoại *" error={formErrors.sdt_kh}>
                                    <input className="admin-input" style={styles.inp} value={form.sdt_kh}
                                        onChange={e => setForm(f => ({ ...f, sdt_kh: e.target.value }))}
                                        placeholder="09xxxxxxxx" />
                                </Field>
                                <Field label="Tên khách hàng *" error={formErrors.hoten_kh}>
                                    <input className="admin-input" style={styles.inp} value={form.hoten_kh}
                                        onChange={e => setForm(f => ({ ...f, hoten_kh: e.target.value }))}
                                        placeholder="Nguyễn Văn A" />
                                </Field>
                            </div>

                            {/* Thông báo kết quả tra cứu thành viên */}
                            {customerLookupStatus.loading && (
                                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px', padding: '6px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                                    🔍 Đang kiểm tra thành viên theo SĐT...
                                </div>
                            )}
                            {customerLookupStatus.found === true && (
                                <div style={{ fontSize: '14px', color: '#047857', backgroundColor: '#d1fae5', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px', fontWeight: '500' }}>
                                    👑 Khách thành viên: <strong>{customerLookupStatus.data.hoTen}</strong> (Mã KH: {customerLookupStatus.data.maKH}) — Tích lũy: <strong>{customerLookupStatus.data.diemTichLuy} điểm</strong>. (Sẽ tự động cộng điểm khi hoàn tất đơn!)
                                </div>
                            )}
                            {customerLookupStatus.found === false && form.sdt_kh.trim().length >= 9 && (
                                <div style={{ fontSize: '14px', color: '#4b5563', backgroundColor: '#f3f4f6', padding: '8px 12px', borderRadius: '6px', marginBottom: '12px' }}>
                                    👤 Khách vãng lai (SĐT chưa đăng ký tài khoản thành viên — không tích điểm).
                                </div>
                            )}

                            <Field label="Lý do đặt trước *">
                                <select className="admin-input" style={styles.inp} value={form.ly_do_dat_truoc}
                                    onChange={e => setForm(f => ({ ...f, ly_do_dat_truoc: e.target.value }))}>
                                    <option value="hen_ngay">📅 Khách hẹn ngày lấy</option>
                                    <option value="het_hang">🚫 Bánh đã hết hàng</option>
                                </select>
                            </Field>

                            {/* Ngày hẹn */}
                            <Field label="Ngày & giờ hẹn lấy bánh *" error={formErrors.ngay_hen_lay}>
                                <input type="datetime-local" className="admin-input"
                                    style={{ ...styles.inp, width: '280px' }}
                                    min={minPickupDatetime()}
                                    value={form.ngay_hen_lay}
                                    onChange={e => setForm(f => ({ ...f, ngay_hen_lay: e.target.value }))} />
                            </Field>

                            {/* Hình thức nhận bánh */}
                            <SectionTitle>🚚 Hình thức nhận bánh</SectionTitle>
                            <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                                    <input
                                        type="radio"
                                        name="hinh_thuc_nhan"
                                        value="tai_cua_hang"
                                        checked={form.hinh_thuc_nhan === 'tai_cua_hang'}
                                        onChange={e => setForm(f => ({ ...f, hinh_thuc_nhan: e.target.value }))}
                                    />
                                    🏢 Nhận tại cửa hàng
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', fontWeight: 600 }}>
                                    <input
                                        type="radio"
                                        name="hinh_thuc_nhan"
                                        value="giao_tan_noi"
                                        checked={form.hinh_thuc_nhan === 'giao_tan_noi'}
                                        onChange={e => setForm(f => ({ ...f, hinh_thuc_nhan: e.target.value }))}
                                    />
                                    🚚 Giao hàng tận nơi
                                </label>
                            </div>

                            {form.hinh_thuc_nhan === 'giao_tan_noi' && (
                                <GhnDeliverySelector form={form} setForm={setForm} formErrors={formErrors} />
                            )}

                            {/* Sản phẩm */}
                            <SectionTitle>🎂 Danh sách sản phẩm</SectionTitle>
                            {formErrors.chi_tiet && <ErrMsg msg={formErrors.chi_tiet} />}
                            {form.chi_tiet.map((row, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                    <div style={{ flex: '2', minWidth: '240px', position: 'relative' }}>
                                        <label style={styles.label}>Tên sản phẩm *</label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                className="admin-input"
                                                style={{ ...styles.inp, paddingRight: '28px' }}
                                                placeholder="🔍 Nhập từ khóa (bánh, kem, chocolate...)..."
                                                value={row.ten_sp}
                                                onFocus={() => setActiveSuggestIdx(idx)}
                                                onChange={e => {
                                                    setRow(idx, 'ten_sp', e.target.value);
                                                    setRow(idx, 'masp', '');
                                                    setActiveSuggestIdx(idx);
                                                }}
                                            />
                                            {row.ten_sp ? (
                                                <button
                                                    type="button"
                                                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: '14px' }}
                                                    onClick={() => {
                                                        setRow(idx, 'ten_sp', '');
                                                        setRow(idx, 'masp', '');
                                                        setRow(idx, 'don_gia', '');
                                                    }}
                                                >✕</button>
                                            ) : null}
                                        </div>

                                        {/* Dropdown gợi ý thời gian thực */}
                                        {activeSuggestIdx === idx && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
                                                backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px',
                                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                                                maxHeight: '220px', overflowY: 'auto', marginTop: '4px'
                                            }}>
                                                <div style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 600, color: '#6b7280', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>💡 {row.ten_sp ? `Gợi ý theo "${row.ten_sp}"` : 'Sản phẩm hệ thống'} ({filterProducts(row.ten_sp).length})</span>
                                                    <button type="button" onClick={() => setActiveSuggestIdx(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: '12px' }}>Đóng ✕</button>
                                                </div>
                                                {filterProducts(row.ten_sp).length === 0 ? (
                                                    <div style={{ padding: '12px', fontSize: '13px', color: '#6b7280', textAlign: 'center' }}>
                                                        Không tìm thấy bánh khớp với "{row.ten_sp}" (sẽ đặt làm bánh riêng)
                                                    </div>
                                                ) : (
                                                    filterProducts(row.ten_sp).map(p => {
                                                        const ton = Math.max(0, p.TONKHO_THUCTE !== undefined ? p.TONKHO_THUCTE : (p.SOLUONG ?? 0));
                                                        return (
                                                            <div
                                                                key={p.MASP}
                                                                style={{
                                                                    padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                                    backgroundColor: String(row.masp) === String(p.MASP) ? '#eff6ff' : '#ffffff'
                                                                }}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    setRow(idx, 'ten_sp', p.TENSP);
                                                                    setRow(idx, 'masp', p.MASP);
                                                                    setRow(idx, 'don_gia', p.GIABAN);
                                                                    setActiveSuggestIdx(null);
                                                                }}
                                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = String(row.masp) === String(p.MASP) ? '#eff6ff' : '#ffffff'}
                                                            >
                                                                <div>
                                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{p.TENSP}</div>
                                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>Mã: {p.MASP}</div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--admin-primary)' }}>
                                                                        {Number(p.GIABAN || 0).toLocaleString('vi-VN')} ₫
                                                                    </div>
                                                                    <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '4px', backgroundColor: ton > 0 ? '#d1fae5' : '#fef3c7', color: ton > 0 ? '#047857' : '#b45309', fontWeight: 600 }}>
                                                                        Tồn: {ton}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                        {formErrors[`sp_ten_${idx}`] && <ErrMsg msg={formErrors[`sp_ten_${idx}`]} />}
                                    </div>
                                    <div style={{ width: '80px' }}>
                                        <label style={styles.label}>SL *</label>
                                        <input type="number" className="admin-input" style={styles.inp} min={1}
                                            value={row.so_luong}
                                            onChange={e => setRow(idx, 'so_luong', e.target.value)} />
                                    </div>
                                    <div style={{ width: '130px' }}>
                                        <label style={styles.label}>Đơn giá *</label>
                                        <input type="number" className="admin-input" style={styles.inp} min={0}
                                            value={row.don_gia}
                                            onChange={e => setRow(idx, 'don_gia', e.target.value)} />
                                        {formErrors[`sp_gia_${idx}`] && <ErrMsg msg={formErrors[`sp_gia_${idx}`]} />}
                                    </div>
                                    <div style={{ flex: '1', minWidth: '140px' }}>
                                        <label style={styles.label}>Ghi chú SP</label>
                                        <input className="admin-input" style={styles.inp} placeholder="kem dâu, chữ vàng"
                                            value={row.ghi_chu_sp}
                                            onChange={e => setRow(idx, 'ghi_chu_sp', e.target.value)} />
                                    </div>
                                    {form.chi_tiet.length > 1 && (
                                        <button type="button" style={{ marginTop: '22px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#ef4444' }}
                                            onClick={() => removeRow(idx)}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className="admin-btn admin-btn-secondary"
                                style={{ fontSize: '14px', marginBottom: '12px' }} onClick={addRow}>
                                + Thêm sản phẩm
                            </button>

                            {/* Tổng tiền & Cọc */}
                            {(() => {
                                const tongBanh = form.chi_tiet.reduce((s, r) => s + (parseInt(r.so_luong || 0) * parseInt(r.don_gia || 0)), 0);
                                const minCocBanh = tongBanh > 200000 ? 50000 : 0;
                                const phiShip = form.hinh_thuc_nhan === 'giao_tan_noi' ? parseInt(form.phi_giao_hang || 0) : 0;
                                const minTotalCoc = form.hinh_thuc_nhan === 'giao_tan_noi' ? (minCocBanh + phiShip) : minCocBanh;
                                const needDeposit = minTotalCoc > 0 || tongTienForm > 200000;

                                return (
                                    <>
                                        <div style={{ background: 'var(--admin-tertiary)', borderRadius: '8px', padding: '10px 16px', marginBottom: '12px' }}>
                                            <span style={{ fontSize: '16px', fontWeight: 600 }}>Tổng tiền đơn hàng: </span>
                                            <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--admin-primary)' }}>{fmt(tongTienForm)}</span>
                                            {phiShip > 0 && <span style={{ fontSize: '13px', color: '#0284c7', marginLeft: '8px' }}>(đã gồm {fmt(phiShip)} phí ship GHN)</span>}
                                            {minTotalCoc > 0 && (
                                                <div style={{ fontSize: '14px', color: '#d97706', marginTop: '4px', fontWeight: 600 }}>
                                                    ⚠️ Đặt cọc tối thiểu bắt buộc: {fmt(minTotalCoc)}
                                                    {form.hinh_thuc_nhan === 'giao_tan_noi' && (
                                                        <span style={{ fontWeight: 400, fontSize: '13px', marginLeft: '6px' }}>
                                                            ({minCocBanh > 0 ? `${fmt(minCocBanh)} cọc bánh + ` : ''}{fmt(phiShip)} cọc phí ship GHN)
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Đặt cọc */}
                                        {needDeposit && (
                                            <div style={styles.grid2}>
                                                <Field label={`Tiền đặt cọc (Tối thiểu ${fmt(minTotalCoc)}) *`} error={formErrors.tien_coc}>
                                                    <input type="number" className="admin-input" style={styles.inp} min={minTotalCoc}
                                                        value={form.tien_coc}
                                                        onChange={e => setForm(f => ({ ...f, tien_coc: e.target.value }))}
                                                        placeholder={`Nhập từ ${fmt(minTotalCoc)}...`} />
                                                </Field>
                                                <Field label="Hình thức cọc">
                                                    <select className="admin-input" style={styles.inp} value={form.phuong_thuc_coc}
                                                        onChange={e => setForm(f => ({ ...f, phuong_thuc_coc: e.target.value }))}>
                                                        <option>Tiền mặt</option>
                                                        <option>Chuyển khoản</option>
                                                    </select>
                                                </Field>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}

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

                            {/* Buttons */}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                                <button type="button" className="admin-btn admin-btn-secondary" style={{ fontSize: '15px' }}
                                    onClick={() => setShowCreate(false)}>Hủy</button>
                                <button type="submit" className="admin-btn admin-btn-primary" style={{ fontSize: '15px' }}
                                    disabled={creating}>
                                    {creating ? 'Đang tạo...' : '✅ Tạo đơn'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════ MODAL CHI TIẾT ══════ */}
            {showDetail && (
                <div style={styles.overlay}>
                    <div style={{ ...styles.modal, maxWidth: '820px' }}>
                        <div className="admin-flex-between" style={{ marginBottom: '1.2rem' }}>
                            <h2 style={{ margin: 0, fontSize: '20px' }}>Chi tiết đơn đặt trước</h2>
                            <button style={styles.closeBtn} onClick={() => setShowDetail(false)}>✕</button>
                        </div>

                        {detailLoading ? (
                            <p style={{ textAlign: 'center', fontSize: '15px' }}>Đang tải chi tiết...</p>
                        ) : detail && (
                            <>
                                {/* Nội dung in phiếu */}
                                <div ref={printRef}>
                                    {/* Header phiếu */}
                                    <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '10px', marginBottom: '14px' }}>
                                        <h2 style={{ margin: '0 0 4px', fontSize: '20px' }}>🍰 Dola Bakery — Phiếu Đặt Bánh Trước</h2>
                                        <p style={{ margin: 0, fontSize: '15px' }}>
                                            Mã đặt hàng: <strong style={{ fontSize: '16px' }}>{detail.maDHT}</strong>
                                            &nbsp;|&nbsp;
                                            Ngày đặt: {detail.ngayDat ? new Date(detail.ngayDat).toLocaleString('vi-VN') : '-'}
                                        </p>
                                    </div>

                                    {/* Thông tin KH + Cửa hàng */}
                                    <div style={{ display: 'flex', gap: '24px', marginBottom: '14px', flexWrap: 'wrap' }}>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '15px', margin: '4px 0' }}><strong>Khách hàng:</strong> {detail.hoTenKH}</p>
                                            <p style={{ fontSize: '15px', margin: '4px 0' }}><strong>SĐT:</strong> {detail.sdtKH}</p>
                                            <p style={{ fontSize: '15px', margin: '4px 0' }}><strong>Ghi chú:</strong> {detail.ghiChu || '—'}</p>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <p style={{ fontSize: '15px', margin: '4px 0' }}><strong>Cửa hàng:</strong> {detail.cuaHang?.tenCuaHang || '—'}</p>
                                            <p style={{ fontSize: '15px', margin: '4px 0' }}><strong>Lý do:</strong> {LY_DO_LABEL[detail.lyDo] || detail.lyDo}</p>
                                            <p style={{ fontSize: '16px', margin: '4px 0', color: '#d97706', fontWeight: 700 }}>
                                                📅 Hẹn lấy: {detail.ngayHenLay ? new Date(detail.ngayHenLay).toLocaleString('vi-VN') : '-'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Bảng sản phẩm */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '14px', fontSize: '14px' }}>
                                        <thead>
                                            <tr style={{ background: '#f5f5f5' }}>
                                                <th style={styles.th}>Sản phẩm</th>
                                                <th style={{ ...styles.th, textAlign: 'center' }}>SL</th>
                                                <th style={{ ...styles.th, textAlign: 'right' }}>Đơn giá</th>
                                                <th style={{ ...styles.th, textAlign: 'right' }}>Thành tiền</th>
                                                <th style={styles.th}>Ghi chú SP</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(detail.chiTiets || []).map((ct, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '8px', fontSize: '15px' }}>{ct.tenSP}</td>
                                                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '15px' }}>{ct.soLuong}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '15px' }}>{fmt(ct.donGia)}</td>
                                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '15px', fontWeight: 600 }}>{fmt(ct.thanhTien)}</td>
                                                    <td style={{ padding: '8px', fontSize: '14px', color: '#666' }}>{ct.ghiChuSP || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* Tổng kết tiền */}
                                    <div style={{ borderTop: '2px solid #eee', paddingTop: '12px', textAlign: 'right' }}>
                                        <p style={{ fontSize: '15px', margin: '4px 0' }}>Tổng tiền: <strong>{fmt(detail.tongTien)}</strong></p>
                                        <p style={{ fontSize: '15px', margin: '4px 0', color: '#059669' }}>
                                            Đã cọc ({detail.phuongThucCoc || '—'}): <strong>{fmt(detail.tienCoc)}</strong>
                                        </p>
                                        <p style={{ fontSize: '18px', margin: '8px 0 0', fontWeight: 700, color: '#dc2626' }}>
                                            Còn lại: {fmt(detail.tienConLai)}
                                        </p>
                                    </div>

                                    {/* Trạng thái */}
                                    <div style={{ marginTop: '12px', textAlign: 'center' }}>
                                        <span className={`admin-badge ${(BADGE_MAP[detail.trangThai] || {}).cls}`}
                                            style={{ fontSize: '14px', padding: '6px 16px' }}>
                                            {(BADGE_MAP[detail.trangThai] || {}).label || detail.trangThai}
                                        </span>
                                    </div>

                                    {/* Chữ ký xác nhận khách hàng */}
                                    {detail.chuKy && (
                                        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px dashed #cbd5e1', paddingTop: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#64748b' }}>
                                                <div>Mã phiếu: <strong>{detail.maDHT}</strong></div>
                                                <div>Nhân viên lập: <strong>{detail.usernameNV || 'Hệ thống'}</strong></div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>✍️ Chữ ký khách hàng:</div>
                                                <img src={detail.chuKy} alt="Chữ ký khách hàng" style={{ height: '55px', maxWidth: '180px', objectFit: 'contain', borderBottom: '1px solid #94a3b8' }} />
                                                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginTop: '2px' }}>{detail.hoTenKH}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action buttons */}
                                <div style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {/* Cập nhật sẵn sàng */}
                                        {detail.trangThai === 'da_coc' && (
                                            <button className="admin-btn admin-btn-info" style={{ fontSize: '15px' }}
                                                onClick={() => handleUpdateStatus(detail.maDHT, 'san_sang')}>
                                                ✅ Đánh dấu Sẵn sàng
                                            </button>
                                        )}
                                        {/* Thu tiền còn lại */}
                                        {['cho_xac_nhan', 'da_coc', 'san_sang'].includes(detail.trangThai) && (
                                            <button className="admin-btn admin-btn-success" style={{ fontSize: '15px' }}
                                                onClick={() => { setPaymentMethod('Tiền mặt'); setShowPayment(true); }}>
                                                💰 Thu tiền còn lại
                                            </button>
                                        )}
                                        {/* Hủy đơn */}
                                        {!['da_giao', 'da_huy'].includes(detail.trangThai) && (
                                            <button className="admin-btn admin-btn-danger" style={{ fontSize: '15px' }}
                                                onClick={() => handleUpdateStatus(detail.maDHT, 'da_huy')}>
                                                🚫 Hủy đơn
                                            </button>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="admin-btn admin-btn-success" style={{ fontSize: '15px' }} onClick={handlePrint}>
                                            🖨 In phiếu
                                        </button>
                                        <button className="admin-btn admin-btn-secondary" style={{ fontSize: '15px' }}
                                            onClick={() => setShowDetail(false)}>Đóng</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══════ MODAL THU TIỀN CÒN LẠI ══════ */}
            {showPayment && detail && (
                <div style={{ ...styles.overlay, zIndex: 1100 }}>
                    <div style={{ ...styles.modal, maxWidth: '420px' }}>
                        <h2 style={{ margin: '0 0 16px', fontSize: '19px' }}>💰 Thu tiền còn lại</h2>
                        <p style={{ fontSize: '16px', marginBottom: '6px' }}>
                            Đơn: <strong>{detail.maDHT}</strong> — {detail.hoTenKH}
                        </p>
                        <p style={{ fontSize: '16px', marginBottom: '4px' }}>Tổng tiền: <strong>{fmt(detail.tongTien)}</strong></p>
                        <p style={{ fontSize: '16px', marginBottom: '4px', color: '#059669' }}>Đã cọc: <strong>{fmt(detail.tienCoc)}</strong></p>
                        <p style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626', marginBottom: '16px' }}>
                            Còn lại cần thu: {fmt(detail.tienConLai)}
                        </p>
                        <Field label="Hình thức thanh toán">
                            <select className="admin-input" style={styles.inp} value={paymentMethod}
                                onChange={e => setPaymentMethod(e.target.value)}>
                                <option>Tiền mặt</option>
                                <option>Chuyển khoản</option>
                                <option>Ví Momo P2P</option>
                            </select>
                        </Field>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '16px' }}>
                            <button className="admin-btn admin-btn-secondary" style={{ fontSize: '15px' }}
                                onClick={() => setShowPayment(false)}>Hủy</button>
                            <button className="admin-btn admin-btn-primary" style={{ fontSize: '15px' }}
                                disabled={paying} onClick={handleCompletePayment}>
                                {paying ? 'Đang xử lý...' : '✅ Xác nhận thu tiền'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

// ── Sub-components ───────────────────────────────────────────
const SectionTitle = ({ children }) => (
    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '10px', marginTop: '16px',
        borderLeft: '4px solid var(--admin-primary)', paddingLeft: '10px' }}>
        {children}
    </h3>
);

const Field = ({ label, error, children }) => (
    <div style={{ marginBottom: '10px' }}>
        <label style={styles.label}>{label}</label>
        {children}
        {error && <ErrMsg msg={error} />}
    </div>
);

const ErrMsg = ({ msg }) => (
    <span style={{ color: '#ef4444', fontSize: '13px', display: 'block', marginTop: '2px' }}>{msg}</span>
);

// ── Styles ───────────────────────────────────────────────────
const styles = {
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff', padding: '2rem', borderRadius: '10px',
        width: '95%', boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
    },
    closeBtn: {
        background: 'none', border: 'none', fontSize: '20px',
        cursor: 'pointer', color: '#666', lineHeight: 1,
    },
    grid2: {
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    },
    inp: { marginBottom: 0, fontSize: '15px', width: '100%' },
    label: { fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '4px', color: '#374151' },
    th: { padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '2px solid #ddd' },
};

export default AdminPreOrderPage;
