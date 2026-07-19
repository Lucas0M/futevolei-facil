import { useEffect, useState } from "react";
import { getAuditLogsRequest } from "../../../api/audit.api";
import type { GetAuditLogsParams } from "../../../api/audit.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  Shield,
  Search,
  Calendar,
  Layers,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  User as UserIcon,
} from "lucide-react";
import type { AuditLog } from "../../../types/api.types";

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filterUser, filterAction, filterModule, startDate, endDate, page, pageSize]);

  async function loadLogs() {
    setIsLoading(true);
    setError(null);
    try {
      const params: GetAuditLogsParams = {
        page,
        pageSize,
      };

      if (filterUser.trim()) params.userId = filterUser.trim();
      if (filterAction) params.action = filterAction;
      if (filterModule) params.module = filterModule;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const result = await getAuditLogsRequest(params);
      setLogs(result.data);
      setTotal(result.meta.total);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar logs de auditoria."));
    } finally {
      setIsLoading(false);
    }
  }

  const handleResetFilters = () => {
    setFilterUser("");
    setFilterAction("");
    setFilterModule("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "CREATE":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "UPDATE":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "DELETE":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "LOGIN":
      case "LOGOUT":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <Shield className="h-9 w-9 text-amber-400" />
            Logs de Auditoria
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Monitore e rastreie todas as atividades e alterações realizadas no sistema em tempo real.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shrink-0">
          <span className="text-xs font-semibold text-slate-400">Total de registros:</span>
          <span className="text-sm font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
            {total}
          </span>
        </div>
      </div>

      {/* Filters Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-slate-500" />
            Filtros de Busca
          </h3>
          {(filterUser || filterAction || filterModule || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {/* User ID */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <UserIcon className="h-3 w-3" /> ID do Usuário
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Filtrar por ID..."
                value={filterUser}
                onChange={(e) => {
                  setFilterUser(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-800 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            </div>
          </div>

          {/* Action type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Activity className="h-3 w-3" /> Ação
            </label>
            <select
              value={filterAction}
              onChange={(e) => {
                setFilterAction(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
            >
              <option value="">Todas</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
            </select>
          </div>

          {/* Module */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Layers className="h-3 w-3" /> Módulo
            </label>
            <select
              value={filterModule}
              onChange={(e) => {
                setFilterModule(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
            >
              <option value="">Todos</option>
              <option value="Usuários">Usuários</option>
              <option value="Torneios">Torneios</option>
              <option value="Equipes">Equipes</option>
              <option value="Inscrições">Inscrições</option>
              <option value="Pagamentos">Pagamentos</option>
              <option value="Atletas">Atletas</option>
              <option value="Rankings">Rankings</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data Inicial
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Calendar className="h-3 w-3" /> Data Final
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 outline-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Logs Table Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/40 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Ação</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Módulo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Carregando registros...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhum log encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 text-xs text-slate-300 font-mono whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.userName ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{log.userName}</span>
                          <span className="text-[10px] text-slate-400">{log.userEmail}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Sistema / Visitante</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-300">
                      {log.module}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 p-1.5 text-slate-300 hover:text-white transition inline-flex items-center gap-1 text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-white outline-none focus:border-amber-400"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-xs text-slate-400">por página</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold text-slate-400 px-2">
                Página <span className="text-white font-bold">{page}</span> de <span className="text-white font-bold">{totalPages}</span>
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:text-white transition disabled:opacity-30 disabled:hover:text-slate-400"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-850 bg-[#07090e] shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-850 p-6 bg-slate-950/80">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-400" />
                  Detalhes do Log
                </h3>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedLog.id}</span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Top Info Cards */}
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Data e Hora</span>
                  <span className="text-xs text-white font-semibold font-mono block mt-1">
                    {formatDateTime(selectedLog.createdAt)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ação / Módulo</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionColor(selectedLog.action)}`}>
                      {selectedLog.action}
                    </span>
                    <span className="text-xs text-white font-semibold">{selectedLog.module}</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">IP do Cliente</span>
                  <span className="text-xs text-white font-semibold font-mono block mt-1">
                    {selectedLog.ip || "N/A"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Usuário</span>
                  <span className="text-xs text-white font-semibold block mt-1 truncate">
                    {selectedLog.userName ? `${selectedLog.userName} (${selectedLog.userRole})` : "Sistema / Visitante"}
                  </span>
                </div>
              </div>

              {/* Description & User Agent */}
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Descrição Legível</span>
                  <p className="text-sm font-semibold text-slate-200">{selectedLog.description}</p>
                </div>

                {selectedLog.userAgent && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Dispositivo / User-Agent</span>
                    <p className="text-xs text-slate-400 font-mono break-all">{selectedLog.userAgent}</p>
                  </div>
                )}

                {selectedLog.entity && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/20 p-4">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Entidade Afetada</span>
                    <div className="flex gap-4 text-xs font-mono text-slate-300">
                      <span>Nome: <strong className="text-white">{selectedLog.entity}</strong></span>
                      {selectedLog.entityId && <span>ID: <strong className="text-white">{selectedLog.entityId}</strong></span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Data Diff (Old vs New Data) */}
              {(selectedLog.oldData || selectedLog.newData) && (
                <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-slate-850">
                  {/* Old Data */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      Valores Antigos (Antes)
                    </h4>
                    {selectedLog.oldData ? (
                      <pre className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto max-h-72">
                        {JSON.stringify(selectedLog.oldData, null, 2)}
                      </pre>
                    ) : (
                      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-4 text-xs text-slate-500 italic text-center">
                        Nenhum dado anterior
                      </div>
                    )}
                  </div>

                  {/* New Data */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      Valores Novos (Depois)
                    </h4>
                    {selectedLog.newData ? (
                      <pre className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-auto max-h-72">
                        {JSON.stringify(selectedLog.newData, null, 2)}
                      </pre>
                    ) : (
                      <div className="bg-slate-900/30 border border-dashed border-slate-800 rounded-xl p-4 text-xs text-slate-500 italic text-center">
                        Nenhum dado novo
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-850 p-4 bg-slate-950/80 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
