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
                            <p>Givral Bakery là một tiệm bánh nằm ẩn mình giữa phố xá nhộn nhịp của thành phố. Với bề dày hơn 10
                                năm kinh nghiệm trong lĩnh vực làm bánh, Givral Bakery đã nhanh chóng trở thành điểm đến lý tưởng
                                cho những ai đam mê bánh ngọt và muốn thưởng thức những món đặc sản tại địa phương.</p>
                            <p>Tiệm bánh nổi tiếng này tự hào sở hữu một đội ngũ nhân viên tận tâm và giàu kinh nghiệm. Họ không
                                chỉ đảm bảo mang đến cho khách hàng những món bánh được làm tinh tế với sự tỉ mỉ và tình yêu, mà
                                còn luôn sẵn lòng lắng nghe và đáp ứng mọi nhu cầu đặc biệt của khách hàng.</p>
                            <p>Sự phong phú và đa dạng của thực đơn tại Givral Bakery là một điểm nhấn đáng chú ý. Khách hàng có
                                thể chọn từ một loạt các loại bánh tươi ngon như bánh mousse, bánh su kem, bánh tart, bánh gạo,
                                bánh tiramisu, bánh phô mai, bánh cookie và nhiều loại bánh khác nữa. Mỗi món bánh đều được chế
                                biến từ những nguyên liệu tươi ngon nhất và được trang trí tỉ mỉ, mang lại một trải nghiệm
                                thưởng thức thật tuyệt vời.</p>
                            <p>Không chỉ chăm chút vào hương vị, Givral Bakery cũng đặc biệt quan tâm đến việc thể hiện sự sáng
                                tạo và độc đáo trong từng chi tiết trên các món bánh của mình. Bạn có thể tìm thấy những chiếc
                                bánh được trang trí tinh tế với hình dáng, màu sắc và hoa văn độc đáo. Những điểm nhấn này không
                                chỉ làm cho bánh thêm đẹp mắt mà còn tạo nên một phong cách riêng biệt cho Givral Bakery.</p>
                            <p>Khách hàng đã trở thành fan hâm mộ của Givral Bakery không chỉ vì những món bánh ngon mà còn vì
                                không gian ấm cúng và thoải mái tại tiệm. Với thiết kế sang trọng nhưng cổ điển, Givral Bakery tạo
                                ra một môi trường lý tưởng để thư giãn và thưởng thức bánh ngọt. Bạn có thể ngồi thoải mái,
                                thưởng thức một ly cà phê nóng và thúc đẩy hương vị bánh ngọt bằng những cuộn giấy nhiệt động
                                mời mọc.</p>
                            <p>Givral Bakery không chỉ đáng để tham quan mà còn là điểm dừng chân lí tưởng để tìm mua những món
                                bánh ngon nhất. Cho dù bạn muốn tổ chức một bữa tiệc, mua một chiếc bánh sinh nhật đặc biệt hay
                                đơn giản là muốn thưởng thức một chiếc bánh nhỏ đầy mê hoặc, Givral Bakery sẽ luôn là sự lựa chọn
                                hàng đầu của bạn.</p>
                            <p>Hãy đến với Givral Bakery và hãy để những món bánh tuyệt vời của chúng tôi làm cho cuộc sống bạn
                                thêm ngọt ngào</p>
                        </div>

                        <div className="row">
                            <div className="content-ourTeam-block mb-90">
                                <p>Our Team</p>
                                <span className="">We're Super Professional At Our Skills</span>
                                <ul 
                                    className="content-ourTeam-list" 
                                    style={{ 
                                        display: 'flex',
                                        flexDirection: 'row',
                                        flexWrap: 'nowrap',
                                        justifyContent: 'center',
                                        alignItems: 'stretch',
                                        gap: '16px',
                                        width: '100%',
                                        padding: 0,
                                        margin: '0 auto',
                                        listStyle: 'none',
                                        overflowX: 'auto'
                                    }}
                                >
                                    {/* 1. Kống Bữu Kim - dev FrontEnd */}
                                    <li 
                                        className="content-ourTeam-item content-ourTeam-item-js" 
                                        style={{ flex: '1 1 0', minWidth: '170px', maxWidth: '220px', margin: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}
                                    >
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="Kống Bữu Kim" className="content-ourTeam-img" style={{ height: '260px', objectFit: 'cover' }} />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name" style={{ fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
                                                    Kống Bữu Kim
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    dev FrontEnd
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-github"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-solid fa-envelope"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* 2. Kống Bữu Kim - designer */}
                                    <li 
                                        className="content-ourTeam-item content-ourTeam-item-js" 
                                        style={{ flex: '1 1 0', minWidth: '170px', maxWidth: '220px', margin: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}
                                    >
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="Kống Bữu Kim" className="content-ourTeam-img" style={{ height: '260px', objectFit: 'cover' }} />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name" style={{ fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
                                                    Kống Bữu Kim
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    designer
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-github"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-solid fa-envelope"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* 3. Trương Nhựt Hào - Team Leader (VÀO CHÍNH GIỮA) */}
                                    <li 
                                        className="content-ourTeam-item content-ourTeam-item-js" 
                                        style={{ flex: '1 1 0', minWidth: '170px', maxWidth: '220px', margin: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}
                                    >
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="Trương Nhựt Hào" className="content-ourTeam-img" style={{ height: '260px', objectFit: 'cover' }} />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name" style={{ fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
                                                    Trương Nhựt Hào
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    Team Leader
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-github"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-solid fa-envelope"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* 4. Nguyễn Hữu Thiện - dev BackEnd */}
                                    <li 
                                        className="content-ourTeam-item content-ourTeam-item-js" 
                                        style={{ flex: '1 1 0', minWidth: '170px', maxWidth: '220px', margin: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}
                                    >
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="Nguyễn Hữu Thiện" className="content-ourTeam-img" style={{ height: '260px', objectFit: 'cover' }} />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name" style={{ fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
                                                    Nguyễn Hữu Thiện
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    dev BackEnd
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-github"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-solid fa-envelope"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </li>

                                    {/* 5. Nguyễn Hữu Thiện - Tester */}
                                    <li 
                                        className="content-ourTeam-item content-ourTeam-item-js" 
                                        style={{ flex: '1 1 0', minWidth: '170px', maxWidth: '220px', margin: 0 }}
                                        onMouseEnter={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '-100%'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '0'; }} 
                                        onMouseLeave={(e) => { e.currentTarget.querySelector('.content-ourTeam-des-js').style.top = '0'; e.currentTarget.querySelector('.content-ourTeam-contact-js').style.top = '100%'; }}
                                    >
                                        <img src="../../assets/IMG/avatar-user.jpg" alt="Nguyễn Hữu Thiện" className="content-ourTeam-img" style={{ height: '260px', objectFit: 'cover' }} />
                                        <div className="content-ourTeam-info content-ourTeam-info-js">
                                            <div className="content-ourTeam-des content-ourTeam-des-js">
                                                <div className="content-ourTeam-name" style={{ fontSize: '1.6rem', whiteSpace: 'nowrap' }}>
                                                    Nguyễn Hữu Thiện
                                                </div>
                                                <div className="content-ourTeam-tast">
                                                    Tester
                                                </div>
                                            </div>
                                            <div className="content-ourTeam-contact content-ourTeam-contact-js">
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-facebook-f"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-brands fa-github"></i>
                                                    </a>
                                                </div>
                                                <div className="content-ourTeam-contact-icon-block">
                                                    <a href="#!">
                                                        <i className="content-ourTeam-contact-icon fa-solid fa-envelope"></i>
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>

            <Footer />
        </main>
    );
};

export default AboutPage;
