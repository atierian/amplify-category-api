"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDefaults = void 0;
const uuid_1 = require("uuid");
const getAllDefaults = (project) => {
    const name = project.projectConfig.projectName.toLowerCase();
    const region = project.amplifyMeta.providers.awscloudformation.Region;
    const [shortId] = (0, uuid_1.v4)().split('-');
    const defaults = {
        resourceName: `appsync${shortId}`,
        apiName: `${name}`,
        serviceRoleName: `serviceRole${shortId}`,
        servicePolicyName: `servicePolicy${shortId}`,
        apiCreationChoice: false,
        region,
        defaultTableName: `Posts${shortId}`,
    };
    return defaults;
};
exports.getAllDefaults = getAllDefaults;
//# sourceMappingURL=appSync-defaults.js.map