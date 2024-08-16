"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthModeUpdated = void 0;
const lodash_1 = __importDefault(require("lodash"));
function isAuthModeUpdated(options) {
    const { authConfig, previousAuthConfig } = getAuthConfigForCompare(options);
    return authConfig && previousAuthConfig && !lodash_1.default.isEqual(authConfig, previousAuthConfig);
}
exports.isAuthModeUpdated = isAuthModeUpdated;
function getAuthConfigForCompare(options) {
    var _a, _b;
    if (!(options.authConfig && options.previousAuthConfig)) {
        return {};
    }
    let authConfig = lodash_1.default.cloneDeep(options.authConfig);
    let previousAuthConfig = lodash_1.default.cloneDeep(options.previousAuthConfig);
    if (authConfig) {
        authConfig.defaultAuthentication = removeApiKeyExpirationDate(authConfig.defaultAuthentication);
        authConfig.additionalAuthenticationProviders = (_a = authConfig.additionalAuthenticationProviders) === null || _a === void 0 ? void 0 : _a.map((mode) => removeApiKeyExpirationDate(mode));
    }
    if (previousAuthConfig) {
        previousAuthConfig.defaultAuthentication = removeApiKeyExpirationDate(previousAuthConfig.defaultAuthentication);
        previousAuthConfig.additionalAuthenticationProviders = (_b = previousAuthConfig.additionalAuthenticationProviders) === null || _b === void 0 ? void 0 : _b.map((mode) => removeApiKeyExpirationDate(mode));
    }
    return {
        authConfig,
        previousAuthConfig,
    };
}
function removeApiKeyExpirationDate(mode) {
    if (mode === null || mode === void 0 ? void 0 : mode.apiKeyConfig) {
        delete mode.apiKeyConfig.apiKeyExpirationDate;
    }
    return mode;
}
//# sourceMappingURL=auth-mode-compare.js.map