import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1',
  headers: { 'Content-Type': 'application/json' },
});

// ✅ Every request carries whatever JWT is currently stored (issued at
// login by any of the three roles — admin/worker/customer share one slot
// since only one portal is ever logged in at a time on a given device).
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sd_auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ✅ If the token is missing/expired/invalid, the backend replies 401 —
// clear every stored session so the app falls back to the login screen
// instead of getting stuck retrying with a dead token.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sd_auth_token');
      localStorage.removeItem('sd_master_auth');
      localStorage.removeItem('sd_worker_auth');
      localStorage.removeItem('sd_customer_auth');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const adminService = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
};

// ✅ One shared login for everyone — admin and workers both call this.
// The backend decides who the person is and what access they get.
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }).then(r => r.data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }).then(r => r.data),
  resetPassword: (payload) => api.post('/auth/reset-password', payload).then(r => r.data),
};

export const customerService = {
  getAll:     ()            => api.get('/user/allCustomers').then(r => r.data),
  add:        (data)        => api.post('/user/addCustomer', data).then(r => r.data),
  search:     (query, type) => api.get(`/user/oneCustomer?queryText=${encodeURIComponent(query)}&type=${type}`).then(r => r.data),
  getProfile: (id)          => api.get(`/user/customerProfile?customerId=${id}`).then(r => r.data),
  // ✅ FIXED: delete by customerId (_id), not phone number
  delete:     (customerId)  => api.delete(`/user/deleteCustomer?customerId=${customerId}`).then(r => r.data),
  // Customer Portal self-signup — creates the account and logs the customer
  // straight in (no admin approval needed, unlike worker self-registration).
  register:   (data)        => api.post('/user/registerCustomer', data).then(r => r.data),
};

export const sizingService = {
  add:    (data)       => api.post('/user/addSize', data).then(r => r.data),
  update: (data)       => api.patch('/user/updateSize', data).then(r => r.data),
  get:    (customerId) => api.get(`/user/getSize?customerId=${customerId}`).then(r => r.data),
};

export const orderService = {
  add:          (data)          => api.post('/order/addOrder', data).then(r => r.data),
  update:       (id, data)      => api.patch(`/order/editOrder/${id}`, data).then(r => r.data),
  getAll:       ()              => api.get('/order/allOrders').then(r => r.data),
  getByCustomer:(id)            => api.get(`/order/allOrdersBySingleUser?customerId=${id}`).then(r => r.data),
  getOne:       (id)            => api.get(`/order/oneOrder?orderId=${id}`).then(r => r.data),
  updateStatus: (id, payload)   => {
    const body = typeof payload === 'string' ? { orderStatus: payload } : payload;
    return api.patch(`/order/updateStatus/${id}`, body).then(r => r.data);
  },
  delete:       (id)            => api.delete(`/order/deleteOrder?orderId=${id}`).then(r => r.data),
  // Worker taps "Mark Done" — flags the order for admin review without
  // changing its actual status/stage.
  requestCompletion: (id, payload) => api.patch(`/order/requestCompletion/${id}`, payload).then(r => r.data),
  // Worker's own happy-path status for their current stage: Pending ->
  // In-Progress -> Completed-Review -> Completed. The final step also
  // flags the order for admin review (same as requestCompletion did).
  updateWorkerStatus: (id, payload) => api.patch(`/order/updateWorkerStatus/${id}`, payload).then(r => r.data),
  // Admin's written reply to a worker's "Blocked" note.
  sendGuidance: (id, payload) => api.patch(`/order/sendGuidance/${id}`, payload).then(r => r.data),
  // Public order tracking (Customer Portal's "Track Order by ID" box) —
  // no login required, only returns safe, non-sensitive fields.
  track:        (orderId)       => api.get(`/order/track?orderId=${orderId}`).then(r => r.data),
};

// Worker accounts are managed by the admin (Workers page). Workers can also
// self-register from the public Create Account page — that request sits
// pending until the admin approves it. Worker login itself always goes
// through authService.login, same as everyone else.
export const workerService = {
  add:      (data)     => api.post('/worker/addWorker', data).then(r => r.data),
  getAll:   ()          => api.get('/worker/allWorkers').then(r => r.data),
  update:   (id, data)  => api.patch(`/worker/updateWorker/${id}`, data).then(r => r.data),
  delete:   (id)         => api.delete(`/worker/deleteWorker/${id}`).then(r => r.data),
  register: (data)      => api.post('/worker/register', data).then(r => r.data),
  approve:  (id)         => api.patch(`/worker/approveWorker/${id}`).then(r => r.data),
};

// Admin's design catalog — designs are images (uploaded to Cloudinary on
// the backend) plus a name and optional description. add/update send
// multipart/form-data since they carry an image file.
export const designService = {
  getAll:  ()               => api.get('/design/allDesigns').then(r => r.data),
  add:     (formData)       => api.post('/design/addDesign', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  update:  (id, formData)   => api.patch(`/design/updateDesign/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
  delete:  (id)              => api.delete(`/design/deleteDesign?designId=${id}`).then(r => r.data),
};

export default api;
