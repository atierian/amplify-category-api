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
exports.populateLambdaMockEnvVars = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const dotenv = __importStar(require("dotenv"));
const amplify_provider_awscloudformation_1 = require("@aws-amplify/amplify-provider-awscloudformation");
const populateLambdaMockEnvVars = async (context, processedLambda) => {
    processedLambda.environment = (await Promise.all([getAwsCredentials, getStaticDefaults, getDynamicDefaults, getDotEnvValues].map((envVarGetter) => envVarGetter(processedLambda, context)))).reduce((acc, it) => ({ ...acc, ...it }), processedLambda.environment);
};
exports.populateLambdaMockEnvVars = populateLambdaMockEnvVars;
const getAwsCredentials = async (_, context) => {
    const env = amplify_cli_core_1.stateManager.getLocalEnvInfo().envName;
    let appId;
    try {
        appId = (0, amplify_provider_awscloudformation_1.resolveAppId)(context);
    }
    catch (_a) {
    }
    const awsConfigInfo = await (0, amplify_provider_awscloudformation_1.loadConfigurationForEnv)(context, env, appId);
    return {
        AWS_ACCESS_KEY_ID: awsConfigInfo.accessKeyId,
        AWS_SECRET_ACCESS_KEY: awsConfigInfo.secretAccessKey,
        AWS_SESSION_TOKEN: awsConfigInfo.sessionToken,
    };
};
const getStaticDefaults = () => ({
    _X_AMZN_TRACE_ID: 'amplify-mock-x-amzn-trace-id',
    AWS_EXECUTION_ENV: 'AWS_Lambda_amplify-mock',
    AWS_LAMBDA_FUNCTION_MEMORY_SIZE: '128',
    AWS_LAMBDA_FUNCTION_VERSION: '1',
    AWS_LAMBDA_INITIALIZATION_TYPE: 'on-demand',
    AWS_LAMBDA_LOG_GROUP_NAME: 'amplify-mock-aws-lambda-log-group-name',
    AWS_LAMBDA_LOG_STREAM_NAME: 'amplify-mock-aws-lambda-log-stream-name',
    TZ: 'UTC',
});
const getDynamicDefaults = (processedLambda) => {
    var _a, _b;
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const region = (_b = (_a = meta === null || meta === void 0 ? void 0 : meta.providers) === null || _a === void 0 ? void 0 : _a.awscloudformation) === null || _b === void 0 ? void 0 : _b.Region;
    const lambdaPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.FUNCTION, processedLambda.name);
    return {
        _HANDLER: processedLambda.handler,
        AWS_REGION: region,
        AWS_LAMBDA_FUNCTION_NAME: processedLambda.name,
        LAMBDA_TASK_ROOT: lambdaPath,
        LAMBDA_RUNTIME_DIR: lambdaPath,
    };
};
const getDotEnvValues = (processedLambda) => {
    try {
        const result = dotenv.config({
            path: path.join(amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, amplify_cli_core_1.AmplifyCategories.FUNCTION, processedLambda.name), '.env'),
        });
        if (result.error) {
            throw result.error;
        }
        return result.parsed;
    }
    catch (_a) {
    }
};
//# sourceMappingURL=populate-lambda-mock-env-vars.js.map