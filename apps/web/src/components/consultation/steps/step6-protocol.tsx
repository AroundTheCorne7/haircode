"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  Download,
  XCircle,
  Activity,
  ChevronDown,
  Palette,
  Scissors,
  Sparkles,
} from "lucide-react";
import type { ConsultationData } from "../wizard";

interface Props {
  data: ConsultationData;
  onBack: () => void;
}

interface ColorStrategy {
  season: string;
  contrastScore: number;
  recommendedTechniques: string[];
  avoidTechniques: string[];
  recommendedTones: string[];
  avoidTones: string[];
  contraindications: string[];
}

interface HairDesign {
  recommendedLengths: string[];
  recommendedShapes: string[];
  forbiddenLengths: string[];
  forbiddenShapes: string[];
  volumeGuidelines: string[];
  rationale: string;
}

interface ArchetypeBlend {
  primary: string;
  primaryWeight: number;
  secondary?: string;
  secondaryWeight?: number;
}

interface Blueprint {
  colorStrategy: ColorStrategy | null;
  hairDesign: HairDesign | null;
  archetypeBlend: ArchetypeBlend;
}

interface ProtocolResult {
  phase: string;
  score: number;
  compositeScore: number;
  moduleScores: {
    hair: number;
    scalp: number;
    body: number;
    morphology: number;
  };
  redFlags: string[];
  isBlocked: boolean;
  services: string[];
  checkpoints: string[];
  frequency: { interval: number; unit: string };
  blueprint?: Blueprint;
}

const SEASON_STYLES: Record<
  string,
  {
    bg: string;
    border: string;
    text: string;
    accent: string;
    label: string;
    description: string;
  }
> = {
  spring: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    accent: "text-amber-600",
    label: "Spring",
    description:
      "Warm & light — golden, peachy, bright tones complement your natural warmth",
  },
  summer: {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-sky-900",
    accent: "text-sky-600",
    label: "Summer",
    description:
      "Cool & soft — ash, dusty rose, muted tones harmonise with your cool undertone",
  },
  autumn: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-900",
    accent: "text-orange-600",
    label: "Autumn",
    description:
      "Warm & deep — copper, auburn, rich earth tones enhance your natural depth",
  },
  winter: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-900",
    accent: "text-indigo-600",
    label: "Winter",
    description:
      "Cool & bold — high contrast, vivid tones suit your striking colouring",
  },
};

const PHASE_DESCRIPTIONS: Record<
  string,
  { weeks: string; color: string; description: string }
> = {
  Stabilization: {
    weeks: "4-12 week programme",
    color: "bg-amber-600",
    description:
      "Focused repair and damage control before transformation work begins.",
  },
  Transformation: {
    weeks: "6-16 week programme",
    color: "bg-brand",
    description:
      "Active treatment and measurable improvement towards optimal hair health.",
  },
  Integration: {
    weeks: "8-52 week programme",
    color: "bg-emerald-700",
    description:
      "Maintenance and enhancement to sustain and elevate achieved results.",
  },
};

