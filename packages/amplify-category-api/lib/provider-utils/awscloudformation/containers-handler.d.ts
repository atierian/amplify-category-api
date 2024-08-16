import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { API_TYPE, ServiceConfiguration } from './service-walkthroughs/containers-walkthrough';
export declare const addResource: (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context: $TSContext, category: string, service: any, options: any, apiType: API_TYPE) => Promise<string>;
export declare const updateResource: (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context: $TSContext, category: string) => Promise<void>;
//# sourceMappingURL=containers-handler.d.ts.map