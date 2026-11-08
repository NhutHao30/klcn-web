import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminAnalyticsPage = () => {
  const toast = useToast();

  // Filters
  const [timeRange, setTimeRange] = useState('7days'); // 'today', 'yesterday', '7days', '30days', 'custom'
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [userSegment, setUserSegment] = useState('ALL'); // 'ALL', 'CUSTOMER', 'STAFF'

  // Data States
  const [userData, setUserData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch Data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const params = { timeRange };
      if (timeRange === 'custom' && fromDate && toDate) {
        params.fromDate = fromDate;
        params.toDate = toDate;
      }

      const [userRes, behaviorRes] = await Promise.all([
        axiosClient.get('/admin/analytics/users', { params }),
        axiosClient.get('/admin/analytics/behavior', { params })
      ]);

      if (userRes.data?.success) {
        setUserData(userRes.data.data);
      }
      if (behaviorRes.data?.success) {
        setBehaviorData(behaviorRes.data.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu phân tích:', err);
      if (showLoading) toast.error('Không thể tải báo cáo số liệu & hành vi người dùng');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);
    // Tự động cập nhật số liệu trực tuyến mỗi 8 giây
    const interval = setInterval(() => {
      fetchData(false);
    }, 8000);
    return () => clearInterval(interval);
  }, [timeRange]);

  // Handle Export Excel / CSV
  const handleExportCSV = () => {
    if (!userData || !behaviorData) {
      toast.warning('Chưa có đủ dữ liệu để xuất file');
      return;
    }

    try {
      let csvContent = '\uFEFF'; // UTF-8 BOM for Excel Vietnamese support

      csvContent += 'BÁO CÁO HOẠT ĐỘNG VÀ PHÂN TÍCH NGƯỜI DÙNG - GIVRAL BAKERY\n';
      csvContent += `Khoảng thời gian: ${userData.filterRange?.start || '--'} đến ${userData.filterRange?.end || '--'}\n`;
      csvContent += `Ngày trích xuất: ${new Date().toLocaleString('vi-VN')}\n\n`;

      // 1. KPI TỔNG QUAN
      csvContent += '1. CÁC CHỈ SỐ KPI TỔNG QUAN\n';
      csvContent += 'Chỉ số,Giá trị,Ghi chú\n';
      csvContent += `Tổng người dùng,${userData.totalUsers || 0},Bao gồm cả tài khoản khách và nhân viên\n`;
      csvContent += `Người dùng hoạt động hôm nay (DAU),${userData.dau || 0},Lượng tương tác trong ngày\n`;
      csvContent += `Người dùng hoạt động trong tháng (MAU),${userData.mau || 0},Lượng tương tác trong 30 ngày\n`;
      csvContent += `Đang trực tuyến Real-time,${userData.onlineCount || 0},Hoạt động trong 15 phút gần nhất\n`;
      csvContent += `Tỷ lệ rời bỏ (Churn rate),${userData.churnRate || 0}%,Tài khoản khóa hoặc không hoạt động lâu ngày\n\n`;

      // 2. NGƯỜI DÙNG ĐĂNG KÝ MỚI THEO NGÀY
      csvContent += '2. TĂNG TRƯỞNG NGƯỜI DÙNG ĐĂNG KÝ MỚI\n';
      csvContent += 'Ngày,Số lượng đăng ký mới\n';
      if (userData.dailyRegistrations?.length) {
        userData.dailyRegistrations.forEach(r => {
          csvContent += `${r.date},${r.count}\n`;
        });
      }
      csvContent += '\n';

      // 3. TOP TÍNH NĂNG TRUY CẬP
      csvContent += '3. TOP TÍNH NĂNG VÀ TRANG ĐƯỢC TRUY CẬP NHIỀU NHẤT\n';
      csvContent += 'Tên tính năng,Số lượt truy cập\n';
      if (behaviorData.topFeatures?.length) {
        behaviorData.topFeatures.forEach(f => {
          csvContent += `"${f.name}",${f.visits}\n`;
        });
      }
      csvContent += '\n';

      // 4. PHÂN BỐ THIẾT BỊ
      csvContent += '4. PHÂN BỐ THIẾT BỊ TRUY CẬP\n';
      csvContent += 'Thiết bị,Tỷ lệ phần trăm\n';
      if (behaviorData.devices?.breakdown?.length) {
        behaviorData.devices.breakdown.forEach(d => {
          csvContent += `${d.name},${d.percentage}%\n`;
        });
      }
      csvContent += '\n';

      // 5. TRÌNH DUYỆT
      csvContent += '5. TRÌNH DUYỆT PHỔ BIẾN\n';
      csvContent += 'Trình duyệt,Tỷ lệ phần trăm\n';
      if (behaviorData.browsers?.breakdown?.length) {
        behaviorData.browsers.breakdown.forEach(b => {
          csvContent += `${b.name},${b.percentage}%\n`;
        });
      }

      // Download trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Bao_Cao_Nguoi_Dung_Givral_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Xuất file báo cáo Excel/CSV thành công!');
    } catch (e) {
      console.error(e);
      toast.error('Có lỗi xảy ra khi tạo file CSV');
    }
  };

  // Handle Print / PDF
  const handlePrint = () => {
    window.print();
  };

  // Helper calculation for SVG Donut
  const renderDonutChart = (items) => {
    if (!items || items.length === 0) return null;
    let accumulated = 0;
    const colors = ['#0284c7', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'];

    return (
      <svg width="140" height="140" viewBox="0 0 42 42">
        <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
        {items.map((item, idx) => {
          const dash = item.percentage || 0;
          const strokeColor = colors[idx % colors.length];
          const strokeDasharray = `${dash} ${100 - dash}`;
          const strokeDashoffset = 100 - accumulated + 25;
          accumulated += dash;

          return (
            <circle
              key={idx}
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke={strokeColor}
              strokeWidth="6"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
            />
          );
        })}
      </svg>
    );
  };

  return (
    <AdminLayout>
      <div className="admin-analytics-container" style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', color: '#1e293b' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>Phân tích người dùng và hành vi</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                Bảng điều khiển tổng quan (Dashboard), chỉ số DAU/MAU, thống kê đăng ký, hành vi và phân tích thiết bị
              </p>
            </div>
          </div>

          {/* ACTION BUTTONS (EXPORT / PRINT / REFRESH) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
            <button
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #10b981',
                background: '#ecfdf5',
                color: '#047857',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-file-excel"></i>
              Xuất Excel / CSV
            </button>

            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className="fa-solid fa-print"></i>
              In báo cáo / PDF
            </button>

            <button
              onClick={fetchData}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#0284c7',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className={`fa-solid fa-rotate ${isLoading ? 'fa-spin' : ''}`}></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* ════════════════════════ TOOLBAR: BỘ LỌC LINH HOẠT ════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', border: '1px solid #e2e8f0', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }} className="no-print">
          
          {/* Quick Date Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginRight: 4 }}>
              <i className="fa-solid fa-calendar-days" style={{ marginRight: 6, color: '#0284c7' }}></i>
              Thời gian:
            </span>
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'yesterday', label: 'Hôm qua' },
              { id: '7days', label: '7 ngày qua' },
              { id: '30days', label: '30 ngày qua' },
              { id: 'custom', label: 'Tùy chỉnh' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setTimeRange(btn.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: timeRange === btn.id ? '1px solid #0284c7' : '1px solid #cbd5e1',
                  background: timeRange === btn.id ? '#0284c7' : '#fff',
                  color: timeRange === btn.id ? '#fff' : '#475569',
                  transition: 'all 0.2s ease'
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {timeRange === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
              <span style={{ color: '#94a3b8' }}>đến</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12 }}
              />
              <button
                onClick={fetchData}
                style={{ padding: '6px 12px', borderRadius: 6, background: '#0284c7', color: '#fff', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Áp dụng
              </button>
            </div>
          )}

          {/* User Segment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Phân khúc:</span>
            <select
              value={userSegment}
              onChange={(e) => setUserSegment(e.target.value)}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: '#fff' }}
            >
              <option value="ALL">Tất cả tài khoản</option>
              <option value="CUSTOMER">Khách hàng mua hàng</option>
              <option value="STAFF">Nhân viên & Quản trị</option>
            </select>
          </div>

        </div>

        {/* ════════════════════════ 5 KPI CARDS HÀNG ĐẦU ════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          {/* TỔNG NGƯỜI DÙNG */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tổng người dùng</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: 16 }}>
                <i className="fa-solid fa-users"></i>
              </div>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#0f172a' }}>
              {userData?.totalUsers?.toLocaleString('vi-VN') || '--'}
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Tài khoản bị khóa: <strong style={{ color: '#ef4444' }}>{userData?.lockedCount || 0}</strong>
            </div>
          </div>

          {/* DAU */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Users (DAU)</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: 16 }}>
                <i className="fa-solid fa-user-check"></i>
              </div>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#16a34a' }}>
              {userData?.dau?.toLocaleString('vi-VN') || '--'}
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Hoạt động trong 24 giờ qua
            </div>
          </div>

          {/* MAU */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Monthly Active (MAU)</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: 16 }}>
                <i className="fa-solid fa-calendar-check"></i>
              </div>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#9333ea' }}>
              {userData?.mau?.toLocaleString('vi-VN') || '--'}
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Tương tác trong 30 ngày gần nhất
            </div>
          </div>

          {/* ONLINE TRỰC TUYẾN */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Đang trực tuyến</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', fontSize: 16 }}>
                <i className="fa-solid fa-wifi"></i>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 10px #10b981' }}></span>
              <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#0d9488' }}>
                {userData?.onlineCount || 1}
              </h3>
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Đang có phiên làm việc (15p)
            </div>
          </div>

          {/* CHURN RATE */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tỷ lệ rời bỏ (Churn)</span>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontSize: 16 }}>
                <i className="fa-solid fa-user-minus"></i>
              </div>
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#ef4444' }}>
              {userData?.churnRate || 0}%
            </h3>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
              Tài khoản ngưng hoạt động &gt; 60 ngày
            </div>
          </div>

        </div>

        {/* ════════════════════════ BIỂU ĐỒ ĐĂNG KÝ MỚI (SVG BAR / AREA) ════════════════════════ */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                <i className="fa-solid fa-chart-column" style={{ marginRight: 8, color: '#0284c7' }}></i>
                Số lượng Người Dùng Đăng Ký Mới Theo Thời Gian
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                Theo dõi xu hướng tiếp cận khách hàng mới từ {userData?.filterRange?.start} đến {userData?.filterRange?.end}
              </p>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0284c7', background: '#e0f2fe', padding: '4px 10px', borderRadius: 8 }}>
              Tổng đăng ký mới: {userData?.dailyRegistrations?.reduce((sum, d) => sum + (d.count || 0), 0) || 0} tài khoản
            </span>
          </div>

          {/* SVG Chart */}
          <div style={{ width: '100%', height: 200, background: '#f8fafc', borderRadius: 10, padding: '16px 20px', boxSizing: 'border-box', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            {userData?.dailyRegistrations?.map((item, idx) => {
              const maxCount = Math.max(5, ...userData.dailyRegistrations.map(d => d.count || 0));
              const heightPercent = Math.max(12, Math.round(((item.count || 0) / maxCount) * 100));

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  {/* Tooltip value */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: item.count > 0 ? '#0284c7' : '#94a3b8', marginBottom: 4 }}>
                    {item.count}
                  </span>
                  {/* Bar */}
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 36,
                      height: `${heightPercent}%`,
                      background: item.count > 0 ? 'linear-gradient(180deg, #0284c7, #38bdf8)' : '#e2e8f0',
                      borderRadius: '6px 6px 0 0',
                      transition: 'height 0.4s ease'
                    }}
                  ></div>
                  {/* Label */}
                  <span style={{ fontSize: 11, color: '#64748b', marginTop: 6, whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ════════════════════════ 2 CỘT: TOP TÍNH NĂNG & THIẾT BỊ/TRÌNH DUYỆT ════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24, marginBottom: 24 }}>
          
          {/* CỘT 1: TOP TÍNH NĂNG TRUY CẬP */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
              <i className="fa-solid fa-fire" style={{ marginRight: 8, color: '#ea580c' }}></i>
              Tính Năng & Trang Được Truy Cập Nhiều Nhất
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
              Thống kê qua lượt gọi API và tương tác ghi nhận trong Audit Logs
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {behaviorData?.topFeatures?.map((f, idx) => {
                const maxVisits = Math.max(1, behaviorData.topFeatures[0]?.visits || 1);
                const percent = Math.round((f.visits / maxVisits) * 100);

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 5 }}>
                      <span style={{ color: '#1e293b' }}>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: 20, 
                          height: 20, 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#fef3c7' : '#f1f5f9', 
                          color: idx === 0 ? '#b45309' : '#64748b', 
                          fontSize: 11, 
                          fontWeight: 700, 
                          marginRight: 8 
                        }}>
                          {idx + 1}
                        </span>
                        {f.name}
                      </span>
                      <strong style={{ color: '#0284c7' }}>{f.visits.toLocaleString('vi-VN')} lượt</strong>
                    </div>
                    <div style={{ width: '100%', height: 7, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: idx === 0 ? '#ea580c' : '#0284c7', borderRadius: 4 }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CỘT 2: THIẾT BỊ (MOBILE / DESKTOP) & TRÌNH DUYỆT */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
              <i className="fa-solid fa-mobile-screen-button" style={{ marginRight: 8, color: '#9333ea' }}></i>
              Phân Bố Thiết Bị & Trình Duyệt
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
              Nhận diện thiết bị người dùng qua User-Agent thực tế
            </p>

            {/* Devices section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid #f1f5f9' }}>
              <div>{renderDonutChart(behaviorData?.devices?.breakdown)}</div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {behaviorData?.devices?.breakdown?.map((dev, idx) => {
                  const colors = ['#0284c7', '#10b981', '#f59e0b'];
                  return (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: colors[idx % colors.length] }}></span>
                        {dev.name}
                      </span>
                      <strong>{dev.percentage}% ({dev.count} lượt)</strong>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Browsers section */}
            <h4 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 12px', color: '#475569' }}>Trình duyệt phổ biến:</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {behaviorData?.browsers?.breakdown?.map((br, idx) => (
                <div key={idx} style={{ padding: '8px 12px', borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#334155', fontWeight: 600 }}>{br.name}</span>
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>{br.percentage}%</span>
                </div>
              ))}
            </div>

          </div>

        </div>

        {/* ════════════════════════ 2 BẢNG: ONLINE USERS & CHURN REASONS ════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 24 }}>
          
          {/* BẢNG NGƯỜI DÙNG ĐANG TRỰC TUYẾN (REAL-TIME) */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 8, boxShadow: '0 0 8px #10b981' }}></span>
                Người Dùng Đang Trực Tuyến (Real-time)
              </h3>
              <span style={{ fontSize: 12, color: '#64748b' }}>Tương tác &lt; 15 phút</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                    <th style={{ padding: '10px 12px' }}>Tài khoản</th>
                    <th style={{ padding: '10px 12px' }}>Thiết bị / Nền tảng</th>
                    <th style={{ padding: '10px 12px' }}>Hành động hiện tại</th>
                    <th style={{ padding: '10px 12px' }}>Địa chỉ IP</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Thời gian</th>
                  </tr>
                </thead>
                <tbody>
                  {userData?.onlineUsers?.length > 0 ? (
                    userData.onlineUsers.map((u, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.hoTen}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>@{u.username}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            background: u.device?.includes('Mobile') ? '#ecfdf5' : '#eff6ff',
                            color: u.device?.includes('Mobile') ? '#059669' : '#2563eb',
                            border: u.device?.includes('Mobile') ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                          }}>
                            <i className={`fa-solid ${u.device?.includes('Mobile') ? 'fa-mobile-screen' : 'fa-laptop'}`}></i>
                            {u.device || 'Máy tính (Desktop)'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: '#0284c7', fontWeight: 500 }}>
                          {u.action}
                        </td>
                        <td style={{ padding: '10px 12px', color: '#64748b', fontSize: 12 }}>
                          <code>{u.ip || '127.0.0.1'}</code>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#64748b', fontSize: 12 }}>
                          {u.lastActive}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>
                        Chưa có tương tác mới trong 15 phút qua
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* BẢNG PHÂN TÍCH LÝ DO RỜI BỎ (CHURN RATE) */}
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px', color: '#0f172a' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8, color: '#ef4444' }}></i>
              Phân Tích Lý Do Rời Bỏ & Khóa Tài Khoản
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
              Thống kê từ phản hồi khảo sát người dùng và nhật ký khóa tài khoản
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {userData?.churnReasons?.map((r, idx) => (
                <div key={idx} style={{ padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span style={{ color: '#1e293b' }}>• {r.reason}</span>
                    <strong style={{ color: '#dc2626' }}>{r.percentage}%</strong>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${r.percentage}%`, height: '100%', background: '#ef4444', borderRadius: 3 }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, padding: 12, borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca', fontSize: 12, color: '#991b1b' }}>
              <i className="fa-solid fa-lightbulb" style={{ marginRight: 6 }}></i>
              <strong>Đề xuất cải thiện:</strong> Triển khai chiến dịch email kích hoạt lại giỏ hàng và tặng mã giảm giá tự động cho tài khoản không hoạt động trên 30 ngày.
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;

