import { $TSContext } from '@aws-amplify/amplify-cli-core';
type EnvironmentInfo = {
    isNewEnv: boolean;
    sourceEnv: string;
    yesFlagSet: boolean;
    envName: string;
};
export declare const configureMultiEnvDBSecrets: (context: $TSContext, secretsKey: string, apiName: string, envInfo: EnvironmentInfo) => Promise<void>;
export {};
//# sourceMappingURL=multi-env-database-secrets.d.ts.map