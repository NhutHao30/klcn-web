import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'https://f2ea-42-116-205-118.ngrok-free.app/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    },
});

// Thêm token vào header trước khi gửi request
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Xử lý lỗi chung (Ví dụ: token hết hạn)
axiosClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Không hiển thị alert nếu đang gọi API logout hoặc vừa mới đăng xuất xong
            if (localStorage.getItem('access_token') && !error.config.url.includes('/logout') && !localStorage.getItem('is_logging_out')) {
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
                localStorage.removeItem('access_token');
                window.location.href = '/dang-nhap';
            } else if (error.config.url.includes('/logout') || localStorage.getItem('is_logging_out')) {
                localStorage.removeItem('access_token');
                window.location.href = '/dang-nhap';
            }
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
