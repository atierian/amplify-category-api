"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyGraphQLTransformerErrorConverter = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplifyGraphQLErrorCodes = new Set([
    'InvalidDirectiveError',
    'InvalidTransformerError',
    'SchemaValidationError',
    'TransformerContractError',
    'DestructiveMigrationError',
    'InvalidMigrationError',
    'InvalidGSIMigrationError',
    'UnknownDirectiveError',
    'GraphQLError',
    'ApiCategorySchemaNotFoundError',
    'InvalidOverrideError',
]);
class AmplifyGraphQLTransformerErrorConverter {
}
exports.AmplifyGraphQLTransformerErrorConverter = AmplifyGraphQLTransformerErrorConverter;
AmplifyGraphQLTransformerErrorConverter.convert = (error) => {
    if (error instanceof Error && (error === null || error === void 0 ? void 0 : error.name) && amplifyGraphQLErrorCodes.has(error.name)) {
        const amplifyErrorType = `${error.name}`;
        return new amplify_cli_core_1.AmplifyError(amplifyErrorType, {
            message: error.message,
            ...error,
        }, error);
    }
    return error;
};
//# sourceMappingURL=amplify-error-converter.js.map