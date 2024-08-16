import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ConflictResolution } from 'amplify-headless-interface';
import { ApiArtifactHandler } from '../api-artifact-handler';
export declare const getCfnApiArtifactHandler: (context: $TSContext) => ApiArtifactHandler;
export declare const writeResolverConfig: (conflictResolution: ConflictResolution, resourceDir: string) => Promise<void>;
//# sourceMappingURL=cfn-api-artifact-handler.d.ts.map