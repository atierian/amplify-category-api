"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertToAppsyncResourceObj = exports.getStackMeta = exports.stacksTypes = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.stacksTypes = {
    API: 'api',
    MODELS: 'models',
    HttpStack: 'http',
    FunctionDirectiveStack: 'function',
    PredictionsDirectiveStack: 'predictions',
    SearchableStack: 'openSearch',
};
const rootStackNameInConstruct = 'transformer-root-stack';
const getStackMeta = (constructPathArr, id, nestedStackArr, node) => {
    var _a;
    const resource = node;
    if (nestedStackArr.find((val) => val === constructPathArr[1])) {
        const nestedStackName = nestedStackArr.find((val) => val === constructPathArr[1]);
        const resourceName = constructPathArr.filter((path) => path !== nestedStackName && path !== rootStackNameInConstruct).join('');
        return {
            resourceName,
            resourceType: resource.cfnResourceType,
            nestedStack: {
                stackName: nestedStackName,
                stackType: (_a = exports.stacksTypes[nestedStackName]) !== null && _a !== void 0 ? _a : exports.stacksTypes['MODELS'],
            },
        };
    }
    else {
        const resourceName = constructPathArr.filter((path) => path !== rootStackNameInConstruct).join('');
        return {
            resourceName: id === 'Resource' ? resourceName : `${resourceName}${id}`,
            resourceType: resource.cfnResourceType,
            rootStack: {
                stackName: constructPathArr[0],
                stackType: exports.stacksTypes.API,
            },
        };
    }
};
exports.getStackMeta = getStackMeta;
const convertToAppsyncResourceObj = (amplifyObj) => {
    let appsyncResourceObject = {};
    Object.keys(amplifyObj).forEach((keys) => {
        if (keys === 'api') {
            appsyncResourceObject.api = amplifyObj.api;
        }
        else if (keys === 'models' && !lodash_1.default.isEmpty(amplifyObj[keys])) {
            appsyncResourceObject.models = {};
            Object.keys(amplifyObj.models).forEach((key) => {
                appsyncResourceObject.models[key] = generateModelDirectiveObject(amplifyObj.models[key]);
            });
        }
        else if (keys === 'function' && !lodash_1.default.isEmpty(amplifyObj[keys])) {
            const functionStackObj = amplifyObj.function.FunctionDirectiveStack;
            appsyncResourceObject.function = generateFunctionDirectiveObject(functionStackObj);
        }
        else if (keys === 'http' && !lodash_1.default.isEmpty(amplifyObj[keys])) {
            const httpStackObj = amplifyObj.http.HttpStack;
            appsyncResourceObject.http = generateHttpDirectiveObject(httpStackObj);
        }
        else if (keys === 'openSearch' && !lodash_1.default.isEmpty(amplifyObj[keys])) {
            const openSearchStackObj = amplifyObj.openSearch.SearchableStack;
            appsyncResourceObject.opensearch = generateOpenSearchDirectiveObject(openSearchStackObj);
        }
        else if (keys === 'predictions' && !lodash_1.default.isEmpty(amplifyObj[keys])) {
            appsyncResourceObject.predictions = amplifyObj.predictions.PredictionsDirectiveStack;
            if (!lodash_1.default.isEmpty(amplifyObj.predictions.PredictionsDirectiveStack['predictionsLambda.handler'])) {
                appsyncResourceObject.predictions.predictionsLambdaFunction =
                    amplifyObj.predictions.PredictionsDirectiveStack['predictionsLambda.handler'];
            }
        }
    });
    return appsyncResourceObject;
};
exports.convertToAppsyncResourceObj = convertToAppsyncResourceObj;
const generateFunctionDirectiveObject = (functionStackObj) => {
    let functionObj = {};
    Object.keys(functionStackObj).forEach((key) => {
        if (key.endsWith('resolvers')) {
            functionObj.resolvers = functionStackObj.resolvers;
        }
        else if (key.endsWith('appsyncFunctions')) {
            functionObj.appsyncFunctions = functionStackObj.appsyncFunctions;
        }
        else if (functionStackObj[key].cfnResourceType.includes('DataSource')) {
            if (!functionObj.lambdaDataSource) {
                functionObj.lambdaDataSource = {};
            }
            const name = key.substring(0, key.indexOf('LambdaDataSource'));
            functionObj.lambdaDataSource[name] = functionStackObj[key];
        }
        else if (functionStackObj[key].cfnResourceType.includes('Role')) {
            if (!functionObj.lambdaDataSourceRole) {
                functionObj.lambdaDataSourceRole = {};
            }
            const name = key.substring(0, key.indexOf('LambdaDataSourceServiceRole'));
            functionObj.lambdaDataSourceRole[name] = functionStackObj[key];
        }
        else if (functionStackObj[key].cfnResourceType.includes('Policy')) {
            if (!functionObj.lambdaDataSourceServiceRoleDefaultPolicy) {
                functionObj.lambdaDataSourceServiceRoleDefaultPolicy = {};
            }
            const name = key.substring(0, key.indexOf('LambdaDataSourceServiceRoleDefaultPolicy'));
            functionObj.lambdaDataSourceServiceRoleDefaultPolicy[name] = functionStackObj[key];
        }
    });
    return functionObj;
};
const generateHttpDirectiveObject = (httpStackObj) => {
    let httpObj = {};
    Object.keys(httpStackObj).forEach((key) => {
        if (key.endsWith('resolvers')) {
            httpObj.resolvers = httpStackObj.resolvers;
        }
        else if (key.endsWith('appsyncFunctions')) {
            httpObj.appsyncFunctions = httpStackObj.appsyncFunctions;
        }
        else if (httpStackObj[key].cfnResourceType.includes('DataSource')) {
            if (!httpObj.httpsDataSource) {
                httpObj.httpsDataSource = {};
            }
            const name = key.substring(0, key.indexOf('DataSource'));
            httpObj.httpsDataSource[name] = httpStackObj[key];
        }
        else if (httpStackObj[key].cfnResourceType.includes('Role')) {
            if (!httpObj.httpDataSourceServiceRole) {
                httpObj.httpDataSourceServiceRole = {};
            }
            const name = key.substring(0, key.indexOf('DataSourceServiceRole'));
            httpObj.httpDataSourceServiceRole[name] = httpStackObj[key];
        }
    });
    return httpObj;
};
const generateOpenSearchDirectiveObject = (opensearchStackObj) => {
    let opensearchObj = lodash_1.default.pick(opensearchStackObj, 'OpenSearchDataSource', 'OpenSearchAccessIAMRole', 'OpenSearchAccessIAMRoleDefaultPolicy', 'OpenSearchDomain', 'OpenSearchStreamingLambdaIAMRole', 'OpenSearchStreamingLambdaIAMRoleDefaultPolicy', 'CloudwatchLogsAccess', 'OpenSearchStreamingLambdaFunction', 'resolvers', 'appsyncFunctions');
    Object.keys(opensearchStackObj).forEach((key) => {
        if (key !== 'resolvers' && key !== 'appsyncFunctions' && opensearchStackObj[key].cfnResourceType.includes('EventSourceMapping')) {
            if (!opensearchObj.OpenSearchModelLambdaMapping) {
                opensearchObj.OpenSearchModelLambdaMapping = {};
            }
            const name = key.substring(0, key.indexOf('LambdaMapping'));
            const modeName = key.substring('Searchable'.length, name.length);
            opensearchObj.OpenSearchModelLambdaMapping[modeName] = opensearchStackObj[key];
        }
    });
    return opensearchObj;
};
const generateModelDirectiveObject = (modelStackObj) => {
    let modelObj = lodash_1.default.pick(modelStackObj, 'appsyncFunctions', 'DynamoDBAccess', 'InvokdeLambdaFunction', 'resolvers');
    let strippedModelObj = lodash_1.default.omit(modelStackObj, 'appsyncFunctions', 'DynamoDBAccess', 'InvokdeLambdaFunction', 'resolvers');
    Object.keys(strippedModelObj).forEach((key) => {
        if (strippedModelObj[key].cfnResourceType.includes('DataSource')) {
            modelObj.modelDatasource = modelStackObj[key];
        }
        if (strippedModelObj[key].cfnResourceType.includes('Role')) {
            modelObj.modelIamRole = modelStackObj[key];
        }
        if (strippedModelObj[key].cfnResourceType.includes('Policy')) {
            modelObj.modelIamRoleDefaultPolicy = modelStackObj[key];
        }
        if (strippedModelObj[key].cfnResourceType.includes('Table')) {
            modelObj.modelDDBTable = modelStackObj[key];
        }
    });
    return modelObj;
};
//# sourceMappingURL=utils.js.map