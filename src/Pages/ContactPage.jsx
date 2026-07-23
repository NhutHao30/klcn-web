import React from "react";
import Footer from "../Layout/Footer";

const ContactPage = () => {
    return (
        <>
            <main>
                
        <div className="content-contact">
            <div className="container">
                <div className="row" style={{ alignItems: "center" }}> 

                    <div className="col col-lg-6 col-md-6 col-12">
                         <div style={{ borderRadius: "8px", padding: "12px", backgroundColor: "papayawhip", height: "160px" }}>
                            <h3 className="contact-form__title" style={{ fontSize: "2rem", marginBottom: "20px" }}>Cửa hàng Dola Bakery</h3>
                            <ul style={{ display: "flex", flexWrap: "wrap", height: "80px" }}>
                                <li style={{ display: "flex", gap: "6px", alignItems: "center", width: "50%" }}>
                                    <div style={{ height: "30px", width: "30px", borderRadius: "50%", border: "1px solid var(--primary-color)", lineHeight: "27px", textAlign: "center", fontSize: "1.6rem", color: "var(--primary-color)" }}>
                                        <i className="fa-solid fa-location-dot"></i>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <b>Địa chỉ</b>
                                        <span>140 Lê Trọng Tấn, Tây thạnh, Tân Phú</span>
                                    </div>
                                </li>
                                <li style={{ display: "flex", gap: "6px", alignItems: "center", width: "50%" }}>
                                    <div style={{ height: "30px", width: "30px", borderRadius: "50%", border: "1px solid var(--primary-color)", lineHeight: "27px", textAlign: "center", fontSize: "1.6rem", color: "var(--primary-color)" }}>
                                        <i className="fa-regular fa-clock"></i>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <b>Thời gian làm việc</b>
                                        <span>8h - 22h, từ thứ 2 đến chủ nhật</span>
                                    </div>
                                </li>
                                <li style={{ display: "flex", gap: "6px", alignItems: "center", width: "50%" }}>
                                    <div style={{ height: "30px", width: "30px", borderRadius: "50%", border: "1px solid var(--primary-color)", lineHeight: "27px", textAlign: "center", fontSize: "1.6rem", color: "var(--primary-color)" }}>
                                        <i className="fa-solid fa-phone-volume"></i>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <b>Hot Line</b>
                                        <span>0987675</span>
                                    </div>
                                </li>
                                <li style={{ display: "flex", gap: "6px", alignItems: "center", width: "50%" }}>
                                    <div style={{ height: "30px", width: "30px", borderRadius: "50%", border: "1px solid var(--primary-color)", lineHeight: "27px", textAlign: "center", fontSize: "1.6rem", color: "var(--primary-color)" }}>
                                        <i className="fa-solid fa-envelope"></i>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column" }}>
                                        <b>Email</b>
                                        <span>HoTro@gmail.com</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                        <div className="contact-form mt-30" style={{ borderRadius: "8px", padding: "12px", backgroundColor: "papayawhip" }}>
                            <h3 className="contact-form__title" style={{ fontSize: "2rem" }}>Liên hệ với chúng tôi</h3>
                            <p className="contact-form__subtitle">Nếu bạn có thắc mắc gì, có thể gửi yêu cầu cho chúng tôi, và chúng tôi sẽ liên lạc lại với bạn sớm nhất có thể !</p>
                            <form action="#" className="form">
                                <ul className="form-list">
                                    <li className="form-item">
                                        <input type="text" id="name" className="form-input" placeholder="Họ và tên *" required />
                                    </li>
                                    <li className="form-item">
                                        <input type="email" id="email" className="form-input" placeholder="Email *" required />
                                    </li>
                                    <li className="form-item">
                                        <input type="tel" id="phone" className="form-input" placeholder="Số điện thoại *" required />
                                    </li>
                                    <li className="form-item">
                                        <textarea id="message" className="form-input form-textarea" placeholder="Nội dung liên hệ *" rows="4" required></textarea>
                                    </li>
                                    <li className="form-item">
                                        <button type="submit" className="form-btn">Gửi thông tin</button>
                                    </li>
                                </ul>
                            </form>
                        </div>
                        
                    </div>

                    <div className="col col-lg-6 col-md-6 col-12 mt-30">
                        <div className="contact-map">
                            <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.669356806688!2d106.66366261462294!3d10.759922162239594!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f1b7c3ed289%3A0xa06651894598e488!2s70%20L%E1%BB%AF%20Gia%2C%20Ph%C6%B0%E1%BB%9Dng%2015%2C%20Qu%E1%BA%ADn%2011%2C%20H%E1%BB%93%20Ch%C3%AD%20Minh%2C%20Vietnam!5e0!3m2!1sen!2s!4v1698765432109!5m2!1sen!2s"
                                    height="600"
                                    style={{ border: "0" }}
                                    loading="lazy"
                                    referrerpolicy="no-referrer-when-downgrade">
                            </iframe>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    
            </main>
            <Footer />
        </>
    );
};

export default ContactPage;
