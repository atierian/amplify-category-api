"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectionSecrets = exports.removeVpcSchemaInspectorLambda = exports.deleteSchemaInspectorLambdaRole = exports.getDatabaseName = exports.getSecretsKey = exports.testDatabaseConnection = exports.deleteConnectionSecrets = exports.storeConnectionSecrets = exports.getExistingConnectionSecretNames = exports.getExistingConnectionDbConnectionConfig = exports.getExistingConnectionSecrets = exports.getVpcMetadataLambdaName = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_schema_generator_1 = require("@aws-amplify/graphql-schema-generator");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const client_lambda_1 = require("@aws-sdk/client-lambda");
const client_iam_1 = require("@aws-sdk/client-iam");
const amplify_meta_utils_1 = require("../amplify-meta-utils");
const appSync_rds_db_config_1 = require("../../service-walkthroughs/appSync-rds-db-config");
const ssmClient_1 = require("./ssmClient");
const secretNames = ['database', 'host', 'port', 'username', 'password'];
const secretNamesToDbConnectionConfigFields = {
    database: 'databaseNameSsmPath',
    host: 'hostnameSsmPath',
    port: 'portSsmPath',
    username: 'usernameSsmPath',
    password: 'passwordSsmPath',
};
const isConnectionSecrets = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
        return false;
    }
    return secretNames.every((secretName) => secretName in obj);
};
const getVpcMetadataLambdaName = (appId, envName) => {
    if (appId && envName) {
        return `${appId}-rds-schema-inspector-${envName}`;
    }
    throw new Error('AppId and environment name are required to generate the schema inspector lambda.');
};
exports.getVpcMetadataLambdaName = getVpcMetadataLambdaName;
const getExistingConnectionSecrets = async (context, secretsKey, apiName, envName) => {
    try {
        const environmentName = envName || amplify_cli_core_1.stateManager.getCurrentEnvName();
        const appId = amplify_cli_core_1.stateManager.getAppID();
        const ssmClient = await ssmClient_1.SSMClient.getInstance(context);
        const secrets = await ssmClient.getSecrets(secretNames.map((secret) => (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secret, secretsKey, apiName, environmentName, appId)));
        if (lodash_1.default.isEmpty(secrets)) {
            return undefined;
        }
        const existingSecrets = secretNames
            .map((secretName) => {
            const secretPath = (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secretName, secretsKey, apiName, environmentName, appId);
            const matchingSecret = secrets === null || secrets === void 0 ? void 0 : secrets.find((secret) => (secret === null || secret === void 0 ? void 0 : secret.secretName) === secretPath && !lodash_1.default.isEmpty(secret === null || secret === void 0 ? void 0 : secret.secretValue));
            const result = {};
            if (matchingSecret) {
                result[secretName] = matchingSecret.secretValue;
            }
            return result;
        })
            .reduce((result, current) => {
            if (!lodash_1.default.isEmpty(current)) {
                return Object.assign(result, current);
            }
            else {
                return current;
            }
        }, {});
        if (isConnectionSecrets(existingSecrets)) {
            return existingSecrets;
        }
        else {
            return undefined;
        }
    }
    catch (error) {
        return undefined;
    }
};
exports.getExistingConnectionSecrets = getExistingConnectionSecrets;
const getExistingConnectionDbConnectionConfig = (apiName, secretsKey) => {
    const environmentName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const appId = amplify_cli_core_1.stateManager.getAppID();
    const dbConnectionConfig = {};
    secretNames.forEach((name) => {
        const path = (0, graphql_transformer_core_1.getParameterStoreSecretPath)(name, secretsKey, apiName, environmentName, appId);
        dbConnectionConfig[secretNamesToDbConnectionConfigFields[name]] = path;
    });
    return dbConnectionConfig;
};
exports.getExistingConnectionDbConnectionConfig = getExistingConnectionDbConnectionConfig;
const getExistingConnectionSecretNames = async (context, apiName, secretsKey, envName) => {
    try {
        const environmentName = envName || amplify_cli_core_1.stateManager.getCurrentEnvName();
        const appId = amplify_cli_core_1.stateManager.getAppID();
        const ssmClient = await ssmClient_1.SSMClient.getInstance(context);
        const secrets = await ssmClient.getSecrets(secretNames.map((secret) => (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secret, secretsKey, apiName, environmentName, appId)));
        if (lodash_1.default.isEmpty(secrets)) {
            return undefined;
        }
        const existingSecrets = secretNames
            .map((secretName) => {
            const secretPath = (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secretName, secretsKey, apiName, environmentName, appId);
            const matchingSecret = secrets === null || secrets === void 0 ? void 0 : secrets.find((secret) => (secret === null || secret === void 0 ? void 0 : secret.secretName) === secretPath && !lodash_1.default.isEmpty(secret === null || secret === void 0 ? void 0 : secret.secretValue));
            const result = {};
            if (matchingSecret) {
                result[secretName] = secretPath;
            }
            return result;
        })
            .reduce((result, current) => {
            if (!lodash_1.default.isEmpty(current)) {
                return Object.assign(result, current);
            }
            else {
                return current;
            }
        }, {});
        if (isConnectionSecrets(existingSecrets)) {
            return existingSecrets;
        }
        else {
            return undefined;
        }
    }
    catch (error) {
        return undefined;
    }
};
exports.getExistingConnectionSecretNames = getExistingConnectionSecretNames;
const storeConnectionSecrets = async (context, secrets, apiName, secretsKey) => {
    const environmentName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const appId = amplify_cli_core_1.stateManager.getAppID();
    const ssmClient = await ssmClient_1.SSMClient.getInstance(context);
    secretNames.map(async (secret) => {
        var _a;
        const parameterPath = (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secret, secretsKey, apiName, environmentName, appId);
        await ssmClient.setSecret(parameterPath, (_a = secrets[secret]) === null || _a === void 0 ? void 0 : _a.toString());
    });
};
exports.storeConnectionSecrets = storeConnectionSecrets;
const deleteConnectionSecrets = async (context, secretsKey, apiName, envName) => {
    const environmentName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const { AmplifyAppId } = meta.providers.awscloudformation;
    if (!AmplifyAppId) {
        amplify_prompts_1.printer.debug(`No AppId found when deleting parameters for environment ${envName}`);
        return;
    }
    const ssmClient = await ssmClient_1.SSMClient.getInstance(context);
    const secretParameterPaths = secretNames.map((secret) => {
        return (0, graphql_transformer_core_1.getParameterStoreSecretPath)(secret, secretsKey, apiName, environmentName, AmplifyAppId);
    });
    await ssmClient.deleteSecrets(secretParameterPaths);
};
exports.deleteConnectionSecrets = deleteConnectionSecrets;
const testDatabaseConnection = async (config) => {
    let adapter;
    let canConnect = false;
    switch (config.engine) {
        case graphql_transformer_core_1.ImportedRDSType.MYSQL:
            adapter = new graphql_schema_generator_1.MySQLDataSourceAdapter(config);
            break;
        default:
            amplify_prompts_1.printer.error('Only MySQL Data Source is supported.');
    }
    try {
        canConnect = await adapter.test();
    }
    finally {
        adapter.cleanup();
    }
    return canConnect;
};
exports.testDatabaseConnection = testDatabaseConnection;
const getSecretsKey = () => 'schema';
exports.getSecretsKey = getSecretsKey;
const getDatabaseName = async (context, apiName, secretsKey) => {
    const environmentName = amplify_cli_core_1.stateManager.getCurrentEnvName();
    const appId = amplify_cli_core_1.stateManager.getAppID();
    const ssmClient = await ssmClient_1.SSMClient.getInstance(context);
    const secrets = await ssmClient.getSecrets([(0, graphql_transformer_core_1.getParameterStoreSecretPath)('database', secretsKey, apiName, environmentName, appId)]);
    if (lodash_1.default.isEmpty(secrets)) {
        return undefined;
    }
    return secrets[0].secretValue;
};
exports.getDatabaseName = getDatabaseName;
const deleteSchemaInspectorLambdaRole = async (lambdaName) => {
    const roleName = `${lambdaName}-execution-role`;
    const client = new client_iam_1.IAMClient({});
    const command = new client_iam_1.DeleteRoleCommand({ RoleName: roleName });
    await client.send(command);
};
exports.deleteSchemaInspectorLambdaRole = deleteSchemaInspectorLambdaRole;
const removeVpcSchemaInspectorLambda = async (context) => {
    try {
        const meta = amplify_cli_core_1.stateManager.getMeta();
        const { AmplifyAppId, Region } = meta.providers.awscloudformation;
        const { amplify } = context;
        const { envName } = amplify.getEnvInfo();
        const lambdaName = (0, exports.getVpcMetadataLambdaName)(AmplifyAppId, envName);
        const client = new client_lambda_1.LambdaClient({ region: Region });
        const command = new client_lambda_1.DeleteFunctionCommand({ FunctionName: lambdaName });
        await client.send(command);
        await (0, exports.deleteSchemaInspectorLambdaRole)(lambdaName);
    }
    catch (error) {
        amplify_prompts_1.printer.debug(`Error deleting the schema inspector lambda: ${error}`);
    }
};
exports.removeVpcSchemaInspectorLambda = removeVpcSchemaInspectorLambda;
const getConnectionSecrets = async (context, secretsKey, engine) => {
    const apiName = (0, amplify_meta_utils_1.getAppSyncAPIName)();
    const existingSecrets = await (0, exports.getExistingConnectionSecrets)(context, secretsKey, apiName);
    if (existingSecrets) {
        return {
            secrets: {
                engine,
                ...existingSecrets,
            },
            storeSecrets: false,
        };
    }
    const databaseConfig = await (0, appSync_rds_db_config_1.databaseConfigurationInputWalkthrough)(engine);
    return {
        secrets: {
            engine,
            ...databaseConfig,
        },
        storeSecrets: true,
    };
};
exports.getConnectionSecrets = getConnectionSecrets;
//# sourceMappingURL=database-resources.js.map