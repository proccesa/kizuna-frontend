const TOKEN_KEY = 'kizuna.token';

/** Persistencia del token de Sanctum. Tolera navegadores sin almacenamiento. */
export const tokenStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* sin almacenamiento disponible */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* sin almacenamiento disponible */
    }
  },
};
