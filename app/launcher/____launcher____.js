/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(14);
module.exports.Constants = __webpack_require__(4);
module.exports.Errors = __webpack_require__(5);
module.exports.FileAttr = __webpack_require__(15);

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

var Utils = __webpack_require__(2),
    Headers = __webpack_require__(6),
    Constants = Utils.Constants,
    Methods = __webpack_require__(18);

module.exports = function (/*Buffer*/input) {

    var _entryHeader = new Headers.EntryHeader(),
        _entryName = new Buffer(0),
        _comment = new Buffer(0),
        _isDirectory = false,
        uncompressedData = null,
        _extra = new Buffer(0);

    function getCompressedDataFromZip() {
        if (!input || !Buffer.isBuffer(input)) {
            return new Buffer(0);
        }
        _entryHeader.loadDataHeaderFromBinary(input);
        return input.slice(_entryHeader.realDataOffset, _entryHeader.realDataOffset + _entryHeader.compressedSize)
    }

    function crc32OK(data) {
        // if bit 3 (0x08) of the general-purpose flags field is set, then the CRC-32 and file sizes are not known when the header is written
        if (_entryHeader.flags & 0x8 != 0x8) {
           if (Utils.crc32(data) != _entryHeader.crc) {
               return false;
           }
        } else {
            // @TODO: load and check data descriptor header
            // The fields in the local header are filled with zero, and the CRC-32 and size are appended in a 12-byte structure
            // (optionally preceded by a 4-byte signature) immediately after the compressed data:
        }
        return true;
    }

    function decompress(/*Boolean*/async, /*Function*/callback, /*String*/pass) {
        if(typeof callback === 'undefined' && typeof async === 'string') {
            pass=async;
            async=void 0;
        }
        if (_isDirectory) {
            if (async && callback) {
                callback(new Buffer(0), Utils.Errors.DIRECTORY_CONTENT_ERROR); //si added error.
            }
            return new Buffer(0);
        }

        var compressedData = getCompressedDataFromZip();
       
        if (compressedData.length == 0) {
            if (async && callback) callback(compressedData, Utils.Errors.NO_DATA);//si added error.
            return compressedData;
        }

        var data = new Buffer(_entryHeader.size);
        data.fill(0);

        switch (_entryHeader.method) {
            case Utils.Constants.STORED:
                compressedData.copy(data);
                if (!crc32OK(data)) {
                    if (async && callback) callback(data, Utils.Errors.BAD_CRC);//si added error
                    return Utils.Errors.BAD_CRC;
                } else {//si added otherwise did not seem to return data.
                    if (async && callback) callback(data);
                    return data;
                }
                break;
            case Utils.Constants.DEFLATED:
                var inflater = new Methods.Inflater(compressedData);
                if (!async) {
                    inflater.inflate(data);
                    if (!crc32OK(data)) {
                        console.warn(Utils.Errors.BAD_CRC + " " + _entryName.toString())
                    }
                    return data;
                } else {
                    inflater.inflateAsync(function(result) {
                        result.copy(data, 0);
                        if (!crc32OK(data)) {
                            if (callback) callback(data, Utils.Errors.BAD_CRC); //si added error
                        } else { //si added otherwise did not seem to return data.
                            if (callback) callback(data);
                        }
                    })
                }
                break;
            default:
                if (async && callback) callback(new Buffer(0), Utils.Errors.UNKNOWN_METHOD);
                return Utils.Errors.UNKNOWN_METHOD;
        }
    }

    function compress(/*Boolean*/async, /*Function*/callback) {
        if ((!uncompressedData || !uncompressedData.length) && Buffer.isBuffer(input)) {
            // no data set or the data wasn't changed to require recompression
            if (async && callback) callback(getCompressedDataFromZip());
            return getCompressedDataFromZip();
        }

        if (uncompressedData.length && !_isDirectory) {
            var compressedData;
            // Local file header
            switch (_entryHeader.method) {
                case Utils.Constants.STORED:
                    _entryHeader.compressedSize = _entryHeader.size;

                    compressedData = new Buffer(uncompressedData.length);
                    uncompressedData.copy(compressedData);

                    if (async && callback) callback(compressedData);
                    return compressedData;

                    break;
                default:
                case Utils.Constants.DEFLATED:

                    var deflater = new Methods.Deflater(uncompressedData);
                    if (!async) {
                        var deflated = deflater.deflate();
                        _entryHeader.compressedSize = deflated.length;
                        return deflated;
                    } else {
                        deflater.deflateAsync(function(data) {
                            compressedData = new Buffer(data.length);
                            _entryHeader.compressedSize = data.length;
                            data.copy(compressedData);
                            callback && callback(compressedData);
                        })
                    }
                    deflater = null;
                    break;
            }
        } else {
            if (async && callback) {
                callback(new Buffer(0));
            } else {
                return new Buffer(0);
            }
        }
    }

    function readUInt64LE(buffer, offset) {
        return (buffer.readUInt32LE(offset + 4) << 4) + buffer.readUInt32LE(offset);
    }

    function parseExtra(data) {
        var offset = 0;
        var signature, size, part;
        while(offset<data.length) {
            signature = data.readUInt16LE(offset);
            offset += 2;
            size = data.readUInt16LE(offset);
            offset += 2;
            part = data.slice(offset, offset+size);
            offset += size;
            if(Constants.ID_ZIP64 === signature) {
                parseZip64ExtendedInformation(part);
            }
        }
    }

    //Override header field values with values from the ZIP64 extra field
    function parseZip64ExtendedInformation(data) {
        var size, compressedSize, offset, diskNumStart;

        if(data.length >= Constants.EF_ZIP64_SCOMP) {
            size = readUInt64LE(data, Constants.EF_ZIP64_SUNCOMP);
            if(_entryHeader.size === Constants.EF_ZIP64_OR_32) {
                _entryHeader.size = size;
            }
        }
        if(data.length >= Constants.EF_ZIP64_RHO) {
            compressedSize = readUInt64LE(data, Constants.EF_ZIP64_SCOMP);
            if(_entryHeader.compressedSize === Constants.EF_ZIP64_OR_32) {
                _entryHeader.compressedSize = compressedSize;
            }
        }
        if(data.length >= Constants.EF_ZIP64_DSN) {
            offset = readUInt64LE(data, Constants.EF_ZIP64_RHO);
            if(_entryHeader.offset === Constants.EF_ZIP64_OR_32) {
                _entryHeader.offset = offset;
            }
        }
        if(data.length >= Constants.EF_ZIP64_DSN+4) {
            diskNumStart = data.readUInt32LE(Constants.EF_ZIP64_DSN);
            if(_entryHeader.diskNumStart === Constants.EF_ZIP64_OR_16) {
                _entryHeader.diskNumStart = diskNumStart;
            }
        }
    }


    return {
        get entryName () { return _entryName.toString(); },
        get rawEntryName() { return _entryName; },
        set entryName (val) {
            _entryName = Utils.toBuffer(val);
            var lastChar = _entryName[_entryName.length - 1];
            _isDirectory = (lastChar == 47) || (lastChar == 92);
            _entryHeader.fileNameLength = _entryName.length;
        },

        get extra () { return _extra; },
        set extra (val) {
            _extra = val;
            _entryHeader.extraLength = val.length;
            parseExtra(val);
        },

        get comment () { return _comment.toString(); },
        set comment (val) {
            _comment = Utils.toBuffer(val);
            _entryHeader.commentLength = _comment.length;
        },

        get name () { var n = _entryName.toString(); return _isDirectory ? n.substr(n.length - 1).split("/").pop() : n.split("/").pop(); },
        get isDirectory () { return _isDirectory },

        getCompressedData : function() {
            return compress(false, null)
        },

        getCompressedDataAsync : function(/*Function*/callback) {
            compress(true, callback)
        },

        setData : function(value) {
            uncompressedData = Utils.toBuffer(value);
            if (!_isDirectory && uncompressedData.length) {
                _entryHeader.size = uncompressedData.length;
                _entryHeader.method = Utils.Constants.DEFLATED;
                _entryHeader.crc = Utils.crc32(value);
            } else { // folders and blank files should be stored
                _entryHeader.method = Utils.Constants.STORED;
            }
        },

        getData : function(pass) {
            return decompress(false, null, pass);
        },

        getDataAsync : function(/*Function*/callback, pass) {
            decompress(true, callback, pass)
        },

        set attr(attr) { _entryHeader.attr = attr; },
        get attr() { return _entryHeader.attr; },

        set header(/*Buffer*/data) {
            _entryHeader.loadFromBinary(data);
        },

        get header() {
            return _entryHeader;
        },

        packHeader : function() {
            var header = _entryHeader.entryHeaderToBinary();
            // add
            _entryName.copy(header, Utils.Constants.CENHDR);
            if (_entryHeader.extraLength) {
                _extra.copy(header, Utils.Constants.CENHDR + _entryName.length)
            }
            if (_entryHeader.commentLength) {
                _comment.copy(header, Utils.Constants.CENHDR + _entryName.length + _entryHeader.extraLength, _comment.length);
            }
            return header;
        },

        toString : function() {
            return '{\n' +
                '\t"entryName" : "' + _entryName.toString() + "\",\n" +
                '\t"name" : "' + _entryName.toString().split("/").pop() + "\",\n" +
                '\t"comment" : "' + _comment.toString() + "\",\n" +
                '\t"isDirectory" : ' + _isDirectory + ",\n" +
                '\t"header" : ' + _entryHeader.toString().replace(/\t/mg, "\t\t") + ",\n" +
                '\t"compressedData" : <' + (input && input.length  + " bytes buffer" || "null") + ">\n" +
                '\t"data" : <' + (uncompressedData && uncompressedData.length  + " bytes buffer" || "null") + ">\n" +
                '}';
        }
    }
};


/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = {
    /* The local file header */
    LOCHDR           : 30, // LOC header size
    LOCSIG           : 0x04034b50, // "PK\003\004"
    LOCVER           : 4,	// version needed to extract
    LOCFLG           : 6, // general purpose bit flag
    LOCHOW           : 8, // compression method
    LOCTIM           : 10, // modification time (2 bytes time, 2 bytes date)
    LOCCRC           : 14, // uncompressed file crc-32 value
    LOCSIZ           : 18, // compressed size
    LOCLEN           : 22, // uncompressed size
    LOCNAM           : 26, // filename length
    LOCEXT           : 28, // extra field length

    /* The Data descriptor */
    EXTSIG           : 0x08074b50, // "PK\007\008"
    EXTHDR           : 16, // EXT header size
    EXTCRC           : 4, // uncompressed file crc-32 value
    EXTSIZ           : 8, // compressed size
    EXTLEN           : 12, // uncompressed size

    /* The central directory file header */
    CENHDR           : 46, // CEN header size
    CENSIG           : 0x02014b50, // "PK\001\002"
    CENVEM           : 4, // version made by
    CENVER           : 6, // version needed to extract
    CENFLG           : 8, // encrypt, decrypt flags
    CENHOW           : 10, // compression method
    CENTIM           : 12, // modification time (2 bytes time, 2 bytes date)
    CENCRC           : 16, // uncompressed file crc-32 value
    CENSIZ           : 20, // compressed size
    CENLEN           : 24, // uncompressed size
    CENNAM           : 28, // filename length
    CENEXT           : 30, // extra field length
    CENCOM           : 32, // file comment length
    CENDSK           : 34, // volume number start
    CENATT           : 36, // internal file attributes
    CENATX           : 38, // external file attributes (host system dependent)
    CENOFF           : 42, // LOC header offset

    /* The entries in the end of central directory */
    ENDHDR           : 22, // END header size
    ENDSIG           : 0x06054b50, // "PK\005\006"
    ENDSUB           : 8, // number of entries on this disk
    ENDTOT           : 10, // total number of entries
    ENDSIZ           : 12, // central directory size in bytes
    ENDOFF           : 16, // offset of first CEN header
    ENDCOM           : 20, // zip file comment length

    /* Compression methods */
    STORED           : 0, // no compression
    SHRUNK           : 1, // shrunk
    REDUCED1         : 2, // reduced with compression factor 1
    REDUCED2         : 3, // reduced with compression factor 2
    REDUCED3         : 4, // reduced with compression factor 3
    REDUCED4         : 5, // reduced with compression factor 4
    IMPLODED         : 6, // imploded
    // 7 reserved
    DEFLATED         : 8, // deflated
    ENHANCED_DEFLATED: 9, // enhanced deflated
    PKWARE           : 10,// PKWare DCL imploded
    // 11 reserved
    BZIP2            : 12, //  compressed using BZIP2
    // 13 reserved
    LZMA             : 14, // LZMA
    // 15-17 reserved
    IBM_TERSE        : 18, // compressed using IBM TERSE
    IBM_LZ77         : 19, //IBM LZ77 z

    /* General purpose bit flag */
    FLG_ENC          : 0,  // encripted file
    FLG_COMP1        : 1,  // compression option
    FLG_COMP2        : 2,  // compression option
    FLG_DESC         : 4,  // data descriptor
    FLG_ENH          : 8,  // enhanced deflation
    FLG_STR          : 16, // strong encryption
    FLG_LNG          : 1024, // language encoding
    FLG_MSK          : 4096, // mask header values

    /* Load type */
    FILE             : 0,
    BUFFER           : 1,
    NONE             : 2,

    /* 4.5 Extensible data fields */
    EF_ID            : 0,
    EF_SIZE          : 2,

    /* Header IDs */
    ID_ZIP64         : 0x0001,
    ID_AVINFO        : 0x0007,
    ID_PFS           : 0x0008,
    ID_OS2           : 0x0009,
    ID_NTFS          : 0x000a,
    ID_OPENVMS       : 0x000c,
    ID_UNIX          : 0x000d,
    ID_FORK          : 0x000e,
    ID_PATCH         : 0x000f,
    ID_X509_PKCS7    : 0x0014,
    ID_X509_CERTID_F : 0x0015,
    ID_X509_CERTID_C : 0x0016,
    ID_STRONGENC     : 0x0017,
    ID_RECORD_MGT    : 0x0018,
    ID_X509_PKCS7_RL : 0x0019,
    ID_IBM1          : 0x0065,
    ID_IBM2          : 0x0066,
    ID_POSZIP        : 0x4690,

    EF_ZIP64_OR_32   : 0xffffffff,
    EF_ZIP64_OR_16   : 0xffff,
    EF_ZIP64_SUNCOMP : 0,
    EF_ZIP64_SCOMP   : 8,
    EF_ZIP64_RHO     : 16,
    EF_ZIP64_DSN     : 24
};


/***/ }),
/* 5 */
/***/ (function(module, exports) {

module.exports = {
    /* Header error messages */
    "INVALID_LOC" : "Invalid LOC header (bad signature)",
    "INVALID_CEN" : "Invalid CEN header (bad signature)",
    "INVALID_END" : "Invalid END header (bad signature)",

    /* ZipEntry error messages*/
    "NO_DATA" : "Nothing to decompress",
    "BAD_CRC" : "CRC32 checksum failed",
    "FILE_IN_THE_WAY" : "There is a file in the way: %s",
    "UNKNOWN_METHOD" : "Invalid/unsupported compression method",

    /* Inflater error messages */
    "AVAIL_DATA" : "inflate::Available inflate data did not terminate",
    "INVALID_DISTANCE" : "inflate::Invalid literal/length or distance code in fixed or dynamic block",
    "TO_MANY_CODES" : "inflate::Dynamic block code description: too many length or distance codes",
    "INVALID_REPEAT_LEN" : "inflate::Dynamic block code description: repeat more than specified lengths",
    "INVALID_REPEAT_FIRST" : "inflate::Dynamic block code description: repeat lengths with no first length",
    "INCOMPLETE_CODES" : "inflate::Dynamic block code description: code lengths codes incomplete",
    "INVALID_DYN_DISTANCE": "inflate::Dynamic block code description: invalid distance code lengths",
    "INVALID_CODES_LEN": "inflate::Dynamic block code description: invalid literal/length code lengths",
    "INVALID_STORE_BLOCK" : "inflate::Stored block length did not match one's complement",
    "INVALID_BLOCK_TYPE" : "inflate::Invalid block type (type == 3)",

    /* ADM-ZIP error messages */
    "CANT_EXTRACT_FILE" : "Could not extract the file",
    "CANT_OVERRIDE" : "Target file already exists",
    "NO_ZIP" : "No zip file was loaded",
    "NO_ENTRY" : "Entry doesn't exist",
    "DIRECTORY_CONTENT_ERROR" : "A directory cannot have content",
    "FILE_NOT_FOUND" : "File not found: %s",
    "NOT_IMPLEMENTED" : "Not implemented",
    "INVALID_FILENAME" : "Invalid filename",
    "INVALID_FORMAT" : "Invalid or unsupported zip format. No END header found"
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

exports.EntryHeader = __webpack_require__(16);
exports.MainHeader = __webpack_require__(17);


/***/ }),
/* 7 */
/***/ (function(module, exports) {

module.exports = require("zlib");

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(0)

module.exports = clone(fs)

function clone (obj) {
  if (obj === null || typeof obj !== 'object')
    return obj

  if (obj instanceof Object)
    var copy = { __proto__: obj.__proto__ }
  else
    var copy = Object.create(null)

  Object.getOwnPropertyNames(obj).forEach(function (key) {
    Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key))
  })

  return copy
}


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
// import extend from './modules/extend.js'


var _compareVersion = __webpack_require__(10);

var _compareVersion2 = _interopRequireDefault(_compareVersion);

var _rmDir = __webpack_require__(11);

var _rmDir2 = _interopRequireDefault(_rmDir);

var _deepExtend = __webpack_require__(12);

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _admZip = __webpack_require__(13);

var _admZip2 = _interopRequireDefault(_admZip);

var _jsonfile = __webpack_require__(23);

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _mkdirp = __webpack_require__(31);

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _q = __webpack_require__(32);

var _q2 = _interopRequireDefault(_q);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {
    try {
        nw.Window.get().show();
    } catch (e) {}

    var fs = __webpack_require__(0);
    var path = __webpack_require__(1);
    var gui = __webpack_require__(33);
    var launcher = gui.Window.get();

    var localStorage = window.localStorage;
    var process = window.process;
    // const global = self.global

    // 针对 macOS 特殊处理
    if (process.platform === "darwin") {
        var mb = new gui.Menu({ type: 'menubar' });
        mb.createMacBuiltin('YourAPPName', {
            hideEdit: false
        });
        gui.Window.get().menu = mb;
    }

    //launcher.showDevTools()

    // 数据包目录下的文件列表
    var fileListData = [];

    // 解压缩工作目录下的文件列表
    var fileListAppData = [];

    // 解压缩工作目录下的文件夹是否有文件
    var isNotEmptyAppDataSub = {};

    // 更新的数据包列表
    var appDataUpdatList = {};
    var appDataUpdated = false;

    // 当前工作目录
    var dirRoot = void 0;
    var rootscheck = [path.dirname(process.execPath), process.cwd()];
    rootscheck.some(function (dir) {
        try {
            fs.accessSync(path.join(dir, 'data'), fs.F_OK);
            dirRoot = dir;
            return true;
        } catch (e) {
            return false;
        }
    });
    // let dirRoot = path.dirname(process.execPath).split(path.sep)
    // dirRoot = (process.platform == 'darwin' || (dirRoot[dirRoot.length - 1] == 'nwjs' && path.basename(process.execPath) == 'nw.exe'))
    //     ? process.cwd()
    //     : path.dirname(process.execPath)

    var dirData = path.join(dirRoot, '/data/');
    var dirApp = gui.App.dataPath;
    var dirAppData = path.join(dirApp, '/Extracted Data/');

    // console.log(
    //     dirRoot,
    //     dirData,
    //     dirApp,
    //     dirAppData
    // )

    // 处理当前数据包版本
    var curVer = {};
    try {
        curVer = JSON.parse(localStorage['nwjs-data-version']);
    } catch (e) {}

    // Error Logger
    var errorlog = function errorlog(err) {
        //console.log(err)
        fs.appendFileSync(path.join(dirRoot, 'errorlog.txt'), new Date() + "\r\n" + (err instanceof Error ? err.message || '' : err) + "\r\n" + "\r\n" + "========================================" + "\r\n" + "\r\n");
    };

    var readdir = function readdir(dir) {
        var deferred = _q2.default.defer();
        fs.readdir(dir, function (err, files) {
            if (err) {
                deferred.reject(new Error(err));
            } else {
                deferred.resolve(files);
            }
        });
        return deferred.promise;
    };

    var unzip = function unzip(dir) {
        var deferred = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _q2.default.defer();

        // console.log(dir)
        var pathParse = (typeof dir === 'undefined' ? 'undefined' : _typeof(dir)) == 'object' ? dir : path.parse(dir);

        // 比对版本
        // 如果版本号高于当前版本，则进行解压缩操作，并更改当前版本号
        // 否则跳过
        var zipFile = path.join(pathParse.dir, pathParse.base);
        // console.log('zipFile', zipFile)
        var zip = new _admZip2.default(zipFile);
        // console.log('zip', zip)
        var comment = zip.getZipComment();
        // console.log('verPackage', comment)
        var verCurrent = curVer[pathParse.name] || '0';
        // console.log('verCurrent', verCurrent)

        // 如果 App 数据目录下对应目录不存在或为空，强制解压缩
        var existInAppData = fileListAppData.indexOf(pathParse.name) > -1;
        var isNotEmpty = isNotEmptyAppDataSub[pathParse.name];
        var extractAnyWay = !existInAppData || !isNotEmpty;
        // console.log('existInAppData', existInAppData)
        // console.log('isNotEmpty', isNotEmpty)
        // console.log('extractAnyWay', extractAnyWay)

        var resolve = function resolve(err) {
            if (err) {
                errorlog(err);
            }
            setTimeout(function () {
                deferred.resolve();
            }, 200);
        };

        // console.log(compareVersion(comment, verCurrent))
        if (extractAnyWay || (0, _compareVersion2.default)(comment, verCurrent)) {
            // console.log(comment, verCurrent)
            // console.log('[' + pathParse.base + '] version ' + comment + ' greater than current ' + verCurrent)
            // console.log('Extract data files')

            // 修改当前版本号变量，在之后写入 localStorage
            var o = {};
            o[pathParse.name] = comment;
            (0, _deepExtend2.default)(curVer, o);

            // 开始解压缩操作
            if (existInAppData && isNotEmpty) (0, _rmDir2.default)(path.join(dirAppData, pathParse.name));

            appDataUpdatList[pathParse.name] = comment;
            appDataUpdated = true;

            // window.testzip = zip
            // window.textdir = dirAppData
            // console.log(window.testzip, dirAppData)
            zip.extractAllToAsync(dirAppData, true, function (err) {
                // console.log(dirAppData)
                resolve(err);
            });
            // testzip.extractAllTo(window.textdir, true)
            // testzip.extractAllToAsync(window.textdir, true, function(err){
            //     console.log(err)
            // })
        } else {
            // console.log('[' + pathParse.base + '] version ' + comment + ' not greater than current ' + verCurrent)
            // console.log('Ignored.')
            // 遍历压缩包内所有文件，如果在目标目录中不存在，解压缩该文件
            // zip.getEntries().forEach((entry) => {

            // })
            resolve();
        }

        return deferred.promise;
    };

    // 函数步骤链，使用 Q 实现
    var promise_chain = _q2.default.fcall(function () {});
    promise_chain

    // Error Handler
    .catch(function (err) {
        return errorlog(err);
        // try {
        //     errorlog(new Error(err))
        // } catch (e) {
        // }
    })

    // 创建数据包解压缩目录
    .then(function () {
        return (0, _mkdirp2.default)(dirAppData);
    })

    // 获取数据包目录下的文件列表
    .then(function () {
        return readdir(dirData);
    }).then(function (files) {
        return fileListData = files;
    })

    // 获取解压缩工作目录下的文件列表
    .then(function () {
        return readdir(dirAppData);
    }).then(function (files) {
        return fileListAppData = files;
    })

    // 检查解压缩工作目录下的子文件夹是否为空
    .then(function () {
        var chain = (0, _q2.default)();
        var deferred = _q2.default.defer();

        fileListAppData.forEach(function (filename) {
            chain = chain.then(function () {
                var deferred = _q2.default.defer();
                var searchPath = path.join(dirAppData, filename);

                // 检查是否为目录，再检查是否为空
                fs.stat(searchPath, function (err, stat) {
                    if (err || !stat.isDirectory()) {
                        if (err) errorlog(new Error(err));
                        deferred.resolve();
                    } else {
                        fs.readdir(searchPath, function (err, items) {
                            if (err) {
                                errorlog(new Error(err));
                            } else {
                                isNotEmptyAppDataSub[filename] = items.length ? true : false;
                            }
                            deferred.resolve();
                        });
                    }
                });

                return deferred.promise;
            });
        });

        chain = chain.then(function () {
            deferred.resolve();
        });

        return deferred.promise;
    })

    // 处理 data 目录下的文件
    // 解压缩所有 .nwjs-data 文件
    .then(function () {
        var chain = (0, _q2.default)();
        var deferred = _q2.default.defer();

        fileListData.forEach(function (filename) {
            chain = chain.then(function () {
                console.log(filename);
                var deferred = _q2.default.defer();
                var pathParse = path.parse(path.join(dirData, filename), filename);

                switch (pathParse['ext']) {
                    case '.nwjs-data':
                        unzip(pathParse, deferred);
                        break;
                    default:
                        deferred.resolve();
                        break;
                }

                // 存储数据包版本号至 localStorage
                localStorage['nwjs-data-version'] = JSON.stringify(curVer);
                return deferred.promise;
            });
        });

        chain = chain.then(function () {
            deferred.resolve();
        });

        return deferred.promise;
    })

    // 根据 package-app.json 运行程序
    .then(function () {
        console.log('finished');
        // return false
        var deferred = _q2.default.defer();

        // 载入 package-app.json
        var options = _jsonfile2.default.readFileSync('./package-app.json');

        console.log('exist options: ', JSON.stringify(options));

        options["window"]["focus"] = true;
        if (appDataUpdated) options["dataUpdated"] = appDataUpdatList;

        var max_width = Math.min(options["window"]["max_width"] || screen.availWidth, screen.availWidth);
        var max_height = Math.min(options["window"]["max_height"] || screen.availHeight, screen.availHeight);

        delete options["window"]["max_width"];
        delete options["window"]["max_height"];

        options["window"]["min_width"] = Math.min(options["window"]["min_width"] || 0, max_width);
        options["window"]["min_height"] = Math.min(options["window"]["min_height"] || 0, max_height);

        options["window"]["width"] = Math.min(options["window"]["width"] || screen.availWidth, max_width);
        options["window"]["height"] = Math.min(options["window"]["height"] || screen.availHeight, max_height);

        // Platform
        var platformOverrides = options['platformOverrides'] || {};
        console.log('platformOverrides: ', JSON.stringify(platformOverrides));
        if (/^win[0-9]+/i.test(process.platform)) {
            (0, _deepExtend2.default)(options, platformOverrides['win'] || {});
            if (process.arch == 'x64') {
                (0, _deepExtend2.default)(options, platformOverrides['win64'] || {});
            } else {
                (0, _deepExtend2.default)(options, platformOverrides['win32'] || {});
            }
        } else if (/^darwin/i.test(process.platform)) {
            (0, _deepExtend2.default)(options, platformOverrides['osx'] || {});
            if (process.arch == 'ia64') {
                (0, _deepExtend2.default)(options, platformOverrides['osx64'] || {});
            } else {
                (0, _deepExtend2.default)(options, platformOverrides['osx32'] || {});
            }
        } else if (/^Linux/i.test(process.platform)) {
            (0, _deepExtend2.default)(options, platformOverrides['linux'] || {});
            if (process.arch == 'x64') {
                (0, _deepExtend2.default)(options, platformOverrides['linux64'] || {});
            } else {
                (0, _deepExtend2.default)(options, platformOverrides['linux32'] || {});
            }
        }

        // options['window'].frame = true
        // options['window'].show = true
        // options['window'].toolbar = true
        console.log('new options: ', JSON.stringify(options));
        // return false;
        // console.log( path.join(dirAppData, options.main) )
        global.launcherOptions = options;
        localStorage.setItem('nwManifest', JSON.stringify(options));

        // 开始新的 nw.js 进程
        options.window['always_on_top'] = options.window['always-on-top'];
        options.window.id = 'nwjsapp';
        options.debug = false;
        delete options.window.toolbar;
        delete options.window.as_desktop;
        delete options.window['always-on-top'];
        var appWin = gui.Window.open('file://' + path.join(dirAppData, options.main), options['window'], function (win) {
            win.window.launcherOptions = options;
            win.window.nw = nw;
            win.window.win = win;
            // win.get().show()

            // 在 App 窗口载入后，隐藏 luancher 进程
            win.on('loaded', function () {
                launcher.hide();
                deferred.resolve();
            });

            // 在 App 窗口关闭时，终结原 nw.js 进程 (launcher 进程)
            win.on('closed', function () {
                localStorage.removeItem('nwManifest');
                launcher.close();
            });
        });

        return deferred.promise;
    });
})();

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

