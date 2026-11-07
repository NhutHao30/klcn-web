import React, { useRef } from 'react';
import './PrintFormStyles.css';
import { readVietnameseCurrency } from './numberToWords';

const BanHangTaiQuayPrintModal = ({ isOpen, onClose, data }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceCode = data.maDonHang || data.invoiceCode || data.maHD || data.maHDBan || `BHQY${Date.now().toString().slice(-8)}`;
  const customerName = data.customerName || data.hoTenKH || data.hoTen || data.khachHang?.hoTen || 'Khách vãng lai';
  const customerPhone = data.customerPhone || data.sdtKH || data.soDienThoai || data.khachHang?.soDienThoai || '';
  const customerAddress = data.customerAddress || data.diaChi || '';
  const isVipCustomer = Boolean(data.isVip || data.khachHang?.diemTichLuy > 0 || (customerName && customerName !== 'Khách vãng lai'));
  const staffName = data.staffName || data.tenNhanVien || data.nguoiLap || 'Nhân viên thu ngân';
  const branchName = data.branchName || data.tenCuaHang || 'Givral Bakery Center';
  const branchAddress = data.branchAddress || data.diaChiChiTiet || '140 Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú, TP. HCM';
  const branchPhone = data.branchPhone || '090x.xxx.xxx - 098x.xxx.xxx';
  const note = data.note || data.ghiChu || '';

  const now = new Date(data.createdAt || data.ngayLap || data.ngayTao || Date.now());
  const dateStr = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const items = data.items || data.chiTiet || data.chiTiets || [];
  const subTotal = items.reduce((sum, it) => sum + (Number(it.soLuong || it.quantity || 1) * Number(it.donGia || it.price || it.giaBan || 0)), 0);
  const discount = Number(data.discount || data.giamGia || data.soTienGiam || 0);
  const otherFee = Number(data.otherFee || data.phiKhac || 0);
  const grandTotal = Number(data.total || data.tongTien || data.tongThanhToan || Math.max(0, subTotal - discount + otherFee));

  const paymentMethod = (data.paymentMethod || data.method || 'CASH').toUpperCase();
  const isCash = paymentMethod.includes('CASH') || paymentMethod.includes('TIEN_MAT');
  const isTransfer = paymentMethod.includes('TRANSFER') || paymentMethod.includes('CHUYEN_KHOAN') || paymentMethod.includes('BANK');
  const isEWallet = paymentMethod.includes('VIETQR') || paymentMethod.includes('MOMO') || paymentMethod.includes('ZALOPAY');

  // Pad to at least 7 rows for standard print form appearance
  const minRows = Math.max(7, items.length);
  const paddedRows = [];
  for (let i = 0; i < minRows; i++) {
    paddedRows.push(items[i] || null);
  }

  return (
    <div className="print-modal-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="print-modal-wrapper">
        {/* Toolbar */}
        <div className="print-modal-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-receipt" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Biểu mẫu Bán Hàng Tại Quầy — {invoiceCode}</span>
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

        {/* Printable Canvas */}
        <div style={{ padding: '24px', backgroundColor: '#f1f5f9', overflowX: 'auto' }}>
          <div id="printable-form-area" className="printable-form-area" ref={printAreaRef}>
            {/* Header: Brand Logo & Title */}
            <div className="form-header-container">
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', maxWidth: '56%' }}>
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
                    <span style={{ color: '#b45309' }}>📍</span>
                    <span>Địa chỉ: {branchAddress}</span>
                  </div>
                  <div className="brand-meta-item">
                    <span style={{ color: '#b45309' }}>📞</span>
                    <span>Hotline / Zalo: {branchPhone}</span>
                  </div>
                  <div className="brand-meta-item">
                    <span style={{ color: '#b45309' }}>🌐</span>
                    <span>Website: givralbakery.vn — fb.com/tenshop.official</span>
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                  <div style={{ width: '2px', height: '32px', backgroundColor: '#4e1a0f' }}></div>
                  <h2 className="form-doc-title">BÁN HÀNG TẠI QUẦY</h2>
                </div>
                <div style={{ textAlign: 'center', color: '#f59e0b', fontSize: '13px', margin: '2px 0 6px 0' }}>🧡</div>
                <div className="form-doc-code">
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>Số phiếu: </span>
                  {invoiceCode}
                </div>
                <div className="form-doc-date">
                  <span>Ngày: <b>{dateStr}</b></span>
                  <span style={{ marginLeft: '12px' }}>Giờ: <b>{timeStr}</b></span>
                </div>
              </div>
            </div>

            {/* Section 1: Customer Information */}
            <div className="form-section-banner">
              <span>👤 1. THÔNG TIN KHÁCH HÀNG</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '10px' }}>
              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Họ và tên:</span>
                  <span className="dotted-field-line">{customerName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số điện thoại:</span>
                  <span className="dotted-field-line">{customerPhone || '...................................................'}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ (nếu có):</span>
                  <span className="dotted-field-line">{customerAddress || '...................................................'}</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', paddingTop: '2px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Khách hàng:</span>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${!isVipCustomer ? 'checked' : ''}`}>{!isVipCustomer ? '✓' : ''}</span>
                    <span>Mua lẻ</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${isVipCustomer ? 'checked' : ''}`}>{isVipCustomer ? '✓' : ''}</span>
                    <span>Khách thân thiết</span>
                  </div>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Ghi chú:</span>
                  <span className="dotted-field-line">{note || '...................................................'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Products Table */}
            <div className="form-section-banner">
              <span>🧺 2. THÔNG TIN SẢN PHẨM</span>
            </div>
            <table className="form-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>STT</th>
                  <th>TÊN SẢN PHẨM</th>
                  <th style={{ width: '100px' }}>LOẠI / SIZE</th>
                  <th style={{ width: '42px' }}>SL</th>
                  <th style={{ width: '105px', textAlign: 'right' }}>ĐƠN GIÁ (VNĐ)</th>
                  <th style={{ width: '115px', textAlign: 'right' }}>THÀNH TIỀN (VNĐ)</th>
                  <th style={{ width: '110px' }}>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {paddedRows.map((it, idx) => {
                  if (!it) {
                    return (
                      <tr key={`empty-${idx}`} style={{ height: '26px' }}>
                        <td style={{ textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }
                  const sl = Number(it.soLuong || it.quantity || 1);
                  const gia = Number(it.donGia || it.price || it.giaBan || 0);
                  const tt = Number(it.thanhTien || (sl * gia));
                  const name = it.tenSanPham || it.name || it.TENSP || 'Sản phẩm bánh';
                  const size = it.size || it.kichThuoc || it.loai || (it.dvt || 'Cái');
                  const itemNote = it.ghiChu || it.note || '';

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'center' }}>{size}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{sl}</td>
                      <td style={{ textAlign: 'right' }}>{gia.toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{tt.toLocaleString('vi-VN')}</td>
                      <td style={{ fontSize: '11px', color: '#64748b' }}>{itemNote}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="dotted-field-row" style={{ marginTop: '2px', marginBottom: '10px' }}>
              <span className="dotted-field-label">Ghi chú thêm:</span>
              <span className="dotted-field-line">{note || '........................................................................................................................'}</span>
            </div>

            {/* Lower Section: 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '16px' }}>
              {/* Left Column: Payment method & Notes */}
              <div>
                <div className="form-section-banner" style={{ fontSize: '12px' }}>
                  <span>💳 3. PHƯƠNG THỨC THANH TOÁN</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '11.5px' }}>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${isCash ? 'checked' : ''}`}>{isCash ? '✓' : ''}</span>
                    <span>Tiền mặt</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${isTransfer ? 'checked' : ''}`}>{isTransfer ? '✓' : ''}</span>
                    <span>Chuyển khoản</span>
                  </div>
                  <div className="form-checkbox-group" style={{ gridColumn: '1 / -1' }}>
                    <span className={`form-checkbox-box ${isEWallet ? 'checked' : ''}`}>{isEWallet ? '✓' : ''}</span>
                    <span>Ví điện tử (MoMo / VietQR / ZaloPay)</span>
                  </div>
                  <div className="form-checkbox-group" style={{ gridColumn: '1 / -1' }}>
                    <span className="form-checkbox-box"></span>
                    <span>Khác: .....................................................</span>
                  </div>
                </div>

                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                  <div style={{ fontWeight: 800, color: '#b45309', marginBottom: '4px', fontSize: '11.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>🔔 LƯU Ý</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#475569', lineHeight: 1.45 }}>
                    <li>Quý khách vui lòng kiểm tra sản phẩm và hóa đơn trước khi thanh toán.</li>
                    <li>Sản phẩm đã mua không hoàn / đổi (trừ trường hợp lỗi do cửa hàng).</li>
                    <li>Mọi thắc mắc vui lòng liên hệ Hotline: <b style={{ color: '#dc2626' }}>{branchPhone}</b>.</li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Totals & Signatures */}
              <div>
                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#faf4ef', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Tổng tiền hàng:</span>
                    <span style={{ fontWeight: 600 }}>{subTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Giảm giá:</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>-{discount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ color: '#475569' }}>Phí khác (nếu có):</span>
                    <span style={{ fontWeight: 600 }}>{otherFee.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #4e1a0f', paddingTop: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 900, color: '#4e1a0f', textTransform: 'uppercase' }}>TỔNG THANH TOÁN:</span>
                    <span style={{ fontSize: '17px', fontWeight: 900, color: '#4e1a0f' }}>{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                  <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                    {readVietnameseCurrency(grandTotal)}
                  </div>
                </div>

                {/* Signatures */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', textAlign: 'center', marginTop: '8px' }}>
                  <div>
                    <div className="sig-title">KHÁCH HÀNG</div>
                    <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                    <div style={{ borderBottom: '1px dotted #94a3b8', width: '80%', margin: '0 auto 6px auto' }}></div>
                    <div className="sig-name">{customerName !== 'Khách vãng lai' ? customerName : ''}</div>
                  </div>
                  <div>
                    <div className="sig-title">NHÂN VIÊN BÁN HÀNG</div>
                    <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                    <div style={{ borderBottom: '1px dotted #94a3b8', width: '80%', margin: '0 auto 6px auto' }}></div>
                    <div className="sig-name">{staffName}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Cursive Footer */}
            <div className="form-footer-cursive">
              <span>🧡</span>
              <span>Givral Bakery cảm ơn bạn đã tin tưởng và ủng hộ!</span>
              <span>🧡</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanHangTaiQuayPrintModal;
