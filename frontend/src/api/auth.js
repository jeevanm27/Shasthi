import { api } from './client.js';

export const authApi = {
  register: (name, email, password) =>
    api.post('/api/users/register', { name, email, password }),

  registerAdmin: (name, email, password, adminKey) =>
    api.postAdmin('/api/users/register', { name, email, password }, adminKey),

  login: (email, password) =>
    api.post('/api/users/login', { email, password }),

  me: () =>
    api.get('/api/users/me'),
};
