import api from './axios'

export const authApi = {
  signup:          (data) => api.post('/user/signup', data),
  signin:          (data) => api.post('/user/signin', data),
  signout:         ()     => api.post('/user/signout'),
  signoutAll:      ()     => api.post('/user/signout-all'),
  me:              ()     => api.get('/user/me'),
  refresh:         ()     => api.post('/user/refresh'),
  verifyEmail:     (token) => api.post('/user/verify-email', { token }),
  forgotPassword:  (email) => api.post('/user/forgot-password', { email }),
  resetPassword:   (data) => api.post('/user/reset-password', data),
  changePassword:  (data) => api.post('/user/changepassword', data),
}

export const usersApi = {
  // getSessions: () => api.get('/user/me/sessions'),
  // list: (params) => api.get('/user', { params }),
  update: (id, data) => api.patch(`/user/${id}`, data),
  delete: (id) => api.delete(`/user/${id}`),
  getAllUsers:     ()     => api.get('/user/allusers'),
  getUsersByIds:   (ids)  => api.get('/user/usersByIds', { params: { ids } }),
}