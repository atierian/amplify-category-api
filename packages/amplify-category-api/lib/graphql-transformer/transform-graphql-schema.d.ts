import { DeploymentResources as DeploymentResourcesV1 } from 'graphql-transformer-core';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { DeploymentResources as DeploymentResourcesV2 } from './cdk-compat/deployment-resources';
export declare const transformGraphQLSchema: (context: $TSContext, options: any) => Promise<DeploymentResourcesV2 | DeploymentResourcesV1 | undefined>;
//# sourceMappingURL=transform-graphql-schema.d.ts.map