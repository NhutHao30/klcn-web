import { useRef, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, NavLink } from "react-router-dom";
import HomePage from "../Pages/HomePage";
import AboutPage from "../pages/AboutPage";
import ProductPage from "../Pages/Productpage";

const Navigation = () => {
    const subNavRef = useRef(null);
    const scrollStep = 250;

    const scrollLeft = () => {
        console.log(1);
        if (subNavRef.current) subNavRef.current.scrollLeft -= scrollStep;
    };

    const scrollRight = () => {
        console.log(2);
        if (subNavRef.current) subNavRef.current.scrollLeft += scrollStep;
    };

    const [show, setShow] = useState(false);

    const navItems = [
        {
            Title: "Bánh Kem",
            Children: ["Bánh sinh nhật", "Bánh sự kiện", "Bánh cho trẻ em", "Bánh kem đặt trước"],
        },
        {
            Title: "Bánh MÌ",
            Children: ["Bánh Mì Kẹp", "Bánh Cán Lớp", "Bánh Mì GỐi", "Bánh mì baguette", "Bánh mì mặn", "Bánh mì ngọt"],
        },
        {
            Title: "Bánh Ngọt",
            Children: ["Bánh bông lan", "Bánh Chiffon", "Bánh cuộn", "Bánh su kem"],
        },
        {
            Title: "Bánh Tráng Miệng",
            Children: ["Bánh miếng", "Bánh Mousse", "Tiramisu/ Caramel/ Sữa chua", "Panna cotta & Pudding"],
        },
        {
            Title: "Bánh Khô",
            Children: ["Bánh quy", "Bánh mì nướng", "Bánh sừng bò mini", "Bánh kem đặt trước"],
        },
        {
            Title: "Bánh Đông Lạnh",
            Children: ["Bánh bao", "Bánh pizza",],
        },
        {
            Title: "Bánh Theo Mùa",
            Children: ["Bánh quy tết", "Bánh trung thu", "Bánh quy noel", "Bánh kem nodel"],
        },
        {
            Title: "Đồ Uống",
            Children: [],
        },
    ]

    return (

        <>
            <ul className="nav-list-level2 nav-list-level2-js hide-on-mobile" ref={subNavRef}>
                <li className="nav-item-level2">
                    <NavLink to="/" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>
                        Trang chủ
                    </NavLink>
                </li>
                <li className="nav-item-level2">
                    <NavLink to="/gioi-thieu" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>
                        Giới thiệu
                    </NavLink>
                </li>
                <li className="nav-item-level2 nav-item-level2-js"
                    onMouseEnter={() => setShow(true)}
                    onMouseLeave={() => setShow(false)}
                >
                    <NavLink to="/san-pham" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>
                        Sản phẩm
                        <i style={{ marginLeft: '6px' }} className="nav-item__icon-down fa-solid fa-caret-down"></i>
                    </NavLink>
                    <ul className="subnav subnav-js"
                        style={{
                            display: show ? "flex" : "none",
                            animation: show ? "fadeIn linear 0.3s forwards" : "none",
                        }}
                    >
                        <div className="row sm-gutter">
                            {navItems.map((item, index) => (
                                <li key={index} className="subnav-item col-lg-3 col-md-3">
                                    <a href="#" className="subnav-item-link">
                                        <p>{item.Title}</p>
                                    </a>
                                    <ul className="subnav_level2">
                                        {item.Children.map((child, i) => (
                                            <li key={i} className="subnav-item_level2">
                                                <a href="#" className="subnav-item-link_level2">{child}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </li>
                            ))}
                        </div>
                    </ul>
                </li>
                <li className="nav-item-level2">
                    <NavLink to="/tin-tuc" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>Tin tức
                    </NavLink>
                </li>
                <li className="nav-item-level2">
                    <NavLink to="/lien-he" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>Liên Hệ
                    </NavLink>
                </li>
                <li className="nav-item-level2">
                    <NavLink to="/he-thong-cua-hang" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>Hệ thống cửa hàng
                    </NavLink>
                </li>
                <li className="nav-item-level2">
                    <NavLink to="/Cau-hoi-thuong-gap" className={({ isActive }) =>
                        isActive ? "nav-item__link-level2 active" : "nav-item__link-level2"
                    }>Câu hỏi thường gặp
                    </NavLink>
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
