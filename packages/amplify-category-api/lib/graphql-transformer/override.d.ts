import { Construct } from 'constructs';
import { AmplifyApiGraphQlResourceStackTemplate } from './cdk-compat/amplify-api-resource-stack-types';
export declare function applyFileBasedOverride(scope: Construct, overrideDirPath?: string): AmplifyApiGraphQlResourceStackTemplate;
export declare class InvalidOverrideError extends Error {
    details: string;
    resolution: string;
    constructor(error: Error);
}
//# sourceMappingURL=override.d.ts.map