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
exports.setExistingSecretArns = void 0;
const lodash_1 = __importDefault(require("lodash"));
const cdk = __importStar(require("aws-cdk-lib"));
const setExistingSecretArns = (secretsMap, cfnObj) => {
    var _a;
    if (lodash_1.default.isEmpty(cfnObj)) {
        return;
    }
    const taskDef = Object.values(cfnObj === null || cfnObj === void 0 ? void 0 : cfnObj.Resources)
        .find((value) => (value === null || value === void 0 ? void 0 : value.Type) === 'AWS::ECS::TaskDefinition');
    const containerDefs = (_a = taskDef === null || taskDef === void 0 ? void 0 : taskDef.Properties) === null || _a === void 0 ? void 0 : _a.ContainerDefinitions;
    if (!Array.isArray(containerDefs)) {
        return;
    }
    containerDefs
        .map((def) => def === null || def === void 0 ? void 0 : def.Secrets)
        .filter((secrets) => !lodash_1.default.isEmpty(secrets))
        .flat(1)
        .filter((secretDef) => !!(secretDef === null || secretDef === void 0 ? void 0 : secretDef.Name))
        .filter((secretDef) => !!secretDef.ValueFrom)
        .forEach((secretDef) => {
        if (typeof secretDef.ValueFrom === 'object' && secretDef.ValueFrom['Fn::Join']) {
            const [delimiter, values] = secretDef.ValueFrom['Fn::Join'];
            secretsMap.set(secretDef.Name, cdk.Fn.join(delimiter, values.map((val) => (val.Ref ? cdk.Fn.ref(val.Ref) : val))));
        }
        else {
            secretsMap.set(secretDef.Name, secretDef.ValueFrom);
        }
    });
};
exports.setExistingSecretArns = setExistingSecretArns;
//# sourceMappingURL=set-existing-secret-arns.js.map