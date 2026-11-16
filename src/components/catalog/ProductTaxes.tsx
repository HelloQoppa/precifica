"use client";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { productTaxSchema } from "../../domain/validators/schemas";
import type { ProductTax } from "../../types";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../ui/button";
import { Modal } from "../ui/dialog";

const formatRate = (rate: number) =>
  `${Number((rate * 100).toFixed(4)).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}%`;

export function ProductTaxes() {
  const { productTaxes, saveProductTax, deleteProductTax } = useAppStore();
  const [editing, setEditing] = useState<ProductTax>();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductTax>();
  return (
    <section className="panel">
      <div className="section-head">
        <div>
          <h2>Suas taxas por plataforma</h2>
          <p className="muted">
            Cadastre os percentuais para selecionar ao criar ou editar produtos.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus size={16} /> Novo imposto
        </Button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Plataforma / nome</th>
              <th>Impostos e taxas (%)</th>
              <th>
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {productTaxes.map((tax) => (
              <tr key={tax.id}>
                <td>{tax.name}</td>
                <td>{formatRate(tax.ratePct)}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Editar ${tax.name}`}
                      onClick={() => {
                        setEditing(tax);
                        setOpen(true);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Excluir ${tax.name}`}
                      onClick={() => setDeleting(tax)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {productTaxes.length === 0 && (
          <p className="empty">
            Nenhum imposto cadastrado. Adicione a primeira taxa.
          </p>
        )}
      </div>
      <p className="footnote">
        Alterações nas taxas serão aplicadas ao selecioná-las novamente no
        produto. Produtos já salvos mantêm seu percentual atual.
      </p>
      <Modal
        title={editing ? "Editar imposto" : "Novo imposto"}
        open={open}
        onOpenChange={setOpen}
      >
        {open && (
          <TaxForm
            key={editing?.id ?? "new"}
            tax={editing}
            onSave={(tax) => {
              saveProductTax(tax);
              setOpen(false);
            }}
          />
        )}
      </Modal>
      <Modal
        title="Excluir imposto?"
        open={!!deleting}
        onOpenChange={(value) => {
          if (!value) setDeleting(undefined);
        }}
      >
        <p>
          Excluir “{deleting?.name}” da lista? Os produtos que usam essa taxa
          manterão o percentual salvo como personalizado.
        </p>
        <Button
          variant="destructive"
          onClick={() => {
            if (deleting) deleteProductTax(deleting.id);
            setDeleting(undefined);
          }}
        >
          Excluir imposto
        </Button>
      </Modal>
    </section>
  );
}

function TaxForm({
  tax,
  onSave,
}: {
  tax?: ProductTax;
  onSave: (tax: ProductTax) => void;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductTax>({
    resolver: zodResolver(productTaxSchema),
    defaultValues: tax ?? { id: crypto.randomUUID(), name: "", ratePct: 0 },
  });
  return (
    <form className="form-stack" onSubmit={handleSubmit(onSave)}>
      <label>
        Plataforma / nome
        <input {...register("name")} placeholder="Ex.: Shopee" />
      </label>
      <label>
        Impostos e taxas (%)
        <Controller
          control={control}
          name="ratePct"
          render={({ field }) => (
            <input
              type="number"
              min="0"
              max="100"
              step="0.0001"
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={
                Number.isFinite(field.value)
                  ? Number((field.value * 100).toFixed(4))
                  : ""
              }
              onChange={(e) => field.onChange(e.target.valueAsNumber / 100)}
            />
          )}
        />
      </label>
      {Object.keys(errors).length > 0 && (
        <p className="error" role="alert">
          Informe um nome e um percentual entre 0% e 100%.
        </p>
      )}
      <Button type="submit">Salvar imposto</Button>
    </form>
  );
}
