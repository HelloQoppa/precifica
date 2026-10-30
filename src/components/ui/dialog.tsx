'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
export function Modal({ title, children, open, onOpenChange }: { title: string; children: React.ReactNode; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="modal-overlay" /><Dialog.Content className="modal"><div className="section-head"><Dialog.Title>{title}</Dialog.Title><Dialog.Close aria-label="Fechar" className="icon-button"><X size={20} /></Dialog.Close></div><Dialog.Description className="muted">Preencha os dados para atualizar seus cálculos.</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
