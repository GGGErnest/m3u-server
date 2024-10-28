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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var node_cron_1 = require("node-cron");
var axios_1 = require("axios");
var fs = require("fs/promises");
var path_1 = require("path");
var parser_1 = require("./parser");
var filters_json_1 = require("./filters.json");
var M3UServer = /** @class */ (function () {
    function M3UServer(config) {
        this._filters = filters_json_1.default.filters;
        this.config = config;
        this.app = (0, express_1.default)();
        this.setupRoutes();
    }
    M3UServer.prototype.setupRoutes = function () {
        this.app.get('/playlist', this.servePlaylist.bind(this));
        this.app.post('/update', this.handleManualUpdate.bind(this));
    };
    M3UServer.prototype.downloadAndProcessFile = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, entries, filteredEntries, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        console.log('Starting M3U file download...');
                        return [4 /*yield*/, axios_1.default.get(this.config.downloadUrl)];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, fs.writeFile(this.config.sourceFilePath, response.data)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, (0, parser_1.parse)(this.config.sourceFilePath)];
                    case 3:
                        entries = _a.sent();
                        filteredEntries = (0, parser_1.applyFilters)(entries, this._filters);
                        return [4 /*yield*/, (0, parser_1.exportToM3U)(filteredEntries, this.config.filteredFilePath)];
                    case 4:
                        _a.sent();
                        console.log('M3U file processed and filtered successfully');
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Error processing M3U file:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    M3UServer.prototype.servePlaylist = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var content, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(this.config.filteredFilePath, 'utf8')];
                    case 1:
                        content = _a.sent();
                        res.setHeader('Content-Type', 'application/x-mpegurl');
                        res.send(content);
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error serving M3U file:', error_2);
                        res.status(500).send('Error serving playlist');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    M3UServer.prototype.handleManualUpdate = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.downloadAndProcessFile()];
                    case 1:
                        _a.sent();
                        res.json({ message: 'Playlist updated successfully' });
                        return [3 /*break*/, 3];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error updating playlist:', error_3);
                        res.status(500).json({ error: 'Error updating playlist' });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    M3UServer.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 5]);
                        return [4 /*yield*/, this.downloadAndProcessFile()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 2:
                        error_4 = _a.sent();
                        console.error('Error during initialization:', error_4);
                        // Create empty files if download fails
                        return [4 /*yield*/, fs.writeFile(this.config.sourceFilePath, '#EXTM3U\n')];
                    case 3:
                        // Create empty files if download fails
                        _a.sent();
                        return [4 /*yield*/, fs.writeFile(this.config.filteredFilePath, '#EXTM3U\n')];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    M3UServer.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.initialize()];
                    case 1:
                        _a.sent();
                        this.app.listen(this.config.port, function () {
                            console.log("M3U Server running at http://localhost:".concat(_this.config.port));
                            console.log("Access filtered playlist at http://localhost:".concat(_this.config.port, "/playlist"));
                        });
                        // Schedule daily download
                        node_cron_1.default.schedule('0 0 * * *', function () { return _this.downloadAndProcessFile(); });
                        return [2 /*return*/];
                }
            });
        });
    };
    return M3UServer;
}());
// Configuration
var config = {
    port: 3000,
    sourceFilePath: path_1.default.join(__dirname, 'source.m3u'),
    filteredFilePath: path_1.default.join(__dirname, 'filtered.m3u'),
    downloadUrl: 'http://tvstation.cc/get.php?username=78KD7A2&password=35D2H4Y&type=m3u&output=mpegts', // Replace with your M3U URL
    blacklistedKeywords: ['ads', 'commercials', 'teleshopping'],
    validExtensions: ['.ts', '.m3u8', '.mp4']
};
// Create and start the server
var server = new M3UServer(config);
server.start().catch(console.error);
