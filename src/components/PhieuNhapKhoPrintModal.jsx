import React, { useRef } from 'react';

const PhieuNhapKhoPrintModal = ({ isOpen, onClose, invoice }) => {
  const printAreaRef = useRef(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '... / ... / 20...';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day} / ${month} / ${year}   ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  };

  const formatDateOnly = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  // Extract items
  const items = invoice.chiTiets || invoice.chi_tiets || invoice.items || [];
  
  // Calculate totals
  const totalSlTct = items.reduce((sum, item) => sum + Number(item.soLuong || item.SOLUONGTCT || item.so_luong || 0), 0);
  const totalSlTn = items.reduce((sum, item) => sum + Number(item.soLuongThucNhan || item.soLuong || item.SOLUONGTN || item.so_luong || 0), 0);
  const totalAmount = Number(invoice.tongTien || invoice.tong_tien || invoice.TONGTIEN || 0);

  // Extract signatures
  const chuKySos = invoice.chuKySos || invoice.chu_ky_sos || [];
  const sigGiamDoc = chuKySos.find(s => s.vaiTroKy === 1 || s.vai_tro_ky === 1);
  const sigVanChuyen = chuKySos.find(s => s.vaiTroKy === 2 || s.vai_tro_ky === 2);
  const sigNguoiNhan = chuKySos.find(s => s.vaiTroKy === 3 || s.vai_tro_ky === 3);
  const sigNcc = chuKySos.find(s => s.vaiTroKy === 4 || s.vai_tro_ky === 4);

  // Pad items to at least 7 rows like the official paper template
  const minRows = Math.max(7, items.length);
  const paddedRows = [];
  for (let i = 0; i < minRows; i++) {
    paddedRows.push(items[i] || null);
  }

  const maPhieu = invoice.maHoaDonNhap || invoice.MAHDNHAP || `HDN-${invoice.id}`;
  const tenNcc = invoice.nhaCungCap?.tenNcc || invoice.nhaCungCap?.TENNCC || invoice.nha_cung_cap?.tenNcc || 'Công ty TNHH Givral Product';
  const diaChiNcc = invoice.nhaCungCap?.diaChi || invoice.nha_cung_cap?.diaChi || '123 Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. HCM';
  const sdtNcc = invoice.nhaCungCap?.soDienThoai || invoice.nha_cung_cap?.soDienThoai || '0901 234 567';
  const tenCuaHang = invoice.cuaHang?.tenCuaHang || invoice.cua_hang?.tenCuaHang || invoice.cuaHang?.TENCUAHANG || 'Givral Lê Văn Sỹ (Q3)';
  const diaChiCuaHang = invoice.cuaHang?.diaChiChiTiet || invoice.cua_hang?.diaChiChiTiet || '140 Lê Trọng Tấn, phường Tây Thạnh, quận Tân Phú, TP. HCM';

  return (
    <>
      {/* PRINT CSS STYLESHEET */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #phieu-nhap-kho-print-area,
          #phieu-nhap-kho-print-area * {
            visibility: visible !important;
          }
          #phieu-nhap-kho-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* MODAL OVERLAY */}
      <div
        className="no-print"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          zIndex: 99999,
          padding: '24px 16px',
          overflowY: 'auto'
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '920px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* TOP BAR / CONTROLS */}
          <div
            style={{
              padding: '14px 20px',
              backgroundColor: '#3b2219',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '2px solid #b45309'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <i className="fa-solid fa-file-invoice" style={{ fontSize: '20px', color: '#f59e0b' }}></i>
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                Biểu Mẫu Phiếu Nhập Kho: {maPhieu}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handlePrint}
                style={{
                  backgroundColor: '#b45309',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 18px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
              >
                <i className="fa-solid fa-print"></i> In Phiếu / Xuất PDF
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <i className="fa-solid fa-xmark"></i> Đóng
              </button>
            </div>
          </div>

          {/* PRINTABLE VOUCHER PREVIEW CONTAINER */}
          <div style={{ padding: '24px', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
            <div
              id="phieu-nhap-kho-print-area"
              ref={printAreaRef}
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #5c3127',
                borderRadius: '8px',
                padding: '28px',
                width: '100%',
                maxWidth: '850px',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                fontFamily: '"Montserrat", "Segoe UI", Tahoma, sans-serif',
                color: '#2d1810',
                boxSizing: 'border-box'
              }}
            >
              {/* HEADER: LOGO + COMPANY INFO & VOUCHER TITLE */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  paddingBottom: '16px',
                  borderBottom: '2px solid #b45309'
                }}
              >
                {/* LEFT: GIVRAL BAKERY BRANDING */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', maxWidth: '52%' }}>
                  <img
                    src="/assets/IMG/Logo.png"
                    alt="Givral Bakery Logo"
                    style={{
                      width: '74px',
                      height: '74px',
                      objectFit: 'contain',
                      borderRadius: '8px',
                      border: '2px solid #d97706',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                    }}
                  />
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '24px',
                        fontFamily: 'serif',
                        fontWeight: 'bold',
                        color: '#451a03',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Givral Bakery
                    </h2>
                    <p style={{ margin: '2px 0 6px 0', fontSize: '11px', fontStyle: 'italic', color: '#78350f' }}>
                      Chuyên bánh ngọt & bánh kem cao cấp
                    </p>
                    <div style={{ fontSize: '11px', color: '#444', lineHeight: 1.45 }}>
                      <div>📍 {diaChiCuaHang}</div>
                      <div>📞 Hotline / Zalo: 0903.888.999 - 0988.666.777</div>
                      <div>🌐 Website: givralbakery.com | Fanpage: fb.com/givralbakery</div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: VOUCHER TITLE & CODE */}
                <div style={{ textAlign: 'right', minWidth: '40%' }}>
                  <div style={{ fontSize: '20px', color: '#d97706', marginBottom: '2px' }}>
                    <i className="fa-solid fa-cake-candles"></i>
                  </div>
                  <h1
                    style={{
                      margin: 0,
                      fontSize: '26px',
                      fontFamily: 'serif',
                      fontWeight: '800',
                      color: '#451a03',
                      letterSpacing: '1px'
                    }}
                  >
                    PHIẾU NHẬP KHO
                  </h1>
                  <div style={{ fontSize: '13px', fontStyle: 'italic', color: '#b45309', margin: '2px 0 6px 0' }}>
                    Thank you! Bánh ngon mỗi ngày 🧡
                  </div>
                  <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.6 }}>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Số phiếu: </span>
                      <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '15px' }}>
                        {maPhieu}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontWeight: 'bold' }}>Ngày nhập: </span>
                      <span style={{ fontWeight: '600' }}>{formatDate(invoice.ngayNhap || invoice.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📋 PHẦN 1: THÔNG TIN CHUNG */}
              <div
                style={{
                  marginTop: '16px',
                  border: '1.5px solid #d97706',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  backgroundColor: '#fffdfa'
                }}
              >
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '13px',
                    color: '#78350f',
                    textTransform: 'uppercase',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="fa-solid fa-clipboard-list"></i> THÔNG TIN CHUNG
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px 24px', fontSize: '12.5px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Nhà cung cấp: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>{tenNcc}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Mã phiếu nhập NCC: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>PNK-NCC-{invoice.id || '01'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Địa chỉ: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>{diaChiNcc}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Số hóa đơn: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>HD-{invoice.id || '001'}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Điện thoại: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>{sdtNcc}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Kho nhập: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px', fontWeight: 'bold', color: '#0369a1' }}>
                      {tenCuaHang}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Mã số thuế: </span>
                    <span style={{ borderBottom: '1px dotted #999', paddingBottom: '1px' }}>0318299182</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Trạng thái: </span>
                    <span style={{ fontWeight: 'bold', color: invoice.trangThai === 1 ? '#15803d' : '#b45309' }}>
                      {invoice.trangThai === 1 ? 'Đã nhập kho hoàn tất' : 'Đang chuyển giao / Chờ đồng kiểm'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 📋 PHẦN 2: BẢNG SẢN PHẨM BÁNH */}
              <div style={{ marginTop: '16px' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12px',
                    border: '1.5px solid #5c3127'
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: '#451a03', color: '#ffffff' }}>
                      <th style={{ border: '1px solid #78350f', padding: '6px 4px', width: '35px', textAlign: 'center' }}>STT</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 6px', width: '80px', textAlign: 'center' }}>MÃ SP</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 8px', textAlign: 'left' }}>TÊN SẢN PHẨM</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 4px', width: '50px', textAlign: 'center' }}>ĐVT</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 6px', width: '80px', textAlign: 'center' }}>NSX</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 6px', width: '80px', textAlign: 'center' }}>HSD</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 6px', width: '80px', textAlign: 'center' }}>SL TCT</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 6px', width: '90px', textAlign: 'center' }}>SL THỰC NHẬP</th>
                      <th style={{ border: '1px solid #78350f', padding: '6px 8px', width: '100px', textAlign: 'right' }}>ĐƠN GIÁ (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedRows.map((item, idx) => {
                      if (!item) {
                        return (
                          <tr key={`pad-${idx}`} style={{ height: '28px', backgroundColor: idx % 2 === 1 ? '#fafaf9' : '#fff' }}>
                            <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', color: '#94a3b8' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                            <td style={{ border: '1px solid #cbd5e1' }}></td>
                          </tr>
                        );
                      }

                      const masp = item.sanPham?.id || item.sanPhamId || item.MASP || '-';
                      const tensp = item.sanPham?.tenSanPham || item.TENSP || item.ten_san_pham || `Bánh #${masp}`;
                      const dvt = item.sanPham?.donViTinh || item.donViTinh || 'Cái';
                      const nsx = item.loHang?.ngaySanXuat || item.ngaySanXuat || item.NGAYSX;
                      const hsd = item.loHang?.hsd || item.hsd || item.HSD_LO || item.HSD;
                      const slTct = item.soLuong || item.SOLUONGTCT || item.so_luong || 0;
                      const slTn = item.soLuongThucNhan ?? item.soLuong ?? slTct;
                      const donGia = Number(item.donGiaNhap || item.DONGIANHAP || item.don_gia_nhap || 0);

                      return (
                        <tr key={idx} style={{ height: '28px', backgroundColor: idx % 2 === 1 ? '#fafaf9' : '#fff' }}>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{idx + 1}</td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '600' }}>#{masp}</td>
                          <td style={{ border: '1px solid #cbd5e1', padding: '4px 8px', fontWeight: '600', color: '#1e293b' }}>
                            {tensp}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>{dvt}</td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center' }}>{formatDateOnly(nsx)}</td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: '600', color: '#b45309' }}>
                            {formatDateOnly(hsd)}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold' }}>{slTct}</td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 'bold', color: slTn < slTct ? '#dc2626' : '#15803d' }}>
                            {slTn}
                          </td>
                          <td style={{ border: '1px solid #cbd5e1', textAlign: 'right', padding: '4px 8px' }}>
                            {donGia.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}

                    {/* DÒNG TỔNG CỘNG */}
                    <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold', fontSize: '12.5px' }}>
                      <td colSpan="6" style={{ border: '1.5px solid #78350f', padding: '6px 8px', textAlign: 'right', color: '#451a03' }}>
                        Tổng cộng:
                      </td>
                      <td style={{ border: '1.5px solid #78350f', textAlign: 'center', color: '#451a03' }}>
                        {totalSlTct}
                      </td>
                      <td style={{ border: '1.5px solid #78350f', textAlign: 'center', color: totalSlTn < totalSlTct ? '#dc2626' : '#15803d' }}>
                        {totalSlTn}
                      </td>
                      <td style={{ border: '1.5px solid #78350f', textAlign: 'right', padding: '6px 8px', color: '#451a03' }}>
                        {totalAmount.toLocaleString()}đ
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* GHI CHÚ DƯỚI BẢNG */}
                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                  <span style={{ fontWeight: 'bold' }}>Ghi chú: </span>
                  <span style={{ borderBottom: '1px dotted #999', paddingBottom: '2px' }}>
                    {invoice.ghiChu || invoice.GHICHU || 'Nhập kho lô bánh mới từ Nhà cung cấp theo quy chuẩn và ký số xác nhận.'}
                  </span>
                </div>
              </div>

              {/* 📋 PHẦN 3: THÔNG TIN KHÁC & TỔNG HỢP */}
              <div
                style={{
                  marginTop: '16px',
                  display: 'grid',
                  gridTemplateColumns: '1.1fr 1fr',
                  gap: '16px',
                  fontSize: '12.5px'
                }}
              >
                {/* TRÁI: THÔNG TIN KHÁC */}
                <div
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#fafaf9'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#451a03', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-credit-card"></i> THÔNG TIN KHÁC
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: '600' }}>Phương thức thanh toán: </span>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" defaultChecked /> Tiền mặt
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" /> Chuyển khoản
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <input type="checkbox" /> Công nợ
                      </label>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontWeight: '600' }}>Ghi chú thêm: </span>
                    <div style={{ borderBottom: '1px dotted #999', height: '18px', marginTop: '4px' }}></div>
                  </div>
                </div>

                {/* PHẢI: TỔNG HỢP THANH TOÁN */}
                <div
                  style={{
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '12px',
                    backgroundColor: '#fafaf9'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#451a03', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="fa-solid fa-calculator"></i> TỔNG HỢP
                  </div>
                  <div style={{ lineHeight: 1.8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tổng tiền hàng:</span>
                      <span style={{ fontWeight: '600' }}>{totalAmount.toLocaleString()} VNĐ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                      <span>Chiết khấu (nếu có):</span>
                      <span>0 VNĐ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                      <span>Thuế VAT ( 0% ):</span>
                      <span>0 VNĐ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                      <span>Phí khác (nếu có):</span>
                      <span>0 VNĐ</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '6px',
                        paddingTop: '6px',
                        borderTop: '2px solid #5c3127',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: '#451a03'
                      }}
                    >
                      <span>TỔNG THANH TOÁN :</span>
                      <span style={{ fontSize: '16px', color: '#b45309' }}>
                        {totalAmount.toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📋 PHẦN 4: KHU VỰC 4 CHỮ KÝ */}
              <div
                style={{
                  marginTop: '22px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  textAlign: 'center',
                  fontSize: '11.5px'
                }}
              >
                {/* 1. NGƯỜI LẬP PHIẾU */}
                <div style={{ padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 'bold', color: '#451a03' }}>
                    <i className="fa-solid fa-user-pen"></i> NGƯỜI LẬP PHIẾU
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px', color: '#666', marginBottom: '4px' }}>
                    (Ký & ghi rõ họ tên)
                  </div>
                  <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>
                      ✓ Đã Lập Phiếu
                    </span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {invoice.nguoiNhap?.hoTen || 'Thủ kho Givral'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#777' }}>
                    Ngày: {formatDateOnly(invoice.ngayNhap || invoice.createdAt)}
                  </div>
                </div>

                {/* 2. KẾ TOÁN */}
                <div style={{ padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 'bold', color: '#451a03' }}>
                    <i className="fa-solid fa-pen-nib"></i> KẾ TOÁN
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px', color: '#666', marginBottom: '4px' }}>
                    (Ký & ghi rõ họ tên)
                  </div>
                  <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: '#16a34a', fontWeight: 'bold', fontSize: '11px' }}>
                      ✓ Đã Xác Nhận
                    </span>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>Kế Toán Trưởng</div>
                  <div style={{ fontSize: '10px', color: '#777' }}>
                    Ngày: {formatDateOnly(invoice.ngayNhap || invoice.createdAt)}
                  </div>
                </div>

                {/* 3. NHÀ CUNG CẤP / VẬN CHUYỂN */}
                <div style={{ padding: '6px', border: '1px dashed #cbd5e1', borderRadius: '6px' }}>
                  <div style={{ fontWeight: 'bold', color: '#451a03' }}>
                    <i className="fa-solid fa-truck"></i> NHÀ CUNG CẤP
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px', color: '#666', marginBottom: '4px' }}>
                    (Ký & ghi rõ họ tên)
                  </div>
                  <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {sigVanChuyen?.digitalSignatureHash ? (
                      <div style={{ textAlign: 'center' }}>
                        <i className="fa-solid fa-signature" style={{ fontSize: '20px', color: '#2563eb' }}></i>
                        <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: 'bold' }}>✓ Đã Ký Bàn Giao</div>
                      </div>
                    ) : (
                      <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '11px' }}>Đã bàn giao</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#333' }}>
                    {sigVanChuyen?.tenNguoiKy || 'Đại diện NCC'}
                  </div>
                  <div style={{ fontSize: '10px', color: '#777' }}>
                    Ngày: {formatDateOnly(invoice.ngayNhap || invoice.createdAt)}
                  </div>
                </div>

                {/* 4. GIÁM ĐỐC */}
                <div style={{ padding: '6px', border: '1.5px solid #d97706', borderRadius: '6px', backgroundColor: '#fffbeb' }}>
                  <div style={{ fontWeight: 'bold', color: '#78350f' }}>
                    <i className="fa-solid fa-stamp"></i> GIÁM ĐỐC
                  </div>
                  <div style={{ fontStyle: 'italic', fontSize: '10.5px', color: '#92400e', marginBottom: '4px' }}>
                    (Ký & ghi rõ họ tên)
                  </div>
                  <div style={{ height: '65px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          display: 'inline-block',
                          border: '2px solid #dc2626',
                          color: '#dc2626',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontWeight: '800',
                          fontSize: '11px',
                          transform: 'rotate(-5deg)',
                          backgroundColor: '#fef2f2'
                        }}
                      >
                        ★ PHÊ DUYỆT ★
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                        ✓ Ký Số Ban Giám Đốc
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#451a03' }}>Ban Giám Đốc</div>
                  <div style={{ fontSize: '10px', color: '#777' }}>
                    Ngày: {formatDateOnly(invoice.ngayNhap || invoice.createdAt)}
                  </div>
                </div>
              </div>

              {/* FOOTER: SLOGAN & CUTE ICONS */}
              <div
                style={{
                  marginTop: '20px',
                  paddingTop: '12px',
                  borderTop: '1.5px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '11px'
                }}
              >
                <div style={{ fontStyle: 'italic', color: '#78350f', fontWeight: '500' }}>
                  Những chiếc bánh ngon làm nên những khoảnh khắc ngọt ngào! 🧡
                </div>
                <div
                  style={{
                    backgroundColor: '#451a03',
                    color: '#fef3c7',
                    padding: '3px 12px',
                    borderRadius: '20px',
                    fontSize: '10.5px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🥐</span>
                  <span>Givral Bakery – Đồng hành cùng những điều ngọt ngào!</span>
                  <span>🍰</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PhieuNhapKhoPrintModal;