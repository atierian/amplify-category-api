"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatCFNPathParamsForExpressJs = exports.checkForPathOverlap = exports.validatePathName = void 0;
const validatePathName = (name) => {
    if (name === '/') {
        return true;
    }
    if (name.length === 0) {
        return 'The path must not be empty';
    }
    if (name.charAt(name.length - 1) === '/') {
        return 'The path must not end with /';
    }
    if (name.charAt(0) !== '/') {
        return 'The path must begin with / e.g. /items';
    }
    if (!/^(?:\/(?:[a-zA-Z0-9\-]+|{[a-zA-Z0-9\-]+}))+$/.test(name)) {
        return 'Each path part must use characters a-z A-Z 0-9 - and must not be empty.\nOptionally, a path part can be surrounded by { } to denote a path parameter.';
    }
    return true;
};
exports.validatePathName = validatePathName;
const checkForPathOverlap = (name, paths) => {
    const split = name.split('/').filter((sub) => sub !== '');
    paths.sort();
    let subpath = '';
    let overlappingPath = '';
    const subMatch = split.some((sub) => {
        sub = sub.replace(/{[a-zA-Z0-9\-]+}/g, '{}');
        subpath = `${subpath}/${sub}`;
        overlappingPath = paths.find((name) => name === '/' || name.replace(/{[a-zA-Z0-9\-]+}/g, '{}') === subpath);
        return overlappingPath !== undefined;
    });
    if (subMatch) {
        const nameSlashCount = name.split('/').length - 1;
        const overlappingPathSlashCount = overlappingPath.split('/').length - 1;
        if (nameSlashCount < overlappingPathSlashCount) {
            return {
                higherOrderPath: name,
                lowerOrderPath: overlappingPath,
            };
        }
        return {
            higherOrderPath: overlappingPath,
            lowerOrderPath: name,
        };
    }
    return false;
};
exports.checkForPathOverlap = checkForPathOverlap;
const formatCFNPathParamsForExpressJs = (path) => {
    return path.replace(/{([a-zA-Z0-9\-]+)}/g, ':$1');
};
exports.formatCFNPathParamsForExpressJs = formatCFNPathParamsForExpressJs;
//# sourceMappingURL=rest-api-path-utils.js.map