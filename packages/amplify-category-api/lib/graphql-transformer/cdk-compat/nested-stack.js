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
exports.TransformerNestedStack = void 0;
const crypto = __importStar(require("crypto"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const root_stack_1 = require("./root-stack");
const stack_synthesizer_1 = require("./stack-synthesizer");
class TransformerNestedStack extends root_stack_1.TransformerRootStack {
    constructor(scope, id, props = {}) {
        const rootStack = findRootStack(scope);
        const synthesizer = props.synthesizer || new stack_synthesizer_1.TransformerStackSythesizer();
        super(scope, id, {
            env: { account: rootStack.account, region: rootStack.region },
            ...props,
            synthesizer,
        });
        this._rootStack = rootStack;
        const parentScope = new constructs_1.Construct(scope, `${id}.NestedStack`);
        this.templateFile = `stacks/${id}.json`;
        this.parameters = props.parameters || {};
        this.resource = new aws_cdk_lib_1.CfnStack(parentScope, `${id}.NestedStackResource`, {
            templateUrl: aws_cdk_lib_1.Lazy.uncachedString({
                produce: () => {
                    return this._templateUrl || '<unresolved>';
                },
            }),
            parameters: aws_cdk_lib_1.Lazy.any({
                produce: () => (Object.keys(this.parameters).length > 0 ? this.parameters : undefined),
            }),
            notificationArns: props.notificationArns,
            timeoutInMinutes: props.timeout ? props.timeout.toMinutes() : undefined,
        });
        this.nestedStackResource = this.resource;
        this._contextualStackName = this.contextualAttribute(aws_cdk_lib_1.Aws.STACK_NAME, aws_cdk_lib_1.Fn.select(1, aws_cdk_lib_1.Fn.split('/', this.resource.ref)));
        this._contextualStackId = this.contextualAttribute(aws_cdk_lib_1.Aws.STACK_ID, this.resource.ref);
    }
    get stackName() {
        return this._contextualStackName;
    }
    get stackId() {
        return this._contextualStackId;
    }
    setParameter(name, value) {
        this.parameters[name] = value;
    }
    _prepareTemplateAsset() {
        if (this._templateUrl) {
            return false;
        }
        const cfn = JSON.stringify(this._toCloudFormation());
        const templateHash = crypto.createHash('sha256').update(cfn).digest('hex');
        const templateLocation = this._rootStack.synthesizer.addFileAsset({
            packaging: aws_cdk_lib_1.FileAssetPackaging.FILE,
            sourceHash: templateHash,
            fileName: this.templateFile,
        });
        this._templateUrl = templateLocation.httpUrl;
        return true;
    }
    contextualAttribute(innerValue, outerValue) {
        return aws_cdk_lib_1.Token.asString({
            resolve: (context) => {
                if (aws_cdk_lib_1.Stack.of(context.scope) === this) {
                    return innerValue;
                }
                else {
                    return outerValue;
                }
            },
        });
    }
}
exports.TransformerNestedStack = TransformerNestedStack;
function findRootStack(scope) {
    if (!scope) {
        throw new Error('Nested stacks cannot be defined as a root construct');
    }
    const rootStack = scope.node.scopes.find((p) => aws_cdk_lib_1.Stack.isStack(p));
    if (!rootStack) {
        throw new Error('Nested stacks must be defined within scope of another non-nested stack');
    }
    return rootStack;
}
//# sourceMappingURL=nested-stack.js.map