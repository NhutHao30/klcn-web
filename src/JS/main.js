
const btnExit = document.querySelector('.exit-btn-js');
const modal = document.querySelector('.modal-js');
const modalBody = document.querySelector('.modal__body-js')
const btnSearch = document.querySelector('.search-btn-js');
const modalSearch = document.querySelector('.Modal-Search-js');
const overlay = document.querySelector('.modal-overlay-js');
const subnav = document.querySelector('.subnav-js');
const fatSubnav = document.querySelector('.nav-item-level2-js');
const slideShows = document.querySelectorAll('.header-img-js');
const saleOf = document.querySelector('.saleOf-list-js');
const divElement = document.querySelector('.addCart-item__des');
const exitAddCart = document.querySelector('.addCart-item__exit-js')
const addCart = document.querySelector('.addCart-js')
const searchInfor = document.querySelector('.searchInfor-js')
const exitSearchIfor = document.querySelector('.searchInfor-list__level2-exit-js')
const formCustomize = document.querySelectorAll('.CustomizeQuantity-js');
const addCartBtn = document.querySelector('.searchInfor-item__addCartBtn-js')
const addCartList = document.querySelector('.addCart-list-js')
const searchInfoList = document.querySelector('.searchInfor-list-js')
const continueBtn = document.querySelector('.addCart-item__continueBuy')
const contentBannerImg = document.querySelector('.content-banner-img-js')
const social_img = document.querySelectorAll('.social-img-item__img-js')
const social_icon = document.querySelectorAll('.imgIcon-block-js')
const menuBtnMb = document.querySelector('.menuBars')
const menuBar = document.querySelector('.Modal-MenuMobile-block-js')
    
start()

function start() {
    addEvents()
    cursor()
    handleNumberQuantity()
    slideShow ()
    scrollNav()
    addFavoriteProducts()
    showAddCart()
    showSearchInfor()
    handleCroll_PSale()
    likeMenuProduct()
    handleHoverOurTeam()
    handlepassWordForget()
    handleMenuProduct()
    scrollSubnav()
    updateCartCount()
    // showMobileMenu()
    // modal.style.display='none';
    // addToCart(product)
}

// like menuProduct
function likeMenuProduct() {
    const menuProduct_iconLikes = document.querySelectorAll('.menuProduct-item_iconLike-level3-js');
    const menuProductitemiconLikes = document.querySelectorAll('.menuProduct-item_iconLike-js');
    for(let id = 0; id < menuProduct_iconLikes.length; id++) {
        menuProduct_iconLikes[id].onclick = () => {
            if (menuProductitemiconLikes[id].style.color === 'rgb(255, 0, 0)') {
                menuProductitemiconLikes[id].style.color = ''; // Màu mặc định
            } else {
                menuProductitemiconLikes[id].style.color = '#ff0000'; // Đổi sang đỏ
            }
        }
    }
}

// AddEvents
function addEvents() {
    // fatSubnav.addEventListener('mouseenter', showSubnav)
    // fatSubnav.addEventListener('mouseleave', hideSubnav)
    // btnSearch.addEventListener('click', showModalSearch);
    // btnExit.addEventListener('click', hideModalSearch);
    // overlay.addEventListener('click', hideModalSearch); 
    // exitAddCart.addEventListener('click', hideAddCart);
    // overlay.addEventListener('click', hideAddCart); 
    // overlay.addEventListener('click', hideMobileMenu); 
    // addCart.addEventListener('click', hideAddCart);
    // overlay.addEventListener('click', hideSearchInfor);
    // searchInfor.addEventListener('click', hideSearchInfor); 
    // exitSearchIfor.addEventListener('click', hideSearchInfor);
    // menuBtnMb.addEventListener('click', showMobileMenu)
    // contentBannerImg.addEventListener('mouseenter', handleContentBanner)
    
//     menuBar.addEventListener('click', (e) => {
//         e.stopPropagation();
//         e.defaultPrevented();
//     })
//    addCartList.addEventListener('click', (e) => {
//         e.stopPropagation();
//     })

//     searchInfoList.addEventListener('click', (e) => {
//         e.stopPropagation();
//     })
}

