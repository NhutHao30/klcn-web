import axiosClient from './axiosClient';

/**
 * Lấy danh sách nhật ký hệ thống (có phân trang và bộ lọc)
 */
export const getNhatKyHeThong = async (params = {}) => {
    const query = new URLSearchParams();

    if (params.page) query.append('page', params.page);
    if (params.per_page) query.append('per_page', params.per_page);
    if (params.tu_ngay) query.append('tu_ngay', params.tu_ngay);
    if (params.den_ngay) query.append('den_ngay', params.den_ngay);
    if (params.username) query.append('username', params.username);
    if (params.hanh_dong) query.append('hanh_dong', params.hanh_dong);

    const response = await axiosClient.get(`/admin/nhat-ky-he-thong?${query.toString()}`);
    return response.data;
};
