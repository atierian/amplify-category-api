import { UserDefinedSlot } from '@aws-amplify/graphql-transformer-core';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { DeploymentResources } from './cdk-compat/deployment-resources';
export declare const transformGraphQLSchemaV2: (context: $TSContext, options: any) => Promise<DeploymentResources | undefined>;
export declare const getUserOverridenSlots: (userDefinedSlots: Record<string, UserDefinedSlot[]>) => string[];
//# sourceMappingURL=transform-graphql-schema-v2.d.ts.map