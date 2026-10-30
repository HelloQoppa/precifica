"use client";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema } from "../domain/validators/schemas";
import { useAppStore } from "../stores/useAppStore";
import type { CompanySettings } from "../types";
import { Button } from "./ui/button";
export function SettingsForm({ onSaved }: { onSaved?: () => void }) {
  const settings = useAppStore((s) => s.settings);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitSuccessful },
  } = useForm<CompanySettings>({
    resolver: zodResolver(settingsSchema),
    defaultValues: settings,
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "fixedCosts",
  });
  return (
    <form
      className="panel form-stack"
      onSubmit={handleSubmit((s) => {
        useAppStore
          .getState()
          .saveSettings({ ...s, updatedAt: new Date().toISOString() });
        onSaved?.();
      })}
    >
      <h2>Custos fixos da operação</h2>
      <p className="muted">O que sua empresa precisa cobrir todos os meses.</p>
      {fields.map((f, i) => (
        <div className="ingredient" key={f.id}>
          <label>
            Despesa
            <input {...register(`fixedCosts.${i}.name`)} />
          </label>
          <label>
            Valor mensal (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              {...register(`fixedCosts.${i}.amount`, { valueAsNumber: true })}
            />
          </label>
          <Button type="button" variant="ghost" onClick={() => remove(i)}>
            Remover
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => append({ id: crypto.randomUUID(), name: "", amount: 0 })}
      >
        + Adicionar despesa
      </Button>
      <div className="form-grid">
        <label>
          Pró-labore mensal (R$)
          <input
            type="number"
            min="0"
            step="0.01"
            {...register("proLaboreTarget", { valueAsNumber: true })}
          />
        </label>
        <label>
          Reserva sobre custos fixos (%)
          <Controller
            control={control}
            name="emergencyReservePct"
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
      {Object.keys(errors).length > 0 && (
        <p className="error" role="alert">
          Informe nomes e valores válidos. A reserva deve ficar entre 0 e 100%.
        </p>
      )}
      <div>
        <Button type="submit">Salvar custos e metas</Button>
        {isSubmitSuccessful && (
          <span className="saved" role="status">
            {" "}
            Configurações salvas.
          </span>
        )}
      </div>
    </form>
  );
}
