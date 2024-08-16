import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ApigwInputs, Path } from './cdk-stack-builder';
import { ApigwWalkthroughReturnPromise } from './service-walkthrough-types/apigw-types';
export declare class ApigwInputState {
    private readonly context;
    projectRootPath: string;
    resourceName: string;
    paths: {
        [pathName: string]: Path;
    };
    constructor(context: $TSContext, resourceName?: string);
    addAdminQueriesResource: (adminQueriesProps: AdminQueriesProps) => Promise<void>;
    updateAdminQueriesResource: (adminQueriesProps: AdminQueriesProps) => Promise<void>;
    addApigwResource: (serviceWalkthroughPromise: ApigwWalkthroughReturnPromise, options: Record<string, any>) => Promise<string>;
    updateApigwResource: (updateWalkthroughPromise: Promise<Record<string, any>>) => Promise<string>;
    migrateAdminQueries: (adminQueriesProps: AdminQueriesProps) => Promise<void>;
    migrateApigwResource: (resourceName: string) => Promise<void>;
    cliInputsFileExists(): boolean;
    getCliInputPayload(): any;
    isCLIInputsValid(cliInputs?: ApigwInputs): Promise<void>;
    private createApigwArtifacts;
}
export type AdminQueriesProps = {
    apiName: string;
    functionName: string;
    authResourceName: string;
    dependsOn: Record<string, any>[];
};
//# sourceMappingURL=apigw-input-state.d.ts.map