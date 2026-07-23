const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, 'src', 'services');
const files = fs.readdirSync(servicesDir);

files.forEach(file => {
    if (file.endsWith('Service.js') && file !== 'axiosClient.js') {
        const filePath = path.join(servicesDir, file);
        let content = fs.readFileSync(filePath, 'utf8');

        // Đổi import
        content = content.replace(/import axios from ['"]axios['"];?/g, "import axiosClient from './axiosClient';");
        
        // Bỏ cấu hình cookie cũ của SpringBoot
        content = content.replace(/axios\.defaults\.withCredentials = true;?\n?/g, "");

        // Đổi API URL (Ví dụ: http://localhost:8080/api/products -> /products)
        content = content.replace(/const API_URL = ['"]http:\/\/localhost:8080\/api([^'"]*)['"];?/g, "const API_URL = '$1';");

        // Đổi các hàm gọi api
        content = content.replace(/axios\./g, 'axiosClient.');

        fs.writeFileSync(filePath, content, 'utf8');
    }
});

console.log('Đã refactor xong toàn bộ Service!');
