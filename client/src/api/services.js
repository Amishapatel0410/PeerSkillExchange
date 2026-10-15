import api from './axios';

// Auth
export const authApi = {
  register: (data)         => api.post('/auth/register', data),
  login:    (data)         => api.post('/auth/login', data),
  getMe:    ()             => api.get('/auth/me'),
  updateProfile: (data)    => api.put('/auth/me', data),
  getUser:  (id)           => api.get(`/auth/users/${id}`),
};

// Matches
export const matchApi = {
  create:         (data)   => api.post('/matches', data),
  getMine:        ()       => api.get('/matches/mine'),
  getById:        (id)     => api.get(`/matches/${id}`),
  updateStatus:   (id, s)  => api.put(`/matches/${id}/status`, { status: s }),
  discover:       (params) => api.get('/matches/discover', { params }),
};

// Sessions
export const sessionApi = {
  create:          (data)        => api.post('/sessions', data),
  getMine:         (params)      => api.get('/sessions/mine', { params }),
  getById:         (id)          => api.get(`/sessions/${id}`),
  schedule:        (id, data)    => api.put(`/sessions/${id}/schedule`, data),
  updateStatus:    (id, status)  => api.put(`/sessions/${id}/status`, { status }),
  getOverlap:      (matchId)     => api.get(`/sessions/overlap/${matchId}`),
  addNote:         (id, data)    => api.post(`/sessions/${id}/notes`, data),
  getNotes:        (id)          => api.get(`/sessions/${id}/notes`),
  toggleMilestone: (id, noteId, milestoneId, completed) =>
    api.patch(`/sessions/${id}/notes/${noteId}/milestone`, { milestoneId, completed }),
};

// Chat
export const chatApi = {
  getMessages: (matchId, params) => api.get(`/chat/${matchId}`, { params }),
  sendMessage: (matchId, data)   => api.post(`/chat/${matchId}/message`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Reminders
export const reminderApi = {
  getMine: () => api.get('/reminders/mine'),
};

// Reviews
export const reviewApi = {
  create:        (data)   => api.post('/reviews', data),
  getForUser:    (userId) => api.get(`/reviews/user/${userId}`),
};
