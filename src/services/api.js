const TOKEN_KEY = 'auth_token';

// ✅ Función exportada como named export
export const getApiBaseUrl = () => {
    // 👉 Si corre en app móvil (Capacitor)
    if (window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost') {
        return 'http://192.168.100.2/api';
    }

    // 👉 Web normal
    return `${window.location.protocol}//${window.location.host}/api`;
};

console.log("API URL: ", getApiBaseUrl());

const API_CONFIG = {
    get BASE_URL() {
        return getApiBaseUrl();
    },
    TIMEOUT: 15000,
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    },
};

// ✅ También exportadas como named exports
export const getAuthToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

export const getHeaders = (customHeaders = {}) => {
    const headers = { ...API_CONFIG.HEADERS, ...customHeaders };
    const token = getAuthToken();

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
};

const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const { signal } = controller;

    let timeoutId;

    if (!options.signal) {
        timeoutId = setTimeout(() => {
            controller.abort();
        }, API_CONFIG.TIMEOUT);
        options.signal = signal;
    }

    try {
        // Incluimos las cabeceras de autenticación
        const headers = getHeaders(options.headers || {});

        const response = await fetch(url, {
            ...options,
            headers,
            credentials: 'include', // 🔥 ¡AGREGADO! Para enviar/recibir cookies
        });

        if (timeoutId) clearTimeout(timeoutId);
        return response;
    } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Diferenciar entre errores de timeout y otros tipos
        if (error.name === 'AbortError') {
            console.warn('Request was aborted due to timeout or navigation');
        }
        throw error;
    }
};

export const apiGet = async (endpoint, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
        method: 'GET',
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
};

export const apiPost = async (endpoint, data, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify(data),
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
};

// ✅ AGREGADO: Método DELETE para cerrar sesiones
export const apiDelete = async (endpoint, data = null, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
        method: 'DELETE',
        ...(data ? { body: JSON.stringify(data) } : {}), // ✅ si hay datos, los envía
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
};

// ✅ AGREGADO: Método PUT para actualizaciones
export const apiPut = async (endpoint, data, options = {}) => {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify(data),
        ...options,
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return await response.json();
    }
    return await response.text();
};

export const checkApiStatus = async () => {
    try {
        const response = await fetchWithTimeout(`${API_CONFIG.BASE_URL}/status`);
        return response.ok;
    } catch (error) {
        console.error('Error checking API status:', error);
        return false;
    }
};

// ✅ Export default que también incluye todas las funciones
export default {
    get: apiGet,
    post: apiPost,
    put: apiPut,      // ✅ Agregado
    delete: apiDelete, // ✅ Agregado
    checkApiStatus,
    getApiBaseUrl,
    getAuthToken,
    getHeaders,
};