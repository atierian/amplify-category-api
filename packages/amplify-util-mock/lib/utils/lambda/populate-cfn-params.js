"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateCfnParams = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const lodash_1 = __importDefault(require("lodash"));
const api_1 = require("../../api/api");
const populateCfnParams = async (print, resourceName, overrideApiToLocal = false) => {
    const cfnParams = [getCfnPseudoParams, getAmplifyMetaParams, getParametersJsonParams]
        .map((paramProvider) => paramProvider(print, resourceName, overrideApiToLocal))
        .reduce((acc, it) => ({ ...acc, ...it }), {});
    const resourceParamManager = (await (0, amplify_environment_parameters_1.ensureEnvParamManager)()).instance.getResourceParamManager(amplify_cli_core_1.AmplifyCategories.API, resourceName);
    return { ...cfnParams, ...resourceParamManager.getAllParams() };
};
exports.populateCfnParams = populateCfnParams;
const getCfnPseudoParams = () => {
    const env = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const region = lodash_1.default.get(meta, ['awscloudformation', 'Region'], 'us-test-1');
    const stackId = lodash_1.default.get(meta, ['awscloudformation', 'StackId'], 'fake-stack-id');
    const stackName = lodash_1.default.get(meta, ['awscloudformation', 'StackName'], 'local-testing');
    const accountIdMatcher = /arn:aws:cloudformation:.+:(?<accountId>\d+):stack\/.+/;
    const match = accountIdMatcher.exec(stackId);
    const accountId = match ? match.groups.accountId : '12345678910';
    return {
        env,
        'AWS::Region': region,
        'AWS::AccountId': accountId,
        'AWS::StackId': stackId,
        'AWS::StackName': stackName,
        'AWS::URLSuffix': 'amazonaws.com',
    };
};
const getAmplifyMetaParams = (print, resourceName, overrideApiToLocal = false) => {
    var _a, _b, _c, _d;
    const projectMeta = amplify_cli_core_1.stateManager.getMeta();
    if (!Array.isArray((_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _a === void 0 ? void 0 : _a[resourceName]) === null || _b === void 0 ? void 0 : _b.dependsOn)) {
        return {};
    }
    const dependencies = (_d = (_c = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta.function) === null || _c === void 0 ? void 0 : _c[resourceName]) === null || _d === void 0 ? void 0 : _d.dependsOn;
    return dependencies.reduce((acc, dependency) => {
        dependency.attributes.forEach((attribute) => {
            var _a, _b, _c;
            let val = (_c = (_b = (_a = projectMeta === null || projectMeta === void 0 ? void 0 : projectMeta[dependency.category]) === null || _a === void 0 ? void 0 : _a[dependency.resourceName]) === null || _b === void 0 ? void 0 : _b.output) === null || _c === void 0 ? void 0 : _c[attribute];
            if (!val) {
                print.warning(`No output found for attribute '${attribute}' on resource '${dependency.resourceName}' in category '${dependency.category}'`);
                print.warning('This attribute will be undefined in the mock environment until you run `amplify push`');
            }
            if (overrideApiToLocal) {
                switch (attribute) {
                    case api_1.GRAPHQL_API_ENDPOINT_OUTPUT:
                        val = `http://localhost:${api_1.MOCK_API_PORT}/graphql`;
                        break;
                    case api_1.GRAPHQL_API_KEY_OUTPUT:
                        val = api_1.MOCK_API_KEY;
                        break;
                }
            }
            acc[dependency.category + dependency.resourceName + attribute] = val;
        });
        return acc;
    }, {});
};
const getParametersJsonParams = (_, resourceName) => {
    var _a;
    return (_a = amplify_cli_core_1.stateManager.getResourceParametersJson(undefined, 'function', resourceName, { throwIfNotExist: false })) !== null && _a !== void 0 ? _a : {};
};
//# sourceMappingURL=populate-cfn-params.js.map