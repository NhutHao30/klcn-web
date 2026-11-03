import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../Layout/AdminLayout';
import { getRevenueReport, getTopProducts, getUsersForReport, getChamCong, postChamCong } from '../../services/reportService';
import '../../css/admin.css';
import { useToast } from '../../components/Toast/Toast';
import axiosClient from '../../services/axiosClient';

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

  // === TH?NG K� H?Y �ON ===
  const [cancelStats, setCancelStats] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelFilter, setCancelFilter] = useState({
    tuNgay: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    denNgay: new Date().toISOString().split('T')[0],
    cuaHangId: '',
    lyDoHuy: '',
    nhomThoiGian: 'ngay',
  });
  const [stores, setStores] = useState([]);
  const [detailModalOrder, setDetailModalOrder] = useState(null);
  const [detailModalLoading, setDetailModalLoading] = useState(false);

  const handleViewOrderDetail = async (maDonHang) => {
    setDetailModalLoading(true);
    try {
      const res = await axiosClient.get(`/hoa-don/${maDonHang}`);
      const detailsRes = await axiosClient.get(`/hoa-don/${maDonHang}/chi-tiet`);
      setDetailModalOrder({
        ...(res.data || {}),
        items: detailsRes.data || []
      });
    } catch (e) {
      toast.error('Không thể tải chi tiết đơn hàng');
    } finally {
      setDetailModalLoading(false);
    }
  };

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
      
      const results = await Promise.allSettled([
        getRevenueReport(reportType),
        getBiDashboardData(),
        getTopProducts(),
        getUsersForReport(),
        getChamCong(currentMonth, currentYear),
        getThongKeLoiNhuan(),
        getThongKeHaoHut()
      ]);
      
      if (results[0].status === 'fulfilled') setRevenueData(results[0].value || []);
      if (results[1].status === 'fulfilled') setBiData(results[1].value || null);
      if (results[2].status === 'fulfilled') setTopProducts(results[2].value || []);
      if (results[3].status === 'fulfilled') setUsersData(results[3].value || []);
      if (results[4].status === 'fulfilled') setChamCongData(results[4].value || []);
      if (results[5].status === 'fulfilled' && results[5].value?.status) setProfitData(results[5].value.data);
      if (results[6].status === 'fulfilled' && results[6].value?.status) setLossData(results[6].value.data);
    } catch (error) {
      console.error("Lỗi khi tải báo cáo:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCancelStats = useCallback(async () => {
    setCancelLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('tuNgay', cancelFilter.tuNgay);
      params.append('denNgay', cancelFilter.denNgay);
      if (cancelFilter.cuaHangId) params.append('cuaHangId', cancelFilter.cuaHangId);
      if (cancelFilter.lyDoHuy) params.append('lyDoHuy', cancelFilter.lyDoHuy);
      params.append('nhomThoiGian', cancelFilter.nhomThoiGian);
      const res = await axiosClient.get(`/admin/reports/don-huy?${params}`);
      setCancelStats(res.data);
    } catch (e) {
      console.error('Lỗi tải thống kê hủy:', e);
    } finally {
      setCancelLoading(false);
    }
  }, [cancelFilter]);

  useEffect(() => {
    if (activeTab === 'cancel') {
      fetchCancelStats();
    }
  }, [activeTab, fetchCancelStats]);

  useEffect(() => {
    // Preload stores list for filter
    axiosClient.get('/admin/stores').then(r => {
      setStores(r.data?.data || r.data || []);
    }).catch(() => {});
  }, []);

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
      
      const maxRev = Math.max(...revenueData.map(d => Number(d.total)), 1);
      
      // Render biểu đồ cột bằng HTML thuần
      const chartHTML = `
        <div class="pdf-section chart-block">
          <h2>IV. BIỂU ĐỒ DOANH THU (${reportType === 'month' ? 'THEO THÁNG' : 'THEO NGÀY'})</h2>
          <div class="chart-container">
            ${revenueData.map(item => {
              const heightPercent = maxRev > 0 ? (Number(item.total) / maxRev) * 85 : 0;
              const label = reportType === 'month' ? item.date.split('-')[1] : item.date.split('-')[2];
              const valLabel = Number(item.total) >= 1000000 ? (Number(item.total)/1000000).toFixed(1) + 'M' : (Number(item.total) > 0 ? (Number(item.total)/1000).toFixed(0) + 'K' : '0');
              return `
                <div class="chart-col-wrapper">
                  <div class="chart-val">${valLabel}</div>
                  <div class="chart-bar" style="height: ${heightPercent}%;"></div>
                  <div class="chart-label">${label}</div>
                </div>
              `;
            }).join('')}
          </div>
          <p class="text-center" style="font-size: 10px; color: #666; margin-top: 4px;">Biểu đồ Doanh Thu (${reportType === 'month' ? '12 Tháng gần nhất' : '30 Ngày gần nhất'})</p>
        </div>
      `;

      const summaryHTML = biData && biData.summary ? `
        <div class="pdf-section">
          <h2>I. TỔNG QUAN DOANH THU</h2>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; background: #f8fafc;">
              <div style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Doanh thu hôm nay</div>
              <div style="font-size: 16px; font-weight: bold; color: #0284c7; margin-top: 4px;">${Number(biData.summary.today).toLocaleString('vi-VN')} ₫</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; background: #f8fafc;">
              <div style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Doanh thu tháng này</div>
              <div style="font-size: 16px; font-weight: bold; color: #16a34a; margin-top: 4px;">${Number(biData.summary.this_month).toLocaleString('vi-VN')} ₫</div>
              <div style="font-size: 9px; color: #64748b; margin-top: 2px;">So với tháng trước: ${biData.summary.percent_increase_month >= 0 ? '+' : ''}${Math.abs(biData.summary.percent_increase_month).toFixed(1)}%</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px 10px; border-radius: 4px; background: #f8fafc;">
              <div style="color: #64748b; font-size: 10px; font-weight: bold; text-transform: uppercase;">Doanh thu năm nay</div>
              <div style="font-size: 16px; font-weight: bold; color: #d82d8b; margin-top: 4px;">${Number(biData.summary.this_year).toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>
        </div>
      ` : '';

      const channelHTML = biData && biData.channel_stats ? `
        <div class="pdf-section">
          <h2>II. KÊNH BÁN HÀNG (POS VS ONLINE)</h2>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1; border: 1px solid #bbf7d0; background-color: #f0fdf4; padding: 8px 10px; border-radius: 4px;">
              <div style="color: #166534; font-size: 10px; font-weight: bold;">🏪 BÁN TẠI QUẦY (POS)</div>
              <div style="font-size: 15px; font-weight: bold; color: #15803d; margin-top: 3px;">${Number(biData.channel_stats.pos?.revenue || 0).toLocaleString('vi-VN')} ₫</div>
              <div style="font-size: 10px; color: #166534; margin-top: 2px;">Tổng số: <b>${biData.channel_stats.pos?.count || 0}</b> hóa đơn</div>
            </div>
            <div style="flex: 1; border: 1px solid #bfdbfe; background-color: #eff6ff; padding: 8px 10px; border-radius: 4px;">
              <div style="color: #1e40af; font-size: 10px; font-weight: bold;">🌐 ĐẶT GIAO HÀNG (ONLINE)</div>
              <div style="font-size: 15px; font-weight: bold; color: #1d4ed8; margin-top: 3px;">${Number(biData.channel_stats.online?.revenue || 0).toLocaleString('vi-VN')} ₫</div>
              <div style="font-size: 10px; color: #1e40af; margin-top: 2px;">Tổng số: <b>${biData.channel_stats.online?.count || 0}</b> đơn GHN</div>
            </div>
          </div>
        </div>
      ` : '';

      const profitHTML = `
        <div class="pdf-section">
          <h2>III. LỢI NHUẬN RÒNG & HAO HỤT THỰC TẾ</h2>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="color: #64748b; font-size: 9px; font-weight: bold;">DOANH THU BÁN HÀNG</div>
              <div style="font-size: 14px; font-weight: bold; color: #0284c7; margin-top: 3px;">${Number(profitData?.doanh_thu || 0).toLocaleString('vi-VN')} ₫</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="color: #64748b; font-size: 9px; font-weight: bold;">CHI PHÍ NHẬP (NCC)</div>
              <div style="font-size: 14px; font-weight: bold; color: #b45309; margin-top: 3px;">${Number(profitData?.chi_phi_nhap || 0).toLocaleString('vi-VN')} ₫</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="color: #64748b; font-size: 9px; font-weight: bold;">TỔN THẤT HỦY (HSD)</div>
              <div style="font-size: 14px; font-weight: bold; color: #dc3545; margin-top: 3px;">${Number(profitData?.chi_phi_huy || 0).toLocaleString('vi-VN')} ₫</div>
            </div>
            <div style="flex: 1; border: 1px solid #cbd5e1; padding: 8px; border-radius: 4px;">
              <div style="color: #64748b; font-size: 9px; font-weight: bold;">LỢI NHUẬN RÒNG</div>
              <div style="font-size: 14px; font-weight: bold; color: #16a34a; margin-top: 3px;">${Number(profitData?.loi_nhuan || profitData?.loi_nhuan_rong || (Number(profitData?.doanh_thu || 0) - Number(profitData?.chi_phi_nhap || 0))).toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>
        </div>
      `;

      const storeHTML = biData && Array.isArray(biData.revenue_by_store) && biData.revenue_by_store.length > 0 ? `
        <div class="pdf-section">
          <h2>DOANH THU THEO CHI NHÁNH (THÁNG NÀY)</h2>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 10%;">STT</th>
                <th>Tên Chi Nhánh / Cửa Hàng</th>
                <th class="text-right" style="width: 35%;">Doanh Thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${biData.revenue_by_store.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>🏪 ${item.TENCUAHANG}</td>
                  <td class="text-right" style="font-weight: bold; color: #15803d;">${Number(item.total).toLocaleString('vi-VN')} ₫</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';

      const topLocationsHTML = biData && Array.isArray(biData.top_locations) && biData.top_locations.length > 0 ? `
        <div class="pdf-section">
          <h2>TOP TỈNH / THÀNH PHỐ MUA HÀNG NHIỀU NHẤT</h2>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 10%;">STT</th>
                <th>Tỉnh / Thành phố</th>
                <th class="text-center" style="width: 15%;">Số Đơn</th>
                <th class="text-right" style="width: 30%;">Doanh Thu (VNĐ)</th>
              </tr>
            </thead>
            <tbody>
              ${biData.top_locations.map((loc, idx) => `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td>🏙️ ${loc.diaChiGiaoHang}</td>
                  <td class="text-center">${loc.total_orders}</td>
                  <td class="text-right" style="color: #d82d8b; font-weight: bold;">${Number(loc.total_revenue).toLocaleString('vi-VN')} ₫</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';

      const lossDetailsHTML = lossData && Array.isArray(lossData.hao_hut_theo_san_pham) && lossData.hao_hut_theo_san_pham.length > 0 ? `
        <div class="pdf-section">
          <h2>CHI TIẾT TỔN THẤT & HAO HỤT BÁNH HẾT HẠN</h2>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 10%;">STT</th>
                <th>Tên Sản Phẩm Bánh</th>
                <th class="text-center" style="width: 25%;">Số Lượng Bị Hủy</th>
                <th class="text-right" style="width: 35%;">Giá Trị Tổn Thất</th>
              </tr>
            </thead>
            <tbody>
              ${lossData.hao_hut_theo_san_pham.map((item, idx) => `
                <tr>
                  <td class="text-center">#${idx + 1}</td>
                  <td>${item.san_pham?.TENSP || item.MASP}</td>
                  <td class="text-center" style="color: #dc3545; font-weight: bold;">${item.tong_so_luong_huy} ${item.san_pham?.DVT || 'Cái'}</td>
                  <td class="text-right" style="color: #dc3545; font-weight: bold;">${(Number(item.tong_so_luong_huy) * Number(item.san_pham?.GIABAN || 15000)).toLocaleString('vi-VN')} ₫</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '';

      const revenueTableHTML = `
        <div class="pdf-section">
          <h2>V. BẢNG KÊ CHI TIẾT DOANH THU</h2>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 10%;">STT</th>
                <th>Thời gian</th>
                <th class="text-right" style="width: 35%;">Doanh thu (VNĐ)</th>
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
                <td class="text-right" style="color: #d82d8b; font-size: 13px;">${revenueData.reduce((sum, row) => sum + Number(row.total), 0).toLocaleString('vi-VN')} ₫</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const topProductsHTML = `
        <div class="pdf-section">
          <h2>VI. TOP 5 SẢN PHẨM BÁN CHẠY NHẤT</h2>
          <table>
            <thead>
              <tr>
                <th class="text-center" style="width: 15%;">Hạng Top</th>
                <th>Tên Sản Phẩm Bánh</th>
                <th class="text-center" style="width: 30%;">Số Lượng Đã Bán</th>
              </tr>
            </thead>
            <tbody>
              ${topProducts.map((prod, index) => `
                <tr>
                  <td class="text-center" style="font-weight: bold;">#${index + 1}</td>
                  <td style="font-weight: bold; color: #1e293b;">${prod.TENSP}</td>
                  <td class="text-center" style="font-weight: bold; color: #d82d8b;">${prod.total_sold} bánh</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      content = `
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;"><img src="/assets/IMG/Logo.jpg" style="width:48px;height:48px;object-fit:contain;border-radius:6px;" /><h1 style="margin:0;">BÁO CÁO KẾT QUẢ KINH DOANH & THỐNG KÊ CHI TIẾT</h1></div>
          <p style="font-weight:bold;color:#5c3d2e;">Givral Bakery</p>
          <p>Kỳ báo cáo: ${reportType === 'month' ? '12 Tháng gần nhất' : '30 Ngày gần nhất'} | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
        
        ${summaryHTML}
        ${channelHTML}
        ${profitHTML}
        ${storeHTML}
        ${topLocationsHTML}
        ${lossDetailsHTML}
        ${chartHTML}
        ${revenueTableHTML}
        ${topProductsHTML}
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
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;"><img src="/assets/IMG/Logo.jpg" style="width:48px;height:48px;object-fit:contain;border-radius:6px;" /><h1 style="margin:0;">BÁO CÁO TÌNH HÌNH NHÂN SỰ & QUỸ LƯƠNG</h1></div>
          <p style="font-weight:bold;color:#5c3d2e;">Givral Bakery</p>
          <p>Danh sách chi tiết nhân viên tháng ${currentMonth}/${currentYear}</p>
        </div>
        <div class="pdf-section">
          <table>
            <thead>
              <tr>
                <th class="text-center">STT</th>
                <th>Họ Tên Nhân Viên</th>
                <th>Chức Vụ</th>
                <th class="text-center">Số Ngày Làm</th>
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
                    <td style="font-weight: bold;">${emp.nhanvien.HOTEN}</td>
                    <td>${emp.nhanvien.CHUCVU || 'Nhân viên'}</td>
                    <td class="text-center" style="color: #28a745; font-weight: bold;">${workingDays} ngày</td>
                    <td class="text-center" style="color: #dc3545;">${absentDays} ngày</td>
                    <td class="text-right">${baseSalary.toLocaleString('vi-VN')} ₫</td>
                    <td class="text-right" style="font-weight: bold; color: #d82d8b;">${actualSalary.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total-row">
                <td colspan="6" class="text-right">TỔNG QUỸ LƯƠNG THỰC TẾ CHI TRẢ:</td>
                <td class="text-right" style="color: #d82d8b; font-size: 13px;">${totalSalary.toLocaleString('vi-VN')} ₫</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
    } else if (activeTab === 'customer') {
      title = 'Bao_Cao_Khach_Hang';
      content = `
        <div class="header">
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px;"><img src="/assets/IMG/Logo.jpg" style="width:48px;height:48px;object-fit:contain;border-radius:6px;" /><h1 style="margin:0;">BÁO CÁO DỮ LIỆU KHÁCH HÀNG & THĂNG HẠNG</h1></div>
          <p style="font-weight:bold;color:#5c3d2e;">Givral Bakery</p>
          <p style="color: #d82d8b; font-weight: bold; margin-top: 8px;">Tổng số khách hàng: ${customers.length} | Khách hàng mới trong tháng: ${newCustomersThisMonth}</p>
        </div>
        <div class="pdf-section">
          <table>
            <thead>
              <tr>
                <th class="text-center">STT</th>
                <th>Họ Tên Khách Hàng</th>
                <th>Tên Tài Khoản</th>
                <th>Email</th>
                <th class="text-right">Điểm Tích Lũy</th>
              </tr>
            </thead>
            <tbody>
              ${customers.map((cus, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td style="font-weight: bold;">${cus.khachhang.HOTEN}</td>
                  <td>${cus.USERNAME}</td>
                  <td>${cus.EMAIL || 'N/A'}</td>
                  <td class="text-right" style="font-weight: bold; color: #d82d8b;">${Number(cus.khachhang.DIEMTICHLUY || 0).toLocaleString('vi-VN')} p</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    }

    if (!content) return;

    windowPrint.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 15px; color: #333; line-height: 1.3; font-size: 11px; }
          .header { text-align: center; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 8px; }
          .header h1 { margin: 0; font-size: 18px; text-transform: uppercase; color: #1e293b; }
          .header p { margin: 2px 0 0; color: #64748b; font-size: 11px; }
          h2 { font-size: 13px; margin-top: 14px; margin-bottom: 8px; color: #0f172a; text-transform: uppercase; border-left: none; padding-left: 0; page-break-after: avoid; break-after: avoid; }
          .pdf-section { page-break-inside: avoid; break-inside: avoid; margin-bottom: 12px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 10.5px; page-break-inside: avoid; break-inside: avoid; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 9px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; background-color: #f8fafc; }
          .chart-container { display: flex; align-items: flex-end; height: 160px; gap: 8px; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; margin-top: 10px; width: 100%; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; }
          .chart-col-wrapper { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
          .chart-bar { width: 100%; max-width: 32px; background-color: #d82d8b; border-radius: 3px 3px 0 0; min-height: 2px; }
          .chart-val { font-size: 9px; font-weight: bold; margin-bottom: 3px; color: #475569; }
          .chart-label { font-size: 9px; font-weight: bold; margin-top: 3px; color: #64748b; }
          @media print {
            body { padding: 0; }
            .chart-bar { background-color: #d82d8b !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        ${content}
        <p style="text-align: right; margin-top: 20px; font-style: italic; font-size: 11px; color: #64748b; page-break-inside: avoid; break-inside: avoid;">
          Người xuất báo cáo: Hệ thống Givral Bakery | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}
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
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Báo cáo thống kê</h1>
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
          💰 Doanh thu, Lợi nhuận và Hao hụt
        </button>
        <button className={`admin-btn ${activeTab === 'cancel' ? 'admin-btn-primary' : ''}`} style={{ backgroundColor: activeTab === 'cancel' ? '#7a5230' : '#f8f9fa', color: activeTab === 'cancel' ? '#fff' : '#333', border: '1px solid ' + (activeTab === 'cancel' ? '#7a5230' : '#ddd'), fontWeight: activeTab === 'cancel' ? '700' : 'normal' }} onClick={() => setActiveTab('cancel')}>Thống kê hủy đơn</button>
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

        <Link
          to="/admin/phan-tich-nguoi-dung"
          className="admin-btn"
          style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          📊 Phân tích người dùng & Hành vi
        </Link>

        <Link
          to="/admin/giam-sat-he-thong"
          className="admin-btn"
          style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          🖥️ Giám sát hệ thống & Hiệu năng
        </Link>
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
                    {(() => {
                      const maxRevenue = Math.max(...revenueData.map(d => Number(d.total || 0)), 1);
                      return (
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
                      );
                    })()}
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
                      {Number(profitData?.loi_nhuan || profitData?.loi_nhuan_rong || (Number(profitData?.doanh_thu || 0) - Number(profitData?.chi_phi_nhap || 0))).toLocaleString('vi-VN')} ₫
                    </div>
                    <div style={{ fontSize: '12px', color: '#888' }}>= Doanh Thu - Chi Phí Nhập - Chi Phí Hủy</div>
                  </div>
                </div>

                {/* ═══ THỐNG KÊ KÊNH BÁN HÀNG & TOP ĐỊA BÀN ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  {/* Phân loại Kênh Bán */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ fontSize: '16px' }}>🏬 Kênh Bán Hàng (POS vs Online)</h3>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                      <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontSize: '12px', color: '#166534', fontWeight: 'bold' }}>🏪 BÁN TẠI QUẦY (POS)</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#15803d', marginTop: '6px' }}>
                          {Number(biData?.channel_stats?.pos?.revenue || 0).toLocaleString('vi-VN')} ₫
                        </div>
                        <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
                          <b>{biData?.channel_stats?.pos?.count || 0}</b> hóa đơn
                        </div>
                      </div>

                      <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '15px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '12px', color: '#1e40af', fontWeight: 'bold' }}>🌐 ĐẶT GIAO HÀNG (ONLINE)</div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1d4ed8', marginTop: '6px' }}>
                          {Number(biData?.channel_stats?.online?.revenue || 0).toLocaleString('vi-VN')} ₫
                        </div>
                        <div style={{ fontSize: '12px', color: '#1e40af', marginTop: '4px' }}>
                          <b>{biData?.channel_stats?.online?.count || 0}</b> đơn GHN
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Địa Bàn Mua Hàng theo Tỉnh / Thành Phố */}
                  <div className="admin-card">
                    <h3 className="admin-card-title" style={{ fontSize: '16px' }}>📍 Top Tỉnh / Thành Phố Mua Hàng Nhiều Nhất</h3>
                    <div style={{ marginTop: '15px' }}>
                      {Array.isArray(biData?.top_locations) && biData.top_locations.length > 0 ? (
                        <table className="admin-table" style={{ fontSize: '12px' }}>
                          <thead>
                            <tr>
                              <th>Tỉnh / Thành phố</th>
                              <th style={{ textAlign: 'center' }}>Số đơn</th>
                              <th style={{ textAlign: 'right' }}>Doanh thu</th>
                            </tr>
                          </thead>
                          <tbody>
                            {biData.top_locations.map((loc, idx) => (
                              <tr key={idx}>
                                <td style={{ fontWeight: '600', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={loc.diaChiGiaoHang}>
                                  🏙️ {loc.diaChiGiaoHang}
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{loc.total_orders}</td>
                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#d82d8b' }}>
                                  {Number(loc.total_revenue).toLocaleString('vi-VN')} ₫
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: '12px', color: '#888', fontStyle: 'italic' }}>Chưa có dữ liệu địa bàn giao hàng</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* ═══ DOANH THU THEO CỬA HÀNG (Cho Giám Đốc / Quản Lý Tổng) ═══ */}
                {Array.isArray(biData?.revenue_by_store) && biData.revenue_by_store.length > 0 && (
                  <div className="admin-card" style={{ marginTop: '20px' }}>
                    <h3 className="admin-card-title" style={{ fontSize: '16px' }}>🏬 So Sánh Doanh Thu Giữa Các Cửa Hàng (Quản Lý Tổng)</h3>
                    <div style={{ marginTop: '15px' }}>
                      <table className="admin-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#fff7ed' }}>
                            <th>Tên Cửa Hàng / Chi Nhánh</th>
                            <th style={{ textAlign: 'right' }}>Tổng Doanh Thu Trong Tháng</th>
                          </tr>
                        </thead>
                        <tbody>
                          {biData.revenue_by_store.map((st, idx) => (
                            <tr key={idx}>
                              <td style={{ fontWeight: 'bold', color: '#1e293b' }}>🏪 {st.TENCUAHANG}</td>
                              <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#15803d', fontSize: '14px' }}>
                                {Number(st.total).toLocaleString('vi-VN')} ₫
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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


        
          {activeTab === 'cancel' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '16px' }}>
                Thống kê & phân tích đơn hàng bị hủy
              </h2>

              {/* Bộ lọc */}
              <div className="admin-card" style={{ marginBottom: '20px', padding: '16px 20px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Từ ngày</label>
                    <input
                      type="date"
                      className="admin-input"
                      value={cancelFilter.tuNgay}
                      onChange={e => setCancelFilter(prev => ({ ...prev, tuNgay: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Đến ngày</label>
                    <input
                      type="date"
                      className="admin-input"
                      value={cancelFilter.denNgay}
                      onChange={e => setCancelFilter(prev => ({ ...prev, denNgay: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Chi nhánh</label>
                    <select
                      className="admin-select"
                      value={cancelFilter.cuaHangId}
                      onChange={e => setCancelFilter(prev => ({ ...prev, cuaHangId: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="">Tất cả chi nhánh</option>
                      {stores.map(st => (
                        <option key={st.id || st.MACUAHANG} value={st.id || st.MACUAHANG}>
                          {st.tenCuaHang || st.ten_cuahang || st.TENCUAHANG}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Lý do</label>
                    <select
                      className="admin-select"
                      value={cancelFilter.lyDoHuy}
                      onChange={e => setCancelFilter(prev => ({ ...prev, lyDoHuy: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="">Tất cả lý do</option>
                      <option value="Không còn nhu cầu mua hàng.">Không còn nhu cầu mua hàng.</option>
                      <option value="Muốn thay đổi sản phẩm hoặc số lượng.">Muốn thay đổi sản phẩm hoặc số lượng.</option>
                      <option value="Muốn áp dụng voucher khác.">Muốn áp dụng voucher khác.</option>
                      <option value="Đặt nhầm sản phẩm.">Đặt nhầm sản phẩm.</option>
                      <option value="Muốn đổi địa chỉ nhận hàng.">Muốn đổi địa chỉ nhận hàng.</option>
                      <option value="Thời gian giao hàng quá lâu.">Thời gian giao hàng quá lâu.</option>
                      <option value="Tìm được sản phẩm phù hợp hơn.">Tìm được sản phẩm phù hợp hơn.</option>
                      <option value="Lý do khác">Lý do khác</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '6px' }}>Nhóm thời gian</label>
                    <select
                      className="admin-select"
                      value={cancelFilter.nhomThoiGian}
                      onChange={e => setCancelFilter(prev => ({ ...prev, nhomThoiGian: e.target.value }))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
                    >
                      <option value="ngay">Theo ngày</option>
                      <option value="tuan">Theo tuần</option>
                      <option value="thang">Theo tháng</option>
                    </select>
                  </div>
                </div>
              </div>

              {cancelLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '24px', marginRight: '8px' }}></i>
                  Đang phân tích dữ liệu đơn hủy...
                </div>
              ) : (
                <>
                  {/* 4 Thẻ KPI */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '14px' }}>
                    <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #7a5230' }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Đơn Online đặt trong kỳ</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#333' }}>
                        {cancelStats?.tongDonOnline ?? 0}
                      </div>
                    </div>
                    <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #d9534f' }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Đơn hủy phát sinh trong kỳ</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#d9534f' }}>
                        {cancelStats?.tongDonHuy ?? 0}
                      </div>
                    </div>
                    <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #f0ad4e' }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Tỷ lệ hủy nhóm đơn đặt trong kỳ</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#b7791f' }}>
                        {cancelStats?.tyLeHuy ?? 0}%
                      </div>
                    </div>
                    <div className="admin-card" style={{ padding: '16px 20px', borderLeft: '4px solid #8c5b2f' }}>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>Giá trị đơn hủy trong kỳ</div>
                      <div style={{ fontSize: '28px', fontWeight: '800', color: '#7a5230' }}>
                        {Number(cancelStats?.tongGiaTriHuy ?? 0).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>

                  {/* Chú thích thông số */}
                  <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.6', marginBottom: '22px' }}>
                    <div>Tỷ lệ hủy = {cancelStats?.tongDonHuy ?? 0}/{cancelStats?.tongDonOnline ?? 0} đơn đặt trong kỳ đã hủy thành công tại thời điểm xem. Số hủy phát sinh và các biểu đồ dùng ngày hủy thực tế, có thể bao gồm đơn đặt trước kỳ.</div>
                    <div>Giá trị đơn hủy gồm tổng khách phải trả, không phải doanh thu hay tiền đã hoàn. Thời gian Việt Nam - Cập nhật {cancelStats?.capNhat || new Date().toLocaleString('vi-VN')}.</div>
                  </div>

                  {/* 4 Khối Biểu đồ Progress Bar (2 hàng x 2 cột) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px', marginBottom: '26px' }}>
                    {/* 1. Hủy theo ngày */}
                    <div className="admin-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>Hủy theo ngày</h3>
                      <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {(!cancelStats?.huyTheoNgay || cancelStats.huyTheoNgay.length === 0) ? (
                          <div style={{ color: '#999', fontSize: '13px' }}>Chưa có đơn hủy phát sinh trong khoảng thời gian này</div>
                        ) : (
                          cancelStats.huyTheoNgay.map((item, idx) => {
                            const maxVal = Math.max(...cancelStats.huyTheoNgay.map(h => Number(h.soDon)), 1);
                            const percent = Math.round((Number(item.soDon) / maxVal) * 100);
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#555' }}>
                                  <span>{item.ngay}</span>
                                  <span style={{ fontWeight: '600' }}>{item.soDon} đơn</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#f0ece7', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.max(percent, item.soDon > 0 ? 8 : 0)}%`, backgroundColor: '#9e6b38', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* 2. Lý do hủy */}
                    <div className="admin-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>Lý do hủy</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!cancelStats?.lyDoHuy || cancelStats.lyDoHuy.length === 0) ? (
                          <div style={{ color: '#999', fontSize: '13px' }}>Chưa có dữ liệu lý do hủy</div>
                        ) : (
                          cancelStats.lyDoHuy.map((item, idx) => {
                            const maxVal = Math.max(...cancelStats.lyDoHuy.map(l => Number(l.soDon)), 1);
                            const percent = Math.round((Number(item.soDon) / maxVal) * 100);
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#444' }}>
                                  <span>{item.lyDo}</span>
                                  <span style={{ fontWeight: '600', color: '#7a5230' }}>{item.soDon} đơn</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#f0ece7', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.max(percent, 8)}%`, backgroundColor: '#9e6b38', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* 3. Sản phẩm trong đơn hủy (tối đa 10) */}
                    <div className="admin-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>Sản phẩm trong đơn hủy (tối đa 10)</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!cancelStats?.sanPhamTrongDonHuy || cancelStats.sanPhamTrongDonHuy.length === 0) ? (
                          <div style={{ color: '#999', fontSize: '13px' }}>Chưa có dữ liệu sản phẩm trong đơn hủy</div>
                        ) : (
                          cancelStats.sanPhamTrongDonHuy.map((item, idx) => {
                            const maxVal = Math.max(...cancelStats.sanPhamTrongDonHuy.map(p => Number(p.soDon)), 1);
                            const percent = Math.round((Number(item.soDon) / maxVal) * 100);
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#333' }}>
                                  <span style={{ fontWeight: '600' }}>{item.tenSP}</span>
                                  <span style={{ fontSize: '12px', color: '#666' }}>{item.soDon} đơn - {item.soLuong} sản phẩm</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#f0ece7', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.max(percent, 8)}%`, backgroundColor: '#9e6b38', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* 4. Nguồn yêu cầu hủy */}
                    <div className="admin-card" style={{ padding: '20px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#333', marginBottom: '14px' }}>Nguồn yêu cầu hủy</h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(!cancelStats?.nguonYeuCauHuy || cancelStats.nguonYeuCauHuy.length === 0) ? (
                          <div style={{ color: '#999', fontSize: '13px' }}>Chưa có dữ liệu nguồn hủy</div>
                        ) : (
                          cancelStats.nguonYeuCauHuy.map((item, idx) => {
                            const maxVal = Math.max(...cancelStats.nguonYeuCauHuy.map(n => Number(n.soDon)), 1);
                            const percent = Math.round((Number(item.soDon) / maxVal) * 100);
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#444' }}>
                                  <span>{item.nguon}</span>
                                  <span style={{ fontWeight: '600', color: '#7a5230' }}>{item.soDon} đơn</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#f0ece7', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${Math.max(percent, 8)}%`, backgroundColor: '#9e6b38', borderRadius: '4px' }}></div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bảng: Chi tiết đơn hủy phát sinh trong kỳ */}
                  <div className="admin-card" style={{ padding: '20px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '16px' }}>
                      Chi tiết đơn hủy phát sinh trong kỳ
                    </h3>
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr style={{ backgroundColor: '#faf8f5' }}>
                            <th>Mã đơn / thời gian</th>
                            <th>Khách hàng / chi nhánh</th>
                            <th style={{ textAlign: 'right' }}>Giá trị</th>
                            <th>Lý do / ghi chú</th>
                            <th>Người yêu cầu / nguồn</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(!cancelStats?.chiTietDonHuy || cancelStats.chiTietDonHuy.length === 0) ? (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: '#888' }}>
                                Không có đơn hủy nào trong kỳ được chọn.
                              </td>
                            </tr>
                          ) : (
                            cancelStats.chiTietDonHuy.map((row, idx) => (
                              <tr key={idx}>
                                <td>
                                  <div style={{ fontWeight: '700', color: '#222', fontSize: '13px' }}>{row.maDonHang}</div>
                                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Đặt: {row.ngayDat}</div>
                                  <div style={{ fontSize: '11px', color: '#d9534f' }}>Hủy: {row.ngayHuy}</div>
                                  <button
                                    onClick={() => handleViewOrderDetail(row.maDonHang)}
                                    style={{
                                      marginTop: '4px',
                                      padding: '3px 10px',
                                      backgroundColor: '#f8f9fa',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      color: '#7a5230',
                                      cursor: 'pointer',
                                      fontWeight: '600'
                                    }}
                                  >
                                    Xem chi tiết
                                  </button>
                                </td>
                                <td>
                                  <div style={{ fontWeight: '600', color: '#333' }}>{row.tenKH}</div>
                                  <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>{row.cuaHang}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontWeight: '700', color: '#333' }}>
                                  {Number(row.tongTien).toLocaleString('vi-VN')}đ
                                </td>
                                <td>
                                  <div style={{ fontWeight: '600', color: '#444' }}>{row.lyDoHuy || 'Không xác định'}</div>
                                  {row.ghiChuHuy && (
                                    <div style={{ fontSize: '12px', color: '#777', marginTop: '2px' }}>{row.ghiChuHuy}</div>
                                  )}
                                </td>
                                <td>
                                  <div style={{ fontWeight: '600', color: '#333' }}>{row.tenKH}</div>
                                  {row.taiKhoanKH && (
                                    <div style={{ fontSize: '11px', color: '#888' }}>{row.taiKhoanKH}</div>
                                  )}
                                  <div style={{ marginTop: '2px' }}>
                                    <span style={{ fontSize: '11px', padding: '1px 6px', backgroundColor: '#f0ece7', color: '#7a5230', borderRadius: '4px', fontWeight: '600' }}>
                                      {row.nguon}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                    Yêu cầu: {row.ngayHuy}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Modal Xem chi tiết đơn hủy */}
          {detailModalOrder && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '8px',
                maxWidth: '680px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>
                      Chi tiết đơn hàng #{detailModalOrder.maHD || detailModalOrder.maDonHang}
                    </h3>
                    <span style={{ display: 'inline-block', marginTop: '4px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#fce8e6', color: '#c5221f', fontSize: '12px', fontWeight: '700' }}>
                      Đã hủy
                    </span>
                  </div>
                  <button
                    onClick={() => setDetailModalOrder(null)}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#888' }}
                  >
                    &times;
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px', fontSize: '13px' }}>
                  <div style={{ backgroundColor: '#faf8f5', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '8px', color: '#7a5230' }}>Thông tin khách hàng</div>
                    <div>Họ tên: <b>{detailModalOrder.hoTenKH || detailModalOrder.tenKH || 'Khách hàng'}</b></div>
                    <div>Số điện thoại: <b>{detailModalOrder.sdtKH || '—'}</b></div>
                    <div>Ngày đặt: {detailModalOrder.ngayLap || detailModalOrder.createdAt}</div>
                    <div>Chi nhánh: {detailModalOrder.tenCuaHang || 'Dola Bakery'}</div>
                  </div>
                  <div style={{ backgroundColor: '#faf8f5', padding: '12px', borderRadius: '6px' }}>
                    <div style={{ fontWeight: '700', marginBottom: '8px', color: '#7a5230' }}>Giao hàng & Lý do hủy</div>
                    <div>Địa chỉ: {detailModalOrder.diaChiGiao || detailModalOrder.diaChiGiaoHang || 'Nhận tại cửa hàng'}</div>
                    <div>Lý do hủy: <b style={{ color: '#c5221f' }}>{detailModalOrder.lyDoHuy || 'Không xác định'}</b></div>
                    {detailModalOrder.ghiChuHuy && <div>Ghi chú hủy: {detailModalOrder.ghiChuHuy}</div>}
                  </div>
                </div>

                <div style={{ fontSize: '14px', fontWeight: '700', color: '#333', marginBottom: '8px' }}>
                  Sản phẩm trong đơn:
                </div>
                <div style={{ border: '1px solid #eee', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#faf8f5', borderBottom: '1px solid #eee' }}>
                        <th style={{ padding: '8px 10px', textAlign: 'left' }}>Sản phẩm</th>
                        <th style={{ padding: '8px 10px', textAlign: 'center' }}>SL</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailModalOrder.items || []).map((it, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '8px 10px' }}>{it.tenSP || it.tenSanPham || 'Sản phẩm'}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'center' }}>{it.soLuong}</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right' }}>{Number(it.donGia).toLocaleString('vi-VN')} đ</td>
                          <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: '600' }}>{Number(it.thanhTien).toLocaleString('vi-VN')} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ textAlign: 'right', fontSize: '14px', marginBottom: '18px' }}>
                  <div>Tổng tiền đơn hàng: <b style={{ color: '#7a5230', fontSize: '18px' }}>{Number(detailModalOrder.tongTien || detailModalOrder.tongThanhToan || 0).toLocaleString('vi-VN')} đ</b></div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => setDetailModalOrder(null)}
                    style={{ padding: '8px 20px', backgroundColor: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
};

export default AdminReportPage;
