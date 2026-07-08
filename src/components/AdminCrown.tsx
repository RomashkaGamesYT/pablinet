import { Crown } from "lucide-react";
import { useAdminUserIds } from "@/hooks/useAdmin";

interface Props {
  userId?: string | null;
  size?: number;
  className?: string;
}

export default function AdminCrown({ userId, size = 14, className = "" }: Props) {
  const { data: adminIds } = useAdminUserIds();
  if (!userId || !adminIds?.has(userId)) return null;
  return (
    <Crown
      size={size}
      className={`shrink-0 text-amber-400 fill-amber-400/70 ${className}`}
      aria-label="Администратор"
    />
  );
}
