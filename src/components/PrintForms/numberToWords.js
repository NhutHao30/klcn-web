/**
 * Tiện ích đọc số tiền thành chữ Tiếng Việt chuẩn hóa cho các biểu mẫu Givral Bakery
 * Ví dụ: 547500 -> "Năm trăm bốn mươi bảy nghìn năm trăm đồng chẵn."
 */
export const readVietnameseCurrency = (num) => {
  const number = Math.round(Number(num) || 0);
  if (number === 0) return 'Không đồng chẵn.';
  if (number < 0) return 'Âm ' + readVietnameseCurrency(-number);

  const words = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

  const readThreeDigits = (n, showZeroHundred = false) => {
    const tr = Math.floor(n / 100);
    const ch = Math.floor((n % 100) / 10);
    const dv = n % 10;
    let res = '';

    if (tr > 0 || showZeroHundred) {
      res += words[tr] + ' trăm ';
    }

    if (ch > 1) {
      res += words[ch] + ' mươi ';
      if (dv === 1) res += 'mốt ';
      else if (dv === 4) res += 'tư ';
      else if (dv === 5) res += 'lăm ';
      else if (dv > 0) res += words[dv] + ' ';
    } else if (ch === 1) {
      res += 'mười ';
      if (dv === 1) res += 'một ';
      else if (dv === 4) res += 'bốn ';
      else if (dv === 5) res += 'lăm ';
      else if (dv > 0) res += words[dv] + ' ';
    } else if (ch === 0 && (tr > 0 || showZeroHundred)) {
      if (dv > 0) {
        res += 'lẻ ' + words[dv] + ' ';
      }
    } else if (dv > 0) {
      res += words[dv] + ' ';
    }

    return res.trim();
  };

  let strNum = number.toString();
  const groups = [];
  while (strNum.length > 0) {
    const start = Math.max(0, strNum.length - 3);
    groups.unshift(parseInt(strNum.substring(start), 10));
    strNum = strNum.substring(0, start);
  }

  let result = '';
  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];
    const unitIdx = groups.length - 1 - i;
    if (g > 0) {
      const showZero = i > 0;
      const text = readThreeDigits(g, showZero);
      result += text + ' ' + (units[unitIdx] || '') + ' ';
    }
  }

  result = result.trim().replace(/\s+/g, ' ');
  if (!result) return 'Không đồng chẵn.';
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng chẵn.';
};

