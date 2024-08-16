"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionSetting = exports.CrudOperation = void 0;
var CrudOperation;
(function (CrudOperation) {
    CrudOperation["CREATE"] = "create";
    CrudOperation["READ"] = "read";
    CrudOperation["UPDATE"] = "update";
    CrudOperation["DELETE"] = "delete";
})(CrudOperation = exports.CrudOperation || (exports.CrudOperation = {}));
var PermissionSetting;
(function (PermissionSetting) {
    PermissionSetting["PRIVATE"] = "private";
    PermissionSetting["PROTECTED"] = "protected";
    PermissionSetting["OPEN"] = "open";
})(PermissionSetting = exports.PermissionSetting || (exports.PermissionSetting = {}));
//# sourceMappingURL=types.js.map