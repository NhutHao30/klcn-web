import React, { useEffect, useState } from "react";
import Footer from "../Layout/Footer";
import { getCart, removeFromCart, updateCartQuantity, checkout } from "../services/cartService";

const getImageSrc = (imageUrl) => {
    if (!imageUrl) return "../../assets/IMG/productnew2.webp";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `../../assets/IMG/${imageUrl.split('/').pop()}`;
};

const getProductName = (product) => {
    if (!product) return "Sản phẩm";
    return product.tenSP || product.TenSP || product.name || "Sản phẩm";
};

const getProductPrice = (product) => {
    if (!product) return 0;
    return Number(product.price || product.GIABAN || 0);
};

const getMasp = (item) => {
    return item.masp || item.MASP || item.MaSP || "";
};

const CartPage = () => {
    const [cartItems, setCartItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [isProcessing, setIsProcessing] = useState(false);
    const [mahd] = useState("HD" + Math.floor(Date.now() / 1000).toString().slice(-8));

    // Thêm State cho GHN
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [addressDetail, setAddressDetail] = useState("");
    const [shippingFee, setShippingFee] = useState(0);

    // Voucher States
    const [voucherInput, setVoucherInput] = useState("");
    const [appliedVoucherCode, setAppliedVoucherCode] = useState("");
    const [voucherDiscount, setVoucherDiscount] = useState(0);
    const [voucherMessage, setVoucherMessage] = useState("");
    const [voucherError, setVoucherError] = useState("");
    
    const [isLoadingCart, setIsLoadingCart] = useState(true);

    const loadCart = async () => {
        setIsLoadingCart(true);
        try {
            const data = await getCart();
            const items = Array.isArray(data) ? data : (data?.items || []);
            setCartItems(items);
            const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            setTotal(sum);
        } catch (e) {
            if (e.response?.status === 401) {
                alert("Vui lòng đăng nhập để xem giỏ hàng");
                window.location.href = "/dang-nhap";
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
        
        // Load danh sách Tỉnh/Thành
        import('../services/axiosClient.js').then(m => {
            m.default.get('/ghn/provinces').then(res => {
                if (res.data && res.data.data) {
                    setProvinces(res.data.data);
                }
            });
        });

        const handleUpdate = () => loadCart();
        document.addEventListener('cartUpdated', handleUpdate);
        return () => document.removeEventListener('cartUpdated', handleUpdate);
    }, []);

    // Load Quận/Huyện khi Tỉnh thay đổi
    useEffect(() => {
        if (selectedProvince) {
            import('../services/axiosClient.js').then(m => {
                m.default.get('/ghn/districts?province_id=' + selectedProvince).then(res => {
                    if (res.data && res.data.data) {
                        setDistricts(res.data.data);
                        setWards([]);
                        setSelectedDistrict("");
                        setSelectedWard("");
                        setShippingFee(0);
                    }
                });
            });
        }
    }, [selectedProvince]);

    // Load Phường/Xã khi Huyện thay đổi
    useEffect(() => {
        if (selectedDistrict) {
            import('../services/axiosClient.js').then(m => {
                m.default.get('/ghn/wards?district_id=' + selectedDistrict).then(res => {
                    if (res.data && res.data.data) {
                        setWards(res.data.data);
                        setSelectedWard("");
                        setShippingFee(0);
                    }
                });
            });
        }
    }, [selectedDistrict]);

    // Tính phí vận chuyển khi có Phường/Xã
    useEffect(() => {
        if (selectedWard && selectedDistrict) {
            import('../services/axiosClient.js').then(m => {
                m.default.post('/ghn/fee', {
                    to_ward_code: String(selectedWard),
                    to_district_id: parseInt(selectedDistrict),
                    weight: 1000 // Tính nháp 1kg
                }).then(res => {
                    if (res.data && res.data.code === 200 && res.data.data && res.data.data.total) {
                        setShippingFee(res.data.data.total);
                    } else {
                        console.warn("GHN fee error:", res.data);
                        setShippingFee(30000); // Mặc định 30k
                    }
                }).catch(e => {
                    console.error("Lỗi tính phí ship:", e);
                    setShippingFee(30000); // Mặc định 30k
                });
            });
        }
    }, [selectedWard]);

    const handleRemove = async (masp) => {
        if (!masp) { console.error("masp undefined!"); return; }
        try {
            await removeFromCart(masp);
            await loadCart();
            document.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            console.error("Lỗi xóa:", e);
            alert("Không thể xóa sản phẩm: " + e.message);
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

    const handleApplyVoucher = async () => {
        setVoucherMessage("");
        setVoucherError("");
        if (!voucherInput.trim()) return;

        try {
            const m = await import('../services/axiosClient.js');
            const res = await m.default.post('/vouchers/apply', {
                voucher_code: voucherInput.toUpperCase(),
                subtotal: total
            });
            
            if (res.data) {
                setVoucherMessage(res.data.message || `Đã áp dụng: ${res.data.voucher_name}`);
                setAppliedVoucherCode(res.data.voucher_code);
                setVoucherDiscount(res.data.discount_amount);
            }
        } catch (e) {
            setVoucherError(e.response?.data?.error || "Lỗi áp dụng voucher");
            setAppliedVoucherCode("");
            setVoucherDiscount(0);
        }
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            alert("Giỏ hàng của bạn đang trống!");
            return;
        }

        if (!selectedProvince || !selectedDistrict || !selectedWard || !addressDetail) {
            alert("Vui lòng chọn đầy đủ địa chỉ giao hàng!");
            return;
        }

        const provName = provinces.find(p => p.ProvinceID == selectedProvince)?.ProvinceName || '';
        const distName = districts.find(d => d.DistrictID == selectedDistrict)?.DistrictName || '';
        const wardName = wards.find(w => w.WardCode == selectedWard)?.WardName || '';
        const fullAddress = `${addressDetail}, ${wardName}, ${distName}, ${provName}`;

        if (window.confirm("Xác nhận thanh toán đơn hàng này? Phí vận chuyển: " + shippingFee.toLocaleString('vi-VN') + "đ")) {
            setIsProcessing(true);
            try {
                if (paymentMethod !== 'COD') {
                    alert("Hệ thống đang xử lý và kiểm tra giao dịch chuyển khoản của bạn. Vui lòng nhấn OK và đợi trong giây lát...");
                }

                await checkout({ 
                    mahd: mahd,
                    paymentMethod: paymentMethod,
                    address: fullAddress,
                    note: "Khách tự đặt Online. ",
                    shippingFee: shippingFee,
                    to_ward_code: selectedWard,
                    to_district_id: selectedDistrict,
                    voucher_code: appliedVoucherCode
                });
                
                if (paymentMethod === 'COD') {
                    alert("🎉 Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận và đang chờ cửa hàng xác nhận.");
                } else {
                    alert("✅ Thanh toán thành công! Chúng tôi đã nhận được tiền chuyển khoản. Đơn hàng của bạn đang chờ cửa hàng xác nhận và đóng gói.");
                }

                setCartItems([]);
                setTotal(0);
                document.dispatchEvent(new Event('cartUpdated'));
                window.location.href = "/my-orders"; 
            } catch (error) {
                console.error("Lỗi thanh toán:", error);
                const errorMsg = error.response?.data?.error || "Có lỗi xảy ra khi thanh toán. Vui lòng thử lại!";
                alert(errorMsg);
            } finally {
                setIsProcessing(false);
            }
        }
    };

    return (
        <>
            <main>
                <div className="grid wide">
                    <div className="row">
                        <div className="cart-container mt-30" style={{ margin: "auto", marginBottom: "50px", marginTop: "30px" }}>
                            <div className="cart-container-detail col-lg-10 col-md-12 col-10" style={{ margin: "auto" }}>
                                {/* Header bảng */}
                                <div className="hide-on-mobile" style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid var(--primary-color)", padding: "12px", marginBottom: "5px", fontWeight: "bold", color: "#555" }}>
                                    <div style={{ flex: 2, fontSize: "14px" }}>Thông tin sản phẩm</div>
                                    <div style={{ flex: 1, textAlign: "center" }}>Đơn giá</div>
                                    <div style={{ flex: 1, textAlign: "center" }}>Số lượng</div>
                                    <div style={{ flex: 1, textAlign: "right" }}>Thành tiền</div>
                                    <div style={{ width: "60px" }}></div>
                                </div>

                                {/* Danh sách sản phẩm */}
                                <div className="cart-container-detail__product-list">
                                    {cartItems.map((item, index) => {
                                        const masp = item.id;
                                        const price = item.price;
                                        const qty = item.quantity;
                                        return (
                                            <div
                                                key={index}
                                                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", padding: "15px 0", gap: "10px" }}
                                            >
                                                {/* Ảnh + tên */}
                                                <div style={{ display: "flex", alignItems: "center", flex: 2, gap: "15px", marginLeft: "10px" }}>
                                                    <img
                                                        src={getImageSrc(item.image)}
                                                        alt={item.name}
                                                        style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: "15px", fontWeight: "600", color: "#333" }}>
                                                            {item.name}
                                                        </div>
                                                        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
                                                            Mã SP: {masp}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Đơn giá */}
                                                <div style={{ flex: 1, fontSize: "14px", textAlign: "center", color: "#555" }}>
                                                    {price.toLocaleString('vi-VN')}₫
                                                </div>

                                                {/* Số lượng: nút - / số / nút + */}
                                                <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "0" }}>
                                                    <button
                                                        onClick={() => handleUpdateQty(masp, qty - 1)}
                                                        style={{ width: "30px", height: "30px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer", fontSize: "16px", borderRadius: "4px 0 0 4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                    >
                                                        <i className="fa-solid fa-minus" style={{ fontSize: "10px" }}></i>
                                                    </button>
                                                    <div style={{ width: "40px", height: "30px", border: "1px solid #ccc", borderLeft: "none", borderRight: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "600" }}>
                                                        {qty}
                                                    </div>
                                                    <button
                                                        onClick={() => handleUpdateQty(masp, qty + 1)}
                                                        style={{ width: "30px", height: "30px", border: "1px solid #ccc", background: "#f5f5f5", cursor: "pointer", fontSize: "16px", borderRadius: "0 4px 4px 0", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                    >
                                                        <i className="fa-solid fa-plus" style={{ fontSize: "10px" }}></i>
                                                    </button>
                                                </div>

                                                {/* Thành tiền */}
                                                <div style={{ flex: 1, textAlign: "right", color: "var(--primary-color)", fontWeight: "bold" }}>
                                                    {(price * qty).toLocaleString('vi-VN')}₫
                                                </div>

                                                {/* Nút xóa */}
                                                <div style={{ width: "60px", textAlign: "center" }}>
                                                    <button
                                                        onClick={() => handleRemove(masp)}
                                                        title="Xóa sản phẩm"
                                                        style={{ background: "none", border: "none", cursor: "pointer", color: "#ff4d4d", fontSize: "18px", padding: "5px" }}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {isLoadingCart ? (
                                        <div style={{ textAlign: "center", padding: "50px", fontSize: "16px", color: "#888" }}>
                                            <i className="fa fa-spinner fa-spin" style={{ fontSize: "40px", color: "var(--primary-color)", marginBottom: "15px", display: "block" }}></i>
                                            Đang tải dữ liệu...
                                        </div>
                                    ) : cartItems.length === 0 ? (
                                        <div style={{ textAlign: "center", padding: "50px", fontSize: "16px", color: "#888" }}>
                                            <i className="fa-solid fa-cart-shopping" style={{ fontSize: "48px", marginBottom: "15px", display: "block", color: "#ccc" }}></i>
                                            Chưa có sản phẩm nào trong giỏ hàng.
                                        </div>
                                    ) : null}
                                </div>

                                {/* Tổng tiền + thanh toán */}
                                {cartItems.length > 0 && (
                                    <>
                                        <div style={{ borderTop: "2px solid var(--primary-color)", marginTop: "20px", paddingTop: "20px", textAlign: "left" }}>
                                            <h4 style={{marginBottom: "15px", color: "var(--primary-color)"}}>Thông tin giao hàng (Giao Hàng Nhanh)</h4>
                                            <div style={{display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap"}}>
                                                <select style={{flex: 1, minWidth: "200px", padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}} value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)}>
                                                    <option value="">Chọn Tỉnh/Thành</option>
                                                    {provinces.map(p => <option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</option>)}
                                                </select>
                                                <select style={{flex: 1, minWidth: "200px", padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}} value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedProvince}>
                                                    <option value="">Chọn Quận/Huyện</option>
                                                    {districts.map(d => <option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</option>)}
                                                </select>
                                                <select style={{flex: 1, minWidth: "200px", padding: "10px", borderRadius: "5px", border: "1px solid #ccc"}} value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedDistrict}>
                                                    <option value="">Chọn Phường/Xã</option>
                                                    {wards.map(w => <option key={w.WardCode} value={w.WardCode}>{w.WardName}</option>)}
                                                </select>
                                            </div>
                                            <input type="text" placeholder="Số nhà, tên đường cụ thể..." style={{width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", marginBottom: "15px"}} value={addressDetail} onChange={e => setAddressDetail(e.target.value)} />
                                        </div>

                                        <div style={{ borderTop: "2px dashed #ccc", marginTop: "20px", paddingTop: "20px", textAlign: "right" }}>
                                            {/* Voucher Input */}
                                            <div className="voucher-section mb-3" style={{ textAlign: "left", marginBottom: "15px" }}>
                                                <label style={{fontWeight: 'bold', marginBottom: '5px', display: 'block'}}>Mã giảm giá</label>
                                                <div style={{display: 'flex', gap: '10px'}}>
                                                    <input 
                                                        type="text" 
                                                        className="form-control" 
                                                        placeholder="Nhập mã voucher..." 
                                                        value={voucherInput}
                                                        onChange={(e) => setVoucherInput(e.target.value)}
                                                        style={{textTransform: 'uppercase', padding: "10px", borderRadius: "5px", border: "1px solid #ccc", flex: 1}}
                                                    />
                                                    <button 
                                                        className="btn" 
                                                        style={{backgroundColor: '#17a2b8', color: '#fff', padding: "10px 20px", border: "none", borderRadius: "5px", cursor: "pointer"}}
                                                        onClick={handleApplyVoucher}
                                                    >
                                                        Áp dụng
                                                    </button>
                                                </div>
                                                {voucherMessage && <div style={{color: 'green', fontSize: '14px', marginTop: '5px'}}><i className="fa-solid fa-circle-check"></i> {voucherMessage}</div>}
                                                {voucherError && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}><i className="fa-solid fa-circle-exclamation"></i> {voucherError}</div>}
                                            </div>

                                            <p style={{ fontSize: "16px", marginBottom: "5px", marginRight: "10px", color: "#666" }}>
                                                Tạm tính: {total.toLocaleString('vi-VN')}₫
                                            </p>
                                            <p style={{ fontSize: "16px", marginBottom: "15px", marginRight: "10px", color: "#666" }}>
                                                Phí vận chuyển: {shippingFee > 0 ? shippingFee.toLocaleString('vi-VN') + "₫" : "Đang tính..."}
                                            </p>
                                            {appliedVoucherCode && (
                                                <p style={{ fontSize: "16px", marginBottom: "15px", marginRight: "10px", color: '#e74c3c', fontWeight: 'bold' }}>
                                                    Voucher giảm giá: - {voucherDiscount.toLocaleString('vi-VN')}₫
                                                </p>
                                            )}
                                            <p style={{ fontSize: "18px", marginBottom: "15px", marginRight: "10px", }}>
                                                <b>Tổng thanh toán:</b>
                                                <span style={{ marginLeft: "12px", color: "var(--primary-color)", fontSize: "24px", fontWeight: "bold" }}>
                                                    {((total + shippingFee) - voucherDiscount).toLocaleString('vi-VN')}₫
                                                </span>
                                            </p>

                                        <div style={{ marginBottom: "20px", marginRight: "10px" }}>
                                            <b style={{ fontSize: "16px", display: "block", marginBottom: "10px" }}>Hình thức thanh toán:</b>
                                            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "15px", fontSize: "15px" }}>
                                                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="COD"
                                                        checked={paymentMethod === "COD"}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                    />
                                                    Thanh toán khi nhận hàng (COD)
                                                </label>
                                                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="VIETQR"
                                                        checked={paymentMethod === "VIETQR"}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                    />
                                                    Chuyển khoản (VietQR - Mọi ngân hàng)
                                                </label>
                                                <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="MOMO"
                                                        checked={paymentMethod === "MOMO"}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                    />
                                                    Chuyển khoản (Momo P2P)
                                                </label>
                                            </div>
                                            
                                            {paymentMethod === 'VIETQR' && cartItems.length > 0 && (
                                                <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#e6f7ff", borderRadius: "8px", textAlign: "center", display: "inline-block", border: "1px solid #b3d4ff" }}>
                                                    <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#0052cc" }}>Mã VietQR (Mọi App Ngân Hàng)</p>
                                                    <img
                                                        src={`https://img.vietqr.io/image/momo-0353144481-compact.png?amount=${total + shippingFee}&addInfo=${mahd}&accountName=TRUONG%20NHUT%20HAO`}
                                                        alt="Mã VietQR Thanh Toán"
                                                        style={{ width: "200px", height: "200px", objectFit: "contain", borderRadius: "8px", border: "3px solid #0052cc", margin: "0 auto", padding: "5px", backgroundColor: "#fff" }}
                                                    />
                                                    <p style={{ margin: "10px 0 5px 0" }}>Chủ tài khoản: <b>TRƯƠNG NHỰT HÀO</b></p>
                                                    <p style={{ margin: "5px 0 0 0", fontStyle: "italic", fontSize: "13px", color: "#666" }}>Nội dung chuyển khoản: <b>{mahd}</b></p>
                                                </div>
                                            )}

                                            {paymentMethod === 'MOMO' && cartItems.length > 0 && (
                                                <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#ffe6e6", borderRadius: "8px", textAlign: "center", display: "inline-block", border: "1px solid #ffb3b3" }}>
                                                    <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#d82d8b" }}>Mã Momo P2P (Chỉ quét bằng Momo)</p>
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`2|99|0353144481|TRUONG NHUT HAO||0|0|${total + shippingFee}|${mahd}`)}`}
                                                        alt="Mã Momo Thanh Toán"
                                                        style={{ width: "200px", height: "200px", objectFit: "contain", borderRadius: "8px", border: "3px solid #d82d8b", margin: "0 auto", padding: "5px", backgroundColor: "#fff" }}
                                                    />
                                                    <p style={{ margin: "10px 0 5px 0" }}>Chủ tài khoản: <b>TRƯƠNG NHỰT HÀO</b></p>
                                                    <p style={{ margin: "5px 0 0 0", fontStyle: "italic", fontSize: "13px", color: "#666" }}>Nội dung chuyển khoản: <b>{mahd}</b></p>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            id="btn-thanh-toan"
                                            onClick={handleCheckout}
                                            disabled={isProcessing}
                                            style={{ 
                                                padding: "12px 30px", 
                                                marginRight: "10px", 
                                                backgroundColor: isProcessing ? "#999" : "var(--primary-color)", 
                                                color: "white", 
                                                border: "none", 
                                                borderRadius: "6px", 
                                                fontSize: "16px", 
                                                cursor: isProcessing ? "not-allowed" : "pointer", 
                                                fontWeight: "bold",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px"
                                            }}
                                        >
                                            {isProcessing ? (
                                                <>
                                                    <i className="fa fa-spinner fa-spin"></i> Đang xử lý...
                                                </>
                                            ) : (
                                                paymentMethod === 'COD' ? 'Đặt hàng' : 'Xác nhận đã chuyển khoản'
                                            )}
                                        </button>
                                    </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default CartPage;
