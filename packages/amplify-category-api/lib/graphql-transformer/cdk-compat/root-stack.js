"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformerRootStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
class TransformerRootStack extends aws_cdk_lib_1.Stack {
    constructor() {
        super(...arguments);
        this.resourceTypeToPreserveLogicalName = [
            'AWS::DynamoDB::Table',
            'AWS::Elasticsearch::Domain',
            'AWS::RDS::DBCluster',
            'AWS::CloudFormation::Stack',
            'AWS::AppSync::GraphQLApi',
        ];
        this.allocateLogicalId = (cfnElement) => {
            const regExPattern = /[^A-Za-z0-9]/g;
            if (cfnElement instanceof aws_cdk_lib_1.CfnResource && this.resourceTypeToPreserveLogicalName.includes(cfnElement.cfnResourceType)) {
                const scope = cfnElement.node.scopes.reverse().find((scope) => scope.node.id !== 'Resource');
                if (scope) {
                    const logicalId = scope.node.id.replace('.NestedStackResource', '');
                    if (!regExPattern.test(logicalId))
                        return logicalId;
                }
            }
            return super.allocateLogicalId(cfnElement);
        };
        this.renderCloudFormationTemplate = (_) => {
            return JSON.stringify(this._toCloudFormation(), undefined, 2);
        };
    }
}
exports.TransformerRootStack = TransformerRootStack;
//# sourceMappingURL=root-stack.js.map