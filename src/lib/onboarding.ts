/**
 * Onboarding metadata helpers.
 *
 * State is persisted in Clerk so it follows the user across devices and
 * sessions — no localStorage per spec. We write to `unsafeMetadata`
 * because that is the only metadata field the Clerk JS client can
 * mutate without a server-side call. We also fall back to reading
 * `publicMetadata` so a backend can promote answers there later.
 *
 * Shape:
 *   metadata: {
 *     onboarded: boolean,
 *     palate: {
 *       red: 'light' | 'medium' | 'bold' | 'exploring',
 *       food: 'braai' | 'seafood' | 'fine-dining' | 'vegan',
 *       experience: 'beginner' | 'casual' | 'enthusiast' | 'collector',
 *       goal: 'discover' | 'cellar' | 'terroir' | 'impress',
 *     },
 *   }
 */

/**
 * Structural type for the `useUser()` user — the @clerk/types package
 * isn't a direct dependency so we describe just what we touch here to
 * avoid a transitive import.
 */
export interface ClerkUserLike {
  publicMetadata?: Record<string, unknown> | null;
  unsafeMetadata?: Record<string, unknown> | null;
  update: (params: { unsafeMetadata?: Record<string, unknown> }) => Promise<unknown>;
}

export type RedPreference = 'light' | 'medium' | 'bold' | 'exploring';
export type FoodPreference = 'braai' | 'seafood' | 'fine-dining' | 'vegan';
export type ExperienceLevel = 'beginner' | 'casual' | 'enthusiast' | 'collector';
export type Goal = 'discover' | 'cellar' | 'terroir' | 'impress';

export interface PalateAnswers {
  red?: RedPreference;
  food?: FoodPreference;
  experience?: ExperienceLevel;
  goal?: Goal;
}

export interface OnboardingMetadata {
  onboarded?: boolean;
  palate?: PalateAnswers;
}

export function readOnboarding(user: ClerkUserLike | null | undefined): OnboardingMetadata {
  if (!user) return {};
  // Merge unsafe (writable from frontend) over public (server-promoted)
  // so the freshest answer wins regardless of which side wrote it.
  const publicMeta = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const unsafeMeta = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
  const onboarded = unsafeMeta.onboarded === true || publicMeta.onboarded === true;
  const palate = {
    ...((publicMeta.palate ?? {}) as PalateAnswers),
    ...((unsafeMeta.palate ?? {}) as PalateAnswers),
  };
  return { onboarded, palate };
}

export async function saveOnboarding(
  user: ClerkUserLike,
  patch: OnboardingMetadata
): Promise<void> {
  const current = readOnboarding(user);
  const next = {
    onboarded: patch.onboarded ?? current.onboarded ?? false,
    palate: { ...(current.palate ?? {}), ...(patch.palate ?? {}) },
  };
  await user.update({
    unsafeMetadata: { ...(user.unsafeMetadata ?? {}), ...next },
  });
}

/**
 * Mocked starter wine recommendations keyed off the four palate
 * answers. The real recommendation engine lives elsewhere — for the
 * onboarding "first taste" screen we just need three plausible cards.
 */
export interface StarterWine {
  name: string;
  estate: string;
  region: string;
  flavourNotes: string;
  pairing: string;
  vintage: string;
}

const STARTER_LIBRARY: StarterWine[] = [
  {
    name: 'Pinotage Reserve',
    estate: 'Kanonkop Estate',
    region: 'Stellenbosch, South Africa',
    flavourNotes: 'Smoky plum, mocha, dried fynbos',
    pairing: 'Braai lamb chops with chakalaka',
    vintage: '2020',
  },
  {
    name: 'Old Vine Chenin Blanc',
    estate: 'Mullineux',
    region: 'Swartland, South Africa',
    flavourNotes: 'Quince, baked apple, beeswax, sea spray',
    pairing: 'Cape Malay chicken curry',
    vintage: '2022',
  },
  {
    name: 'Syrah-Mourvèdre',
    estate: 'Boekenhoutskloof',
    region: 'Franschhoek, South Africa',
    flavourNotes: 'Black pepper, cured meat, violet, graphite',
    pairing: 'Smoked springbok loin',
    vintage: '2021',
  },
  {
    name: 'Méthode Cap Classique Brut',
    estate: 'Graham Beck',
    region: 'Robertson, South Africa',
    flavourNotes: 'Citrus zest, brioche, white peach',
    pairing: 'West Coast oysters with lemon',
    vintage: 'NV',
  },
  {
    name: 'Cabernet Sauvignon',
    estate: 'Meerlust',
    region: 'Stellenbosch, South Africa',
    flavourNotes: 'Cassis, cedar, dark chocolate, tobacco',
    pairing: 'Dry-aged sirloin, peppercorn jus',
    vintage: '2019',
  },
  {
    name: 'Sauvignon Blanc',
    estate: 'Klein Constantia',
    region: 'Constantia, South Africa',
    flavourNotes: 'Passionfruit, cut grass, green fig',
    pairing: 'Grilled line fish, lemon, fennel',
    vintage: '2023',
  },
];

export function getStarterWines(palate: PalateAnswers): StarterWine[] {
  // Deterministic but palate-aware: prefer reds for "bold" palates, MCC
  // for fine-dining, white-leaning otherwise. Always returns 3.
  const wines = [...STARTER_LIBRARY];
  if (palate.red === 'bold') {
    wines.sort((a, b) => (b.name.includes('Cabernet') || b.name.includes('Syrah') ? 1 : -1));
  } else if (palate.red === 'light') {
    wines.sort((a, b) => (a.name.includes('Pinotage') ? -1 : 1));
  }
  if (palate.food === 'seafood') {
    wines.sort((a, b) => (a.name.includes('Sauvignon') || a.name.includes('Chenin') ? -1 : 1));
  } else if (palate.food === 'fine-dining') {
    wines.sort((a, b) => (a.name.includes('Méthode') ? -1 : 1));
  } else if (palate.food === 'braai') {
    wines.sort((a, b) => (a.name.includes('Pinotage') || a.name.includes('Syrah') ? -1 : 1));
  }
  return wines.slice(0, 3);
}
