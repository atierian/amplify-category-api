"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDefaults = void 0;
const uuid_1 = require("uuid");
const getAllDefaults = (project) => {
    const name = project.projectConfig.projectName.toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');
    const [shortId] = (0, uuid_1.v4)().split('-');
    const defaults = {
        resourceName: `api${shortId}`,
        apiName: `${name}${shortId}`,
        paths: [],
    };
    return defaults;
};
exports.getAllDefaults = getAllDefaults;
//# sourceMappingURL=apigw-defaults.js.map