// cursor
function cursor() {
    // // saleOf.style.animation = 'none';
    // exitSearchIfor.style.cursor = 'pointer';
    // // btnReduce.style.cursor = 'pointer';
    // // btnIncrease.style.cursor = 'pointer';
    // addCartBtn.style.cursor = 'pointer';
    // btnSearch.style.cursor = 'pointer';
    // btnExit.style.cursor = 'pointer';
    // exitAddCart.style.cursor = 'pointer';
    // continueBtn.style.cursor = 'pointer';
}

function showSubnav() {
    subnav.style.display = 'flex';
    subnav.style.animation = 'none';
    void subnav.offsetWidth; 
    subnav.style.animation = 'fadeIn linear 0.3s forwards';
}

//hide Subnav
function hideSubnav () {  
    subnav.style.display = 'none';
}

// tắt modal search
function hideModalSearch() {    
        modalSearch.style.display = 'none';
        modal.style.display = 'none';
}

// bật modal search
function showModalSearch() {
    searchInfor.style.display = 'none';
    addCart.style.display = 'none';
    modalSearch.style.display = 'block';
    modal.style.display = 'block';

    // Thay đổi animation trước khi bắt đầu
    modalSearch.style.animation = 'none'; // Đặt lại animation trước

    // Tái render để khởi động lại animation
    void modalSearch.offsetWidth; // Tái render để khởi động lại animation

    modalSearch.style.animation = 'slideIn linear 0.5s forwards';
    // Thực hiện animation
}

function slideShow () {
    if(slideShows.length == 0) {
        return 0;
    }
    let current = 0;
    setInterval(function () {
        
        slideShows[current].style.display = 'none';


        current++;
        if (current >= slideShows.length) {
            current = 0;
        }
        slideShows[current].style.display = 'block';



        

        // Thêm class 'flip' để tạo hiệu ứng xoay
        saleOf.classList.add('flip');

         // Sau 2s (thời gian animation), xóa class để có thể thêm lại lần sau
         setTimeout(() => {
            saleOf.classList.remove('flip');
        }, 2000);
    }, 3000);
}

function scrollSubnav() {
    const crollSubnavBtn = document.querySelectorAll(".nav-item__sub-item-js");
    const subNavBlock = document.querySelector(".nav-list-level2-js");

    // let scrollAmount = 0;
    // const scollDefault = 45;
    const scrollStep = 250; // Số pixel di chuyển mỗi lần bấm

    if(!crollSubnavBtn) return;
    
    // crollSubnavBtn[0].addEventListener('click',() => {
    //     subNavBlock.scrollLeft -= scrollStep;
    // })

    // crollSubnavBtn[1].addEventListener('click',() => {
    //     subNavBlock.scrollLeft += scrollStep;
    // })
}

function scrollNav() {
    
    window.addEventListener('scroll', () => {
    const navigation = document.querySelector('.navigation-js')
    const scrollPosition = window.scrollY
    const heightNavigation = navigation.clientHeight
    if (scrollPosition > heightNavigation) {
        navigation.classList.add('navigation-croll');
        navigation.style.animation= 'navigationA 0.6s linear';
        navigation.style.backgroundColor= 'rgba(0, 0, 0, 0.6)';
    } else {
        navigation.classList.remove('navigation-croll');
        navigation.style.backgroundColor= 'transparent';
        navigation.style.animation= '';
        }
    })
}

function addFavoriteProducts() {
    const noLikes = document.querySelectorAll('.product-sale__tag-icon--noLike-js')
    const Likes = document.querySelectorAll('.product-sale__tag-icon--Like-js')
    
    for(let id = 0; id < noLikes.length; id++) {
        noLikes[id].addEventListener('click', () => {
            noLikes[id].style.display = 'none';
            Likes[id].style.display = 'inline-flex';
        })//(id)
    }
    for(let id = 0; id < Likes.length; id++) {
        Likes[id].addEventListener('click', () => {
            Likes[id].style.display = 'none';
            noLikes[id].style.display = 'inline-flex';
        })//(id)
    }
}

function hideAddCart() {
    addCart.style.display = 'none';
    modal.style.display = 'none';
}

