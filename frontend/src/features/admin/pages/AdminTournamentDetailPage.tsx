import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { Trophy, Calendar, MapPin, Plus, CheckCircle, Settings, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import {
  getTournamentDetail,
  updateTournament,
  publishTournament,
  getTournamentPendingPayments,
} from "../../../api/tournaments.api";
import { confirmRegistrationPayment, confirmTeamPayment, type TeamPaymentPortion } from "../../../api/payments.api";
import { createCategory, publishCategory } from "../../../api/categories.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { statusBadgeClasses, statusLabel, formatLabel, slotsUnitLabel } from "../../../shared/utils/tournamentLabels";
import type { TournamentDetail, TournamentFormInput, PendingConfirmationEntry, TournamentDetailCategory } from "../../../types/api.types";

const TEAM_PORTION_OPTIONS: Array<{ value: TeamPaymentPortion; label: string }> = [
  { value: "FULL", label: "Dupla inteira" },
  { value: "OWNER_SHARE", label: "Parte do dono" },
  { value: "PARTNER_SHARE", label: "Parte do parceiro" },
];

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

export function AdminTournamentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [pendingPayments, setPendingPayments] = useState<PendingConfirmationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pending payments state
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selectedPortion, setSelectedPortion] = useState<Record<string, TeamPaymentPortion>>({});

  // Editing tournament state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const [isPublishingTournament, setIsPublishingTournament] = useState(false);
  const [tournamentForm, setTournamentForm] = useState<TournamentFormInput>({
    name: "", description: "", eventDate: "", location: ""
  });

  // Category state
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(EMPTY_CATEGORY_FORM);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [publishingCategoryId, setPublishingCategoryId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [detailResult, paymentsResult] = await Promise.all([
        getTournamentDetail(id),
        getTournamentPendingPayments(id),
      ]);
      setTournament(detailResult);
      setPendingPayments(paymentsResult);

      if (!isEditing) {
        setTournamentForm({
          name: detailResult.name,
          description: detailResult.description ?? "",
          eventDate: toDatetimeLocalValue(detailResult.eventDate),
          location: detailResult.location,
        });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar os dados deste torneio."));
    } finally {
      setIsLoading(false);
    }
  }, [id, isEditing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleConfirmPayment(entry: PendingConfirmationEntry) {
    setConfirmingId(entry.id);
    setError(null);
    try {
      if (entry.kind === "registration") {
        await confirmRegistrationPayment(entry.id);
      } else {
        const portion = selectedPortion[entry.id] ?? "FULL";
        await confirmTeamPayment(entry.id, portion);
      }
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível confirmar o pagamento."));
    } finally {
      setConfirmingId(null);
    }
  }

  async function handleTournamentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id) return;

    setIsSavingTournament(true);
    setError(null);

    try {
      const payload: TournamentFormInput = {
        ...tournamentForm,
        eventDate: new Date(tournamentForm.eventDate).toISOString(),
      };
      await updateTournament(id, payload);
      setIsEditing(false);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível salvar o torneio."));
    } finally {
      setIsSavingTournament(false);
    }
  }

  async function handlePublishTournament() {
    if (!id) return;
    setIsPublishingTournament(true);
    setError(null);

    try {
      await publishTournament(id);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível publicar o torneio."));
    } finally {
      setIsPublishingTournament(false);
    }
  }

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
        registrationDeadline: new Date(categoryForm.registrationDeadline).toISOString(),
        reservationTtlMinutes: Number(categoryForm.reservationTtlMinutes),
        refundFullBeforeDays: categoryForm.refundFullBeforeDays ? Number(categoryForm.refundFullBeforeDays) : undefined,
        refundPartialBeforeDays: categoryForm.refundPartialBeforeDays ? Number(categoryForm.refundPartialBeforeDays) : undefined,
        refundPartialPercent: categoryForm.refundPartialPercent ? Number(categoryForm.refundPartialPercent) : undefined,
        cancellationDeadlineHours: Number(categoryForm.cancellationDeadlineHours),
      });

      setCategoryForm(EMPTY_CATEGORY_FORM);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível criar a categoria."));
    } finally {
      setIsSavingCategory(false);
    }
  }

  async function handlePublishCategory(categoryId: string) {
    setPublishingCategoryId(categoryId);
    setError(null);

    try {
      await publishCategory(categoryId);
      await loadData();
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível publicar a categoria."));
    } finally {
      setPublishingCategoryId(null);
    }
  }

  if (isLoading) {
    return <div className="flex justify-center py-20"><p className="text-slate-400">Carregando...</p></div>;
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8">
        <p className="text-red-300">Torneio não encontrado.</p>
        <Link to="/admin" className="mt-5 inline-flex text-emerald-400 hover:text-emerald-300">
          ← Voltar para admin
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Header */}
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-950 p-8 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
              <Shield className="h-3.5 w-3.5" />
              Painel do Torneio
            </span>

            <div>
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                {tournament.name}
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Gerencie configurações, categorias e pagamentos pendentes deste torneio.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard Admin
            </Link>

            <Link
              to={`/torneios/${tournament.id}`}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/20"
            >
              Ver página pública
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Confirmações de pagamento */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Pagamentos Pendentes</h2>
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm font-semibold text-amber-400">
              {pendingPayments.length}
            </span>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-6 text-emerald-400">
              <CheckCircle className="h-5 w-5" />
              Nenhum pagamento pendente neste torneio.
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {pendingPayments.map((entry) => (
                <li
                  key={`${entry.kind}-${entry.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 shadow-lg"
                >
                  <div>
                    <p className="font-semibold text-white">{entry.playerName}</p>
                    <p className="text-sm text-slate-400">
                      {entry.tournamentName} · R$ {entry.amountDue}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.kind === "team" && (
                      <select
                        value={selectedPortion[entry.id] ?? "FULL"}
                        onChange={(e) =>
                          setSelectedPortion((prev) => ({
                            ...prev,
                            [entry.id]: e.target.value as TeamPaymentPortion,
                          }))
                        }
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                      >
                        {TEAM_PORTION_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      onClick={() => handleConfirmPayment(entry)}
                      disabled={confirmingId === entry.id}
                      className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {confirmingId === entry.id ? "Confirmando..." : "Confirmar"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Informações do Torneio */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Informações</h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-semibold text-white transition hover:border-emerald-400/40 hover:bg-emerald-400/10"
              >
                <Settings className="h-4 w-4" />
                Editar
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleTournamentSubmit} className="space-y-4">
              <FieldLabel label="Nome">
                <input
                  required
                  type="text"
                  value={tournamentForm.name}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Descrição">
                <textarea
                  value={tournamentForm.description}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Data e hora">
                <input
                  required
                  type="datetime-local"
                  value={tournamentForm.eventDate}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, eventDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <FieldLabel label="Local">
                <input
                  required
                  type="text"
                  value={tournamentForm.location}
                  onChange={(e) => setTournamentForm({ ...tournamentForm, location: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400"
                />
              </FieldLabel>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-900"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingTournament}
                  className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isSavingTournament ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(tournament.status)}`}>
                  {statusLabel(tournament.status)}
                </span>

                {tournament.status === "DRAFT" && (
                  <button
                    onClick={handlePublishTournament}
                    disabled={isPublishingTournament}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
                  >
                    {isPublishingTournament ? "Publicando..." : "Publicar torneio"}
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">Local</p>
                <p className="text-white">{tournament.location}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-slate-500">Data</p>
                <p className="text-white">
                  {new Date(tournament.eventDate).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Categorias */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Categorias do Torneio</h2>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Adicionar Nova Categoria</h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label="Nome da categoria">
                <input
                  required type="text" value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                  placeholder="Ex: Dupla Masculina Open"
                />
              </FieldLabel>
              <FieldLabel label="Formato">
                <select
                  value={categoryForm.format}
                  onChange={(e) => setCategoryForm({ ...categoryForm, format: e.target.value as CategoryFormState["format"] })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="DUO_FIXED">Dupla fixa</option>
                  <option value="DUO_RANDOM">Dupla sorteada</option>
                </select>
              </FieldLabel>
              <FieldLabel label="Valor da inscrição (R$)">
                <input
                  required type="number" min="0" step="0.01" value={categoryForm.entryFee}
                  onChange={(e) => setCategoryForm({ ...categoryForm, entryFee: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
              <FieldLabel label="Número de vagas">
                <input
                  required type="number" min="1" step="1" value={categoryForm.maxSlots}
                  onChange={(e) => setCategoryForm({ ...categoryForm, maxSlots: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
              <FieldLabel label="Limite de inscrição">
                <input
                  required type="datetime-local" value={categoryForm.registrationDeadline}
                  onChange={(e) => setCategoryForm({ ...categoryForm, registrationDeadline: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white focus:border-emerald-400"
                />
              </FieldLabel>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingCategory}
                className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSavingCategory ? "Criando..." : "Criar Categoria"}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          {tournament.categories.map((category) => (
            <div key={category.id} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl font-bold text-white">{category.name}</h4>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatLabel(category.format)} · R$ {category.entryFee} · {category.occupiedSlots}/{category.maxSlots} {slotsUnitLabel(category.format, category.maxSlots)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {category.status === "DRAFT" && (
                    <button
                      onClick={() => handlePublishCategory(category.id)}
                      disabled={publishingCategoryId === category.id}
                      className="rounded-xl bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {publishingCategoryId === category.id ? "Publicando..." : "Publicar"}
                    </button>
                  )}
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(category.status)}`}>
                    {statusLabel(category.status)}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {tournament.categories.length === 0 && (
            <p className="text-slate-400 text-center py-8">Nenhuma categoria criada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      {children}
    </label>
  );
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value);
  const pad = (input: number) => String(input).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}
