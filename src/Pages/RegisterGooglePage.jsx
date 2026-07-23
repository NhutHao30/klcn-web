import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../Layout/Footer";
import { getGoogleStatus, googleRegister } from "../services/authService";

const RegisterGooglePage = () => {
    const [sdt, setSdt] = useState("");
    const [gioiTinh, setGioiTinh] = useState("Nam");
    const [error, setError] = useState("");
    const [googleInfo, setGoogleInfo] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await getGoogleStatus();
                // Nếu status là success tức là tài khoản đã có, tự động chuyển về trang chủ hoặc báo lỗi
                if (res.status === "success") {
                    navigate("/?google=true");
                } else if (res.status === "need_info") {
                    setGoogleInfo(res);
                }
            } catch (e) {
                // Lỗi hoặc không có session Google
                alert("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.");
                navigate("/dang-nhap");
            }
        };
        checkStatus();
    }, [navigate]);

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError("");

        if (!sdt || sdt.length !== 10) {
            setError("Vui lòng nhập số điện thoại đủ 10 chữ số!");
            return;
        }

        try {
            const res = await googleRegister(sdt, gioiTinh);
            alert(res.message || "Đăng ký thành công!");
            window.location.href = "/?google=true";
        } catch (e) {
            setError(e.response?.data?.error || "Đã xảy ra lỗi khi đăng ký bằng Google!");
        }
    };

    if (!googleInfo) {
        return (
            <main style={{ minHeight: "60vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <h2>Đang tải thông tin...</h2>
            </main>
        );
    }

    return (
        <>
            <main>
                <div className="container">
                    <div className="Register-list">
                        <div className="Register__header">
                            <span className="Register-RegisterNav active" style={{ width: "100%", textAlign: "center", cursor: "default" }}>Hoàn tất Đăng Ký (Google)</span>
                        </div>

                        <div className="Register__body">
                            <div className="Register-titleRegister">Thông tin bổ sung</div>
                            
                            <p style={{ textAlign: "center", marginBottom: "15px", color: "#555" }}>
                                Chào <b>{googleInfo.name}</b> ({googleInfo.email})<br/>
                                Vui lòng bổ sung thông tin dưới đây để hoàn tất đăng ký!
                            </p>

                            {error && <div style={{ color: "red", marginBottom: "15px", textAlign: "center" }}>{error}</div>}

                            <form onSubmit={handleRegister}>
                                <input 
                                    type="text" 
                                    className="Register-input" 
                                    placeholder="Số điện thoại (10 số) *" 
                                    value={sdt}
                                    onChange={(e) => setSdt(e.target.value)}
                                />
                                
                                <select 
                                    className="Register-input" 
                                    value={gioiTinh} 
                                    onChange={(e) => setGioiTinh(e.target.value)} 
                                    style={{ padding: "10px", marginTop: "10px", width: "100%", borderRadius: "4px", border: "1px solid #ccc" }}
                                >
                                    <option value="Nam">Nam</option>
                                    <option value="Nữ">Nữ</option>
                                </select>
                                
                                <button type="submit" className="Register-RegisterBtn" style={{ border: "none", width: "100%", cursor: "pointer", display: "block", textAlign: "center", marginTop: "20px" }}>Hoàn tất Đăng Ký</button>
                            </form>
                            
                            <div style={{ textAlign: "center", marginTop: "15px" }}>
                                <Link to="/dang-nhap" style={{ color: "var(--primary-color)", textDecoration: "underline" }}>Hủy và quay lại</Link>
                            </div>
                        </div>  
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};

export default RegisterGooglePage;
