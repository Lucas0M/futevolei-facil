import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listTournaments } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { statusBadgeClasses, statusLabel } from "../../../shared/utils/tournamentLabels";
import type { Tournament } from "../../../types/api.types";
import { Trophy, Calendar, MapPin, Award } from "lucide-react";

export function TournamentHistoryPage() {
  const [finishedTournaments, setFinishedTournaments] = useState<Tournament[]>([]);
  const [cancelledTournaments, setCancelledTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"finished" | "cancelled">("finished");

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);
      try {
        const [finishedRes, cancelledRes] = await Promise.all([
          listTournaments({ page: 1, pageSize: 100, status: "FINISHED" }),
          listTournaments({ page: 1, pageSize: 100, status: "CANCELLED" }),
        ]);
        setFinishedTournaments(finishedRes.data);
        setCancelledTournaments(cancelledRes.data);
      } catch (err) {
        setError(getApiErrorMessage(err, "Não foi possível carregar o histórico de torneios."));
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const activeTournaments = activeTab === "finished" ? finishedTournaments : cancelledTournaments;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-emerald-400" />
            Histórico de Torneios
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Acompanhe os chaveamentos oficiais, pontuações e vencedores das edições anteriores.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("finished")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "finished"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Finalizados ({finishedTournaments.length})
          </button>
          <button
            onClick={() => setActiveTab("cancelled")}
            className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "cancelled"
                ? "bg-red-500/20 text-red-400 font-bold border border-red-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Cancelados ({cancelledTournaments.length})
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-slate-400 animate-pulse text-sm">Buscando registros da arena...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 font-medium">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeTournaments.map((tournament) => (
            <Link
              key={tournament.id}
              to={`/torneios/${tournament.id}`}
              className="group relative block rounded-2xl border border-slate-800 bg-slate-950/60 p-6 transition duration-300 hover:border-emerald-500/30 hover:bg-slate-900/40"
            >
              {/* Highlight gradient */}
              <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex justify-between items-start gap-4">
                <h3 className="font-bold text-white group-hover:text-emerald-400 transition text-lg line-clamp-1">
                  {tournament.name}
                </h3>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClasses(tournament.status)}`}>
                  {statusLabel(tournament.status)}
                </span>
              </div>

              <div className="mt-4 space-y-2.5 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate">{tournament.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>{new Date(tournament.eventDate).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
                </div>
              </div>

              {activeTab === "finished" && (
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-emerald-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    Ver Campeões & Chaves
                  </span>
                </div>
              )}
            </Link>
          ))}

          {activeTournaments.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
              <p className="text-sm text-slate-500">Nenhum torneio encontrado nesta seção.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
