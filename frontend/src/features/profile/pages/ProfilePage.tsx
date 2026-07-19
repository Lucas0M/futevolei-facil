import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { getProfile, updateProfile, updatePassword } from "../../../api/profile.api";
import { User, Lock, Camera } from "lucide-react";
import { getApiErrorMessage } from "../../../api/httpClient";

export function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile Form States
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // UI Status
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);
  const [successPassword, setSuccessPassword] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const data = await getProfile();
        setName(data.name);
        setEmail(data.email);
        if (data.avatarUrl) {
          const fullUrl = data.avatarUrl.startsWith("http")
            ? data.avatarUrl
            : `${import.meta.env.VITE_API_URL || ""}${data.avatarUrl}`;
          setPreviewUrl(fullUrl);
        }
      } catch (err) {
        console.error("Não foi possível carregar os dados de perfil.", err);
      }
    }
    loadProfile();
  }, [user]);

  // Handle avatar upload preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorProfile(null);
    setSuccessProfile(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorProfile("Por favor, selecione apenas arquivos de imagem.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorProfile("A imagem é muito grande. O tamanho máximo permitido é 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreviewUrl(base64String);
      setAvatarBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingProfile(true);
    setErrorProfile(null);
    setSuccessProfile(null);

    try {
      if (name.trim().length < 3) {
        throw new Error("O nome deve ter no mínimo 3 caracteres.");
      }

      const updated = await updateProfile({
        name: name.trim(),
        email: email.trim(),
        avatarUrl: avatarBase64 || user?.avatarUrl,
      });

      updateUser(updated);
      setSuccessProfile("Perfil atualizado com sucesso!");
      setAvatarBase64(null); // Clear raw base64 after successful update
    } catch (err) {
      setErrorProfile(getApiErrorMessage(err, "Não foi possível atualizar o perfil."));
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingPassword(true);
    setErrorPassword(null);
    setSuccessPassword(null);

    try {
      if (newPassword.length < 6) {
        throw new Error("A nova senha deve ter no mínimo 6 caracteres.");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("A nova senha e a confirmação não coincidem.");
      }

      await updatePassword({
        currentPassword,
        newPassword,
      });

      setSuccessPassword("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setErrorPassword(getApiErrorMessage(err, "Não foi possível alterar a senha."));
    } finally {
      setIsLoadingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
          <User className="h-8 w-8 text-emerald-400" />
          Meu Perfil
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Gerencie suas informações pessoais, foto de perfil e segurança da conta.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Side: Avatar Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={name}
                className="h-32 w-32 rounded-full object-cover border-2 border-emerald-500/30"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 text-emerald-400 font-bold text-4xl flex items-center justify-center">
                {name ? name.substring(0, 2).toUpperCase() : "??"}
              </div>
            )}
            <label className="absolute bottom-0 right-0 h-10 w-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition duration-200">
              <Camera className="h-5 w-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{name || "Usuário"}</h2>
            <p className="text-xs text-slate-400">{email || "e-mail"}</p>
          </div>
          <p className="text-[10px] text-slate-500 max-w-xs">
            Formatos aceitos: JPG, PNG, WEBP ou GIF. Tamanho máximo: 5MB. A alteração da foto se tornará definitiva após salvar o formulário ao lado.
          </p>
        </div>

        {/* Right Side: Profile Info Form & Password Change */}
        <div className="md:col-span-2 space-y-6">
          {/* Profile Info Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-4 w-4" />
              Dados do Perfil
            </h3>

            {errorProfile && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
                {errorProfile}
              </div>
            )}

            {successProfile && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400">
                {successProfile}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoadingProfile}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isLoadingProfile ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change Form */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 shadow-lg space-y-4">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-4 w-4" />
              Alterar Senha
            </h3>

            {errorPassword && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
                {errorPassword}
              </div>
            )}

            {successPassword && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400">
                {successPassword}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none transition"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme a nova senha"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isLoadingPassword}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {isLoadingPassword ? "Alterando..." : "Alterar Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
