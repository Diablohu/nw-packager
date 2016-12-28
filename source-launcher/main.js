import compareVersion from './modules/compareVersion.js'
// import extend from './modules/extend.js'
import rmDir from './modules/rmDir.js'
import deepExtend from 'deep-extend'


(() => {
    const fs = require('fs')
    const path = require('path')

    // const AdmZip = require('./modules/adm-zip')
    const AdmZip = require('adm-zip')
    // const JSZip = require('jszip')
    const jf = require('jsonfile')
    const mkdirp = require('mkdirp')
    const Q = require('q')

    const gui = require('nw.gui')
    const launcher = gui.Window.get()

    const localStorage = window.localStorage
    const process = window.process
    const global = window.global

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
    let fileListData = []

    // 解压缩工作目录下的文件列表
    let fileListAppData = []

    // 解压缩工作目录下的文件夹是否有文件
    let isNotEmptyAppDataSub = {}

    // 更新的数据包列表
    let appDataUpdatList = {}
    let appDataUpdated = false

    // 当前工作目录
    let dirRoot
    const rootscheck = [
        path.dirname(process.execPath),
        process.cwd()
    ]
    rootscheck.some((dir) => {
        try {
            fs.accessSync(
                path.join(dir, 'data'),
                fs.F_OK
            );
            dirRoot = dir
            return true
        } catch (e) {
            return false
        }
    })
    // let dirRoot = path.dirname(process.execPath).split(path.sep)
    // dirRoot = (process.platform == 'darwin' || (dirRoot[dirRoot.length - 1] == 'nwjs' && path.basename(process.execPath) == 'nw.exe'))
    //     ? process.cwd()
    //     : path.dirname(process.execPath)

    const dirData = path.join(dirRoot, '/data/')
    const dirApp = gui.App.dataPath
    const dirAppData = path.join(dirApp, '/Extracted Data/')

    // console.log(
    //     dirRoot,
    //     dirData,
    //     dirApp,
    //     dirAppData
    // )

    // 处理当前数据包版本
    let curVer = {}
    try {
        curVer = JSON.parse(localStorage['nwjs-data-version'])
    } catch (e) { }

    // Error Logger
    const errorlog = (err) => {
        //console.log(err)
        fs.appendFileSync(
            path.join(dirRoot, 'errorlog.txt'),
            new Date()
            + "\r\n"
            + ((err instanceof Error)
                ? err.message || ''
                : err
            )
            + "\r\n"
            + "\r\n"
            + "========================================"
            + "\r\n"
            + "\r\n"
        )
    }

    const readdir = (dir) => {
        let deferred = Q.defer()
        fs.readdir(dir, (err, files) => {
            if (err) {
                deferred.reject(new Error(err))
            } else {
                deferred.resolve(files)
            }
        })
        return deferred.promise
    }

    const unzip = (dir, deferred = Q.defer()) => {
        // console.log(dir)
        const pathParse = (typeof dir == 'object') ? dir : path.parse(dir)

        // 比对版本
        // 如果版本号高于当前版本，则进行解压缩操作，并更改当前版本号
        // 否则跳过
        const zipFile = path.join(pathParse.dir, pathParse.base)
        // console.log('zipFile', zipFile)
        const zip = new AdmZip(zipFile)
        // console.log('zip', zip)
        const comment = zip.getZipComment()
        // console.log('verPackage', comment)
        const verCurrent = curVer[pathParse.name] || '0'
        // console.log('verCurrent', verCurrent)

        // 如果 App 数据目录下对应目录不存在或为空，强制解压缩
        const existInAppData = (fileListAppData.indexOf(pathParse.name) > -1)
        const isNotEmpty = isNotEmptyAppDataSub[pathParse.name]
        const extractAnyWay = !existInAppData || !isNotEmpty
        // console.log('existInAppData', existInAppData)
        // console.log('isNotEmpty', isNotEmpty)
        // console.log('extractAnyWay', extractAnyWay)

        const resolve = (err) => {
            if (err) {
                errorlog(err)
            }
            setTimeout(() => {
                deferred.resolve()
            }, 200)
        }

        // console.log(compareVersion(comment, verCurrent))
        if (extractAnyWay || compareVersion(comment, verCurrent)) {
            // console.log(comment, verCurrent)
            // console.log('[' + pathParse.base + '] version ' + comment + ' greater than current ' + verCurrent)
            // console.log('Extract data files')

            // 修改当前版本号变量，在之后写入 localStorage
            let o = {}
            o[pathParse.name] = comment
            deepExtend(curVer, o)

            // 开始解压缩操作
            if (existInAppData && isNotEmpty)
                rmDir(path.join(dirAppData, pathParse.name))

            appDataUpdatList[pathParse.name] = comment
            appDataUpdated = true

            // window.testzip = zip
            // window.textdir = dirAppData
            // console.log(window.testzip, dirAppData)
            zip.extractAllToAsync(dirAppData, true, function (err) {
                // console.log(dirAppData)
                resolve(err)
            })
            // testzip.extractAllTo(window.textdir, true)
            // testzip.extractAllToAsync(window.textdir, true, function(err){
            //     console.log(err)
            // })

        } else {
            // console.log('[' + pathParse.base + '] version ' + comment + ' not greater than current ' + verCurrent)
            // console.log('Ignored.')
            resolve()
        }

        return deferred.promise
    }

    // 函数步骤链，使用 Q 实现
    let promise_chain = Q.fcall(function () { })
    promise_chain

        // Error Handler
        .catch((err) => {
            return errorlog(err)
            // try {
            //     errorlog(new Error(err))
            // } catch (e) {
            // }
        })

        // 创建数据包解压缩目录
        .then(() => {
            return mkdirp(dirAppData)
        })

        // 获取数据包目录下的文件列表
        .then(() => readdir(dirData))
        .then((files) => {
            return fileListData = files
        })

        // 获取解压缩工作目录下的文件列表
        .then(() => readdir(dirAppData))
        .then((files) => {
            return fileListAppData = files
        })

        // 检查解压缩工作目录下的子文件夹是否为空
        .then(() => {
            let chain = Q()
            let deferred = Q.defer()

            fileListAppData.forEach(filename => {
                chain = chain.then(() => {
                    let deferred = Q.defer()
                    let searchPath = path.join(dirAppData, filename)

                    // 检查是否为目录，再检查是否为空
                    fs.stat(searchPath, function (err, stat) {
                        if (err || !stat.isDirectory()) {
                            if (err)
                                errorlog(new Error(err))
                            deferred.resolve()
                        } else {
                            fs.readdir(searchPath, (err, items) => {
                                if (err) {
                                    errorlog(new Error(err))
                                } else {
                                    isNotEmptyAppDataSub[filename] = items.length ? true : false
                                }
                                deferred.resolve()
                            })
                        }
                    })

                    return deferred.promise
                })
            })

            chain = chain.then(function () {
                deferred.resolve()
            })

            return deferred.promise
        })

        // 处理 data 目录下的文件
        // 解压缩所有 .nwjs-data 文件
        .then(() => {
            let chain = Q()
            let deferred = Q.defer()

            fileListData.forEach(filename => {
                chain = chain.then(() => {
                    console.log(filename)
                    let deferred = Q.defer()
                    let pathParse = path.parse(path.join(dirData, filename), filename)

                    switch (pathParse['ext']) {
                        case '.nwjs-data':
                            unzip(pathParse, deferred)
                            break;
                        default:
                            deferred.resolve()
                            break;
                    }

                    // 存储数据包版本号至 localStorage
                    localStorage['nwjs-data-version'] = JSON.stringify(curVer)
                    return deferred.promise
                })
            })

            chain = chain.then(function () {
                deferred.resolve()
            })

            return deferred.promise
        })

        // 根据 package-app.json 运行程序
        .then(() => {
            console.log('finished')
            // return false
            let deferred = Q.defer()

            // 载入 package-app.json
            let options = jf.readFileSync('./package-app.json')

            console.log(
                'exist options: ', JSON.stringify(options)
            )

            options["window"]["focus"] = true
            if (appDataUpdated)
                options["dataUpdated"] = appDataUpdatList

            let max_width = Math.min(options["window"]["max_width"] || screen.availWidth, screen.availWidth)
            let max_height = Math.min(options["window"]["max_height"] || screen.availHeight, screen.availHeight)

            delete (options["window"]["max_width"])
            delete (options["window"]["max_height"])

            options["window"]["min_width"]
                = Math.min(options["window"]["min_width"] || 0, max_width)
            options["window"]["min_height"]
                = Math.min(options["window"]["min_height"] || 0, max_height)

            options["window"]["width"]
                = Math.min(options["window"]["width"] || screen.availWidth, max_width)
            options["window"]["height"]
                = Math.min(options["window"]["height"] || screen.availHeight, max_height)

            // Platform
            let platformOverrides = options['platformOverrides'] || {}
            console.log(
                'platformOverrides: ', JSON.stringify(platformOverrides)
            )
            if (/^win[0-9]+/i.test(process.platform)) {
                deepExtend(options, platformOverrides['win'] || {})
                if (process.arch == 'x64') {
                    deepExtend(options, platformOverrides['win64'] || {})
                } else {
                    deepExtend(options, platformOverrides['win32'] || {})
                }
            } else if (/^darwin/i.test(process.platform)) {
                deepExtend(options, platformOverrides['osx'] || {})
                if (process.arch == 'ia64') {
                    deepExtend(options, platformOverrides['osx64'] || {})
                } else {
                    deepExtend(options, platformOverrides['osx32'] || {})
                }
            } else if (/^Linux/i.test(process.platform)) {
                deepExtend(options, platformOverrides['linux'] || {})
                if (process.arch == 'x64') {
                    deepExtend(options, platformOverrides['linux64'] || {})
                } else {
                    deepExtend(options, platformOverrides['linux32'] || {})
                }
            }

            console.log(
                'new options: ', JSON.stringify(options)
            )
            // return false;

            // 开始新的 nw.js 进程
            var appWin = gui.Window.open(
                'file://' + path.join(dirAppData, options.main),
                options['window']
            )

            // 在 App 窗口载入后，隐藏 luancher 进程
            appWin.on('loaded', function () {
                launcher.hide()
                deferred.resolve()
            })

            // 在 App 窗口关闭时，终结原 nw.js 进程 (launcher 进程)
            appWin.on('closed', function () {
                launcher.close()
            })

            return deferred.promise
        })
})()