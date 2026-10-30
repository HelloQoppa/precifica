import { beforeEach, describe, expect, it, vi } from 'vitest';
const disk = vi.hoisted(() => new Map<string, string>());
vi.mock('../lib/storage', () => ({ STORAGE_KEY: 'test_state', storageStatus: { message: '' }, browserStorage: {
  getItem: async (key: string) => disk.get(key) ?? null,
  setItem: async (key: string, value: string) => { disk.set(key, value); },
  removeItem: async (key: string) => { disk.delete(key); },
} }));
import { useAppStore } from './useAppStore';
import { createSeedData } from '../lib/seedData';
describe('persistência e integridade do estado', () => {
  beforeEach(() => { useAppStore.setState({ ...createSeedData(), _hasHydrated: false }); disk.clear(); });
  it('inicializa exemplos no primeiro acesso e conclui hidratação', async () => {
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState()._hasHydrated).toBe(true);
    expect(useAppStore.getState().products).toHaveLength(2);
    expect(disk.has('test_state')).toBe(true);
  });
  it('recupera as configurações persistidas', async () => {
    const saved = createSeedData(); saved.settings.proLaboreTarget = 9000;
    disk.set('test_state', JSON.stringify({ state: saved, version: 1 }));
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState().settings.proLaboreTarget).toBe(9000);
  });
  it('preserva backup da carga corrompida e recupera a interface', async () => {
    disk.set('test_state', '{broken');
    await useAppStore.persist.rehydrate();
    expect(useAppStore.getState()._hasHydrated).toBe(true);
    expect([...disk.entries()].some(([key, value]) => key.includes('_corrupted_backup_') && value === '{broken')).toBe(true);
  });
  it('remove pedidos dependentes ao excluir produto', () => {
    useAppStore.getState().deleteProduct('prod-camisa-streetwear');
    expect(useAppStore.getState().products).toHaveLength(1);
    expect(useAppStore.getState().simulations).toHaveLength(0);
  });
});
