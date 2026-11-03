import { useLocation, Link } from "react-router-dom";

const Breadcrumb = () => {
    const location = useLocation();

    // Map đường dẫn -> tiêu đề
    const breadcrumbMap = {
        "/gioi-thieu": " Giới Thiệu",
        "/san-pham": " Tất Cả Sản Phẩm",
        "/tin-tuc": " Tin Tức",
        "/lien-he": " Liên Hệ",
        "/he-thong-cua-hang": " Hệ Thống Cửa Hàng",
        "/Cau-hoi-thuong-gap": " Câu Hỏi Thường Gặp",
        "/dang-ky": " Đăng Ký",
        "/dang-nhap": " Đăng Nhập",
        "/gio-hang": " Giỏ Hàng",
        "/yeu-thich": " Sản Phẩm Yêu Thích",
        "/my-orders": " Đơn hàng của tôi"
    };

    // Handle product detail pages dynamic path (/san-pham/:id or /san_pham/:id)
    const isProductDetail = location.pathname.startsWith('/san-pham/') || location.pathname.startsWith('/san_pham/');
    if (isProductDetail) {
        return (
            <div className="header-gioiThieu-block">
                <h3>Chi Tiết Sản Phẩm</h3>
                <ul>
                    <li>
                        <Link to="/">Trang chủ</Link>
                    </li>
                    <li>
                        <i className="fa-solid fa-angle-right"></i>
                        <Link to="/san-pham">Tất Cả Sản Phẩm</Link>
                    </li>
                    <li>
                        <i className="fa-solid fa-angle-right"></i>
                        <span>Chi Tiết</span>
                    </li>
                </ul>
            </div>
        );
    }

    // Lấy tiêu đề từ map, nếu không có thì để trống
    const title = breadcrumbMap[location.pathname] || "";

    // Tách path thành các phần để hiển thị nhiều cấp
    const pathParts = location.pathname.split("/").filter(Boolean);

    return (
        <div className="header-gioiThieu-block">
            <h3>{title}</h3>
            <ul>
                <li>
                    <Link to="/">Trang chủ</Link>
                </li>
                {pathParts.map((part, index) => {
                    const url = "/" + pathParts.slice(0, index + 1).join("/");
                    const isLast = index === pathParts.length - 1;
                    return (
                        <li key={url}>
                            <i className="fa-solid fa-angle-right"></i>
                            {isLast ? (
                                <span>{breadcrumbMap["/" + part] || part}</span>
                            ) : (
                                <Link to={url}>{breadcrumbMap["/" + part] || part}</Link>
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default Breadcrumb;
