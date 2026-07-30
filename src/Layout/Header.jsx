import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import HeaderSlideShow from "../components/headerSlideShow";
import Navigation from "../components/Navigation";
import Breadcrumb from "../components/Breadcrumb";
import { getCurrentUser, logout } from "../services/authService";
import { getCart, removeFromCart } from "../services/cartService";

const getMasp = (item) => {
    return item.masp || item.MASP || item.MaSP || item.product?.masp || item.product?.MASP || "";
};

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

const Header = () => {
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [cartItems, setCartItems] = useState([]);

    const loadCart = async () => {
        try {
            const data = await getCart();
            const items = Array.isArray(data) ? data : (data?.items || []);
            setCartItems(items);
        } catch (e) {
            setCartItems([]);
        }
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
            alert("Không thể xóa sản phẩm lúc này!");
        }
    };

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getCurrentUser();
                console.log(res);
                setUser(res);
                loadCart(); // Load cart if user is logged in
            } catch (e) {
                setUser(null);
            }
        };
        fetchUser();

        const handleUpdate = () => loadCart();
        document.addEventListener('cartUpdated', handleUpdate);
        return () => document.removeEventListener('cartUpdated', handleUpdate);
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
            {location.pathname === "/" ? (
                <>
                    <div className="show">
                        <HeaderSlideShow />
                    </div>
                    <div class="navigation navigation-js">
                        <div className="container">
                            <div className="row">
                                <ul className="nav-list col-lg-12">
                                    <li className="nav-item menuBars hide-on-pc hide-on-tablet ">
                                        <span className="hide-on-pc">
                                            <i className="fa-solid fa-bars "></i>
                                        </span>
                                    </li>
                                    <li className="nav-item col-lg-2 col-md-2">

                                        <navLink className="nav-item__link-img">
                                            <img src="../../assets/IMG/logo_header.webp" className="header-logo" />
                                        </navLink>
                                    </li>
                                    <li className="nav-item col-lg-8 col-md-8 hide-on-mobile">
                                        <Navigation />
                                    </li>
                                    <li className="nav-item col-lg-2 col-md-2">
                                        <ul className="nav-item__icon">
                                            <div className="nav-item__link-icon search-btn-js">
                                                <i className="nav-icon fa-solid fa-magnifying-glass"></i>
                                            </div>
                                            <Link to={user ? "/thong-tin-ca-nhan" : "/dang-nhap"} className="nav-item__link-icon hide-on-mobile" >
                                                {user?.AVATAR ? (
                                                    <img src={user.AVATAR.startsWith('http') ? user.AVATAR : `../../assets/IMG/${user.AVATAR.split('/').pop()}`} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px', }} />
                                                ) : (
                                                    <i className="nav-icon fa-regular fa-user"></i>
                                                )}
                                                <ul className="nav-icon__user">
                                                    {user ? (
                                                        <>
                                                            <li className="nav-icon__user-item">
                                                                <span style={{ padding: '10px  0px 10px 10px', display: 'block', fontWeight: 'bold', color: 'var(--primary-color)', borderBottom: '1px solid #eee' }}>
                                                                    Xin chào,
                                                                    {
                                                                        user?.khachhang?.HOTEN ||
                                                                        user?.nhanvien?.HOTEN ||
                                                                        user?.username
                                                                    }
                                                                </span>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <Link to="/thong-tin-ca-nhan" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Thông tin cá nhân</Link>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <Link to="/my-orders" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Lịch sử đơn hàng</Link>
                                                            </li>
                                                            <li className="nav-icon__user-item">
                                                                <a href="#" onClick={handleLogout} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng xuất</a>
                                                            </li>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <li className="nav-icon__user-item"><Link to="/dang-ky" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Ký</Link></li>
                                                            <li className="nav-icon__user-item"><Link to="/dang-nhap" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Nhập</Link></li>
                                                        </>
                                                    )}
                                                </ul>
                                            </Link>
                                            <Link to="/yeu-thich" className="nav-item__link-icon ">
                                                <i className="nav-icon fa-regular fa-heart"></i>
                                                <div className="nav-icon__number" id="wishlist-count">0</div>
                                            </Link>
                                            <Link to="/gio-hang" className="nav-item__link-icon ">
                                                <i className="nav-icon fa-solid fa-cart-shopping"></i>
                                                <div className="nav-icon__number" id="cart-count">{cartItems.length}</div>
                                                <ul className="cart-list" style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.8)', width: 'max-content', minWidth: '320px' }}>
                                                    {cartItems.length === 0 ? (
                                                        <>
                                                            <li className="cart-item">
                                                                <img src="../../assets/IMG/noCart.jpg" className="noCart-img" />
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
                                            </Link>
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
                            <div className="navigation navigation-js">
                                <div className="container">
                                    <div className="row">
                                        <ul className="nav-list col-lg-12">
                                            <li className="nav-item menuBars hide-on-pc hide-on-tablet ">
                                                <span className="hide-on-pc">
                                                    <i className="fa-solid fa-bars "></i>
                                                </span>
                                            </li>
                                            <li className="nav-item col-lg-2 col-md-2">
                                                <a href="Trang-Chu.html" className="nav-item__link-img">
                                                    <img src="../../assets/IMG/logo_header.webp" className="header-logo" />
                                                </a>
                                            </li>
                                            <li className="nav-item col-lg-8 col-md-8 hide-on-mobile">
                                                <Navigation />
                                            </li>
                                            <li className="nav-item col-lg-2 col-md-2">
                                                <ul className="nav-item__icon">
                                                    <div className="nav-item__link-icon search-btn-js">
                                                        <i className="nav-icon fa-solid fa-magnifying-glass"></i>
                                                    </div>
                                                    <Link to={user ? "/thong-tin-ca-nhan" : "/dang-nhap"} className="nav-item__link-icon hide-on-mobile">
                                                        {user?.AVATAR ? (
                                                            <img src={user.AVATAR.startsWith('http') ? user.AVATAR : `../../assets/IMG/${user.AVATAR.split('/').pop()}`} alt="Avatar" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', marginBottom: '8px'}} />
                                                        ) : (
                                                            <i className="nav-icon fa-regular fa-user"></i>
                                                        )}
                                                        <ul className="nav-icon__user">
                                                            {user ? (
                                                                <>
                                                                    <li className="nav-icon__user-item">
                                                                        <span style={{ padding: '10px  0px 10px 10px', display: 'block', fontWeight: 'bold', color: 'var(--primary-color)', borderBottom: '1px solid #eee' }}>
                                                                            Xin chào,
                                                                            {
                                                                                user?.khachhang?.HOTEN ||
                                                                                user?.nhanvien?.HOTEN ||
                                                                                user?.username
                                                                            }
                                                                        </span>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <Link to="/thong-tin-ca-nhan" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Thông tin cá nhân</Link>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <Link to="/my-orders" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Lịch sử đơn hàng</Link>
                                                                    </li>
                                                                    <li className="nav-icon__user-item">
                                                                        <a href="#" onClick={handleLogout} style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng xuất</a>
                                                                    </li>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <li className="nav-icon__user-item"><Link to="/dang-ky" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Ký</Link></li>
                                                                    <li className="nav-icon__user-item"><Link to="/dang-nhap" style={{ color: "inherit", textDecoration: "none", display: "block" }}>Đăng Nhập</Link></li>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </Link>
                                                    <Link to="/yeu-thich" className="nav-item__link-icon ">
                                                        <i className="nav-icon fa-regular fa-heart"></i>
                                                        <div className="nav-icon__number" id="wishlist-count">0</div>
                                                    </Link>
                                                    <Link to="/gio-hang" className="nav-item__link-icon ">
                                                        <i className="nav-icon fa-solid fa-cart-shopping"></i>
                                                        <div className="nav-icon__number" id="cart-count">{cartItems.length}</div>
                                                        <ul className="cart-list" style={{ maxHeight: '400px', overflowY: 'auto', backgroundColor: 'rgba(255, 255, 255, 0.94)', width: 'max-content', minWidth: '320px' }}>
                                                            {cartItems.length === 0 ? (
                                                                <>
                                                                    <li className="cart-item">
                                                                        <img src="../../assets/IMG/noCart.jpg" className="noCart-img" />
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
                                                                    <div style={{ textAlign: 'center' }}>
                                                                        <Link to="/gio-hang" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px 30px', lineHeight: '1.4', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', height: '40px', width: '80%' }}>
                                                                            Xem giỏ hàng
                                                                        </Link>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </ul>
                                                    </Link>
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