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
exports.generateBuildSpec = exports.dockerfileToObject = exports.dockerComposeToObject = void 0;
const yaml = __importStar(require("js-yaml"));
const dockerComposeToObject = (yamlFileContents) => {
    try {
        const doc = yaml.load(yamlFileContents);
        return doc;
    }
    catch (e) {
        console.log(e);
        throw e;
    }
};
exports.dockerComposeToObject = dockerComposeToObject;
const dockerfileToObject = (dockerfileContents) => {
    var _a;
    const lines = (_a = dockerfileContents === null || dockerfileContents === void 0 ? void 0 : dockerfileContents.split('\n')) !== null && _a !== void 0 ? _a : [];
    const ports = lines.filter((line) => /^\s*EXPOSE\s+/.test(line)).map((line) => line.match(/\s+(\d+)/)[1]);
    const composeContents = `version: "3"
services:
  api:
    build: .${ports.length > 0
        ? `
    ports: ${ports
            .map((port) => `
      - '${port}:${port}'`)
            .join('')}`
        : ``}
`;
    return (0, exports.dockerComposeToObject)(composeContents);
};
exports.dockerfileToObject = dockerfileToObject;
const generateBuildSpec = (containerMap) => {
    return `# Auto-Generated by Amplify. Do not modify
version: 0.2

phases:
  install:
    runtime-versions:
      docker: 19
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws --version
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
      - COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | md5sum | cut -c 1-7)
      - IMAGE_TAG=\${COMMIT_HASH:=latest}
  build:
    commands:
      - echo Build started on \`date\`
      - echo Building the Docker image...${Object.keys(containerMap)
        .map((item) => `
      - docker build -t $${item}_REPOSITORY_URI:latest ./${containerMap[item]}
      - docker tag $${item}_REPOSITORY_URI:latest $${item}_REPOSITORY_URI:$IMAGE_TAG`)
        .join('\n')}
  post_build:
    commands:
      - echo Build completed on \`date\`
      - echo Pushing the Docker images..${Object.keys(containerMap)
        .map((item) => `
      - docker push $${item}_REPOSITORY_URI:latest
      - docker push $${item}_REPOSITORY_URI:$IMAGE_TAG`)
        .join('\n')}
      - "echo \\"[${Object.keys(containerMap)
        .map((name) => `{\\\\\\\"name\\\\\\\":\\\\\\\"${name}\\\\\\\", \\\\\\\"imageUri\\\\\\\":\\\\\\\"$${name}_REPOSITORY_URI\\\\\\\"}`)
        .join(',')}]\\" > imagedefinitions.json"
artifacts:
  files: imagedefinitions.json
`;
};
exports.generateBuildSpec = generateBuildSpec;
//# sourceMappingURL=DockerUtils.js.map