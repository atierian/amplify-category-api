export interface Template {
    AWSTemplateFormatVersion?: string;
    Description?: string;
    Metadata?: Record<string, any>;
    Parameters?: Record<string, any>;
    Mappings?: {
        [key: string]: {
            [key: string]: Record<string, string | number | string[]>;
        };
    };
    Conditions?: Record<string, any>;
    Transform?: any;
    Resources?: Record<string, any>;
    Outputs?: Record<string, any>;
}
export interface StackMapping {
    [resourceId: string]: string;
}
export interface ResolversFunctionsAndSchema {
    resolvers: Record<string, string>;
    pipelineFunctions: Record<string, string>;
    functions: Record<string, string>;
    schema: string;
    userOverriddenSlots: string[];
}
export interface NestedStacks {
    rootStack: Template;
    stacks: Record<string, Template>;
    stackMapping: StackMapping;
}
export interface DeploymentResources extends ResolversFunctionsAndSchema, NestedStacks {
}
//# sourceMappingURL=deployment-resources.d.ts.map