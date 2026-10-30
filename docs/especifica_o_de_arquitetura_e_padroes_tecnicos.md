# Especificação de Arquitetura, Tecnologias e Padrões

Este documento define o objetivo central, a arquitetura de software, a stack tecnológica obrigatória e as convenções de engenharia para o desenvolvimento do sistema de simulação de precificação, gestão de lotes e balancete financeiro projetado.

---

## 1. Objetivo Central do Sistema

O objetivo central é fornecer uma plataforma interativa, reativa e de alta precisão financeira que elimine a venda com prejuízo para micro, pequenos empreendedores e prestadores de serviços. 

O sistema consolida em um fluxo unificado e contínuo:
1. **Formação Técnica de Preço:** Cálculo de markup divisor (*cálculo por dentro*), incorporando insumos variáveis, impostos/taxas e margem limpa.
2. **Mitigação de Risco em Negociações:** Um simulador dinâmico de descontos por volume/lote com detecção em tempo real do Ponto de Lucro Zero (desconto máximo seguro).
3. **Visibilidade de Sustentabilidade Mensal:** Um balancete financeiro projetado que conecta o volume de vendas negociado à cobertura dos custos fixos, retirada de pró-labore e constituição de reserva operacional.

---

## 2. Arquitetura do Sistema

### 2.1. Estilo Arquitetural
Adota-se uma **Arquitetura Baseada em Camadas Desacopladas (Clean/Layered Client Architecture)** com processamento prioritário no lado do cliente (*client-side first*). 

A separação lógica organiza-se em quatro camadas:

```
┌─────────────────────────────────────────────────────────────┐
│  Apresentação (UI Components & Pages)                       │
│  - Shadcn/ui + Tailwind CSS + Lucide Icons                  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  Gerenciamento de Estado & Orquestração (Store Layer)       │
│  - Zustand Stores (Catalogo, Simulador, Balancete, Configs) │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  Domínio & Motor de Cálculo (Domain Services / Pure Math)   │
│  - Funções puras em TypeScript                              │
│  - Precisão arbitrária via Dinero.js / Decimal.js           │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│  Persistência & Adapters (Data Layer)                       │
│  - LocalStorage / IndexedDB (Local-First Offline)           │
│  - Supabase / API Restful (Sincronização em Nuvem Opcional) │
└─────────────────────────────────────────────────────────────┘
```

### 2.2. Diretrizes Arquiteturais
* **Motor Reativo Unidirecional:** Alterações em custos fixos ou custos de insumos recalculam instantaneamente métricas derivadas (Ponto de Equilíbrio, Meta Ideal e Balancete).
* **Local-First:** O aplicativo deve operar 100% de forma autônoma sem requisições de rede para cálculos matemáticos ou persistência inicial.
* **Isolamento de Domínio:** Todas as fórmulas financeiras (Markup, Margem de Contribuição, Ponto de Equilíbrio, Balancete) devem residir em arquivos de serviço puros, sem acoplamento com hooks do React ou elementos de tela.

---

## 3. Tecnologias Obrigatórias

| Camada / Função | Tecnologia | Versão / Padrão | Justificativa |
| :--- | :--- | :--- | :--- |
| **Linguagem** | TypeScript | `^5.x` (Strict Mode) | Tipagem estática rigorosa para estruturas financeiras e contratos de dados. |
| **Framework Web** | React com Next.js (App Router) | `^14.x` ou `^15.x` | Renderização híbrida otimizada, estrutura moderna de rotas e escalabilidade. |
| **Estilização** | Tailwind CSS | `^3.4+` | Design system utilitário, consistente e com suporte nativo a temas (Dark/Light). |
| **Biblioteca de UI** | Radix UI + Shadcn/ui | Componentes acessíveis (WAI-ARIA) | Componentes reutilizáveis sem dependência de runtime pesado, altamente customizáveis. |
| **Iconografia** | Lucide React | Padrão | Conjunto leve e consistente de ícones. |
| **Gerenciamento de Estado** | Zustand | `^4.x` / `^5.x` | Armazenamento de estado global leve, atômico e sem *boilerplate*. |
| **Motor Matemático / Moeda** | `decimal.js` ou `dinero.js` | Padrão | Eliminação estrita de imprecisões de ponto flutuante binário do JavaScript (ex.: $0.1 + 0.2 \neq 0.3$). |
| **Formulários e Validação** | React Hook Form + Zod | Padrão | Validação de esquemas e performance superior sem re-renderizações desnecessárias. |
| **Exportação de Dados** | SheetJS (`xlsx`) / PapaParse | Padrão | Geração de relatórios em CSV e XLSX diretamente no navegador. |

