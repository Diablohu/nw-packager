
_frame.app_main.processing_running = false
_frame.app_main.processing_launcher_files = false

_frame.app_main.processing_init = function( wrapper ){
    _g.gen_title( 'h2', 'Packaging...' ).appendTo( wrapper )

    _frame.app_main.processing_dombody = wrapper.parent()
    _frame.app_main.processing_domwrapper = wrapper
    _frame.app_main.processing_domlog = $('<div class="log"/>').appendTo( wrapper )
}


_frame.app_main.processing_on = function(){
    console.log( 'processing: ON' )

    // 如果 package_path 变量非法，表明项目目录未正确选择，以下步骤不予执行
    // 如果正在运行，则不予执行
        if( !package_path || _frame.app_main.processing_running )
            return false

    _frame.app_main.processing_running = true

    var zipped_files 	= []
        ,zip_folder 	= node.path.join( node.gui.App.dataPath, '/___zip___' )
        ,__options 		= {}
        ,promise_chain 	= Q.fcall(function(){})
    
    // 处理路径
        function parsePath( path ){
            if( path.substr(0, 1) == '.' || path.substr(0, 2) == './' )
                path = node.path.join( package_path, path )
            return path.replace(/\\/g, '/')
        }

    // 如果使用 Launcher
        function step_launcher( next_step ){
            var promise_chain_launcher 	= Q.fcall(function(){});
            function step_launcher_init(){
                var def = Q.defer();
                // 将原始的 package.json 重命名为 package-app.json
                    _frame.app_main.processing_launcher_files = true
                    node.fs.renameSync(
                        node.path.join(package_path, 'package.json'),
                        node.path.join(package_path, 'package-app.json')
                    )
                    _frame.app_main.processing_log('package.json renamed to package-app.json.');

                // 如果有 Splash，复制
                    if( builderOptions['launcherSplash'] ){
                        node['fs-extra'].copy(
                            parsePath( builderOptions['launcherSplash'] )
                            , node.path.join( package_path, '/____launcher____' )
                            , function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                                _frame.app_main.processing_log('launcher splash image copied.');
                                def.resolve(err)
                            }
                        );
                    }

                return def.promise;
            }

            function step_launcher_copy( _next_step ){
                var deferred = Q.defer();
                _frame.app_main.processing_log('copying launcher related files...');
                node['fs-extra'].copy(
                    node.path.join( _g.root, '/app/launcher' )
                    , package_path
                    , function (err) {
                        if (err) {
                            return console.error(err);
                        }
                        _frame.app_main.processing_log('launcher related files copied.');

                        // 处理新的 package.json
                            new_packageJSON = node.jsonfile.readFileSync( node.path.join( package_path, '/package.json' ) )
                            new_packageJSON['name'] = packageJSON['name']
                            new_packageJSON['version'] = packageJSON['version']
                            new_packageJSON['window']['icon'] = packageJSON['window']['icon']
                            // 根据Splash图片的大小修改尺寸数据
                                if( _frame.app_main.launcher_splash_size.width && _frame.app_main.launcher_splash_size.height ){
                                    var max_width = parseInt( new_packageJSON['window']['width'] )
                                        ,max_height = parseInt( new_packageJSON['window']['height'] )
                                    if( _frame.app_main.launcher_splash_size.width >= _frame.app_main.launcher_splash_size.height ){
                                        new_packageJSON['window']['height'] = Math.floor( max_width * _frame.app_main.launcher_splash_size.height / _frame.app_main.launcher_splash_size.width )
                                    }else{
                                        new_packageJSON['window']['width'] = Math.floor( max_height * _frame.app_main.launcher_splash_size.width / _frame.app_main.launcher_splash_size.height )
                                    }
                                    //console.log( new_packageJSON['window']['width'], new_packageJSON['window']['height'] )
                                }
                            node.jsonfile.writeFileSync(
                                node.path.join( package_path, '/package.json' ),
                                new_packageJSON, {
                                    spaces: 2
                                }
                            )

                        deferred.resolve(err)
                    }
                );

                return deferred.promise;
            }

            // 修改 launcher HTML 文件的标题为程序名
            function step_launcher_htmltitle(){
                var deferred 	= Q.defer()
                    ,file 		= node.path.join( package_path, '____launcher____.html' )
                node.fs.readFile(file, 'utf8', function (err,data) {
                    if (err) {
                        deferred.reject(new Error(error));
                        return console.log(err);
                    }
                    var result = data.replace('<title>____TITLE____</title>', '<title>' + packageJSON['name'] + '</title>');

                    node.fs.writeFile(file, result, 'utf8', function (err) {
                        if (err) {
                            deferred.reject(new Error(error));
                            return console.log(err);
                        }
                        deferred.resolve()
                    });
                });
                return deferred.promise
            }

            function step_launcher_createfolder(){
                return node['fs-extra'].mkdirp(zip_folder)
            }

            function step_launcher_zip( _next_step ){
                var the_promises = [];

                builderOptions['dataRelative'].forEach(function(name) {
                    var deferred 	= Q.defer()
                        ,zip 		= new node.archiver('zip',{
                                            'comment': 	builderOptions['dataVersion'][name]
                                        })
                        ,zipfile 	= node.path.join( zip_folder, name + '.nwjs-data' )
                        ,stream 	= node.fs.createWriteStream(zipfile)
                                        .on('finish',function(err){
                                            _frame.app_main.processing_log(name + '.nwjs-data generated.')
                                            deferred.resolve(err);
                                        })
                    zip.directory(
                        node.path.join(package_path, '/' + name),
                        name
                    );
                    zip.pipe( stream )
                    zip.finalize();
                    zipped_files.push( zipfile )

                    the_promises.push(deferred.promise);
                });

                return Q.all(the_promises);
            }

            if( builderOptions['enableLauncher'] ){
                return promise_chain_launcher
                    .then( step_launcher_init )
                    .then( step_launcher_copy )
                    .then( step_launcher_htmltitle )
                    .then( step_launcher_createfolder )
                    .then( step_launcher_zip )
                    .then( function(){
                        _frame.app_main.processing_log('launcher fin.');
                        return promise_chain_launcher.done()
                    })
            }else{
                return promise_chain_launcher.fin()
            }
        }

    // 处理选项
        function step_parse_options(){
            $.extend(__options, builderOptions)

            // files，编译文件列表
            // glob 格式
                //__options['files'] = package_path.replace(/\\/g, '/') + '/**'
                __options['files'] = []
                for( var i in __options['filesRelative'] ){
                    __options['files'].push(
                        node.path.join(package_path, '/' + __options['filesRelative'][i]).replace(/\\/g, '/')
                            + ( $.inArray(__options['filesRelative'][i], _frame.app_main.files_select_folders) > -1 ? '/**' : '' )
                    )
                }
                if( builderOptions['enableLauncher'] ){
                    __options['files'].push( node.path.join(package_path, '/____launcher____.html').replace(/\\/g, '/') )
                    __options['files'].push( node.path.join(package_path, '/____launcher____.js').replace(/\\/g, '/') )
                    __options['files'].push( node.path.join(package_path, '/package-app.json').replace(/\\/g, '/') )
                    if( builderOptions['launcherSplash'] ){
                        __options['files'].push( node.path.join(package_path, '/____launcher____').replace(/\\/g, '/') )
                    }
                }

            // 遍历选项，处理其他 glob 格式
                for( var i in __options ){
                    switch( i ){
                        case 'buildDir':
                        case 'macIcns':
                        case 'winIco':
                            __options[i] = parsePath( __options[i] )
                            break;
                    }
                }

            // 删除 nwbuild 不使用的项目
                delete __options['enableLauncher']
                delete __options['launcherSplash']
                delete __options['filesRelative']
                delete __options['dataRelative']
                delete __options['dataVersion']

            // Log
                console.log( __options )

            // 执行下一步
                return true
        }

    // 使用 node-webkit-builder 进行编译
        function step_build(){
            var targetDir = node.path.join( builderOptions['buildDir'], packageJSON['name'] )
                ,deferred = Q.defer()

            // 清除目标目录，弱不存在则建立
                node['fs-extra'].emptyDirSync( targetDir )

            _frame.app_main.processing_log('NwBuilder target directory ready.');
            _frame.app_main.processing_log('NwBuilder building...');

            var builder = new NwBuilder(__options);
            //Log stuff you want
                builder.on('log', _frame.app_main.processing_log);
                //builder.on('log', console.log);
            // Build returns a promise
                builder.build().then(function () {
                    _frame.app_main.processing_log('builder done!');
                    deferred.resolve()
                }).catch(function (error) {
                    console.error(error);
                    deferred.reject(new Error(error));
                });

            // 下一步
                return deferred.promise;
        }

    // “善后”处理
        function step_last_deletelauncher_promise(){
            // 删除 launcher 相关文件
                if( _frame.app_main.processing_launcher_files ){
                    var the_promises = []
                        ,arr = [
                            '____launcher____',
                            '____launcher____.html',
                            'package.json'
                        ]
                    arr.forEach(function( file ) {
                        var deferred 	= Q.defer()

                        node['fs-extra'].remove(
                            node.path.join(package_path, file),
                            function(err){
                                deferred.resolve(err)
                            }
                        )

                        the_promises.push(deferred.promise);
                    });

                    return Q.all(the_promises);
                }else{
                    return true
                }
        }
        function step_last_renamebacklauncher_promise(){
            // 将原始的 package-app.json 重命名为 package.json
                if( _frame.app_main.processing_launcher_files ){
                    var deferred 	= Q.defer()
                    node.fs.rename(
                        node.path.join(package_path, 'package-app.json'),
                        node.path.join(package_path, 'package.json'),
                        function(err){
                            deferred.resolve(err);
                            _frame.app_main.processing_launcher_files = false
                            _frame.app_main.processing_log('package-app.json renamed back to package.json.');
                        }
                    )
                    return deferred.promise;
                }else{
                    return true
                }
        }
        function step_last(){
            var promise_chain_step 	= Q.fcall(function(){});

            if( builderOptions['enableLauncher'] ){
                promise_chain_step = promise_chain_step
                    .then(step_last_deletelauncher_promise)
                    .then(function(){
                        var deferred 	= Q.defer()
                        _frame.app_main.processing_log('launcher related files deleted.');
                        deferred.resolve();
                        return deferred.promise
                    })
                    .then(function(){
                        // 复制数据文件
                            if( zipped_files.length ){
                                var the_promises = []
                                __options['platforms'].forEach(function( platform ) {
                                    var deferred 	= Q.defer()
                                        ,copy_to	= node.path.join(
                                                            builderOptions['buildDir']
                                                            , packageJSON['name']
                                                            , platform
                                                            , 'data'
                                                        )
                                    switch( platform ){
                                        case 'osx32':
                                        case 'osx64':
                                            copy_to = node.path.join(
                                                        builderOptions['buildDir']
                                                        , packageJSON['name']
                                                        , platform
                                                        , packageJSON['name'] + '.app'
                                                        , 'Contents/Resources/app.nw'
                                                        , 'data'
                                                    )
                                            break;
                                    }
                                    node['fs-extra'].copy(
                                        zip_folder,
                                        copy_to,
                                        function(err){
                                            deferred.resolve(err);
                                            _frame.app_main.processing_log('data files copied for ' + platform + '.');
                                        }
                                    )

                                    the_promises.push(deferred.promise);
                                });
                                return Q.all(the_promises);
                            }else{
                                return Q()
                            }
                    })
                    .then(function(){
                        // 删除数据压缩包工作目录
                            return node['fs-extra'].remove(
                                zip_folder
                            )
                    })
                    .then(step_last_renamebacklauncher_promise)
            }

            return promise_chain_step
                .then(function(){
                    _frame.app_main.processing_log('All process completed!', 'complete');
                    _frame.app_main.processing_running = false
                    return promise_chain_step.done()
                })
        }


    // 开始流程
        promise_chain
            .then( step_launcher )
            .then( step_parse_options )
            .then( step_build )
            .then( step_last )
            .catch( function(err){
                console.log(err)
                var restore_promise_chain = Q.fcall(function(){})
                    .then(step_last_deletelauncher_promise)
                    .then(step_last_renamebacklauncher_promise)
            } )
}



_frame.app_main.processing_log = function( content, className ){
    console.log( content )

    var now = new Date()
        ,allLines = _frame.app_main.processing_domlog.children('p')

    if( allLines.length > 100 )
        allLines.eq(0).remove()

    _frame.app_main.processing_domlog
        .append(
            $('<p/>').html(
                '<em>'+_g.formatTime(new Date(), '%H:%i:%s')+'</em>'
                + '<span>'+content+'</span>'
            ).addClass( className )
        )

    _frame.app_main.processing_dombody.scrollTop(_frame.app_main.processing_domwrapper[0].clientHeight)
}