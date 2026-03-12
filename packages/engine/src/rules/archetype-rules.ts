/**
 * Archetype Identity Rules — Layer 5
 *
 * Each archetype maps to style preferences that feed into the Design Engine.
 * When two archetypes are blended, recommendations are merged by weight.
 *
 * Archetypes: natural | elegant | dramatic | classic | creative | sensual
 */

import type { ArchetypeType, ArchetypeBlend } from "../types.js";

export interface ArchetypeStyleProfile {
  preferredLengths: string[];
  preferredShapes: string[];
  avoidLengths: string[];
  avoidShapes: string[];
  texturePreferences: string[];
  colorPreferences: string[];
  maintenanceLevel: "minimal" | "moderate" | "intensive";
  keywords: string[];
}

export const ARCHETYPE_PROFILES: Record<ArchetypeType, ArchetypeStyleProfile> =
  {
    natural: {
      preferredLengths: ["mid-back", "waist", "shoulder", "collarbone"],
      preferredShapes: ["layered", "textured"],
      avoidLengths: ["pixie"],
      avoidShapes: ["blunt", "angular"],
      texturePreferences: [
        "effortless waves",
        "air-dried",
        "loose curls",
        "undone texture",
      ],
      colorPreferences: [
        "natural tones",
        "subtle sun-kissed",
        "minimal processing",
      ],
      maintenanceLevel: "minimal",
      keywords: ["effortless", "authentic", "organic", "relaxed"],
    },

    elegant: {
      preferredLengths: ["shoulder", "collarbone", "mid-back"],
      preferredShapes: ["blunt", "graduated", "smooth"],
      avoidLengths: ["pixie", "waist"],
      avoidShapes: ["textured", "asymmetric"],
      texturePreferences: ["sleek blowout", "smooth waves", "polished finish"],
      colorPreferences: ["refined tones", "glossy finish", "subtle dimension"],
      maintenanceLevel: "moderate",
      keywords: ["refined", "polished", "timeless", "sophisticated"],
    },

    dramatic: {
      preferredLengths: ["pixie", "ear", "waist"],
      preferredShapes: ["angular", "asymmetric", "bold"],
      avoidLengths: ["shoulder"],
      avoidShapes: ["rounded"],
      texturePreferences: ["graphic cuts", "strong lines", "structured styles"],
      colorPreferences: [
        "high contrast",
        "bold vivid tones",
        "fashion colours",
      ],
      maintenanceLevel: "intensive",
      keywords: ["bold", "statement", "avant-garde", "striking"],
    },

    classic: {
      preferredLengths: ["shoulder", "collarbone", "chin"],
      preferredShapes: ["blunt", "graduated", "layered"],
      avoidLengths: ["waist"],
      avoidShapes: ["asymmetric"],
      texturePreferences: ["clean blow-dry", "structured waves", "classic set"],
      colorPreferences: ["natural base", "subtle highlights", "classic toning"],
      maintenanceLevel: "moderate",
      keywords: ["timeless", "balanced", "structured", "conservative"],
    },

    creative: {
      preferredLengths: ["pixie", "ear", "chin", "shoulder"],
      preferredShapes: ["asymmetric", "textured", "angular", "layered"],
      avoidLengths: [],
      avoidShapes: ["blunt"],
      texturePreferences: ["experimental", "mixed textures", "editorial"],
      colorPreferences: [
        "creative colour",
        "vivid",
        "unconventional placement",
      ],
      maintenanceLevel: "intensive",
      keywords: ["expressive", "unique", "experimental", "artistic"],
    },

    sensual: {
      preferredLengths: ["collarbone", "mid-back", "waist"],
      preferredShapes: ["layered", "rounded", "textured"],
      avoidLengths: ["pixie", "ear"],
      avoidShapes: ["angular", "blunt"],
      texturePreferences: [
        "voluminous waves",
        "soft curls",
        "beachy waves",
        "lush texture",
      ],
      colorPreferences: [
        "warm glossy tones",
        "rich depth",
        "dimensional colour",
      ],
      maintenanceLevel: "moderate",
      keywords: ["lush", "romantic", "voluminous", "flowing"],
    },
  };

/**
 * Resolves an archetype blend into a weighted style profile.
 * When secondary archetype is present, merges at specified weights.
 */
export function resolveArchetypeStyle(
  blend: ArchetypeBlend,
): ArchetypeStyleProfile {
  const primary = ARCHETYPE_PROFILES[blend.primary];

  if (!blend.secondary || !blend.secondaryWeight) {
    return primary;
  }

  const secondary = ARCHETYPE_PROFILES[blend.secondary];
  const pW = (blend.primaryWeight ?? 100) / 100;
  const sW = (blend.secondaryWeight ?? 0) / 100;

  // Merge lengths — weighted union (primary gets preference on conflicts)
  const preferredLengths = mergeWeighted(
    primary.preferredLengths,
    secondary.preferredLengths,
    pW,
    sW,
    primary.avoidLengths,
  );

  const preferredShapes = mergeWeighted(
    primary.preferredShapes,
    secondary.preferredShapes,
    pW,
    sW,
    primary.avoidShapes,
  );

  // Avoid list is intersection — only avoid what both archetypes avoid
  const avoidLengths = primary.avoidLengths.filter((l) =>
    secondary.avoidLengths.includes(l),
  );
  const avoidShapes = primary.avoidShapes.filter((s) =>
    secondary.avoidShapes.includes(s),
  );

  // Maintenance: take the higher maintenance level when blending
  const maintenanceLevel = higherMaintenance(
    primary.maintenanceLevel,
    secondary.maintenanceLevel,
  );

  return {
    preferredLengths,
    preferredShapes,
    avoidLengths,
    avoidShapes,
    texturePreferences: [
      ...new Set([
        ...primary.texturePreferences,
        ...secondary.texturePreferences,
      ]),
    ],
    colorPreferences: [
      ...new Set([...primary.colorPreferences, ...secondary.colorPreferences]),
    ],
    maintenanceLevel,
    keywords: [...new Set([...primary.keywords, ...secondary.keywords])],
  };
}

/** Merge two lists weighted — items from the higher-weight list take priority */
function mergeWeighted(
  primaryList: string[],
  secondaryList: string[],
  pW: number,
  sW: number,
  avoidList: string[],
): string[] {
  const combined =
    pW >= sW
      ? [
          ...primaryList,
          ...secondaryList.filter((s) => !primaryList.includes(s)),
        ]
      : [
          ...secondaryList,
          ...primaryList.filter((p) => !secondaryList.includes(p)),
        ];

  return combined.filter((item) => !avoidList.includes(item));
}

const MAINTENANCE_ORDER: Record<
  ArchetypeStyleProfile["maintenanceLevel"],
  number
> = {
  minimal: 1,
  moderate: 2,
  intensive: 3,
};

function higherMaintenance(
  a: ArchetypeStyleProfile["maintenanceLevel"],
  b: ArchetypeStyleProfile["maintenanceLevel"],
): ArchetypeStyleProfile["maintenanceLevel"] {
  return MAINTENANCE_ORDER[a] >= MAINTENANCE_ORDER[b] ? a : b;
}
