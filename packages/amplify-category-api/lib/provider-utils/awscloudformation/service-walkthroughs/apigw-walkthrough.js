"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openConsole = exports.getIAMPolicies = exports.migrate = exports.updateWalkthrough = exports.serviceWalkthrough = void 0;
const os_1 = __importDefault(require("os"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const inquirer_1 = __importDefault(require("inquirer"));
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const category_constants_1 = require("../../../category-constants");
const apigw_input_state_1 = require("../apigw-input-state");
const cdk_stack_builder_1 = require("../cdk-stack-builder");
const apigw_defaults_1 = require("../default-values/apigw-defaults");
const rest_api_path_utils_1 = require("../utils/rest-api-path-utils");
const category = amplify_cli_core_1.AmplifyCategories.API;
const serviceName = amplify_cli_core_1.AmplifySupportedService.APIGW;
const elasticContainerServiceName = 'ElasticContainer';
async function serviceWalkthrough(context) {
    const allDefaultValues = (0, apigw_defaults_1.getAllDefaults)(context.amplify.getProjectDetails());
    const resourceName = await askApiName(context, allDefaultValues.resourceName);
    const answers = { paths: {}, resourceName, dependsOn: undefined };
    return pathFlow(context, answers);
}
exports.serviceWalkthrough = serviceWalkthrough;
async function updateWalkthrough(context) {
    const { allResources } = await context.amplify.getResourceStatus();
    const allDefaultValues = (0, apigw_defaults_1.getAllDefaults)(context.amplify.getProjectDetails());
    const resources = allResources
        .filter((resource) => resource.service === serviceName && resource.mobileHubMigrated !== true)
        .map((resource) => resource.resourceName);
    if (resources.length === 0) {
        const errMessage = 'No REST API resource to update. Use "amplify add api" command to create a new REST API';
        amplify_prompts_1.printer.error(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
        return;
    }
    let answers = {
        paths: [],
    };
    const selectedApiName = await amplify_prompts_1.prompter.pick('Select the REST API you want to update:', resources);
    let updateApiOperation = await amplify_prompts_1.prompter.pick('What would you like to do?', [
        { name: 'Add another path', value: 'add' },
        { name: 'Update path', value: 'update' },
        { name: 'Remove path', value: 'remove' },
    ]);
    if (context.input.command === 'add') {
        updateApiOperation = 'add';
    }
    if (selectedApiName === category_constants_1.ADMIN_QUERIES_NAME) {
        const errMessage = `The Admin Queries API is maintained through the Auth category and should be updated using 'amplify update auth' command`;
        amplify_prompts_1.printer.warn(errMessage);
        await context.usageData.emitError(new amplify_cli_core_1.ResourceDoesNotExistError(errMessage));
        (0, amplify_cli_core_1.exitOnNextTick)(0);
    }
    const projRoot = amplify_cli_core_1.pathManager.findProjectRoot();
    if (!amplify_cli_core_1.stateManager.resourceInputsJsonExists(projRoot, category, selectedApiName)) {
        await migrate(context, projRoot, selectedApiName);
        if (!amplify_cli_core_1.stateManager.resourceInputsJsonExists(projRoot, category, selectedApiName)) {
            (0, amplify_cli_core_1.exitOnNextTick)(0);
        }
    }
    const parameters = amplify_cli_core_1.stateManager.getResourceInputsJson(projRoot, category, selectedApiName);
    parameters.resourceName = selectedApiName;
    Object.assign(allDefaultValues, parameters);
    answers = { ...answers, ...parameters };
    [answers.uuid] = (0, uuid_1.v4)().split('-');
    const pathNames = Object.keys(answers.paths);
    let updatedResult = {};
    switch (updateApiOperation) {
        case 'add': {
            updatedResult = pathFlow(context, answers);
            break;
        }
        case 'remove': {
            const pathToRemove = await inquirer_1.default.prompt({
                name: 'path',
                message: 'Select the path to remove',
                type: 'list',
                choices: pathNames,
            });
            delete answers.paths[pathToRemove.path];
            const { dependsOn, functionArns } = await findDependsOn(answers.paths);
            answers.dependsOn = dependsOn;
            answers.functionArns = functionArns;
            updatedResult = { answers };
            break;
        }
        case 'update': {
            const pathToEdit = await inquirer_1.default.prompt({
                name: 'pathName',
                message: 'Select the path to edit',
                type: 'list',
                choices: pathNames,
            });
            const currentPath = answers.paths[pathToEdit.pathName];
            delete answers.paths[pathToEdit.pathName];
            updatedResult = pathFlow(context, answers, currentPath);
            break;
        }
        default: {
            throw new Error(`Unrecognized API update operation "${updateApiOperation}"`);
        }
    }
    return updatedResult;
}
exports.updateWalkthrough = updateWalkthrough;
async function pathFlow(context, answers, currentPath) {
    const pathsAnswer = await askPaths(context, answers, currentPath);
    return { answers: pathsAnswer };
}
async function askApiName(context, defaultResourceName) {
    const apiNameValidator = (input) => {
        const amplifyValidatorOutput = context.amplify.inputValidation({
            validation: {
                operator: 'regex',
                value: '^[a-zA-Z0-9]+$',
                onErrorMsg: 'Resource name should be alphanumeric',
            },
            required: true,
        })(input);
        const adminQueriesName = 'AdminQueries';
        if (input === adminQueriesName) {
            return `${adminQueriesName} is a reserved name for REST API resources for use by the auth category. Run "amplify update auth" to create an Admin Queries API.`;
        }
        let uniqueCheck = false;
        try {
            uniqueCheck = (0, amplify_cli_core_1.isResourceNameUnique)(category, input);
        }
        catch (e) {
            return e.message || e;
        }
        return typeof amplifyValidatorOutput === 'string' ? amplifyValidatorOutput : uniqueCheck;
    };
    const resourceName = await amplify_prompts_1.prompter.input('Provide a friendly name for your resource to be used as a label for this category in the project:', { initial: defaultResourceName, validate: apiNameValidator });
    return resourceName;
}
async function askPermissions(context, answers, currentPath) {
    var _a, _b, _c, _d, _e;
    while (true) {
        const apiAccess = await amplify_prompts_1.prompter.yesOrNo('Restrict API access?', ((_a = currentPath === null || currentPath === void 0 ? void 0 : currentPath.permissions) === null || _a === void 0 ? void 0 : _a.setting) !== cdk_stack_builder_1.PermissionSetting.OPEN);
        if (!apiAccess) {
            return { setting: cdk_stack_builder_1.PermissionSetting.OPEN };
        }
        const userPoolGroupList = context.amplify.getUserPoolGroupList();
        let permissionSelected = 'Auth/Guest Users';
        const permissions = {};
        if (userPoolGroupList.length > 0) {
            do {
                if (permissionSelected === 'Learn more') {
                    amplify_prompts_1.printer.blankLine();
                    amplify_prompts_1.printer.info('You can restrict access using CRUD policies for Authenticated Users, Guest Users, or on individual Group that users belong to' +
                        ' in a User Pool. If a user logs into your application and is not a member of any group they will use policy set for ' +
                        '“Authenticated Users”, however if they belong to a group they will only get the policy associated with that specific group.');
                    amplify_prompts_1.printer.blankLine();
                }
                const permissionSelection = await amplify_prompts_1.prompter.pick('Restrict access by:', [
                    'Auth/Guest Users',
                    'Individual Groups',
                    'Both',
                    'Learn more',
                ]);
                permissionSelected = permissionSelection;
            } while (permissionSelected === 'Learn more');
        }
        if (permissionSelected === 'Both' || permissionSelected === 'Auth/Guest Users') {
            const permissionSetting = await amplify_prompts_1.prompter.pick('Who should have access?', [
                {
                    name: 'Authenticated users only',
                    value: cdk_stack_builder_1.PermissionSetting.PRIVATE,
                },
                {
                    name: 'Authenticated and Guest users',
                    value: cdk_stack_builder_1.PermissionSetting.PROTECTED,
                },
            ], { initial: ((_b = currentPath === null || currentPath === void 0 ? void 0 : currentPath.permissions) === null || _b === void 0 ? void 0 : _b.setting) === cdk_stack_builder_1.PermissionSetting.PROTECTED ? 1 : 0 });
            permissions.setting = permissionSetting;
            let { permissions: { auth: authPermissions }, } = currentPath || { permissions: { auth: [] } };
            let { permissions: { guest: unauthPermissions }, } = currentPath || { permissions: { guest: [] } };
            if (permissionSetting === cdk_stack_builder_1.PermissionSetting.PRIVATE) {
                permissions.auth = await askCRUD('Authenticated', authPermissions);
                const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
                await ensureAuth(context, apiRequirements, answers.resourceName);
            }
            if (permissionSetting === cdk_stack_builder_1.PermissionSetting.PROTECTED) {
                permissions.auth = await askCRUD('Authenticated', authPermissions);
                permissions.guest = await askCRUD('Guest', unauthPermissions);
                const apiRequirements = { authSelections: 'identityPoolAndUserPool', allowUnauthenticatedIdentities: true };
                await ensureAuth(context, apiRequirements, answers.resourceName);
            }
        }
        if (permissionSelected === 'Both' || permissionSelected === 'Individual Groups') {
            const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
            await ensureAuth(context, apiRequirements, answers.resourceName);
            const authResourceName = getAuthResourceName();
            answers.authResourceName = authResourceName;
            let defaultSelectedGroups = [];
            if ((_c = currentPath === null || currentPath === void 0 ? void 0 : currentPath.permissions) === null || _c === void 0 ? void 0 : _c.groups) {
                defaultSelectedGroups = Object.keys(currentPath.permissions.groups);
            }
            let selectedUserPoolGroupList = await amplify_prompts_1.prompter.pick('Select groups:', userPoolGroupList, {
                initial: (0, amplify_prompts_1.byValues)(defaultSelectedGroups)(userPoolGroupList),
                returnSize: 'many',
                pickAtLeast: 1,
            });
            if (selectedUserPoolGroupList && !Array.isArray(selectedUserPoolGroupList)) {
                selectedUserPoolGroupList = [selectedUserPoolGroupList];
            }
            for (const selectedUserPoolGroup of selectedUserPoolGroupList) {
                let defaults = [];
                if ((_e = (_d = currentPath === null || currentPath === void 0 ? void 0 : currentPath.permissions) === null || _d === void 0 ? void 0 : _d.groups) === null || _e === void 0 ? void 0 : _e[selectedUserPoolGroup]) {
                    defaults = currentPath.permissions.groups[selectedUserPoolGroup];
                }
                if (!permissions.groups) {
                    permissions.groups = {};
                }
                permissions.groups[selectedUserPoolGroup] = await askCRUD(selectedUserPoolGroup, defaults);
            }
            if (!permissions.setting) {
                permissions.setting = cdk_stack_builder_1.PermissionSetting.PRIVATE;
            }
        }
        return permissions;
    }
}
async function ensureAuth(context, apiRequirements, resourceName) {
    const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
        apiRequirements,
        context,
        'api',
        resourceName,
    ]);
    if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
        throw new Error(checkResult.errors.join(os_1.default.EOL));
    }
    if (checkResult.errors && checkResult.errors.length > 0) {
        amplify_prompts_1.printer.warn(checkResult.errors.join(os_1.default.EOL));
    }
    if (!checkResult.authEnabled || !checkResult.requirementsMet) {
        try {
            await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
                context,
                amplify_cli_core_1.AmplifyCategories.API,
                resourceName,
                apiRequirements,
            ]);
        }
        catch (error) {
            amplify_prompts_1.printer.error(error);
            throw error;
        }
    }
}
async function askCRUD(userType, permissions = []) {
    const crudOptions = [cdk_stack_builder_1.CrudOperation.CREATE, cdk_stack_builder_1.CrudOperation.READ, cdk_stack_builder_1.CrudOperation.UPDATE, cdk_stack_builder_1.CrudOperation.DELETE];
    const crudAnswers = await amplify_prompts_1.prompter.pick(`What permissions do you want to grant to ${userType} users?`, crudOptions, {
        returnSize: 'many',
        initial: (0, amplify_prompts_1.byValues)(permissions),
        pickAtLeast: 1,
    });
    return crudAnswers;
}
async function askPaths(context, answers, currentPath) {
    const existingFunctions = functionsExist();
    let defaultFunctionType = 'newFunction';
    const defaultChoice = {
        name: 'Create a new Lambda function',
        value: defaultFunctionType,
    };
    const choices = [defaultChoice];
    if (existingFunctions) {
        choices.push({
            name: 'Use a Lambda function already added in the current Amplify project',
            value: 'projectFunction',
        });
    }
    const paths = answers.paths;
    let addAnotherPath;
    do {
        let pathName;
        let isPathValid;
        do {
            pathName = await amplify_prompts_1.prompter.input('Provide a path (e.g., /book/{isbn}):', {
                initial: currentPath ? currentPath.name : '/items',
                validate: rest_api_path_utils_1.validatePathName,
            });
            const overlapCheckResult = (0, rest_api_path_utils_1.checkForPathOverlap)(pathName, Object.keys(paths));
            if (overlapCheckResult === false) {
                isPathValid = true;
            }
            else {
                const higherOrderPath = overlapCheckResult.higherOrderPath;
                const lowerOrderPath = overlapCheckResult.lowerOrderPath;
                isPathValid = await amplify_prompts_1.prompter.confirmContinue(`The path ${lowerOrderPath} overlaps with ${higherOrderPath}. Users authorized to access ${higherOrderPath} will also have access` +
                    ` to ${lowerOrderPath}. Are you sure you want to continue?`);
            }
        } while (!isPathValid);
        const functionType = await amplify_prompts_1.prompter.pick('Choose a Lambda source', choices, { initial: choices.indexOf(defaultChoice) });
        let path = { name: pathName };
        let lambda;
        do {
            lambda = await askLambdaSource(context, functionType, pathName, currentPath);
        } while (!lambda);
        const permissions = await askPermissions(context, answers, currentPath);
        path = { ...path, ...lambda, permissions };
        paths[pathName] = path;
        if (currentPath) {
            break;
        }
        addAnotherPath = await amplify_prompts_1.prompter.confirmContinue('Do you want to add another path?');
    } while (addAnotherPath);
    const { dependsOn, functionArns } = await findDependsOn(paths);
    return { paths, dependsOn, resourceName: answers.resourceName, functionArns };
}
async function findDependsOn(paths) {
    var _a;
    const dependsOn = [];
    const functionArns = [];
    for (const path of Object.values(paths)) {
        if (path.lambdaFunction && !path.lambdaArn) {
            if (!dependsOn.find((func) => func.resourceName === path.lambdaFunction)) {
                dependsOn.push({
                    category: 'function',
                    resourceName: path.lambdaFunction,
                    attributes: ['Name', 'Arn'],
                });
            }
        }
        if (!functionArns.find((func) => func.lambdaFunction === path.lambdaFunction)) {
            functionArns.push({
                lambdaFunction: path.lambdaFunction,
                lambdaArn: path.lambdaArn,
            });
        }
        if ((_a = path === null || path === void 0 ? void 0 : path.permissions) === null || _a === void 0 ? void 0 : _a.groups) {
            const userPoolGroups = Object.keys(path.permissions.groups);
            if (userPoolGroups.length > 0) {
                const authResourceName = getAuthResourceName();
                if (!dependsOn.find((resource) => resource.resourceName === authResourceName)) {
                    dependsOn.push({
                        category: 'auth',
                        resourceName: authResourceName,
                        attributes: ['UserPoolId'],
                    });
                }
                userPoolGroups.forEach((group) => {
                    if (!dependsOn.find((resource) => resource.attributes[0] === `${group}GroupRole`)) {
                        dependsOn.push({
                            category: 'auth',
                            resourceName: 'userPoolGroups',
                            attributes: [`${group}GroupRole`],
                        });
                    }
                });
            }
        }
    }
    return { dependsOn, functionArns };
}
function getAuthResourceName() {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const authResources = (Object.entries(meta === null || meta === void 0 ? void 0 : meta.auth) || []).filter(([_, resource]) => resource.service === amplify_cli_core_1.AmplifySupportedService.COGNITO);
    if (authResources.length === 0) {
        throw new Error('No auth resource found. Add it using amplify add auth');
    }
    const [authResourceName] = authResources[0];
    return authResourceName;
}
function functionsExist() {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    if (!meta.function) {
        return false;
    }
    const functionResources = meta.function;
    const lambdaFunctions = [];
    Object.keys(functionResources).forEach((resourceName) => {
        if (functionResources[resourceName].service === amplify_cli_core_1.AmplifySupportedService.LAMBDA) {
            lambdaFunctions.push(resourceName);
        }
    });
    if (lambdaFunctions.length === 0) {
        return false;
    }
    return true;
}
async function askLambdaSource(context, functionType, path, currentPath) {
    switch (functionType) {
        case 'arn':
            return askLambdaArn(context, currentPath);
        case 'projectFunction':
            return askLambdaFromProject(currentPath);
        case 'newFunction':
            return newLambdaFunction(context, path);
        default:
            throw new Error('Type not supported');
    }
}
async function newLambdaFunction(context, path) {
    let params = {
        functionTemplate: {
            parameters: {
                path,
                expressPath: (0, rest_api_path_utils_1.formatCFNPathParamsForExpressJs)(path),
            },
        },
    };
    const resourceName = await context.amplify.invokePluginMethod(context, amplify_cli_core_1.AmplifyCategories.FUNCTION, undefined, 'add', [
        context,
        'awscloudformation',
        amplify_cli_core_1.AmplifySupportedService.LAMBDA,
        params,
    ]);
    amplify_prompts_1.printer.success('Succesfully added the Lambda function locally');
    return { lambdaFunction: resourceName };
}
async function askLambdaFromProject(currentPath) {
    const meta = amplify_cli_core_1.stateManager.getMeta();
    const lambdaFunctions = [];
    Object.keys((meta === null || meta === void 0 ? void 0 : meta.function) || {}).forEach((resourceName) => {
        if (meta.function[resourceName].service === amplify_cli_core_1.AmplifySupportedService.LAMBDA) {
            lambdaFunctions.push(resourceName);
        }
    });
    const lambdaFunction = await amplify_prompts_1.prompter.pick('Choose the Lambda function to invoke by this path', lambdaFunctions, {
        initial: currentPath ? lambdaFunctions.indexOf(currentPath.lambdaFunction) : 0,
    });
    return { lambdaFunction };
}
async function askLambdaArn(context, currentPath) {
    const lambdaFunctions = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'getLambdaFunctions');
    const lambdaOptions = lambdaFunctions.map((lambdaFunction) => ({
        value: lambdaFunction.FunctionArn,
        name: `${lambdaFunction.FunctionName} (${lambdaFunction.FunctionArn})`,
    }));
    if (lambdaOptions.length === 0) {
        amplify_prompts_1.printer.error('You do not have any Lambda functions configured for the selected Region');
        return null;
    }
    const lambdaCloudOptionQuestion = {
        type: 'list',
        name: 'lambdaChoice',
        message: 'Select a Lambda function',
        choices: lambdaOptions,
        default: currentPath && currentPath.lambdaFunction ? `${currentPath.lambdaFunction}` : `${lambdaOptions[0].value}`,
    };
    let lambdaOption;
    while (!lambdaOption) {
        try {
            lambdaOption = await inquirer_1.default.prompt([lambdaCloudOptionQuestion]);
        }
        catch (err) {
            amplify_prompts_1.printer.error('Select a Lambda Function');
        }
    }
    const lambdaCloudOptionAnswer = lambdaFunctions.find((lambda) => lambda.FunctionArn === lambdaOption.lambdaChoice);
    return {
        lambdaArn: lambdaCloudOptionAnswer.FunctionArn,
        lambdaFunction: lambdaCloudOptionAnswer.FunctionName,
    };
}
async function migrate(context, projectPath, resourceName) {
    var _a, _b;
    const apigwInputState = new apigw_input_state_1.ApigwInputState(context, resourceName);
    if (resourceName === category_constants_1.ADMIN_QUERIES_NAME) {
        const meta = amplify_cli_core_1.stateManager.getMeta();
        const adminQueriesDependsOn = lodash_1.default.get(meta, [amplify_cli_core_1.AmplifyCategories.API, category_constants_1.ADMIN_QUERIES_NAME, 'dependsOn'], undefined);
        if (!adminQueriesDependsOn) {
            throw new Error('Failed to migrate Admin Queries API. Could not find expected information in amplify-meta.json.');
        }
        const functionName = (_b = (_a = adminQueriesDependsOn.filter((dependency) => dependency.category === amplify_cli_core_1.AmplifyCategories.FUNCTION)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.resourceName;
        const adminQueriesProps = {
            apiName: resourceName,
            authResourceName: getAuthResourceName(),
            functionName,
            dependsOn: adminQueriesDependsOn,
        };
        return apigwInputState.migrateAdminQueries(adminQueriesProps);
    }
    return apigwInputState.migrateApigwResource(resourceName);
}
exports.migrate = migrate;
function getIAMPolicies(resourceName, crudOptions) {
    let policy = {};
    const actions = [];
    crudOptions.forEach((crudOption) => {
        switch (crudOption) {
            case cdk_stack_builder_1.CrudOperation.CREATE:
                actions.push('apigateway:POST', 'apigateway:PUT');
                break;
            case cdk_stack_builder_1.CrudOperation.UPDATE:
                actions.push('apigateway:PATCH');
                break;
            case cdk_stack_builder_1.CrudOperation.READ:
                actions.push('apigateway:GET', 'apigateway:HEAD', 'apigateway:OPTIONS');
                break;
            case cdk_stack_builder_1.CrudOperation.DELETE:
                actions.push('apigateway:DELETE');
                break;
            default:
                amplify_prompts_1.printer.info(`${crudOption} not supported`);
        }
    });
    policy = {
        Effect: 'Allow',
        Action: actions,
        Resource: [
            {
                'Fn::Join': [
                    '',
                    [
                        'arn:aws:apigateway:',
                        {
                            Ref: 'AWS::Region',
                        },
                        '::/restapis/',
                        {
                            Ref: `${category}${resourceName}ApiName`,
                        },
                        '/*',
                    ],
                ],
            },
        ],
    };
    const attributes = ['ApiName', 'ApiId'];
    return { policy, attributes };
}
exports.getIAMPolicies = getIAMPolicies;
const openConsole = async (context) => {
    const amplifyMeta = amplify_cli_core_1.stateManager.getMeta();
    const categoryAmplifyMeta = amplifyMeta[category];
    const { Region } = amplifyMeta.providers.awscloudformation;
    const restApis = Object.keys(categoryAmplifyMeta).filter((resourceName) => {
        const resource = categoryAmplifyMeta[resourceName];
        return (resource.output &&
            (resource.service === serviceName || (resource.service === elasticContainerServiceName && resource.apiType === 'REST')));
    });
    if (restApis) {
        let url;
        const selectedApi = await amplify_prompts_1.prompter.pick('Select the API', restApis);
        const selectedResource = categoryAmplifyMeta[selectedApi];
        if (selectedResource.service === serviceName) {
            const { output: { ApiId }, } = selectedResource;
            url = `https://${Region}.console.aws.amazon.com/apigateway/home?region=${Region}#/apis/${ApiId}/resources/`;
        }
        else {
            const { output: { PipelineName, ServiceName, ClusterName }, } = selectedResource;
            const codePipeline = 'CodePipeline';
            const elasticContainer = 'ElasticContainer';
            const selectedConsole = await amplify_prompts_1.prompter.pick('Which console do you want to open?', [
                {
                    name: 'Elastic Container Service (Deployed container status)',
                    value: elasticContainer,
                },
                {
                    name: 'CodePipeline (Container build status)',
                    value: codePipeline,
                },
            ]);
            if (selectedConsole === elasticContainer) {
                url = `https://console.aws.amazon.com/ecs/home?region=${Region}#/clusters/${ClusterName}/services/${ServiceName}/details`;
            }
            else if (selectedConsole === codePipeline) {
                url = `https://${Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${PipelineName}/view`;
            }
            else {
                amplify_prompts_1.printer.error('Option not available');
                return;
            }
        }
        await (0, amplify_cli_core_1.open)(url, { wait: false });
    }
    else {
        amplify_prompts_1.printer.error('There are no REST APIs pushed to the cloud');
    }
};
exports.openConsole = openConsole;
//# sourceMappingURL=apigw-walkthrough.js.map