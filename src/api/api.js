import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/v1',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const adminService = {
    login: (email, password) => api.post('/admin/login', { email, password }).then(res => res.data),
    getStats: () => api.get('/admin/stats').then(res => res.data),
};

export const authService = {
    login: async (email, password) => {
        const response = await api.post('/admin/login', { email, password });
        return response.data;
    },
};

export const customerService = {
    getAll: () => api.get('/user/allCustomers').then(res => res.data),
    add: (data) => api.post('/user/addCustomer', data).then(res => res.data),
    getOne: (id) => api.get(`/user/oneCustomer?customerId=${id}`).then(res => res.data),
    search: (query, type) => api.get(`/user/oneCustomer?queryText=${query}&type=${type}`).then(res => res.data),
    getProfile: (id) => api.get(`/user/customerProfile?customerId=${id}`).then(res => res.data),
    delete: (phone) => api.delete(`/user/deleteCustomer?phoneNumber=${phone}`).then(res => res.data),
};

export const sizingService = {
    add: (data) => api.post('/user/addSize', data).then(res => res.data),
    update: (data) => api.patch('/user/updateSize', data).then(res => res.data),
    get: (customerId) => api.get(`/user/getSize?customerId=${customerId}`).then(res => res.data),
};

export const orderService = {
    add: (data) => api.post('/order/addOrder', data).then(res => res.data),
    getAll: () => api.get('/order/allOrders').then(res => res.data),
    getByCustomer: (id) => api.get(`/order/allOrdersBySingleUser?customerId=${id}`).then(res => res.data),
    getOne: (id) => api.get(`/order/oneOrder?orderId=${id}`).then(res => res.data),
    updateStatus: (id, status) => api.patch(`/order/updateStatus/${id}`, { orderStatus: status }).then(res => res.data),
    delete: (id) => api.delete(`/order/deleteOrder?orderId=${id}`).then(res => res.data),
};

export const uploadService = {
    uploadImage: (formData) => api.post('/user/uploadImage', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data),
};

export default api;
