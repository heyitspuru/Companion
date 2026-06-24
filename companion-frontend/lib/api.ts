import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL
  : 'http://localhost:8080';

const BASE_URL = `${API_BASE}/api`;

const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

// Auth
export const loginUser = (data: { email: string; password: string }) =>
  axios.post(`${BASE_URL}/auth/login`, data);

export const registerUser = (data: { username: string; email: string; password: string }) =>
  axios.post(`${BASE_URL}/auth/register`, data);

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
}) => axios.post(`${BASE_URL}/circles/create`, data, authHeaders());

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

export const getCircleLeaderboard = (circleId: number) =>
  axios.get(`${BASE_URL}/circles/${circleId}/leaderboard`, authHeaders());

export const getCircleStats = (circleId: number) =>
  axios.get(`${BASE_URL}/circles/${circleId}/stats`, authHeaders());

export const getProfile = () =>
  axios.get(`${BASE_URL}/profile`, authHeaders());