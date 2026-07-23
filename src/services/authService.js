import axiosClient from './axiosClient';

// Cấu hình axios để gửi cookie/session id cho backend

const API_URL = ""; // Bỏ /auth vì Laravel để trực tiếp ngoài cùng

export const login = async (username, password) => {
  const response = await axiosClient.post(`${API_URL}/login`, { 
    USERNAME: username, 
    PASSWORD: password 
  });
  return response.data;
};

export const register = async (userData) => {
  const payload = {
    USERNAME: userData.username,
    PASSWORD: userData.password,
    EMAIL: userData.EMAIL,
    HOTEN: userData.HOTEN,
    SDT: userData.SDT
  };
  const response = await axiosClient.post(`${API_URL}/register`, payload);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosClient.get(`${API_URL}/me`);
  const data = response.data;
  if (data && data.MAROLE !== undefined) {
    data.MAROLE = Number(data.MAROLE);
  }
  return data;
};

export const logout = async () => {
  localStorage.setItem('is_logging_out', 'true');
  try {
    const response = await axiosClient.post(`${API_URL}/logout`);
    return response.data;
  } finally {
    localStorage.removeItem('is_logging_out');
  }
};

export const getGoogleStatus = async () => {
  const response = await axiosClient.get(`${API_URL}/google-status`);
  return response.data;
};

export const googleRegister = async (sdt, gioiTinh) => {
  const response = await axiosClient.post(`${API_URL}/google-register`, { sdt, gioiTinh });
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await axiosClient.post(`${API_URL}/forgot-password`, { email });
  return response.data;
};

export const resetPassword = async (email, otp, newPassword) => {
  const response = await axiosClient.post(`${API_URL}/reset-password`, { email, otp, newPassword });
  return response.data;
};
