"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.appSyncAuthTypeToAuthConfig = exports.authConfigToAppSyncAuthType = void 0;
const lodash_1 = __importDefault(require("lodash"));
const authConfigToAppSyncAuthType = (authConfig = {}) => {
    return lodash_1.default.get(authConfigToAppSyncAuthTypeMap, authConfig.authenticationType, () => undefined)(authConfig);
};
exports.authConfigToAppSyncAuthType = authConfigToAppSyncAuthType;
const appSyncAuthTypeToAuthConfig = (authType) => {
    if (!authType)
        return undefined;
    return lodash_1.default.get(appSyncAuthTypeToAuthConfigMap, authType.mode, () => undefined)(authType);
};
exports.appSyncAuthTypeToAuthConfig = appSyncAuthTypeToAuthConfig;
const authConfigToAppSyncAuthTypeMap = {
    API_KEY: (authConfig) => {
        var _a;
        return ({
            mode: 'API_KEY',
            expirationTime: authConfig.apiKeyConfig.apiKeyExpirationDays,
            apiKeyExpirationDate: (_a = authConfig.apiKeyConfig) === null || _a === void 0 ? void 0 : _a.apiKeyExpirationDate,
            keyDescription: authConfig.apiKeyConfig.description,
        });
    },
    AWS_IAM: () => ({
        mode: 'AWS_IAM',
    }),
    AMAZON_COGNITO_USER_POOLS: (authConfig) => ({
        mode: 'AMAZON_COGNITO_USER_POOLS',
        cognitoUserPoolId: authConfig.userPoolConfig.userPoolId,
    }),
    OPENID_CONNECT: (authConfig) => ({
        mode: 'OPENID_CONNECT',
        openIDProviderName: authConfig.openIDConnectConfig.name,
        openIDIssuerURL: authConfig.openIDConnectConfig.issuerUrl,
        openIDClientID: authConfig.openIDConnectConfig.clientId,
        openIDAuthTTL: authConfig.openIDConnectConfig.authTTL,
        openIDIatTTL: authConfig.openIDConnectConfig.iatTTL,
    }),
    AWS_LAMBDA: (authConfig) => ({
        mode: 'AWS_LAMBDA',
        lambdaFunction: authConfig.lambdaAuthorizerConfig.lambdaFunction,
        ttlSeconds: authConfig.lambdaAuthorizerConfig.ttlSeconds,
    }),
};
const appSyncAuthTypeToAuthConfigMap = {
    API_KEY: (authType) => ({
        authenticationType: 'API_KEY',
        apiKeyConfig: {
            apiKeyExpirationDays: authType.expirationTime,
            apiKeyExpirationDate: authType === null || authType === void 0 ? void 0 : authType.apiKeyExpirationDate,
            description: authType.keyDescription,
        },
    }),
    AWS_IAM: () => ({
        authenticationType: 'AWS_IAM',
    }),
    AMAZON_COGNITO_USER_POOLS: (authType) => ({
        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
        userPoolConfig: {
            userPoolId: authType.cognitoUserPoolId,
        },
    }),
    OPENID_CONNECT: (authType) => ({
        authenticationType: 'OPENID_CONNECT',
        openIDConnectConfig: {
            name: authType.openIDProviderName,
            issuerUrl: authType.openIDIssuerURL,
            clientId: authType.openIDClientID,
            authTTL: authType.openIDAuthTTL,
            iatTTL: authType.openIDIatTTL,
        },
    }),
    AWS_LAMBDA: (authType) => ({
        authenticationType: 'AWS_LAMBDA',
        lambdaAuthorizerConfig: {
            lambdaFunction: authType.lambdaFunction,
            ttlSeconds: authType.ttlSeconds,
        },
    }),
};
//# sourceMappingURL=auth-config-to-app-sync-auth-type-bi-di-mapper.js.map