// compare version
// 对比版本号 a 相对于 b
// a > b => 1
// a = b => 0
// a < b => -1

exports.default = function (a, b) {
    var i = void 0,
        len = void 0;

    if ((typeof a === 'undefined' ? 'undefined' : _typeof(a)) + (typeof b === 'undefined' ? 'undefined' : _typeof(b)) !== 'stringstring') {
        return false;
    }

    a = a.split('.');
    b = b.split('.');
    i = 0;
    len = Math.max(a.length, b.length);

    for (; i < len; i++) {
        if (a[i] && !b[i] && parseInt(a[i]) > 0 || parseInt(a[i]) > parseInt(b[i])) {
            return 1;
        } else if (b[i] && !a[i] && parseInt(b[i]) > 0 || parseInt(a[i]) < parseInt(b[i])) {
            return -1;
        }
    }

    return 0;
};

/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
    value: true
});
// Empty directory
// code from https://gist.github.com/liangzan/807712

var fs = __webpack_require__(0);
var path = __webpack_require__(1);

var rmDir = function rmDir(dirPath, removeSelf) {
    if (removeSelf === undefined) removeSelf = true;
    try {
        var files = fs.readdirSync(dirPath);
    } catch (e) {
        return;
    }
    if (files.length > 0) for (var i = 0; i < files.length; i++) {
        //var filePath = dirPath + '/' + files[i];
        var filePath = path.join(dirPath, files[i]);
        if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);else rmDir(filePath);
    }
    if (removeSelf) fs.rmdirSync(dirPath);
};

exports.default = rmDir;

/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*!
 * @description Recursive object extending
 * @author Viacheslav Lotsmanov <lotsmanov89@gmail.com>
 * @license MIT
 *
 * The MIT License (MIT)
 *
 * Copyright (c) 2013-2015 Viacheslav Lotsmanov
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */



function isSpecificValue(val) {
	return (
		val instanceof Buffer
		|| val instanceof Date
		|| val instanceof RegExp
	) ? true : false;
}

function cloneSpecificValue(val) {
	if (val instanceof Buffer) {
		var x = new Buffer(val.length);
		val.copy(x);
		return x;
	} else if (val instanceof Date) {
		return new Date(val.getTime());
	} else if (val instanceof RegExp) {
		return new RegExp(val);
	} else {
		throw new Error('Unexpected situation');
	}
}

/**
 * Recursive cloning array.
 */
function deepCloneArray(arr) {
	var clone = [];
	arr.forEach(function (item, index) {
		if (typeof item === 'object' && item !== null) {
			if (Array.isArray(item)) {
				clone[index] = deepCloneArray(item);
			} else if (isSpecificValue(item)) {
				clone[index] = cloneSpecificValue(item);
			} else {
				clone[index] = deepExtend({}, item);
			}
		} else {
			clone[index] = item;
		}
	});
	return clone;
}

/**
 * Extening object that entered in first argument.
 *
 * Returns extended object or false if have no target object or incorrect type.
 *
 * If you wish to clone source object (without modify it), just use empty new
 * object as first argument, like this:
 *   deepExtend({}, yourObj_1, [yourObj_N]);
 */
var deepExtend = module.exports = function (/*obj_1, [obj_2], [obj_N]*/) {
	if (arguments.length < 1 || typeof arguments[0] !== 'object') {
		return false;
	}

	if (arguments.length < 2) {
		return arguments[0];
	}

	var target = arguments[0];

	// convert arguments to array and cut off target object
	var args = Array.prototype.slice.call(arguments, 1);

	var val, src, clone;

	args.forEach(function (obj) {
		// skip argument if isn't an object, is null, or is an array
		if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
			return;
		}

		Object.keys(obj).forEach(function (key) {
			src = target[key]; // source value
			val = obj[key]; // new value

			// recursion prevention
			if (val === target) {
				return;

			/**
			 * if new value isn't object then just overwrite by new value
			 * instead of extending.
			 */
			} else if (typeof val !== 'object' || val === null) {
				target[key] = val;
				return;

			// just clone arrays (and recursive clone objects inside)
			} else if (Array.isArray(val)) {
				target[key] = deepCloneArray(val);
				return;

			// custom cloning and overwrite for specific objects
			} else if (isSpecificValue(val)) {
				target[key] = cloneSpecificValue(val);
				return;

			// overwrite by new value if source isn't object or array
			} else if (typeof src !== 'object' || src === null || Array.isArray(src)) {
				target[key] = deepExtend({}, val);
				return;

			// source value and new value is objects both, extending...
			} else {
				target[key] = deepExtend(src, val);
				return;
			}
		});
	});

	return target;
}


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(0),
    pth = __webpack_require__(1);

fs.existsSync = fs.existsSync || pth.existsSync;

var ZipEntry = __webpack_require__(3),
    ZipFile =  __webpack_require__(22),
    Utils = __webpack_require__(2);

module.exports = function(/*String*/input) {
    var _zip = undefined,
        _filename = "";

    if (input && typeof input === "string") { // load zip file
        if (fs.existsSync(input)) {
            _filename = input;
            _zip = new ZipFile(input, Utils.Constants.FILE);
        } else {
           throw Utils.Errors.INVALID_FILENAME;
        }
    } else if(input && Buffer.isBuffer(input)) { // load buffer
        _zip = new ZipFile(input, Utils.Constants.BUFFER);
    } else { // create new zip file
        _zip = new ZipFile(null, Utils.Constants.NONE);
    }

    function getEntry(/*Object*/entry) {
        if (entry && _zip) {
            var item;
            // If entry was given as a file name
            if (typeof entry === "string")
                item = _zip.getEntry(entry);
            // if entry was given as a ZipEntry object
            if (typeof entry === "object" && entry.entryName != undefined && entry.header != undefined)
                item =  _zip.getEntry(entry.entryName);

            if (item) {
                return item;
            }
        }
        return null;
    }

    return {
        /**
         * Extracts the given entry from the archive and returns the content as a Buffer object
         * @param entry ZipEntry object or String with the full path of the entry
         *
         * @return Buffer or Null in case of error
         */
        readFile : function(/*Object*/entry) {
            var item = getEntry(entry);
            return item && item.getData() || null;
        },

        /**
         * Asynchronous readFile
         * @param entry ZipEntry object or String with the full path of the entry
         * @param callback
         *
         * @return Buffer or Null in case of error
         */
        readFileAsync : function(/*Object*/entry, /*Function*/callback) {
            var item = getEntry(entry);
            if (item) {
                item.getDataAsync(callback);
            } else {
                callback(null,"getEntry failed for:" + entry)
            }
        },

        /**
         * Extracts the given entry from the archive and returns the content as plain text in the given encoding
         * @param entry ZipEntry object or String with the full path of the entry
         * @param encoding Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsText : function(/*Object*/entry, /*String - Optional*/encoding) {
            var item = getEntry(entry);
            if (item) {
                var data = item.getData();
                if (data && data.length) {
                    return data.toString(encoding || "utf8");
                }
            }
            return "";
        },

        /**
         * Asynchronous readAsText
         * @param entry ZipEntry object or String with the full path of the entry
         * @param callback
         * @param encoding Optional. If no encoding is specified utf8 is used
         *
         * @return String
         */
        readAsTextAsync : function(/*Object*/entry, /*Function*/callback, /*String - Optional*/encoding) {
            var item = getEntry(entry);
            if (item) {
                item.getDataAsync(function(data) {
                    if (data && data.length) {
                        callback(data.toString(encoding || "utf8"));
                    } else {
                        callback("");
                    }
                })
            } else {
                callback("");
            }
        },

        /**
         * Remove the entry from the file or the entry and all it's nested directories and files if the given entry is a directory
         *
         * @param entry
         */
        deleteFile : function(/*Object*/entry) { // @TODO: test deleteFile
            var item = getEntry(entry);
            if (item) {
                _zip.deleteEntry(item.entryName);
            }
        },

        /**
         * Adds a comment to the zip. The zip must be rewritten after adding the comment.
         *
         * @param comment
         */
        addZipComment : function(/*String*/comment) { // @TODO: test addZipComment
            _zip.comment = comment;
        },

        /**
         * Returns the zip comment
         *
         * @return String
         */
        getZipComment : function() {
            return _zip.comment || '';
        },

        /**
         * Adds a comment to a specified zipEntry. The zip must be rewritten after adding the comment
         * The comment cannot exceed 65535 characters in length
         *
         * @param entry
         * @param comment
         */
        addZipEntryComment : function(/*Object*/entry,/*String*/comment) {
            var item = getEntry(entry);
            if (item) {
                item.comment = comment;
            }
        },

        /**
         * Returns the comment of the specified entry
         *
         * @param entry
         * @return String
         */
        getZipEntryComment : function(/*Object*/entry) {
            var item = getEntry(entry);
            if (item) {
                return item.comment || '';
            }
            return ''
        },

        /**
         * Updates the content of an existing entry inside the archive. The zip must be rewritten after updating the content
         *
         * @param entry
         * @param content
         */
        updateFile : function(/*Object*/entry, /*Buffer*/content) {
            var item = getEntry(entry);
            if (item) {
                item.setData(content);
            }
        },

        /**
         * Adds a file from the disk to the archive
         *
         * @param localPath
         */
        addLocalFile : function(/*String*/localPath, /*String*/zipPath, /*String*/zipName) {
             if (fs.existsSync(localPath)) {
                if(zipPath){
                    zipPath=zipPath.split("\\").join("/");
                    if(zipPath.charAt(zipPath.length - 1) != "/"){
                        zipPath += "/";
                    }
                }else{
                    zipPath="";
                }
                 var p = localPath.split("\\").join("/").split("/").pop();
                
                 if(zipName){
                    this.addFile(zipPath+zipName, fs.readFileSync(localPath), "", 0)
                 }else{
                    this.addFile(zipPath+p, fs.readFileSync(localPath), "", 0)
                 }
             } else {
                 throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
             }
        },

        /**
         * Adds a local directory and all its nested files and directories to the archive
         *
         * @param localPath
         * @param zipPath optional path inside zip
         * @param filter optional RegExp or Function if files match will
         *               be included.
         */
        addLocalFolder : function(/*String*/localPath, /*String*/zipPath, /*RegExp|Function*/filter) {
            if (filter === undefined) {
              filter = function() { return true; };
            } else if (filter instanceof RegExp) {
              filter = function(filter) {
                return function(filename) {
                  return filter.test(filename);
                }
              }(filter);
            }

            if(zipPath){
                zipPath=zipPath.split("\\").join("/");
                if(zipPath.charAt(zipPath.length - 1) != "/"){
                    zipPath += "/";
                }
            }else{
                zipPath="";
            }
			localPath = localPath.split("\\").join("/"); //windows fix
            localPath = pth.normalize(localPath);
            if (localPath.charAt(localPath.length - 1) != "/")
                localPath += "/";

            if (fs.existsSync(localPath)) {

                var items = Utils.findFiles(localPath),
                    self = this;

                if (items.length) {
                    items.forEach(function(path) {
						var p = path.split("\\").join("/").replace( new RegExp(localPath, 'i'), ""); //windows fix
                        if (filter(p)) {
                            if (p.charAt(p.length - 1) !== "/") {
                                self.addFile(zipPath+p, fs.readFileSync(path), "", 0)
                            } else {
                                self.addFile(zipPath+p, new Buffer(0), "", 0)
                            }
                        }
                    });
                }
            } else {
                throw Utils.Errors.FILE_NOT_FOUND.replace("%s", localPath);
            }
        },

        /**
         * Allows you to create a entry (file or directory) in the zip file.
         * If you want to create a directory the entryName must end in / and a null buffer should be provided.
         * Comment and attributes are optional
         *
         * @param entryName
         * @param content
         * @param comment
         * @param attr
         */
        addFile : function(/*String*/entryName, /*Buffer*/content, /*String*/comment, /*Number*/attr) {
            var entry = new ZipEntry();
            entry.entryName = entryName;
            entry.comment = comment || "";
            entry.attr = attr || 438; //0666;
            if (entry.isDirectory && content.length) {
               // throw Utils.Errors.DIRECTORY_CONTENT_ERROR;
            }
            entry.setData(content);
            _zip.setEntry(entry);
        },

        /**
         * Returns an array of ZipEntry objects representing the files and folders inside the archive
         *
         * @return Array
         */
        getEntries : function() {
            if (_zip) {
               return _zip.entries;
            } else {
                return [];
            }
        },

        /**
         * Returns a ZipEntry object representing the file or folder specified by ``name``.
         *
         * @param name
         * @return ZipEntry
         */
        getEntry : function(/*String*/name) {
            return getEntry(name);
        },

        /**
         * Extracts the given entry to the given targetPath
         * If the entry is a directory inside the archive, the entire directory and it's subdirectories will be extracted
         *
         * @param entry ZipEntry object or String with the full path of the entry
         * @param targetPath Target folder where to write the file
         * @param maintainEntryPath If maintainEntryPath is true and the entry is inside a folder, the entry folder
         *                          will be created in targetPath as well. Default is TRUE
         * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         *
         * @return Boolean
         */
        extractEntryTo : function(/*Object*/entry, /*String*/targetPath, /*Boolean*/maintainEntryPath, /*Boolean*/overwrite) {
            overwrite = overwrite || false;
            maintainEntryPath = typeof maintainEntryPath == "undefined" ? true : maintainEntryPath;

            var item = getEntry(entry);
            if (!item) {
                throw Utils.Errors.NO_ENTRY;
            }

            var target = pth.resolve(targetPath, maintainEntryPath ? item.entryName : pth.basename(item.entryName));

            if (item.isDirectory) {
                target = pth.resolve(target, "..");
                var children = _zip.getEntryChildren(item);
                children.forEach(function(child) {
                    if (child.isDirectory) return;
                    var content = child.getData();
                    if (!content) {
                        throw Utils.Errors.CANT_EXTRACT_FILE;
                    }
                    Utils.writeFileTo(pth.resolve(targetPath, maintainEntryPath ? child.entryName : child.entryName.substr(item.entryName.length)), content, overwrite);
                });
                return true;
            }

            var content = item.getData();
            if (!content) throw Utils.Errors.CANT_EXTRACT_FILE;

            if (fs.existsSync(target) && !overwrite) {
                throw Utils.Errors.CANT_OVERRIDE;
            }
            Utils.writeFileTo(target, content, overwrite);

            return true;
        },

        /**
         * Extracts the entire archive to the given location
         *
         * @param targetPath Target location
         * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         */
        extractAllTo : function(/*String*/targetPath, /*Boolean*/overwrite) {
            overwrite = overwrite || false;
            if (!_zip) {
                throw Utils.Errors.NO_ZIP;
            }

            _zip.entries.forEach(function(entry) {
                if (entry.isDirectory) {
                    Utils.makeDir(pth.resolve(targetPath, entry.entryName.toString()));
                    return;
                }
                var content = entry.getData();
                if (!content) {
                    throw Utils.Errors.CANT_EXTRACT_FILE + "2";
                }
                Utils.writeFileTo(pth.resolve(targetPath, entry.entryName.toString()), content, overwrite);
            })
        },

        /**
         * Asynchronous extractAllTo
         *
         * @param targetPath Target location
         * @param overwrite If the file already exists at the target path, the file will be overwriten if this is true.
         *                  Default is FALSE
         * @param callback
         */
        extractAllToAsync : function(/*String*/targetPath, /*Boolean*/overwrite, /*Function*/callback) {
            overwrite = overwrite || false;
            if (!_zip) {
                callback(new Error(Utils.Errors.NO_ZIP));
                return;
            }

            var entries = _zip.entries;
            var i = entries.length; 
            entries.forEach(function(entry) {
                if(i <= 0) return; // Had an error already

                if (entry.isDirectory) {
                    Utils.makeDir(pth.resolve(targetPath, entry.entryName.toString()));
                    if(--i == 0)
                        callback(undefined);
                    return;
                }
                entry.getDataAsync(function(content) {
                    if(i <= 0) return;
                    if (!content) {
                        i = 0;
                        callback(new Error(Utils.Errors.CANT_EXTRACT_FILE + "2"));
                        return;
                    }
                    Utils.writeFileToAsync(pth.resolve(targetPath, entry.entryName.toString()), content, overwrite, function(succ) {
                        if(i <= 0) return;

                        if(!succ) {
                            i = 0;
                            callback(new Error('Unable to write'));
                            return;
                        }

                        if(--i == 0)
                            callback(undefined);
                    });
                    
                });
            })
        },

        /**
         * Writes the newly created zip file to disk at the specified location or if a zip was opened and no ``targetFileName`` is provided, it will overwrite the opened zip
         *
         * @param targetFileName
         * @param callback
         */
        writeZip : function(/*String*/targetFileName, /*Function*/callback) {
            if (arguments.length == 1) {
                if (typeof targetFileName == "function") {
                    callback = targetFileName;
                    targetFileName = "";
                }
            }

            if (!targetFileName && _filename) {
                targetFileName = _filename;
            }
            if (!targetFileName) return;

            var zipData = _zip.compressToBuffer();
            if (zipData) {
                var ok = Utils.writeFileTo(targetFileName, zipData, true);
                if (typeof callback == 'function') callback(!ok? new Error("failed"): null, "");
            }
        },

        /**
         * Returns the content of the entire zip file as a Buffer object
         *
         * @return Buffer
         */
        toBuffer : function(/*Function*/onSuccess,/*Function*/onFail,/*Function*/onItemStart,/*Function*/onItemEnd) {
            this.valueOf = 2;
            if (typeof onSuccess == "function") {
                _zip.toAsyncBuffer(onSuccess,onFail,onItemStart,onItemEnd);
                return null;
            }
            return _zip.compressToBuffer()
        }
    }
};


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(0),
    pth = __webpack_require__(1);

fs.existsSync = fs.existsSync || pth.existsSync;

module.exports = (function() {

    var crcTable = [],
        Constants = __webpack_require__(4),
        Errors = __webpack_require__(5),

        PATH_SEPARATOR = pth.normalize("/");


    function mkdirSync(/*String*/path) {
        var resolvedPath = path.split(PATH_SEPARATOR)[0];
        path.split(PATH_SEPARATOR).forEach(function(name) {
            if (!name || name.substr(-1,1) == ":") return;
            resolvedPath += PATH_SEPARATOR + name;
            var stat;
            try {
                stat = fs.statSync(resolvedPath);
            } catch (e) {
                fs.mkdirSync(resolvedPath);
            }
            if (stat && stat.isFile())
                throw Errors.FILE_IN_THE_WAY.replace("%s", resolvedPath);
        });
    }

    function findSync(/*String*/root, /*RegExp*/pattern, /*Boolean*/recoursive) {
        if (typeof pattern === 'boolean') {
            recoursive = pattern;
            pattern = undefined;
        }
        var files = [];
        fs.readdirSync(root).forEach(function(file) {
            var path = pth.join(root, file);

            if (fs.statSync(path).isDirectory() && recoursive)
                files = files.concat(findSync(path, pattern, recoursive));

            if (!pattern || pattern.test(path)) {
                files.push(pth.normalize(path) + (fs.statSync(path).isDirectory() ? PATH_SEPARATOR : ""));
            }

        });
        return files;
    }

    return {
        makeDir : function(/*String*/path) {
            mkdirSync(path);
        },

        crc32 : function(buf) {
            var b = new Buffer(4);
            if (!crcTable.length) {
                for (var n = 0; n < 256; n++) {
                    var c = n;
                    for (var k = 8; --k >= 0;)  //
                        if ((c & 1) != 0)  { c = 0xedb88320 ^ (c >>> 1); } else { c = c >>> 1; }
                    if (c < 0) {
                        b.writeInt32LE(c, 0);
                        c = b.readUInt32LE(0);
                    }
                    crcTable[n] = c;
                }
            }
            var crc = 0, off = 0, len = buf.length, c1 = ~crc;
            while(--len >= 0) c1 = crcTable[(c1 ^ buf[off++]) & 0xff] ^ (c1 >>> 8);
            crc = ~c1;
            b.writeInt32LE(crc & 0xffffffff, 0);
            return b.readUInt32LE(0);
        },

        methodToString : function(/*Number*/method) {
            switch (method) {
                case Constants.STORED:
                    return 'STORED (' + method + ')';
                case Constants.DEFLATED:
                    return 'DEFLATED (' + method + ')';
                default:
                    return 'UNSUPPORTED (' + method + ')';
            }

        },

        writeFileTo : function(/*String*/path, /*Buffer*/content, /*Boolean*/overwrite, /*Number*/attr) {
            if (fs.existsSync(path)) {
                if (!overwrite)
                    return false; // cannot overwite

                var stat = fs.statSync(path);
                if (stat.isDirectory()) {
                    return false;
                }
            }
            var folder = pth.dirname(path);
            if (!fs.existsSync(folder)) {
                mkdirSync(folder);
            }

            var fd;
            try {
                fd = fs.openSync(path, 'w', 438); // 0666
            } catch(e) {
                fs.chmodSync(path, 438);
                fd = fs.openSync(path, 'w', 438);
            }
            if (fd) {
                fs.writeSync(fd, content, 0, content.length, 0);
                fs.closeSync(fd);
            }
            fs.chmodSync(path, attr || 438);
            return true;
        },

        writeFileToAsync : function(/*String*/path, /*Buffer*/content, /*Boolean*/overwrite, /*Number*/attr, /*Function*/callback) {
            if(typeof attr === 'function') {
                callback = attr;
                attr = undefined;
            }

            fs.exists(path, function(exists) {
                if(exists && !overwrite)
                    return callback(false);

                fs.stat(path, function(err, stat) {
                    if(exists &&stat.isDirectory()) {
                        return callback(false);
                    }

                    var folder = pth.dirname(path);
                    fs.exists(folder, function(exists) {
                        if(!exists)
                            mkdirSync(folder);
                        
                        fs.open(path, 'w', 438, function(err, fd) {
                            if(err) {
                                fs.chmod(path, 438, function(err) {
                                    fs.open(path, 'w', 438, function(err, fd) {
                                        fs.write(fd, content, 0, content.length, 0, function(err, written, buffer) {
                                            fs.close(fd, function(err) {
                                                fs.chmod(path, attr || 438, function() {
                                                    callback(true);
                                                })
                                            });
                                        });
                                    });
                                })
                            } else {
                                if(fd) {
                                    fs.write(fd, content, 0, content.length, 0, function(err, written, buffer) {
                                        fs.close(fd, function(err) {
                                            fs.chmod(path, attr || 438, function() {
                                                callback(true);
                                            })
                                        });
                                    });
                                } else {
                                    fs.chmod(path, attr || 438, function() {
                                        callback(true);
                                    })
                                }
                            }
                        });
                    })
                })
            })
        },

        findFiles : function(/*String*/path) {
            return findSync(path, true);
        },

        getAttributes : function(/*String*/path) {

        },

        setAttributes : function(/*String*/path) {

        },

        toBuffer : function(input) {
            if (Buffer.isBuffer(input)) {
                return input;
            } else {
                if (input.length == 0) {
                    return new Buffer(0)
                }
                return new Buffer(input, 'utf8');
            }
        },

        Constants : Constants,
        Errors : Errors
    }
})();


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(0),
    pth = __webpack_require__(1);
	
fs.existsSync = fs.existsSync || pth.existsSync;

module.exports = function(/*String*/path) {

    var _path = path || "",
        _permissions = 0,
        _obj = newAttr(),
        _stat = null;

    function newAttr() {
        return {
            directory : false,
            readonly : false,
            hidden : false,
            executable : false,
            mtime : 0,
            atime : 0
        }
    }

    if (_path && fs.existsSync(_path)) {
        _stat = fs.statSync(_path);
        _obj.directory = _stat.isDirectory();
        _obj.mtime = _stat.mtime;
        _obj.atime = _stat.atime;
        _obj.executable = !!(1 & parseInt ((_stat.mode & parseInt ("777", 8)).toString (8)[0]));
        _obj.readonly = !!(2 & parseInt ((_stat.mode & parseInt ("777", 8)).toString (8)[0]));
        _obj.hidden = pth.basename(_path)[0] === ".";
    } else {
        console.warn("Invalid path: " + _path)
    }

    return {

        get directory () {
            return _obj.directory;
        },

        get readOnly () {
            return _obj.readonly;
        },

        get hidden () {
            return _obj.hidden;
        },

        get mtime () {
            return _obj.mtime;
        },

        get atime () {
           return _obj.atime;
        },


        get executable () {
            return _obj.executable;
        },

        decodeAttributes : function(val) {

        },

        encodeAttributes : function (val) {

        },

        toString : function() {
           return '{\n' +
               '\t"path" : "' + _path + ",\n" +
               '\t"isDirectory" : ' + _obj.directory + ",\n" +
               '\t"isReadOnly" : ' + _obj.readonly + ",\n" +
               '\t"isHidden" : ' + _obj.hidden + ",\n" +
               '\t"isExecutable" : ' + _obj.executable + ",\n" +
               '\t"mTime" : ' + _obj.mtime + "\n" +
               '\t"aTime" : ' + _obj.atime + "\n" +
           '}';
        }
    }

};


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

var Utils = __webpack_require__(2),
    Constants = Utils.Constants;

