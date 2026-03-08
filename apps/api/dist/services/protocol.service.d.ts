export interface GenerateProtocolInput {
    hair: Record<string, unknown>;
    scalp: Record<string, unknown>;
    body?: Record<string, unknown>;
    morphology?: Record<string, unknown>;
}
export declare function listProtocolsForClient(tenantId: string, clientId: string): Promise<{
    status: string;
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    tenantId: string;
    clientId: string;
    objective: string | null;
    module: string;
    createdBy: string;
    approvedBy: string | null;
    approvedAt: Date | null;
    scoringLogId: string | null;
    startedAt: string | null;
    estimatedEndAt: string | null;
    completedAt: string | null;
    lockedAt: Date | null;
    lockedBy: string | null;
    clientVisible: boolean;
}[]>;
export declare function generateProtocol(tenantId: string, clientId: string, userId: string, input: GenerateProtocolInput): Promise<{
    protocol: {
        status: string;
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientId: string;
        objective: string | null;
        module: string;
        createdBy: string;
        approvedBy: string | null;
        approvedAt: Date | null;
        scoringLogId: string | null;
        startedAt: string | null;
        estimatedEndAt: string | null;
        completedAt: string | null;
        lockedAt: Date | null;
        lockedBy: string | null;
        clientVisible: boolean;
    };
    result: import("@haircode/engine").EvaluationResult;
}>;
//# sourceMappingURL=protocol.service.d.ts.map