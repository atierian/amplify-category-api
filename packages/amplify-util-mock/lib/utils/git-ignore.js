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
exports.addMockDataToGitIgnore = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const mock_data_directory_1 = require("./mock-data-directory");
function addMockDataToGitIgnore(context) {
    const gitIgnoreFilePath = context.amplify.pathManager.getGitIgnoreFilePath();
    if (fs.existsSync(gitIgnoreFilePath)) {
        const gitRoot = path.dirname(gitIgnoreFilePath);
        const mockDataDirectory = path.relative(gitRoot, (0, mock_data_directory_1.getMockDataDirectory)(context)).replace(/\\/g, '/');
        let gitIgnoreContent = fs.readFileSync(gitIgnoreFilePath).toString();
        if (gitIgnoreContent.search(RegExp(`^\\s*${mockDataDirectory}\\w*$`, 'gm')) === -1) {
            gitIgnoreContent += '\n' + mockDataDirectory;
            fs.writeFileSync(gitIgnoreFilePath, gitIgnoreContent);
        }
    }
}
exports.addMockDataToGitIgnore = addMockDataToGitIgnore;
//# sourceMappingURL=git-ignore.js.map