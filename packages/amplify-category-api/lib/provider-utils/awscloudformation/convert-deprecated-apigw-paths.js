"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertDeperecatedRestApiPaths = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const types_1 = require("./cdk-stack-builder/types");
function convertDeperecatedRestApiPaths(deprecatedParametersFileName, deprecatedParametersFilePath, resourceName) {
    let deprecatedParameters;
    try {
        deprecatedParameters = amplify_cli_core_1.JSONUtilities.readJson(deprecatedParametersFilePath);
    }
    catch (e) {
        amplify_prompts_1.printer.error(`Error reading ${deprecatedParametersFileName} file for ${resourceName} resource`);
        throw e;
    }
    let paths = {};
    if (!Array.isArray(deprecatedParameters.paths) || deprecatedParameters.paths.length < 1) {
        throw new Error(`Expected paths to be defined in "${deprecatedParametersFilePath}", but none found.`);
    }
    deprecatedParameters.paths.forEach((path) => {
        var _a, _b, _c, _d, _e, _f, _g;
        let pathPermissionSetting = ((_a = path.privacy) === null || _a === void 0 ? void 0 : _a.open) === true
            ? types_1.PermissionSetting.OPEN
            : ((_b = path.privacy) === null || _b === void 0 ? void 0 : _b.private) === true
                ? types_1.PermissionSetting.PRIVATE
                : types_1.PermissionSetting.PROTECTED;
        let auth;
        let guest;
        let groups;
        if (typeof ((_c = path.privacy) === null || _c === void 0 ? void 0 : _c.auth) === 'string' && ['r', 'rw'].includes(path.privacy.auth)) {
            auth = _convertDeprecatedPermissionStringToCRUD(path.privacy.auth);
        }
        else if (Array.isArray((_d = path.privacy) === null || _d === void 0 ? void 0 : _d.auth)) {
            auth = _convertDeprecatedPermissionArrayToCRUD(path.privacy.auth);
        }
        if (typeof ((_e = path.privacy) === null || _e === void 0 ? void 0 : _e.unauth) === 'string' && ['r', 'rw'].includes(path.privacy.unauth)) {
            guest = _convertDeprecatedPermissionStringToCRUD(path.privacy.unauth);
        }
        else if (Array.isArray((_f = path.privacy) === null || _f === void 0 ? void 0 : _f.unauth)) {
            guest = _convertDeprecatedPermissionArrayToCRUD(path.privacy.unauth);
        }
        if ((_g = path.privacy) === null || _g === void 0 ? void 0 : _g.userPoolGroups) {
            groups = {};
            for (const [userPoolGroupName, crudOperations] of Object.entries(path.privacy.userPoolGroups)) {
                if (typeof crudOperations === 'string' && ['r', 'rw'].includes(crudOperations)) {
                    groups[userPoolGroupName] = _convertDeprecatedPermissionStringToCRUD(crudOperations);
                }
                else if (Array.isArray(crudOperations)) {
                    groups[userPoolGroupName] = _convertDeprecatedPermissionArrayToCRUD(crudOperations);
                }
            }
        }
        paths[path.name] = {
            permissions: {
                setting: pathPermissionSetting,
                auth,
                guest,
                groups,
            },
            lambdaFunction: path.lambdaFunction,
        };
    });
    return paths;
}
exports.convertDeperecatedRestApiPaths = convertDeperecatedRestApiPaths;
function _convertDeprecatedPermissionStringToCRUD(deprecatedPrivacy) {
    let privacyList;
    if (deprecatedPrivacy === 'r') {
        privacyList = [types_1.CrudOperation.READ];
    }
    else if (deprecatedPrivacy === 'rw') {
        privacyList = [types_1.CrudOperation.CREATE, types_1.CrudOperation.READ, types_1.CrudOperation.UPDATE, types_1.CrudOperation.DELETE];
    }
    return privacyList;
}
function _convertDeprecatedPermissionArrayToCRUD(deprecatedPrivacyArray) {
    const opMap = {
        '/POST': types_1.CrudOperation.CREATE,
        '/GET': types_1.CrudOperation.READ,
        '/PUT': types_1.CrudOperation.UPDATE,
        '/PATCH': types_1.CrudOperation.UPDATE,
        '/DELETE': types_1.CrudOperation.DELETE,
    };
    return Array.from(new Set(deprecatedPrivacyArray.map((op) => opMap[op])));
}
//# sourceMappingURL=convert-deprecated-apigw-paths.js.map