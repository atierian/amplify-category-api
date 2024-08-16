"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../__e2e__/utils");
jest.setTimeout(2000000);
let GRAPHQL_ENDPOINT;
let GRAPHQL_CLIENT;
let ddbEmulator = null;
let dbPath = null;
let server;
describe('@searchable transformer', () => {
    beforeAll(async () => {
        const validSchema = `
      type Todo @model @searchable {
        id: ID!
      }`;
        try {
            const out = (0, utils_1.transformAndSynth)({
                ...utils_1.defaultTransformParams,
                schema: validSchema,
                transformParameters: {
                    ...utils_1.defaultTransformParams.transformParameters,
                    sandboxModeEnabled: true,
                },
            });
            let ddbClient;
            ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, utils_1.launchDDBLocal)());
            const result = await (0, utils_1.deploy)(out, ddbClient);
            server = result.simulator;
            GRAPHQL_ENDPOINT = server.url + '/graphql';
            (0, utils_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
            const apiKey = result.config.appSync.apiKey;
            (0, utils_1.logDebug)(apiKey);
            GRAPHQL_CLIENT = new utils_1.GraphQLClient(GRAPHQL_ENDPOINT, {
                'x-api-key': apiKey,
            });
        }
        catch (e) {
            (0, utils_1.logDebug)('error when setting up test');
            (0, utils_1.logDebug)(e);
            expect(true).toEqual(false);
        }
    });
    afterAll(async () => {
        try {
            if (server) {
                await server.stop();
            }
            await (0, utils_1.terminateDDB)(ddbEmulator, dbPath);
        }
        catch (e) {
            console.error(e);
            expect(true).toEqual(false);
        }
    });
    test('@searchable allows the mock server to run', async () => {
        const response = await GRAPHQL_CLIENT.query(`query {
        searchTodos {
          items {
            id
          }
        }
      }`, {});
        (0, utils_1.logDebug)(JSON.stringify(response, null, 4));
        expect(response.data.searchTodos.items).toEqual([]);
    });
});
//# sourceMappingURL=searchable-transformer.e2e.test.js.map