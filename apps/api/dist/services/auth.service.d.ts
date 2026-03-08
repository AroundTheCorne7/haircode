export interface LoginResult {
    user: {
        id: string;
        email: string;
        role: string;
    };
    tenant: {
        id: string;
        name: string;
        slug: string;
    };
}
export declare function verifyCredentials(email: string, password: string, tenantSlug: string): Promise<LoginResult | null>;
export declare function hashPassword(password: string): Promise<string>;
//# sourceMappingURL=auth.service.d.ts.map