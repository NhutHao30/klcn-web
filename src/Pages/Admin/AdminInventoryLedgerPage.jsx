import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { PhieuTonKhoPrintModal } from '../../components/PrintForms';

const AdminInventoryLedgerPage = () => {
    const [movements, setMovements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isTonKhoPrintOpen, setIsTonKhoPrintOpen] = useState(false);

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
            0: { label: 'Bán hàng (POS)', color: 'admin-badge-primary' },
            1: { label: 'Bán hàng (Online)', color: 'admin-badge-primary' },
            2: { label: 'Chuyển kho (Xuất)', color: 'admin-badge-warning' },
            3: { label: 'Chuyển kho (Nhập)', color: 'admin-badge-info' },
            4: { label: 'Nhập lô hàng mới', color: 'admin-badge-success' },
            5: { label: 'Xuất hủy hàng', color: 'admin-badge-danger' },
            'PURCHASE': { label: 'Nhập hàng', color: 'admin-badge-success' },
            'SALE': { label: 'Bán hàng (Online)', color: 'admin-badge-primary' },
            'POS_SALE': { label: 'Bán hàng (POS)', color: 'admin-badge-primary' },
            'TRANSFER_OUT': { label: 'Chuyển đi', color: 'admin-badge-warning' },
            'TRANSFER_IN': { label: 'Nhận về', color: 'admin-badge-info' },
            'ADJUSTMENT': { label: 'Xuất hủy / Kiểm kê', color: 'admin-badge-danger' }
        };
        const config = types[type] || { label: type ?? 'Biến động', color: 'admin-badge-secondary' };
        return <span className={`admin-badge ${config.color}`}>{config.label}</span>;
    };

    return (
        <AdminLayout>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 className="admin-title" style={{ marginBottom: '4px' }}>
                        Sổ cái tồn kho
                    </h1>
                    <p style={{ margin: 0, color: '#888', fontSize: '13px' }}>Ghi nhận nhật ký nhập kho, xuất kho, điều chuyển và bán hàng toàn hệ thống</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        type="button"
                        className="admin-btn admin-btn-primary"
                        style={{ backgroundColor: '#4e1a0f', borderColor: '#4e1a0f', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setIsTonKhoPrintOpen(true)}
                    >
                        <i className="fa-solid fa-print"></i> In Báo Cáo Tồn Kho (PDF/A4)
                    </button>
                    <button className="admin-btn admin-btn-secondary" onClick={() => fetchMovements(page)}>
                        <i className="fa-solid fa-rotate-right"></i> Làm mới
                    </button>
                </div>
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
                                <th style={{ textAlign: 'right' }}>Thay đổi</th>
                                <th style={{ textAlign: 'right' }}>Tồn kho sau</th>
                                <th>Mã tham chiếu</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                            ) : movements.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Chưa có biến động kho nào.</td></tr>
                            ) : (
                                movements.map((item) => {
                                    const qty = item.so_luong_thay_doi ?? item.quantity ?? 0;
                                    const time = item.createdAt || item.created_at;
                                    const storeName = item.cuahang?.ten_cuahang || item.cuahang?.tenCuaHang || item.cuahang?.TENCUAHANG || `CH#${item.cuaHangId || item.MACUAHANG}`;
                                    const prodName = item.sanpham?.tenSanPham || item.sanpham?.TENSP || `SP#${item.sanPhamId || item.MASP}`;
                                    return (
                                        <tr key={item.id}>
                                            <td>{time ? new Date(time).toLocaleString('vi-VN') : '-'}</td>
                                            <td>
                                                <strong>{prodName}</strong>
                                            </td>
                                            <td>{storeName}</td>
                                            <td>{getMovementTypeBadge(item.loai_bien_dong ?? item.type)}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', color: qty > 0 ? '#198754' : '#dc3545', fontSize: '15px' }}>
                                                {qty > 0 ? `+${qty}` : qty}
                                            </td>
                                            <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '15px' }}>{item.so_luong_ton_sau ?? item.after_quantity ?? '-'}</td>
                                            <td>
                                                <span className="admin-badge admin-badge-secondary">{item.ma_tham_chieu || item.reference_id || '-'}</span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <button 
                        className="admin-btn admin-btn-secondary" 
                        disabled={page <= 1}
                        onClick={() => fetchMovements(page - 1)}
                    >
                        Trang trước
                    </button>
                    <span style={{ margin: '0 15px', display: 'flex', alignItems: 'center', fontSize: '14px' }}>
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

            <PhieuTonKhoPrintModal
                isOpen={isTonKhoPrintOpen}
                onClose={() => setIsTonKhoPrintOpen(false)}
                reportData={{
                    maBaoCao: `TK${Date.now().toString().slice(-8)}`,
                    items: movements.map(m => {
                        const qty = m.so_luong_thay_doi ?? m.quantity ?? 0;
                        const tonCuoi = m.so_luong_ton_sau ?? m.after_quantity ?? 0;
                        const tonDau = Math.max(0, tonCuoi - qty);
                        return {
                            tenSanPham: m.sanpham?.tenSanPham || m.sanpham?.TENSP || `SP#${m.sanPhamId || m.MASP}`,
                            dvt: m.sanpham?.donViTinh || m.sanpham?.DVT || 'Hộp',
                            tonDauKy: tonDau,
                            nhapTrongKy: qty > 0 ? qty : 0,
                            xuatTrongKy: qty < 0 ? Math.abs(qty) : 0,
                            tonCuoiKy: tonCuoi,
                            ghiChu: m.ma_tham_chieu || m.reference_id || ''
                        };
                    })
                }}
            />
        </AdminLayout>
    );
};

export default AdminInventoryLedgerPage;
