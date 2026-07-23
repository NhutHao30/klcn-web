import axiosClient from './axiosClient';

const API_URL = '/wishlist';

export const getWishlist = async () => {
    const response = await axiosClient.get(API_URL);
    return response.data;
};

export const addToWishlist = async (masp) => {
    const response = await axiosClient.post(API_URL, { masp });
    return response.data;
};

export const removeFromWishlist = async (masp) => {
    const response = await axiosClient.delete(`${API_URL}/${masp}`);
    return response.data;
};
