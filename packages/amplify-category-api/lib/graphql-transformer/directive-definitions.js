"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDirectiveDefinitions = void 0;
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const graphql_1 = require("graphql");
const graphql_transformer_1 = require("@aws-amplify/graphql-transformer");
const transformer_factory_1 = require("./transformer-factory");
const transformer_version_1 = require("./transformer-version");
const transformer_options_v2_1 = require("./transformer-options-v2");
const getDirectiveDefinitions = async (context, resourceDir) => {
    const transformerVersion = await (0, transformer_version_1.getTransformerVersion)(context);
    const transformList = transformerVersion === 2 ? await getTransformListV2(resourceDir) : await (0, transformer_factory_1.getTransformerFactoryV1)(context, resourceDir)(true);
    const transformDirectives = transformList
        .map((transform) => [transform.directive, ...transform.typeDefinitions].map((node) => (0, graphql_1.print)(node)).join('\n'))
        .join('\n');
    return [(0, graphql_transformer_core_1.getAppSyncServiceExtraDirectives)(), transformDirectives].join('\n');
};
exports.getDirectiveDefinitions = getDirectiveDefinitions;
const getTransformListV2 = async (resourceDir) => (0, graphql_transformer_1.constructTransformerChain)({
    customTransformers: await (0, transformer_options_v2_1.loadCustomTransformersV2)(resourceDir),
});
//# sourceMappingURL=directive-definitions.js.map