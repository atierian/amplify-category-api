import { FeatureFlagProvider } from 'graphql-transformer-core';
export declare class AmplifyCLIFeatureFlagAdapterBase implements FeatureFlagProvider {
    getBoolean(featureName: string, defaultValue?: boolean): boolean;
    getNumber(featureName: string, defaultValue?: number): number;
    getObject(): object;
    protected getValue<T extends number | boolean>(featureName: string, type: 'boolean' | 'number' | 'string', defaultValue: T): T;
}
export declare class AmplifyCLIFeatureFlagAdapter extends AmplifyCLIFeatureFlagAdapterBase {
}
//# sourceMappingURL=amplify-cli-feature-flag-adapter.d.ts.map