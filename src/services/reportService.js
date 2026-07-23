import axiosClient from './axiosClient';

export const getRevenueReport = async (type = 'month') => {
  const response = await axiosClient.get(`/admin/reports/revenue?type=${type}`);
  return response.data;
};

export const getTopProducts = async () => {
  const response = await axiosClient.get('/admin/reports/top-products');
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
