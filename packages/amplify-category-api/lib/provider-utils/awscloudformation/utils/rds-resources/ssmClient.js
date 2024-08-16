"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSMClient = void 0;
class SSMClient {
    constructor(ssmClient) {
        this.ssmClient = ssmClient;
        this.getSecrets = async (secretNames) => {
            var _b;
            if (!secretNames || (secretNames === null || secretNames === void 0 ? void 0 : secretNames.length) === 0) {
                return [];
            }
            const result = await this.ssmClient
                .getParameters({
                Names: secretNames,
                WithDecryption: true,
            })
                .promise();
            return (_b = result === null || result === void 0 ? void 0 : result.Parameters) === null || _b === void 0 ? void 0 : _b.map(({ Name, Value }) => ({ secretName: Name, secretValue: Value }));
        };
        this.getSecretNamesByPath = async (secretPath) => {
            var _b;
            let nextToken;
            const secretNames = [];
            do {
                const result = await this.ssmClient
                    .getParametersByPath({
                    Path: secretPath,
                    MaxResults: 10,
                    ParameterFilters: [
                        {
                            Key: 'Type',
                            Option: 'Equals',
                            Values: ['SecureString'],
                        },
                    ],
                    NextToken: nextToken,
                })
                    .promise();
                secretNames.push(...(_b = result === null || result === void 0 ? void 0 : result.Parameters) === null || _b === void 0 ? void 0 : _b.map((param) => param === null || param === void 0 ? void 0 : param.Name));
                nextToken = result === null || result === void 0 ? void 0 : result.NextToken;
            } while (nextToken);
            return secretNames;
        };
        this.setSecret = async (secretName, secretValue) => {
            await this.ssmClient
                .putParameter({
                Name: secretName,
                Value: secretValue,
                Type: 'SecureString',
                Overwrite: true,
            })
                .promise();
        };
        this.deleteSecret = async (secretName) => {
            try {
                await this.ssmClient.deleteParameter({ Name: secretName }).promise();
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) !== 'ParameterNotFound') {
                    throw err;
                }
            }
        };
        this.deleteSecrets = async (secretNames) => {
            try {
                await this.ssmClient.deleteParameters({ Names: secretNames }).promise();
            }
            catch (err) {
                if ((err === null || err === void 0 ? void 0 : err.code) !== 'ParameterNotFound') {
                    throw err;
                }
            }
        };
    }
}
exports.SSMClient = SSMClient;
_a = SSMClient;
SSMClient.getInstance = async (context) => {
    if (!(SSMClient === null || SSMClient === void 0 ? void 0 : SSMClient.instance)) {
        SSMClient.instance = new SSMClient(await getSSMClient(context));
    }
    return SSMClient.instance;
};
const getSSMClient = async (context) => {
    const { client } = (await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'getConfiguredSSMClient', [
        context,
    ]));
    return client;
};
//# sourceMappingURL=ssmClient.js.map