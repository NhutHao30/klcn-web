import React, { useState } from "react";
import Footer from "../Layout/Footer";
import { sendContactEmail } from "../services/contactService";

const FaqItem = ({ question, children }) => {
    const [isActive, setIsActive] = useState(false);

    return (
        <div className={`faq-item ${isActive ? 'active' : ''}`}>
            <div className="faq-question" onClick={() => setIsActive(!isActive)}>
                <span>{question}</span>
                <i className={`fa-solid fa-chevron-${isActive ? 'up' : 'down'} faq-icon`}></i>
            </div>
            <div className="faq-answer">
                {children}
            </div>
        </div>
    );
};

const FAQPage = () => {
    const [formData, setFormData] = useState({
        hoTen: "",
        email: "",
        dienThoai: "",
        noiDung: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await sendContactEmail(formData);
            alert("Gửi yêu cầu giải đáp thắc mắc thành công! Chúng tôi sẽ phản hồi qua email của bạn.");
            setFormData({ hoTen: "", email: "", dienThoai: "", noiDung: "" }); // reset form
        } catch (error) {
            alert(error.message || "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <main>
                <div className="content-faq">
                    <div className="container">
                        <div className="row">
                            <div className="col-lg-8 col-md-12 col-12">
                                <h2 className="faq-section__title">Hỏi đáp về tài khoản</h2>

                                <div className="faq-list">
                                    <FaqItem question="1. Làm thế nào để tôi trở thành thành viên của Dola?">
                                        <p>Quý khách vui lòng nhấn vào nút “Đăng ký” ở thanh menu trên cùng của màn hình (Đối với Desktop) hoặc tại góc trái màn hình, chọn biểu tượng Menu rồi chọn “Đăng ký” (Đối với Mobile). </p>
                                    </FaqItem>
                                    
                                    <FaqItem question="2. Tại sao tôi không thể đăng nhập vào tài khoản của tôi?">
                                        <p>Quý khách vui lòng kiểm tra kỹ về kiểu gõ hoặc phím Caps Lock/ IN HOA trong quá trình điền thông tin đăng nhập thành viên, trường hợp không thể đăng nhập thành công quý khách vui lòng chọn nút “Quên mật khẩu” ngay dưới ô mật khẩu và nhập email đã đăng ký.</p>
                                    </FaqItem>
                                    
                                    <FaqItem question="3. Tôi có thể sử dụng chung tài khoản với người khác được không?">
                                        <p>Quý khách nên sử dụng tài khoản cá nhân để đảm bảo độ tin cậy cũng như quyền lợi của bản thân khi mua sắm. Việc sử dụng chung tài khoản có thể dẫn đến những sai sót mà người chịu ảnh hưởng trực tiếp chính là quý khách hàng.</p>
                                    </FaqItem>
                                    
                                    <FaqItem question="4. Tại sao tôi nên đăng ký thành viên Dola?">
                                        <p>Việc đăng ký tài khoản là cơ hội giúp quý khách trở thành một trong những khách hàng thân thiết của Dola, được tiếp cận nhanh nhất các chương trình khuyến mãi, thông tin ưu đãi khi mua sắm.</p>
                                    </FaqItem>
                                    
                                    <FaqItem question="5. Dola có chương trình ưu đãi nào hấp dẫn dành cho khách hàng thân thiết?">
                                        <p>Khi tổng giá trị đơn hàng của quý khách tích lũy đạt đủ điều kiện của từng mức hạng thành viên, quý khách sẽ nhận được ưu đãi giảm giá cho mọi đơn hàng tương, voucher sinh nhật tương ứng của hạng mức thành viên.</p>
                                    </FaqItem>
                                </div>
                                
                                <div className="content-faq">
                                    <h2 className="faq-section__title">Hỏi đáp về đặt hàng</h2>
                                    <div className="faq-list">
                                        <FaqItem question="1. Tôi có thể đặt hàng bằng những hình thức nào?">
                                            <p>
                                                Quý khách có thể mua hàng tại Dola bằng những hình thức Mua hàng trực tiếp tại các hệ thống cửa hàng hoặc Đặt hàng trực tuyến tại website
                                                Dola luôn khuyến khích quý khách tạo tài khoản và đặt hàng online để được hưởng các chính sách ưu đãi thành viên tốt hơn.
                                            </p>
                                        </FaqItem>
                                        
                                        <FaqItem question="2. Tôi cần hỗ trợ mua hàng, làm cách nào để liên hệ với tư vấn viên?">
                                            <p>Để liên hệ với nhân viên tư vấn, quý khách vui lòng liên hệ qua Hotline 1900 6750 trong thời gian từ 9:00 – 18:00,  T2 – T6 hằng tuần.</p>
                                        </FaqItem>
                                        
                                        <FaqItem question="3. Dola có giới hạn về số lượng sản phẩm khi đặt hàng không?">
                                            <p>Quý khách có thể đặt hàng với số lượng sản phẩm tùy ý. Đối với các sản phẩm có giới hạn về số lượng (trong các dịp flashsale, sale các dịp lễ Tết), hệ thống sẽ cập nhật số lượng được  mua tối đa và chỉ ghi nhận đơn hàng có số lượng đặt mua trong giới hạn.</p>
                                        </FaqItem>
                                        
                                        <FaqItem question="4. Tôi muốn xem lại lịch sử đơn hàng đã mua?">
                                            <p>
                                                Quý khách vui lòng liên hệ tư vấn viên của Dola Hotline 1900 6750 để được hủy hoặc thay đổi sản phẩm trong đơn hàng.
                                                <br />
                                                Lưu ý: Đơn hàng chỉ được hủy khi đơn hàng của quý khách chưa chuyển trạng thái cho đơn vị vận chuyển.
                                            </p>
                                        </FaqItem>
                                    </div>
                                </div>

                                <div className="content-faq">
                                    <h2 className="faq-section__title">Hỏi đáp về giao hàng</h2>
                                    <div className="row">
                                        <div className="faq-list">
                                            <FaqItem question="1. Tôi có thể đặt hàng bằng những hình thức nào?">
                                                <p>
                                                    Dola áp dụng giao hàng trên toàn quốc cho tất cả giá trị đơn hàng. Phí vận chuyển và thời gian giao hàng sẽ thay đổi tùy thuộc vào giá trị đơn hàng và từng khu vực cụ thể.
                                                </p>
                                            </FaqItem>
                                            
                                            <FaqItem question="2. Tôi có được hỗ trợ phí vận chuyển không?">
                                                <p>
                                                    Dola hỗ trợ Miễn phí vận chuyển cho khách hàng theo khu vực và giá trị đơn hàng:
                                                    <br />
                                                    TP.HCM: Miễn phí vận chuyển với đơn hàng từ 500,000
                                                    <br />
                                                    Toàn quốc: Miễn phí vận chuyển với đơn hàng từ 1,500,000
                                                    <br />
                                                    Đối với đơn hàng chưa đạt điều kiện miễn phí vận chuyển sẽ có phí giao dựa trên ước tính hiển thị trên website. Phí giao nhận tính trên trọng lượng hàng hóa, hình thức chuyển phát nhanh hay thường và vị trí địa lý. Do đó, mức chi phí này phụ thuộc vào từng điều kiện cụ thể.
                                                </p>
                                            </FaqItem>
                                            
                                            <FaqItem question="3. Bao lâu thì tôi sẽ nhận được sản phẩm sau khi hoàn tất đặt hàng?">
                                                <p>
                                                    Đối với khu vực nội thành Hồ Chí Minh, thời gian giao hàng dao động trong khoảng 1 – 2 ngày làm việc; đối với khu vực ngoại thành và các tỉnh, thời gian trung bình nhận hàng dao động từ 3 – 5 ngày.
                                                    Lưu ý:
                                                    <br />
                                                    Thời gian giao hàng được tính từ lúc Dola hoàn tất việc xác nhận đơn hàng đến khi nhận được hàng, không kể ngày lễ hay thứ 7 và chủ nhật.
                                                    <br />
                                                    Trường hợp khách hàng tại Hồ Chí Minh có nhu cầu nhận hàng hỏa tốc, vui lòng liên hệ trực tiếp tới Hotline 1900 6750 để được hỗ trợ.
                                                </p>
                                            </FaqItem>
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="col l-4 m-12 c-12">
                                <div className="support-form">
                                    <h2 className="support-form__title">Giải đáp thắc mắc</h2>
                                    <p className="support-form__desc">
                                        Nếu bạn có thắc mắc gì, có thể gửi yêu cầu cho chúng tôi, và chúng tôi sẽ liên lạc lại với bạn sớm nhất có thể.
                                    </p>
                                    <form className="support-form__form" onSubmit={handleSubmit}>
                                        <input type="text" name="hoTen" value={formData.hoTen} onChange={handleInputChange} className="support-form__input" placeholder="Họ và tên" required />
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="support-form__input" placeholder="Email" required />
                                        <input type="tel" name="dienThoai" value={formData.dienThoai} onChange={handleInputChange} className="support-form__input" placeholder="Điện thoại*" required />
                                        <textarea name="noiDung" value={formData.noiDung} onChange={handleInputChange} className="support-form__textarea" placeholder="Nội dung" rows="4" required></textarea>
                                        <button type="submit" className="support-form__btn" disabled={isSubmitting}>
                                            {isSubmitting ? "Đang gửi..." : "Gửi thông tin"}
                                        </button>
                                    </form>
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

export default FAQPage;
