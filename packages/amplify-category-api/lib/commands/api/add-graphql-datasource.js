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
exports.readSchema = exports.run = exports.name = void 0;
const path = __importStar(require("path"));
const merge_1 = require("@graphql-tools/merge");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const fs = __importStar(require("fs-extra"));
const graphql = __importStar(require("graphql"));
const graphql_relational_schema_transformer_1 = require("graphql-relational-schema-transformer");
const inquirer_1 = __importDefault(require("inquirer"));
const amplify_environment_parameters_1 = require("@aws-amplify/amplify-environment-parameters");
const supported_datasources_1 = require("../../provider-utils/supported-datasources");
const subcommand = 'add-graphql-datasource';
const category = 'api';
const providerName = 'awscloudformation';
exports.name = subcommand;
const run = async (context) => {
    var _a;
    try {
        const AWS = await getAwsClient(context, 'list');
        const result = await datasourceSelectionPrompt(context, supported_datasources_1.supportedDataSources);
        const providerController = await (_a = path.join('..', '..', 'provider-utils', result.providerName, 'index'), Promise.resolve().then(() => __importStar(require(_a))));
        if (!providerController) {
            amplify_prompts_1.printer.error('Provider not configured for this category');
            return;
        }
        const { datasource } = result;
        const answers = await providerController.addDatasource(context, category, datasource);
        const { resourceName, databaseName } = answers;
        const currentEnv = context.amplify.getEnvInfo().envName;
        (0, amplify_environment_parameters_1.getEnvParamManager)(currentEnv).getResourceParamManager(category, resourceName).setParams({
            rdsRegion: answers.region,
            rdsClusterIdentifier: answers.dbClusterArn,
            rdsSecretStoreArn: answers.secretStoreArn,
            rdsDatabaseName: answers.databaseName,
        });
        const backendConfig = amplify_cli_core_1.stateManager.getBackendConfig();
        backendConfig[category][resourceName].rdsInit = true;
        amplify_cli_core_1.stateManager.setBackendConfig(undefined, backendConfig);
        const dbReader = new graphql_relational_schema_transformer_1.AuroraServerlessMySQLDatabaseReader(answers.region, answers.secretStoreArn, answers.dbClusterArn, answers.databaseName, AWS);
        const improvePluralizationFlag = amplify_cli_core_1.FeatureFlags.getBoolean('graphqltransformer.improvePluralization');
        const relationalSchemaTransformer = new graphql_relational_schema_transformer_1.RelationalDBSchemaTransformer(dbReader, answers.databaseName, improvePluralizationFlag);
        const graphqlSchemaContext = await relationalSchemaTransformer.introspectDatabaseSchema();
        if (graphqlSchemaContext === null) {
            amplify_prompts_1.printer.warn('No importable tables were found in the selected Database.');
            amplify_prompts_1.printer.blankLine();
            return;
        }
        const apiDirPath = amplify_cli_core_1.pathManager.getResourceDirectoryPath(undefined, category, resourceName);
        fs.ensureDirSync(apiDirPath);
        const graphqlSchemaFilePath = path.join(apiDirPath, 'schema.graphql');
        const rdsGraphQLSchemaDoc = graphqlSchemaContext.schemaDoc;
        const schemaDirectoryPath = path.join(apiDirPath, 'schema');
        if (fs.existsSync(graphqlSchemaFilePath)) {
            const typesToBeMerged = [rdsGraphQLSchemaDoc];
            const currentGraphQLSchemaDoc = (0, exports.readSchema)(graphqlSchemaFilePath);
            if (currentGraphQLSchemaDoc) {
                typesToBeMerged.unshift(currentGraphQLSchemaDoc);
            }
            else {
                amplify_prompts_1.printer.warn(`Graphql Schema file "${graphqlSchemaFilePath}" is empty.`);
                amplify_prompts_1.printer.blankLine();
            }
            const concatGraphQLSchemaDoc = (0, merge_1.mergeTypeDefs)(typesToBeMerged);
            fs.writeFileSync(graphqlSchemaFilePath, graphql.print(concatGraphQLSchemaDoc), 'utf8');
        }
        else if (fs.existsSync(schemaDirectoryPath)) {
            const rdsSchemaFilePath = path.join(schemaDirectoryPath, 'sql.graphql');
            fs.writeFileSync(rdsSchemaFilePath, graphql.print(rdsGraphQLSchemaDoc), 'utf8');
        }
        else {
            throw new amplify_cli_core_1.AmplifyError('ApiCategorySchemaNotFoundError', {
                message: 'No schema found',
                resolution: `Your SQL schema should be in either ${graphqlSchemaFilePath} or schema directory ${schemaDirectoryPath}`,
            });
        }
        const resolversDir = path.join(apiDirPath, 'resolvers');
        const templateGenerator = new graphql_relational_schema_transformer_1.RelationalDBTemplateGenerator(graphqlSchemaContext);
        let template = templateGenerator.createTemplate(context);
        template = templateGenerator.addRelationalResolvers(template, resolversDir, improvePluralizationFlag);
        const cfn = templateGenerator.printCloudformationTemplate(template);
        const stacksDir = path.join(apiDirPath, 'stacks');
        const writeToPath = path.join(stacksDir, `${resourceName}-${databaseName}-rds.json`);
        fs.writeFileSync(writeToPath, cfn, 'utf8');
        await context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
        amplify_prompts_1.printer.success(`Successfully added the ${datasource} datasource locally`);
        amplify_prompts_1.printer.blankLine();
        amplify_prompts_1.printer.success('Some next steps:');
        amplify_prompts_1.printer.info('"amplify push" will build all your local backend resources and provision it in the cloud');
        amplify_prompts_1.printer.info('"amplify publish" will build all your local backend and frontend resources (if you have hosting category added) and provision it in the cloud');
        amplify_prompts_1.printer.blankLine();
    }
    catch (error) {
        amplify_prompts_1.printer.error('There was an error adding the datasource');
        throw error;
    }
};
exports.run = run;
const datasourceSelectionPrompt = async (context, supportedDataSources) => {
    const options = [];
    Object.keys(supportedDataSources).forEach((datasource) => {
        const optionName = supportedDataSources[datasource].alias ||
            `${supportedDataSources[datasource].providerName}:${supportedDataSources[datasource].service}`;
        options.push({
            name: optionName,
            value: {
                provider: supportedDataSources[datasource].provider,
                datasource,
                providerName: supportedDataSources[datasource].provider,
            },
        });
    });
    if (options.length === 0) {
        const errMessage = `No data sources defined by configured providers for category: ${category}`;
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(1);
    }
    if (options.length === 1) {
        amplify_prompts_1.printer.info(`Using datasource: ${options[0].value.datasource}, provided by: ${options[0].value.providerName}`);
        return new Promise((resolve) => {
            resolve(options[0].value);
        });
    }
    const question = [
        {
            name: 'datasource',
            message: 'Please select from one of the below mentioned data sources',
            type: 'list',
            choices: options,
        },
    ];
    return inquirer_1.default.prompt(question).then((answer) => answer.datasource);
};
const getAwsClient = async (context, action) => {
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = require(providerPlugins[providerName]);
    return provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
};
const readSchema = (graphqlSchemaFilePath) => {
    const graphqlSchemaRaw = fs.readFileSync(graphqlSchemaFilePath).toString();
    if (graphqlSchemaRaw.trim().length === 0) {
        return null;
    }
    let currentGraphQLSchemaDoc;
    try {
        currentGraphQLSchemaDoc = graphql.parse(graphqlSchemaRaw);
    }
    catch (err) {
        const relativePathToInput = path.relative(process.cwd(), graphqlSchemaRaw);
        throw new amplify_cli_core_1.AmplifyError('UserInputError', {
            message: `Could not parse graphql scehma \n${relativePathToInput}\n`,
            details: err.message,
            link: 'https://docs.amplify.aws/cli-legacy/graphql-transformer/relational/',
        });
    }
    return currentGraphQLSchemaDoc;
};
exports.readSchema = readSchema;
//# sourceMappingURL=add-graphql-datasource.js.map