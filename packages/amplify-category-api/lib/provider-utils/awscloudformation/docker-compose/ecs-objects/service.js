"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_API_HEALTHCHECK = {
    path: '/',
    port: 443,
};
const DEFAULT_SERVICE_DEPLYMENT_CONFIG = {
    MaximumPercent: 200,
    MinimumHealthyPercent: 100,
};
const DEFAULT_DESIRED_COUNT = 1;
const DEFAULT_TASK_MEMORY_CPU = {
    memory: 1,
    vCPU: 1,
};
const DEFAULT_CONTAINER_MEMORY_MAX = 1024;
const DEFAULT_CPU_UNIT_RESERVATION = DEFAULT_CONTAINER_MEMORY_MAX * 0.1;
const DEFAULT_CONTAINER_MEMORY_CPU = {
    memory: DEFAULT_CONTAINER_MEMORY_MAX,
    cpu: DEFAULT_CPU_UNIT_RESERVATION,
};
class Service {
    constructor(containers, apiHealthcheck = DEFAULT_API_HEALTHCHECK, dockerDeploymentConfig) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.containers = [];
        this.taskResources = DEFAULT_TASK_MEMORY_CPU;
        this.containerResources = DEFAULT_CONTAINER_MEMORY_CPU;
        this.deploymentConfiguration = DEFAULT_SERVICE_DEPLYMENT_CONFIG;
        this.desiredCount = DEFAULT_DESIRED_COUNT;
        containers.forEach((instance) => {
            this.containers.push(instance);
        });
        this.apiHealthcheck = apiHealthcheck;
        (dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.replicas) !== undefined && (this.desiredCount = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.replicas);
        ((_a = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.placement) === null || _a === void 0 ? void 0 : _a.max_replicas_per_node) !== undefined &&
            (this.deploymentConfiguration.MaximumPercent = (_b = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.placement) === null || _b === void 0 ? void 0 : _b.max_replicas_per_node);
        ((_d = (_c = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.resources) === null || _c === void 0 ? void 0 : _c.limits) === null || _d === void 0 ? void 0 : _d.memory) !== undefined &&
            (this.containerResources.memory = (_f = (_e = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.resources) === null || _e === void 0 ? void 0 : _e.limits) === null || _f === void 0 ? void 0 : _f.memory.slice(0, -1));
        ((_h = (_g = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.resources) === null || _g === void 0 ? void 0 : _g.limits) === null || _h === void 0 ? void 0 : _h.cpus) !== undefined &&
            (this.containerResources.cpu = (_k = (_j = dockerDeploymentConfig === null || dockerDeploymentConfig === void 0 ? void 0 : dockerDeploymentConfig.resources) === null || _j === void 0 ? void 0 : _j.reservations) === null || _k === void 0 ? void 0 : _k.cpus);
    }
}
exports.default = Service;
//# sourceMappingURL=service.js.map