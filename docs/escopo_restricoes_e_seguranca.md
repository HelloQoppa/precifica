# Documento de Escopo, Restrições de Integração e Segurança

Este documento formaliza as fronteiras do produto para a versão atual (MVP/V1), delimitando o que é obrigatório entregar agora, o que foi postergado intencionalmente e quais são as diretrizes de segurança e conectividade externa.

---

## 1. Matriz de Escopo (Dentro vs. Fora)

### 1.1. Explicitamente "Dentro" do Escopo (Entregáveis Desta Fase)

| Módulo / Recurso | Descrição do Entregável |
| :--- | :--- |
| **Painel de Custos Fixos & Metas** | Cadastro dinâmico de despesas operacionais fixas, definição de pró-labore mensal e percentual de reserva operacional. |
| **Catálogo de Produtos com Markup Divisor** | Cadastro de itens com ficha técnica de insumos variáveis, alíquota de impostos/taxas, margem líquida pretendida e cálculo por dentro do preço sugerido. |
| **Métricas Automáticas de Viabilidade** | Cálculo instantâneo da margem de contribuição (*sobra limpa unitária*), ponto de equilíbrio operacional individual e meta ideal de vendas. |
| **Simulador de Pedidos por Volume / Lote** | Seleção de item do catálogo com input de quantidade e percentual de desconto, cálculo do preço unitário efetivo e faturamento consolidado do lote. |
| **Detecção do Ponto de Lucro Zero** | Alerta visual de risco e cálculo do desconto máximo tolerável antes de margem negativa ($S \le 0$). |
| **Balancete Financeiro Projetado Dinâmico** | Consolidação dos volumes simulados/projetados contra os custos fixos globais, calculando o resultado operacional líquido e status de metas. |
| **Persistência Local Resiliente (Anti-F5)** | Armazenamento automático e síncrono/assíncrono no `IndexedDB`/`localStorage` para reter o estado após recarregamento da página. |
| **Gestão de Seed Data / Mock** | Carregamento de dados de demonstração no primeiro acesso e botão para restauração de fábrica dos dados canônicos. |
| **Exportação Básica** | Download dos dados calculados do balancete em arquivo `.csv` ou `.xlsx` gerado puramente no navegador. |

---

### 1.2. Explicitamente "Fora" do Escopo (Não Fazer Nesta Fase)

| Recurso / Ideia | Justificativa do Adiamento (Roadmap Futuro) |
| :--- | :--- |
| **Autenticação e Multi-usuário (Login/Senha/OAuth)** | Desnecessário no modelo *local-first*. Adiciona atrito de onboarding e custo de backend na validação do produto. |
| **Banco de Dados em Nuvem e Sincronização Remota** | Operação restrita ao navegador do usuário. Não haverá Postgres, Supabase, Firebase ou sincronização multi-dispositivo agora. |
| **Emissão de Notas Fiscais (NFe / NFSe / NFCe)** | O sistema é um simulador de inteligência financeira e precificação, não um emissor fiscal. |
| **Integração com Maquininhas e Gateways (Stripe, Mercado Pago)** | As taxas de cartão e plataformas são inseridas manualmente como percentual no produto, sem consulta via API. |
| **Gestão Real de Estoque (Baixa de Saldo e Inventário Físico)** | O catálogo calcula insumos para composição de custo unitário, mas não faz rastreamento de estoque mínimo ou baixas por venda. |
| **Multi-moeda Automática (Câmbio em Tempo Real)** | Moeda estritamente fixada em Real Brasileiro (`BRL`), sem integração com APIs financeiras de câmbio (USD/EUR). |
| **Envio de Propostas e Orçamentos por E-mail / WhatsApp** | O foco é a simulação interna. Automações de comunicação com clientes ficam para versões posteriores. |

---

## 2. Restrições de Integração

* **Zero Chamadas de API Externa (Runtime Offline-First):**
  * A aplicação não fará nenhuma requisição HTTP externa para funcionamento das regras de negócio.
  * O bundle da aplicação é estático; uma vez carregado pelo navegador, todas as rotinas e cálculos operam sem internet.
* **Sem Dependência de Microsserviços:**
  * Não há servidores intermediários para processar planilhas, autenticar tokens ou armazenar sessões.
* **Isolamento de Entrada/Saída:**
  * A única interação de entrada externa permitida é o preenchimento de inputs pelo usuário ou o carregamento do `INITIAL_SEED_DATA`.
  * A única exportação externa permitida é o download de arquivos client-side gerados pelo próprio navegador (`blob:` URL).

---

## 3. Diretrizes de Segurança e Privacidade de Dados

Embora não haja backend na fase atual, a arquitetura deve obedecer às seguintes diretrizes de segurança no cliente:

### 3.1. Privacidade por Design (Privacy-by-Design)
* **Privacidade Absoluta:** Como os dados residem exclusivamente no navegador do usuário (`IndexedDB`/`localStorage`), informações financeiras sensíveis (custos reais de insumos, margens e pró-labore) **nunca saem do dispositivo**.
* **Isenção de Custódia LGPD:** A plataforma não coleta, transmite nem armazena Dados Pessoais Identificáveis (PII) em servidores próprios, eliminando riscos de vazamento em repouso na nuvem.

### 3.2. Segurança no Navegador (Client-Side Security)
* **Sanitização de Strings (Prevenção de XSS):**
  * Toda entrada textual (como nomes de insumos e produtos) deve ser tratada como dado não-confiável ao ser renderizada no DOM, prevenindo injeções de script através de campos de texto ou importação de planilhas.
* **Validação Rígida com Zod:**
  * Dados restaurados do storage ou manipulados na interface passam por validação estrita de tipos e limites numéricos (rejeitando valores negativos ilógicos, NaN ou strings maliciosas em campos monetários).
* **Content Security Policy (CSP):**
  * O cabeçalho da aplicação deve restringir scripts executáveis apenas à origem própria (`self`), bloqueando injeções de scripts externos ou CDNs não auditadas.