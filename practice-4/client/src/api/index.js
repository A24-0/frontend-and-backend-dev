import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json', accept: 'application/json' },
});

export const api = {
  getProducts: () => apiClient.get('/products').then((r) => r.data),
  getProductById: (id) => apiClient.get(`/products/${id}`).then((r) => r.data),
  createProduct: (product) => apiClient.post('/products', product).then((r) => r.data),
  updateProduct: (id, product) => apiClient.patch(`/products/${id}`, product).then((r) => r.data),
  deleteProduct: (id) => apiClient.delete(`/products/${id}`),
};
