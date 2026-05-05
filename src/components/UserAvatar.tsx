import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitials(name?: string | null, email?: string | null) {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "?";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface UserAvatarProps {
  url?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({ url, name, email, className, fallbackClassName }: UserAvatarProps) {
  const initials = getInitials(name, email);
  return (
    <Avatar className={cn("h-9 w-9", className)}>
      {url ? <AvatarImage src={url} alt={name ?? email ?? "Avatar"} /> : null}
      <AvatarFallback
        className={cn(
          "bg-primary text-primary-foreground font-bold text-sm tracking-wide",
          fallbackClassName,
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
