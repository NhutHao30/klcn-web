import React, { useEffect, useState } from "react";
import Footer from "../Layout/Footer";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import { addToCart } from "../services/cartService";

// Hàm xử lý đường dẫn ảnh giống Productpage
const getImageSrc = (imageUrl) => {
    if (!imageUrl) return "../../assets/IMG/productnew2.webp";
    if (imageUrl.startsWith("http")) return imageUrl;
    return `../../assets/IMG/${imageUrl.split('/').pop()}`;
};

// Hàm lấy tên sản phẩm (backend trả về nhiều kiểu field)
const getProductName = (product) => {
    if (!product) return "Sản phẩm";
    return product.tenSP || product.TenSP || product.name || "Sản phẩm";
};

// Hàm format giá
const formatPrice = (price) => {
    if (!price) return "0₫";
    return Number(price).toLocaleString('vi-VN') + "₫";
};

const WishlistPage = () => {
    const [wishlistItems, setWishlistItems] = useState([]);

    const loadWishlist = async () => {
        try {
            const items = await getWishlist();
            // items có thể là array hoặc single object
            setWishlistItems(Array.isArray(items) ? items : [items]);
        } catch (e) {
            if (e.response?.status === 401) {
                alert("Vui lòng đăng nhập để xem danh sách yêu thích");
                window.location.href = "/dang-nhap";
            } else {
                console.error(e);
            }
        }
    };

    useEffect(() => {
        loadWishlist();
        const handleUpdate = () => loadWishlist();
        document.addEventListener('wishlistUpdated', handleUpdate);
        return () => document.removeEventListener('wishlistUpdated', handleUpdate);
    }, []);

    const handleRemove = async (masp) => {
        try {
            await removeFromWishlist(masp);
            loadWishlist();
            document.dispatchEvent(new Event('wishlistUpdated'));
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddToCart = async (masp) => {
        try {
            await addToCart(masp, 1);
            alert("Đã thêm vào giỏ hàng!");
            document.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            if (e.response?.status === 401) {
                alert("Vui lòng đăng nhập để thêm vào giỏ hàng");
                window.location.href = "/dang-nhap";
            } else {
                console.error(e);
            }
        }
    };

    return (
        <>
            <main>
                <div className="container mt-30" style={{ marginBottom: "30px" }}>
                    <h2 style={{ textAlign: "center", marginBottom: "20px", color: "var(--primary-color)" }}>
                        Sản Phẩm Yêu Thích
                    </h2>
                    <ul
                        className="row sm-gutter"
                        id="wishlist-container"
                        style={{ listStyle: "none", padding: 0 }}
                    >
                        {wishlistItems.map((item, index) => (
                            <li
                                key={index}
                                data-masp={item.masp}
                                className="product-sale-item-level2 col-lg-3 col-custom col-md-4 col-6"
                            >
                                <div className="product-sale-item__img product-sale-item__img-js">
                                    <img
                                        src={getImageSrc(item.product?.imageUrl || item.product?.HINHANH)}
                                        alt={getProductName(item.product)}
                                        className="product-sale_img product-sale_img-js"
                                    />
                                    <ul className="product-bestSale-tag-list">
                                        <li
                                            className="product-bestSale-tag-item"
                                            onClick={() => handleRemove(item.masp)}
                                            style={{ display: 'inline-flex', cursor: 'pointer' }}
                                            title="Bỏ yêu thích"
                                        >
                                            <i className="product-bestSale__tag-icon--Like fa-solid fa-heart" style={{ color: 'red' }}></i>
                                        </li>
                                    </ul>
                                    <ul className="product-sale-tag-list-2 product-sale-tag-list-2-js">
                                        <li
                                            className="product-sale-tag-item-2 product-sale-tag-item-2-cart-js"
                                            onClick={() => handleAddToCart(item.masp)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className="product-sale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                                        </li>
                                    </ul>
                                </div>
                                <div className="product-sale-item__content">
                                    <a href="#" className="product-sale__name product-sale__name-js" style={{ textDecoration: "none", color: "#333" }}>
                                        {getProductName(item.product)}
                                    </a>
                                    <div className="product-sale__price">
                                        <span className="product-sale__price-sale product-sale__price-sale-js">
                                            {formatPrice(item.product?.price || item.product?.GIABAN)}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                        {wishlistItems.length === 0 && (
                            <div style={{ width: "100%", textAlign: "center", padding: "50px", fontSize: "16px", color: "#888" }}>
                                <i className="fa-regular fa-heart" style={{ fontSize: "48px", marginBottom: "15px", display: "block" }}></i>
                                Chưa có sản phẩm nào trong mục yêu thích.
                            </div>
                        )}
                    </ul>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default WishlistPage;
