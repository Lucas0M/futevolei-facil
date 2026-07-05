import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getTournamentDetail } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { formatLabel, slotsUnitLabel, statusLabel, statusBadgeClasses } from "../../../shared/utils/tournamentLabels";
import { RegistrationActionCard } from "../components/RegistrationActionCard";
import type { TournamentDetail } from "../../../types/api.types";

export function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const result = await getTournamentDetail(id);
      setTournament(result);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível carregar este torneio."));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setIsLoading(true);
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return <p className="text-gray-500">Carregando torneio...</p>;
  }

  if (error || !tournament) {
    return (
      <div>
        <p className="text-red-600">{error ?? "Torneio não encontrado."}</p>
        <Link to="/torneios" className="mt-4 inline-block text-sm text-green-700 hover:underline">
          Voltar para a lista de torneios
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/torneios" className="text-sm text-green-700 hover:underline">
        ← Voltar para torneios
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">{tournament.name}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClasses(tournament.status)}`}>
          {statusLabel(tournament.status)}
        </span>
      </div>

      {tournament.description && <p className="mt-2 text-gray-600">{tournament.description}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase text-gray-500">Data</dt>
          <dd className="text-gray-900">
            {new Date(tournament.eventDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Local</dt>
          <dd className="text-gray-900">{tournament.location}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Categoria</dt>
          <dd className="text-gray-900">{tournament.category}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Formato</dt>
          <dd className="text-gray-900">{formatLabel(tournament.format)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Valor da inscrição</dt>
          <dd className="text-gray-900">R$ {tournament.entryFee}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Prazo de inscrição</dt>
          <dd className="text-gray-900">
            {new Date(tournament.registrationDeadline).toLocaleDateString("pt-BR")}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Vagas ocupadas</dt>
          <dd className="text-gray-900">
            {tournament.occupiedSlots} de {tournament.maxSlots} {slotsUnitLabel(tournament.format, tournament.maxSlots)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase text-gray-500">Vagas disponíveis</dt>
          <dd className="text-gray-900">
            {tournament.availableSlots} {slotsUnitLabel(tournament.format, tournament.availableSlots)}
          </dd>
        </div>
      </dl>

      {/* Registration action: register (individual/team) or cancel, depending on current state. */}
      <RegistrationActionCard tournament={tournament} onRegistrationChanged={fetchDetail} />

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-900">Inscritos</h2>
        {tournament.registrants.length === 0 ? (
          <p className="mt-2 text-gray-500">Ninguém se inscreveu ainda.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {tournament.registrants.map((registrant, index) => (
              <li key={index} className="flex items-center justify-between px-4 py-2">
                <span className="text-gray-900">
                  {registrant.ownerName
                    ? `${registrant.ownerName} + ${registrant.partnerName}`
                    : registrant.name}
                </span>
                <span className="text-xs text-gray-500">{registrant.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
