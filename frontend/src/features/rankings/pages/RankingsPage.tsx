import { useEffect, useState } from "react";
import { getDuoRankings, getIndividualRankings, type DuoRankingEntry, type IndividualRankingEntry } from "../../../api/rankings.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { Trophy, Users, User } from "lucide-react";

export function RankingsPage() {
  const [duoRankings, setDuoRankings] = useState<DuoRankingEntry[]>([]);
  const [individualRankings, setIndividualRankings] = useState<IndividualRankingEntry[]>([]);
  const [activeTab, setActiveTab] = useState<"duo" | "individual">("duo");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRankings() {
      setIsLoading(true);
      setError(null);
      try {
        const [duoRes, indRes] = await Promise.all([
          getDuoRankings(),
          getIndividualRankings(),
        ]);
        setDuoRankings(duoRes);
        setIndividualRankings(indRes);
      } catch (err) {
        setError(getApiErrorMessage(err, "Não foi possível carregar os rankings."));
      } finally {
        setIsLoading(false);
      }
    }
    loadRankings();
  }, []);

  const renderPositionBadge = (index: number) => {
    const position = index + 1;
    if (position === 1) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-500 text-slate-950 font-black text-sm shadow-[0_0_10px_rgba(234,179,8,0.4)]">
          1
        </span>
      );
    }
    if (position === 2) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-950 font-black text-sm shadow-[0_0_10px_rgba(203,213,225,0.4)]">
          2
        </span>
      );
    }
    if (position === 3) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-white font-black text-sm">
          3
        </span>
      );
    }
    return <span className="text-slate-400 font-bold pl-2.5">{position}º</span>;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-emerald-400" />
            Ranking Geral
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Acompanhe a classificação oficial dos melhores atletas da Arena ARES.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-white/5">
          <button
            onClick={() => setActiveTab("duo")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "duo"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Duplas ({duoRankings.length})
          </button>
          <button
            onClick={() => setActiveTab("individual")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "individual"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Individual ({individualRankings.length})
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400 animate-pulse">Processando pontuações da arena...</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Posição</th>
                <th className="px-6 py-4">Atleta(s)</th>
                <th className="px-6 py-4 text-center">Vitórias</th>
                <th className="px-6 py-4 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeTab === "duo"
                ? duoRankings.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                        {renderPositionBadge(index)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-slate-500" />
                          <span>{entry.playerAName} <span className="text-emerald-400 font-medium">+</span> {entry.playerBName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300 font-semibold">
                        {entry.wins}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-bold text-base">
                        {entry.points.toFixed(1)} <span className="text-[10px] text-slate-500 font-medium">pts</span>
                      </td>
                    </tr>
                  ))
                : individualRankings.map((entry, index) => (
                    <tr key={entry.id} className="hover:bg-white/[0.02] transition duration-150">
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                        {renderPositionBadge(index)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-slate-500" />
                          <span>{entry.playerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300 font-semibold">
                        {entry.wins}
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-bold text-base">
                        {entry.points.toFixed(1)} <span className="text-[10px] text-slate-500 font-medium">pts</span>
                      </td>
                    </tr>
                  ))}

              {((activeTab === "duo" && duoRankings.length === 0) ||
                (activeTab === "individual" && individualRankings.length === 0)) && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma pontuação registrada no ranking ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
