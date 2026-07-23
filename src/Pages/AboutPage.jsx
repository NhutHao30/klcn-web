import React from "react";
import Footer from "../Layout/Footer";

const AboutPage = () => {
    return (
        <main>
            

                <div className="content mt-30">
                    <div className="container">
                        <div className="content-gioiThieu-background">
                            <div className="title-gioiThieu">
                                <a href="">Giới thiệu</a>
                            </div>
                            <p>Dola Bakery là một tiệm bánh nằm ẩn mình giữa phố xá nhộn nhịp của thành phố. Với bề dày hơn 10
                                năm kinh nghiệm trong lĩnh vực làm bánh, Dola Bakery đã nhanh chóng trở thành điểm đến lý tưởng
                                cho những ai đam mê bánh ngọt và muốn thưởng thức những món đặc sản tại địa phương.</p>
                            <p>Tiệm bánh nổi tiếng này tự hào sở hữu một đội ngũ nhân viên tận tâm và giàu kinh nghiệm. Họ không
                                chỉ đảm bảo mang đến cho khách hàng những món bánh được làm tinh tế với sự tỉ mỉ và tình yêu, mà
                                còn luôn sẵn lòng lắng nghe và đáp ứng mọi nhu cầu đặc biệt của khách hàng.</p>
                            <p>Sự phong phú và đa dạng của thực đơn tại Dola Bakery là một điểm nhấn đáng chú ý. Khách hàng có
                                thể chọn từ một loạt các loại bánh tươi ngon như bánh mousse, bánh su kem, bánh tart, bánh gạo,
                                bánh tiramisu, bánh phô mai, bánh cookie và nhiều loại bánh khác nữa. Mỗi món bánh đều được chế
                                biến từ những nguyên liệu tươi ngon nhất và được trang trí tỉ mỉ, mang lại một trải nghiệm
                                thưởng thức thật tuyệt vời.</p>
                            <p>Không chỉ chăm chút vào hương vị, Dola Bakery cũng đặc biệt quan tâm đến việc thể hiện sự sáng
                                tạo và độc đáo trong từng chi tiết trên các món bánh của mình. Bạn có thể tìm thấy những chiếc
                                bánh được trang trí tinh tế với hình dáng, màu sắc và hoa văn độc đáo. Những điểm nhấn này không
                                chỉ làm cho bánh thêm đẹp mắt mà còn tạo nên một phong cách riêng biệt cho Dola Bakery.</p>
                            <p>Khách hàng đã trở thành fan hâm mộ của Dola Bakery không chỉ vì những món bánh ngon mà còn vì
                                không gian ấm cúng và thoải mái tại tiệm. Với thiết kế sang trọng nhưng cổ điển, Dola Bakery tạo
                                ra một môi trường lý tưởng để thư giãn và thưởng thức bánh ngọt. Bạn có thể ngồi thoải mái,
                                thưởng thức một ly cà phê nóng và thúc đẩy hương vị bánh ngọt bằng những cuộn giấy nhiệt động
                                mời mọc.</p>
                            <p>Dola Bakery không chỉ đáng để tham quan mà còn là điểm dừng chân lí tưởng để tìm mua những món
                                bánh ngon nhất. Cho dù bạn muốn tổ chức một bữa tiệc, mua một chiếc bánh sinh nhật đặc biệt hay
                                đơn giản là muốn thưởng thức một chiếc bánh nhỏ đầy mê hoặc, Dola Bakery sẽ luôn là sự lựa chọn
                                hàng đầu của bạn.</p>
                            <p>Hãy đến với Dola Bakery và hãy để những món bánh tuyệt vời của chúng tôi làm cho cuộc sống bạn
                                thêm ngọt ngào</p>
                        </div>

                        <div className="row">
                            <div className="content-ourTeam-block mb-90">
                                <p>Our Team</p>
                                <span className="">We're Super Professional At Our Skills</span>
                                <div className="row content-ourTeam-list">
                                    <li className="content-ourTeam-item content-ourTeam-item-js col-lg-3 col-md-4 col-11" onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}>
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="content-ourTeam-img" />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name">
                                                    Trương Nhựt Hào
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    dev FrontEnd
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-x-twitter"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-instagram"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                    </li>
                                    <li className="content-ourTeam-item content-ourTeam-item-js col-lg-3 col-md-4 col-11" onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}>
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="content-ourTeam-img" />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name">
                                                    Nhựt Trương Hào
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    designer
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-x-twitter"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-instagram"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                    </li>
                                    <li className="content-ourTeam-item content-ourTeam-item-js col-lg-3 col-md-4 col-11" onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}>
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="content-ourTeam-img" />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name">
                                                    Trương Hào Nhựt
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    dev BackEnd
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-x-twitter"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-instagram"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                    </li>
                                    <li className="content-ourTeam-item content-ourTeam-item-js col-lg-3 col-md-4 col-11" onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}>
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="" className="content-ourTeam-img" />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name">
                                                    Hào Nhựt Trương
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    Tester
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-x-twitter"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-instagram"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>

                                    </li>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

            <Footer />
        </main>
    );
};

export default AboutPage;
