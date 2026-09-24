import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getNhaCungCaps, getLoHangs, nhapLoHang } from '../../services/batchService';
import { getStores } from '../../services/storeService';
import { getProducts } from '../../services/productService';
import { useToast } from '../../components/Toast/Toast';
import SignatureCanvas from '../../components/Signature/SignatureCanvas';
import '../../css/admin.css';

const formatDateOnly = (dateStr) => {
  if (!dateStr) return '-';
  const cleanStr = String(dateStr).split('T')[0].split(' ')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return cleanStr;
};

const AdminNhapLoPage = () => {
  const toast = useToast();
  const [nccList, setNccList] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [recentLoHangs, setRecentLoHangs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const defaultExpStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Import Batch Form (Hỗ trợ nhiều bánh trong 1 lô/phiếu nhập)
  const [nhapForm, setNhapForm] = useState({
    MANCC: '',
    MACUAHANG: '',
    GHICHU: '',
    items: [
      {
        MASP: '',
        SOLUONGTCT: 30,
        SOLUONGTN: 30,
        DONGIANHAP: 15000,
        NGAYSX: todayStr,
        HSD_LO: defaultExpStr,
        GHICHU: ''
      }
    ]
  });

  const [kyNccData, setKyNccData] = useState(null);
  const [sigKey, setSigKey] = useState(0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [resNcc, resStores, resProds, resLo] = await Promise.allSettled([
        getNhaCungCaps(),
        getStores(),
        getProducts({ page: 1, size: 100 }),
        getLoHangs({ per_page: 20 })
      ]);

      if (resNcc.status === 'fulfilled') {
        const val = resNcc.value;
        const nccs = val?.data || val || [];
        setNccList(Array.isArray(nccs) ? nccs : []);
      }

      if (resStores.status === 'fulfilled') {
        const val = resStores.value;
        const stList = val?.data || val || [];
        setStores(Array.isArray(stList) ? stList : []);
      }

      if (resProds.status === 'fulfilled') {
        const val = resProds.value;
        const prList = val?.data?.data || val?.data || val || [];
        setProducts(Array.isArray(prList) ? prList : []);
      }

      if (resLo.status === 'fulfilled') {
        const val = resLo.value;
        const loList = val?.data?.data || val?.data || val || [];
        setRecentLoHangs(Array.isArray(loList) ? loList : []);
      }
    } catch (e) {
      console.error('Lỗi khi tải dữ liệu khởi tạo:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = () => {
    setNhapForm(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          MASP: '',
          SOLUONGTCT: 30,
          SOLUONGTN: 30,
          DONGIANHAP: 15000,
          NGAYSX: todayStr,
          HSD_LO: defaultExpStr,
          GHICHU: ''
        }
      ]
    }));
  };

  const handleRemoveItem = (index) => {
    if (nhapForm.items.length <= 1) {
      toast.warning('Phiếu nhập hàng phải có ít nhất 1 sản phẩm bánh!');
      return;
    }
    setNhapForm(prev => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNhapForm(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      return { ...prev, items: updatedItems };
    });
  };

  const handleNhapLo = async (e) => {
    e.preventDefault();

    if (!nhapForm.MANCC || !nhapForm.MACUAHANG) {
      toast.warning('Vui lòng chọn Nhà Cung Cấp và Chi Nhánh Nhập Hàng!');
      return;
    }

    if (!nhapForm.items || nhapForm.items.length === 0) {
      toast.warning('Vui lòng thêm ít nhất 1 sản phẩm bánh vào phiếu nhập!');
      return;
    }

    if (!kyNccData) {
      toast.warning('Vui lòng yêu cầu đại diện Nhà Cung Cấp vẽ chữ ký xác nhận trực tiếp trước khi tạo phiếu nhập!');
      return;
    }

    for (let i = 0; i < nhapForm.items.length; i++) {
      const item = nhapForm.items[i];
      if (!item.MASP) {
        toast.warning(`Dòng thứ ${i + 1}: Vui lòng chọn sản phẩm bánh!`);
        return;
      }
      if (item.NGAYSX && item.HSD_LO < item.NGAYSX) {
        toast.error(`❌ Dòng thứ ${i + 1}: Hạn sử dụng của lô bánh không được nhỏ hơn Ngày sản xuất!`);
        return;
      }
      if (item.HSD_LO < todayStr) {
        toast.error(`❌ Dòng thứ ${i + 1}: Lô bánh mới nhập phải có Hạn sử dụng từ hôm nay trở về sau!`);
        return;
      }
    }

    const payload = {
      MANCC: nhapForm.MANCC,
      MACUAHANG_NHAP: nhapForm.MACUAHANG,
      GHICHU: nhapForm.GHICHU,
      ky_ncc: kyNccData,
      chi_tiet: nhapForm.items.map(item => ({
        MASP: item.MASP,
        SOLUONGTCT: parseInt(item.SOLUONGTCT) || 0,
        SOLUONGTN: parseInt(item.SOLUONGTN) || 0,
        DONGIANHAP: parseFloat(item.DONGIANHAP) || 0,
        NGAYSX: item.NGAYSX,
        HSD_LO: item.HSD_LO,
        GHICHU: item.GHICHU || ''
      }))
    };

    try {
      const res = await nhapLoHang(payload);
      if (res.status || res.message) {
        const tongLo = res.data?.tong_lo || nhapForm.items.length;
        const maPhieu = res.data?.MAHDNHAP || res.data?.hdnhap?.MAHDNHAP || '';
        toast.success(`🎉 Nhập hàng thành công! Đã tạo Phiếu Nhập ${maPhieu} với ${tongLo} lô bánh mới!`);
        
        setNhapForm({
          MANCC: '',
          MACUAHANG: '',
          GHICHU: '',
          items: [
            {
              MASP: '',
              SOLUONGTCT: 30,
              SOLUONGTN: 30,
              DONGIANHAP: 15000,
              NGAYSX: todayStr,
              HSD_LO: defaultExpStr,
              GHICHU: ''
            }
          ]
        });
        setKyNccData(null);
        setSigKey(prev => prev + 1);
        fetchInitialData();
      } else {
        toast.error(res.error || res.message || 'Lỗi nhập hàng');
      }
    } catch (e) {
      toast.error('Lỗi API nhập hàng: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="admin-title" style={{ marginBottom: 0 }}>Nhập Lô Hàng Bánh Mới</h1>
          <p style={{ color: '#666', fontSize: '13px', margin: '4px 0 0 0' }}>Tạo phiếu nhập nhiều lô hàng bánh mới, ký duyệt đại diện NCC và ghi nhận kho</p>
        </div>
      </div>

      <div className="admin-card" style={{ maxWidth: '1150px', margin: '0 auto 2rem auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 className="admin-card-title" style={{ marginBottom: '4px' }}>Tạo Phiếu Nhập & Sinh Lô Hàng Bánh Mới</h2>
            <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Hỗ trợ nhập 1 lô/chuyến hàng gồm nhiều loại bánh khác nhau. Theo dõi SL chứng từ vs SL thực nhận.</p>
          </div>
        </div>

        <form onSubmit={handleNhapLo}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '1rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-label">Nhà Cung Cấp Bánh <span style={{ color: 'red' }}>*</span></label>
              <select
                className="admin-select"
                value={nhapForm.MANCC}
                onChange={e => setNhapForm({ ...nhapForm, MANCC: e.target.value })}
                required
              >
                <option value="">-- Chọn Nhà Cung Cấp --</option>
                {nccList.map(n => (
                  <option key={n.MANCC} value={n.MANCC}>{n.TENNCC} ({n.MANCC})</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-label">Chi Nhánh Kho Nhập <span style={{ color: 'red' }}>*</span></label>
              <select
                className="admin-select"
                value={nhapForm.MACUAHANG}
                onChange={e => setNhapForm({ ...nhapForm, MACUAHANG: e.target.value })}
                required
              >
                <option value="">-- Chọn Chi Nhánh --</option>
                {stores.map(s => (
                  <option key={s.MACUAHANG} value={s.MACUAHANG}>{s.TENCUAHANG}</option>
                ))}
              </select>
            </div>

            <div className="admin-form-group" style={{ margin: 0 }}>
              <label className="admin-label">Ghi Chú Đợt Nhập Hàng</label>
              <input
                type="text"
                className="admin-input"
                placeholder="VD: Nhập bánh kem chuẩn bị bán dịp Tết..."
                value={nhapForm.GHICHU}
                onChange={e => setNhapForm({ ...nhapForm, GHICHU: e.target.value })}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: 0, color: 'var(--admin-primary)' }}>
                📋 Danh Sách Sản Phẩm Bánh Trong Phiếu Nhập ({nhapForm.items.length})
              </h3>
              <button type="button" className="admin-btn admin-btn-info" onClick={handleAddItem} style={{ padding: '5px 12px', fontSize: '12px' }}>
                <i className="fa-solid fa-plus" style={{ marginRight: '4px' }}></i> Thêm Dòng Bánh
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9' }}>
                    <th style={{ width: '40px' }}>STT</th>
                    <th style={{ width: '220px' }}>Sản Phẩm Bánh *</th>
                    <th style={{ width: '100px' }}>SL Chứng Từ *</th>
                    <th style={{ width: '100px' }}>SL Thực Nhận *</th>
                    <th style={{ width: '120px' }}>Đơn Giá Nhập (đ) *</th>
                    <th style={{ width: '130px' }}>Ngày Sản Xuất</th>
                    <th style={{ width: '130px' }}>Hạn Sử Dụng *</th>
                    <th>Ghi Chú</th>
                    <th style={{ width: '50px', textAlign: 'center' }}>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {nhapForm.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ textAlign: 'center', fontWeight: 'bold', color: '#64748b' }}>{idx + 1}</td>
                      <td>
                        <select
                          className="admin-select"
                          value={item.MASP}
                          onChange={e => handleItemChange(idx, 'MASP', e.target.value)}
                          required
                          style={{ padding: '4px 8px' }}
                        >
                          <option value="">-- Chọn Bánh --</option>
                          {products.map(p => (
                            <option key={p.MASP} value={p.MASP}>{p.TENSP} ({p.MASP})</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="admin-input"
                          min="1"
                          value={item.SOLUONGTCT}
                          onChange={e => handleItemChange(idx, 'SOLUONGTCT', e.target.value)}
                          required
                          style={{ padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="admin-input"
                          min="0"
                          value={item.SOLUONGTN}
                          onChange={e => handleItemChange(idx, 'SOLUONGTN', e.target.value)}
                          required
                          style={{ padding: '4px 8px', fontWeight: 'bold', color: item.SOLUONGTN < item.SOLUONGTCT ? '#ef4444' : '#16a34a' }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="admin-input"
                          min="0"
                          step="500"
                          value={item.DONGIANHAP}
                          onChange={e => handleItemChange(idx, 'DONGIANHAP', e.target.value)}
                          required
                          style={{ padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="admin-input"
                          value={item.NGAYSX}
                          onChange={e => handleItemChange(idx, 'NGAYSX', e.target.value)}
                          style={{ padding: '4px 8px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="admin-input"
                          value={item.HSD_LO}
                          onChange={e => handleItemChange(idx, 'HSD_LO', e.target.value)}
                          required
                          style={{ padding: '4px 8px', borderColor: item.HSD_LO < todayStr ? '#ef4444' : '' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="admin-input"
                          placeholder="VD: Bao bì nguyên vẹn..."
                          value={item.GHICHU}
                          onChange={e => handleItemChange(idx, 'GHICHU', e.target.value)}
                          style={{ padding: '4px 8px' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger"
                          style={{ padding: '2px 6px', fontSize: '11px' }}
                          onClick={() => handleRemoveItem(idx)}
                          title="Xóa dòng này"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem' }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#b45309', fontSize: '14px' }}>
              ✍️ Chữ Ký Xác Nhận Giao Hàng Của Đại Diện Nhà Cung Cấp <span style={{ color: 'red' }}>*</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#92400e' }}>
              Đại diện giao hàng của NCC ký trực tiếp bên dưới để xác nhận số lượng thực giao và biên bản đồng kiểm.
            </p>

            <SignatureCanvas
              key={sigKey}
              height={140}
              onSave={(base64Img) => setKyNccData(base64Img)}
              onClear={() => setKyNccData(null)}
            />
          </div>

          <div style={{ textAlign: 'right' }}>
            <button type="submit" className="admin-btn admin-btn-success" style={{ padding: '10px 24px', fontSize: '15px' }}>
              <i className="fa-solid fa-box-archive" style={{ marginRight: '8px' }}></i> Xác Nhận Lập Phiếu & Nhập Lô Hàng
            </button>
          </div>
        </form>
      </div>

      {/* Lịch Sử Các Lô Hàng Mới Nhập */}
      <div className="admin-card">
        <h2 className="admin-card-title">Lịch Sử Các Lô Hàng Vừa Nhập Kho Gần Đây</h2>
        {isLoading ? (
          <p style={{ textAlign: 'center', padding: '20px' }}>Đang tải lịch sử lô hàng...</p>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã Lô</th>
                  <th>Mã Phiếu Nhập</th>
                  <th>Sản Phẩm Bánh</th>
                  <th>NCC Giao</th>
                  <th>SL Theo CT</th>
                  <th>SL Thực Nhận</th>
                  <th>Đơn Giá Nhập</th>
                  <th>Ngày SX</th>
                  <th>Hạn Sử Dụng (HSD)</th>
                  <th>Chữ Ký NCC</th>
                </tr>
              </thead>
              <tbody>
                {recentLoHangs.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                      Chưa có lô hàng nào được lưu trong hệ thống
                    </td>
                  </tr>
                ) : (
                  recentLoHangs.slice(0, 15).map(lo => (
                    <tr key={lo.MALO}>
                      <td><b>{lo.MALO}</b></td>
                      <td><code>{lo.MAHDNHAP || lo.hdnhap?.MAHDNHAP || '-'}</code></td>
                      <td>
                        <b>{lo.san_pham?.TENSP || lo.MASP}</b>
                      </td>
                      <td>{lo.hdnhap?.nha_cung_cap?.TENNCC || '-'}</td>
                      <td>{lo.SOLUONGTCT ?? lo.SOLUONG}</td>
                      <td style={{ fontWeight: 'bold', color: (lo.SOLUONGTN ?? lo.SOLUONG) < (lo.SOLUONGTCT ?? lo.SOLUONG) ? '#ef4444' : '#16a34a' }}>
                        {lo.SOLUONGTN ?? lo.SOLUONG}
                      </td>
                      <td>{Number(lo.DONGIANHAP || 0).toLocaleString()}đ</td>
                      <td>{formatDateOnly(lo.NGAYSX)}</td>
                      <td>
                        <span className={`admin-badge ${lo.HSD_LO < todayStr ? 'admin-badge-danger' : 'admin-badge-success'}`}>
                          {formatDateOnly(lo.HSD_LO)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {lo.hdnhap?.KY_NCC ? (
                          <img src={lo.hdnhap.KY_NCC} alt="Chữ ký NCC" style={{ height: '28px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff' }} />
                        ) : (
                          <span style={{ color: '#ccc', fontSize: '11px' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminNhapLoPage;
