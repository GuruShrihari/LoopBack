import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export const login = async (username: string, password: string):Promise<Token> => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);
  
  const response = await apiClient.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data;
};

export const register = async (email: string, password: string, full_name: string, role: string):Promise<User> => {
  const response = await apiClient.post('/auth/register', { email, password, full_name, role });
  return response.data;
};

export const getMe = async ():Promise<User> => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};
