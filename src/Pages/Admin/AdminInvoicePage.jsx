import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getInvoices, getInvoiceDetails, updateInvoiceStatus } from '../../services/invoiceService';
import { useToast } from '../../components/Toast/Toast';
import { formatImageUrl } from '../../utils/imageUtils';

const AdminInvoicePage = () => {
    const toast = useToast();
const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [invoiceDetails, setInvoiceDetails] = useState([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [editingStatus, setEditingStatus] = useState('');
  const [previewReceiptModalUrl, setPreviewReceiptModalUrl] = useState(null);

  const printRef = useRef(null);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await getInvoices({
        search: searchQuery,
        trangThai: searchStatus,
        size: 100 // Lấy nhiều hơn tạm thời, nếu muốn phân trang thì thêm state page
      });
      setInvoices(data.content || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchStatus]);

  const openDetailModal = async (invoice) => {
    setViewingInvoice(invoice);
    setEditingStatus(invoice.trangThai || 'Chờ xử lý');
    setIsDetailModalOpen(true);
    setIsDetailsLoading(true);
    try {
      const details = await getInvoiceDetails(invoice.maHD);
      setInvoiceDetails(details);
    } catch (error) {
      console.error("Error fetching invoice details:", error);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const closeModal = () => {
    setIsDetailModalOpen(false);
    setViewingInvoice(null);
    setInvoiceDetails([]);
  };

  const handleUpdateStatus = async () => {
    try {
      await updateInvoiceStatus(viewingInvoice.maHD, {
        ...viewingInvoice,
        trangThai: editingStatus
      });
      toast.success('Cập nhật trạng thái thành công!');
      fetchInvoices();
      closeModal();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error('Có lỗi xảy ra khi cập nhật!');
    }
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=900,height=650');
    // Đặt title của cửa sổ in thành mã hóa đơn, khi người dùng "Lưu dưới dạng PDF" thì trình duyệt sẽ lấy title làm tên file mặc định
    windowPrint.document.write('<html><head><title>' + (viewingInvoice?.maHD || 'Hoa_Don') + '</title>');
    windowPrint.document.write('<style>');
    windowPrint.document.write(`
      body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
      .invoice-header { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 20px; border-bottom: 2px solid #5c3d2e; padding-bottom: 15px; }
      .invoice-header img { width: 70px; height: 70px; object-fit: contain; border-radius: 6px; }
      .invoice-header-title { text-align: left; }
      .invoice-header-title h2 { margin: 0; color: #5c3d2e; font-size: 22px; font-weight: bold; }
      .invoice-header-title p { margin: 4px 0 0; font-size: 13px; color: #666; }
      .invoice-info { margin-bottom: 20px; display: flex; justify-content: space-between; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
      th { background-color: #f2f2f2; }
      .total { text-align: right; font-size: 1.2rem; font-weight: bold; }
      @media print {
        body { padding: 0; }
        img { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `);
    windowPrint.document.write('</style></head><body>');
    windowPrint.document.write(printContent.innerHTML);
    windowPrint.document.write('</body></html>');
    windowPrint.document.close();
    windowPrint.focus();
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Đã hoàn thành') return 'admin-badge-success';
    if (status === 'Chờ xử lý') return 'admin-badge-warning';
    if (status === 'Đã hủy') return 'admin-badge-danger';
    if (status === 'Đang giao') return 'admin-badge-info';
    return 'admin-badge-secondary';
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Hóa đơn bán hàng</h1>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh sách hóa đơn</h2>
        
        <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
          <div className="admin-flex-gap">
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Tìm mã HĐ, tên KH, số ĐT..." 
              style={{ width: '250px', marginBottom: 0 }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="admin-input" 
              style={{ width: '200px', marginBottom: 0 }}
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Chờ xử lý">Chờ xử lý</option>
              <option value="Đang giao">Đang giao</option>
              <option value="Đã hoàn thành">Đã hoàn thành</option>
              <option value="Đã hủy">Đã hủy</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã HĐ</th>
                <th>Cửa hàng</th>
                <th>Khách Hàng</th>
                <th>Nhân Viên Lập</th>
                <th>Ngày lập</th>
                <th>Tổng tiền</th>
                <th>Vận chuyển</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Đang tải...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy hóa đơn</td></tr>
              ) : invoices.map(invoice => (
                <tr key={invoice.maHD}>
                  <td><strong>{invoice.maHD}</strong></td>
                  <td>{invoice.tenCuaHang || 'Không rõ'}</td>
                  <td>
                    <div><strong>{invoice.tenKH || invoice.hoTenKH || invoice.HOTEN_KH || invoice.maKH || 'Khách lẻ'}</strong></div>
                    {invoice.sdtKH && <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {invoice.sdtKH}</div>}
                  </td>
                  <td>
                    <span style={{ fontWeight: '500', color: '#2563eb' }}>
                      {invoice.nhanVienLap || invoice.tenNhanVien || 'Quản trị viên'}
                    </span>
                  </td>
                  <td>{invoice.ngayLap}</td>
                  <td style={{ fontWeight: 600, color: 'var(--admin-primary)' }}>
                    {Number(invoice.tongTien).toLocaleString('vi-VN')} ₫
                  </td>
                  <td>{invoice.donViVanChuyen || '-'}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(invoice.trangThai || 'Chờ xử lý')}`}>
                      {invoice.trangThai || 'Chờ xử lý'}
                    </span>
                  </td>
                  <td>
                    <button className="admin-btn admin-btn-info" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openDetailModal(invoice)}>Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết & Cập nhật trạng thái */}
      {isDetailModalOpen && viewingInvoice && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '800px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Chi tiết Hóa Đơn #{viewingInvoice.maHD}</h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            {/* Nội dung để In */}
            <div ref={printRef} style={{ marginBottom: '1.5rem' }}>
              <div className="invoice-header" style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <img
                  src="/assets/IMG/Logo.jpg"
                  alt="Givral Bakery"
                  style={{ width: '60px', height: '60px', maxWidth: '60px', maxHeight: '60px', objectFit: 'contain', borderRadius: '8px' }}
                />
                <div className="invoice-header-title">
                  <h2>Givral Bakery - Hóa Đơn Bán Hàng</h2>
                  <p>Mã hóa đơn: <strong>{viewingInvoice.maHD}</strong> | Ngày lập: {viewingInvoice.ngayLap}</p>
                </div>
              </div>
              
              <div className="invoice-info">
                <div>
                  <p><strong>Khách hàng:</strong> <strong>{viewingInvoice.tenKH || viewingInvoice.hoTenKH || viewingInvoice.HOTEN_KH || 'Khách vãng lai'}</strong></p>
                  {viewingInvoice.sdtKH && <p><strong>Số điện thoại:</strong> {viewingInvoice.sdtKH}</p>}
                  {viewingInvoice.diaChiGiao && <p><strong>Địa chỉ giao:</strong> {viewingInvoice.diaChiGiao}</p>}
                  <p><strong>Ghi chú:</strong> {viewingInvoice.ghiChu || 'Không có'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p><strong>Nhân viên lập đơn:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{viewingInvoice.nhanVienLap || viewingInvoice.tenNhanVien || 'Quản trị viên'}</span></p>
                  <p><strong>Đơn vị vận chuyển:</strong> {viewingInvoice.donViVanChuyen || 'Mua tại cửa hàng'}</p>
                  <p><strong>Mã vận đơn:</strong> {viewingInvoice.maVanDon || 'Không có'}</p>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Chi tiết sản phẩm</h3>
              {isDetailsLoading ? (
                <p>Đang tải chi tiết...</p>
              ) : (
                <table className="admin-table" style={{ width: '100%', marginBottom: '1rem' }}>
                  <thead>
                    <tr>
                      <th>Mã SP</th>
                      <th>Tên sản phẩm</th>
                      <th style={{ textAlign: 'center' }}>Số lượng</th>
                      <th style={{ textAlign: 'right' }}>Đơn giá</th>
                      <th style={{ textAlign: 'right' }}>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceDetails.length === 0 ? (
                      <tr><td colSpan="5" style={{ textAlign: 'center' }}>Không có chi tiết sản phẩm</td></tr>
                    ) : invoiceDetails.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.maSP}</td>
                        <td>{item.tenSP}</td>
                        <td style={{ textAlign: 'center' }}>{item.soLuong}</td>
                        <td style={{ textAlign: 'right' }}>{Number(item.donGia).toLocaleString('vi-VN')} ₫</td>
                        <td style={{ textAlign: 'right' }}>{Number(item.thanhTien).toLocaleString('vi-VN')} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              
              <div className="total" style={{ borderTop: '2px solid #eee', paddingTop: '1rem' }}>
                <p>Tổng tiền thanh toán: <span style={{ color: 'red', fontSize: '1.5rem' }}>{Number(viewingInvoice.tongTien).toLocaleString('vi-VN')} ₫</span></p>
              </div>
            </div>

            {/* Payment Proof Receipt Image if available */}
            {viewingInvoice.minhChungThanhToan && (
              <div style={{ marginTop: '1rem', marginBottom: '1.2rem', padding: '12px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#065f46' }}>📷 MINH CHỨNG CHUYỂN KHOẢN KHÁCH HÀNG</h4>
                <div
                  onClick={() => setPreviewReceiptModalUrl(formatImageUrl(viewingInvoice.minhChungThanhToan))}
                  style={{ cursor: 'pointer', display: 'inline-block' }}
                  title="Nhấp để xem toàn màn hình"
                >
                  <img
                    src={formatImageUrl(viewingInvoice.minhChungThanhToan)}
                    alt="Minh chứng chuyển khoản"
                    style={{ maxWidth: '100%', maxHeight: '260px', minHeight: '100px', objectFit: 'contain', borderRadius: '8px', border: '2px solid #10b981', backgroundColor: '#fff', display: 'block' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: '#047857', marginTop: '4px', display: 'block', fontWeight: '500' }}>🔍 Nhấp vào ảnh để xem toàn màn hình</span>
              </div>
            )}

            {/* Cập nhật trạng thái - Ẩn đi nếu đã hoàn thành hoặc đã hủy */}
            {!(
              String(viewingInvoice.trangThai || '').toLowerCase().includes('hoàn thành') ||
              String(viewingInvoice.trangThai || '').toLowerCase().includes('đã giao') ||
              String(viewingInvoice.trangThai || '').toLowerCase().includes('hủy') ||
              String(viewingInvoice.trangThai || '').toLowerCase().includes('cancel') ||
              viewingInvoice.trangThai === 'DA_HUY' ||
              viewingInvoice.trangThai === 'HOAN_THANH'
            ) ? (
              <div style={{ backgroundColor: 'var(--admin-tertiary)', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Cập nhật trạng thái</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <select 
                    className="admin-input" 
                    style={{ marginBottom: 0, flex: 1 }}
                    value={editingStatus}
                    onChange={(e) => setEditingStatus(e.target.value)}
                  >
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Đang giao">Đang giao</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                    <option value="Đã hủy">Đã hủy</option>
                  </select>
                  <button className="admin-btn admin-btn-primary" onClick={handleUpdateStatus}>Cập nhật</button>
                </div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginTop: '1.5rem', textAlign: 'center', color: '#6c757d', fontStyle: 'italic', border: '1px dashed #cbd5e1' }}>
                🔒 Đơn hàng ở trạng thái <b>{viewingInvoice.trangThai}</b> (Đã chốt, không thể thay đổi trạng thái).
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="admin-btn admin-btn-success" onClick={handlePrint}>🖨 In Hóa Đơn</button>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal for Receipt Image */}
      {previewReceiptModalUrl && (
        <div
          onClick={() => setPreviewReceiptModalUrl(null)}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
            <img
              src={previewReceiptModalUrl}
              alt="Minh chứng chuyển khoản phóng to"
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                backgroundColor: '#fff'
              }}
            />
            <button
              onClick={() => setPreviewReceiptModalUrl(null)}
              style={{
                position: 'absolute',
                top: '-15px',
                right: '-15px',
                backgroundColor: '#ef4444',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Đóng"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalStyle = {
  backgroundColor: '#fff',
  padding: '2rem',
  borderRadius: '0.5rem',
  width: '100%',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '1.5rem',
  cursor: 'pointer'
};

export default AdminInvoicePage;
