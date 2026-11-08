import React, { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useToast } from './Toast/Toast';

const Modal = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isProductsSubmenuOpen, setIsProductsSubmenuOpen] = useState(false);
    const [authUser, setAuthUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    const toast = useToast();

    const path = location.pathname.toLowerCase();
    const isHome = path === "/" || path === "/trang-chu";
    const isAbout = path.startsWith("/gioi-thieu");
    const isProduct = path.startsWith("/san-pham");
    const isNews = path.startsWith("/tin-tuc");
    const isContact = path.startsWith("/lien-he");
    const isStore = path.startsWith("/he-thong-cua-hang");
    const isFaq = path.startsWith("/cau-hoi-thuong-gap");

    const closeAllModals = () => {
        const modal = document.querySelector('.modal-js');
        const modalSearch = document.querySelector('.Modal-Search-js');
        const searchInfor = document.querySelector('.searchInfor-js');
        const addCart = document.querySelector('.addCart-js');
        const menuBar = document.querySelector('.Modal-MenuMobile-block-js');

        if (modalSearch) modalSearch.style.display = 'none';
        if (menuBar) menuBar.style.display = 'none';
        if (addCart) addCart.style.display = 'none';
        if (searchInfor) searchInfor.style.display = 'none';
        if (modal) modal.style.display = 'none';
    };

    const handleMobileLogout = async () => {
        closeAllModals();
        try {
            const { logout } = await import('../services/authService.js');
            await logout();
            window.location.href = '/dang-nhap';
        } catch (e) {
            window.location.href = '/dang-nhap';
        }
    };

    const handleSearchSubmit = () => {
        if (searchQuery.trim()) {
            navigate(`/san-pham?search=${encodeURIComponent(searchQuery.trim())}`);
            const modal = document.querySelector('.modal-js');
            const modalSearch = document.querySelector('.Modal-Search-js');
            if (modalSearch) modalSearch.style.display = 'none';
            if (modal) modal.style.display = 'none';
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };
    useEffect(() => {
        const handleClick = async (e) => {
            const modal = document.querySelector('.modal-js');
            const modalSearch = document.querySelector('.Modal-Search-js');
            const searchInfor = document.querySelector('.searchInfor-js');
            const addCart = document.querySelector('.addCart-js');
            const menuBar = document.querySelector('.Modal-MenuMobile-block-js');

            // Search Modal
            if (e.target.closest('.search-btn-js')) {
                if(searchInfor) searchInfor.style.display = 'none';
                if(addCart) addCart.style.display = 'none';
                if(menuBar) menuBar.style.display = 'none';
                if(modalSearch) {
                   modalSearch.style.display = 'block';
                   modalSearch.style.animation = 'none';
                   void modalSearch.offsetWidth;
                   modalSearch.style.animation = 'slideIn linear 0.5s forwards';
                }
                if(modal) modal.style.display = 'block';
            }
            // Exit Search
            if (e.target.closest('.exit-btn-js')) {
                if(modalSearch) modalSearch.style.display = 'none';
                if(modal) modal.style.display = 'none';
            }
            // Mobile Menu
            if (e.target.closest('.menuBars')) {
                if(searchInfor) searchInfor.style.display = 'none';
                if(addCart) addCart.style.display = 'none';
                if(modalSearch) modalSearch.style.display = 'none';
                if(modal) modal.style.display = 'block';
                if(menuBar) menuBar.style.display = 'flex';
            }
            // Add Cart Quick View
            if (e.target.closest('.product-sale-tag-item-2-cart-js') || e.target.closest('.searchInfor-item__addCartBtn-js')) {
                e.preventDefault();
                const boxProduct = e.target.closest('.product-sale-item-level2') || document.querySelector('.searchInfor-list-js');
                const masp = boxProduct?.dataset?.masp || "SP01"; // Fallback to SP01 if not found
                
                // Get quantity from quick view if available
                let quantityToAdd = 1;
                if (e.target.closest('.searchInfor-item__addCartBtn-js')) {
                    const quantityEl = document.querySelector('.CustomizeQuantity-number-js');
                    if (quantityEl) {
                        quantityToAdd = parseInt(quantityEl.textContent) || 1;
                    }
                }
                
                // Extract product info for success modal
                let img, name, priceSale;
                if (e.target.closest('.searchInfor-item__addCartBtn-js')) {
                    img = document.getElementById('largeImage')?.src;
                    name = document.querySelector('.searchInfor-item__name-js')?.textContent;
                    priceSale = document.querySelector('.searchInfor-item__priceSale-js')?.textContent;
                } else if (boxProduct) {
                    img = boxProduct.querySelector('.product-sale_img-js')?.src || boxProduct.querySelector('img')?.src;
                    name = boxProduct.querySelector('.product-sale__name-js')?.textContent || boxProduct.querySelector('.product-sale__name')?.textContent;
                    priceSale = boxProduct.querySelector('.product-sale__price-sale-js')?.textContent || boxProduct.querySelector('.product-sale__price-sale')?.textContent;
                }

                try {
                    // Call backend API
                    await import('../services/cartService.js').then(m => m.addToCart(masp, quantityToAdd));
                    
                    // Update header and modal
                    await import('../services/cartService.js').then(async m => {
                        const cart = await m.getCart();
                        const totalItems = cart.items ? cart.items.length : cart.length;
                        
                        // Cập nhật số lượng trên header
                        const cartCountEls = document.querySelectorAll('#cart-count');
                        cartCountEls.forEach(el => el.textContent = totalItems);
                        document.dispatchEvent(new Event('cartUpdated'));

                        // Cập nhật thông tin Modal Thành Công
                        const addCartImg = document.getElementById('largeImageaddCart') || document.querySelector('.addCart-item-img-js');
                        const addCartName = document.querySelector('.addCart-item__name');
                        const addCartPrice = document.querySelector('.addCart-item__price');
                        const addCartCount = document.querySelector('.highligh');
                        
                        if (addCartImg && img) addCartImg.src = img;
                        if (addCartName && name) addCartName.textContent = name;
                        if (addCartPrice && priceSale) addCartPrice.textContent = priceSale;
                        if (addCartCount) addCartCount.textContent = totalItems;
                    });

                    if(searchInfor) searchInfor.style.display = 'none';
                    if(modalSearch) modalSearch.style.display = 'none';
                    if(menuBar) menuBar.style.display = 'none';
                    if(modal) modal.style.display = 'none';
                    if(addCart) addCart.style.display = 'none';
                    toast.success(`Đã thêm "${name || 'sản phẩm'}" vào giỏ hàng thành công!`);
                } catch(error) {
                    if (error.response?.status === 401) {
                        toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
                        window.location.href = "/dang-nhap";
                    } else {
                        const errorMsg = error.response?.data?.error || "Không thể thêm vào giỏ hàng";
                        toast.error("Lỗi: " + errorMsg);
                    }
                }
            }
            // Quick View - Chuyển thẳng sang trang chi tiết sản phẩm mà không hiện Modal
            if (e.target.closest('.product-sale-tag-item-2-search-js')) {
                e.preventDefault();
                const productElement = e.target.closest('.product-sale-item-level2') || e.target.closest('.menuProduct-block') || e.target.closest('[data-masp]');
                const masp = productElement?.dataset?.masp;
                if (masp) {
                    navigate(`/san-pham/${masp}`);
                }
                return;
            }
            if (e.target.closest('.product-bestSale__tag-icon--noLike-js') || e.target.closest('.product-sale__tag-icon--noLike-js')) {
                e.preventDefault();
                e.stopPropagation();
                const liNoLike = e.target.closest('.product-bestSale__tag-icon--noLike-js') || e.target.closest('.product-sale__tag-icon--noLike-js');
                const boxProduct = e.target.closest('.product-sale-item-level2');
                if (boxProduct && liNoLike) {
                    const masp = boxProduct.dataset.masp;
                    if (!masp) { toast.error('Không tìm thấy mã sản phẩm!'); return; }
                    try {
                        const { addToWishlist, getWishlist } = await import('../services/wishlistService.js');
                        const res = await addToWishlist(masp);
                        if (res?.already_exists) {
                            toast.info("Sản phẩm đã có trong danh sách yêu thích.");
                        } else {
                            toast.success("Đã thêm vào danh sách yêu thích!");
                        }
                        const wl = await getWishlist();
                        document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = wl.length);
                        document.dispatchEvent(new Event('wishlistUpdated'));
                        // Toggle icon: ẩn noLike, hiện Like
                        liNoLike.style.display = 'none';
                        const liLike = liNoLike.nextElementSibling;
                        if (liLike) liLike.style.display = 'inline-flex';
                    } catch(err) {
                        console.error(err);
                        if (err.response?.status === 401) {
                            toast.warning("Vui lòng đăng nhập để lưu sản phẩm yêu thích!");
                        } else {
                            toast.error(err.response?.data?.error || err.response?.data?.message || "Có lỗi xảy ra khi thêm vào yêu thích.");
                        }
                    }
                }
            }

            // Remove from wishlist — click vào li.product-bestSale__tag-icon--Like-js hoặc li.product-sale__tag-icon--Like-js
            if (e.target.closest('.product-bestSale__tag-icon--Like-js') || e.target.closest('.product-sale__tag-icon--Like-js')) {
                e.preventDefault();
                e.stopPropagation();
                const liLike = e.target.closest('.product-bestSale__tag-icon--Like-js') || e.target.closest('.product-sale__tag-icon--Like-js');
                const boxProduct = e.target.closest('.product-sale-item-level2');
                if (boxProduct && liLike) {
                    const masp = boxProduct.dataset.masp;
                    if (!masp) return;
                    try {
                        const { removeFromWishlist, getWishlist } = await import('../services/wishlistService.js');
                        await removeFromWishlist(masp);
                        const wl = await getWishlist();
                        document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = wl.length);
                        document.dispatchEvent(new Event('wishlistUpdated'));
                        // Toggle icon: ẩn Like, hiện noLike
                        liLike.style.display = 'none';
                        const liNoLike = liLike.previousElementSibling;
                        if (liNoLike) liNoLike.style.display = 'inline-flex';
                    } catch(err) {
                        console.error(err);
                    }
                }
            }
        };

        // Fetch authUser for mobile drawer
        import('../services/authService.js').then(m => {
            m.getCurrentUser().then(u => setAuthUser(u)).catch(() => setAuthUser(null));
        });

        // Initialize header counters (only if logged in)
        if (localStorage.getItem('access_token')) {
            import('../services/wishlistService.js').then(async m => {
                try {
                    const wl = await m.getWishlist();
                    const countEls = document.querySelectorAll('#wishlist-count');
                    const items = Array.isArray(wl) ? wl : (wl?.items || []);
                    countEls.forEach(el => el.textContent = items.length);
                } catch(e) {}
            });

            import('../services/cartService.js').then(async m => {
                try {
                    const cart = await m.getCart();
                    const cartCountEls = document.querySelectorAll('#cart-count');
                    const items = Array.isArray(cart) ? cart : (cart?.items || []);
                    cartCountEls.forEach(el => el.textContent = items.length);
                } catch(e) {}
            });
        }

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <>
        <div className="modal modal-js" style={{ display: "none" }}>
            {/* Backdrop Overlay - click closes everything */}
            <div className="modal__overlay modal-overlay-js" onClick={closeAllModals}></div>

            {/* Modal Body: Search, Quick View, Add to Cart */}
            <div className="modal__body modal__body-js" style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999999 }}>

                {/* Modal Search */}
                <div className="grid">
                    <div className="row">
                        <div className="Modal-Search Modal-Search-js">
                            <ul className="search-list">
                                <li className="search-item">
                                    <input 
                                        type="text" 
                                        id="search-input" 
                                        className="Search-input" 
                                        placeholder="Bạn muốn tìm gì?" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                    />
                                    <label htmlFor="search-input" className="search-item-icon" onClick={handleSearchSubmit} style={{cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center"}}>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="11" cy="11" r="8"></circle>
                                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                        </svg>
                                    </label>
                                </li>
                                <p className="exit-btn exit-btn-js" onClick={closeAllModals} title="Đóng tìm kiếm" style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18"></line>
                                        <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                </p>
                            </ul>
                        </div> 
                    </div>
                </div>
            </div>
        </div>

        {/* Mobile Offcanvas Drawer (Dola Bakery Style - Clean, No Underline) */}
            <div className="Modal-MenuMobile-block Modal-MenuMobile-block-js" style={{ display: "none" }}>
                <div className="mobile-drawer-header">
                    <button type="button" className="mobile-drawer-close-btn" onClick={closeAllModals} title="Đóng menu">
                        <i className="fa-solid fa-xmark"></i>
                    </button>

                    {authUser ? (
                        <div className="mobile-auth-btns">
                            <Link to="/thong-tin-ca-nhan" className="mobile-auth-btn" onClick={closeAllModals}>
                                <i className="fa-solid fa-user-circle" style={{ marginRight: '6px' }}></i>
                                {authUser.HOTEN || authUser.name || 'Tài khoản'}
                            </Link>
                            <button type="button" className="mobile-auth-btn" onClick={handleMobileLogout} style={{ backgroundColor: '#dc2626' }}>
                                <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '4px' }}></i>
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div className="mobile-auth-btns">
                            <Link to="/dang-ky" className="mobile-auth-btn" onClick={closeAllModals}>
                                Đăng ký
                            </Link>
                            <Link to="/dang-nhap" className="mobile-auth-btn" onClick={closeAllModals}>
                                Đăng nhập
                            </Link>
                        </div>
                    )}

                    <div className="mobile-menu-title-bar">
                        MENU CHÍNH
                    </div>
                </div>

                <div className="mobile-drawer-content">
                    <ul className="mobile-nav-list">
                        <li className="mobile-nav-item">
                            <Link to="/" className={`mobile-nav-link ${isHome ? 'active' : ''}`} onClick={closeAllModals}>
                                Trang chủ
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/gioi-thieu" className={`mobile-nav-link ${isAbout ? 'active' : ''}`} onClick={closeAllModals}>
                                Giới thiệu
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Link to="/san-pham" className={`mobile-nav-link ${isProduct ? 'active' : ''}`} onClick={closeAllModals} style={{ flex: 1, borderBottom: 'none' }}>
                                    Sản phẩm
                                </Link>
                                <button
                                    type="button"
                                    className="mobile-sub-toggle-btn"
                                    onClick={() => setIsProductsSubmenuOpen(!isProductsSubmenuOpen)}
                                    title="Mở rộng danh mục"
                                >
                                    <i className={`fa-solid ${isProductsSubmenuOpen ? 'fa-minus' : 'fa-plus'}`}></i>
                                </button>
                            </div>
                            {isProductsSubmenuOpen && (
                                <ul className="mobile-subnav-list">
                                    <li>
                                        <Link to="/san-pham" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Tất cả sản phẩm
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?category=1" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh kem (9 SP)
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?category=2" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh ngọt (13 SP)
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?category=3" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh mì (9 SP)
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?category=4" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh khô (8 SP)
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?category=5" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh tráng miệng (5 SP)
                                        </Link>
                                    </li>
                                    <li>
                                        <span className="mobile-subnav-link" style={{ opacity: 0.45, cursor: "not-allowed", color: "#94a3b8" }}>
                                            • Bánh theo mùa (Tạm hết)
                                        </span>
                                    </li>
                                    <li>
                                        <span className="mobile-subnav-link" style={{ opacity: 0.45, cursor: "not-allowed", color: "#94a3b8" }}>
                                            • Bánh đông lạnh (Chưa có)
                                        </span>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/tin-tuc" className={`mobile-nav-link ${isNews ? 'active' : ''}`} onClick={closeAllModals}>
                                Tin tức
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/lien-he" className={`mobile-nav-link ${isContact ? 'active' : ''}`} onClick={closeAllModals}>
                                Liên hệ
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/he-thong-cua-hang" className={`mobile-nav-link ${isStore ? 'active' : ''}`} onClick={closeAllModals}>
                                Hệ thống cửa hàng
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/cau-hoi-thuong-gap" className={`mobile-nav-link ${isFaq ? 'active' : ''}`} onClick={closeAllModals}>
                                Câu hỏi thường gặp
                            </Link>
                        </li>
                    </ul>

                    <ul className="mobile-nav-list" style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e5e5e5' }}>
                        <li className="mobile-nav-item">
                            <Link to="/yeu-thich" className="mobile-nav-link" onClick={closeAllModals}>
                                <span><i className="fa-regular fa-heart" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>Sản phẩm yêu thích</span>
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/gio-hang" className="mobile-nav-link" onClick={closeAllModals}>
                                <span><i className="fa-solid fa-bag-shopping" style={{ marginRight: '8px', color: 'var(--primary-color)' }}></i>Danh sách giỏ hàng</span>
                            </Link>
                        </li>
                    </ul>

                    <div className="mobile-drawer-footer">
                        <p><strong>Hotline:</strong> <a href="tel:19006750" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>1900 6750</a></p>
                        <p><strong>Email:</strong> support@sapo.vn</p>
                        <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>© Givral Bakery - Dola theme</p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Modal;
