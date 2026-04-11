import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/hooks/useSearch";
import { Search, User } from "lucide-react";

const popularTags = ["#frontend", "#дизайн", "#uiux", "#хакатон2024"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useSearch(query);

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <h2 className="text-xl font-semibold tracking-tight text-foreground">Поиск</h2>

      <div className="relative">
        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" strokeWidth={1.5} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать людей, статьи и события..."
          className="w-full bg-card border border-border rounded-2xl pl-12 pr-4 py-3.5 text-sm text-foreground outline-none focus:border-accent/50 transition-colors placeholder-muted-foreground"
        />
      </div>

      {query.trim() ? (
        <div className="space-y-6">
          {isLoading && <p className="text-muted-foreground text-sm">Поиск...</p>}

          {data?.users && data.users.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Пользователи</h3>
              <div className="flex flex-col gap-2">
                {data.users.map((u: any) => (
                  <div key={u.id} onClick={() => navigate(`/user/${u.user_id}`)} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                      {u.logo_url ? (
                        <img src={u.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <User size={20} className="text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">{u.display_name}</div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.posts && data.posts.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Статьи</h3>
              <div className="flex flex-col gap-2">
                {data.posts.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-card border border-border hover:bg-secondary/50 transition-colors cursor-pointer">
                    <div className="text-xs text-muted-foreground mb-1">@{p.profiles?.username}</div>
                    <p className="text-sm text-foreground/80">{p.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data && data.users?.length === 0 && data.posts?.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-sm text-center py-8">Ничего не найдено</p>
          )}
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Популярное сейчас</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <span
                key={tag}
                onClick={() => setQuery(tag.slice(1))}
                className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs text-foreground/70 cursor-pointer hover:bg-secondary transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
