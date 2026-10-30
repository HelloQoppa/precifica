import type { z } from 'zod';
import type { productSchema, settingsSchema, simulationSchema, storageSchema } from '../domain/validators/schemas';
export type CatalogProduct = z.infer<typeof productSchema>;
export type CompanySettings = z.infer<typeof settingsSchema>;
export type BatchSimulationOrder = z.infer<typeof simulationSchema>;
export type AppPersistedStorage = z.infer<typeof storageSchema>;
