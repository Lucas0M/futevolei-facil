import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../shared/layouts/AppLayout";
import { RequireAuth } from "../shared/guards/RequireAuth";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { RegisterPage } from "../features/auth/pages/RegisterPage";
import { TournamentListPage } from "../features/tournaments/pages/TournamentListPage";
import { TournamentDetailPage } from "../features/tournaments/pages/TournamentDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "registro", element: <RegisterPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: "torneios", element: <TournamentListPage /> },
          { path: "torneios/:id", element: <TournamentDetailPage /> },
          { index: true, element: <TournamentListPage /> },
        ],
      },
    ],
  },
]);
