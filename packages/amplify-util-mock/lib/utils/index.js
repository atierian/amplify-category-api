"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._isUnsupportedJavaVersion = exports.checkJavaVersion = exports.getAmplifyMeta = exports.addMockDataToGitIgnore = exports.getMockDataDirectory = void 0;
var mock_data_directory_1 = require("./mock-data-directory");
Object.defineProperty(exports, "getMockDataDirectory", { enumerable: true, get: function () { return mock_data_directory_1.getMockDataDirectory; } });
var git_ignore_1 = require("./git-ignore");
Object.defineProperty(exports, "addMockDataToGitIgnore", { enumerable: true, get: function () { return git_ignore_1.addMockDataToGitIgnore; } });
async function getAmplifyMeta(context) {
    const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
    return context.amplify.readJsonFile(amplifyMetaFilePath);
}
exports.getAmplifyMeta = getAmplifyMeta;
const which = __importStar(require("which"));
const execa = __importStar(require("execa"));
const semver = __importStar(require("semver"));
const minJavaVersion = '>=1.8 <= 2.0 ||  >=8.0';
const checkJavaVersion = async (context) => {
    const executablePath = which.sync('java', {
        nothrow: true,
    });
    if (executablePath === null) {
        context.print.error(`Unable to find Java version ${minJavaVersion} on the path. Download link: https://amzn.to/2UUljp9`);
    }
    const result = execa.sync('java', ['-version']);
    if (result.exitCode !== 0) {
        context.print.error(`java failed, exit code was ${result.exitCode}`);
    }
    if (isUnsupportedJavaVersion(result.stderr)) {
        context.print.warning(`Update java to 8+`);
    }
};
exports.checkJavaVersion = checkJavaVersion;
function isUnsupportedJavaVersion(stderr) {
    const regex = /version "(\d+)(\.(\d+\.)(\d))?/g;
    const versionStrings = stderr ? stderr.split(/\r?\n/) : [''];
    const mayVersion = versionStrings.map((line) => line.match(regex)).find((v) => v != null);
    if (mayVersion === undefined) {
        return true;
    }
    const version = mayVersion[0].replace('version "', '');
    const semVer = version.match(/^\d+$/g) === null ? version : `${version}.0.0`;
    return !semver.satisfies(semVer, minJavaVersion);
}
exports._isUnsupportedJavaVersion = isUnsupportedJavaVersion;
//# sourceMappingURL=index.js.map