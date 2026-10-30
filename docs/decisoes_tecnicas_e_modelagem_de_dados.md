# Documento de Design Técnico e Dados (design.md)

Este documento especifica a modelagem de dados, estratégias de persistência local resiliente a recarregamentos (`F5`), contratos de entidades, relacionamentos e o pipeline de *Seed Data* / Mocking da aplicação.

---

## 1. Estratégia de Persistência Local (Sobrevivência ao F5)

Para garantir que o usuário não perca suas configurações, custos fixos, catálogo e simulações ao atualizar a página (`F5`), fechar a aba ou navegar offline, a persistência é baseada em uma arquitetura **Local-First**.

### 1.1. Tecnologia Escolhida: `IndexedDB` com Fallback para `localStorage`

* **Mecanismo Primário:** `IndexedDB` encapsulado via biblioteca leve (`idb-keyval` ou `Dexie.js`), permitindo armazenamento transacional, assíncrono e sem travar a thread de renderização da UI.
* **Mecanismo de Camada de Estado (Zustand Persist Middleware):**
  * O estado em memória da aplicação é orquestrado via **Zustand**.
  * É configurado o middleware oficial `persist`, acoplado a um adaptador assíncrono sobre o `IndexedDB` (ou `localStorage` serializado em JSON com *storage event sync*).
  * **Chave de armazenamento principal:** `chegaddepreju_app_state_v1`.
  * **Estratégia de Hidratação:** Na inicialização do React (`onRehydrateStorage`), o store bloqueia a renderização de telas dinâmicas por meio de um indicador `_hasHydrated: boolean` para evitar *hydration mismatch* (Next.js SSR vs. LocalStorage do cliente).

---

## 2. Modelagem de Entidades e Relacionamentos

### 2.1. Diagrama Entidade-Relacionamento Lógico (ERD)

```
┌─────────────────────────────────┐
│     CompanySettings (Global)    │
├─────────────────────────────────┤
│ id (PK)                         │
│ fixed_costs_items: CostItem[]   │
│ pro_labore_target: number       │
│ emergency_reserve_pct: number   │
└────────────────┬────────────────┘
                 │ 1 (impacta cálculo de Break-Even de todos os itens)
                 ▼
┌─────────────────────────────────┐       1:N       ┌──────────────────────────────┐
│       CatalogProduct (PK)       ├─────────────────►│      ProductIngredient       │
├─────────────────────────────────┤                 ├──────────────────────────────┤
│ id: UUID (PK)                   │                 │ id: UUID (PK)                │
│ name: string                    │                 │ product_id: UUID (FK)        │
│ tax_rate_pct: number            │                 │ name: string                 │
│ target_margin_pct: number       │                 │ unit_cost: number            │
│ practiced_price: number         │                 └──────────────────────────────┘
│ created_at: string              │
└────────────────┬────────────────┘
                 │ 1
                 │
                 │ 1:N (um produto pode ter múltiplos lotes simulados)
                 ▼
┌─────────────────────────────────┐
│     BatchSimulationOrder        │
├─────────────────────────────────┤
│ id: UUID (PK)                   │
│ product_id: UUID (FK)           │
│ quantity: number                │
│ discount_pct: number            │
│ applied_unit_price: number      │
│ simulation_date: string         │
│ send_to_balance: boolean        │
└────────────────┬────────────────┘
                 │
                 │ Consolidação 
                 ▼
┌─────────────────────────────────┐
│   ProjectedBalanceEntry (Mês)   │
├─────────────────────────────────┤
│ product_id: UUID (FK)           │
│ total_quantity_projected: number│
│ effective_weighted_price: number│
│ total_revenue: number           │
│ total_variable_costs: number    │
│ total_taxes: number             │
└─────────────────────────────────┘
```

---

### 2.2. Interfaces e Tipagem Canônica (TypeScript)

```typescript
export type UUID = string;

/**
 * Item de Despesa Fixa da Operação
 */
export interface FixedCostItem {
  id: UUID;
  name: string;
  amount: number; // Armazenado em valor monetário float/inteiro de centavos
}

/**
 * Configuração Financeira Global da Empresa
 */
export interface CompanySettings {
  id: string; // ex: 'default_settings'
  fixedCosts: FixedCostItem[];
  proLaboreTarget: number;       // Ex: 5000.00 (Salário líquido pretendido)
  emergencyReservePct: number;   // Ex: 0.15 (15% sobre os custos fixos)
  updatedAt: string;
}

/**
 * Insumo que compõe o Custo Variável
 */
export interface ProductIngredient {
  id: UUID;
  name: string;
  unitCost: number; // Ex: 12.50
}

/**
 * Entidade do Catálogo de Produtos
 */
export interface CatalogProduct {
  id: UUID;
  name: string;
  ingredients: ProductIngredient[];
  taxRatePct: number;          // Ex: 0.08 para 8%
  targetMarginPct: number;     // Ex: 0.25 para 25%
  practicedPrice: number;      // Preço praticado atual em R$
  createdAt: string;
  updatedAt: string;
}

/**
 * Simulação de Pedido / Desconto por Volume
 */
export interface BatchSimulationOrder {
  id: UUID;
  productId: UUID;
  quantity: number;            // Quantidade de unidades no lote (ex: 100)
  discountPct: number;         // Desconto aplicado (ex: 0.10 para 10%)
  appliedUnitPrice: number;    // Preço final unitário com desconto
  sendToBalance: boolean;      // Flag que determina se alimenta o Balancete Mensal
  simulatedAt: string;
}

/**
 * Estado Raiz Persistido no Navegador
 */
export interface AppPersistedStorage {
  version: number;
  settings: CompanySettings;
  products: CatalogProduct[];
  simulations: BatchSimulationOrder[];
}
```

