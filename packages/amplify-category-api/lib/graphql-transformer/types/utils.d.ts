import { Construct } from 'constructs';
import { AmplifyApiGraphQlResourceStackTemplate } from '../cdk-compat/amplify-api-resource-stack-types';
import { ConstructResourceMeta } from './types';
export declare const stacksTypes: Record<string, string>;
export declare const getStackMeta: (constructPathArr: string[], id: string, nestedStackArr: string[], node: Construct) => ConstructResourceMeta;
export declare const convertToAppsyncResourceObj: (amplifyObj: any) => AmplifyApiGraphQlResourceStackTemplate;
//# sourceMappingURL=utils.d.ts.map