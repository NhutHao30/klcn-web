import axiosClient from './axiosClient';

export const getCategories = async () => {
  const response = await axiosClient.get('/categories');
  return response.data;
};

export const createCategory = async (categoryData) => {
  try {
    const response = await axiosClient.post('/admin/categories', categoryData);
    return response.data;
  } catch (e) {
    const response = await axiosClient.post('/categories', categoryData);
    return response.data;
  }
};

export const updateCategory = async (id, categoryData) => {
  try {
    const response = await axiosClient.put(`/admin/categories/${id}`, categoryData);
    return response.data;
  } catch (e) {
    const response = await axiosClient.put(`/categories/${id}`, categoryData);
    return response.data;
  }
};

export const deleteCategory = async (id) => {
  try {
    const response = await axiosClient.delete(`/admin/categories/${id}`);
    return response.data;
  } catch (e) {
    const response = await axiosClient.delete(`/categories/${id}`);
    return response.data;
  }
};
