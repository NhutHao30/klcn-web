import { useState, useEffect } from "react";

const HeaderSlideShow = () => {
    // Nếu ảnh nằm trong public/assets/IMG thì gọi như sau:
    const images = [
        "/assets/IMG/header_img_1.webp",
        "/assets/IMG/Header_img.webp",
    ];

    const [currentIndex, setCurrentIndex] = useState(0);
    const [flip, setFlip] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);

            setFlip(true);

            // sau 2s thì xóa class flip
            setTimeout(() => setFlip(false), 2000);
        }, 3000); // đổi ảnh mỗi 3 giây

        return () => clearInterval(interval); // cleanup khi component unmount
    }, [images.length]);

    return (
        <div className="header-slideshow">
            <img
                src={images[currentIndex]}
                alt="slide"
                className={`header-img header-img-js`}
            />
            <div className="saleOf hide-on-mobile">
                <ul className={`saleOf-list saleOf-list-js ${flip ? "flip" : ""}`}>
                    <li className="saleOf-item">
                        <h3 className="saleOf-h3">Bánh tươi mỗi ngày</h3>
                    </li>
                    <li className="saleOf-item">
                        <p className="saldeOf-p">Giảm đến 20% khi mua hàng qua web</p>
                    </li>
                    <li className="saleOf-item">
                        <a href="#" className="saleOf-link">Xem ngay</a>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default HeaderSlideShow;
