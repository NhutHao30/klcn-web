import React, { useRef } from 'react';
import './PrintFormStyles.css';

const PhieuOrderPrintModal = ({ isOpen, onClose, data }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  const orderCode = data.maOrder || data.maDHT || data.maHD || data.maDonHang || `PO${Date.now().toString().slice(-8)}`;
  const staffName = data.tenNhanVien || data.staffName || data.nguoiLap || 'Nhân viên Order';
  const tableOrOrderNo = data.soBan || data.maBan || data.maDonHang || `#${orderCode}`;

  const now = new Date(data.createdAt || data.ngayLap || data.ngayDat || Date.now());
  const dateStr = `${String(now.getDate()).padStart(2, '0')} / ${String(now.getMonth() + 1).padStart(2, '0')} / ${now.getFullYear()}`;

  const items = data.items || data.chiTiet || data.chiTiets || [];
  const minRows = Math.max(10, items.length);
  const paddedRows = [];
  for (let i = 0; i < minRows; i++) {
    paddedRows.push(items[i] || null);
  }

  const customerName = data.hoTenKH || data.customerName || data.hoTen || '';
  const customerPhone = data.sdtKH || data.customerPhone || data.soDienThoai || '';
  const deliveryAddress = data.diaChiGiao || data.diaChi || '';
  const deliveryTime = data.ngayHenLay || data.thoiGianGiao || '';

  return (
    <div className="print-modal-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="print-modal-wrapper">
        <div className="print-modal-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-clipboard-list" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Biểu mẫu Phiếu Order Bếp / Quầy — {orderCode}</span>
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
                <h2 className="form-doc-title">PHIẾU ORDER</h2>
                <div className="form-doc-subtitle">Thank you! 🧡</div>
                <div className="form-doc-code" style={{ marginTop: '6px' }}>
                  <span style={{ color: '#1e293b', fontWeight: 600 }}>Số phiếu: </span>
                  {orderCode}
                </div>
                <div className="form-doc-date">
                  <span>Số bàn / Mã đơn: <b>{tableOrOrderNo}</b></span>
                </div>
              </div>
            </div>

            {/* Order Top Bar: Staff & Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px', fontSize: '12px' }}>
              <div className="dotted-field-row">
                <span className="dotted-field-label">Ngày:</span>
                <span className="dotted-field-line">{dateStr}</span>
              </div>
              <div className="dotted-field-row">
                <span className="dotted-field-label">Nhân viên:</span>
                <span className="dotted-field-line">{staffName}</span>
              </div>
            </div>

            {/* Table */}
            <table className="form-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>STT</th>
                  <th>TÊN SẢN PHẨM</th>
                  <th style={{ width: '90px' }}>SIZE / LOẠI</th>
                  <th style={{ width: '42px' }}>SL</th>
                  <th style={{ width: '135px' }}>ĐẾN NGÀY / GIỜ NHẬN</th>
                  <th style={{ width: '180px' }}>GHI CHÚ YÊU CẦU<br /><span style={{ fontSize: '9px', fontWeight: 'normal', textTransform: 'none' }}>(Không viết trang trí ở cột này)</span></th>
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
                  const name = it.tenSanPham || it.name || it.TENSP || '';
                  const size = it.size || it.kichThuoc || it.dvt || 'Cái';
                  const sl = Number(it.soLuong || it.quantity || 1);
                  const pickup = it.ngayNhan || deliveryTime || '';
                  const itNote = it.ghiChu || it.note || '';

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'center' }}>{size}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{sl}</td>
                      <td style={{ textAlign: 'center', fontSize: '11px' }}>{pickup}</td>
                      <td style={{ fontSize: '11px', color: '#475569' }}>{itNote}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Cake types & General notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>🎂 LOẠI BÁNH</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '11px' }}>
                  {['Bánh kem tròn', 'Bánh kem vuông', 'Bánh kem trái tim', 'Cupcake', 'Cheesecake', 'Bánh mousse', 'Bánh su kem', 'Bánh tiramisu', 'Bánh ngọt khác'].map((t) => (
                    <div key={t} className="form-checkbox-group">
                      <span className="form-checkbox-box"></span>
                      <span>{t}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>✏️ GHI CHÚ KHÁC</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                </div>
              </div>
            </div>

            {/* Cake decoration requests */}
            <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#faf4ef', marginBottom: '8px' }}>
              <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>👑 YÊU CẦU TRANG TRÍ BÁNH</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box checked">✓</span>
                    <span>Viết chữ trên bánh: ..............................................................</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Hình in / Ảnh ăn được: ........................................................</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Hình vẽ trang trí theo mẫu: ...................................................</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600 }}>Màu chủ đạo:</span>
                    {['Trắng', 'Hồng', 'Xanh', 'Vàng', 'Kem', 'Tím', 'Nâu'].map((c) => (
                      <div key={c} className="form-checkbox-group">
                        <span className="form-checkbox-box"></span>
                        <span>{c}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dotted-field-row" style={{ marginTop: '6px' }}>
                    <span className="dotted-field-label">Ghi chú thêm:</span>
                    <span className="dotted-field-line">...................................................</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery & Warning */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '8px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#4e1a0f', marginBottom: '4px' }}>🚚 THÔNG TIN GIAO NHẬN (NẾU CẦN GIAO HÀNG)</div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Người nhận:</span>
                  <span className="dotted-field-line">{customerName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Số điện thoại:</span>
                  <span className="dotted-field-line">{customerPhone}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ giao:</span>
                  <span className="dotted-field-line">{deliveryAddress}</span>
                </div>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '8px 10px', backgroundColor: '#fffdfb' }}>
                <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#b45309', marginBottom: '4px' }}>🔔 LƯU Ý</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '10.5px', color: '#475569', lineHeight: 1.45 }}>
                  <li>Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</li>
                  <li>Đặt bánh trước ít nhất 07 ngày để được phục vụ tốt nhất.</li>
                  <li>Một số mẫu có vui lòng liên hệ Hotline: <b style={{ color: '#dc2626' }}>090x.xxx.xxx</b>.</li>
                </ul>
              </div>
            </div>

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'center', marginTop: '10px' }}>
              <div>
                <div className="sig-title">XÁC NHẬN KHÁCH HÀNG</div>
                <div className="sig-note">(Ký & ghi rõ họ tên nếu nhận hàng trực tiếp)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: ........ / ........ / 20........</div>
              </div>
              <div>
                <div className="sig-title">NGƯỜI LẬP PHIẾU / SHOP</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Thời gian: ........ / ........ / 20........</div>
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

export default PhieuOrderPrintModal;
