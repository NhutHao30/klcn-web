import axiosClient from './axiosClient';

const API_PUBLIC = '/products';
const API_ADMIN = '/admin/products';

// Lấy danh sách sản phẩm (Public - Dành cho trang chủ & xem danh sách)
export const getProducts = async (params = {}) => {
  const response = await axiosClient.get(API_PUBLIC, { params });
  return response.data;
};

// Xem chi tiết 1 sản phẩm
export const getProductById = async (id) => {
  const response = await axiosClient.get(`${API_PUBLIC}/${id}`);
  return response.data;
};

// ---------------- ADMIN ONLY ----------------

export const createProduct = async (productData) => {
  const response = await axiosClient.post(API_ADMIN, productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const createPOSInvoice = async (cart, paymentMethod = 'COD', customerId = null) => {
  const response = await axiosClient.post('/admin/pos/checkout', { cart, paymentMethod, customerId });
  return response.data;
};

export const updateProduct = async (id, productData) => {
  // Vì Laravel không nhận file qua method PUT (đặc thù PHP multipart/form-data),
  // ta phải dùng method POST kèm tham số ?_method=PUT
  const response = await axiosClient.post(`${API_ADMIN}/${id}?_method=PUT`, productData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await axiosClient.delete(`${API_ADMIN}/${id}`);
  return response.data;
};