"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const utils_1 = require("../utils");
const api_1 = require("./api");
async function start(context) {
    const testApi = new api_1.APITest();
    try {
        (0, utils_1.addMockDataToGitIgnore)(context);
        await testApi.start(context);
    }
    catch (e) {
        console.log(e);
        process.kill(process.pid, 'SIGTERM');
    }
}
exports.start = start;
//# sourceMappingURL=index.js.map