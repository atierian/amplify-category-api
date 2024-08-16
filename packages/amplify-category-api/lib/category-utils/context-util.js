"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contextUtil = exports.ContextUtil = exports.APPSYNC_RESOURCE_SERVICE = void 0;
const path_1 = __importDefault(require("path"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const fs_extra_1 = __importDefault(require("fs-extra"));
const constants_1 = require("../graphql-transformer/constants");
exports.APPSYNC_RESOURCE_SERVICE = 'AppSync';
class ContextUtil {
    constructor() {
        this.getResourceDir = async (context, options) => {
            if (this.resourceDir) {
                return this.resourceDir;
            }
            let { resourceDir } = options;
            const { forceCompile } = options;
            const backEndDir = amplify_cli_core_1.pathManager.getBackendDirPath();
            const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(amplify_cli_core_1.AmplifyCategories.API);
            let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
            const resourceNeedCompile = allResources
                .filter((r) => !resources.includes(r))
                .filter((r) => {
                const buildDir = path_1.default.normalize(path_1.default.join(backEndDir, amplify_cli_core_1.AmplifyCategories.API, r.resourceName, 'build'));
                return !fs_extra_1.default.existsSync(buildDir);
            });
            resources = resources.concat(resourceNeedCompile);
            if (forceCompile) {
                resources = resources.concat(allResources);
            }
            resources = resources.filter((resource) => resource.service === exports.APPSYNC_RESOURCE_SERVICE);
            if (!resourceDir) {
                if (!resources.length) {
                    return undefined;
                }
                if (resources.length > 0) {
                    const resource = resources[0];
                    if (resource.providerPlugin !== constants_1.PROVIDER_NAME) {
                        return undefined;
                    }
                    const { category } = resource;
                    const { resourceName } = resource;
                    resourceDir = path_1.default.normalize(path_1.default.join(backEndDir, category, resourceName));
                }
            }
            this.resourceDir = resourceDir;
            return resourceDir;
        };
    }
}
exports.ContextUtil = ContextUtil;
exports.contextUtil = new ContextUtil();
//# sourceMappingURL=context-util.js.map