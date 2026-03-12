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
export declare const ARCHETYPE_PROFILES: Record<ArchetypeType, ArchetypeStyleProfile>;
/**
 * Resolves an archetype blend into a weighted style profile.
 * When secondary archetype is present, merges at specified weights.
 */
export declare function resolveArchetypeStyle(blend: ArchetypeBlend): ArchetypeStyleProfile;
//# sourceMappingURL=archetype-rules.d.ts.map