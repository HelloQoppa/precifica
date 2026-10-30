# Precifica

Primeira versão local do sistema descrito em [docs](docs/), para formar preços, negociar lotes e projetar o resultado mensal.

## Executar

Requer Node.js 22 e npm.

```sh
npm install
npm run dev
```

Acesse http://localhost:3000. Para produção: `npm run build` e `npm start`.

## Verificação

```sh
npm test
npm run typecheck
npm run build
```

## Funcionalidades

- Catálogo com edição de ficha técnica, preço praticado, impostos e margem desejada.
- Markup divisor, contribuição, ponto de equilíbrio e meta ideal por produto.
- Custos fixos, pró-labore e reserva operacional configuráveis.
- Simulador de lotes com alerta de contribuição zero/negativa e limite teórico de desconto.
- Pedidos persistidos, seleção de inclusão no balancete e exclusão.
- Balancete por mês com exportação CSV protegida contra fórmulas em nomes.
- IndexedDB com espelho/fallback localStorage, validação Zod e backup de cargas inválidas.
- Exemplos no primeiro acesso e restauração com confirmação.

## Convenções financeiras

Taxas são frações (8% = 0,08). Cálculos usam Decimal.js; contribuição unitária mantém quatro casas e valores exibidos usam duas. O lote arredonda o preço negociado para centavos antes de multiplicar a quantidade. A reserva incide apenas sobre custos fixos. Contribuição positiva não significa lucro líquido: custos fixos e metas são deduzidos no balancete.

Cada produto é avaliado isoladamente para suas metas em unidades, sem ratear custos fixos entre produtos. Pedidos preservam preço negociado; custos de insumos e alíquotas são reavaliados pelo cadastro atual. O filtro e o seletor mensal usam o fuso America/Sao_Paulo. Não há autenticação, serviços remotos, estoque ou registro de vendas reais.

## Limites desta entrega

Os dados pertencem ao navegador e podem ser removidos pela limpeza do armazenamento. Não há sincronização entre dispositivos. Após carregar a aplicação, cálculos e edição independem de rede; abrir novamente sem conexão ainda depende dos arquivos disponíveis no cache (não foi implementado service worker). A CSP restringe recursos à origem, mas permite scripts inline necessários à inicialização do Next.js; endurecimento com nonces é uma etapa futura.

Código organizado em `src/domain` (regras e validação), `src/stores` (estado), `src/lib` (adaptadores e exportação), `src/components` (interface) e `src/app` (Next.js).

Na auditoria desta entrega, `npm audit` ainda reporta 9 alertas (3 moderados e 6 altos), incluindo PostCSS transitivo do Next.js e ferramentas de build. A atualização do Vitest eliminou os alertas críticos. Essas dependências precisam de revisão antes de uma publicação em produção. Não foram realizados testes visuais ou de interação em navegador nesta sessão.
