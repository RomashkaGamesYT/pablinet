import { useNavigate } from "react-router-dom";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface BadgeDisplayProps {
  badges: Array<{
    badge: {
      id: string;
      name: string;
      description: string;
      icon_url: string;
    } | null;
  }>;
  size?: "sm" | "md";
}

export default function BadgeDisplay({ badges, size = "sm" }: BadgeDisplayProps) {
  const navigate = useNavigate();

  if (!badges || badges.length === 0) return null;

  const imgSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const isFlame = (name: string) => name.toLowerCase().includes("flame");

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map((ub: any, i: number) => {
        const badge = ub.badge;
        if (!badge) return null;
        return (
          <HoverCard key={i} openDelay={200} closeDelay={300}>
            <HoverCardTrigger asChild>
              <img
                src={badge.icon_url}
                alt={badge.name}
                className={`${imgSize} rounded-sm object-contain cursor-pointer hover:scale-110 transition-transform`}
              />
            </HoverCardTrigger>
            <HoverCardContent className="bg-card ring-1 ring-border text-foreground text-xs px-3 py-2 rounded-xl max-w-[220px] w-auto">
              <p className="font-medium">{badge.name}</p>
              <p className="text-muted-foreground mt-0.5">{badge.description}</p>
              {isFlame(badge.name) && (
                <button
                  onClick={() => navigate("/flame")}
                  className="mt-2 text-[10px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Подробнее →
                </button>
              )}
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
