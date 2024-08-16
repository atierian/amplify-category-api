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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPermissionPolicies = exports.addDatasource = exports.migrateResource = exports.updateResource = exports.addResource = exports.console = exports.updateAdminQueriesApi = exports.addAdminQueriesApi = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const inquirer_1 = __importDefault(require("inquirer"));
const category_constants_1 = require("../../category-constants");
const apigw_input_state_1 = require("./apigw-input-state");
const cfn_api_artifact_handler_1 = require("./cfn-api-artifact-handler");
const containers_handler_1 = require("./containers-handler");
const legacy_add_resource_1 = require("./legacy-add-resource");
const containers_walkthrough_1 = require("./service-walkthroughs/containers-walkthrough");
const dynamic_imports_1 = require("./utils/dynamic-imports");
const edit_schema_flow_1 = require("./utils/edit-schema-flow");
const service_walkthrough_result_to_add_api_request_1 = require("./utils/service-walkthrough-result-to-add-api-request");
async function addAdminQueriesApi(context, apiProps) {
    const apigwInputState = new apigw_input_state_1.ApigwInputState(context, apiProps.apiName);
    return apigwInputState.addAdminQueriesResource(apiProps);
}
exports.addAdminQueriesApi = addAdminQueriesApi;
async function updateAdminQueriesApi(context, apiProps) {
    const apigwInputState = new apigw_input_state_1.ApigwInputState(context, apiProps.apiName);
    if (!apigwInputState.cliInputsFileExists()) {
        await apigwInputState.migrateAdminQueries(apiProps);
    }
    else {
        return apigwInputState.updateAdminQueriesResource(apiProps);
    }
}
exports.updateAdminQueriesApi = updateAdminQueriesApi;
async function console(context, service) {
    const { serviceWalkthroughFilename } = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
    const { openConsole } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!openConsole) {
        const errMessage = 'Opening console functionality not available for this option';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.NotImplementedError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    return openConsole(context);
}
exports.console = console;
async function addContainerResource(context, service, options, apiType) {
    const serviceWalkthroughFilename = 'containers-walkthrough.js';
    const serviceWalkthrough = await (0, dynamic_imports_1.getServiceWalkthrough)(serviceWalkthroughFilename);
    const serviceWalkthroughPromise = serviceWalkthrough(context, apiType);
    return await (0, containers_handler_1.addResource)(serviceWalkthroughPromise, context, category_constants_1.category, service, options, apiType);
}
async function addNonContainerResource(context, service, options) {
    const serviceMetadata = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const { serviceWalkthroughFilename, defaultValuesFilename } = serviceMetadata;
    const serviceWalkthrough = await (0, dynamic_imports_1.getServiceWalkthrough)(serviceWalkthroughFilename);
    const serviceWalkthroughPromise = serviceWalkthrough(context, serviceMetadata);
    switch (service) {
        case amplify_cli_core_1.AmplifySupportedService.APPSYNC: {
            const walkthroughResult = await serviceWalkthroughPromise;
            const askToEdit = walkthroughResult.askToEdit;
            const apiName = await (0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).createArtifacts((0, service_walkthrough_result_to_add_api_request_1.serviceWalkthroughResultToAddApiRequest)(walkthroughResult));
            if (askToEdit) {
                await (0, edit_schema_flow_1.editSchemaFlow)(context, apiName);
            }
            return apiName;
        }
        case amplify_cli_core_1.AmplifySupportedService.APIGW: {
            const apigwInputState = new apigw_input_state_1.ApigwInputState(context);
            return apigwInputState.addApigwResource(serviceWalkthroughPromise, options);
        }
        default:
            return (0, legacy_add_resource_1.legacyAddResource)(serviceWalkthroughPromise, context, category_constants_1.category, service, options);
    }
}
async function addResource(context, service, options) {
    let useContainerResource = false;
    let apiType = containers_walkthrough_1.API_TYPE.GRAPHQL;
    if (isContainersEnabled(context)) {
        switch (service) {
            case amplify_cli_core_1.AmplifySupportedService.APPSYNC:
                useContainerResource = await isGraphQLContainer();
                apiType = containers_walkthrough_1.API_TYPE.GRAPHQL;
                break;
            case amplify_cli_core_1.AmplifySupportedService.APIGW:
                useContainerResource = await isRestContainer();
                apiType = containers_walkthrough_1.API_TYPE.REST;
                break;
            default:
                throw new Error(`${service} not exists`);
        }
    }
    return useContainerResource
        ? addContainerResource(context, service, options, apiType)
        : addNonContainerResource(context, service, options);
}
exports.addResource = addResource;
function isContainersEnabled(context) {
    const { frontend } = context.amplify.getProjectConfig();
    if (frontend) {
        const { config: { ServerlessContainers = false } = {} } = context.amplify.getProjectConfig()[frontend] || {};
        return ServerlessContainers;
    }
    return false;
}
async function isGraphQLContainer() {
    const { graphqlSelection } = await inquirer_1.default.prompt({
        name: 'graphqlSelection',
        message: 'Which service would you like to use',
        type: 'list',
        choices: [
            {
                name: amplify_cli_core_1.AmplifySupportedService.APPSYNC,
                value: false,
            },
            {
                name: 'AWS Fargate (Container-based)',
                value: true,
            },
        ],
    });
    return graphqlSelection;
}
async function isRestContainer() {
    const { restSelection } = await inquirer_1.default.prompt({
        name: 'restSelection',
        message: 'Which service would you like to use',
        type: 'list',
        choices: [
            {
                name: 'API Gateway + Lambda',
                value: false,
            },
            {
                name: 'API Gateway + AWS Fargate (Container-based)',
                value: true,
            },
        ],
    });
    return restSelection;
}
async function updateResource(context, category, service, options) {
    var _a;
    const allowContainers = (_a = options === null || options === void 0 ? void 0 : options.allowContainers) !== null && _a !== void 0 ? _a : true;
    let useContainerResource = false;
    let apiType = containers_walkthrough_1.API_TYPE.GRAPHQL;
    if (allowContainers && isContainersEnabled(context)) {
        const { hasAPIGatewayContainerResource, hasAPIGatewayLambdaResource, hasGraphQLAppSyncResource, hasGraphqlContainerResource } = await describeApiResourcesBySubCategory(context);
        switch (service) {
            case amplify_cli_core_1.AmplifySupportedService.APPSYNC:
                if (hasGraphQLAppSyncResource && hasGraphqlContainerResource) {
                    useContainerResource = await isGraphQLContainer();
                }
                else if (hasGraphqlContainerResource) {
                    useContainerResource = true;
                }
                else {
                    useContainerResource = false;
                }
                apiType = containers_walkthrough_1.API_TYPE.GRAPHQL;
                break;
            case amplify_cli_core_1.AmplifySupportedService.APIGW:
                if (hasAPIGatewayContainerResource && hasAPIGatewayLambdaResource) {
                    useContainerResource = await isRestContainer();
                }
                else if (hasAPIGatewayContainerResource) {
                    useContainerResource = true;
                }
                else {
                    useContainerResource = false;
                }
                apiType = containers_walkthrough_1.API_TYPE.REST;
                break;
            default:
                throw new Error(`${service} not exists`);
        }
    }
    return useContainerResource ? updateContainerResource(context, category, service, apiType) : updateNonContainerResource(context, service);
}
exports.updateResource = updateResource;
async function describeApiResourcesBySubCategory(context) {
    const { allResources } = await context.amplify.getResourceStatus();
    const resources = allResources.filter((resource) => resource.category === category_constants_1.category && resource.mobileHubMigrated !== true);
    let hasAPIGatewayContainerResource = false;
    let hasAPIGatewayLambdaResource = false;
    let hasGraphQLAppSyncResource = false;
    let hasGraphqlContainerResource = false;
    resources.forEach((resource) => {
        hasAPIGatewayContainerResource =
            hasAPIGatewayContainerResource || (resource.service === 'ElasticContainer' && resource.apiType === containers_walkthrough_1.API_TYPE.REST);
        hasAPIGatewayLambdaResource = hasAPIGatewayLambdaResource || resource.service === amplify_cli_core_1.AmplifySupportedService.APIGW;
        hasGraphQLAppSyncResource = hasGraphQLAppSyncResource || resource.service === amplify_cli_core_1.AmplifySupportedService.APPSYNC;
        hasGraphqlContainerResource =
            hasGraphqlContainerResource || (resource.service === 'ElasticContainer' && resource.apiType === containers_walkthrough_1.API_TYPE.GRAPHQL);
    });
    return {
        hasAPIGatewayLambdaResource,
        hasAPIGatewayContainerResource,
        hasGraphQLAppSyncResource,
        hasGraphqlContainerResource,
    };
}
async function updateContainerResource(context, category, service, apiType) {
    var _a;
    const serviceWalkthroughFilename = 'containers-walkthrough';
    const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
    const { updateWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!updateWalkthrough) {
        const errMessage = 'Update functionality not available for this option';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.NotImplementedError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const updateWalkthroughPromise = updateWalkthrough(context, apiType);
    await (0, containers_handler_1.updateResource)(updateWalkthroughPromise, context, category);
}
async function updateNonContainerResource(context, service) {
    var _a;
    const serviceMetadata = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const { defaultValuesFilename, serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
    const { updateWalkthrough } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!updateWalkthrough) {
        const errMessage = 'Update functionality not available for this option';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.NotImplementedError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const updateWalkthroughPromise = updateWalkthrough(context, defaultValuesFilename, serviceMetadata);
    switch (service) {
        case amplify_cli_core_1.AmplifySupportedService.APPSYNC:
            return updateWalkthroughPromise.then((0, cfn_api_artifact_handler_1.getCfnApiArtifactHandler)(context).updateArtifacts);
        default: {
            const apigwInputState = new apigw_input_state_1.ApigwInputState(context);
            return apigwInputState.updateApigwResource(updateWalkthroughPromise);
        }
    }
}
async function migrateResource(context, projectPath, service, resourceName) {
    if (service === 'ElasticContainer') {
        return migrateResourceContainer(context, projectPath, service, resourceName);
    }
    else {
        return migrateResourceNonContainer(context, projectPath, service, resourceName);
    }
}
exports.migrateResource = migrateResource;
async function migrateResourceContainer(context, projectPath, service, resourceName) {
    amplify_prompts_1.printer.info(`No migration required for ${resourceName}`);
    return;
}
async function migrateResourceNonContainer(context, projectPath, service, resourceName) {
    var _a;
    const serviceMetadata = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const { serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
    const { migrate } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!migrate) {
        amplify_prompts_1.printer.info(`No migration required for ${resourceName}`);
        return;
    }
    return await migrate(context, projectPath, resourceName);
}
async function addDatasource(context, category, datasource) {
    const serviceMetadata = await (0, dynamic_imports_1.datasourceMetadataFor)(datasource);
    const { serviceWalkthroughFilename } = serviceMetadata;
    return (await (0, dynamic_imports_1.getServiceWalkthrough)(serviceWalkthroughFilename))(context, serviceMetadata);
}
exports.addDatasource = addDatasource;
async function getPermissionPolicies(context, service, resourceName, crudOptions) {
    if (service === 'ElasticContainer') {
        return getPermissionPoliciesContainer(context, service, resourceName, crudOptions);
    }
    else {
        return getPermissionPoliciesNonContainer(service, resourceName, crudOptions);
    }
}
exports.getPermissionPolicies = getPermissionPolicies;
async function getPermissionPoliciesContainer(context, service, resourceName, crudOptions) {
    return (0, containers_walkthrough_1.getPermissionPolicies)(context, service, resourceName, crudOptions);
}
async function getPermissionPoliciesNonContainer(service, resourceName, crudOptions) {
    var _a;
    const serviceMetadata = await (0, dynamic_imports_1.serviceMetadataFor)(service);
    const { serviceWalkthroughFilename } = serviceMetadata;
    const serviceWalkthroughSrc = path.join(__dirname, 'service-walkthroughs', serviceWalkthroughFilename);
    const { getIAMPolicies } = await (_a = serviceWalkthroughSrc, Promise.resolve().then(() => __importStar(require(_a))));
    if (!getIAMPolicies) {
        amplify_prompts_1.printer.info(`No policies found for ${resourceName}`);
        return;
    }
    return getIAMPolicies(resourceName, crudOptions);
}
//# sourceMappingURL=index.js.map