"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../__e2e__/utils");
let GRAPHQL_ENDPOINT;
let GRAPHQL_CLIENT;
let ddbEmulator = null;
let dbPath = null;
let server;
jest.setTimeout(2000000);
const runTransformer = async (validSchema) => (0, utils_1.transformAndSynth)({
    ...utils_1.defaultTransformParams,
    schema: validSchema,
    transformParameters: {
        ...utils_1.defaultTransformParams.transformParameters,
        sandboxModeEnabled: true,
    },
});
let ddbClient;
const validSchema = `
  type Post @model {
    id: ID!
    title: String!
  }
`;
describe('$util method', () => {
    beforeAll(async () => {
        try {
            const out = await runTransformer(validSchema);
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
    afterEach(async () => {
        const out = await runTransformer(validSchema);
        await (0, utils_1.reDeploy)(out, server, ddbClient);
    });
    afterAll(async () => {
        if (server) {
            await server.stop();
        }
        await (0, utils_1.terminateDDB)(ddbEmulator, dbPath);
    });
    describe('$util.validate', () => {
        let transformerOutput;
        const queryString = `
      query getPost {
        getPost(id: "10") {
          id
          title
        }
      }
    `;
        beforeEach(async () => {
            transformerOutput = await runTransformer(validSchema);
        });
        test('it should not throw error when validation condition is true', async () => {
            transformerOutput.resolvers['Query.getPost.res.vtl'] = `$util.validate(true, "Validation Error", "ValidationError", { "id": "11", "title": "Title Sent from Error" })\n$util.toJson({"id": 11, "title": "Non Error title"})`;
            await (0, utils_1.reDeploy)(transformerOutput, server, ddbClient);
            const response = await GRAPHQL_CLIENT.query(queryString, {});
            expect(response.data).toBeDefined();
            expect(response.data.getPost.id).toEqual('11');
            expect(response.data.getPost.title).toEqual('Non Error title');
            expect(response.errors).not.toBeDefined();
        });
        test('$util.validate should throw error and pass the data along with error message and error type when the condition fails', async () => {
            transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error", "ValidationError", { "id": "10", "title": "Title Sent from Error" })`;
            await (0, utils_1.reDeploy)(transformerOutput, server, ddbClient);
            const response = await GRAPHQL_CLIENT.query(queryString, {});
            expect(response.data).toBeDefined();
            expect(response.data.getPost.id).toEqual('10');
            expect(response.data.getPost.title).toEqual('Title Sent from Error');
            expect(response.errors).toBeDefined();
            expect(response.errors).toHaveLength(1);
            expect(response.errors[0].message).toEqual('Validation Error');
            expect(response.errors[0].errorType).toEqual('ValidationError');
        });
        test('$util.validate should return error message and CustomTemplateException when error type is not passed', async () => {
            transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error")`;
            await (0, utils_1.reDeploy)(transformerOutput, server, ddbClient);
            const response = await GRAPHQL_CLIENT.query(queryString, {});
            expect(response.data).toBeDefined();
            expect(response.data.getPost).toBe(null);
            expect(response.errors).toBeDefined();
            expect(response.errors).toHaveLength(1);
            expect(response.errors[0].message).toEqual('Validation Error');
            expect(response.errors[0].errorType).toEqual('CustomTemplateException');
        });
        test('$util.validate should allow overriding the error type', async () => {
            transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error", "MyErrorType")`;
            await (0, utils_1.reDeploy)(transformerOutput, server, ddbClient);
            const response = await GRAPHQL_CLIENT.query(queryString, {});
            expect(response.data).toBeDefined();
            expect(response.data.getPost).toBe(null);
            expect(response.errors).toBeDefined();
            expect(response.errors).toHaveLength(1);
            expect(response.errors[0].message).toEqual('Validation Error');
            expect(response.errors[0].errorType).toEqual('MyErrorType');
        });
    });
});
//# sourceMappingURL=util-method.e2e.test.js.map