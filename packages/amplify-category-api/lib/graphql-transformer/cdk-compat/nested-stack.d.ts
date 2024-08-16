import { CfnResource, IStackSynthesizer, NestedStackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { TransformerRootStack } from './root-stack';
export type TransformerNestedStackProps = NestedStackProps & {
    synthesizer?: IStackSynthesizer;
};
export declare class TransformerNestedStack extends TransformerRootStack {
    readonly templateFile: string;
    readonly nestedStackResource?: CfnResource;
    private readonly parameters;
    private readonly resource;
    private readonly _contextualStackId;
    private readonly _contextualStackName;
    private _templateUrl?;
    private _rootStack;
    constructor(scope: Construct, id: string, props?: TransformerNestedStackProps);
    get stackName(): string;
    get stackId(): string;
    setParameter(name: string, value: string): void;
    private contextualAttribute;
}
//# sourceMappingURL=nested-stack.d.ts.map