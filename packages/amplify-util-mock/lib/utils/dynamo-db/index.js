"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureDDBDataSource = exports.createAndUpdateTable = void 0;
const utils_1 = require("./utils");
async function createAndUpdateTable(dynamoDbClient, config) {
    const tables = config.tables.map((table) => table.Properties);
    const existingTables = await dynamoDbClient.listTables().promise();
    const existingTablesWithDetails = await (0, utils_1.describeTables)(dynamoDbClient, existingTables.TableNames);
    const tablesToCreate = tables.filter((t) => {
        const tableName = t.TableName;
        return !existingTables.TableNames.includes(tableName);
    });
    const tablesToUpdate = tables.filter((t) => {
        const tableName = t.TableName;
        return existingTables.TableNames.includes(tableName);
    });
    await (0, utils_1.createTables)(dynamoDbClient, tablesToCreate);
    const updateTableInputs = tablesToUpdate.reduce((acc, createTableInput) => {
        const existingTableDetail = existingTablesWithDetails[createTableInput.TableName];
        return [...acc, ...(0, utils_1.getUpdateTableInput)(createTableInput, existingTableDetail)];
    }, []);
    await (0, utils_1.updateTables)(dynamoDbClient, updateTableInputs);
}
exports.createAndUpdateTable = createAndUpdateTable;
function configureDDBDataSource(config, ddbConfig) {
    return {
        ...config,
        dataSources: config.dataSources.map((d) => {
            if (d.type !== 'AMAZON_DYNAMODB') {
                return d;
            }
            return {
                ...d,
                config: {
                    ...d.config,
                    endpoint: ddbConfig.endpoint,
                    region: ddbConfig.region,
                    accessKeyId: ddbConfig.accessKeyId,
                    secretAccessKey: ddbConfig.secretAccessKey,
                    sessionToken: ddbConfig.sessionToken || process.env.AWS_SESSION_TOKEN,
                },
            };
        }),
    };
}
exports.configureDDBDataSource = configureDDBDataSource;
//# sourceMappingURL=index.js.map