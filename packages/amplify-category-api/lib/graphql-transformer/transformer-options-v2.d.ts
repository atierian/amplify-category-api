import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { TransformerPluginProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { TransformerProjectOptions } from './transformer-options-types';
export declare const APPSYNC_RESOURCE_SERVICE = "AppSync";
export declare const generateTransformerOptions: (context: $TSContext, options: any) => Promise<TransformerProjectOptions>;
export declare const suppressApiKeyGeneration: (parameters: any) => boolean;
export declare const loadCustomTransformersV2: (resourceDir: string) => Promise<TransformerPluginProvider[]>;
//# sourceMappingURL=transformer-options-v2.d.ts.map