import { useRef, useState } from "react";
import { Upload, X, Image } from "lucide-react";
import { useProfileAssetUpload } from "@/hooks/useProfileAssets";

interface AdminProfileCustomizationProps {
  bannerUrl?: string | null;
  logoUrl?: string | null;
}

export default function AdminProfileCustomization({ bannerUrl, logoUrl }: AdminProfileCustomizationProps) {
  const { uploadAsset, removeAsset } = useProfileAssetUpload();
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);

  const handleUpload = async (file: File, type: "banner" | "logo") => {
    setUploading(type);
    try {
      await uploadAsset(file, type);
    } catch {
      // toast already shown in hook
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-card ring-1 ring-border space-y-4">
      <div className="flex items-center gap-2">
        <Image size={18} className="text-net-cyan" />
        <span className="text-sm font-medium text-primary">Кастомизация профиля</span>
        <span className="text-[10px] bg-net-cyan/20 text-net-cyan px-2 py-0.5 rounded-full font-medium">Админ</span>
      </div>

      {/* Banner */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Баннер профиля</div>
        {bannerUrl ? (
          <div className="relative group">
            <img src={bannerUrl} alt="Banner" className="w-full h-24 object-cover rounded-xl ring-1 ring-border" />
            <button
              onClick={() => removeAsset("banner")}
              className="absolute top-2 right-2 w-6 h-6 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => bannerInputRef.current?.click()}
            disabled={uploading === "banner"}
            className="w-full h-20 border-2 border-dashed border-border rounded-xl flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload size={16} />
            <span className="text-xs">{uploading === "banner" ? "Загрузка..." : "Загрузить баннер"}</span>
          </button>
        )}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "banner");
            e.target.value = "";
          }}
        />
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">Лого (вместо эмодзи)</div>
        {logoUrl ? (
          <div className="flex items-center gap-3">
            <img src={logoUrl} alt="Logo" className="w-12 h-12 object-cover rounded-full ring-1 ring-border" />
            <button
              onClick={() => removeAsset("logo")}
              className="text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
            >
              Удалить лого
            </button>
          </div>
        ) : (
          <button
            onClick={() => logoInputRef.current?.click()}
            disabled={uploading === "logo"}
            className="w-20 h-20 border-2 border-dashed border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Upload size={16} />
          </button>
        )}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file, "logo");
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
