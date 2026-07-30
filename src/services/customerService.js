import axiosClient from './axiosClient';

const API_URL = '/customers';

export const getCustomers = async () => {
    const response = await axiosClient.get(API_URL);
    return response.data;
};

export const getCustomerById = async (id) => {
    const response = await axiosClient.get(`${API_URL}/${id}`);
    return response.data;
};

export const createCustomer = async (customer) => {
    const response = await axiosClient.post(API_URL, customer);
    return response.data;
};

export const updateCustomer = async (id, customer) => {
    const response = await axiosClient.put(`${API_URL}/${id}`, customer);
    return response.data;
};

export const deleteCustomer = async (id) => {
    const response = await axiosClient.delete(`${API_URL}/${id}`);
    return response.data;
};

export const restoreCustomer = async (id) => {
    const response = await axiosClient.put(`${API_URL}/${id}/restore`);
    return response.data;
};
