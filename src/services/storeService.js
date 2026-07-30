import axiosClient from './axiosClient';

export const getPublicStores = async () => {
    const response = await axiosClient.get('/stores');
    return response.data;
};

export const getStores = async () => {
    const response = await axiosClient.get('/admin/stores');
    return response.data;
};

export const updateStoreStatus = async (id, status) => {
    const response = await axiosClient.put(`/admin/stores/${id}/status`, { status });
    return response.data;
};

export const createStore = async (storeData) => {
    const response = await axiosClient.post('/admin/stores', storeData);
    return response.data;
};

export const updateStore = async (id, storeData) => {
    const response = await axiosClient.put(`/admin/stores/${id}`, storeData);
    return response.data;
};
