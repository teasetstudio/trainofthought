import { getWebSocketClient } from './getWebSocketClient.js';
import { getUserId } from './getUserId.js';
import { getRoomIdFromPath } from './getRoomIdFromPath.js';
import { navigateToPath } from './navigateToPath.js';
import {
	clearAuthSession,
	fetchWithAuth,
	getAuthSession,
	getAuthToken,
	getAuthUser,
	isAuthenticated,
	redirectAuthenticated,
	requireAuth,
	setAuthSession,
} from './authState.js';

export {
	clearAuthSession,
	fetchWithAuth,
	getAuthSession,
	getAuthToken,
	getAuthUser,
	getRoomIdFromPath,
	getUserId,
	getWebSocketClient,
	isAuthenticated,
	navigateToPath,
	redirectAuthenticated,
	requireAuth,
	setAuthSession,
};
