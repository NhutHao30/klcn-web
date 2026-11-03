import { BASE_URL } from '../services/axiosClient';
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../Layout/Footer";
import { register, sendRegisterOtp } from "../services/authService";
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
    const [step, setStep] = useState(1); // 1: Nhập thông tin, 2: Xác thực OTP Gmail
    const [otpCode, setOtpCode] = useState("");
    const [countdown, setCountdown] = useState(0);
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [toastError, setToastError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showRepassword, setShowRepassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => {
            setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const showError = (msg) => {
        setToastError(msg);
        setTimeout(() => {
            setToastError("");
        }, 5000);
    };

    const extractErrorMsg = (e, fallback = "Đã xảy ra lỗi!") => {
        const errorData = e.response?.data;
        let errorMsg = null;
        if (errorData?.errors && typeof errorData.errors === 'object') {
            const firstKey = Object.keys(errorData.errors)[0];
            if (Array.isArray(errorData.errors[firstKey]) && errorData.errors[firstKey].length > 0) {
                errorMsg = errorData.errors[firstKey][0];
            }
        }
        if (!errorMsg) {
            errorMsg = errorData?.error || errorData?.message;
        }
        if (!errorMsg && errorData && typeof errorData === 'object') {
            const firstErrorKey = Object.keys(errorData)[0];
            if (Array.isArray(errorData[firstErrorKey])) {
                errorMsg = errorData[firstErrorKey][0];
            }
        }
        return errorMsg || fallback;
    };

    const validateForm = () => {
        if (!formData.username || !formData.password || !formData.repassword || !formData.HOTEN || !formData.SDT || !formData.EMAIL) {
            showError("Vui lòng nhập đầy đủ thông tin!");
            return false;
        }

        if (formData.password.length < 10) {
            showError("Mật khẩu phải có ít nhất 10 ký tự!");
            return false;
        }

        if (!/[A-Z]/.test(formData.password)) {
            showError("Mật khẩu phải chứa ít nhất 1 chữ cái viết hoa (A-Z)!");
            return false;
        }

        if (!/[0-9]/.test(formData.password)) {
            showError("Mật khẩu phải chứa ít nhất 1 chữ số (0-9)!");
            return false;
        }

        if (!/[^A-Za-z0-9]/.test(formData.password)) {
            showError("Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (VD: @, $, !, %, #, &)!");
            return false;
        }

        if (formData.password !== formData.repassword) {
            showError("Mật khẩu nhập lại không khớp!");
            return false;
        }

        return true;
    };

    // Bước 1: Gửi mã OTP về Gmail đã đăng ký
    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        setToastError("");

        if (!validateForm()) return;

        setIsSendingOtp(true);
        try {
            const res = await sendRegisterOtp(formData);
            toast.success(res.message || `Đã gửi mã OTP tới Gmail ${formData.EMAIL}!`);
            setStep(2);
            setCountdown(60);
        } catch (e) {
            showError(extractErrorMsg(e, "Không thể gửi mã OTP về Gmail!"));
        } finally {
            setIsSendingOtp(false);
        }
    };

    // Bước 2: Xác thực OTP và tạo tài khoản
    const handleVerifyAndRegister = async (e) => {
        if (e) e.preventDefault();
        setToastError("");

        const cleanOtp = otpCode.trim();
        if (!cleanOtp || cleanOtp.length < 6) {
            showError("Vui lòng nhập đủ mã OTP gồm 6 chữ số được gửi về Gmail!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await register({
                ...formData,
                otp: cleanOtp
            });
            toast.success(res.message || "Xác thực OTP & Đăng ký tài khoản thành công!");
            navigate("/dang-nhap");
        } catch (e) {
            showError(extractErrorMsg(e, "Mã OTP không hợp lệ hoặc đã xảy ra lỗi khi đăng ký!"));
        } finally {
            setIsSubmitting(false);
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
                            <div className="Register-titleRegister">
                                {step === 1 ? "Đăng Ký Tài Khoản" : "Xác Thực OTP Qua Gmail"}
                            </div>

                            {step === 1 ? (
                                <form onSubmit={handleRequestOtp}>
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
                                    <input type="email" name="EMAIL" className="Register-input" placeholder="Địa chỉ Gmail nhận mã OTP *" value={formData.EMAIL} onChange={handleChange} />
                                    <input type="text" name="SDT" className="Register-input" placeholder="Số điện thoại *" value={formData.SDT} onChange={handleChange} />
                                    
                                    <select name="GioiTinh" className="Register-input" value={formData.GioiTinh} onChange={handleChange} style={{ padding: "10px", marginTop: "10px", width: "100%", borderRadius: "4px", border: "1px solid #ccc" }}>
                                        <option value="Nam">Nam</option>
                                        <option value="Nữ">Nữ</option>
                                    </select>
                                    
                                    <button
                                        type="submit"
                                        disabled={isSendingOtp}
                                        className="Register-RegisterBtn"
                                        style={{
                                            border: "none",
                                            width: "100%",
                                            cursor: isSendingOtp ? "not-allowed" : "pointer",
                                            display: "block",
                                            textAlign: "center",
                                            marginTop: "20px",
                                            opacity: isSendingOtp ? 0.7 : 1
                                        }}
                                    >
                                        {isSendingOtp ? (
                                            <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "6px" }}></i> Đang gửi mã OTP về Gmail...</span>
                                        ) : (
                                            <span><i className="fa-solid fa-envelope-circle-check" style={{ marginRight: "6px" }}></i> Gửi Mã OTP Xác Thực Qua Gmail</span>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyAndRegister}>
                                    <div style={{
                                        backgroundColor: "#fffbeb",
                                        border: "1px solid #fde68a",
                                        borderRadius: "10px",
                                        padding: "16px 12px",
                                        marginBottom: "16px",
                                        fontSize: "13px",
                                        color: "#92400e",
                                        lineHeight: 1.5,
                                        textAlign: "center"
                                    }}>
                                        <i className="fa-solid fa-envelope-circle-check" style={{ fontSize: "26px", color: "#d97706", display: "block", marginBottom: "8px" }}></i>
                                        <div style={{ marginBottom: "6px", fontSize: "13.5px" }}>
                                            Mã xác thực OTP (6 chữ số) đã gửi đến:
                                        </div>
                                        <div style={{
                                            color: "#b45309",
                                            fontWeight: "bold",
                                            fontSize: "15px",
                                            wordBreak: "break-all",
                                            background: "#fef3c7",
                                            padding: "4px 10px",
                                            borderRadius: "6px",
                                            display: "inline-block",
                                            marginBottom: "6px"
                                        }}>
                                            {formData.EMAIL}
                                        </div>
                                        <div style={{ marginTop: "4px", fontSize: "12px", color: "#78350f" }}>
                                            Vui lòng kiểm tra hộp thư đến (hoặc mục Thư rác / Spam) và nhập mã bên dưới.
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        maxLength={6}
                                        className="Register-input"
                                        placeholder={otpCode ? "" : "Nhập 6 số OTP"}
                                        value={otpCode}
                                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                                        style={{
                                            textAlign: "center",
                                            fontSize: otpCode ? "24px" : "15px",
                                            fontWeight: otpCode ? "bold" : "normal",
                                            letterSpacing: otpCode ? "10px" : "normal",
                                            padding: "12px",
                                            height: "50px",
                                            borderRadius: "8px",
                                            border: "1.5px solid #d97706",
                                            backgroundColor: "#fff",
                                            color: "#b45309",
                                            boxSizing: "border-box",
                                            width: "100%"
                                        }}
                                        autoFocus
                                    />

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="Register-RegisterBtn"
                                        style={{
                                            border: "none",
                                            width: "100%",
                                            cursor: isSubmitting ? "not-allowed" : "pointer",
                                            display: "block",
                                            textAlign: "center",
                                            marginTop: "14px",
                                            opacity: isSubmitting ? 0.7 : 1
                                        }}
                                    >
                                        {isSubmitting ? "Đang xác thực & Tạo tài khoản..." : "Xác Thực OTP & Hoàn Tất Đăng Ký"}
                                    </button>

                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px", fontSize: "13px" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setStep(1);
                                                setOtpCode("");
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: "#555",
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                padding: 0
                                            }}
                                        >
                                            ← Quay lại sửa thông tin
                                        </button>

                                        <button
                                            type="button"
                                            disabled={countdown > 0 || isSendingOtp}
                                            onClick={handleRequestOtp}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                color: countdown > 0 ? "#999" : "#d97706",
                                                fontWeight: "bold",
                                                cursor: countdown > 0 ? "not-allowed" : "pointer",
                                                padding: 0
                                            }}
                                        >
                                            {countdown > 0 ? `Gửi lại mã sau (${countdown}s)` : "Gửi lại mã OTP"}
                                        </button>
                                    </div>
                                </form>
                            )}
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
                                <a href={`${BASE_URL}/api/auth/google?redirect_to=${encodeURIComponent(window.location.origin)}`} className="Register__Social-link gooleBG">
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
