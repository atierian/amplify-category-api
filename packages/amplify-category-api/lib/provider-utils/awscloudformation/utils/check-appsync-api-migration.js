"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkAppsyncApiResourceMigration = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const appsync_api_input_state_1 = require("../api-input-manager/appsync-api-input-state");
const migrate_api_override_resource_1 = require("./migrate-api-override-resource");
const checkAppsyncApiResourceMigration = async (context, apiName, isUpdate) => {
    var _a, _b, _c;
    const cliState = new appsync_api_input_state_1.AppsyncApiInputState(context, apiName);
    if (!cliState.cliInputFileExists()) {
        amplify_prompts_1.printer.debug('cli-inputs.json doesnt exist');
        const headlessMigrate = ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.yes) || ((_b = context.input.options) === null || _b === void 0 ? void 0 : _b.forcePush) || ((_c = context.input.options) === null || _c === void 0 ? void 0 : _c.headless);
        if (headlessMigrate || (await amplify_prompts_1.prompter.yesOrNo((0, amplify_cli_core_1.getMigrateResourceMessageForOverride)(amplify_cli_core_1.AmplifyCategories.API, apiName, isUpdate), true))) {
            await (0, migrate_api_override_resource_1.migrateResourceToSupportOverride)(apiName);
            return true;
        }
        return false;
    }
    return true;
};
exports.checkAppsyncApiResourceMigration = checkAppsyncApiResourceMigration;
//# sourceMappingURL=check-appsync-api-migration.js.map