import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../../../api/auth.api";
import { getApiErrorMessage } from "../../../api/httpClient";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPasswordRequest(email.trim());
      setSuccess(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Não foi possível processar a solicitação."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative mx-auto flex min-h-[75vh] max-w-md items-center justify-center px-4">
      {/* Glow */}
      <div className="absolute left-1/2 top-1/3 -z-10 h-80 w-80 -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-black/30 backdrop-blur">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white">Recuperar Senha</h1>
          <p className="mt-2 text-sm text-slate-400">
            {success
              ? "Instruções enviadas! Verifique sua caixa de entrada."
              : "Digite seu e-mail e enviaremos um link de redefinição."}
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 text-center">
              Se o e-mail estiver cadastrado em nossa plataforma, você receberá um link para redefinir sua senha em instantes.
            </div>

            <Link
              to="/login"
              className="block w-full text-center rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
            >
              Voltar para o Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                E-mail
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu-email@exemplo.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Enviando..." : "Enviar link de recuperação"}
            </button>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                Voltar para o Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
