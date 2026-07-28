import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ExternalLink, Globe2, Mail, MapPin, Phone, Trophy } from "lucide-react";
import { IsArenaLogo } from "@/components/is-arena-logo";
import { Button } from "@/components/ui/button";
import { getPublicOrganizationPortal } from "@/features/organization-public-page/api/organization-public-page";

export const Route = createFileRoute("/o/$slug")({
  loader: ({ params }) => getPublicOrganizationPortal(params.slug),
  head: ({ loaderData, params }) => {
    const name =
      loaderData?.organization.name ?? decodeURIComponent(params.slug).replaceAll("-", " ");
    const description =
      loaderData?.organization.description ?? "Organização esportiva no IS Arena.";
    return {
      meta: [
        { title: `${name} · IS Arena` },
        { name: "description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:title", content: `${name} · IS Arena` },
        { property: "og:description", content: description },
      ],
    };
  },
  component: PublicOrganizationPage,
});

function PublicOrganizationPage() {
  const portal = Route.useLoaderData();

  if (!portal) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#050706] px-4 text-center text-white">
        <div>
          <Globe2 className="mx-auto h-10 w-10 text-white/30" />
          <h1 className="mt-4 font-display text-2xl font-extrabold">Organização indisponível</h1>
          <p className="mt-2 text-sm text-white/50">
            Esta página não existe ou ainda não foi publicada.
          </p>
          <Button className="mt-5" variant="outline" asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  const { organization, championships } = portal;
  const location = [organization.city, organization.state].filter(Boolean).join(" · ");

  return (
    <div className="min-h-screen bg-[#050706] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt=""
                className="h-9 w-9 rounded-lg object-contain"
              />
            ) : (
              <IsArenaLogo size={30} showWordmark={false} />
            )}
            <strong className="font-display text-sm">{organization.name}</strong>
          </div>
          <Button size="sm" variant="outline" asChild>
            <Link to="/auth">Área do organizador</Link>
          </Button>
        </div>
      </header>

      <main>
        <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(190,245,45,.12),transparent_38%)]">
          <div className="mx-auto max-w-6xl px-5 py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#bef52d]/30 px-3 py-1 text-[10px] uppercase tracking-[.18em] text-[#bef52d]">
              <Globe2 className="h-3 w-3" /> Organização oficial
            </span>
            <h1 className="mt-5 max-w-4xl font-display text-5xl font-extrabold uppercase leading-none sm:text-7xl">
              {organization.headline || organization.name}
            </h1>
            <p className="mt-6 max-w-3xl text-sm leading-7 text-white/65">
              {organization.description}
            </p>
            {location && (
              <p className="mt-5 flex items-center gap-2 text-xs text-white/50">
                <MapPin className="h-4 w-4" /> {location}
              </p>
            )}
            <OrganizationLinks organization={organization} />
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
          <div className="mb-6 flex items-center gap-2 text-[#bef52d]">
            <Trophy className="h-5 w-5" />
            <h2 className="font-display text-xl font-extrabold uppercase text-white">
              Campeonatos publicados
            </h2>
          </div>
          {championships.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {championships.map((championship) => (
                <Link
                  key={championship.id}
                  to="/c/$slug"
                  params={{ slug: championship.slug }}
                  className="group overflow-hidden rounded-xl border border-white/10 bg-white/[.025]"
                >
                  <div className="relative aspect-[16/7] bg-white/5">
                    {championship.cover_url ? (
                      <img
                        src={championship.cover_url}
                        alt=""
                        className="h-full w-full object-cover opacity-70 transition group-hover:opacity-90"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <Trophy className="h-10 w-10 text-white/15" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-wider text-[#bef52d]">
                      {championship.season || "Temporada atual"}
                    </p>
                    <h3 className="mt-2 font-display text-xl font-bold">{championship.name}</h3>
                    {championship.description && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/50">
                        {championship.description}
                      </p>
                    )}
                    <p className="mt-4 flex items-center gap-2 text-[11px] text-white/45">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {championship.starts_at
                        ? new Date(championship.starts_at).toLocaleDateString("pt-BR")
                        : "Data a definir"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-white/10 p-8 text-center text-sm text-white/40">
              Nenhum campeonato publicado no momento.
            </p>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        {organization.name} · publicado com IS Arena
      </footer>
    </div>
  );
}

function OrganizationLinks({
  organization,
}: {
  organization: NonNullable<ReturnType<typeof Route.useLoaderData>>["organization"];
}) {
  const links = [
    organization.website_url && {
      href: organization.website_url,
      label: "Website",
      icon: Globe2,
    },
    organization.contact_email && {
      href: `mailto:${organization.contact_email}`,
      label: organization.contact_email,
      icon: Mail,
    },
    organization.contact_phone && {
      href: `tel:${organization.contact_phone.replace(/[^\d+]/g, "")}`,
      label: organization.contact_phone,
      icon: Phone,
    },
    ...Object.entries(organization.social_links).map(([network, href]) => ({
      href,
      label: network.charAt(0).toUpperCase() + network.slice(1),
      icon: ExternalLink,
    })),
  ].filter((link): link is { href: string; label: string; icon: typeof Globe2 } => Boolean(link));

  if (!links.length) return null;

  return (
    <div className="mt-8 flex flex-wrap gap-2">
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={`${label}-${href}`}
          href={href}
          target={href.startsWith("https://") ? "_blank" : undefined}
          rel={href.startsWith("https://") ? "noreferrer" : undefined}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70 transition hover:border-[#bef52d]/50 hover:text-white"
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </a>
      ))}
    </div>
  );
}
