import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicStores } from "../services/storeService";
import Footer from "../Layout/Footer";
import "./StorePage.css"; 

function StorePage() {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeStore, setActiveStore] = useState(null);

    useEffect(() => {
        const fetchStores = async () => {
            try {
                const data = await getPublicStores();
                const list = Array.isArray(data) ? data : (data?.data || []);
                setStores(list);
                if (list.length > 0) {
                    setActiveStore(list[0]);
                }
            } catch (error) {
                console.error("Error fetching stores:", error);
                setStores([]);
            }
            setLoading(false);
        };
        fetchStores();
    }, []);

    const handleStoreClick = (store) => {
        setActiveStore(store);
    };

    return (
        <>
            <main>
                {/* <section className="store-banner">
                    <div className="store-banner-content">
                        <h1>Hệ thống cửa hàng</h1>
                        <p><Link to="/">Trang chủ</Link> &gt; <span>Hệ thống cửa hàng</span></p>
                    </div>
                </section> */}

                <section className="store-content-section container mt-4 mb-5">
                    {/* Stats Header */}
                    <div className="store-stats mb-4">
                        <div className="row text-center">
                            <div className="col-md-4">
                                <h3>{stores.length}</h3>
                                <p>Cửa hàng</p>
                            </div>
                            <div className="col-md-4 border-start border-end">
                                <h3>100+</h3>
                                <p>Nhân viên</p>
                            </div>
                            <div className="col-md-4">
                                <h3>7:00 - 22:30</h3>
                                <p>Giờ mở cửa</p>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        {/* Sidebar: Store List */}
                        <div className="col-lg-4 col-md-5">
                            <div className="store-sidebar">
                                <h3 className="store-sidebar-title">Danh sách cửa hàng</h3>
                                <div className="store-filters mb-3">
                                    {/* Mock filters for visual design match */}
                                    <select className="form-select mb-2">
                                        <option>Tỉnh/Thành phố</option>
                                    </select>
                                    <select className="form-select">
                                        <option>Quận/Huyện</option>
                                    </select>
                                </div>
                                <div className="store-list-container">
                                    {loading ? (
                                        <div className="p-3 text-center">Đang tải cửa hàng...</div>
                                    ) : stores.length === 0 ? (
                                        <div className="p-3 text-center">Không có cửa hàng nào</div>
                                    ) : (
                                        stores.map((store, idx) => {
                                            const storeId = store.MACUAHANG || store.id || idx;
                                            const storeName = store.TENCUAHANG || store.tenCuaHang || store.name || 'Cửa hàng Givral';
                                            const storeAddress = store.DIACHI || store.diaChiChiTiet || store.address || '';
                                            const storePhone = store.SDT || store.soDienThoai || store.phone || '1900 6750';
                                            const isActive = (activeStore?.MACUAHANG || activeStore?.id) === (store.MACUAHANG || store.id);

                                            return (
                                                <div 
                                                    key={storeId} 
                                                    className={`store-card ${isActive ? 'active' : ''}`}
                                                    onClick={() => handleStoreClick(store)}
                                                >
                                                    <h4 className="store-name">{storeName}</h4>
                                                    <p className="store-address">
                                                        <i className="fa fa-map-marker-alt text-warning me-2"></i> 
                                                        {storeAddress}
                                                    </p>
                                                    <p className="store-phone mb-0">
                                                        <i className="fa fa-phone-alt text-warning me-2"></i>
                                                        Hotline: {storePhone}
                                                    </p>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Main: Google Map */}
                        <div className="col-lg-8 col-md-7">
                            <div className="map-container">
                                {activeStore ? (
                                    <iframe 
                                        width="100%" 
                                        height="600" 
                                        frameBorder="0" 
                                        style={{ border: 0, borderRadius: '8px' }}
                                        src={`https://www.google.com/maps?q=${encodeURIComponent(activeStore.DIACHI || activeStore.diaChiChiTiet || activeStore.address || activeStore.TENCUAHANG || 'Hồ Chí Minh')}&output=embed`} 
                                        allowFullScreen 
                                        title={activeStore.TENCUAHANG || activeStore.name || 'Store Map'}
                                    ></iframe>
                                ) : (
                                    <div className="d-flex justify-content-center align-items-center bg-light" style={{ height: '600px', borderRadius: '8px' }}>
                                        <p>Vui lòng chọn một cửa hàng để xem bản đồ</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}

export default StorePage;