/* The central directory file header */
module.exports = function () {
    var _verMade = 0x0A,
        _version = 0x0A,
        _flags = 0,
        _method = 0,
        _time = 0,
        _crc = 0,
        _compressedSize = 0,
        _size = 0,
        _fnameLen = 0,
        _extraLen = 0,

        _comLen = 0,
        _diskStart = 0,
        _inattr = 0,
        _attr = 0,
        _offset = 0;

    var _dataHeader = {};

    function setTime(val) {
        var val = new Date(val);
        _time = (val.getFullYear() - 1980 & 0x7f) << 25  // b09-16 years from 1980
            | (val.getMonth() + 1) << 21                 // b05-08 month
            | val.getDay() << 16                         // b00-04 hour

            // 2 bytes time
            | val.getHours() << 11    // b11-15 hour
            | val.getMinutes() << 5   // b05-10 minute
            | val.getSeconds() >> 1;  // b00-04 seconds divided by 2
    }

    setTime(+new Date());

    return {
        get made () { return _verMade; },
        set made (val) { _verMade = val; },

        get version () { return _version; },
        set version (val) { _version = val },

        get flags () { return _flags },
        set flags (val) { _flags = val; },

        get method () { return _method; },
        set method (val) { _method = val; },

        get time () { return new Date(
            ((_time >> 25) & 0x7f) + 1980,
            ((_time >> 21) & 0x0f) - 1,
            (_time >> 16) & 0x1f,
            (_time >> 11) & 0x1f,
            (_time >> 5) & 0x3f,
            (_time & 0x1f) << 1
        );
        },
        set time (val) {
            setTime(val);
        },

        get crc () { return _crc; },
        set crc (val) { _crc = val; },

        get compressedSize () { return _compressedSize; },
        set compressedSize (val) { _compressedSize = val; },

        get size () { return _size; },
        set size (val) { _size = val; },

        get fileNameLength () { return _fnameLen; },
        set fileNameLength (val) { _fnameLen = val; },

        get extraLength () { return _extraLen },
        set extraLength (val) { _extraLen = val; },

        get commentLength () { return _comLen },
        set commentLength (val) { _comLen = val },

        get diskNumStart () { return _diskStart },
        set diskNumStart (val) { _diskStart = val },

        get inAttr () { return _inattr },
        set inAttr (val) { _inattr = val },

        get attr () { return _attr },
        set attr (val) { _attr = val },

        get offset () { return _offset },
        set offset (val) { _offset = val },

        get encripted () { return (_flags & 1) == 1 },

        get entryHeaderSize () {
            return Constants.CENHDR + _fnameLen + _extraLen + _comLen;
        },

        get realDataOffset () {
            return _offset + Constants.LOCHDR + _dataHeader.fnameLen + _dataHeader.extraLen;
        },

        get dataHeader () {
            return _dataHeader;
        },

        loadDataHeaderFromBinary : function(/*Buffer*/input) {
            var data = input.slice(_offset, _offset + Constants.LOCHDR);
            // 30 bytes and should start with "PK\003\004"
            if (data.readUInt32LE(0) != Constants.LOCSIG) {
                throw Utils.Errors.INVALID_LOC;
            }
            _dataHeader = {
                // version needed to extract
                version : data.readUInt16LE(Constants.LOCVER),
                // general purpose bit flag
                flags : data.readUInt16LE(Constants.LOCFLG),
                // compression method
                method : data.readUInt16LE(Constants.LOCHOW),
                // modification time (2 bytes time, 2 bytes date)
                time : data.readUInt32LE(Constants.LOCTIM),
                // uncompressed file crc-32 value
                crc : data.readUInt32LE(Constants.LOCCRC),
                // compressed size
                compressedSize : data.readUInt32LE(Constants.LOCSIZ),
                // uncompressed size
                size : data.readUInt32LE(Constants.LOCLEN),
                // filename length
                fnameLen : data.readUInt16LE(Constants.LOCNAM),
                // extra field length
                extraLen : data.readUInt16LE(Constants.LOCEXT)
            }
        },

        loadFromBinary : function(/*Buffer*/data) {
            // data should be 46 bytes and start with "PK 01 02"
            if (data.length != Constants.CENHDR || data.readUInt32LE(0) != Constants.CENSIG) {
                throw Utils.Errors.INVALID_CEN;
            }
            // version made by
            _verMade = data.readUInt16LE(Constants.CENVEM);
            // version needed to extract
            _version = data.readUInt16LE(Constants.CENVER);
            // encrypt, decrypt flags
            _flags = data.readUInt16LE(Constants.CENFLG);
            // compression method
            _method = data.readUInt16LE(Constants.CENHOW);
            // modification time (2 bytes time, 2 bytes date)
            _time = data.readUInt32LE(Constants.CENTIM);
            // uncompressed file crc-32 value
            _crc = data.readUInt32LE(Constants.CENCRC);
            // compressed size
            _compressedSize = data.readUInt32LE(Constants.CENSIZ);
            // uncompressed size
            _size = data.readUInt32LE(Constants.CENLEN);
            // filename length
            _fnameLen = data.readUInt16LE(Constants.CENNAM);
            // extra field length
            _extraLen = data.readUInt16LE(Constants.CENEXT);
            // file comment length
            _comLen = data.readUInt16LE(Constants.CENCOM);
            // volume number start
            _diskStart = data.readUInt16LE(Constants.CENDSK);
            // internal file attributes
            _inattr = data.readUInt16LE(Constants.CENATT);
            // external file attributes
            _attr = data.readUInt32LE(Constants.CENATX);
            // LOC header offset
            _offset = data.readUInt32LE(Constants.CENOFF);
        },

        dataHeaderToBinary : function() {
            // LOC header size (30 bytes)
            var data = new Buffer(Constants.LOCHDR);
            // "PK\003\004"
            data.writeUInt32LE(Constants.LOCSIG, 0);
            // version needed to extract
            data.writeUInt16LE(_version, Constants.LOCVER);
            // general purpose bit flag
            data.writeUInt16LE(_flags, Constants.LOCFLG);
            // compression method
            data.writeUInt16LE(_method, Constants.LOCHOW);
            // modification time (2 bytes time, 2 bytes date)
            data.writeUInt32LE(_time, Constants.LOCTIM);
            // uncompressed file crc-32 value
            data.writeUInt32LE(_crc, Constants.LOCCRC);
            // compressed size
            data.writeUInt32LE(_compressedSize, Constants.LOCSIZ);
            // uncompressed size
            data.writeUInt32LE(_size, Constants.LOCLEN);
            // filename length
            data.writeUInt16LE(_fnameLen, Constants.LOCNAM);
            // extra field length
            data.writeUInt16LE(_extraLen, Constants.LOCEXT);
            return data;
        },

        entryHeaderToBinary : function() {
            // CEN header size (46 bytes)
            var data = new Buffer(Constants.CENHDR + _fnameLen + _extraLen + _comLen);
            // "PK\001\002"
            data.writeUInt32LE(Constants.CENSIG, 0);
            // version made by
            data.writeUInt16LE(_verMade, Constants.CENVEM);
            // version needed to extract
            data.writeUInt16LE(_version, Constants.CENVER);
            // encrypt, decrypt flags
            data.writeUInt16LE(_flags, Constants.CENFLG);
            // compression method
            data.writeUInt16LE(_method, Constants.CENHOW);
            // modification time (2 bytes time, 2 bytes date)
            data.writeUInt32LE(_time, Constants.CENTIM);
            // uncompressed file crc-32 value
            data.writeInt32LE(_crc, Constants.CENCRC, true);
            // compressed size
            data.writeUInt32LE(_compressedSize, Constants.CENSIZ);
            // uncompressed size
            data.writeUInt32LE(_size, Constants.CENLEN);
            // filename length
            data.writeUInt16LE(_fnameLen, Constants.CENNAM);
            // extra field length
            data.writeUInt16LE(_extraLen, Constants.CENEXT);
            // file comment length
            data.writeUInt16LE(_comLen, Constants.CENCOM);
            // volume number start
            data.writeUInt16LE(_diskStart, Constants.CENDSK);
            // internal file attributes
            data.writeUInt16LE(_inattr, Constants.CENATT);
            // external file attributes
            data.writeUInt32LE(_attr, Constants.CENATX);
            // LOC header offset
            data.writeUInt32LE(_offset, Constants.CENOFF);
            // fill all with
            data.fill(0x00, Constants.CENHDR);
            return data;
        },

        toString : function() {
            return '{\n' +
                '\t"made" : ' + _verMade + ",\n" +
                '\t"version" : ' + _version + ",\n" +
                '\t"flags" : ' + _flags + ",\n" +
                '\t"method" : ' + Utils.methodToString(_method) + ",\n" +
                '\t"time" : ' + _time + ",\n" +
                '\t"crc" : 0x' + _crc.toString(16).toUpperCase() + ",\n" +
                '\t"compressedSize" : ' + _compressedSize + " bytes,\n" +
                '\t"size" : ' + _size + " bytes,\n" +
                '\t"fileNameLength" : ' + _fnameLen + ",\n" +
                '\t"extraLength" : ' + _extraLen + " bytes,\n" +
                '\t"commentLength" : ' + _comLen + " bytes,\n" +
                '\t"diskNumStart" : ' + _diskStart + ",\n" +
                '\t"inAttr" : ' + _inattr + ",\n" +
                '\t"attr" : ' + _attr + ",\n" +
                '\t"offset" : ' + _offset + ",\n" +
                '\t"entryHeaderSize" : ' + (Constants.CENHDR + _fnameLen + _extraLen + _comLen) + " bytes\n" +
                '}';
        }
    }
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

var Utils = __webpack_require__(2),
    Constants = Utils.Constants;

/* The entries in the end of central directory */
module.exports = function () {
    var _volumeEntries = 0,
        _totalEntries = 0,
        _size = 0,
        _offset = 0,
        _commentLength = 0;

    return {
        get diskEntries () { return _volumeEntries },
        set diskEntries (/*Number*/val) { _volumeEntries = _totalEntries = val; },

        get totalEntries () { return _totalEntries },
        set totalEntries (/*Number*/val) { _totalEntries = _volumeEntries = val; },

        get size () { return _size },
        set size (/*Number*/val) { _size = val; },

        get offset () { return _offset },
        set offset (/*Number*/val) { _offset = val; },

        get commentLength () { return _commentLength },
        set commentLength (/*Number*/val) { _commentLength = val; },

        get mainHeaderSize () {
            return Constants.ENDHDR + _commentLength;
        },

        loadFromBinary : function(/*Buffer*/data) {
            // data should be 22 bytes and start with "PK 05 06"
            if (data.length != Constants.ENDHDR || data.readUInt32LE(0) != Constants.ENDSIG)
                throw Utils.Errors.INVALID_END;

            // number of entries on this volume
            _volumeEntries = data.readUInt16LE(Constants.ENDSUB);
            // total number of entries
            _totalEntries = data.readUInt16LE(Constants.ENDTOT);
            // central directory size in bytes
            _size = data.readUInt32LE(Constants.ENDSIZ);
            // offset of first CEN header
            _offset = data.readUInt32LE(Constants.ENDOFF);
            // zip file comment length
            _commentLength = data.readUInt16LE(Constants.ENDCOM);
        },

        toBinary : function() {
           var b = new Buffer(Constants.ENDHDR + _commentLength);
            // "PK 05 06" signature
            b.writeUInt32LE(Constants.ENDSIG, 0);
            b.writeUInt32LE(0, 4);
            // number of entries on this volume
            b.writeUInt16LE(_volumeEntries, Constants.ENDSUB);
            // total number of entries
            b.writeUInt16LE(_totalEntries, Constants.ENDTOT);
            // central directory size in bytes
            b.writeUInt32LE(_size, Constants.ENDSIZ);
            // offset of first CEN header
            b.writeUInt32LE(_offset, Constants.ENDOFF);
            // zip file comment length
            b.writeUInt16LE(_commentLength, Constants.ENDCOM);
            // fill comment memory with spaces so no garbage is left there
            b.fill(" ", Constants.ENDHDR);

            return b;
        },

        toString : function() {
            return '{\n' +
                '\t"diskEntries" : ' + _volumeEntries + ",\n" +
                '\t"totalEntries" : ' + _totalEntries + ",\n" +
                '\t"size" : ' + _size + " bytes,\n" +
                '\t"offset" : 0x' + _offset.toString(16).toUpperCase() + ",\n" +
                '\t"commentLength" : 0x' + _commentLength + "\n" +
            '}';
        }
    }
};

/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

exports.Deflater = __webpack_require__(19);
exports.Inflater = __webpack_require__(20);

/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

/*
 * $Id: rawdeflate.js,v 0.5 2013/04/09 14:25:38 dankogai Exp dankogai $
 *
 * GNU General Public License, version 2 (GPL-2.0)
 *   http://opensource.org/licenses/GPL-2.0
 * Original:
 *  http://www.onicos.com/staff/iz/amuse/javascript/expert/deflate.txt
 */
function JSDeflater(/*inbuff*/inbuf) {

    /* Copyright (C) 1999 Masanao Izumo <iz@onicos.co.jp>
     * Version: 1.0.1
     * LastModified: Dec 25 1999
     */

    var WSIZE = 32768,		// Sliding Window size
        zip_STORED_BLOCK = 0,
        zip_STATIC_TREES = 1,
        zip_DYN_TREES = 2,
        zip_DEFAULT_LEVEL = 6,
        zip_FULL_SEARCH = true,
        zip_INBUFSIZ = 32768,	// Input buffer size
        zip_INBUF_EXTRA = 64,	// Extra buffer
        zip_OUTBUFSIZ = 1024 * 8,
        zip_window_size = 2 * WSIZE,
        MIN_MATCH = 3,
        MAX_MATCH = 258,
        zip_BITS = 16,
        LIT_BUFSIZE = 0x2000,
        zip_HASH_BITS = 13,
        zip_DIST_BUFSIZE = LIT_BUFSIZE,
        zip_HASH_SIZE = 1 << zip_HASH_BITS,
        zip_HASH_MASK = zip_HASH_SIZE - 1,
        zip_WMASK = WSIZE - 1,
        zip_NIL = 0, // Tail of hash chains
        zip_TOO_FAR = 4096,
        zip_MIN_LOOKAHEAD = MAX_MATCH + MIN_MATCH + 1,
        zip_MAX_DIST = WSIZE - zip_MIN_LOOKAHEAD,
        zip_SMALLEST = 1,
        zip_MAX_BITS = 15,
        zip_MAX_BL_BITS = 7,
        zip_LENGTH_CODES = 29,
        zip_LITERALS = 256,
        zip_END_BLOCK = 256,
        zip_L_CODES = zip_LITERALS + 1 + zip_LENGTH_CODES,
        zip_D_CODES = 30,
        zip_BL_CODES = 19,
        zip_REP_3_6 = 16,
        zip_REPZ_3_10 = 17,
        zip_REPZ_11_138 = 18,
        zip_HEAP_SIZE = 2 * zip_L_CODES + 1,
        zip_H_SHIFT = parseInt((zip_HASH_BITS + MIN_MATCH - 1) / MIN_MATCH);

    var zip_free_queue, zip_qhead, zip_qtail, zip_initflag, zip_outbuf = null, zip_outcnt, zip_outoff, zip_complete,
        zip_window, zip_d_buf, zip_l_buf, zip_prev, zip_bi_buf, zip_bi_valid, zip_block_start, zip_ins_h, zip_hash_head,
        zip_prev_match, zip_match_available, zip_match_length, zip_prev_length, zip_strstart, zip_match_start, zip_eofile,
        zip_lookahead, zip_max_chain_length, zip_max_lazy_match, zip_compr_level, zip_good_match, zip_nice_match,
        zip_dyn_ltree, zip_dyn_dtree, zip_static_ltree, zip_static_dtree, zip_bl_tree, zip_l_desc, zip_d_desc, zip_bl_desc,
        zip_bl_count, zip_heap, zip_heap_len, zip_heap_max, zip_depth, zip_length_code, zip_dist_code, zip_base_length,
        zip_base_dist, zip_flag_buf, zip_last_lit, zip_last_dist, zip_last_flags, zip_flags, zip_flag_bit, zip_opt_len,
        zip_static_len, zip_deflate_data, zip_deflate_pos;

    var zip_DeflateCT = function () {
        this.fc = 0; // frequency count or bit string
        this.dl = 0; // father node in Huffman tree or length of bit string
    };

    var zip_DeflateTreeDesc = function () {
        this.dyn_tree = null;	// the dynamic tree
        this.static_tree = null;	// corresponding static tree or NULL
        this.extra_bits = null;	// extra bits for each code or NULL
        this.extra_base = 0;	// base index for extra_bits
        this.elems = 0;		// max number of elements in the tree
        this.max_length = 0;	// max bit length for the codes
        this.max_code = 0;		// largest code with non zero frequency
    };

    /* Values for max_lazy_match, good_match and max_chain_length, depending on
     * the desired pack level (0..9). The values given below have been tuned to
     * exclude worst case performance for pathological files. Better values may be
     * found for specific files.
     */
    var zip_DeflateConfiguration = function (a, b, c, d) {
        this.good_length = a; // reduce lazy search above this match length
        this.max_lazy = b;    // do not perform lazy search above this match length
        this.nice_length = c; // quit search above this match length
        this.max_chain = d;
    };

    var zip_DeflateBuffer = function () {
        this.next = null;
        this.len = 0;
        this.ptr = new Array(zip_OUTBUFSIZ);
        this.off = 0;
    };

    /* constant tables */
    var zip_extra_lbits = new Array(
        0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0);
    var zip_extra_dbits = new Array(
        0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13);
    var zip_extra_blbits = new Array(
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7);
    var zip_bl_order = new Array(
        16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15);
    var zip_configuration_table = new Array(
        new zip_DeflateConfiguration(0, 0, 0, 0),
        new zip_DeflateConfiguration(4, 4, 8, 4),
        new zip_DeflateConfiguration(4, 5, 16, 8),
        new zip_DeflateConfiguration(4, 6, 32, 32),
        new zip_DeflateConfiguration(4, 4, 16, 16),
        new zip_DeflateConfiguration(8, 16, 32, 32),
        new zip_DeflateConfiguration(8, 16, 128, 128),
        new zip_DeflateConfiguration(8, 32, 128, 256),
        new zip_DeflateConfiguration(32, 128, 258, 1024),
        new zip_DeflateConfiguration(32, 258, 258, 4096));


    /* routines (deflate) */

    var zip_deflate_start = function (level) {
        var i;

        if (!level)
            level = zip_DEFAULT_LEVEL;
        else if (level < 1)
            level = 1;
        else if (level > 9)
            level = 9;

        zip_compr_level = level;
        zip_initflag = false;
        zip_eofile = false;
        if (zip_outbuf != null)
            return;

        zip_free_queue = zip_qhead = zip_qtail = null;
        zip_outbuf = new Array(zip_OUTBUFSIZ);
        zip_window = new Array(zip_window_size);
        zip_d_buf = new Array(zip_DIST_BUFSIZE);
        zip_l_buf = new Array(zip_INBUFSIZ + zip_INBUF_EXTRA);
        zip_prev = new Array(1 << zip_BITS);
        zip_dyn_ltree = new Array(zip_HEAP_SIZE);
        for (i = 0; i < zip_HEAP_SIZE; i++) zip_dyn_ltree[i] = new zip_DeflateCT();
        zip_dyn_dtree = new Array(2 * zip_D_CODES + 1);
        for (i = 0; i < 2 * zip_D_CODES + 1; i++) zip_dyn_dtree[i] = new zip_DeflateCT();
        zip_static_ltree = new Array(zip_L_CODES + 2);
        for (i = 0; i < zip_L_CODES + 2; i++) zip_static_ltree[i] = new zip_DeflateCT();
        zip_static_dtree = new Array(zip_D_CODES);
        for (i = 0; i < zip_D_CODES; i++) zip_static_dtree[i] = new zip_DeflateCT();
        zip_bl_tree = new Array(2 * zip_BL_CODES + 1);
        for (i = 0; i < 2 * zip_BL_CODES + 1; i++) zip_bl_tree[i] = new zip_DeflateCT();
        zip_l_desc = new zip_DeflateTreeDesc();
        zip_d_desc = new zip_DeflateTreeDesc();
        zip_bl_desc = new zip_DeflateTreeDesc();
        zip_bl_count = new Array(zip_MAX_BITS + 1);
        zip_heap = new Array(2 * zip_L_CODES + 1);
        zip_depth = new Array(2 * zip_L_CODES + 1);
        zip_length_code = new Array(MAX_MATCH - MIN_MATCH + 1);
        zip_dist_code = new Array(512);
        zip_base_length = new Array(zip_LENGTH_CODES);
        zip_base_dist = new Array(zip_D_CODES);
        zip_flag_buf = new Array(parseInt(LIT_BUFSIZE / 8));
    };

    var zip_deflate_end = function () {
        zip_free_queue = zip_qhead = zip_qtail = null;
        zip_outbuf = null;
        zip_window = null;
        zip_d_buf = null;
        zip_l_buf = null;
        zip_prev = null;
        zip_dyn_ltree = null;
        zip_dyn_dtree = null;
        zip_static_ltree = null;
        zip_static_dtree = null;
        zip_bl_tree = null;
        zip_l_desc = null;
        zip_d_desc = null;
        zip_bl_desc = null;
        zip_bl_count = null;
        zip_heap = null;
        zip_depth = null;
        zip_length_code = null;
        zip_dist_code = null;
        zip_base_length = null;
        zip_base_dist = null;
        zip_flag_buf = null;
    };

    var zip_reuse_queue = function (p) {
        p.next = zip_free_queue;
        zip_free_queue = p;
    };

    var zip_new_queue = function () {
        var p;

        if (zip_free_queue != null) {
            p = zip_free_queue;
            zip_free_queue = zip_free_queue.next;
        }
        else
            p = new zip_DeflateBuffer();
        p.next = null;
        p.len = p.off = 0;

        return p;
    };

    var zip_head1 = function (i) {
        return zip_prev[WSIZE + i];
    };

    var zip_head2 = function (i, val) {
        return zip_prev[WSIZE + i] = val;
    };

    /* put_byte is used for the compressed output, put_ubyte for the
     * uncompressed output. However unlzw() uses window for its
     * suffix table instead of its output buffer, so it does not use put_ubyte
     * (to be cleaned up).
     */
    var zip_put_byte = function (c) {
        zip_outbuf[zip_outoff + zip_outcnt++] = c;
        if (zip_outoff + zip_outcnt == zip_OUTBUFSIZ)
            zip_qoutbuf();
    };

    /* Output a 16 bit value, lsb first */
    var zip_put_short = function (w) {
        w &= 0xffff;
        if (zip_outoff + zip_outcnt < zip_OUTBUFSIZ - 2) {
            zip_outbuf[zip_outoff + zip_outcnt++] = (w & 0xff);
            zip_outbuf[zip_outoff + zip_outcnt++] = (w >>> 8);
        } else {
            zip_put_byte(w & 0xff);
            zip_put_byte(w >>> 8);
        }
    };

    /* ==========================================================================
     * Insert string s in the dictionary and set match_head to the previous head
     * of the hash chain (the most recent string with same hash key). Return
     * the previous length of the hash chain.
     * IN  assertion: all calls to to INSERT_STRING are made with consecutive
     *    input characters and the first MIN_MATCH bytes of s are valid
     *    (except for the last MIN_MATCH-1 bytes of the input file).
     */
    var zip_INSERT_STRING = function () {
        zip_ins_h = ((zip_ins_h << zip_H_SHIFT)
            ^ (zip_window[zip_strstart + MIN_MATCH - 1] & 0xff))
            & zip_HASH_MASK;
        zip_hash_head = zip_head1(zip_ins_h);
        zip_prev[zip_strstart & zip_WMASK] = zip_hash_head;
        zip_head2(zip_ins_h, zip_strstart);
    };

    /* Send a code of the given tree. c and tree must not have side effects */
    var zip_SEND_CODE = function (c, tree) {
        zip_send_bits(tree[c].fc, tree[c].dl);
    };

    /* Mapping from a distance to a distance code. dist is the distance - 1 and
     * must not have side effects. dist_code[256] and dist_code[257] are never
     * used.
     */
    var zip_D_CODE = function (dist) {
        return (dist < 256 ? zip_dist_code[dist]
            : zip_dist_code[256 + (dist >> 7)]) & 0xff;
    };

    /* ==========================================================================
     * Compares to subtrees, using the tree depth as tie breaker when
     * the subtrees have equal frequency. This minimizes the worst case length.
     */
    var zip_SMALLER = function (tree, n, m) {
        return tree[n].fc < tree[m].fc ||
            (tree[n].fc == tree[m].fc && zip_depth[n] <= zip_depth[m]);
    };

    /* ==========================================================================
     * read string data
     */
    var zip_read_buff = function (buff, offset, n) {
        var i;
        for (i = 0; i < n && zip_deflate_pos < zip_deflate_data.length; i++)
            buff[offset + i] =
                zip_deflate_data[zip_deflate_pos++] & 0xff;
        return i;
    };

    /* ==========================================================================
     * Initialize the "longest match" routines for a new file
     */
    var zip_lm_init = function () {
        var j;

        /* Initialize the hash table. */
        for (j = 0; j < zip_HASH_SIZE; j++)
            zip_prev[WSIZE + j] = 0;
        zip_max_lazy_match = zip_configuration_table[zip_compr_level].max_lazy;
        zip_good_match = zip_configuration_table[zip_compr_level].good_length;
        if (!zip_FULL_SEARCH)
            zip_nice_match = zip_configuration_table[zip_compr_level].nice_length;
        zip_max_chain_length = zip_configuration_table[zip_compr_level].max_chain;

        zip_strstart = 0;
        zip_block_start = 0;

        zip_lookahead = zip_read_buff(zip_window, 0, 2 * WSIZE);
        if (zip_lookahead <= 0) {
            zip_eofile = true;
            zip_lookahead = 0;
            return;
        }
        zip_eofile = false;
        /* Make sure that we always have enough lookahead. This is important
         * if input comes from a device such as a tty.
         */
        while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
            zip_fill_window();

        /* If lookahead < MIN_MATCH, ins_h is garbage, but this is
         * not important since only literal bytes will be emitted.
         */
        zip_ins_h = 0;
        for (j = 0; j < MIN_MATCH - 1; j++) {
            zip_ins_h = ((zip_ins_h << zip_H_SHIFT) ^ (zip_window[j] & 0xff)) & zip_HASH_MASK;
        }
    };

    /* ==========================================================================
     * Set match_start to the longest match starting at the given string and
     * return its length. Matches shorter or equal to prev_length are discarded,
     * in which case the result is equal to prev_length and match_start is
     * garbage.
     * IN assertions: cur_match is the head of the hash chain for the current
     *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
     */
    var zip_longest_match = function (cur_match) {
        var chain_length = zip_max_chain_length; // max hash chain length
        var scanp = zip_strstart; // current string
        var matchp;		// matched string
        var len;		// length of current match
        var best_len = zip_prev_length;	// best match length so far

        /* Stop when cur_match becomes <= limit. To simplify the code,
         * we prevent matches with the string of window index 0.
         */
        var limit = (zip_strstart > zip_MAX_DIST ? zip_strstart - zip_MAX_DIST : zip_NIL);

        var strendp = zip_strstart + MAX_MATCH;
        var scan_end1 = zip_window[scanp + best_len - 1];
        var scan_end = zip_window[scanp + best_len];

        /* Do not waste too much time if we already have a good match: */
        if (zip_prev_length >= zip_good_match)
            chain_length >>= 2;

        do {
            matchp = cur_match;

            /* Skip to next match if the match length cannot increase
             * or if the match length is less than 2:
             */
            if (zip_window[matchp + best_len] != scan_end ||
                zip_window[matchp + best_len - 1] != scan_end1 ||
                zip_window[matchp] != zip_window[scanp] ||
                zip_window[++matchp] != zip_window[scanp + 1]) {
                continue;
            }

            /* The check at best_len-1 can be removed because it will be made
             * again later. (This heuristic is not always a win.)
             * It is not necessary to compare scan[2] and match[2] since they
             * are always equal when the other bytes match, given that
             * the hash keys are equal and that HASH_BITS >= 8.
             */
            scanp += 2;
            matchp++;

            /* We check for insufficient lookahead only every 8th comparison;
             * the 256th check will be made at strstart+258.
             */
            do {
            } while (zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                zip_window[++scanp] == zip_window[++matchp] &&
                scanp < strendp);

            len = MAX_MATCH - (strendp - scanp);
            scanp = strendp - MAX_MATCH;

            if (len > best_len) {
                zip_match_start = cur_match;
                best_len = len;
                if (zip_FULL_SEARCH) {
                    if (len >= MAX_MATCH) break;
                } else {
                    if (len >= zip_nice_match) break;
                }

                scan_end1 = zip_window[scanp + best_len - 1];
                scan_end = zip_window[scanp + best_len];
            }
        } while ((cur_match = zip_prev[cur_match & zip_WMASK]) > limit
            && --chain_length != 0);

        return best_len;
    };

    /* ==========================================================================
     * Fill the window when the lookahead becomes insufficient.
     * Updates strstart and lookahead, and sets eofile if end of input file.
     * IN assertion: lookahead < MIN_LOOKAHEAD && strstart + lookahead > 0
     * OUT assertions: at least one byte has been read, or eofile is set;
     *    file reads are performed for at least two bytes (required for the
     *    translate_eol option).
     */
    var zip_fill_window = function () {
        var n, m;

        // Amount of free space at the end of the window.
        var more = zip_window_size - zip_lookahead - zip_strstart;

        /* If the window is almost full and there is insufficient lookahead,
         * move the upper half to the lower one to make room in the upper half.
         */
        if (more == -1) {
            /* Very unlikely, but possible on 16 bit machine if strstart == 0
             * and lookahead == 1 (input done one byte at time)
             */
            more--;
        } else if (zip_strstart >= WSIZE + zip_MAX_DIST) {
            /* By the IN assertion, the window is not empty so we can't confuse
             * more == 0 with more == 64K on a 16 bit machine.
             */
            for (n = 0; n < WSIZE; n++)
                zip_window[n] = zip_window[n + WSIZE];

            zip_match_start -= WSIZE;
            zip_strstart -= WSIZE;
            /* we now have strstart >= MAX_DIST: */
            zip_block_start -= WSIZE;

            for (n = 0; n < zip_HASH_SIZE; n++) {
                m = zip_head1(n);
                zip_head2(n, m >= WSIZE ? m - WSIZE : zip_NIL);
            }
            for (n = 0; n < WSIZE; n++) {
                /* If n is not on any hash chain, prev[n] is garbage but
                 * its value will never be used.
                 */
                m = zip_prev[n];
                zip_prev[n] = (m >= WSIZE ? m - WSIZE : zip_NIL);
            }
            more += WSIZE;
        }
        // At this point, more >= 2
        if (!zip_eofile) {
            n = zip_read_buff(zip_window, zip_strstart + zip_lookahead, more);
            if (n <= 0)
                zip_eofile = true;
            else
                zip_lookahead += n;
        }
    };

    /* ==========================================================================
     * Processes a new input file and return its compressed length. This
     * function does not perform lazy evaluationof matches and inserts
     * new strings in the dictionary only for unmatched strings or for short
     * matches. It is used only for the fast compression options.
     */
    var zip_deflate_fast = function () {
        while (zip_lookahead != 0 && zip_qhead == null) {
            var flush; // set if current block must be flushed

            /* Insert the string window[strstart .. strstart+2] in the
             * dictionary, and set hash_head to the head of the hash chain:
             */
            zip_INSERT_STRING();

            /* Find the longest match, discarding those <= prev_length.
             * At this point we have always match_length < MIN_MATCH
             */
            if (zip_hash_head != zip_NIL &&
                zip_strstart - zip_hash_head <= zip_MAX_DIST) {
                /* To simplify the code, we prevent matches with the string
                 * of window index 0 (in particular we have to avoid a match
                 * of the string with itself at the start of the input file).
                 */
                zip_match_length = zip_longest_match(zip_hash_head);
                /* longest_match() sets match_start */
                if (zip_match_length > zip_lookahead)
                    zip_match_length = zip_lookahead;
            }
            if (zip_match_length >= MIN_MATCH) {
                flush = zip_ct_tally(zip_strstart - zip_match_start,
                    zip_match_length - MIN_MATCH);
                zip_lookahead -= zip_match_length;

                /* Insert new strings in the hash table only if the match length
                 * is not too large. This saves time but degrades compression.
                 */
                if (zip_match_length <= zip_max_lazy_match) {
                    zip_match_length--; // string at strstart already in hash table
                    do {
                        zip_strstart++;
                        zip_INSERT_STRING();
                        /* strstart never exceeds WSIZE-MAX_MATCH, so there are
                         * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
                         * these bytes are garbage, but it does not matter since
                         * the next lookahead bytes will be emitted as literals.
                         */
                    } while (--zip_match_length != 0);
                    zip_strstart++;
                } else {
                    zip_strstart += zip_match_length;
                    zip_match_length = 0;
                    zip_ins_h = zip_window[zip_strstart] & 0xff;
                    zip_ins_h = ((zip_ins_h << zip_H_SHIFT) ^ (zip_window[zip_strstart + 1] & 0xff)) & zip_HASH_MASK;
                }
            } else {
                /* No match, output a literal byte */
                flush = zip_ct_tally(0, zip_window[zip_strstart] & 0xff);
                zip_lookahead--;
                zip_strstart++;
            }
            if (flush) {
                zip_flush_block(0);
                zip_block_start = zip_strstart;
            }

            /* Make sure that we always have enough lookahead, except
             * at the end of the input file. We need MAX_MATCH bytes
             * for the next match, plus MIN_MATCH bytes to insert the
             * string following the next match.
             */
            while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
                zip_fill_window();
        }
    };

    var zip_deflate_better = function () {
        /* Process the input block. */
        while (zip_lookahead != 0 && zip_qhead == null) {
            /* Insert the string window[strstart .. strstart+2] in the
             * dictionary, and set hash_head to the head of the hash chain:
             */
            zip_INSERT_STRING();

            /* Find the longest match, discarding those <= prev_length.
             */
            zip_prev_length = zip_match_length;
            zip_prev_match = zip_match_start;
            zip_match_length = MIN_MATCH - 1;

            if (zip_hash_head != zip_NIL &&
                zip_prev_length < zip_max_lazy_match &&
                zip_strstart - zip_hash_head <= zip_MAX_DIST) {
                /* To simplify the code, we prevent matches with the string
                 * of window index 0 (in particular we have to avoid a match
                 * of the string with itself at the start of the input file).
                 */
                zip_match_length = zip_longest_match(zip_hash_head);
                /* longest_match() sets match_start */
                if (zip_match_length > zip_lookahead)
                    zip_match_length = zip_lookahead;

                /* Ignore a length 3 match if it is too distant: */
                if (zip_match_length == MIN_MATCH &&
                    zip_strstart - zip_match_start > zip_TOO_FAR) {
                    /* If prev_match is also MIN_MATCH, match_start is garbage
                     * but we will ignore the current match anyway.
                     */
                    zip_match_length--;
                }
            }
            /* If there was a match at the previous step and the current
             * match is not better, output the previous match:
             */
            if (zip_prev_length >= MIN_MATCH &&
                zip_match_length <= zip_prev_length) {
                var flush; // set if current block must be flushed
                flush = zip_ct_tally(zip_strstart - 1 - zip_prev_match,
                    zip_prev_length - MIN_MATCH);

                /* Insert in hash table all strings up to the end of the match.
                 * strstart-1 and strstart are already inserted.
                 */
                zip_lookahead -= zip_prev_length - 1;
                zip_prev_length -= 2;
                do {
                    zip_strstart++;
                    zip_INSERT_STRING();
                    /* strstart never exceeds WSIZE-MAX_MATCH, so there are
                     * always MIN_MATCH bytes ahead. If lookahead < MIN_MATCH
                     * these bytes are garbage, but it does not matter since the
                     * next lookahead bytes will always be emitted as literals.
                     */
                } while (--zip_prev_length != 0);
                zip_match_available = 0;
                zip_match_length = MIN_MATCH - 1;
                zip_strstart++;
                if (flush) {
                    zip_flush_block(0);
                    zip_block_start = zip_strstart;
                }
            } else if (zip_match_available != 0) {
                /* If there was no match at the previous position, output a
                 * single literal. If there was a match but the current match
                 * is longer, truncate the previous match to a single literal.
                 */
                if (zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff)) {
                    zip_flush_block(0);
                    zip_block_start = zip_strstart;
                }
                zip_strstart++;
                zip_lookahead--;
            } else {
                /* There is no previous match to compare with, wait for
                 * the next step to decide.
                 */
                zip_match_available = 1;
                zip_strstart++;
                zip_lookahead--;
            }

            /* Make sure that we always have enough lookahead, except
             * at the end of the input file. We need MAX_MATCH bytes
             * for the next match, plus MIN_MATCH bytes to insert the
             * string following the next match.
             */
            while (zip_lookahead < zip_MIN_LOOKAHEAD && !zip_eofile)
                zip_fill_window();
        }
    };

    var zip_init_deflate = function () {
        if (zip_eofile)
            return;
        zip_bi_buf = 0;
        zip_bi_valid = 0;
        zip_ct_init();
        zip_lm_init();

        zip_qhead = null;
        zip_outcnt = 0;
        zip_outoff = 0;
        zip_match_available = 0;

        if (zip_compr_level <= 3) {
            zip_prev_length = MIN_MATCH - 1;
            zip_match_length = 0;
        }
        else {
            zip_match_length = MIN_MATCH - 1;
            zip_match_available = 0;
            zip_match_available = 0;
        }

        zip_complete = false;
    };

    /* ==========================================================================
     * Same as above, but achieves better compression. We use a lazy
     * evaluation for matches: a match is finally adopted only if there is
     * no better match at the next window position.
     */
    var zip_deflate_internal = function (buff, off, buff_size) {
        var n;

        if (!zip_initflag) {
            zip_init_deflate();
            zip_initflag = true;
            if (zip_lookahead == 0) { // empty
                zip_complete = true;
                return 0;
            }
        }

        if ((n = zip_qcopy(buff, off, buff_size)) == buff_size)
            return buff_size;

        if (zip_complete)
            return n;

        if (zip_compr_level <= 3) // optimized for speed
            zip_deflate_fast();
        else
            zip_deflate_better();
        if (zip_lookahead == 0) {
            if (zip_match_available != 0)
                zip_ct_tally(0, zip_window[zip_strstart - 1] & 0xff);
            zip_flush_block(1);
            zip_complete = true;
        }
        return n + zip_qcopy(buff, n + off, buff_size - n);
    };

    var zip_qcopy = function (buff, off, buff_size) {
        var n, i, j;

        n = 0;
        while (zip_qhead != null && n < buff_size) {
            i = buff_size - n;
            if (i > zip_qhead.len)
                i = zip_qhead.len;
            for (j = 0; j < i; j++)
                buff[off + n + j] = zip_qhead.ptr[zip_qhead.off + j];

            zip_qhead.off += i;
            zip_qhead.len -= i;
            n += i;
            if (zip_qhead.len == 0) {
                var p;
                p = zip_qhead;
                zip_qhead = zip_qhead.next;
                zip_reuse_queue(p);
            }
        }

        if (n == buff_size)
            return n;

        if (zip_outoff < zip_outcnt) {
            i = buff_size - n;
            if (i > zip_outcnt - zip_outoff)
                i = zip_outcnt - zip_outoff;
            // System.arraycopy(outbuf, outoff, buff, off + n, i);
            for (j = 0; j < i; j++)
                buff[off + n + j] = zip_outbuf[zip_outoff + j];
            zip_outoff += i;
            n += i;
            if (zip_outcnt == zip_outoff)
                zip_outcnt = zip_outoff = 0;
        }
        return n;
    };

    /* ==========================================================================
     * Allocate the match buffer, initialize the various tables and save the
     * location of the internal file attribute (ascii/binary) and method
     * (DEFLATE/STORE).
     */
    var zip_ct_init = function () {
        var n;	// iterates over tree elements
        var bits;	// bit counter
        var length;	// length value
        var code;	// code value
        var dist;	// distance index

        if (zip_static_dtree[0].dl != 0) return; // ct_init already called

        zip_l_desc.dyn_tree = zip_dyn_ltree;
        zip_l_desc.static_tree = zip_static_ltree;
        zip_l_desc.extra_bits = zip_extra_lbits;
        zip_l_desc.extra_base = zip_LITERALS + 1;
        zip_l_desc.elems = zip_L_CODES;
        zip_l_desc.max_length = zip_MAX_BITS;
        zip_l_desc.max_code = 0;

        zip_d_desc.dyn_tree = zip_dyn_dtree;
        zip_d_desc.static_tree = zip_static_dtree;
        zip_d_desc.extra_bits = zip_extra_dbits;
        zip_d_desc.extra_base = 0;
        zip_d_desc.elems = zip_D_CODES;
        zip_d_desc.max_length = zip_MAX_BITS;
        zip_d_desc.max_code = 0;

        zip_bl_desc.dyn_tree = zip_bl_tree;
        zip_bl_desc.static_tree = null;
        zip_bl_desc.extra_bits = zip_extra_blbits;
        zip_bl_desc.extra_base = 0;
        zip_bl_desc.elems = zip_BL_CODES;
        zip_bl_desc.max_length = zip_MAX_BL_BITS;
        zip_bl_desc.max_code = 0;

        // Initialize the mapping length (0..255) -> length code (0..28)
        length = 0;
        for (code = 0; code < zip_LENGTH_CODES - 1; code++) {
            zip_base_length[code] = length;
            for (n = 0; n < (1 << zip_extra_lbits[code]); n++)
                zip_length_code[length++] = code;
        }
        /* Note that the length 255 (match length 258) can be represented
         * in two different ways: code 284 + 5 bits or code 285, so we
         * overwrite length_code[255] to use the best encoding:
         */
        zip_length_code[length - 1] = code;

        /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
        dist = 0;
        for (code = 0; code < 16; code++) {
            zip_base_dist[code] = dist;
            for (n = 0; n < (1 << zip_extra_dbits[code]); n++) {
                zip_dist_code[dist++] = code;
            }
        }
        dist >>= 7; // from now on, all distances are divided by 128
        for (; code < zip_D_CODES; code++) {
            zip_base_dist[code] = dist << 7;
            for (n = 0; n < (1 << (zip_extra_dbits[code] - 7)); n++)
                zip_dist_code[256 + dist++] = code;
        }
        // Construct the codes of the static literal tree
        for (bits = 0; bits <= zip_MAX_BITS; bits++)
            zip_bl_count[bits] = 0;
        n = 0;
        while (n <= 143) {
            zip_static_ltree[n++].dl = 8;
            zip_bl_count[8]++;
        }
        while (n <= 255) {
            zip_static_ltree[n++].dl = 9;
            zip_bl_count[9]++;
        }
        while (n <= 279) {
            zip_static_ltree[n++].dl = 7;
            zip_bl_count[7]++;
        }
        while (n <= 287) {
            zip_static_ltree[n++].dl = 8;
            zip_bl_count[8]++;
        }
        /* Codes 286 and 287 do not exist, but we must include them in the
         * tree construction to get a canonical Huffman tree (longest code
         * all ones)
         */
        zip_gen_codes(zip_static_ltree, zip_L_CODES + 1);

        /* The static distance tree is trivial: */
        for (n = 0; n < zip_D_CODES; n++) {
            zip_static_dtree[n].dl = 5;
            zip_static_dtree[n].fc = zip_bi_reverse(n, 5);
        }

        // Initialize the first block of the first file:
        zip_init_block();
    };

    /* ==========================================================================
     * Initialize a new block.
     */
    var zip_init_block = function () {
        var n; // iterates over tree elements

        // Initialize the trees.
        for (n = 0; n < zip_L_CODES; n++) zip_dyn_ltree[n].fc = 0;
        for (n = 0; n < zip_D_CODES; n++) zip_dyn_dtree[n].fc = 0;
        for (n = 0; n < zip_BL_CODES; n++) zip_bl_tree[n].fc = 0;

        zip_dyn_ltree[zip_END_BLOCK].fc = 1;
        zip_opt_len = zip_static_len = 0;
        zip_last_lit = zip_last_dist = zip_last_flags = 0;
        zip_flags = 0;
        zip_flag_bit = 1;
    };

    /* ==========================================================================
     * Restore the heap property by moving down the tree starting at node k,
     * exchanging a node with the smallest of its two sons if necessary, stopping
     * when the heap property is re-established (each father smaller than its
     * two sons).
     */
    var zip_pqdownheap = function (tree,	// the tree to restore
                                   k) {	// node to move down
        var v = zip_heap[k];
        var j = k << 1;	// left son of k

        while (j <= zip_heap_len) {
            // Set j to the smallest of the two sons:
            if (j < zip_heap_len &&
                zip_SMALLER(tree, zip_heap[j + 1], zip_heap[j]))
                j++;

            // Exit if v is smaller than both sons
            if (zip_SMALLER(tree, v, zip_heap[j]))
                break;

            // Exchange v with the smallest son
            zip_heap[k] = zip_heap[j];
            k = j;

            // And continue down the tree, setting j to the left son of k
            j <<= 1;
        }
        zip_heap[k] = v;
    };

    /* ==========================================================================
     * Compute the optimal bit lengths for a tree and update the total bit length
     * for the current block.
     * IN assertion: the fields freq and dad are set, heap[heap_max] and
     *    above are the tree nodes sorted by increasing frequency.
     * OUT assertions: the field len is set to the optimal bit length, the
     *     array bl_count contains the frequencies for each bit length.
     *     The length opt_len is updated; static_len is also updated if stree is
     *     not null.
     */
    var zip_gen_bitlen = function (desc) { // the tree descriptor
        var tree = desc.dyn_tree;
        var extra = desc.extra_bits;
        var base = desc.extra_base;
        var max_code = desc.max_code;
        var max_length = desc.max_length;
        var stree = desc.static_tree;
        var h;		// heap index
        var n, m;		// iterate over the tree elements
        var bits;		// bit length
        var xbits;		// extra bits
        var f;		// frequency
        var overflow = 0;	// number of elements with bit length too large

        for (bits = 0; bits <= zip_MAX_BITS; bits++)
            zip_bl_count[bits] = 0;

        /* In a first pass, compute the optimal bit lengths (which may
         * overflow in the case of the bit length tree).
         */
        tree[zip_heap[zip_heap_max]].dl = 0; // root of the heap

        for (h = zip_heap_max + 1; h < zip_HEAP_SIZE; h++) {
            n = zip_heap[h];
            bits = tree[tree[n].dl].dl + 1;
            if (bits > max_length) {
                bits = max_length;
                overflow++;
            }
            tree[n].dl = bits;
            // We overwrite tree[n].dl which is no longer needed

            if (n > max_code)
                continue; // not a leaf node

            zip_bl_count[bits]++;
            xbits = 0;
            if (n >= base)
                xbits = extra[n - base];
            f = tree[n].fc;
            zip_opt_len += f * (bits + xbits);
            if (stree != null)
                zip_static_len += f * (stree[n].dl + xbits);
        }
        if (overflow == 0)
            return;

        // This happens for example on obj2 and pic of the Calgary corpus

        // Find the first bit length which could increase:
        do {
            bits = max_length - 1;
            while (zip_bl_count[bits] == 0)
                bits--;
            zip_bl_count[bits]--;		// move one leaf down the tree
            zip_bl_count[bits + 1] += 2;	// move one overflow item as its brother
            zip_bl_count[max_length]--;
            /* The brother of the overflow item also moves one step up,
             * but this does not affect bl_count[max_length]
             */
            overflow -= 2;
        } while (overflow > 0);

        /* Now recompute all bit lengths, scanning in increasing frequency.
         * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
         * lengths instead of fixing only the wrong ones. This idea is taken
         * from 'ar' written by Haruhiko Okumura.)
         */
        for (bits = max_length; bits != 0; bits--) {
            n = zip_bl_count[bits];
            while (n != 0) {
                m = zip_heap[--h];
                if (m > max_code)
                    continue;
                if (tree[m].dl != bits) {
                    zip_opt_len += (bits - tree[m].dl) * tree[m].fc;
                    tree[m].fc = bits;
                }
                n--;
            }
        }
    };

    /* ==========================================================================
     * Generate the codes for a given tree and bit counts (which need not be
     * optimal).
     * IN assertion: the array bl_count contains the bit length statistics for
     * the given tree and the field len is set for all tree elements.
     * OUT assertion: the field code is set for all tree elements of non
     *     zero code length.
     */
    var zip_gen_codes = function (tree,	// the tree to decorate
                                  max_code) {	// largest code with non zero frequency
        var next_code = new Array(zip_MAX_BITS + 1); // next code value for each bit length
        var code = 0;		// running code value
        var bits;			// bit index
        var n;			// code index

        /* The distribution counts are first used to generate the code values
         * without bit reversal.
         */
        for (bits = 1; bits <= zip_MAX_BITS; bits++) {
            code = ((code + zip_bl_count[bits - 1]) << 1);
            next_code[bits] = code;
        }

        /* Check that the bit counts in bl_count are consistent. The last code
         * must be all ones.
         */
        for (n = 0; n <= max_code; n++) {
            var len = tree[n].dl;
            if (len == 0)
                continue;
            // Now reverse the bits
            tree[n].fc = zip_bi_reverse(next_code[len]++, len);
        }
    };

    /* ==========================================================================
     * Construct one Huffman tree and assigns the code bit strings and lengths.
     * Update the total bit length for the current block.
     * IN assertion: the field freq is set for all tree elements.
     * OUT assertions: the fields len and code are set to the optimal bit length
     *     and corresponding code. The length opt_len is updated; static_len is
     *     also updated if stree is not null. The field max_code is set.
     */
    var zip_build_tree = function (desc) { // the tree descriptor
        var tree = desc.dyn_tree;
        var stree = desc.static_tree;
        var elems = desc.elems;
        var n, m;		// iterate over heap elements
        var max_code = -1;	// largest code with non zero frequency
        var node = elems;	// next internal node of the tree

        /* Construct the initial heap, with least frequent element in
         * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
         * heap[0] is not used.
         */
        zip_heap_len = 0;
        zip_heap_max = zip_HEAP_SIZE;

        for (n = 0; n < elems; n++) {
            if (tree[n].fc != 0) {
                zip_heap[++zip_heap_len] = max_code = n;
                zip_depth[n] = 0;
            } else
                tree[n].dl = 0;
        }

        /* The pkzip format requires that at least one distance code exists,
         * and that at least one bit should be sent even if there is only one
         * possible code. So to avoid special checks later on we force at least
         * two codes of non zero frequency.
         */
        while (zip_heap_len < 2) {
            var xnew = zip_heap[++zip_heap_len] = (max_code < 2 ? ++max_code : 0);
            tree[xnew].fc = 1;
            zip_depth[xnew] = 0;
            zip_opt_len--;
            if (stree != null)
                zip_static_len -= stree[xnew].dl;
            // new is 0 or 1 so it does not have extra bits
        }
        desc.max_code = max_code;

        /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
         * establish sub-heaps of increasing lengths:
         */
        for (n = zip_heap_len >> 1; n >= 1; n--)
            zip_pqdownheap(tree, n);

        /* Construct the Huffman tree by repeatedly combining the least two
         * frequent nodes.
         */
        do {
            n = zip_heap[zip_SMALLEST];
            zip_heap[zip_SMALLEST] = zip_heap[zip_heap_len--];
            zip_pqdownheap(tree, zip_SMALLEST);

            m = zip_heap[zip_SMALLEST];  // m = node of next least frequency

            // keep the nodes sorted by frequency
            zip_heap[--zip_heap_max] = n;
            zip_heap[--zip_heap_max] = m;

            // Create a new node father of n and m
            tree[node].fc = tree[n].fc + tree[m].fc;
            if (zip_depth[n] > zip_depth[m] + 1)
                zip_depth[node] = zip_depth[n];
            else
                zip_depth[node] = zip_depth[m] + 1;
            tree[n].dl = tree[m].dl = node;

            // and insert the new node in the heap
            zip_heap[zip_SMALLEST] = node++;
            zip_pqdownheap(tree, zip_SMALLEST);

        } while (zip_heap_len >= 2);

        zip_heap[--zip_heap_max] = zip_heap[zip_SMALLEST];

        /* At this point, the fields freq and dad are set. We can now
         * generate the bit lengths.
         */
        zip_gen_bitlen(desc);

        // The field len is now set, we can generate the bit codes
        zip_gen_codes(tree, max_code);
    };

    /* ==========================================================================
     * Scan a literal or distance tree to determine the frequencies of the codes
     * in the bit length tree. Updates opt_len to take into account the repeat
     * counts. (The contribution of the bit length codes will be added later
     * during the construction of bl_tree.)
     */
    var zip_scan_tree = function (tree,// the tree to be scanned
                                  max_code) {  // and its largest code of non zero frequency
        var n;			// iterates over all tree elements
        var prevlen = -1;		// last emitted length
        var curlen;			// length of current code
        var nextlen = tree[0].dl;	// length of next code
        var count = 0;		// repeat count of the current code
        var max_count = 7;		// max repeat count
        var min_count = 4;		// min repeat count

        if (nextlen == 0) {
            max_count = 138;
            min_count = 3;
        }
        tree[max_code + 1].dl = 0xffff; // guard

        for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[n + 1].dl;
            if (++count < max_count && curlen == nextlen)
                continue;
            else if (count < min_count)
                zip_bl_tree[curlen].fc += count;
            else if (curlen != 0) {
                if (curlen != prevlen)
                    zip_bl_tree[curlen].fc++;
                zip_bl_tree[zip_REP_3_6].fc++;
            } else if (count <= 10)
                zip_bl_tree[zip_REPZ_3_10].fc++;
            else
                zip_bl_tree[zip_REPZ_11_138].fc++;
            count = 0;
            prevlen = curlen;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    };

    /* ==========================================================================
     * Send a literal or distance tree in compressed form, using the codes in
     * bl_tree.
     */
    var zip_send_tree = function (tree, // the tree to be scanned
                                  max_code) { // and its largest code of non zero frequency
        var n;			// iterates over all tree elements
        var prevlen = -1;		// last emitted length
        var curlen;			// length of current code
        var nextlen = tree[0].dl;	// length of next code
        var count = 0;		// repeat count of the current code
        var max_count = 7;		// max repeat count
        var min_count = 4;		// min repeat count

        /* tree[max_code+1].dl = -1; */
        /* guard already set */
        if (nextlen == 0) {
            max_count = 138;
            min_count = 3;
        }

        for (n = 0; n <= max_code; n++) {
            curlen = nextlen;
            nextlen = tree[n + 1].dl;
            if (++count < max_count && curlen == nextlen) {
                continue;
            } else if (count < min_count) {
                do {
                    zip_SEND_CODE(curlen, zip_bl_tree);
                } while (--count != 0);
            } else if (curlen != 0) {
                if (curlen != prevlen) {
                    zip_SEND_CODE(curlen, zip_bl_tree);
                    count--;
                }
                // Assert(count >= 3 && count <= 6, " 3_6?");
                zip_SEND_CODE(zip_REP_3_6, zip_bl_tree);
                zip_send_bits(count - 3, 2);
            } else if (count <= 10) {
                zip_SEND_CODE(zip_REPZ_3_10, zip_bl_tree);
                zip_send_bits(count - 3, 3);
            } else {
                zip_SEND_CODE(zip_REPZ_11_138, zip_bl_tree);
                zip_send_bits(count - 11, 7);
            }
            count = 0;
            prevlen = curlen;
            if (nextlen == 0) {
                max_count = 138;
                min_count = 3;
            } else if (curlen == nextlen) {
                max_count = 6;
                min_count = 3;
            } else {
                max_count = 7;
                min_count = 4;
            }
        }
    };

    /* ==========================================================================
     * Construct the Huffman tree for the bit lengths and return the index in
     * bl_order of the last bit length code to send.
     */
    var zip_build_bl_tree = function () {
        var max_blindex;  // index of last bit length code of non zero freq

        // Determine the bit length frequencies for literal and distance trees
        zip_scan_tree(zip_dyn_ltree, zip_l_desc.max_code);
        zip_scan_tree(zip_dyn_dtree, zip_d_desc.max_code);

        // Build the bit length tree:
        zip_build_tree(zip_bl_desc);
        /* opt_len now includes the length of the tree representations, except
         * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
         */

        /* Determine the number of bit length codes to send. The pkzip format
         * requires that at least 4 bit length codes be sent. (appnote.txt says
         * 3 but the actual value used is 4.)
         */
        for (max_blindex = zip_BL_CODES - 1; max_blindex >= 3; max_blindex--) {
            if (zip_bl_tree[zip_bl_order[max_blindex]].dl != 0) break;
        }
        /* Update opt_len to include the bit length tree and counts */
        zip_opt_len += 3 * (max_blindex + 1) + 5 + 5 + 4;
        return max_blindex;
    };

    /* ==========================================================================
     * Send the header for a block using dynamic Huffman trees: the counts, the
     * lengths of the bit length codes, the literal tree and the distance tree.
     * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
     */
    var zip_send_all_trees = function (lcodes, dcodes, blcodes) { // number of codes for each tree
        var rank; // index in bl_order
        zip_send_bits(lcodes - 257, 5); // not +255 as stated in appnote.txt
        zip_send_bits(dcodes - 1, 5);
        zip_send_bits(blcodes - 4, 4); // not -3 as stated in appnote.txt
        for (rank = 0; rank < blcodes; rank++) {
            zip_send_bits(zip_bl_tree[zip_bl_order[rank]].dl, 3);
        }

        // send the literal tree
        zip_send_tree(zip_dyn_ltree, lcodes - 1);

        // send the distance tree
        zip_send_tree(zip_dyn_dtree, dcodes - 1);
    };

    /* ==========================================================================
     * Determine the best encoding for the current block: dynamic trees, static
     * trees or store, and output the encoded block to the zip file.
     */
    var zip_flush_block = function (eof) { // true if this is the last block for a file
        var opt_lenb, static_lenb; // opt_len and static_len in bytes
        var max_blindex;	// index of last bit length code of non zero freq
        var stored_len;	// length of input block

        stored_len = zip_strstart - zip_block_start;
        zip_flag_buf[zip_last_flags] = zip_flags; // Save the flags for the last 8 items

        // Construct the literal and distance trees
        zip_build_tree(zip_l_desc);
        zip_build_tree(zip_d_desc);
        /* At this point, opt_len and static_len are the total bit lengths of
         * the compressed block data, excluding the tree representations.
         */

        /* Build the bit length tree for the above two trees, and get the index
         * in bl_order of the last bit length code to send.
         */
        max_blindex = zip_build_bl_tree();

        // Determine the best encoding. Compute first the block length in bytes
        opt_lenb = (zip_opt_len + 3 + 7) >> 3;
        static_lenb = (zip_static_len + 3 + 7) >> 3;
        if (static_lenb <= opt_lenb)
            opt_lenb = static_lenb;
        if (stored_len + 4 <= opt_lenb // 4: two words for the lengths
            && zip_block_start >= 0) {
            var i;

            /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
             * Otherwise we can't have processed more than WSIZE input bytes since
             * the last block flush, because compression would have been
             * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
             * transform a block into a stored block.
             */
            zip_send_bits((zip_STORED_BLOCK << 1) + eof, 3);
            /* send block type */
            zip_bi_windup();
            /* align on byte boundary */
            zip_put_short(stored_len);
            zip_put_short(~stored_len);

            // copy block
            for (i = 0; i < stored_len; i++)
                zip_put_byte(zip_window[zip_block_start + i]);

        } else if (static_lenb == opt_lenb) {
            zip_send_bits((zip_STATIC_TREES << 1) + eof, 3);
            zip_compress_block(zip_static_ltree, zip_static_dtree);
        } else {
            zip_send_bits((zip_DYN_TREES << 1) + eof, 3);
            zip_send_all_trees(zip_l_desc.max_code + 1,
                zip_d_desc.max_code + 1,
                max_blindex + 1);
            zip_compress_block(zip_dyn_ltree, zip_dyn_dtree);
        }

        zip_init_block();

        if (eof != 0)
            zip_bi_windup();
    };

    /* ==========================================================================
     * Save the match info and tally the frequency counts. Return true if
     * the current block must be flushed.
     */
    var zip_ct_tally = function (dist, // distance of matched string
                                 lc) { // match length-MIN_MATCH or unmatched char (if dist==0)
        zip_l_buf[zip_last_lit++] = lc;
        if (dist == 0) {
            // lc is the unmatched char
            zip_dyn_ltree[lc].fc++;
        } else {
            // Here, lc is the match length - MIN_MATCH
            dist--;		    // dist = match distance - 1
            zip_dyn_ltree[zip_length_code[lc] + zip_LITERALS + 1].fc++;
            zip_dyn_dtree[zip_D_CODE(dist)].fc++;

            zip_d_buf[zip_last_dist++] = dist;
            zip_flags |= zip_flag_bit;
        }
        zip_flag_bit <<= 1;

        // Output the flags if they fill a byte
        if ((zip_last_lit & 7) == 0) {
            zip_flag_buf[zip_last_flags++] = zip_flags;
            zip_flags = 0;
            zip_flag_bit = 1;
        }
        // Try to guess if it is profitable to stop the current block here
        if (zip_compr_level > 2 && (zip_last_lit & 0xfff) == 0) {
            // Compute an upper bound for the compressed length
            var out_length = zip_last_lit * 8;
            var in_length = zip_strstart - zip_block_start;
            var dcode;

            for (dcode = 0; dcode < zip_D_CODES; dcode++) {
                out_length += zip_dyn_dtree[dcode].fc * (5 + zip_extra_dbits[dcode]);
            }
            out_length >>= 3;
            if (zip_last_dist < parseInt(zip_last_lit / 2) &&
                out_length < parseInt(in_length / 2))
                return true;
        }
        return (zip_last_lit == LIT_BUFSIZE - 1 ||
            zip_last_dist == zip_DIST_BUFSIZE);
        /* We avoid equality with LIT_BUFSIZE because of wraparound at 64K
         * on 16 bit machines and because stored blocks are restricted to
         * 64K-1 bytes.
         */
    };

    /* ==========================================================================
     * Send the block data compressed using the given Huffman trees
     */
    var zip_compress_block = function (ltree,	// literal tree
                                       dtree) {	// distance tree
        var dist;		// distance of matched string
        var lc;		// match length or unmatched char (if dist == 0)
        var lx = 0;		// running index in l_buf
        var dx = 0;		// running index in d_buf
        var fx = 0;		// running index in flag_buf
        var flag = 0;	// current flags
        var code;		// the code to send
        var extra;		// number of extra bits to send

        if (zip_last_lit != 0) do {
            if ((lx & 7) == 0)
                flag = zip_flag_buf[fx++];
            lc = zip_l_buf[lx++] & 0xff;
            if ((flag & 1) == 0) {
                zip_SEND_CODE(lc, ltree);
                /* send a literal byte */
            } else {
                // Here, lc is the match length - MIN_MATCH
                code = zip_length_code[lc];
                zip_SEND_CODE(code + zip_LITERALS + 1, ltree); // send the length code
                extra = zip_extra_lbits[code];
                if (extra != 0) {
                    lc -= zip_base_length[code];
                    zip_send_bits(lc, extra); // send the extra length bits
                }
                dist = zip_d_buf[dx++];
                // Here, dist is the match distance - 1
                code = zip_D_CODE(dist);
                zip_SEND_CODE(code, dtree);	  // send the distance code
                extra = zip_extra_dbits[code];
                if (extra != 0) {
                    dist -= zip_base_dist[code];
                    zip_send_bits(dist, extra);   // send the extra distance bits
                }
            } // literal or match pair ?
            flag >>= 1;
        } while (lx < zip_last_lit);

        zip_SEND_CODE(zip_END_BLOCK, ltree);
    };

    /* ==========================================================================
     * Send a value on a given number of bits.
     * IN assertion: length <= 16 and value fits in length bits.
     */
    var zip_Buf_size = 16; // bit size of bi_buf
    var zip_send_bits = function (value,	// value to send
                                  length) {	// number of bits
        /* If not enough room in bi_buf, use (valid) bits from bi_buf and
         * (16 - bi_valid) bits from value, leaving (width - (16-bi_valid))
         * unused bits in value.
         */
        if (zip_bi_valid > zip_Buf_size - length) {
            zip_bi_buf |= (value << zip_bi_valid);
            zip_put_short(zip_bi_buf);
            zip_bi_buf = (value >> (zip_Buf_size - zip_bi_valid));
            zip_bi_valid += length - zip_Buf_size;
        } else {
            zip_bi_buf |= value << zip_bi_valid;
            zip_bi_valid += length;
        }
    };

    /* ==========================================================================
     * Reverse the first len bits of a code, using straightforward code (a faster
     * method would use a table)
     * IN assertion: 1 <= len <= 15
     */
    var zip_bi_reverse = function (code,	// the value to invert
                                   len) {	// its bit length
        var res = 0;
        do {
            res |= code & 1;
            code >>= 1;
            res <<= 1;
        } while (--len > 0);
        return res >> 1;
    };

    /* ==========================================================================
     * Write out any remaining bits in an incomplete byte.
     */
    var zip_bi_windup = function () {
        if (zip_bi_valid > 8) {
            zip_put_short(zip_bi_buf);
        } else if (zip_bi_valid > 0) {
            zip_put_byte(zip_bi_buf);
        }
        zip_bi_buf = 0;
        zip_bi_valid = 0;
    };

    var zip_qoutbuf = function () {
        if (zip_outcnt != 0) {
            var q, i;
            q = zip_new_queue();
            if (zip_qhead == null)
                zip_qhead = zip_qtail = q;
            else
                zip_qtail = zip_qtail.next = q;
            q.len = zip_outcnt - zip_outoff;
            for (i = 0; i < q.len; i++)
                q.ptr[i] = zip_outbuf[zip_outoff + i];
            zip_outcnt = zip_outoff = 0;
        }
    };

    function deflate(buffData, level) {
        zip_deflate_data = buffData;
        zip_deflate_pos = 0;
        zip_deflate_start(level);

        var buff = new Array(1024),
            pages = [],
            totalSize = 0,
            i;

        for (i = 0; i < 1024; i++) buff[i] = 0;
        while ((i = zip_deflate_internal(buff, 0, buff.length)) > 0) {
            var buf = new Buffer(buff.slice(0, i));
            pages.push(buf);
            totalSize += buf.length;
        }

        if (pages.length == 1) {
            return pages[0];
        }

        var result = new Buffer(totalSize),
            index = 0;

        for (i = 0; i < pages.length; i++) {
            pages[i].copy(result, index);
            index = index + pages[i].length
        }

        return result;
    }

    return {
        deflate: function () {
            return deflate(inbuf, 8);
        }
    }
}

