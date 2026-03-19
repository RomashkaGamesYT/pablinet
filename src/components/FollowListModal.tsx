import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { X, Users } from "lucide-react";

interface FollowListModalProps {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}

export default function FollowListModal({ userId, type, onClose }: FollowListModalProps) {
  const navigate = useNavigate();

  const { data: users, isLoading } = useQuery({
    queryKey: ["follow-list", userId, type],
    queryFn: async () => {
      if (type === "followers") {
        const { data, error } = await supabase
          .from("follows")
          .select("follower_id")
          .eq("following_id", userId);
        if (error) throw error;
        const ids = data.map((f) => f.follower_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_emoji, verified")
          .in("user_id", ids);
        return profiles || [];
      } else {
        const { data, error } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", userId);
        if (error) throw error;
        const ids = data.map((f) => f.following_id);
        if (ids.length === 0) return [];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username, avatar_emoji, verified")
          .in("user_id", ids);
        return profiles || [];
      }
    },
  });

  const handleNavigate = (uid: string) => {
    onClose();
    navigate(`/user/${uid}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-card rounded-t-3xl sm:rounded-2xl ring-1 ring-border w-full sm:max-w-md sm:mx-4 max-h-[80vh] flex flex-col animate-fade-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar on mobile */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-muted-foreground" />
            <h3 className="text-base font-semibold text-primary">
              {type === "followers" ? "Подписчики" : "Подписки"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-border" />

        {/* List */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-muted-foreground text-sm">Загрузка...</span>
            </div>
          ) : !users || users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <Users size={32} className="text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">
                {type === "followers" ? "Пока нет подписчиков" : "Пока нет подписок"}
              </p>
            </div>
          ) : (
            users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleNavigate(u.user_id)}
                className="flex items-center gap-3 w-full p-3 rounded-2xl hover:bg-muted/40 transition-all cursor-pointer text-left group"
              >
                <div className="w-11 h-11 rounded-full bg-gradient-to-b from-muted to-card flex items-center justify-center ring-1 ring-input text-lg shrink-0 group-hover:ring-primary/20 transition-all">
                  {u.avatar_emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary truncate group-hover:underline">{u.display_name}</span>
                    {u.verified && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" className="shrink-0 drop-shadow-[0_2px_6px_rgba(59,130,246,0.5)] text-[hsl(217,91%,60%)]">
                        <path fill="currentColor" fillRule="evenodd" d="M9.592 3.2a6 6 0 0 1-.495.399c-.298.2-.633.338-.985.408c-.153.03-.313.043-.632.068c-.801.064-1.202.096-1.536.214a2.71 2.71 0 0 0-1.655 1.655c-.118.334-.15.735-.214 1.536a6 6 0 0 1-.068.632c-.07.352-.208.687-.408.985c-.087.13-.191.252-.399.495c-.521.612-.782.918-.935 1.238c-.353.74-.353 1.6 0 2.34c.153.32.414.626.935 1.238c.208.243.312.365.399.495c.2.298.338.633.408.985c.03.153.043.313.068.632c.064.801.096 1.202.214 1.536a2.71 2.71 0 0 0 1.655 1.655c.334.118.735.15 1.536.214c.319.025.479.038.632.068c.352.07.687.209.985.408c.13.087.252.191.495.399c.612.521.918.782 1.238.935c.74.353 1.6.353 2.34 0c.32-.153.626-.414 1.238-.935c.243-.208.365-.312.495-.399c.298-.2.633-.338.985-.408c.153-.03.313-.043.632-.068c.801-.064 1.202-.096 1.536-.214a2.71 2.71 0 0 0 1.655-1.655c.118-.334.15-.735.214-1.536c.025-.319.038-.479.068-.632c.07-.352.209-.687.408-.985c.087-.13.191-.252.399-.495c.521-.612.782-.918.935-1.238c.353-.74.353-1.6 0-2.34c-.153-.32-.414-.626-.935-1.238a6 6 0 0 1-.399-.495a2.7 2.7 0 0 1-.408-.985a6 6 0 0 1-.068-.632c-.064-.801-.096-1.202-.214-1.536a2.71 2.71 0 0 0-1.655-1.655c-.334-.118-.735-.15-1.536-.214a6 6 0 0 1-.632-.068a2.7 2.7 0 0 1-.985-.408a6 6 0 0 1-.495-.399c-.612-.521-.918-.782-1.238-.935a2.71 2.71 0 0 0-2.34 0c-.32.153-.626.414-1.238.935m6.781 6.663a.814.814 0 0 0-1.15-1.15l-4.85 4.85l-1.596-1.595a.814.814 0 0 0-1.15 1.15l2.17 2.17a.814.814 0 0 0 1.15 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
