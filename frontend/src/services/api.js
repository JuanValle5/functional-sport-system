const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export async function peticionApi(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.mensaje || `Error en la operación (${response.status})`);
  }
  return data;
}

export function obtenerUrlStreamSse() {
  return `${API_BASE}/api/v1/acceso/monitor/stream`;
}
