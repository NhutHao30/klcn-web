import axiosClient from './axiosClient';


const API_URL = '/lien-he';

export const sendContactEmail = async (contactData) => {
    try {
        const response = await axiosClient.post(`${API_URL}/send`, contactData);
        return response.data;
    } catch (error) {
        if (error.response && error.response.data) {
            throw new Error(error.response.data);
        }
        throw new Error('Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.');
    }
};
