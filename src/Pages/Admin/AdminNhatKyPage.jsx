import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getNhatKyHeThong } from '../../services/nhatKyService';

const AdminNhatKyPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Filters
  const [tuNgay, setTuNgay] = useState('');
  const [denNgay, setDenNgay] = useState('');
  const [username, setUsername] = useState('');
  const [hanhDong, setHanhDong] = useState('');

  // Chi tiết modal
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getNhatKyHeThong({
        page,
        per_page: 20,
        tu_ngay: tuNgay,
        den_ngay: denNgay,
        username,
        hanh_dong: hanhDong,
      });
      setLogs(data.data || []);
      setPagination({
        current_page: data.current_page,
        last_page: data.last_page,
        total: data.total,
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [tuNgay, denNgay, username, hanhDong]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleReset = () => {
    setTuNgay('');
    setDenNgay('');
    setUsername('');
    setHanhDong('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
  };

  const getRoleName = (role) => {
    const roles = {
      0: 'Quản lý tổng',
      1: 'Quản lý chi nhánh',
      2: 'Nhân viên',
      3: 'Khách hàng',
      4: 'CSKH',
    };
    return roles[role] || `Role ${role}`;
  };

  const getRoleBadgeStyle = (role) => {
    const styles = {
      0: { backgroundColor: '#855050', color: '#fff' },
      1: { backgroundColor: '#446648', color: '#fff' },
      2: { backgroundColor: '#eba8a8', color: '#6d3b3c' },
      3: { backgroundColor: '#fedcbe', color: '#524343' },
      4: { backgroundColor: '#17a2b8', color: '#fff' },
    };
    return styles[role] || { backgroundColor: '#999', color: '#fff' };
  };

  const handleExportCSV = () => {
    if (logs.length === 0) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    const headers = ['Thời gian', 'Username', 'Họ tên', 'Vai trò', 'Chi nhánh', 'Hành động'];
    const rows = logs.map(log => [
      formatDate(log.created_at),
      log.USERNAME || '',
      log.HOTEN || '',
      getRoleName(log.MAROLE),
      log.MACUAHANG || '',
      log.HANH_DONG || '',
    ]);

    const csvContent = '\uFEFF' + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nhat-ky-he-thong_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderPagination = () => {
    const { current_page, last_page, total } = pagination;
    if (last_page <= 1) return null;

    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, current_page - Math.floor(maxVisible / 2));
    let end = Math.min(last_page, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <span style={{ fontSize: '13px', color: '#666' }}>
          Hiển thị trang {current_page}/{last_page} — Tổng {total} bản ghi
        </span>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className="admin-btn admin-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '13px' }}
            onClick={() => fetchLogs(current_page - 1)}
            disabled={current_page <= 1}
          >
            ‹
          </button>
          {start > 1 && (
            <>
              <button className="admin-btn admin-btn-secondary" style={{ padding: '6px 10px', fontSize: '13px' }} onClick={() => fetchLogs(1)}>1</button>
              {start > 2 && <span style={{ padding: '0 4px', color: '#999' }}>…</span>}
            </>
          )}
          {pages.map(p => (
            <button
              key={p}
              className={`admin-btn ${p === current_page ? 'admin-btn-primary' : 'admin-btn-secondary'}`}
              style={{ padding: '6px 10px', fontSize: '13px', minWidth: '36px' }}
              onClick={() => fetchLogs(p)}
            >
              {p}
            </button>
          ))}
          {end < last_page && (
            <>
              {end < last_page - 1 && <span style={{ padding: '0 4px', color: '#999' }}>…</span>}
              <button className="admin-btn admin-btn-secondary" style={{ padding: '6px 10px', fontSize: '13px' }} onClick={() => fetchLogs(last_page)}>{last_page}</button>
            </>
          )}
          <button
            className="admin-btn admin-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '13px' }}
            onClick={() => fetchLogs(current_page + 1)}
            disabled={current_page >= last_page}
          >
            ›
          </button>
        </div>
      </div>
    );
  };

  const parseChiTiet = (chiTiet) => {
    try {
      return JSON.parse(chiTiet);
    } catch {
      return chiTiet;
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '24px' }}>
        <div className="admin-flex-between" style={{ marginBottom: '16px' }}>
          <h1 className="admin-title" style={{ margin: 0 }}>
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '12px', color: 'var(--admin-primary)' }}></i>
            Nhật ký hệ thống
          </h1>
          <button className="admin-btn admin-btn-secondary" onClick={handleExportCSV} style={{ gap: '6px' }}>
            <i className="fa-solid fa-file-csv"></i> Xuất CSV
          </button>
        </div>

        {/* Bộ lọc */}
        <div className="admin-card" style={{ marginBottom: '16px' }}>
          <form onSubmit={handleFilter}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', alignItems: 'end' }}>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label>Từ ngày</label>
                <input
                  type="date"
                  className="admin-input"
                  style={{ marginBottom: 0 }}
                  value={tuNgay}
                  onChange={(e) => setTuNgay(e.target.value)}
                />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label>Đến ngày</label>
                <input
                  type="date"
                  className="admin-input"
                  style={{ marginBottom: 0 }}
                  value={denNgay}
                  onChange={(e) => setDenNgay(e.target.value)}
                />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label>Người thực hiện</label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ marginBottom: 0 }}
                  placeholder="Nhập username..."
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div className="admin-form-group" style={{ marginBottom: 0 }}>
                <label>Hành động</label>
                <input
                  type="text"
                  className="admin-input"
                  style={{ marginBottom: 0 }}
                  placeholder="VD: Tạo nhân viên..."
                  value={hanhDong}
                  onChange={(e) => setHanhDong(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
                  <i className="fa-solid fa-search"></i> Lọc
                </button>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
                  <i className="fa-solid fa-rotate-left"></i> Đặt lại
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Bảng dữ liệu */}
        <div className="admin-card">
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '32px', color: 'var(--admin-primary)', marginBottom: '12px' }}></i>
              <p style={{ color: '#888' }}>Đang tải nhật ký...</p>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <i className="fa-solid fa-clipboard-list" style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }}></i>
              <p style={{ color: '#999', fontSize: '16px' }}>Chưa có nhật ký nào được ghi nhận</p>
            </div>
          ) : (
            <>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '150px' }}>Thời gian</th>
                      <th style={{ minWidth: '120px' }}>Người thực hiện</th>
                      <th style={{ minWidth: '100px' }}>Vai trò</th>
                      <th style={{ minWidth: '200px' }}>Hành động</th>
                      <th style={{ minWidth: '80px', textAlign: 'center' }}>Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{formatDate(log.created_at)}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{log.HOTEN || '—'}</div>
                          <div style={{ fontSize: '12px', color: '#888' }}>{log.USERNAME || '—'}</div>
                        </td>
                        <td>
                          <span
                            className="admin-badge"
                            style={getRoleBadgeStyle(log.MAROLE)}
                          >
                            {getRoleName(log.MAROLE)}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 500 }}>{log.HANH_DONG}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="admin-btn admin-btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => setSelectedLog(log)}
                            title="Xem chi tiết"
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </div>

      {/* Modal chi tiết */}
      {selectedLog && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 2000, padding: '20px',
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '28px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontSize: '22px', fontWeight: 700, margin: 0 }}>
                <i className="fa-solid fa-circle-info" style={{ marginRight: '10px', color: 'var(--admin-primary)' }}></i>
                Chi tiết nhật ký
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', backgroundColor: '#faf7f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Thời gian</div>
                <div style={{ fontWeight: 600 }}>{formatDate(selectedLog.created_at)}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#faf7f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Người thực hiện</div>
                <div style={{ fontWeight: 600 }}>{selectedLog.HOTEN || '—'} <span style={{ color: '#888', fontWeight: 400 }}>({selectedLog.USERNAME})</span></div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#faf7f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Vai trò</div>
                <span className="admin-badge" style={getRoleBadgeStyle(selectedLog.MAROLE)}>{getRoleName(selectedLog.MAROLE)}</span>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#faf7f5', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Chi nhánh</div>
                <div style={{ fontWeight: 600 }}>{selectedLog.MACUAHANG ? `Chi nhánh ${selectedLog.MACUAHANG}` : '—'}</div>
              </div>
              <div style={{ padding: '12px', backgroundColor: '#faf7f5', borderRadius: '8px', gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: '#999', marginBottom: '4px' }}>Hành động</div>
                <div style={{ fontWeight: 600, fontSize: '16px', color: 'var(--admin-primary)' }}>{selectedLog.HANH_DONG}</div>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: '20px' }}>
              <button className="admin-btn admin-btn-primary" onClick={() => setSelectedLog(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminNhatKyPage;
