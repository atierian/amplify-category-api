"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolverConfigToConflictResolution = exports.conflictResolutionToResolverConfig = void 0;
const lodash_1 = __importDefault(require("lodash"));
const conflictResolutionToResolverConfig = (conflictResolution = {}) => {
    const result = {};
    if (lodash_1.default.isEmpty(conflictResolution))
        return undefined;
    if (conflictResolution.defaultResolutionStrategy) {
        result.project = resolutionStrategyToSyncConfig(conflictResolution.defaultResolutionStrategy);
    }
    if (conflictResolution.perModelResolutionStrategy) {
        result.models = modelSyncConfigTransformer(conflictResolution.perModelResolutionStrategy);
    }
    return result;
};
exports.conflictResolutionToResolverConfig = conflictResolutionToResolverConfig;
const resolverConfigToConflictResolution = (resolverConfig = {}) => {
    const result = {};
    if (resolverConfig.project) {
        result.defaultResolutionStrategy = syncConfigToResolutionStrategy(resolverConfig.project);
    }
    if (resolverConfig.models) {
        result.perModelResolutionStrategy = modelResolutionStrategyTransformer(resolverConfig.models);
    }
    return result;
};
exports.resolverConfigToConflictResolution = resolverConfigToConflictResolution;
const modelSyncConfigTransformer = (perModelResolutionStrategy) => {
    const result = {};
    perModelResolutionStrategy.forEach((strategy) => (result[strategy.entityName] = resolutionStrategyToSyncConfig(strategy.resolutionStrategy)));
    return result;
};
const modelResolutionStrategyTransformer = (modelSyncConfig) => {
    const result = [];
    Object.entries(modelSyncConfig)
        .map(([key, value]) => ({
        resolutionStrategy: syncConfigToResolutionStrategy(value),
        entityName: key,
    }))
        .forEach((modelStrategy) => result.push(modelStrategy));
    return result;
};
const resolutionStrategyToSyncConfig = (resolutionStrategy, newFunctionMap) => {
    const defaultMapper = () => undefined;
    return lodash_1.default.get(resolutionStrategyToSyncConfigMap, resolutionStrategy.type, defaultMapper)(resolutionStrategy);
};
const resolutionStrategyToSyncConfigMap = {
    AUTOMERGE: () => ({
        ConflictHandler: "AUTOMERGE",
        ConflictDetection: 'VERSION',
    }),
    OPTIMISTIC_CONCURRENCY: () => ({
        ConflictHandler: "OPTIMISTIC_CONCURRENCY",
        ConflictDetection: 'VERSION',
    }),
    LAMBDA: (resolutionStrategy) => {
        switch (resolutionStrategy.resolver.type) {
            case 'EXISTING': {
                const { name, region, arn } = resolutionStrategy.resolver;
                return {
                    ConflictHandler: "LAMBDA",
                    ConflictDetection: 'VERSION',
                    LambdaConflictHandler: { name, region, lambdaArn: arn },
                };
            }
            case 'NEW':
                throw new Error('Tried to convert LambdaResolutionStrategy "NEW" to SyncConfig. New resources must be generated prior to this conversion and then replaced with a LambdaResolutionStrategy of type "EXISTING"');
        }
    },
};
const syncConfigToResolutionStrategy = (syncConfig) => {
    const defaultMapper = () => ({ type: 'NONE' });
    return lodash_1.default.get(syncConfigToResolutionStrategyMap, syncConfig.ConflictHandler, defaultMapper)(syncConfig);
};
const syncConfigToResolutionStrategyMap = {
    AUTOMERGE: () => ({
        type: 'AUTOMERGE',
    }),
    OPTIMISTIC_CONCURRENCY: () => ({
        type: 'OPTIMISTIC_CONCURRENCY',
    }),
    LAMBDA: (syncConfig) => ({
        type: 'LAMBDA',
        resolver: syncConfig.LambdaConflictHandler.new
            ? {
                type: 'NEW',
            }
            : {
                type: 'EXISTING',
                name: syncConfig.LambdaConflictHandler.name,
                region: syncConfig.LambdaConflictHandler.region,
                arn: syncConfig.LambdaConflictHandler.lambdaArn,
            },
    }),
};
//# sourceMappingURL=resolver-config-to-conflict-resolution-bi-di-mapper.js.map