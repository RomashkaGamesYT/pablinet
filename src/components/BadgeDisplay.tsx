import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!badges || badges.length === 0) return null;

  const imgSize = size === "sm" ? "w-5 h-5" : "w-6 h-6";
  const isFlame = (name: string) => name.toLowerCase().includes("flame");

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {badges.map((ub: any, i: number) => {
        const badge = ub.badge;
        if (!badge) return null;
        return (
          <Popover key={i} open={openIndex === i} onOpenChange={(open) => setOpenIndex(open ? i : null)}>
            <PopoverTrigger asChild>
              <img
                src={badge.icon_url}
                alt={badge.name}
                className={`${imgSize} rounded-sm object-contain cursor-pointer hover:scale-110 transition-transform`}
                onMouseEnter={() => setOpenIndex(i)}
                onMouseLeave={() => setOpenIndex(null)}
              />
            </PopoverTrigger>
            <PopoverContent
              className="bg-card ring-1 ring-border text-foreground text-xs px-3 py-2 rounded-xl max-w-[220px] w-auto"
              onMouseEnter={() => setOpenIndex(i)}
              onMouseLeave={() => setOpenIndex(null)}
              sideOffset={6}
            >
              <p className="font-medium">{badge.name}</p>
              <p className="text-muted-foreground mt-0.5">{badge.description}</p>
              {isFlame(badge.name) && (
                <button
                  onClick={() => { setOpenIndex(null); navigate("/flame"); }}
                  className="mt-2 text-[10px] font-medium text-primary hover:underline cursor-pointer"
                >
                  Подробнее →
                </button>
              )}
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
