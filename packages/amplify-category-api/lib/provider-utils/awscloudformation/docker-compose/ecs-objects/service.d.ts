import * as v38Types from '../compose-spec/v3.8';
import { IServiceDefinition, ServiceHealthCheck, DeploymentConfiguration, ContainerConfig, TaskConfig } from './types';
import Container from './container';
declare class Service implements IServiceDefinition {
    containers: Container[];
    apiHealthcheck?: ServiceHealthCheck;
    taskResources: TaskConfig;
    containerResources: ContainerConfig;
    deploymentConfiguration: DeploymentConfiguration;
    desiredCount: number;
    constructor(containers: Container[], apiHealthcheck?: ServiceHealthCheck, dockerDeploymentConfig?: v38Types.DefinitionsDeployment2);
}
export default Service;
//# sourceMappingURL=service.d.ts.map