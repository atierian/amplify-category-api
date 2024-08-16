import { $TSContext, Template } from '@aws-amplify/amplify-cli-core';
import { AmplifyApigwResourceStack, ApigwInputs, CrudOperation, Path } from '.';
import { ApigwInputState } from '../apigw-input-state';
export declare class ApigwStackTransform {
    cliInputs: ApigwInputs;
    resourceTemplateObj: AmplifyApigwResourceStack | undefined;
    cliInputsState: ApigwInputState;
    cfn: Template;
    cfnInputParams: Record<string, any>;
    resourceName: string;
    private _app;
    constructor(context: $TSContext, resourceName: string, cliInputState?: ApigwInputState);
    transform(): Promise<void>;
    generateCfnInputParameters(): void;
    generateStack(authResourceName?: string, pathsWithUserPoolGroups?: [string, Path][]): void;
    applyOverrides(): Promise<void>;
    private saveBuildFiles;
}
export declare function convertCrudOperationsToCfnPermissions(crudOps: CrudOperation[]): string[];
//# sourceMappingURL=apigw-stack-transform.d.ts.map