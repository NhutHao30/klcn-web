import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getStores, updateStoreStatus, createStore, updateStore } from '../../services/storeService';
import { useToast } from '../../components/Toast/Toast';

const AdminStorePage = () => {
    const toast = useToast();
const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
  const [newStore, setNewStore] = useState({ name: '', address: '', phone: '', ghnShopId: '' });
  
  const [isEditGhnModalOpen, setIsEditGhnModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [ghnShopId, setGhnShopId] = useState('');

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const data = await getStores();
      const rawStores = data?.data || data || [];
      const list = Array.isArray(rawStores) ? rawStores : [];
      
      const normalizedStores = list.map(st => {
        const emps = Array.isArray(st.employees) ? st.employees : (Array.isArray(st.nguoi_dungs) ? st.nguoi_dungs : (Array.isArray(st.nguoiDungs) ? st.nguoiDungs : []));
        const inv = Array.isArray(st.inventory) ? st.inventory : (Array.isArray(st.lo_hangs) ? st.lo_hangs : (Array.isArray(st.loHangs) ? st.loHangs : []));
        
        return {
          ...st,
          id: st.id || st.MACUAHANG,
          name: st.name || st.ten_cuahang || st.TENCUAHANG || `Chi nhánh #${st.id}`,
          address: st.address || st.dia_chi_chi_tiet || st.DIACHI || 'Chưa cập nhật địa chỉ',
          phone: st.phone || st.so_dien_thoai || st.SDT || '-',
          status: st.status || (st.trang_thai === 1 ? 'Đang hoạt động' : 'Tạm đóng cửa'),
          GHN_SHOP_ID: st.GHN_SHOP_ID || st.ghn_shop_id || '',
          employees: emps,
          customerCount: st.customerCount || 0,
          revenue: st.revenue || 0,
          inventory: inv,
          revenueChart: Array.isArray(st.revenueChart) ? st.revenueChart : [],
          invoiceChart: Array.isArray(st.invoiceChart) ? st.invoiceChart : [],
          totalSalary: st.totalSalary || 0,
          newCustomers: st.newCustomers || 0,
          totalDaysWorked: st.totalDaysWorked || 0,
          totalDaysOff: st.totalDaysOff || 0
        };
      });

      setStores(normalizedStores);
    } catch (error) {
      console.error('Error fetching stores:', error);
      toast.error('Không thể tải danh sách chi nhánh cửa hàng');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const openModal = (store) => {
    setSelectedStore(store);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStore(null);
  };

  const handleStatusChange = async (storeId, currentStatus) => {
    const newStatus = currentStatus === 'Đang hoạt động' ? 'Tạm đóng cửa' : 'Đang hoạt động';
    if (window.confirm(`Bạn có chắc muốn đổi trạng thái thành "${newStatus}"?`)) {
      try {
        await updateStoreStatus(storeId, newStatus);
        toast.success('Cập nhật trạng thái thành công');
        fetchStores();
        if (selectedStore && selectedStore.id === storeId) {
          setSelectedStore({ ...selectedStore, status: newStatus });
        }
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Lỗi cập nhật trạng thái');
      }
    }
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    try {
      await createStore({
        TENCUAHANG: newStore.name,
        DIACHI: newStore.address,
        SDT: newStore.phone,
        GHN_SHOP_ID: newStore.ghnShopId
      });
      toast.success('Tạo chi nhánh mới thành công!');
      setIsAddStoreModalOpen(false);
      setNewStore({ name: '', address: '', phone: '', ghnShopId: '' });
      fetchStores();
    } catch (error) {
      console.error('Error creating store', error);
      const errorMsg = error.response?.data?.errors?.GHN_SHOP_ID?.[0] || 'Lỗi tạo chi nhánh mới, vui lòng thử lại';
      toast.error(errorMsg);
    }
  };

  const handleUpdateGhn = async (e) => {
    e.preventDefault();
    try {
      await updateStore(editingStore.id, { GHN_SHOP_ID: ghnShopId });
      toast.success('Cập nhật mã GHN Shop ID thành công!');
      setIsEditGhnModalOpen(false);
      fetchStores();
    } catch (error) {
      console.error('Error updating store', error);
      const errorMsg = error.response?.data?.errors?.GHN_SHOP_ID?.[0] || 'Lỗi cập nhật mã GHN';
      toast.error(errorMsg);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản lý Chuỗi Cửa hàng</h1>
        <button className="admin-btn admin-btn-primary" onClick={() => setIsAddStoreModalOpen(true)}>
          + Thêm chi nhánh mới
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Đang tải dữ liệu...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
          {stores.map(store => (
            <div key={store.id} className="admin-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, color: 'var(--admin-text)', fontSize: '1.6rem' }}>{store.name}</h3>
                <span className={`admin-badge ${store.status === 'Đang hoạt động' ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                  {store.status}
                </span>
              </div>
              <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '1.2rem' }}>📍 {store.address}</p>
              <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontSize: '1.2rem' }}>📞 {store.phone}</p>
              {store.GHN_SHOP_ID ? (
                <p style={{ margin: 0, color: 'var(--admin-info)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => {
                  setEditingStore(store); setGhnShopId(store.GHN_SHOP_ID); setIsEditGhnModalOpen(true);
                }}>
                  <i className="fa-solid fa-truck-fast"></i> GHN Shop ID: {store.GHN_SHOP_ID} <i className="fa-solid fa-pen ms-2"></i>
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--admin-warning)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => {
                  setEditingStore(store); setGhnShopId(''); setIsEditGhnModalOpen(true);
                }}>
                  <i className="fa-solid fa-triangle-exclamation"></i> Bấm để cấu hình GHN Shop ID <i className="fa-solid fa-pen ms-2"></i>
                </p>
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem', backgroundColor: 'var(--admin-tertiary)', padding: '1.2rem', borderRadius: '8px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Doanh thu</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--admin-primary)' }}>{Number(store.revenue || 0).toLocaleString('vi-VN')} đ</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Khách hàng</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--admin-text)' }}>{store.customerCount} người</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Nhân viên</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--admin-text)' }}>{store.employees?.length || 0} NV</p>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', paddingTop: '1.2rem' }}>
                <button className="admin-btn admin-btn-info" style={{ flex: 1 }} onClick={() => openModal(store)}>
                  Xem chi tiết
                </button>
                <button 
                  className={`admin-btn ${store.status === 'Đang hoạt động' ? 'admin-btn-danger' : 'admin-btn-success'}`}
                  style={{ flex: 1 }}
                  onClick={() => handleStatusChange(store.id, store.status)}
                >
                  {store.status === 'Đang hoạt động' ? 'Đóng cửa' : 'Mở cửa lại'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Chi tiết Cửa hàng */}
      {isModalOpen && selectedStore && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '900px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--admin-outline)', paddingBottom: '1.2rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Chi tiết Cửa hàng: {selectedStore.name}</h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.2rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Doanh thu chi nhánh</p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--admin-primary)' }}>{Number(selectedStore.revenue || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div style={{ padding: '1.2rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Tổng lương nhân viên</p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--admin-danger)' }}>{Number(selectedStore.totalSalary || 0).toLocaleString('vi-VN')} đ</p>
              </div>
              <div style={{ padding: '1.2rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Khách hàng mới <span className="admin-badge admin-badge-success" style={{ fontSize: '0.6rem' }}>NEW</span></p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--admin-text)' }}>{selectedStore.newCustomers || 0}</p>
              </div>
              <div style={{ padding: '1.2rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Số ngày công (Tháng này)</p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--admin-success)' }}>{selectedStore.totalDaysWorked || 0} ngày</p>
              </div>
              <div style={{ padding: '1.2rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '1.2rem', color: 'var(--admin-text-muted)' }}>Số ngày nghỉ (Tháng này)</p>
                <p style={{ margin: '0.5rem 0 0', fontWeight: 'bold', fontSize: '1.2rem', color: 'var(--admin-warning)' }}>{selectedStore.totalDaysOff || 0} ngày</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1.2rem', marginBottom: '1.2rem', color: 'var(--admin-text)' }}>📈 Biểu đồ Doanh thu (30 Ngày qua)</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '3px', paddingBottom: '10px', borderBottom: '1px solid var(--admin-outline)' }}>
                  {selectedStore.revenueChart && selectedStore.revenueChart.map((item, index) => {
                    const maxRev = Math.max(...selectedStore.revenueChart.map(d => Number(d.total) || 1));
                    const heightPercent = maxRev > 0 ? (Number(item.total) / maxRev) * 100 : 0;
                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div 
                          style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: 'var(--admin-primary)', minHeight: '1px', borderRadius: '2px 2px 0 0' }}
                          title={`${item.date}: ${Number(item.total).toLocaleString('vi-VN')} ₫`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.1.2rem', marginBottom: '1.2rem', color: 'var(--admin-text)' }}>🧾 Số lượng Hóa đơn (30 Ngày qua)</h3>
                <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '3px', paddingBottom: '10px', borderBottom: '1px solid var(--admin-outline)' }}>
                  {selectedStore.invoiceChart && selectedStore.invoiceChart.map((item, index) => {
                    const maxInv = Math.max(...selectedStore.invoiceChart.map(d => Number(d.count) || 1));
                    const heightPercent = maxInv > 0 ? (Number(item.count) / maxInv) * 100 : 0;
                    return (
                      <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                        <div 
                          style={{ width: '100%', height: `${heightPercent}%`, backgroundColor: 'var(--admin-info)', minHeight: '1px', borderRadius: '2px 2px 0 0' }}
                          title={`${item.date}: ${item.count} đơn`}
                        ></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              
              {/* Cột trái: Nhân viên */}
              <div>
                <h3 style={{ fontSize: '1.1.2rem', marginBottom: '1.2rem', color: 'var(--admin-text)' }}>👥 Danh sách Nhân viên ({selectedStore.employees?.length || 0})</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Họ Tên</th>
                        <th>Chức vụ</th>
                        <th style={{ textAlign: 'center' }}>Ngày công</th>
                        <th style={{ textAlign: 'center' }}>Ngày nghỉ</th>
                        <th>Lương cơ bản</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStore.employees && selectedStore.employees.length > 0 ? selectedStore.employees.map((nv, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{nv.HOTEN || nv.ho_ten || nv.name}</td>
                          <td>{nv.CHUCVU || nv.chuc_vu || 'Nhân viên'}</td>
                          <td style={{ textAlign: 'center', color: 'var(--admin-success)', fontWeight: 'bold' }}>{nv.workingDays || 0}</td>
                          <td style={{ textAlign: 'center', color: 'var(--admin-danger)', fontWeight: 'bold' }}>{nv.absentDays || 0}</td>
                          <td>{Number(nv.LUONG || nv.luong || 0).toLocaleString('vi-VN')} đ</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="5" style={{ textAlign: 'center' }}>Chưa có nhân viên</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Cột phải: Tồn kho */}
              <div>
                <h3 style={{ fontSize: '1.1.2rem', marginBottom: '1.2rem', color: 'var(--admin-text)' }}>📦 Tồn kho Sản phẩm</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="admin-table" style={{ fontSize: '0.9rem' }}>
                    <thead>
                      <tr>
                        <th>Mã SP</th>
                        <th>Tên Bánh</th>
                        <th>Còn lại</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStore.inventory && selectedStore.inventory.length > 0 ? selectedStore.inventory.map((sp, idx) => (
                        <tr key={idx}>
                          <td>{sp.MASP || sp.id}</td>
                          <td>{sp.TENSP || sp.ten_san_pham}</td>
                          <td>
                            <span style={{ fontWeight: 'bold', color: (sp.SOLUONG_TON || sp.so_luong_con || 0) <= 5 ? 'var(--admin-danger)' : 'var(--admin-success)' }}>
                              {sp.SOLUONG_TON ?? sp.so_luong_con ?? 0}
                            </span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="3" style={{ textAlign: 'center' }}>Không có tồn kho</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid var(--admin-outline)' }}>
              <button type="button" className="admin-btn admin-btn-primary" onClick={closeModal}>Đóng</button>
            </div>
          </div>
        </div>
      )}

      {isAddStoreModalOpen && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '600px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Thêm chi nhánh mới</h2>
              <button type="button" onClick={() => setIsAddStoreModalOpen(false)} style={closeBtnStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleAddStore}>
              <div className="admin-form-group">
                <label>Tên cửa hàng *</label>
                <input 
                  type="text" 
                  value={newStore.name} 
                  onChange={(e) => setNewStore({...newStore, name: e.target.value})} 
                  className="admin-input" 
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Số điện thoại *</label>
                <input 
                  type="text" 
                  value={newStore.phone} 
                  onChange={(e) => setNewStore({...newStore, phone: e.target.value})} 
                  className="admin-input" 
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Địa chỉ *</label>
                <textarea 
                  value={newStore.address} 
                  onChange={(e) => setNewStore({...newStore, address: e.target.value})} 
                  className="admin-input" 
                  rows="3"
                  required 
                />
              </div>
              <div className="admin-form-group">
                <label>Mã Shop Giao Hàng Nhanh (GHN Shop ID)</label>
                <input 
                  type="text" 
                  value={newStore.ghnShopId} 
                  onChange={(e) => setNewStore({...newStore, ghnShopId: e.target.value})} 
                  className="admin-input" 
                  placeholder="Ví dụ: 6561493 (Tùy chọn, để trống sẽ dùng ID mặc định)"
                />
              </div>
              
              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1.2rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsAddStoreModalOpen(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary">Lưu chi nhánh</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditGhnModalOpen && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '500px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Cấu hình Giao Hàng Nhanh</h2>
              <button type="button" onClick={() => setIsEditGhnModalOpen(false)} style={closeBtnStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleUpdateGhn}>
              <div className="alert alert-info">
                Cập nhật mã Shop ID từ hệ thống Giao Hàng Nhanh cho chi nhánh <strong>{editingStore?.name}</strong>.
              </div>
              <div className="admin-form-group">
                <label>Mã Shop ID *</label>
                <input 
                  type="text" 
                  value={ghnShopId} 
                  onChange={(e) => setGhnShopId(e.target.value)} 
                  className="admin-input" 
                  placeholder="Ví dụ: 6561493"
                  required 
                />
              </div>
              
              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1.2rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={() => setIsEditGhnModalOpen(false)}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary">Lưu cấu hình</button>
              </div>
            </form>
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
  maxWidth: '800px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  maxHeight: '90vh',
  overflowY: 'auto'
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: '2.5rem',
  cursor: 'pointer',
  color: 'var(--admin-text)'
};

export default AdminStorePage;
