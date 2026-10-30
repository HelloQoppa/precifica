'use client';
import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Plus } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { calculateBatch, calculateProduct } from '../../domain/calculations/finance';
import { brl, pct } from '../../lib/utils';
import { Button } from '../ui/button';
export function Simulator() {
  const products = useAppStore(s => s.products);
  const [id, setId] = useState(products[0]?.id ?? '');
  const [quantity, setQuantity] = useState(100);
  const [discount, setDiscount] = useState(12);
  const [include, setInclude] = useState(true);
  const [message, setMessage] = useState('');
  const product = products.find(p => p.id === id) ?? products[0];
  if (!product) return <div className="panel">Cadastre um produto para começar a simular.</div>;
  const valid = Number.isFinite(quantity) && Number.isInteger(quantity) && quantity > 0 && quantity <= 1e7 && Number.isFinite(discount) && discount >= 0 && discount <= 100;
  const batch = valid ? calculateBatch(product, quantity, discount / 100) : null;
  const limit = calculateProduct(product).maxDiscount;
  return <div className="two-columns"><section className="panel form-stack"><div className="eyebrow">NEGOCIE COM SEGURANÇA</div><h2>Monte seu próximo pedido</h2><label>Produto<select value={product.id} onChange={e => { setId(e.target.value); setMessage(''); }}>{products.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><div className="form-grid"><label>Quantidade de unidades<input type="number" min="1" max="10000000" step="1" value={Number.isNaN(quantity) ? '' : quantity} onChange={e => setQuantity(e.target.valueAsNumber)} /></label><label>Desconto (%)<input type="number" min="0" max="100" step="0.1" value={Number.isNaN(discount) ? '' : discount} onChange={e => setDiscount(e.target.valueAsNumber)} /></label></div><label className="checkbox"><input type="checkbox" checked={include} onChange={e => setInclude(e.target.checked)} /> Incluir este pedido no balancete projetado</label><Button disabled={!valid} onClick={() => { if (!batch) return; useAppStore.getState().addSimulation({ id: crypto.randomUUID(), productId: product.id, quantity, discountPct: discount / 100, appliedUnitPrice: batch.unitPrice, sendToBalance: include, simulatedAt: new Date().toISOString() }); setMessage('Pedido salvo. Você pode gerenciá-lo no balancete.'); }}><Plus size={16} /> Salvar simulação</Button><p role="status" className="saved">{message}</p>{!valid && <p role="alert" className="error">Informe uma quantidade inteira positiva e desconto entre 0 e 100%.</p>}</section><section className="panel"><div className="eyebrow">RESULTADO DO LOTE</div><p className="muted">Preço por unidade com desconto</p><div className="hero-number">{batch ? brl(batch.unitPrice) : '—'}</div><div className="detail-row"><span>Faturamento do pedido</span><strong>{batch ? brl(batch.revenue) : '—'}</strong></div><div className="detail-row"><span>Contribuição do lote</span><strong>{batch ? brl(batch.contributionTotal) : '—'}</strong></div><div className="detail-row"><span>Margem de contribuição</span><strong>{batch ? pct(batch.margin) : '—'}</strong></div><div className="detail-row"><span>Limite teórico de desconto</span><strong>{pct(limit)}</strong></div>{batch && <div role="status" className={`callout ${batch.contribution <= 0 ? 'warning' : ''}`}>{batch.contribution <= 0 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}<div><strong>{batch.contribution <= 0 ? 'Atenção: pedido sem contribuição positiva' : 'O pedido contribui para suas metas'}</strong><p>{batch.contribution <= 0 ? 'O valor não cobre os custos variáveis e taxas. Reduza o desconto.' : 'A contribuição ainda precisa cobrir os custos fixos e suas retiradas.'}</p></div></div>}<p className="footnote">O limite indica contribuição zero antes dos custos fixos. O preço final é arredondado para centavos; confira a contribuição do lote.</p></section></div>;
}