module.exports = function (/*Buffer*/inbuf) {

    var zlib = __webpack_require__(7);

    return {
        deflate: function () {
            return new JSDeflater(inbuf).deflate();
        },

        deflateAsync: function (/*Function*/callback) {
            var tmp = zlib.createDeflateRaw({chunkSize:(parseInt(inbuf.length / 1024) + 1)*1024}),
                parts = [], total = 0;
            tmp.on('data', function(data) {
                parts.push(data);
                total += data.length;
            });
            tmp.on('end', function() {
                var buf = new Buffer(total), written = 0;
                buf.fill(0);

                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    part.copy(buf, written);
                    written += part.length;
                }
                callback && callback(buf);
            });
            tmp.end(inbuf);
        }
    }
};


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

var Buffer = __webpack_require__(21).Buffer;

function JSInflater(/*Buffer*/input) {

    var WSIZE = 0x8000,
        slide = new Buffer(0x10000),
        windowPos = 0,
        fixedTableList = null,
        fixedTableDist,
        fixedLookup,
        bitBuf = 0,
        bitLen = 0,
        method = -1,
        eof = false,
        copyLen = 0,
        copyDist = 0,
        tblList, tblDist, bitList, bitdist,

        inputPosition = 0,

        MASK_BITS = [0x0000, 0x0001, 0x0003, 0x0007, 0x000f, 0x001f, 0x003f, 0x007f, 0x00ff, 0x01ff, 0x03ff, 0x07ff, 0x0fff, 0x1fff, 0x3fff, 0x7fff, 0xffff],
        LENS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0],
        LEXT = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 99, 99],
        DISTS = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577],
        DEXT = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13],
        BITORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

    function HuffTable(clen, cnum, cval, blist, elist, lookupm) {

        this.status = 0;
        this.root = null;
        this.maxbit = 0;

        var el, f, tail,
            offsets = [],
            countTbl = [],
            sTbl = [],
            values = [],
            tentry = {extra: 0, bitcnt: 0, lbase: 0, next: null};

        tail = this.root = null;
        for(var i = 0; i < 0x11; i++)  { countTbl[i] = 0; sTbl[i] = 0; offsets[i] = 0; }
        for(i = 0; i < 0x120; i++) values[i] = 0;

        el = cnum > 256 ? clen[256] : 16;

        var pidx = -1;
        while (++pidx < cnum) countTbl[clen[pidx]]++;

        if(countTbl[0] == cnum) return;

        for(var j = 1; j <= 16; j++) if(countTbl[j] != 0) break;
        var bitLen = j;
        for(i = 16; i != 0; i--) if(countTbl[i] != 0) break;
        var maxLen = i;

        lookupm < j && (lookupm = j);

        var dCodes = 1 << j;
        for(; j < i; j++, dCodes <<= 1)
            if((dCodes -= countTbl[j]) < 0) {
                this.status = 2;
                this.maxbit = lookupm;
                return;
            }

        if((dCodes -= countTbl[i]) < 0) {
            this.status = 2;
            this.maxbit = lookupm;
            return;
        }

        countTbl[i] += dCodes;
        offsets[1] = j = 0;
        pidx = 1;
        var xp = 2;
        while(--i > 0) offsets[xp++] = (j += countTbl[pidx++]);
        pidx = 0;
        i = 0;
        do {
            (j = clen[pidx++]) && (values[offsets[j]++] = i);
        } while(++i < cnum);
        cnum = offsets[maxLen];
        offsets[0] = i = 0;
        pidx = 0;

        var level = -1,
            w = sTbl[0] = 0,
            cnode = null,
            tblCnt = 0,
            tblStack = [];

        for(; bitLen <= maxLen; bitLen++) {
            var kccnt = countTbl[bitLen];
            while(kccnt-- > 0) {
                while(bitLen > w + sTbl[1 + level]) {
                    w += sTbl[1 + level];
                    level++;
                    tblCnt = (tblCnt = maxLen - w) > lookupm ? lookupm : tblCnt;
                    if((f = 1 << (j = bitLen - w)) > kccnt + 1) {
                        f -= kccnt + 1;
                        xp = bitLen;
                        while(++j < tblCnt) {
                            if((f <<= 1) <= countTbl[++xp]) break;
                            f -= countTbl[xp];
                        }
                    }
                    if(w + j > el && w < el) j = el - w;
                    tblCnt = 1 << j;
                    sTbl[1 + level] = j;
                    cnode = [];
                    while (cnode.length < tblCnt) cnode.push({extra: 0, bitcnt: 0, lbase: 0, next: null});
                    if (tail == null) {
                        tail = this.root = {next:null, list:null};
                    } else {
                        tail = tail.next = {next:null, list:null}
                    }
                    tail.next = null;
                    tail.list = cnode;

                    tblStack[level] = cnode;

                    if(level > 0) {
                        offsets[level] = i;
                        tentry.bitcnt = sTbl[level];
                        tentry.extra = 16 + j;
                        tentry.next = cnode;
                        j = (i & ((1 << w) - 1)) >> (w - sTbl[level]);

                        tblStack[level-1][j].extra = tentry.extra;
                        tblStack[level-1][j].bitcnt = tentry.bitcnt;
                        tblStack[level-1][j].lbase = tentry.lbase;
                        tblStack[level-1][j].next = tentry.next;
                    }
                }
                tentry.bitcnt = bitLen - w;
                if(pidx >= cnum)
                    tentry.extra = 99;
                else if(values[pidx] < cval) {
                    tentry.extra = (values[pidx] < 256 ? 16 : 15);
                    tentry.lbase = values[pidx++];
                } else {
                    tentry.extra = elist[values[pidx] - cval];
                    tentry.lbase = blist[values[pidx++] - cval];
                }

                f = 1 << (bitLen - w);
                for(j = i >> w; j < tblCnt; j += f) {
                    cnode[j].extra = tentry.extra;
                    cnode[j].bitcnt = tentry.bitcnt;
                    cnode[j].lbase = tentry.lbase;
                    cnode[j].next = tentry.next;
                }
                for(j = 1 << (bitLen - 1); (i & j) != 0; j >>= 1)
                    i ^= j;
                i ^= j;
                while((i & ((1 << w) - 1)) != offsets[level]) {
                    w -= sTbl[level];
                    level--;
                }
            }
        }

        this.maxbit = sTbl[1];
        this.status = ((dCodes != 0 && maxLen != 1) ? 1 : 0);
    }

    function addBits(n) {
        while(bitLen < n) {
            bitBuf |= input[inputPosition++] << bitLen;
            bitLen += 8;
        }
        return bitBuf;
    }

    function cutBits(n) {
        bitLen -= n;
        return bitBuf >>= n;
    }

    function maskBits(n) {
        while(bitLen < n) {
            bitBuf |= input[inputPosition++] << bitLen;
            bitLen += 8;
        }
        var res = bitBuf & MASK_BITS[n];
        bitBuf >>= n;
        bitLen -= n;
        return res;
    }

    function codes(buff, off, size) {
        var e, t;
        if(size == 0) return 0;

        var n = 0;
        for(;;) {
            t = tblList.list[addBits(bitList) & MASK_BITS[bitList]];
            e = t.extra;
            while(e > 16) {
                if(e == 99) return -1;
                cutBits(t.bitcnt);
                e -= 16;
                t = t.next[addBits(e) & MASK_BITS[e]];
                e = t.extra;
            }
            cutBits(t.bitcnt);
            if(e == 16) {
                windowPos &= WSIZE - 1;
                buff[off + n++] = slide[windowPos++] = t.lbase;
                if(n == size) return size;
                continue;
            }
            if(e == 15) break;

            copyLen = t.lbase + maskBits(e);
            t = tblDist.list[addBits(bitdist) & MASK_BITS[bitdist]];
            e = t.extra;

            while(e > 16) {
                if(e == 99) return -1;
                cutBits(t.bitcnt);
                e -= 16;
                t = t.next[addBits(e) & MASK_BITS[e]];
                e = t.extra
            }
            cutBits(t.bitcnt);
            copyDist = windowPos - t.lbase - maskBits(e);

            while(copyLen > 0 && n < size) {
                copyLen--;
                copyDist &= WSIZE - 1;
                windowPos &= WSIZE - 1;
                buff[off + n++] = slide[windowPos++] = slide[copyDist++];
            }

            if(n == size) return size;
        }

        method = -1; // done
        return n;
    }

    function stored(buff, off, size) {
        cutBits(bitLen & 7);
        var n = maskBits(0x10);
        if(n != ((~maskBits(0x10)) & 0xffff)) return -1;
        copyLen = n;

        n = 0;
        while(copyLen > 0 && n < size) {
            copyLen--;
            windowPos &= WSIZE - 1;
            buff[off + n++] = slide[windowPos++] = maskBits(8);
        }

        if(copyLen == 0) method = -1;
        return n;
    }

    function fixed(buff, off, size) {
        var fixed_bd = 0;
        if(fixedTableList == null) {
            var lengths = [];

            for(var symbol = 0; symbol < 144; symbol++) lengths[symbol] = 8;
            for(; symbol < 256; symbol++) lengths[symbol] = 9;
            for(; symbol < 280; symbol++) lengths[symbol] = 7;
            for(; symbol < 288; symbol++) lengths[symbol] = 8;

            fixedLookup = 7;

            var htbl = new HuffTable(lengths, 288, 257, LENS, LEXT, fixedLookup);

            if(htbl.status != 0) return -1;

            fixedTableList = htbl.root;
            fixedLookup = htbl.maxbit;

            for(symbol = 0; symbol < 30; symbol++) lengths[symbol] = 5;
            fixed_bd = 5;

            htbl = new HuffTable(lengths, 30, 0, DISTS, DEXT, fixed_bd);
            if(htbl.status > 1) {
                fixedTableList = null;
                return -1;
            }
            fixedTableDist = htbl.root;
            fixed_bd = htbl.maxbit;
        }

        tblList = fixedTableList;
        tblDist = fixedTableDist;
        bitList = fixedLookup;
        bitdist = fixed_bd;
        return codes(buff, off, size);
    }

    function dynamic(buff, off, size) {
        var ll = new Array(0x023C);

        for (var m = 0; m < 0x023C; m++) ll[m] = 0;

        var llencnt = 257 + maskBits(5),
            dcodescnt = 1 + maskBits(5),
            bitlencnt = 4 + maskBits(4);

        if(llencnt > 286 || dcodescnt > 30) return -1;

        for(var j = 0; j < bitlencnt; j++) ll[BITORDER[j]] = maskBits(3);
        for(; j < 19; j++) ll[BITORDER[j]] = 0;

        // build decoding table for trees--single level, 7 bit lookup
        bitList = 7;
        var hufTable = new HuffTable(ll, 19, 19, null, null, bitList);
        if(hufTable.status != 0)
            return -1;	// incomplete code set

        tblList = hufTable.root;
        bitList = hufTable.maxbit;
        var lencnt = llencnt + dcodescnt,
            i = 0,
            lastLen = 0;
        while(i < lencnt) {
            var hufLcode = tblList.list[addBits(bitList) & MASK_BITS[bitList]];
            j = hufLcode.bitcnt;
            cutBits(j);
            j = hufLcode.lbase;
            if(j < 16)
                ll[i++] = lastLen = j;
            else if(j == 16) {
                j = 3 + maskBits(2);
                if(i + j > lencnt) return -1;
                while(j-- > 0) ll[i++] = lastLen;
            } else if(j == 17) {
                j = 3 + maskBits(3);
                if(i + j > lencnt) return -1;
                while(j-- > 0) ll[i++] = 0;
                lastLen = 0;
            } else {
                j = 11 + maskBits(7);
                if(i + j > lencnt) return -1;
                while(j-- > 0) ll[i++] = 0;
                lastLen = 0;
            }
        }
        bitList = 9;
        hufTable = new HuffTable(ll, llencnt, 257, LENS, LEXT, bitList);
        bitList == 0 && (hufTable.status = 1);

        if (hufTable.status != 0) return -1;

        tblList = hufTable.root;
        bitList = hufTable.maxbit;

        for(i = 0; i < dcodescnt; i++) ll[i] = ll[i + llencnt];
        bitdist = 6;
        hufTable = new HuffTable(ll, dcodescnt, 0, DISTS, DEXT, bitdist);
        tblDist = hufTable.root;
        bitdist = hufTable.maxbit;

        if((bitdist == 0 && llencnt > 257) || hufTable.status != 0) return -1;

        return codes(buff, off, size);
    }

    return {
        inflate : function(/*Buffer*/outputBuffer) {
            tblList = null;

            var size = outputBuffer.length,
                offset = 0, i;

            while(offset < size) {
                if(eof && method == -1) return;
                if(copyLen > 0) {
                    if(method != 0) {
                        while(copyLen > 0 && offset < size) {
                            copyLen--;
                            copyDist &= WSIZE - 1;
                            windowPos &= WSIZE - 1;
                            outputBuffer[offset++] = (slide[windowPos++] = slide[copyDist++]);
                        }
                    } else {
                        while(copyLen > 0 && offset < size) {
                            copyLen--;
                            windowPos &= WSIZE - 1;
                            outputBuffer[offset++] = (slide[windowPos++] = maskBits(8));
                        }
                        copyLen == 0 && (method = -1); // done
                    }
                    if (offset == size) return;
                }

                if(method == -1) {
                    if(eof) break;
                    eof = maskBits(1) != 0;
                    method = maskBits(2);
                    tblList = null;
                    copyLen = 0;
                }
                switch(method) {
                    case 0: i = stored(outputBuffer, offset, size - offset); break;
                    case 1: i = tblList != null ? codes(outputBuffer, offset, size - offset) : fixed(outputBuffer, offset, size - offset); break;
                    case 2: i = tblList != null ? codes(outputBuffer, offset, size - offset) : dynamic(outputBuffer, offset, size - offset); break;
                    default: i = -1; break;
                }

                if(i == -1) return;
                offset += i;
            }
        }
    };
}

