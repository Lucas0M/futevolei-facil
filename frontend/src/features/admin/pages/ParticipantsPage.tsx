import { useEffect, useState } from "react";
import {
  getPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
  type Player,
} from "../../../api/players.api";
import { getApiErrorMessage } from "../../../api/httpClient";
import { Users, Plus, Pencil, Trash, Search, X } from "lucide-react";

export function ParticipantsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formGender, setFormGender] = useState<"MALE" | "FEMALE">("MALE");
  const [formPhotoUrl, setFormPhotoUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao carregar participantes."));
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    setIsSaving(true);
    setError(null);
    try {
      if (isEditing && editingId) {
        await updatePlayer(
          editingId,
          formName.trim(),
          formGender,
          formPhotoUrl.trim() || null,
        );
      } else {
        await createPlayer(
          formName.trim(),
          formGender,
          formPhotoUrl.trim() || null,
        );
      }
      setFormName("");
      setFormGender("MALE");
      setFormPhotoUrl("");
      setIsEditing(false);
      setEditingId(null);
      await loadPlayers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao salvar participante."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (p: Player) => {
    setIsEditing(true);
    setEditingId(p.id);
    setFormName(p.name);
    setFormGender(p.gender);
    setFormPhotoUrl(p.photoUrl || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("A imagem é muito grande. Escolha uma imagem de até 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este participante?")) return;
    setError(null);
    try {
      await deletePlayer(id);
      await loadPlayers();
    } catch (err) {
      setError(getApiErrorMessage(err, "Erro ao excluir participante."));
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white flex items-center gap-2">
            <Users className="h-8 w-8 text-emerald-400" />
            Cadastro de Participantes
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Cadastre e gerencie os atletas oficiais da ARES Futevôlei para
            utilizá-los rapidamente nas chaves e rankings.
          </p>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
          {isEditing ? "Editar Participante" : "Cadastrar Novo Participante"}
        </h3>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 sm:grid-cols-4 items-end"
        >
          <div className="space-y-1 sm:col-span-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Nome Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Lucas Silva"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Sexo
            </label>
            <select
              value={formGender}
              onChange={(e) =>
                setFormGender(e.target.value as "MALE" | "FEMALE")
              }
              className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none"
            >
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Feminino</option>
            </select>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Foto do Atleta (Link ou Upload)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cole o Link (ex: https://...)"
                value={
                  formPhotoUrl.startsWith("data:")
                    ? "Imagem enviada do PC"
                    : formPhotoUrl
                }
                onChange={(e) => setFormPhotoUrl(e.target.value)}
                disabled={formPhotoUrl.startsWith("data:")}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-emerald-400 outline-none disabled:opacity-50"
              />
              <div className="relative flex items-center justify-center shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <button
                  type="button"
                  className="rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition w-full"
                >
                  {formPhotoUrl.startsWith("data:")
                    ? "Alterar Foto"
                    : "Enviar do PC"}
                </button>
              </div>
              {formPhotoUrl && (
                <button
                  type="button"
                  onClick={() => setFormPhotoUrl("")}
                  className="rounded-lg bg-rose-500/10 hover:bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-400 transition"
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingId(null);
                  setFormName("");
                  setFormGender("MALE");
                  setFormPhotoUrl("");
                }}
                className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-700 h-9"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-emerald-500 px-5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50 h-9 flex items-center gap-1.5"
            >
              {isSaving ? (
                "Salvando..."
              ) : (
                <>
                  <Plus className="h-4.5 w-4.5" />
                  {isEditing ? "Atualizar" : "Cadastrar"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Atletas Cadastrados ({filteredPlayers.length})
          </h3>
          <div className="relative w-64 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 pl-9 pr-3 py-1.5 text-xs text-white focus:border-emerald-400 outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400 animate-pulse font-medium">
              Carregando participantes da Arena...
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/45 overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">Nome</th>
                  <th className="px-6 py-3.5">Sexo</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {filteredPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/10 transition">
                    <td className="px-6 py-4 font-semibold text-white flex items-center gap-3">
                      {p.photoUrl ? (
                        <img
                          src={p.photoUrl}
                          alt={p.name}
                          className="h-8 w-8 rounded-full object-cover border border-white/10"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center">
                          {p.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span>{p.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold ${
                          p.gender === "MALE"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-pink-500/10 text-pink-400"
                        }`}
                      >
                        {p.gender === "MALE" ? "Masculino" : "Feminino"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(p)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
                          title="Excluir"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredPlayers.length === 0 && (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-10 text-center text-slate-500 italic"
                    >
                      Nenhum atleta cadastrado com esse nome.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
