"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllDefaults = void 0;
const uuid_1 = require("uuid");
const getAllDefaults = () => {
    const [shortId] = (0, uuid_1.v4)().split('-');
    const defaults = {
        resourceName: `container${shortId}`,
    };
    return defaults;
};
exports.getAllDefaults = getAllDefaults;
//# sourceMappingURL=containers-defaults.js.map