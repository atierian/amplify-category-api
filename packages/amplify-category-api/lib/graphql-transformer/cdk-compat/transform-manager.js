"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformManager = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const stack_synthesizer_1 = require("./stack-synthesizer");
const nested_stack_1 = require("./nested-stack");
const root_stack_1 = require("./root-stack");
const amplify_s3_asset_1 = require("./amplify-s3-asset");
class TransformManager {
    constructor(overrideConfig, hasIamAuth, hasUserPoolAuth, adminRoles, identityPoolId) {
        this.overrideConfig = overrideConfig;
        this.app = new aws_cdk_lib_1.App();
        this.stackSynthesizer = new stack_synthesizer_1.TransformerStackSythesizer();
        this.childStackSynthesizers = new Map();
        this.getCloudFormationTemplates = () => {
            let stacks = this.stackSynthesizer.collectStacks();
            this.childStackSynthesizers.forEach((synthesizer) => {
                stacks = new Map([...stacks.entries(), ...synthesizer.collectStacks()]);
            });
            return stacks;
        };
        this.getMappingTemplates = () => this.stackSynthesizer.collectMappingTemplates();
        this.rootStack = new root_stack_1.TransformerRootStack(this.app, 'transformer-root-stack', {
            synthesizer: this.stackSynthesizer,
        });
        this.generateParameters(hasIamAuth, hasUserPoolAuth, adminRoles, identityPoolId);
    }
    getTransformScope() {
        return this.rootStack;
    }
    getNestedStackProvider() {
        return {
            provide: (scope, name) => {
                const synthesizer = new stack_synthesizer_1.TransformerStackSythesizer();
                const newStack = new nested_stack_1.TransformerNestedStack(scope, name, {
                    synthesizer,
                });
                this.childStackSynthesizers.set(name, synthesizer);
                return newStack;
            },
        };
    }
    getAssetProvider() {
        return {
            provide: (scope, id, props) => new amplify_s3_asset_1.AmplifyS3Asset(scope, id, props),
        };
    }
    generateParameters(hasIamAuth, hasUserPoolAuth, adminRoles, identityPoolId) {
        this.paramMap = new Map();
        const envParameter = new aws_cdk_lib_1.CfnParameter(this.rootStack, 'env', {
            default: 'NONE',
            type: 'String',
        });
        this.paramMap.set('env', envParameter);
        const apiNameParameter = new aws_cdk_lib_1.CfnParameter(this.rootStack, 'AppSyncApiName', {
            default: 'AppSyncSimpleTransform',
            type: 'String',
        });
        this.paramMap.set('AppSyncApiName', apiNameParameter);
        this.synthParameters = {
            amplifyEnvironmentName: envParameter.valueAsString,
            apiName: apiNameParameter.valueAsString,
            adminRoles,
            identityPoolId,
        };
        if (hasIamAuth) {
            const authenticatedUserRoleNameParameter = new aws_cdk_lib_1.CfnParameter(this.rootStack, 'authRoleName', { type: 'String' });
            this.synthParameters.authenticatedUserRoleName = authenticatedUserRoleNameParameter.valueAsString;
            this.paramMap.set('authRoleName', authenticatedUserRoleNameParameter);
            const unauthenticatedUserRoleNameParameter = new aws_cdk_lib_1.CfnParameter(this.rootStack, 'unauthRoleName', { type: 'String' });
            this.synthParameters.unauthenticatedUserRoleName = unauthenticatedUserRoleNameParameter.valueAsString;
            this.paramMap.set('unauthRoleName', unauthenticatedUserRoleNameParameter);
        }
        if (hasUserPoolAuth) {
            const userPoolIdParameter = new aws_cdk_lib_1.CfnParameter(this.rootStack, 'AuthCognitoUserPoolId', { type: 'String' });
            this.synthParameters.userPoolId = userPoolIdParameter.valueAsString;
            this.paramMap.set('AuthCognitoUserPoolId', userPoolIdParameter);
        }
    }
    getParameterProvider() {
        return {
            provide: (name) => this.paramMap.get(name),
        };
    }
    getSynthParameters() {
        return this.synthParameters;
    }
    generateDeploymentResources() {
        var _a;
        if ((_a = this.overrideConfig) === null || _a === void 0 ? void 0 : _a.overrideFlag) {
            this.overrideConfig.applyOverride(this.rootStack);
        }
        this.app.synth({ force: true, skipValidation: true });
        const templates = this.getCloudFormationTemplates();
        const rootStackTemplate = templates.get('transformer-root-stack');
        const childStacks = {};
        for (const [templateName, template] of templates.entries()) {
            if (templateName !== 'transformer-root-stack') {
                childStacks[templateName] = template;
            }
        }
        const fileAssets = this.getMappingTemplates();
        const pipelineFunctions = {};
        const resolvers = {};
        const functions = {};
        for (const [templateName, template] of fileAssets) {
            if (templateName.startsWith('pipelineFunctions/')) {
                pipelineFunctions[templateName.replace('pipelineFunctions/', '')] = template;
            }
            else if (templateName.startsWith('resolvers/')) {
                resolvers[templateName.replace('resolvers/', '')] = template;
            }
            else if (templateName.startsWith('functions/')) {
                functions[templateName.replace('functions/', '')] = template;
            }
        }
        const schema = fileAssets.get('schema.graphql') || '';
        return {
            functions,
            pipelineFunctions,
            resolvers,
            schema,
            stacks: childStacks,
            rootStack: rootStackTemplate,
            stackMapping: {},
        };
    }
}
exports.TransformManager = TransformManager;
//# sourceMappingURL=transform-manager.js.map