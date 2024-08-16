"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defineGlobalSandboxMode = void 0;
function defineGlobalSandboxMode(link) {
    return `# This "input" configures a global authorization rule to enable public access to
# all models in this schema. Learn more about authorization rules here: ${link}
input AMPLIFY { globalAuthRule: AuthRule = { allow: public } } # FOR TESTING ONLY!\n
`;
}
exports.defineGlobalSandboxMode = defineGlobalSandboxMode;
//# sourceMappingURL=global-sandbox-mode.js.map