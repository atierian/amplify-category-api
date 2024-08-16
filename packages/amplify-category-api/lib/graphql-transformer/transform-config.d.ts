import { TransformConfig } from '@aws-amplify/graphql-transformer-core';
export interface ProjectOptions {
    projectDirectory?: string;
    transformersFactory: Function;
    transformersFactoryArgs: object[];
    currentCloudBackendDirectory: string;
    rootStackFileName?: string;
    dryRun?: boolean;
    disableFunctionOverrides?: boolean;
    disablePipelineFunctionOverrides?: boolean;
    disableResolverOverrides?: boolean;
    buildParameters?: Object;
}
export declare function loadConfig(projectDir: string): Promise<TransformConfig>;
export declare function writeConfig(projectDir: string, config: TransformConfig): Promise<TransformConfig>;
export declare function throwIfNotJSONExt(stackFile: string): void;
export declare function readSchema(projectDirectory: string): Promise<string>;
//# sourceMappingURL=transform-config.d.ts.map