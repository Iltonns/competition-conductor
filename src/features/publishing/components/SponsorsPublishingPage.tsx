import { useState } from "react";
import { Handshake, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import type { Championship } from "@/features/championships/types/championship.types";
import type { SponsorItem } from "../api/publishing";
import { useSponsorPublishing } from "../hooks/usePublishing";

const empty = {
  id: null as string | null,
  name: "",
  logoUrl: "",
  logoMediaId: "",
  website: "",
  tier: "",
  status: "active" as SponsorItem["status"],
  startsAt: "",
  endsAt: "",
  order: "0",
};
export function SponsorsPublishingPage({ championship }: { championship: Championship }) {
  const sponsors = useSponsorPublishing(championship.organization_id, championship.id);
  const [form, setForm] = useState(empty);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  if (sponsors.isLoading || sponsors.media.isLoading) return <Skeleton className="h-80" />;
  const logoMedia = (sponsors.media.data ?? []).filter((item) =>
    item.mime_type?.startsWith("image/"),
  );
  const logoUrls = new Map(
    logoMedia.filter((item) => item.signed_url).map((item) => [item.id, item.signed_url as string]),
  );
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">Publicação</p>
        <h2 className="font-display text-xl font-extrabold">Patrocinadores</h2>
      </header>
      <section className="grid gap-4 lg:grid-cols-[.75fr_1.25fr]">
        <form
          className="card-arena space-y-3 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await sponsors.save.mutateAsync({
                id: form.id,
                payload: {
                  name: form.name,
                  logo_url: form.logoUrl,
                  logo_media_id: form.logoMediaId || null,
                  website: form.website,
                  tier: form.tier,
                  status: form.status,
                  starts_at: form.startsAt || null,
                  ends_at: form.endsAt || null,
                  display_order: Number(form.order),
                },
              });
              setForm(empty);
              setLogoFile(null);
              toast.success("Patrocinador salvo.");
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Dados inválidos.");
            }
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-bold">
              {form.id ? "Editar parceiro" : "Novo parceiro"}
            </h3>
            <Handshake className="h-4 w-4 text-neon" />
          </div>
          <div>
            <Label>Nome</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <Label>Logo da biblioteca</Label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
              value={form.logoMediaId}
              onChange={(e) => setForm({ ...form, logoMediaId: e.target.value })}
            >
              <option value="">Sem logo da biblioteca</option>
              {logoMedia.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[9px] text-muted-foreground">
              A mídia selecionada deve pertencer a este campeonato.
            </p>
          </div>
          <div>
            <Label>Enviar novo logo</Label>
            <div className="flex gap-2">
              <label className="inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input px-3 text-xs">
                <Upload className="h-4 w-4" />
                {logoFile?.name ?? "Selecionar imagem"}
                <input
                  className="sr-only"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                />
              </label>
              <Button
                type="button"
                variant="outline"
                disabled={!logoFile || sponsors.uploadLogo.isPending}
                onClick={async () => {
                  if (!logoFile) return;
                  try {
                    const uploaded = await sponsors.uploadLogo.mutateAsync({
                      file: logoFile,
                      title: `Logo - ${form.name || logoFile.name}`,
                      altText: `Logo de ${form.name || "patrocinador"}`,
                      isPublic: true,
                    });
                    setForm({ ...form, logoMediaId: uploaded.id });
                    setLogoFile(null);
                    toast.success("Logo enviado e selecionado.");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Falha no envio.");
                  }
                }}
              >
                Enviar
              </Button>
            </div>
          </div>
          <div>
            <Label>URL externa do logo (alternativa)</Label>
            <Input
              type="url"
              value={form.logoUrl}
              onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
            />
          </div>
          <div>
            <Label>Site HTTPS</Label>
            <Input
              type="url"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Cota</Label>
              <Input
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: e.target.value })}
              />
            </div>
            <div>
              <Label>Ordem</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Início</Label>
              <Input
                type="datetime-local"
                value={form.startsAt}
                onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
              />
            </div>
            <div>
              <Label>Fim</Label>
              <Input
                type="datetime-local"
                value={form.endsAt}
                onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
              />
            </div>
          </div>
          <select
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-xs"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as SponsorItem["status"] })}
          >
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
            <option value="archived">Arquivado</option>
          </select>
          <Button type="submit" disabled={sponsors.save.isPending}>
            <Save className="h-4 w-4" /> Salvar
          </Button>
        </form>
        <div className="grid content-start gap-3 sm:grid-cols-2">
          {(sponsors.data ?? []).map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() =>
                setForm({
                  id: item.id,
                  name: item.name,
                  logoUrl: item.logo_url ?? "",
                  logoMediaId: item.logo_media_id ?? "",
                  website: item.website ?? "",
                  tier: item.tier ?? "",
                  status: item.status,
                  startsAt: item.starts_at?.slice(0, 16) ?? "",
                  endsAt: item.ends_at?.slice(0, 16) ?? "",
                  order: String(item.display_order),
                })
              }
              className="card-arena flex items-center gap-3 p-4 text-left"
            >
              <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-white">
                <>
                  {(item.logo_media_id && logoUrls.get(item.logo_media_id)) || item.logo_url ? (
                    <img
                      src={
                        (item.logo_media_id ? logoUrls.get(item.logo_media_id) : undefined) ??
                        item.logo_url ??
                        undefined
                      }
                      alt=""
                      className="max-h-10 max-w-10"
                    />
                  ) : (
                    <Handshake className="h-5 w-5 text-black" />
                  )}
                </>
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-sm">{item.name}</strong>
                <span className="text-[9px] text-muted-foreground">{item.tier || "Sem cota"}</span>
              </span>
              <Badge variant="outline">{item.status}</Badge>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
