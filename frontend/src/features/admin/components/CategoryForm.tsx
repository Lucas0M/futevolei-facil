import type { FormEvent } from "react";
import type { CategoryFormState } from "./categoryForm.types";

export function CategoryForm({
  tournamentName,
  form,
  isSaving,
  onChange,
  onSubmit,
}: {
  tournamentName: string;
  form: CategoryFormState;
  isSaving: boolean;
  onChange: (value: CategoryFormState) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/5 p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-400">Admin</p>
          <h3 className="text-2xl font-bold text-white">Nova categoria</h3>
          <p className="mt-1 text-sm text-slate-300">
            Criar categoria dentro de {tournamentName}.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FieldLabel label="Nome da categoria">
            <input
              required
              type="text"
              value={form.name}
              onChange={(event) =>
                onChange({ ...form, name: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="Ex: Dupla Masculina Open"
            />
          </FieldLabel>

          <FieldLabel label="Formato">
            <select
              value={form.format}
              onChange={(event) =>
                onChange({
                  ...form,
                  format: event.target.value as CategoryFormState["format"],
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="DUO_FIXED">Dupla fixa</option>
              <option value="DUO_RANDOM">Dupla sorteada</option>
            </select>
          </FieldLabel>

          <FieldLabel label="Valor da inscrição">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.entryFee}
              onChange={(event) =>
                onChange({ ...form, entryFee: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="50"
            />
          </FieldLabel>

          <FieldLabel label="Número de vagas">
            <input
              required
              type="number"
              min="1"
              step="1"
              value={form.maxSlots}
              onChange={(event) =>
                onChange({ ...form, maxSlots: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              placeholder="8"
            />
          </FieldLabel>

          <FieldLabel label="Limite de inscrição">
            <input
              required
              type="datetime-local"
              value={form.registrationDeadline}
              onChange={(event) =>
                onChange({ ...form, registrationDeadline: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>

          <FieldLabel label="Reserva (minutos)">
            <input
              type="number"
              min="1"
              step="1"
              value={form.reservationTtlMinutes}
              onChange={(event) =>
                onChange({ ...form, reservationTtlMinutes: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <FieldLabel label="Reembolso total antes de (dias)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.refundFullBeforeDays}
              onChange={(event) =>
                onChange({ ...form, refundFullBeforeDays: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>

          <FieldLabel label="Reembolso parcial antes de (dias)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.refundPartialBeforeDays}
              onChange={(event) =>
                onChange({
                  ...form,
                  refundPartialBeforeDays: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>

          <FieldLabel label="Percentual parcial">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={form.refundPartialPercent}
              onChange={(event) =>
                onChange({ ...form, refundPartialPercent: event.target.value })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_180px]">
          <FieldLabel label="Prazo de cancelamento (horas)">
            <input
              type="number"
              min="0"
              step="1"
              value={form.cancellationDeadlineHours}
              onChange={(event) =>
                onChange({
                  ...form,
                  cancellationDeadlineHours: event.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
            />
          </FieldLabel>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Criando..." : "Criar categoria"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}
