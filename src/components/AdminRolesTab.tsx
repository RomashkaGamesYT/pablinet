import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Shield, X, Users } from "lucide-react";
import { useAllUserRoles, useAllProfiles, SUB_ROLE_LABELS, AppRole } from "@/hooks/useAdmin";

const ROLE_ORDER: AppRole[] = [
  "admin",
  "moderator",
  "support",
  "verifier",
  "events_manager",
  "pepe_manager",
  "badge_manager",
  "user_manager",
];

export default function AdminRolesTab() {
  const qc = useQueryClient();
  const { data: profiles } = useAllProfiles();
  const { data: allRoles } = useAllUserRoles();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AppRole>("support");
  const [q, setQ] = useState("");

  const byUser = new Map<string, { role: AppRole; id: string }[]>();
  (allRoles || []).forEach((r: any) => {
    const arr = byUser.get(r.user_id) || [];
    arr.push({ role: r.role, id: r.id });
    byUser.set(r.user_id, arr);
  });

  const assignedUsers = (profiles || []).filter((p: any) => byUser.has(p.user_id));
  const searchable = (profiles || []).filter((p: any) => {
    const s = q.toLowerCase();
    return !s || (p.username || "").toLowerCase().includes(s) || (p.display_name || "").toLowerCase().includes(s);
  });

  const assign = async () => {
    if (!userId) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role } as any);
    if (error) return toast.error(error.message.includes("duplicate") ? "Роль уже назначена" : error.message);
    setUserId("");
    qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    qc.invalidateQueries({ queryKey: ["admin-user-ids"] });
    toast.success("Роль назначена");
  };

  const revoke = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["all-user-roles"] });
    qc.invalidateQueries({ queryKey: ["admin-user-ids"] });
    toast.success("Роль снята");
  };

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl p-5 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-accent" />
          <h3 className="text-sm font-medium text-foreground">Назначить роль</h3>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Найти пользователя..."
          className="w-full bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-accent/50"
        />
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="w-full bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-accent/50 cursor-pointer"
        >
          <option value="">— выберите пользователя —</option>
          {searchable.slice(0, 100).map((p: any) => (
            <option key={p.user_id} value={p.user_id}>
              {p.display_name} (@{p.username})
            </option>
          ))}
        </select>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as AppRole)}
          className="w-full bg-secondary border border-border rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-accent/50 cursor-pointer"
        >
          {ROLE_ORDER.map((r) => (
            <option key={r} value={r}>{SUB_ROLE_LABELS[r]}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          «Полный админ» получает доступ ко всем разделам. Остальные роли — только к своему разделу.
        </p>
        <button
          onClick={assign}
          disabled={!userId}
          className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-medium hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          Назначить
        </button>
      </div>

      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-tight px-1">Текущие назначения</h3>
      {assignedUsers.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">Нет назначений</p>
      )}
      {assignedUsers.map((p: any) => {
        const roles = byUser.get(p.user_id) || [];
        return (
          <div key={p.user_id} className="bg-card rounded-2xl p-4 border border-border space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                {p.logo_url ? <img src={p.logo_url} alt="" className="w-full h-full object-cover" /> : <Users size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{p.display_name}</p>
                  {roles.some((r) => r.role === "admin") && <Crown size={14} className="text-amber-400 fill-amber-400/70" />}
                </div>
                <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {roles.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-2.5 py-1 rounded-full ring-1 ring-accent/20"
                >
                  {SUB_ROLE_LABELS[r.role]}
                  <button onClick={() => revoke(r.id)} className="hover:text-destructive cursor-pointer">
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
