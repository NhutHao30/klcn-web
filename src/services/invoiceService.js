import axiosClient from './axiosClient';

const API_URL = '/hoa-don';


export const getInvoices = async (filters = {}) => {
    // Chuyển đổi các tham số lọc thành query string
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.trangThai) params.append('trangThai', filters.trangThai);
    if (filters.maKH) params.append('maKH', filters.maKH);
    if (filters.page !== undefined) params.append('page', filters.page);
    if (filters.size !== undefined) params.append('size', filters.size);

    const response = await axiosClient.get(`${API_URL}?${params.toString()}`);
    return response.data; // Trả về PageResponse
};

export const getMyOrders = async () => {
    const response = await axiosClient.get(`/my-orders`);
    // API backend đang trả về PageResponse<HoaDonBanDTO>, vậy nên return response.data.content
    return response.data.content || [];
};

export const getInvoiceById = async (maHD) => {
    const response = await axiosClient.get(`${API_URL}/${maHD}`);
    return response.data;
};

export const getInvoiceDetails = async (maHD) => {
    const response = await axiosClient.get(`${API_URL}/${maHD}/chi-tiet`);
    return response.data;
};

export const updateInvoiceStatus = async (maHD, invoiceData) => {
    const response = await axiosClient.put(`${API_URL}/${maHD}`, invoiceData);
    return response.data;
};

export const getMyOrderDetails = async (maHD) => {
    const response = await axiosClient.get(`/my-orders/${maHD}/chi-tiet`);
    return response.data;
};
