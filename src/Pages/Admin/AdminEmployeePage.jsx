import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../Layout/AdminLayout';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, importEmployeesFromExcel, scanCccd } from '../../services/employeeService';
import { getStores } from '../../services/storeService';
import { getCurrentUser } from '../../services/authService';

const AdminEmployeePage = () => {
  const [employees, setEmployees] = useState([]);
  const [stores, setStores] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchRole, setSearchRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    userName: '',
    password: '',
    email: '',
    hoTen: '',
    sdt: '',
    ngaySinh: '',
    gioiTinh: '',
    diaChi: '',
    chucVu: '',
    caLamViec: '',
    luong: '',
    trangThai: '',
    maRole: 2,
    cccd: '',
    cccdTruoc: null,
    cccdSau: null,
    macuahang: 1
  });

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    const fetchStores = async () => {
      try {
        const data = await getStores();
        setStores(data);
      } catch (error) {
        console.error("Error fetching stores", error);
      }
    };
    fetchStores();
    const loadUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
      } catch (error) {}
    };
    loadUser();
  }, []);

  const handleSearch = () => {
    let result = employees;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(e => 
        (e.hoTen && e.hoTen.toLowerCase().includes(lowerQuery)) || 
        (e.sdt && e.sdt.includes(lowerQuery)) ||
        (e.userName && e.userName.toLowerCase().includes(lowerQuery))
      );
    }
    if (searchRole) {
      result = result.filter(e => e.chucVu === searchRole);
    }
    setFilteredEmployees(result);
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, searchRole, employees]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'chucVu') {
      let role = 2; // Nhân viên
      if (value === 'Quản lý chi nhánh') role = 1;
      else if (value === 'Quản lý tổng') role = 0;
      else if (value === 'Nhân viên chăm sóc khách hàng') role = 4;
      
      setFormData({ ...formData, [name]: value, maRole: role });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };

  const openAddModal = () => {
    const autoUsername = 'nv' + Math.floor(100000 + Math.random() * 900000);
    const autoPassword = Math.random().toString(36).slice(-6);
    setEditingEmployee(null);
    setFormData({
      userName: autoUsername,
      password: autoPassword,
      email: '',
      hoTen: '',
      sdt: '',
      ngaySinh: '',
      gioiTinh: '',
      diaChi: '',
      chucVu: 'Nhân viên',
      caLamViec: 'Ca Sáng',
      luong: '',
      trangThai: 'Đang làm việc',
      maRole: 2,
      cccd: '',
      cccdTruoc: null,
      cccdSau: null,
      macuahang: stores.length > 0 ? stores[0].id : 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      userName: employee.userName || '',
      password: '',
      email: employee.email || '',
      hoTen: employee.hoTen || '',
      sdt: employee.sdt || '',
      ngaySinh: employee.ngaySinh || '',
      gioiTinh: employee.gioiTinh || '',
      diaChi: employee.diaChi || '',
      chucVu: employee.chucVu || 'Nhân viên',
      caLamViec: employee.caLamViec || 'Ca Sáng',
      luong: employee.luong || '',
      trangThai: employee.trangThai || 'Đang làm việc',
      maRole: employee.maRole !== undefined ? employee.maRole : 2,
      cccd: employee.cccd || '',
      cccdTruoc: null,
      cccdSau: null,
      macuahang: employee.macuahang || (stores.length > 0 ? stores[0].id : 1)
    });
    setIsModalOpen(true);
  };

  const openDetailModal = (employee) => {
    setViewingEmployee(employee);
    setIsDetailModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsDetailModalOpen(false);
    setEditingEmployee(null);
    setViewingEmployee(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.luong && Number(formData.luong) < 0) {
      alert("Mức lương không được phép âm!");
      return;
    }

    try {
      const payload = {
        userName: formData.userName,
        email: formData.email,
        hoTen: formData.hoTen,
        sdt: formData.sdt,
        ngaySinh: formData.ngaySinh ? formData.ngaySinh : null,
        gioiTinh: formData.gioiTinh,
        diaChi: formData.diaChi,
        chucVu: formData.chucVu,
        caLamViec: formData.caLamViec,
        luong: formData.luong ? parseFloat(formData.luong) : 0,
        trangThai: formData.trangThai,
        maRole: parseInt(formData.maRole, 10),
        cccd: formData.cccd,
        cccdTruoc: formData.cccdTruoc,
        cccdSau: formData.cccdSau,
        macuahang: formData.macuahang ? parseInt(formData.macuahang, 10) : 1,
        password: formData.password
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.userName, payload);
        alert('Cập nhật nhân viên thành công!');
      } else {
        await createEmployee(payload);
        alert('Thêm nhân viên và tạo tài khoản thành công!');
      }
      closeModal();
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      if (error.response) {
        console.error("Backend error data:", error.response.data);
        alert(`Lỗi từ máy chủ: ${error.response.data.message || error.response.statusText}`);
      } else {
        alert('Có lỗi xảy ra, vui lòng kiểm tra console!');
      }
    }
  };

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (window.confirm(`Bạn có chắc chắn muốn nhập dữ liệu từ file ${file.name}?`)) {
      setIsImporting(true);
      try {
        const response = await importEmployeesFromExcel(file);
        alert(response.message || 'Import thành công!');
        fetchEmployees();
      } catch (error) {
        console.error("Lỗi khi import:", error);
        alert("Lỗi khi import file Excel/CSV. Vui lòng kiểm tra lại định dạng.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleScanCccd = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const response = await scanCccd(file);
      if (response.success && response.parsed_data) {
        const data = response.parsed_data;
        setFormData(prev => ({
          ...prev,
          userName: data.cccd || prev.userName,
          cccd: data.cccd || prev.cccd,
          hoTen: data.hoTen || prev.hoTen,
          ngaySinh: data.ngaySinh || prev.ngaySinh,
          gioiTinh: data.gioiTinh || prev.gioiTinh,
          diaChi: data.diaChi || prev.diaChi,
          cccdTruoc: file
        }));
        alert('Đã quét và tự động điền thông tin thành công!');
      } else {
        alert('Không thể nhận diện thông tin từ ảnh này. Vui lòng thử lại ảnh rõ nét hơn!');
      }
    } catch (error) {
      console.error("Lỗi khi scan CCCD:", error);
      const errMsg = error.response?.data?.message || 'Lỗi mạng hoặc không thể kết nối tới server.';
      alert('Lỗi quét CCCD: ' + errMsg);
    } finally {
      setIsScanning(false);
      // Reset input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Xác nhận vô hiệu hóa tài khoản và cho nhân viên này nghỉ việc?")) {
      try {
        await deleteEmployee(id);
        alert('Đã vô hiệu hóa thành công!');
        fetchEmployees();
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi vô hiệu hóa!');
      }
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Đang làm việc') return 'admin-badge-success';
    if (status === 'Nghỉ phép') return 'admin-badge-warning';
    return 'admin-badge-danger'; // Nghỉ việc
  };

  return (
    <AdminLayout>
      <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
        <h1 className="admin-title" style={{ marginBottom: 0 }}>Quản lý nhân viên</h1>
        <div className="admin-flex-gap">
          <input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleImportExcel}
          />
          <button 
            className="admin-btn admin-btn-secondary" 
            onClick={() => fileInputRef.current.click()}
            disabled={isImporting}
          >
            {isImporting ? 'Đang tải...' : '📥 Nhập từ Excel/CSV'}
          </button>
          <button className="admin-btn admin-btn-primary" onClick={openAddModal}>+ Thêm nhân viên</button>
        </div>
      </div>

      <div className="admin-card">
        <h2 className="admin-card-title">Danh sách nhân viên</h2>
        
        <div className="admin-flex-between" style={{ marginBottom: '1rem' }}>
          <div className="admin-flex-gap">
            <input 
              type="text" 
              className="admin-input" 
              placeholder="Tìm kiếm Tên, Username, SĐT..." 
              style={{ width: '250px', marginBottom: 0 }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select className="admin-input" value={searchRole} onChange={(e) => setSearchRole(e.target.value)}>
              <option value="">Tất cả chức vụ</option>
              <option value="Nhân viên">Nhân viên</option>
              <option value="Nhân viên chăm sóc khách hàng">Nhân viên chăm sóc khách hàng</option>
              <option value="Quản lý chi nhánh">Quản lý chi nhánh</option>
              <option value="Quản lý tổng">Quản lý tổng</option>
              <option value="Thợ làm bánh">Thợ làm bánh</option>
            </select>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Tên nhân viên</th>
                <th>Cửa hàng</th>
                <th>SĐT</th>
                <th>Chức vụ</th>
                <th>Ca làm việc</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Đang tải...</td></tr>
              ) : filteredEmployees.length === 0 ? (
                <tr><td colSpan="8" style={{textAlign: 'center', padding: '20px'}}>Không tìm thấy nhân viên</td></tr>
              ) : filteredEmployees.map(employee => (
                <tr key={employee.userName}>
                  <td><strong>{employee.userName}</strong></td>
                  <td style={{ fontWeight: 600 }}>{employee.hoTen}</td>
                  <td>{employee.tenCuaHang}</td>
                  <td>{employee.sdt || '-'}</td>
                  <td>{employee.chucVu}</td>
                  <td>{employee.caLamViec || '-'}</td>
                  <td>
                    <span className={`admin-badge ${getStatusBadgeClass(employee.trangThai)}`}>
                      {employee.trangThai || 'Không rõ'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-flex-gap">
                      <button className="admin-btn admin-btn-info" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openDetailModal(employee)}>Chi tiết</button>
                      <button className="admin-btn admin-btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => openEditModal(employee)}>Sửa</button>
                      {employee.trangThai !== 'Nghỉ việc' && (!currentUser || currentUser.USERNAME !== employee.userName) && (
                        <button className="admin-btn admin-btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '12px' }} onClick={() => handleDelete(employee.userName)}>Vô hiệu hóa</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
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
                {editingEmployee ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên mới'}
              </h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            {!editingEmployee && (
              <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
                <h4 style={{ marginBottom: '10px', color: '#166534' }}>⚡ Điền nhanh bằng cách quét thẻ CCCD</h4>
                <p style={{ fontSize: '0.9rem', color: '#15803d', marginBottom: '10px' }}>
                  Hệ thống sẽ tự động trích xuất Tên, Số CCCD, Ngày sinh, Giới tính và Địa chỉ.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <label className="admin-btn admin-btn-info" style={{ cursor: 'pointer' }}>
                    {isScanning ? 'Đang phân tích ảnh...' : '📷 Chụp / Tải ảnh CCCD lên'}
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      style={{ display: 'none' }} 
                      onChange={handleScanCccd}
                      disabled={isScanning}
                    />
                  </label>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Tên đăng nhập (Username) *</label>
                  <input 
                    type="text" 
                    name="userName" 
                    value={formData.userName} 
                    onChange={handleInputChange} 
                    className="admin-input" 
                    required 
                    disabled={true} 
                    placeholder="Mã nhân viên phát sinh tự động"
                  />
                </div>
                {!editingEmployee ? (
                  <div className="admin-form-group">
                    <label>Mật khẩu khởi tạo (Hãy lưu lại) *</label>
                    <input 
                      type="text" 
                      value={formData.password} 
                      className="admin-input" 
                      style={{ fontWeight: 'bold', color: 'var(--admin-primary)', backgroundColor: '#fdf2f8' }}
                      disabled={true}
                    />
                  </div>
                ) : (
                  <div className="admin-form-group">
                    <label>Email cá nhân *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      className="admin-input" 
                      required 
                      placeholder="nhanvien@gmail.com" 
                    />
                  </div>
                )}
              </div>

              {!editingEmployee && (
                <div className="admin-form-group">
                  <label>Email cá nhân (Để lấy lại mật khẩu) *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className="admin-input" 
                    required 
                    placeholder="nhanvien@gmail.com" 
                  />
                </div>
              )}
              <div className="admin-form-group">
                <label>Họ tên nhân viên *</label>
                <input type="text" name="hoTen" value={formData.hoTen} onChange={handleInputChange} className="admin-input" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Số CCCD</label>
                  <input type="text" name="cccd" value={formData.cccd} onChange={handleInputChange} className="admin-input" />
                </div>
                <div className="admin-form-group">
                  <label>Số điện thoại *</label>
                  <input type="text" name="sdt" value={formData.sdt} onChange={handleInputChange} className="admin-input" required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Ngày sinh</label>
                  <input type="date" name="ngaySinh" value={formData.ngaySinh} onChange={handleInputChange} className="admin-input" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Giới tính</label>
                  <select name="gioiTinh" value={formData.gioiTinh} onChange={handleInputChange} className="admin-input">
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div className="admin-form-group">
                  <label>Trạng thái</label>
                  <select name="trangThai" value={formData.trangThai} onChange={handleInputChange} className="admin-input">
                    <option value="Đang làm việc">Đang làm việc</option>
                    <option value="Nghỉ phép">Nghỉ phép</option>
                    <option value="Nghỉ việc">Nghỉ việc</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Nơi làm việc</label>
                <select name="macuahang" value={formData.macuahang} onChange={handleInputChange} className="admin-input">
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Chức vụ *</label>
                  <select name="chucVu" value={formData.chucVu} onChange={handleInputChange} className="admin-input" required>
                    <option value="Nhân viên">Nhân viên (Bán hàng)</option>
                    <option value="Nhân viên chăm sóc khách hàng">Nhân viên chăm sóc khách hàng</option>
                    <option value="Thợ làm bánh">Thợ làm bánh</option>
                    <option value="Quản lý chi nhánh">Quản lý chi nhánh</option>
                    <option value="Quản lý tổng">Quản lý tổng (Quản trị viên)</option>
                  </select>
                  {!editingEmployee && <small style={{color: '#666', marginTop: '0.5rem', display: 'block'}}>Tài khoản tự động được tạo với mật khẩu khởi tạo ngẫu nhiên, quyền được cấp theo chức vụ.</small>}
                </div>
                <div className="admin-form-group">
                  <label>Ca làm việc</label>
                  <select name="caLamViec" value={formData.caLamViec} onChange={handleInputChange} className="admin-input">
                    <option value="Ca Sáng">Ca Sáng (6h - 14h)</option>
                    <option value="Ca Chiều">Ca Chiều (14h - 22h)</option>
                    <option value="Hành chính">Hành chính (8h - 17h)</option>
                  </select>
                </div>
              </div>

              <div className="admin-form-group">
                <label>Lương (VNĐ)</label>
                <input type="number" name="luong" min="0" value={formData.luong} onChange={handleInputChange} className="admin-input" placeholder="Để trống hệ thống sẽ tính tự động theo chức vụ" />
              </div>

              <div className="admin-form-group">
                <label>Địa chỉ</label>
                <textarea name="diaChi" value={formData.diaChi} onChange={handleInputChange} className="admin-input" rows="2" />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="admin-form-group">
                  <label>Ảnh CCCD Mặt Trước</label>
                  <input type="file" name="cccdTruoc" accept="image/*" onChange={handleFileChange} className="admin-input" />
                </div>
                <div className="admin-form-group">
                  <label>Ảnh CCCD Mặt Sau</label>
                  <input type="file" name="cccdSau" accept="image/*" onChange={handleFileChange} className="admin-input" />
                </div>
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
      {isDetailModalOpen && viewingEmployee && (
        <div className="admin-modal-overlay" style={modalOverlayStyle}>
          <div className="admin-modal" style={{ ...modalStyle, maxWidth: '800px' }}>
            <div className="admin-flex-between" style={{ marginBottom: '1.5rem' }}>
              <h2 className="admin-card-title" style={{ marginBottom: 0 }}>Hồ sơ Nhân viên</h2>
              <button type="button" onClick={closeModal} style={closeBtnStyle}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Phần thông tin */}
              <div style={{ padding: '1.5rem', backgroundColor: 'var(--admin-tertiary)', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--admin-outline)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{viewingEmployee.hoTen}</span>
                  <span className={`admin-badge ${getStatusBadgeClass(viewingEmployee.trangThai)}`}>{viewingEmployee.trangThai}</span>
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
                  <p><strong>Username:</strong> {viewingEmployee.userName}</p>
                  <p><strong>Email:</strong> {viewingEmployee.email}</p>
                  <p><strong>Số CCCD:</strong> {viewingEmployee.cccd || 'Chưa cập nhật'}</p>
                  <p><strong>Số điện thoại:</strong> {viewingEmployee.sdt || 'Chưa cập nhật'}</p>
                  <p><strong>Ngày sinh:</strong> {viewingEmployee.ngaySinh || 'Chưa cập nhật'}</p>
                  <p><strong>Giới tính:</strong> {viewingEmployee.gioiTinh || 'Chưa cập nhật'}</p>
                  <p><strong>Chức vụ:</strong> {viewingEmployee.chucVu || 'Chưa cập nhật'}</p>
                  <p><strong>Ca làm việc:</strong> {viewingEmployee.caLamViec || 'Chưa cập nhật'}</p>
                  <p><strong>Mức lương:</strong> {viewingEmployee.luong ? Number(viewingEmployee.luong).toLocaleString('vi-VN') + ' ₫' : 'Chưa thiết lập'}</p>
                  <p style={{ gridColumn: '1 / -1' }}><strong>Địa chỉ:</strong> {viewingEmployee.diaChi || 'Chưa cập nhật'}</p>
                </div>
              </div>

              {/* Phần hình ảnh */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                <div style={{ backgroundColor: 'var(--admin-tertiary)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '15px', color: 'var(--admin-text-muted)' }}>Mặt trước CCCD</h4>
                  {viewingEmployee.cccdTruoc ? (
                    <img 
                      src={viewingEmployee.cccdTruoc.startsWith('http') ? viewingEmployee.cccdTruoc : `http://localhost:8000${viewingEmployee.cccdTruoc}`} 
                      alt="CCCD Trước" 
                      style={{ width: '100%', maxWidth: '600px', borderRadius: '6px', border: '1px solid var(--admin-outline)', objectFit: 'contain', maxHeight: '400px', margin: '0 auto', display: 'block' }} 
                    />
                  ) : (
                    <div style={{ padding: '3rem', border: '1px dashed var(--admin-outline)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>Chưa cập nhật ảnh</div>
                  )}
                </div>
                
                <div style={{ backgroundColor: 'var(--admin-tertiary)', padding: '1.5rem', borderRadius: '8px', textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '15px', color: 'var(--admin-text-muted)' }}>Mặt sau CCCD</h4>
                  {viewingEmployee.cccdSau ? (
                    <img 
                      src={viewingEmployee.cccdSau.startsWith('http') ? viewingEmployee.cccdSau : `http://localhost:8000${viewingEmployee.cccdSau}`} 
                      alt="CCCD Sau" 
                      style={{ width: '100%', maxWidth: '600px', borderRadius: '6px', border: '1px solid var(--admin-outline)', objectFit: 'contain', maxHeight: '400px', margin: '0 auto', display: 'block' }} 
                    />
                  ) : (
                    <div style={{ padding: '3rem', border: '1px dashed var(--admin-outline)', borderRadius: '6px', color: 'var(--admin-text-muted)' }}>Chưa cập nhật ảnh</div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="admin-btn admin-btn-secondary" onClick={() => { closeModal(); openEditModal(viewingEmployee); }}>Chỉnh sửa</button>
              <button type="button" className="admin-btn admin-btn-primary" onClick={closeModal}>Đóng</button>
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
  maxWidth: '800px',
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

export default AdminEmployeePage;
