import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { UpdateApiRequest } from 'amplify-headless-interface';
export declare const openConsole: (context: $TSContext) => Promise<void>;
export declare const serviceApiInputWalkthrough: (context: $TSContext, serviceMetadata: any) => Promise<{
    answers: {};
    output: {
        authConfig: any;
    };
    resolverConfig: any;
}>;
export declare const serviceWalkthrough: (context: $TSContext, serviceMetadata: Record<string, any>) => Promise<{
    noCfnFile: boolean;
    schemaContent: string;
    askToEdit: boolean;
    answers: {};
    output: {
        authConfig: any;
    };
    resolverConfig: any;
}>;
export declare const updateWalkthrough: (context: $TSContext) => Promise<UpdateApiRequest>;
export declare function askAdditionalAuthQuestions(context: $TSContext, authConfig: Record<string, any>, defaultAuthType: any): Promise<Record<string, any>>;
export declare function askAuthQuestions(authType: string, context: $TSContext, printLeadText: boolean, authSettings: any): Promise<{
    authenticationType: string;
    userPoolConfig: {
        userPoolId: any;
    };
} | {
    authenticationType: string;
    apiKeyConfig: Record<string, any>;
} | {
    authenticationType: string;
    openIDConnectConfig: any;
} | {
    authenticationType: string;
    lambdaAuthorizerConfig: {
        lambdaFunction: any;
        ttlSeconds: any;
    };
} | {
    authenticationType: string;
}>;
export declare function askApiKeyQuestions(authSettings?: Record<string, any>): Promise<{
    authenticationType: string;
    apiKeyConfig: Record<string, any>;
}>;
export declare const migrate: (context: $TSContext) => Promise<void>;
export declare const getIAMPolicies: (resourceName: string, operations: string[]) => {
    policy: Record<string, any>;
    attributes: string[];
};
//# sourceMappingURL=appSync-walkthrough.d.ts.map