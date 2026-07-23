import axiosClient from './axiosClient';

const API_URL = '/tin-tuc';

export const getTinTuc = async () => {
  const response = await axiosClient.get(API_URL);
  return response.data;
};
