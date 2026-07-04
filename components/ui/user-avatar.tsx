import Image from "next/image";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

const imageSizes = { sm: 32, md: 44, lg: 64, xl: 96 };

export function UserAvatar({ name, avatarUrl, size = "md", className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-full bg-care-secondary/40",
          sizes[size],
          className
        )}
      >
        <Image
          src={avatarUrl}
          alt={`Foto de ${name}`}
          width={imageSizes[size]}
          height={imageSizes[size]}
          className="h-full w-full object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-care-accent/30 font-bold text-care-accent-darker",
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}
