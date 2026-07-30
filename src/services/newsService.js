import axiosClient from './axiosClient';

// PUBLIC APIs
export const getNews = async (page = 1, limit) => {
    let url = `/news?page=${page}`;
    if (limit) url += `&limit=${limit}`;
    const response = await axiosClient.get(url);
    return response.data;
};

export const getNewsDetail = async (id) => {
    const response = await axiosClient.get(`/news/${id}`);
    return response.data;
};

export const getNewsComments = async (id) => {
    const response = await axiosClient.get(`/news/${id}/comments`);
    return response.data;
};

export const postNewsComment = async (id, noidung, parentId = null) => {
    const response = await axiosClient.post(`/news/${id}/comments`, { noidung, parent_id: parentId });
    return response.data;
};

// ADMIN APIs
export const getAdminNews = async (page = 1, search = '') => {
    let url = `/admin/news?page=${page}`;
    if (search) url += `&search=${search}`;
    const response = await axiosClient.get(url);
    return response.data;
};

export const createNews = async (data) => {
    const isFormData = data instanceof FormData;
    const config = isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {};
    const response = await axiosClient.post('/admin/news', data, config);
    return response.data;
};

export const updateNews = async (id, data) => {
    if (data instanceof FormData) {
        const response = await axiosClient.post(`/admin/news/${id}?_method=PUT`, data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
    const response = await axiosClient.put(`/admin/news/${id}`, data);
    return response.data;
};

export const deleteNews = async (id) => {
    const response = await axiosClient.delete(`/admin/news/${id}`);
    return response.data;
};

export const deleteNewsComment = async (commentId) => {
    const response = await axiosClient.delete(`/admin/news/comments/${commentId}`);
    return response.data;
};
