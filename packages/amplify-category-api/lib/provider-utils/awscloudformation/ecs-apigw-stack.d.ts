import { Construct } from 'constructs';
import { ContainersStack, ContainersStackProps } from './base-api-stack';
import { API_TYPE } from './service-walkthroughs/containers-walkthrough';
type EcsStackProps = Readonly<ContainersStackProps & {
    apiType: API_TYPE;
}>;
export declare class EcsStack extends ContainersStack {
    private readonly ecsProps;
    constructor(scope: Construct, id: string, ecsProps: EcsStackProps);
    private apiGateway;
}
export {};
//# sourceMappingURL=ecs-apigw-stack.d.ts.map