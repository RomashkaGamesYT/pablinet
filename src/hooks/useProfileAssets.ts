import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useProfileAssetUpload() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const uploadAsset = async (file: File, type: "banner" | "logo") => {
    if (!user) throw new Error("Not authenticated");

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${type}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-assets")
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("profile-assets")
      .getPublicUrl(path);

    const column = type === "banner" ? "banner_url" : "logo_url";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [column]: urlData.publicUrl } as any)
      .eq("user_id", user.id);
    if (updateError) throw updateError;

    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(type === "banner" ? "Баннер загружен" : "Лого загружено");
    return urlData.publicUrl;
  };

  const removeAsset = async (type: "banner" | "logo") => {
    if (!user) throw new Error("Not authenticated");
    const column = type === "banner" ? "banner_url" : "logo_url";
    const { error } = await supabase
      .from("profiles")
      .update({ [column]: null } as any)
      .eq("user_id", user.id);
    if (error) throw error;
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    toast.success(type === "banner" ? "Баннер удалён" : "Лого удалено");
  };

  return { uploadAsset, removeAsset };
}
