import axiosClient from './axiosClient';

export const mapRoleName = (roleStr, roleId) => {
    const id = Number(roleId);
    if (id === 1) return 'Quản trị viên';
    if (id === 2) return 'Quản lý chi nhánh';
    if (id === 3) return 'Nhân viên bán hàng';
    if (id === 4) return 'Nhân viên kho';
    if (id === 5) return 'Nhân viên chăm sóc khách hàng';
    if (id === 7) return 'Nhân viên kế toán';
    if (id === 8) return 'Giám đốc';

    const upper = String(roleStr || '').toUpperCase();
    if (upper === 'ADMIN') return 'Quản trị viên';
    if (upper === 'MANAGER') return 'Quản lý chi nhánh';
    if (upper === 'CASHIER') return 'Nhân viên bán hàng';
    if (upper === 'WAREHOUSE') return 'Nhân viên kho';
    if (upper === 'CSKH') return 'Nhân viên chăm sóc khách hàng';
    if (upper === 'ACCOUNTANT') return 'Nhân viên kế toán';
    if (upper === 'DIRECTOR') return 'Giám đốc';

    return roleStr || 'Nhân viên bán hàng';
};

export const getEmployees = async () => {
    const response = await axiosClient.get('/admin/users');
    const users = Array.isArray(response.data) ? response.data : (response.data?.data || []);
    return users
        .filter(u => {
            const username = (u.USERNAME || u.username || '').toLowerCase();
            const roleId = u.vaiTroId !== undefined ? (parseInt(u.vaiTroId, 10)) : null;
            const tenVaiTro = (u.vaitro?.tenVaiTro || u.vaitro?.TEN_VAITRO || '').toUpperCase();

            // 1. Hide superadmin 'admin' account from employee management page
            if (username === 'admin') return false;

            // 2. Hide customer accounts (Role 6 / Customer)
            if (roleId === 6 || tenVaiTro === 'CUSTOMER' || tenVaiTro === 'KHÁCH HÀNG') return false;
            if (u.nguoidung && u.nguoidung.loaiNguoiDung === 0) return false;

            // 3. Must have valid staff profile
            if (!u.nhanvien && !u.nguoidung) return false;

            return true;
        })
        .map(u => {
            const isWorking = (u.trangThai === 1 || u.TRANGTHAI === 'Đang làm việc' || u.nhanvien?.TRANGTHAI === 'Đang làm việc');
            const roleId = u.vaiTroId !== undefined ? u.vaiTroId : u.MAROLE;
            const rawChucVu = u.vaitro?.tenVaiTro || u.nhanvien?.CHUCVU || '';

            return {
                userName: u.USERNAME || u.username,
                email: u.EMAIL || u.email,
                maRole: roleId,
                hoTen: u.nhanvien?.HOTEN || u.nguoidung?.hoTen || '',
                sdt: u.nhanvien?.SDT || u.nguoidung?.soDienThoai || '',
                ngaySinh: u.nhanvien?.NGAYSINH || u.nguoidung?.ngaySinh || '',
                gioiTinh: u.nhanvien?.GioiTinh || (u.nguoidung?.gioiTinh === 1 ? 'Nam' : 'Nữ'),
                diaChi: u.nhanvien?.DIACHI || '',
                chucVu: mapRoleName(rawChucVu, roleId),
                luong: u.nhanvien?.LUONG || u.nguoidung?.luong || u.nguoidung?.LUONG || 0,
                trangThai: isWorking ? 'Đang làm việc' : 'Nghỉ việc',
                caLamViec: u.nhanvien?.CALAMVIEC || u.nguoidung?.caLamViec || u.nguoidung?.CALAMVIEC || 'Ca Sáng',
                cccd: u.nhanvien?.CCCD || u.nguoidung?.cccdNumber || '',
                cccdTruoc: u.nhanvien?.CCCD_TRUOC,
                cccdSau: u.nhanvien?.CCCD_SAU,
                macuahang: u.nhanvien?.MACUAHANG || u.nguoidung?.cuaHangId || 1,
                tenCuaHang: u.nhanvien?.cuahang ? (u.nhanvien.cuahang.TENCUAHANG || u.nhanvien.cuahang.tenCuaHang) : 'Chưa phân bổ'
            };
        });
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
    formData.append('LUONG', employeeData.luong !== undefined ? employeeData.luong : 0);
    formData.append('luong', employeeData.luong !== undefined ? employeeData.luong : 0);
    formData.append('TRANGTHAI', employeeData.trangThai || 'Đang làm việc');
    formData.append('CALAMVIEC', employeeData.caLamViec || 'Ca Sáng');
    formData.append('caLamViec', employeeData.caLamViec || 'Ca Sáng');
    formData.append('MACUAHANG', employeeData.macuahang !== undefined ? employeeData.macuahang : 1);
    formData.append('MAROLE', employeeData.maRole !== undefined ? employeeData.maRole : 3);
    formData.append('maRole', employeeData.maRole !== undefined ? employeeData.maRole : 3);
    formData.append('vaiTroId', employeeData.maRole !== undefined ? employeeData.maRole : 3);
    
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
        hoTen: employeeData.hoTen,
        CHUCVU: employeeData.chucVu,
        chucVu: employeeData.chucVu,
        LUONG: employeeData.luong !== undefined ? employeeData.luong : 0,
        luong: employeeData.luong !== undefined ? employeeData.luong : 0,
        SDT: employeeData.sdt,
        soDienThoai: employeeData.sdt,
        DIACHI: employeeData.diaChi,
        GioiTinh: employeeData.gioiTinh,
        gioiTinh: employeeData.gioiTinh,
        NGAYSINH: employeeData.ngaySinh,
        ngaySinh: employeeData.ngaySinh,
        CCCD: employeeData.cccd,
        TRANGTHAI: employeeData.trangThai,
        trangThai: employeeData.trangThai,
        CALAMVIEC: employeeData.caLamViec || 'Ca Sáng',
        caLamViec: employeeData.caLamViec || 'Ca Sáng',
        EMAIL: employeeData.email,
        email: employeeData.email,
        MACUAHANG: employeeData.macuahang,
        cuaHangId: employeeData.macuahang,
        MAROLE: employeeData.maRole,
        maRole: employeeData.maRole,
        vaiTroId: employeeData.maRole
    };
    if (employeeData.password && String(employeeData.password).trim() !== '') {
        payload.PASSWORD = String(employeeData.password).trim();
        payload.password = String(employeeData.password).trim();
    }
    const response = await axiosClient.put(`/admin/staff/${id}`, payload);
    return response.data;
};

export const getAllUserAccounts = async () => {
    const response = await axiosClient.get('/admin/users');
    return Array.isArray(response.data) ? response.data : (response.data?.data || []);
};

export const createUserAccount = async (payload) => {
    const response = await axiosClient.post('/admin/users', payload);
    return response.data;
};

export const updateUserAccount = async (id, payload) => {
    const response = await axiosClient.put(`/admin/users/${encodeURIComponent(id)}`, payload);
    return response.data;
};

export const resetUserPassword = async (id, payload) => {
    const response = await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/password`, payload);
    return response.data;
};

export const toggleUserAccountStatus = async (id, explicitStatus = null) => {
    const payload = explicitStatus !== null ? { trangThai: explicitStatus } : {};
    const response = await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/toggle-status`, payload);
    return response.data;
};

export const updateUserAccountRole = async (id, vaiTroId) => {
    const response = await axiosClient.put(`/admin/users/${encodeURIComponent(id)}/role`, { vaiTroId });
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
