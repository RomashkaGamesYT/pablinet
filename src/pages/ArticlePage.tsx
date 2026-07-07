import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import PostCard from "@/components/PostCard";
import { useAllUserBadges } from "@/hooks/useAdmin";

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: allBadges } = useAllUserBadges();

  const { data: post, isLoading } = useQuery({
    queryKey: ["article", id],
    queryFn: async () => {
      if (!id) return null;
      const { data: post } = await supabase
        .from("posts")
        .select("*, likes(id, user_id)")
        .eq("id", id)
        .maybeSingle();
      if (!post) return null;
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, username, avatar_emoji, verified, logo_url, has_pepe_plus")
        .eq("user_id", post.user_id)
        .maybeSingle();
      return { ...post, profile };
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center text-muted-foreground text-sm py-8">Загрузка...</div>;
  }
  if (!post) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground text-sm">Статья не найдена</p>
        <button onClick={() => navigate("/")} className="mt-4 text-sm text-accent hover:underline cursor-pointer">Вернуться</button>
      </div>
    );
  }

  const title = `${post.profile?.display_name || "Автор"}: ${(post.content || "").slice(0, 60) || "Статья"} — pablinet`;
  const description = (post.content || "").slice(0, 155) || "Статья на pablinet";
  const url = `https://pablinet.lovable.app/article/${post.id}`;
  const badges = (allBadges || []).filter((b: any) => b.user_id === post.user_id);

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        {post.image_url && <meta property="og:image" content={post.image_url} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {post.image_url && <meta name="twitter:image" content={post.image_url} />}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: title,
            description,
            image: post.image_url ? [post.image_url] : undefined,
            author: { "@type": "Person", name: post.profile?.display_name || post.profile?.username || "Автор" },
            datePublished: post.created_at,
            url,
          })}
        </script>
      </Helmet>
      <div className="animate-fade-in flex flex-col gap-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ArrowLeft size={16} /> Назад
        </button>
        <PostCard post={post} badges={badges} context="feed" />
      </div>
    </>
  );
}
