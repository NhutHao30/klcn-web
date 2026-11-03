import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer>
            <div className="footer mt-30">
                <div className="container-fluid pd0">
                    <div className="footer-background">
                        <div className="footer-content">
                            <div className="container">
                                <div className="row footer-content-list">
                                    {/* CỘT 1: LOGO & THANH TOÁN */}
                                    <div className="col-12 col-md-6 col-lg-3 footer-content-item mt-20">
                                        <div className="footer-content-item__img">
                                            <Link to="/">
                                                <img src="/assets/IMG/Logo.png" alt="Givral Bakery" className="logoft" style={{ objectFit: "contain", borderRadius: "8px" }} />
                                            </Link>
                                        </div>
                                        <div className="footer-content-item_text fw-600" style={{ width: "95%", fontSize: "1.25rem", lineHeight: "1.6" }}>
                                            <p style={{ margin: "10px 0" }}>
                                                Hãy đến với Givral Bakery và hãy để những món bánh tuyệt vời của chúng tôi làm cho cuộc sống bạn thêm ngọt ngào
                                            </p>
                                        </div>
                                        <div className="footer-content-item__pay">
                                            <p className="fs-2rem" style={{ margin: "12px 0 8px 0", fontWeight: 700 }}>HÌNH THỨC THANH TOÁN</p>
                                        </div>
                                        <div className="footer-content-item__pay-img" style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                            <img src="/assets/IMG/payimg-1.webp" alt="Tiền mặt" className="payImg" style={{ width: "50px", height: "30px", objectFit: "contain" }} />
                                            <img src="/assets/IMG/payimg-2.webp" alt="Chuyển khoản" className="payImg" style={{ width: "50px", height: "30px", objectFit: "contain" }} />
                                            <img src="/assets/IMG/payimg-3.webp" alt="Thẻ tín dụng" className="payImg" style={{ width: "50px", height: "30px", objectFit: "contain" }} />
                                        </div>
                                    </div>

                                    {/* CỘT 2: CHÍNH SÁCH */}
                                    <div className="col-12 col-md-6 col-lg-3 footer-content-item mt-20">
                                        <h3 className="fs-2rem" style={{ fontWeight: 700, marginBottom: "16px" }}>CHÍNH SÁCH</h3>
                                        <p className="fs-16rem"><Link to="/cau-hoi-thuong-gap">Chính sách thành viên</Link></p>
                                        <p className="fs-16rem"><Link to="/cau-hoi-thuong-gap">Chính sách thanh toán</Link></p>
                                        <p className="fs-16rem"><Link to="/cau-hoi-thuong-gap">Hướng dẫn mua hàng</Link></p>
                                        <p className="fs-16rem"><Link to="/cau-hoi-thuong-gap">Quà tặng tri ân</Link></p>
                                        <p className="fs-16rem"><Link to="/cau-hoi-thuong-gap">Bảo mật thông tin cá nhân</Link></p>
                                    </div>

                                    {/* CỘT 3: THÔNG TIN CHUNG */}
                                    <div className="col-12 col-md-6 col-lg-3 footer-content-item mt-20">
                                        <h3 className="fs-2rem" style={{ fontWeight: 700, marginBottom: "16px" }}>THÔNG TIN CHUNG</h3>
                                        <p className="fs-16rem" style={{ margin: "0 0 8px 0" }}><span style={{ fontWeight: 600 }}>Địa chỉ: </span>70 Lữ Gia, Phường 15, Quận 11, TP.HCM</p>
                                        <p className="fs-16rem" style={{ margin: "0 0 8px 0" }}><span style={{ fontWeight: 600 }}>Điện thoại: </span>1900 6750</p>
                                        <p className="fs-16rem" style={{ margin: "0 0 8px 0" }}><span style={{ fontWeight: 600 }}>Email: </span>support@sapo.vn</p>
                                        <h4 className="fs-16rem" style={{ margin: "16px 0 8px 0", fontWeight: 700, textTransform: "uppercase", color: "var(--primary-color)" }}>LIÊN KẾT SÀN</h4>
                                        <ul className="img-pay-list" style={{ display: "flex", gap: "10px", listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                                            <li className="img-pay-item">
                                                <a href="https://shopee.vn" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/shopee.webp" alt="Shopee" className="img-pay-item-shopee" />
                                                </a>
                                            </li>
                                            <li className="img-pay-item">
                                                <a href="https://lazada.vn" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/lazada.webp" alt="Lazada" className="img-pay-item-lazada" />
                                                </a>
                                            </li>
                                            <li className="img-pay-item">
                                                <a href="https://tiki.vn" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/tiki.webp" alt="Tiki" className="img-pay-item-tiki" />
                                                </a>
                                            </li>
                                            <li className="img-pay-item">
                                                <a href="https://sendo.vn" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/sendo.webp" alt="Sendo" className="img-pay-item-sendo" />
                                                </a>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* CỘT 4: HỖ TRỢ & MẠNG XÃ HỘI */}
                                    <div className="col-12 col-md-6 col-lg-3 footer-content-item mt-20">
                                        <h3 className="fs-2rem" style={{ fontWeight: 700, marginBottom: "16px" }}>HỖ TRỢ</h3>
                                        <div style={{ marginBottom: "12px" }}>
                                            <p className="fs-16rem" style={{ margin: "0 0 2px 0", fontWeight: 600, color: "#333" }}>
                                                MUA ONLINE (08:00 - 21:00 mỗi ngày)
                                            </p>
                                            <p style={{ margin: "2px 0", fontSize: "1.6rem", fontWeight: 700, color: "var(--primary-color)" }}>
                                                1900 6750
                                            </p>
                                            <p style={{ margin: 0, fontSize: "1.2rem", color: "#666", fontWeight: 400 }}>
                                                Tất cả các ngày trong tuần (Trừ tết Âm Lịch)
                                            </p>
                                        </div>

                                        <div style={{ marginBottom: "14px" }}>
                                            <p className="fs-16rem" style={{ margin: "0 0 2px 0", fontWeight: 600, color: "#333" }}>
                                                GÓP Ý & KHIẾU NẠI (08:30 - 20:30)
                                            </p>
                                            <p style={{ margin: "2px 0", fontSize: "1.6rem", fontWeight: 700, color: "var(--primary-color)" }}>
                                                1900 6750
                                            </p>
                                            <p style={{ margin: 0, fontSize: "1.2rem", color: "#666", fontWeight: 400 }}>
                                                Tất cả các ngày trong tuần (Trừ tết Âm Lịch)
                                            </p>
                                        </div>

                                        <h4 className="fs-16rem" style={{ margin: "14px 0 8px 0", fontWeight: 700, textTransform: "uppercase", color: "var(--primary-color)" }}>
                                            MẠNG XÃ HỘI
                                        </h4>
                                        <ul className="img-socials-list" style={{ display: "flex", gap: "10px", listStyle: "none", padding: 0, margin: "8px 0 0 0" }}>
                                            <li className="img-socials-item">
                                                <a href="https://zalo.me" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/zalo.webp" alt="Zalo" className="img-socials-item-zalo" />
                                                </a>
                                            </li>
                                            <li className="img-socials-item">
                                                <a href="https://facebook.com" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/facebook.webp" alt="Facebook" className="img-socials-item-facebook" />
                                                </a>
                                            </li>
                                            <li className="img-socials-item">
                                                <a href="https://youtube.com" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/youtube.webp" alt="Youtube" className="img-socials-item-youtube" />
                                                </a>
                                            </li>
                                            <li className="img-socials-item">
                                                <a href="https://google.com" target="_blank" rel="noreferrer">
                                                    <img src="/assets/IMG/google.webp" alt="Google" className="img-socials-item-google" />
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BOTTOM COPYRIGHT BAR */}
                        <div className="footer-footer">
                            <span>
                                <p style={{ fontSize: "1.3rem", color: "#444" }}>
                                    Bản quyền thuộc về <b>Givral Bakery</b>. Cung cấp bởi Sapo
                                </p>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
