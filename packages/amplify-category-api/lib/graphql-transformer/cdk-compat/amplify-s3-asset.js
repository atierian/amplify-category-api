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
exports.AmplifyS3Asset = void 0;
const crypto = __importStar(require("crypto"));
const aws_cdk_lib_1 = require("aws-cdk-lib");
const constructs_1 = require("constructs");
const stack_synthesizer_1 = require("./stack-synthesizer");
class AmplifyS3Asset extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        const rootStack = findRootStack(scope);
        const sythesizer = rootStack.synthesizer;
        if (sythesizer.constructor.name === stack_synthesizer_1.TransformerStackSythesizer.name) {
            sythesizer.setMappingTemplates(props.fileName, props.fileContent);
            this.assetHash = crypto.createHash('sha256').update(props.fileContent).digest('hex');
            const asset = sythesizer.addFileAsset({
                fileName: props.fileName,
                packaging: aws_cdk_lib_1.FileAssetPackaging.FILE,
                sourceHash: this.assetHash,
            });
            this.httpUrl = asset.httpUrl;
            this.s3BucketName = asset.bucketName;
            this.s3ObjectKey = asset.objectKey;
            this.s3ObjectUrl = asset.s3ObjectUrl;
        }
        else {
            throw new Error('Template asset can be used only with TransformerStackSynthesizer');
        }
    }
}
exports.AmplifyS3Asset = AmplifyS3Asset;
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
//# sourceMappingURL=amplify-s3-asset.js.map