module.exports = function(/*Buffer*/inbuf) {
    var zlib = __webpack_require__(7);
    return {
        inflateAsync : function(/*Function*/callback) {
            var tmp = zlib.createInflateRaw(),
                parts = [], total = 0;
            tmp.on('data', function(data) {
                parts.push(data);
                total += data.length;
            });
            tmp.on('end', function() {
                var buf = new Buffer(total), written = 0;
                buf.fill(0);

                for (var i = 0; i < parts.length; i++) {
                    var part = parts[i];
                    part.copy(buf, written);
                    written += part.length;
                }
                callback && callback(buf);
            });
            tmp.end(inbuf)
        },

        inflate : function(/*Buffer*/outputBuffer) {
            var x = {
                x: new JSInflater(inbuf)
            };
            x.x.inflate(outputBuffer);
            delete(x.x);
        }
    }
};


/***/ }),
/* 21 */
/***/ (function(module, exports) {

module.exports = require("buffer");

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

var ZipEntry = __webpack_require__(3),
    Headers = __webpack_require__(6),
    Utils = __webpack_require__(2);

module.exports = function(/*String|Buffer*/input, /*Number*/inputType) {
    var entryList = [],
        entryTable = {},
        _comment = new Buffer(0),
        filename = "",
        fs = __webpack_require__(0),
        inBuffer = null,
        mainHeader = new Headers.MainHeader();

    if (inputType == Utils.Constants.FILE) {
        // is a filename
        filename = input;
        inBuffer = fs.readFileSync(filename);
        readMainHeader();
    } else if (inputType == Utils.Constants.BUFFER) {
        // is a memory buffer
        inBuffer = input;
        readMainHeader();
    } else {
        // none. is a new file
    }

    function readEntries() {
        entryTable = {};
        entryList = new Array(mainHeader.diskEntries);  // total number of entries
        var index = mainHeader.offset;  // offset of first CEN header
        for(var i = 0; i < entryList.length; i++) {

            var tmp = index,
                entry = new ZipEntry(inBuffer);
            entry.header = inBuffer.slice(tmp, tmp += Utils.Constants.CENHDR);

            entry.entryName = inBuffer.slice(tmp, tmp += entry.header.fileNameLength);

            if (entry.header.extraLength) {
                entry.extra = inBuffer.slice(tmp, tmp += entry.header.extraLength);
            }

            if (entry.header.commentLength)
                entry.comment = inBuffer.slice(tmp, tmp + entry.header.commentLength);

            index += entry.header.entryHeaderSize;

            entryList[i] = entry;
            entryTable[entry.entryName] = entry;
        }
    }

    function readMainHeader() {
        var i = inBuffer.length - Utils.Constants.ENDHDR, // END header size
            n = Math.max(0, i - 0xFFFF), // 0xFFFF is the max zip file comment length
            endOffset = -1; // Start offset of the END header

        for (i; i >= n; i--) {
            if (inBuffer[i] != 0x50) continue; // quick check that the byte is 'P'
            if (inBuffer.readUInt32LE(i) == Utils.Constants.ENDSIG) { // "PK\005\006"
                endOffset = i;
                break;
            }
        }
        if (!~endOffset)
            throw Utils.Errors.INVALID_FORMAT;

        mainHeader.loadFromBinary(inBuffer.slice(endOffset, endOffset + Utils.Constants.ENDHDR));
        if (mainHeader.commentLength) {
            _comment = inBuffer.slice(endOffset + Utils.Constants.ENDHDR);
        }
        readEntries();
    }

    return {
        /**
         * Returns an array of ZipEntry objects existent in the current opened archive
         * @return Array
         */
        get entries () {
            return entryList;
        },

        /**
         * Archive comment
         * @return {String}
         */
        get comment () { return _comment.toString(); },
        set comment(val) {
            mainHeader.commentLength = val.length;
            _comment = val;
        },

        /**
         * Returns a reference to the entry with the given name or null if entry is inexistent
         *
         * @param entryName
         * @return ZipEntry
         */
        getEntry : function(/*String*/entryName) {
            return entryTable[entryName] || null;
        },

        /**
         * Adds the given entry to the entry list
         *
         * @param entry
         */
        setEntry : function(/*ZipEntry*/entry) {
            entryList.push(entry);
            entryTable[entry.entryName] = entry;
            mainHeader.totalEntries = entryList.length;
        },

        /**
         * Removes the entry with the given name from the entry list.
         *
         * If the entry is a directory, then all nested files and directories will be removed
         * @param entryName
         */
        deleteEntry : function(/*String*/entryName) {
            var entry = entryTable[entryName];
            if (entry && entry.isDirectory) {
                var _self = this;
                this.getEntryChildren(entry).forEach(function(child) {
                    if (child.entryName != entryName) {
                        _self.deleteEntry(child.entryName)
                    }
                })
            }
            entryList.splice(entryList.indexOf(entry), 1);
            delete(entryTable[entryName]);
            mainHeader.totalEntries = entryList.length;
        },

        /**
         *  Iterates and returns all nested files and directories of the given entry
         *
         * @param entry
         * @return Array
         */
        getEntryChildren : function(/*ZipEntry*/entry) {
            if (entry.isDirectory) {
                var list = [],
                    name = entry.entryName,
                    len = name.length;

                entryList.forEach(function(zipEntry) {
                    if (zipEntry.entryName.substr(0, len) == name) {
                        list.push(zipEntry);
                    }
                });
                return list;
            }
            return []
        },

        /**
         * Returns the zip file
         *
         * @return Buffer
         */
        compressToBuffer : function() {
            if (entryList.length > 1) {
                entryList.sort(function(a, b) {
                    var nameA = a.entryName.toLowerCase();
                    var nameB = b.entryName.toLowerCase();
                    if (nameA < nameB) {return -1}
                    if (nameA > nameB) {return 1}
                    return 0;
                });
            }

            var totalSize = 0,
                dataBlock = [],
                entryHeaders = [],
                dindex = 0;

            mainHeader.size = 0;
            mainHeader.offset = 0;

            entryList.forEach(function(entry) {
                entry.header.offset = dindex;

                // compress data and set local and entry header accordingly. Reason why is called first
                var compressedData = entry.getCompressedData();
                // data header
                var dataHeader = entry.header.dataHeaderToBinary();
                var postHeader = new Buffer(entry.entryName + entry.extra.toString());
                var dataLength = dataHeader.length + postHeader.length + compressedData.length;

                dindex += dataLength;

                dataBlock.push(dataHeader);
                dataBlock.push(postHeader);
                dataBlock.push(compressedData);

                var entryHeader = entry.packHeader();
                entryHeaders.push(entryHeader);
                mainHeader.size += entryHeader.length;
                totalSize += (dataLength + entryHeader.length);
            });

            totalSize += mainHeader.mainHeaderSize; // also includes zip file comment length
            // point to end of data and begining of central directory first record
            mainHeader.offset = dindex;

            dindex = 0;
            var outBuffer = new Buffer(totalSize);
            dataBlock.forEach(function(content) {
                content.copy(outBuffer, dindex); // write data blocks
                dindex += content.length;
            });
            entryHeaders.forEach(function(content) {
                content.copy(outBuffer, dindex); // write central directory entries
                dindex += content.length;
            });

            var mh = mainHeader.toBinary();
            if (_comment) {
                _comment.copy(mh, Utils.Constants.ENDHDR); // add zip file comment
            }

            mh.copy(outBuffer, dindex); // write main header

            return outBuffer
        },

        toAsyncBuffer : function(/*Function*/onSuccess,/*Function*/onFail,/*Function*/onItemStart,/*Function*/onItemEnd) {
            if (entryList.length > 1) {
                entryList.sort(function(a, b) {
                    var nameA = a.entryName.toLowerCase();
                    var nameB = b.entryName.toLowerCase();
                    if (nameA > nameB) {return -1}
                    if (nameA < nameB) {return 1}
                    return 0;
                });
            }

            var totalSize = 0,
                dataBlock = [],
                entryHeaders = [],
                dindex = 0;

            mainHeader.size = 0;
            mainHeader.offset = 0;

            var compress=function(entryList){
                var self=arguments.callee;
                var entry;
                if(entryList.length){
                    var entry=entryList.pop();
                    var name=entry.entryName + entry.extra.toString();
                    if(onItemStart)onItemStart(name);
                    entry.getCompressedDataAsync(function(compressedData){
                        if(onItemEnd)onItemEnd(name);

                        entry.header.offset = dindex;
                        // data header
                        var dataHeader = entry.header.dataHeaderToBinary();
                        var postHeader = new Buffer(name);
                        var dataLength = dataHeader.length + postHeader.length + compressedData.length;

                        dindex += dataLength;

                        dataBlock.push(dataHeader);
                        dataBlock.push(postHeader);
                        dataBlock.push(compressedData);

                        var entryHeader = entry.packHeader();
                        entryHeaders.push(entryHeader);
                        mainHeader.size += entryHeader.length;
                        totalSize += (dataLength + entryHeader.length);

                        if(entryList.length){
                            self(entryList);
                        }else{


                            totalSize += mainHeader.mainHeaderSize; // also includes zip file comment length
                            // point to end of data and begining of central directory first record
                            mainHeader.offset = dindex;

                            dindex = 0;
                            var outBuffer = new Buffer(totalSize);
                            dataBlock.forEach(function(content) {
                                content.copy(outBuffer, dindex); // write data blocks
                                dindex += content.length;
                            });
                            entryHeaders.forEach(function(content) {
                                content.copy(outBuffer, dindex); // write central directory entries
                                dindex += content.length;
                            });

                            var mh = mainHeader.toBinary();
                            if (_comment) {
                                _comment.copy(mh, Utils.Constants.ENDHDR); // add zip file comment
                            }

                            mh.copy(outBuffer, dindex); // write main header

                            onSuccess(outBuffer);
                        }
                    });
                }
            };

            compress(entryList);
        }
    }
};


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

var _fs
try {
  _fs = __webpack_require__(24)
} catch (_) {
  _fs = __webpack_require__(0)
}

function readFile (file, options, callback) {
  if (callback == null) {
    callback = options
    options = {}
  }

  if (typeof options === 'string') {
    options = {encoding: options}
  }

  options = options || {}
  var fs = options.fs || _fs

  var shouldThrow = true
  if ('throws' in options) {
    shouldThrow = options.throws
  }

  fs.readFile(file, options, function (err, data) {
    if (err) return callback(err)

    data = stripBom(data)

    var obj
    try {
      obj = JSON.parse(data, options ? options.reviver : null)
    } catch (err2) {
      if (shouldThrow) {
        err2.message = file + ': ' + err2.message
        return callback(err2)
      } else {
        return callback(null, null)
      }
    }

    callback(null, obj)
  })
}

function readFileSync (file, options) {
  options = options || {}
  if (typeof options === 'string') {
    options = {encoding: options}
  }

  var fs = options.fs || _fs

  var shouldThrow = true
  if ('throws' in options) {
    shouldThrow = options.throws
  }

  try {
    var content = fs.readFileSync(file, options)
    content = stripBom(content)
    return JSON.parse(content, options.reviver)
  } catch (err) {
    if (shouldThrow) {
      err.message = file + ': ' + err.message
      throw err
    } else {
      return null
    }
  }
}

function stringify (obj, options) {
  var spaces
  var EOL = '\n'
  if (typeof options === 'object' && options !== null) {
    if (options.spaces) {
      spaces = options.spaces
    }
    if (options.EOL) {
      EOL = options.EOL
    }
  }

  var str = JSON.stringify(obj, options ? options.replacer : null, spaces)

  return str.replace(/\n/g, EOL) + EOL
}

function writeFile (file, obj, options, callback) {
  if (callback == null) {
    callback = options
    options = {}
  }
  options = options || {}
  var fs = options.fs || _fs

  var str = ''
  try {
    str = stringify(obj, options)
  } catch (err) {
    // Need to return whether a callback was passed or not
    if (callback) callback(err, null)
    return
  }

  fs.writeFile(file, str, options, callback)
}

function writeFileSync (file, obj, options) {
  options = options || {}
  var fs = options.fs || _fs

  var str = stringify(obj, options)
  // not sure if fs.writeFileSync returns anything, but just in case
  return fs.writeFileSync(file, str, options)
}

function stripBom (content) {
  // we do this because JSON.parse would convert it to a utf8 string if encoding wasn't specified
  if (Buffer.isBuffer(content)) content = content.toString('utf8')
  content = content.replace(/^\uFEFF/, '')
  return content
}

var jsonfile = {
  readFile: readFile,
  readFileSync: readFileSync,
  writeFile: writeFile,
  writeFileSync: writeFileSync
}

module.exports = jsonfile


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(0)
var polyfills = __webpack_require__(25)
var legacy = __webpack_require__(27)
var queue = []

var util = __webpack_require__(29)

function noop () {}

var debug = noop
if (util.debuglog)
  debug = util.debuglog('gfs4')
else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || ''))
  debug = function() {
    var m = util.format.apply(util, arguments)
    m = 'GFS4: ' + m.split(/\n/).join('\nGFS4: ')
    console.error(m)
  }

