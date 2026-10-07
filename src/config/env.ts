const apiUrl = import.meta.env.VITE_API_URL;

if (!apiUrl) {
  throw new Error('Falta la variable VITE_API_URL. Copia .env.example a .env y configúrala.');
}

export const env = {
  apiUrl: apiUrl.replace(/\/+$/, ''),
  appName: import.meta.env.VITE_APP_NAME ?? 'Kizuna',
} as const;
