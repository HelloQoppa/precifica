"use client";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "../../domain/validators/schemas";
import type { CatalogProduct } from "../../types";
import { calculateProduct } from "../../domain/calculations/finance";
import { brl } from "../../lib/utils";
import { useAppStore } from "../../stores/useAppStore";
import { Button } from "../ui/button";
export function ProductForm({
  product,
  onDone,
}: {
  product?: CatalogProduct;
  onDone: () => void;
}) {
  const productTaxes = useAppStore((s) => s.productTaxes);
  const now = new Date().toISOString();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CatalogProduct>({
    resolver: zodResolver(productSchema),
    defaultValues: product ?? {
      id: crypto.randomUUID(),
      name: "",
      ingredients: [{ id: crypto.randomUUID(), name: "", unitCost: 0 }],
      taxRatePct: 0.08,
      targetMarginPct: 0.35,
      practicedPrice: 0,
      createdAt: now,
      updatedAt: now,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ingredients",
  });
  const selectedTaxId = watch("productTaxId") ?? "";
  const selectedTax = productTaxes.find((t) => t.id === selectedTaxId);
  const currentRate = watch("taxRatePct");
  const parsed = productSchema.safeParse(watch());
  return (
    <form
      onSubmit={handleSubmit((p) => {
        useAppStore
          .getState()
          .saveProduct({ ...p, updatedAt: new Date().toISOString() });
        onDone();
      })}
      className="form-stack"
    >
      <label>
        Nome do produto
        <input
          {...register("name")}
          placeholder="Ex.: Camiseta personalizada"
        />
      </label>
      <label>
        Imposto predefinido
        <select
          value={selectedTax?.id ?? ""}
          onChange={(e) => {
            const tax = productTaxes.find((t) => t.id === e.target.value);
            setValue("productTaxId", tax?.id, { shouldDirty: true });
            if (tax)
              setValue("taxRatePct", tax.ratePct, {
                shouldDirty: true,
                shouldValidate: true,
              });
          }}
        >
          <option value="">Percentual personalizado</option>
          {productTaxes.map((tax) => (
            <option key={tax.id} value={tax.id}>
              {tax.name} —{" "}
              {Number((tax.ratePct * 100).toFixed(4)).toLocaleString("pt-BR", {
                maximumFractionDigits: 4,
              })}
              %
            </option>
          ))}
        </select>
      </label>
      <p className="muted">
        Cadastre e edite as opções em Impostos de produtos. Você também pode
        ajustar o percentual para este produto.
      </p>
      {selectedTax && selectedTax.ratePct !== currentRate && (
        <p className="muted">
          O percentual salvo difere da taxa atual da plataforma. Para aplicar a
          taxa atual,{" "}
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              setValue("taxRatePct", selectedTax.ratePct, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            Usar taxa atual
          </Button>
        </p>
      )}
      <div className="form-grid">
        <label>
          Preço praticado (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            {...register("practicedPrice", { valueAsNumber: true })}
          />
        </label>
        <label>
          Impostos e taxas (%)
          <Controller
            control={control}
            name="taxRatePct"
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
                onChange={(e) => {
                  field.onChange(e.target.valueAsNumber / 100);
                  setValue("productTaxId", undefined, { shouldDirty: true });
                }}
              />
            )}
          />
        </label>
        <label>
          Margem desejada (%)
          <Controller
            control={control}
            name="targetMarginPct"
            render={({ field }) => (
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
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
      </div>
      <h3>Ficha técnica por unidade</h3>
      {fields.map((f, i) => (
        <div className="ingredient" key={f.id}>
          <label>
            Insumo
            <input {...register(`ingredients.${i}.name`)} />
          </label>
          <label>
            Custo (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              {...register(`ingredients.${i}.unitCost`, {
                valueAsNumber: true,
              })}
            />
          </label>
          <Button
            type="button"
            variant="ghost"
            disabled={fields.length === 1}
            onClick={() => remove(i)}
          >
            Remover
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({ id: crypto.randomUUID(), name: "", unitCost: 0 })
        }
      >
        + Adicionar insumo
      </Button>
      {Object.keys(errors).length > 0 && (
        <p role="alert" className="error">
          Revise os campos: nomes são obrigatórios, valores devem ser positivos
          e impostos + margem devem ficar abaixo de 100%.
        </p>
      )}
      {parsed.success && (
        <div className="callout">
          Preço sugerido por dentro:{" "}
          <strong>{brl(calculateProduct(parsed.data).suggested)}</strong>
        </div>
      )}
      <Button type="submit">Salvar produto</Button>
    </form>
  );
}