const SERVICE_EXAMPLES: Record<string, { what: string; how: string }> = {
  "Emergency Scalp Detox Protocol": {
    what: "A deep-cleanse treatment to remove build-up, toxins and excess sebum from the scalp before any repair work can begin.",
    how: "Apply a chelating or clarifying scalp serum, massage for 5-8 min, rinse thoroughly. Follow with a soothing toner.",
  },
  "pH Rebalancing Therapy": {
    what: "Restores the scalp's natural acid mantle (pH 4.5-5.5), which is disrupted by chemical services, hard water, or alkaline products.",
    how: "Apply an acidic rinse (apple cider vinegar diluted 1:10, or a professional pH-correcting serum) after shampoo. Leave 2 min then rinse.",
  },
  "Reconstructive Repair Treatment": {
    what: "Rebuilds the hair's inner cortex using hydrolysed proteins and ceramides, closing gaps in the cuticle caused by heat or chemical damage.",
    how: "Apply protein-rich mask to towel-dried hair, use heat cap or steamer for 15-20 min. Rinse with cool water to seal cuticle.",
  },
  "Gentle Moisture Infusion": {
    what: "Restores internal hydration to dry, brittle hair without overloading fragile strands.",
    how: "Apply lightweight humectant mask (glycerin/aloe-based), wrap in warm towel for 10 min. Rinse.",
  },
  "Scalp Rebalancing Treatment": {
    what: "Regulates sebum production and reduces inflammation, suitable for oily or combination scalp types.",
    how: "Apply salicylic acid or zinc-based scalp tonic to partings before shampoo. Massage 3-5 min.",
  },
  "Deep Moisture Treatment": {
    what: "Penetrates the cortex to replenish lost moisture bonds, improving flexibility and reducing breakage.",
    how: "Apply a thick humectant-sealant mask on clean damp hair, cover with heat cap 20-25 min.",
  },
  "Protein-Moisture Balance": {
    what: "Calibrates the protein-to-moisture ratio — key for elasticity.",
    how: "Alternate a protein treatment and a moisture mask every 14 days. Assess elasticity stretch test before choosing which to apply.",
  },
  "Keratin Reconstruction Booster": {
    what: "Infuses keratin proteins deep into damaged areas of the cortex, dramatically improving strength and smoothness.",
    how: "Apply keratin serum section by section, use flat iron at 180C to seal. Do NOT combine with bleach in the same session.",
  },
  "Maintenance Hydration Treatment": {
    what: "A lighter top-up treatment to maintain optimal moisture levels as hair reaches the integration phase.",
    how: "Apply a leave-in conditioner or lightweight mask monthly. Can be done at home between salon visits.",
  },
  "Scalp Health Maintenance": {
    what: "Preventive scalp treatment to sustain the healthy environment achieved during earlier phases.",
    how: "Monthly scalp massage with a nourishing oil or growth serum.",
  },
  "Colour Protection & Gloss Service": {
    what: "Seals the cuticle to lock in colour molecules and add reflective shine to the hair surface.",
    how: "Apply a clear acidic gloss or colour-depositing treatment after colouring.",
  },
  "Preventive Strengthening Mask": {
    what: "Fortifies the hair structure on a monthly basis to prevent future damage and retain the gains from treatment.",
    how: "Apply a bond-building mask once a month at home or in-salon.",
  },
  "Porosity Sealing Treatment": {
    what: "Closes gaps in the raised cuticle layers of high-porosity hair, reducing frizz and moisture loss.",
    how: "Apply a protein or silicone-free sealant serum to clean damp hair. Finish with cold water rinse.",
  },
  "Anti-Seborrheic Scalp Treatment": {
    what: "Targets Malassezia yeast overgrowth which drives seborrheic dermatitis.",
    how: "Apply antifungal scalp treatment (ketoconazole 1% or piroctone olamine-based) every 10 days. Leave 5 min before rinse.",
  },
  "Anti-Dandruff Therapy": {
    what: "Controls dry or oily dandruff with exfoliating and antifungal actives to normalise scalp cell turnover.",
    how: "Use zinc pyrithione or selenium sulfide shampoo every session. Alternate with a gentle moisturising shampoo.",
  },
  "Trichology Stimulation Protocol": {
    what: "Stimulates dormant follicles and improves circulation to the scalp, used where alopecia or thinning is present.",
    how: "Apply minoxidil-free growth serum with dermaroller (0.25mm) or scalp massager. 10-15 min per session.",
  },
  "Stress-Recovery Scalp Ritual": {
    what: "A calming treatment targeting telogen effluvium (stress-induced shedding).",
    how: "Warm oil massage (rosemary, lavender, or adaptogenic blend) for 15-20 min once a month.",
  },
  "Bleach-Recovery Bond Building Treatment": {
    what: "Repairs the disulfide bonds broken during bleaching or lightening — the most structural form of hair damage.",
    how: "Apply bond-builder to hair during bleach process (step 1), and as a standalone treatment between bleach sessions (step 2).",
  },
};

function ServiceItem({ service }: { service: string }) {
  const [open, setOpen] = useState(false);
  const prefix = service.split(" — ")[0] ?? service;
  const timing = service.includes(" — ") ? service.split(" — ")[1] : null;
  const example = SERVICE_EXAMPLES[prefix];

  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-2 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-gray-800 font-medium">{prefix}</span>
          {timing && (
            <span className="text-xs text-gray-400 ml-2">
              &middot; {timing}
            </span>
          )}
        </div>
        {example && (
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5 transition-transform ${open ? "rotate-180" : ""}`}
          />
        )}
      </button>
      {example && open && (
        <div className="px-3 pb-3 pt-0 ml-6 space-y-2">
          <p className="text-xs text-gray-600 leading-relaxed">
            {example.what}
          </p>
          <div className="bg-brand/5 border border-brand/10 rounded p-2">
            <p className="text-xs text-brand/80 font-medium mb-0.5">
              How to apply
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {example.how}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ToneChip({
  tone,
  variant,
}: {
  tone: string;
  variant: "good" | "bad";
}) {
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
        variant === "good"
          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
          : "bg-red-50 text-red-600 border border-red-200"
      }`}
    >
      {tone}
    </span>
  );
}

