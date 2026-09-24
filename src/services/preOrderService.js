import axiosClient from './axiosClient';

const API_URL = '/admin/pre-orders';

/** Lấy danh sách đơn đặt trước */
export const getPreOrders = async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search)     params.append('search', filters.search);
    if (filters.trangThai)  params.append('trangThai', filters.trangThai);
    if (filters.page !== undefined) params.append('page', filters.page);
    if (filters.size !== undefined) params.append('size', filters.size);

    const response = await axiosClient.get(`${API_URL}?${params.toString()}`);
    return response.data;
};

/** Chi tiết 1 đơn (dùng để in phiếu) */
export const getPreOrderById = async (maDHT) => {
    const response = await axiosClient.get(`${API_URL}/${maDHT}`);
    return response.data;
};

/** Tạo đơn đặt trước mới */
export const createPreOrder = async (data) => {
    const response = await axiosClient.post(API_URL, data);
    return response.data;
};

/** Cập nhật trạng thái (san_sang / da_huy) */
export const updatePreOrderStatus = async (maDHT, trangThai) => {
    const response = await axiosClient.put(`${API_URL}/${maDHT}/status`, { trang_thai: trangThai });
    return response.data;
};

/** Thu tiền còn lại → tạo HdBan → hoàn thành */
export const completePreOrderPayment = async (maDHT, phuongThucThanhToan) => {
    const response = await axiosClient.post(`${API_URL}/${maDHT}/complete-payment`, {
        phuong_thuc_thanh_toan: phuongThucThanhToan,
    });
    return response.data;
};
