import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useFollowStats, useUpdateProfile } from "@/hooks/useProfile";
import { usePosts } from "@/hooks/usePosts";
import { useUserBadges } from "@/hooks/useAdmin";
import { useProfileAssetUpload } from "@/hooks/useProfileAssets";
import { Calendar, User, Camera, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import FollowListModal from "@/components/FollowListModal";
import BadgeDisplay from "@/components/BadgeDisplay";
import VerifiedBadge from "@/components/VerifiedBadge";
import PostCard from "@/components/PostCard";
import VerificationRequestDialog from "@/components/VerificationRequestDialog";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: stats } = useFollowStats();
  const { data: allPosts } = usePosts();
  const { data: userBadges } = useUserBadges(user?.id);
  const updateProfile = useUpdateProfile();
  const { uploadAsset, removeAsset } = useProfileAssetUpload();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "likes">("posts");
  const [followListType, setFollowListType] = useState<"followers" | "following" | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [showVerification, setShowVerification] = useState(false);

  if (isLoading) {
    return <div className="text-muted-foreground text-sm text-center py-8">Загрузка...</div>;
  }

  const myPosts = allPosts?.filter((p: any) => p.user_id === user?.id) || [];
  const likedPosts = allPosts?.filter((p: any) => p.likes?.some((l: any) => l.user_id === user?.id)) || [];
  const hasPepePlus = (profile as any)?.has_pepe_plus;

  const startEdit = () => {
    setEditName(profile?.display_name || "");
    setEditBio(profile?.bio || "");
    setEditing(true);
  };

  const saveEdit = async () => {
    await updateProfile.mutateAsync({
      display_name: editName,
      bio: editBio,
    });
    setEditing(false);
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAsset(file, "banner");
      toast.success("Баннер обновлён");
    } catch {
      toast.error("Ошибка загрузки баннера");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAsset(file, "logo");
      toast.success("Аватар обновлён");
    } catch {
      toast.error("Ошибка загрузки аватара");
    }
  };

  const handleBannerRemove = async () => {
    try {
      await removeAsset("banner");
    } catch {
      toast.error("Ошибка удаления баннера");
    }
  };

  const sortedMyPosts = [...myPosts].sort((a: any, b: any) => {
    if (a.pinned_in_profile && !b.pinned_in_profile) return -1;
    if (!a.pinned_in_profile && b.pinned_in_profile) return 1;
    return 0;
  });

  const displayPosts = activeTab === "posts" ? sortedMyPosts : likedPosts;

  return (
    <div className="animate-fade-in flex flex-col gap-4">
      <div className="bg-card rounded-[24px] overflow-hidden border border-border shadow-sm dark:shadow-none transition-colors duration-300">
        {/* Banner */}
        <div className="h-28 bg-gradient-to-r from-accent/20 to-secondary w-full relative group">
          {(profile as any)?.banner_url ? (
            <img src={(profile as any).banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button onClick={() => bannerInputRef.current?.click()} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white cursor-pointer">
              <Camera size={16} />
            </button>
            {(profile as any)?.banner_url && (
              <button onClick={handleBannerRemove} className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white cursor-pointer">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
        </div>

        <div className="px-5 pb-5 relative">
          {/* Avatar */}
          <div className="absolute -top-10 left-5 w-20 h-20 rounded-full border-4 border-card bg-secondary flex items-center justify-center transition-colors duration-300 overflow-hidden group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            {(profile as any)?.logo_url ? (
              <img src={(profile as any).logo_url} alt="Avatar" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User size={32} className="text-muted-foreground" />
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-full">
              <Camera size={16} className="text-white" />
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end pt-3 gap-2">
            <button
              onClick={() => setShowVerification(true)}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-secondary hover:bg-muted transition-colors cursor-pointer group"
            >
              <svg viewBox="0 0 16 16" className="w-5 h-5 transition-transform group-active:scale-95">
                <path fill="#0080FF" d="M6.724.821a1.63 1.63 0 0 1 2.858.051l.556 1.042a1.634 1.634 0 0 0 1.672.856l1.155-.166c1.263-.181 2.238 1.108 1.742 2.303L14.253 6a1.69 1.69 0 0 0 .385 1.863l.847.815c.927.891.544 2.47-.685 2.821l-1.122.32a1.663 1.663 0 0 0-1.192 1.468l-.098 1.181c-.108 1.294-1.56 1.974-2.596 1.216l-.946-.693a1.62 1.62 0 0 0-1.872-.033l-.969.658c-1.06.721-2.49-.01-2.552-1.306l-.058-1.184a1.666 1.666 0 0 0-1.141-1.51l-1.11-.36C-.073 10.864-.402 9.272.556 8.413l.874-.783a1.69 1.69 0 0 0 .448-1.849l-.416-1.108c-.454-1.212.565-2.466 1.821-2.24l1.148.207a1.632 1.632 0 0 0 1.7-.796L6.724.82Z" />
                <path fill="#FFF" d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
              </svg>
            </button>
            <button
              onClick={startEdit}
              className="px-4 py-1.5 rounded-full border border-border text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Настройки
            </button>
          </div>

          {/* User Info */}
          {editing ? (
            <div className="mt-6 space-y-3">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Ваше имя"
                className="w-full bg-secondary border border-border rounded-2xl p-4 text-sm outline-none text-foreground placeholder-muted-foreground"
              />
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="О себе..."
                className="w-full bg-secondary border border-border rounded-2xl p-4 text-sm outline-none text-foreground resize-none h-20 placeholder-muted-foreground"
              />
              <div className="flex gap-3">
                <button onClick={saveEdit} disabled={updateProfile.isPending} className="w-full bg-primary text-primary-foreground font-medium rounded-full py-3 text-sm hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50">
                  Сохранить изменения
                </button>
                <button onClick={() => setEditing(false)} className="w-full bg-transparent text-foreground font-medium rounded-full py-3 text-sm hover:bg-secondary transition-colors cursor-pointer">
                  Закрыть
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span className={hasPepePlus ? "gradient-name" : ""}>{profile?.display_name}</span>
                {profile?.verified && <VerifiedBadge size={18} />}
                {userBadges && <BadgeDisplay badges={userBadges as any} size="md" />}
              </h1>
              <span className="text-sm text-muted-foreground">@{profile?.username}</span>

              {profile?.bio && (
                <p className="mt-3 text-sm text-muted-foreground">{profile.bio}</p>
              )}

              <div className="flex gap-4 mt-4 text-sm">
                <button onClick={() => setFollowListType("following")} className="flex gap-1.5 cursor-pointer group">
                  <span className="font-medium text-foreground">{stats?.following || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Подписки</span>
                </button>
                <button onClick={() => setFollowListType("followers")} className="flex gap-1.5 cursor-pointer group">
                  <span className="font-medium text-foreground">{stats?.followers || 0}</span>
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Подписчики</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!editing && (
          <div className="flex border-t border-border">
            <button
              onClick={() => setActiveTab("posts")}
              className={`flex-1 py-3 text-sm font-medium transition-colors cursor-pointer ${
                activeTab === "posts" ? "text-foreground border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/30"
              }`}
            >
              Статьи
            </button>
            <button
              onClick={() => setActiveTab("likes")}
              className={`flex-1 py-3 text-sm font-normal transition-colors cursor-pointer ${
                activeTab === "likes" ? "text-foreground border-b-2 border-accent" : "text-muted-foreground hover:bg-secondary/30"
              }`}
            >
              Лайки
            </button>
          </div>
        )}
      </div>

      {/* Posts */}
      {!editing && (
        <div className="flex flex-col gap-4">
          {displayPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">
                {activeTab === "posts" ? "Пока нет статей" : "Нет понравившихся статей"}
              </p>
            </div>
          ) : (
            displayPosts.map((post: any) => (
              <PostCard key={post.id} post={post} context="profile" />
            ))
          )}
        </div>
      )}

      {followListType && user && (
        <FollowListModal userId={user.id} type={followListType} onClose={() => setFollowListType(null)} />
      )}
      <VerificationRequestDialog open={showVerification} onClose={() => setShowVerification(false)} />
    </div>
  );
}