function showAddCart() { 
    const tagCartItem = document.querySelectorAll('.product-sale-tag-item-2-cart-js')
    for(let id = 0; id < tagCartItem.length; id++) {
        tagCartItem[id].addEventListener('click', () => {
            modal.style.display = 'block';
            addCart.style.display = 'flex';
            searchInfor.style.display = 'none';
        })
    }
}

function showMobileMenu() {
    console.log('bật')
        modal.style.display = 'block' ;
        menuBar.style.display = 'flex';
}

function hideMobileMenu() {
    console.log('tắt')
        modal.style.display = 'none';
        menuBar.style.display = 'none';
}

function hideSearchInfor() {
    modal.style.display = 'none';
    searchInfor.style.display = 'none';
}

function showSearchInfor() { 
    const imageUrls = [];
    const images = document.querySelectorAll('.product-sale_img-js')
    // Lặp qua từng phần tử đã chọn và lấy URL
    images.forEach(image => {
        const url = image.src
        // Thêm URL vào mảng
        imageUrls.push(url)
    })

    const nameProductarray = []
    const nameProducts = document.querySelectorAll('.product-sale__name-js')
    // Lặp qua từng phần tử đã chọn và lấy tên sản phẩm
    nameProducts.forEach(nameProduct => {
        const nameP = nameProduct.textContent.trim()
        // Thêm name vào mảng
        nameProductarray.push(nameP)
    })

    const priceOriginalProductarray = []
    const priceOriginalProducts = document.querySelectorAll('.product-sale__price-original-js')
    // Lặp qua từng phần tử đã chọn và lấy tên sản phẩm
    priceOriginalProducts.forEach(priceOriginalProduct => {
        const priceOriginalP = priceOriginalProduct.textContent.trim()
        // Thêm name vào mảng
        priceOriginalProductarray.push(priceOriginalP)
    })

    const priceSaleProductarray = []
    const priceSaleProducts = document.querySelectorAll('.product-sale__price-sale-js')
    // Lặp qua từng phần tử đã chọn và lấy tên sản phẩm
    priceSaleProducts.forEach(priceSaleProduct => {
        const priceSaleP = priceSaleProduct.textContent.trim()
        // Thêm name vào mảng
        priceSaleProductarray.push(priceSaleP)
    })

    const tagCSearchItem = document.querySelectorAll('.product-sale-tag-item-2-search-js')
    for(let id = 0; id < tagCSearchItem.length; id++) {
        tagCSearchItem[id].addEventListener('click', () => {
            modal.style.display = 'block';
            searchInfor.style.display = 'flex';
            searchInfoList.style.display = 'flex'; 
            document.getElementById('largeImage').src = imageUrls[id]; //sửa src của ảnh
            document.querySelector('.searchInfor-item__IMG-option-item-img-js').src = imageUrls[id];
            document.querySelector('.searchInfor-item__IMG-option-item-img1-js').src = `./assets/IMG/productInfor${id}.webp`;
            document.querySelector('.searchInfor-item__name-js').textContent = nameProductarray[id]
            document.querySelector('.searchInfor-item__priceOriginal-js').textContent = priceOriginalProductarray[id]
            document.querySelector('.searchInfor-item__priceSale-js').textContent = priceSaleProductarray[id]
        })
    }
}

function handleNumberQuantity() {
    for(let i = 0; i< formCustomize.length; i++) {     
        const btnReduce = formCustomize[i].querySelector('.CustomizeQuantity-remove-js');
        const btnIncrease = formCustomize[i].querySelector('.CustomizeQuantity-add-js');
        const quanlityDisplay = formCustomize[i].querySelector('.CustomizeQuantity-number-js');
        
        let quantity = 1;
        btnReduce.addEventListener('click', () => {
        if (quantity > 1) {
            quantity--;
            quanlityDisplay.innerText = quantity;
            console.log(quantity);
            }
        })
        btnIncrease.addEventListener('click', () => {
        quantity++;
        quanlityDisplay.innerText = quantity;
        console.log(quantity);
        })
    }
    
}

