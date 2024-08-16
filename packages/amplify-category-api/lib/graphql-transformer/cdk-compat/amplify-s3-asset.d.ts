import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface TemplateProps {
    readonly fileContent: string;
    readonly fileName: string;
}
export declare class AmplifyS3Asset extends Construct implements cdk.IAsset {
    readonly assetHash: string;
    readonly httpUrl: string;
    readonly s3BucketName: string;
    readonly s3ObjectKey: string;
    readonly s3ObjectUrl: string;
    constructor(scope: Construct, id: string, props: TemplateProps);
}
//# sourceMappingURL=amplify-s3-asset.d.ts.map