import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AmplifyApigwResourceTemplate, ApigwInputs, ApigwPathPolicy } from './types';
export declare class AmplifyApigwResourceStack extends cdk.Stack implements AmplifyApigwResourceTemplate {
    restApi: apigw.CfnRestApi;
    deploymentResource: apigw.CfnDeployment;
    paths: Record<string, any>;
    policies: {
        [pathName: string]: ApigwPathPolicy;
    };
    private _scope;
    private _props;
    private _cfnParameterMap;
    private _cfnParameterValues;
    private _seenLogicalIds;
    constructor(scope: Construct, id: string, props: ApigwInputs);
    addCfnOutput(props: cdk.CfnOutputProps, logicalId: string): void;
    addCfnMapping(props: cdk.CfnMappingProps, logicalId: string): void;
    addCfnCondition(props: cdk.CfnConditionProps, logicalId: string): void;
    addCfnResource(props: cdk.CfnResourceProps, logicalId: string): void;
    addCfnLambdaPermissionResource(props: lambda.CfnPermissionProps, logicalId: string): void;
    addCfnParameter(props: cdk.CfnParameterProps, logicalId: string, value?: string | Record<string, any>): void;
    getCfnParameterValues(): Record<string, any>;
    private validateLogicalId;
    private _craftPolicyDocument;
    addIamPolicyResourceForUserPoolGroup(apiResourceName: string, authRoleLogicalId: string, groupName: string, pathName: string, supportedOperations: string[]): void;
    renderCloudFormationTemplate: () => string;
    generateAdminQueriesStack: (resourceName: string, authResourceName: string) => void;
    generateStackResources: (resourceName: string) => void;
    private _constructCfnPaths;
    private _setDeploymentResource;
}
//# sourceMappingURL=apigw-stack-builder.d.ts.map