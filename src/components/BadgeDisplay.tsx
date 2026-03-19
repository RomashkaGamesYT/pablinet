import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  if (!badges || badges.length === 0) return null;

  const imgSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map((ub: any, i: number) => {
        const badge = ub.badge;
        if (!badge) return null;
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <img
                src={badge.icon_url}
                alt={badge.name}
                className={`${imgSize} rounded-sm object-contain cursor-pointer hover:scale-110 transition-transform`}
              />
            </TooltipTrigger>
            <TooltipContent className="bg-card ring-1 ring-border text-foreground text-xs px-3 py-2 rounded-xl max-w-[200px]">
              <p className="font-medium">{badge.name}</p>
              <p className="text-muted-foreground mt-0.5">{badge.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}
