import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { getTournamentDetail } from "../../../api/tournaments.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import {
  formatLabel,
  slotsUnitLabel,
  statusLabel,
  statusBadgeClasses,
} from "../../../shared/utils/tournamentLabels";
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
        <p className="text-slate-400 text-lg">Carregando torneio...</p>
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

      {/* HERO */}

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

      {/* DADOS */}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Data",
            value: new Date(tournament.eventDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          {
            title: "Local",
            value: tournament.location,
          },
          {
            title: "Categoria",
            value: tournament.category,
          },
          {
            title: "Formato",
            value: formatLabel(tournament.format),
          },
          {
            title: "Valor",
            value: `R$ ${tournament.entryFee}`,
          },
          {
            title: "Prazo de inscrição",
            value: new Date(tournament.registrationDeadline).toLocaleDateString(
              "pt-BR",
            ),
          },
          {
            title: "Vagas ocupadas",
            value: `${tournament.occupiedSlots} de ${
              tournament.maxSlots
            } ${slotsUnitLabel(tournament.format, tournament.maxSlots)}`,
          },
          {
            title: "Disponíveis",
            value: `${tournament.availableSlots} ${slotsUnitLabel(
              tournament.format,
              tournament.availableSlots,
            )}`,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {item.title}
            </p>

            <p className="mt-2 text-lg font-semibold text-white">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* CARD DE INSCRIÇÃO */}

      <div className="mt-8">
        <RegistrationActionCard
          tournament={tournament}
          onRegistrationChanged={fetchDetail}
        />
      </div>

      {/* INSCRITOS */}

      <div className="mt-10">
        <h2 className="mb-5 text-2xl font-bold text-white">Inscritos</h2>

        {tournament.registrants.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-400">
            Ainda não há inscritos neste torneio.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
            {tournament.registrants.map((registrant, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-slate-800 px-6 py-4 last:border-none"
              >
                <div>
                  <p className="font-semibold text-white">
                    {registrant.ownerName
                      ? `${registrant.ownerName} + ${registrant.partnerName}`
                      : registrant.name}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">Participante</p>
                </div>

                <span className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
                  {registrant.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
