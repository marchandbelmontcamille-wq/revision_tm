import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  API_URL: 'tm_api_url',
  TOKEN: 'tm_token',
};

export async function getApiUrl() {
  return await AsyncStorage.getItem(STORAGE_KEYS.API_URL) || 'http://10.0.2.2:5000';
}

export async function setApiUrl(url) {
  await AsyncStorage.setItem(STORAGE_KEYS.API_URL, url);
}

export async function getToken() {
  return await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
}

export async function setToken(token) {
  await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
}

async function apiFetch(path, options = {}) {
  const baseUrl = await getApiUrl();
  const token = await getToken();
  const res = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    throw new Error('AUTH_FAILED');
  }
  return res.json();
}

export async function login(apiUrl, password) {
  const res = await fetch(`${apiUrl}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (data.success) {
    await setApiUrl(apiUrl);
    await setToken(data.token);
    return true;
  }
  return false;
}

export async function getCampaigns() {
  return apiFetch('/api/campaigns');
}

export async function getCampaign(id) {
  return apiFetch(`/api/campaigns/${id}`);
}

export async function getTasksToday(campaignId) {
  return apiFetch(`/api/campaigns/${campaignId}/tasks/today`);
}

export async function getTasksUpcoming(campaignId) {
  return apiFetch(`/api/campaigns/${campaignId}/tasks/upcoming`);
}

export async function toggleTask(campaignId, taskIndex) {
  return apiFetch(`/api/campaigns/${campaignId}/toggle/${taskIndex}`, {
    method: 'POST',
  });
}
