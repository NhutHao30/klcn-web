import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';

const AdminAdvancedAuditPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async (pageNumber = 1) => {
        setLoading(true);
        try {
            let url = `/admin/audit-logs?page=${pageNumber}`;
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
            if (actionFilter) url += `&action=${encodeURIComponent(actionFilter)}`;
            const res = await axiosClient.get(url);
            setLogs(res.data.data);
            setTotalPages(res.data.last_page);
            setPage(res.data.current_page);
        } catch (error) {
            console.error("Lỗi lấy audit logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const handleViewDetails = (log) => {
        setSelectedLog(log);
    };

    const getActionBadge = (action) => {
        const config = {
            'INSERT': { color: '#28a745', bg: '#e8f5e9' },
            'UPDATE': { color: '#ff9800', bg: '#fff3e0' },
            'DELETE': { color: '#dc3545', bg: '#ffebee' },
        };
        const c = config[action] || { color: '#666', bg: '#f5f5f5' };
        return (
            <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: c.color, backgroundColor: c.bg }}>
                {action}
            </span>
        );
    };

    return (
        <AdminLayout>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Nhật Ký Nâng Cao (Audit Logs)</h1>
                <button className="admin-btn admin-btn-secondary" onClick={() => fetchLogs(page)}>
                    <i className="fa-solid fa-rotate-right"></i> Làm mới
                </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="admin-card" style={{ marginBottom: '1rem', padding: '15px 20px' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Tìm theo người thao tác, loại thực thể, ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}
                    />
                    <select
                        className="admin-input"
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        style={{ width: '160px', marginBottom: 0 }}
                    >
                        <option value="">Tất cả hành động</option>
                        <option value="INSERT">INSERT</option>
                        <option value="UPDATE">UPDATE</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                    <button type="submit" className="admin-btn admin-btn-primary">
                        <i className="fa-solid fa-magnifying-glass"></i> Tìm kiếm
                    </button>
                    {(searchTerm || actionFilter) && (
                        <button
                            type="button"
                            className="admin-btn admin-btn-secondary"
                            onClick={() => { setSearchTerm(''); setActionFilter(''); setTimeout(() => fetchLogs(1), 0); }}
                        >
                            <i className="fa-solid fa-xmark"></i> Xóa lọc
                        </button>
                    )}
                </form>
            </div>

            <div className="admin-card">
                <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Người thao tác</th>
                                <th>Hành động</th>
                                <th>Loại thực thể</th>
                                <th>ID Thực thể</th>
                                <th>IP Address</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Đang tải dữ liệu...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Chưa có lịch sử thay đổi nào.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.created_at).toLocaleString('vi-VN')}</td>
                                        <td><strong>{log.user?.HOTEN || log.USERNAME || 'Hệ thống'}</strong></td>
                                        <td>{getActionBadge(log.action)}</td>
                                        <td>{log.entity_type}</td>
                                        <td><strong>{log.entity_id}</strong></td>
                                        <td style={{ fontSize: '12px', color: '#888' }}>{log.ip_address || '-'}</td>
                                        <td>
                                            <button className="admin-btn admin-btn-info" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleViewDetails(log)}>
                                                <i className="fa-solid fa-eye"></i> Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-pagination" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '16px' }}>
                    <button
                        className="admin-btn admin-btn-secondary"
                        disabled={page <= 1}
                        onClick={() => fetchLogs(page - 1)}
                    >
                        Trang trước
                    </button>
                    <span style={{ margin: '0 15px', display: 'flex', alignItems: 'center' }}>
                        Trang {page} / {totalPages}
                    </span>
                    <button
                        className="admin-btn admin-btn-secondary"
                        disabled={page >= totalPages}
                        onClick={() => fetchLogs(page + 1)}
                    >
                        Trang sau
                    </button>
                </div>
            </div>

            {/* Modal Chi Tiết JSON */}
            {selectedLog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ background: '#fff', padding: '25px', borderRadius: '10px', width: '80%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                            <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>Chi tiết thay đổi</h2>
                            <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}>&times;</button>
                        </div>

                        <div style={{ marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <strong>Thông tin Log:</strong>
                                <ul style={{ listStyle: 'none', padding: 0, marginTop: '10px', fontSize: '14px', lineHeight: '1.8' }}>
                                    <li><strong>Thời gian:</strong> {new Date(selectedLog.created_at).toLocaleString('vi-VN')}</li>
                                    <li><strong>Người thao tác:</strong> {selectedLog.user?.HOTEN || selectedLog.USERNAME}</li>
                                    <li><strong>Hành động:</strong> {selectedLog.action}</li>
                                    <li><strong>Thực thể:</strong> {selectedLog.entity_type} / {selectedLog.entity_id}</li>
                                    <li><strong>Request ID:</strong> <code style={{ fontSize: '11px' }}>{selectedLog.request_id || '-'}</code></li>
                                    <li><strong>IP:</strong> {selectedLog.ip_address || '-'}</li>
                                </ul>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h3 style={{ fontSize: '16px', color: '#d9534f', borderBottom: '2px solid #d9534f', paddingBottom: '5px' }}>Dữ liệu Cũ (Old Values)</h3>
                                <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', overflowX: 'auto', fontSize: '13px', border: '1px solid #ddd', maxHeight: '300px' }}>
                                    {selectedLog.old_values ? JSON.stringify(selectedLog.old_values, null, 2) : 'Null (bản ghi mới)'}
                                </pre>
                            </div>
                            <div>
                                <h3 style={{ fontSize: '16px', color: '#5cb85c', borderBottom: '2px solid #5cb85c', paddingBottom: '5px' }}>Dữ liệu Mới (New Values)</h3>
                                <pre style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', overflowX: 'auto', fontSize: '13px', border: '1px solid #ddd', maxHeight: '300px' }}>
                                    {selectedLog.new_values ? JSON.stringify(selectedLog.new_values, null, 2) : 'Null (đã xóa)'}
                                </pre>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px', textAlign: 'right' }}>
                            <button className="admin-btn admin-btn-secondary" onClick={() => setSelectedLog(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminAdvancedAuditPage;
