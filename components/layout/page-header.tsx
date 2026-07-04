import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/user-avatar";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  className?: string;
  avatar?: {
    name: string;
    url?: string | null;
  };
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  className,
  avatar,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Ruta" className="mb-3 flex flex-wrap items-center gap-1 text-sm text-care-muted">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.label} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-care-muted-light" />}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-care-accent-dark">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-care-foreground">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start gap-4">
        {avatar && (
          <UserAvatar name={avatar.name} avatarUrl={avatar.url} size="lg" className="mt-0.5" />
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-care-foreground lg:text-3xl">{title}</h1>
          {description && <p className="mt-2 max-w-2xl text-care-muted">{description}</p>}
        </div>
      </div>
    </header>
  );
}
