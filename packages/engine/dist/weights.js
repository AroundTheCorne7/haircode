export const DEFAULT_WEIGHTS = {
    modules: {
        hair: 0.40,
        scalp: 0.30,
        body: 0.20,
        morphology: 0.10,
    },
    fields: {
        hair: {
            texture: 0.10,
            density: 0.15,
            porosity: 0.20,
            elasticity: 0.25,
            damageIndex: 0.30,
        },
        scalp: {
            biotype: 0.15,
            sebumProduction: 0.20,
            // "sensitivity" matches the field name used in the Zod schema and normalizers
            sensitivity: 0.15,
            phLevel: 0.20,
            microbiomeBalance: 0.30,
        },
        body: {
            hormonalIndex: 0.25,
            nutritionalScore: 0.30,
            stressIndex: 0.25,
            hydrationPct: 0.20,
        },
        morphology: {
            symmetryScore: 0.40,
            undertone: 0.30,
            faceShape: 0.30,
        },
    },
};
//# sourceMappingURL=weights.js.map