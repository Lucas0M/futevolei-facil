import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Layers, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { createCategory } from "../../../api/categories.api";
import { getTournamentDetail, listTournaments } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  formatLabel,
  slotsUnitLabel,
  statusBadgeClasses,
  statusLabel,
} from "../../../shared/utils/tournamentLabels";
import { CategoryForm } from "../components/CategoryForm";
import {
  EMPTY_CATEGORY_FORM,
  type CategoryFormState,
} from "../components/categoryForm.types";
import type { Tournament, TournamentDetailCategory } from "../../../types/api.types";

const AVAILABLE_STATUSES = new Set(["DRAFT", "PUBLISHED", "REGISTRATIONS_CLOSED"]);

function buildCategoryPayload(form: CategoryFormState) {
  return {
    name: form.name.trim(),
    format: form.format,
    entryFee: Number(form.entryFee),
    maxSlots: Number(form.maxSlots),
    registrationDeadline: new Date(form.registrationDeadline).toISOString(),
    reservationTtlMinutes: Number(form.reservationTtlMinutes),
    refundFullBeforeDays: form.refundFullBeforeDays
      ? Number(form.refundFullBeforeDays)
      : undefined,
    refundPartialBeforeDays: form.refundPartialBeforeDays
      ? Number(form.refundPartialBeforeDays)
      : undefined,
    refundPartialPercent: form.refundPartialPercent
      ? Number(form.refundPartialPercent)
      : undefined,
    cancellationDeadlineHours: Number(form.cancellationDeadlineHours),
  };
}

export function AdminCategoriesPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [categories, setCategories] = useState<TournamentDetailCategory[]>([]);
  const [selectedTournamentName, setSelectedTournamentName] = useState("");
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadTournaments = useCallback(async () => {
    setError(null);

    try {
      const result = await listTournaments({ page: 1, pageSize: 100 });
      const available = result.data.filter((tournament) =>
        AVAILABLE_STATUSES.has(tournament.status),
      );
      setTournaments(available);
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar os torneios."),
      );
    } finally {
      setIsLoadingTournaments(false);
    }
  }, []);

  const loadCategories = useCallback(async (tournamentId: string) => {
    if (!tournamentId) {
      setCategories([]);
      setSelectedTournamentName("");
      return;
    }

    setIsLoadingCategories(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const detail = await getTournamentDetail(tournamentId);
      setCategories(detail.categories);
      setSelectedTournamentName(detail.name);
    } catch (err) {
      setCategories([]);
      setSelectedTournamentName("");
      setError(
        getApiErrorMessage(
          err,
          "Não foi possível carregar as categorias deste torneio.",
        ),
      );
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    loadCategories(selectedTournamentId);
  }, [selectedTournamentId, loadCategories]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTournamentId) return;

    setIsSavingCategory(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const created = await createCategory(
        selectedTournamentId,
        buildCategoryPayload(categoryForm),
      );

      setCategoryForm(EMPTY_CATEGORY_FORM);
      setSuccessMessage(`Categoria "${created.name}" criada com sucesso.`);
      await loadCategories(selectedTournamentId);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setIsSavingCategory(false);
    }
  }

  function handleTournamentChange(tournamentId: string) {
    setSelectedTournamentId(tournamentId);
    setCategoryForm(EMPTY_CATEGORY_FORM);
    setSuccessMessage(null);
  }

  if (isLoadingTournaments) {
    return (
      <div className="flex justify-center py-20">
        <p className="text-lg text-slate-400">Carregando torneios...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-950 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <Layers className="h-3.5 w-3.5" />
              Painel administrativo
            </span>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                Categorias
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Selecione um torneio disponível e cadastre novas categorias de
                competição.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao dashboard
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsLoadingTournaments(true);
                loadTournaments().finally(() => setIsLoadingTournaments(false));
                if (selectedTournamentId) {
                  loadCategories(selectedTournamentId);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
          {successMessage}
        </div>
      )}

      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
        <label className="block space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Torneio
          </span>
          <select
            value={selectedTournamentId}
            onChange={(event) => handleTournamentChange(event.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
          >
            <option value="">Selecione um torneio</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name} — {statusLabel(tournament.status)} (
                {new Date(tournament.eventDate).toLocaleDateString("pt-BR")})
              </option>
            ))}
          </select>
        </label>

        {tournaments.length === 0 && (
          <p className="mt-4 text-sm text-slate-400">
            Nenhum torneio disponível no momento. Crie um torneio no dashboard
            antes de adicionar categorias.
          </p>
        )}
      </section>

      {selectedTournamentId && isLoadingCategories && (
        <div className="flex justify-center py-12">
          <p className="text-slate-400">Carregando categorias...</p>
        </div>
      )}

      {selectedTournamentId && !isLoadingCategories && (
        <>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Categorias existentes
            </h2>

            {categories.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
                Este torneio ainda não tem categorias cadastradas.
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatLabel(category.format)} · R$ {category.entryFee} ·{" "}
                        {category.occupiedSlots}/{category.maxSlots}{" "}
                        {slotsUnitLabel(category.format, category.maxSlots)}
                      </p>
                    </div>

                    <span
                      className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${statusBadgeClasses(
                        category.status,
                      )}`}
                    >
                      {statusLabel(category.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <CategoryForm
            tournamentName={selectedTournamentName}
            form={categoryForm}
            isSaving={isSavingCategory}
            onChange={setCategoryForm}
            onSubmit={handleCreateCategory}
          />
        </>
      )}
    </div>
  );
}
