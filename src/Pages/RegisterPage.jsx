import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../Layout/Footer";
import { register } from "../services/authService";

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        repassword: "",
        HOTEN: "",
        GioiTinh: "Nam",
        SDT: "",
        EMAIL: ""
    });
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError("");
        
        if (!formData.username || !formData.password || !formData.repassword || !formData.HOTEN || !formData.SDT || !formData.EMAIL) {
            setError("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (formData.password !== formData.repassword) {
            setError("Mật khẩu nhập lại không khớp!");
            return;
        }

        try {
            const res = await register(formData);
            alert(res.message || "Đăng ký thành công!");
            navigate("/dang-nhap");
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Đã xảy ra lỗi khi đăng ký!";
            setError(errorMsg);
        }
    };

    return (
        <>
            <main>
                <div className="container">
                    <div className="Register-list">
                        <div className="Register__header">
                            <Link to="/dang-nhap" className="Register-LoginNav">Đăng Nhập</Link>
                            <Link to="/dang-ky" className="Register-RegisterNav active">Đăng Ký</Link>
                        </div>

                        <div className="Register__body">
                            <div className="Register-titleRegister">Đăng Ký</div>
                            
                            {error && <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

                            <form onSubmit={handleRegister}>
                                <input type="text" name="username" className="Register-input" placeholder="Tên đăng nhập *" value={formData.username} onChange={handleChange} />
                                <input type="password" name="password" className="Register-input" placeholder="Mật khẩu *" value={formData.password} onChange={handleChange} />
                                <input type="password" name="repassword" className="Register-input" placeholder="Nhập lại Mật khẩu *" value={formData.repassword} onChange={handleChange} />
                                <input type="text" name="HOTEN" className="Register-input" placeholder="Họ và tên *" value={formData.HOTEN} onChange={handleChange} />
                                <input type="email" name="EMAIL" className="Register-input" placeholder="Email *" value={formData.EMAIL} onChange={handleChange} />
                                <input type="text" name="SDT" className="Register-input" placeholder="Số điện thoại *" value={formData.SDT} onChange={handleChange} />
                                
                                <select name="GioiTinh" className="Register-input" value={formData.GioiTinh} onChange={handleChange} style={{ padding: "10px", marginTop: "10px", width: "100%", borderRadius: "4px", border: "1px solid #ccc" }}>
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                                
                                <button type="submit" className="Register-RegisterBtn" style={{ border: "none", width: "100%", cursor: "pointer", display: "block", textAlign: "center", marginTop: "20px" }}>Đăng Ký</button>
                            </form>
                        </div>  

                        <div className="Register__footer">
                            <p>Hoặc đăng nhập bằng</p>
                            <span className="Register__Social displayFLex">
                                <a href="#" className="Register__Social-link facebookBG">
                                    <div className="Register__Social-icon">
                                        <i className="Social-icon__facebook fa-brands fa-facebook-f"></i>
                                    </div>
                                    <div className="Register__Social-text">Facebook</div>
                                </a>
                                <a href="http://localhost:8080/oauth2/authorization/google" className="Register__Social-link gooleBG">
                                    <div className="Register__Social-icon">
                                        <i className="Social-icon__google fa-brands fa-google-plus-g"></i>
                                    </div>
                                    <div className="Register__Social-text">Google</div>
                                </a>
                            </span>
                        </div>                      
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default RegisterPage;
