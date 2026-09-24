import axiosClient from './axiosClient';

// Quản lý Lô Hàng
export const getLoHangs = async (params = {}) => {
  const response = await axiosClient.get('/lo-hang', { params });
  return response.data;
};

export const getCanhBaoHsd = async () => {
  const response = await axiosClient.get('/lo-hang/canh-bao');
  return response.data;
};

export const getLoHangDetail = async (malohan) => {
  const response = await axiosClient.get(`/lo-hang/${malohan}`);
  return response.data;
};

export const nhapLoHang = async (data) => {
  const response = await axiosClient.post('/lo-hang/nhap', data);
  return response.data;
};

export const updateTrangThaiLo = async (malohan, data) => {
  const response = await axiosClient.patch(`/lo-hang/${malohan}/trang-thai`, data);
  return response.data;
};

// Quản lý Nhà Cung Cấp
export const getNhaCungCaps = async () => {
  const response = await axiosClient.get('/nha-cung-cap');
  return response.data;
};

export const createNhaCungCap = async (data) => {
  const response = await axiosClient.post('/nha-cung-cap', data);
  return response.data;
};

export const updateNhaCungCap = async (id, data) => {
  const response = await axiosClient.put(`/nha-cung-cap/${id}`, data);
  return response.data;
};

export const deleteNhaCungCap = async (id) => {
  const response = await axiosClient.delete(`/nha-cung-cap/${id}`);
  return response.data;
};

// Biên Bản Hủy Sản Phẩm
export const getBienBanHuys = async (params = {}) => {
  const response = await axiosClient.get('/bien-ban-huy', { params });
  return response.data;
};

export const getBienBanHuyDetail = async (id) => {
  const response = await axiosClient.get(`/bien-ban-huy/${id}`);
  return response.data;
};

// Thống Kê & Báo Cáo Nâng Cao
export const getThongKeLoiNhuan = async (params = {}) => {
  const response = await axiosClient.get('/admin/thong-ke/loi-nhuan', { params });
  return response.data;
};

export const getThongKeHaoHut = async (params = {}) => {
  const response = await axiosClient.get('/admin/thong-ke/hao-hut', { params });
  return response.data;
};

export const getThongKeNhapHang = async (params = {}) => {
  const response = await axiosClient.get('/admin/thong-ke/nhap-hang', { params });
  return response.data;
};
