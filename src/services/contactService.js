import axiosClient from './axiosClient';


const API_URL = '/contact';

export const sendContactEmail = async (contactData) => {
    try {
        const payload = {
            name: contactData.name || contactData.hoTen,
            email: contactData.email,
            phone: contactData.phone || contactData.dienThoai,
            message: contactData.message || contactData.noiDung,
        };
        const response = await axiosClient.post(API_URL, payload);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data.message || 'Lỗi từ máy chủ');
        }
        throw new Error('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.');
    }
};
