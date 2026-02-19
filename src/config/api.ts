// In dev mode, all API calls go through the Vite proxy (same origin) so that
// cookies set by the auth service are sent to every backend.  In production the
// env vars point at the real service URLs.

const prodBase = import.meta.env.VITE_API_BASE_URL_PROD?.trim();
const authServiceBase = import.meta.env.VITE_API_AUTH_SERVICE_URL?.trim();
const projectServiceBase = import.meta.env.VITE_API_PROJECT_SERVICE_URL?.trim();

export const API_BASE_URL = import.meta.env.DEV
    ? ''
    : (prodBase || '');

export const AUTH_SERVICE_URL = import.meta.env.DEV
    ? ''
    : (authServiceBase || '');

export const PROJECT_SERVICE_URL = import.meta.env.DEV
    ? ''
    : (projectServiceBase || '');

export function apiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
}

export function authServiceUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${AUTH_SERVICE_URL}${normalizedPath}`;
}

export function projectServiceUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${PROJECT_SERVICE_URL}${normalizedPath}`;
}


