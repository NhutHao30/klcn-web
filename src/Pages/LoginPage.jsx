import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../Layout/Footer";
import { login, getCurrentUser, logout, forgotPassword, resetPassword } from "../services/authService";

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [user, setUser] = useState(null);
    const [showForgotForm, setShowForgotForm] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [isSendingForgot, setIsSendingForgot] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);
    
    // Toggle password visibility states
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
    
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await getCurrentUser();
                setUser(res);
            } catch (e) {
                // Not logged in
                setUser(null);
            }
        };
        fetchUser();
    }, []);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError("");
        if (!username || !password) {
            setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu!");
            return;
        }
        try {
            const res = await login(username, password);
            
            // LƯU TOKEN VÀO LOCALSTORAGE CHO CÁC API KHÁC DÙNG
            if (res.access_token) {
                localStorage.setItem('access_token', res.access_token);
            }

            alert("Đăng nhập thành công!");
            
            // Lấy quyền từ res.user.MAROLE của Laravel
            const role = res.user ? Number(res.user.MAROLE) : 2;

            if (role === 0 || role === 1 || role === 2 || role === 4) {
                window.location.href = "/admin"; // Chuyển đến trang admin
            } else {
                window.location.href = "/"; // Reload về trang chủ
            }
        } catch (e) {
            setError(e.response?.data?.error || "Sai tài khoản hoặc mật khẩu!");
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            setUser(null);
            alert("Đăng xuất thành công!");
            window.location.href = "/dang-nhap";
        } catch (e) {
            console.error(e);
        }
    };

    const handleForgotPassword = async () => {
        if (!forgotEmail) {
            alert("Vui lòng nhập email khôi phục!");
            return;
        }
        setIsSendingForgot(true);
        try {
            const res = await forgotPassword(forgotEmail);
            alert(res.message || "Đã gửi mã OTP đến email của bạn.");
            setOtpSent(true);
        } catch (e) {
            alert(e.response?.data?.error || "Đã xảy ra lỗi, vui lòng thử lại.");
        } finally {
            setIsSendingForgot(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword || !confirmNewPassword) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            alert("Mật khẩu nhập lại không khớp!");
            return;
        }
        setIsResetting(true);
        try {
            const res = await resetPassword(forgotEmail, otp, newPassword);
            alert(res.message || "Đổi mật khẩu thành công!");
            
            // Đóng form, làm sạch dữ liệu
            setForgotEmail("");
            setOtp("");
            setNewPassword("");
            setConfirmNewPassword("");
            setOtpSent(false);
            setShowForgotForm(false);
        } catch (e) {
            alert(e.response?.data?.error || "Mã OTP không chính xác hoặc lỗi hệ thống!");
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            <main>
                <div className="container">
                    <div className="Login-list Login-list-js" style={{ height: showForgotForm ? '480px' : 'auto', transition: 'height 0.3s ease' }}>
                        {user ? (
                            <div className="Register__body" style={{ textAlign: "center", padding: "50px 0" }}>
                                <h3>Xin chào, {user.fullName || user.username}!</h3>
                                <p style={{ margin: "20px 0" }}>Bạn đã đăng nhập thành công.</p>
                                <button
                                    onClick={handleLogout}
                                    style={{ padding: "10px 25px", background: "var(--primary-color)", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", fontSize: "16px" }}
                                >
                                    Đăng xuất
                                </button>
                                <div style={{ marginTop: "20px" }}>
                                    <Link to="/" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>Quay lại Trang Chủ</Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="Register__header">
                                    <Link to="/dang-nhap" className="Register-LoginNav active">Đăng Nhập</Link>
                                    <Link to="/dang-ky" className="Register-RegisterNav">Đăng Ký</Link>
                                </div>

                                <div className="Register__body">
                                    <div className="Register-titleRegister">Đăng Nhập</div>

                                    {error && <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

                                    <form onSubmit={handleLogin} style={{width: "100%",}}>
                                        <input
                                            type="text"
                                            className="Register-input"
                                            placeholder="Tên đăng nhập"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                        <div style={{ position: "relative", marginBottom: "15px" }}>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                className="Register-input"
                                                style={{ marginBottom: 0 }}
                                                placeholder="Mật Khẩu"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                                style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}
                                                onClick={() => setShowPassword(!showPassword)}
                                            ></i>
                                        </div>
                                        <button type="submit" className="Register-RegisterBtn" style={{ border: "none", width: "100%", cursor: "pointer", display: "block", textAlign: "center", marginTop: "20px" }}>Đăng Nhập</button>
                                    </form>
                                </div>

                                <div className="Register__footer">
                                    <p className="password passwordForget-js" style={{ cursor: 'pointer'}} onClick={() => setShowForgotForm(!showForgotForm)}>
                                        Quên mật khẩu
                                    </p>
                                    <div className={`passwordForgetForm passwordForgetForm-js ${showForgotForm ? "open" : ""}`} style={{ height: showForgotForm ? (otpSent ? '480px' : 'auto') : '0', padding: showForgotForm ? '10px 0' : '0' }}>
                                        {!otpSent ? (
                                            <>
                                                <input 
                                                    type="email" 
                                                    className="Register-input" 
                                                    placeholder="Email khôi phục" 
                                                    value={forgotEmail}
                                                    onChange={(e) => setForgotEmail(e.target.value)}
                                                />
                                                <span 
                                                    className="forgetPassBtn" 
                                                    onClick={handleForgotPassword}
                                                    style={{ lineHeight: '1.4', display: 'inline-block', marginTop: '10px', padding: '10px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                                                >
                                                    {isSendingForgot ? "Đang gửi..." : "Lấy lại mật khẩu"}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <input 
                                                    type="text" 
                                                    className="Register-input" 
                                                    placeholder="Nhập mã OTP" 
                                                    value={otp}
                                                    onChange={(e) => setOtp(e.target.value)}
                                                    style={{ marginTop: '10px' }}
                                                />
                                                <div style={{ position: "relative", marginTop: '10px' }}>
                                                    <input 
                                                        type={showNewPassword ? "text" : "password"} 
                                                        className="Register-input" 
                                                        placeholder="Mật khẩu mới" 
                                                        value={newPassword}
                                                        onChange={(e) => setNewPassword(e.target.value)}
                                                        style={{ marginTop: 0, marginBottom: 0 }}
                                                    />
                                                    <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                                        style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}
                                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                                    ></i>
                                                </div>
                                                <div style={{ position: "relative", marginTop: '10px' }}>
                                                    <input 
                                                        type={showConfirmNewPassword ? "text" : "password"} 
                                                        className="Register-input" 
                                                        placeholder="Xác nhận mật khẩu mới" 
                                                        value={confirmNewPassword}
                                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                        style={{ marginTop: 0, marginBottom: 0 }}
                                                    />
                                                    <i className={`fa-solid ${showConfirmNewPassword ? 'fa-eye-slash' : 'fa-eye'}`} 
                                                        style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "#666" }}
                                                        onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                                                    ></i>
                                                </div>
                                                <span 
                                                    className="forgetPassBtn" 
                                                    onClick={handleResetPassword}
                                                    style={{ lineHeight: '1.4', display: 'inline-block', marginTop: '10px', padding: '10px', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '4px', cursor: 'pointer', width: '100%' }}
                                                >
                                                    {isResetting ? "Đang xử lý..." : "Xác nhận đổi mật khẩu"}
                                                </span>
                                                <div 
                                                    style={{ marginTop: '10px', fontSize: '12px', color: '#666', cursor: 'pointer', textDecoration: 'underline' }} 
                                                    onClick={() => setOtpSent(false)}
                                                >
                                                    Quay lại
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <p>Hoặc đăng nhập bằng</p>
                                    <span className="Register__Social">
                                        <a href="#" className="Register__Social-link facebookBG">
                                            <div className="Register__Social-icon">
                                                <i className="Social-icon__facebook fa-brands fa-facebook-f"></i>
                                            </div>
                                            <div className="Register__Social-text">
                                                Facebook
                                            </div>
                                        </a>
                                        <a href="http://localhost:8000/api/auth/google" className="Register__Social-link gooleBG">
                                            <div className="Register__Social-icon">
                                                <i className="Social-icon__google fa-brands fa-google-plus-g"></i>
                                            </div>
                                            <div className="Register__Social-text">
                                                Google
                                            </div>
                                        </a>
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default LoginPage;
