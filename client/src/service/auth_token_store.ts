import axios from 'axios';
import { API_URL } from '@/config/config';

type Principal = 'administrator' | 'member';

const accessTokens: Record<Principal, string | null> = {
  administrator: null,
  member: null,
};

export function getAccessToken(principal: Principal) {
  return accessTokens[principal];
}

export function setAccessToken(principal: Principal, token: string) {
  accessTokens[principal] = token;
}

export function clearAccessToken(principal: Principal) {
  accessTokens[principal] = null;
}

export function clearLegacyTokenStorage() {
  localStorage.removeItem('administrator_access_token');
  localStorage.removeItem('administrator_refresh_token');
  localStorage.removeItem('member_access_token');
  localStorage.removeItem('member_refresh_token');
}

export async function restoreAccessToken(principal: Principal) {
  if (accessTokens[principal]) return true;
  try {
    const response = await axios.post(
      `${API_URL}/auth/${principal}/refresh`,
      {},
      { withCredentials: true },
    );
    if (!response.data?.access_token) return false;
    accessTokens[principal] = response.data.access_token;
    return true;
  } catch {
    accessTokens[principal] = null;
    return false;
  }
}
