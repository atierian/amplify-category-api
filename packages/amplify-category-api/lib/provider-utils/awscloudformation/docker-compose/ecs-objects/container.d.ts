import { ListOrDict } from '../compose-spec/v1';
import { IContainerDefinitions, PortMappings, IBuildConfig, ContainerHealthCheck, IContainerHealthCheckItem } from './types';
declare class Container implements IContainerDefinitions {
    readonly defaultLogConfiguration: {
        logDriver: string;
        options: {
            'awslogs-stream-prefix': string;
        };
    };
    build: string | IBuildConfig | undefined;
    name: string;
    portMappings: PortMappings;
    logConfiguration: {
        logDriver: string;
        options: {
            'awslogs-stream-prefix': string;
        };
    };
    command?: string[];
    entrypoint?: string[];
    env_file?: string[];
    environment?: Record<string, string>;
    image?: string;
    healthcheck?: ContainerHealthCheck;
    working_dir?: string;
    user?: string;
    secrets: Set<string>;
    constructor(build: string | IBuildConfig | undefined, name: string, portMappings: PortMappings, command?: string | string[] | undefined, entrypoint?: string | string[] | undefined, env_file?: string | string[] | undefined, environment?: ListOrDict | undefined, image?: string | undefined, healthcheck?: IContainerHealthCheckItem | undefined, working_dir?: string | undefined, user?: string | undefined, secrets?: Set<string> | undefined);
}
export default Container;
//# sourceMappingURL=container.d.ts.map