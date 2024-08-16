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
exports.AmplifyApigwResourceStack = void 0;
const apigw = __importStar(require("aws-cdk-lib/aws-apigateway"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const cdk = __importStar(require("aws-cdk-lib"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const lodash_1 = __importDefault(require("lodash"));
const uuid_1 = require("uuid");
const category_constants_1 = require("../../../category-constants");
const types_1 = require("./types");
const CFN_TEMPLATE_FORMAT_VERSION = '2010-09-09';
const ROOT_CFN_DESCRIPTION = 'API Gateway Resource for AWS Amplify CLI';
class AmplifyApigwResourceStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, undefined);
        this._cfnParameterMap = new Map();
        this.renderCloudFormationTemplate = () => amplify_cli_core_1.JSONUtilities.stringify(this._toCloudFormation());
        this.generateAdminQueriesStack = (resourceName, authResourceName) => {
            this._constructCfnPaths(resourceName);
            this.restApi = new apigw.CfnRestApi(this, resourceName, {
                description: '',
                name: resourceName,
                body: {
                    swagger: '2.0',
                    info: {
                        version: '2018-05-24T17:52:00Z',
                        title: resourceName,
                    },
                    host: cdk.Fn.join('', ['apigateway.', cdk.Fn.ref('AWS::Region'), '.amazonaws.com']),
                    basePath: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', '/Prod', cdk.Fn.join('', ['/', cdk.Fn.ref('env')])),
                    schemes: ['https'],
                    paths: this.paths,
                    securityDefinitions: {
                        Cognito: {
                            type: 'apiKey',
                            name: 'Authorization',
                            in: 'header',
                            'x-amazon-apigateway-authtype': 'cognito_user_pools',
                            'x-amazon-apigateway-authorizer': {
                                providerARNs: [
                                    cdk.Fn.join('', [
                                        'arn:aws:cognito-idp:',
                                        cdk.Fn.ref('AWS::Region'),
                                        ':',
                                        cdk.Fn.ref('AWS::AccountId'),
                                        ':userpool/',
                                        cdk.Fn.ref(`auth${authResourceName}UserPoolId`),
                                    ]),
                                ],
                                type: 'cognito_user_pools',
                            },
                        },
                    },
                    definitions: {
                        Empty: {
                            type: 'object',
                            title: 'Empty Schema',
                        },
                    },
                    'x-amazon-apigateway-request-validators': {
                        'Validate query string parameters and headers': {
                            validateRequestParameters: true,
                            validateRequestBody: false,
                        },
                    },
                },
            });
            this._setDeploymentResource(resourceName);
        };
        this.generateStackResources = (resourceName) => {
            this._constructCfnPaths(resourceName);
            this.restApi = new apigw.CfnRestApi(this, resourceName, {
                description: '',
                failOnWarnings: true,
                name: resourceName,
                body: {
                    swagger: '2.0',
                    info: {
                        version: '2018-05-24T17:52:00Z',
                        title: resourceName,
                    },
                    host: cdk.Fn.join('', ['apigateway.', cdk.Fn.ref('AWS::Region'), '.amazonaws.com']),
                    basePath: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', '/Prod', cdk.Fn.join('', ['/', cdk.Fn.ref('env')])),
                    schemes: ['https'],
                    paths: this.paths,
                    securityDefinitions: {
                        sigv4: {
                            type: 'apiKey',
                            name: 'Authorization',
                            in: 'header',
                            'x-amazon-apigateway-authtype': 'awsSigv4',
                        },
                    },
                    definitions: {
                        RequestSchema: {
                            type: 'object',
                            required: ['request'],
                            properties: {
                                request: {
                                    type: 'string',
                                },
                            },
                            title: 'Request Schema',
                        },
                        ResponseSchema: {
                            type: 'object',
                            required: ['response'],
                            properties: {
                                response: {
                                    type: 'string',
                                },
                            },
                            title: 'Response Schema',
                        },
                    },
                },
            });
            const [responseRandomId] = (0, uuid_1.v4)().split('-');
            const default4xx = new apigw.CfnGatewayResponse(this, `${resourceName}Default4XXResponse${responseRandomId}`, {
                responseType: 'DEFAULT_4XX',
                restApiId: cdk.Fn.ref(resourceName),
                responseParameters: defaultCorsGatewayResponseParams,
            });
            const default5xx = new apigw.CfnGatewayResponse(this, `${resourceName}Default5XXResponse${responseRandomId}`, {
                responseType: 'DEFAULT_5XX',
                restApiId: cdk.Fn.ref(resourceName),
                responseParameters: defaultCorsGatewayResponseParams,
            });
            this._setDeploymentResource(resourceName, [default4xx, default5xx]);
        };
        this._setDeploymentResource = (apiName, dependencies = []) => {
            const [shortId] = (0, uuid_1.v4)().split('-');
            this.deploymentResource = new apigw.CfnDeployment(this, `DeploymentAPIGW${apiName}${shortId}`, {
                description: 'The Development stage deployment of your API.',
                stageName: cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')).toString(),
                restApiId: cdk.Fn.ref(apiName),
            });
            dependencies.forEach((dep) => this.deploymentResource.addDependency(dep));
        };
        this._scope = scope;
        this._props = props;
        this.paths = {};
        this._seenLogicalIds = new Set();
        this._cfnParameterValues = {};
        this.policies = {};
        this.templateOptions.templateFormatVersion = CFN_TEMPLATE_FORMAT_VERSION;
        this.templateOptions.description = ROOT_CFN_DESCRIPTION;
    }
    addCfnOutput(props, logicalId) {
        this.validateLogicalId(logicalId);
        new cdk.CfnOutput(this, logicalId, props);
    }
    addCfnMapping(props, logicalId) {
        this.validateLogicalId(logicalId);
        new cdk.CfnMapping(this, logicalId, props);
    }
    addCfnCondition(props, logicalId) {
        this.validateLogicalId(logicalId);
        new cdk.CfnCondition(this, logicalId, props);
    }
    addCfnResource(props, logicalId) {
        this.validateLogicalId(logicalId);
        new cdk.CfnResource(this, logicalId, props);
    }
    addCfnLambdaPermissionResource(props, logicalId) {
        this.validateLogicalId(logicalId);
        new lambda.CfnPermission(this, logicalId, props);
    }
    addCfnParameter(props, logicalId, value) {
        this.validateLogicalId(logicalId);
        this._cfnParameterMap.set(logicalId, new cdk.CfnParameter(this, logicalId, props));
        if (value !== undefined) {
            this._cfnParameterValues[logicalId] = value;
        }
    }
    getCfnParameterValues() {
        return this._cfnParameterValues;
    }
    validateLogicalId(logicalId) {
        if (this._seenLogicalIds.has(logicalId)) {
            throw new Error(`logical id "${logicalId}" already exists`);
        }
        this._seenLogicalIds.add(logicalId);
    }
    _craftPolicyDocument(apiResourceName, pathName, supportedOperations) {
        const policyPathName = pathName.replace(/{[a-zA-Z0-9-]+}/g, '*');
        const paths = [policyPathName, appendToUrlPath(policyPathName, '*')];
        const resources = paths.flatMap((path) => supportedOperations.map((op) => cdk.Fn.join('', [
            'arn:aws:execute-api:',
            cdk.Fn.ref('AWS::Region'),
            ':',
            cdk.Fn.ref('AWS::AccountId'),
            ':',
            cdk.Fn.ref(apiResourceName),
            '/',
            cdk.Fn.conditionIf('ShouldNotCreateEnvResources', 'Prod', cdk.Fn.ref('env')).toString(),
            op,
            path,
        ])));
        return new iam.PolicyDocument({
            statements: [
                new iam.PolicyStatement({
                    actions: ['execute-api:Invoke'],
                    effect: iam.Effect.ALLOW,
                    resources,
                }),
            ],
        });
    }
    addIamPolicyResourceForUserPoolGroup(apiResourceName, authRoleLogicalId, groupName, pathName, supportedOperations) {
        const alphanumericPathName = pathName.replace(/[^-a-z0-9]/g, '');
        const policyName = [apiResourceName, alphanumericPathName, groupName, 'group', 'policy'].join('-');
        const iamPolicy = new iam.CfnPolicy(this, `${groupName}Group${alphanumericPathName}Policy`, {
            policyDocument: this._craftPolicyDocument(apiResourceName, pathName, supportedOperations),
            policyName,
            roles: [cdk.Fn.join('-', [cdk.Fn.ref(authRoleLogicalId), `${groupName}GroupRole`])],
        });
        lodash_1.default.set(this.policies, [pathName, 'groups', groupName], iamPolicy);
    }
    _constructCfnPaths(resourceName) {
        const addedFunctionPermissions = new Set();
        for (const [pathName, path] of Object.entries(this._props.paths)) {
            let lambdaPermissionLogicalId;
            if (resourceName === category_constants_1.ADMIN_QUERIES_NAME) {
                this.paths['/{proxy+}'] = getAdminQueriesPathObject(path.lambdaFunction);
                lambdaPermissionLogicalId = `${category_constants_1.ADMIN_QUERIES_NAME}APIGWPolicyForLambda`;
            }
            else {
                this.paths[pathName] = createPathObject(path);
                this.paths[appendToUrlPath(pathName, '{proxy+}')] = createPathObject(path);
                lambdaPermissionLogicalId = `function${path.lambdaFunction}Permission${resourceName}`;
            }
            if (!addedFunctionPermissions.has(path.lambdaFunction)) {
                addedFunctionPermissions.add(path.lambdaFunction);
                this.addCfnLambdaPermissionResource({
                    functionName: cdk.Fn.ref(`function${path.lambdaFunction}Name`),
                    action: 'lambda:InvokeFunction',
                    principal: 'apigateway.amazonaws.com',
                    sourceArn: cdk.Fn.join('', [
                        'arn:aws:execute-api:',
                        cdk.Fn.ref('AWS::Region'),
                        ':',
                        cdk.Fn.ref('AWS::AccountId'),
                        ':',
                        cdk.Fn.ref(resourceName),
                        '/*/*/*',
                    ]),
                }, lambdaPermissionLogicalId);
            }
        }
    }
}
exports.AmplifyApigwResourceStack = AmplifyApigwResourceStack;
const appendToUrlPath = (path, postfix) => path.charAt(path.length - 1) === '/' ? `${path}${postfix}` : `${path}/${postfix}`;
const getAdminQueriesPathObject = (lambdaFunctionName) => ({
    options: {
        consumes: ['application/json'],
        produces: ['application/json'],
        responses: {
            200: {
                description: '200 response',
                schema: {
                    $ref: '#/definitions/Empty',
                },
                headers: {
                    'Access-Control-Allow-Origin': {
                        type: 'string',
                    },
                    'Access-Control-Allow-Methods': {
                        type: 'string',
                    },
                    'Access-Control-Allow-Headers': {
                        type: 'string',
                    },
                },
            },
        },
        'x-amazon-apigateway-integration': {
            responses: {
                default: {
                    statusCode: '200',
                    responseParameters: {
                        'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
                        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                        'method.response.header.Access-Control-Allow-Origin': "'*'",
                    },
                },
            },
            passthroughBehavior: 'when_no_match',
            requestTemplates: {
                'application/json': '{"statusCode": 200}',
            },
            type: 'mock',
        },
    },
    'x-amazon-apigateway-any-method': {
        produces: ['application/json'],
        parameters: [
            {
                name: 'proxy',
                in: 'path',
                required: true,
                type: 'string',
            },
            {
                name: 'Authorization',
                in: 'header',
                required: false,
                type: 'string',
            },
        ],
        responses: {},
        security: [
            {
                Cognito: ['aws.cognito.signin.user.admin'],
            },
        ],
        'x-amazon-apigateway-request-validator': 'Validate query string parameters and headers',
        'x-amazon-apigateway-integration': {
            uri: cdk.Fn.join('', [
                'arn:aws:apigateway:',
                cdk.Fn.ref('AWS::Region'),
                ':lambda:path/2015-03-31/functions/',
                cdk.Fn.ref(`function${lambdaFunctionName}Arn`),
                '/invocations',
            ]),
            passthroughBehavior: 'when_no_match',
            httpMethod: 'POST',
            cacheNamespace: 'n40eb9',
            cacheKeyParameters: ['method.request.path.proxy'],
            contentHandling: 'CONVERT_TO_TEXT',
            type: 'aws_proxy',
        },
    },
});
const createPathObject = (path) => {
    const defaultPathObject = {
        options: {
            consumes: ['application/json'],
            produces: ['application/json'],
            responses: {
                200: response200,
            },
            'x-amazon-apigateway-integration': {
                responses: {
                    default: defaultCorsResponseObject,
                },
                requestTemplates: {
                    'application/json': '{"statusCode": 200}',
                },
                passthroughBehavior: 'when_no_match',
                type: 'mock',
            },
        },
        'x-amazon-apigateway-any-method': {
            consumes: ['application/json'],
            produces: ['application/json'],
            parameters: [
                {
                    in: 'body',
                    name: 'RequestSchema',
                    required: false,
                    schema: {
                        $ref: '#/definitions/RequestSchema',
                    },
                },
            ],
            responses: {
                200: {
                    description: '200 response',
                    schema: {
                        $ref: '#/definitions/ResponseSchema',
                    },
                },
            },
            'x-amazon-apigateway-integration': {
                responses: {
                    default: {
                        statusCode: '200',
                    },
                },
                uri: cdk.Fn.join('', [
                    'arn:aws:apigateway:',
                    cdk.Fn.ref('AWS::Region'),
                    ':lambda:path/2015-03-31/functions/',
                    cdk.Fn.ref(`function${path.lambdaFunction}Arn`),
                    '/invocations',
                ]),
                passthroughBehavior: 'when_no_match',
                httpMethod: 'POST',
                type: 'aws_proxy',
            },
        },
    };
    if (path.permissions.setting !== types_1.PermissionSetting.OPEN) {
        defaultPathObject['x-amazon-apigateway-any-method'].security = [
            {
                sigv4: [],
            },
        ];
    }
    return defaultPathObject;
};
const defaultCorsResponseObject = {
    statusCode: '200',
    responseParameters: {
        'method.response.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
        'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
        'method.response.header.Access-Control-Allow-Origin': "'*'",
    },
};
const defaultCorsGatewayResponseParams = {
    'gatewayresponse.header.Access-Control-Allow-Origin': "'*'",
    'gatewayresponse.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    'gatewayresponse.header.Access-Control-Allow-Methods': "'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'",
    'gatewayresponse.header.Access-Control-Expose-Headers': "'Date,X-Amzn-ErrorType'",
};
const response200 = {
    description: '200 response',
    headers: {
        'Access-Control-Allow-Origin': {
            type: 'string',
        },
        'Access-Control-Allow-Methods': {
            type: 'string',
        },
        'Access-Control-Allow-Headers': {
            type: 'string',
        },
    },
};
//# sourceMappingURL=apigw-stack-builder.js.map