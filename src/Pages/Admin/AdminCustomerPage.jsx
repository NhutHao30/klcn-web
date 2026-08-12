import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer, restoreCustomer } from '../../services/customerService';
import { getInvoices } from '../../services/invoiceService';
import { getStores } from '../../services/storeService';
import { useToast } from '../../components/Toast/Toast';

const AdminCustomerPage = () => {
    const toast = useToast();
const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRank, setSearchRank] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  
  const [formData, setFormData] = useState({
    MaKH: '',
    HoTen: '',
    Sdt: '',
    NgaySinh: '',
    GioiTinh: '',
    DiaChi: '',
    macuahang: 1
  });

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data);
      } catch (error) {
        console.error("Error fetching stores", error);
      }
    };
    fetchStores();
  }, []);

  const handleSearch = () => {
    let result = customers;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.hoTen && c.hoTen.toLowerCase().includes(lowerQuery)) || 
        (c.sdt && c.sdt.includes(lowerQuery)) ||
        (c.maKH && c.maKH.toLowerCase().includes(lowerQuery)) ||
        (c.email && c.email.toLowerCase().includes(lowerQuery))
      );
    }
    if (searchRank) {
      result = result.filter(c => c.membershipRank === searchRank);
    }
    setFilteredCustomers(result);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchRank, customers]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ MaKH: '', HoTen: '', Sdt: '', NgaySinh: '', GioiTinh: '', DiaChi: '', macuahang: stores.length > 0 ? stores[0].id : 1 });
    setIsModalOpen(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      MaKH: customer.maKH || '',
      HoTen: customer.hoTen || '',
      Sdt: customer.sdt || '',
      NgaySinh: customer.ngaySinh || '',
      GioiTinh: customer.gioiTinh || '',
      DiaChi: customer.diaChi || '',
      macuahang: customer.macuahang || (stores.length > 0 ? stores[0].id : 1)
    });
    setIsModalOpen(true);
  };

  const openDetailModal = async (customer) => {
    setViewingCustomer(customer);
    setIsDetailModalOpen(true);
    setCustomerOrders([]);
    setIsLoadingOrders(true);
    try {
      const res = await getInvoices({ maKH: customer.maKH, size: 50 });
      setCustomerOrders(res.content || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingCustomer(null);
    setViewingCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        maKH: formData.MaKH,
        hoTen: formData.HoTen,
        sdt: formData.Sdt,
        ngaySinh: formData.NgaySinh ? formData.NgaySinh : null,
        gioiTinh: formData.GioiTinh,
        diaChi: formData.DiaChi,
        macuahang: formData.macuahang
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.maKH, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await createCustomer(payload);
        toast.success('Thêm khách hàng thành công!');
      }
      closeModal();
      fetchCustomers();
    } catch (error) {
      console.error("Error saving customer:", error);
      if (error.response) {
        console.error("Backend error data:", error.response.data);
        toast.error(`Lỗi từ máy chủ: ${error.response.data.message || error.response.statusText}`);
      } else {
        toast.error('Có lỗi xảy ra, vui lòng kiểm tra console!');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn vô hiệu hóa tài khoản khách hàng này? Khách hàng sẽ không thể đăng nhập.")) {
      try {
        await deleteCustomer(id);
        toast.success('Vô hiệu hóa thành công!');
        fetchCustomers();
      } catch (error) {
        console.error("Error deleting customer:", error);
        toast.error('Có lỗi xảy ra khi vô hiệu hóa!');
      }
    }
  };

  const handleRestore = async (id) => {
    if (window.confirm("Bạn muốn kích hoạt lại tài khoản khách hàng này?")) {
      try {
        await restoreCustomer(id);
        toast.success('Kích hoạt lại thành công!');
        fetchCustomers();
      } catch (error) {
        console.error("Error restoring customer:", error);
        toast.error('Có lỗi xảy ra khi kích hoạt lại!');
      }
    }
  };

  const getRankBadgeClass = (rank) => {
    switch (rank) {
      case 'Đồng': return 'admin-badge-secondary';
      case 'Bạc': return 'admin-badge-info';
      case 'Vàng': return 'admin-badge-warning';
      case 'Kim cương': return 'admin-badge-primary';
      case 'Thách đấu': return 'admin-badge-danger';
      default: return 'admin-badge-secondary';
    }
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản lý khách hàng</h1>
        <button className="admin-btn admin-btn-primary" onClick={openAddModal}>+ Thêm khách hàng</button>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh sách khách hàng</h2>
        
        <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
          <div className="admin-flex-gap">
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Tìm kiếm Tên, SĐT, Email..." 
              style={{ width: '250px', marginBottom: 0 }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select 
              className="admin-input" 
              style={{ width: '200px', marginBottom: 0 }}
              value={searchRank}
              onChange={(e) => setSearchRank(e.target.value)}
            >
              <option value="">Tất cả hạng thành viên</option>
              <option value="Đồng">Đồng</option>
              <option value="Bạc">Bạc</option>
              <option value="Vàng">Vàng</option>
              <option value="Kim cương">Kim cương</option>
              <option value="Thách đấu">Thách đấu</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã KH</th>
                <th>Tên khách hàng</th>
                <th>Số điện thoại</th>
                <th>Email</th>
                <th>Số đơn hàng</th>
                <th>Hạng thành viên</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Đang tải...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy khách hàng</td></tr>
              ) : filteredCustomers.map(customer => {
                const isDeactivated = !!customer.deleted_at;
                return (
                <tr key={customer.maKH} style={{ opacity: isDeactivated ? 0.6 : 1 }}>
                  <td><strong>{customer.maKH}</strong></td>
                  <td style={{ fontWeight: 600 }}>{customer.hoTen} {isDeactivated && <span style={{color:'red', fontSize:'12px'}}>(Vô hiệu hóa)</span>}</td>
                  <td>{customer.sdt || '-'}</td>
                  <td>{customer.email || '-'}</td>
                  <td>{customer.totalOrders}</td>
                  <td>
                    <span className={`admin-badge ${getRankBadgeClass(customer.membershipRank)}`}>
                      {customer.membershipRank}
                    </span>
                  </td>
                  <td>
                    <div className="admin-flex-gap">
                      <button className="admin-btn admin-btn-info" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openDetailModal(customer)}>Chi tiết</button>
                      
                      {isDeactivated ? (
                        <button className="admin-btn admin-btn-success" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => handleRestore(customer.maKH)}>Kích hoạt lại</button>
                      ) : (
                        <>
                          <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openEditModal(customer)}>Sửa</button>
                          <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => handleDelete(customer.maKH)}>Vô hiệu hóa</button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm/Sửa */}
      {isModalOpen && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={modalStyle}>
            <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>
                {editingCustomer ? 'Sửa khách hàng' : 'Thêm khách hàng mới'}
              </h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {editingCustomer && (
                <div className="admin-form-group">
                  <label>Mã khách hàng</label>
                  <input type="text" name="MaKH" value={formData.MaKH} className="admin-input" disabled />
                </div>
              )}
              <div className="admin-form-group">
                <label>Họ tên khách hàng</label>
                <input type="text" name="HoTen" value={formData.HoTen} onChange={handleInputChange} className="admin-input" required />
              </div>
              <div className="admin-form-group">
                <label>Số điện thoại</label>
                <input type="text" name="Sdt" value={formData.Sdt} onChange={handleInputChange} className="admin-input" required />
              </div>
              <div className="admin-form-group">
                <label>Ngày sinh</label>
                <input type="date" name="NgaySinh" value={formData.NgaySinh} onChange={handleInputChange} className="admin-input" />
              </div>
              <div className="admin-form-group">
                <label>Giới tính</label>
                <select name="GioiTinh" value={formData.GioiTinh} onChange={handleInputChange} className="admin-input">
                  <option value="">Chọn giới tính</option>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Địa chỉ</label>
                <textarea name="DiaChi" value={formData.DiaChi} onChange={handleInputChange} className="admin-input" rows="2" />
              </div>
              <div className="admin-form-group">
                <label>Chi nhánh ghi nhận khách</label>
                <select name="macuahang" value={formData.macuahang} onChange={handleInputChange} className="admin-input">
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>
              <div className="admin-flex-between" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="admin-btn admin-btn-primary">Lưu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết */}
      {isDetailModalOpen && viewingCustomer && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '700px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Hồ sơ Khách hàng</h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--admin-outline)', paddingBottom: '0.5rem' }}>Thông tin cơ bản</h3>
                <p><strong>Mã KH:</strong> {viewingCustomer.maKH}</p>
                <p><strong>Họ tên:</strong> {viewingCustomer.hoTen}</p>
                <p><strong>Số điện thoại:</strong> {viewingCustomer.sdt || 'Chưa cập nhật'}</p>
                <p><strong>Email:</strong> {viewingCustomer.email || 'Chưa cập nhật'}</p>
                <p><strong>Ngày sinh:</strong> {viewingCustomer.ngaySinh || 'Chưa cập nhật'}</p>
                <p><strong>Giới tính:</strong> {viewingCustomer.gioiTinh || 'Chưa cập nhật'}</p>
                <p><strong>Địa chỉ:</strong> {viewingCustomer.diaChi || 'Chưa cập nhật'}</p>
              </div>
              
              <div style={{ padding: '1rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--admin-outline)', paddingBottom: '0.5rem' }}>Thống kê mua hàng</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <strong>Hạng:</strong> 
                  <span className={`admin-badge ${getRankBadgeClass(viewingCustomer.membershipRank)}`}>
                    {viewingCustomer.membershipRank}
                  </span>
                </p>
                <p><strong>Số lượng đơn:</strong> {viewingCustomer.totalOrders} đơn</p>
                <p><strong>Tổng chi tiêu:</strong> {Number(viewingCustomer.totalSpent).toLocaleString('vi-VN')}₫</p>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Lịch sử mua hàng gần đây</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã Đơn</th>
                      <th>Ngày lập</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingOrders ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                          (Đang kết nối API lịch sử đơn hàng...)
                        </td>
                      </tr>
                    ) : customerOrders.length > 0 ? (
                      customerOrders.map(order => (
                        <tr key={order.maHD}>
                          <td>{order.maHD}</td>
                          <td>{new Date(order.ngayLap).toLocaleDateString('vi-VN')}</td>
                          <td>{Number(order.tongTien).toLocaleString('vi-VN')}₫</td>
                          <td>
                            <span className={`admin-badge ${
                              order.trangThai === 'Hoàn thành' ? 'admin-badge-success' :
                              order.trangThai === 'Đã hủy' ? 'admin-badge-danger' :
                              'admin-badge-warning'
                            }`}>
                              {order.trangThai}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center' }}>Chưa có đơn hàng nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={closeModal}>Đóng</button>
            </div>
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
  maxWidth: '500px',
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

export default AdminCustomerPage;
