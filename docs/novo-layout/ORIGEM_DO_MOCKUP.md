repo: Iltonns/competition-conductor
branch: main

## Last sync
date: 2026-08-04T01:56:13Z

### Updated in this project
- Read current app structure (organizer-shell + championship-shell dual sidebar nav, theme.css, dashboard/teams/matches/settings/súmula routes) to inform a layout redesign.
- Built `IS Arena - Novo Layout.dc.html`: static mockups for Dashboard, Equipes & Atletas, Partidas & Classificação, Súmula digital (mobile), Configurações — unified single top-nav replacing the dual sidebar/bottom-nav pattern, same teal brand identity, larger/cleaner typography.
- Not synced back to GitHub (this project only produces design mockups, not code changes).

## Screen map
| Screen (mockup) | Source files referenced |
|---|---|
| Dashboard | src/routes/_authenticated/_organizer/dashboard.tsx, src/components/arena/arena-ui |
| Equipes & Atletas | src/routes/_authenticated/_organizer/teams.index.tsx, src/features/global-directory |
| Partidas & Classificação | src/routes/_authenticated/championships_.$id.standings.tsx, src/features/matches |
| Súmula digital | src/routes/_authenticated/championships_.$id.matches.$matchId.report.tsx, src/features/sports-operations |
| Configurações | src/routes/_authenticated/_organizer/settings*.tsx, src/features/organization-settings |
| Nav/shell | src/components/layouts/organizer-shell.tsx, organizer-sidebar.tsx, mobile-bottom-nav.tsx |
| Theme tokens | src/styles/theme.css, src/styles.css |
