import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { createCategory } from "../../../api/categories.api";
import { getTournamentDetail } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  slotsUnitLabel,
  statusBadgeClasses,
  statusLabel,
} from "../../../shared/utils/tournamentLabels";
import { RegistrationActionCard } from "../components/RegistrationActionCard";
import type {
  TournamentDetail,
  TournamentDetailCategory,
} from "../../../types/api.types";

type CategoryFormState = {
  name: string;
  format: "INDIVIDUAL" | "DUO_FIXED" | "DUO_RANDOM";
  entryFee: string;
  maxSlots: string;
  registrationDeadline: string;
  reservationTtlMinutes: string;
  refundFullBeforeDays: string;
  refundPartialBeforeDays: string;
  refundPartialPercent: string;
  cancellationDeadlineHours: string;
};

const EMPTY_CATEGORY_FORM: CategoryFormState = {
  name: "",
  format: "INDIVIDUAL",
  entryFee: "",
  maxSlots: "",
  registrationDeadline: "",
  reservationTtlMinutes: "20",
  refundFullBeforeDays: "",
  refundPartialBeforeDays: "",
  refundPartialPercent: "",
  cancellationDeadlineHours: "48",
};

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;

    setError(null);

    try {
      const result = await getTournamentDetail(id);
      setTournament(result);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar este torneio."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setIsSavingCategory(true);
    setError(null);

    try {
      await createCategory(id, {
        name: categoryForm.name.trim(),
        format: categoryForm.format,
        entryFee: Number(categoryForm.entryFee),
        maxSlots: Number(categoryForm.maxSlots),
        registrationDeadline: new Date(
          categoryForm.registrationDeadline,
        ).toISOString(),
        reservationTtlMinutes: Number(categoryForm.reservationTtlMinutes),
        refundFullBeforeDays: categoryForm.refundFullBeforeDays
          ? Number(categoryForm.refundFullBeforeDays)
          : undefined,
        refundPartialBeforeDays: categoryForm.refundPartialBeforeDays
          ? Number(categoryForm.refundPartialBeforeDays)
          : undefined,
        refundPartialPercent: categoryForm.refundPartialPercent
          ? Number(categoryForm.refundPartialPercent)
          : undefined,
        cancellationDeadlineHours: Number(
          categoryForm.cancellationDeadlineHours,
        ),
      });

      setCategoryForm(EMPTY_CATEGORY_FORM);
      await fetchDetail();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setIsSavingCategory(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-lg text-slate-400">Carregando torneio...</p>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
        <p className="text-red-300">{error ?? "Torneio não encontrado."}</p>

        <Link
          to="/torneios"
          className="mt-5 inline-flex text-emerald-400 hover:text-emerald-300"
        >
          ← Voltar para torneios
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to="/torneios"
        className="inline-flex items-center text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
      >
        ← Voltar para torneios
      </Link>

      <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 backdrop-blur">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white">
              {tournament.name}
            </h1>

            {tournament.description && (
              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                {tournament.description}
              </p>
            )}
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeClasses(
              tournament.status,
            )}`}
          >
            {statusLabel(tournament.status)}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <DetailStat
          label="Data"
          value={new Date(tournament.eventDate).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        />
        <DetailStat label="Local" value={tournament.location} />
        <DetailStat label="Categorias" value={tournament.categories.length} />
        <DetailStat
          label="Aberta no painel"
          value={tournament.status === "PUBLISHED" ? "Sim" : "Não"}
        />
      </div>

      <div className="mt-10 space-y-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-2xl font-bold text-white">Categorias</h2>
          {isAdmin && (
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              Painel admin
            </span>
          )}
        </div>

        {isAdmin && id && (
          <AdminCreateCategoryCard
            tournamentName={tournament.name}
            form={categoryForm}
            isSaving={isSavingCategory}
            onChange={setCategoryForm}
            onSubmit={handleCreateCategory}
          />
        )}

        {tournament.categories.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Este torneio ainda não tem categorias cadastradas.
          </div>
        ) : (
          tournament.categories.map((category) => (
            <CategoryBlock
              key={category.id}
              category={category}
              onChanged={fetchDetail}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AdminCreateCategoryCard({
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

function DetailStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function CategoryBlock({
  category,
  onChanged,
}: {
  category: TournamentDetailCategory;
  onChanged: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">{category.name}</h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-300">
            <span>Formato: {category.format}</span>
            <span>Valor: R$ {category.entryFee}</span>
            <span>
              Vagas: {category.occupiedSlots} de {category.maxSlots}{" "}
              {slotsUnitLabel(category.format, category.maxSlots)}
            </span>
          </div>
        </div>

        <span
          className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeClasses(
            category.status,
          )}`}
        >
          {statusLabel(category.status)}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <DetailStat
          label="Inscrições abertas até"
          value={new Date(category.registrationDeadline).toLocaleDateString(
            "pt-BR",
          )}
        />
        <DetailStat
          label="Disponíveis"
          value={`${category.availableSlots} ${slotsUnitLabel(
            category.format,
            category.availableSlots,
          )}`}
        />
        <DetailStat label="Formato" value={category.format} />
      </div>

      <div className="mt-6">
        <RegistrationActionCard
          category={category}
          onRegistrationChanged={onChanged}
        />
      </div>
    </section>
  );
}
