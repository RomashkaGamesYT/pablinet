import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-2xl ring-1 ring-border w-full max-w-sm mx-4 max-h-[70vh] flex flex-col animate-fade-in shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-primary">
            {type === "followers" ? "Подписчики" : "Подписки"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {isLoading ? (
            <p className="text-muted-foreground text-sm text-center py-8">Загрузка...</p>
          ) : !users || users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">
              {type === "followers" ? "Нет подписчиков" : "Нет подписок"}
            </p>
          ) : (
            users.map((u) => (
              <button
                key={u.user_id}
                onClick={() => handleNavigate(u.user_id)}
                className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center ring-1 ring-input text-lg shrink-0">
                  {u.avatar_emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-primary truncate">{u.display_name}</span>
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
