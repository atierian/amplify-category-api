"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkForcedUpdates = void 0;
const auth_notifications_1 = require("./auth-notifications");
const checkForcedUpdates = async (context) => {
    await (0, auth_notifications_1.notifySecurityEnhancement)(context);
    let securityChangeNotified = false;
    securityChangeNotified = await (0, auth_notifications_1.notifyFieldAuthSecurityChange)(context);
    if (!securityChangeNotified) {
        securityChangeNotified = await (0, auth_notifications_1.notifyListQuerySecurityChange)(context);
    }
};
exports.checkForcedUpdates = checkForcedUpdates;
//# sourceMappingURL=index.js.map