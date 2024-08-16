import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ApigwWalkthroughReturnPromise } from '../service-walkthrough-types/apigw-types';
export declare function serviceWalkthrough(context: $TSContext): ApigwWalkthroughReturnPromise;
export declare function updateWalkthrough(context: $TSContext): Promise<{}>;
export declare function migrate(context: $TSContext, projectPath: string, resourceName: string): Promise<void>;
export declare function getIAMPolicies(resourceName: string, crudOptions: string[]): {
    policy: {};
    attributes: string[];
};
export declare const openConsole: (context?: $TSContext) => Promise<void>;
//# sourceMappingURL=apigw-walkthrough.d.ts.map