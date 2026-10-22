/**
 * Fotos de banco de imagens (Unsplash — licença de uso livre).
 * Todas passam pelo <SmartImage>, que mostra um fallback na cor do tema
 * caso alguma URL deixe de existir.
 */
const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMAGES = {
  warehouse: u("photo-1586528116311-ad8dd3c8310d", 1600),
  forklift: u("photo-1553413077-190dd305871c"),
  truck: u("photo-1519003722824-194d4455a60c"),
  support: u("photo-1563986768609-322da13575f3"),
  leadership: u("photo-1521737604893-d14cc237f11d"),
  privacy: u("photo-1554224155-6726b3ff858f"),
  meeting: u("photo-1600880292203-757bb62b4baf"),
  conference: u("photo-1573164574572-cb89e39749b4"),
  code: u("photo-1517694712202-14dd9538aa97"),
  team: u("photo-1522202176988-66273c2fd55f"),
} as const;

/** Galeria oferecida no editor de cursos */
export const COVER_PRESETS = [
  IMAGES.forklift,
  IMAGES.truck,
  IMAGES.support,
  IMAGES.leadership,
  IMAGES.privacy,
  IMAGES.meeting,
  IMAGES.conference,
  IMAGES.code,
];

/** Galeria oferecida para o fundo do portal de login */
export const LOGIN_PRESETS = [IMAGES.warehouse, IMAGES.team, IMAGES.meeting, IMAGES.conference];
