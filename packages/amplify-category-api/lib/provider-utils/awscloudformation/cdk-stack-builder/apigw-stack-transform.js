"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertCrudOperationsToCfnPermissions = exports.ApigwStackTransform = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const _1 = require(".");
const apigw_input_state_1 = require("../apigw-input-state");
const category_constants_1 = require("../../../category-constants");
class ApigwStackTransform {
    constructor(context, resourceName, cliInputState) {
        this._app = new cdk.App();
        this.resourceName = resourceName;
        this.cliInputsState = cliInputState !== null && cliInputState !== void 0 ? cliInputState : new apigw_input_state_1.ApigwInputState(context, resourceName);
        this.cliInputs = this.cliInputsState.getCliInputPayload();
        void this.cliInputsState.isCLIInputsValid();
    }
    async transform() {
        let authResourceName;
        const pathsWithUserPoolGroups = Object.entries(this.cliInputs.paths).filter(([_, path]) => { var _a; return !!((_a = path === null || path === void 0 ? void 0 : path.permissions) === null || _a === void 0 ? void 0 : _a.groups); });
        if (this.resourceName === category_constants_1.ADMIN_QUERIES_NAME || pathsWithUserPoolGroups.length > 0) {
            [authResourceName] = (0, amplify_cli_core_1.getAmplifyResourceByCategories)(amplify_cli_core_1.AmplifyCategories.AUTH).filter((resourceName) => resourceName !== 'userPoolGroups');
        }
        this.generateStack(authResourceName, pathsWithUserPoolGroups);
        await this.applyOverrides();
        this.generateCfnInputParameters();
        await this.saveBuildFiles();
    }
    generateCfnInputParameters() {
        this.cfnInputParams = this.resourceTemplateObj.getCfnParameterValues();
    }
    generateStack(authResourceName, pathsWithUserPoolGroups = []) {
        this.resourceTemplateObj = new _1.AmplifyApigwResourceStack(this._app, 'AmplifyApigwResourceStack', this.cliInputs);
        if (authResourceName) {
            const authRoleLogicalId = `auth${authResourceName}UserPoolId`;
            this.resourceTemplateObj.addCfnParameter({
                type: 'String',
                default: authRoleLogicalId,
            }, authRoleLogicalId);
            const uniqueUserPoolGroupsList = new Set();
            for (const [pathName, path] of pathsWithUserPoolGroups) {
                for (const [groupName, crudOps] of Object.entries(path.permissions.groups)) {
                    uniqueUserPoolGroupsList.add(groupName);
                    this.resourceTemplateObj.addIamPolicyResourceForUserPoolGroup(this.resourceName, authRoleLogicalId, groupName, pathName, convertCrudOperationsToCfnPermissions(crudOps));
                }
            }
            Array.from(uniqueUserPoolGroupsList).forEach((userPoolGroupName) => {
                this.resourceTemplateObj.addCfnParameter({
                    type: 'String',
                    default: `authuserPoolGroups${userPoolGroupName}GroupRole`,
                }, `authuserPoolGroups${userPoolGroupName}GroupRole`);
            });
        }
        const addedFunctions = new Set();
        for (const path of Object.values(this.cliInputs.paths)) {
            if (!addedFunctions.has(path.lambdaFunction)) {
                addedFunctions.add(path.lambdaFunction);
                this.resourceTemplateObj.addCfnParameter({
                    type: 'String',
                    default: `function${path.lambdaFunction}Name`,
                }, `function${path.lambdaFunction}Name`);
                this.resourceTemplateObj.addCfnParameter({
                    type: 'String',
                    default: `function${path.lambdaFunction}Arn`,
                }, `function${path.lambdaFunction}Arn`);
            }
        }
        this.resourceTemplateObj.addCfnParameter({
            type: 'String',
        }, 'env');
        this.resourceTemplateObj.addCfnCondition({
            expression: cdk.Fn.conditionEquals(cdk.Fn.ref('env'), 'NONE'),
        }, 'ShouldNotCreateEnvResources');
        this.resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.join('', [
                'https://',
                cdk.Fn.ref(this.cliInputsState.resourceName),
                '.execute-api.',
                cdk.Fn.ref('AWS::Region'),
                '.amazonaws.com/',
                cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')),
            ]),
            description: 'Root URL of the API gateway',
        }, 'RootUrl');
        this.resourceTemplateObj.addCfnOutput({
            value: this.resourceName,
            description: 'API Friendly name',
        }, 'ApiName');
        this.resourceTemplateObj.addCfnOutput({
            value: cdk.Fn.ref(this.resourceName),
            description: 'API ID (prefix of API URL)',
        }, 'ApiId');
        this.resourceName === category_constants_1.ADMIN_QUERIES_NAME
            ? this.resourceTemplateObj.generateAdminQueriesStack(this.resourceName, authResourceName)
            : this.resourceTemplateObj.generateStackResources(this.resourceName);
    }
    async applyOverrides() {
        const backendDir = amplify_cli_core_1.pathManager.getBackendDirPath();
        const overrideFilePath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
        const overrideJSFilePath = path.join(overrideFilePath, 'build', 'override.js');
        const isBuild = await (0, amplify_cli_core_1.buildOverrideDir)(backendDir, overrideFilePath);
        if (isBuild) {
            const { envName } = amplify_cli_core_1.stateManager.getLocalEnvInfo();
            const { projectName } = amplify_cli_core_1.stateManager.getProjectConfig();
            const projectInfo = {
                envName,
                projectName,
            };
            try {
                delete require.cache[require.resolve(overrideJSFilePath)];
                const overrideImport = require(overrideJSFilePath);
                if (overrideImport && (overrideImport === null || overrideImport === void 0 ? void 0 : overrideImport.override) && typeof (overrideImport === null || overrideImport === void 0 ? void 0 : overrideImport.override) === 'function') {
                    await overrideImport.override(this.resourceTemplateObj, projectInfo);
                }
            }
            catch (err) {
                throw new amplify_cli_core_1.AmplifyError('InvalidOverrideError', {
                    message: 'Executing overrides failed.',
                    details: err.message,
                    resolution: 'There may be runtime errors in your overrides file. If so, fix the errors and try again.',
                }, err);
            }
        }
    }
    async saveBuildFiles() {
        if (this.resourceTemplateObj) {
            this.cfn = amplify_cli_core_1.JSONUtilities.parse(this.resourceTemplateObj.renderCloudFormationTemplate());
        }
        const resourceDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.API, this.resourceName);
        fs.ensureDirSync(resourceDirPath);
        const buildDirPath = path.join(resourceDirPath, amplify_cli_core_1.PathConstants.BuildDirName);
        fs.ensureDirSync(buildDirPath);
        amplify_cli_core_1.stateManager.setResourceParametersJson(undefined, amplify_cli_core_1.AmplifyCategories.API, this.resourceName, this.cfnInputParams);
        const cfnFilePath = path.resolve(path.join(buildDirPath, `${this.resourceName}-cloudformation-template.json`));
        return (0, amplify_cli_core_1.writeCFNTemplate)(this.cfn, cfnFilePath);
    }
}
exports.ApigwStackTransform = ApigwStackTransform;
function convertCrudOperationsToCfnPermissions(crudOps) {
    const opMap = {
        [_1.CrudOperation.CREATE]: ['/POST'],
        [_1.CrudOperation.READ]: ['/GET'],
        [_1.CrudOperation.UPDATE]: ['/PUT', '/PATCH'],
        [_1.CrudOperation.DELETE]: ['/DELETE'],
    };
    return crudOps.flatMap((op) => opMap[op]);
}
exports.convertCrudOperationsToCfnPermissions = convertCrudOperationsToCfnPermissions;
//# sourceMappingURL=apigw-stack-transform.js.map