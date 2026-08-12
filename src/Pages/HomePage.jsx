import React, { useState, useEffect } from "react";
import Footer from "../Layout/Footer";
import { getBestSellers, getHomepageProducts } from "../services/productService";
import axiosClient from "../services/axiosClient";

const HomePage = () => {

    const [discountedProducts, setDiscountedProducts] = useState([]);
    const [bestSellers, setBestSellers] = useState([]);
    const [newestProducts, setNewestProducts] = useState([]);
    const [expensiveProducts, setExpensiveProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [homepageData, bestSellersData, categoriesData] = await Promise.all([
                    getHomepageProducts(),
                    getBestSellers(),
                    axiosClient.get('/categories').then(res => res.data)
                ]);
                setDiscountedProducts(homepageData.discounted || []);
                setNewestProducts(homepageData.newest || []);
                setExpensiveProducts(homepageData.expensive || []);
                setBestSellers(bestSellersData || []);
                setCategories(categoriesData || []);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu trang chủ:", error);
            }
        };
        fetchData();
    }, []);

    // Helper: format image URL
    const formatImageUrl = (url) => {
        if (!url) return "../../assets/IMG/productSale_5.webp";
        if (url.startsWith("http") || url.startsWith("/api/")) return url;
        return `../../assets/IMG/${url.split('/').pop()}`;
    };

    // Helper: format price
    const formatPrice = (price) => {
        return Number(price).toLocaleString('vi-VN') + "₫";
    };

    // Helper: calculate sale price
    const getSalePrice = (price, discountPercent) => {
        if (!discountPercent || discountPercent <= 0) return price;
        return price - (price * discountPercent / 100);
    };

    const Policy = [
        { id: 1, title: "Miễn phí vận chuyển", des: "Áp dụng free ship cho tất cả đơn hàng từ 300 nghìn", img: "../../assets/IMG/policy_1.webp" },
        { id: 2, title: "Đổi trả dễ dàng", des: "Đổi ngay trong ngày nếu như bánh không đúng yêu cầu", img: "../../assets/IMG/policy_2.webp" },
        { id: 3, title: "Hỗ trợ nhanh chóng", des: "Gọi Hotline: 19006750 để được hỗ trợ ngay", img: "../../assets/IMG/policy_3.webp" },
        { id: 4, title: "Thanh toán đa dạng", des: "Thanh toán khi nhận hàng, Napas, Visa, Chuyển khoản", img: "../../assets/IMG/policy_4.webp" },
    ]

    const Category = [
        { id: 1, title: "Bánh kếp", img: "../../assets/IMG/category_1.webp" },
        { id: 2, title: "Bánh su kem", img: "../../assets/IMG/category_2.webp" },
        { id: 3, title: "Bánh mì nướng", img: "../../assets/IMG/category_3.webp" },
        { id: 4, title: "Bánh khác", img: "../../assets/IMG/category_4.webp" },
    ]

    // Render a product card for "Bánh đang giảm giá" section
    const renderSaleProduct = (product, index) => {
        const masp = product.MASP;
        const name = product.TENSP;
        const price = Number(product.GIABAN);
        const discount = parseInt(product.PHAN_TRAM_GIAM || 0);
        const salePrice = getSalePrice(price, discount);
        const img = formatImageUrl(product.HINHANH);
        const soluong = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.SOLUONG || 0);
        const tonkhoChitiet = product.TONKHO_CHITIET || "[]";

        return (
            <li key={index} data-masp={masp} data-soluong={soluong} data-tonkho-chitiet={tonkhoChitiet} className="product-sale-item-level2 col-custom col-lg-3 col-md-3 col-2 ">
                <div className="product-sale-item__img product-sale-item__img-js">
                    <img src={img} alt={name} className=" product-sale_img product-sale_img-js" />
                    <ul className="product-bestSale-tag-list">
                        {discount > 0 && (
                            <li className="product-bestSale-tag-item">
                                -{discount}%
                            </li>
                        )}
                        <li className="product-bestSale-tag-item product-sale__tag-icon--noLike-js">
                            <i className="product-bestSale__tag-icon--noLike fa-regular fa-heart"></i>
                        </li>
                        <li className="product-bestSale-tag-item product-sale__tag-icon--Like-js">
                            <i className="product-bestSale__tag-icon--Like fa-solid fa-heart"></i>
                        </li>
                    </ul>
                    <ul className="product-sale-tag-list-2 product-sale-tag-list-2-js">
                        <li className="product-sale-tag-item-2 product-sale-tag-item-2-cart-js">
                            <i className="product-sale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                        </li>
                        <li className="product-sale-tag-item-2 product-sale-tag-item-2-search-js">
                            <i className="product-sale__tag-icon-2 fa-solid fa-magnifying-glass"></i>
                        </li>
                    </ul>
                </div>
                <div className="product-sale-des-2">
                    <div className="product-sale__name product-sale__name-js">
                        {name}
                    </div>
                    <ul className="product-sale__price">
                        <li className="product-sale__price-sale product-sale__price-sale-js">{formatPrice(salePrice)}</li>
                        <li className="product-sale__price-original product-sale__price-original-js">{formatPrice(price)}</li>
                    </ul>
                </div>
            </li>
        );
    };

    // Render a product card for "Được mua nhiều nhất" and "Bánh mới nhất" sections
    const renderBestSaleProduct = (product, index) => {
        const masp = product.MASP;
        const name = product.TENSP;
        const price = Number(product.GIABAN);
        const discount = parseInt(product.PHAN_TRAM_GIAM || 0);
        const isNew = product.IS_NEW == 1;
        const salePrice = getSalePrice(price, discount);
        const img = formatImageUrl(product.HINHANH);
        const soluong = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.SOLUONG || 0);
        const tonkhoChitiet = product.TONKHO_CHITIET || "[]";

        return (
            <li key={index} data-masp={masp} data-soluong={soluong} data-tonkho-chitiet={tonkhoChitiet} className="product-sale-item-level2 product-bestSale-item-level2 product-bestSale-item-level2-md product-bestSale-item-level2-sm">
                <div className="product-bestSale-item__img product-sale-item__img-js">
                    <img src={img} alt={name} className="product-sale_img product-sale_img-js" />
                    <ul className="product-bestSale-tag-list">
                        {discount > 0 && (
                            <li className="product-bestSale-tag-item">
                                -{discount}%
                            </li>
                        )}
                        {isNew && discount <= 0 && (
                            <li className="product-sale-tag-new" style={{ position: "relative"}}>
                                new
                            </li>
                        )}
                        {discount <= 0 && !isNew && (
                            <li className="product-bestSale-tag-item--off"></li>
                        )}
                        <li className="product-bestSale-tag-item product-sale__tag-icon--noLike-js">
                            <i className="product-bestSale__tag-icon--noLike fa-regular fa-heart"></i>
                        </li>
                        <li className="product-bestSale-tag-item product-sale__tag-icon--Like-js">
                            <i className="product-bestSale__tag-icon--Like fa-solid fa-heart"></i>
                        </li>
                    </ul>
                    <ul className="product-bestSale-tag-list-2 product-sale-tag-list-2-js">
                        <li className="product-bestSale-tag-item-2 product-sale-tag-item-2-cart-js">
                            <i className="product-bestSale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                        </li>
                        <li className="product-bestSale-tag-item-2 product-sale-tag-item-2-search-js">
                            <i className="product-bestSale__tag-icon-2 fa-solid fa-magnifying-glass"></i>
                        </li>
                    </ul>
                </div>
                <div className="product-bestSale-des-2">
                    <div className="product-bestSale__name product-sale__name-js">
                        {name}
                    </div>
                    <ul className="product-bestSale__price">
                        <li className="product-bestSale__price-bestSale product-sale__price-sale-js">{formatPrice(salePrice)}</li>
                        {discount > 0 && <li className="product-bestSale__price-original product-sale__price-original-js">{formatPrice(price)}</li>}
                    </ul>
                </div>
            </li>
        );
    };

    // Render a product card for "Bánh mới nhất" section (horizontal scroll)
    const renderNewProduct = (product, index) => {
        const masp = product.MASP;
        const name = product.TENSP;
        const price = Number(product.GIABAN);
        const discount = parseInt(product.PHAN_TRAM_GIAM || 0);
        const salePrice = getSalePrice(price, discount);
        const img = formatImageUrl(product.HINHANH);
        const soluong = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.SOLUONG || 0);
        const tonkhoChitiet = product.TONKHO_CHITIET || "[]";

        const isNew = product.IS_NEW == 1;

        return (
            <li key={index} data-masp={masp} data-soluong={soluong} data-tonkho-chitiet={tonkhoChitiet} className="product-new-item-level2 col-20 col-custom col-md-3 col-3 ">
                <img src={img} alt={name} className=" product-sale_img product-sale_img-js" />
                <ul className="product-bestSale-tag-list">
                    {isNew && (
                        <li className="product-sale-tag-new" style={{ position: "relative"}}>
                            new
                        </li>
                    )}
                    {!isNew && (
                        <li className="product-bestSale-tag-item--off"></li>
                    )}
                    <li className="product-bestSale-tag-item product-sale__tag-icon--noLike-js">
                        <i className="product-bestSale__tag-icon--noLike fa-regular fa-heart"></i>
                    </li>
                    <li className="product-bestSale-tag-item product-sale__tag-icon--Like-js">
                        <i className="product-bestSale__tag-icon--Like fa-solid fa-heart"></i>
                    </li>
                </ul>
                <ul className="product-bestSale-tag-list-2 product-sale-tag-list-2-js">
                    <li className="product-bestSale-tag-item-2 product-sale-tag-item-2-cart-js">
                        <i className="product-bestSale__tag-icon-2 fa-solid fa-cart-shopping"></i>
                    </li>
                    <li className="product-bestSale-tag-item-2 product-sale-tag-item-2-search-js">
                        <i className="product-bestSale__tag-icon-2 fa-solid fa-magnifying-glass"></i>
                    </li>
                </ul>
                <div className="product-new-des-2">
                    <div className="product-new__name product-sale__name-js">
                        {name}
                    </div>
                    <ul className="product-new__price">
                        <li className="product-new__price-new product-sale__price-sale-js">{formatPrice(salePrice)}</li>
                        {discount > 0 && <li className="product-new__price-original product-sale__price-original-js">{formatPrice(price)}</li>}
                    </ul>
                </div>
            </li>
        );
    };

    // Render a menu product block for "Tất cả bánh" section
    const renderMenuProduct = (product, index) => {
        const name = product.TENSP;
        const price = Number(product.GIABAN);
        const discount = parseInt(product.PHAN_TRAM_GIAM || 0);
        const salePrice = getSalePrice(price, discount);
        const img = formatImageUrl(product.HINHANH);
        const masp = product.MASP;
        const soluong = product.TONKHO_THUCTE !== undefined ? product.TONKHO_THUCTE : (product.SOLUONG || 0);
        const tonkhoChitiet = product.TONKHO_CHITIET || "[]";

        return (
            <div key={index} className="menuProduct-block" data-masp={masp} data-soluong={soluong} data-tonkho-chitiet={tonkhoChitiet}>
                <li className="menuProduct-item-img-level2">
                    <a href="" className="menuProduct-item-img-level2-link">
                        <img src={img} alt={name} className="menuProduct-item-img product-sale_img-js" />
                    </a>
                </li>
                <li className="menuProduct-item-level2">
                    <ul className="menuProduct-list-level3">
                        <li className="menuProduct-item_name-level3 product-sale__name-js">
                            {name}
                        </li>
                        <li className="menuProduct-item_price-level3">
                            <span className="menuProduct-item_priceSale-level3 product-sale__price-sale-js">{formatPrice(salePrice)}</span>
                            {discount > 0 && <span className="menuProduct-item_priceOriginal-level3 product-sale__price-original-js">{formatPrice(price)}</span>}
                        </li>
                        <li className="menuProduct-item_icon-level3">
                            <span className="menuProduct-item_iconCart-level3">
                                <i className="menuProduct-item_iconCart fa-solid fa-cart-shopping"></i>
                            </span>
                            <span className="menuProduct-item_iconSearch-level3 product-sale-tag-item-2-search-js">
                                <i className="menuProduct-item_iconSearch fa-solid fa-magnifying-glass"></i>
                            </span>
                            <span className="menuProduct-item_iconLike-level3 menuProduct-item_iconLike-level3-js">
                                <i className="menuProduct-item_iconLike menuProduct-item_iconLike-js fa-solid fa-heart"></i>
                            </span>
                        </li>
                    </ul>
                </li>
            </div>
        );
    };

    // Split expensive products into two columns for the menu layout
    const leftColumnProducts = expensiveProducts.slice(0, 4);
    const rightColumnProducts = expensiveProducts.slice(4, 8);

    return (
        <>
            <content>
                <div className="policy">
                    <div className="container">
                        <div className="row">
                            <div className="policy-background">
                                {Policy.map((item, index) => (
                                    <ul key={index} className="policy-list col-lg-3 col-md-4">
                                        <li className="policy-item">
                                            <a href="" className="policy-item__link">
                                                <div className="policy-img">
                                                    <img src={item.img} alt="" className="policy_1-img" />
                                                </div>
                                                <div className="policy-title">
                                                    <span className="policy-title__span">
                                                        {item.title}
                                                    </span>
                                                    <p className="policy-title__p">
                                                        {item.des}
                                                    </p>
                                                </div>
                                            </a>
                                        </li>
                                    </ul>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="category">
                    <div className="container">
                        <div className="row">
                            <div className="category-background">
                                {Category.map((item, index) => (
                                    <ul key={index} className="category-list col-lg-3 col-md-4 col-6 col-custom">
                                        <li className="category-item">
                                            <div className="category-item__block">
                                                <div className="category-img">
                                                    <img src={item.img} alt="" className="category_1-img" />
                                                    <ul className="category-des-list">
                                                        <li className="category-des-item">{item.title}</li>
                                                        <li className="category-des-item">
                                                            <a href="" className="category-des-item-link">
                                                                Xem ngay
                                                            </a>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="product-sale">
                    <div className="container">
                        <div className="row">
                            <div className="product-sale-background">
                                <div className="product-sale-background__border">
                                    <ul className="product-sale-list-level-1">
                                        <li className="product-sale-item">
                                            <p className="product-sale-title product-sale-title-js">
                                                <a href="" style={{ textDecoration: "none" }}>
                                                    Bánh đang giảm giá
                                                </a>
                                            </p>
                                            <div className="productImg">
                                                <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img" />
                                            </div>
                                            {discountedProducts.length === 0 && (
                                                <p className="product-sale-des">
                                                    Chương trình đã kết thúc, hẹn gặp lại trong thời gian sớm nhất!
                                                </p>
                                            )}
                                        </li>
                                        <li className="product-sale-item">
                                            <ul className="crollBtn crollBtn-js">
                                                <li className="prevBtn prevBtn-js">
                                                    <i className="prevBtn-icon fa-solid fa-chevron-left"></i>
                                                </li>
                                                <li className="nextBtn nextBtn-js">
                                                    <i className="nextBtn-icon fa-solid fa-chevron-right"></i>
                                                </li>
                                            </ul>
                                            <ul className="product-sale-list-level-2 product-sale-list-level-2-js">
                                                {discountedProducts.map((product, index) => renderSaleProduct(product, index))}
                                            </ul>
                                        </li>

                                    </ul>
                                </div>

                            </div>
                        </div>
                    </div>
                </div>
                <div className="product-bestSale">
                    <div className="container">
                        <div className="product-bestSale-background">
                            <ul className="product-bestSale-list-level-1">
                                <li className="product-bestSale-item mt-30">
                                    <div className="row">
                                        <p className="product-bestSale-title product-sale-title-js">
                                            <a href="">
                                                Được mua nhiều nhất
                                            </a>
                                        </p>
                                        <div className="productImg">
                                            <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img-bestSale" />
                                        </div>
                                    </div>

                                </li>
                                <li className="product-bestSale-item">
                                    <ul className="product-bestSale-list-level-2 product-sale-list-level-2-js">
                                        <div className="row translate-X-md translate-X-lg translate-X-sm gap-20-md gap-20-sm">
                                            {bestSellers.map((product, index) => renderBestSaleProduct(product, index))}
                                        </div>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="content-banner">
                    <div className="container">
                        <div className="content-banner-IMG mt-30 col-lg-12 col-12">
                            <img src="../../assets/IMG/banner.webp" alt="" className="content-banner-img content-banner-img-js" />
                        </div>
                    </div>
                </div>
                <div className="product-new">
                    <div className="container">
                        <div className="product-new-background">
                            <ul className="product-new-list-level-1 mt-30">
                                <li className="product-new-item">
                                    <p className="product-new-title product-sale-title-js">
                                        <a href="">
                                            Bánh mới nhất
                                        </a>
                                    </p>
                                    <div className="productImg">
                                        <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img-new" />
                                    </div>
                                </li>
                                <li className="product-new-item">
                                    <ul className="product-new-list-level-2 product-sale-list-level-2-js">
                                        <div className="row noWrap translate-X" style={{ gap: "20px" }}>
                                            {newestProducts.map((product, index) => renderNewProduct(product, index))}
                                        </div>
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="content-banner-2">
                    <div className="container">
                        <div className="row">
                            <div className="content-banner-2-background">
                                <div className="content-banner-2-IMG mt-30 col-lg-6 col-md-6 col-12">
                                    <img src="../../assets/IMG/banner_2-img--1.webp" alt="" className="content-banner-2-img content-banner-img-js" />
                                    <ul className="content-banner-2-IMG__des-list">
                                        <li className="content-banner-2-IMG__des-item">
                                            Bánh nướng & Sữa
                                        </li>
                                        <li className="content-banner-2-IMG__des-item">
                                            Vị béo
                                        </li>
                                        <li className="content-banner-2-IMG__des-item">
                                            <a href="" className="content-banner-2-IMG__des-item-link">
                                                Khám phá tất cả
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                                <div className="content-banner-2-IMG mt-30 col-lg-6 col-md-6 col-12">
                                    <img src="../../assets/IMG/banner_2-img--2.webp" alt="" className="content-banner-2-img content-banner-img-js" />
                                    <ul className="content-banner-2-IMG__des-list">
                                        <li className="content-banner-2-IMG__des-item">
                                            Bánh & Trà
                                        </li>
                                        <li className="content-banner-2-IMG__des-item">
                                            Hương vị tươi
                                        </li>
                                        <li className="content-banner-2-IMG__des-item">
                                            <a href="" className="content-banner-2-IMG__des-item-link">
                                                Khám phá tất cả
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="product-Menu">
                    <div className="container">
                        <div className="product-Menu-background">
                            <ul className="product-Menu-list-level-1 mt-30">
                                <li className="product-Menu-item">
                                    <p className="product-Menu-title product-sale-title-js">
                                        <a href="">
                                            Tất cả bánh
                                        </a>
                                    </p>
                                    <div className="productImg">
                                        <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Menu-img " />
                                    </div>
                                </li>
                                <div className="row">
                                    <li className="product-Menu-item2">
                                        <ul className="menuProduct-list-level1">
                                            <li className="menuProduct-item-level1 col-lg-3 col-md-3 pd-10-md">
                                                <ul className="menuProduct_category-list-level2">
                                                    {categories.length > 0 ? categories.map((cat, idx) => (
                                                        <li key={idx} className="menuProduct_category-item-level2 ">{cat.TENLOAI || cat.tenLoai}</li>
                                                    )) : (
                                                        <>
                                                            <li className="menuProduct_category-item-level2 ">Bánh kem</li>
                                                            <li className="menuProduct_category-item-level2 ">Bánh mì</li>
                                                            <li className="menuProduct_category-item-level2 ">Bánh ngọt</li>
                                                            <li className="menuProduct_category-item-level2 ">Bánh khô</li>
                                                        </>
                                                    )}
                                                </ul>
                                            </li>
                                            <li className="menuProduct-item-level1 col-lg-9 col-md-9 col-12 pd-10-md pd-l-0 pd-r-0">
                                                <ul className="menuProduct-list-level2 col-lg-6 col-md-6 pd-10-md ">
                                                    {leftColumnProducts.map((product, index) => renderMenuProduct(product, index))}
                                                </ul>
                                                <ul className="menuProduct-list-level2 col-lg-6 col-md-6 pd-10-md">
                                                    {rightColumnProducts.map((product, index) => renderMenuProduct(product, index))}
                                                </ul>
                                            </li>
                                        </ul>
                                        <div className="seeAll mt-30">
                                            Xem tất cả
                                        </div>
                                    </li>
                                </div>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="content-banner-3">
                    <div className="container">
                        <div className="row flex-column-sm">
                            <div className="content-banner-3-background flex-column-sm">
                                <div className="content-banner-3 mt-30 col-lg-6 col-md-6 col-12">
                                    <ul className="content-banner-3__des-list pr-30">
                                        <li className="content-banner-3__des-item">Bánh Mousse Sữa Chua</li>
                                        <li className="content-banner-3__des-item">
                                            Những chiếc bánh mousse sữa chua béo thơm, mềm ngọt là món tráng miệng được nhiều người yêu thích trong những ngày oi bức.
                                        </li>
                                        <li className="content-banner-3__des-item">
                                            Xem Ngay
                                        </li>
                                    </ul>
                                </div>
                                <div className="content-banner-3-IMG mt-30 col-lg-6 col-md-6 col-12">
                                    <img src="../../assets/IMG/banner_3-img--1.webp" alt="" className="content-banner-3-img content-banner-img-js" />
                                </div>
                            </div>
                            <div className="content-banner-3-background flex-column-sm">
                                <div className="content-banner-3-IMG col-lg-6 col-md-6 col-12">
                                    <img src="../../assets/IMG/banner_3-img--2.webp" alt="" className="content-banner-3-img content-banner-img-js" />
                                </div>
                                <div className="content-banner-3 col-lg-6 col-md-6 col-12">
                                    <ul className="content-banner-3__des-list pl-30">
                                        <li className="content-banner-3__des-item">Bánh Dark Chocolate</li>
                                        <li className="content-banner-3__des-item">
                                            Nếu bạn là tín đồ của chocolate thì không thể bỏ qua loại bánh Dark Chocolate của Brodard. Không phải là vị đắng nhè nhẹ, bánh đem lại cho người thưởng thức vị đắng đặc trưng nguyên thủy của socola mà chỉ cần thử một lần là sẽ mê đắm.
                                        </li>
                                        <li className="content-banner-3__des-item">Xem Ngay</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="product-post">
                    <div className="container">
                        <div className="row">
                            <div className="product-post-background">
                                <ul className="product-post-list-level-1 mt-30">
                                    <li className="product-post-item">
                                        <p className="product-post-title product-sale-title-js">
                                            <a href="">
                                                Tin tức mới nhất
                                            </a>
                                        </p>
                                        <div className="productImg">
                                            <img src="../../assets/IMG/productSale--.webp" alt="" className="product-Img-post" />
                                        </div>
                                    </li>
                                    <li className="product-post-item">
                                        <div className="product-post-block col-lg-4 col-md-4 col-12">
                                            <ul className="product-post-block-list">
                                                <li className="product-post-block-item_img">
                                                    <a href="" className="product-post-block-item_img-link">
                                                        <img src="../../assets/IMG/post_img-1.webp" alt="" className="product-post_img" />
                                                    </a>
                                                </li>
                                                <li className="product-post-block-item_info">
                                                    <h3 className="product-post_title-h3">
                                                        <a href="" className="product-post-title-link">
                                                            Donut chỉ từ 8k tại Dola
                                                        </a>
                                                    </h3>
                                                    <span className="product-post-block-item_des">
                                                        Nhắc đến bánh Donut, dân sành thưởng thức hẳn không còn xa lạ gì với món ăn vặt rất phổ biến ở các nước phương Tây này. Dù có nguồn...
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="product-post-block col-lg-4 col-md-4 col-12">
                                            <ul className="product-post-block-list">
                                                <li className="product-post-block-item_img">
                                                    <a href="" className="product-post-block-item_img-link">
                                                        <img src="../../assets/IMG/post_img-2.webp" alt="" className="product-post_img" />
                                                    </a>
                                                </li>
                                                <li className="product-post-block-item_info">
                                                    <h3 className="product-post_title-h3">
                                                        <a href="" className="product-post-title-link">
                                                            Croissant ngàn lớp - đa dạng cách thưởng thức
                                                        </a>
                                                    </h3>
                                                    <span className="product-post-block-item_des">
                                                        Những chiếc bánh sừng bò với hương bơ thơm béo đặc trưng lại còn đưa miệng với độ giòn xốp, dai dai từ "ngàn" lớp bánh. Nổi bật với hình...
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="product-post-block col-lg-4 col-md-4 col-12">
                                            <ul className="product-post-block-list">
                                                <li className="product-post-block-item_img">
                                                    <a href="" className="product-post-block-item_img-link">
                                                        <img src="../../assets/IMG/post_img-3.webp" alt="" className="product-post_img" />
                                                    </a>
                                                </li>
                                                <li className="product-post-block-item_info">
                                                    <h3 className="product-post_title-h3">
                                                        <a href="" className="product-post-title-link">
                                                            Bánh Tart thơm ngậy không thể bỏ lỡ
                                                        </a>
                                                    </h3>
                                                    <span className="product-post-block-item_des">
                                                        Tart trứng là loại bánh đường phố nổi tiếng ở Hong Kong được rất nhiều người yêu thích. Không những thế, trong bảng xếp hạng 50 loại món ăn ngon...
                                                    </span>
                                                </li>
                                            </ul>
                                        </div>

                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="content-feedback mt-30">
                    <div className="container-fluid pd0">
                        <div className="content-feedback-background">
                            <img src="../../assets/IMG/content-feedback-background.webp" alt="" className="content-feedback-background-img" />
                            <div className="content-feedback-customer">
                                <div className="container">
                                    <h3 className="content-feedback__title-h3">
                                        Khách hàng nói gì
                                    </h3>
                                    <div className="content-feedback__title-IMG">
                                        <img src="../../assets/IMG/productSale--.webp" alt="" className="content-feedback-img" />
                                    </div>
                                    <div className="content-feedback__customer-info">
                                        <div className="content-feedback__customer-info-block">
                                            <div className="feedback-customer__content col-lg-6 col-md-6 col-12">
                                                <div className="feedback-customer-img col-lg-12">
                                                    <div className="feedback-customer-img__avatar">
                                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="customer-feedback-img" />
                                                    </div>
                                                    <ul className="feedback-customer-img__list">
                                                        <li className="feedback-customer-img__name">Chú hai</li>
                                                        <li className="feedback-customer-img__des">Sinh viên năm 3 CNTT đại học Công Thương</li>
                                                    </ul>
                                                </div>
                                                <div className="feedback-customer__cmt col-lg-12">
                                                    <p>Tất cả các loại bánh của Dola Bakery đều rất ngon, hương vị đặc biệt lại còn rất đa dạng. Nhân viên ở đây thì rất dễ thương, tư vấn rất nhiệt tình. Cảm ơn Dola Bakery đã mang lại cho tôi trãi nghiệm tuyệt vời. Tôi sẽ luôn ủng hộ.</p>
                                                </div>
                                            </div>
                                            <div className="feedback-customer__content col-lg-6 col-md-6 col-12">
                                                <div className="feedback-customer-img col-lg-12">
                                                    <div className="feedback-customer-img__avatar">
                                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="customer-feedback-img" />
                                                    </div>
                                                    <ul className="feedback-customer-img__list">
                                                        <li className="feedback-customer-img__name">Chú hai</li>
                                                        <li className="feedback-customer-img__des">Sinh viên năm 3 CNTT đại học Công Thương</li>
                                                    </ul>
                                                </div>
                                                <div className="feedback-customer__cmt col-lg-12">
                                                    <p>Tất cả các loại bánh của Dola Bakery đều rất ngon, hương vị đặc biệt lại còn rất đa dạng. Nhân viên ở đây thì rất dễ thương, tư vấn rất nhiệt tình. Cảm ơn Dola Bakery đã mang lại cho tôi trãi nghiệm tuyệt vời. Tôi sẽ luôn ủng hộ.</p>
                                                </div>
                                            </div>
                                            <div className="feedback-customer__content col-lg-6 col-md-6 col-12">
                                                <div className="feedback-customer-img col-lg-12">
                                                    <div className="feedback-customer-img__avatar">
                                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="customer-feedback-img" />
                                                    </div>
                                                    <ul className="feedback-customer-img__list">
                                                        <li className="feedback-customer-img__name">Chú hai</li>
                                                        <li className="feedback-customer-img__des">Sinh viên năm 3 CNTT đại học Công Thương</li>
                                                    </ul>
                                                </div>
                                                <div className="feedback-customer__cmt col-lg-12">
                                                    <p>Tất cả các loại bánh của Dola Bakery đều rất ngon, hương vị đặc biệt lại còn rất đa dạng. Nhân viên ở đây thì rất dễ thương, tư vấn rất nhiệt tình. Cảm ơn Dola Bakery đã mang lại cho tôi trãi nghiệm tuyệt vời. Tôi sẽ luôn ủng hộ.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="signPost mt-30">
                    <div className="container">
                        <div className="row">
                            <div className="signPost-img-background col-lg-12">
                                <div className="signPost-IMG mt-30 pd-r-0 col-lg-6 col-md-6">
                                    <img src="../../assets/IMG/signPost-img.webp" alt="" className="signPost-img content-banner-img-js" />
                                </div>
                                <div className="signPost_form mt-30 pd-l-0 col-lg-6 col-md-6">
                                    <ul className="signPost-img__des-list">
                                        <li className="signPost-img__des-item-name">
                                            Đăng ký nhận tin
                                        </li>
                                        <li className="signPost-img__des-item-infor">
                                            Đăng ký ngay và được giảm giá 15% cho lần mua hàng đầu tiên và nhiều chương trình hấp dẫn dành cho bạn!

                                        </li>
                                        <li className="signPost-img__des-item">
                                            <label htmlFor="signPost-input" className="signPost-label">
                                                <input id="signPost-input" type="email" placeholder="Nhập email nhận tin khuyến mãi" />
                                                <p className="signPost-label-p">Đăng ký</p>
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="contentSocial mt-30">
                    <div className="container">
                        <div className="contentSocial-background">
                            <div className="contentSocial-title col-lg-12 col-md-12">
                                <h3 className="contentSocial-title-h3">
                                    Follow Instagram
                                </h3>
                                <a href="" className="contentSocial-title-link">
                                    @Dola_bakery
                                </a>
                            </div>
                            <ul className="social-img-list col-lg-12">
                                <li className="social-img-item">
                                    <img src="../../assets/IMG/content-ins-img1.webp" alt="" className="social-img-item__img social-img-item__img-js" />
                                    <a className="imgIcon-block" href="">
                                        <i className="imgIcon fa-brands fa-instagram"></i>
                                    </a>
                                </li>
                                <li className="social-img-item">
                                    <img src="../../assets/IMG/content-ins-img2.webp" alt="" className="social-img-item__img social-img-item__img-js" />
                                    <a className="imgIcon-block" href="">
                                        <i className="imgIcon fa-brands fa-instagram"></i>
                                    </a>
                                </li>
                                <li className="social-img-item">
                                    <img src="../../assets/IMG/content-ins-img3.webp" alt="" className="social-img-item__img social-img-item__img-js" />
                                    <a className="imgIcon-block" href="">
                                        <i className="imgIcon fa-brands fa-instagram"></i>
                                    </a>
                                </li>
                                <li className="social-img-item">
                                    <img src="../../assets/IMG/content-ins-img4.webp" alt="" className="social-img-item__img social-img-item__img-js" />
                                    <a className="imgIcon-block" href="">
                                        <i className="imgIcon fa-brands fa-instagram"></i>
                                    </a>
                                </li>
                                <li className="social-img-item">
                                    <img src="../../assets/IMG/content-ins-img5.webp" alt="" className="social-img-item__img social-img-item__img-js" />
                                    <a className="imgIcon-block" href="">
                                        <i className="imgIcon fa-brands fa-instagram"></i>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="content-video mt-30">
                    <div className="container">
                        <div className="content-video-background">
                            <video id="content-video" autoPlay muted loop playsInline>
                                <source src="../../assets/IMG/content-video.mp4" type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            </content>

            <Footer />
        </>
    );
};

export default HomePage;