"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsSqlModelOrDirective = exports.checkForUnsupportedDirectives = void 0;
const graphql_1 = require("graphql");
const lodash_1 = __importDefault(require("lodash"));
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const checkForUnsupportedDirectives = (schema, context) => {
    const unsupportedRDSDirectives = ['searchable', 'predictions', 'function', 'manyToMany', 'http', 'mapsTo'];
    if (lodash_1.default.isEmpty(schema) || lodash_1.default.isEmpty(context.dataSourceStrategies)) {
        return;
    }
    const rdsModels = Object.entries(context.dataSourceStrategies)
        .filter(([key, value]) => (0, graphql_transformer_core_1.isSqlStrategy)(value))
        .map(([key, value]) => key);
    if (lodash_1.default.isEmpty(rdsModels)) {
        return;
    }
    const document = (0, graphql_1.parse)(schema);
    const schemaVisitor = {
        FieldDefinition: {
            enter(node, key, parent, path, ancestors) {
                var _a;
                const parentName = getParentName(ancestors);
                if (!(parentName === 'Query') && !(rdsModels === null || rdsModels === void 0 ? void 0 : rdsModels.includes(parentName))) {
                    return;
                }
                (_a = node === null || node === void 0 ? void 0 : node.directives) === null || _a === void 0 ? void 0 : _a.map((directive) => {
                    var _a, _b, _c;
                    if (unsupportedRDSDirectives.includes((_a = directive === null || directive === void 0 ? void 0 : directive.name) === null || _a === void 0 ? void 0 : _a.value)) {
                        throw unsupportedDirectiveError((_b = directive === null || directive === void 0 ? void 0 : directive.name) === null || _b === void 0 ? void 0 : _b.value, (_c = node === null || node === void 0 ? void 0 : node.name) === null || _c === void 0 ? void 0 : _c.value, parentName, unsupportedRDSDirectives);
                    }
                });
            },
        },
        ObjectTypeDefinition: {
            enter(node) {
                var _a, _b;
                const typeName = (_a = node === null || node === void 0 ? void 0 : node.name) === null || _a === void 0 ? void 0 : _a.value;
                if (!(typeName === 'Query') && !(rdsModels === null || rdsModels === void 0 ? void 0 : rdsModels.includes(typeName))) {
                    return;
                }
                (_b = node === null || node === void 0 ? void 0 : node.directives) === null || _b === void 0 ? void 0 : _b.map((directive) => {
                    var _a, _b, _c;
                    if (unsupportedRDSDirectives.includes((_a = directive === null || directive === void 0 ? void 0 : directive.name) === null || _a === void 0 ? void 0 : _a.value)) {
                        throw unsupportedDirectiveError((_b = directive === null || directive === void 0 ? void 0 : directive.name) === null || _b === void 0 ? void 0 : _b.value, undefined, (_c = node === null || node === void 0 ? void 0 : node.name) === null || _c === void 0 ? void 0 : _c.value, unsupportedRDSDirectives);
                    }
                });
            },
        },
    };
    (0, graphql_1.visit)(document, schemaVisitor);
};
exports.checkForUnsupportedDirectives = checkForUnsupportedDirectives;
const containsSqlModelOrDirective = (dataSourceStrategies, sqlDirectiveDataSourceStrategies) => {
    if (sqlDirectiveDataSourceStrategies && (sqlDirectiveDataSourceStrategies === null || sqlDirectiveDataSourceStrategies === void 0 ? void 0 : sqlDirectiveDataSourceStrategies.length) > 0) {
        return true;
    }
    return Object.values(dataSourceStrategies).some((strategy) => (0, graphql_transformer_core_1.isSqlStrategy)(strategy));
};
exports.containsSqlModelOrDirective = containsSqlModelOrDirective;
const unsupportedDirectiveError = (directiveName, fieldName, typeName, unsupportedDirectives) => {
    return new Error(`@${directiveName} directive on type "${typeName}" ${fieldName ? `and field "${fieldName}"` : ''} is not supported on a SQL datasource. Following directives are not supported on a SQL datasource: ${unsupportedDirectives.join(', ')}`);
};
const getParentName = (ancestors) => {
    var _a, _b;
    if (ancestors && (ancestors === null || ancestors === void 0 ? void 0 : ancestors.length) > 0) {
        return (_b = (_a = ancestors[ancestors.length - 1]) === null || _a === void 0 ? void 0 : _a.name) === null || _b === void 0 ? void 0 : _b.value;
    }
    return undefined;
};
//# sourceMappingURL=utils.js.map