if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || '')) {
  process.on('exit', function() {
    debug(queue)
    __webpack_require__(30).equal(queue.length, 0)
  })
}

module.exports = patch(__webpack_require__(8))
if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH) {
  module.exports = patch(fs)
}

// Always patch fs.close/closeSync, because we want to
// retry() whenever a close happens *anywhere* in the program.
// This is essential when multiple graceful-fs instances are
// in play at the same time.
module.exports.close =
fs.close = (function (fs$close) { return function (fd, cb) {
  return fs$close.call(fs, fd, function (err) {
    if (!err)
      retry()

    if (typeof cb === 'function')
      cb.apply(this, arguments)
  })
}})(fs.close)

module.exports.closeSync =
fs.closeSync = (function (fs$closeSync) { return function (fd) {
  // Note that graceful-fs also retries when fs.closeSync() fails.
  // Looks like a bug to me, although it's probably a harmless one.
  var rval = fs$closeSync.apply(fs, arguments)
  retry()
  return rval
}})(fs.closeSync)

function patch (fs) {
  // Everything that references the open() function needs to be in here
  polyfills(fs)
  fs.gracefulify = patch
  fs.FileReadStream = ReadStream;  // Legacy name.
  fs.FileWriteStream = WriteStream;  // Legacy name.
  fs.createReadStream = createReadStream
  fs.createWriteStream = createWriteStream
  var fs$readFile = fs.readFile
  fs.readFile = readFile
  function readFile (path, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$readFile(path, options, cb)

    function go$readFile (path, options, cb) {
      return fs$readFile(path, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$readFile, [path, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$writeFile = fs.writeFile
  fs.writeFile = writeFile
  function writeFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$writeFile(path, data, options, cb)

    function go$writeFile (path, data, options, cb) {
      return fs$writeFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$writeFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$appendFile = fs.appendFile
  if (fs$appendFile)
    fs.appendFile = appendFile
  function appendFile (path, data, options, cb) {
    if (typeof options === 'function')
      cb = options, options = null

    return go$appendFile(path, data, options, cb)

    function go$appendFile (path, data, options, cb) {
      return fs$appendFile(path, data, options, function (err) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$appendFile, [path, data, options, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  var fs$readdir = fs.readdir
  fs.readdir = readdir
  function readdir (path, options, cb) {
    var args = [path]
    if (typeof options !== 'function') {
      args.push(options)
    } else {
      cb = options
    }
    args.push(go$readdir$cb)

    return go$readdir(args)

    function go$readdir$cb (err, files) {
      if (files && files.sort)
        files.sort()

      if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
        enqueue([go$readdir, [args]])
      else {
        if (typeof cb === 'function')
          cb.apply(this, arguments)
        retry()
      }
    }
  }

  function go$readdir (args) {
    return fs$readdir.apply(fs, args)
  }

  if (process.version.substr(0, 4) === 'v0.8') {
    var legStreams = legacy(fs)
    ReadStream = legStreams.ReadStream
    WriteStream = legStreams.WriteStream
  }

  var fs$ReadStream = fs.ReadStream
  ReadStream.prototype = Object.create(fs$ReadStream.prototype)
  ReadStream.prototype.open = ReadStream$open

  var fs$WriteStream = fs.WriteStream
  WriteStream.prototype = Object.create(fs$WriteStream.prototype)
  WriteStream.prototype.open = WriteStream$open

  fs.ReadStream = ReadStream
  fs.WriteStream = WriteStream

  function ReadStream (path, options) {
    if (this instanceof ReadStream)
      return fs$ReadStream.apply(this, arguments), this
    else
      return ReadStream.apply(Object.create(ReadStream.prototype), arguments)
  }

  function ReadStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        if (that.autoClose)
          that.destroy()

        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
        that.read()
      }
    })
  }

  function WriteStream (path, options) {
    if (this instanceof WriteStream)
      return fs$WriteStream.apply(this, arguments), this
    else
      return WriteStream.apply(Object.create(WriteStream.prototype), arguments)
  }

  function WriteStream$open () {
    var that = this
    open(that.path, that.flags, that.mode, function (err, fd) {
      if (err) {
        that.destroy()
        that.emit('error', err)
      } else {
        that.fd = fd
        that.emit('open', fd)
      }
    })
  }

  function createReadStream (path, options) {
    return new ReadStream(path, options)
  }

  function createWriteStream (path, options) {
    return new WriteStream(path, options)
  }

  var fs$open = fs.open
  fs.open = open
  function open (path, flags, mode, cb) {
    if (typeof mode === 'function')
      cb = mode, mode = null

    return go$open(path, flags, mode, cb)

    function go$open (path, flags, mode, cb) {
      return fs$open(path, flags, mode, function (err, fd) {
        if (err && (err.code === 'EMFILE' || err.code === 'ENFILE'))
          enqueue([go$open, [path, flags, mode, cb]])
        else {
          if (typeof cb === 'function')
            cb.apply(this, arguments)
          retry()
        }
      })
    }
  }

  return fs
}

function enqueue (elem) {
  debug('ENQUEUE', elem[0].name, elem[1])
  queue.push(elem)
}

function retry () {
  var elem = queue.shift()
  if (elem) {
    debug('RETRY', elem[0].name, elem[1])
    elem[0].apply(null, elem[1])
  }
}


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

var fs = __webpack_require__(8)
var constants = __webpack_require__(26)

var origCwd = process.cwd
var cwd = null

var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform

process.cwd = function() {
  if (!cwd)
    cwd = origCwd.call(process)
  return cwd
}
try {
  process.cwd()
} catch (er) {}

var chdir = process.chdir
process.chdir = function(d) {
  cwd = null
  chdir.call(process, d)
}

module.exports = patch

function patch (fs) {
  // (re-)implement some things that are known busted or missing.

  // lchmod, broken prior to 0.6.2
  // back-port the fix here.
  if (constants.hasOwnProperty('O_SYMLINK') &&
      process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) {
    patchLchmod(fs)
  }

  // lutimes implementation, or no-op
  if (!fs.lutimes) {
    patchLutimes(fs)
  }

  // https://github.com/isaacs/node-graceful-fs/issues/4
  // Chown should not fail on einval or eperm if non-root.
  // It should not fail on enosys ever, as this just indicates
  // that a fs doesn't support the intended operation.

  fs.chown = chownFix(fs.chown)
  fs.fchown = chownFix(fs.fchown)
  fs.lchown = chownFix(fs.lchown)

  fs.chmod = chmodFix(fs.chmod)
  fs.fchmod = chmodFix(fs.fchmod)
  fs.lchmod = chmodFix(fs.lchmod)

  fs.chownSync = chownFixSync(fs.chownSync)
  fs.fchownSync = chownFixSync(fs.fchownSync)
  fs.lchownSync = chownFixSync(fs.lchownSync)

  fs.chmodSync = chmodFixSync(fs.chmodSync)
  fs.fchmodSync = chmodFixSync(fs.fchmodSync)
  fs.lchmodSync = chmodFixSync(fs.lchmodSync)

  fs.stat = statFix(fs.stat)
  fs.fstat = statFix(fs.fstat)
  fs.lstat = statFix(fs.lstat)

  fs.statSync = statFixSync(fs.statSync)
  fs.fstatSync = statFixSync(fs.fstatSync)
  fs.lstatSync = statFixSync(fs.lstatSync)

  // if lchmod/lchown do not exist, then make them no-ops
  if (!fs.lchmod) {
    fs.lchmod = function (path, mode, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchmodSync = function () {}
  }
  if (!fs.lchown) {
    fs.lchown = function (path, uid, gid, cb) {
      if (cb) process.nextTick(cb)
    }
    fs.lchownSync = function () {}
  }

  // on Windows, A/V software can lock the directory, causing this
  // to fail with an EACCES or EPERM if the directory contains newly
  // created files.  Try again on failure, for up to 60 seconds.

  // Set the timeout this long because some Windows Anti-Virus, such as Parity
  // bit9, may lock files for up to a minute, causing npm package install
  // failures. Also, take care to yield the scheduler. Windows scheduling gives
  // CPU to a busy looping process, which can cause the program causing the lock
  // contention to be starved of CPU by node, so the contention doesn't resolve.
  if (platform === "win32") {
    fs.rename = (function (fs$rename) { return function (from, to, cb) {
      var start = Date.now()
      var backoff = 0;
      fs$rename(from, to, function CB (er) {
        if (er
            && (er.code === "EACCES" || er.code === "EPERM")
            && Date.now() - start < 60000) {
          setTimeout(function() {
            fs.stat(to, function (stater, st) {
              if (stater && stater.code === "ENOENT")
                fs$rename(from, to, CB);
              else
                cb(er)
            })
          }, backoff)
          if (backoff < 100)
            backoff += 10;
          return;
        }
        if (cb) cb(er)
      })
    }})(fs.rename)
  }

  // if read() returns EAGAIN, then just try it again.
  fs.read = (function (fs$read) { return function (fd, buffer, offset, length, position, callback_) {
    var callback
    if (callback_ && typeof callback_ === 'function') {
      var eagCounter = 0
      callback = function (er, _, __) {
        if (er && er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          return fs$read.call(fs, fd, buffer, offset, length, position, callback)
        }
        callback_.apply(this, arguments)
      }
    }
    return fs$read.call(fs, fd, buffer, offset, length, position, callback)
  }})(fs.read)

  fs.readSync = (function (fs$readSync) { return function (fd, buffer, offset, length, position) {
    var eagCounter = 0
    while (true) {
      try {
        return fs$readSync.call(fs, fd, buffer, offset, length, position)
      } catch (er) {
        if (er.code === 'EAGAIN' && eagCounter < 10) {
          eagCounter ++
          continue
        }
        throw er
      }
    }
  }})(fs.readSync)
}

function patchLchmod (fs) {
  fs.lchmod = function (path, mode, callback) {
    fs.open( path
           , constants.O_WRONLY | constants.O_SYMLINK
           , mode
           , function (err, fd) {
      if (err) {
        if (callback) callback(err)
        return
      }
      // prefer to return the chmod error, if one occurs,
      // but still try to close, and report closing errors if they occur.
      fs.fchmod(fd, mode, function (err) {
        fs.close(fd, function(err2) {
          if (callback) callback(err || err2)
        })
      })
    })
  }

  fs.lchmodSync = function (path, mode) {
    var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode)

    // prefer to return the chmod error, if one occurs,
    // but still try to close, and report closing errors if they occur.
    var threw = true
    var ret
    try {
      ret = fs.fchmodSync(fd, mode)
      threw = false
    } finally {
      if (threw) {
        try {
          fs.closeSync(fd)
        } catch (er) {}
      } else {
        fs.closeSync(fd)
      }
    }
    return ret
  }
}

function patchLutimes (fs) {
  if (constants.hasOwnProperty("O_SYMLINK")) {
    fs.lutimes = function (path, at, mt, cb) {
      fs.open(path, constants.O_SYMLINK, function (er, fd) {
        if (er) {
          if (cb) cb(er)
          return
        }
        fs.futimes(fd, at, mt, function (er) {
          fs.close(fd, function (er2) {
            if (cb) cb(er || er2)
          })
        })
      })
    }

    fs.lutimesSync = function (path, at, mt) {
      var fd = fs.openSync(path, constants.O_SYMLINK)
      var ret
      var threw = true
      try {
        ret = fs.futimesSync(fd, at, mt)
        threw = false
      } finally {
        if (threw) {
          try {
            fs.closeSync(fd)
          } catch (er) {}
        } else {
          fs.closeSync(fd)
        }
      }
      return ret
    }

  } else {
    fs.lutimes = function (_a, _b, _c, cb) { if (cb) process.nextTick(cb) }
    fs.lutimesSync = function () {}
  }
}

function chmodFix (orig) {
  if (!orig) return orig
  return function (target, mode, cb) {
    return orig.call(fs, target, mode, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chmodFixSync (orig) {
  if (!orig) return orig
  return function (target, mode) {
    try {
      return orig.call(fs, target, mode)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function chownFix (orig) {
  if (!orig) return orig
  return function (target, uid, gid, cb) {
    return orig.call(fs, target, uid, gid, function (er) {
      if (chownErOk(er)) er = null
      if (cb) cb.apply(this, arguments)
    })
  }
}

function chownFixSync (orig) {
  if (!orig) return orig
  return function (target, uid, gid) {
    try {
      return orig.call(fs, target, uid, gid)
    } catch (er) {
      if (!chownErOk(er)) throw er
    }
  }
}


function statFix (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target, cb) {
    return orig.call(fs, target, function (er, stats) {
      if (!stats) return cb.apply(this, arguments)
      if (stats.uid < 0) stats.uid += 0x100000000
      if (stats.gid < 0) stats.gid += 0x100000000
      if (cb) cb.apply(this, arguments)
    })
  }
}

function statFixSync (orig) {
  if (!orig) return orig
  // Older versions of Node erroneously returned signed integers for
  // uid + gid.
  return function (target) {
    var stats = orig.call(fs, target)
    if (stats.uid < 0) stats.uid += 0x100000000
    if (stats.gid < 0) stats.gid += 0x100000000
    return stats;
  }
}

// ENOSYS means that the fs doesn't support the op. Just ignore
// that, because it doesn't matter.
//
// if there's no getuid, or if getuid() is something other
// than 0, and the error is EINVAL or EPERM, then just ignore
// it.
//
// This specific case is a silent failure in cp, install, tar,
// and most other unix tools that manage permissions.
//
// When running as root, or if other types of errors are
// encountered, then it's strict.
function chownErOk (er) {
  if (!er)
    return true

  if (er.code === "ENOSYS")
    return true

  var nonroot = !process.getuid || process.getuid() !== 0
  if (nonroot) {
    if (er.code === "EINVAL" || er.code === "EPERM")
      return true
  }

  return false
}


/***/ }),
/* 26 */
/***/ (function(module, exports) {

module.exports = require("constants");

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

var Stream = __webpack_require__(28).Stream

module.exports = legacy

function legacy (fs) {
  return {
    ReadStream: ReadStream,
    WriteStream: WriteStream
  }

  function ReadStream (path, options) {
    if (!(this instanceof ReadStream)) return new ReadStream(path, options);

    Stream.call(this);

    var self = this;

    this.path = path;
    this.fd = null;
    this.readable = true;
    this.paused = false;

    this.flags = 'r';
    this.mode = 438; /*=0666*/
    this.bufferSize = 64 * 1024;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.encoding) this.setEncoding(this.encoding);

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.end === undefined) {
        this.end = Infinity;
      } else if ('number' !== typeof this.end) {
        throw TypeError('end must be a Number');
      }

      if (this.start > this.end) {
        throw new Error('start must be <= end');
      }

      this.pos = this.start;
    }

    if (this.fd !== null) {
      process.nextTick(function() {
        self._read();
      });
      return;
    }

    fs.open(this.path, this.flags, this.mode, function (err, fd) {
      if (err) {
        self.emit('error', err);
        self.readable = false;
        return;
      }

      self.fd = fd;
      self.emit('open', fd);
      self._read();
    })
  }

  function WriteStream (path, options) {
    if (!(this instanceof WriteStream)) return new WriteStream(path, options);

    Stream.call(this);

    this.path = path;
    this.fd = null;
    this.writable = true;

    this.flags = 'w';
    this.encoding = 'binary';
    this.mode = 438; /*=0666*/
    this.bytesWritten = 0;

    options = options || {};

    // Mixin options into this
    var keys = Object.keys(options);
    for (var index = 0, length = keys.length; index < length; index++) {
      var key = keys[index];
      this[key] = options[key];
    }

    if (this.start !== undefined) {
      if ('number' !== typeof this.start) {
        throw TypeError('start must be a Number');
      }
      if (this.start < 0) {
        throw new Error('start must be >= zero');
      }

      this.pos = this.start;
    }

    this.busy = false;
    this._queue = [];

    if (this.fd === null) {
      this._open = fs.open;
      this._queue.push([this._open, this.path, this.flags, this.mode, undefined]);
      this.flush();
    }
  }
}


/***/ }),
/* 28 */
/***/ (function(module, exports) {

module.exports = require("stream");

/***/ }),
/* 29 */
/***/ (function(module, exports) {

module.exports = require("util");

/***/ }),
/* 30 */
/***/ (function(module, exports) {

module.exports = require("assert");

/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

var path = __webpack_require__(1);
var fs = __webpack_require__(0);
var _0777 = parseInt('0777', 8);

module.exports = mkdirP.mkdirp = mkdirP.mkdirP = mkdirP;

function mkdirP (p, opts, f, made) {
    if (typeof opts === 'function') {
        f = opts;
        opts = {};
    }
    else if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;
    
    var cb = f || function () {};
    p = path.resolve(p);
    
    xfs.mkdir(p, mode, function (er) {
        if (!er) {
            made = made || p;
            return cb(null, made);
        }
        switch (er.code) {
            case 'ENOENT':
                mkdirP(path.dirname(p), opts, function (er, made) {
                    if (er) cb(er, made);
                    else mkdirP(p, opts, cb, made);
                });
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                xfs.stat(p, function (er2, stat) {
                    // if the stat fails, then that's super weird.
                    // let the original error be the failure reason.
                    if (er2 || !stat.isDirectory()) cb(er, made)
                    else cb(null, made);
                });
                break;
        }
    });
}

mkdirP.sync = function sync (p, opts, made) {
    if (!opts || typeof opts !== 'object') {
        opts = { mode: opts };
    }
    
    var mode = opts.mode;
    var xfs = opts.fs || fs;
    
    if (mode === undefined) {
        mode = _0777 & (~process.umask());
    }
    if (!made) made = null;

    p = path.resolve(p);

    try {
        xfs.mkdirSync(p, mode);
        made = made || p;
    }
    catch (err0) {
        switch (err0.code) {
            case 'ENOENT' :
                made = sync(path.dirname(p), opts, made);
                sync(p, opts, made);
                break;

            // In the case of any other error, just see if there's a dir
            // there already.  If so, then hooray!  If not, then something
            // is borked.
            default:
                var stat;
                try {
                    stat = xfs.statSync(p);
                }
                catch (err1) {
                    throw err0;
                }
                if (!stat.isDirectory()) throw err0;
                break;
        }
    }

    return made;
};


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

// vim:ts=4:sts=4:sw=4:
/*!
 *
 * Copyright 2009-2017 Kris Kowal under the terms of the MIT
 * license found at https://github.com/kriskowal/q/blob/v1/LICENSE
 *
 * With parts by Tyler Close
 * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
 * at http://www.opensource.org/licenses/mit-license.html
 * Forked at ref_send.js version: 2009-05-11
 *
 * With parts by Mark Miller
 * Copyright (C) 2011 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

(function (definition) {
    "use strict";

    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

    // CommonJS
    } else if (true) {
        module.exports = definition();

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

    // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

    // <script>
    } else if (typeof window !== "undefined" || typeof self !== "undefined") {
        // Prefer window over self for add-on scripts. Use self for
        // non-windowed contexts.
        var global = typeof window !== "undefined" ? window : self;

        // Get the `window` object, save the previous Q global
        // and initialize Q as a global.
        var previousQ = global.Q;
        global.Q = definition();

        // Add a noConflict function so Q can be removed from the
        // global namespace.
        global.Q.noConflict = function () {
            global.Q = previousQ;
            return this;
        };

    } else {
        throw new Error("This environment was not anticipated by Q. Please file a bug.");
    }

})(function () {
"use strict";

var hasStacks = false;
try {
    throw new Error();
} catch (e) {
    hasStacks = !!e.stack;
}

// All code after this point will be filtered from stack traces reported
// by Q.
var qStartingLine = captureLine();
var qFileName;

// shims

// used for fallback in "allResolved"
var noop = function () {};

// Use the fastest possible means to execute a task in a future turn
// of the event loop.
var nextTick =(function () {
    // linked list of tasks (single, with head node)
    var head = {task: void 0, next: null};
    var tail = head;
    var flushing = false;
    var requestTick = void 0;
    var isNodeJS = false;
    // queue for late tasks, used by unhandled rejection tracking
    var laterQueue = [];

    function flush() {
        /* jshint loopfunc: true */
        var task, domain;

        while (head.next) {
            head = head.next;
            task = head.task;
            head.task = void 0;
            domain = head.domain;

            if (domain) {
                head.domain = void 0;
                domain.enter();
            }
            runSingle(task, domain);

        }
        while (laterQueue.length) {
            task = laterQueue.pop();
            runSingle(task);
        }
        flushing = false;
    }
    // runs a single function in the async queue
    function runSingle(task, domain) {
        try {
            task();

        } catch (e) {
            if (isNodeJS) {
                // In node, uncaught exceptions are considered fatal errors.
                // Re-throw them synchronously to interrupt flushing!

                // Ensure continuation if the uncaught exception is suppressed
                // listening "uncaughtException" events (as domains does).
                // Continue in next event to avoid tick recursion.
                if (domain) {
                    domain.exit();
                }
                setTimeout(flush, 0);
                if (domain) {
                    domain.enter();
                }

                throw e;

            } else {
                // In browsers, uncaught exceptions are not fatal.
                // Re-throw them asynchronously to avoid slow-downs.
                setTimeout(function () {
                    throw e;
                }, 0);
            }
        }

        if (domain) {
            domain.exit();
        }
    }

    nextTick = function (task) {
        tail = tail.next = {
            task: task,
            domain: isNodeJS && process.domain,
            next: null
        };

        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };

    if (typeof process === "object" &&
        process.toString() === "[object process]" && process.nextTick) {
        // Ensure Q is in a real Node environment, with a `process.nextTick`.
        // To see through fake Node environments:
        // * Mocha test runner - exposes a `process` global without a `nextTick`
        // * Browserify - exposes a `process.nexTick` function that uses
        //   `setTimeout`. In this case `setImmediate` is preferred because
        //    it is faster. Browserify's `process.toString()` yields
        //   "[object Object]", while in a real Node environment
        //   `process.toString()` yields "[object process]".
        isNodeJS = true;

        requestTick = function () {
            process.nextTick(flush);
        };

    } else if (typeof setImmediate === "function") {
        // In IE10, Node.js 0.9+, or https://github.com/NobleJS/setImmediate
        if (typeof window !== "undefined") {
            requestTick = setImmediate.bind(window, flush);
        } else {
            requestTick = function () {
                setImmediate(flush);
            };
        }

    } else if (typeof MessageChannel !== "undefined") {
        // modern browsers
        // http://www.nonblocking.io/2011/06/windownexttick.html
        var channel = new MessageChannel();
        // At least Safari Version 6.0.5 (8536.30.1) intermittently cannot create
        // working message ports the first time a page loads.
        channel.port1.onmessage = function () {
            requestTick = requestPortTick;
            channel.port1.onmessage = flush;
            flush();
        };
        var requestPortTick = function () {
            // Opera requires us to provide a message payload, regardless of
            // whether we use it.
            channel.port2.postMessage(0);
        };
        requestTick = function () {
            setTimeout(flush, 0);
            requestPortTick();
        };

    } else {
        // old browsers
        requestTick = function () {
            setTimeout(flush, 0);
        };
    }
    // runs a task after all other tasks have been run
    // this is useful for unhandled rejection tracking that needs to happen
    // after all `then`d tasks have been run.
    nextTick.runAfter = function (task) {
        laterQueue.push(task);
        if (!flushing) {
            flushing = true;
            requestTick();
        }
    };
    return nextTick;
})();

// Attempt to make generics safe in the face of downstream
// modifications.
// There is no situation where this is necessary.
// If you need a security guarantee, these primordials need to be
// deeply frozen anyway, and if you don’t need a security guarantee,
// this is just plain paranoid.
// However, this **might** have the nice side-effect of reducing the size of
// the minified code by reducing x.call() to merely x()
// See Mark Miller’s explanation of what this does.
// http://wiki.ecmascript.org/doku.php?id=conventions:safe_meta_programming
var call = Function.call;
function uncurryThis(f) {
    return function () {
        return call.apply(f, arguments);
    };
}
// This is equivalent, but slower:
// uncurryThis = Function_bind.bind(Function_bind.call);
// http://jsperf.com/uncurrythis

var array_slice = uncurryThis(Array.prototype.slice);

var array_reduce = uncurryThis(
    Array.prototype.reduce || function (callback, basis) {
        var index = 0,
            length = this.length;
        // concerning the initial value, if one is not provided
        if (arguments.length === 1) {
            // seek to the first value in the array, accounting
            // for the possibility that is is a sparse array
            do {
                if (index in this) {
                    basis = this[index++];
                    break;
                }
                if (++index >= length) {
                    throw new TypeError();
                }
            } while (1);
        }
        // reduce
        for (; index < length; index++) {
            // account for the possibility that the array is sparse
            if (index in this) {
                basis = callback(basis, this[index], index);
            }
        }
        return basis;
    }
);

var array_indexOf = uncurryThis(
    Array.prototype.indexOf || function (value) {
        // not a very good shim, but good enough for our one use of it
        for (var i = 0; i < this.length; i++) {
            if (this[i] === value) {
                return i;
            }
        }
        return -1;
    }
);

var array_map = uncurryThis(
    Array.prototype.map || function (callback, thisp) {
        var self = this;
        var collect = [];
        array_reduce(self, function (undefined, value, index) {
            collect.push(callback.call(thisp, value, index, self));
        }, void 0);
        return collect;
    }
);

var object_create = Object.create || function (prototype) {
    function Type() { }
    Type.prototype = prototype;
    return new Type();
};

var object_defineProperty = Object.defineProperty || function (obj, prop, descriptor) {
    obj[prop] = descriptor.value;
    return obj;
};

var object_hasOwnProperty = uncurryThis(Object.prototype.hasOwnProperty);

var object_keys = Object.keys || function (object) {
    var keys = [];
    for (var key in object) {
        if (object_hasOwnProperty(object, key)) {
            keys.push(key);
        }
    }
    return keys;
};

var object_toString = uncurryThis(Object.prototype.toString);

function isObject(value) {
    return value === Object(value);
}

// generator related shims

// FIXME: Remove this function once ES6 generators are in SpiderMonkey.
function isStopIteration(exception) {
    return (
        object_toString(exception) === "[object StopIteration]" ||
        exception instanceof QReturnValue
    );
}

// FIXME: Remove this helper and Q.return once ES6 generators are in
// SpiderMonkey.
var QReturnValue;
if (typeof ReturnValue !== "undefined") {
    QReturnValue = ReturnValue;
} else {
    QReturnValue = function (value) {
        this.value = value;
    };
}

// long stack traces

var STACK_JUMP_SEPARATOR = "From previous event:";

function makeStackTraceLong(error, promise) {
    // If possible, transform the error stack trace by removing Node and Q
    // cruft, then concatenating with the stack trace of `promise`. See #57.
    if (hasStacks &&
        promise.stack &&
        typeof error === "object" &&
        error !== null &&
        error.stack
    ) {
        var stacks = [];
        for (var p = promise; !!p; p = p.source) {
            if (p.stack && (!error.__minimumStackCounter__ || error.__minimumStackCounter__ > p.stackCounter)) {
                object_defineProperty(error, "__minimumStackCounter__", {value: p.stackCounter, configurable: true});
                stacks.unshift(p.stack);
            }
        }
        stacks.unshift(error.stack);

        var concatedStacks = stacks.join("\n" + STACK_JUMP_SEPARATOR + "\n");
        var stack = filterStackString(concatedStacks);
        object_defineProperty(error, "stack", {value: stack, configurable: true});
    }
}

function filterStackString(stackString) {
    var lines = stackString.split("\n");
    var desiredLines = [];
    for (var i = 0; i < lines.length; ++i) {
        var line = lines[i];

        if (!isInternalFrame(line) && !isNodeFrame(line) && line) {
            desiredLines.push(line);
        }
    }
    return desiredLines.join("\n");
}

function isNodeFrame(stackLine) {
    return stackLine.indexOf("(module.js:") !== -1 ||
           stackLine.indexOf("(node.js:") !== -1;
}

function getFileNameAndLineNumber(stackLine) {
    // Named functions: "at functionName (filename:lineNumber:columnNumber)"
    // In IE10 function name can have spaces ("Anonymous function") O_o
    var attempt1 = /at .+ \((.+):(\d+):(?:\d+)\)$/.exec(stackLine);
    if (attempt1) {
        return [attempt1[1], Number(attempt1[2])];
    }

    // Anonymous functions: "at filename:lineNumber:columnNumber"
    var attempt2 = /at ([^ ]+):(\d+):(?:\d+)$/.exec(stackLine);
    if (attempt2) {
        return [attempt2[1], Number(attempt2[2])];
    }

    // Firefox style: "function@filename:lineNumber or @filename:lineNumber"
    var attempt3 = /.*@(.+):(\d+)$/.exec(stackLine);
    if (attempt3) {
        return [attempt3[1], Number(attempt3[2])];
    }
}

function isInternalFrame(stackLine) {
    var fileNameAndLineNumber = getFileNameAndLineNumber(stackLine);

    if (!fileNameAndLineNumber) {
        return false;
    }

    var fileName = fileNameAndLineNumber[0];
    var lineNumber = fileNameAndLineNumber[1];

    return fileName === qFileName &&
        lineNumber >= qStartingLine &&
        lineNumber <= qEndingLine;
}

// discover own file name and line number range for filtering stack
// traces
function captureLine() {
    if (!hasStacks) {
        return;
    }

    try {
        throw new Error();
    } catch (e) {
        var lines = e.stack.split("\n");
        var firstLine = lines[0].indexOf("@") > 0 ? lines[1] : lines[2];
        var fileNameAndLineNumber = getFileNameAndLineNumber(firstLine);
        if (!fileNameAndLineNumber) {
            return;
        }

        qFileName = fileNameAndLineNumber[0];
        return fileNameAndLineNumber[1];
    }
}

function deprecate(callback, name, alternative) {
    return function () {
        if (typeof console !== "undefined" &&
            typeof console.warn === "function") {
            console.warn(name + " is deprecated, use " + alternative +
                         " instead.", new Error("").stack);
        }
        return callback.apply(callback, arguments);
    };
}

// end of shims
// beginning of real work

/**
 * Constructs a promise for an immediate reference, passes promises through, or
 * coerces promises from different systems.
 * @param value immediate reference or promise
 */
function Q(value) {
    // If the object is already a Promise, return it directly.  This enables
    // the resolve function to both be used to created references from objects,
    // but to tolerably coerce non-promises to promises.
    if (value instanceof Promise) {
        return value;
    }

    // assimilate thenables
    if (isPromiseAlike(value)) {
        return coerce(value);
    } else {
        return fulfill(value);
    }
}
Q.resolve = Q;

/**
 * Performs a task in a future turn of the event loop.
 * @param {Function} task
 */
Q.nextTick = nextTick;

/**
 * Controls whether or not long stack traces will be on
 */
Q.longStackSupport = false;

/**
 * The counter is used to determine the stopping point for building
 * long stack traces. In makeStackTraceLong we walk backwards through
 * the linked list of promises, only stacks which were created before
 * the rejection are concatenated.
 */
var longStackCounter = 1;

// enable long stacks if Q_DEBUG is set
if (typeof process === "object" && process && process.env && process.env.Q_DEBUG) {
    Q.longStackSupport = true;
}

/**
 * Constructs a {promise, resolve, reject} object.
 *
 * `resolve` is a callback to invoke with a more resolved value for the
 * promise. To fulfill the promise, invoke `resolve` with any value that is
 * not a thenable. To reject the promise, invoke `resolve` with a rejected
 * thenable, or invoke `reject` with the reason directly. To resolve the
 * promise to another thenable, thus putting it in the same state, invoke
 * `resolve` with that other thenable.
 */
Q.defer = defer;
function defer() {
    // if "messages" is an "Array", that indicates that the promise has not yet
    // been resolved.  If it is "undefined", it has been resolved.  Each
    // element of the messages array is itself an array of complete arguments to
    // forward to the resolved promise.  We coerce the resolution value to a
    // promise using the `resolve` function because it handles both fully
    // non-thenable values and other thenables gracefully.
    var messages = [], progressListeners = [], resolvedPromise;

    var deferred = object_create(defer.prototype);
    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, operands) {
        var args = array_slice(arguments);
        if (messages) {
            messages.push(args);
            if (op === "when" && operands[1]) { // progress operand
                progressListeners.push(operands[1]);
            }
        } else {
            Q.nextTick(function () {
                resolvedPromise.promiseDispatch.apply(resolvedPromise, args);
            });
        }
    };

    // XXX deprecated
    promise.valueOf = function () {
        if (messages) {
            return promise;
        }
        var nearerValue = nearer(resolvedPromise);
        if (isPromise(nearerValue)) {
            resolvedPromise = nearerValue; // shorten chain
        }
        return nearerValue;
    };

    promise.inspect = function () {
        if (!resolvedPromise) {
            return { state: "pending" };
        }
        return resolvedPromise.inspect();
    };

    if (Q.longStackSupport && hasStacks) {
        try {
            throw new Error();
        } catch (e) {
            // NOTE: don't try to use `Error.captureStackTrace` or transfer the
            // accessor around; that causes memory leaks as per GH-111. Just
            // reify the stack trace as a string ASAP.
            //
            // At the same time, cut off the first line; it's always just
            // "[object Promise]\n", as per the `toString`.
            promise.stack = e.stack.substring(e.stack.indexOf("\n") + 1);
            promise.stackCounter = longStackCounter++;
        }
    }

    // NOTE: we do the checks for `resolvedPromise` in each method, instead of
    // consolidating them into `become`, since otherwise we'd create new
    // promises with the lines `become(whatever(value))`. See e.g. GH-252.

    function become(newPromise) {
        resolvedPromise = newPromise;

        if (Q.longStackSupport && hasStacks) {
            // Only hold a reference to the new promise if long stacks
            // are enabled to reduce memory usage
            promise.source = newPromise;
        }

        array_reduce(messages, function (undefined, message) {
            Q.nextTick(function () {
                newPromise.promiseDispatch.apply(newPromise, message);
            });
        }, void 0);

        messages = void 0;
        progressListeners = void 0;
    }

    deferred.promise = promise;
    deferred.resolve = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(Q(value));
    };

    deferred.fulfill = function (value) {
        if (resolvedPromise) {
            return;
        }

        become(fulfill(value));
    };
    deferred.reject = function (reason) {
        if (resolvedPromise) {
            return;
        }

        become(reject(reason));
    };
    deferred.notify = function (progress) {
        if (resolvedPromise) {
            return;
        }

        array_reduce(progressListeners, function (undefined, progressListener) {
            Q.nextTick(function () {
                progressListener(progress);
            });
        }, void 0);
    };

    return deferred;
}

/**
 * Creates a Node-style callback that will resolve or reject the deferred
 * promise.
 * @returns a nodeback
 */
defer.prototype.makeNodeResolver = function () {
    var self = this;
    return function (error, value) {
        if (error) {
            self.reject(error);
        } else if (arguments.length > 2) {
            self.resolve(array_slice(arguments, 1));
        } else {
            self.resolve(value);
        }
    };
};

/**
 * @param resolver {Function} a function that returns nothing and accepts
 * the resolve, reject, and notify functions for a deferred.
 * @returns a promise that may be resolved with the given resolve and reject
 * functions, or rejected by a thrown exception in resolver
 */
Q.Promise = promise; // ES6
Q.promise = promise;
function promise(resolver) {
    if (typeof resolver !== "function") {
        throw new TypeError("resolver must be a function.");
    }
    var deferred = defer();
    try {
        resolver(deferred.resolve, deferred.reject, deferred.notify);
    } catch (reason) {
        deferred.reject(reason);
    }
    return deferred.promise;
}

promise.race = race; // ES6
promise.all = all; // ES6
promise.reject = reject; // ES6
promise.resolve = Q; // ES6

// XXX experimental.  This method is a way to denote that a local value is
// serializable and should be immediately dispatched to a remote upon request,
// instead of passing a reference.
Q.passByCopy = function (object) {
    //freeze(object);
    //passByCopies.set(object, true);
    return object;
};

Promise.prototype.passByCopy = function () {
    //freeze(object);
    //passByCopies.set(object, true);
    return this;
};

/**
 * If two promises eventually fulfill to the same value, promises that value,
 * but otherwise rejects.
 * @param x {Any*}
 * @param y {Any*}
 * @returns {Any*} a promise for x and y if they are the same, but a rejection
 * otherwise.
 *
 */
Q.join = function (x, y) {
    return Q(x).join(y);
};

Promise.prototype.join = function (that) {
    return Q([this, that]).spread(function (x, y) {
        if (x === y) {
            // TODO: "===" should be Object.is or equiv
            return x;
        } else {
            throw new Error("Q can't join: not the same: " + x + " " + y);
        }
    });
};

/**
 * Returns a promise for the first of an array of promises to become settled.
 * @param answers {Array[Any*]} promises to race
 * @returns {Any*} the first promise to be settled
 */
Q.race = race;
function race(answerPs) {
    return promise(function (resolve, reject) {
        // Switch to this once we can assume at least ES5
        // answerPs.forEach(function (answerP) {
        //     Q(answerP).then(resolve, reject);
        // });
        // Use this in the meantime
        for (var i = 0, len = answerPs.length; i < len; i++) {
            Q(answerPs[i]).then(resolve, reject);
        }
    });
}

Promise.prototype.race = function () {
    return this.then(Q.race);
};

/**
 * Constructs a Promise with a promise descriptor object and optional fallback
 * function.  The descriptor contains methods like when(rejected), get(name),
 * set(name, value), post(name, args), and delete(name), which all
 * return either a value, a promise for a value, or a rejection.  The fallback
 * accepts the operation name, a resolver, and any further arguments that would
 * have been forwarded to the appropriate method above had a method been
 * provided with the proper name.  The API makes no guarantees about the nature
 * of the returned object, apart from that it is usable whereever promises are
 * bought and sold.
 */
Q.makePromise = Promise;
function Promise(descriptor, fallback, inspect) {
    if (fallback === void 0) {
        fallback = function (op) {
            return reject(new Error(
                "Promise does not support operation: " + op
            ));
        };
    }
    if (inspect === void 0) {
        inspect = function () {
            return {state: "unknown"};
        };
    }

    var promise = object_create(Promise.prototype);

    promise.promiseDispatch = function (resolve, op, args) {
        var result;
        try {
            if (descriptor[op]) {
                result = descriptor[op].apply(promise, args);
            } else {
                result = fallback.call(promise, op, args);
            }
        } catch (exception) {
            result = reject(exception);
        }
        if (resolve) {
            resolve(result);
        }
    };

    promise.inspect = inspect;

    // XXX deprecated `valueOf` and `exception` support
    if (inspect) {
        var inspected = inspect();
        if (inspected.state === "rejected") {
            promise.exception = inspected.reason;
        }

        promise.valueOf = function () {
            var inspected = inspect();
            if (inspected.state === "pending" ||
                inspected.state === "rejected") {
                return promise;
            }
            return inspected.value;
        };
    }

    return promise;
}

Promise.prototype.toString = function () {
    return "[object Promise]";
};

Promise.prototype.then = function (fulfilled, rejected, progressed) {
    var self = this;
    var deferred = defer();
    var done = false;   // ensure the untrusted promise makes at most a
                        // single call to one of the callbacks

    function _fulfilled(value) {
        try {
            return typeof fulfilled === "function" ? fulfilled(value) : value;
        } catch (exception) {
            return reject(exception);
        }
    }

    function _rejected(exception) {
        if (typeof rejected === "function") {
            makeStackTraceLong(exception, self);
            try {
                return rejected(exception);
            } catch (newException) {
                return reject(newException);
            }
        }
        return reject(exception);
    }

    function _progressed(value) {
        return typeof progressed === "function" ? progressed(value) : value;
    }

    Q.nextTick(function () {
        self.promiseDispatch(function (value) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_fulfilled(value));
        }, "when", [function (exception) {
            if (done) {
                return;
            }
            done = true;

            deferred.resolve(_rejected(exception));
        }]);
    });

    // Progress propagator need to be attached in the current tick.
    self.promiseDispatch(void 0, "when", [void 0, function (value) {
        var newValue;
        var threw = false;
        try {
            newValue = _progressed(value);
        } catch (e) {
            threw = true;
            if (Q.onerror) {
                Q.onerror(e);
            } else {
                throw e;
            }
        }

        if (!threw) {
            deferred.notify(newValue);
        }
    }]);

    return deferred.promise;
};

