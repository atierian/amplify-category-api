import { Construct } from 'constructs';
import { ContainersStack, ContainersStackProps } from './base-api-stack';
type EcsStackProps = ContainersStackProps & Readonly<{
    domainName: string;
    hostedZoneId?: string;
    authName: string;
}>;
export declare class EcsAlbStack extends ContainersStack {
    private readonly ecsProps;
    private readonly userPoolDomain;
    constructor(scope: Construct, id: string, ecsProps: EcsStackProps);
    private alb;
}
export {};
//# sourceMappingURL=ecs-alb-stack.d.ts.map