"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_client_1 = require("./utils/graphql-client");
const index_1 = require("./utils/index");
jest.setTimeout(1000 * 30);
let graphqlClient;
let server;
let dbPath;
let ddbEmulator;
beforeAll(async () => {
    const validSchema = `
    type Todo @model @mapsTo(name: "Task") @auth(rules: [{allow: public}]) {
        id: ID!
        title: String!
        description: String
    }
    `;
    try {
        const out = (0, index_1.transformAndSynth)({
            ...index_1.defaultTransformParams,
            schema: validSchema,
            transformParameters: {
                ...index_1.defaultTransformParams.transformParameters,
                useSubUsernameForDefaultIdentityClaim: false,
            },
        });
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        const endpoint = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${endpoint}`);
        const apiKey = result.config.appSync.apiKey;
        graphqlClient = new graphql_client_1.GraphQLClient(endpoint, { 'x-api-key': apiKey });
    }
    catch (e) {
        (0, index_1.logDebug)(e);
        console.warn(`Could not setup mock server: ${e}`);
    }
});
afterAll(async () => {
    try {
        if (server) {
            await server.stop();
        }
        await (0, index_1.terminateDDB)(ddbEmulator, dbPath);
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
test('Model with original name specified points to original table', async () => {
    var _a, _b, _c, _d;
    const response = await graphqlClient.query(`mutation {
        createTodo(input: {title: "Test Todo"}) {
            id
            title
        }
    }`, {});
    (0, index_1.logDebug)(JSON.stringify(response, null, 2));
    expect((_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.createTodo) === null || _b === void 0 ? void 0 : _b.id).toBeDefined();
    expect((_d = (_c = response === null || response === void 0 ? void 0 : response.data) === null || _c === void 0 ? void 0 : _c.createTodo) === null || _d === void 0 ? void 0 : _d.title).toEqual('Test Todo');
});
//# sourceMappingURL=model-with-maps-to.e2e.test.js.map