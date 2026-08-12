import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';

const AdminInventoryLedgerPage = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchMovements = async (pageNumber = 1) => {
        setLoading(true);
        try {
            const res = await axiosClient.get(`/admin/inventory/ledger?page=${pageNumber}`);
            setMovements(res.data.data);
            setTotalPages(res.data.last_page);
            setPage(res.data.current_page);
        } catch (error) {
            console.error("Lỗi lấy sổ cái tồn kho:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMovements(1);
    }, []);

    const getMovementTypeBadge = (type) => {
        const types = {
            'PURCHASE': { label: 'Nhập hàng', color: 'admin-badge-success' },
            'SALE': { label: 'Bán hàng (Online)', color: 'admin-badge-primary' },
            'POS_SALE': { label: 'Bán hàng (POS)', color: 'admin-badge-primary' },
            'RETURN': { label: 'Khách trả hàng', color: 'admin-badge-warning' },
            'TRANSFER_OUT': { label: 'Chuyển đi', color: 'admin-badge-secondary' },
            'TRANSFER_IN': { label: 'Nhận về', color: 'admin-badge-info' },
            'ADJUSTMENT': { label: 'Kiểm kê/Điều chỉnh', color: 'admin-badge-danger' }
        };
        const config = types[type] || { label: type, color: 'admin-badge-secondary' };
        return <span className={`admin-badge ${config.color}`}>{config.label}</span>;
    };

    return (
        <AdminLayout>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Sổ Cái Tồn Kho (Immutable Ledger)</h1>
                <button className="admin-btn admin-btn-secondary" onClick={() => fetchMovements(page)}>
                    <i className="fa-solid fa-rotate-right"></i> Làm mới
                </button>
            </div>

            <div className="admin-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Sản phẩm</th>
                                <th>Cửa hàng</th>
                                <th>Loại biến động</th>
                                <th style={{ textAlign: 'right' }}>SL Trước</th>
                                <th style={{ textAlign: 'right' }}>Thay đổi</th>
                                <th style={{ textAlign: 'right' }}>SL Sau</th>
                                <th>Tham chiếu</th>
                                <th>Người thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Chưa có biến động kho nào.</td></tr>
                            ) : (
                                movements.map((item) => (
                                    <tr key={item.id}>
                                        <td>{new Date(item.created_at).toLocaleString('vi-VN')}</td>
                                        <td>
                                            <strong>{item.sanpham?.TENSP || item.MASP}</strong><br />
                                            <small style={{ color: '#666' }}>{item.MASP}</small>
                                        </td>
                                        <td>{item.cuahang?.TENCUAHANG || `CH${item.MACUAHANG}`}</td>
                                        <td>{getMovementTypeBadge(item.type)}</td>
                                        <td style={{ textAlign: 'right' }}>{item.before_quantity}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: item.quantity > 0 ? 'green' : 'red' }}>
                                            {item.quantity > 0 ? '+' : ''}{item.quantity}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{item.after_quantity}</td>
                                        <td>
                                            {item.reference_type}
                                            <strong>{item.reference_id}</strong>
                                        </td>
                                        <td>{item.user?.HOTEN || item.USERNAME || 'Hệ thống'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-pagination " style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'cente', }}>
                    <button 
                        className="admin-btn admin-btn-secondary" 
                        disabled={page <= 1}
                        onClick={() => fetchMovements(page - 1)}
                    >
                        Trang trước
                    </button>
                    <span style={{ margin: '0 15px', display: 'flex', alignItems: 'center', fontSize: '16px', }}>
                        Trang {page} / {totalPages}
                    </span>
                    <button 
                        className="admin-btn admin-btn-secondary" 
                        disabled={page >= totalPages}
                        onClick={() => fetchMovements(page + 1)}
                    >
                        Trang sau
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminInventoryLedgerPage;
