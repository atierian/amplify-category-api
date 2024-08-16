import { $TSContext } from '@aws-amplify/amplify-cli-core';
export type Secret = {
    secretName: string;
    secretValue: string;
};
export declare class SSMClient {
    private readonly ssmClient;
    private static instance;
    static getInstance: (context: $TSContext) => Promise<SSMClient>;
    private constructor();
    getSecrets: (secretNames: string[]) => Promise<Secret[]>;
    getSecretNamesByPath: (secretPath: string) => Promise<string[]>;
    setSecret: (secretName: string, secretValue: string) => Promise<void>;
    deleteSecret: (secretName: string) => Promise<void>;
    deleteSecrets: (secretNames: string[]) => Promise<void>;
}
//# sourceMappingURL=ssmClient.d.ts.map