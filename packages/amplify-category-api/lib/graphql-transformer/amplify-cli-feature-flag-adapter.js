"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmplifyCLIFeatureFlagAdapter = exports.AmplifyCLIFeatureFlagAdapterBase = void 0;
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
class AmplifyCLIFeatureFlagAdapterBase {
    getBoolean(featureName, defaultValue) {
        return this.getValue(featureName, 'boolean', defaultValue);
    }
    getNumber(featureName, defaultValue) {
        return this.getValue(featureName, 'number', defaultValue);
    }
    getObject() {
        throw new Error('Not implemented');
    }
    getValue(featureName, type, defaultValue) {
        const keyName = `graphQLTransformer.${featureName}`;
        try {
            switch (type) {
                case 'boolean':
                    return amplify_cli_core_1.FeatureFlags.getBoolean(keyName);
                case 'number':
                    return amplify_cli_core_1.FeatureFlags.getNumber(keyName);
            }
        }
        catch (e) {
            if (defaultValue) {
                return defaultValue;
            }
            throw e;
        }
    }
}
exports.AmplifyCLIFeatureFlagAdapterBase = AmplifyCLIFeatureFlagAdapterBase;
class AmplifyCLIFeatureFlagAdapter extends AmplifyCLIFeatureFlagAdapterBase {
}
exports.AmplifyCLIFeatureFlagAdapter = AmplifyCLIFeatureFlagAdapter;
//# sourceMappingURL=amplify-cli-feature-flag-adapter.js.map