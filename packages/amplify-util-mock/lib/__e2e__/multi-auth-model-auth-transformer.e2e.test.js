"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_appsync_1 = __importStar(require("aws-appsync"));
const graphql_auth_transformer_1 = require("graphql-auth-transformer");
const graphql_connection_transformer_1 = require("graphql-connection-transformer");
const graphql_dynamodb_transformer_1 = require("graphql-dynamodb-transformer");
const graphql_tag_1 = __importDefault(require("graphql-tag"));
const graphql_transformer_core_1 = require("graphql-transformer-core");
const cognito_utils_1 = require("./utils/cognito-utils");
const index_1 = require("./utils/index");
require("isomorphic-fetch");
jest.setTimeout(2000000);
const REGION = 'us-west-2';
let ddbEmulator = null;
let dbPath = null;
let server;
let GRAPHQL_ENDPOINT = undefined;
let APIKEY_GRAPHQL_CLIENT = undefined;
let USER_POOL_AUTH_CLIENT = undefined;
let USER_POOL_ID = 'fake_user_pool';
const USERNAME1 = 'user1@test.com';
beforeAll(async () => {
    const validSchema = `
    # Allow anyone to access. This is translated into API_KEY.
    type PostPublic @model @auth(rules: [{ allow: public }]) {
        id: ID!
        title: String
    }

    # Allow anyone to access. This is translated to IAM with unauth role.
    type PostPublicIAM @model @auth(rules: [{ allow: public, provider: iam }]) {
        id: ID!
        title: String
    }

    # Allow anyone with a valid Amazon Cognito UserPools JWT to access.
    type PostPrivate @model @auth(rules: [{ allow: private }]) {
        id: ID!
        title: String
    }

    # Allow anyone with a sigv4 signed request with relevant policy to access.
    type PostPrivateIAM @model @auth(rules: [{ allow: private, provider: iam }]) {
        id: ID!
        title: String
    }

    # I have a model that is protected by userPools by default.
    # I want to call createPost from my lambda.
    type PostOwnerIAM @model
    @auth (
        rules: [
            # The cognito user pool owner can CRUD.
            { allow: owner },
            # A lambda function using IAM can call Mutation.createPost.
            { allow: private, provider: iam, operations: [create] }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
    }

    type PostSecretFieldIAM @model
    @auth (
        rules: [
            # The cognito user pool and can CRUD.
            { allow: private }
        ]
    )
    {
        id: ID!
        title: String
        owner: String
        secret: String
            @auth (
                rules: [
                    # Only a lambda function using IAM can create/update this field
                    { allow: private, provider: iam, operations: [create, update] }
                ]
            )
    }

    type PostConnection @model @auth(rules:[{allow: public}]){
        id: ID!
        title: String!
        comments: [CommentConnection] @connection(name: "PostComments")
    }

    type CommentConnection @model {
        id: ID!
        content: String!
        post: PostConnection @connection(name: "PostComments")
    }
    `;
    const transformer = new graphql_transformer_core_1.GraphQLTransform({
        transformers: [
            new graphql_dynamodb_transformer_1.DynamoDBModelTransformer(),
            new graphql_connection_transformer_1.ModelConnectionTransformer(),
            new graphql_auth_transformer_1.ModelAuthTransformer({
                authConfig: {
                    defaultAuthentication: {
                        authenticationType: 'AMAZON_COGNITO_USER_POOLS',
                    },
                    additionalAuthenticationProviders: [
                        {
                            authenticationType: 'API_KEY',
                            apiKeyConfig: {
                                description: 'E2E Test API Key',
                                apiKeyExpirationDays: 300,
                            },
                        },
                        {
                            authenticationType: 'AWS_IAM',
                        },
                    ],
                },
            }),
        ],
        featureFlags: {
            getBoolean: (name) => name === 'improvePluralization',
        },
    });
    try {
        const out = transformer.transform(validSchema);
        let ddbClient;
        ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await (0, index_1.launchDDBLocal)());
        const result = await (0, index_1.deploy)(out, ddbClient);
        server = result.simulator;
        GRAPHQL_ENDPOINT = server.url + '/graphql';
        (0, index_1.logDebug)(`Using graphql url: ${GRAPHQL_ENDPOINT}`);
        const apiKey = result.config.appSync.apiKey;
        (0, index_1.logDebug)(`API KEY: ${apiKey}`);
        expect(apiKey).toBeTruthy();
        expect(GRAPHQL_ENDPOINT).toBeTruthy();
        expect(USER_POOL_ID).toBeTruthy();
        const idToken = (0, cognito_utils_1.signUpAddToGroupAndGetJwtToken)(USER_POOL_ID, USERNAME1, USERNAME1, []);
        USER_POOL_AUTH_CLIENT = new aws_appsync_1.default({
            url: GRAPHQL_ENDPOINT,
            region: REGION,
            auth: {
                type: aws_appsync_1.AUTH_TYPE.AMAZON_COGNITO_USER_POOLS,
                jwtToken: () => idToken,
            },
            offlineConfig: {
                keyPrefix: 'userPools',
            },
            disableOffline: true,
        });
        APIKEY_GRAPHQL_CLIENT = new aws_appsync_1.default({
            url: GRAPHQL_ENDPOINT,
            region: REGION,
            auth: {
                type: aws_appsync_1.AUTH_TYPE.API_KEY,
                apiKey: apiKey,
            },
            offlineConfig: {
                keyPrefix: 'apikey',
            },
            disableOffline: true,
        });
        await new Promise((res) => setTimeout(() => res(), 5000));
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
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
test(`'public' authStrategy`, async () => {
    try {
        const createMutation = (0, graphql_tag_1.default) `
      mutation {
        createPostPublic(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;
        const getQuery = (0, graphql_tag_1.default) `
      query ($id: ID!) {
        getPostPublic(id: $id) {
          id
          title
        }
      }
    `;
        const response = await APIKEY_GRAPHQL_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPublic.id).toBeDefined();
        expect(response.data.createPostPublic.title).toEqual('Hello, World!');
        const postId = response.data.createPostPublic.id;
        try {
            await USER_POOL_AUTH_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId,
                },
            });
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPublic on type Query');
        }
    }
    catch (e) {
        expect(true).toBe(false);
    }
});
test(`'private' authStrategy`, async () => {
    try {
        const createMutation = (0, graphql_tag_1.default) `
      mutation {
        createPostPrivate(input: { title: "Hello, World!" }) {
          id
          title
        }
      }
    `;
        const getQuery = (0, graphql_tag_1.default) `
      query ($id: ID!) {
        getPostPrivate(id: $id) {
          id
          title
        }
      }
    `;
        const response = await USER_POOL_AUTH_CLIENT.mutate({
            mutation: createMutation,
            fetchPolicy: 'no-cache',
        });
        expect(response.data.createPostPrivate.id).toBeDefined();
        expect(response.data.createPostPrivate.title).toEqual('Hello, World!');
        const postId = response.data.createPostPrivate.id;
        try {
            await APIKEY_GRAPHQL_CLIENT.query({
                query: getQuery,
                fetchPolicy: 'no-cache',
                variables: {
                    id: postId,
                },
            });
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e.message).toMatch('GraphQL error: Not Authorized to access getPostPrivate on type Query');
        }
    }
    catch (e) {
        console.error(e);
        expect(true).toEqual(false);
    }
});
describe(`Connection tests with @auth on type`, () => {
    const createPostMutation = (0, graphql_tag_1.default) `
    mutation {
      createPostConnection(input: { title: "Hello, World!" }) {
        id
        title
      }
    }
  `;
    const createCommentMutation = (0, graphql_tag_1.default) `
    mutation ($postId: ID!) {
      createCommentConnection(input: { content: "Comment", commentConnectionPostId: $postId }) {
        id
        content
      }
    }
  `;
    const getPostQuery = (0, graphql_tag_1.default) `
    query ($postId: ID!) {
      getPostConnection(id: $postId) {
        id
        title
      }
    }
  `;
    const getPostQueryWithComments = (0, graphql_tag_1.default) `
    query ($postId: ID!) {
      getPostConnection(id: $postId) {
        id
        title
        comments {
          items {
            id
            content
          }
        }
      }
    }
  `;
    const getCommentQuery = (0, graphql_tag_1.default) `
    query ($commentId: ID!) {
      getCommentConnection(id: $commentId) {
        id
        content
      }
    }
  `;
    const getCommentWithPostQuery = (0, graphql_tag_1.default) `
    query ($commentId: ID!) {
      getCommentConnection(id: $commentId) {
        id
        content
        post {
          id
          title
        }
      }
    }
  `;
    let postId = '';
    let commentId = '';
    beforeAll(async () => {
        try {
            const response = await APIKEY_GRAPHQL_CLIENT.mutate({
                mutation: createPostMutation,
                fetchPolicy: 'no-cache',
            });
            postId = response.data.createPostConnection.id;
            const commentResponse = await USER_POOL_AUTH_CLIENT.mutate({
                mutation: createCommentMutation,
                fetchPolicy: 'no-cache',
                variables: {
                    postId,
                },
            });
            commentId = commentResponse.data.createCommentConnection.id;
        }
        catch (e) {
            console.error(e);
            expect(true).toEqual(false);
        }
    });
    it('Create a Post with UserPool - Fail', async () => {
        expect.assertions(1);
        await expect(USER_POOL_AUTH_CLIENT.mutate({
            mutation: createPostMutation,
            fetchPolicy: 'no-cache',
        })).rejects.toThrow('GraphQL error: Not Authorized to access createPostConnection on type Mutation');
    });
    it('Add a comment with ApiKey - Fail', async () => {
        expect.assertions(1);
        await expect(APIKEY_GRAPHQL_CLIENT.mutate({
            mutation: createCommentMutation,
            fetchPolicy: 'no-cache',
            variables: {
                postId,
            },
        })).rejects.toThrow('Not Authorized to access createCommentConnection on type Mutation');
    });
    it('Get Post with ApiKey - Succeed', async () => {
        const responseGetPost = await APIKEY_GRAPHQL_CLIENT.query({
            query: getPostQuery,
            fetchPolicy: 'no-cache',
            variables: {
                postId,
            },
        });
        expect(responseGetPost.data.getPostConnection.id).toEqual(postId);
        expect(responseGetPost.data.getPostConnection.title).toEqual('Hello, World!');
    });
    it('Get Post+Comments with ApiKey - Fail', async () => {
        expect.assertions(1);
        await expect(APIKEY_GRAPHQL_CLIENT.query({
            query: getPostQueryWithComments,
            fetchPolicy: 'no-cache',
            variables: {
                postId,
            },
        })).rejects.toThrow('Not Authorized to access items on type ModelCommentConnectionConnection');
    });
    it('Get Post with UserPool - Fail', async () => {
        expect.assertions(1);
        await expect(USER_POOL_AUTH_CLIENT.query({
            query: getPostQuery,
            fetchPolicy: 'no-cache',
            variables: {
                postId,
            },
        })).rejects.toThrow('Not Authorized to access getPostConnection on type Query');
    });
    it('Get Comment with UserPool - Succeed', async () => {
        const responseGetComment = await USER_POOL_AUTH_CLIENT.query({
            query: getCommentQuery,
            fetchPolicy: 'no-cache',
            variables: {
                commentId,
            },
        });
        expect(responseGetComment.data.getCommentConnection.id).toEqual(commentId);
        expect(responseGetComment.data.getCommentConnection.content).toEqual('Comment');
    });
    it('Get Comment with ApiKey - Fail', async () => {
        expect.assertions(1);
        await expect(APIKEY_GRAPHQL_CLIENT.query({
            query: getCommentQuery,
            fetchPolicy: 'no-cache',
            variables: {
                commentId,
            },
        })).rejects.toThrow('Not Authorized to access getCommentConnection on type Query');
    });
    it('Get Comment with Post with UserPool - Succeed, but null for Post field', async () => {
        const responseGetComment = await USER_POOL_AUTH_CLIENT.query({
            query: getCommentWithPostQuery,
            errorPolicy: 'all',
            fetchPolicy: 'no-cache',
            variables: {
                commentId,
            },
        });
        expect(responseGetComment.data.getCommentConnection.id).toEqual(commentId);
        expect(responseGetComment.data.getCommentConnection.content).toEqual('Comment');
        expect(responseGetComment.data.getCommentConnection.post).toBeNull();
    });
});
//# sourceMappingURL=multi-auth-model-auth-transformer.e2e.test.js.map