Q.tap = function (promise, callback) {
    return Q(promise).tap(callback);
};

/**
 * Works almost like "finally", but not called for rejections.
 * Original resolution value is passed through callback unaffected.
 * Callback may return a promise that will be awaited for.
 * @param {Function} callback
 * @returns {Q.Promise}
 * @example
 * doSomething()
 *   .then(...)
 *   .tap(console.log)
 *   .then(...);
 */
Promise.prototype.tap = function (callback) {
    callback = Q(callback);

    return this.then(function (value) {
        return callback.fcall(value).thenResolve(value);
    });
};

/**
 * Registers an observer on a promise.
 *
 * Guarantees:
 *
 * 1. that fulfilled and rejected will be called only once.
 * 2. that either the fulfilled callback or the rejected callback will be
 *    called, but not both.
 * 3. that fulfilled and rejected will not be called in this turn.
 *
 * @param value      promise or immediate reference to observe
 * @param fulfilled  function to be called with the fulfilled value
 * @param rejected   function to be called with the rejection exception
 * @param progressed function to be called on any progress notifications
 * @return promise for the return value from the invoked callback
 */
Q.when = when;
function when(value, fulfilled, rejected, progressed) {
    return Q(value).then(fulfilled, rejected, progressed);
}

Promise.prototype.thenResolve = function (value) {
    return this.then(function () { return value; });
};

Q.thenResolve = function (promise, value) {
    return Q(promise).thenResolve(value);
};

Promise.prototype.thenReject = function (reason) {
    return this.then(function () { throw reason; });
};

Q.thenReject = function (promise, reason) {
    return Q(promise).thenReject(reason);
};

/**
 * If an object is not a promise, it is as "near" as possible.
 * If a promise is rejected, it is as "near" as possible too.
 * If it’s a fulfilled promise, the fulfillment value is nearer.
 * If it’s a deferred promise and the deferred has been resolved, the
 * resolution is "nearer".
 * @param object
 * @returns most resolved (nearest) form of the object
 */

// XXX should we re-do this?
Q.nearer = nearer;
function nearer(value) {
    if (isPromise(value)) {
        var inspected = value.inspect();
        if (inspected.state === "fulfilled") {
            return inspected.value;
        }
    }
    return value;
}

/**
 * @returns whether the given object is a promise.
 * Otherwise it is a fulfilled value.
 */
Q.isPromise = isPromise;
function isPromise(object) {
    return object instanceof Promise;
}

Q.isPromiseAlike = isPromiseAlike;
function isPromiseAlike(object) {
    return isObject(object) && typeof object.then === "function";
}

/**
 * @returns whether the given object is a pending promise, meaning not
 * fulfilled or rejected.
 */
