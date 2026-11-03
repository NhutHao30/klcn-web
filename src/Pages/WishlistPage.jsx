import React, { useEffect, useState } from "react";
import Footer from "../Layout/Footer";
import { getWishlist, removeFromWishlist } from "../services/wishlistService";
import { addToCart } from "../services/cartService";
import { useToast } from '../components/Toast/Toast';
import { formatImageUrl } from "../utils/imageUtils";

// Hàm lấy tên sản phẩm (backend trả về nhiều kiểu field)
const getProductName = (item) => {
    if (!item) return "Sản phẩm";
    const p = item.product || item.sanpham || item;
    return p.name || p.tenSP || p.TenSP || p.tenSanPham || item.name || "Sản phẩm";
};

// Hàm format giá
const getProductPrice = (item) => {
    if (!item) return "0₫";
    const p = item.product || item.sanpham || item;
    const price = p.salePrice || p.price || p.giaBan || p.GIABAN || item.price || 0;
    return Number(price).toLocaleString('vi-VN') + "₫";
};

const getProductImage = (item) => {
    if (!item) return "";
    const p = item.product || item.sanpham || item;
    return formatImageUrl(p.image || p.hinh_anh || p.imageUrl || p.HINHANH || item.image);
};

const WishlistPage = () => {
    const toast = useToast();
    const [wishlistItems, setWishlistItems] = useState([]);

    const loadWishlist = async () => {
        try {
            const items = await getWishlist();
            setWishlistItems(Array.isArray(items) ? items : (items ? [items] : []));
        } catch (e) {
            if (e.response?.status === 401) {
                toast.warning("Vui lòng đăng nhập để xem danh sách yêu thích");
                if (window.location.pathname !== "/dang-nhap") { window.location.href = "/dang-nhap"; }
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
            toast.success("Đã xóa sản phẩm khỏi danh sách yêu thích!");
            loadWishlist();
            document.dispatchEvent(new Event('wishlistUpdated'));
        } catch (e) {
            console.error(e);
            toast.error("Không thể xóa sản phẩm lúc này!");
        }
    };

    const handleAddToCart = async (masp) => {
        try {
            await addToCart(masp, 1);
            toast.success("Đã thêm vào giỏ hàng!");
            document.dispatchEvent(new Event('cartUpdated'));
        } catch (e) {
            if (e.response?.status === 401) {
                toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng");
                if (window.location.pathname !== "/dang-nhap") { window.location.href = "/dang-nhap"; }
            } else {
                console.error(e);
                toast.error("Không thể thêm vào giỏ hàng lúc này!");
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
                                data-masp={item.masp || item.id}
                                className="product-sale-item-level2 col-lg-3 col-custom col-md-4 col-6"
                            >
                                <div className="product-sale-item__img product-sale-item__img-js">
                                    <img
                                        src={getProductImage(item)}
                                        alt={getProductName(item)}
                                        className="product-sale_img product-sale_img-js"
                                    />
                                    <ul className="product-bestSale-tag-list">
                                        <li
                                            className="product-bestSale-tag-item"
                                            onClick={() => handleRemove(item.masp || item.id)}
                                            style={{ display: 'inline-flex', cursor: 'pointer' }}
                                            title="Bỏ yêu thích"
                                        >
                                            <i className="product-bestSale__tag-icon--Like fa-solid fa-heart" style={{ color: 'red' }}></i>
                                        </li>
                                    </ul>
                                    <ul className="product-sale-tag-list-2 product-sale-tag-list-2-js">
                                        <li
                                            className="product-sale-tag-item-2 product-sale-tag-item-2-cart-js"
                                            onClick={() => handleAddToCart(item.masp || item.id)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <i className="product-sale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                                        </li>
                                    </ul>
                                </div>
                                <div className="product-sale-item__content">
                                    <a href={`/san-pham/${item.masp || item.id}`} className="product-sale__name product-sale__name-js" style={{ textDecoration: "none", color: "#333" }}>
                                        {getProductName(item)}
                                    </a>
                                    <div className="product-sale__price">
                                        <span className="product-sale__price-sale product-sale__price-sale-js">
                                            {getProductPrice(item)}
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
