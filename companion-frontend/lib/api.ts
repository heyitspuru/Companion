import axios from 'axios';

// Same-origin: all calls go to this app's own /api/* and are proxied to the
// backend by the Next.js rewrite (see next.config.ts). That keeps the JWT
// cookie first-party. Kept exported because a few pages build URLs from it.
export const API_BASE = '';

const BASE_URL = `${API_BASE}/api`;

// The JWT now rides in an httpOnly cookie the browser sends automatically, so
// JS never touches the token (XSS can't steal it). We only need to opt every
// request into sending credentials.
axios.defaults.withCredentials = true;

// No Authorization header anymore — auth is the cookie. Kept as a no-op config
// so the many existing call sites don't have to change.
const authHeaders = () => ({});

// Auth
export const loginUser = (data: { email: string; password: string }) =>
  axios.post(`${BASE_URL}/auth/login`, data);

export const registerUser = (data: { username: string; email: string; password: string }) =>
  axios.post(`${BASE_URL}/auth/register`, data);

export const logoutUser = () =>
  axios.post(`${BASE_URL}/auth/logout`, {});

export const forgotPassword = (email: string) =>
  axios.post(`${BASE_URL}/auth/forgot-password`, { email });

export const resetPassword = (token: string, newPassword: string) =>
  axios.post(`${BASE_URL}/auth/reset-password`, { token, newPassword });

// Circles
export const createCircle = (data: {
  name: string;
  goalTitle: string;
  goalDescription?: string;
  goalCategory: string;
  startDate: string;
  endDate: string;
  completionThreshold: string;
  customThresholdPercent?: number | null;
  timezone?: string;
}) => axios.post(`${BASE_URL}/circles/create`, data, authHeaders());

// Rally — "I've got you". Back an at-risk squadmate; returns refreshed squad status.
export const rally = (circleId: number, username: string) =>
  axios.post(`${BASE_URL}/circles/${circleId}/rally`, { username }, authHeaders());

export const joinCircle = (inviteCode: string) =>
  axios.post(`${BASE_URL}/circles/join/${inviteCode}`, {}, authHeaders());

export const getMyCircles = () =>
  axios.get(`${BASE_URL}/circles/my`, authHeaders());

export const getCircleById = (id: number) =>
  axios.get(`${BASE_URL}/circles/${id}`, authHeaders());

export const deleteCircle = (circleId: number) =>
  axios.delete(`${BASE_URL}/circles/${circleId}`, authHeaders());

export const leaveCircle = (circleId: number) =>
  axios.post(`${BASE_URL}/circles/${circleId}/leave`, {}, authHeaders());

export const concludeCircle = (
  circleId: number,
  action: 'archive' | 'extend',
  newEndDate?: string
) => axios.post(
  `${BASE_URL}/circles/${circleId}/conclude`,
  { action, newEndDate },
  authHeaders()
);

export const getArchivedCircles = () =>
  axios.get(`${BASE_URL}/circles/archived/my`, authHeaders());

// CheckIns
export const doCheckIn = (circleId: number) =>
  axios.post(`${BASE_URL}/checkins/circle/${circleId}`, {}, authHeaders());

export const getTodayCheckIns = (circleId: number) =>
  axios.get(`${BASE_URL}/checkins/circle/${circleId}/today`, authHeaders());

export const getMyCheckIns = (circleId: number) =>
  axios.get(`${BASE_URL}/checkins/circle/${circleId}/my`, authHeaders());

// Badges
export const getCircleBadges = (circleId: number) =>
  axios.get(`${BASE_URL}/badges/circle/${circleId}`, authHeaders());

export const getMyBadges = () =>
  axios.get(`${BASE_URL}/badges/my`, authHeaders());

// Tasks
export const addTask = (circleId: number, title: string) =>
  axios.post(`${BASE_URL}/tasks/circle/${circleId}`, { title }, authHeaders());

export const deleteTask = (taskId: number) =>
  axios.delete(`${BASE_URL}/tasks/${taskId}`, authHeaders());

export const getMyTasks = (circleId: number) =>
  axios.get(`${BASE_URL}/tasks/circle/${circleId}/my`, authHeaders());

export const toggleTask = (taskId: number) =>
  axios.post(`${BASE_URL}/tasks/${taskId}/toggle`, {}, authHeaders());

export const getCircleTaskSummary = (circleId: number) =>
  axios.get(`${BASE_URL}/tasks/circle/${circleId}/summary`, authHeaders());

export const updateTask = (taskId: number, title: string) =>
  axios.put(`${BASE_URL}/tasks/${taskId}`, { title }, authHeaders());

export const getCircleStats = (circleId: number) =>
  axios.get(`${BASE_URL}/circles/${circleId}/stats`, authHeaders());

export const getProfile = () =>
  axios.get(`${BASE_URL}/profile`, authHeaders());

export const updateUsername = (username: string) =>
  axios.put(`${BASE_URL}/profile/username`, { username }, authHeaders());