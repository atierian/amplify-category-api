"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.databaseConfigurationInputWalkthrough = void 0;
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const graphql_transformer_core_1 = require("@aws-amplify/graphql-transformer-core");
const database_url_1 = require("../utils/database-url");
const databaseConfigurationInputWalkthrough = async (engine) => {
    var _a;
    const defaultPorts = {
        [graphql_transformer_core_1.ImportedRDSType.MYSQL]: 3306,
        [graphql_transformer_core_1.ImportedRDSType.POSTGRESQL]: 5432,
    };
    amplify_prompts_1.printer.info('Please provide the following database connection information:');
    const url = await amplify_prompts_1.prompter.input('Enter the database url or host name:', {
        validate: (0, amplify_prompts_1.minLength)(1),
    });
    let isValidUrl = true;
    const parsedDatabaseUrl = (0, database_url_1.parseDatabaseUrl)(url);
    let { host, port, database, username, password } = parsedDatabaseUrl;
    if (!host) {
        isValidUrl = false;
        host = url;
    }
    if (!isValidUrl || !port) {
        port = await amplify_prompts_1.prompter.input('Enter the port number:', {
            transform: (input) => Number.parseInt(input, 10),
            validate: (0, amplify_prompts_1.integer)(),
            initial: (_a = defaultPorts[engine]) !== null && _a !== void 0 ? _a : 3306,
        });
    }
    if (!isValidUrl || !username) {
        username = await amplify_prompts_1.prompter.input('Enter the username:', {
            validate: (0, amplify_prompts_1.minLength)(1),
        });
    }
    if (!isValidUrl || !password) {
        password = await amplify_prompts_1.prompter.input('Enter the password:', { hidden: true, validate: (0, amplify_prompts_1.minLength)(1) });
    }
    if (!isValidUrl || !database) {
        database = await amplify_prompts_1.prompter.input('Enter the database name:', {
            validate: (0, amplify_prompts_1.minLength)(1),
        });
    }
    return {
        engine,
        database,
        host,
        port,
        username,
        password,
    };
};
exports.databaseConfigurationInputWalkthrough = databaseConfigurationInputWalkthrough;
//# sourceMappingURL=appSync-rds-db-config.js.map