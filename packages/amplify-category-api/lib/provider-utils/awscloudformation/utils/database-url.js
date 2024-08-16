"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDatabaseUrl = void 0;
const url_1 = require("url");
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const parseDatabaseUrl = (databaseUrl) => {
    var _a, _b;
    const allowedProtocols = ['mysql', 'mysql2'];
    try {
        const parsedDatabaseUrl = new url_1.URL(databaseUrl);
        const { username, password, hostname: host } = parsedDatabaseUrl;
        const database = (_a = parsedDatabaseUrl === null || parsedDatabaseUrl === void 0 ? void 0 : parsedDatabaseUrl.pathname) === null || _a === void 0 ? void 0 : _a.slice(1);
        const port = parseInt(parsedDatabaseUrl === null || parsedDatabaseUrl === void 0 ? void 0 : parsedDatabaseUrl.port, 10);
        const engine = (_b = parsedDatabaseUrl === null || parsedDatabaseUrl === void 0 ? void 0 : parsedDatabaseUrl.protocol) === null || _b === void 0 ? void 0 : _b.slice(0, -1);
        const isValidEngine = allowedProtocols.includes(engine);
        if (!isValidEngine) {
            throw new amplify_cli_core_1.AmplifyError('InputValidationError', {
                message: `Invalid engine ${engine}.`,
            });
        }
        const config = {
            engine,
            username,
            password,
            database,
            host,
            port,
        };
        return config;
    }
    catch (err) {
        if (err.code !== 'ERR_INVALID_URL') {
            throw err;
        }
    }
    return {};
};
exports.parseDatabaseUrl = parseDatabaseUrl;
//# sourceMappingURL=database-url.js.map