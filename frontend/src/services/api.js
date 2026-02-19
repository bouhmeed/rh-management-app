// frontend/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Services d'authentification
export const authService = {
    login: (email, motDePasse) => api.post('/auth/login', { email, motDePasse }),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getMe: () => api.get('/auth/me')
};

// Services des employés
export const employeService = {
    getAll: (params) => api.get('/employes', { params }),
    getOne: (id) => api.get(`/employes/${id}`),
    create: (data) => api.post('/employes', data),
    update: (id, data) => api.put(`/employes/${id}`, data),
    delete: (id) => api.delete(`/employes/${id}`)
};

// Services des congés
export const congeService = {
    getAll: (params) => api.get('/conges', { params }),
    create: (data) => api.post('/conges', data),
    approuver: (id) => api.put(`/conges/${id}/approuver`),
    refuser: (id, raison) => api.put(`/conges/${id}/refuser`, { raison })
};

// Services des départements
export const departementService = {
    getAll: () => api.get('/departements'),
    create: (data) => api.post('/departements', data),
    addEmploye: (deptId, employeId) => api.post(`/departements/${deptId}/employes/${employeId}`)
};

export default api;