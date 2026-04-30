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
        if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
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
    createWithContract: (data) => api.post('/employes/with-contract', data),
    update: (id, data) => api.put(`/employes/${id}`, data),
    delete: (id) => api.delete(`/employes/${id}`),
    updatePayrollTemplate: (id, data) => api.put(`/employes/${id}/payroll-template`, data),
    getPayrollTemplate: (id) => api.get(`/employes/${id}/payroll-template`)
};

// Services des congés
export const congeService = {
    getAll: (params) => api.get('/conges', { params }),
    getMyConges: () => api.get('/conges/my-conges'),
    create: (data) => api.post('/conges', data),
    approuver: (id) => api.put(`/conges/${id}/approuver`),
    refuser: (id, raison) => api.put(`/conges/${id}/refuser`, { raison })
};

// Services des départements
export const departementService = {
    getAll: () => api.get('/departements'),
    create: (data) => api.post('/departements', data),
    update: (id, data) => api.put(`/departements/${id}`, data),
    delete: (id) => api.delete(`/departements/${id}`),
    addEmploye: (deptId, employeId) => api.post(`/departements/${deptId}/employes/${employeId}`)
};

// Services des présences
export const presenceService = {
    getAll: (params) => api.get('/presences', { params }),
    getOne: (id) => api.get(`/presences/${id}`),
    create: (data) => api.post('/presences', data),
    update: (id, data) => api.put(`/presences/${id}`, data),
    delete: (id) => api.delete(`/presences/${id}`),
    // Simplified presence endpoints
    clockIn: (employeId) => api.post(`/presences/clock-in/${employeId}`),
    clockOut: (employeId) => api.post(`/presences/clock-out/${employeId}`),
    getTodayPresence: (employeId) => api.get(`/presences/today/${employeId}`),
    markAttendance: (id, data) => api.post(`/presences/mark/${id}`, data),
    getStats: () => api.get('/presences/stats')
};

// Services des contrats
export const contratService = {
    getAll: (params) => api.get('/contrats', { params }),
    getMyContract: () => api.get('/contrats/my-contract'),
    getOne: (id) => api.get(`/contrats/${id}`),
    create: (data) => api.post('/contrats', data),
    update: (id, data) => api.put(`/contrats/${id}`, data),
    delete: (id) => api.delete(`/contrats/${id}`),
    resilier: (id, raison) => api.put(`/contrats/${id}/resilier`, { raison })
};

// Services des paies
export const paieService = {
    getAll: (params) => api.get('/paies', { params }),
    getMyPaies: (params) => api.get('/paies/my-paies', { params }),
    getOne: (id) => api.get(`/paies/${id}`),
    create: (data) => api.post('/paies', data),
    update: (id, data) => api.put(`/paies/${id}`, data),
    delete: (id) => api.delete(`/paies/${id}`),
    valider: (id) => api.put(`/paies/${id}/valider`),
    payer: (id) => api.put(`/paies/${id}/payer`),
    generateBulk: (data) => api.post('/paies/generate-bulk', data),
    addAdjustment: (id, data) => api.post(`/paies/${id}/adjustments`, data),
    removeAdjustment: (id, adjustmentId) => api.delete(`/paies/${id}/adjustments/${adjustmentId}`)
};

// Services des tâches
export const taskService = {
    getAll: (params) => api.get('/tasks', { params }),
    getOne: (id) => api.get(`/tasks/${id}`),
    getEmployeTasks: (employeId, params) => api.get(`/tasks/employe/${employeId}`, { params }),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    schedule: (taskId, data) => api.post(`/tasks/${taskId}/schedule`, data)
};

export default api;
