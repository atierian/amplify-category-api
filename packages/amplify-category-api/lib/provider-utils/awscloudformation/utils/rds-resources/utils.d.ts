import { DataSourceStrategiesProvider, ModelDataSourceStrategy, SqlDirectiveDataSourceStrategy } from '@aws-amplify/graphql-transformer-interfaces';
export declare const checkForUnsupportedDirectives: (schema: string, context: DataSourceStrategiesProvider) => void;
export declare const containsSqlModelOrDirective: (dataSourceStrategies: Record<string, ModelDataSourceStrategy>, sqlDirectiveDataSourceStrategies?: SqlDirectiveDataSourceStrategy[]) => boolean;
//# sourceMappingURL=utils.d.ts.map