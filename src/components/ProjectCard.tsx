import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import { MapPin, Calendar, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localized } from "@/lib/translate";
import { Button } from "@/components/ui/button";

export interface ProjectRow {
  id: string;
  title: string;
  title_en?: string | null;
  description: string | null;
  description_en?: string | null;
  category: string | null;
  location: string | null;
  location_en?: string | null;
  starts_at: string;
  ends_at: string | null;
  dress_code: string | null;
  dress_code_en?: string | null;
  positions_needed: number | null;
  image_url?: string | null;
}

export function ProjectCard({ project, action }: { project: ProjectRow; action?: React.ReactNode }) {
  const { lang, t } = useI18n();
  const locale = lang === "sv" ? sv : enUS;
  const title = localized(project, "title", lang) ?? project.title;
  const description = localized(project, "description", lang);
  const location = localized(project, "location", lang);
  return (
    <article className="glass rounded-xl overflow-hidden hover:border-white/[0.18] transition-all group">
      <div className="md:flex">
        {project.image_url && (
          <Link
            to="/projects/$projectId"
            params={{ projectId: project.id }}
            className="md:w-56 shrink-0 block"
          >
            <img
              src={project.image_url}
              alt={title}
              loading="lazy"
              className="h-44 md:h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          </Link>
        )}
        <div className="flex-1 p-5 flex flex-col">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              {project.category && (
                <span className="px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] text-foreground/45 rounded text-[10px] font-bold uppercase tracking-wider">
                  {project.category}
                </span>
              )}
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                className="block text-lg font-bold mt-2 group-hover:text-foreground transition-colors text-foreground/90"
              >
                {title}
              </Link>
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-foreground/40">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(project.starts_at), "d MMM", { locale })}
                  {project.ends_at && ` – ${format(new Date(project.ends_at), "d MMM", { locale })}`}
                </span>
                {location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {location}
                  </span>
                )}
              </div>
              {description && (
                <p className="text-sm text-foreground/40 mt-3 line-clamp-2">{description}</p>
              )}
            </div>
            {action}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06] flex justify-end">
            <Button asChild variant="ghost" size="sm" className="text-foreground/50 hover:text-foreground">
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
