import React, { useRef } from 'react';
import './PrintFormStyles.css';
import { readVietnameseCurrency } from './numberToWords';

const PhieuThanhToanPrintModal = ({ isOpen, onClose, invoice }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceCode = invoice.maHD || invoice.maHDBan || invoice.MAHD || invoice.MAHDBAN || invoice.invoiceCode || `PT${Date.now().toString().slice(-8)}`;
  const orderCode = invoice.maDonHang || invoice.maHD || `DH${Date.now().toString().slice(-8)}`;

  const customerName = invoice.hoTenKH || invoice.hoTen || invoice.customerName || invoice.khachHang?.hoTen || 'Khách hàng';
  const customerPhone = invoice.sdtKH || invoice.soDienThoai || invoice.customerPhone || invoice.khachHang?.soDienThoai || 'Chưa cập nhật';
  const customerEmail = invoice.emailKH || invoice.email || invoice.khachHang?.email || '';
  const customerAddress = invoice.diaChi || invoice.diaChiGiao || invoice.dia_chi || 'Mua tại quầy';
  const branchName = invoice.cuaHang?.tenCuaHang || invoice.tenCuaHang || 'CH001 - Givral Bakery Center';

  const now = new Date(invoice.ngayLap || invoice.ngayTao || invoice.createdAt || Date.now());
  const dateStr = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const paymentMethodStr = String(invoice.phuongThucThanhToan || invoice.paymentMethod || 'Chuyển khoản / VietQR');
  const isPaid = !(String(invoice.trangThai || '').toLowerCase().includes('chờ') || String(invoice.trangThaiThanhToan || '').toLowerCase().includes('chưa'));

  const items = invoice.chiTiets || invoice.chiTietDonHangs || invoice.items || [];
  const lineSum = items.reduce((sum, it) => {
    const sl = Number(it.soLuong || it.SOLUONG || it.quantity || 1);
    const gia = Number(it.donGia || it.DONGIA || it.price || 0);
    return sum + (Number(it.thanhTien) || (sl * gia));
  }, 0);

  const discount = Number(invoice.soTienGiam || invoice.discount || 0);
  const voucherCode = invoice.maVoucher || invoice.voucherCode || '';
  const shippingFee = Number(invoice.phiVanChuyen || invoice.shippingFee || 0);
  const grandTotal = Number(invoice.tongTien || invoice.TONGTIEN || (lineSum + shippingFee - discount));

  const minRows = Math.max(5, items.length);
  const paddedRows = [];
  for (let i = 0; i < minRows; i++) {
    paddedRows.push(items[i] || null);
  }

  const transactionCode = invoice.maGiaoDich || invoice.maGD || `${invoiceCode}QR`;
  const bankName = invoice.nganHang || 'Vietcombank / VietQR Pro';

  return (
    <div className="print-modal-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="print-modal-wrapper">
        <div className="print-modal-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-file-invoice-dollar" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Biểu mẫu Phiếu Thanh Toán — {invoiceCode}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-print-action" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> In Phiếu / Xuất PDF
            </button>
            <button type="button" className="btn-print-close" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>

        <div style={{ padding: '24px', backgroundColor: '#f1f5f9', overflowX: 'auto' }}>
          <div id="printable-form-area" className="printable-form-area" ref={printAreaRef}>
            {/* Header: Brand & Title */}
            <div className="form-header-container">
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', maxWidth: '54%' }}>
                <img
                  src="/assets/IMG/Logo.png"
                  alt="Givral Bakery Logo"
                  style={{ width: '80px', height: '80px', objectFit: 'contain', flexShrink: 0 }}
                  onError={(e) => { e.target.src = '/assets/IMG/Logo.jpg'; }}
                />
                <div>
                  <h1 className="brand-title">GIVRAL BAKERY</h1>
                  <div className="brand-subtitle">Chuyên bánh ngọt & bánh kem</div>
                  <div className="brand-meta-item">
                    <span>📍</span>
                    <span>Địa chỉ: 140 Lê Trọng Tấn, phường Tây Thạnh, quận Tân Phú, TP. HCM</span>
                  </div>
                  <div className="brand-meta-item">
                    <span>📞</span>
                    <span>Hotline / Zalo: 090x.xxx.xxx – 098x.xxx.xxx</span>
                  </div>
                  <div className="brand-meta-item">
                    <span>🌐</span>
                    <span>Website / Fanpage: fb.com/tenshop.official</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 className="form-doc-title">PHIẾU THANH TOÁN</h2>
                <div className="form-doc-subtitle">Thank you!</div>
                <div style={{ marginTop: '6px' }}>
                  <div className="form-doc-code">
                    <span style={{ color: '#1e293b', fontWeight: 600 }}>Số phiếu : </span>
                    {invoiceCode}
                  </div>
                  <div className="form-doc-date">
                    <span>Ngày lập : <b>{dateStr}</b> &nbsp; {timeStr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Details Grid: Customer & Order */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '10px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-10px -12px 10px -12px', borderRadius: '5px 5px 0 0' }}>
                  <span>👤 THÔNG TIN KHÁCH HÀNG</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Họ và tên khách hàng :</span>
                  <span className="dotted-field-line">{customerName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số điện thoại :</span>
                  <span className="dotted-field-line">{customerPhone}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Email :</span>
                  <span className="dotted-field-line">{customerEmail || '—'}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ giao hàng :</span>
                  <span className="dotted-field-line">{customerAddress}</span>
                </div>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-10px -12px 10px -12px', borderRadius: '5px 5px 0 0' }}>
                  <span>🛒 THÔNG TIN ĐƠN HÀNG</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Mã đơn hàng :</span>
                  <span className="dotted-field-line" style={{ fontWeight: 700 }}>{orderCode}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Ngày đặt hàng :</span>
                  <span className="dotted-field-line">{dateStr} {timeStr}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Chi nhánh xử lý :</span>
                  <span className="dotted-field-line">{branchName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Phương thức thanh toán :</span>
                  <span className="dotted-field-line">{paymentMethodStr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#334155', fontSize: '11.5px' }}>Trạng thái thanh toán :</span>
                  <span style={{ backgroundColor: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '11px' }}>
                    {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </span>
                </div>
              </div>
            </div>

            {/* Table: Products */}
            <div className="form-section-banner">
              <span>🍰 CHI TIẾT ĐƠN HÀNG</span>
            </div>
            <table className="form-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>STT</th>
                  <th>TÊN SẢN PHẨM</th>
                  <th style={{ width: '120px' }}>SIZE / LOẠI</th>
                  <th style={{ width: '50px' }}>SL</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>ĐƠN GIÁ (VNĐ)</th>
                  <th style={{ width: '130px', textAlign: 'right' }}>THÀNH TIỀN (VNĐ)</th>
                </tr>
              </thead>
              <tbody>
                {paddedRows.map((it, idx) => {
                  if (!it) {
                    return (
                      <tr key={`empty-${idx}`} style={{ height: '24px' }}>
                        <td style={{ textAlign: 'center', color: '#cbd5e1' }}>{idx + 1}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }
                  const name = it.tenSanPham || it.name || it.TENSP || 'Sản phẩm bánh ngọt';
                  const size = it.size || it.kichThuoc || it.dvt || 'Cái';
                  const sl = Number(it.soLuong || it.SOLUONG || 1);
                  const gia = Number(it.donGia || it.DONGIA || 0);
                  const tt = Number(it.thanhTien || (sl * gia));

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'center' }}>{size}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{sl}</td>
                      <td style={{ textAlign: 'right' }}>{gia.toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{tt.toLocaleString('vi-VN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Bottom 2 Columns: Payment detail & Totals */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div>
                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb', marginBottom: '8px' }}>
                  <div className="form-section-banner" style={{ margin: '-8px -10px 8px -10px', borderRadius: '5px 5px 0 0', fontSize: '11.5px' }}>
                    <span>💳 THÔNG TIN THANH TOÁN</span>
                  </div>
                  <div className="dotted-field-row">
                    <span className="dotted-field-label">Phương thức thanh toán :</span>
                    <span className="dotted-field-line">{paymentMethodStr}</span>
                  </div>
                  <div className="dotted-field-row">
                    <span className="dotted-field-label">Mã giao dịch / Mã QR :</span>
                    <span className="dotted-field-line">{transactionCode}</span>
                  </div>
                  <div className="dotted-field-row">
                    <span className="dotted-field-label">Ngân hàng / Ví điện tử :</span>
                    <span className="dotted-field-line">{bankName}</span>
                  </div>
                  <div className="dotted-field-row">
                    <span className="dotted-field-label">Thời gian thanh toán :</span>
                    <span className="dotted-field-line">{dateStr} {timeStr}</span>
                  </div>
                  <div className="dotted-field-row">
                    <span className="dotted-field-label">Số tiền thanh toán :</span>
                    <span className="dotted-field-line" style={{ fontWeight: 700, color: '#dc2626' }}>{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#334155', fontSize: '11.5px' }}>Trạng thái :</span>
                    <span style={{ backgroundColor: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#166534' : '#991b1b', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, fontSize: '11px' }}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>

                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '6px 10px', backgroundColor: '#fffdfb' }}>
                  <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '2px' }}>✏️ GHI CHÚ</div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                </div>
              </div>

              <div>
                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#faf4ef', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Tổng tiền hàng :</span>
                    <span style={{ fontWeight: 600 }}>{lineSum.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Giảm giá / Voucher {voucherCode ? `(${voucherCode})` : ''} :</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>-{discount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Phí vận chuyển (Giao tiêu chuẩn) :</span>
                    <span style={{ fontWeight: 600 }}>+{shippingFee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #4e1a0f', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#4e1a0f', textTransform: 'uppercase' }}>TỔNG THANH TOÁN:</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#dc2626' }}>{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                    Số tiền bằng chữ: <b>{readVietnameseCurrency(grandTotal)}</b>
                  </div>
                </div>

                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '6px 10px', backgroundColor: '#fffdfb' }}>
                  <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#b45309', marginBottom: '3px' }}>🛡️ CHÍNH SÁCH & THÔNG TIN</div>
                  <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '10px', color: '#475569', lineHeight: 1.4 }}>
                    <li>Quý khách vui lòng kiểm tra đơn hàng trước khi thanh toán.</li>
                    <li>Hỗ trợ đổi/trả trong vòng 07 ngày nếu sản phẩm lỗi do nhà sản xuất.</li>
                    <li>Mọi thắc mắc vui lòng liên hệ Hotline: <b style={{ color: '#dc2626' }}>090x.xxx.xxx</b>.</li>
                  </ul>
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#78350f', textAlign: 'center', marginTop: '4px', fontWeight: 600 }}>
                    Cảm ơn quý khách đã tin tưởng và ủng hộ Givral Bakery! ❤️
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center', marginTop: '8px' }}>
              <div>
                <div className="sig-title">KHÁCH HÀNG</div>
                <div className="sig-note">(Ký & ghi rõ họ tên nếu thanh toán khi nhận hàng)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: ........ / ........ / 20........</div>
              </div>
              <div>
                <div className="sig-title">NGƯỜI LẬP PHIẾU / SHOP</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: ........ / ........ / 20........</div>
              </div>
            </div>

            {/* Bottom Cursive Footer */}
            <div className="form-footer-cursive" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              <span>🤎</span>
              <span>Phiếu thanh toán chỉ có giá trị xác nhận giao dịch – Không thay thế hóa đơn tài chính.</span>
              <span>🤎</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhieuThanhToanPrintModal;
