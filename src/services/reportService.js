import axiosClient from './axiosClient';

export const getRevenueReport = async (type = 'month', cuaHangId = '') => {
  const params = new URLSearchParams({ type });
  if (cuaHangId) params.append('cuaHangId', cuaHangId);
  const response = await axiosClient.get(`/admin/reports/revenue?${params.toString()}`);
  return response.data;
};

export const getBiDashboardData = async (cuaHangId = '') => {
  const q = cuaHangId ? `?cuaHangId=${encodeURIComponent(cuaHangId)}` : '';
  const response = await axiosClient.get(`/admin/reports/bi-dashboard${q}`);
  return response.data;
};

export const getTopProducts = async (cuaHangId = '') => {
  const q = cuaHangId ? `?cuaHangId=${encodeURIComponent(cuaHangId)}` : '';
  const response = await axiosClient.get(`/admin/reports/top-products${q}`);
  return response.data;
};

export const getUsersForReport = async () => {
  const response = await axiosClient.get('/admin/users');
  return response.data;
};

export const getChamCong = async (thang, nam) => {
  const response = await axiosClient.get(`/admin/cham-cong?thang=${thang}&nam=${nam}`);
  return response.data;
};

export const postChamCong = async (data) => {
  const response = await axiosClient.post('/admin/cham-cong', data);
  return response.data;
};
