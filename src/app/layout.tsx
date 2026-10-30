import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Precifica · Seu negócio em equilíbrio', description: 'Formação de preços, simulação de pedidos e balancete projetado para pequenos negócios.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="pt-BR"><body>{children}</body></html>; }
