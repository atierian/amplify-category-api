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
exports.EcsStack = void 0;
const apigw2 = __importStar(require("aws-cdk-lib/aws-apigatewayv2"));
const apigw2alpha = __importStar(require("@aws-cdk/aws-apigatewayv2-alpha"));
const cdk = __importStar(require("aws-cdk-lib"));
const base_api_stack_1 = require("./base-api-stack");
const containers_walkthrough_1 = require("./service-walkthroughs/containers-walkthrough");
class EcsStack extends base_api_stack_1.ContainersStack {
    constructor(scope, id, ecsProps) {
        super(scope, id, {
            ...ecsProps,
            createCloudMapService: true,
        });
        this.ecsProps = ecsProps;
        const { apiType } = this.ecsProps;
        const { api } = this.apiGateway();
        switch (apiType) {
            case containers_walkthrough_1.API_TYPE.GRAPHQL:
                new cdk.CfnOutput(this, 'GraphQLAPIEndpointOutput', { value: api.attrApiEndpoint });
                break;
            case containers_walkthrough_1.API_TYPE.REST:
                new cdk.CfnOutput(this, 'ApiName', { value: ecsProps.apiName });
                new cdk.CfnOutput(this, 'RootUrl', { value: api.attrApiEndpoint });
                break;
            default: {
                const invalidApiType = apiType;
                throw new Error(`Invalid api type ${invalidApiType}`);
            }
        }
    }
    apiGateway() {
        const { apiName } = this.ecsProps;
        const api = new apigw2.CfnApi(this, 'Api', {
            name: `${this.envName}-${apiName}`,
            protocolType: 'HTTP',
            corsConfiguration: {
                allowHeaders: ['*'],
                allowOrigins: ['*'],
                allowMethods: Object.values(apigw2alpha.HttpMethod).filter((m) => m !== apigw2alpha.HttpMethod.ANY),
            },
        });
        new apigw2.CfnStage(this, 'Stage', {
            apiId: cdk.Fn.ref(api.logicalId),
            stageName: '$default',
            autoDeploy: true,
        });
        const integration = new apigw2.CfnIntegration(this, 'ANYIntegration', {
            apiId: cdk.Fn.ref(api.logicalId),
            integrationType: apigw2alpha.HttpIntegrationType.HTTP_PROXY,
            connectionId: this.vpcLinkId,
            connectionType: apigw2alpha.HttpConnectionType.VPC_LINK,
            integrationMethod: 'ANY',
            integrationUri: this.cloudMapService.attrArn,
            payloadFormatVersion: '1.0',
        });
        const authorizer = new apigw2.CfnAuthorizer(this, 'Authorizer', {
            name: `${apiName}Authorizer`,
            apiId: cdk.Fn.ref(api.logicalId),
            authorizerType: 'JWT',
            jwtConfiguration: {
                audience: [this.appClientId],
                issuer: cdk.Fn.join('', ['https://cognito-idp.', cdk.Aws.REGION, '.amazonaws.com/', this.userPoolId]),
            },
            identitySource: ['$request.header.Authorization'],
        });
        authorizer.cfnOptions.condition = this.isAuthCondition;
        new apigw2.CfnRoute(this, 'DefaultRoute', {
            apiId: cdk.Fn.ref(api.logicalId),
            routeKey: '$default',
            target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
            authorizationScopes: [],
            authorizationType: cdk.Fn.conditionIf(this.isAuthCondition.logicalId, 'JWT', 'NONE'),
            authorizerId: cdk.Fn.conditionIf(this.isAuthCondition.logicalId, cdk.Fn.ref(authorizer.logicalId), ''),
        });
        new apigw2.CfnRoute(this, 'OptionsRoute', {
            apiId: cdk.Fn.ref(api.logicalId),
            routeKey: 'OPTIONS /{proxy+}',
            target: cdk.Fn.join('', ['integrations/', cdk.Fn.ref(integration.logicalId)]),
        });
        return {
            api,
        };
    }
}
exports.EcsStack = EcsStack;
//# sourceMappingURL=ecs-apigw-stack.js.map