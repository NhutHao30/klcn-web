import React, { useRef } from 'react';
import './PrintFormStyles.css';

const PhieuTonKhoPrintModal = ({ isOpen, onClose, reportData }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !reportData) return null;

  const handlePrint = () => {
    window.print();
  };

  const reportCode = reportData.maBaoCao || `TK${Date.now().toString().slice(-8)}`;
  const storeName = reportData.tenKho || reportData.tenCuaHang || 'Kho Tổng Trung Tâm — Givral Bakery Tân Phú';
  const storeAddress = reportData.diaChiKho || '140 Lê Trọng Tấn, P. Tây Thạnh, Q. Tân Phú, TP. HCM';
  const managerName = reportData.nguoiQuanLy || reportData.managerName || 'Trần Văn Quản Kho';

  const fromDate = reportData.tuNgay || '01 / 11 / 2026';
  const toDate = reportData.denNgay || '30 / 11 / 2026';
  const createdDate = reportData.ngayLap || new Date().toLocaleDateString('vi-VN');

  const items = reportData.items || reportData.danhSach || [];
  const minRows = Math.max(10, items.length);
  const paddedRows = [];
  for (let i = 0; i < minRows; i++) {
    paddedRows.push(items[i] || null);
  }

  const totalDauKy = items.reduce((s, it) => s + Number(it.tonDauKy || it.dauKy || 0), 0);
  const totalNhap = items.reduce((s, it) => s + Number(it.nhapTrongKy || it.nhap || 0), 0);
  const totalXuat = items.reduce((s, it) => s + Number(it.xuatTrongKy || it.xuat || 0), 0);
  const totalCuoiKy = items.reduce((s, it) => s + Number(it.tonCuoiKy || it.cuoiKy || it.soLuongTon || 0), 0);

  const totalGiaTriDauKy = items.reduce((s, it) => s + (Number(it.tonDauKy || 0) * Number(it.donGia || it.giaNhap || 0)), 0);
  const totalGiaTriNhap = items.reduce((s, it) => s + (Number(it.nhapTrongKy || 0) * Number(it.donGia || it.giaNhap || 0)), 0);
  const totalGiaTriXuat = items.reduce((s, it) => s + (Number(it.xuatTrongKy || 0) * Number(it.donGia || it.giaNhap || 0)), 0);
  const totalGiaTriCuoiKy = items.reduce((s, it) => s + (Number(it.tonCuoiKy || it.soLuongTon || 0) * Number(it.donGia || it.giaNhap || 0)), 0);

  return (
    <div className="print-modal-overlay no-print" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="print-modal-wrapper">
        <div className="print-modal-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-boxes-stacked" style={{ color: '#f59e0b', fontSize: '18px' }}></i>
            <span style={{ fontWeight: 700, fontSize: '15px' }}>Báo Cáo / Phiếu Tồn Kho — {reportCode}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn-print-action" onClick={handlePrint}>
              <i className="fa-solid fa-print"></i> In Báo Cáo / Xuất PDF
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
                    <span>Website / Fanpage: fb.com/givralbakery</span>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <h2 className="form-doc-title">PHIẾU TỒN KHO</h2>
                <div className="form-doc-subtitle">🌾 Báo cáo tồn kho 🌾</div>
                <div style={{ fontSize: '13px', color: '#b45309', margin: '2px 0 4px 0' }}>👑</div>
                <div className="form-doc-date">
                  <span>Kỳ báo cáo : <b>Từ {fromDate} đến {toDate}</b></span>
                </div>
                <div className="form-doc-date">
                  <span>Ngày lập : <b>{createdDate}</b></span>
                </div>
              </div>
            </div>

            {/* Warehouse General Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', marginBottom: '8px' }}>
              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Kho :</span>
                  <span className="dotted-field-line">{storeName}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Địa chỉ :</span>
                  <span className="dotted-field-line">{storeAddress}</span>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Người quản lý :</span>
                  <span className="dotted-field-line">{managerName}</span>
                </div>
              </div>

              <div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Mã báo cáo :</span>
                  <span className="dotted-field-line" style={{ fontWeight: 700 }}>{reportCode}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0', fontSize: '11.5px' }}>
                  <span style={{ fontWeight: 600, color: '#334155' }}>Loại hàng hóa :</span>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box checked">✓</span>
                    <span>Nguyên liệu</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box checked">✓</span>
                    <span>Bao bì</span>
                  </div>
                  <div className="form-checkbox-group">
                    <span className="form-checkbox-box"></span>
                    <span>Khác</span>
                  </div>
                </div>
                <div className="dotted-field-row">
                  <span className="dotted-field-label">Ghi chú :</span>
                  <span className="dotted-field-line">{reportData.ghiChu || 'Kiểm kê định kỳ tháng'}</span>
                </div>
              </div>
            </div>

            {/* Inventory Table */}
            <table className="form-table">
              <thead>
                <tr>
                  <th style={{ width: '38px' }}>STT</th>
                  <th>TÊN HÀNG HÓA / NGUYÊN LIỆU</th>
                  <th style={{ width: '50px' }}>ĐVT</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>TỒN ĐẦU KỲ</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>NHẬP TRONG KỲ</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>XUẤT TRONG KỲ</th>
                  <th style={{ width: '95px', textAlign: 'right' }}>TỒN CUỐI KỲ</th>
                  <th style={{ width: '90px' }}>GHI CHÚ</th>
                </tr>
              </thead>
              <tbody>
                {paddedRows.map((it, idx) => {
                  if (!it) {
                    return (
                      <tr key={`empty-${idx}`} style={{ height: '23px' }}>
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

                  const name = it.tenSanPham || it.tenHangHoa || it.name || it.TENSP || '';
                  const dvt = it.dvt || it.donViTinh || 'Hộp';
                  const dau = Number(it.tonDauKy || it.dauKy || 0);
                  const nhap = Number(it.nhapTrongKy || it.nhap || 0);
                  const xuat = Number(it.xuatTrongKy || it.xuat || 0);
                  const cuoi = Number(it.tonCuoiKy || it.cuoiKy || it.soLuongTon || (dau + nhap - xuat));
                  const itNote = it.ghiChu || '';

                  return (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{name}</td>
                      <td style={{ textAlign: 'center' }}>{dvt}</td>
                      <td style={{ textAlign: 'right' }}>{dau}</td>
                      <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>+{nhap}</td>
                      <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>-{xuat}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#4e1a0f' }}>{cuoi}</td>
                      <td style={{ fontSize: '11px', color: '#64748b' }}>{itNote}</td>
                    </tr>
                  );
                })}
                {/* Total row */}
                <tr style={{ backgroundColor: '#faf4ef', fontWeight: 800 }}>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#4e1a0f' }}>Tổng cộng:</td>
                  <td style={{ textAlign: 'right' }}>{totalDauKy}</td>
                  <td style={{ textAlign: 'right', color: '#16a34a' }}>{totalNhap}</td>
                  <td style={{ textAlign: 'right', color: '#dc2626' }}>{totalXuat}</td>
                  <td style={{ textAlign: 'right', color: '#4e1a0f', fontSize: '13px' }}>{totalCuoiKy}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* Bottom 2 Columns: Statistical Overview & Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginTop: '8px' }}>
              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-10px -12px 10px -12px', borderRadius: '5px 5px 0 0', fontSize: '11.5px' }}>
                  <span>📊 THỐNG KÊ TỔNG QUAN</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11.5px' }}>
                  <span style={{ color: '#475569' }}>Tổng số mặt hàng :</span>
                  <span style={{ fontWeight: 700 }}>{items.length} (mặt hàng)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11.5px' }}>
                  <span style={{ color: '#475569' }}>Tổng giá trị tồn đầu kỳ :</span>
                  <span style={{ fontWeight: 600 }}>{totalGiaTriDauKy.toLocaleString('vi-VN')} VND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11.5px' }}>
                  <span style={{ color: '#475569' }}>Tổng giá trị nhập trong kỳ :</span>
                  <span style={{ fontWeight: 600, color: '#16a34a' }}>+{totalGiaTriNhap.toLocaleString('vi-VN')} VND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', fontSize: '11.5px' }}>
                  <span style={{ color: '#475569' }}>Tổng giá trị xuất trong kỳ :</span>
                  <span style={{ fontWeight: 600, color: '#dc2626' }}>-{totalGiaTriXuat.toLocaleString('vi-VN')} VND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1.5px solid #4e1a0f', paddingTop: '4px', marginTop: '3px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 800, color: '#4e1a0f' }}>Tổng giá trị tồn cuối kỳ :</span>
                  <span style={{ fontWeight: 800, color: '#4e1a0f', fontSize: '14px' }}>{totalGiaTriCuoiKy.toLocaleString('vi-VN')} VND</span>
                </div>
              </div>

              <div style={{ border: '1px solid #ebdcd0', borderRadius: '6px', padding: '10px 12px', backgroundColor: '#fffdfb' }}>
                <div className="form-section-banner" style={{ margin: '-10px -12px 10px -12px', borderRadius: '5px 5px 0 0', fontSize: '11.5px' }}>
                  <span>📝 GHI CHÚ</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                  <div style={{ borderBottom: '1px dotted #94a3b8', height: '14px' }}></div>
                </div>
              </div>
            </div>

            {/* 4 Signatures */}
            <div className="signatures-container">
              <div>
                <div className="sig-title">🚚 NGƯỜI LẬP PHIẾU</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngày: ..... / ..... / 20.......</div>
              </div>
              <div>
                <div className="sig-title">🧮 KẾ TOÁN</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngày: ..... / ..... / 20.......</div>
              </div>
              <div>
                <div className="sig-title">🏠 THỦ KHO</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngày: ..... / ..... / 20.......</div>
              </div>
              <div>
                <div className="sig-title">👥 GIÁM ĐỐC</div>
                <div className="sig-note">(Ký & ghi rõ họ tên)</div>
                <div style={{ fontSize: '10px', color: '#64748b' }}>Ngày: ..... / ..... / 20.......</div>
              </div>
            </div>

            {/* Bottom Footer Banner */}
            <div className="form-footer-banner">
              <span>💛 Cảm ơn Quý đối tác đã đồng hành cùng Givral Bakery! 💛</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhieuTonKhoPrintModal;
