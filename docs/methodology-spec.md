# HairCode™ — Methodology Specification

**Version:** 1.0
**Source:** Expert consultant input (Silvana Petrova, BeautyPlace.bg) + Colour Me Beautiful system
**Status:** Partial — awaiting 100+ rules, full face shape rules, full season palettes

---

## Architecture Overview

HairCode is a **knowledge-based expert system**, not a recommendation app. It encodes professional methodology into structured rules that produce a Transformation Blueprint.

### 6 Analysis Layers (in processing priority order)

| Priority | Layer | Determines |
|---|---|---|
| 1 | Face Morphology | Silhouette, volume placement, fringe, length |
| 2 | Hair Structure | What is technically possible |
| 3 | Body Morphology | Length, volume balance |
| 4 | Color Identity | Color palette, technique, formula direction |
| 5 | Archetype Identity | Overall style character, texture, drama level |
| 6 | Scalp Condition | Treatment protocol, contraindications |

**Cross-rule conflict resolution:** Higher priority layer wins. See Section 8.

---

## Layer 1 — Face Morphology

### Face Shape Taxonomy

```typescript
type FaceShape = 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'rectangular'
```

### Rules by Face Shape

**OVAL** — Reference shape, most styles work
- Recommended: Any balanced silhouette
- Avoid: Nothing — most shapes are flattering

**ROUND** — Goal: visually elongate
- Recommended:
  - Vertical volume (height at crown)
  - Length below chin
  - Asymmetric fringe
  - Side partings
- Avoid:
  - Bob to the chin (widens)
  - Horizontal volume at the sides
  - Full straight fringe

**SQUARE** — Goal: soften the lines
- Recommended:
  - Soft texture
  - Layers
  - Waves
  - Side-swept styles
- Avoid:
  - Straight blunt bob
  - Heavy geometric lines
  - Centre parting with flat top

**HEART** — Wide forehead, narrow chin
- Recommended:
  - Volume at jaw and below
  - Side partings
  - Chin-length or longer
- Avoid:
  - Volume at temples/top
  - Short styles that emphasise forehead width

**DIAMOND** — Narrow forehead and jaw, wide cheekbones
- Recommended:
  - Volume at forehead and jaw
  - Fringes to widen forehead
  - Chin-length styles
- Avoid:
  - Volume at cheekbones
  - Slicked-back styles

**RECTANGULAR** — Goal: add width, reduce length
- Recommended:
  - Horizontal volume at sides
  - Waves and curls
  - Layered looks
  - Fringe
- Avoid:
  - Extra length (adds elongation)
  - Flat top styles

> ⚠️ **Pending:** Complete rule tables from consultant for all 6 shapes

---

## Layer 2 — Color Identity

### Season System: Classic 4-Season

```typescript
type ColorSeason = 'spring' | 'summer' | 'autumn' | 'winter'
```

### Contrast Score

```typescript
type ContrastScore = 1 | 2 | 3 | 4 | 5
// 1 = very low, 2 = low, 3 = medium, 4 = high, 5 = extreme
```

### Season Profiles

**WINTER**
- Undertone: Cool
- Contrast: 4–5 (high to extreme)
- Characteristics: Dark hair + light/striking eyes, high overall contrast
- Suitable colors: Jet black, cool espresso, burgundy, icy blonde, blue-black
- Technique direction: Full color in cool dark shades; dramatic single-process; crisp highlights
- Avoid: Warm golden tones, brassy highlights

**SUMMER**
- Undertone: Cool
- Contrast: 2–3 (low to medium)
- Characteristics: Ashy, muted tones; softer overall appearance
- Suitable colors: Ash blonde, cool beige, soft brown, cool mushroom
- Technique direction: Soft highlights and lowlights; no high-contrast roots
- Avoid: Warm tones, high-contrast coloring

**SPRING**
- Undertone: Warm
- Contrast: 2–3 (low to medium)
- Characteristics: Golden/peachy tones; warm and light
- Suitable colors: Golden blonde, honey, warm caramel, strawberry
- Technique direction: Warm highlights; balayage in golden tones
- Avoid: Ashy or cool tones; dark solid colors

**AUTUMN**
- Undertone: Warm
- Contrast: 3–4 (medium to high)
- Characteristics: Rich, earthy tones; deeper warm shades
- Suitable colors: Copper, chestnut, auburn, warm brown, golden highlights
- Technique direction: Rich dimensional color; copper/red tones; warm balayage
- Avoid: Cool ashy shades; platinum or icy tones

> ⚠️ **Pending:** Full palette list (specific color swatches/tone names) per season from consultant

---

## Layer 3 — Archetype Identity

### Archetype Taxonomy

```typescript
type Archetype = 'natural' | 'elegant' | 'dramatic' | 'classic' | 'creative' | 'sensual'
```

### Blend Support

Archetypes can be blended (primary + secondary with percentage):
```typescript
interface ArchetypeProfile {
  primary: Archetype
  primaryWeight: number      // e.g. 0.60
  secondary?: Archetype
  secondaryWeight?: number   // e.g. 0.40
}
```

### Archetype Rules

**NATURAL**
- Hair character: Low-maintenance, effortless, texture-forward
- Techniques: Minimal processing, natural movement, lived-in looks
- Color: Close to natural, soft highlights if any
- Avoid: High-maintenance styles, heavy processing

**ELEGANT**
- Hair character: Polished, refined, structured
- Techniques: Precise cuts, smooth finishes
- Color: Classic tones, subtle variation
- Avoid: Chaotic texture, overly casual styles

**DRAMATIC**
- Hair character: Bold, statement-making, high impact
- Techniques: Strong structure, maximum contrast
- Color: Bold within color type; high contrast application
- Avoid: Understated, blended looks

**CLASSIC**
- Hair character: Timeless, conservative, well-groomed
- Techniques: Traditional cuts, low variation
- Color: Close to natural, change slowly
- Avoid: Trend-driven, experimental styles

**CREATIVE**
- Hair character: Unconventional, expressive, unique
- Techniques: Experimental cuts, color mixing, accessories
- Color: Unconventional for type (within reason)
- Avoid: Safe, predictable styles

**SENSUAL**
- Hair character: Soft, flowing, feminine texture
- Techniques: Layers, soft waves, movement
- Color: Rich, dimensional, enhances depth
- Avoid: Blunt, rigid structures

### Blend Logic

When archetypes are blended, rules are weighted:
- Primary archetype rules apply fully
- Secondary archetype rules apply at secondary weight
- In conflicts: primary wins

**Example:** Natural 60% + Elegant 40%
→ Natural texture maintained (primary)
→ Elegant structural line introduced (secondary)
→ Result: Lived-in but structured; natural movement with a clean finish

---

## Layer 4 — Hair Structure

### Parameters

```typescript
interface HairStructure {
  type: 'straight' | 'wavy' | 'curly'
  density: 'low' | 'medium' | 'high'
  thickness: 'fine' | 'medium' | 'coarse'
}
```

### Rules by Parameter

**FINE HAIR (thickness: fine)**
- Avoid: Heavy bob; excessively long length (weight pulls volume down)
- Recommended: Textured layers; blunt ends at medium length; volume at roots
- Technique: Lightweight highlights; avoid heavy single-process that flattens

**THICK HAIR (thickness: coarse / density: high)**
- Recommended: Internal thinning; graduated layers for volume control
- Technique: Controlled smoothing; avoid over-layering (creates triangle shape)

**CURLY HAIR (type: curly)**
- Recommended: Dry cutting; layer for shape; avoid blunt lines
- Care: Serum before blow-drying; avoid heat on damaged curly hair
- Technique: Diffuse dry; DevaCut approach

**LOW DENSITY HAIR**
- Recommended: Shorter length; blunt cuts create illusion of thickness
- Avoid: Long thin styles; heavy layering that separates hair

---

## Layer 5 — Scalp Condition

### Parameters

```typescript
type ScalpCondition = 'normal' | 'dry' | 'oily' | 'sensitive' | 'dandruff' | 'hair_loss'
```

### Rules

**OILY SCALP**
- Treatment: Detox protocol first
- Avoid: Heavy oils and masks at root
- Color impact: Reduces timing for chemical treatments; needs pH-balanced products

**DRY SCALP**
- Treatment: Hydration protocol required before chemical treatments
- Color impact: Moisturising treatments before and after color

**SENSITIVE SCALP**
- Red flag: No bleach directly on scalp (foil/balayage only)
- Allergy test required: 48h before any chemical treatment
- Avoid: High-alkaline products

**HAIR LOSS (active)**
- Red flag: Consult trichologist before chemical treatments
- Avoid: Heavy treatments; tight styles
- Recommended: Scalp stimulation treatments; lightweight protocols

**DANDRUFF**
- Treatment: Anti-fungal protocol before proceeding
- Avoid: Oil-based treatments at root

---

## Layer 6 — Body Morphology

### Parameters

```typescript
interface BodyMorphology {
  bodyType: 'hourglass' | 'rectangle' | 'triangle' | 'inverted_triangle'
  shoulders: 'narrow' | 'balanced' | 'wide'
  neckLength: 'short' | 'medium' | 'long'
}
```

### Rules

**SHORT NECK**
- Priority: HIGH (overrides length recommendations from other layers)
- Recommended: Raised volume at crown; short nape
- Avoid: Length that extends below nape; volume at nape

**WIDE SHOULDERS (inverted triangle)**
- Recommended: Longer hair for visual balance
- Avoid: Very short styles that emphasise shoulder width

**NARROW SHOULDERS (triangle)**
- Recommended: Volume at sides; short to medium length
- Avoid: Excessive length that draws eye down

**LONG NECK**
- Recommended: Any length; low volume at nape acceptable
- Opportunity: Can wear short nape styles elegantly

---

## Layer 7 — Cross-Layer Rules

### Priority Order

```
1. Face Morphology   (highest — always respected)
2. Hair Structure    (technical feasibility)
3. Body Morphology   (proportion balance)
4. Color Identity    (color direction)
5. Archetype         (style character — lowest, most flexible)
```

### Conflict Resolution Examples

**Round face + Short neck**
- Face says: volume at crown, length below chin
- Neck says: raised crown volume, short nape
- Resolution: BOTH agree on crown volume → apply; length compromise: chin to shoulder
- Note: Short neck is priority 3, but aligns with face priority here

**Winter color type + Natural archetype**
- Color says: high contrast, bold application
- Archetype says: minimal processing, close to natural
- Resolution: Archetype softens the contrast → apply winter palette but with soft balayage technique rather than solid high-contrast application

**Fine hair + Dramatic archetype**
- Hair says: avoid length (no volume weight)
- Archetype says: bold, statement-making
- Resolution: Drama through COLOR, not length. Short bold color rather than long dramatic length.

**Square face + Creative archetype**
- Face says: avoid geometric lines
- Archetype says: unconventional shapes are valid
- Resolution: Creative expression through color/texture, not geometric lines. Asymmetric vs blunt.

> ⚠️ **Pending:** 100+ expert cross-layer rules from consultant

---

## Output — Transformation Blueprint

### Structure

```typescript
interface TransformationBlueprint {
  clientProfile: {
    faceShape: FaceShape
    colorSeason: ColorSeason
    contrastScore: ContrastScore
    archetype: ArchetypeProfile
    hairStructure: HairStructure
    scalpCondition: ScalpCondition[]
    bodyMorphology: BodyMorphology
  }
  hairDesign: {
    length: string            // e.g. "below shoulder", "collarbone"
    form: string              // e.g. "layered", "blunt", "graduated"
    volume: string            // e.g. "crown volume", "mid-length movement"
    fringe?: string           // e.g. "asymmetric side fringe"
    texture: string           // e.g. "soft waves", "smooth", "textured"
  }
  colorStrategy: {
    primaryColor: string      // e.g. "cool espresso base"
    technique: string         // e.g. "foil highlights", "balayage", "solid"
    formula: string           // e.g. "warm caramel + honey blend"
    contrastApproach: string  // e.g. "dimensional, medium contrast"
    avoidNotes: string[]      // e.g. ["avoid ashy tones"]
  }
  technicalRoadmap: {
    phase: number
    name: string              // e.g. "Foundation", "Color", "Maintenance"
    durationWeeks: number
    services: string[]
    successCriteria: string[]
  }[]
  treatmentProtocol: {
    hairCare: string[]        // e.g. "hydration treatment x3", "keratin"
    scalpCare: string[]       // e.g. "detox x2", "stimulation massage"
    bodyBalance?: string[]    // e.g. "VacuShape", "pressotherapy" (optional)
  }
  contraindications: string[] // red flags that limit or block services
}
```

---

## Trend Engine (Annual Updates)

The rule engine must support versioned rule sets so trends can be added annually:

```typescript
interface TrendRule {
  id: string
  name: string                // e.g. "Bixie 2025"
  validFrom: string           // ISO date
  validTo?: string            // null = ongoing
  applicableArchetypes: Archetype[]
  applicableSeasons: ColorSeason[]
  technique: string
  notes: string
}
```

---

## Treatment Protocols

### Hair & Scalp Treatments
- Hydration therapy
- Detox protocol
- Anti-hair loss treatment
- Keratin smoothing
- pH-balancing treatment

### Body Balance Treatments (optional module)
- VacuShape vacuum training
- Pressotherapy
- BTL muscle stimulation apparatus treatments

> These are offered as add-on recommendations, not core to the hair design logic.

---

## Still Needed from Consultant

| Item | Impact | Priority |
|---|---|---|
| Full face shape rules for all 6 shapes | Phase 1 — face morphology engine | 🔴 Critical |
| Full color palettes for all 4 seasons | Phase 1 — color identity engine | 🔴 Critical |
| 100+ expert cross-layer rules | Phase 2 — design engine | 🔴 Critical |
| Example Transformation Blueprint (real client) | Phase 3 — output design | 🟡 High |

---

## Engineering Notes

- Rule engine must be **versioned** — rules can be added/updated without redeploying
- All layers produce a **score + recommendation set**, not just a recommendation
- Archetype blends require **weighted rule merging**, not simple selection
- Blueprint output must support both **practitioner view** (full detail) and **client view** (narrative summary)
- System must support **licensing to other salons** — multi-tenant architecture already in place
