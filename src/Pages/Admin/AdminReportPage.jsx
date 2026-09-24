import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getRevenueReport, getTopProducts, getUsersForReport, getChamCong, postChamCong } from '../../services/reportService';
import '../../css/admin.css';
import { useToast } from '../../components/Toast/Toast';

const AdminReportPage = () => {
    const toast = useToast();
const [activeTab, setActiveTab] = useState('revenue'); // revenue, employee, customer
  const [reportType, setReportType] = useState('month'); // used for revenue
  const [revenueData, setRevenueData] = useState([]);
  const [biData, setBiData] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [chamCongData, setChamCongData] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [lossData, setLossData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentUser, setCurrentUser] = useState(null);

  // Lấy tháng và năm hiện tại
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();
  const currentDateStr = today.toISOString().split('T')[0];

  useEffect(() => {
    import('../../services/authService').then(({ getCurrentUser }) => {
      getCurrentUser().then(user => setCurrentUser(user));
    });
    fetchData();
  }, [reportType]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getRevenueReport, getTopProducts, getUsersForReport, getChamCong, getBiDashboardData } = await import('../../services/reportService');
      const { getThongKeLoiNhuan, getThongKeHaoHut } = await import('../../services/batchService');
      
      const [revenue, bi, topProd, users, attendance, profitRes, lossRes] = await Promise.all([
        getRevenueReport(reportType),
        getBiDashboardData(),
        getTopProducts(),
        getUsersForReport(),
        getChamCong(currentMonth, currentYear),
        getThongKeLoiNhuan(),
        getThongKeHaoHut()
      ]);
      setRevenueData(revenue);
      setBiData(bi);
      setTopProducts(topProd);
      setUsersData(users);
      setChamCongData(attendance);
      if (profitRes && profitRes.status) setProfitData(profitRes.data);
      if (lossRes && lossRes.status) setLossData(lossRes.data);
    } catch (error) {
      console.error("Lỗi khi tải báo cáo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleChamCong = async (username, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      await postChamCong({
        USERNAME: username,
        NGAYCHAMCONG: currentDateStr,
        TRANGTHAI: newStatus
      });
      toast.success('Đã cập nhật chấm công thành công!');
      const newAttendance = await getChamCong(currentMonth, currentYear);
      setChamCongData(newAttendance);
    } catch (error) {
      console.error("Lỗi chấm công:", error);
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi chấm công!';
      toast.error(errorMessage);
    }
  };

  const employees = usersData.filter(u => (u.MAROLE === 1 || u.MAROLE === 2) && u.nhanvien);
  const customers = usersData.filter(u => u.MAROLE === 3 && u.khachhang);

  const chamCongEmployees = employees.filter(emp => {
    if (!currentUser) return false;
    // Quản lý tổng (Role 0)
    if (currentUser.MAROLE === 0 || currentUser.role === 0) {
      // Chỉ chấm công cho Role 1 và Role 2 của cửa hàng trung tâm (MACUAHANG = 1)
      return emp.MAROLE === 1 || (emp.MAROLE === 2 && emp.nhanvien.MACUAHANG === 1);
    }
    // Quản lý chi nhánh (Role 1)
    if (currentUser.MAROLE === 1 || currentUser.role === 1) {
      // Role 1 chỉ thấy những người có trong chamCongData (đã được lọc ở backend) 
      // Hoặc tự hiển thị dựa trên danh sách users (được lọc ở backend rồi, nên Role 1 chỉ lấy được người của họ)
      return true;
    }
    return false;
  });

  const newCustomersThisMonth = customers.filter(c => {
    const createdDate = new Date(c.created_at);
    return createdDate.getMonth() === (currentMonth - 1) && createdDate.getFullYear() === currentYear;
  }).length;

  const exportPDF = () => {
    const windowPrint = window.open('', '', 'width=900,height=650');
    let content = '';
    let title = '';

    if (activeTab === 'revenue') {
      if (revenueData.length === 0) return;
      title = `Bao_Cao_Doanh_Thu_${reportType === 'month' ? 'Thang' : 'Ngay'}`;
      
      const maxRev = Math.max(...revenueData.map(d => Number(d.total)));
      
      // Render biểu đồ cột bằng HTML thuần
      const chartHTML = `
        <div class="chart-container">
          ${revenueData.map(item => {
            const heightPercent = maxRev > 0 ? (Number(item.total) / maxRev) * 85 : 0;
            const label = reportType === 'month' ? item.date.split('-')[1] : item.date.split('-')[2];
            const valLabel = Number(item.total) >= 1000000 ? (Number(item.total)/1000000).toFixed(1) + 'M' : (Number(item.total)/1000).toFixed(0) + 'K';
            return `
              <div class="chart-col-wrapper">
                <div class="chart-val">${valLabel}</div>
                <div class="chart-bar" style="height: ${heightPercent}%;"></div>
                <div class="chart-label">${label}</div>
              </div>
            `;
          }).join('')}
        </div>
        <p class="text-center" style="font-size: 12px; color: #666; margin-top: 5px;">Biểu đồ Doanh Thu (${reportType === 'month' ? 'Tháng' : 'Ngày'})</p>
      `;

      const summaryHTML = biData && biData.summary ? `
        <div style="display: flex; gap: 20px; margin-bottom: 30px;">
          <div style="flex: 1; border: 1px solid #ddd; border-left: 4px solid #17a2b8; padding: 15px; border-radius: 5px;">
            <div style="color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase;">Doanh thu hôm nay</div>
            <div style="font-size: 20px; font-weight: bold; color: #333; margin-top: 10px;">${Number(biData.summary.today).toLocaleString('vi-VN')} ₫</div>
          </div>
          <div style="flex: 1; border: 1px solid #ddd; border-left: 4px solid #28a745; padding: 15px; border-radius: 5px;">
            <div style="color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase;">Doanh thu tháng này</div>
            <div style="font-size: 20px; font-weight: bold; color: #333; margin-top: 10px;">${Number(biData.summary.this_month).toLocaleString('vi-VN')} ₫</div>
            <div style="font-size: 11px; color: #888; margin-top: 5px;">So với tháng trước: ${biData.summary.percent_increase_month >= 0 ? '+' : '-'}${Math.abs(biData.summary.percent_increase_month).toFixed(1)}%</div>
          </div>
          <div style="flex: 1; border: 1px solid #ddd; border-left: 4px solid #d82d8b; padding: 15px; border-radius: 5px;">
            <div style="color: #666; font-size: 12px; font-weight: bold; text-transform: uppercase;">Doanh thu năm nay</div>
            <div style="font-size: 20px; font-weight: bold; color: #333; margin-top: 10px;">${Number(biData.summary.this_year).toLocaleString('vi-VN')} ₫</div>
          </div>
        </div>
      ` : '';

      const storeHTML = biData && biData.revenue_by_store.length > 0 ? `
        <h2>DOANH THU THEO CHI NHÁNH (THÁNG NÀY)</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">STT</th>
              <th>Tên Chi Nhánh</th>
              <th class="text-right">Doanh Thu (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${biData.revenue_by_store.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td >${item.TENCUAHANG}</td>
                <td class="text-right">${Number(item.total).toLocaleString('vi-VN')} ₫</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '';

      content = `
        <div class="header">
          <h1>BÁO CÁO KẾT QUẢ KINH DOANH</h1>
          <p>Dola Bakery</p>
          <p>Thời gian báo cáo: ${reportType === 'month' ? '12 Tháng gần nhất' : '30 Ngày gần nhất'}</p>
        </div>
        
        <h2>I. TỔNG QUAN DOANH THU</h2>
        ${summaryHTML}
        
        ${storeHTML}

        <h2>II. BIỂU ĐỒ DOANH THU</h2>
        ${chartHTML}

        <h2>III. BẢNG KÊ CHI TIẾT DOANH THU</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">STT</th>
              <th>Thời gian</th>
              <th class="text-right">Doanh thu (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            ${revenueData.map((row, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${reportType === 'month' ? 'Tháng ' + row.date.split('-')[1] + '/' + row.date.split('-')[0] : row.date.split('-')[2] + '/' + row.date.split('-')[1] + '/' + row.date.split('-')[0]}</td>
                <td class="text-right">${Number(row.total).toLocaleString('vi-VN')} ₫</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="2" class="text-right">TỔNG CỘNG:</td>
              <td class="text-right">${revenueData.reduce((sum, row) => sum + Number(row.total), 0).toLocaleString('vi-VN')} ₫</td>
            </tr>
          </tbody>
        </table>
        <h2>IV. TOP 5 SẢN PHẨM BÁN CHẠY NHẤT</h2>
        <table>
          <thead>
            <tr>
              <th class="text-center">Top</th>
              <th>Tên Sản Phẩm</th>
              <th class="text-center">Số Lượng Bán</th>
            </tr>
          </thead>
          <tbody>
            ${topProducts.map((prod, index) => `
              <tr>
                <td class="text-center">#${index + 1}</td>
                <td>${prod.TENSP}</td>
                <td class="text-center">${prod.total_sold}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } else if (activeTab === 'employee') {
      title = 'Bao_Cao_Nhan_Vien';
      const totalSalary = employees.reduce((sum, emp) => {
        const workingDays = chamCongData.filter(c => c.USERNAME === emp.USERNAME && c.TRANGTHAI === 1).length;
        const actualSalary = Math.round((Number(emp.nhanvien.LUONG || 0) / 30) * workingDays);
        return sum + actualSalary;
      }, 0);
      content = `
        <div class="header">
          <h1>BÁO CÁO TÌNH HÌNH NHÂN SỰ</h1>
          <p>Dola Bakery</p>
          <p>Danh sách chi tiết nhân viên tháng ${currentMonth}/${currentYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center">STT</th>
              <th>Họ Tên</th>
              <th>Chức Vụ</th>
              <th class="text-center">Số Ngày Làm Việc</th>
              <th class="text-center">Số Ngày Nghỉ</th>
              <th class="text-right">Lương Cơ Bản</th>
              <th class="text-right">Lương Thực Tế</th>
            </tr>
          </thead>
          <tbody>
            ${employees.map((emp, index) => {
              const workingDays = chamCongData.filter(c => c.USERNAME === emp.USERNAME && c.TRANGTHAI === 1).length;
              const absentDays = chamCongData.filter(c => c.USERNAME === emp.USERNAME && c.TRANGTHAI === 0).length;
              const baseSalary = Number(emp.nhanvien.LUONG || 0);
              const actualSalary = Math.round((baseSalary / 30) * workingDays);
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${emp.nhanvien.HOTEN}</td>
                  <td>${emp.nhanvien.CHUCVU || 'Nhân viên'}</td>
                  <td class="text-center">${workingDays} ngày</td>
                  <td class="text-center">${absentDays} ngày</td>
                  <td class="text-right">${baseSalary.toLocaleString('vi-VN')} ₫</td>
                  <td class="text-right" style="font-weight: bold; color: #d82d8b;">${actualSalary.toLocaleString('vi-VN')} ₫</td>
                </tr>
              `;
            }).join('')}
            <tr class="total-row">
              <td colspan="6" class="text-right">TỔNG QUỸ LƯƠNG:</td>
              <td class="text-right" style="color: #d82d8b;">${totalSalary.toLocaleString('vi-VN')} ₫</td>
            </tr>
          </tbody>
        </table>
      `;
    } else if (activeTab === 'customer') {
      title = 'Bao_Cao_Khach_Hang';
      content = `
        <div class="header">
          <h1>BÁO CÁO DỮ LIỆU KHÁCH HÀNG</h1>
          <p>Dola Bakery</p>
          <p style="color: #d82d8b; font-weight: bold; margin-top: 10px;">Số khách hàng mới trong tháng: ${newCustomersThisMonth}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th class="text-center">STT</th>
              <th>Họ Tên</th>
              <th>Username</th>
              <th>Email</th>
              <th class="text-right">Điểm Tích Lũy</th>
            </tr>
          </thead>
          <tbody>
            ${customers.map((cus, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${cus.khachhang.HOTEN}</td>
                <td>${cus.USERNAME}</td>
                <td>${cus.EMAIL || ''}</td>
                <td class="text-right">${Number(cus.khachhang.DIEMTICHLUY || 0).toLocaleString('vi-VN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    if (!content) return;

    windowPrint.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; font-size: 24px; text-transform: uppercase; }
          .header p { margin: 5px 0 0; color: #666; }
          h2 { font-size: 18px; margin-top: 30px; border-left: 4px solid #d82d8b; padding-left: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #f2f2f2; }
          .chart-container { display: flex; align-items: flex-end; height: 250px; gap: 10px; border-bottom: 2px solid #ddd; padding-bottom: 10px; margin-top: 20px; width: 100%; box-sizing: border-box; }
          .chart-col-wrapper { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
          .chart-bar { width: 100%; max-width: 40px; background-color: #d82d8b; border-radius: 4px 4px 0 0; min-height: 2px; }
          .chart-val { font-size: 10px; font-weight: bold; margin-bottom: 5px; color: #555; }
          .chart-label { font-size: 10px; font-weight: bold; margin-top: 5px; color: #666; }
          @media print {
            body { padding: 0; }
            .chart-bar { background-color: #d82d8b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${content}
        <p style="text-align: right; margin-top: 50px; font-style: italic;">
          Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}
        </p>
      </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const maxRevenue = revenueData.length > 0 ? Math.max(...revenueData.map(d => Number(d.total))) : 0;

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Báo cáo & Thống kê</h1>
        <button className="admin-btn admin-btn-success" onClick={exportPDF}>
            📥 Xuất Báo Cáo (PDF)
          </button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`admin-btn ${activeTab === 'revenue' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'revenue' ? '#f8f9fa' : '', color: activeTab !== 'revenue' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Doanh thu, Lợi nhuận & Hao hụt
        </button>
        <button 
          className={`admin-btn ${activeTab === 'employee' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'employee' ? '#f8f9fa' : '', color: activeTab !== 'employee' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('employee')}
        >
          👥 Báo cáo Nhân sự
        </button>
        <button 
          className={`admin-btn ${activeTab === 'customer' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'customer' ? '#f8f9fa' : '', color: activeTab !== 'customer' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('customer')}
        >
          💎 Báo cáo Khách hàng
        </button>
      </div>

      {isLoading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          {activeTab === 'revenue' && (
            <>
              {/* BI DASHBOARD - KPI CARDS */}
              {biData && biData.summary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div className="admin-card" style={{ borderLeft: '4px solid #17a2b8', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Doanh thu hôm nay</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '10px' }}>
                      {Number(biData.summary.today).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                  
                  <div className="admin-card" style={{ borderLeft: '4px solid #28a745', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Doanh thu tháng này</div>
                      <div style={{ 
                        padding: '4px 8px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        backgroundColor: biData.summary.percent_increase_month >= 0 ? '#e8f5e9' : '#ffebee',
                        color: biData.summary.percent_increase_month >= 0 ? '#2e7d32' : '#c62828'
                      }}>
                        {biData.summary.percent_increase_month >= 0 ? '▲' : '▼'} {Math.abs(biData.summary.percent_increase_month)}%
                      </div>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '10px' }}>
                      {Number(biData.summary.this_month).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '16px', color: '#888', marginTop: '5px' }}>
                      So với tháng trước ({Number(biData.summary.last_month).toLocaleString('vi-VN')} ₫)
                    </div>
                  </div>

                  <div className="admin-card" style={{ borderLeft: '4px solid #d82d8b', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>Doanh thu năm nay</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginTop: '10px' }}>
                      {Number(biData.summary.this_year).toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>
              )}

              {/* BI DASHBOARD - CHARTS */}
              {biData && (
                <div style={{ display: 'grid', gridTemplateColumns: biData.revenue_by_store.length > 0 ? '1fr 1fr' : '1fr', gap: '20px', marginBottom: '20px' }}>
                  
                  {/* Revenue by Time (Today) */}
                  <div className="admin-card">
                    <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#444' }}>Phân bổ doanh thu theo khung giờ (Hôm nay)</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px', paddingTop: '20px' }}>
                      {biData.revenue_by_time.map((item, index) => {
                        const maxTimeRev = Math.max(...biData.revenue_by_time.map(d => Number(d.total)), 1);
                        const heightPercent = (Number(item.total) / maxTimeRev) * 90;
                        return (
                          <div key={index} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div 
                              style={{ 
                                width: '100%', 
                                maxWidth: '40px', 
                                height: `${Math.max(heightPercent, 2)}%`, 
                                backgroundColor: '#17a2b8', 
                                borderRadius: '4px 4px 0 0',
                                position: 'relative'
                              }}
                              title={`${item.time_range}: ${Number(item.total).toLocaleString('vi-VN')} ₫`}
                            >
                              <span style={{ position: 'absolute', top: '-20px', width: '100%', textAlign: 'center', fontSize: '10px', color: '#555', fontWeight: 'bold' }}>
                                {Number(item.total) >= 1000000 ? (Number(item.total)/1000000).toFixed(1) + 'M' : (Number(item.total) > 0 ? (Number(item.total)/1000).toFixed(0) + 'K' : '')}
                              </span>
                            </div>
                            <span style={{ marginTop: '10px', fontSize: '11px', color: '#666', fontWeight: 'bold', textAlign: 'center' }}>
                              {item.time_range.split('-')[0].trim()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Revenue by Store */}
                  {biData.revenue_by_store.length > 0 && (
                    <div className="admin-card">
                      <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#444' }}>Doanh thu theo chi nhánh (Tháng này)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '220px', gap: '15px' }}>
                        {biData.revenue_by_store.map((item, index) => {
                          const maxStoreRev = Math.max(...biData.revenue_by_store.map(d => Number(d.total)), 1);
                          const widthPercent = (Number(item.total) / maxStoreRev) * 100;
                          return (
                            <div key={index} style={{ width: '100%' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                                <span>{item.TENCUAHANG}</span>
                                <span>{Number(item.total).toLocaleString('vi-VN')} ₫</span>
                              </div>
                              <div style={{ width: '100%', height: '12px', backgroundColor: '#eee', borderRadius: '6px', overflow: 'hidden' }}>
                                <div style={{ width: `${widthPercent}%`, height: '100%', backgroundColor: '#d82d8b', borderRadius: '6px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="admin-card">
                <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
                  <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Biểu đồ Doanh Thu</h2>
                  <select 
                    className="admin-input" 
                    style={{ width: '200px', marginBottom: 0 }}
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <option value="month">Theo 12 Tháng Gần Nhất</option>
                    <option value="day">Theo 30 Ngày Gần Nhất</option>
                  </select>
                </div>

                {revenueData.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#888' }}>Không có dữ liệu doanh thu</p>
                ) : (
                  <div style={{ padding: '1rem', overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '300px', gap: '15px', borderBottom: '2px solid #ddd', paddingBottom: '10px', minWidth: '900px', paddingTop: '30px' }}>
                      {revenueData.map((item, index) => {
                        const heightPercent = maxRevenue > 0 ? (Number(item.total) / maxRevenue) * 85 : 0;
                        return (
                          <div key={index} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <div 
                              style={{ 
                                width: '100%', 
                                maxWidth: '50px', 
                                height: `${heightPercent}%`, 
                                backgroundColor: 'var(--admin-primary, #d82d8b)', 
                                borderRadius: '4px 4px 0 0',
                                transition: 'height 0.5s ease',
                                position: 'relative',
                                minHeight: '2px'
                              }}
                              title={`${item.date}: ${Number(item.total).toLocaleString('vi-VN')} ₫`}
                            >
                              <span style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '11px', color: '#555', fontWeight: 'bold' }}>
                                {Number(item.total) >= 1000000 ? (Number(item.total)/1000000).toFixed(1) + 'M' : (Number(item.total)/1000).toFixed(0) + 'K'}
                              </span>
                            </div>
                            <span style={{ marginTop: '10px', fontSize: '12px', color: '#666', whiteSpace: 'nowrap', fontWeight: 'bold' }}>
                              {reportType === 'month' 
                                ? `Tháng ${item.date.split('-')[1]}` 
                                : `${item.date.split('-')[2]}/${item.date.split('-')[1]}`}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p style={{ textAlign: 'center', fontSize: '12px', color: '#888', marginTop: '10px' }}>
                      Trục ngang: {reportType === 'month' ? 'Tháng' : 'Ngày'} | Trục dọc: Doanh thu
                    </p>
                  </div>
                )}
              </div>

              <div className="admin-card" style={{ marginTop: '2rem' }}>
                <h2 className="admin-card-title">Top 5 Sản Phẩm Bán Chạy Nhất</h2>
                {topProducts.length === 0 ? (
                  <p>Chưa có dữ liệu bán hàng</p>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '10%' }}>Top</th>
                          <th style={{ width: '60%' }}>Tên Sản Phẩm</th>
                          <th style={{ width: '30%', textAlign: 'center' }}>Số Lượng Đã Bán</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((prod, index) => (
                          <tr key={index}>
                            <td>
                              <span style={{ 
                                backgroundColor: index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : index === 2 ? '#cd7f32' : '#f0f0f0',
                                padding: '4px 10px',
                                borderRadius: '50%',
                                fontWeight: 'bold',
                                color: index < 3 ? '#fff' : '#555'
                              }}>
                                #{index + 1}
                              </span>
                            </td>
                            <td>{prod.TENSP}</td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--admin-primary)' }}>
                              {prod.total_sold}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              {/* ═══ LỢI NHUẬN RÒNG & HAO HỤT (merged) ═══ */}
              <div style={{ marginTop: '2rem', borderTop: '2px solid var(--admin-outline)', paddingTop: '2rem' }}>
                <h2 className="admin-card-title" style={{ marginBottom: '1.25rem' }}>📈 Lợi Nhuận Ròng & Hao Hụt</h2>
                {/* KPI Cards Lợi Nhuận */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                  <div className="admin-card" style={{ borderLeft: '4px solid #17a2b8', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>DOANH THU BÁN HÀNG</div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#17a2b8', marginTop: '8px' }}>
                      {Number(profitData?.doanh_thu || 0).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Từ các hóa đơn đã hoàn thành</div>
                  </div>

                  <div className="admin-card" style={{ borderLeft: '4px solid #ffc107', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>CHI PHÍ NHẬP HÀNG (NCC)</div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#b45309', marginTop: '8px' }}>
                      {Number(profitData?.chi_phi_nhap || 0).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Tổng vốn mua bánh từ NCC</div>
                  </div>

                  <div className="admin-card" style={{ borderLeft: '4px solid #dc3545', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>TỔN THẤT HỦY BÁNH (HSD)</div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#dc3545', marginTop: '8px' }}>
                      {Number(profitData?.chi_phi_huy || 0).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>Thiệt hại từ bánh quá hạn/hư hỏng</div>
                  </div>

                  <div className="admin-card" style={{ borderLeft: '4px solid #28a745', padding: '20px' }}>
                    <div style={{ color: '#666', fontSize: '13px', fontWeight: 'bold' }}>LỢI NHUẬN RÒNG THỰC TẾ</div>
                    <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#28a745', marginTop: '8px' }}>
                      {Number(profitData?.loi_nhuan_rong || 0).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>= Doanh Thu - Chi Phí Nhập - Chi Phí Hủy</div>
                  </div>
                </div>

                {/* Bảng Chi Tiết Hao Hụt Sản Phẩm */}
                <div className="admin-card">
                  <h2 className="admin-card-title">Chi Tiết Tổn Thất & Tỷ Lệ Hao Hụt Theo Sản Phẩm</h2>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>STT</th>
                          <th>Tên Sản Phẩm Bánh</th>
                          <th style={{ textAlign: 'center' }}>Số Lượng Bị Hủy</th>
                          <th style={{ textAlign: 'right' }}>Giá Trị Tổn Thất</th>
                          <th style={{ textAlign: 'center' }}>Đơn Vị</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!lossData?.hao_hut_theo_san_pham || lossData.hao_hut_theo_san_pham.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                              Không ghi nhận sản phẩm nào bị hủy trong kỳ này
                            </td>
                          </tr>
                        ) : (
                          lossData.hao_hut_theo_san_pham.map((item, idx) => (
                            <tr key={idx}>
                              <td style={{ textAlign: 'center' }}><b>#{idx + 1}</b></td>
                              <td style={{ fontWeight: 'bold' }}>{item.san_pham?.TENSP || item.MASP}</td>
                              <td style={{ textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }}>
                                {item.tong_so_luong_huy} cái
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#dc3545' }}>
                                {(Number(item.tong_so_luong_huy) * Number(item.san_pham?.GIABAN || 15000)).toLocaleString('vi-VN')} ₫
                              </td>
                              <td style={{ textAlign: 'center' }}>{item.san_pham?.DVT || 'Cái'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'employee' && (
            <div className="admin-card">
              <h2 className="admin-card-title">Danh sách Nhân sự (Tháng {currentMonth}/{currentYear})</h2>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Họ Tên</th>
                      <th>Chức Vụ</th>
                      <th>Số ngày làm việc</th>
                      <th>Số ngày nghỉ</th>
                      <th>Lương Cơ Bản</th>
                      <th>Lương Thực Tế</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chamCongEmployees.map((emp, index) => {
                      const workingDays = chamCongData.filter(c => c.USERNAME === emp.USERNAME && c.TRANGTHAI === 1).length;
                      const absentDays = chamCongData.filter(c => c.USERNAME === emp.USERNAME && c.TRANGTHAI === 0).length;
                      const baseSalary = Number(emp.nhanvien.LUONG || 0);
                      const actualSalary = Math.round((baseSalary / 30) * workingDays);
                      return (
                        <tr key={index}>
                          <td>{emp.USERNAME}</td>
                          <td>{emp.nhanvien.HOTEN}</td>
                          <td>{emp.nhanvien.CHUCVU || 'Nhân viên'}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>{workingDays} ngày</td>
                          <td style={{ fontWeight: 'bold', color: 'red' }}>{absentDays} ngày</td>
                          <td>{baseSalary.toLocaleString('vi-VN')} ₫</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>{actualSalary.toLocaleString('vi-VN')} ₫</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'customer' && (
            <div className="admin-card">
              <div className="admin-flex-between">
                <h2 className="admin-card-title">Danh sách Khách hàng</h2>
                <div style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '10px 15px', borderRadius: '8px', fontWeight: 'bold' }}>
                  Khách hàng mới tháng này: {newCustomersThisMonth}
                </div>
              </div>
              <div className="admin-table-container" style={{ marginTop: '1.5rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Họ Tên</th>
                      <th>Email</th>
                      <th>Số Điện Thoại</th>
                      <th>Điểm Tích Lũy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cus, index) => (
                      <tr key={index}>
                        <td>{cus.USERNAME}</td>
                        <td>{cus.khachhang.HOTEN}</td>
                        <td>{cus.EMAIL || '-'}</td>
                        <td>{cus.khachhang.SDT || '-'}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--admin-primary)' }}>{cus.khachhang.DIEMTICHLUY || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


        </>
      )}
    </AdminLayout>
  );
};

export default AdminReportPage;
