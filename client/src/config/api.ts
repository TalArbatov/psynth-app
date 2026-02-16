const DEFAULT_DEV_API_BASE_URL = 'http://localhost:4000';
const DEFAULT_PROD_API_BASE_URL = 'http://localhost:4000';
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3050';

const devBase = import.meta.env.VITE_API_BASE_URL_DEV?.trim();
const prodBase = import.meta.env.VITE_API_BASE_URL_PROD?.trim();
const authBase = import.meta.env.VITE_API_AUTH_SERVICE_URL?.trim();

export const API_BASE_URL = import.meta.env.DEV
  ? (devBase || DEFAULT_DEV_API_BASE_URL)
  : (prodBase || DEFAULT_PROD_API_BASE_URL);

export const AUTH_SERVICE_URL = authBase || DEFAULT_AUTH_SERVICE_URL;

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function authUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${AUTH_SERVICE_URL}${normalizedPath}`;
}