Q.isPending = isPending;
function isPending(object) {
    return isPromise(object) && object.inspect().state === "pending";
}

Promise.prototype.isPending = function () {
    return this.inspect().state === "pending";
};

/**
 * @returns whether the given object is a value or fulfilled
 * promise.
 */
Q.isFulfilled = isFulfilled;
function isFulfilled(object) {
    return !isPromise(object) || object.inspect().state === "fulfilled";
}

Promise.prototype.isFulfilled = function () {
    return this.inspect().state === "fulfilled";
};

/**
 * @returns whether the given object is a rejected promise.
 */
Q.isRejected = isRejected;
function isRejected(object) {
    return isPromise(object) && object.inspect().state === "rejected";
}

Promise.prototype.isRejected = function () {
    return this.inspect().state === "rejected";
};

//// BEGIN UNHANDLED REJECTION TRACKING

// This promise library consumes exceptions thrown in handlers so they can be
// handled by a subsequent promise.  The exceptions get added to this array when
// they are created, and removed when they are handled.  Note that in ES6 or
// shimmed environments, this would naturally be a `Set`.
var unhandledReasons = [];
var unhandledRejections = [];
var reportedUnhandledRejections = [];
var trackUnhandledRejections = true;

function resetUnhandledRejections() {
    unhandledReasons.length = 0;
    unhandledRejections.length = 0;

    if (!trackUnhandledRejections) {
        trackUnhandledRejections = true;
    }
}

function trackRejection(promise, reason) {
    if (!trackUnhandledRejections) {
        return;
    }
    if (typeof process === "object" && typeof process.emit === "function") {
        Q.nextTick.runAfter(function () {
            if (array_indexOf(unhandledRejections, promise) !== -1) {
                process.emit("unhandledRejection", reason, promise);
                reportedUnhandledRejections.push(promise);
            }
        });
    }

    unhandledRejections.push(promise);
    if (reason && typeof reason.stack !== "undefined") {
        unhandledReasons.push(reason.stack);
    } else {
        unhandledReasons.push("(no stack) " + reason);
    }
}

function untrackRejection(promise) {
    if (!trackUnhandledRejections) {
        return;
    }

    var at = array_indexOf(unhandledRejections, promise);
    if (at !== -1) {
        if (typeof process === "object" && typeof process.emit === "function") {
            Q.nextTick.runAfter(function () {
                var atReport = array_indexOf(reportedUnhandledRejections, promise);
                if (atReport !== -1) {
                    process.emit("rejectionHandled", unhandledReasons[at], promise);
                    reportedUnhandledRejections.splice(atReport, 1);
                }
            });
        }
        unhandledRejections.splice(at, 1);
        unhandledReasons.splice(at, 1);
    }
}

Q.resetUnhandledRejections = resetUnhandledRejections;

Q.getUnhandledReasons = function () {
    // Make a copy so that consumers can't interfere with our internal state.
    return unhandledReasons.slice();
};

Q.stopUnhandledRejectionTracking = function () {
    resetUnhandledRejections();
    trackUnhandledRejections = false;
};

resetUnhandledRejections();

//// END UNHANDLED REJECTION TRACKING

/**
 * Constructs a rejected promise.
 * @param reason value describing the failure
 */
Q.reject = reject;
function reject(reason) {
    var rejection = Promise({
        "when": function (rejected) {
            // note that the error has been handled
            if (rejected) {
                untrackRejection(this);
            }
            return rejected ? rejected(reason) : this;
        }
    }, function fallback() {
        return this;
    }, function inspect() {
        return { state: "rejected", reason: reason };
    });

    // Note that the reason has not been handled.
    trackRejection(rejection, reason);

    return rejection;
}

/**
 * Constructs a fulfilled promise for an immediate reference.
 * @param value immediate reference
 */
Q.fulfill = fulfill;
function fulfill(value) {
    return Promise({
        "when": function () {
            return value;
        },
        "get": function (name) {
            return value[name];
        },
        "set": function (name, rhs) {
            value[name] = rhs;
        },
        "delete": function (name) {
            delete value[name];
        },
        "post": function (name, args) {
            // Mark Miller proposes that post with no name should apply a
            // promised function.
            if (name === null || name === void 0) {
                return value.apply(void 0, args);
            } else {
                return value[name].apply(value, args);
            }
        },
        "apply": function (thisp, args) {
            return value.apply(thisp, args);
        },
        "keys": function () {
            return object_keys(value);
        }
    }, void 0, function inspect() {
        return { state: "fulfilled", value: value };
    });
}

/**
 * Converts thenables to Q promises.
 * @param promise thenable promise
 * @returns a Q promise
 */
function coerce(promise) {
    var deferred = defer();
    Q.nextTick(function () {
        try {
            promise.then(deferred.resolve, deferred.reject, deferred.notify);
        } catch (exception) {
            deferred.reject(exception);
        }
    });
    return deferred.promise;
}

/**
 * Annotates an object such that it will never be
 * transferred away from this process over any promise
 * communication channel.
 * @param object
 * @returns promise a wrapping of that object that
 * additionally responds to the "isDef" message
 * without a rejection.
 */
Q.master = master;
function master(object) {
    return Promise({
        "isDef": function () {}
    }, function fallback(op, args) {
        return dispatch(object, op, args);
    }, function () {
        return Q(object).inspect();
    });
}

/**
 * Spreads the values of a promised array of arguments into the
 * fulfillment callback.
 * @param fulfilled callback that receives variadic arguments from the
 * promised array
 * @param rejected callback that receives the exception if the promise
 * is rejected.
 * @returns a promise for the return value or thrown exception of
 * either callback.
 */
Q.spread = spread;
function spread(value, fulfilled, rejected) {
    return Q(value).spread(fulfilled, rejected);
}

Promise.prototype.spread = function (fulfilled, rejected) {
    return this.all().then(function (array) {
        return fulfilled.apply(void 0, array);
    }, rejected);
};

/**
 * The async function is a decorator for generator functions, turning
 * them into asynchronous generators.  Although generators are only part
 * of the newest ECMAScript 6 drafts, this code does not cause syntax
 * errors in older engines.  This code should continue to work and will
 * in fact improve over time as the language improves.
 *
 * ES6 generators are currently part of V8 version 3.19 with the
 * --harmony-generators runtime flag enabled.  SpiderMonkey has had them
 * for longer, but under an older Python-inspired form.  This function
 * works on both kinds of generators.
 *
 * Decorates a generator function such that:
 *  - it may yield promises
 *  - execution will continue when that promise is fulfilled
 *  - the value of the yield expression will be the fulfilled value
 *  - it returns a promise for the return value (when the generator
 *    stops iterating)
 *  - the decorated function returns a promise for the return value
 *    of the generator or the first rejected promise among those
 *    yielded.
 *  - if an error is thrown in the generator, it propagates through
 *    every following yield until it is caught, or until it escapes
 *    the generator function altogether, and is translated into a
 *    rejection for the promise returned by the decorated generator.
 */
Q.async = async;
function async(makeGenerator) {
    return function () {
        // when verb is "send", arg is a value
        // when verb is "throw", arg is an exception
        function continuer(verb, arg) {
            var result;

            // Until V8 3.19 / Chromium 29 is released, SpiderMonkey is the only
            // engine that has a deployed base of browsers that support generators.
            // However, SM's generators use the Python-inspired semantics of
            // outdated ES6 drafts.  We would like to support ES6, but we'd also
            // like to make it possible to use generators in deployed browsers, so
            // we also support Python-style generators.  At some point we can remove
            // this block.

            if (typeof StopIteration === "undefined") {
                // ES6 Generators
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    return reject(exception);
                }
                if (result.done) {
                    return Q(result.value);
                } else {
                    return when(result.value, callback, errback);
                }
            } else {
                // SpiderMonkey Generators
                // FIXME: Remove this case when SM does ES6 generators.
                try {
                    result = generator[verb](arg);
                } catch (exception) {
                    if (isStopIteration(exception)) {
                        return Q(exception.value);
                    } else {
                        return reject(exception);
                    }
                }
                return when(result, callback, errback);
            }
        }
        var generator = makeGenerator.apply(this, arguments);
        var callback = continuer.bind(continuer, "next");
        var errback = continuer.bind(continuer, "throw");
        return callback();
    };
}

/**
 * The spawn function is a small wrapper around async that immediately
 * calls the generator and also ends the promise chain, so that any
 * unhandled errors are thrown instead of forwarded to the error
 * handler. This is useful because it's extremely common to run
 * generators at the top-level to work with libraries.
 */
Q.spawn = spawn;
function spawn(makeGenerator) {
    Q.done(Q.async(makeGenerator)());
}

// FIXME: Remove this interface once ES6 generators are in SpiderMonkey.
/**
 * Throws a ReturnValue exception to stop an asynchronous generator.
 *
 * This interface is a stop-gap measure to support generator return
 * values in older Firefox/SpiderMonkey.  In browsers that support ES6
 * generators like Chromium 29, just use "return" in your generator
 * functions.
 *
 * @param value the return value for the surrounding generator
 * @throws ReturnValue exception with the value.
 * @example
 * // ES6 style
 * Q.async(function* () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      return foo + bar;
 * })
 * // Older SpiderMonkey style
 * Q.async(function () {
 *      var foo = yield getFooPromise();
 *      var bar = yield getBarPromise();
 *      Q.return(foo + bar);
 * })
 */
Q["return"] = _return;
function _return(value) {
    throw new QReturnValue(value);
}

/**
 * The promised function decorator ensures that any promise arguments
 * are settled and passed as values (`this` is also settled and passed
 * as a value).  It will also ensure that the result of a function is
 * always a promise.
 *
 * @example
 * var add = Q.promised(function (a, b) {
 *     return a + b;
 * });
 * add(Q(a), Q(B));
 *
 * @param {function} callback The function to decorate
 * @returns {function} a function that has been decorated.
 */
Q.promised = promised;
function promised(callback) {
    return function () {
        return spread([this, all(arguments)], function (self, args) {
            return callback.apply(self, args);
        });
    };
}

/**
 * sends a message to a value in a future turn
 * @param object* the recipient
 * @param op the name of the message operation, e.g., "when",
 * @param args further arguments to be forwarded to the operation
 * @returns result {Promise} a promise for the result of the operation
 */
Q.dispatch = dispatch;
function dispatch(object, op, args) {
    return Q(object).dispatch(op, args);
}

Promise.prototype.dispatch = function (op, args) {
    var self = this;
    var deferred = defer();
    Q.nextTick(function () {
        self.promiseDispatch(deferred.resolve, op, args);
    });
    return deferred.promise;
};

/**
 * Gets the value of a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to get
 * @return promise for the property value
 */
Q.get = function (object, key) {
    return Q(object).dispatch("get", [key]);
};

Promise.prototype.get = function (key) {
    return this.dispatch("get", [key]);
};

/**
 * Sets the value of a property in a future turn.
 * @param object    promise or immediate reference for object object
 * @param name      name of property to set
 * @param value     new value of property
 * @return promise for the return value
 */
Q.set = function (object, key, value) {
    return Q(object).dispatch("set", [key, value]);
};

Promise.prototype.set = function (key, value) {
    return this.dispatch("set", [key, value]);
};

/**
 * Deletes a property in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of property to delete
 * @return promise for the return value
 */
Q.del = // XXX legacy
Q["delete"] = function (object, key) {
    return Q(object).dispatch("delete", [key]);
};

Promise.prototype.del = // XXX legacy
Promise.prototype["delete"] = function (key) {
    return this.dispatch("delete", [key]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param value     a value to post, typically an array of
 *                  invocation arguments for promises that
 *                  are ultimately backed with `resolve` values,
 *                  as opposed to those backed with URLs
 *                  wherein the posted value can be any
 *                  JSON serializable object.
 * @return promise for the return value
 */
// bound locally because it is used by other methods
Q.mapply = // XXX As proposed by "Redsandro"
Q.post = function (object, name, args) {
    return Q(object).dispatch("post", [name, args]);
};

Promise.prototype.mapply = // XXX As proposed by "Redsandro"
Promise.prototype.post = function (name, args) {
    return this.dispatch("post", [name, args]);
};

/**
 * Invokes a method in a future turn.
 * @param object    promise or immediate reference for target object
 * @param name      name of method to invoke
 * @param ...args   array of invocation arguments
 * @return promise for the return value
 */
Q.send = // XXX Mark Miller's proposed parlance
Q.mcall = // XXX As proposed by "Redsandro"
Q.invoke = function (object, name /*...args*/) {
    return Q(object).dispatch("post", [name, array_slice(arguments, 2)]);
};

Promise.prototype.send = // XXX Mark Miller's proposed parlance
Promise.prototype.mcall = // XXX As proposed by "Redsandro"
Promise.prototype.invoke = function (name /*...args*/) {
    return this.dispatch("post", [name, array_slice(arguments, 1)]);
};

/**
 * Applies the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param args      array of application arguments
 */
Q.fapply = function (object, args) {
    return Q(object).dispatch("apply", [void 0, args]);
};

Promise.prototype.fapply = function (args) {
    return this.dispatch("apply", [void 0, args]);
};

/**
 * Calls the promised function in a future turn.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q["try"] =
Q.fcall = function (object /* ...args*/) {
    return Q(object).dispatch("apply", [void 0, array_slice(arguments, 1)]);
};

Promise.prototype.fcall = function (/*...args*/) {
    return this.dispatch("apply", [void 0, array_slice(arguments)]);
};

/**
 * Binds the promised function, transforming return values into a fulfilled
 * promise and thrown errors into a rejected one.
 * @param object    promise or immediate reference for target function
 * @param ...args   array of application arguments
 */
Q.fbind = function (object /*...args*/) {
    var promise = Q(object);
    var args = array_slice(arguments, 1);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};
Promise.prototype.fbind = function (/*...args*/) {
    var promise = this;
    var args = array_slice(arguments);
    return function fbound() {
        return promise.dispatch("apply", [
            this,
            args.concat(array_slice(arguments))
        ]);
    };
};

/**
 * Requests the names of the owned properties of a promised
 * object in a future turn.
 * @param object    promise or immediate reference for target object
 * @return promise for the keys of the eventually settled object
 */
Q.keys = function (object) {
    return Q(object).dispatch("keys", []);
};

Promise.prototype.keys = function () {
    return this.dispatch("keys", []);
};

/**
 * Turns an array of promises into a promise for an array.  If any of
 * the promises gets rejected, the whole array is rejected immediately.
 * @param {Array*} an array (or promise for an array) of values (or
 * promises for values)
 * @returns a promise for an array of the corresponding values
 */
// By Mark Miller
// http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
Q.all = all;
function all(promises) {
    return when(promises, function (promises) {
        var pendingCount = 0;
        var deferred = defer();
        array_reduce(promises, function (undefined, promise, index) {
            var snapshot;
            if (
                isPromise(promise) &&
                (snapshot = promise.inspect()).state === "fulfilled"
            ) {
                promises[index] = snapshot.value;
            } else {
                ++pendingCount;
                when(
                    promise,
                    function (value) {
                        promises[index] = value;
                        if (--pendingCount === 0) {
                            deferred.resolve(promises);
                        }
                    },
                    deferred.reject,
                    function (progress) {
                        deferred.notify({ index: index, value: progress });
                    }
                );
            }
        }, void 0);
        if (pendingCount === 0) {
            deferred.resolve(promises);
        }
        return deferred.promise;
    });
}

Promise.prototype.all = function () {
    return all(this);
};

/**
 * Returns the first resolved promise of an array. Prior rejected promises are
 * ignored.  Rejects only if all promises are rejected.
 * @param {Array*} an array containing values or promises for values
 * @returns a promise fulfilled with the value of the first resolved promise,
 * or a rejected promise if all promises are rejected.
 */
Q.any = any;

function any(promises) {
    if (promises.length === 0) {
        return Q.resolve();
    }

    var deferred = Q.defer();
    var pendingCount = 0;
    array_reduce(promises, function (prev, current, index) {
        var promise = promises[index];

        pendingCount++;

        when(promise, onFulfilled, onRejected, onProgress);
        function onFulfilled(result) {
            deferred.resolve(result);
        }
        function onRejected(err) {
            pendingCount--;
            if (pendingCount === 0) {
                var rejection = err || new Error("" + err);

                rejection.message = ("Q can't get fulfillment value from any promise, all " +
                    "promises were rejected. Last error message: " + rejection.message);

                deferred.reject(rejection);
            }
        }
        function onProgress(progress) {
            deferred.notify({
                index: index,
                value: progress
            });
        }
    }, undefined);

    return deferred.promise;
}

Promise.prototype.any = function () {
    return any(this);
};

/**
 * Waits for all promises to be settled, either fulfilled or
 * rejected.  This is distinct from `all` since that would stop
 * waiting at the first rejection.  The promise returned by
 * `allResolved` will never be rejected.
 * @param promises a promise for an array (or an array) of promises
 * (or values)
 * @return a promise for an array of promises
 */
Q.allResolved = deprecate(allResolved, "allResolved", "allSettled");
function allResolved(promises) {
    return when(promises, function (promises) {
        promises = array_map(promises, Q);
        return when(all(array_map(promises, function (promise) {
            return when(promise, noop, noop);
        })), function () {
            return promises;
        });
    });
}

Promise.prototype.allResolved = function () {
    return allResolved(this);
};

/**
 * @see Promise#allSettled
 */
Q.allSettled = allSettled;
function allSettled(promises) {
    return Q(promises).allSettled();
}

/**
 * Turns an array of promises into a promise for an array of their states (as
 * returned by `inspect`) when they have all settled.
 * @param {Array[Any*]} values an array (or promise for an array) of values (or
 * promises for values)
 * @returns {Array[State]} an array of states for the respective values.
 */
Promise.prototype.allSettled = function () {
    return this.then(function (promises) {
        return all(array_map(promises, function (promise) {
            promise = Q(promise);
            function regardless() {
                return promise.inspect();
            }
            return promise.then(regardless, regardless);
        }));
    });
};

/**
 * Captures the failure of a promise, giving an oportunity to recover
 * with a callback.  If the given promise is fulfilled, the returned
 * promise is fulfilled.
 * @param {Any*} promise for something
 * @param {Function} callback to fulfill the returned promise if the
 * given promise is rejected
 * @returns a promise for the return value of the callback
 */
Q.fail = // XXX legacy
Q["catch"] = function (object, rejected) {
    return Q(object).then(void 0, rejected);
};

Promise.prototype.fail = // XXX legacy
Promise.prototype["catch"] = function (rejected) {
    return this.then(void 0, rejected);
};

/**
 * Attaches a listener that can respond to progress notifications from a
 * promise's originating deferred. This listener receives the exact arguments
 * passed to ``deferred.notify``.
 * @param {Any*} promise for something
 * @param {Function} callback to receive any progress notifications
 * @returns the given promise, unchanged
 */
Q.progress = progress;
function progress(object, progressed) {
    return Q(object).then(void 0, void 0, progressed);
}

Promise.prototype.progress = function (progressed) {
    return this.then(void 0, void 0, progressed);
};

/**
 * Provides an opportunity to observe the settling of a promise,
 * regardless of whether the promise is fulfilled or rejected.  Forwards
 * the resolution to the returned promise when the callback is done.
 * The callback can return a promise to defer completion.
 * @param {Any*} promise
 * @param {Function} callback to observe the resolution of the given
 * promise, takes no arguments.
 * @returns a promise for the resolution of the given promise when
 * ``fin`` is done.
 */
Q.fin = // XXX legacy
Q["finally"] = function (object, callback) {
    return Q(object)["finally"](callback);
};

Promise.prototype.fin = // XXX legacy
Promise.prototype["finally"] = function (callback) {
    if (!callback || typeof callback.apply !== "function") {
        throw new Error("Q can't apply finally callback");
    }
    callback = Q(callback);
    return this.then(function (value) {
        return callback.fcall().then(function () {
            return value;
        });
    }, function (reason) {
        // TODO attempt to recycle the rejection with "this".
        return callback.fcall().then(function () {
            throw reason;
        });
    });
};

/**
 * Terminates a chain of promises, forcing rejections to be
 * thrown as exceptions.
 * @param {Any*} promise at the end of a chain of promises
 * @returns nothing
 */
Q.done = function (object, fulfilled, rejected, progress) {
    return Q(object).done(fulfilled, rejected, progress);
};

Promise.prototype.done = function (fulfilled, rejected, progress) {
    var onUnhandledError = function (error) {
        // forward to a future turn so that ``when``
        // does not catch it and turn it into a rejection.
        Q.nextTick(function () {
            makeStackTraceLong(error, promise);
            if (Q.onerror) {
                Q.onerror(error);
            } else {
                throw error;
            }
        });
    };

    // Avoid unnecessary `nextTick`ing via an unnecessary `when`.
    var promise = fulfilled || rejected || progress ?
        this.then(fulfilled, rejected, progress) :
        this;

    if (typeof process === "object" && process && process.domain) {
        onUnhandledError = process.domain.bind(onUnhandledError);
    }

    promise.then(void 0, onUnhandledError);
};

/**
 * Causes a promise to be rejected if it does not get fulfilled before
 * some milliseconds time out.
 * @param {Any*} promise
 * @param {Number} milliseconds timeout
 * @param {Any*} custom error message or Error object (optional)
 * @returns a promise for the resolution of the given promise if it is
 * fulfilled before the timeout, otherwise rejected.
 */
Q.timeout = function (object, ms, error) {
    return Q(object).timeout(ms, error);
};

Promise.prototype.timeout = function (ms, error) {
    var deferred = defer();
    var timeoutId = setTimeout(function () {
        if (!error || "string" === typeof error) {
            error = new Error(error || "Timed out after " + ms + " ms");
            error.code = "ETIMEDOUT";
        }
        deferred.reject(error);
    }, ms);

    this.then(function (value) {
        clearTimeout(timeoutId);
        deferred.resolve(value);
    }, function (exception) {
        clearTimeout(timeoutId);
        deferred.reject(exception);
    }, deferred.notify);

    return deferred.promise;
};

/**
 * Returns a promise for the given value (or promised value), some
 * milliseconds after it resolved. Passes rejections immediately.
 * @param {Any*} promise
 * @param {Number} milliseconds
 * @returns a promise for the resolution of the given promise after milliseconds
 * time has elapsed since the resolution of the given promise.
 * If the given promise rejects, that is passed immediately.
 */
Q.delay = function (object, timeout) {
    if (timeout === void 0) {
        timeout = object;
        object = void 0;
    }
    return Q(object).delay(timeout);
};

Promise.prototype.delay = function (timeout) {
    return this.then(function (value) {
        var deferred = defer();
        setTimeout(function () {
            deferred.resolve(value);
        }, timeout);
        return deferred.promise;
    });
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided as an array, and returns a promise.
 *
 *      Q.nfapply(FS.readFile, [__filename])
 *      .then(function (content) {
 *      })
 *
 */
Q.nfapply = function (callback, args) {
    return Q(callback).nfapply(args);
};

Promise.prototype.nfapply = function (args) {
    var deferred = defer();
    var nodeArgs = array_slice(args);
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Passes a continuation to a Node function, which is called with the given
 * arguments provided individually, and returns a promise.
 * @example
 * Q.nfcall(FS.readFile, __filename)
 * .then(function (content) {
 * })
 *
 */
Q.nfcall = function (callback /*...args*/) {
    var args = array_slice(arguments, 1);
    return Q(callback).nfapply(args);
};

Promise.prototype.nfcall = function (/*...args*/) {
    var nodeArgs = array_slice(arguments);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.fapply(nodeArgs).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent
 * version that returns a promise.
 * @example
 * Q.nfbind(FS.readFile, __filename)("utf-8")
 * .then(console.log)
 * .done()
 */
Q.nfbind =
Q.denodeify = function (callback /*...args*/) {
    if (callback === undefined) {
        throw new Error("Q can't wrap an undefined function");
    }
    var baseArgs = array_slice(arguments, 1);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        Q(callback).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nfbind =
Promise.prototype.denodeify = function (/*...args*/) {
    var args = array_slice(arguments);
    args.unshift(this);
    return Q.denodeify.apply(void 0, args);
};

Q.nbind = function (callback, thisp /*...args*/) {
    var baseArgs = array_slice(arguments, 2);
    return function () {
        var nodeArgs = baseArgs.concat(array_slice(arguments));
        var deferred = defer();
        nodeArgs.push(deferred.makeNodeResolver());
        function bound() {
            return callback.apply(thisp, arguments);
        }
        Q(bound).fapply(nodeArgs).fail(deferred.reject);
        return deferred.promise;
    };
};

Promise.prototype.nbind = function (/*thisp, ...args*/) {
    var args = array_slice(arguments, 0);
    args.unshift(this);
    return Q.nbind.apply(void 0, args);
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback with a given array of arguments, plus a provided callback.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param {Array} args arguments to pass to the method; the callback
 * will be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nmapply = // XXX As proposed by "Redsandro"
Q.npost = function (object, name, args) {
    return Q(object).npost(name, args);
};

Promise.prototype.nmapply = // XXX As proposed by "Redsandro"
Promise.prototype.npost = function (name, args) {
    var nodeArgs = array_slice(args || []);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * Calls a method of a Node-style object that accepts a Node-style
 * callback, forwarding the given variadic arguments, plus a provided
 * callback argument.
 * @param object an object that has the named method
 * @param {String} name name of the method of object
 * @param ...args arguments to pass to the method; the callback will
 * be provided by Q and appended to these arguments.
 * @returns a promise for the value or error
 */
Q.nsend = // XXX Based on Mark Miller's proposed "send"
Q.nmcall = // XXX Based on "Redsandro's" proposal
Q.ninvoke = function (object, name /*...args*/) {
    var nodeArgs = array_slice(arguments, 2);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    Q(object).dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

Promise.prototype.nsend = // XXX Based on Mark Miller's proposed "send"
Promise.prototype.nmcall = // XXX Based on "Redsandro's" proposal
Promise.prototype.ninvoke = function (name /*...args*/) {
    var nodeArgs = array_slice(arguments, 1);
    var deferred = defer();
    nodeArgs.push(deferred.makeNodeResolver());
    this.dispatch("post", [name, nodeArgs]).fail(deferred.reject);
    return deferred.promise;
};

/**
 * If a function would like to support both Node continuation-passing-style and
 * promise-returning-style, it can end its internal promise chain with
 * `nodeify(nodeback)`, forwarding the optional nodeback argument.  If the user
 * elects to use a nodeback, the result will be sent there.  If they do not
 * pass a nodeback, they will receive the result promise.
 * @param object a result (or a promise for a result)
 * @param {Function} nodeback a Node.js-style callback
 * @returns either the promise or nothing
 */
Q.nodeify = nodeify;
function nodeify(object, nodeback) {
    return Q(object).nodeify(nodeback);
}

Promise.prototype.nodeify = function (nodeback) {
    if (nodeback) {
        this.then(function (value) {
            Q.nextTick(function () {
                nodeback(null, value);
            });
        }, function (error) {
            Q.nextTick(function () {
                nodeback(error);
            });
        });
    } else {
        return this;
    }
};

Q.noConflict = function() {
    throw new Error("Q.noConflict only works when Q is used as a global");
};

// All code before this point will be filtered from stack traces.
var qEndingLine = captureLine();

return Q;

});


/***/ }),
/* 33 */
/***/ (function(module, exports) {

module.exports = require("nw.gui");

/***/ })
/******/ ]);