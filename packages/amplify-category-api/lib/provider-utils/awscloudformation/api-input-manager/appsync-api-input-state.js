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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _AppsyncApiInputState_cliInputsFilePath, _AppsyncApiInputState_resourceName, _AppsyncApiInputState_category, _AppsyncApiInputState_service, _AppsyncApiInputState_buildFilePath;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppsyncApiInputState = void 0;
const path = __importStar(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs = __importStar(require("fs-extra"));
class AppsyncApiInputState {
    constructor(context, resourceName) {
        this.context = context;
        _AppsyncApiInputState_cliInputsFilePath.set(this, void 0);
        _AppsyncApiInputState_resourceName.set(this, void 0);
        _AppsyncApiInputState_category.set(this, void 0);
        _AppsyncApiInputState_service.set(this, void 0);
        _AppsyncApiInputState_buildFilePath.set(this, void 0);
        __classPrivateFieldSet(this, _AppsyncApiInputState_category, amplify_cli_core_1.AmplifyCategories.API, "f");
        __classPrivateFieldSet(this, _AppsyncApiInputState_service, amplify_cli_core_1.AmplifySupportedService.APPSYNC, "f");
        __classPrivateFieldSet(this, _AppsyncApiInputState_resourceName, resourceName, "f");
        const projectBackendDirPath = amplify_cli_core_1.pathManager.getBackendDirPath();
        __classPrivateFieldSet(this, _AppsyncApiInputState_cliInputsFilePath, path.resolve(path.join(projectBackendDirPath, __classPrivateFieldGet(this, _AppsyncApiInputState_category, "f"), __classPrivateFieldGet(this, _AppsyncApiInputState_resourceName, "f"), 'cli-inputs.json')), "f");
        __classPrivateFieldSet(this, _AppsyncApiInputState_buildFilePath, path.resolve(path.join(projectBackendDirPath, __classPrivateFieldGet(this, _AppsyncApiInputState_category, "f"), __classPrivateFieldGet(this, _AppsyncApiInputState_resourceName, "f"), 'build')), "f");
    }
    async isCLIInputsValid(cliInputs = this.getCLIInputPayload()) {
        const schemaValidator = new amplify_cli_core_1.CLIInputSchemaValidator(this.context, 'appsync', __classPrivateFieldGet(this, _AppsyncApiInputState_category, "f"), 'AppSyncCLIInputs');
        return schemaValidator.validateInput(JSON.stringify(cliInputs));
    }
    getCLIInputPayload() {
        return amplify_cli_core_1.JSONUtilities.readJson(__classPrivateFieldGet(this, _AppsyncApiInputState_cliInputsFilePath, "f"), { throwIfNotExist: true });
    }
    cliInputFileExists() {
        return fs.existsSync(__classPrivateFieldGet(this, _AppsyncApiInputState_cliInputsFilePath, "f"));
    }
    async saveCLIInputPayload(cliInputs) {
        if (await this.isCLIInputsValid(cliInputs)) {
            fs.ensureDirSync(path.join(amplify_cli_core_1.pathManager.getBackendDirPath(), __classPrivateFieldGet(this, _AppsyncApiInputState_category, "f"), __classPrivateFieldGet(this, _AppsyncApiInputState_resourceName, "f")));
            amplify_cli_core_1.JSONUtilities.writeJson(__classPrivateFieldGet(this, _AppsyncApiInputState_cliInputsFilePath, "f"), cliInputs);
        }
    }
}
exports.AppsyncApiInputState = AppsyncApiInputState;
_AppsyncApiInputState_cliInputsFilePath = new WeakMap(), _AppsyncApiInputState_resourceName = new WeakMap(), _AppsyncApiInputState_category = new WeakMap(), _AppsyncApiInputState_service = new WeakMap(), _AppsyncApiInputState_buildFilePath = new WeakMap();
//# sourceMappingURL=appsync-api-input-state.js.map