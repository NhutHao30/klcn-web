import axiosClient from './axiosClient';

export const getEmployees = async () => {
    const response = await axiosClient.get('/admin/users');
    const users = response.data;
    return users.filter(u => (u.MAROLE === 1 || u.MAROLE === 2) && u.nhanvien).map(u => ({
        userName: u.USERNAME,
        email: u.EMAIL,
        maRole: u.MAROLE,
        hoTen: u.nhanvien.HOTEN,
        sdt: u.nhanvien.SDT,
        ngaySinh: u.nhanvien.NGAYSINH,
        gioiTinh: u.nhanvien.GioiTinh,
        diaChi: u.nhanvien.DIACHI,
        chucVu: u.nhanvien.CHUCVU,
        luong: u.nhanvien.LUONG,
        trangThai: u.nhanvien.TRANGTHAI || 'Đang làm việc',
        caLamViec: u.nhanvien.CALAMVIEC || 'Chưa cập nhật',
        cccd: u.nhanvien.CCCD || '',
        cccdTruoc: u.nhanvien.CCCD_TRUOC,
        cccdSau: u.nhanvien.CCCD_SAU,
        macuahang: u.nhanvien.MACUAHANG,
        tenCuaHang: u.nhanvien.cuahang ? u.nhanvien.cuahang.TENCUAHANG : 'Chưa phân bổ'
    }));
};

export const getEmployeeById = async (id) => {
    const employees = await getEmployees();
    return employees.find(e => e.userName === id);
};

export const createEmployee = async (employeeData) => {
    const formData = new FormData();
    formData.append('USERNAME', employeeData.userName);
    formData.append('PASSWORD', employeeData.password || employeeData.userName);
    // Use provided email or auto-generate
    const emailToUse = employeeData.email || (employeeData.userName + '@dolabakery.com');
    formData.append('EMAIL', emailToUse);
    formData.append('HOTEN', employeeData.hoTen);
    formData.append('CHUCVU', employeeData.chucVu);
    formData.append('LUONG', employeeData.luong);
    formData.append('TRANGTHAI', employeeData.trangThai || 'Đang làm việc');
    formData.append('CALAMVIEC', employeeData.caLamViec || 'Ca Sáng');
    formData.append('MACUAHANG', employeeData.macuahang !== undefined ? employeeData.macuahang : 1);
    formData.append('MAROLE', employeeData.maRole !== undefined ? employeeData.maRole : 2);
    
    if (employeeData.sdt) formData.append('SDT', employeeData.sdt);
    if (employeeData.diaChi) formData.append('DIACHI', employeeData.diaChi);
    if (employeeData.gioiTinh) formData.append('GioiTinh', employeeData.gioiTinh);
    if (employeeData.ngaySinh) formData.append('NGAYSINH', employeeData.ngaySinh);
    if (employeeData.cccd) formData.append('CCCD', employeeData.cccd);
    if (employeeData.cccdTruoc) formData.append('CCCD_TRUOC', employeeData.cccdTruoc);
    if (employeeData.cccdSau) formData.append('CCCD_SAU', employeeData.cccdSau);
    if (employeeData.macuahang) formData.append('MACUAHANG', employeeData.macuahang);

    const response = await axiosClient.post('/admin/staff', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const updateEmployee = async (id, employeeData) => {
    const payload = {
        HOTEN: employeeData.hoTen,
        CHUCVU: employeeData.chucVu,
        LUONG: employeeData.luong,
        SDT: employeeData.sdt,
        DIACHI: employeeData.diaChi,
        GioiTinh: employeeData.gioiTinh,
        NGAYSINH: employeeData.ngaySinh,
        CCCD: employeeData.cccd,
        TRANGTHAI: employeeData.trangThai,
        CALAMVIEC: employeeData.caLamViec,
        EMAIL: employeeData.email,
        MACUAHANG: employeeData.macuahang,
        MAROLE: employeeData.maRole
    };
    const response = await axiosClient.put(`/admin/staff/${id}`, payload);
    return response.data;
};

export const importEmployeesFromExcel = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axiosClient.post('/admin/staff/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const deleteEmployee = async (id) => {
    const response = await axiosClient.delete(`/admin/staff/${id}`);
    return response.data;
};

export const scanCccd = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await axiosClient.post('/admin/staff/scan-cccd', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};
