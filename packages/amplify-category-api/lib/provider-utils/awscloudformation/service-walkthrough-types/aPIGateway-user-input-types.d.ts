export interface APIGatewayCLIInputs {
    version: 1;
    paths: {
        [pathName: string]: Path;
    };
}
type Path = {
    lambdaFunction: string;
    permissions: {
        setting: PermissionSetting;
        auth?: CrudOperation[];
        guest?: CrudOperation[];
        groups?: {
            [groupName: string]: CrudOperation[];
        };
    };
};
declare enum CrudOperation {
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}
declare enum PermissionSetting {
    PRIVATE = "private",
    PROTECTED = "protected",
    OPEN = "open"
}
export {};
//# sourceMappingURL=aPIGateway-user-input-types.d.ts.map