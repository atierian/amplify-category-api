export declare const validatePathName: (name: string) => true | "The path must not be empty" | "The path must not end with /" | "The path must begin with / e.g. /items" | "Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.";
export declare const checkForPathOverlap: (name: string, paths: string[]) => false | {
    higherOrderPath: string;
    lowerOrderPath: string;
};
export declare const formatCFNPathParamsForExpressJs: (path: string) => string;
//# sourceMappingURL=rest-api-path-utils.d.ts.map