// change img
function changeImage(imageSrc) {
    document.getElementById('largeImage').src = imageSrc; //sửa src của ảnh
    document.getElementById('largeImageaddCart').src = imageSrc; //sửa src của ảnh
}

function handleCroll_PSale() {
    const crollBtn = document.querySelector('.crollBtn-js');
    const prevBtn = document.querySelector('.prevBtn-js');
    const nextBtn = document.querySelector('.nextBtn-js');
    const productSaleList = document.querySelector('.product-sale-list-level-2-js');
    const productSaleItem = document.querySelector('.product-sale-item-level2');

    if (!prevBtn || !nextBtn || !crollBtn || !productSaleList || !productSaleItem) return;

    // Thêm hiệu ứng chuyển động mượt
    productSaleList.style.transition = 'transform 0.3s ease';

    prevBtn.style.cursor = 'pointer';
    nextBtn.style.cursor = 'pointer';

    let scrollAmount = 0;
    const scrollStep = productSaleItem.clientWidth;

    function updateButtonState() {
        if(screen.innerWidth <= 768) {
            prevBtn.style.display = 'block';
            crollBtn.style.justifyContent = 'space-between';
        }
        else if (scrollAmount === 0) {
            prevBtn.style.display = 'none';
            crollBtn.style.justifyContent = 'flex-end';
        } else {
            prevBtn.style.display = 'block';
            crollBtn.style.justifyContent = 'space-between';
        }
    }

    function updateScrollPosition() {
        if (scrollAmount == 0) {
            // kích thước màn hình PC
            if (screen.width >= 1024) {
                productSaleList.style.transform = `translateX(20px)`;
            }
            // kích thước màn hình Tablet
            else if (screen.width >= 768 && screen.width <= 1024) {
                productSaleList.style.transform = `translateX(164px)`;
            } 
            // kích thước màn hình Mobile
            else {
                productSaleList.style.transform = `translateX(136px)`;
            }
        } else {
            productSaleList.style.transform = `translateX(-${scrollAmount}px)`;
        }
    }

    // Trường hợp mobile: xử lý cuộn bằng cách hoán đổi DOM
    function handleMobileScroll(direction) {


        const items = Array.from(productSaleList.children);
        if (items.length === 0) return;

        if (direction === 'next') {
            const firstItem = items[0];
            productSaleList.appendChild(firstItem);
        } else if (direction === 'prev') {
            const lastItem = items[items.length - 1];
            productSaleList.prepend(lastItem);
        }
    }

    // Sự kiện click cho nút next
    nextBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            handleMobileScroll('next');
        } else {
            const maxScroll = productSaleList.scrollWidth - productSaleList.clientWidth + 220;
            if (scrollAmount < maxScroll) {
                scrollAmount += scrollStep;
            }
            updateScrollPosition();
            updateButtonState();
        }
    });

    // Sự kiện click cho nút prev
    prevBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            handleMobileScroll('prev');
        } else {
            if (scrollAmount > 0) {
                scrollAmount -= scrollStep;
            }
            updateScrollPosition();
            updateButtonState();
        }
    });

    // Trạng thái ban đầu
    updateScrollPosition();
    updateButtonState();
}

function socialImg_hover() {
    social_img.addEventListener('mouseenter', () => {
        social_icon.style.display = 'block';
    })
}

//our team
function handleHoverOurTeam() {
    const ourTeamItem = document.querySelectorAll('.content-ourTeam-item-js')
    const ourTeamDes = document.querySelectorAll('.content-ourTeam-des-js')
    const ourTeamConTact = document.querySelectorAll('.content-ourTeam-contact-js')

    for (let i = 0; i < ourTeamItem.length; i++) {
        ourTeamItem[i].addEventListener('mouseenter', () => {
            ourTeamDes[i].style.top = '-100%';
            ourTeamConTact[i].style.top = '0';
        })
        
        ourTeamItem[i].addEventListener('mouseleave', () => {
            ourTeamDes[i].style.top = '0';
            ourTeamConTact[i].style.top = '100%';
        })
    }
}

