import React, { useEffect, useState } from "react";
import Footer from "../Layout/Footer";
import { getCart, removeFromCart, updateCartQuantity, checkout } from "../services/cartService";
import { useToast } from '../components/Toast/Toast';
import { formatImageUrl } from "../utils/imageUtils";

const getImageSrc = (imageUrl) => {
    return formatImageUrl(imageUrl);
};

const getItemMasp = (item) => item?.sanPhamId || item?.sanpham_id || item?.sanpham?.id || item?.id || item?.masp || item?.MASP || "";
const getItemBasePrice = (item) => Number(item?.basePrice || item?.sanpham?.giaBan || item?.sanpham?.GIABAN || item?.sanpham?.gia_ban || item?.price || 0);
const getItemDiscountPct = (item) => Number(item?.phanTramGiam || item?.PHAN_TRAM_GIAM || item?.sanpham?.phanTramGiam || item?.sanpham?.PHAN_TRAM_GIAM || 0);
const getItemPrice = (item) => {
    const sp = item?.sanpham;
    const pct = getItemDiscountPct(item);
    const base = getItemBasePrice(item);
    if (pct > 0 && pct <= 100 && base > 0) {
        return Math.round(base * (1 - pct / 100));
    }
    if (sp && (sp.giaSauGiam !== undefined || sp.GIA_SAU_GIAM !== undefined)) {
        const after = Number(sp.giaSauGiam ?? sp.GIA_SAU_GIAM);
        if (!isNaN(after) && after > 0) return after;
    }
    return base;
};
const getItemQty = (item) => Number(item?.quantity || item?.soLuong || item?.so_luong || 1);
const getItemName = (item) => item?.name || item?.sanpham?.tenSanPham || item?.sanpham?.TENSP || item?.sanpham?.ten_san_pham || "Sản phẩm";
const getItemImage = (item) => item?.image || item?.sanpham?.hinhAnh || item?.sanpham?.HINHANH || item?.sanpham?.hinh_anh;

const removeVietnameseTones = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .toLowerCase()
        .trim();
};

const AVAILABLE_TRANSFER_BANKS = [
    {
        id: 'MB',
        name: 'MBBank - Ngân hàng TMCP Quân Đội',
        shortName: 'MBBank',
        bin: 'MB',
        accountNumber: '0338052164',
        accountName: 'NGUYEN HUU THIEN',
        badge: 'Khuyên dùng (24/7)',
        guide: 'Mở App MBBank hoặc bất kỳ App Ngân Hàng nào để quét mã VietQR',
    }
];

