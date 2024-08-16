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
exports.getServiceWalkthrough = exports.datasourceMetadataFor = exports.serviceMetadataFor = void 0;
const path = __importStar(require("path"));
const serviceMetadataFor = async (service) => { var _a; return (await (_a = path.join('..', '..', 'supported-services'), Promise.resolve().then(() => __importStar(require(_a))))).supportedServices[service]; };
exports.serviceMetadataFor = serviceMetadataFor;
const datasourceMetadataFor = async (datasource) => { var _a; return (await (_a = path.join('..', '..', 'supported-datasources'), Promise.resolve().then(() => __importStar(require(_a))))).supportedDataSources[datasource]; };
exports.datasourceMetadataFor = datasourceMetadataFor;
const getServiceWalkthrough = async (walkthroughFilename) => { var _a; return (await (_a = path.join('..', 'service-walkthroughs', walkthroughFilename), Promise.resolve().then(() => __importStar(require(_a))))).serviceWalkthrough; };
exports.getServiceWalkthrough = getServiceWalkthrough;
//# sourceMappingURL=dynamic-imports.js.map