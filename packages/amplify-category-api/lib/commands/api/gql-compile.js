"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
const force_refresh_schema_1 = require("../../force-updates/force-refresh-schema");
const subcommand = 'gql-compile';
exports.name = subcommand;
const run = async (context) => {
    var _a, _b;
    if ((_b = (_a = context === null || context === void 0 ? void 0 : context.input) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.force) {
        (0, force_refresh_schema_1.forceRefreshSchema)();
    }
    return context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
};
exports.run = run;
//# sourceMappingURL=gql-compile.js.map