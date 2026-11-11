import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import HeaderSlideShow from "../components/HeaderSlideShow";
import Navigation from "../components/Navigation";
import Breadcrumb from "../components/Breadcrumb";
import { getCurrentUser, logout } from "../services/authService";
import { getCart, removeFromCart } from "../services/cartService";
import { useToast } from "../components/Toast/Toast";
import { formatImageUrl } from "../utils/imageUtils";

const getMasp = (item) => {
    return item.masp || item.MASP || item.MaSP || item.product?.masp || item.product?.MASP || "";
};

const getImageSrc = (imageUrl) => {
    return formatImageUrl(imageUrl);
};

const getProductName = (product) => {
    if (!product) return "Sản phẩm";
    return product.tenSP || product.TenSP || product.name || "Sản phẩm";
};

const getProductPrice = (product) => {
    if (!product) return 0;
    return Number(product.price || product.GIABAN || 0);
};

const getUserDisplayName = (user) => {
    if (!user) return '';
    return (
        user?.nguoidung?.ho_ten ||
        user?.nguoidung?.HOTEN ||
        user?.khachhang?.ho_ten ||
        user?.khachhang?.HOTEN ||
        user?.nhanvien?.ho_ten ||
        user?.nhanvien?.HOTEN ||
        user?.ho_ten ||
        user?.username ||
        ''
    );
};

const getUserInitial = (user) => {
    const displayName = getUserDisplayName(user) || '';
    if (!displayName) return 'U';
    const parts = displayName.trim().split(/\s+/);
    const lastWord = parts[parts.length - 1];
    return (lastWord?.charAt(0) || displayName.charAt(0) || 'U').toUpperCase();
};

