import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

API.interceptors.request.use(config => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  if (user?.id && (config.method === 'get' || config.method === 'delete')) {
    config.params = { ...config.params, userId: user.id };
  }
  return config;
});

export default API;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const login    = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUser = (id) => {
  const me = JSON.parse(localStorage.getItem('user') || 'null');
  return API.get(`/users/${id}`, { params: { viewerId: me?.id } });
};

// FIX: pass viewerId so backend can compute isFollowing correctly
export const getAllUsers = () => {
  const me = JSON.parse(localStorage.getItem('user') || 'null');
  return API.get('/users', { params: { viewerId: me?.id } });
};

export const searchUsers = (q) => {
  const me = JSON.parse(localStorage.getItem('user') || 'null');
  return API.get('/users/search', { params: { q, viewerId: me?.id } });
};

export const followUser = (targetId) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return API.post(`/users/${targetId}/follow`, null, { params: { userId: user.id } });
};

export const getFollowers     = (id)       => API.get(`/users/${id}/followers`);
export const getFollowing     = (id)       => API.get(`/users/${id}/following`);
export const updateProfile    = (id, data) => API.put(`/users/${id}`, data);
export const uploadProfilePic = (id, file) => {
  const fd = new FormData();
  fd.append('file', file);
  return API.post(`/users/${id}/profile-pic`, fd);
};

// ── Posts ─────────────────────────────────────────────────────────────────────
export const getFeed          = ()       => API.get('/posts/feed');
export const getFollowingFeed = ()       => API.get('/posts/feed/following');
export const getUserPosts     = (userId) => API.get(`/posts/user/${userId}`);
export const createPost       = (formData) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return API.post('/posts', formData, { params: { userId: user.id } });
};
export const likePost   = (postId) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return API.post(`/posts/${postId}/like`, null, { params: { userId: user.id } });
};
export const deletePost = (postId) => API.delete(`/posts/${postId}`);

// ── Comments ──────────────────────────────────────────────────────────────────
export const getComments   = (postId)          => API.get(`/posts/${postId}/comments`);
export const addComment    = (postId, content) => {
  const user = JSON.parse(localStorage.getItem('user'));
  return API.post(`/posts/${postId}/comments`, { content }, { params: { userId: user.id } });
};
export const deleteComment = (postId, commentId) =>
  API.delete(`/posts/${postId}/comments/${commentId}`);

// ── Messages ──────────────────────────────────────────────────────────────────
export const sendMessage     = (senderId, receiverId, content) =>
  API.post('/messages', { senderId, receiverId, content });
export const getConversation = (userA, userB) =>
  API.get('/messages/conversation', { params: { userA, userB } });
export const getInbox = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return API.get('/messages/inbox', { params: { userId: user.id } });
};