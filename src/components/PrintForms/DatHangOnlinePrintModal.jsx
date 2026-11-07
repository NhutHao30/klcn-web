import React, { useRef } from 'react';
import './PrintFormStyles.css';
import { readVietnameseCurrency } from './numberToWords';

const DatHangOnlinePrintModal = ({ isOpen, onClose, order }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderCode = order.MAHD || order.MAHDBAN || order.maHD || order.maHDBan || order.maDonHang || `HDH${Date.now().toString().slice(-8)}`;
  const customerName = order.hoTenNguoiNhan || order.hoTenKH || order.hoTen || order.khachHang?.hoTen || 'Khách hàng Online';
  const customerPhone = order.sdtNguoiNhan || order.sdtKH || order.soDienThoai || '';
  const customerEmail = order.emailKH || order.email || '';
  const customerAddress = order.diaChiGiaoHang || order.diaChi || order.dia_chi || '';
  const shippingNote = order.ghiChuGiaoHang || order.ghiChu || 'Giao giờ hành chính, gọi trước khi giao.';
  const branchName = order.cuaHang?.tenCuaHang || order.tenCuaHang || 'CH001 - Givral Bakery Center';

  const orderDate = new Date(order.ngayDat || order.createdAt || order.ngayTao || Date.now());
  const dateStr = `${String(orderDate.getDate()).padStart(2, '0')} / ${String(orderDate.getMonth() + 1).padStart(2, '0')} / ${orderDate.getFullYear()}`;
  const timeStr = `${String(orderDate.getHours()).padStart(2, '0')}:${String(orderDate.getMinutes()).padStart(2, '0')}`;

  const orderStatus = order.trangThaiDonHang || order.trangThai || 'Chờ xử lý';
  const isPaid = (order.trangThaiThanhToan === 'Đã thanh toán' || order.isPaid || order.trangThaiThanhToan === 1);
  const paymentMethodStr = String(order.phuongThucThanhToan || order.paymentMethod || 'COD').toUpperCase();

  const items = order.chiTietDonHangs || order.chiTiets || order.items || [];
  const lineSum = items.reduce((sum, it) => {
    const sl = Number(it.soLuong || it.SOLUONG || it.quantity || 1);
    const gia = Number(it.donGia || it.DONGIA || it.price || 0);
    return sum + (Number(it.thanhTien) || (sl * gia));
  }, 0);

  const shippingFee = Number(order.phiVanChuyen || order.phi_van_chuyen || 0);
  const discount = Number(order.soTienGiam || order.so_tien_giam || 0);
  const voucherCode = order.maVoucher || order.voucherCode || '';
  const grandTotal = Number(order.tongTien || order.TONGTIEN || (lineSum + shippingFee - discount));

  // Padded rows
  const minRows = Math.max(5, items.length);
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
            <i className="fa-solid fa-truck-fast" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Đơn Đặt Hàng Trực Tuyến — {orderCode}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-print-action" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> In Đơn / Xuất PDF
            </button>
            <button type="button" className="btn-print-close" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>

        {/* Printable Canvas */}
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
                <h2 className="form-doc-title" style={{ fontSize: '23px' }}>ĐƠN ĐẶT HÀNG TRỰC TUYẾN</h2>
                <div style={{ marginTop: '6px' }}>
                  <div className="form-doc-code" style={{ fontSize: '14px' }}>
                    <span style={{ color: '#1e293b', fontWeight: 600 }}>Mã đơn hàng : </span>
                    {orderCode}
                  </div>
                  <div className="form-doc-date">
                    <span>Ngày lập : <b>{dateStr}</b> &nbsp; {timeStr}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Customer Info & Delivery Schedule */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '14px', marginBottom: '10px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-10px -12px 10px -12px', borderRadius: '5px 5px 0 0' }}>
                  <span>👤 THÔNG TIN KHÁCH HÀNG & GIAO HÀNG</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Họ và tên khách hàng :</span>
                  <span className="dotted-field-line">{customerName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số điện thoại nhận hàng :</span>
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
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Ghi chú giao hàng :</span>
                  <span className="dotted-field-line">{shippingNote}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Chi nhánh xử lý đơn :</span>
                  <span className="dotted-field-line">{branchName}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#faf4ef' }}>
                  <div style={{ fontWeight: 800, fontSize: '12px', color: '#4e1a0f', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🛵 THỜI GIAN GIAO DỰ KIẾN</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#334155', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>Từ: <b>08:00</b></span>
                    <span>Ngày: <b>{dateStr}</b></span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#334155', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Đến: <b>18:00</b></span>
                    <span>Ngày: <b>{dateStr}</b></span>
                  </div>
                </div>

                <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#ffffff', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>TRẠNG THÁI ĐƠN HÀNG</span>
                    <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '11.5px' }}>
                      {orderStatus}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155' }}>TRẠNG THÁI THANH TOÁN</span>
                    <span style={{ backgroundColor: isPaid ? '#dcfce7' : '#fee2e2', color: isPaid ? '#166534' : '#991b1b', padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '11.5px' }}>
                      {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Order Details Table */}
            <div className="form-section-banner">
              <span>🧺 CHI TIẾT ĐƠN HÀNG</span>
            </div>
            <table className="form-table">
              <thead>
                <tr>
                  <th style={{ width: '36px' }}>STT</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: '75px' }}>Mã SP</th>
                  <th style={{ width: '50px' }}>ĐVT</th>
                  <th style={{ width: '40px' }}>SL</th>
                  <th style={{ width: '105px', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
                  <th style={{ width: '115px', textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                  <th style={{ width: '110px' }}>Ghi chú</th>
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
                        <td></td>
                        <td></td>
                      </tr>
                    );
                  }

                  const name = it.tenSanPham || it.name || it.TENSP || 'Sản phẩm bánh';
                  const code = it.maSP || it.MASP || `SP${String(idx + 1).padStart(3, '0')}`;
                  const dvt = it.dvt || it.donViTinh || 'Cái';
                  const sl = Number(it.soLuong || it.SOLUONG || 1);
                  const gia = Number(it.donGia || it.DONGIA || 0);
                  const tt = Number(it.thanhTien || (sl * gia));
                  const itNote = it.ghiChu || '';

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'center', color: '#64748b' }}>{code}</td>
                      <td style={{ textAlign: 'center' }}>{dvt}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{sl}</td>
                      <td style={{ textAlign: 'right' }}>{gia.toLocaleString('vi-VN')}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{tt.toLocaleString('vi-VN')}</td>
                      <td style={{ fontSize: '11px', color: '#64748b' }}>{itNote}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Summary Totals Table */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <div style={{ width: '380px', border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#faf4ef' }}>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #4e1a0f', paddingTop: '5px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 900, color: '#4e1a0f', textTransform: 'uppercase' }}>TỔNG THANH TOÁN:</span>
                  <span style={{ fontSize: '17px', fontWeight: 900, color: '#dc2626' }}>{grandTotal.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            </div>

            <div className="dotted-field-row" style={{ marginBottom: '10px' }}>
              <span className="dotted-field-label">Số tiền bằng chữ:</span>
              <span className="dotted-field-line" style={{ fontStyle: 'italic', fontWeight: 600, color: '#78350f' }}>
                {readVietnameseCurrency(grandTotal)}
              </span>
            </div>

            {/* Payment & Processing Terms */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px', marginBottom: '10px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-8px -10px 8px -10px', borderRadius: '5px 5px 0 0', fontSize: '11.5px' }}>
                  <span>💳 PHƯƠNG THỨC THANH TOÁN</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${paymentMethodStr.includes('COD') ? 'checked' : ''}`}>{paymentMethodStr.includes('COD') ? '✓' : ''}</span>
                    <span>Thanh toán khi nhận hàng (COD)</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${paymentMethodStr.includes('TRANSFER') || paymentMethodStr.includes('VIETQR') || isPaid ? 'checked' : ''}`}>{paymentMethodStr.includes('TRANSFER') || paymentMethodStr.includes('VIETQR') || isPaid ? '✓' : ''}</span>
                    <span>Chuyển khoản / Thanh toán điện tử</span>
                  </div>
                  <div style={{ paddingLeft: '20px', display: 'flex', gap: '14px' }}>
                    <div className="form-checkbox-group">
                      <span className={`form-checkbox-box ${paymentMethodStr.includes('VIETQR') ? 'checked' : ''}`}>{paymentMethodStr.includes('VIETQR') ? '✓' : ''}</span>
                      <span>VietQR</span>
                    </div>
                    <div className="form-checkbox-group">
                      <span className={`form-checkbox-box ${paymentMethodStr.includes('MOMO') ? 'checked' : ''}`}>{paymentMethodStr.includes('MOMO') ? '✓' : ''}</span>
                      <span>MoMo</span>
                    </div>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Thanh toán online qua thẻ</span>
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-8px -10px 8px -10px', borderRadius: '5px 5px 0 0', fontSize: '11.5px' }}>
                  <span>⚙️ THÔNG TIN XỬ LÝ ĐƠN HÀNG</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#475569', lineHeight: 1.45 }}>
                  <li>Đơn hàng sẽ được xác nhận qua SMS/Zalo và Email.</li>
                  <li>Quý khách vui lòng kiểm tra hàng trước khi thanh toán.</li>
                  <li>Hỗ trợ đổi/trả trong vòng 07 ngày nếu sản phẩm lỗi do nhà sản xuất.</li>
                  <li>Mọi thắc mắc vui lòng liên hệ Hotline: <b style={{ color: '#dc2626' }}>090x.xxx.xxx</b>.</li>
                </ul>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center', marginTop: '10px' }}>
              <div>
                <div className="sig-title">👤 XÁC NHẬN ĐƠN HÀNG</div>
                <div className="sig-note">(Hệ thống ghi nhận khi khách hàng đặt hàng thành công)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: {dateStr} {timeStr}</div>
              </div>
              <div>
                <div className="sig-title">🏪 NGƯỜI LẬP ĐƠN / SHOP</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: {dateStr} {timeStr}</div>
              </div>
            </div>

            {/* Bottom Cursive Footer */}
            <div className="form-footer-cursive" style={{ fontSize: '11.5px', color: '#94a3b8' }}>
              <span>🤎</span>
              <span>Biểu mẫu minh họa cho nghiệp vụ bán hàng trực tuyến – Dữ liệu chỉ mang tính minh họa.</span>
              <span>🤎</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatHangOnlinePrintModal;

