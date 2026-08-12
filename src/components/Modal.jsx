import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from './Toast/Toast';

const Modal = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const toast = useToast();

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
                                    const shortName = tk.TENCUAHANG.replace('Dola Bakery - ', '');
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

        // Initialize header counters
        import('../services/wishlistService.js').then(async m => {
            try {
                const wl = await m.getWishlist();
                const countEls = document.querySelectorAll('#wishlist-count');
                countEls.forEach(el => el.textContent = wl.length);
            } catch(e) {}
        });

        import('../services/cartService.js').then(async m => {
            try {
                const cart = await m.getCart();
                const cartCountEls = document.querySelectorAll('#cart-count');
                cartCountEls.forEach(el => el.textContent = cart.length);
            } catch(e) {}
        });

        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, []);

    return (
        <>
        <div className="modal modal-js" style={{ display: "none" }}>
            <div className="modal__overlay modal-overlay-js">           
        
                <div className="modal__body modal__body-js">

                    
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
                                    <p className="exit-btn exit-btn-js">
                                        <i className="exit-icon fa-solid fa-x"></i>
                                    </p>
                                </ul>
                                    
                            </div> 
                        </div>
                    </div>

                    
                    <div className="grid">
                        <div className="row">
                            <div className="addCart addCart-js">
                                <ul className="addCart-list addCart-list-js">
                                    <li className="addCart-item">
                                        <div className="addCart-item__title">
                                            <i className="addCart-item__title-check-icon fa-regular fa-circle-check"></i>
                                            Thêm vào giỏ hàng thành công
                                        </div>
                                        <div className="addCart-item__exit addCart-item__exit-js">
                                            <i className="addCart-item__exit-icon fa-solid fa-xmark"></i>
                                        </div>
                                    </li>
                                    <li className="addCart-item">
                                        <div className="addCart-item__img-block">
                                            <img id="largeImageaddCart" src="../../assets/IMG/productSale_1.webp" alt="" className="addCart-item__img" />
                                        </div>
                                        <div className="addCart-item__des-product">
                                            <div className="addCart-item__name">Bánh Sừng Bò Mini</div>
                                            <div className="addCart-item__price">36.000₫</div>
                                        </div>
                                    </li>
                                    <li className="addCart-item">
                                        <div className="addCart-item__des addCart-item__des-js">
                                            <span>
                                                Giỏ hàng của bạn hiện có <span className="highligh">0</span> sản phẩm</span>
                                        </div>
                                        <div className="addCart-item__btn">
                                            <div className="addCart-item__continueBuy" style={{cursor: "pointer"}}>
                                                Tiếp tục mua hàng
                                            </div>
                                            <div className="addCart-item__payNow">
                                                <Link to="/gio-hang" className="addCart-item__payNow-link" onClick={() => document.querySelector('.Modal-addCart-js').style.display = 'none'}>
                                                    Xem giỏ hàng
                                                </Link>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    
                    <div className="grid">
                        <div className="row">
                            <div className="searchInfor searchInfor-js">
                                <ul className="searchInfor-list searchInfor-list-js">
                                    <li className="searchInfor-item">
                                        <div className="searchInfor-item__IMG">
                                                <img id="largeImage" src="../../assets/IMG/productSale_1.webp" alt="" className="searchInfor-img  " />
                                                <ul className="searchInfor-item__IMG-option">
                                                    <li className="searchInfor-item__IMG-option-item">
                                                        <img src="../../assets/IMG/productSale_1.webp" alt="" className="searchInfor-item__IMG-option-item-img searchInfor-item__IMG-option-item-img-js" onClick={() => {}} />
                                                    </li>
                                                    <li className="searchInfor-item__IMG-option-item">
                                                        <img src="../../assets/IMG/productInfor0.webp" alt="" className="searchInfor-item__IMG-option-item-img searchInfor-item__IMG-option-item-img1-js" onClick={() => {}} />
                                                    </li>
                                                </ul>
                                        </div>
                                    </li>
                                    <li className="searchInfor-item">
                                        <ul className="searchInfor-list__level2">
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__name searchInfor-item__name-js">Bánh Sừng Bò Mini</div>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__productStatus">
                                                    Tình trạng: <span className="searchInfor-item__productStatus-title">Còn hàng</span>
                                                </div>
                                                <div className="searchInfor-item__productStock" style={{marginLeft: "15px"}}>
                                                    Kho: <span className="searchInfor-item__productStock-title" style={{fontWeight: "bold"}}>0</span>
                                                </div>
                                                <div className="searchInfor-item__productCode">
                                                    Mã sản phẩm: <span className="searchInfor-item__productCode-title">Đang cập nhật</span>
                                                </div>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__priceSale searchInfor-item__priceSale-js">36.000₫</div>
                                                <div className="searchInfor-item__priceOriginal searchInfor-item__priceOriginal-js">40.000₫</div>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__productInfor">Thông tin sản phẩm đang cập nhật</div>
                                            </li>
                                            <li className="searchInfor-item__level2">
                                                <div className="searchInfor-item__productQuantity">
                                                    <span className="searchInfor-item__productQuantity-number">Số lượng:</span>
                                                    <ul className="CustomizeQuantity">
                                                        <li className="CustomizeQuantity-remove CustomizeQuantity-remove-js" style={{cursor: "pointer"}}>
                                                            <i className="CustomizeQuantity-icon fa-solid fa-minus"></i>
                                                        </li>
                                                        <li className="CustomizeQuantity-number CustomizeQuantity-number-js">1</li>
                                                        <li className="CustomizeQuantity-add CustomizeQuantity-add-js" style={{cursor: "pointer"}}>
                                                            <i className="CustomizeQuantity-icon fa-solid fa-plus"></i>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </li>
                                            <li className="searchInfor-item__level2" style={{ display: 'flex', gap: '10px' }}>
                                                <div className="searchInfor-item__addCartBtn searchInfor-item__addCartBtn-js" style={{ flex: 1 }}>Thêm Vào Giỏ Hàng</div>
                                                <div 
                                                    className="searchInfor-item__viewReviewBtn searchInfor-item__viewReviewBtn-js" 
                                                    style={{ flex: 1, backgroundColor: '#f39c12', color: '#fff', textAlign: 'center', lineHeight: '45px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
                                                    onClick={() => {
                                                        const modalSearchInfo = document.querySelector('.searchInfor-list-js');
                                                        const masp = modalSearchInfo?.dataset?.masp;
                                                        if (masp) {
                                                            navigate(`/san-pham/${masp}`);
                                                            document.querySelector('.modal-js').style.display = 'none';
                                                        }
                                                    }}
                                                >
                                                    Xem đánh giá
                                                </div>
                                            </li>
                                            <span className="searchInfor-list__level2-exit searchInfor-list__level2-exit-js">
                                                <i className="searchInfor-list__level2-exit-icon fa-solid fa-x"></i>
                                            </span>
                                        </ul>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                    
                <div className="grid">
                    <div className="row" >
                        <div className="Modal-MenuMobile-block Modal-MenuMobile-block-js" style={{ flexDirection: "column" }}>
                                    <div className="Modal-MenuMobile-block__header">
                                        <div>
                                            <Link to="/dang-ky" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Đăng ký</Link>
                                        </div>
                                        <div>
                                            <Link to="/dang-nhap" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Đăng nhập</Link>
                                        </div>
                                        <div>
                                            <Link to="/" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Menu chính</Link>
                                        </div>
                                    </div>
                                    <div className="Modal-MenuMobile-block__content" style={{ padding: "0 8px" }}>
                                        <ul className="Modal-MenuMobile-block__content-list" style={{ borderBottom: "1px solid var(--primary-color)" }}>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Trang chủ</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/gioi-thieu" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Giới thiệu</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/san-pham" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Sản phẩm</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/tin-tuc" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Tin tức</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/lien-he" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Liên hệ</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/he-thong-cua-hang" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Hệ thống cửa hàng</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/Cau-hoi-thuong-gap" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Câu hỏi thường gặp</Link>
                                            </li>
                                        </ul>
                                        <ul className="Modal-MenuMobile-block__content-list">
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/yeu-thich" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Sản phẩm yêu thích</Link>
                                            </li>
                                            <li className="Modal-MenuMobile-block__content-item">
                                                <Link to="/gio-hang" className="Modal-MenuMobile-block__content-item-link" onClick={() => document.querySelector('.Modal-MenuMobile-js').style.display = 'none'}>Danh sách giỏ hàng</Link>
                                            </li>
                                        </ul>
                                    </div>
                        </div>
                        
                    </div>
                </div>
            </div>
       </div>
    
        </>
    );
};

export default Modal;