const CartPage = () => {
    const toast = useToast();
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [selectedBank, setSelectedBank] = useState(AVAILABLE_TRANSFER_BANKS[0]);
    const [isCopiedNote, setIsCopiedNote] = useState(false);
    const [isCopiedStk, setIsCopiedStk] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [mahd] = useState("HD" + Math.floor(Date.now() / 1000).toString().slice(-8));

    // GHN States
    const [provinces, setProvinces] = useState([]);
    const [wards, setWards] = useState([]);
    const [provinceSearch, setProvinceSearch] = useState("");
    const [wardSearch, setWardSearch] = useState("");
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [shippingFee, setShippingFee] = useState(30000);
    const [isLoadingWards, setIsLoadingWards] = useState(false);

    // Saved Addresses
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [saveAsDefault, setSaveAsDefault] = useState(true);

    // Voucher States
    const [voucherInput, setVoucherInput] = useState("");
    const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState("");
    const [voucherError, setVoucherError] = useState("");
    const [bestVoucher, setBestVoucher] = useState(null);
    const [availableVouchers, setAvailableVouchers] = useState([]);
    const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
    const [isConfirmOrderModalOpen, setIsConfirmOrderModalOpen] = useState(false);

    const [receiptFile, setReceiptFile] = useState(null);
    const [receiptPreview, setReceiptPreview] = useState(null);
    const [isVerifyingReceipt, setIsVerifyingReceipt] = useState(false);
    const [receiptStatus, setReceiptStatus] = useState(null);
    const [isLoadingCart, setIsLoadingCart] = useState(true);
    const [orderSuccessBanner, setOrderSuccessBanner] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('success') === '1') {
            setOrderSuccessBanner(true);
        }
    }, []);

    const fetchShippingFee = async (wardCode, districtId) => {
        if (!wardCode) {
            setShippingFee(30000);
            return;
        }
        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.post('/ghn/fee', {
                to_ward_code: String(wardCode),
                to_district_id: parseInt(districtId) || 1444,
                weight: 1000
            });
            if (res.data && res.data.code === 200 && res.data.data && res.data.data.total) {
                setShippingFee(Number(res.data.data.total));
            } else {
                setShippingFee(30000);
            }
        } catch (err) {
            console.warn("Lỗi tính phí ship GHN, dùng phí chuẩn 30k:", err);
            setShippingFee(30000);
        }
    };

    const applyAddress = async (addr) => {
        if (!addr) return;
        setSelectedAddressId(addr.id);
        setAddressDetail(addr.diaChiChiTiet || addr.diaChi || addr.address || '');

        const pId = addr.maTinh || addr.province_id;
        const dId = addr.maHuyen || addr.district_id;
        const wCode = addr.maXa || addr.ward_code;

        if (pId) {
            setSelectedProvince(String(pId));
            setIsLoadingWards(true);
            try {
                const m = await import('../services/axiosClient.js');
                const res = await m.default.get(`/ghn/wards-by-province?province_id=${pId}`);
                const wardList = res.data?.data || [];
                setWards(wardList);

                if (wCode) {
                    setSelectedWard(String(wCode));
                    let districtIdToUse = dId;
                    const foundW = wardList.find(w => String(w.WardCode) === String(wCode));
                    if (foundW) {
                        districtIdToUse = foundW.DistrictID;
                        setSelectedDistrict(String(foundW.DistrictID));
                    } else if (dId) {
                        setSelectedDistrict(String(dId));
                    }
                    await fetchShippingFee(wCode, districtIdToUse);
                } else {
                    setShippingFee(30000);
                }
            } catch (err) {
                console.error("Lỗi nạp danh sách phường/xã theo địa chỉ lưu:", err);
                setShippingFee(30000);
            } finally {
                setIsLoadingWards(false);
            }
        }
    };

    const loadSavedAddresses = async () => {
        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.get('/addresses');
            const list = res.data?.data || res.data || [];
            setSavedAddresses(list);
            if (list.length > 0) {
                const defaultAddr = list.find(a => a.isDefault || a.is_default) || list[0];
                if (defaultAddr) {
                    applyAddress(defaultAddr);
                }
            }
        } catch (e) {
            // Khách chưa đăng nhập hoặc chưa có địa chỉ
        }
    };

    const loadCart = async () => {
        setIsLoadingCart(true);
        try {
            const data = await getCart();
            const items = Array.isArray(data) ? data : (data?.items || []);
            setCartItems(items);
            const sum = items.reduce((acc, item) => acc + (getItemPrice(item) * getItemQty(item)), 0);
            setTotal(sum);
        } catch (e) {
            if (e.response?.status === 401) {
                toast.warning("Vui lòng đăng nhập để xem giỏ hàng");
                if (window.location.pathname !== '/dang-nhap') {
                    window.location.href = "/dang-nhap";
                }
            } else {
                console.error("Lỗi load cart:", e);
                setCartItems([]);
            }
        } finally {
            setIsLoadingCart(false);
        }
    };

    useEffect(() => {
        loadCart();
        loadSavedAddresses();

        // Load Tỉnh/Thành
        import('../services/axiosClient.js').then(m => {
            m.default.get('/ghn/provinces').then(res => {
                if (res.data && res.data.data) {
                    const cleanList = res.data.data.filter(p => {
                        const id = Number(p.ProvinceID);
                        const name = String(p.ProvinceName || '').toLowerCase();
                        return id !== 298 && id !== 2002 && !/test|alert|demo|fake|hà nội 02/i.test(name);
                    });
                    setProvinces(cleanList);
                }
            }).catch(e => console.error("Lỗi load tỉnh/thành:", e));
        });

        const handleUpdate = () => loadCart();
        document.addEventListener('cartUpdated', handleUpdate);
        return () => document.removeEventListener('cartUpdated', handleUpdate);
    }, []);

    // Khi Tỉnh/Thành thay đổi -> Tự động nạp toàn bộ Phường/Xã thuộc Tỉnh/Thành đó (bỏ qua cấp quận/huyện)
    const handleProvinceChange = async (e) => {
        const provId = e.target.value;
        setSelectedProvince(provId);
        setSelectedWard("");
        setSelectedDistrict("");
        setWardSearch("");
        setSelectedAddressId(null);
        setShippingFee(30000);

        if (!provId) {
            setWards([]);
            return;
        }

        setIsLoadingWards(true);
        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.get(`/ghn/wards-by-province?province_id=${provId}`);
            if (res.data && res.data.data) {
                setWards(res.data.data);
            }
        } catch (err) {
            console.error("Lỗi tải danh sách Phường/Xã:", err);
            toast.error("Không thể tải danh sách Phường/Xã. Vui lòng thử lại!");
        } finally {
            setIsLoadingWards(false);
        }
    };

    // Khi Phường/Xã thay đổi -> Tự động ánh xạ districtId và tính phí vận chuyển GHN
    const handleWardChange = async (e) => {
        const wCode = e.target.value;
        setSelectedWard(wCode);
        setSelectedAddressId(null);

        const foundWard = wards.find(w => String(w.WardCode) === String(wCode));
        if (foundWard) {
            const dId = String(foundWard.DistrictID);
            setSelectedDistrict(dId);
            await fetchShippingFee(wCode, dId);
        } else {
            setSelectedDistrict("");
            setShippingFee(30000);
        }
    };

    // Gợi ý voucher tự động & tự động áp dụng nếu có ?voucher=... trên URL từ Ví Voucher
    useEffect(() => {
        if (total > 0) {
            const params = new URLSearchParams(window.location.search);
            const urlVoucher = params.get('voucher');
            if (urlVoucher && !appliedVoucherCode) {
                handleApplyVoucher(urlVoucher);
            }

            import('../services/axiosClient.js').then(m => {
                m.default.post('/vouchers/suggest-for-order', { subtotal: total })
                    .then(res => {
                        if (res.data) {
                            setBestVoucher(res.data.best_voucher || null);
                            setAvailableVouchers(res.data.available_vouchers || []);
                        }
                    })
                    .catch(err => console.error("Lỗi gợi ý voucher:", err));
            });
        }
    }, [total]);

    const handleRemove = async (masp) => {
        if (!masp) return;
        try {
            await removeFromCart(masp);
            await loadCart();
            document.dispatchEvent(new Event('cartUpdated'));
            toast.info("Đã xóa sản phẩm khỏi giỏ hàng");
        } catch (e) {
            console.error("Lỗi xóa:", e);
            toast.error("Không thể xóa sản phẩm: " + e.message);
        }
    };

    const handleUpdateQty = async (masp, newQty) => {
        if (!masp) return;
        if (newQty <= 0) {
            handleRemove(masp);
            return;
        }
        try {
            await updateCartQuantity(masp, newQty);
            await loadCart();
            document.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            console.error("Lỗi cập nhật số lượng:", e);
        }
    };

    const handleApplyVoucher = async (targetCode = null) => {
        setVoucherMessage("");
        setVoucherError("");
        const codeToApply = (targetCode || voucherInput || "").trim().toUpperCase();
        if (!codeToApply) {
            setVoucherError("Vui lòng nhập hoặc chọn mã voucher!");
            return;
        }

        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.post('/vouchers/apply', {
                voucher_code: codeToApply,
                subtotal: total
            });

            if (res.data && res.data.success) {
                setVoucherMessage(res.data.message || `Đã áp dụng: ${res.data.voucher_name}`);
                setAppliedVoucherCode(res.data.voucher_code);
                setVoucherDiscount(res.data.discount_amount);
                setVoucherInput(res.data.voucher_code);
                setVoucherError("");
                setIsVoucherModalOpen(false);
                toast.success(`🎉 ${res.data.message}`);
            }
        } catch (e) {
            const errMsg = e.response?.data?.error || e.message || "Lỗi áp dụng voucher";
            setVoucherError(errMsg);
            setAppliedVoucherCode("");
            setVoucherDiscount(0);
            toast.error(errMsg);
        }
    };

    const handleRemoveVoucher = () => {
        setAppliedVoucherCode("");
        setVoucherDiscount(0);
        setVoucherMessage("");
        setVoucherError("");
        setVoucherInput("");
        toast.info("Đã hủy áp dụng voucher!");
    };

    const [isPaymentDetected, setIsPaymentDetected] = useState(false);
    const [isCheckingPayment, setIsCheckingPayment] = useState(false);
    const [countdownSeconds, setCountdownSeconds] = useState(20);
    const [isOrderCreatedSuccessfully, setIsOrderCreatedSuccessfully] = useState(false);

    // Đếm ngược 20s tự động chuyển sang trang quản lý đơn hàng
    useEffect(() => {
        if (!isPaymentDetected) return;

        const timer = setInterval(() => {
            setCountdownSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = "/my-orders";
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaymentDetected]);

    // Live Auto-Detection for VietQR & MoMo payment
    useEffect(() => {
        if (paymentMethod !== 'VIETQR' && paymentMethod !== 'MOMO') return;
        if (isPaymentDetected || isProcessing) return;

        let isSubscribed = true;
        const interval = setInterval(async () => {
            try {
                const m = await import('../services/axiosClient.js');
                const res = await m.default.get(`/payment/check-status/${mahd}`);
                if (res.data?.paid && isSubscribed) {
                    setIsPaymentDetected(true);
                    clearInterval(interval);
                    toast.success("🎉 Ngân hàng đã ghi nhận chuyển khoản thành công!");
                    handleAutoCheckout();
                }
            } catch (err) {
                // Silently ignore polling errors
            }
        }, 2500);

        return () => {
            isSubscribed = false;
            clearInterval(interval);
        };
    }, [paymentMethod, mahd, isPaymentDetected, isProcessing]);

    const handleAutoCheckout = async () => {
        setIsProcessing(true);
        try {
            const provName = provinces.find(p => String(p.ProvinceID) === String(selectedProvince))?.ProvinceName || '';
            const wardObj = wards.find(w => String(w.WardCode) === String(selectedWard));
            const wardName = wardObj?.WardName || '';
            const distId = wardObj?.DistrictID || selectedDistrict || 1444;
            const fullAddress = addressDetail 
                ? `${addressDetail}, ${wardName}, ${provName}`
                : 'Địa chỉ nhận hàng mặc định của khách hàng';

            const itemsPayload = cartItems.map(item => ({
                sanPhamId: getItemMasp(item),
                soLuong: getItemQty(item),
                donGia: getItemPrice(item),
                tenSanPham: getItemName(item)
            }));

            const checkoutPayload = {
                mahd: mahd,
                paymentMethod: paymentMethod,
                address: fullAddress,
                note: `Khách thanh toán trực tuyến tự động qua ${paymentMethod === 'VIETQR' ? 'VietQR 24/7' : 'Ví MoMo'}.`,
                shippingFee: shippingFee || 30000,
                to_ward_code: selectedWard || '',
                to_district_id: distId ? parseInt(distId) : 1444,
                items: itemsPayload,
                CHI_TIET: itemsPayload,
                voucher_code: appliedVoucherCode || null
            };

            await checkout(checkoutPayload);

            setCartItems([]);
            setTotal(0);
            document.dispatchEvent(new Event('cartUpdated'));
            setIsOrderCreatedSuccessfully(true);
            setCountdownSeconds(20);
            toast.success(`🎉 Ngân hàng đã ghi nhận chuyển khoản cho đơn #${mahd}! Đơn hàng đang được chuẩn bị.`, 20000);
        } catch (error) {
            console.error("Lỗi tự động hoàn tất đơn hàng:", error);
            setIsPaymentDetected(false);
            const errorMsg = error.response?.data?.error 
                || error.response?.data?.message 
                || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
                || error.message 
                || "Có lỗi xảy ra khi tạo đơn hàng. Vui lòng thử lại!";
            toast.error(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    const triggerManualConfirm = async () => {
        setIsCheckingPayment(true);
        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.get(`/payment/check-status/${mahd}`);
            if (res.data?.paid) {
                setIsPaymentDetected(true);
                toast.success("🎉 Ngân hàng đã ghi nhận chuyển khoản thành công!");
                await handleAutoCheckout();
            } else {
                toast.info("⏳ Hệ thống chưa nhận được tín hiệu tiền vào tài khoản từ ngân hàng cho mã " + mahd + ". Nếu bạn đã chuyển khoản, vui lòng đợi vài giây để ngân hàng gửi tín hiệu!");
            }
        } catch (err) {
            toast.error("Không thể kết nối đến máy chủ kiểm tra thanh toán.");
        } finally {
            setIsCheckingPayment(false);
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            toast.warning("Giỏ hàng của bạn đang trống!");
            return;
        }

        if (!selectedProvince || !selectedWard || !addressDetail) {
            toast.warning("Vui lòng chọn Tỉnh/Thành, Phường/Xã và nhập số nhà tên đường!");
            return;
        }

        const provName = provinces.find(p => String(p.ProvinceID) === String(selectedProvince))?.ProvinceName || '';
        const wardObj = wards.find(w => String(w.WardCode) === String(selectedWard));
        const wardName = wardObj?.WardName || '';
        const distId = wardObj?.DistrictID || selectedDistrict || 1444;

        // Định dạng địa chỉ mới: Không còn quận nữa theo đúng yêu cầu gộp tỉnh thành của người dùng
        const fullAddress = `${addressDetail}, ${wardName}, ${provName}`;

        const paymentMethodLabel = paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : paymentMethod === 'MOMO' ? 'Ví MoMo' : 'Tiền mặt (COD)';

        if (paymentMethod !== 'COD') {
            // Với VietQR và MoMo: Kích hoạt xác nhận tự động ngay lập tức
            await triggerManualConfirm();
            return;
        }

        // Mở mini window xác nhận đặt hàng thay cho hộp thoại browser alert/confirm
        setIsConfirmOrderModalOpen(true);
    };

    const handleConfirmOrder = async () => {
        const provName = provinces.find(p => String(p.ProvinceID) === String(selectedProvince))?.ProvinceName || '';
        const wardObj = wards.find(w => String(w.WardCode) === String(selectedWard));
        const wardName = wardObj?.WardName || '';
        const distId = wardObj?.DistrictID || selectedDistrict || 1444;

        // Định dạng địa chỉ mới: Không còn quận nữa theo đúng yêu cầu gộp tỉnh thành của người dùng
        const fullAddress = `${addressDetail}, ${wardName}, ${provName}`;

        const paymentMethodLabel = paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : paymentMethod === 'MOMO' ? 'Ví MoMo' : 'Tiền mặt (COD)';
        const currentShippingFee = shippingFee || 30000;

        setIsProcessing(true);
        try {
            // Tự sinh mã đơn hàng độc nhất tránh trùng lặp
            const currentOrderCode = "HD" + Date.now().toString().slice(-8) + Math.floor(Math.random() * 90 + 10);

            const itemsPayload = cartItems.map(item => ({
                sanPhamId: getItemMasp(item),
                soLuong: getItemQty(item),
                donGia: getItemPrice(item),
                tenSanPham: getItemName(item)
            }));

            const payload = {
                mahd: currentOrderCode,
                paymentMethod: paymentMethod,
                address: fullAddress,
                note: `Khách tự đặt Online (${paymentMethodLabel}).`,
                shippingFee: currentShippingFee,
                to_ward_code: selectedWard,
                to_district_id: distId ? parseInt(distId) : 1444,
                saveAddress: saveAsDefault ? 1 : 0,
                isDefault: saveAsDefault ? 1 : 0,
                maTinh: selectedProvince ? parseInt(selectedProvince) : null,
                maHuyen: distId ? parseInt(distId) : null,
                maXa: selectedWard,
                diaChiChiTiet: addressDetail,
                items: itemsPayload,
                CHI_TIET: itemsPayload,
                voucher_code: appliedVoucherCode || null
            };

            await checkout(payload);

            toast.success("🎉 Đặt hàng thành công! Đơn hàng của bạn đã được tiếp nhận.");
            setCartItems([]);
            setTotal(0);
            setIsConfirmOrderModalOpen(false);
            document.dispatchEvent(new Event('cartUpdated'));

            // Hiển thị thông báo thành công và chuyển hướng linh hoạt
            window.location.href = "/gio-hang?success=1";
        } catch (error) {
            console.error("Lỗi thanh toán:", error);
            const errorMsg = error.response?.data?.error 
                || error.response?.data?.message 
                || (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : null)
                || error.message 
                || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!";
            toast.error(errorMsg);
        } finally {
            setIsProcessing(false);
        }
    };

    // Lọc danh sách Tỉnh/Thành theo từ khóa (có dấu hoặc không dấu)
    const filteredProvinces = provinces.filter(p => {
        if (!provinceSearch.trim()) return true;
        return removeVietnameseTones(p.ProvinceName).includes(removeVietnameseTones(provinceSearch));
    });

    // Lọc danh sách Phường/Xã theo từ khóa (có dấu hoặc không dấu, tìm theo cả tên Phường và tên Quận)
    const filteredWards = wards.filter(w => {
        if (!wardSearch.trim()) return true;
        const searchNorm = removeVietnameseTones(wardSearch);
        const wardNorm = removeVietnameseTones(w.WardName || "");
        const distNorm = removeVietnameseTones(w.DistrictName || "");
        return wardNorm.includes(searchNorm) || distNorm.includes(searchNorm);
    });

    const finalTotal = Math.max(0, (total + (shippingFee || 30000)) - voucherDiscount);

    return (
        <>
            <main style={{ backgroundColor: "#fdfdfd", minHeight: "80vh", paddingBottom: "60px" }}>
                <div className="grid wide" style={{ maxWidth: "1140px", margin: "0 auto", padding: "20px 15px" }}>
                    {/* Breadcrumbs */}
                    <div style={{ fontSize: "13px", color: "#888", marginBottom: "16px" }}>
                        <a href="/" style={{ color: "#888", textDecoration: "none" }}>Trang chủ</a>
                        <span style={{ margin: "0 8px" }}>/</span>
                        <span style={{ color: "#333" }}>Giỏ hàng</span>
                    </div>

                    {/* Banner đặt hàng thành công (nếu chuyển hướng sau khi đặt đơn) */}
                    {orderSuccessBanner && (
                        <div style={{
                            backgroundColor: "#fdfbf7",
                            border: "1px solid #e8decb",
                            borderRadius: "6px",
                            padding: "14px 20px",
                            marginBottom: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ fontSize: "14px", color: "#7a6237" }}>
                                Đặt hàng thành công.{" "}
                                <a href="/my-orders" style={{ color: "#7a6237", fontWeight: "600", textDecoration: "none", marginLeft: "4px" }}>
                                    Xem đơn hàng của bạn →
                                </a>
                            </div>
                            <button
                                onClick={() => setOrderSuccessBanner(false)}
                                style={{ background: "none", border: "none", fontSize: "18px", color: "#9c8760", cursor: "pointer" }}
                            >
                                &times;
                            </button>
                        </div>
                    )}

                    {/* Tiêu đề trang */}
                    <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#222", margin: "0 0 6px 0" }}>
                        Giỏ hàng của bạn
                    </h1>
                    <p style={{ fontSize: "14px", color: "#666", margin: "0 0 25px 0" }}>
                        Kiểm tra sản phẩm và thông tin giao hàng trước khi đặt bánh.
                    </p>

                    {isLoadingCart ? (
                        <div style={{ textAlign: "center", padding: "80px 20px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #ebe5df" }}>
                            <i className="fa fa-spinner fa-spin" style={{ fontSize: "36px", color: "#c89968", marginBottom: "15px", display: "block" }}></i>
                            <span style={{ fontSize: "15px", color: "#777" }}>Đang tải giỏ hàng của bạn...</span>
                        </div>
                    ) : cartItems.length === 0 ? (
                        /* Giao diện giỏ hàng trống */
                        <div style={{
                            backgroundColor: "#fff",
                            border: "1px solid #ebe5df",
                            borderRadius: "8px",
                            padding: "70px 20px",
                            textAlign: "center"
                        }}>
                            <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#333", margin: "0 0 8px 0" }}>
                                Giỏ hàng đang trống.
                            </h3>
                            <p style={{ fontSize: "14px", color: "#777", margin: "0 0 24px 0" }}>
                                Hãy chọn thêm những chiếc bánh bạn yêu thích.
                            </p>
                            <a
                                href="/san-pham"
                                style={{
                                    display: "inline-block",
                                    backgroundColor: "#c89968",
                                    color: "#fff",
                                    padding: "10px 28px",
                                    borderRadius: "4px",
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    textDecoration: "none",
                                    transition: "background-color 0.2s"
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = "#b88755"}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = "#c89968"}
                            >
                                Tiếp tục mua sắm
                            </a>
                        </div>
                    ) : (
                        <>
                            {/* Bảng danh sách sản phẩm trong giỏ */}
                            <div className="cart-table-wrapper" style={{
                                backgroundColor: "#fff",
                                border: "1px solid #ebe5df",
                                borderRadius: "8px",
                                overflowX: "auto",
                                WebkitOverflowScrolling: "touch",
                                marginBottom: "30px"
                            }}>
                                <table style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "1px solid #ebe5df", backgroundColor: "#faf8f5" }}>
                                            <th style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "600", color: "#444", width: "45%" }}>
                                                Thông tin sản phẩm
                                            </th>
                                            <th style={{ padding: "16px 15px", fontSize: "14px", fontWeight: "600", color: "#444", textAlign: "center", width: "18%" }}>
                                                Đơn giá
                                            </th>
                                            <th style={{ padding: "16px 15px", fontSize: "14px", fontWeight: "600", color: "#444", textAlign: "center", width: "18%" }}>
                                                Số lượng
                                            </th>
                                            <th style={{ padding: "16px 20px", fontSize: "14px", fontWeight: "600", color: "#444", textAlign: "right", width: "19%" }}>
                                                Thành tiền
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cartItems.map((item, index) => {
                                            const masp = getItemMasp(item);
                                            const basePrice = getItemBasePrice(item);
                                            const discountPct = getItemDiscountPct(item);
                                            const price = getItemPrice(item);
                                            const qty = getItemQty(item);
                                            const name = getItemName(item);
                                            const image = getItemImage(item);
                                            return (
                                                <tr key={index} style={{ borderBottom: index === cartItems.length - 1 ? "none" : "1px solid #f2ede7" }}>
                                                    <td style={{ padding: "18px 20px" }}>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                                            <img
                                                                src={getImageSrc(image)}
                                                                alt={name}
                                                                style={{
                                                                    width: "80px",
                                                                    height: "80px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #eee",
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                            <div>
                                                                <div style={{ fontSize: "14px", fontWeight: "700", color: "#222", textTransform: "uppercase", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                                                    <span>{name}</span>
                                                                    {discountPct > 0 && (
                                                                        <span style={{ background: "#ef4444", color: "#fff", fontSize: "11px", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                                                                            -{discountPct}%
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleRemove(masp)}
                                                                    style={{
                                                                        background: "none",
                                                                        border: "none",
                                                                        color: "#888",
                                                                        fontSize: "12px",
                                                                        cursor: "pointer",
                                                                        padding: 0,
                                                                        textDecoration: "underline"
                                                                    }}
                                                                >
                                                                    Xóa sản phẩm
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "18px 15px", textAlign: "center", fontSize: "14px", color: "#333" }}>
                                                        {discountPct > 0 && basePrice > price ? (
                                                            <div>
                                                                <div style={{ fontWeight: "700", color: "#d9534f" }}>{price.toLocaleString('vi-VN')}đ</div>
                                                                <div style={{ fontSize: "12px", color: "#999", textDecoration: "line-through" }}>{basePrice.toLocaleString('vi-VN')}đ</div>
                                                            </div>
                                                        ) : (
                                                            <span>{price.toLocaleString('vi-VN')}đ</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: "18px 15px", textAlign: "center" }}>
                                                        <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #dcd6ce", borderRadius: "4px", backgroundColor: "#fff" }}>
                                                            <button
                                                                onClick={() => handleUpdateQty(masp, qty - 1)}
                                                                style={{ width: "30px", height: "30px", border: "none", background: "none", cursor: "pointer", fontSize: "15px", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                            >
                                                                -
                                                            </button>
                                                            <div style={{ width: "36px", height: "30px", borderLeft: "1px solid #eee", borderRight: "1px solid #eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600", color: "#222" }}>
                                                                {qty}
                                                            </div>
                                                            <button
                                                                onClick={() => handleUpdateQty(masp, qty + 1)}
                                                                style={{ width: "30px", height: "30px", border: "none", background: "none", cursor: "pointer", fontSize: "15px", color: "#555", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: "18px 20px", textAlign: "right", fontSize: "15px", fontWeight: "600", color: "#222" }}>
                                                        {(price * qty).toLocaleString('vi-VN')}đ
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                {/* Dưới bảng: Tiếp tục mua sắm & Tạm tính */}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "16px 20px",
                                    backgroundColor: "#faf8f5",
                                    borderTop: "1px solid #ebe5df"
                                }}>
                                    <a
                                        href="/san-pham"
                                        style={{ fontSize: "14px", color: "#555", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px" }}
                                    >
                                        <span>←</span> Tiếp tục mua sắm
                                    </a>
                                    <div style={{ fontSize: "14px", color: "#555" }}>
                                        Tạm tính <b style={{ fontSize: "17px", color: "#222", marginLeft: "12px" }}>{total.toLocaleString('vi-VN')}đ</b>
                                    </div>
                                </div>
                            </div>

                            {/* Responsive styles cho thiết bị di động */}
                            <style>{`
                                @media (max-width: 768px) {
                                    .cart-checkout-grid {
                                        grid-template-columns: 1fr !important;
                                        gap: 16px !important;
                                    }
                                    .cart-address-row {
                                        grid-template-columns: 1fr !important;
                                        gap: 12px !important;
                                    }
                                    .cart-table-wrapper {
                                        border-radius: 8px !important;
                                        overflow-x: auto !important;
                                        -webkit-overflow-scrolling: touch !important;
                                    }
                                    .cart-table-wrapper table {
                                        min-width: 600px !important;
                                    }
                                }
                            `}</style>

                            {/* 2 Khối Thông tin giao hàng & Đơn hàng của bạn */}
                            <div className="cart-checkout-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", alignItems: "start" }}>
                                {/* Khối 1: Thông tin giao hàng */}
                                <div style={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #ebe5df",
                                    borderRadius: "8px",
                                    padding: "24px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
                                        <div style={{
                                            width: "26px",
                                            height: "26px",
                                            borderRadius: "50%",
                                            backgroundColor: "#c89968",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>
                                            1
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#222", margin: "0 0 2px 0" }}>
                                                Thông tin giao hàng
                                            </h3>
                                            <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
                                                Nhập địa chỉ để chúng tôi giao bánh đến bạn.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sổ địa chỉ đã lưu (nếu có) */}
                                    {savedAddresses.length > 0 && (
                                        <div style={{ marginBottom: "16px" }}>
                                            <div style={{ fontSize: "12px", fontWeight: "600", color: "#555", marginBottom: "6px" }}>
                                                Địa chỉ đã lưu trong tài khoản:
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                                                {savedAddresses.map(addr => (
                                                    <button
                                                        key={addr.id}
                                                        type="button"
                                                        onClick={() => applyAddress(addr)}
                                                        style={{
                                                            padding: "6px 12px",
                                                            borderRadius: "4px",
                                                            border: selectedAddressId === addr.id ? "1.5px solid #c89968" : "1px solid #e0e0e0",
                                                            backgroundColor: selectedAddressId === addr.id ? "#fcf8f3" : "#fff",
                                                            fontSize: "12px",
                                                            color: selectedAddressId === addr.id ? "#8a5c2d" : "#444",
                                                            cursor: "pointer",
                                                            whiteSpace: "nowrap"
                                                        }}
                                                    >
                                                        {addr.hoTenNguoiNhan || "Địa chỉ"} {Number(addr.isDefault ?? addr.is_default) === 1 ? "(Mặc định)" : ""}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Hàng 1: Tỉnh/Thành & Phường/Xã (Không còn quận theo yêu cầu gộp tỉnh thành) */}
                                    <div className="cart-address-row" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" }}>
                                        {/* Cột Tỉnh/Thành */}
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>
                                                Tỉnh/Thành
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Tìm Tỉnh/Thành..."
                                                value={provinceSearch}
                                                onChange={e => setProvinceSearch(e.target.value)}
                                                style={{
                                                    width: "100%",
                                                    padding: "9px 12px",
                                                    border: "1px solid #dcd6ce",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    marginBottom: "6px",
                                                    outline: "none",
                                                    backgroundColor: "#fcfbfa"
                                                }}
                                            />
                                            <select
                                                value={selectedProvince}
                                                onChange={handleProvinceChange}
                                                style={{
                                                    width: "100%",
                                                    padding: "9px 12px",
                                                    border: "1px solid #dcd6ce",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    backgroundColor: "#fff",
                                                    outline: "none",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                                {filteredProvinces.map(p => (
                                                    <option key={p.ProvinceID} value={p.ProvinceID}>
                                                        {p.ProvinceName}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Cột Phường/Xã */}
                                        <div>
                                            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>
                                                Phường/Xã
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Tìm Phường/Xã..."
                                                value={wardSearch}
                                                onChange={e => setWardSearch(e.target.value)}
                                                disabled={!selectedProvince}
                                                style={{
                                                    width: "100%",
                                                    padding: "9px 12px",
                                                    border: "1px solid #dcd6ce",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    marginBottom: "6px",
                                                    outline: "none",
                                                    backgroundColor: !selectedProvince ? "#f5f5f5" : "#fcfbfa"
                                                }}
                                            />
                                            <select
                                                value={selectedWard}
                                                onChange={handleWardChange}
                                                disabled={!selectedProvince || isLoadingWards}
                                                style={{
                                                    width: "100%",
                                                    padding: "9px 12px",
                                                    border: "1px solid #dcd6ce",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    backgroundColor: !selectedProvince ? "#f5f5f5" : "#fff",
                                                    outline: "none",
                                                    cursor: !selectedProvince ? "not-allowed" : "pointer"
                                                }}
                                            >
                                                <option value="">
                                                    {isLoadingWards ? "Đang tải Phường/Xã..." : "Chọn Phường/Xã"}
                                                </option>
                                                {filteredWards.map(w => (
                                                    <option key={`${w.WardCode}-${w.DistrictID || ''}`} value={w.WardCode}>
                                                        {w.FullName || `${w.WardName}${w.DistrictName ? ` (${w.DistrictName})` : ''}`}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Hàng 2: Số nhà, tên đường */}
                                    <div style={{ marginBottom: "16px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>
                                            Số nhà, tên đường
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Ví dụ: 12 Nguyễn Văn A"
                                            value={addressDetail}
                                            onChange={e => {
                                                setAddressDetail(e.target.value);
                                                setSelectedAddressId(null);
                                            }}
                                            style={{
                                                width: "100%",
                                                padding: "9px 12px",
                                                border: "1px solid #dcd6ce",
                                                borderRadius: "4px",
                                                fontSize: "13px",
                                                outline: "none"
                                            }}
                                        />
                                        <div style={{ fontSize: "12px", color: "#999", marginTop: "6px" }}>
                                            Vui lòng nhập địa chỉ nhận hàng chính xác.
                                        </div>
                                    </div>

                                    {/* Checkbox lưu làm mặc định */}
                                    <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#555" }}>
                                        <input
                                            type="checkbox"
                                            checked={saveAsDefault}
                                            onChange={e => setSaveAsDefault(e.target.checked)}
                                            style={{ accentColor: "#c89968", width: "15px", height: "15px" }}
                                        />
                                        <span>Lưu địa chỉ này cho các đơn hàng tiếp theo</span>
                                    </label>
                                </div>

                                {/* Khối 2: Đơn hàng của bạn */}
                                <div style={{
                                    backgroundColor: "#fff",
                                    border: "1px solid #ebe5df",
                                    borderRadius: "8px",
                                    padding: "24px"
                                }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "20px" }}>
                                        <div style={{
                                            width: "26px",
                                            height: "26px",
                                            borderRadius: "50%",
                                            backgroundColor: "#c89968",
                                            color: "#fff",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "13px",
                                            fontWeight: "700",
                                            flexShrink: 0
                                        }}>
                                            2
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#222", margin: "0 0 2px 0" }}>
                                                Đơn hàng của bạn
                                            </h3>
                                            <p style={{ fontSize: "13px", color: "#777", margin: 0 }}>
                                                Ưu đãi & thanh toán
                                            </p>
                                        </div>
                                    </div>

                                    {/* Voucher */}
                                    <div style={{ marginBottom: "20px" }}>
                                        <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#444", marginBottom: "6px" }}>
                                            Voucher
                                        </label>
                                        <div style={{ display: "flex", gap: "8px", position: "relative" }}>
                                            <input
                                                type="text"
                                                readOnly
                                                placeholder="Tự động chọn voucher tiết kiệm nhất"
                                                value={appliedVoucherCode ? `Mã: ${appliedVoucherCode} (-${voucherDiscount.toLocaleString('vi-VN')}đ)` : (bestVoucher ? `Gợi ý tốt nhất: ${bestVoucher.MA_VOUCHER}` : "")}
                                                onClick={() => setIsVoucherModalOpen(true)}
                                                style={{
                                                    flex: 1,
                                                    padding: "9px 12px",
                                                    border: "1px solid #dcd6ce",
                                                    borderRadius: "4px",
                                                    fontSize: "13px",
                                                    backgroundColor: "#fff",
                                                    cursor: "pointer",
                                                    outline: "none"
                                                }}
                                            />
                                            {appliedVoucherCode ? (
                                                <button
                                                    type="button"
                                                    onClick={handleRemoveVoucher}
                                                    style={{
                                                        padding: "9px 14px",
                                                        backgroundColor: "#f5f5f5",
                                                        border: "1px solid #dcd6ce",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        color: "#666"
                                                    }}
                                                >
                                                    Hủy
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsVoucherModalOpen(true)}
                                                    style={{
                                                        padding: "9px 14px",
                                                        backgroundColor: "#faf8f5",
                                                        border: "1px solid #dcd6ce",
                                                        borderRadius: "4px",
                                                        fontSize: "12px",
                                                        cursor: "pointer",
                                                        color: "#7a6237",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    Chọn
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
                                            Tự chọn ưu đãi tiết kiệm nhất trong các voucher đủ điều kiện.
                                        </div>
                                    </div>

                                    {/* Breakdown giá tiền */}
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: "#444" }}>
                                            <span>Tiền hàng</span>
                                            <span>{total.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: "#444" }}>
                                            <span>Phí vận chuyển</span>
                                            <span style={{ fontWeight: 600 }}>
                                                {(shippingFee || 30000).toLocaleString('vi-VN')}đ
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", color: voucherDiscount > 0 ? "#15803d" : "#444" }}>
                                            <span>{voucherDiscount > 0 ? "Voucher giảm giá" : "Voucher (không dùng)"}</span>
                                            <span>{voucherDiscount > 0 ? `-${voucherDiscount.toLocaleString('vi-VN')}đ` : "-0đ"}</span>
                                        </div>

                                        <div style={{ borderTop: "1px solid #ebe5df", margin: "6px 0 2px 0" }}></div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "15px", fontWeight: "700", color: "#222" }}>Tổng thanh toán</span>
                                            <span style={{ fontSize: "18px", fontWeight: "700", color: "#222" }}>
                                                {finalTotal !== null ? `${finalTotal.toLocaleString('vi-VN')}đ` : "—"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Khối Lựa chọn Hình thức thanh toán */}
                                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px dashed #ebe5df" }}>
                                        <div style={{ fontSize: "14px", fontWeight: "700", color: "#333", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                                            <i className="fa-regular fa-credit-card" style={{ color: "#c89968" }}></i>
                                            Phương thức thanh toán
                                        </div>

                                        {/* 2 Lựa chọn Phương thức Thanh toán dạng Card */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                            {/* 1. Thanh toán COD */}
                                            <label
                                                onClick={() => setPaymentMethod("COD")}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "12px 14px",
                                                    borderRadius: "6px",
                                                    border: paymentMethod === "COD" ? "2px solid #c89968" : "1px solid #e5e0db",
                                                    backgroundColor: paymentMethod === "COD" ? "#fdfbf9" : "#fff",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === "COD"}
                                                    onChange={() => setPaymentMethod("COD")}
                                                    style={{ marginTop: "3px", accentColor: "#c89968", cursor: "pointer" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: "13px", fontWeight: "700", color: paymentMethod === "COD" ? "#7a5230" : "#333" }}>
                                                        💵 Thanh toán khi nhận hàng (COD)
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>
                                                        Nhận hàng và thanh toán tiền mặt trực tiếp cho nhân viên giao nhận.
                                                    </div>
                                                </div>
                                            </label>

                                            {/* 2. Chuyển khoản VietQR */}
                                            <label
                                                onClick={() => setPaymentMethod("VIETQR")}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "12px 14px",
                                                    borderRadius: "6px",
                                                    border: paymentMethod === "VIETQR" ? "2px solid #c89968" : "1px solid #e5e0db",
                                                    backgroundColor: paymentMethod === "VIETQR" ? "#fdfbf9" : "#fff",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === "VIETQR"}
                                                    onChange={() => setPaymentMethod("VIETQR")}
                                                    style={{ marginTop: "3px", accentColor: "#c89968", cursor: "pointer" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: "700", color: paymentMethod === "VIETQR" ? "#7a5230" : "#333" }}>
                                                            💳 Chuyển khoản Ngân hàng (VietQR 24/7)
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>
                                                        Quét mã VietQR từ bất kỳ App Ngân Hàng nào. Trạng thái thanh toán tự động ghi nhận ngay lập tức.
                                                    </div>
                                                </div>
                                            </label>

                                            {/* 3. Ví MoMo */}
                                            <label
                                                onClick={() => setPaymentMethod("MOMO")}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "flex-start",
                                                    gap: "12px",
                                                    padding: "12px 14px",
                                                    borderRadius: "6px",
                                                    border: paymentMethod === "MOMO" ? "2px solid #a50064" : "1px solid #e5e0db",
                                                    backgroundColor: paymentMethod === "MOMO" ? "#fdf2f8" : "#fff",
                                                    cursor: "pointer",
                                                    transition: "all 0.2s ease"
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    checked={paymentMethod === "MOMO"}
                                                    onChange={() => setPaymentMethod("MOMO")}
                                                    style={{ marginTop: "3px", accentColor: "#a50064", cursor: "pointer" }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: "700", color: paymentMethod === "MOMO" ? "#a50064" : "#333" }}>
                                                            👛 Ví điện tử MoMo
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#777", marginTop: "2px" }}>
                                                        Mở ứng dụng MoMo quét mã QR chuyển tiền P2P nhanh chóng, tự động ghi nhận thanh toán.
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Khối Chi tiết Chuyển khoản khi chọn VietQR */}
                                    {paymentMethod === 'VIETQR' && (
                                        <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#fcfaf7", borderRadius: "8px", border: "1px solid #eedec7" }}>
                                            {/* Tiêu đề & Chọn Ngân hàng */}
                                            <div style={{ marginBottom: "14px" }}>
                                                <label style={{ fontSize: "12px", fontWeight: "700", color: "#555", display: "block", marginBottom: "6px" }}>
                                                    🏦 Chọn Ngân hàng thụ hưởng:
                                                </label>
                                                <select
                                                    value={selectedBank.id}
                                                    onChange={(e) => {
                                                        const b = AVAILABLE_TRANSFER_BANKS.find(item => item.id === e.target.value);
                                                        if (b) setSelectedBank(b);
                                                    }}
                                                    style={{
                                                        width: "100%",
                                                        padding: "8px 10px",
                                                        border: "1px solid #d4c0aa",
                                                        borderRadius: "6px",
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        backgroundColor: "#fff",
                                                        color: "#333",
                                                        cursor: "pointer",
                                                        outline: "none"
                                                    }}
                                                >
                                                    {AVAILABLE_TRANSFER_BANKS.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name} {b.badge ? `(${b.badge})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Mã VietQR */}
                                            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                                                <div style={{ fontWeight: "700", fontSize: "12px", color: "#7a5230", marginBottom: "6px" }}>
                                                    Quét mã VietQR chuyển khoản nhanh:
                                                </div>
                                                <div style={{ display: "inline-block", padding: "8px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e0d0be", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                                                    <img
                                                        src={`https://img.vietqr.io/image/${selectedBank.bin}-${selectedBank.accountNumber}-compact.png?amount=${(finalTotal || total)}&addInfo=${mahd}&accountName=${encodeURIComponent(selectedBank.accountName)}`}
                                                        alt="Mã VietQR Chuyển khoản"
                                                        style={{ width: "170px", height: "170px", objectFit: "contain", display: "block" }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>
                                                    {selectedBank.guide}
                                                </div>
                                            </div>

                                            {/* Thông tin chuyển khoản chi tiết & Copy */}
                                            <div style={{ backgroundColor: "#fff", border: "1px solid #ecd8c2", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", lineHeight: "1.6" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f0e6dc", paddingBottom: "4px" }}>
                                                    <span style={{ color: "#666" }}>Ngân hàng:</span>
                                                    <span style={{ fontWeight: "700", color: "#333" }}>{selectedBank.shortName}</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #f0e6dc", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Số tài khoản:</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ fontWeight: "700", color: "#c89968", fontSize: "13px" }}>{selectedBank.accountNumber}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(selectedBank.accountNumber);
                                                                setIsCopiedStk(true);
                                                                setTimeout(() => setIsCopiedStk(false), 2000);
                                                            }}
                                                            style={{ padding: "1px 6px", fontSize: "10px", backgroundColor: "#f5ece2", border: "1px solid #d4c0aa", borderRadius: "3px", cursor: "pointer", color: "#7a5230" }}
                                                        >
                                                            {isCopiedStk ? "✓ Đã chép" : "Sao chép"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f0e6dc", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Chủ tài khoản:</span>
                                                    <span style={{ fontWeight: "700", color: "#333" }}>{selectedBank.accountName}</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #f0e6dc", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Số tiền:</span>
                                                    <span style={{ fontWeight: "700", color: "#16a34a" }}>
                                                        {(finalTotal || total).toLocaleString('vi-VN')} đ
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                                                    <span style={{ color: "#666" }}>Nội dung CK:</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ fontWeight: "700", color: "#b91c1c" }}>{mahd}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(mahd);
                                                                setIsCopiedNote(true);
                                                                setTimeout(() => setIsCopiedNote(false), 2000);
                                                            }}
                                                            style={{ padding: "1px 6px", fontSize: "10px", backgroundColor: "#f5ece2", border: "1px solid #d4c0aa", borderRadius: "3px", cursor: "pointer", color: "#7a5230" }}
                                                        >
                                                            {isCopiedNote ? "✓ Đã chép" : "Sao chép"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge Cập nhật tự động & Nút kiểm tra biến động số dư */}
                                            <div style={{ marginTop: "12px", padding: "12px 14px", backgroundColor: "#ecfdf5", border: "1px solid #86efac", borderRadius: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ width: "10px", height: "10px", backgroundColor: "#16a34a", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 3px rgba(22, 163, 74, 0.25)" }}></span>
                                                        <span style={{ fontSize: "12px", color: "#166534", fontWeight: "700" }}>
                                                            Hệ thống đang lắng nghe giao dịch...
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={triggerManualConfirm}
                                                        disabled={isCheckingPayment || isProcessing}
                                                        style={{
                                                            padding: "5px 12px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            backgroundColor: "#16a34a",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px",
                                                            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
                                                        }}
                                                    >
                                                        {isCheckingPayment ? (
                                                            <>
                                                                <i className="fa-solid fa-spinner fa-spin"></i>
                                                                <span>Đang đối soát...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="fa-solid fa-rotate"></i>
                                                                <span>Kiểm tra giao dịch ngay</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#15803d", marginTop: "6px", lineHeight: "1.4" }}>
                                                    ⚡ Quý khách chuyển khoản xong hệ thống sẽ ghi nhận <b>Đã thanh toán</b> và chuyển hướng đơn hàng.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Khối Chi tiết khi chọn MoMo */}
                                    {paymentMethod === 'MOMO' && (
                                        <div style={{ marginTop: "16px", padding: "16px", backgroundColor: "#fdf2f8", borderRadius: "8px", border: "1px solid #fbcfe8" }}>
                                            <div style={{ textAlign: "center", marginBottom: "12px" }}>
                                                <div style={{ fontWeight: "700", fontSize: "12px", color: "#a50064", marginBottom: "6px" }}>
                                                    Quét mã MoMo P2P chuyển tiền nhanh:
                                                </div>
                                                <div style={{ display: "inline-block", padding: "8px", backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #f472b6", boxShadow: "0 2px 6px rgba(0,0,0,0.06)" }}>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0338052164|NGUYEN HUU THIEN||0|0|${finalTotal || total}|${mahd}|transfer_p2p`)}`}
                                                        alt="Mã MoMo Chuyển tiền"
                                                        style={{ width: "170px", height: "170px", objectFit: "contain", display: "block" }}
                                                    />
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#666", marginTop: "6px" }}>
                                                    Mở ứng dụng Ví MoMo và quét mã QR trên để thanh toán
                                                </div>
                                            </div>

                                            {/* Chi tiết MoMo */}
                                            <div style={{ backgroundColor: "#fff", border: "1px solid #fbcfe8", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", lineHeight: "1.6" }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #fce7f3", paddingBottom: "4px" }}>
                                                    <span style={{ color: "#666" }}>Ví điện tử:</span>
                                                    <span style={{ fontWeight: "700", color: "#a50064" }}>MoMo P2P</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed #fce7f3", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Số điện thoại ví:</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ fontWeight: "700", color: "#a50064", fontSize: "13px" }}>0338052164</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText("0338052164");
                                                                setIsCopiedStk(true);
                                                                setTimeout(() => setIsCopiedStk(false), 2000);
                                                            }}
                                                            style={{ padding: "1px 6px", fontSize: "10px", backgroundColor: "#fdf2f8", border: "1px solid #f472b6", borderRadius: "3px", cursor: "pointer", color: "#a50064" }}
                                                        >
                                                            {isCopiedStk ? "✓ Đã chép" : "Sao chép"}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #fce7f3", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Tên người nhận:</span>
                                                    <span style={{ fontWeight: "700", color: "#333" }}>NGUYEN HUU THIEN</span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #fce7f3", padding: "4px 0" }}>
                                                    <span style={{ color: "#666" }}>Số tiền:</span>
                                                    <span style={{ fontWeight: "700", color: "#16a34a" }}>
                                                        {(finalTotal || total).toLocaleString('vi-VN')} đ
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                                                    <span style={{ color: "#666" }}>Nội dung CK:</span>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <span style={{ fontWeight: "700", color: "#b91c1c" }}>{mahd}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(mahd);
                                                                setIsCopiedNote(true);
                                                                setTimeout(() => setIsCopiedNote(false), 2000);
                                                            }}
                                                            style={{ padding: "1px 6px", fontSize: "10px", backgroundColor: "#fdf2f8", border: "1px solid #f472b6", borderRadius: "3px", cursor: "pointer", color: "#a50064" }}
                                                        >
                                                            {isCopiedNote ? "✓ Đã chép" : "Sao chép"}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Badge Cập nhật tự động MoMo */}
                                            <div style={{ marginTop: "12px", padding: "12px 14px", backgroundColor: "#ecfdf5", border: "1px solid #86efac", borderRadius: "8px" }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <span style={{ width: "10px", height: "10px", backgroundColor: "#a50064", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 0 3px rgba(165, 0, 100, 0.25)" }}></span>
                                                        <span style={{ fontSize: "12px", color: "#065f46", fontWeight: "700" }}>
                                                            Đang lắng nghe chuyển khoản MoMo...
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={triggerManualConfirm}
                                                        disabled={isCheckingPayment || isProcessing}
                                                        style={{
                                                            padding: "5px 12px",
                                                            fontSize: "11px",
                                                            fontWeight: "700",
                                                            backgroundColor: "#a50064",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "4px",
                                                            cursor: "pointer",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: "5px"
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-rotate"></i>
                                                        <span>Kiểm tra giao dịch ngay</span>
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: "11px", color: "#047857", marginTop: "6px" }}>
                                                    ⚡ Hệ thống tự động ghi nhận <b>Đã thanh toán</b> ngay khi quý khách chuyển tiền thành công.
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Nút đặt hàng linh hoạt theo hình thức thanh toán */}
                                    <button
                                        id="btn-dat-hang"
                                        type="button"
                                        onClick={handleCheckout}
                                        disabled={isProcessing}
                                        style={{
                                            width: "100%",
                                            marginTop: "20px",
                                            padding: "14px",
                                            backgroundColor: isProcessing 
                                                ? "#baa085" 
                                                : (paymentMethod === "VIETQR" ? "#16a34a" : paymentMethod === "MOMO" ? "#a50064" : "#c89968"),
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "6px",
                                            fontSize: "14px",
                                            fontWeight: "700",
                                            cursor: isProcessing ? "not-allowed" : "pointer",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            gap: "8px",
                                            transition: "background-color 0.2s",
                                            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                                        }}
                                        onMouseOver={e => !isProcessing && (e.currentTarget.style.backgroundColor = paymentMethod === "VIETQR" ? "#15803d" : paymentMethod === "MOMO" ? "#880052" : "#b88755")}
                                        onMouseOut={e => !isProcessing && (e.currentTarget.style.backgroundColor = paymentMethod === "VIETQR" ? "#16a34a" : paymentMethod === "MOMO" ? "#a50064" : "#c89968")}
                                    >
                                        {isProcessing ? (
                                            <>
                                                <i className="fa-solid fa-spinner fa-spin"></i>
                                                <span>Đang xử lý đơn hàng...</span>
                                            </>
                                        ) : paymentMethod === "VIETQR" ? (
                                            <>
                                                <i className="fa-solid fa-bolt"></i>
                                                <span>⚡ Tôi đã chuyển khoản - Xác nhận đơn ngay</span>
                                            </>
                                        ) : paymentMethod === "MOMO" ? (
                                            <>
                                                <i className="fa-solid fa-bolt"></i>
                                                <span>⚡ Tôi đã chuyển MoMo - Xác nhận đơn ngay</span>
                                            </>
                                        ) : (
                                            <>
                                                <i className="fa-solid fa-truck-fast"></i>
                                                <span>Đặt hàng (Thanh toán khi nhận hàng - COD)</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Mini Window: Modal Xác Nhận Đặt Hàng */}
            {isConfirmOrderModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "rgba(0, 0, 0, 0.6)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 10000,
                        padding: "16px"
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !isProcessing) {
                            setIsConfirmOrderModalOpen(false);
                        }
                    }}
                >
                    <div
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "14px",
                            width: "100%",
                            maxWidth: "480px",
                            overflow: "hidden",
                            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.22)",
                            border: "1px solid #ebd9b8"
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Mini Window */}
                        <div style={{
                            background: "linear-gradient(135deg, #c89968 0%, #b38253 100%)",
                            padding: "16px 20px",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{
                                    width: "36px",
                                    height: "36px",
                                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "18px"
                                }}>
                                    <i className="fa-solid fa-clipboard-check"></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#fff" }}>
                                        Xác nhận đặt mua hàng
                                    </h3>
                                    <p style={{ margin: "2px 0 0 0", fontSize: "12px", opacity: 0.9 }}>
                                        Givral Bakery - Kiểm tra thông tin đơn hàng
                                    </p>
                                </div>
                            </div>
                            {!isProcessing && (
                                <button
                                    type="button"
                                    onClick={() => setIsConfirmOrderModalOpen(false)}
                                    style={{
                                        background: "rgba(255, 255, 255, 0.2)",
                                        border: "none",
                                        color: "#fff",
                                        width: "28px",
                                        height: "28px",
                                        borderRadius: "50%",
                                        cursor: "pointer",
                                        fontSize: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "background 0.2s"
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.35)"}
                                    onMouseOut={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Body Mini Window */}
                        <div style={{ padding: "18px 20px", maxHeight: "70vh", overflowY: "auto" }}>
                            {/* Khối Thông tin giao hàng */}
                            <div style={{
                                backgroundColor: "#fdfaf7",
                                border: "1px solid #ebd9b8",
                                borderRadius: "8px",
                                padding: "12px 14px",
                                marginBottom: "14px",
                                fontSize: "13px"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "#777", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <i className="fa-solid fa-money-bill-wave" style={{ color: "#c89968" }}></i>
                                        Phương thức:
                                    </span>
                                    <span style={{ fontWeight: "700", color: "#222" }}>
                                        {paymentMethod === 'COD' ? 'Tiền mặt khi nhận hàng (COD)' : paymentMethod === 'VIETQR' ? 'Chuyển khoản VietQR' : 'Ví MoMo'}
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                    <span style={{ color: "#777", display: "flex", alignItems: "center", gap: "6px" }}>
                                        <i className="fa-solid fa-truck-fast" style={{ color: "#c89968" }}></i>
                                        Phí vận chuyển:
                                    </span>
                                    <span style={{ fontWeight: "700", color: "#222" }}>
                                        {(shippingFee || 30000).toLocaleString('vi-VN')} đ
                                    </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <span style={{ color: "#777", display: "flex", alignItems: "center", gap: "6px", minWidth: "120px" }}>
                                        <i className="fa-solid fa-location-dot" style={{ color: "#c89968" }}></i>
                                        Địa chỉ nhận:
                                    </span>
                                    <span style={{ fontWeight: "600", color: "#333", textAlign: "right", wordBreak: "break-word" }}>
                                        {[addressDetail, wards.find(w => String(w.WardCode) === String(selectedWard))?.WardName, provinces.find(p => String(p.ProvinceID) === String(selectedProvince))?.ProvinceName].filter(Boolean).join(", ")}
                                    </span>
                                </div>
                            </div>

                            {/* Danh sách tóm tắt các món */}
                            <div style={{ marginBottom: "14px" }}>
                                <div style={{ fontSize: "12px", fontWeight: "700", color: "#666", marginBottom: "8px", display: "flex", justifyContent: "space-between" }}>
                                    <span>Sản phẩm trong giỏ ({cartItems.length})</span>
                                    <span style={{ color: "#999", fontWeight: "normal" }}>
                                        Tổng {cartItems.reduce((acc, it) => acc + (getItemQty(it) || 1), 0)} chiếc
                                    </span>
                                </div>
                                <div style={{
                                    maxHeight: "120px",
                                    overflowY: "auto",
                                    border: "1px solid #f0e6dc",
                                    borderRadius: "6px",
                                    padding: "6px 10px",
                                    backgroundColor: "#fff"
                                }}>
                                    {cartItems.map((item, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                padding: "5px 0",
                                                borderBottom: idx !== cartItems.length - 1 ? "1px dashed #f0f0f0" : "none",
                                                fontSize: "12px"
                                            }}
                                        >
                                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "68%" }}>
                                                <span style={{ fontWeight: "600", color: "#333" }}>{getItemName(item)}</span>
                                                <span style={{ color: "#888", marginLeft: "4px" }}>x{getItemQty(item)}</span>
                                            </div>
                                            <span style={{ fontWeight: "600", color: "#7a5230" }}>
                                                {(getItemPrice(item) * getItemQty(item)).toLocaleString('vi-VN')} đ
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tóm tắt tiền thanh toán */}
                            <div style={{
                                backgroundColor: "#faf8f5",
                                borderRadius: "8px",
                                padding: "10px 14px",
                                fontSize: "13px",
                                border: "1px solid #f0e6dc"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#666" }}>
                                    <span>Tiền hàng:</span>
                                    <span>{total.toLocaleString('vi-VN')} đ</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#666" }}>
                                    <span>Phí giao hàng:</span>
                                    <span>+ {(shippingFee || 30000).toLocaleString('vi-VN')} đ</span>
                                </div>
                                {voucherDiscount > 0 && (
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", color: "#16a34a", fontWeight: "600" }}>
                                        <span>Giảm giá Voucher ({appliedVoucherCode}):</span>
                                        <span>- {voucherDiscount.toLocaleString('vi-VN')} đ</span>
                                    </div>
                                )}
                                <div style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    borderTop: "1px solid #e5e7eb",
                                    paddingTop: "8px",
                                    marginTop: "6px"
                                }}>
                                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#222" }}>Tổng thanh toán:</span>
                                    <span style={{ fontSize: "17px", fontWeight: "800", color: "#b91c1c" }}>
                                        {finalTotal.toLocaleString('vi-VN')} đ
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Mini Window */}
                        <div style={{
                            padding: "12px 20px",
                            backgroundColor: "#f9fafb",
                            borderTop: "1px solid #f0f0f0",
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: "10px"
                        }}>
                            <button
                                type="button"
                                onClick={() => setIsConfirmOrderModalOpen(false)}
                                disabled={isProcessing}
                                style={{
                                    padding: "9px 18px",
                                    borderRadius: "6px",
                                    border: "1px solid #d1d5db",
                                    backgroundColor: "#fff",
                                    color: "#4b5563",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: isProcessing ? "not-allowed" : "pointer"
                                }}
                            >
                                Huỷ / Xem lại
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmOrder}
                                disabled={isProcessing}
                                style={{
                                    padding: "9px 20px",
                                    borderRadius: "6px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #c89968 0%, #b38253 100%)",
                                    color: "#fff",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    cursor: isProcessing ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    boxShadow: "0 2px 6px rgba(200, 153, 104, 0.35)"
                                }}
                            >
                                {isProcessing ? (
                                    <>
                                        <i className="fa-solid fa-spinner fa-spin"></i>
                                        <span>Đang xử lý...</span>
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        <span>Xác nhận đặt hàng</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chọn Voucher */}
            {isVoucherModalOpen && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "15px"
                }}>
                    <div style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        width: "100%",
                        maxWidth: "460px",
                        padding: "24px",
                        maxHeight: "90vh",
                        overflowY: "auto",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
                            <h3 style={{ margin: 0, fontSize: "17px", color: "#222" }}>Chọn Voucher Ưu Đãi</h3>
                            <button
                                onClick={() => setIsVoucherModalOpen(false)}
                                style={{ background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "#888" }}
                            >
                                &times;
                            </button>
                        </div>

                        {/* Nhập mã thủ công */}
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                            <input
                                type="text"
                                placeholder="Nhập mã voucher..."
                                value={voucherInput}
                                onChange={e => setVoucherInput(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: "9px 12px",
                                    border: "1px solid #dcd6ce",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    textTransform: "uppercase"
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => handleApplyVoucher()}
                                style={{
                                    padding: "9px 16px",
                                    backgroundColor: "#c89968",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: "4px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    cursor: "pointer"
                                }}
                            >
                                Áp dụng
                            </button>
                        </div>

                        {voucherError && (
                            <div style={{ fontSize: "12px", color: "#dc2626", marginBottom: "12px" }}>
                                {voucherError}
                            </div>
                        )}

                        {/* Danh sách voucher có sẵn */}
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#555", marginBottom: "8px" }}>
                            Voucher phù hợp với đơn của bạn:
                        </div>
                        {availableVouchers.length === 0 ? (
                            <div style={{ fontSize: "13px", color: "#888", textAlign: "center", padding: "20px 0" }}>
                                Hiện chưa có voucher nào phù hợp.
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                {availableVouchers.map(v => (
                                    <div
                                        key={v.id || v.MA_VOUCHER}
                                        style={{
                                            padding: "12px",
                                            borderRadius: "6px",
                                            border: "1px solid #ebd9b8",
                                            backgroundColor: "#fdfbf7",
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center"
                                        }}
                                    >
                                        <div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span style={{ fontWeight: "700", fontSize: "14px", color: "#7a6237" }}>
                                                    {v.MA_VOUCHER}
                                                </span>
                                                {v.DA_LUU && (
                                                    <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "999px" }}>
                                                        Trong ví của bạn
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                                                {v.TEN_VOUCHER}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleApplyVoucher(v.MA_VOUCHER)}
                                            style={{
                                                padding: "6px 14px",
                                                backgroundColor: "#c89968",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "4px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Áp dụng
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Thông Báo Nhận Diện Chuyển Khoản Thành Công (Hiển thị 20s & có nút tắt) */}
            {isPaymentDetected && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.75)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 10000,
                    padding: "20px"
                }}>
                    <div style={{
                        backgroundColor: "#fff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "460px",
                        padding: "32px 24px",
                        textAlign: "center",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        position: "relative"
                    }}>
                        {/* Nút X tắt thông báo góc trên bên phải */}
                        <button
                            type="button"
                            onClick={() => {
                                setIsPaymentDetected(false);
                                window.location.href = "/my-orders";
                            }}
                            style={{
                                position: "absolute",
                                top: "14px",
                                right: "14px",
                                background: "#f1f5f9",
                                border: "none",
                                borderRadius: "50%",
                                width: "32px",
                                height: "32px",
                                fontSize: "16px",
                                color: "#64748b",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "all 0.2s"
                            }}
                            title="Tắt thông báo và xem đơn hàng"
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
                            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                        >
                            ✕
                        </button>

                        <div style={{
                            width: "72px",
                            height: "72px",
                            borderRadius: "50%",
                            backgroundColor: "#dcfce7",
                            color: "#16a34a",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "36px",
                            margin: "0 auto 16px"
                        }}>
                            <i className="fa-solid fa-circle-check"></i>
                        </div>

                        <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#166534", margin: "0 0 8px" }}>
                            Xác Nhận Chuyển Khoản Thành Công!
                        </h3>

                        <p style={{ fontSize: "14px", color: "#4b5563", margin: "0 0 16px", lineHeight: "1.5" }}>
                            Hệ thống đã nhận diện giao dịch <strong>{(finalTotal || total)?.toLocaleString('vi-VN')} đ</strong> từ ngân hàng cho đơn hàng <strong>#{mahd}</strong>.
                        </p>

                        <div style={{
                            backgroundColor: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            padding: "12px 16px",
                            marginBottom: "16px",
                            textAlign: "left",
                            fontSize: "13px"
                        }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                <span style={{ color: "#64748b" }}>Trạng thái thanh toán:</span>
                                <span style={{ fontWeight: "700", color: "#16a34a" }}>✓ Đã thanh toán tự động</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "#64748b" }}>Phương thức:</span>
                                <span style={{ fontWeight: "600", color: "#334155" }}>
                                    {paymentMethod === 'VIETQR' ? 'VietQR 24/7' : 'Ví MoMo'}
                                </span>
                            </div>
                        </div>

                        {/* Thanh đếm ngược 20s */}
                        <div style={{
                            padding: "8px 12px",
                            backgroundColor: "#fef3c7",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            fontSize: "13px",
                            color: "#92400e",
                            fontWeight: "600",
                            marginBottom: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}>
                            <span>⏳ Tự động chuyển hướng sau:</span>
                            <span style={{
                                backgroundColor: "#b45309",
                                color: "#fff",
                                padding: "2px 8px",
                                borderRadius: "10px",
                                fontWeight: "800"
                            }}>
                                {countdownSeconds}s
                            </span>
                        </div>

                        {/* Các nút bấm: Tắt thông báo & Xem đơn hàng */}
                        <div style={{ display: "flex", gap: "10px" }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPaymentDetected(false);
                                    window.location.href = "/my-orders";
                                }}
                                style={{
                                    flex: 1,
                                    padding: "11px 16px",
                                    backgroundColor: "#f1f5f9",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#475569",
                                    cursor: "pointer",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#e2e8f0")}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f1f5f9")}
                            >
                                ✕ Tắt thông báo
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    window.location.href = "/my-orders";
                                }}
                                style={{
                                    flex: 1.4,
                                    padding: "11px 16px",
                                    backgroundColor: "#16a34a",
                                    border: "none",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "700",
                                    color: "#fff",
                                    cursor: "pointer",
                                    boxShadow: "0 3px 8px rgba(22, 163, 74, 0.3)",
                                    transition: "all 0.2s"
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#15803d")}
                                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#16a34a")}
                            >
                                Xem đơn hàng ngay →
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default CartPage;
