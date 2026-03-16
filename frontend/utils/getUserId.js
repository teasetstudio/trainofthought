import { getAuthUser } from './authState.js';

export function getUserId() {
  return getAuthUser()?.id || '';
}
