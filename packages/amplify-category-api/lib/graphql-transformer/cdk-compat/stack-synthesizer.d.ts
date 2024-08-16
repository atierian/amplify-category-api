import { ISynthesisSession, Stack, LegacyStackSynthesizer, FileAssetSource, FileAssetLocation } from 'aws-cdk-lib';
import { Template } from './deployment-resources';
export declare class TransformerStackSythesizer extends LegacyStackSynthesizer {
    private readonly stackAssets;
    private readonly mapingTemplateAssets;
    private _deploymentBucket?;
    private _deploymentRootKey?;
    protected synthesizeStackTemplate(stack: Stack, session: ISynthesisSession): void;
    protected synthesizeTemplate(session: ISynthesisSession, _?: string): FileAssetSource;
    setStackAsset(templateName: string, template: string): void;
    collectStacks(): Map<string, Template>;
    setMappingTemplates(templateName: string, template: string): void;
    collectMappingTemplates(): Map<string, string>;
    addFileAsset(asset: FileAssetSource): FileAssetLocation;
    private ensureDeployementParameters;
    private get deploymentBucket();
    private get deploymentRootKey();
}
export declare function assertNotNull<A>(x: A | undefined): asserts x is NonNullable<A>;
//# sourceMappingURL=stack-synthesizer.d.ts.map