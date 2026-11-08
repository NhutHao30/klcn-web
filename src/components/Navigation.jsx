import { useRef, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCategories } from "../services/categoryService";

const Navigation = () => {
    const subNavRef = useRef(null);
    const location = useLocation();
    const scrollStep = 250;

    const scrollLeft = () => {
        if (subNavRef.current) subNavRef.current.scrollLeft -= scrollStep;
    };

    const scrollRight = () => {
        if (subNavRef.current) subNavRef.current.scrollLeft += scrollStep;
    };

    const [show, setShow] = useState(false);
    const [categories, setCategories] = useState([
        { id: 1, MALOAI: 1, tenLoai: "Bánh Kem", san_phams_count: 9 },
        { id: 2, MALOAI: 2, tenLoai: "Bánh Ngọt", san_phams_count: 13 },
        { id: 3, MALOAI: 3, tenLoai: "Bánh Mì", san_phams_count: 9 },
        { id: 4, MALOAI: 4, tenLoai: "Bánh Khô", san_phams_count: 8 },
        { id: 5, MALOAI: 5, tenLoai: "Bánh Tráng Miệng", san_phams_count: 5 },
        { id: 6, MALOAI: 6, tenLoai: "Bánh Theo Mùa", san_phams_count: 0 },
    ]);

    useEffect(() => {
        getCategories()
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setCategories(data);
                }
            })
            .catch(() => {});
    }, []);

    const path = location.pathname.toLowerCase();
    const isHome = path === "/" || path === "/trang-chu";
    const isAbout = path.startsWith("/gioi-thieu");
    const isProduct = path.startsWith("/san-pham");
    const isNews = path.startsWith("/tin-tuc");
    const isContact = path.startsWith("/lien-he");
    const isStore = path.startsWith("/he-thong-cua-hang");
    const isFaq = path.startsWith("/cau-hoi-thuong-gap");

    const navItems = [
        {
            Title: "Bánh Kem",
            catId: 1,
            Children: ["Bánh sinh nhật", "Bánh sự kiện", "Bánh cho trẻ em", "Bánh kem đặt trước"],
        },
        {
            Title: "Bánh Mì",
            catId: 3,
            Children: ["Bánh Mì Kẹp", "Bánh Cán Lớp", "Bánh Mì Gối", "Bánh mì baguette", "Bánh mì mặn", "Bánh mì ngọt"],
        },
        {
            Title: "Bánh Ngọt",
            catId: 2,
            Children: ["Bánh bông lan", "Bánh Chiffon", "Bánh cuộn", "Bánh su kem"],
        },
        {
            Title: "Bánh Tráng Miệng",
            catId: 5,
            Children: ["Bánh miếng", "Bánh Mousse", "Tiramisu/ Caramel/ Sữa chua", "Panna cotta & Pudding"],
        },
        {
            Title: "Bánh Khô",
            catId: 4,
            Children: ["Bánh quy", "Bánh mì nướng", "Bánh sừng bò mini", "Bánh kem đặt trước"],
        },
        {
            Title: "Bánh Đông Lạnh",
            catId: null, // Không tồn tại trong hệ thống
            Children: ["Bánh bao", "Bánh pizza"],
        },
        {
            Title: "Bánh Theo Mùa",
            catId: 6, // Có danh mục trong hệ thống nhưng 0 sản phẩm
            Children: ["Bánh quy tết", "Bánh trung thu", "Bánh quy noel", "Bánh kem nodel"],
        },
        {
            Title: "Đồ Uống",
            catId: null, // Không tồn tại trong hệ thống
            Children: [],
        },
    ];

    const normalize = (str) =>
        (str || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/đ/g, "d")
            .trim();

    const getCategoryStatus = (item) => {
        let cat = null;
        if (item.catId) {
            cat = categories.find(c => Number(c.id || c.MALOAI) === Number(item.catId));
        }
        if (!cat) {
            const normTitle = normalize(item.Title);
            cat = categories.find(c => {
                const catName = normalize(c.tenLoai || c.TENLOAI || "");
                return catName === normTitle || catName.includes(normTitle) || normTitle.includes(catName);
            });
        }

        if (!cat) {
            return {
                exists: false,
                hasProducts: false,
                count: 0,
                id: null,
                statusText: "Chưa có",
                reason: "Loại sản phẩm này chưa kinh doanh trong hệ thống"
            };
        }

        const count = Number(cat.san_phams_count ?? cat.soLuongSanPham ?? cat.SO_LUONG_SP ?? cat.count ?? 0);
        if (count === 0) {
            return {
                exists: true,
                hasProducts: false,
                count: 0,
                id: cat.id || cat.MALOAI,
                statusText: "Tạm hết",
                reason: "Hiện tại loại bánh này chưa có sản phẩm nào"
            };
        }

        return {
            exists: true,
            hasProducts: true,
            count,
            id: cat.id || cat.MALOAI,
            statusText: `${count} SP`,
            reason: ""
        };
    };

    return (
        <>
            <ul className="nav-list-level2 nav-list-level2-js hide-on-mobile" ref={subNavRef}>
                <li className="nav-item-level2">
                    <Link to="/" className={`nav-item__link-level2 ${isHome ? "active" : ""}`}>
                        Trang chủ
                    </Link>
                </li>
                <li className="nav-item-level2">
                    <Link to="/gioi-thieu" className={`nav-item__link-level2 ${isAbout ? "active" : ""}`}>
                        Giới thiệu
                    </Link>
                </li>
                <li className="nav-item-level2 nav-item-level2-js"
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                >
                    <Link to="/san-pham" className={`nav-item__link-level2 ${isProduct ? "active" : ""}`}>
                        Sản phẩm
                        <i style={{ marginLeft: '6px' }} className="nav-item__icon-down fa-solid fa-caret-down"></i>
                    </Link>
                    <ul className="subnav subnav-js"
                        style={{
                            display: show ? "flex" : "none",
                            animation: show ? "fadeIn linear 0.3s forwards" : "none",
                        }}
                    >
                        <div className="row sm-gutter" style={{ width: '100%' }}>
                            {navItems.map((item, index) => {
                                const status = getCategoryStatus(item);
                                const isDisabled = !status.hasProducts;

                                return (
                                    <li 
                                        key={index} 
                                        className={`subnav-item col-lg-3 col-md-3 ${isDisabled ? "disabled" : ""}`}
                                        title={isDisabled ? status.reason : `Xem danh mục ${item.Title} (${status.count} sản phẩm)`}
                                    >
                                        {isDisabled ? (
                                            <div className="subnav-item-link disabled" style={{ cursor: "not-allowed" }}>
                                                <p className="subnav-title-text" style={{ color: "#94a3b8", cursor: "not-allowed" }}>
                                                    <span>{item.Title}</span>
                                                    <span className="subnav-disabled-badge">({status.statusText})</span>
                                                </p>
                                            </div>
                                        ) : (
                                            <Link 
                                                to={`/san-pham?category=${status.id}`} 
                                                className="subnav-item-link"
                                                onClick={() => setShow(false)}
                                            >
                                                <p className="subnav-title-text">
                                                    <span>{item.Title}</span>
                                                    <span className="subnav-count-badge">({status.count})</span>
                                                </p>
                                            </Link>
                                        )}

                                        <ul className="subnav_level2">
                                            {item.Children.map((child, i) => (
                                                <li key={i} className="subnav-item_level2">
                                                    {isDisabled ? (
                                                        <span 
                                                            className="subnav-item-link_level2 disabled"
                                                            style={{ color: "#94a3b8", cursor: "not-allowed", opacity: 0.6 }}
                                                        >
                                                            {child}
                                                        </span>
                                                    ) : (
                                                        <Link 
                                                            to={`/san-pham?category=${status.id}`} 
                                                            className="subnav-item-link_level2"
                                                            onClick={() => setShow(false)}
                                                        >
                                                            {child}
                                                        </Link>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    </li>
                                );
                            })}
                        </div>
                    </ul>
                </li>
                <li className="nav-item-level2">
                    <Link to="/tin-tuc" className={`nav-item__link-level2 ${isNews ? "active" : ""}`}>
                        Tin tức
                    </Link>
                </li>
                <li className="nav-item-level2">
                    <Link to="/lien-he" className={`nav-item__link-level2 ${isContact ? "active" : ""}`}>
                        Liên Hệ
                    </Link>
                </li>
                <li className="nav-item-level2">
                    <Link to="/he-thong-cua-hang" className={`nav-item__link-level2 ${isStore ? "active" : ""}`}>
                        Hệ thống cửa hàng
                    </Link>
                </li>
                <li className="nav-item-level2">
                    <Link to="/Cau-hoi-thuong-gap" className={`nav-item__link-level2 ${isFaq ? "active" : ""}`}>
                        Câu hỏi thường gặp
                    </Link>
                </li>
            </ul>
            <div className="navBtn hide-on-mobile hide-on-mobile-tablet">
                <ul className="nav-item__sub-list">
                    <li className="nav-item__sub-item" onClick={scrollLeft}>
                        <i className="fa-solid fa-chevron-left"></i>
                    </li>
                    <li className="nav-item__sub-item" onClick={scrollRight}>
                        <i className="fa-solid fa-chevron-right"></i>
                    </li>
                </ul>
            </div>
        </>
    );
};

export default Navigation;