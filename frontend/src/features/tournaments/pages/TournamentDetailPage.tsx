import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { publishCategory } from "../../../api/categories.api";
import { getTournamentDetail } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  slotsUnitLabel,
  statusBadgeClasses,
  statusLabel,
  formatLabel,
} from "../../../shared/utils/tournamentLabels";
import { RegistrationActionCard } from "../components/RegistrationActionCard";
import type {
  TournamentDetail,
  TournamentDetailCategory,
} from "../../../types/api.types";


export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;

    setError(null);

    try {
      const result = await getTournamentDetail(id);
      setTournament(result);
      if (result.categories.length > 0) {
        setSelectedCategoryId((prev) => prev || result.categories[0].id);
      }
    } catch (err) {
      setError(
        getApiErrorMessage(err, "Não foi possível carregar este torneio."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [id]);


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


        {tournament.categories.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Este torneio ainda não tem categorias cadastradas.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
              {tournament.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategoryId(c.id)}
                  className={`rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                    selectedCategoryId === c.id
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                      : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
                  }`}
                >
                  {c.name} · {formatLabel(c.format)}
                </button>
              ))}
            </div>

            {tournament.categories
              .filter((c) => c.id === selectedCategoryId)
              .map((category) => (
                <CategoryBlock
                  key={category.id}
                  category={category}
                  onChanged={fetchDetail}
                />
              ))}
          </div>
        )}
      </div>
    </div>
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
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  async function handlePublish() {
    setIsPublishing(true);
    setPublishError(null);

    try {
      await publishCategory(category.id);
      onChanged();
    } catch (err) {
      setPublishError(
        getApiErrorMessage(err, "Não foi possível publicar a categoria."),
      );
    } finally {
      setIsPublishing(false);
    }
  }

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

        <div className="flex items-center gap-3">
          {isAdmin && category.status === "DRAFT" && (
            <button
              type="button"
              disabled={isPublishing}
              onClick={handlePublish}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPublishing ? "Publicando..." : "Publicar"}
            </button>
          )}

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusBadgeClasses(
              category.status,
            )}`}
          >
            {statusLabel(category.status)}
          </span>
        </div>
      </div>

      {publishError && (
        <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {publishError}
        </div>
      )}

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

      {/* Persistent Bracket View (Public) */}
      {category.winnerName && (
        <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-400 font-bold flex items-center gap-2">
          🏆 Campeão da Categoria: {category.winnerName}
        </div>
      )}

      {category.matches && category.matches.length > 0 && (
        <div className="mt-6 border-t border-slate-800 pt-5 space-y-4">
          <h4 className="text-lg font-bold text-white">Chaveamento Oficial</h4>
          {Array.from(new Set(category.matches.map((m) => m.round))).sort((a,b)=>a-b).map((roundNum) => {
            const roundMatches = category.matches!.filter((m) => m.round === roundNum);
            return (
              <div key={roundNum} className="space-y-2">
                <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Rodada {roundNum} {roundNum === Math.max(...category.matches!.map((m) => m.round)) && " (Final)"}
                </h5>
                <div className="grid gap-3 sm:grid-cols-2">
                  {roundMatches.map((match) => (
                    <div key={match.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className={match.winnerId === match.competitorAId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                            {match.competitorAName || "A definir"}
                          </span>
                          {match.winnerId === match.competitorAId && <span className="text-xs text-emerald-400 font-semibold">(Vencedor)</span>}
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-800/55 pt-2">
                          <span className={match.winnerId === match.competitorBId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                            {match.competitorBName || "A definir"}
                          </span>
                          {match.winnerId === match.competitorBId && <span className="text-xs text-emerald-400 font-semibold">(Vencedor)</span>}
                        </div>
                        {match.score && (
                          <div className="mt-2 text-xs text-slate-400 border-t border-slate-800 pt-2">
                            Placar: <span className="text-white font-medium">{match.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
