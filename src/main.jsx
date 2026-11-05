import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css';
import App from "./app";

// AUTO-RECOVERY CHO LỖI MIME TYPE & CHUNK LOAD ERROR TRÊN VERCEL
// Khi Vercel vừa build bản mới, các file JS cũ có hash cũ bị xóa. Nếu người dùng mở trang đang cache file cũ,
// trình duyệt nhận mã HTML 200 thay vì JS gây lỗi "Failed to load module script".
// Đoạn mã này tự động refresh trang để người dùng luôn nhận được phiên bản mới nhất trong suốt quá trình sử dụng.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.warn('Vite preload error, reloading page to fetch latest chunks...', event);
    const lastReload = parseInt(sessionStorage.getItem('last_auto_reload') || '0', 10);
    const now = Date.now();
    if (now - lastReload > 8000) {
      sessionStorage.setItem('last_auto_reload', String(now));
      window.location.reload();
    }
  });

  window.addEventListener('error', (e) => {
    const msg = e?.message || '';
    const isChunkOrMimeError = 
      msg.includes('Failed to load module script') ||
      msg.includes('Expected a JavaScript-or-Wasm module script') ||
      msg.includes('MIME type of "text/html"') ||
      msg.includes('dynamically imported module') ||
      msg.includes('Loading chunk');

    if (isChunkOrMimeError) {
      const lastReload = parseInt(sessionStorage.getItem('last_auto_reload') || '0', 10);
      const now = Date.now();
      if (now - lastReload > 8000) {
        sessionStorage.setItem('last_auto_reload', String(now));
        console.warn('Phát hiện bản cập nhật mới trên máy chủ Vercel. Đang tự động làm mới trang...');
        window.location.reload();
      }
    }
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e?.reason?.message || String(e?.reason || '');
    if (
      reason.includes('Failed to fetch dynamically imported module') ||
      reason.includes('Loading chunk') ||
      reason.includes('Failed to load module script')
    ) {
      const lastReload = parseInt(sessionStorage.getItem('last_auto_reload') || '0', 10);
      const now = Date.now();
      if (now - lastReload > 8000) {
        sessionStorage.setItem('last_auto_reload', String(now));
        console.warn('Lỗi nạp mô-đun do cập nhật bản mới. Đang làm mới...');
        window.location.reload();
      }
    }
  });
}

createRoot(document.getElementById('root')).render(
    <App />
)
