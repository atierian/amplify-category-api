import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { ITransformer } from 'graphql-transformer-core';
export declare const getTransformerFactoryV1: (context: $TSContext, resourceDir: string, authConfig?: any) => (addSearchableTransformer: boolean, storageConfig?: any) => Promise<ITransformer[]>;
export declare const importTransformerModule: (transformerName: string) => any;
//# sourceMappingURL=transformer-factory.d.ts.map