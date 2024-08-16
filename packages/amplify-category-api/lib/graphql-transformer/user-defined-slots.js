"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseUserDefinedSlots = exports.SLOT_NAMES = void 0;
const lodash_1 = __importDefault(require("lodash"));
exports.SLOT_NAMES = new Set([
    'init',
    'preAuth',
    'auth',
    'postAuth',
    'preDataLoad',
    'preUpdate',
    'preSubscribe',
    'postDataLoad',
    'postUpdate',
    'finish',
]);
const EXCLUDE_FILES = new Set(['README.md']);
function parseUserDefinedSlots(userDefinedTemplates) {
    const groupedResolversMap = {};
    Object.entries(userDefinedTemplates)
        .filter(([fileName]) => !EXCLUDE_FILES.has(fileName))
        .forEach(([fileName, template]) => {
        const slicedSlotName = fileName.split('.');
        const isSlot = exports.SLOT_NAMES.has(slicedSlotName[2]);
        if (!isSlot) {
            return;
        }
        const resolverType = slicedSlotName[slicedSlotName.length - 2] === 'res' ? 'responseResolver' : 'requestResolver';
        const resolverName = [slicedSlotName[0], slicedSlotName[1]].join('.');
        const slotName = slicedSlotName[2];
        const resolverOrder = `order${Number(slicedSlotName[3]) || 0}`;
        const resolver = {
            fileName,
            template,
        };
        if (lodash_1.default.has(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder])) {
            lodash_1.default.set(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder, resolverType], resolver);
        }
        else {
            const slot = {
                resolverTypeName: slicedSlotName[0],
                resolverFieldName: slicedSlotName[1],
                slotName,
                [resolverType]: resolver,
            };
            lodash_1.default.set(groupedResolversMap, [`${resolverName}#${slotName}`, resolverOrder], slot);
        }
    });
    return Object.entries(groupedResolversMap)
        .map(([resolverNameKey, numberedSlots]) => ({
        orderedSlots: Object.entries(numberedSlots)
            .sort(([i], [j]) => i.localeCompare(j))
            .map(([_, slot]) => slot),
        resolverName: resolverNameKey.split('#')[0],
    }))
        .reduce((acc, { orderedSlots, resolverName }) => {
        if (acc[resolverName]) {
            acc[resolverName].push(...orderedSlots);
        }
        else {
            acc[resolverName] = orderedSlots;
        }
        return acc;
    }, {});
}
exports.parseUserDefinedSlots = parseUserDefinedSlots;
//# sourceMappingURL=user-defined-slots.js.map