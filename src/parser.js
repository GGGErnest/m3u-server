"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPlayListGroup = isPlayListGroup;
exports.parse = parse;
exports.applyFilters = applyFilters;
exports.exportToM3U = exportToM3U;
var fs_1 = require("fs");
var readline_1 = require("readline");
function isChannelFilter(filter) {
    return filter && 'group' in filter;
}
function isPlayListGroup(item) {
    return item && 'channels' in item;
}
function isCategory(line) {
    return line.includes('#EXTINF:-1,#');
}
function isChannel(line) {
    return !isCategory(line) && !line.startsWith('http:');
}
function parseEntry(line, group, channel) {
    var is = (isCategory(line) ? 'group' : undefined) || (isChannel(line) ? 'channel' : undefined) || 'url';
    var title = line.replace('#EXTINF:-1,', '').replace(/#/g, '');
    var raw = line + '\n';
    var parseCountry = function (value) {
        var countryMatch = value.match(/\b(CUBA|CUB|LATINO|SP|EN|AE|BE|AR|AU|BR|CA|CH|CN|DE|ES|FR|GB|IN|IT|JP|MX|NL|PT|RU|TR|US|ZA)\b/);
        var country = countryMatch ? countryMatch[0] : undefined;
        var rest = value.replace(country !== null && country !== void 0 ? country : '', '');
        return { rest: rest, country: country };
    };
    var processQuality = function (value) {
        var qualityMatch = value.match(/\b(HD|FHD|4K|SD|UHD)\b/);
        var quality = qualityMatch ? qualityMatch[0] : undefined;
        var rest = value.replace(quality !== null && quality !== void 0 ? quality : '', '');
        return { quality: quality, rest: rest };
    };
    var processName = function (value) {
        return value
            .replace(/[^a-zA-Z0-9\s\|]/g, '') // Keep English letters, numbers, spaces, '-', '*', and '|'
            .replace(/\s{2,}/g, ' ') // Replace two or more spaces with a single space
            .trim();
    };
    var _a = parseCountry(title), country = _a.country, rest = _a.rest;
    var _b = processQuality(rest), quality = _b.quality, restOfTtitle = _b.rest;
    var name = processName(restOfTtitle);
    if (is === 'group') {
        return {
            name: name,
            country: country,
            quality: quality,
            raw: raw,
            channels: [],
            urls: []
        };
    }
    if (is === 'channel') {
        return {
            name: name,
            country: country,
            quality: quality,
            raw: raw,
            urls: []
        };
    }
    // if the url doesn't belongs to any group or channel then we drop it
    if (!channel && !group) {
        console.log('Invalid Line. Does not belongs to any channel or group');
    }
    if (channel) {
        channel.urls.push(raw);
        channel.raw = channel.raw + raw;
        return channel;
    }
    if (group) {
        group.urls.push(raw);
    }
    return channel;
}
function parse(inputFilePath) {
    return __awaiter(this, void 0, void 0, function () {
        var readInterface, parsedFile, currentGroup, currentChannel, _a, readInterface_1, readInterface_1_1, line, entry, e_1_1;
        var _b, e_1, _c, _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    readInterface = readline_1.default.createInterface(fs_1.default.createReadStream(inputFilePath));
                    parsedFile = {
                        header: '',
                        items: []
                    };
                    _e.label = 1;
                case 1:
                    _e.trys.push([1, 6, 7, 12]);
                    _a = true, readInterface_1 = __asyncValues(readInterface);
                    _e.label = 2;
                case 2: return [4 /*yield*/, readInterface_1.next()];
                case 3:
                    if (!(readInterface_1_1 = _e.sent(), _b = readInterface_1_1.done, !_b)) return [3 /*break*/, 5];
                    _d = readInterface_1_1.value;
                    _a = false;
                    line = _d;
                    // extracting the header 
                    if (!parsedFile.header && line.startsWith('#EXTM3U')) {
                        parsedFile.header = line;
                        return [3 /*break*/, 4];
                    }
                    entry = parseEntry(line, currentGroup, currentChannel);
                    // found a group
                    if (isPlayListGroup(entry)) {
                        // change group
                        currentGroup = entry;
                        currentChannel = undefined;
                        parsedFile.items.push(currentGroup);
                        return [3 /*break*/, 4];
                    }
                    // the parsed line is a new channel 
                    if (currentChannel !== entry && entry) {
                        currentChannel = entry;
                        if (currentGroup) {
                            currentGroup.channels.push(entry);
                            return [3 /*break*/, 4];
                        }
                        parsedFile.items.push(entry);
                        return [3 /*break*/, 4];
                    }
                    _e.label = 4;
                case 4:
                    _a = true;
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 12];
                case 6:
                    e_1_1 = _e.sent();
                    e_1 = { error: e_1_1 };
                    return [3 /*break*/, 12];
                case 7:
                    _e.trys.push([7, , 10, 11]);
                    if (!(!_a && !_b && (_c = readInterface_1.return))) return [3 /*break*/, 9];
                    return [4 /*yield*/, _c.call(readInterface_1)];
                case 8:
                    _e.sent();
                    _e.label = 9;
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (e_1) throw e_1.error;
                    return [7 /*endfinally*/];
                case 11: return [7 /*endfinally*/];
                case 12:
                    console.log('The File as been parsed');
                    return [2 /*return*/, parsedFile];
            }
        });
    });
}
function shouldIncludeChannel(entry, filters, group) {
    var filterPlayList = function (item, filter, groupEntry) {
        var name = filter.name, country = filter.country, quality = filter.quality, group = filter.group;
        var conditions = [
            name ? item.name === name : true,
            country ? item.country === country : true,
            quality ? item.quality === quality : true,
            group ? groupEntry === null || groupEntry === void 0 ? void 0 : groupEntry.name.includes(group) : true
        ];
        return conditions.every(Boolean);
    };
    for (var _i = 0, filters_1 = filters; _i < filters_1.length; _i++) {
        var filter = filters_1[_i];
        if (filterPlayList(entry, filter, group)) {
            return true;
        }
    }
    return false;
}
function shouldIncludeGroup(group, filters) {
    var filterGroups = function (item, filter) {
        var name = filter.name, country = filter.country, quality = filter.quality;
        var conditions = [
            name ? item.name === name : true,
            country ? item.country === country : true,
            quality ? item.quality === quality : true,
        ];
        return conditions.every(Boolean);
    };
    for (var _i = 0, filters_2 = filters; _i < filters_2.length; _i++) {
        var filter = filters_2[_i];
        if (filterGroups(group, filter)) {
            return true;
        }
    }
    return false;
}
function writeChannel(channel, file) {
    file.write(channel.raw);
}
function applyFilters(playlist, filters) {
    var filteredPlaylist = {
        header: playlist.header,
        items: []
    };
    var groupFilters = filters.filter(function (filter) { return !isChannelFilter(filter); });
    var channelFilters = filters.filter(function (filter) { return isChannelFilter(filter); });
    var _loop_1 = function (item) {
        if (isPlayListGroup(item)) {
            if (shouldIncludeGroup(item, groupFilters)) {
                filteredPlaylist.items.push(item);
                return "continue";
            }
            item.channels = item.channels.filter(function (channel) { return shouldIncludeChannel(channel, channelFilters, item); });
            if (item.channels.length > 0) {
                filteredPlaylist.items.push(item);
            }
            return "continue";
        }
        if (shouldIncludeChannel(item, channelFilters)) {
            filteredPlaylist.items.push(item);
            return "continue";
        }
    };
    for (var _i = 0, _a = playlist.items; _i < _a.length; _i++) {
        var item = _a[_i];
        _loop_1(item);
    }
    return filteredPlaylist;
}
function exportToM3U(playlist, outputFilePath) {
    return __awaiter(this, void 0, void 0, function () {
        var file, writeGroup, _i, _a, item;
        return __generator(this, function (_b) {
            file = fs_1.default.createWriteStream(outputFilePath);
            // writing the header;
            file.write(playlist.header);
            writeGroup = function (group) {
                // writing the group header
                file.write(group.raw);
                for (var _i = 0, _a = group.channels; _i < _a.length; _i++) {
                    var channel = _a[_i];
                    writeChannel(channel, file);
                }
            };
            for (_i = 0, _a = playlist.items; _i < _a.length; _i++) {
                item = _a[_i];
                if (isPlayListGroup(item)) {
                    writeGroup(item);
                    continue;
                }
                writeChannel(item, file);
            }
            file.close();
            return [2 /*return*/];
        });
    });
}
