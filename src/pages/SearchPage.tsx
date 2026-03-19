import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "@/hooks/useSearch";
import { Search } from "lucide-react";

const popularTags = ["#frontend", "#дизайн", "#uiux", "#хакатон2024"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useSearch(query);

  return (
    <div className="animate-fade-in">
      <div className="px-2 mb-6">
        <h2 className="text-xl font-semibold tracking-tight text-primary">Поиск</h2>
      </div>

      <div className="relative mb-8 px-2">
        <Search size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Искать людей, посты и события..."
          className="w-full bg-card/80 backdrop-blur-md ring-1 ring-input rounded-2xl pl-12 pr-4 py-3.5 text-sm text-foreground outline-none focus:ring-primary/30 transition-shadow placeholder-muted-foreground shadow-sm"
        />
      </div>

      {query.trim() ? (
        <div className="px-2 space-y-6">
          {isLoading && <p className="text-muted-foreground text-sm">Поиск...</p>}

          {data?.users && data.users.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Пользователи</h3>
              <div className="flex flex-col gap-2">
                {data.users.map((u: any) => (
                  <div key={u.id} onClick={() => navigate(`/user/${u.user_id}`)} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-net-cyan/20 to-net-emerald/20 flex items-center justify-center ring-1 ring-input">
                      <span className="text-sm">{u.avatar_emoji}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-primary">{u.display_name}</div>
                      <div className="text-xs text-muted-foreground">@{u.username}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.posts && data.posts.length > 0 && (
            <div>
              <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Посты</h3>
              <div className="flex flex-col gap-2">
                {data.posts.map((p: any) => (
                  <div key={p.id} className="p-4 rounded-2xl bg-card/50 ring-1 ring-border hover:bg-card/80 transition-colors cursor-pointer">
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
        <div className="px-2">
          <h3 className="text-xs font-medium text-muted-foreground mb-4 tracking-tight uppercase">Популярное сейчас</h3>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <span
                key={tag}
                onClick={() => setQuery(tag.slice(1))}
                className="px-3 py-1.5 rounded-lg bg-muted ring-1 ring-input text-xs text-foreground/70 cursor-pointer hover:bg-muted/80 transition-colors"
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