function BlueprintSection({ blueprint }: { blueprint: Blueprint }) {
  const cs = blueprint.colorStrategy;
  const hd = blueprint.hairDesign;
  const ab = blueprint.archetypeBlend;

  const seasonStyle = cs ? SEASON_STYLES[cs.season] : null;

  return (
    <>
      {/* Colour Recommendations (hero section) */}
      {cs && seasonStyle && (
        <div
          className={`${seasonStyle.bg} ${seasonStyle.border} border rounded-xl p-5 space-y-4`}
        >
          <div className="flex items-center gap-2">
            <Palette className={`w-5 h-5 ${seasonStyle.accent}`} />
            <h3 className={`text-base font-semibold ${seasonStyle.text}`}>
              Your Colour Season: {seasonStyle.label}
            </h3>
          </div>
          <p className={`text-sm ${seasonStyle.text} opacity-80`}>
            {seasonStyle.description}
          </p>

          {/* Contrast */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 w-20">
              Contrast:
            </span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`w-5 h-5 rounded-full border ${
                    n <= cs.contrastScore
                      ? `${seasonStyle.border} ${seasonStyle.bg} ring-2 ring-current ${seasonStyle.accent}`
                      : "border-gray-200 bg-white"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 ml-1">
              {cs.contrastScore <= 2
                ? "Low"
                : cs.contrastScore === 3
                  ? "Medium"
                  : "High"}
            </span>
          </div>

          {/* Recommended Tones */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Recommended Tones
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cs.recommendedTones.map((t) => (
                <ToneChip key={t} tone={t} variant="good" />
              ))}
            </div>
          </div>

          {/* Avoid Tones */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">
              Tones to Avoid
            </p>
            <div className="flex flex-wrap gap-1.5">
              {cs.avoidTones.map((t) => (
                <ToneChip key={t} tone={t} variant="bad" />
              ))}
            </div>
          </div>

          {/* Techniques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">
                Recommended Techniques
              </p>
              <ul className="space-y-1">
                {cs.recommendedTechniques.map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1.5">
                Techniques to Avoid
              </p>
              <ul className="space-y-1">
                {cs.avoidTechniques.map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contraindications */}
          {cs.contraindications.length > 0 && (
            <div className="bg-white/60 rounded-lg p-3">
              <p className="text-xs font-semibold text-gray-600 mb-1">
                Important Notes
              </p>
              {cs.contraindications.map((c) => (
                <p key={c} className="text-xs text-gray-600">
                  {c}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Hair Design Recommendations */}
      {hd && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gray-600" />
            <h3 className="text-base font-semibold text-gray-900">
              Hair Design
            </h3>
            <span className="text-xs text-gray-400 ml-auto">
              {hd.rationale}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Recommended Lengths
              </p>
              <div className="flex flex-wrap gap-1.5">
                {hd.recommendedLengths.map((l) => (
                  <span
                    key={l}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium capitalize"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Recommended Shapes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {hd.recommendedShapes.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium capitalize"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {(hd.forbiddenLengths.length > 0 ||
            hd.forbiddenShapes.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hd.forbiddenLengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Avoid Lengths
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hd.forbiddenLengths.map((l) => (
                      <span
                        key={l}
                        className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium capitalize"
                      >
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {hd.forbiddenShapes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Avoid Shapes
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {hd.forbiddenShapes.map((s) => (
                      <span
                        key={s}
                        className="px-2.5 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-medium capitalize"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Volume Guidelines */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1.5">
              Volume & Styling Guidelines
            </p>
            <ul className="space-y-1">
              {hd.volumeGuidelines.map((g) => (
                <li key={g} className="flex items-start gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand/50 flex-shrink-0 mt-1.5" />
                  <span className="text-xs text-gray-600">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Archetype Identity */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-brand" />
          <h3 className="text-base font-semibold text-gray-900">
            Style Archetype
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-brand capitalize">
              {ab.primary}
            </div>
            <div className="text-xs text-gray-400">{ab.primaryWeight}%</div>
          </div>
          {ab.secondary && (
            <>
              <div className="text-gray-300">+</div>
              <div className="text-center">
                <div className="text-lg font-semibold text-brand/70 capitalize">
                  {ab.secondary}
                </div>
                <div className="text-xs text-gray-400">
                  {ab.secondaryWeight}%
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function Step6Protocol({ data, onBack }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<ProtocolResult | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("hc_token")
            : null;
        const res = await fetch("/api/evaluate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            hair: data.hair,
            scalp: data.scalp,
            body: data.body,
            morphology: data.morphology,
            color: data.color,
            archetype: data.archetype,
          }),
        });
        if (!res.ok) throw new Error("Evaluation failed");
        const result = (await res.json()) as ProtocolResult;
        setProtocol(result);
      } catch {
        setError("Could not generate protocol. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Analysing profile...</p>
        <p className="text-xs text-gray-400">
          Running decision engine across all modules
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <XCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-gray-700">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm text-brand border border-brand rounded-lg hover:bg-brand/5"
        >
          &larr; Back
        </button>
      </div>
    );
  }

  if (!protocol) return null;

  const handleSave = async () => {
    if (!protocol) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("hc_token") : null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setSaving(true);
    try {
      let clientId = data.clientId;

      if (!clientId) {
        const createRes = await fetch(`${apiUrl}/clients`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            firstName: data.firstName ?? "Unknown",
            lastName: data.lastName ?? "Client",
            gdprConsentGiven: true,
          }),
        });
        if (!createRes.ok) {
          const body = (await createRes.json()) as {
            error?: { message?: string };
          };
          throw new Error(body.error?.message ?? "Failed to create client");
        }
        const created = (await createRes.json()) as { data: { id: string } };
        clientId = created.data.id;
      }

      const res = await fetch(
        `${apiUrl}/clients/${clientId}/protocols/generate`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            hair: data.hair,
            scalp: data.scalp,
            body: data.body,
            morphology: data.morphology,
            color: data.color,
            archetype: data.archetype,
          }),
        },
      );
      if (!res.ok) {
        const body = (await res.json()) as { error?: { message?: string } };
        throw new Error(body.error?.message ?? "Failed to save protocol");
      }
      window.location.href = "/dashboard";
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save protocol. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const phaseInfo =
    PHASE_DESCRIPTIONS[protocol.phase] ?? PHASE_DESCRIPTIONS["Transformation"]!;
  const freq = protocol.frequency
    ? `Every ${protocol.frequency.interval} ${protocol.frequency.unit}`
    : "Every 14 days";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-gray-900">
            Transformation Blueprint
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.firstName} {data.lastName} &middot; Score: {protocol.score}
            /100
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          title="Print protocol"
        >
          <Download className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Blocked */}
      {protocol.isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">
                Services Blocked
              </p>
              <p className="text-sm text-red-700 mt-1">
                Chemical and invasive services are contraindicated. Please
                address the flagged conditions before proceeding.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Red Flags */}
      {protocol.redFlags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 mb-1">
                Attention Required
              </p>
              {protocol.redFlags.map((flag) => (
                <p key={flag} className="text-sm text-amber-700 mt-0.5">
                  {flag}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* BLUEPRINT — Colour · Design · Archetype (hero sections) */}
      {protocol.blueprint && (
        <BlueprintSection blueprint={protocol.blueprint} />
      )}

      {/* Module Scores */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-gray-500" />
          <p className="text-sm font-medium text-gray-700">Module Scores</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(["hair", "scalp", "body", "morphology"] as const).map((mod) => {
            const s = protocol.moduleScores[mod];
            const color =
              s >= 70
                ? "text-emerald-600"
                : s >= 45
                  ? "text-amber-600"
                  : "text-red-500";
            return (
              <div key={mod} className="text-center">
                <div className={`text-xl font-semibold ${color}`}>{s}</div>
                <div className="text-xs text-gray-400 capitalize mt-0.5">
                  {mod}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phase Banner */}
      <div className={`${phaseInfo.color} text-white rounded-xl p-5`}>
        <div className="text-xs font-medium text-white/60 uppercase tracking-wider mb-1">
          Assigned Phase
        </div>
        <div className="text-2xl font-light">{protocol.phase}</div>
        <div className="text-sm text-white/60 mt-1">
          {phaseInfo.weeks} &middot; {freq}
        </div>
        <div className="text-xs text-white/50 mt-2">
          {phaseInfo.description}
        </div>
      </div>

      {/* Services */}
      {!protocol.isBlocked && (
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">
              Prescribed Services
            </h3>
            <span className="text-xs text-gray-400">
              Tap a service for details
            </span>
          </div>
          <div className="space-y-2">
            {protocol.services.map((service) => (
              <ServiceItem key={service} service={service} />
            ))}
          </div>
        </div>
      )}

      {/* Checkpoints */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Progress Checkpoints
        </h3>
        <div className="space-y-2">
          {protocol.checkpoints.map((cp) => (
            <div
              key={cp}
              className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-brand/40 flex-shrink-0" />
              <span className="text-sm text-gray-600">{cp}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-900"
        >
          &larr; Back
        </button>
        <button
          onClick={() => {
            void handleSave();
          }}
          disabled={saving}
          className="w-full sm:w-auto bg-brand text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-brand/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save to Client File"}
        </button>
      </div>
    </div>
  );
}
