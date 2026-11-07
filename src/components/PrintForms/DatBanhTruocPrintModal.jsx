import React, { useRef } from 'react';
import './PrintFormStyles.css';

const DatBanhTruocPrintModal = ({ isOpen, onClose, order }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const maDHT = order.maDHT || order.maDonHang || `DHT${Date.now().toString().slice(-8)}`;
  const customerName = order.hoTenKH || order.customerName || order.hoTen || '';
  const customerPhone = order.sdtKH || order.customerPhone || order.soDienThoai || '';
  const customerEmail = order.emailKH || order.email || '';
  const customerAddress = order.diaChiGiao || order.diaChi || '';
  const branchName = order.cuaHang?.tenCuaHang || order.branchName || 'Givral Bakery Center';
  const branchAddress = order.cuaHang?.diaChiChiTiet || '140 Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú, TP. HCM';
  const branchPhone = '090x.xxx.xxx - 098x.xxx.xxx';

  const orderDate = order.ngayDat ? new Date(order.ngayDat) : new Date();
  const pickupDate = order.ngayHenLay ? new Date(order.ngayHenLay) : null;
  const isDelivery = order.hinhThucNhan === 'giao_tan_noi';

  const items = order.chiTiets || order.items || [];
  const cakeName = items.length > 0 ? (items[0].tenSanPham || items[0].name || '') : '';
  const totalAmount = Number(order.tongTien || 0);
  const depositAmount = Number(order.tienCoc || 0);
  const depositPercent = totalAmount > 0 ? Math.round((depositAmount / totalAmount) * 100) : 50;
  const isDeposited = depositAmount > 0;

  const cakeType = (order.loaiBanh || cakeName || '').toLowerCase();
  const cakeSize = (order.kichThuoc || order.size || '').toLowerCase();
  const flavor = order.huongVi || order.flavor || 'Vani & Kem sữa tươi truyền thống';
  const cakeText = order.noiDungVietBanh || order.chuTrenBanh || order.ghiChu || '';
  const mainColor = order.mauChuDao || 'Trắng & Kem';
  const theme = order.chuDe || 'Sinh nhật';

  return (
    <div className="print-modal-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="print-modal-wrapper">
        {/* Toolbar */}
        <div className="print-modal-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-cake-candles" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Biểu mẫu Đặt Bánh Trước (Pre-Order) — {maDHT}</span>
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
            {/* Header: Brand & Document Title */}
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
                    <span>📍</span>
                    <span>Địa chỉ: {branchAddress}</span>
                  </div>
                  <div className="brand-meta-item">
                    <span>📞</span>
                    <span>Hotline / Zalo: {branchPhone}</span>
                  </div>
                  <div className="brand-meta-item">
                    <span>🌐</span>
                    <span>Website: givralbakery.vn — fb.com/tenshop.official</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 className="form-doc-title">ĐẶT BÁNH TRƯỚC</h2>
                <div className="form-doc-subtitle">Pre - Order</div>
                <div style={{ textAlign: 'center', color: '#f59e0b', fontSize: '13px', margin: '0 0 4px 0' }}>🧡</div>
                <div className="form-doc-code">
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>Mã đơn: </span>
                  {maDHT}
                </div>
                <div className="form-doc-date">
                  <span>Ngày lập: <b>{orderDate.toLocaleDateString('vi-VN')}</b></span>
                </div>
              </div>
            </div>

            {/* Thank you sub-banner */}
            <div
              style={{
                backgroundColor: '#fffdfa',
                border: '1px solid #ebdcd0',
                borderRadius: '6px',
                padding: '6px 14px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '11.5px',
                color: '#475569'
              }}
            >
              <span style={{ fontSize: '18px' }}>🎂</span>
              <div>
                <strong style={{ color: '#4e1a0f' }}>Cảm ơn Quý khách đã tin tưởng và lựa chọn Givral Bakery!</strong>
                <div>Vui lòng điền đầy đủ thông tin để chúng tôi có thể chuẩn bị chiếc bánh thật hoàn hảo cho bạn.</div>
              </div>
            </div>

            {/* Section 1: Customer Information */}
            <div className="form-section-banner">
              <span>👤 1. THÔNG TIN KHÁCH HÀNG</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Họ và tên:</span>
                  <span className="dotted-field-line">{customerName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Email (nếu có):</span>
                  <span className="dotted-field-line">{customerEmail || '...................................................'}</span>
                </div>
              </div>
              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số điện thoại:</span>
                  <span className="dotted-field-line">{customerPhone}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ:</span>
                  <span className="dotted-field-line">{customerAddress || '...................................................'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Cake Information */}
            <div className="form-section-banner">
              <span>🎂 2. THÔNG TIN BÁNH</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '8px' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>Loại bánh:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px', marginBottom: '8px' }}>
                  {['Bánh kem tròn', 'Bánh kem vuông', 'Bánh kem trái tim', 'Cupcake', 'Cheesecake', 'Bánh mousse', 'Bánh su kem', 'Bánh tiramisu', 'Bánh ngọt khác'].map((t) => {
                    const isChecked = cakeType.includes(t.toLowerCase().replace('bánh kem ', '').replace('bánh ', ''));
                    return (
                      <div key={t} className="form-checkbox-group">
                        <span className={`form-checkbox-box ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                        <span>{t}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>Kích thước / Size:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '11px', marginBottom: '8px' }}>
                  {['10cm', '12cm', '14cm', '16cm', '18cm', '20cm', '22cm', 'Khác'].map((s) => {
                    const isChecked = cakeSize.includes(s.replace('cm', ''));
                    return (
                      <div key={s} className="form-checkbox-group">
                        <span className={`form-checkbox-box ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                        <span>{s}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="dotted-field-row">
                  <span className="dotted-field-label">Hương vị / Flavor:</span>
                  <span className="dotted-field-line">{flavor}</span>
                </div>
              </div>

              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số lượng:</span>
                  <span className="dotted-field-line">{items.length > 0 ? `${items.reduce((s, it) => s + Number(it.soLuong || 1), 0)} chiếc / hộp` : '1 chiếc'}</span>
                </div>

                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginTop: '4px', marginBottom: '4px' }}>Màu chủ đạo:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px', fontSize: '11px', marginBottom: '6px' }}>
                  {['Trắng', 'Hồng', 'Xanh', 'Vàng', 'Kem', 'Tím', 'Nâu', 'Khác'].map((c) => {
                    const isChecked = mainColor.toLowerCase().includes(c.toLowerCase());
                    return (
                      <div key={c} className="form-checkbox-group">
                        <span className={`form-checkbox-box ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                        <span>{c}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>Trang trí / Chủ đề:</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px', marginBottom: '8px' }}>
                  {['Sinh nhật', 'Kỷ niệm', 'Tình yêu', 'Thôi nôi', 'Khai trương', 'Tốt nghiệp', 'Khác'].map((th) => {
                    const isChecked = theme.toLowerCase().includes(th.toLowerCase());
                    return (
                      <div key={th} className="form-checkbox-group">
                        <span className={`form-checkbox-box ${isChecked ? 'checked' : ''}`}>{isChecked ? '✓' : ''}</span>
                        <span>{th}</span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '2px' }}>Nội dung viết trên bánh:</div>
                <div
                  style={{
                    border: '1.5px dashed #b45309',
                    borderRadius: '6px',
                    padding: '8px',
                    minHeight: '40px',
                    backgroundColor: '#fffdfa',
                    fontWeight: 700,
                    color: '#9a3412',
                    fontSize: '13px'
                  }}
                >
                  {cakeText ? `"${cakeText}"` : '(Vui lòng viết rõ nội dung, đúng chính tả)'}
                </div>
              </div>
            </div>

            {/* Section 3: Time & Delivery */}
            <div className="form-section-banner">
              <span>📅 3. THỜI GIAN & HÌNH THỨC NHẬN BÁNH</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '8px' }}>
              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Ngày nhận bánh (dự kiến):</span>
                  <span className="dotted-field-line">{pickupDate ? pickupDate.toLocaleDateString('vi-VN') : '........ / ........ / 20........'}</span>
                </div>
                <div style={{ fontSize: '10.5px', color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                  (Vui lòng đặt trước ít nhất 24 - 48 giờ để chúng tôi chuẩn bị tốt nhất)
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Giờ nhận bánh (dự kiến):</span>
                  <span className="dotted-field-line">{pickupDate ? `${String(pickupDate.getHours()).padStart(2, '0')}:${String(pickupDate.getMinutes()).padStart(2, '0')}` : '........ : ........'}</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Hình thức nhận bánh:</span>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${!isDelivery ? 'checked' : ''}`}>{!isDelivery ? '✓' : ''}</span>
                    <span>Nhận tại cửa hàng</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${isDelivery ? 'checked' : ''}`}>{isDelivery ? '✓' : ''}</span>
                    <span>Giao tận nơi</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ giao hàng (nếu có):</span>
                  <span className="dotted-field-line">{customerAddress || '...................................................'}</span>
                </div>
                <div className="dotted-field-row" style={{ marginTop: '8px' }}>
                  <span className="dotted-field-label">Ghi chú thêm về giao hàng:</span>
                  <span className="dotted-field-line">{order.ghiChuGiaoHang || '...................................................'}</span>
                </div>
              </div>
            </div>

            {/* Section 4 & 5: Extra Requirements & Deposit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div>
                <div className="form-section-banner" style={{ fontSize: '12px' }}>
                  <span>🎁 4. YÊU CẦU THÊM (NẾU CÓ)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px', marginBottom: '4px' }}>
                  <div className="form-checkbox-group">
                    <span className={`form-checkbox-box ${cakeText ? 'checked' : ''}`}>{cakeText ? '✓' : ''}</span>
                    <span>Viết chữ trên bánh</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Hình in / Ảnh ăn được</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Hình vẽ trang trí</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box checked">✓</span>
                    <span>Phụ kiện kèm: Nến / Dao</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="form-section-banner" style={{ fontSize: '12px' }}>
                  <span>💳 5. ĐẶT CỌC & THANH TOÁN</span>
                </div>
                <div style={{ fontSize: '11.5px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Tổng tiền bánh: <b>{totalAmount.toLocaleString('vi-VN')} VNĐ</b></span>
                    <span>Tiền cọc: <b style={{ color: '#16a34a' }}>{depositAmount.toLocaleString('vi-VN')} VNĐ ({depositPercent}%)</b></span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <div className="form-checkbox-group">
                      <span className={`form-checkbox-box ${isDeposited ? 'checked' : ''}`}>{isDeposited ? '✓' : ''}</span>
                      <span>Đã đặt cọc ({depositPercent}%)</span>
                    </div>
                    <div className="form-checkbox-group">
                      <span className="form-checkbox-box checked">✓</span>
                      <span>Chuyển khoản / VietQR</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes & Greetings & Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '14px', marginTop: '6px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div style={{ fontWeight: 800, color: '#b45309', marginBottom: '4px', fontSize: '11.5px' }}>📢 LƯU Ý</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#475569', lineHeight: 1.45 }}>
                  <li>Đơn hàng sẽ được xác nhận khi Quý khách đặt cọc hoặc xác nhận tin nhắn.</li>
                  <li>Vui lòng kiểm tra kỹ thông tin bánh trước khi xác nhận đặt.</li>
                  <li>Mọi thắc mắc vui lòng liên hệ Hotline: <b style={{ color: '#dc2626' }}>{branchPhone}</b>.</li>
                </ul>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 12px', backgroundColor: '#faf4ef' }}>
                <div style={{ fontWeight: 800, color: '#4e1a0f', fontSize: '12px', marginBottom: '2px' }}>CẢM ƠN QUÝ KHÁCH! ❤️</div>
                <div style={{ fontSize: '11px', fontStyle: 'italic', color: '#78350f', lineHeight: 1.4 }}>
                  "Mỗi chiếc bánh là một lời chúc ngọt ngào" — Givral Bakery rất hân hạnh được đồng hành trong những khoảnh khắc đặc biệt của bạn.
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center', marginTop: '12px' }}>
              <div>
                <div className="sig-title">KHÁCH HÀNG XÁC NHẬN</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '70%', margin: '0 auto 6px auto' }}></div>
                <div className="sig-name">{customerName}</div>
              </div>
              <div>
                <div className="sig-title">NGƯỜI LẬP ĐƠN / SHOP</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ borderBottom: '1px dotted #94a3b8', width: '70%', margin: '0 auto 6px auto' }}></div>
                <div className="sig-name">{branchName}</div>
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

export default DatBanhTruocPrintModal;
