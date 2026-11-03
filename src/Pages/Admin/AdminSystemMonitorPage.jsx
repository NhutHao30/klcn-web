import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import axiosClient from '../../services/axiosClient';
import { useToast } from '../../components/Toast/Toast';

const AdminSystemMonitorPage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('performance'); // 'performance', 'errors', 'alerts'
  
  // Hiệu năng & Real-time
  const [performanceData, setPerformanceData] = useState(null);
  const [isPerfLoading, setIsPerfLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(4000); // 4s
  const [fetchError, setFetchError] = useState(null);

  // Lỗi hệ thống
  const [errorLogs, setErrorLogs] = useState([]);
  const [errorSummary, setErrorSummary] = useState({ total: 0, critical: 0, pending: 0, dbErrors: 0 });
  const [isErrorsLoading, setIsErrorsLoading] = useState(false);
  const [errorFilter, setErrorFilter] = useState({
    loaiLoi: 'ALL',
    mucDo: 'ALL',
    trangThai: ''
  });
  const [expandedErrorId, setExpandedErrorId] = useState(null);

  // Cấu hình cảnh báo
  const [alertSettings, setAlertSettings] = useState({
    cpuThreshold: 90,
    ramThreshold: 85,
    diskThreshold: 90,
    latencyThreshold: 1500,
    errorRateThreshold: 5,
    emailAlertEnabled: true,
    alertEmail: '',
    telegramAlertEnabled: false,
    telegramBotToken: '',
    telegramChatId: '',
    slackAlertEnabled: false,
    slackWebhookUrl: '',
    smsAlertEnabled: false,
    smsPhoneNumber: '',
  });
  const [isAlertLoading, setIsAlertLoading] = useState(false);
  const [isSavingAlerts, setIsSavingAlerts] = useState(false);
  const [testingChannel, setTestingChannel] = useState(null);

  // Timer ref for auto refresh
  const timerRef = useRef(null);

  // 1. Fetch Performance Data
  const fetchPerformance = async (showLoading = false) => {
    if (showLoading) setIsPerfLoading(true);
    try {
      const res = await axiosClient.get('/admin/system/performance');
      if (res.data?.success) {
        setPerformanceData(res.data.data);
        setFetchError(null);
      }
    } catch (err) {
      console.error('Lỗi lấy dữ liệu hiệu năng:', err);
      setFetchError(err.response?.data?.message || 'Không thể kết nối đến máy chủ API');
    } finally {
      if (showLoading) setIsPerfLoading(false);
    }
  };

  // 2. Fetch Errors
  const fetchErrors = async () => {
    setIsErrorsLoading(true);
    try {
      const params = {};
      if (errorFilter.loaiLoi !== 'ALL') params.loaiLoi = errorFilter.loaiLoi;
      if (errorFilter.mucDo !== 'ALL') params.mucDo = errorFilter.mucDo;
      if (errorFilter.trangThai !== '') params.trangThai = errorFilter.trangThai;

      const res = await axiosClient.get('/admin/system/errors', { params });
      if (res.data?.success) {
        setErrorLogs(res.data.data?.data || []);
        if (res.data.summary) setErrorSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách lỗi:', err);
      toast.error('Không thể tải nhật ký lỗi hệ thống');
    } finally {
      setIsErrorsLoading(false);
    }
  };

  // 3. Fetch Alert Settings
  const fetchAlertSettings = async () => {
    setIsAlertLoading(true);
    try {
      const res = await axiosClient.get('/admin/system/alerts');
      if (res.data?.success && res.data.data) {
        setAlertSettings(res.data.data);
      }
    } catch (err) {
      console.error('Lỗi lấy cấu hình cảnh báo:', err);
    } finally {
      setIsAlertLoading(false);
    }
  };

  // Setup interval for Performance Tab
  useEffect(() => {
    if (activeTab === 'performance') {
      fetchPerformance(true);
      if (autoRefresh) {
        timerRef.current = setInterval(() => {
          fetchPerformance(false);
        }, refreshInterval);
      }
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTab, autoRefresh, refreshInterval]);

  // Load errors when tab changes or filter changes
  useEffect(() => {
    if (activeTab === 'errors') {
      fetchErrors();
    }
  }, [activeTab, errorFilter]);

  // Load alert settings when tab changes
  useEffect(() => {
    if (activeTab === 'alerts') {
      fetchAlertSettings();
    }
  }, [activeTab]);

  // Handle Update Error Status
  const handleUpdateErrorStatus = async (id, status) => {
    try {
      const res = await axiosClient.put(`/admin/system/errors/${id}`, { trangThai: status });
      if (res.data?.success) {
        toast.success(status === 1 ? 'Đã đánh dấu đã giải quyết!' : 'Đã chuyển sang trạng thái bỏ qua!');
        fetchErrors();
      }
    } catch (err) {
      toast.error('Cập nhật trạng thái lỗi thất bại');
    }
  };

  // Handle Save Alert Settings
  const handleSaveAlerts = async (e) => {
    e.preventDefault();
    setIsSavingAlerts(true);
    try {
      const res = await axiosClient.put('/admin/system/alerts', alertSettings);
      if (res.data?.success) {
        toast.success('Lưu cấu hình ngưỡng & kênh cảnh báo thành công!');
      }
    } catch (err) {
      toast.error('Lỗi khi lưu cấu hình cảnh báo');
    } finally {
      setIsSavingAlerts(false);
    }
  };

  // Handle Test Alert
  const handleTestAlert = async (channel) => {
    setTestingChannel(channel);
    try {
      const res = await axiosClient.post('/admin/system/alerts/test', { channel });
      if (res.data?.success) {
        toast.success(res.data.message || `Đã gửi cảnh báo thử nghiệm qua ${channel.toUpperCase()}`);
      } else {
        toast.error(res.data?.message || 'Gửi thử nghiệm không thành công');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi gửi cảnh báo thử nghiệm');
    } finally {
      setTestingChannel(null);
    }
  };

  // Helper colors
  const getUsageColor = (val, warnThreshold = 75, dangerThreshold = 90) => {
    if (val >= dangerThreshold) return '#ef4444'; // Red
    if (val >= warnThreshold) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const getSeverityBadge = (level) => {
    switch (level) {
      case 'CRITICAL':
        return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fee2e2', color: '#dc2626' }}>CRITICAL</span>;
      case 'HIGH':
        return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#ffedd5', color: '#c2410c' }}>HIGH</span>;
      case 'MEDIUM':
        return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#b45309' }}>MEDIUM</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: '#f1f5f9', color: '#475569' }}>LOW</span>;
    }
  };

  return (
    <AdminLayout>
      <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', color: '#1e293b' }}>
        
        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>
                <i className="fa-solid fa-server"></i>
              </div>
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#0f172a' }}>Giám sát Kỹ thuật & Bảo mật Hệ thống</h1>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  Theo dõi hiệu năng phần cứng Server, biểu đồ Real-time, phát hiện ngoại lệ & cấu hình cảnh báo Downtime
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {performanceData?.isDbConnected === false ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 14px', 
                borderRadius: 20, 
                fontSize: 13, 
                fontWeight: 700, 
                background: '#fee2e2', 
                color: '#dc2626', 
                border: '1px solid #f87171' 
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', display: 'inline-block', boxShadow: '0 0 8px #dc2626' }}></span>
                MySQL Ngoại Tuyến (Downtime)
              </span>
            ) : fetchError ? (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 14px', 
                borderRadius: 20, 
                fontSize: 13, 
                fontWeight: 700, 
                background: '#fff7ed', 
                color: '#c2410c', 
                border: '1px solid #fdba74' 
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }}></span>
                Lỗi Kết Nối Máy Chủ
              </span>
            ) : (
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: 8, 
                padding: '6px 14px', 
                borderRadius: 20, 
                fontSize: 13, 
                fontWeight: 600, 
                background: '#ecfdf5', 
                color: '#059669', 
                border: '1px solid #a7f3d0' 
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
                Máy chủ & CSDL Trực tuyến
              </span>
            )}
            <button 
              onClick={() => fetchPerformance(true)} 
              disabled={isPerfLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <i className={`fa-solid fa-arrows-rotate ${isPerfLoading ? 'fa-spin' : ''}`}></i>
              Làm mới
            </button>
          </div>
        </div>

        {/* DOWNTIME ALERT BANNER */}
        {performanceData?.isDbConnected === false && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.08)'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 20, flexShrink: 0 }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
            <div style={{ flex: 1 }}>
              <strong style={{ fontSize: 14, color: '#991b1b', display: 'block', marginBottom: 2 }}>
                🚨 CẢNH BÁO SỰ CỐ DOWNTIME: Cơ sở dữ liệu MySQL đã ngắt kết nối / Ngoại tuyến!
              </strong>
              <p style={{ margin: 0, fontSize: 12, color: '#b91c1c' }}>
                Hệ thống đang hoạt động ở chế độ Cứu hộ độc lập (Resilient Mode). Trang Giám sát vẫn theo dõi liên tục CPU, RAM, Ổ cứng và tốc độ máy chủ. Vui lòng kiểm tra lại dịch vụ MySQL (XAMPP / Laragon / Docker).
              </p>
            </div>
          </div>
        )}

        {/* NAVIGATION TABS */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('performance')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'performance' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'performance' ? '3px solid #0284c7' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <i className="fa-solid fa-microchip"></i>
            Hiệu năng & Tài nguyên (Real-time)
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'errors' ? '#dc2626' : '#64748b',
              borderBottom: activeTab === 'errors' ? '3px solid #dc2626' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <i className="fa-solid fa-bug"></i>
            Theo dõi lỗi hệ thống
            {errorSummary.pending > 0 && (
              <span style={{ padding: '2px 7px', borderRadius: 10, background: '#fee2e2', color: '#dc2626', fontSize: 11 }}>
                {errorSummary.pending}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('alerts')}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              color: activeTab === 'alerts' ? '#d97706' : '#64748b',
              borderBottom: activeTab === 'alerts' ? '3px solid #d97706' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <i className="fa-solid fa-bell"></i>
            Cảnh báo tự động & Ngưỡng an toàn
          </button>
        </div>

        {/* ════════════════════════ TAB 1: HIỆU NĂNG & REAL-TIME ════════════════════════ */}
        {activeTab === 'performance' && (
          <div>
            {/* Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#f8fafc', padding: '10px 18px', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                  />
                  Tự động làm mới Real-time
                </label>
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  disabled={!autoRefresh}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 12, background: '#fff' }}
                >
                  <option value={2000}>Mỗi 2 giây</option>
                  <option value={4000}>Mỗi 4 giây</option>
                  <option value={10000}>Mỗi 10 giây</option>
                </select>
              </div>

              <div style={{ fontSize: 12, color: '#64748b' }}>
                Cập nhật lúc: <strong>{performanceData?.checkedAt || '--:--:--'}</strong> | OS: {performanceData?.os || 'Windows/Linux'} | PHP: {performanceData?.phpVersion || '8.x'}
              </div>
            </div>

            {/* 4 KPI CARDS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 24 }}>
              
              {/* CPU CARD */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bộ vi xử lý (CPU)</span>
                    <h3 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0', color: getUsageColor(performanceData?.cpu?.usagePercent || 0) }}>
                      {performanceData?.cpu?.usagePercent ?? '--'}%
                    </h3>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: 18 }}>
                    <i className="fa-solid fa-microchip"></i>
                  </div>
                </div>
                {/* Progress bar */}
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${Math.min(100, performanceData?.cpu?.usagePercent || 0)}%`, height: '100%', background: getUsageColor(performanceData?.cpu?.usagePercent || 0), transition: 'width 0.5s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Số luồng logic: <strong>{performanceData?.cpu?.cores || 8} cores</strong></span>
                  <span>Trạng thái: <strong>{performanceData?.cpu?.usagePercent > 85 ? 'Tải cao' : 'Bình thường'}</strong></span>
                </div>
              </div>

              {/* RAM CARD */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Bộ nhớ RAM Server</span>
                    <h3 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0', color: getUsageColor(performanceData?.ram?.usagePercent || 0) }}>
                      {performanceData?.ram?.usagePercent ?? '--'}%
                    </h3>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: 18 }}>
                    <i className="fa-solid fa-memory"></i>
                  </div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${Math.min(100, performanceData?.ram?.usagePercent || 0)}%`, height: '100%', background: getUsageColor(performanceData?.ram?.usagePercent || 0), transition: 'width 0.5s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Đã dùng: <strong>{performanceData?.ram?.usedGb || '--'} / {performanceData?.ram?.totalGb || '--'} GB</strong></span>
                  <span>PHP: <strong>{performanceData?.ram?.phpMemoryMb || '--'} MB</strong></span>
                </div>
              </div>

              {/* DISK CARD */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dung lượng Ổ cứng (Disk)</span>
                    <h3 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0', color: getUsageColor(performanceData?.disk?.usagePercent || 0) }}>
                      {performanceData?.disk?.usagePercent ?? '--'}%
                    </h3>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706', fontSize: 18 }}>
                    <i className="fa-solid fa-hard-drive"></i>
                  </div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: `${Math.min(100, performanceData?.disk?.usagePercent || 0)}%`, height: '100%', background: getUsageColor(performanceData?.disk?.usagePercent || 0), transition: 'width 0.5s ease' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Còn trống: <strong>{performanceData?.disk?.freeGb || '--'} GB</strong></span>
                  <span>Tổng ổ: <strong>{performanceData?.disk?.totalGb || '--'} GB</strong></span>
                </div>
              </div>

              {/* NETWORK & LATENCY CARD */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Băng thông & Tải API</span>
                    <h3 style={{ fontSize: 28, fontWeight: 800, margin: '4px 0 0', color: '#0284c7' }}>
                      {performanceData?.network?.requestsPerMinute ?? '--'} <span style={{ fontSize: 14, fontWeight: 500, color: '#64748b' }}>req/phút</span>
                    </h3>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ccfbf1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0d9488', fontSize: 18 }}>
                    <i className="fa-solid fa-network-wired"></i>
                  </div>
                </div>
                <div style={{ width: '100%', height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ width: '65%', height: '100%', background: '#0d9488' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                  <span>Download: <strong>{performanceData?.network?.bandwidthInMb || 0} MB/s</strong></span>
                  <span>Upload: <strong>{performanceData?.network?.bandwidthOutMb || 0} MB/s</strong></span>
                </div>
              </div>

            </div>

            {/* REAL-TIME LATENCY & CPU SVG CHART */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a' }}>
                    <i className="fa-solid fa-chart-line" style={{ marginRight: 8, color: '#0284c7' }}></i>
                    Biểu đồ thời gian thực: Tốc độ phản hồi API (Latency ms) & Tải CPU (%)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                    Cập nhật liên tục 15 điểm đo gần nhất của hệ thống
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0284c7' }}>
                    <span style={{ width: 12, height: 4, background: '#0284c7', borderRadius: 2 }}></span>
                    Độ trễ API (ms)
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#ef4444' }}>
                    <span style={{ width: 12, height: 4, background: '#ef4444', borderRadius: 2 }}></span>
                    Tải CPU (%)
                  </span>
                </div>
              </div>

              {/* SVG Area Chart */}
              <div style={{ width: '100%', height: 220, position: 'relative', background: '#f8fafc', borderRadius: 10, padding: '10px 10px 30px 40px', boxSizing: 'border-box' }}>
                {performanceData?.realtimeTrend && performanceData.realtimeTrend.length > 1 ? (
                  <svg width="100%" height="100%" viewBox="0 0 700 180" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="700" y2="30" stroke="#e2e8f0" strokeDasharray="4" />
                    <line x1="0" y1="80" x2="700" y2="80" stroke="#e2e8f0" strokeDasharray="4" />
                    <line x1="0" y1="130" x2="700" y2="130" stroke="#e2e8f0" strokeDasharray="4" />

                    {/* Latency Area & Path */}
                    {(() => {
                      const trend = performanceData.realtimeTrend;
                      const count = trend.length;
                      const maxVal = Math.max(100, ...trend.map(t => Math.max(t.latency || 0, t.cpu || 0)));
                      
                      const pointsLatency = trend.map((t, idx) => {
                        const x = (idx / (count - 1)) * 680 + 10;
                        const y = 170 - ((t.latency || 10) / maxVal) * 140;
                        return `${x},${y}`;
                      });

                      const pointsCpu = trend.map((t, idx) => {
                        const x = (idx / (count - 1)) * 680 + 10;
                        const y = 170 - ((t.cpu || 10) / maxVal) * 140;
                        return `${x},${y}`;
                      });

                      const areaPoints = `10,170 ${pointsLatency.join(' ')} 690,170`;

                      return (
                        <>
                          <polygon points={areaPoints} fill="url(#latencyGrad)" />
                          <polyline points={pointsLatency.join(' ')} fill="none" stroke="#0284c7" strokeWidth="2.5" />
                          <polyline points={pointsCpu.join(' ')} fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3" />
                          {trend.map((t, idx) => {
                            const x = (idx / (count - 1)) * 680 + 10;
                            const y = 170 - ((t.latency || 10) / maxVal) * 140;
                            return (
                              <circle key={idx} cx={x} cy={y} r="3.5" fill="#0284c7" stroke="#fff" strokeWidth="1.5" />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: 13 }}>
                    Đang đồng bộ chuỗi thời gian...
                  </div>
                )}

                {/* X Axis Time Labels */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                  {performanceData?.realtimeTrend?.filter((_, i) => i % 3 === 0).map((t, i) => (
                    <span key={i}>{t.time}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* CORE SERVICES STATUS */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a' }}>
                <i className="fa-solid fa-network-wired" style={{ marginRight: 8, color: '#10b981' }}></i>
                Trạng thái Dịch vụ & Kết nối Cơ sở dữ liệu
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {performanceData?.services?.map((srv, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', border: '1px solid #cbd5e1' }}>
                        <i className={`fa-solid fa-${srv.icon || 'server'}`}></i>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{srv.name}</h4>
                        <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{srv.desc}</p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        display: 'inline-block', 
                        padding: '3px 8px', 
                        borderRadius: 12, 
                        fontSize: 11, 
                        fontWeight: 700, 
                        background: srv.status === 'ONLINE' ? '#dcfce7' : '#fee2e2', 
                        color: srv.status === 'ONLINE' ? '#166534' : '#991b1b' 
                      }}>
                        {srv.status}
                      </span>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{srv.latency}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ════════════════════════ TAB 2: THEO DÕI LỖI HỆ THỐNG ════════════════════════ */}
        {activeTab === 'errors' && (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>TỔNG SỐ LỖI GHI NHẬN</span>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#1e293b' }}>{errorSummary.total}</h3>
              </div>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #fee2e2' }}>
                <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>LỖI NGHIÊM TRỌNG (CRITICAL)</span>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#dc2626' }}>{errorSummary.critical}</h3>
              </div>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #fef3c7' }}>
                <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>CHƯA XỬ LÝ (PENDING)</span>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#d97706' }}>{errorSummary.pending}</h3>
              </div>
              <div style={{ background: '#fff', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>LỖI CƠ SỞ DỮ LIỆU</span>
                <h3 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#0284c7' }}>{errorSummary.dbErrors}</h3>
              </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Loại lỗi:</label>
                <select
                  value={errorFilter.loaiLoi}
                  onChange={(e) => setErrorFilter({ ...errorFilter, loaiLoi: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 160 }}
                >
                  <option value="ALL">Tất cả loại lỗi</option>
                  <option value="BUG">Lỗi lập trình (Bug/Code)</option>
                  <option value="DATABASE_ERROR">Lỗi kết nối CSDL (DB)</option>
                  <option value="SERVER_500">Lỗi máy chủ (HTTP 500)</option>
                  <option value="EXTERNAL_API">Lỗi API bên thứ 3</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Mức độ:</label>
                <select
                  value={errorFilter.mucDo}
                  onChange={(e) => setErrorFilter({ ...errorFilter, mucDo: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 140 }}
                >
                  <option value="ALL">Tất cả mức độ</option>
                  <option value="CRITICAL">Critical (Khẩn cấp)</option>
                  <option value="HIGH">High (Cao)</option>
                  <option value="MEDIUM">Medium (Vừa)</option>
                  <option value="LOW">Low (Thấp)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Trạng thái:</label>
                <select
                  value={errorFilter.trangThai}
                  onChange={(e) => setErrorFilter({ ...errorFilter, trangThai: e.target.value })}
                  style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, minWidth: 140 }}
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="0">Chờ xử lý</option>
                  <option value="1">Đã giải quyết</option>
                  <option value="2">Bỏ qua</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={fetchErrors}
                  style={{ padding: '8px 16px', borderRadius: 8, background: '#0284c7', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  <i className="fa-solid fa-filter" style={{ marginRight: 6 }}></i>
                  Lọc dữ liệu
                </button>
              </div>
            </div>

            {/* Error Table */}
            <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
              {isErrorsLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: 24, marginBottom: 8, color: '#0284c7' }}></i>
                  <div>Đang tải danh sách lỗi...</div>
                </div>
              ) : errorLogs.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>
                  <i className="fa-regular fa-circle-check" style={{ fontSize: 36, color: '#10b981', marginBottom: 12 }}></i>
                  <h4 style={{ margin: 0, fontSize: 16 }}>Hệ thống hoạt động mượt mà, không có lỗi phù hợp bộ lọc!</h4>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 700 }}>
                      <th style={{ padding: '14px 16px' }}>Mức độ</th>
                      <th style={{ padding: '14px 16px' }}>Thông điệp lỗi / Tên lỗi</th>
                      <th style={{ padding: '14px 16px' }}>URL / Tệp phát sinh</th>
                      <th style={{ padding: '14px 16px', textAlign: 'center' }}>Tần suất</th>
                      <th style={{ padding: '14px 16px' }}>Lần cuối</th>
                      <th style={{ padding: '14px 16px' }}>Trạng thái</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorLogs.map((item) => (
                      <React.Fragment key={item.id}>
                        <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '14px 16px' }}>
                            {getSeverityBadge(item.mucDo)}
                          </td>
                          <td style={{ padding: '14px 16px', maxWidth: 340 }}>
                            <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.tenLoi}</div>
                            <div style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.thongDiep}
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#475569', maxWidth: 220, wordBreak: 'break-all' }}>
                            {item.url || item.tepTin ? (
                              <span>
                                {item.url && <code>{item.url}</code>}
                                {item.tepTin && <div style={{ color: '#94a3b8', fontSize: 11 }}>{item.tepTin}:{item.dongSo}</div>}
                              </span>
                            ) : '--'}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                            <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', fontWeight: 700, color: '#0f172a' }}>
                              {item.soLanXuatHien || 1}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontSize: 12, color: '#64748b' }}>
                            {item.lanCuoiXuatHien ? new Date(item.lanCuoiXuatHien).toLocaleString('vi-VN') : '--'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            {item.trangThai === 1 ? (
                              <span style={{ color: '#059669', fontWeight: 600 }}><i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>Đã giải quyết</span>
                            ) : item.trangThai === 2 ? (
                              <span style={{ color: '#64748b' }}>Bỏ qua</span>
                            ) : (
                              <span style={{ color: '#dc2626', fontWeight: 600 }}><i className="fa-solid fa-clock" style={{ marginRight: 4 }}></i>Chờ xử lý</span>
                            )}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setExpandedErrorId(expandedErrorId === item.id ? null : item.id)}
                                title="Xem Stack Trace"
                                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', fontSize: 12, cursor: 'pointer' }}
                              >
                                <i className={`fa-solid ${expandedErrorId === item.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                              </button>

                              {item.trangThai === 0 && (
                                <button
                                  onClick={() => handleUpdateErrorStatus(item.id, 1)}
                                  title="Đánh dấu đã giải quyết"
                                  style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#10b981', color: '#fff', fontSize: 12, cursor: 'pointer' }}
                                >
                                  <i className="fa-solid fa-check"></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Stack Trace */}
                        {expandedErrorId === item.id && (
                          <tr style={{ background: '#f8fafc' }}>
                            <td colSpan={7} style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                                Chi tiết Stack Trace & Thông tin gỡ lỗi:
                              </div>
                              <pre style={{ margin: 0, padding: 12, background: '#1e293b', color: '#f8fafc', borderRadius: 8, fontSize: 11, maxHeight: 180, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {item.stackTrace || 'Không có chi tiết stack trace.'}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}

        {/* ════════════════════════ TAB 3: CẢNH BÁO TỰ ĐỘNG & NGƯỠNG AN TOÀN ════════════════════════ */}
        {activeTab === 'alerts' && (
          <form onSubmit={handleSaveAlerts}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
              
              {/* KHỐI 1: THIẾT LẬP NGƯỠNG CẢNH BÁO */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-sliders" style={{ color: '#0284c7' }}></i>
                  Ngưỡng giám sát an toàn (Thresholds)
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
                  Hệ thống tự động kích hoạt gửi cảnh báo khẩn cấp khi chỉ số vượt quá ngưỡng định sẵn liên tục.
                </p>

                {/* CPU Threshold */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>Ngưỡng cảnh báo CPU:</span>
                    <strong style={{ color: '#0284c7' }}>{alertSettings.cpuThreshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="99"
                    value={alertSettings.cpuThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, cpuThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#0284c7' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Khuyến nghị: 85% - 90% để tránh nghẽn luồng xử lý</span>
                </div>

                {/* RAM Threshold */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>Ngưỡng cảnh báo RAM:</span>
                    <strong style={{ color: '#9333ea' }}>{alertSettings.ramThreshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="98"
                    value={alertSettings.ramThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, ramThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#9333ea' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Khuyến nghị: 80% - 85% nhằm chống tràn bộ nhớ PHP</span>
                </div>

                {/* Disk Threshold */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>Ngưỡng đầy Ổ cứng (Disk):</span>
                    <strong style={{ color: '#d97706' }}>{alertSettings.diskThreshold}%</strong>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="98"
                    value={alertSettings.diskThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, diskThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#d97706' }}
                  />
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>Cảnh báo khi ổ lưu trữ nhật ký và hóa đơn gần đầy</span>
                </div>

                {/* Latency Threshold */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>Độ trễ API tối đa (Latency):</span>
                    <strong style={{ color: '#0d9488' }}>{alertSettings.latencyThreshold} ms</strong>
                  </div>
                  <input
                    type="number"
                    step="100"
                    min="500"
                    max="5000"
                    value={alertSettings.latencyThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, latencyThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                {/* Error Rate Threshold */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                    <span>Tỷ lệ lỗi 500 / phút:</span>
                    <strong style={{ color: '#dc2626' }}>{alertSettings.errorRateThreshold}%</strong>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={alertSettings.errorRateThreshold}
                    onChange={(e) => setAlertSettings({ ...alertSettings, errorRateThreshold: Number(e.target.value) })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

              </div>

              {/* KHỐI 2: CẤU HÌNH KÊNH THÔNG BÁO CẢNH BÁO */}
              <div style={{ background: '#fff', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-bullhorn" style={{ color: '#d97706' }}></i>
                  Kênh gửi thông báo khẩn cấp (Multi-channel)
                </h3>
                <p style={{ margin: '0 0 20px', fontSize: 12, color: '#64748b' }}>
                  Admin nhận tin báo ngay lập tức qua Email, Telegram Bot, Slack hoặc tin nhắn SMS khi hệ thống gặp sự cố sập (Downtime).
                </p>

                {/* EMAIL ALERT */}
                <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={alertSettings.emailAlertEnabled}
                        onChange={(e) => setAlertSettings({ ...alertSettings, emailAlertEnabled: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                      />
                      <i className="fa-solid fa-envelope" style={{ color: '#0284c7' }}></i>
                      Cảnh báo qua Email Quản trị
                    </label>
                    <button
                      type="button"
                      disabled={testingChannel === 'email' || !alertSettings.emailAlertEnabled}
                      onClick={() => handleTestAlert('email')}
                      style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {testingChannel === 'email' ? 'Đang gửi...' : 'Test Email'}
                    </button>
                  </div>
                  <input
                    type="email"
                    placeholder="Nhập địa chỉ email admin..."
                    value={alertSettings.alertEmail || ''}
                    onChange={(e) => setAlertSettings({ ...alertSettings, alertEmail: e.target.value })}
                    disabled={!alertSettings.emailAlertEnabled}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, background: alertSettings.emailAlertEnabled ? '#fff' : '#f1f5f9' }}
                  />
                </div>

                {/* TELEGRAM BOT ALERT */}
                <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={alertSettings.telegramAlertEnabled}
                        onChange={(e) => setAlertSettings({ ...alertSettings, telegramAlertEnabled: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                      />
                      <i className="fa-brands fa-telegram" style={{ color: '#0284c7' }}></i>
                      Cảnh báo qua Telegram Bot
                    </label>
                    <button
                      type="button"
                      disabled={testingChannel === 'telegram' || !alertSettings.telegramAlertEnabled}
                      onClick={() => handleTestAlert('telegram')}
                      style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {testingChannel === 'telegram' ? 'Đang gửi...' : 'Test Bot'}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      placeholder="Bot API Token"
                      value={alertSettings.telegramBotToken || ''}
                      onChange={(e) => setAlertSettings({ ...alertSettings, telegramBotToken: e.target.value })}
                      disabled={!alertSettings.telegramAlertEnabled}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                    <input
                      type="text"
                      placeholder="Chat / Channel ID"
                      value={alertSettings.telegramChatId || ''}
                      onChange={(e) => setAlertSettings({ ...alertSettings, telegramChatId: e.target.value })}
                      disabled={!alertSettings.telegramAlertEnabled}
                      style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>
                </div>

                {/* SLACK WEBHOOK ALERT */}
                <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={alertSettings.slackAlertEnabled}
                        onChange={(e) => setAlertSettings({ ...alertSettings, slackAlertEnabled: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                      />
                      <i className="fa-brands fa-slack" style={{ color: '#4a154b' }}></i>
                      Cảnh báo qua Slack Webhook
                    </label>
                    <button
                      type="button"
                      disabled={testingChannel === 'slack' || !alertSettings.slackAlertEnabled}
                      onClick={() => handleTestAlert('slack')}
                      style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {testingChannel === 'slack' ? 'Đang gửi...' : 'Test Slack'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="https://hooks.slack.com/services/..."
                    value={alertSettings.slackWebhookUrl || ''}
                    onChange={(e) => setAlertSettings({ ...alertSettings, slackWebhookUrl: e.target.value })}
                    disabled={!alertSettings.slackAlertEnabled}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                {/* SMS ALERT */}
                <div style={{ padding: 16, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={alertSettings.smsAlertEnabled}
                        onChange={(e) => setAlertSettings({ ...alertSettings, smsAlertEnabled: e.target.checked })}
                        style={{ width: 16, height: 16, accentColor: '#0284c7' }}
                      />
                      <i className="fa-solid fa-comment-sms" style={{ color: '#16a34a' }}></i>
                      Cảnh báo qua tin nhắn SMS khẩn cấp
                    </label>
                    <button
                      type="button"
                      disabled={testingChannel === 'sms' || !alertSettings.smsAlertEnabled}
                      onClick={() => handleTestAlert('sms')}
                      style={{ padding: '4px 12px', borderRadius: 6, fontSize: 12, background: '#fff', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {testingChannel === 'sms' ? 'Đang gửi...' : 'Test SMS'}
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Số điện thoại Admin nhận SMS (+84...)"
                    value={alertSettings.smsPhoneNumber || ''}
                    onChange={(e) => setAlertSettings({ ...alertSettings, smsPhoneNumber: e.target.value })}
                    disabled={!alertSettings.smsAlertEnabled}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

              </div>

            </div>

            {/* SAVE BUTTON */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="submit"
                disabled={isSavingAlerts}
                style={{
                  padding: '12px 28px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)'
                }}
              >
                {isSavingAlerts ? (
                  <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: 8 }}></i>Đang lưu...</span>
                ) : (
                  <span><i className="fa-solid fa-floppy-disk" style={{ marginRight: 8 }}></i>Lưu Cấu Hình Cảnh Báo</span>
                )}
              </button>
            </div>
          </form>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminSystemMonitorPage;

