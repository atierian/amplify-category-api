"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformGraphQLSchema = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_error_converter_1 = require("../errors/amplify-error-converter");
const transform_graphql_schema_v1_1 = require("./transform-graphql-schema-v1");
const transform_graphql_schema_v2_1 = require("./transform-graphql-schema-v2");
const transformGraphQLSchema = async (context, options) => {
    try {
        const transformerVersion = await amplify_cli_core_1.ApiCategoryFacade.getTransformerVersion(context);
        return transformerVersion === 2 ? await (0, transform_graphql_schema_v2_1.transformGraphQLSchemaV2)(context, options) : await (0, transform_graphql_schema_v1_1.transformGraphQLSchemaV1)(context, options);
    }
    catch (error) {
        throw amplify_error_converter_1.AmplifyGraphQLTransformerErrorConverter.convert(error);
    }
};
exports.transformGraphQLSchema = transformGraphQLSchema;
//# sourceMappingURL=transform-graphql-schema.js.map