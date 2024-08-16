import { DocumentNode } from 'graphql';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare class SchemaReader {
    private schemaPath;
    private schemaDocument;
    private preProcessedSchemaDocument;
    getSchemaPath: (resourceDir: string) => Promise<string>;
    invalidateCachedSchema: () => void;
    readSchema: (context: $TSContext, options: any, usePreProcessing?: boolean) => Promise<DocumentNode>;
}
export declare const schemaReader: SchemaReader;
//# sourceMappingURL=schema-reader.d.ts.map