---

## 4. Convenções e Princípios de Engenharia

### 4.1. Princípios de Design de Software
* **SOLID:**
  * **S (Single Responsibility):** Componentes de UI apenas exibem dados e capturam eventos; regras matemáticas ficam isoladas no motor de domínio.
  * **O (Open/Closed):** O motor de cálculo deve aceitar novos tipos de taxas ou deduções sem alterar a lógica nuclear de precificação.
  * **L (Liskov Substitution):** Entidades derivadas de produtos mantêm a interface base de custos e preços.
  * **I (Interface Segregation):** Tipos enxutos e focados (ex.: não injetar dados de balancete completo dentro de um componente de linha de insumo).
  * **D (Dependency Inversion):** Mecanismos de armazenamento implementam interfaces genéricas (`StorageAdapter`), permitindo alternar de `localStorage` para `IndexedDB` ou `Supabase` sem alterar os componentes.
* **DRY (Don't Repeat Yourself):** Reutilização centralizada de rotinas de conversão e formatação monetária/percentual.
* **KISS (Keep It Simple, Stupid):** Não introduzir microsserviços ou bancos complexos antes de exaurir a capacidade do modelo *local-first*.

### 4.2. Convenções Assíncronas e Performance
* **Cálculos Síncronos e Imediatos:** Cálculos matemáticos locais devem ser puramente síncronos, com tempo de execução na casa de microssegundos ($< 5\text{ms}$).
* **Async para E/S e Persistência:** Operações de escrita em storage, sincronização em nuvem e exportação de planilhas devem ser estritamente assíncronas (`async/await`), evitando bloqueio da *main thread*.
* **Debounce em Entradas Contínuas:** Entradas de texto em tempo real (como sliders ou digitação rápida de centavos) devem usar *debouncing* ou *throttle* para operações persistentes em disco.

### 4.3. Convenções de Código e Estrutura de Pastas
* **Nomenclatura:**
  * Componentes e Interfaces/Types: `PascalCase` (ex.: `ProductCard.tsx`, `BatchSimulation`).
  * Funções, hooks e variáveis: `camelCase` (ex.: `calculateBreakEven`, `useProductStore`).
  * Constantes globais e Enums: `SCREAMING_SNAKE_CASE` (ex.: `DEFAULT_TAX_RATE`).
* **Estrutura de Diretórios Recomendada:**
  ```text
  src/
  ├── app/                  # Rotas e páginas (Next.js App Router)
  ├── components/
  │   ├── ui/               # Componentes base do Shadcn/ui (Button, Dialog, Input)
  │   ├── catalog/          # Componentes específicos da tabela de catálogo
  │   ├── simulator/        # Componentes do simulador de desconto
  │   └── balance/          # Componentes do balancete consolidado
  ├── domain/
  │   ├── calculations/     # Funções puras de cálculo financeiro (Unit tested)
  │   └── validators/       # Esquemas de validação Zod
  ├── stores/               # Stores globais do Zustand
  ├── types/                # Definições de tipagem TypeScript
  └── lib/                  # Utilitários gerais (formatadores BRL, helpers)
  ```

### 4.4. Regras de Formatação Numérica e Tolerância
* **Moeda:** Exibição obrigatória no padrão BRL (`pt-BR`, `R$ 0,00`), mantendo internamente valores em precisão fixa com 4 casas decimais para cálculo intermediário e 2 casas decimais no arredondamento final.
* **Percentuais:** Aceitação de frações decimais (ex.: $15,5\% = 0.155$) com trava estrita de teto para soma de impostos e margens ($T + M < 100\%$).