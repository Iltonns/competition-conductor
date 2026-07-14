export type TeamTone = "amber" | "emerald" | "violet" | "red" | "blue" | "lime";

export interface ArenaTeam {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  city: string;
  tone: TeamTone;
}

export const TEAMS: Record<string, ArenaTeam> = {
  amazonas: {
    id: "amazonas",
    name: "Amazonas EC",
    shortName: "Amazonas",
    initials: "AEC",
    city: "Rio do Sul",
    tone: "amber",
  },
  guarani: {
    id: "guarani",
    name: "Guarani FC",
    shortName: "Guarani",
    initials: "GFC",
    city: "Vila Nova",
    tone: "emerald",
  },
  realUnidos: {
    id: "real-unidos",
    name: "Real Unidos",
    shortName: "Real Unidos",
    initials: "RU",
    city: "Centro",
    tone: "violet",
  },
  vilaNova: {
    id: "vila-nova",
    name: "Vila Nova FC",
    shortName: "Vila Nova",
    initials: "VN",
    city: "Vila Verde",
    tone: "red",
  },
  unidosSul: {
    id: "unidos-sul",
    name: "Unidos do Sul",
    shortName: "Unidos do Sul",
    initials: "US",
    city: "Zona Sul",
    tone: "blue",
  },
  saoPedro: {
    id: "sao-pedro",
    name: "São Pedro FC",
    shortName: "São Pedro",
    initials: "SP",
    city: "São Pedro",
    tone: "emerald",
  },
  atleticoCity: {
    id: "atletico-city",
    name: "Atlético City",
    shortName: "Atlético City",
    initials: "AC",
    city: "Cidade Alta",
    tone: "amber",
  },
  novaGeracao: {
    id: "nova-geracao",
    name: "Nova Geração",
    shortName: "Nova Geração",
    initials: "NG",
    city: "Baixada",
    tone: "lime",
  },
};

export const UPCOMING_MATCHES = [
  {
    id: "semi-1",
    phase: "Semifinal · Jogo de ida",
    home: TEAMS.amazonas,
    away: TEAMS.guarani,
    date: "05 JUL",
    time: "15:00",
    venue: "Arena da Montanha",
    status: "Agendada",
  },
  {
    id: "semi-2",
    phase: "Semifinal · Jogo de ida",
    home: TEAMS.realUnidos,
    away: TEAMS.vilaNova,
    date: "06 JUL",
    time: "10:00",
    venue: "Arena da Montanha",
    status: "Agendada",
  },
];

export const RECENT_RESULTS = [
  {
    id: "result-1",
    home: TEAMS.realUnidos,
    away: TEAMS.vilaNova,
    homeScore: 2,
    awayScore: 1,
    date: "03 JUL",
  },
  {
    id: "result-2",
    home: TEAMS.amazonas,
    away: TEAMS.guarani,
    homeScore: 3,
    awayScore: 1,
    date: "01 JUL",
  },
];

export const STANDINGS = [
  {
    position: 1,
    team: TEAMS.amazonas,
    points: 12,
    played: 5,
    wins: 4,
    draws: 0,
    losses: 1,
    goalsFor: 11,
    goalsAgainst: 3,
    goalDifference: 8,
  },
  {
    position: 2,
    team: TEAMS.guarani,
    points: 10,
    played: 5,
    wins: 3,
    draws: 1,
    losses: 1,
    goalsFor: 9,
    goalsAgainst: 4,
    goalDifference: 5,
  },
  {
    position: 3,
    team: TEAMS.realUnidos,
    points: 8,
    played: 5,
    wins: 2,
    draws: 2,
    losses: 1,
    goalsFor: 8,
    goalsAgainst: 5,
    goalDifference: 3,
  },
  {
    position: 4,
    team: TEAMS.vilaNova,
    points: 4,
    played: 5,
    wins: 1,
    draws: 1,
    losses: 3,
    goalsFor: 4,
    goalsAgainst: 6,
    goalDifference: -2,
  },
];

export const GROUP_B_STANDINGS = [
  {
    position: 1,
    team: TEAMS.unidosSul,
    points: 13,
    played: 5,
    wins: 4,
    draws: 1,
    losses: 0,
    goalsFor: 12,
    goalsAgainst: 2,
    goalDifference: 10,
  },
  {
    position: 2,
    team: TEAMS.saoPedro,
    points: 8,
    played: 5,
    wins: 2,
    draws: 2,
    losses: 1,
    goalsFor: 7,
    goalsAgainst: 6,
    goalDifference: 1,
  },
  {
    position: 3,
    team: TEAMS.atleticoCity,
    points: 5,
    played: 5,
    wins: 1,
    draws: 2,
    losses: 2,
    goalsFor: 5,
    goalsAgainst: 7,
    goalDifference: -2,
  },
  {
    position: 4,
    team: TEAMS.novaGeracao,
    points: 2,
    played: 5,
    wins: 0,
    draws: 2,
    losses: 3,
    goalsFor: 3,
    goalsAgainst: 8,
    goalDifference: -5,
  },
];

export const SCORERS = [
  {
    position: 1,
    name: "João Pedro",
    initials: "JP",
    team: TEAMS.amazonas,
    goals: 8,
  },
  {
    position: 2,
    name: "Matheus Lima",
    initials: "ML",
    team: TEAMS.guarani,
    goals: 6,
  },
  {
    position: 3,
    name: "Carlos Eduardo",
    initials: "CE",
    team: TEAMS.realUnidos,
    goals: 5,
  },
  {
    position: 4,
    name: "Vinícius Rocha",
    initials: "VR",
    team: TEAMS.vilaNova,
    goals: 5,
  },
  {
    position: 5,
    name: "Rafael Souza",
    initials: "RS",
    team: TEAMS.unidosSul,
    goals: 4,
  },
];

export const MATCH_EVENTS = [
  { minute: "89'", type: "goal", player: "João Pedro", team: TEAMS.amazonas },
  {
    minute: "75'",
    type: "yellow",
    player: "Matheus Lima",
    team: TEAMS.guarani,
  },
  {
    minute: "63'",
    type: "substitution",
    player: "Carlos Eduardo",
    team: TEAMS.realUnidos,
  },
  { minute: "45'", type: "goal", player: "João Pedro", team: TEAMS.amazonas },
  {
    minute: "30'",
    type: "yellow",
    player: "Vinícius Rocha",
    team: TEAMS.guarani,
  },
] as const;

export const NEWS = [
  {
    id: "news-1",
    title: "Amazonas EC vence e está na final da Copa da Baixada 2026!",
    excerpt: "Equipe confirmou a classificação em uma noite de grande festa.",
    date: "03 de julho",
    featured: true,
  },
  {
    id: "news-2",
    title: "Guarani FC garante vaga nos pênaltis",
    excerpt: "Decisão emocionante definiu o segundo finalista.",
    date: "02 de julho",
    featured: false,
  },
  {
    id: "news-3",
    title: "Semifinais definidas: veja os confrontos",
    excerpt: "Tabela, horários e locais da próxima fase.",
    date: "01 de julho",
    featured: false,
  },
];
