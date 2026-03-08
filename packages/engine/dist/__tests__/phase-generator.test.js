import { describe, it, expect } from "vitest";
import { assignPhase } from "../phase-generator.js";
describe("assignPhase", () => {
    it("assigns stabilization for score <= 40", () => {
        expect(assignPhase(0, [])).toBe("stabilization");
        expect(assignPhase(25, [])).toBe("stabilization");
        expect(assignPhase(40, [])).toBe("stabilization");
    });
    it("assigns transformation for score 41-65", () => {
        expect(assignPhase(41, [])).toBe("transformation");
        expect(assignPhase(55, [])).toBe("transformation");
        expect(assignPhase(65, [])).toBe("transformation");
    });
    it("assigns integration for score >= 66", () => {
        expect(assignPhase(66, [])).toBe("integration");
        expect(assignPhase(80, [])).toBe("integration");
        expect(assignPhase(100, [])).toBe("integration");
    });
    it("forces stabilization when CRITICAL red flag is present", () => {
        const criticalFlag = { severity: "CRITICAL", code: "RF_TEST", message: "test", penaltyFactor: 0, requiresAcknowledgment: false };
        expect(assignPhase(80, [criticalFlag])).toBe("stabilization");
    });
    it("forces stabilization when BLOCK red flag is present", () => {
        const blockFlag = { severity: "BLOCK", code: "RF_TEST", message: "test", penaltyFactor: 0, requiresAcknowledgment: false };
        expect(assignPhase(90, [blockFlag])).toBe("stabilization");
    });
});
//# sourceMappingURL=phase-generator.test.js.map