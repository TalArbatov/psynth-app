const DEFAULT_DEV_API_BASE_URL = 'http://localhost:4000';
const DEFAULT_PROD_API_BASE_URL = 'http://localhost:4000';
const DEFAULT_AUTH_SERVICE_URL = 'http://localhost:3050';

const devBase = import.meta.env.VITE_API_BASE_URL_DEV?.trim();
const prodBase = import.meta.env.VITE_API_BASE_URL_PROD?.trim();
const authServiceBase = import.meta.env.VITE_API_AUTH_SERVICE_URL?.trim();
const projectServiceBase = import.meta.env.VITE_API_PROJECT_SERVICE_URL?.trim();

export const API_BASE_URL = import.meta.env.DEV
    ? (devBase || DEFAULT_DEV_API_BASE_URL)
    : (prodBase || DEFAULT_PROD_API_BASE_URL);

export const AUTH_SERVICE_URL = authServiceBase || DEFAULT_AUTH_SERVICE_URL;
export const PROJECT_SERVICE_URL = projectServiceBase || DEFAULT_AUTH_SERVICE_URL;


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


