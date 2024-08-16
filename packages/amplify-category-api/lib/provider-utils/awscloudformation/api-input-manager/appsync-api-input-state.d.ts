import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AppSyncCLIInputs } from '../service-walkthrough-types/appsync-user-input-types';
export declare class AppsyncApiInputState {
    #private;
    private readonly context;
    constructor(context: $TSContext, resourceName: string);
    isCLIInputsValid(cliInputs?: AppSyncCLIInputs): Promise<boolean>;
    getCLIInputPayload(): AppSyncCLIInputs;
    cliInputFileExists(): boolean;
    saveCLIInputPayload(cliInputs: AppSyncCLIInputs): Promise<void>;
}
//# sourceMappingURL=appsync-api-input-state.d.ts.map