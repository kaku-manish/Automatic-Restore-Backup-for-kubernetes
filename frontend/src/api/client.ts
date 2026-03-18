// Uses VITE_API_URL from environment variables.
// - For local dev: set in .env.local (http://localhost:3001/api)
// - For production: set VITE_API_URL in Vercel dashboard → Environment Variables
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const fetchMetrics = async () => {
    const res = await fetch(`${API_BASE}/metrics`);
    return res.json();
};

export const fetchBackups = async () => {
    const res = await fetch(`${API_BASE}/backups`);
    return res.json();
};

export const createBackup = async (data: any) => {
    const res = await fetch(`${API_BASE}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const fetchClusters = async () => {
    const res = await fetch(`${API_BASE}/clusters`);
    return res.json();
};

export const fetchSchedules = async () => {
    const res = await fetch(`${API_BASE}/schedules`);
    return res.json();
};

export const fetchRestores = async () => {
    const res = await fetch(`${API_BASE}/restores`);
    return res.json();
};

export const createRestore = async (data: any) => {
    const res = await fetch(`${API_BASE}/restores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const createCluster = async (data: any) => {
    const res = await fetch(`${API_BASE}/clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};

export const createSchedule = async (data: any) => {
    const res = await fetch(`${API_BASE}/schedules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    return res.json();
};
