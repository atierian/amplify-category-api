import * as v38Types from './compose-spec/v3.8';
import Container from './ecs-objects/container';
type DockerServiceInfo = {
    buildspec: string;
    service: v38Types.DefinitionsDeployment;
    containers: Container[];
    secrets: Record<string, string>;
};
export declare function getContainers(composeContents?: string, dockerfileContents?: string): DockerServiceInfo;
export {};
//# sourceMappingURL=converter.d.ts.map