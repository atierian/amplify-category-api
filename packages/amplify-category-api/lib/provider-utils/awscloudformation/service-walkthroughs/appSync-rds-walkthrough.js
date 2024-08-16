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
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceWalkthrough = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const chalk_1 = __importDefault(require("chalk"));
const graphql_relational_schema_transformer_1 = require("graphql-relational-schema-transformer");
const ora_1 = __importDefault(require("ora"));
const amplify_provider_awscloudformation_1 = require("@aws-amplify/amplify-provider-awscloudformation");
const spinner = (0, ora_1.default)('');
const category = 'api';
const providerName = 'awscloudformation';
async function serviceWalkthrough(context, datasourceMetadata) {
    var _a, _b;
    const amplifyMeta = context.amplify.getProjectMeta();
    if (amplifyMeta == null || amplifyMeta[category] == null || Object.keys(amplifyMeta[category]).length === 0) {
        const errMessage = 'You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    let appSyncApi;
    const apis = Object.keys(amplifyMeta[category]);
    for (const api of apis) {
        if (amplifyMeta[category][api].service === 'AppSync') {
            appSyncApi = api;
            break;
        }
    }
    if (!appSyncApi) {
        const errMessage = 'You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const { inputs, availableRegions } = datasourceMetadata;
    const cfnJson = amplify_cli_core_1.JSONUtilities.readJson(path.join(amplify_cli_core_1.pathManager.getCurrentCloudRootStackDirPath(amplify_cli_core_1.pathManager.findProjectRoot()), amplify_provider_awscloudformation_1.rootStackFileName));
    const cfnJsonParameters = ((_b = (_a = cfnJson === null || cfnJson === void 0 ? void 0 : cfnJson.Resources[`api${appSyncApi}`]) === null || _a === void 0 ? void 0 : _a.Properties) === null || _b === void 0 ? void 0 : _b.Parameters) || {};
    let selectedRegion = cfnJsonParameters === null || cfnJsonParameters === void 0 ? void 0 : cfnJsonParameters.rdsRegion;
    if (!selectedRegion) {
        selectedRegion = await promptWalkthroughQuestion(inputs, 0, availableRegions);
    }
    const AWS = await getAwsClient(context, 'list');
    AWS.config.update({
        region: selectedRegion,
    });
    let selectedClusterArn = cfnJsonParameters === null || cfnJsonParameters === void 0 ? void 0 : cfnJsonParameters.rdsClusterIdentifier;
    let clusterResourceId = getRdsClusterResourceIdFromArn(selectedClusterArn, AWS);
    if (!selectedClusterArn || !clusterResourceId) {
        ({ selectedClusterArn, clusterResourceId } = await selectCluster(context, inputs, AWS));
    }
    let selectedSecretArn = cfnJsonParameters === null || cfnJsonParameters === void 0 ? void 0 : cfnJsonParameters.rdsSecretStoreArn;
    if (!selectedSecretArn) {
        selectedSecretArn = await getSecretStoreArn(context, inputs, clusterResourceId, AWS);
    }
    let selectedDatabase = cfnJsonParameters === null || cfnJsonParameters === void 0 ? void 0 : cfnJsonParameters.rdsDatabaseName;
    if (!selectedDatabase) {
        selectedDatabase = await selectDatabase(context, inputs, selectedClusterArn, selectedSecretArn, AWS);
    }
    return {
        region: selectedRegion,
        dbClusterArn: selectedClusterArn,
        secretStoreArn: selectedSecretArn,
        databaseName: selectedDatabase,
        resourceName: appSyncApi,
    };
}
exports.serviceWalkthrough = serviceWalkthrough;
async function getRdsClusterResourceIdFromArn(arn, AWS) {
    if (!arn) {
        return;
    }
    const RDS = new AWS.RDS();
    const describeDBClustersResult = await RDS.describeDBClusters().promise();
    const rawClusters = describeDBClustersResult.DBClusters;
    const identifiedCluster = rawClusters.find((cluster) => cluster.DBClusterArn === arn);
    return identifiedCluster.DBClusterIdentifier;
}
async function selectCluster(context, inputs, AWS) {
    const RDS = new AWS.RDS();
    const describeDBClustersResult = await RDS.describeDBClusters().promise();
    const rawClusters = describeDBClustersResult.DBClusters;
    const clusters = new Map();
    const serverlessClusters = rawClusters.filter((cluster) => cluster.EngineMode === 'serverless');
    if (serverlessClusters.length === 0) {
        const errMessage = 'No properly configured Aurora Serverless clusters found.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    for (const cluster of serverlessClusters) {
        clusters.set(cluster.DBClusterIdentifier, cluster);
    }
    if (clusters.size > 1) {
        const clusterIdentifier = await promptWalkthroughQuestion(inputs, 1, Array.from(clusters.keys()));
        const selectedCluster = clusters.get(clusterIdentifier);
        return {
            selectedClusterArn: selectedCluster.DBClusterArn,
            clusterResourceId: selectedCluster.DbClusterResourceId,
        };
    }
    const firstCluster = Array.from(clusters.values())[0];
    amplify_prompts_1.printer.info(`${chalk_1.default.green('✔')} Only one Cluster was found: '${firstCluster.DBClusterIdentifier}' was automatically selected.`);
    return {
        selectedClusterArn: firstCluster.DBClusterArn,
        clusterResourceId: firstCluster.DbClusterResourceId,
    };
}
async function getSecretStoreArn(context, inputs, clusterResourceId, AWS) {
    const SecretsManager = new AWS.SecretsManager();
    const NextToken = 'NextToken';
    let rawSecrets = [];
    const params = {
        MaxResults: 20,
    };
    const listSecretsResult = await SecretsManager.listSecrets(params).promise();
    rawSecrets = listSecretsResult.SecretList;
    let token = listSecretsResult.NextToken;
    while (token) {
        params[NextToken] = token;
        const tempSecretsResult = await SecretsManager.listSecrets(params).promise();
        rawSecrets = [...rawSecrets, ...tempSecretsResult.SecretList];
        token = tempSecretsResult.NextToken;
    }
    const secrets = new Map();
    const secretsForCluster = rawSecrets.filter((secret) => secret.Name.startsWith(`rds-db-credentials/${clusterResourceId}`));
    if (secretsForCluster.length === 0) {
        const errMessage = 'No RDS access credentials found in the AWS Secrect Manager.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceCredentialsNotFoundError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    for (const secret of secretsForCluster) {
        secrets.set(secret.Name, secret.ARN);
    }
    let selectedSecretArn;
    if (secrets.size > 1) {
        const selectedSecretName = await promptWalkthroughQuestion(inputs, 2, Array.from(secrets.keys()));
        selectedSecretArn = secrets.get(selectedSecretName);
    }
    else {
        selectedSecretArn = Array.from(secrets.values())[0];
        amplify_prompts_1.printer.info(`${chalk_1.default.green('✔')} Only one Secret was found for the cluster: '${selectedSecretArn}' was automatically selected.`);
    }
    return selectedSecretArn;
}
async function selectDatabase(context, inputs, clusterArn, secretArn, AWS) {
    const DataApi = new AWS.RDSDataService();
    const params = new graphql_relational_schema_transformer_1.DataApiParams();
    const databaseList = [];
    params.secretArn = secretArn;
    params.resourceArn = clusterArn;
    params.sql = 'SHOW databases';
    spinner.start('Fetching Aurora Serverless cluster...');
    try {
        const dataApiResult = await DataApi.executeStatement(params).promise();
        const excludedDatabases = ['information_schema', 'performance_schema', 'mysql', 'sys'];
        databaseList.push(...dataApiResult.records.map((record) => record[0].stringValue).filter((name) => !excludedDatabases.includes(name)));
        spinner.succeed('Fetched Aurora Serverless cluster.');
    }
    catch (err) {
        spinner.fail(err.message);
        if (err.code === 'BadRequestException' && /Access denied for user/.test(err.message)) {
            const msg = `Ensure that '${secretArn}' contains your database credentials. ` +
                'Please note that Aurora Serverless does not support IAM database authentication.';
            amplify_prompts_1.printer.error(msg);
        }
    }
    if (databaseList.length === 0) {
        const errMessage = 'No database found in the selected cluster.';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    if (databaseList.length > 1) {
        return await promptWalkthroughQuestion(inputs, 3, databaseList);
    }
    amplify_prompts_1.printer.info(`${chalk_1.default.green('✔')} Only one Database was found: '${databaseList[0]}' was automatically selected.`);
    return databaseList[0];
}
async function promptWalkthroughQuestion(inputs, questionNumber, choicesList) {
    const question = {
        type: inputs[questionNumber].type,
        name: inputs[questionNumber].key,
        message: inputs[questionNumber].question,
        choices: choicesList,
    };
    return await amplify_prompts_1.prompter.pick(question.message, choicesList);
}
async function getAwsClient(context, action) {
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = require(providerPlugins[providerName]);
    return await provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
}
//# sourceMappingURL=appSync-rds-walkthrough.js.map