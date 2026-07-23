import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getRevenueReport, getTopProducts, getUsersForReport, getChamCong, postChamCong } from '../../services/reportService';
import '../../css/admin.css';

const AdminReportPage = () => {
  const [activeTab, setActiveTab] = useState('revenue'); // revenue, employee, customer, chamcong
  const [reportType, setReportType] = useState('month'); // used for revenue
  const [revenueData, setRevenueData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [usersData, setUsersData] = useState([]);
  const [chamCongData, setChamCongData] = useState([]);
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
      const [revenue, topProd, users, attendance] = await Promise.all([
        getRevenueReport(reportType),
        getTopProducts(),
        getUsersForReport(),
        getChamCong(currentMonth, currentYear)
      ]);
      setRevenueData(revenue);
      setTopProducts(topProd);
      setUsersData(users);
      setChamCongData(attendance);
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
      alert('Đã cập nhật chấm công thành công!');
      const newAttendance = await getChamCong(currentMonth, currentYear);
      setChamCongData(newAttendance);
    } catch (error) {
      console.error("Lỗi chấm công:", error);
      const errorMessage = error.response?.data?.error || 'Có lỗi xảy ra khi chấm công!';
      alert(errorMessage);
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

      content = `
        <div class="header">
          <h1>BÁO CÁO KẾT QUẢ KINH DOANH</h1>
          <p>Dola Bakery</p>
          <p>Thời gian báo cáo: ${reportType === 'month' ? '12 Tháng gần nhất' : '30 Ngày gần nhất'}</p>
        </div>
        
        <h2>I. BIỂU ĐỒ DOANH THU</h2>
        ${chartHTML}

        <h2>II. BẢNG KÊ CHI TIẾT</h2>
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
        <h2>III. TOP 5 SẢN PHẨM BÁN CHẠY NHẤT</h2>
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
        {activeTab !== 'chamcong' && (
          <button className="admin-btn admin-btn-success" onClick={exportPDF}>
            📥 Xuất Báo Cáo (PDF)
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`admin-btn ${activeTab === 'revenue' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'revenue' ? '#f8f9fa' : '', color: activeTab !== 'revenue' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Báo cáo Doanh thu
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
        <button 
          className={`admin-btn ${activeTab === 'chamcong' ? 'admin-btn-primary' : ''}`}
          style={{ backgroundColor: activeTab !== 'chamcong' ? '#f8f9fa' : '', color: activeTab !== 'chamcong' ? '#333' : '', border: '1px solid #ddd' }}
          onClick={() => setActiveTab('chamcong')}
        >
          📅 Bảng Chấm Công
        </button>
      </div>

      {isLoading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <>
          {activeTab === 'revenue' && (
            <>
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

          {activeTab === 'chamcong' && (
            <div className="admin-card">
              <div className="admin-flex-between">
                <h2 className="admin-card-title">Chấm Công Ngày Hôm Nay ({today.toLocaleDateString('vi-VN')})</h2>
              </div>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>Click vào nút Trạng Thái để chuyển đổi giữa Có mặt và Vắng mặt</p>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Họ Tên</th>
                      <th>Chức Vụ</th>
                      <th style={{ textAlign: 'center' }}>Trạng Thái Hôm Nay</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chamCongEmployees.map((emp, index) => {
                      const todayAttendance = chamCongData.find(c => c.USERNAME === emp.USERNAME && c.NGAYCHAMCONG === currentDateStr);
                      // Mặc định là 0 nếu chưa chấm công, 1 nếu đã có mặt
                      const currentStatus = todayAttendance ? todayAttendance.TRANGTHAI : 0;
                      
                      return (
                        <tr key={index}>
                          <td>{emp.USERNAME}</td>
                          <td>{emp.nhanvien.HOTEN}</td>
                          <td>{emp.nhanvien.CHUCVU || 'Nhân viên'}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button 
                              onClick={() => handleToggleChamCong(emp.USERNAME, currentStatus)}
                              className={`admin-btn ${currentStatus === 1 ? 'admin-btn-success' : 'admin-btn-danger'}`}
                              style={{ width: '120px' }}
                            >
                              {currentStatus === 1 ? '✅ Có mặt' : '❌ Vắng mặt'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
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
