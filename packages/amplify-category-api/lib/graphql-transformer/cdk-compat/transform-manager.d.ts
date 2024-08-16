import { Construct } from 'constructs';
import type { AssetProvider, NestedStackProvider, SynthParameters, TransformParameterProvider } from '@aws-amplify/graphql-transformer-interfaces';
import { DeploymentResources } from './deployment-resources';
import { TransformerRootStack } from './root-stack';
import { AmplifyApiGraphQlResourceStackTemplate } from './amplify-api-resource-stack-types';
export type OverrideConfig = {
    overrideFlag: boolean;
    applyOverride: (scope: Construct) => AmplifyApiGraphQlResourceStackTemplate;
};
export declare class TransformManager {
    private readonly overrideConfig;
    private readonly app;
    readonly rootStack: TransformerRootStack;
    private readonly stackSynthesizer;
    private readonly childStackSynthesizers;
    private synthParameters;
    private paramMap;
    constructor(overrideConfig: OverrideConfig | undefined, hasIamAuth: boolean, hasUserPoolAuth: boolean, adminRoles: string[], identityPoolId: string);
    getTransformScope(): Construct;
    getNestedStackProvider(): NestedStackProvider;
    getAssetProvider(): AssetProvider;
    private generateParameters;
    getParameterProvider(): TransformParameterProvider;
    getSynthParameters(): SynthParameters;
    generateDeploymentResources(): Omit<DeploymentResources, 'userOverriddenSlots'>;
    private getCloudFormationTemplates;
    private getMappingTemplates;
}
//# sourceMappingURL=transform-manager.d.ts.map