function handlepassWordForget() {
    const forgePassBtn = document.querySelector('.passwordForget-js')
    const forgePassForm = document.querySelector('.passwordForgetForm-js')
    const loginForm = document.querySelector('.Login-list-js')

    if(!forgePassBtn || !forgePassForm || !loginForm) {
        return 0;
    }

    forgePassBtn.addEventListener('click', () => {
        if(forgePassForm.style.height == '95px') {
            forgePassForm.style.height = '0'
            loginForm.style.height = '360px'        
        } else {
            forgePassForm.style.height = '95px';
            forgePassForm.style.marginBottom = '10px';
            loginForm.style.height = '460px'        
        }  
    })
}

function handleMenuProduct() {
    const menuProduct = document.querySelectorAll('.product-all__menu-item');
    
    
    if(!menuProduct) {
        return 0;
    }

    for(let i = 0; i < menuProduct.length; i++) {
        const div_menuProduct = menuProduct[i].querySelectorAll('div');
        const menuProduct_firstItem = div_menuProduct[0];
        const menuProduct_lastItem = div_menuProduct[1];
        const menuProduct_icon = menuProduct_firstItem.querySelector('i');

        if(!menuProduct_firstItem || !menuProduct_lastItem || !menuProduct_icon) return 0;

        menuProduct_firstItem.addEventListener('click', () => {
            const isOpen = menuProduct_lastItem.style.height === `${menuProduct_lastItem.scrollHeight}px`;
        
            const firstItemHeight = menuProduct_firstItem.scrollHeight;
            const lastItemHeight = menuProduct_lastItem.scrollHeight;

            console.log(lastItemHeight);
            console.log(firstItemHeight);
        
            if (isOpen) {
                // Đang mở → thu gọn
                menuProduct_lastItem.style.height = '0';
                menuProduct[i].style.height = `${firstItemHeight}px`;
                menuProduct_icon.style.animation = 'flip 0.3s linear forwards';
        
                setTimeout(() => {
                    menuProduct_icon.classList.replace('fa-minus', 'fa-plus');
                }, 150); // đổi icon sau 50% thời gian
            } else {
                // Đang đóng → mở ra
                menuProduct_lastItem.style.height = `${lastItemHeight}px`;
                menuProduct[i].style.height = `${firstItemHeight + lastItemHeight}px`;
                menuProduct_icon.style.animation = 'noflip 0.3s linear forwards';
        
                setTimeout(() => {
                    menuProduct_icon.classList.replace('fa-plus', 'fa-minus');
                }, 150); // đổi icon sau 50% thời gian
            }
        }); 
    }
}

function ThemVaoGioHang(x) {
    var boxProduct = x.closest('li.product-sale-item-level2');
    var productImg = boxProduct.querySelector('.product-sale_img-js'); // hình
var productName = boxProduct.querySelector('.product-sale__name-js'); // tên
var productPrice = boxProduct.querySelector('.product-sale__price-sale-js'); // giá
    console.log(productName.textContent);

    addToCart(productName.textContent, productPrice.textContent,productImg.src);
}

function addToCart(spName, spPrice, spSrc) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    cart.push({
        name: spName,
        price: spPrice,
        img: spSrc
    });

    localStorage.setItem('cart', JSON.stringify(cart));

    alert("Đã thêm vào giỏ hàng!");
}

window.addEventListener("DOMContentLoaded", () => {

    const cartContainer = document.querySelector('.cart-container');
    
    // if (!cartContainer) {
    //     console.warn("Không tìm thấy phần tử .cart-container trong DOM.");
    //     return; // dừng lại nếu không có phần tử
    // }

    // cartContainer.addEventListener('click', function (event) {
    //   const cart = JSON.parse(localStorage.getItem('cart')) || [];
    //   const target = event.target;
    
    //   if (target.closest('.CustomizeQuantity-add-js') || target.closest('.CustomizeQuantity-remove-js')) {
    //     const productItem = target.closest('.cart-container-detail__product-item');
    //     const index = parseInt(productItem.getAttribute('data-index'));
    
    //     if (index === -1 || isNaN(index)) return;
    
    //     const quantityElem = productItem.querySelector('.CustomizeQuantity-number-js');
    //     let quantity = parseInt(quantityElem.textContent);
    
    //     if (target.closest('.CustomizeQuantity-add-js')) {
    //       quantity++;
    //     } else if (target.closest('.CustomizeQuantity-remove-js')) {
    //       quantity = Math.max(1, quantity - 1);
    //     }
    
    //     quantityElem.textContent = quantity;
    //     cart[index].quantity = quantity;
    //     localStorage.setItem('cart', JSON.stringify(cart));
    //   }
    // });
    
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const productContainer = document.querySelector('.cart-container-detail__product-list');
        if (!productContainer) return;
    });

