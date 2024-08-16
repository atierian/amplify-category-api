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
exports.assertNotNull = exports.TransformerStackSythesizer = void 0;
const crypto = __importStar(require("crypto"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const root_stack_1 = require("./root-stack");
class TransformerStackSythesizer extends aws_cdk_lib_1.LegacyStackSynthesizer {
    constructor() {
        super(...arguments);
        this.stackAssets = new Map();
        this.mapingTemplateAssets = new Map();
    }
    synthesizeStackTemplate(stack, session) {
        if (stack instanceof root_stack_1.TransformerRootStack) {
            const template = stack.renderCloudFormationTemplate(session);
            const templateName = stack.node.id;
            this.setStackAsset(templateName, template);
            return;
        }
        throw new Error('Error synthesizing the template. Expected Stack to be either instance of TransformerRootStack or TransformerNestedStack');
    }
    synthesizeTemplate(session, _) {
        const stack = this.boundStack;
        if (stack instanceof root_stack_1.TransformerRootStack) {
            const template = stack.renderCloudFormationTemplate(session);
            const templateName = stack.node.id;
            this.setStackAsset(templateName, template);
            const contentHash = crypto.createHash('sha256').update(template).digest('hex');
            return {
                sourceHash: contentHash,
            };
        }
        throw new Error('Error synthesizing the template. Expected Stack to be either instance of TransformerRootStack or TransformerNestedStack');
    }
    setStackAsset(templateName, template) {
        this.stackAssets.set(templateName, JSON.parse(template));
    }
    collectStacks() {
        return new Map(this.stackAssets.entries());
    }
    setMappingTemplates(templateName, template) {
        this.mapingTemplateAssets.set(templateName, template);
    }
    collectMappingTemplates() {
        return new Map(this.mapingTemplateAssets.entries());
    }
    addFileAsset(asset) {
        const bucketName = this.deploymentBucket.valueAsString;
        const rootKey = this.deploymentRootKey.valueAsString;
        const objectKey = `${rootKey}/${asset.fileName}`;
        const httpUrl = `https://s3.${this.boundStack.region}.${this.boundStack.urlSuffix}/${bucketName}/${rootKey}/${asset.fileName}`;
        const s3ObjectUrl = `s3://${bucketName}/${rootKey}/${asset.fileName}`;
        return {
            bucketName,
            objectKey,
            httpUrl,
            s3ObjectUrl,
        };
    }
    ensureDeployementParameters() {
        if (!this._deploymentBucket) {
            this._deploymentBucket = new aws_cdk_lib_1.CfnParameter(this.boundStack, 'S3DeploymentBucket', {
                type: 'String',
                description: 'An S3 Bucket name where assets are deployed',
            });
        }
        if (!this._deploymentRootKey) {
            this._deploymentRootKey = new aws_cdk_lib_1.CfnParameter(this.boundStack, 'S3DeploymentRootKey', {
                type: 'String',
                description: 'An S3 key relative to the S3DeploymentBucket that points to the root of the deployment directory.',
            });
        }
    }
    get deploymentBucket() {
        this.ensureDeployementParameters();
        assertNotNull(this._deploymentBucket);
        return this._deploymentBucket;
    }
    get deploymentRootKey() {
        this.ensureDeployementParameters();
        assertNotNull(this._deploymentRootKey);
        return this._deploymentRootKey;
    }
}
exports.TransformerStackSythesizer = TransformerStackSythesizer;
function assertNotNull(x) {
    if (x === null && x === undefined) {
        throw new Error('You must call bindStack() first');
    }
}
exports.assertNotNull = assertNotNull;
//# sourceMappingURL=stack-synthesizer.js.map