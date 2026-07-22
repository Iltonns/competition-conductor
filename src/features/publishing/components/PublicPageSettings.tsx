import { useEffect, useState } from "react";
import { ExternalLink, Globe2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { Championship } from "@/features/championships/types/championship.types";
import { usePublicPagePublishing } from "../hooks/usePublishing";

const allSections = ["matches", "standings", "teams", "scorers", "news", "media", "sponsors"];
export function PublicPageSettings({ championship }: { championship: Championship }) {
  const page = usePublicPagePublishing(championship.id);
  const [description, setDescription] = useState(championship.description ?? "");
  const [accent, setAccent] = useState("#bef52d");
  const [email, setEmail] = useState(championship.contact_email ?? "");
  const [instagram, setInstagram] = useState(championship.instagram_url ?? "");
  const [sections, setSections] = useState<string[]>(allSections);
  useEffect(() => {
    if (!page.data) return;
    setDescription(page.data.description ?? championship.description ?? "");
    const theme = page.data.theme as Record<string, string>;
    const contact = page.data.contact as Record<string, string>;
    const social = page.data.social_links as Record<string, string>;
    setAccent(theme.accent ?? "#bef52d");
    setEmail(contact.email ?? "");
    setInstagram(social.instagram ?? "");
    setSections(page.data.visible_sections as string[]);
  }, [page.data, championship.description]);
  if (page.isLoading) return <Skeleton className="h-80" />;
  const save = async () => {
    try {
      await page.save.mutateAsync({
        description,
        theme: { accent, background: "#050706" },
        contact: { email },
        social_links: { instagram },
        visible_sections: sections,
      });
      toast.success("Configuração pública salva.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Configuração inválida.");
    }
  };
  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">Portal</p>
          <h2 className="font-display text-xl font-extrabold">Página pública</h2>
        </div>
        <Button variant="outline" asChild>
          <a href={`/c/${championship.slug}`} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" /> Preview
          </a>
        </Button>
      </header>
      <section className="grid gap-4 lg:grid-cols-[1fr_.75fr]">
        <div className="card-arena space-y-4 p-4">
          <div>
            <Label>Descrição pública</Label>
            <Textarea
              className="min-h-28"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Cor de destaque</Label>
              <Input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
            </div>
            <div>
              <Label>E-mail público</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label>Instagram</Label>
              <Input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Seções visíveis</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {allSections.map((section) => (
                <label
                  key={section}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs"
                >
                  <input
                    type="checkbox"
                    checked={sections.includes(section)}
                    onChange={() =>
                      setSections((value) =>
                        value.includes(section)
                          ? value.filter((item) => item !== section)
                          : [...value, section],
                      )
                    }
                  />
                  {section}
                </label>
              ))}
            </div>
          </div>
          <Button onClick={save} disabled={page.save.isPending}>
            <Save className="h-4 w-4" /> Salvar configuração
          </Button>
        </div>
        <aside className="card-arena p-4">
          <Globe2 className="h-5 w-5 text-neon" />
          <h3 className="mt-3 font-display text-base font-bold">Checklist de publicação</h3>
          <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
            <li>• Nome e slug do campeonato</li>
            <li>• Descrição pública preenchida</li>
            <li>• Configuração salva</li>
            <li>• Pelo menos duas equipes vinculadas</li>
          </ul>
          <Button
            className="mt-5 w-full"
            variant={championship.is_public ? "destructive" : "default"}
            disabled={page.publish.isPending}
            onClick={async () => {
              try {
                await page.publish.mutateAsync(!championship.is_public);
                toast.success(
                  championship.is_public ? "Portal despublicado." : "Portal publicado.",
                );
                window.location.reload();
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Checklist incompleto.");
              }
            }}
          >
            {championship.is_public ? "Despublicar portal" : "Publicar portal"}
          </Button>
        </aside>
      </section>
    </div>
  );
}
