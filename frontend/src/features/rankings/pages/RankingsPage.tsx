import { useEffect, useState } from "react";
import {
  getDuoRankings,
  getIndividualRankings,
  getFeminineRankings,
  saveDuoRankingManual,
  saveIndividualRankingManual,
  saveFeminineRankingManual,
  deleteDuoRanking,
  deleteIndividualRanking,
  deleteFeminineRanking,
  type DuoRankingEntry,
  type IndividualRankingEntry,
} from "../../../api/rankings.api";
import { getPlayers, type Player } from "../../../api/players.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { Trophy, Users, User } from "lucide-react";
import { useAuth } from "../../../context/AuthContext";

export function RankingsPage() {
  const [duoRankings, setDuoRankings] = useState<DuoRankingEntry[]>([]);
  const [individualRankings, setIndividualRankings] = useState<
    IndividualRankingEntry[]
  >([]);
  const [feminineRankings, setFeminineRankings] = useState<
    IndividualRankingEntry[]
  >([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<"general" | "feminine">("general");
  const [generalType, setGeneralType] = useState<"duo" | "individual">("duo");
  const [genderFilter, setGenderFilter] = useState<
    "ALL" | "MALE" | "FEMALE" | "MIXED"
  >("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // Form states
  const [formPlayerA, setFormPlayerA] = useState("");
  const [formPlayerB, setFormPlayerB] = useState("");
  const [formPlayerName, setFormPlayerName] = useState("");
  const [formPoints, setFormPoints] = useState(0);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadRankings() {
      setIsLoading(true);
      setError(null);
      try {
        const [duoRes, indRes, femRes, playersRes] = await Promise.all([
          getDuoRankings(),
          getIndividualRankings(),
          getFeminineRankings(),
          getPlayers(),
        ]);
        setDuoRankings(duoRes);
        setIndividualRankings(indRes);
        setFeminineRankings(femRes);
        setPlayers(playersRes);
      } catch (err) {
        setError(
          getApiErrorMessage(err, "Não foi possível carregar os rankings."),
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadRankings();
  }, []);

  const handleSaveManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);
    setError(null);
    setSaveSuccess(false);

    try {
      const isDuo = activeTab === "general" && generalType === "duo";
      if (isDuo) {
        if (!formPlayerA.trim() || !formPlayerB.trim()) {
          throw new Error("Preencha o nome dos dois jogadores.");
        }
        await saveDuoRankingManual(
          formPlayerA.trim(),
          formPlayerB.trim(),
          0,
          formPoints,
        );
      } else if (activeTab === "feminine") {
        if (!formPlayerName.trim()) {
          throw new Error("Preencha o nome da jogadora.");
        }
        await saveFeminineRankingManual(formPlayerName.trim(), 0, formPoints);
      } else {
        if (!formPlayerName.trim()) {
          throw new Error("Preencha o nome do jogador.");
        }
        await saveIndividualRankingManual(formPlayerName.trim(), 0, formPoints);
      }

      setSaveSuccess(true);
      setFormPlayerA("");
      setFormPlayerB("");
      setFormPlayerName("");
      setFormPoints(0);

      // Reload rankings
      const [duoRes, indRes, femRes] = await Promise.all([
        getDuoRankings(),
        getIndividualRankings(),
        getFeminineRankings(),
      ]);
      setDuoRankings(duoRes);
      setIndividualRankings(indRes);
      setFeminineRankings(femRes);
    } catch (err: any) {
      setError(err.message || "Erro ao salvar pontuação manual.");
    } finally {
      setIsSavingManual(false);
    }
  };

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

  const activeDuoData = duoRankings.filter(
    (entry) => genderFilter === "ALL" || entry.duoType === genderFilter
  );

  const activeIndividualData = activeTab === "general"
    ? individualRankings.filter(
        (entry) => genderFilter === "ALL" || entry.gender === genderFilter
      )
    : feminineRankings;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <Trophy className="h-8 w-8 text-emerald-400" />
            Ranking Geral
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Acompanhe a classificação oficial dos melhores atletas da ARES
            Futevôlei.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-slate-900/80 p-1 border border-white/5">
          <button
            onClick={() => {
              setActiveTab("general");
              setGenderFilter("ALL");
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "general"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Ranking Geral
          </button>
          <button
            onClick={() => {
              setActiveTab("feminine");
              setGenderFilter("ALL");
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition ${
              activeTab === "feminine"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Liga Feminina ({feminineRankings.length})
          </button>
        </div>
      </div>

      {/* Sub-toggle for General Tab (Duo vs Individual) */}
      {activeTab === "general" && (
        <div className="inline-flex rounded-xl bg-slate-900/40 p-1 border border-white/5">
          <button
            onClick={() => {
              setGeneralType("duo");
              setGenderFilter("ALL");
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              generalType === "duo"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Duplas ({duoRankings.length})
          </button>
          <button
            onClick={() => {
              setGeneralType("individual");
              setGenderFilter("ALL");
            }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              generalType === "individual"
                ? "bg-slate-800 text-white font-bold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <User className="h-3.5 w-3.5" />
            Individual ({individualRankings.length})
          </button>
        </div>
      )}

      {isAdmin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
            Lançar Pontuação Manual (
            {activeTab === "general" && generalType === "duo" ? "Dupla" : "Individual / Liga Feminina"})
          </h3>
          <form
            onSubmit={handleSaveManual}
            className="grid gap-4 sm:grid-cols-3 items-end"
          >
            {activeTab === "general" && generalType === "duo" ? (
              <>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Atleta A
                  </label>
                  <select
                    required
                    value={formPlayerA}
                    onChange={(e) => setFormPlayerA(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
                  >
                    <option value="">Selecione o atleta A...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Atleta B
                  </label>
                  <select
                    required
                    value={formPlayerB}
                    onChange={(e) => setFormPlayerB(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
                  >
                    <option value="">Selecione o atleta B...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">
                  Atleta {activeTab === "feminine" ? "(Liga Feminina)" : "(Individual)"}
                </label>
                <select
                  required
                  value={formPlayerName}
                  onChange={(e) => setFormPlayerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
                >
                  <option value="">Selecione uma atleta...</option>
                  {players
                    .filter((p) => activeTab !== "feminine" || p.gender === "FEMALE")
                    .map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Pontos
              </label>
              <input
                type="number"
                step="any"
                required
                value={formPoints}
                onChange={(e) => setFormPoints(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2 border-t border-slate-900">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 font-semibold self-center mr-auto">
                  ✓ Salvo com sucesso!
                </span>
              )}
              <button
                type="submit"
                disabled={isSavingManual}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
              >
                {isSavingManual ? "Salvando..." : "Salvar no Ranking"}
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading && (
        <div className="py-12 text-center">
          <p className="text-sm text-slate-400 animate-pulse">
            Processando pontuações da arena...
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Gender Filters (Only visible on general tab) */}
      {activeTab === "general" && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setGenderFilter("ALL")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 border ${
              genderFilter === "ALL"
                ? "bg-slate-800 text-white border-slate-700"
                : "text-slate-400 hover:text-white bg-slate-950/20 border-slate-900"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setGenderFilter("MALE")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 border ${
              genderFilter === "MALE"
                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                : "text-slate-400 hover:text-white bg-slate-950/20 border-slate-900"
            }`}
          >
            Masculino
          </button>
          <button
            onClick={() => setGenderFilter("FEMALE")}
            className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 border ${
              genderFilter === "FEMALE"
                ? "bg-pink-500/20 text-pink-400 border-pink-500/30"
                : "text-slate-400 hover:text-white bg-slate-950/20 border-slate-900"
            }`}
          >
            Feminino
          </button>
          {generalType === "duo" && (
            <button
              onClick={() => setGenderFilter("MIXED")}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition duration-200 border ${
                genderFilter === "MIXED"
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                  : "text-slate-400 hover:text-white bg-slate-950/20 border-slate-900"
              }`}
            >
              Misto
            </button>
          )}
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Posição</th>
                <th className="px-6 py-4">Atleta(s)</th>
                <th className="px-6 py-4 text-right">Pontos</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {activeTab === "general" && generalType === "duo"
                ? activeDuoData.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-white/[0.02] transition duration-150"
                    >
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                        {renderPositionBadge(index)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2 overflow-hidden shrink-0">
                            {entry.photoUrlA ? (
                              <img
                                src={entry.photoUrlA}
                                alt={entry.playerAName}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 object-cover"
                              />
                            ) : (
                              <div className="inline-block h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-950">
                                {entry.playerAName
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                            {entry.photoUrlB ? (
                              <img
                                src={entry.photoUrlB}
                                alt={entry.playerBName}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950 object-cover"
                              />
                            ) : (
                              <div className="inline-block h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center justify-center ring-2 ring-slate-950">
                                {entry.playerBName
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span>
                            {entry.playerAName}{" "}
                            <span className="text-emerald-400 font-medium">
                              +
                            </span>{" "}
                            {entry.playerBName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-bold text-base whitespace-nowrap">
                        {entry.points.toFixed(1)}{" "}
                        <span className="text-[10px] text-slate-500 font-medium">
                          pts
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setFormPlayerA(entry.playerAName);
                                setFormPlayerB(entry.playerBName);
                                setFormPoints(entry.points);
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              className="rounded bg-slate-800 p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm("Excluir esta dupla do ranking?")
                                ) {
                                  try {
                                    await deleteDuoRanking(entry.id);
                                    setDuoRankings(await getDuoRankings());
                                  } catch {
                                    setError("Erro ao deletar ranking.");
                                  }
                                }
                              }}
                              className="rounded bg-slate-800 p-1 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                : activeIndividualData.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="hover:bg-white/[0.02] transition duration-150"
                    >
                      <td className="px-6 py-4 font-semibold text-white whitespace-nowrap">
                        {renderPositionBadge(index)}
                      </td>
                      <td className="px-6 py-4 font-bold text-white whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {entry.photoUrl ? (
                            <img
                              src={entry.photoUrl}
                              alt={entry.playerName}
                              className="h-8 w-8 rounded-full object-cover border border-white/10 shrink-0"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                              {entry.playerName.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span>{entry.playerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-400 font-bold text-base whitespace-nowrap">
                        {entry.points.toFixed(1)}{" "}
                        <span className="text-[10px] text-slate-500 font-medium">
                          pts
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setFormPlayerName(entry.playerName);
                                setFormPoints(entry.points);
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              className="rounded bg-slate-800 p-1 text-slate-400 hover:bg-slate-700 hover:text-white transition"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  confirm(
                                    "Excluir este participante do ranking?",
                                  )
                                ) {
                                  try {
                                    if (activeTab === "feminine") {
                                      await deleteFeminineRanking(entry.id);
                                      setFeminineRankings(await getFeminineRankings());
                                    } else {
                                      await deleteIndividualRanking(entry.id);
                                      setIndividualRankings(
                                        await getIndividualRankings(),
                                      );
                                    }
                                  } catch {
                                    setError("Erro ao deletar ranking.");
                                  }
                                }
                              }}
                              className="rounded bg-slate-800 p-1 text-slate-400 hover:bg-rose-950/40 hover:text-rose-400 transition"
                              title="Excluir"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}

              {((activeTab === "general" && generalType === "duo" && activeDuoData.length === 0) ||
                (activeTab === "general" && generalType === "individual" && activeIndividualData.length === 0) ||
                (activeTab === "feminine" && activeIndividualData.length === 0)) && (
                <tr>
                  <td
                    colSpan={isAdmin ? 4 : 3}
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    Nenhuma pontuação registrada neste ranking com este filtro.
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
