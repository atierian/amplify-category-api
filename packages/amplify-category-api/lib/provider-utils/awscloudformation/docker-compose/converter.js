"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainers = void 0;
const DockerUtils_1 = require("./DockerUtils");
const container_1 = __importDefault(require("./ecs-objects/container"));
const isv1Schema = (obj) => {
    return obj && obj.version === undefined;
};
const hasHealthCheck = (obj) => {
    return obj.healthcheck !== undefined;
};
function isV38Service(obj) {
    return obj && obj.secrets !== undefined;
}
const mapComposeEntriesToContainer = (record) => {
    const [k, v] = record;
    const { image, ports, build, command, entrypoint, env_file, environment, working_dir, user } = v;
    const { container_name: name = k } = v;
    let healthcheck = {};
    if (hasHealthCheck(v)) {
        Object.entries(v).forEach((item) => {
            const [, healthVal] = item;
            if (healthVal.test !== undefined) {
                healthcheck = healthVal;
            }
        });
    }
    let portArray = [];
    ports === null || ports === void 0 ? void 0 : ports.forEach((item) => {
        const [containerPort, hostPort = containerPort] = item.toString().split(':');
        portArray.push({
            containerPort: parseInt(containerPort, 10),
            hostPort: parseInt(hostPort, 10),
            protocol: 'tcp',
        });
    });
    const secrets = new Set();
    if (isV38Service(v)) {
        v.secrets.filter((s) => typeof s === 'string').forEach((s) => secrets.add(s));
    }
    return new container_1.default(build, name, portArray, command, entrypoint, env_file, environment, image, {
        command: healthcheck.test,
        ...healthcheck,
    }, working_dir, user, secrets);
};
const convertDockerObjectToContainerArray = (yamlObject) => {
    var _a;
    let containerArr = [];
    if (isv1Schema(yamlObject)) {
        Object.entries(yamlObject).forEach((record) => {
            const container = mapComposeEntriesToContainer(record);
            containerArr.push(container);
        });
    }
    else {
        Object.entries((_a = yamlObject.services) !== null && _a !== void 0 ? _a : {}).forEach((record) => {
            const container = mapComposeEntriesToContainer(record);
            containerArr.push(container);
        });
    }
    return containerArr;
};
const findServiceDeployment = (yamlObject) => {
    var _a;
    let result = {};
    Object.entries((_a = yamlObject.services) !== null && _a !== void 0 ? _a : {}).forEach((record) => {
        const [, v] = record;
        const { deploy } = v;
        if (deploy !== undefined) {
            result = deploy;
        }
    });
    return result;
};
function getContainers(composeContents, dockerfileContents) {
    var _a;
    const dockerCompose = composeContents ? (0, DockerUtils_1.dockerComposeToObject)(composeContents) : (0, DockerUtils_1.dockerfileToObject)(dockerfileContents);
    const secrets = {};
    const { secrets: composeSecrets = {} } = dockerCompose;
    for (const secretName of Object.keys(composeSecrets)) {
        if (composeSecrets[secretName].file) {
            secrets[(_a = composeSecrets[secretName].name) !== null && _a !== void 0 ? _a : secretName] = composeSecrets[secretName].file;
        }
    }
    const containers = convertDockerObjectToContainerArray(dockerCompose);
    const buildmapping = {};
    containers.forEach((res) => {
        if (typeof res.build === 'object') {
        }
        if (typeof res.healthcheck === 'object') {
        }
        if (res.build != undefined) {
            let buildContext = '';
            if (typeof res.build === 'object') {
                buildContext = res.build.context;
            }
            else {
                buildContext = res.build;
            }
            buildmapping[res.name] = buildContext;
        }
    });
    const buildspec = (0, DockerUtils_1.generateBuildSpec)(buildmapping);
    const service = findServiceDeployment(dockerCompose);
    return {
        buildspec,
        service,
        containers,
        secrets,
    };
}
exports.getContainers = getContainers;
//# sourceMappingURL=converter.js.map