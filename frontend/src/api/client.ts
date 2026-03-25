// Uses VITE_API_URL from environment variables.
// - For local dev: set in .env.local (http://localhost:3001/api)
// - For production: set VITE_API_URL in Vercel dashboard → Environment Variables
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const handleResponse = async (res: Response) => {
    if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || `HTTP error! Status: ${res.status}`);
    }
    return res.json();
};

export const fetchMetrics = async () => {
    try {
        const res = await fetch(`${API_BASE}/metrics`);
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const fetchBackups = async () => {
    try {
        const res = await fetch(`${API_BASE}/backups`);
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const createBackup = async (data: any) => {
    try {
        const res = await fetch(`${API_BASE}/backups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const fetchClusters = async () => {
    try {
        const res = await fetch(`${API_BASE}/clusters`);
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const fetchSchedules = async () => {
    try {
        const res = await fetch(`${API_BASE}/schedules`);
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const fetchRestores = async () => {
    try {
        const res = await fetch(`${API_BASE}/restores`);
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const createRestore = async (data: any) => {
    try {
        const res = await fetch(`${API_BASE}/restores`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const createCluster = async (data: any) => {
    try {
        const res = await fetch(`${API_BASE}/clusters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};

export const createSchedule = async (data: any) => {
    try {
        const res = await fetch(`${API_BASE}/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await handleResponse(res);
    } catch (err: any) { throw new Error(err.message || "Network Error or CORS"); }
};
