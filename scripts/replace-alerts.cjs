/**
 * Script to replace all alert() calls with toast notifications
 * in all JSX files under src/Pages/
 * 
 * Run: node scripts/replace-alerts.js
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'Pages');

function findJsxFiles(dir) {
  let results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(findJsxFiles(fullPath));
    } else if (item.endsWith('.jsx')) {
      results.push(fullPath);
    }
  }
  return results;
}

const TOAST_IMPORT = "import { useToast } from '../components/Toast/Toast';";
const TOAST_IMPORT_ADMIN = "import { useToast } from '../../components/Toast/Toast';";

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Skip if no alert() calls
  if (!/alert\s*\(/.test(content)) return false;
  
  // Skip AdminPOSPage (already done)
  if (filePath.includes('AdminPOSPage')) return false;
  
  const isAdmin = filePath.includes(path.join('Admin', ''));
  const importLine = isAdmin ? TOAST_IMPORT_ADMIN : TOAST_IMPORT;
  
  // 1. Add import if not already present
  if (!content.includes('useToast')) {
    // Find last import line
    const lines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ') || lines[i].match(/^import\s/)) {
        lastImportIndex = i;
      }
    }
    if (lastImportIndex >= 0) {
      lines.splice(lastImportIndex + 1, 0, importLine);
      content = lines.join('\n');
    }
  }
  
  // 2. Add `const toast = useToast();` after component declaration
  //    Find patterns like: const XxxPage = () => { or function XxxPage() {
  if (!content.includes('const toast = useToast()')) {
    // Pattern: const ComponentName = (...) => {  (with possible next lines)
    content = content.replace(
      /(const \w+ = \([^)]*\)\s*=>\s*\{[\s\n]*)/,
      (match) => {
        // Check if useNavigate is after
        return match + '  const toast = useToast();\n';
      }
    );
    // If function component pattern
    if (!content.includes('const toast = useToast()')) {
      content = content.replace(
        /(function \w+\s*\([^)]*\)\s*\{[\s\n]*)/,
        (match) => match + '  const toast = useToast();\n'
      );
    }
  }
  
  // 3. Replace alert() calls with toast
  // Success patterns
  content = content.replace(/alert\("Đã thêm vào giỏ hàng!"\)/g, 'toast.success("Đã thêm vào giỏ hàng!")');
  content = content.replace(/alert\("Đăng nhập thành công!"\)/g, 'toast.success("Đăng nhập thành công!")');
  content = content.replace(/alert\("Đăng xuất thành công!"\)/g, 'toast.success("Đăng xuất thành công!")');
  content = content.replace(/alert\("Đã gửi bình luận!"\)/g, 'toast.success("Đã gửi bình luận!")');
  content = content.replace(/alert\("Đã gửi câu trả lời!"\)/g, 'toast.success("Đã gửi câu trả lời!")');
  content = content.replace(/alert\("Đổi mật khẩu thành công!"\)/g, 'toast.success("Đổi mật khẩu thành công!")');
  content = content.replace(/alert\('Cập nhật thông tin thành công!'\)/g, "toast.success('Cập nhật thông tin thành công!')");
  content = content.replace(/alert\("Đã gửi mã OTP đến email của bạn\."\)/g, 'toast.success("Đã gửi mã OTP đến email của bạn.")');
  
  // Generic success patterns with variables
  content = content.replace(/alert\((res\.message \|\| "Đăng ký thành công!")\)/g, 'toast.success($1)');
  content = content.replace(/alert\((res\.data\.message \|\| "Đánh giá thành công!")\)/g, 'toast.success($1)');
  content = content.replace(/alert\((res\.data\.message \|\| "Hủy đơn hàng thành công!")\)/g, 'toast.success($1)');
  content = content.replace(/alert\((res\.message \|\| "Đã gửi mã OTP đến email của bạn\.")\)/g, 'toast.success($1)');
  content = content.replace(/alert\((res\.message \|\| "Đổi mật khẩu thành công!")\)/g, 'toast.success($1)');
  
  // Cart/order success
  content = content.replace(/alert\("🎉 Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận và đang chờ cửa hàng xác nhận\."\)/g, 
    'toast.success("🎉 Đặt hàng thành công! Đơn hàng của bạn đã được ghi nhận.")');
  content = content.replace(/alert\("✅ Thanh toán thành công! Chúng tôi đã nhận được tiền chuyển khoản\. Đơn hàng của bạn đang chờ cửa hàng xác nhận và đóng gói\."\)/g, 
    'toast.success("✅ Thanh toán thành công! Đơn hàng đang chờ xác nhận.")');
  content = content.replace(/alert\("Gửi yêu cầu giải đáp thắc mắc thành công! Chúng tôi sẽ phản hồi qua email của bạn\."\)/g,
    'toast.success("Gửi yêu cầu thành công! Chúng tôi sẽ phản hồi qua email của bạn.")');
  content = content.replace(/alert\("Hệ thống đang xử lý và kiểm tra giao dịch chuyển khoản của bạn\. Vui lòng nhấn OK và đợi trong giây lát\.\.\."\)/g,
    'toast.info("Hệ thống đang xử lý và kiểm tra giao dịch chuyển khoản...")');
  
  // Warning/validation patterns
  content = content.replace(/alert\("Vui lòng đăng nhập để xem danh sách yêu thích"\)/g, 'toast.warning("Vui lòng đăng nhập để xem danh sách yêu thích")');
  content = content.replace(/alert\("Vui lòng đăng nhập để thêm vào giỏ hàng"\)/g, 'toast.warning("Vui lòng đăng nhập để thêm vào giỏ hàng")');
  content = content.replace(/alert\("Vui lòng đăng nhập để xem giỏ hàng"\)/g, 'toast.warning("Vui lòng đăng nhập để xem giỏ hàng")');
  content = content.replace(/alert\("Vui lòng nhập email khôi phục!"\)/g, 'toast.warning("Vui lòng nhập email khôi phục!")');
  content = content.replace(/alert\("Vui lòng nhập đầy đủ mã OTP và mật khẩu mới\."\)/g, 'toast.warning("Vui lòng nhập đầy đủ mã OTP và mật khẩu mới.")');
  content = content.replace(/alert\("Vui lòng nhập đầy đủ thông tin!"\)/g, 'toast.warning("Vui lòng nhập đầy đủ thông tin!")');
  content = content.replace(/alert\("Mật khẩu nhập lại không khớp!"\)/g, 'toast.warning("Mật khẩu nhập lại không khớp!")');
  content = content.replace(/alert\("Vui lòng nhập nội dung bình luận\."\)/g, 'toast.warning("Vui lòng nhập nội dung bình luận.")');
  content = content.replace(/alert\("Vui lòng nhập nội dung trả lời\."\)/g, 'toast.warning("Vui lòng nhập nội dung trả lời.")');
  content = content.replace(/alert\("Vui lòng chọn số sao đánh giá!"\)/g, 'toast.warning("Vui lòng chọn số sao đánh giá!")');
  content = content.replace(/alert\("Giỏ hàng của bạn đang trống!"\)/g, 'toast.warning("Giỏ hàng của bạn đang trống!")');
  content = content.replace(/alert\("Vui lòng chọn đầy đủ địa chỉ giao hàng!"\)/g, 'toast.warning("Vui lòng chọn đầy đủ địa chỉ giao hàng!")');
  content = content.replace(/alert\('Vui lòng đăng nhập để xem đơn hàng của bạn!'\)/g, "toast.warning('Vui lòng đăng nhập để xem đơn hàng của bạn!')");
  content = content.replace(/alert\("Bạn cần đăng nhập để bình luận!"\)/g, 'toast.warning("Bạn cần đăng nhập để bình luận!")');
  content = content.replace(/alert\("Bạn cần đăng nhập để trả lời bình luận!"\)/g, 'toast.warning("Bạn cần đăng nhập để trả lời bình luận!")');
  content = content.replace(/alert\("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn\."\)/g, 'toast.warning("Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.")');
  content = content.replace(/alert\("Cập nhật thông tin thành công trước khi thực hiện đổi mật khẩu\."\)/g, 'toast.warning("Cập nhật thông tin thành công trước khi thực hiện đổi mật khẩu.")');
  content = content.replace(/alert\("Vui lòng cập nhật địa chỉ Email trước khi thực hiện đổi mật khẩu\."\)/g, 'toast.warning("Vui lòng cập nhật địa chỉ Email trước khi thực hiện đổi mật khẩu.")');
  
  // Remaining generic alert() -> toast calls using a catch-all
  // Success patterns with template literals or variables
  content = content.replace(/alert\(("Gửi thành công: " \+ response\.data\.message)\)/g, 'toast.success($1)');
  
  // Error patterns  
  content = content.replace(/alert\("Đã xảy ra lỗi khi gửi yêu cầu\. Vui lòng thử lại sau\."\)/g, 'toast.error("Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.")');
  content = content.replace(/alert\("Không thể xóa sản phẩm: " \+ e\.message\)/g, 'toast.error("Không thể xóa sản phẩm: " + e.message)');
  
  // Catch-all: remaining alert() with error-like content
  content = content.replace(/alert\((e\.response\?\.\data\?\.error \|\| [^)]+)\)/g, 'toast.error($1)');
  content = content.replace(/alert\((error\.response\?\.\data\?\.error \|\| [^)]+)\)/g, 'toast.error($1)');
  content = content.replace(/alert\(('Lỗi cập nhật: ' \+ [^)]+)\)/g, 'toast.error($1)');
  content = content.replace(/alert\(("Lỗi: " \+ [^)]+)\)/g, 'toast.error($1)');
  content = content.replace(/alert\((error\.message \|\| [^)]+)\)/g, 'toast.error($1)');
  content = content.replace(/alert\((errorMsg)\)/g, 'toast.error($1)');
  
  // Catch any remaining alert() → convert to toast.info
  content = content.replace(/alert\(("Đăng nhập bằng Google thành công!")\)/g, 'toast.success($1)');
  
  // Admin-specific patterns
  content = content.replace(/alert\(('Không thể tải danh sách voucher\. Bạn có phải Quản lý tổng\?')\)/g, 'toast.error($1)');
  
  // Any remaining alert() calls - convert to toast.info as fallback
  // We'll do this carefully with a function
  content = content.replace(/\balert\(([^)]+)\)/g, (match, args) => {
    // If already converted, skip
    if (match.startsWith('toast.')) return match;
    
    // Try to determine type from content
    const argStr = args.toLowerCase();
    if (argStr.includes('thành công') || argStr.includes('success')) {
      return `toast.success(${args})`;
    } else if (argStr.includes('lỗi') || argStr.includes('error') || argStr.includes('không thể')) {
      return `toast.error(${args})`;
    } else if (argStr.includes('vui lòng') || argStr.includes('cảnh báo') || argStr.includes('warning') || argStr.includes('chưa')) {
      return `toast.warning(${args})`;
    } else {
      return `toast.info(${args})`;
    }
  });
  
  fs.writeFileSync(filePath, content, 'utf-8');
  return true;
}

// Process all files
const files = findJsxFiles(srcDir);
let modified = 0;
for (const file of files) {
  const changed = processFile(file);
  if (changed) {
    console.log(`✅ Updated: ${path.relative(srcDir, file)}`);
    modified++;
  }
}

// Also process App.jsx
const appFile = path.join(__dirname, '..', 'src', 'App.jsx');
if (fs.existsSync(appFile)) {
  let content = fs.readFileSync(appFile, 'utf-8');
  if (/alert\s*\(/.test(content)) {
    // App.jsx already has ToastProvider, just replace alerts
    // The alert in App.jsx is inside useEffect, need to handle differently
    // Since useToast can't be used outside a component easily, we'll use a different approach
    // Just replace with a simple inline approach
    content = content.replace(
      /setTimeout\(\(\) => alert\("Đăng nhập bằng Google thành công!"\), 500\)/,
      '// Toast sẽ hiển thị ở trang đích'
    );
    fs.writeFileSync(appFile, content, 'utf-8');
    console.log('✅ Updated: App.jsx');
    modified++;
  }
}

console.log(`\n🎉 Done! Modified ${modified} files.`);
