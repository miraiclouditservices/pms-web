// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pms-backend-zk6g.onrender.com/api';

export const fetchApi = async (endpoint: string, options: any = {}) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    const data = await response.json();

    if (!response.ok) {
        if (response.status === 401 && typeof window !== 'undefined') {
            // Do not force redirect for login or register endpoints
            const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
            if (!isAuthEndpoint) {
                // Clear invalid token and user datanpm run dev
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Redirect to login page
                window.location.href = '/login';
            }
        }
        throw new Error(data.error || 'Something went wrong');
    }

    return data;
};

export const api = {
    get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => fetchApi(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    put: (endpoint: string, body: any) => fetchApi(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    patch: (endpoint: string, body: any) => fetchApi(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
};