---

## 3. Estratégia de "Seed Data" e Mocking

Para validação em desenvolvimento, demonstração interativa imediata e testes automatizados de ponta a ponta sem exigir que o usuário cadastre 10 formulários do zero, implementa-se um pipeline de sementes (*seeding*).

### 3.1. Gatilho de Ativação do Seed

O sistema aplica o estado inicial de duas formas:
1. **Automático (First-Load Initialization):** Quando a chave de armazenamento local (`chegaddepreju_app_state_v1`) não for encontrada no carregamento inicial da aplicação.
2. **Manual (Ação do Usuário):** Um botão explícito na UI (*"Restaurar Dados de Exemplo / Demonstração"*), permitindo ao testador redefinir o estado a qualquer momento sem limpar manualmente o navegador.

### 3.2. Dataset Canônico de Demonstração (`seedData.ts`)

O conjunto de dados inicial reflete uma pequena confecção/personalização têxtil, cenário clássico onde o erro de precificação ocorre:

```typescript
export const INITIAL_SEED_DATA: AppPersistedStorage = {
  version: 1,
  settings: {
    id: "default_settings",
    fixedCosts: [
      { id: "fix-1", name: "Aluguel da Oficina", amount: 1500.00 },
      { id: "fix-2", name: "Energia Elétrica", amount: 350.00 },
      { id: "fix-3", name: "Internet / Software", amount: 180.00 },
      { id: "fix-4", name: "Contabilidade", amount: 320.00 },
    ],
    proLaboreTarget: 3500.00,
    emergencyReservePct: 0.10, // 10% sobre custos fixos = R$ 235,00
    updatedAt: new Date().toISOString(),
  },
  products: [
    {
      id: "prod-camisa-streetwear",
      name: "Camiseta Algodão Estonada (Silk 2 Cores)",
      taxRatePct: 0.08, // 8% (DAS / MEI ampliado / Gateway)
      targetMarginPct: 0.35, // 35% de margem limpa
      practicedPrice: 69.90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredients: [
        { id: "ing-1", name: "Malha Algodão Penteado 30.1", unitCost: 18.50 },
        { id: "ing-2", name: "Tinta Serigráfica e Emulsão", unitCost: 3.20 },
        { id: "ing-3", name: "Etiqueta e Tag", unitCost: 1.10 },
        { id: "ing-4", name: "Saco Plástico e Fita de Envio", unitCost: 1.40 },
      ], // Custo Variável Total: R$ 24,20
    },
    {
      id: "prod-caneca-ceramica",
      name: "Caneca de Cerâmica Sublimada",
      taxRatePct: 0.06,
      targetMarginPct: 0.40,
      practicedPrice: 38.00,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ingredients: [
        { id: "ing-5", name: "Caneca Resinada Base", unitCost: 11.00 },
        { id: "ing-6", name: "Papel e Tinta Sublimática", unitCost: 1.80 },
        { id: "ing-7", name: "Caixinha Individual Kraft", unitCost: 2.20 },
      ], // Custo Variável Total: R$ 15,00
    },
  ],
  simulations: [
    {
      id: "sim-lote-100-camisas",
      productId: "prod-camisa-streetwear",
      quantity: 100,
      discountPct: 0.12, // 12% de desconto concedido
      appliedUnitPrice: 61.51,
      sendToBalance: true,
      simulatedAt: new Date().toISOString(),
    },
  ],
};
```

---

## 4. Gerenciamento de Migrações e Resiliência

Para evitar que futuras atualizações de schema quebrem o armazenamento de clientes existentes:

1. **Versionamento de Schema:** Toda carga de dados valida a propriedade `version`.
2. **Migration Pipeline:**
   ```typescript
   export function migrateStorageState(rawState: any): AppPersistedStorage {
     if (!rawState || typeof rawState !== 'object') {
       return INITIAL_SEED_DATA;
     }

     let state = { ...rawState };

     // Exemplo de Migração: V1 -> V2 (se campos futuros forem adicionados)
     if (state.version === 1) {
       // state.newField = state.newField ?? defaultValue;
     }

     return state as AppPersistedStorage;
   }
   ```
3. **Mecanismo de Resgate (Safe Fallback):** Caso ocorra um erro de *parsing* JSON (`SyntaxError`), o middleware captura a exceção, faz backup do dado corrompido em uma chave temporária (`_corrupted_backup_timestamp`) e restaura com segurança os dados canônicos (`INITIAL_SEED_DATA`), prevenindo travamento permanente da interface (*White Screen of Death*).