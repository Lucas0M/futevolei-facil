import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../shared/layouts/AppLayout";
import { RequireAuth } from "../shared/guards/RequireAuth";
import { HomePage } from "../features/home/pages/HomePage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { TournamentListPage } from "../features/tournaments/pages/TournamentListPage";
import { TournamentDetailPage } from "../features/tournaments/pages/TournamentDetailPage";

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

      // Protected routes - require login (e.g. "minhas inscrições", built later).
      {
        element: <RequireAuth />,
        children: [],
      },
    ],
  },
]);
