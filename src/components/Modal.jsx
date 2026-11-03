import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from './Toast/Toast';

const Modal = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isProductsSubmenuOpen, setIsProductsSubmenuOpen] = useState(false);
    const [authUser, setAuthUser] = useState(null);
    const navigate = useNavigate();
    const toast = useToast();

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
                    img = boxProduct.querySelector('.product-sale_img-js')?.src;
                    name = boxProduct.querySelector('.product-sale__name-js')?.textContent;
                    priceSale = boxProduct.querySelector('.product-sale__price-sale-js')?.textContent;
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
                        const addCartImg = document.getElementById('largeImageaddCart');
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
                    if(modal) modal.style.display = 'block';
                    if(addCart) addCart.style.display = 'flex';
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
            // Search Info Quick View
            if (e.target.closest('.product-sale-tag-item-2-search-js')) {
                if(addCart) addCart.style.display = 'none';
                if(modalSearch) modalSearch.style.display = 'none';
                if(menuBar) menuBar.style.display = 'none';
                
                // Get product info
                const productElement = e.target.closest('.product-sale-item-level2');
                if (productElement) {
                    const img = productElement.querySelector('.product-sale_img-js')?.src;
                    const name = productElement.querySelector('.product-sale__name-js')?.textContent;
                    const priceSale = productElement.querySelector('.product-sale__price-sale-js')?.textContent;
                    const priceOriginal = productElement.querySelector('.product-sale__price-original-js')?.textContent;
                    const masp = productElement.dataset.masp || "SP01";

                    const searchInfoList = document.querySelector('.searchInfor-list-js');
                    if (searchInfoList) searchInfoList.dataset.masp = masp; // Save masp for add to cart inside modal

                    if (img) {
                        const largeImg = document.getElementById('largeImage');
                        if (largeImg) largeImg.src = img;
                        const optImg = document.querySelector('.searchInfor-item__IMG-option-item-img-js');
                        if(optImg) optImg.src = img;
                    }
                    if (name) {
                        const nameEl = document.querySelector('.searchInfor-item__name-js');
                        if (nameEl) nameEl.textContent = name;
                    }
                    if (priceSale) {
                        const priceSaleEl = document.querySelector('.searchInfor-item__priceSale-js');
                        if (priceSaleEl) priceSaleEl.textContent = priceSale;
                    }
                    if (priceOriginal) {
                        const priceOrigEl = document.querySelector('.searchInfor-item__priceOriginal-js');
                        if (priceOrigEl) priceOrigEl.textContent = priceOriginal;
                    }
                    
                    const productCodeEl = document.querySelector('.searchInfor-item__productCode-title');
                    if (productCodeEl) productCodeEl.textContent = masp;
                    
                    const soluong = parseInt(productElement.dataset.soluong) || 0;
                    let tonkhoChitiet = [];
                    try { 
                        tonkhoChitiet = JSON.parse(productElement.dataset.tonkhoChitiet || "[]"); 
                    } catch(e) {}

                    const productStatusEl = document.querySelector('.searchInfor-item__productStatus-title');
                    if (productStatusEl) {
                        productStatusEl.textContent = soluong > 0 ? 'Còn hàng' : 'Hết hàng';
                        productStatusEl.style.color = soluong > 0 ? 'var(--primary-color)' : 'red';
                    }
                    
                    // Remove existing detailed stock row if any
                    const existingDetailsRow = document.querySelector('.searchInfor-item__level2-stockDetails');
                    if (existingDetailsRow) {
                        existingDetailsRow.remove();
                    }

                    const productStockEl = document.querySelector('.searchInfor-item__productStock-title');
                    
                    // Xóa dropdown cũ nếu có
                    const existingStoreRow = document.querySelector('.searchInfor-item__level2-storeSelect');
                    if (existingStoreRow) existingStoreRow.remove();

                    if (tonkhoChitiet && tonkhoChitiet.length > 0) {
                        const availableStores = tonkhoChitiet.filter(tk => tk.SOLUONG_TON > 0);
                        
                        if (availableStores.length > 0) {
                            // Khôi phục chữ "Kho:" ban đầu, nếu nó đã bị thay đổi
                            const productStockContainer = document.querySelector('.searchInfor-item__productStock');
                            if (productStockContainer && !productStockContainer.querySelector('.searchInfor-item__productStock-title')) {
                                productStockContainer.innerHTML = 'Kho: <span class="searchInfor-item__productStock-title" style="font-weight: bold">0</span>';
                            }
                            
                            const updatedProductStockEl = document.querySelector('.searchInfor-item__productStock-title');
                            
                            const btnLi = document.querySelector('.searchInfor-item__addCartBtn-js').closest('.searchInfor-item__level2');
                            if (btnLi) {
                                const storeLi = document.createElement('li');
                                storeLi.className = 'searchInfor-item__level2 searchInfor-item__level2-storeSelect';
                                storeLi.style.display = 'flex';
                                storeLi.style.alignItems = 'center';
                                storeLi.style.marginTop = '15px';
                                
                                const label = document.createElement('span');
                                label.textContent = 'Mua hàng tại: ';
                                label.style.marginRight = '10px';
                                label.style.fontWeight = 'bold';
                                label.style.fontSize = '14px';
                                
                                const select = document.createElement('select');
                                select.style.padding = '8px 10px';
                                select.style.borderRadius = '4px';
                                select.style.border = '1px solid var(--primary-color)';
                                select.style.outline = 'none';
                                select.style.cursor = 'pointer';
                                select.style.flex = '1';
                                select.style.fontSize = '13px';
                                select.style.backgroundColor = '#fff';
                                
                                availableStores.forEach(tk => {
                                    const option = document.createElement('option');
                                    option.value = tk.SOLUONG_TON;
                                    const shortName = tk.TENCUAHANG.replace('Dola Bakery - ', '').replace('Givral Bakery - ', '');
                                    option.textContent = `${shortName} (Còn ${tk.SOLUONG_TON})`;
                                    select.appendChild(option);
                                });
                                
                                select.addEventListener('change', (e) => {
                                    const newMax = parseInt(e.target.value);
                                    if (searchInfoList) searchInfoList.dataset.soluong = newMax;
                                    
                                    const qtyEl = document.querySelector('.CustomizeQuantity-number-js');
                                    if (qtyEl && parseInt(qtyEl.textContent) > newMax) {
                                        qtyEl.textContent = newMax;
                                    }
                                    
                                    if (updatedProductStockEl) {
                                        updatedProductStockEl.textContent = newMax;
                                    }
                                });
                                
                                if (searchInfoList) searchInfoList.dataset.soluong = availableStores[0].SOLUONG_TON;
                                if (updatedProductStockEl) updatedProductStockEl.textContent = availableStores[0].SOLUONG_TON;
                                
                                storeLi.appendChild(label);
                                storeLi.appendChild(select);
                                btnLi.after(storeLi);
                            }
                        } else {
                            const productStockContainer = document.querySelector('.searchInfor-item__productStock');
                            if (productStockContainer && !productStockContainer.querySelector('.searchInfor-item__productStock-title')) {
                                productStockContainer.innerHTML = 'Kho: <span class="searchInfor-item__productStock-title" style="font-weight: bold">0</span>';
                            }
                            if (searchInfoList) searchInfoList.dataset.soluong = 0;
                            const updatedProductStockEl = document.querySelector('.searchInfor-item__productStock-title');
                            if (updatedProductStockEl) updatedProductStockEl.textContent = 0;
                        }
                    } else {
                        const productStockContainer = document.querySelector('.searchInfor-item__productStock');
                        if (productStockContainer && !productStockContainer.querySelector('.searchInfor-item__productStock-title')) {
                            productStockContainer.innerHTML = 'Kho: <span class="searchInfor-item__productStock-title" style="font-weight: bold">0</span>';
                        }
                        if (searchInfoList) searchInfoList.dataset.soluong = soluong;
                        const updatedProductStockEl = document.querySelector('.searchInfor-item__productStock-title');
                        if (updatedProductStockEl) updatedProductStockEl.textContent = soluong;
                    }
                    
                    // Reset số lượng về 1 khi mở modal
                    const quantityEl = document.querySelector('.CustomizeQuantity-number-js');
                    if (quantityEl) quantityEl.textContent = "1";
                    
                    if (searchInfoList) {
                        searchInfoList.dataset.masp = masp;
                        searchInfoList.dataset.soluong = soluong; // Lưu lại số lượng tồn kho để check
                    }
                }

                if(modal) modal.style.display = 'block';
                if(searchInfor) searchInfor.style.display = 'flex';
                const searchInfoList = document.querySelector('.searchInfor-list-js');
                if (searchInfoList) searchInfoList.style.display = 'flex';
            }
            
            // Xử lý tăng/giảm số lượng trong Modal
            if (e.target.closest('.CustomizeQuantity-add-js') || e.target.closest('.CustomizeQuantity-remove-js')) {
                e.preventDefault();
                const searchInfoList = document.querySelector('.searchInfor-list-js');
                const quantityEl = document.querySelector('.CustomizeQuantity-number-js');
                
                if (quantityEl && searchInfoList) {
                    let currentQty = parseInt(quantityEl.textContent) || 1;
                    const maxStock = parseInt(searchInfoList.dataset.soluong) || 0;
                    
                    if (e.target.closest('.CustomizeQuantity-add-js')) {
                        if (currentQty < maxStock) {
                            quantityEl.textContent = currentQty + 1;
                        } else {
                            toast.warning(`Chỉ còn lại ${maxStock} sản phẩm trong kho!`);
                        }
                    } else if (e.target.closest('.CustomizeQuantity-remove-js')) {
                        if (currentQty > 1) {
                            quantityEl.textContent = currentQty - 1;
                        }
                    }
                }
            }

            // Exit Add Cart
            if (e.target.closest('.addCart-item__exit-js') || e.target.closest('.addCart-item__continueBuy')) {
                if(addCart) addCart.style.display = 'none';
                if(modal) modal.style.display = 'none';
            }

            // Exit Search Info
            if (e.target.closest('.searchInfor-list__level2-exit-js')) {
                if(searchInfor) searchInfor.style.display = 'none';
                if(modal) modal.style.display = 'none';
            }

            // Click Overlay to close all
            if (e.target.matches('.modal__overlay') || e.target.matches('.modal-overlay-js')) {
                if(modalSearch) modalSearch.style.display = 'none';
                if(menuBar) menuBar.style.display = 'none';
                if(addCart) addCart.style.display = 'none';
                if(searchInfor) searchInfor.style.display = 'none';
                if(modal) modal.style.display = 'none';
            }

            // Add to wishlist — click vào li.product-bestSale__tag-icon--noLike-js hoặc li.product-sale__tag-icon--noLike-js
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
                        await addToWishlist(masp);
                        toast.success("Đã thêm vào danh sách yêu thích!");
                        const wl = await getWishlist();
                        document.querySelectorAll('#wishlist-count').forEach(el => el.textContent = wl.length);
                        document.dispatchEvent(new Event('wishlistUpdated'));
                        // Toggle icon: ẩn noLike, hiện Like
                        liNoLike.style.display = 'none';
                        const liLike = liNoLike.nextElementSibling;
                        if (liLike) liLike.style.display = 'inline-flex';
                    } catch(err) {
                        console.error(err);
                        toast.info("Sản phẩm đã có trong danh sách yêu thích.");
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
            <div className="modal__body modal__body-js">
                <div className="exit-btn exit-btn-js" onClick={closeAllModals}>
                    <i className="exit-icon fa-solid fa-xmark"></i>
                </div>

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
                                    <label htmlFor="search-input" className="search-item-icon" onClick={handleSearchSubmit} style={{cursor: "pointer"}}>
                                        <i className="search-icon fa-solid fa-magnifying-glass"></i> 
                                    </label>
                                </li>
                                <p className="exit-btn exit-btn-js" onClick={closeAllModals}>
                                    <i className="exit-icon fa-solid fa-xmark"></i>
                                </p>
                            </ul>
                        </div> 
                    </div>
                </div>

                {/* Modal Add to Cart Success */}
                <div className="grid">
                    <div className="row">
                        <div className="addCart addCart-js">
                            <ul className="addCart-list addCart-list-js">
                                <li className="addCart-item">
                                    <div className="addCart-item__title">
                                        <i className="addCart-item__title-check-icon fa-regular fa-circle-check"></i>
                                        Thêm vào giỏ hàng thành công
                                    </div>
                                    <span className="addCart-item__exit-icon addCart-item__exit-icon-js" onClick={closeAllModals}>
                                        <i className="fa-solid fa-xmark"></i>
                                    </span>
                                </li>
                                <li className="addCart-item addCart-item-js">
                                    <div className="addCart-item__img">
                                        <img src="" alt="" className="addCart-item-img addCart-item-img-js" />
                                    </div>
                                    <div className="addCart-item__content">
                                        <p className="addCart-item__name addCart-item__name-js"></p>
                                        <p className="addCart-item__price addCart-item__price-js"></p>
                                    </div>
                                </li>
                                <li className="addCart-item">
                                    <Link to="/gio-hang" className="addCart-item__viewCart" onClick={closeAllModals}>Xem giỏ hàng</Link>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Modal Search Quick View (Product Detail Modal) */}
                <div className="grid">
                    <div className="row">
                        <div className="searchInfor searchInfor-js">
                            <div className="col-12">
                                <ul className="searchInfor-list searchInfor-list-js">
                                    <li className="searchInfor-item col-lg-6 col-md-6 col-12">
                                        <ul className="searchInfor-list__level2-img">
                                            <li className="searchInfor-item__level2-img">
                                                <div className="searchInfor-item__level2-imgMain">
                                                    <img id="largeImage" src="" alt="Large Image" />
                                                </div>
                                            </li>
                                        </ul>
                                    </li>
                                    <li className="searchInfor-item col-lg-6 col-md-6 col-12">
                                        <ul className="searchInfor-list__level2">
                                            <li className="searchInfor-item__level2">
                                                <h3 className="searchInfor-item__name searchInfor-item__name-js"></h3>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <span className="searchInfor-item__thuonghieu">Thương hiệu: <span className="searchInfor-item__thuonghieu-name">Givral Bakery</span></span>
                                                <span className="searchInfor-item__tinhtrang">Tình trạng: <span className="searchInfor-item__tinhtrang-name">Còn hàng</span></span>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__price">
                                                    <span className="searchInfor-item__priceSale searchInfor-item__priceSale-js"></span>
                                                    <span className="searchInfor-item__priceOld searchInfor-item__priceOld-js"></span>
                                                </div>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="CustomizeQuantity">
                                                    <div className="CustomizeQuantity-btn CustomizeQuantity-decrement-js">-</div>
                                                    <div className="CustomizeQuantity-number CustomizeQuantity-number-js">1</div>
                                                    <div className="CustomizeQuantity-btn CustomizeQuantity-increment-js">+</div>
                                                </div>
                                                <div className="searchInfor-item__addCart">
                                                    <button className="searchInfor-item__addCartBtn searchInfor-item__addCartBtn-js">
                                                        Thêm vào giỏ hàng
                                                    </button>
                                                </div>
                                            </li>
                                            <span className="searchInfor-list__level2-exit searchInfor-list__level2-exit-js" onClick={closeAllModals}>
                                                <i className="searchInfor-list__level2-exit-icon fa-solid fa-xmark"></i>
                                            </span>
                                        </ul>
                                    </li>
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
                            <Link to="/" className="mobile-nav-link" onClick={closeAllModals}>
                                Trang chủ
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/gioi-thieu" className="mobile-nav-link" onClick={closeAllModals}>
                                Giới thiệu
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Link to="/san-pham" className="mobile-nav-link" onClick={closeAllModals} style={{ flex: 1, borderBottom: 'none' }}>
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
                                        <Link to="/san-pham?search=b%C3%A1nh+kem" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh kem sinh nhật
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?search=mousse" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh Mousse & Cheesecake
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?search=b%C3%A1nh+m%C3%AC" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh mì tươi
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/san-pham?search=trung+thu" className="mobile-subnav-link" onClick={closeAllModals}>
                                            • Bánh Trung thu
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/tin-tuc" className="mobile-nav-link" onClick={closeAllModals}>
                                Tin tức
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/lien-he" className="mobile-nav-link" onClick={closeAllModals}>
                                Liên hệ
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/he-thong-cua-hang" className="mobile-nav-link" onClick={closeAllModals}>
                                Hệ thống cửa hàng
                            </Link>
                        </li>
                        <li className="mobile-nav-item">
                            <Link to="/cau-hoi-thuong-gap" className="mobile-nav-link" onClick={closeAllModals}>
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
        </div>
        </>
    );
};

export default Modal;
