import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../shared/layouts/AppLayout";
import { RequireAuth } from "../shared/guards/RequireAuth";
import { RequireAdmin } from "../shared/guards/RequireAdmin";
import { HomePage } from "../features/home/pages/HomePage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { TournamentListPage } from "../features/tournaments/pages/TournamentListPage";
import { TournamentDetailPage } from "../features/tournaments/pages/TournamentDetailPage";
import { TournamentHistoryPage } from "../features/tournaments/pages/TournamentHistoryPage";
import { RankingsPage } from "../features/rankings/pages/RankingsPage";
import { MyRegistrationsPage } from "../features/registrations/pages/MyRegistrationsPage";
import { DashboardPage } from "../features/admin/pages/DashboardPage";
import { AdminTournamentDetailPage } from "../features/admin/pages/AdminTournamentDetailPage";
import { ParticipantsPage } from "../features/admin/pages/ParticipantsPage";
import { RequireSuperAdmin } from "../shared/guards/RequireSuperAdmin";
import { AuditLogPage } from "../features/admin/pages/AuditLogPage";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      // Public routes - no login required to browse.
      { index: true, element: <HomePage /> },
      { path: "login", element: <LoginPage /> },
      { path: "registro", element: <RegisterPage /> },
      { path: "torneios", element: <TournamentListPage /> },
      { path: "torneios/:id", element: <TournamentDetailPage /> },
      { path: "historico", element: <TournamentHistoryPage /> },
      { path: "ranking", element: <RankingsPage /> },

      // Protected routes - require login (e.g. "minhas inscrições", built later).
      {
        element: <RequireAuth />,
        children: [{ path: "minhas-inscricoes", element: <MyRegistrationsPage /> }],
      },

      // Admin-only routes.
      {
        element: <RequireAdmin />,
        children: [
          { path: "admin", element: <DashboardPage /> },
          { path: "admin/torneios/:id", element: <AdminTournamentDetailPage /> },
          { path: "admin/atletas", element: <ParticipantsPage /> },
        ],
      },

      // Superadmin-only routes.
      {
        element: <RequireSuperAdmin />,
        children: [
          { path: "admin/logs", element: <AuditLogPage /> },
        ],
      },
    ],
  },
]);
