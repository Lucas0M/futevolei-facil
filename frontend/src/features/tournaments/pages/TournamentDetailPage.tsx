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
  const [activeTab, setActiveTab] = useState<"WINNER" | "LOSER" | "FINALS">("WINNER");

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
        <div className="mt-6 border-t border-slate-800 pt-5 space-y-6 max-w-full overflow-x-auto">
          <h4 className="text-lg font-bold text-white">Chaveamento Oficial (Double Elimination)</h4>
          {(() => {
            const renderMatchCard = (match: any) => {
              return (
                <div key={match.id} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm hover:border-slate-800 transition">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {match.label || "Jogo"}
                      </span>
                      {match.score && (
                        <span className="text-[11px] text-slate-400">
                          Placar: <span className="text-white font-semibold">{match.score}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className={match.winnerId === match.competitorAId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {match.competitorAName || "A definir"}
                      </span>
                      {match.winnerId === match.competitorAId && <span className="text-xs text-emerald-400 font-semibold">🏆</span>}
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-800/30 pt-2">
                      <span className={match.winnerId === match.competitorBId ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {match.competitorBName || "A definir"}
                      </span>
                      {match.winnerId === match.competitorBId && <span className="text-xs text-emerald-400 font-semibold">🏆</span>}
                    </div>
                  </div>
                </div>
              );
            };

            const wMatches = category.matches!.filter(m => m.bracketType === "WINNER");
            const lMatches = category.matches!.filter(m => m.bracketType === "LOSER");
            const gfMatches = category.matches!.filter(m => m.bracketType === "GRAND_FINAL" || m.bracketType === "RESET_FINAL");
            const tpMatches = category.matches!.filter(m => m.bracketType === "THIRD_PLACE");

            const totalWBRounds = wMatches.length > 0 ? Math.max(...wMatches.map((m) => m.round)) : 1;
            const totalLBRounds = lMatches.length > 0 ? Math.max(...lMatches.map((m) => m.round)) : 1;

            const getRoundTitle = (round: number, totalRounds: number) => {
              if (round === totalRounds) return "Final Winner";
              if (round === totalRounds - 1) return "Semifinal";
              if (round === totalRounds - 2) return "Quartas de Final";
              if (round === totalRounds - 3) return "Oitavas de Final";
              if (round === totalRounds - 4) return "16-avos de Final";
              return `Rodada ${round}`;
            };

            const getLoserRoundTitle = (round: number, totalRounds: number) => {
              if (round === totalRounds) return "Final Loser";
              if (round === totalRounds - 1) return "Semifinal Loser";
              if (round === totalRounds - 2) return "Quartas Loser";
              return `Loser Rodada ${round}`;
            };

            return (
              <div className="space-y-6 mt-4 z-10 relative">
                {/* Tab Navigation */}
                <div className="flex gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 w-fit">
                  <button
                    type="button"
                    onClick={() => setActiveTab("WINNER")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                      activeTab === "WINNER"
                        ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Chave Principal (Winner)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("LOSER")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                      activeTab === "LOSER"
                        ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Chave de Repescagem (Loser)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("FINALS")}
                    className={`px-4 py-2 text-xs font-bold rounded-lg transition duration-200 ${
                      activeTab === "FINALS"
                        ? "bg-rose-500 text-slate-950 shadow-lg shadow-rose-500/10"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Finais e Decisões
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === "WINNER" && (
                  <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                    {wMatches.length > 0 ? (
                      (() => {
                        const maxRoundMatches = Math.max(...Array.from(new Set(wMatches.map(m => m.round))).map(r => wMatches.filter(m => m.round === r).length));
                        const colMinHeight = Math.max(550, maxRoundMatches * 160);
                        return Array.from(new Set(wMatches.map((m) => m.round))).sort((a,b)=>a-b).map((roundNum) => {
                          const roundMatches = wMatches.filter((m) => m.round === roundNum);
                          const isFinalRound = roundNum === totalWBRounds;
                          return (
                            <div key={`w-r-${roundNum}`} style={{ minHeight: `${colMinHeight}px` }} className="flex flex-col justify-around w-64 relative py-8">
                              <div className="text-center text-[10px] font-bold text-emerald-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-emerald-500/20 bg-emerald-500/5 py-1 rounded-md">
                                {getRoundTitle(roundNum, totalWBRounds)}
                              </div>
                              {roundMatches.map((match) => (
                                <div key={match.id} className="relative group my-4">
                                  {!isFinalRound && (
                                    <div className="absolute right-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-emerald-500 transition duration-300 z-0" />
                                  )}
                                  {roundNum > 1 && (
                                    <div className="absolute left-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-emerald-500 transition duration-300 z-0" />
                                  )}
                                  <div className="relative z-10">
                                    {renderMatchCard(match)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <p className="text-slate-400 text-sm">Nenhuma partida gerada ainda.</p>
                    )}
                  </div>
                )}

                {activeTab === "LOSER" && (
                  <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                    {lMatches.length > 0 ? (
                      (() => {
                        const maxRoundMatches = Math.max(...Array.from(new Set(lMatches.map(m => m.round))).map(r => lMatches.filter(m => m.round === r).length));
                        const colMinHeight = Math.max(550, maxRoundMatches * 160);
                        return Array.from(new Set(lMatches.map((m) => m.round))).sort((a,b)=>a-b).map((roundNum) => {
                          const roundMatches = lMatches.filter((m) => m.round === roundNum);
                          const isFinalRound = roundNum === totalLBRounds;
                          return (
                            <div key={`l-r-${roundNum}`} style={{ minHeight: `${colMinHeight}px` }} className="flex flex-col justify-around w-64 relative py-8">
                              <div className="text-center text-[10px] font-bold text-amber-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-amber-500/20 bg-amber-500/5 py-1 rounded-md">
                                {getLoserRoundTitle(roundNum, totalLBRounds)}
                              </div>
                              {roundMatches.map((match) => (
                                <div key={match.id} className="relative group my-4">
                                  {roundNum > 1 && (
                                    <div className="absolute left-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-amber-500 transition duration-300 z-0" />
                                  )}
                                  {!isFinalRound && (
                                    <div className="absolute right-[-64px] top-1/2 -translate-y-1/2 w-16 border-t-2 border-slate-800 group-hover:border-amber-500 transition duration-300 z-0" />
                                  )}
                                  <div className="relative z-10">
                                    {renderMatchCard(match)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        });
                      })()
                    ) : (
                      <p className="text-slate-400 text-sm">Nenhuma partida de repescagem.</p>
                    )}
                  </div>
                )}

                {activeTab === "FINALS" && (
                  <div className="flex gap-16 overflow-x-auto pb-8 pt-10 scrollbar-thin scrollbar-thumb-slate-800 justify-start items-center min-w-max px-6">
                    {gfMatches.length > 0 && (
                      <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                        <div className="text-center text-[10px] font-bold text-rose-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-rose-500/20 bg-rose-500/5 py-1 rounded-md">
                          Grande Final
                        </div>
                        {gfMatches.filter(m => m.bracketType === "GRAND_FINAL").map((match) => (
                          <div key={match.id} className="relative group">
                            <div className="relative z-10">
                              {renderMatchCard(match)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {gfMatches.some(m => m.bracketType === "RESET_FINAL" && (m.competitorAId || m.competitorBId)) && (
                      <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                        <div className="text-center text-[10px] font-bold text-rose-500 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-rose-500/20 bg-rose-500/5 py-1 rounded-md">
                          Jogo de Reset
                        </div>
                        {gfMatches.filter(m => m.bracketType === "RESET_FINAL").map((match) => (
                          <div key={match.id} className="relative group">
                            <div className="relative z-10">
                              {renderMatchCard(match)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tpMatches.length > 0 && (
                      <div className="flex flex-col justify-center gap-12 min-h-[500px] w-64 relative py-8">
                        <div className="text-center text-[10px] font-bold text-sky-400 uppercase tracking-widest absolute -top-4 left-0 right-0 border border-sky-500/20 bg-sky-500/5 py-1 rounded-md">
                          Disputa de 3º Lugar
                        </div>
                        {tpMatches.map((match) => (
                          <div key={match.id} className="relative group">
                            <div className="relative z-10">
                              {renderMatchCard(match)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
