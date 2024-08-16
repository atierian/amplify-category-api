"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDataStoreEnabled = void 0;
const graphql_transformer_core_1 = require("graphql-transformer-core");
const context_util_1 = require("./context-util");
const isDataStoreEnabled = async (context) => {
    const resourceDirectory = await context_util_1.contextUtil.getResourceDir(context, { forceCompile: true });
    return (0, graphql_transformer_core_1.isDataStoreEnabled)(resourceDirectory);
};
exports.isDataStoreEnabled = isDataStoreEnabled;
//# sourceMappingURL=is-datastore-enabled.js.map