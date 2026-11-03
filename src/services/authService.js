import axiosClient from './axiosClient';

const API_URL = "";

let cachedUser = null;
let userPromise = null;

export const clearUserCache = () => {
  cachedUser = null;
  userPromise = null;
  try {
    sessionStorage.removeItem('current_user');
  } catch (e) {}
};

export const login = async (username, password) => {
  clearUserCache();
  const response = await axiosClient.post(`${API_URL}/login`, { 
    USERNAME: username, 
    PASSWORD: password 
  });
  return response.data;
};

export const sendRegisterOtp = async (userData) => {
  const hoTen = userData.HOTEN || userData.hoTen || userData.ho_ten || userData.name || '';
  const sdt = userData.SDT || userData.soDienThoai || userData.so_dien_thoai || userData.sdt || '';
  const email = userData.EMAIL || userData.email || '';
  const isNam = userData.GioiTinh === 'Nam' || userData.gioiTinh === 1 || userData.gioi_tinh === 1;

  const payload = {
    username: userData.username,
    password: userData.password,
    email: email,
    EMAIL: email,
    hoTen: hoTen,
    ho_ten: hoTen,
    HOTEN: hoTen,
    soDienThoai: sdt,
    so_dien_thoai: sdt,
    SDT: sdt,
    gioiTinh: isNam ? 1 : 0,
    gioi_tinh: isNam ? 1 : 0,
    GioiTinh: isNam ? 'Nam' : 'Nữ'
  };
  const response = await axiosClient.post(`${API_URL}/register/send-otp`, payload);
  return response.data;
};

export const register = async (userData) => {
  clearUserCache();
  const hoTen = userData.HOTEN || userData.hoTen || userData.ho_ten || userData.name || '';
  const sdt = userData.SDT || userData.soDienThoai || userData.so_dien_thoai || userData.sdt || '';
  const email = userData.EMAIL || userData.email || '';
  const isNam = userData.GioiTinh === 'Nam' || userData.gioiTinh === 1 || userData.gioi_tinh === 1;
  const otp = userData.otp || userData.OTP || userData.OTP_CODE || '';

  const payload = {
    username: userData.username,
    password: userData.password,
    email: email,
    EMAIL: email,
    hoTen: hoTen,
    ho_ten: hoTen,
    HOTEN: hoTen,
    soDienThoai: sdt,
    so_dien_thoai: sdt,
    SDT: sdt,
    gioiTinh: isNam ? 1 : 0,
    gioi_tinh: isNam ? 1 : 0,
    GioiTinh: isNam ? 'Nam' : 'Nữ',
    otp: otp,
    OTP: otp
  };
  const response = await axiosClient.post(`${API_URL}/register`, payload);
  return response.data;
};

export const getCurrentUser = async (forceRefresh = false) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    clearUserCache();
    throw new Error('No token found');
  }

  // 1. Return in-memory cache if valid
  if (cachedUser && !forceRefresh) {
    return cachedUser;
  }

  // 2. Return sessionStorage cache immediately if available
  if (!cachedUser && !forceRefresh) {
    try {
      const raw = sessionStorage.getItem('current_user');
      if (raw) {
        cachedUser = JSON.parse(raw);
        return cachedUser;
      }
    } catch (e) {}
  }

  // 3. Deduplicate concurrent requests
  if (userPromise && !forceRefresh) {
    return userPromise;
  }

  userPromise = (async () => {
    try {
      const response = await axiosClient.get(`${API_URL}/me`);
      const data = response.data;
      if (data && data.MAROLE !== undefined) {
        data.MAROLE = Number(data.MAROLE);
      }
      cachedUser = data;
      try {
        sessionStorage.setItem('current_user', JSON.stringify(data));
      } catch (e) {}
      return data;
    } finally {
      userPromise = null;
    }
  })();

  return userPromise;
};

export const updateProfile = async (formData) => {
  const response = await axiosClient.post(`${API_URL}/profile/update`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  clearUserCache();
  return response.data;
};

export const logout = async () => {
  localStorage.setItem('is_logging_out', 'true');
  clearUserCache();
  try {
    const response = await axiosClient.post(`${API_URL}/logout`);
    return response.data;
  } catch (e) {
    return null;
  } finally {
    localStorage.removeItem('is_logging_out');
    localStorage.removeItem('access_token');
    try {
      sessionStorage.removeItem('current_user');
    } catch (e) {}
  }
};

export const getGoogleStatus = async (googleId) => {
  const response = await axiosClient.get(`${API_URL}/google-status?google_id=${googleId}&googleId=${googleId}`);
  return response.data;
};

export const googleRegister = async (sdt, gioiTinh, googleId) => {
  clearUserCache();
  const response = await axiosClient.post(`${API_URL}/google-register`, { 
    sdt, 
    gioiTinh, 
    google_id: googleId,
    googleId: googleId 
  });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosClient.post(`${API_URL}/forgot-password`, { EMAIL: email });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosClient.post(`${API_URL}/reset-password`, { EMAIL: email, OTP_CODE: otp, NEW_PASSWORD: newPassword });
  return response.data;
};
