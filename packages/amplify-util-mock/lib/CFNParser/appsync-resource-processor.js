"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processTransformerStacks = exports.processCloudFormationResults = exports.processApiResources = void 0;
const amplify_appsync_simulator_1 = require("@aws-amplify/amplify-appsync-simulator");
const resource_processors_1 = require("./resource-processors");
const index_1 = require("./stack/index");
const CFN_DEFAULT_PARAMS = {
    'AWS::Region': 'us-east-1-fake',
    'AWS::AccountId': '12345678910',
    'AWS::StackId': 'fake-stackId',
    'AWS::StackName': 'local-testing',
    'AWS::URLSuffix': 'amazonaws.com',
};
const RESOLVER_TEMPLATE_LOCATION_PREFIX = 's3://${S3DeploymentBucket}/${S3DeploymentRootKey}/';
function processApiResources(resources, transformResult, appSyncConfig) {
    Object.values(resources).forEach((resource) => {
        const { Type: resourceType } = resource;
        const result = resource.result;
        switch (resourceType) {
            case 'AWS::AppSync::DataSource':
                appSyncConfig.dataSources.push(result);
                break;
            case 'AWS::AppSync::Resolver':
                appSyncConfig.resolvers.push({
                    ...result,
                    requestMappingTemplateLocation: result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                    responseMappingTemplateLocation: result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                });
                break;
            case 'AWS::DynamoDB::Table':
                appSyncConfig.tables.push(result);
                break;
            case 'AWS::AppSync::FunctionConfiguration':
                appSyncConfig.functions.push({
                    ...result,
                    requestMappingTemplateLocation: result.requestMappingTemplateLocation && result.requestMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                    responseMappingTemplateLocation: result.responseMappingTemplateLocation && result.responseMappingTemplateLocation.replace(RESOLVER_TEMPLATE_LOCATION_PREFIX, ''),
                });
                break;
            case 'AWS::AppSync::GraphQLSchema':
                if (result.definition) {
                    appSyncConfig.schema = { content: result.definition };
                }
                else {
                    appSyncConfig.schema = { path: 'schema.graphql', content: transformResult.schema };
                }
                break;
            case 'AWS::AppSync::GraphQLApi': {
                const resource = result;
                appSyncConfig.appSync.name = resource.name;
                appSyncConfig.appSync.defaultAuthenticationType = resource.defaultAuthenticationType;
                appSyncConfig.appSync.additionalAuthenticationProviders = resource.additionalAuthenticationProviders || [];
                break;
            }
            case 'AWS::AppSync::ApiKey':
                appSyncConfig.appSync.apiKey = result.ApiKey;
                break;
            case 'AWS::CloudFormation::Stack':
                processApiResources(result.resources, transformResult, appSyncConfig);
                break;
        }
    });
}
exports.processApiResources = processApiResources;
function processCloudFormationResults(resources, transformResult) {
    const processedResources = {
        schema: {
            content: '',
        },
        resolvers: [],
        functions: [],
        dataSources: [],
        mappingTemplates: [],
        tables: [],
        appSync: {
            name: '',
            defaultAuthenticationType: {
                authenticationType: amplify_appsync_simulator_1.AmplifyAppSyncSimulatorAuthenticationType.API_KEY,
            },
            apiKey: null,
            additionalAuthenticationProviders: [],
        },
    };
    processApiResources(resources, transformResult, processedResources);
    Object.entries(transformResult.resolvers).forEach(([path, content]) => {
        processedResources.mappingTemplates.push({
            path: `resolvers/${path}`,
            content: content,
        });
    });
    Object.entries(transformResult.pipelineFunctions).forEach(([path, content]) => {
        processedResources.mappingTemplates.push({
            path: `pipelineFunctions/${path}`,
            content: content,
        });
    });
    return processedResources;
}
exports.processCloudFormationResults = processCloudFormationResults;
function processTransformerStacks(transformResult, params = {}) {
    (0, resource_processors_1.registerAppSyncResourceProcessor)();
    (0, resource_processors_1.registerIAMResourceProcessor)();
    (0, resource_processors_1.registerLambdaResourceProcessor)();
    (0, resource_processors_1.registerOpenSearchResourceProcessor)();
    const rootStack = JSON.parse(JSON.stringify(transformResult.rootStack));
    const cfnParams = {
        ...CFN_DEFAULT_PARAMS,
        env: '${env}',
        S3DeploymentBucket: '${S3DeploymentBucket}',
        S3DeploymentRootKey: '${S3DeploymentRootKey}',
        CreateAPIKey: 1,
        ...params,
    };
    const cfnTemplateFetcher = {
        getCloudFormationStackTemplate: (templateName) => {
            const templateRegex = new RegExp('^https://s3.(.+\\.)?amazonaws.com/\\${S3DeploymentBucket}/\\${S3DeploymentRootKey}/stacks/');
            const template = templateName.replace(templateRegex, '');
            const stackTemplate = Object.keys(transformResult.stacks).includes(template)
                ? transformResult.stacks[template]
                : transformResult.stacks[template.replace('.json', '')];
            if (stackTemplate && typeof stackTemplate === 'undefined') {
                throw new Error(`Invalid cloud formation template ${templateName}`);
            }
            return stackTemplate;
        },
    };
    const processedStacks = (0, index_1.processCloudFormationStack)(rootStack, { authRoleName: 'authRole', unauthRoleName: 'unAuthRole', ...cfnParams }, {}, cfnTemplateFetcher);
    return processCloudFormationResults(processedStacks.resources, transformResult);
}
exports.processTransformerStacks = processTransformerStacks;
//# sourceMappingURL=appsync-resource-processor.js.map