document.addEventListener("DOMContentLoaded", function () {
    updateCartCount(); // Gọi ngay khi trang tải xong
});

function updateCartCount() {
    const cartList = JSON.parse(localStorage.getItem("cart")) || [];
    const count = cartList.length;
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        cartCountEl.textContent = count;
    }
}

function ThemVaoYeuThich(element) {
    const boxProduct = element.closest('li.product-sale-item-level2');
    const productImg = boxProduct.querySelector('.product-sale_img-js');
    const productName = boxProduct.querySelector('.product-sale__name-js');
    const productPrice = boxProduct.querySelector('.product-sale__price-sale-js');

    if (!productName || !productPrice || !productImg) return;

    const name = productName.textContent.trim();
    const price = productPrice.textContent.trim();
    const img = productImg.src;

    let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];

    const exists = wishlist.some(item => item.name === name);

    if (!exists) {
        wishlist.push({ name, price, img });
        localStorage.setItem('wishlist', JSON.stringify(wishlist));
        alert("Đã thêm vào danh sách yêu thích!");
        updateWishlistCount(); // nếu có hiển thị số lượng
    } else {
        alert("Sản phẩm đã có trong danh sách yêu thích.");
    }
}

function updateWishlistCount() {
    const wishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
    const countEl = document.getElementById("wishlist-count");
    if (countEl) countEl.textContent = wishlist.length;
}

document.addEventListener("DOMContentLoaded", () => {
    updateWishlistCount();
});

document.addEventListener("DOMContentLoaded", function () {
    const filterItems = document.querySelectorAll(".product-all__item-filter-item");
    const productList = document.getElementById("product-list");
    
    if (!productList) return;

    filterItems.forEach(item => {
        item.addEventListener("click", function (e) {
            e.preventDefault();
            const sortType = item.dataset.sort;
            const items = Array.from(productList.querySelectorAll(".product-sale-item-level2"));

            let sortedItems = [];

            switch (sortType) {
                case "az":
                    sortedItems = items.sort((a, b) => {
                        const nameA = a.querySelector(".product-sale__name-js").textContent.trim().toLowerCase();
                        const nameB = b.querySelector(".product-sale__name-js").textContent.trim().toLowerCase();
                        return nameA.localeCompare(nameB);
                    });
                    break;

                case "za":
                    sortedItems = items.sort((a, b) => {
                        const nameA = a.querySelector(".product-sale__name-js").textContent.trim().toLowerCase();
                        const nameB = b.querySelector(".product-sale__name-js").textContent.trim().toLowerCase();
                        return nameB.localeCompare(nameA);
                    });
                    break;

                case "price-asc":
                    sortedItems = items.sort((a, b) => {
                        const priceA = parseInt(a.querySelector(".product-sale__price-sale-js").textContent.replace("₫", "").replace(/\./g, ""));
                        const priceB = parseInt(b.querySelector(".product-sale__price-sale-js").textContent.replace("₫", "").replace(/\./g, ""));
                        return priceA - priceB;
                    });
                    break;

                case "price-desc":
                    sortedItems = items.sort((a, b) => {
                        const priceA = parseInt(a.querySelector(".product-sale__price-sale-js").textContent.replace("₫", "").replace(/\./g, ""));
                        const priceB = parseInt(b.querySelector(".product-sale__price-sale-js").textContent.replace("₫", "").replace(/\./g, ""));
                        return priceB - priceA;
                    });
                    break;
                default:
                    return;
            }

            // Render lại danh sách sau khi sắp xếp
            productList.innerHTML = "";
            sortedItems.forEach(el => productList.appendChild(el));
        });
    });
});


    
    






