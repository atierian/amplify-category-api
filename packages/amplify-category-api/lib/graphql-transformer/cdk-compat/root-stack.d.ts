import { CfnElement, Stack, ISynthesisSession } from 'aws-cdk-lib';
export declare class TransformerRootStack extends Stack {
    private readonly resourceTypeToPreserveLogicalName;
    protected allocateLogicalId: (cfnElement: CfnElement) => string;
    renderCloudFormationTemplate: (_: ISynthesisSession) => string;
}
//# sourceMappingURL=root-stack.d.ts.map