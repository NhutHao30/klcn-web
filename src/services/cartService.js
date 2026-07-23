import axiosClient from './axiosClient';

const API_URL = '/cart';

export const getCart = async () => {
    const response = await axiosClient.get(API_URL);
    return response.data;
};

export const addToCart = async (masp, soluong = 1) => {
    const response = await axiosClient.post(`${API_URL}/add`, { masp, quantity: soluong });
    return response.data;
};

export const updateCartQuantity = async (masp, soluong) => {
    const response = await axiosClient.put(`${API_URL}/update`, { masp, quantity: soluong });
    return response.data;
};

export const removeFromCart = async (masp) => {
    const response = await axiosClient.delete(`${API_URL}/remove/${masp}`);
    return response.data;
};

export const checkout = async (checkoutData = {}) => {
    const response = await axiosClient.post(`${API_URL}/checkout`, checkoutData);
    return response.data;
};