const renderUserAvatar = (user) => {
    if (!user) {
        return <i className="nav-icon fa-regular fa-user"></i>;
    }

    const avatarUrl =
        user?.AVATAR ||
        user?.avatar ||
        user?.nguoidung?.AVATAR ||
        user?.nguoidung?.avatar ||
        user?.khachhang?.AVATAR ||
        user?.khachhang?.avatar ||
        user?.nhanvien?.AVATAR ||
        user?.nhanvien?.avatar;

    const initial = getUserInitial(user);

    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
        const fullSrc = (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://') || avatarUrl.startsWith('/api/'))
            ? avatarUrl
            : formatImageUrl(avatarUrl);

        return (
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <img
                    src={fullSrc}
                    alt="Avatar"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-initial-fallback');
                        if (fallback) fallback.style.display = 'inline-flex';
                    }}
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        verticalAlign: 'middle',
                        marginBottom: '4px'
                    }}
                />
                <div
                    className="avatar-initial-fallback"
                    style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-color, #c58b38)',
                        color: '#ffffff',
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: '700',
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        border: '2px solid #ffffff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                        userSelect: 'none',
                        marginBottom: '4px',
                        verticalAlign: 'middle'
                    }}
                    title={getUserDisplayName(user)}
                >
                    {initial}
                </div>
            </div>
        );
    }

    return (
        <div
            style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-color, #c58b38)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '13px',
                textTransform: 'uppercase',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                userSelect: 'none',
                marginBottom: '4px',
                verticalAlign: 'middle'
            }}
            title={getUserDisplayName(user)}
        >
            {initial}
        </div>
    );
};

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 80);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);
    const toast = useToast();

    const loadCart = async () => {
        try {
            const data = await getCart();
            const rawItems = Array.isArray(data) ? data : (data?.items || []);
            // Map API data to flat structure for Header display
            const mappedItems = rawItems.map(item => {
                const sp = item.sanpham || item.product || {};
                return {
                    id: item.sanPhamId || item.sanpham_id || sp.id || sp.MASP || item.id,
                    name: sp.tenSanPham || sp.TENSP || sp.name || item.name || 'Sản phẩm',
                    price: Number(sp.giaBan || sp.GIABAN || sp.price || item.price || 0),
                    image: sp.hinhAnh || sp.HINHANH || sp.image || item.image || '',
                    quantity: Number(item.soLuong || item.quantity || 1),
                };
            });
            setCartItems(mappedItems);
        } catch (e) {
            setCartItems([]);
        }
    };

    const loadWishlistCount = async () => {
        try {
            if (localStorage.getItem('access_token')) {
                const { getWishlist } = await import('../services/wishlistService.js');
                const wl = await getWishlist();
                const items = Array.isArray(wl) ? wl : (wl?.items || []);
                document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = items.length);
            } else {
                document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = '0');
            }
        } catch (e) {}
    };

    const handleRemoveItem = async (e, masp) => {
        e.preventDefault();
        e.stopPropagation();
        if (!masp) return;
        try {
            await removeFromCart(masp);
            loadCart();
            document.dispatchEvent(new Event('cartUpdated'));
        } catch (error) {
            console.error("Lỗi xóa sản phẩm khỏi giỏ:", error);
            toast.error("Không thể xóa sản phẩm lúc này!");
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                // Kiểm tra token trên URL (từ callback Google OAuth)
                const params = new URLSearchParams(window.location.search);
                const urlToken = params.get("token") || params.get("access_token");
                if (urlToken) {
                    localStorage.setItem("access_token", urlToken);
                    // Làm sạch tham số token trên URL cho đẹp
                    window.history.replaceState({}, document.title, window.location.pathname + "?google=true");
                }

                const res = await getCurrentUser();
                setUser(res);
                const role = Number(res?.MAROLE !== undefined ? res.MAROLE : res?.role);
                const vaiTroId = Number(res?.vaiTroId || res?.role_id || (res?.vaitro ? res.vaitro.id : 0));
                if (role === 3 || vaiTroId === 6 || (!vaiTroId && role === undefined)) {
                    loadCart();
                } else {
                    setCartItems([]);
                }
            } catch (e) {
                setUser(null);
            }
        };
        fetchUser();
        loadWishlistCount();

        const handleCartUpdate = () => loadCart();
        const handleAuthUpdate = () => {
            fetchUser();
            loadWishlistCount();
        };
        const handleWishlistUpdate = () => loadWishlistCount();

        document.addEventListener('cartUpdated', handleCartUpdate);
        document.addEventListener('authUpdated', handleAuthUpdate);
        document.addEventListener('wishlistUpdated', handleWishlistUpdate);
        return () => {
            document.removeEventListener('cartUpdated', handleCartUpdate);
            document.removeEventListener('authUpdated', handleAuthUpdate);
            document.removeEventListener('wishlistUpdated', handleWishlistUpdate);
        };
    }, []);

    const handleLogout = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await logout();
            window.location.href = "/dang-nhap";
        } catch (e) {
            console.error(e);
        }
    };

    if (location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header>
            {/* Nếu đang ở HomePage thì hiển thị slideshow */}
            {location.pathname === "/" || location.pathname === "/trang-chu" ? (
                <>
                    <div className="show">
                        <HeaderSlideShow />
                    </div>
                    <div className={`navigation navigation-js ${isScrolled ? "navigation-croll is-sticky" : ""}`}>
                        <div className="container">
                            <div className="row">
                                <ul className="nav-list col-lg-12">
                                    <li className="nav-item menuBars hide-on-pc hide-on-tablet ">
                                        <span className="hide-on-pc">
                                            <i className="fa-solid fa-bars "></i>
                                        </span>
                                    </li>
                                    <li className="nav-item col-lg-2 col-md-2">

                                        <Link to="/" className="nav-item__link-img">
                                            <img src="/assets/IMG/Logo.png" className="header-logo" alt="Givral Bakery" />
                                        </Link>
                                    </li>
                                    <li className="nav-item col-lg-8 col-md-8 hide-on-mobile">
                                        <Navigation />
                                    </li>
                                    <li className="nav-item col-lg-2 col-md-2">
                                        <ul className="nav-item__icon">
                                            <div className="nav-item__link-icon search-btn-js">
                                                <i className="nav-icon fa-solid fa-magnifying-glass"></i>
                                            </div>
                                            <div 
                                                ref={userMenuRef}
                                                className="nav-item__link-icon" 
                                                style={{ cursor: "pointer", position: "relative" }}
                                                onClick={(e) => {
                                                    if (!e.target.closest('.nav-icon__user')) {
                                                        setUserMenuOpen(prev => !prev);
                                                    }
                                                }}
                                            >
                                                {renderUserAvatar(user)}
                                                <ul className={`nav-icon__user ${userMenuOpen ? "is-open" : ""}`}>
                                                    {user ? (
                                                        <>
                                                            <li className="nav-icon__user-item">
                                                                <span style={{ padding: '10px 16px', display: 'block', fontWeight: 'bold', color: 'var(--primary-color)', borderBottom: '1px solid #eee' }}>
                                                                    Xin chào, {getUserDisplayName(user)}
                                                                </span>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <Link to="/thong-tin-ca-nhan" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Thông tin cá nhân</Link>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <Link to="/my-orders" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Lịch sử đơn hàng</Link>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <a href="#" onClick={(e) => { setUserMenuOpen(false); handleLogout(e); }} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng xuất</a>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="nav-icon__user-item"><Link to="/dang-ky" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Ký</Link></li>
                                                            <li className="nav-icon__user-item"><Link to="/dang-nhap" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Nhập</Link></li>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                            <Link to="/yeu-thich" className="nav-item__link-icon ">
                                                <i className="nav-icon fa-regular fa-heart"></i>
                                                <div className="nav-icon__number" id="wishlist-count">0</div>
                                            </Link>
                                            <div className="nav-item__link-icon" style={{ cursor: "pointer" }}>
                                                <i className="nav-icon fa-solid fa-cart-shopping"></i>
                                                <div className="nav-icon__number" id="cart-count">{cartItems.length}</div>
                                                <ul className="cart-list" style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: '#ffffff', opacity: 1, width: 'max-content', minWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                                    {cartItems.length === 0 ? (
                                                        <>
                                                            <li className="cart-item">
                                                                <img src="/assets/IMG/noCart.jpg" className="noCart-img" />
                                                            </li>
                                                            <li className="cart-item">
                                                                <p className="cart-item__title">
                                                                    Không có sản phẩm nào trong giỏ hàng của bạn
                                                                </p>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <h4 style={{ textAlign: 'left', padding: '10px 15px', margin: 0, borderBottom: '1px solid #eee', color: '#999', fontSize: '14px', fontWeight: 'normal' }}>Sản phẩm mới thêm</h4>
                                                            {cartItems.map((item, idx) => (
                                                                <li key={idx} className="cart-item" style={{ display: 'flex', padding: '10px 15px', alignItems: 'center', borderBottom: '1px solid #eee', gap: '10px' }}>
                                                                    <img src={getImageSrc(item.image)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                                                    <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                                                                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                            {item.name || "Sản phẩm"}
                                                                        </div>
                                                                        <div style={{ fontSize: '13px', color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '2px' }}>
                                                                            {(item.price || 0).toLocaleString('vi-VN')}₫ <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal' }}>x{item.quantity || 1}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={(e) => handleRemoveItem(e, item.id)}
                                                                        style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '14px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                        title="Xóa sản phẩm khỏi giỏ"
                                                                    >
                                                                        <i className="fa-solid fa-trash-can"></i>
                                                                    </button>
                                                                </li>
                                                            ))}
                                                            <div style={{ padding: '10px', textAlign: 'center' }}>
                                                                <Link to="/gio-hang" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 60px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', height: '40px', width: '100%' }}>
                                                                    Xem giỏ hàng
                                                                </Link>
                                                            </div>
                                                        </>
                                                    )}
                                                </ul>
                                            </div>
                                        </ul>

                                    </li>
                                </ul>
                            </div>

                        </div>
                    </div>
                </>

            ) : (
                /* Các page khác thì hiển thị breadcrumb */
                <>
                    <div className="header-gioiThieu">
                        <img src="../../assets/IMG/breadcrumb.jpg" alt="" className="header-gioiThieu-img" />
                        <div className="radient">
                            <div className={`navigation navigation-js ${isScrolled ? "navigation-croll is-sticky" : ""}`}>
                                <div className="container">
                                    <div className="row">
                                        <ul className="nav-list col-lg-12">
                                            <li className="nav-item menuBars hide-on-pc hide-on-tablet ">
                                                <span className="hide-on-pc">
                                                    <i className="fa-solid fa-bars "></i>
                                                </span>
                                            </li>
                                            <li className="nav-item col-lg-2 col-md-2">
                                                <Link to="/" className="nav-item__link-img">
                                                    <img src="/assets/IMG/Logo.png" className="header-logo" alt="Givral Bakery" />
                                                </Link>
                                            </li>
                                            <li className="nav-item col-lg-8 col-md-8 hide-on-mobile">
                                                <Navigation />
                                            </li>
                                            <li className="nav-item col-lg-2 col-md-2">
                                                <ul className="nav-item__icon">
                                                    <div className="nav-item__link-icon search-btn-js">
                                                        <i className="nav-icon fa-solid fa-magnifying-glass"></i>
                                                    </div>
                                                    <div 
                                                        ref={userMenuRef}
                                                        className="nav-item__link-icon" 
                                                        style={{ cursor: "pointer", position: "relative" }}
                                                        onClick={(e) => {
                                                            if (!e.target.closest('.nav-icon__user')) {
                                                                setUserMenuOpen(prev => !prev);
                                                            }
                                                        }}
                                                    >
                                                        {renderUserAvatar(user)}
                                                        <ul className={`nav-icon__user ${userMenuOpen ? "is-open" : ""}`}>
                                                            {user ? (
                                                                <>
                                                                    <li className="nav-icon__user-item">
                                                                        <span style={{ padding: '10px 16px', display: 'block', fontWeight: 'bold', color: 'var(--primary-color)', borderBottom: '1px solid #eee' }}>
                                                                            Xin chào, {getUserDisplayName(user)}
                                                                        </span>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <Link to="/thong-tin-ca-nhan" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Thông tin cá nhân</Link>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <Link to="/my-orders" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Lịch sử đơn hàng</Link>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <a href="#" onClick={(e) => { setUserMenuOpen(false); handleLogout(e); }} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng xuất</a>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li className="nav-icon__user-item"><Link to="/dang-ky" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Ký</Link></li>
                                                                    <li className="nav-icon__user-item"><Link to="/dang-nhap" onClick={() => setUserMenuOpen(false)} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Nhập</Link></li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>
                                                    <Link to="/yeu-thich" className="nav-item__link-icon ">
                                                        <i className="nav-icon fa-regular fa-heart"></i>
                                                        <div className="nav-icon__number" id="wishlist-count">0</div>
                                                    </Link>
                                                    <div className="nav-item__link-icon" style={{ cursor: "pointer" }}>
                                                        <i className="nav-icon fa-solid fa-cart-shopping"></i>
                                                        <div className="nav-icon__number" id="cart-count">{cartItems.length}</div>
                                                        <ul className="cart-list" style={{ backgroundColor: '#ffffff', opacity: 1, width: 'max-content', minWidth: '320px', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                                                            {cartItems.length === 0 ? (
                                                                <>
                                                                    <li className="cart-item">
                                                                        <img src="/assets/IMG/noCart.jpg" className="noCart-img" />
                                                                    </li>
                                                                    <li className="cart-item">
                                                                        <p className="cart-item__title">
                                                                            Không có sản phẩm nào trong giỏ hàng của bạn
                                                                        </p>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <h4 style={{ textAlign: 'left', padding: '10px 15px', margin: 0, borderBottom: '1px solid #eee', color: 'var(--primary-color)', fontSize: '16px', fontWeight: '500' }}>Sản phẩm mới thêm</h4>
                                                                    <div className="cart-items-scroll">
                                                                        {cartItems.map((item, idx) => (
                                                                            <li key={idx} className="cart-item" style={{ display: 'flex', padding: '10px 15px', alignItems: 'center', borderBottom: '1px solid #eee', gap: '10px' }}>
                                                                                <img src={getImageSrc(item.image)} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
                                                                                <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                                                                                    <div style={{ fontSize: '14px', lineHeight: '1.4', fontWeight: '600', color: '#333', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                                                        {item.name || "Sản phẩm"}
                                                                                    </div>
                                                                                    <div style={{ fontSize: '13px', lineHeight: '1.4', color: 'var(--primary-color)', fontWeight: 'bold', marginTop: '2px' }}>
                                                                                        {(item.price || 0).toLocaleString('vi-VN')}₫ <span style={{ color: '#999', fontSize: '12px', fontWeight: 'normal' }}>x{item.quantity || 1}</span>
                                                                                    </div>
                                                                                </div>
                                                                                <button
                                                                                    onClick={(e) => handleRemoveItem(e, item.id)}
                                                                                    style={{ background: 'none', border: 'none', color: '#ff4d4f', cursor: 'pointer', fontSize: '14px', padding: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                                                    title="Xóa sản phẩm khỏi giỏ"
                                                                                >
                                                                                    <i className="fa-solid fa-trash-can"></i>
                                                                                </button>
                                                                            </li>
                                                                        ))}
                                                                    </div>
                                                                    <div style={{ textAlign: 'center', padding: '10px 15px' }}>
                                                                        <Link to="/gio-hang" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 30px', lineHeight: '1.4', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', height: '40px', width: '80%' }}>
                                                                            Xem giỏ hàng
                                                                        </Link>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </div>
                                                </ul>

                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                            <Breadcrumb />
                        </div>
                    </div>
                </>
            )}
        </header>
    );
}

export default Header;