
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import axiosClient from '../services/axiosClient';

const PageViewTracker = () => {
    const location = useLocation();
    const lastTrackedPath = useRef(null);

    useEffect(() => {
        // Chỉ lấy pathname, không ghi query string để tránh lưu
        // các tham số có thể chứa thông tin nhạy cảm.
        const pagePath = location.pathname;

        // Tránh gửi trùng khi React StrictMode chạy effect hai lần.
        if (lastTrackedPath.current === pagePath) {
            return;
        }

        lastTrackedPath.current = pagePath;

        axiosClient.post('/track-page-view', {
            page_path: pagePath,
            page_title: document.title || null,
        }).catch((error) => {
            console.error('Không thể ghi nhận lượt xem trang:', error);
        });

    }, [location.pathname]);

    return null;
};

export default PageViewTracker;