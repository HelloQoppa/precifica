# Justificativa de Negócio e Resolução de Problemas

Este documento estabelece o valor estratégico, o retorno sobre o investimento técnico e a análise detalhada das dores de mercado que justificam o desenvolvimento imediato deste ecossistema (Catálogo $\rightarrow$ Simulador de Desconto $\rightarrow$ Balancete Projetado).

---

## 1. Por que esta funcionalidade é necessária agora?

No cenário microeconômico atual, pequenas empresas, e-commerces e prestadores de serviços enfrentam pressão inflacionária constante sobre insumos, aumento de custos operacionais e a proliferação de taxas variáveis de intermediação (gateways de pagamento, maquininhas, marketplaces e tributação).

A funcionalidade é urgente pelos seguintes motivos de contexto:

* **Inconsistência entre Venda e Sobrevivência:** Empreendedores costumam comemorar faturamento bruto elevado sem perceber que a margem unitária real foi corroída por taxas ocultas e descontos impulsivos.
* **Complexidade da Negociação por Volume:** Na tentativa de fechar pedidos grandes (vendas corporativas, atacado ou contratos em lote), o vendedor cede a pedidos de desconto na base do "chute" ou da intuição, descobrindo semanas depois que trabalhou no prejuízo.
* **Silos de Dados em Planilhas Estáticas:** Atualmente, o usuário divide a operação em cadernos ou planilhas desconexas. Ao mudar o custo de um insumo, ele não sabe o impacto imediato na meta de vendas do mês nem no valor seguro para negociação de lotes.

---

## 2. Valor de Negócio e Valor Técnico

### 2.1. Valor de Negócio

| Pilar | Impacto Direto |
| :--- | :--- |
| **Proteção de Caixa (Prevenção de Falência)** | Bloqueia a concessão de descontos predatórios em tempo real através da identificação do *Ponto de Lucro Zero*. |
| **Poder de Negociação Ágil** | Permite que o vendedor responda a uma contraproposta de cliente em segundos, sabendo exatamente a margem limpa restante em cada faixa de desconto. |
| **Clareza de Metas Operacionais** | Converte custos abstratos (aluguel, internet, pró-labore) em metas tangíveis: *"preciso vender exatamente $X$ unidades deste produto para pagar as contas básicas"*. |
| **Empoderamento do Empreendedor** | Garante previsibilidade para retirada de pró-labore e acumulação da reserva de emergência da empresa. |

### 2.2. Valor Técnico

| Pilar | Impacto Direto |
| :--- | :--- |
| **Arquitetura Reativa Unidirecional** | Elimina a necessidade de recálculos manuais ou rotinas em lote (*batch*). Um ajuste no preço do insumo atualiza instantaneamente o Ponto de Equilíbrio e o Balancete Consolidado. |
| **Precisão Numérica Estrita** | Implementação de precisão arbitrária (`Decimal.js`/`Dinero.js`), eliminando discrepâncias cumulativas geradas por arredondamento em ponto flutuante (`IEEE 754`). |
| **Resiliência e Disponibilidade (*Local-First*)** | Operação 100% autônoma no navegador (`client-side`), garantindo custo de infraestrutura quase zero no lançamento e resposta sub-milissegundo para o usuário final. |
| **Separação Rígida de Responsabilidades** | Motor matemático desacoplado de bibliotecas de interface, permitindo testes unitários com 100% de cobertura sobre as regras financeiras. |

---

## 3. Problema Específico que a Especificação Resolve

A arquitetura resolve a **quebra da cadeia de decisão financeira**. 

Geralmente, o empreendedor toma três decisões cruciais de forma isolada:
1. **Precifica** usando regras de markup multiplicador simples (ex.: *"custou 10, vendo por 20"*), esquecendo que taxas de cartão e impostos incidem sobre o preço final de venda (cálculo por dentro), e não sobre o custo.
2. **Dá desconto** olhando apenas o valor nominal do produto, sem ponderar o custo marginal de reposição do material e as taxas proporcionais.
3. **Avalia a saúde da empresa** apenas no fechamento bancário no fim do mês, quando o rombo financeiro já foi consolidado.

Ao interligar o **Catálogo**, o **Simulador de Desconto** e o **Balancete Financeiro**, o sistema fecha esse ciclo em uma malha contínua:

$$\text{Insumo} \longrightarrow \text{Markup por Dentro} \longrightarrow \text{Simulador de Lote com Limite de Risco} \longrightarrow \text{Impacto no Balancete}$$

---

## 4. Dores do Usuário vs. Lacunas Técnicas Preenchidas

### 4.1. Dores do Usuário (Dores de Mercado)

* **A Ilusão do Faturamento:** O usuário fatura R$ 30.000,00 no mês, mas a conta bancária está zerada porque os custos variáveis e taxas levaram toda a margem de contribuição.
* **Medo de Perder a Venda vs. Medo do Prejuízo:** Ao negociar uma encomenda de 200 peças com pedido de $15\%$ de desconto, o empreendedor fica sem parâmetros para saber se aquele volume compensa a queda da margem unitária.
* **Sobrecarga Cognitiva:** Dificuldade em calcular mentalmente ou montar planilhas com fórmulas complexas de *markup divisor* e metas de cobertura de ponto de equilíbrio.

### 4.2. Lacunas Técnicas Preenchidas

* **Falta de Validação em Tempo Real:** Planilhas convencionais em Excel permitem inserção de dados inconsistentes (soma de taxas maior que 100%, divisões por zero ou descontos que geram margem negativa sem nenhum alerta visual ostensivo).
* **Falta de Reatividade Multi-Nível:** A maioria dos softwares de PDV/ERP calcula o preço no cadastro, mas não recalcula a viabilidade operacional integrada quando o vendedor aplica um desconto no balcão.
* **Acoplamento em Softwares Legados:** Ferramentas financeiras existentes exigem cadastros longos, banco de dados pesado, login obrigatório e servidores com alta latência para operações simples de simulação de viabilidade.