import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export interface ProjectRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  dress_code: string | null;
  positions_needed: number | null;
  image_url?: string | null;
}

export function ProjectCard({ project, action }: { project: ProjectRow; action?: React.ReactNode }) {
  const { lang, t } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  return (
    <article className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/60 transition-all group hover:shadow-[0_8px_30px_-15px] hover:shadow-primary/40">
      <div className="md:flex">
        {project.image_url && (
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="md:w-56 shrink-0 block"
          >
            <img
              src={project.image_url}
              alt={project.title}
              loading="lazy"
              className="h-44 md:h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        )}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {project.category && (
                <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded text-[10px] font-bold uppercase tracking-wider">
                  {project.category}
                </span>
              )}
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="block text-lg font-bold mt-2 group-hover:text-primary transition-colors"
              >
                {project.title}
              </Link>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.starts_at), "d MMM", { locale })}
                  {project.ends_at && ` – ${format(new Date(project.ends_at), "d MMM", { locale })}`}
                </span>
                {project.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {project.location}
                  </span>
                )}
              </div>
              {project.description && (
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{project.description}</p>
              )}
            </div>
            {action}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary">
              <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                {t("read_more")} <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
