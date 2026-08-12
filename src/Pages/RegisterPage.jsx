import { BASE_URL } from '../services/axiosClient';
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../Layout/Footer";
import { register } from "../services/authService";
import { useToast } from '../components/Toast/Toast';

const RegisterPage = () => {
      const toast = useToast();
const [formData, setFormData] = useState({
        username: "",
        password: "",
        repassword: "",
        HOTEN: "",
        GioiTinh: "Nam",
        SDT: "",
        EMAIL: ""
    });
    const [toastError, setToastError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepassword, setShowRepassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showError = (msg) => {
        setToastError(msg);
        setTimeout(() => {
            setToastError("");
        }, 5000);
    };

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setToastError("");
        
        if (!formData.username || !formData.password || !formData.repassword || !formData.HOTEN || !formData.SDT || !formData.EMAIL) {
            showError("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        if (formData.password !== formData.repassword) {
            showError("Mật khẩu nhập lại không khớp!");
            return;
        }

        try {
            const res = await register(formData);
            toast.success(res.message || "Đăng ký thành công!");
            navigate("/dang-nhap");
        } catch (e) {
            const errorMsg = e.response?.data?.message || e.response?.data?.error || "Đã xảy ra lỗi khi đăng ký!";
            showError(errorMsg);
        }
    };

    return (
        <>
            {toastError && (
                <div style={{
                    position: "fixed",
                    top: "20px",
                    right: "20px",
                    backgroundColor: "#e74c3c",
                    color: "white",
                    padding: "15px 20px",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    transition: "opacity 0.3s ease"
                }}>
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{toastError}</span>
                    <button 
                        onClick={() => setToastError("")}
                        style={{
                            background: "transparent",
                            border: "none",
                            color: "white",
                            cursor: "pointer",
                            marginLeft: "15px",
                            fontSize: "20px",
                            lineHeight: "1"
                        }}
                    >
                        &times;
                    </button>
                </div>
            )}
            <main>
                <div className="container">
                    <div className="Register-list">
                        <div className="Register__header">
                            <Link to="/dang-nhap" className="Register-LoginNav">Đăng Nhập</Link>
                            <Link to="/dang-ky" className="Register-RegisterNav active">Đăng Ký</Link>
                        </div>

                        <div className="Register__body">
                            <div className="Register-titleRegister">Đăng Ký</div>
                            
                            <form onSubmit={handleRegister}>
                                <input type="text" name="username" className="Register-input" placeholder="Tên đăng nhập *" value={formData.username} onChange={handleChange} />
                                
                                <div style={{ position: "relative", marginBottom: "15px" }}>
                                    <input type={showPassword ? "text" : "password"} name="password" className="Register-input" style={{ marginBottom: 0 }} placeholder="Mật khẩu *" value={formData.password} onChange={handleChange} />
                                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                        style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}
                                        onClick={() => setShowPassword(!showPassword)}
                                    ></i>
                                </div>

                                <div style={{ position: "relative", marginBottom: "15px" }}>
                                    <input type={showRepassword ? "text" : "password"} name="repassword" className="Register-input" style={{ marginBottom: 0 }} placeholder="Nhập lại Mật khẩu *" value={formData.repassword} onChange={handleChange} />
                                    <i className={`fa-solid ${showRepassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                        style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}
                                        onClick={() => setShowRepassword(!showRepassword)}
                                    ></i>
                                </div>
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
                                <a href={`${BASE_URL}/api/auth/google`} className="Register__Social-link gooleBG">
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
