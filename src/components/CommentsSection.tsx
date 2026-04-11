import { useState } from "react";
import { useComments, useCreateComment, useDeleteComment } from "@/hooks/useComments";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Trash2, Send, User } from "lucide-react";

export default function CommentsSection({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { data: comments, isLoading } = useComments(postId);
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [text, setText] = useState("");

  const handleSubmit = async () => {
    if (!text.trim()) return;
    await createComment.mutateAsync({ postId, content: text.trim() });
    setText("");
  };

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <div className="flex gap-2 items-end">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать комментарий..."
          className="flex-1 bg-secondary border border-border rounded-2xl px-4 py-2 text-sm text-foreground outline-none focus:border-accent/50 placeholder-muted-foreground transition-colors"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || createComment.isPending}
          className="bg-primary text-primary-foreground p-2 rounded-full hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground">Загрузка...</p>
      ) : comments?.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-2">Нет комментариев</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {comments?.map((c: any) => (
            <div key={c.id} className="flex gap-2 group">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center border border-border shrink-0 overflow-hidden">
                {c.profile?.logo_url ? (
                  <img src={c.profile.logo_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <User size={14} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{c.profile?.display_name || "?"}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ru })}
                  </span>
                  {c.user_id === user?.id && (
                    <button
                      onClick={() => deleteComment.mutate({ commentId: c.id, postId })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all cursor-pointer ml-auto"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
