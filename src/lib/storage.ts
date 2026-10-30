import { get, set, del } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';
export const STORAGE_KEY = 'chegaddepreju_app_state_v1';
export const storageStatus = { message: '' };
export const browserStorage: StateStorage = {
  async getItem(key) {
    try { const value = await get<string>(key); if (value !== undefined) return value; }
    catch { storageStatus.message = 'IndexedDB indisponível. Usando armazenamento alternativo.'; }
    try { return localStorage.getItem(key); } catch { storageStatus.message = 'Armazenamento indisponível. Os dados ficarão apenas nesta sessão.'; return null; }
  },
  async setItem(key, value) {
    // Mirror supports a later session where IndexedDB is unavailable.
    let saved = false;
    try { localStorage.setItem(key, value); saved = true; } catch { /* Try IndexedDB. */ }
    try { await set(key, value); saved = true; } catch { /* Mirror remains available. */ }
    if (!saved) storageStatus.message = 'Não foi possível salvar. Verifique o espaço e as permissões do navegador.';
  },
  async removeItem(key) { try { localStorage.removeItem(key); } catch {} try { await del(key); } catch {} },
};
