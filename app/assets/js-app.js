// node.js modules
    node.require('mkdirp')
    node.require('jsonfile')
    node.require('rimraf')
    node.require('fs-extra')
    node.require('archiver')
    node.require('request')
    node.require('semver')

    var NwBuilder 	= node.require('node-webkit-builder')
        ,glob 		= node.require('simple-glob')
        ,Q			= node.require('Q')





// Global Variables
    _g.animate_duration_delay = 320;

    _g.path = {}

    _g.pathMakeObj = function(obj){
        for( var i in obj ){
            if( typeof obj[i] == 'object' ){
                _g.pathMakeObj( obj[i] )
            }else{
                node.mkdirp.sync( obj[i] )
            }
        }
    }
    _g.pathMakeObj( _g.path )

    _g.nwjsVersions = [
            'latest',
            '0.12.0'
        ]
















// Global Functions
    _g.gen_title = function( tagName, content ){
        return $('<'+tagName+' data-content="'+content+'"/>').html(content)
    }
    _g.gen_input = function(type, name, id, value, options){
        options = options || {}
        switch( type ){
            case 'text':
            case 'number':
            case 'hidden':
                var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').val(value)
                break;
            case 'select':
                var input = $('<select name="'+name+'" id="'+id+'" />')
                var option_empty = $('<option value=""/>').html('').appendTo( input )
                for( var i in value ){
                    if( typeof value[i] == 'object' ){
                        var o_el = $('<option value="' + (typeof value[i].val == 'undefined' ? value[i]['value'] : value[i].val) + '"/>')
                            .html(value[i]['title'] || value[i]['name'])
                            .appendTo( input )
                    }else{
                        var o_el = $('<option value="' + value[i] + '"/>')
                            .html(value[i])
                            .appendTo( input )
                    }
                    if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
                        o_el.prop('selected', true)
                    }
                    if( !o_el.val() ){
                        o_el.attr('disabled', true)
                    }
                }
                if( !value || !value.length ){
                    option_empty.remove()
                    $('<option value=""/>').html('...').appendTo( input )
                }
                if( options['new'] ){
                    $('<option value="" disabled/>').html('==========').insertAfter( option_empty )
                    $('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
                    input.on('change.___new___', function(){
                        var select = $(this)
                        if( select.val() == '___new___' ){
                            select.val('')
                            options['new']( input )
                        }
                    })
                }
                break;
            case 'select_group':
                var input = $('<select name="'+name+'" id="'+id+'" />')
                var option_empty = $('<option value=""/>').html('').appendTo( input )
                for( var i in value ){
                    var group = $('<optgroup label="'+value[i][0]+'"/>').appendTo( input )
                    for( var j in value[i][1] ){
                        var _v = value[i][1][j]
                        if( typeof _v == 'object' ){
                            var o_el = $('<option value="' + (typeof _v.val == 'undefined' ? _v['value'] : _v.val) + '"/>')
                                .html(_v['title'] || _v['name'])
                                .appendTo( group )
                        }else{
                            var o_el = $('<option value="' + _v + '"/>')
                                .html(_v)
                                .appendTo( group )
                        }
                        if( typeof options['default'] != 'undefined' && o_el.val() == options['default'] ){
                            o_el.prop('selected', true)
                        }
                        if( !o_el.val() ){
                            o_el.attr('disabled', true)
                        }
                    }
                }
                if( !value || !value.length ){
                    option_empty.remove()
                    $('<option value=""/>').html('...').appendTo( input )
                }
                if( options['new'] ){
                    $('<option value="" disabled/>').html('==========').insertAfter( option_empty )
                    $('<option value="___new___"/>').html('+ 新建').insertAfter( option_empty )
                    input.on('change.___new___', function(){
                        var select = $(this)
                        if( select.val() == '___new___' ){
                            select.val('')
                            options['new']( input )
                        }
                    })
                }
                break;
            case 'checkbox':
                var input = $('<input type="'+type+'" name="'+name+'" id="'+id+'" />').prop('checked', value)
                break;
            case 'checkboxes':
                var input = $()
                for( var i in value ){
                    var v = value[i]
                    if( typeof v != 'object' )
                        v = [v, false]

                    if( parseInt(i) ){
                        _g.inputIndex++
                        id = '_input_g' + _g.inputIndex
                    }

                    input = input.add(
                                $('<input type="checkbox" name="'+name+'" id="'+id+'" value="'+v[0]+'" />').prop('checked', v[1])
                            ).add(
                                $('<label for="'+id+'"/>').html(v[2] || v[0])
                            )
                }
                break;
            case 'directory':
            case 'file':
                var fileinput 	= $('<input type="file" class="none"' +(type == 'directory' ? ' nwdirectory' : '')+ ' />')
                                    .on('change', function(){
                                        input.val( $(this).val() ).trigger('change')
                                    })
                    ,input 		= $('<input type="text" name="'+name+'" id="'+id+'" />')
                                    .on({
                                        'input': function(){
                                            input.trigger('change')
                                        },
                                        'click': function(){
                                            if( !input.val() )
                                                button.trigger('click')
                                        }
                                    }).val(value)
                    ,button 	= $('<button type="button" value="Browse..."/>').html('Browse...')
                                    .on('click', function(){
                                        //console.log(123)
                                        //if( type == 'file' )
                                            fileinput.trigger('click')
                                    })
                    ,inputAll	= input.add(fileinput).add(button)
                if( options['accept'] )
                    fileinput.attr('accept', options['accept'])
                break;
        }

        if( options.required ){
            input.prop('required', true)
        }

        if( options.onchange ){
            input.on('change.___onchange___', options.onchange )
            if( options['default'] )
                input.trigger('change')
        }

        if( !name )
            input.attr('name', null)

        if( inputAll )
            return inputAll

        return input
    }
    _g.gen_form_line = function(type, name, label, value, suffix, options){
        options = options || {}

        var line = $('<p/>').addClass(type, options.className)
            ,id = '_input_g' + _g.inputIndex

        switch( type ){
            case 'directory':
                $('<label/>').html( label ).appendTo(line)
                break;
            default:
                if( suffix ){
                    $('<label/>').html( label ).appendTo(line)
                }else{
                    $('<label for="'+id+'"/>').html( label ).appendTo(line)
                }
                break;
        }

        _g.gen_input(type, name, id, value, options).appendTo(line)

        if( suffix )
            $('<label for="'+id+'"/>').html(suffix).appendTo(line)

        if( options.add )
            line.append( options.add )

        _g.inputIndex++
        return line
    }

    var builderOptions = {
                'version': 		'latest',
                'platforms': 	['osx32', 'osx64', 'win32', 'win64'],
                'filesRelative':['node_modules', 'package.json'],
                'dataVersion': 	{}
            }
        ,packageJSON = {}
        ,package_path = null
        ,packageJSON_path = null
    _g.update_options = function( obj, overrite ){
        if( overrite )
            $.extend( builderOptions, obj )
        else
            $.extend( true, builderOptions, obj )

        // 如果存在 packageJSON_path，并且允许将选项写入，在此写入
        if( packageJSON_path && _frame.app_main.option_save ){
            packageJSON['nw-packager'] = builderOptions
            node.jsonfile.writeFileSync(packageJSON_path, packageJSON, {
                spaces: 2
            })
        }
    }

    // 遍历全部选项项目，初始化所有页面上的可操作内容
        _g.init_options = function( obj ){
            $.extend( true, builderOptions, obj )
            for( var i in builderOptions ){
                console.log( i, builderOptions[i] )
                switch(i){
                    //case 'buildDir':
                    //case 'launcherSplash':
                    //case 'macIcns':
                    //case 'winIco':
                    //	_frame.app_main.fields[i].children('input[type="text"]')
                    //		.val(builderOptions[i])
                    //		.trigger('change')
                    //	break;
                    case 'enableLauncher':
                        _frame.app_main.fields[i].children('input[type="checkbox"]')
                            .prop('checked', builderOptions[i])
                            .trigger('change')
                        break;
                    case 'platforms':
                        _frame.app_main.fields[i].children('input[value="' + builderOptions[i].join('"],[value="') + '"]')
                            .prop('checked', true)
                            .trigger('change')
                        break;
                    case 'version':
                        if( _g.nwjsVersions.indexOf(builderOptions[i]) < 0 ){
                            // 已存储的nwjs版本号不在 _g.nwjsVersions 中
                            _frame.app_main.fields['version'].find('select')
                                .prepend(
                                    $('<optgroup label="Project selected"/>').append(
                                        $('<option>',{
                                            'value':    builderOptions[i],
                                            'html':     builderOptions[i],
                                            'checked':  true
                                        })
                                    )
                                )
                                .val(builderOptions[i])
                        }
                        break;
                    default:
                        if(_frame.app_main.fields[i] && _frame.app_main.fields[i].children){
                            _frame.app_main.fields[i].children('input[type="text"],select')
                                .val(builderOptions[i])
                                .trigger('change')
                        }
                        break;
                }
            }
            if( packageJSON['window']['icon'] )
                _frame.app_main.fields['menifest_window_icon'].children('input[type="text"]')
                    .val(packageJSON['window']['icon'])
        }

    // 判断与主目录 (package_path) 的相对情况
    // 如果为主目录的子目录/文件，则返回相对路径，否则返回 false
        _g.relative_path = function( path_to_check ){
            if( path_to_check.substr(0, 1) == '.' || path_to_check.substr(0, 2) == './' )
                return path_to_check
            
            var relative = node.path.relative(package_path, node.path.normalize(path_to_check))

            if( !/^[A-Za-z]\:/.test(relative) && !/^[\.]{2}/.test(relative) )
                return './' + relative.replace(/\\/g, '/')

            return node.path.normalize( path_to_check )
        }
















// Global Frame
_frame.app_main = {
    steps: [],

    // 是否存储选项至 package.json
        option_save: typeof _config.get('option_save') == 'undefined' ? true : (_config.get('option_save') == 'false' ? false : _config.get('option_save') ),

    // 所有相关选项的 input/textarea/select 行元素
        fields: {},

    // 获取当前为第几步
        step_cur: function(){
            return parseInt( _frame.dom.global_steps.filter(':checked').val() )
        },
    // 上一步
        step_prev: function(){
            _frame.app_main.step_goto( _frame.app_main.step_cur() - 1 )
        },
    // 下一步
        step_next: function(){
            _frame.app_main.step_goto( _frame.app_main.step_cur() + 1 )
        },
    // 跳到第n步
        step_goto: function( step ){
            // 处理当前步骤的结果
            // 如果返回false，不进行跳步操作
                var result = true
                try{
                    result = _frame.app_main[ _frame.app_main.steps[_frame.app_main.step_cur() - 1] + '_submit' ]()
                }catch(e){}

            if( !result )
                return false

            step = step || 1
            if( step < 1 )
                step = 1
            else if( step > _frame.dom.global_steps.length )
                step = _frame.dom.global_steps.length

            var input = _frame.dom.global_steps.filter('[value="'+step+'"]')
            input.prop('checked',true)
                .trigger('change', [input])
        },
    // 步骤完成
        step_changed: function( input ){
            if( input.val() == 1 )
                _frame.dom.footer_prev.addClass('disabled')
            else
                _frame.dom.footer_prev.removeClass('disabled')

            if( input.val() == _frame.dom.global_steps.length )
                _frame.dom.footer_next.addClass('disabled')
            else
                _frame.dom.footer_next.removeClass('disabled')

            try{
                _frame.app_main[ _frame.app_main.steps[parseInt(input.val())-1] + '_on' ]()
            }catch(e){}
        },

    init: function(){
        if( _frame.app_main.is_init )
            return true

        // 创建基础框架
            _frame.dom.header = $('<header/>').appendTo( _frame.dom.layout )
                _frame.dom.title = $('<h1/>').html('NW-PACKAGER').appendTo( _frame.dom.header )
                _frame.dom.steps = $('<div class="steps"/>').appendTo( _frame.dom.header )
            _frame.dom.main = $('<main/>').appendTo( _frame.dom.layout )
                _frame.dom.main_wrapper = $('<div class="wrapper"/>').appendTo( _frame.dom.main )
            _frame.dom.footer = $('<footer/>').appendTo( _frame.dom.layout )
                _frame.dom.footer_prev = $('<button class="prev"/>').on('click',function(e){
                                                if( !$(e.target).hasClass('disabled') )
                                                    _frame.app_main.step_prev()
                                            }).html('Prev').appendTo( _frame.dom.footer )
                _frame.dom.footer_next = $('<button class="next"/>').on('click',function(e){
                                                if( !$(e.target).hasClass('disabled') )
                                                    _frame.app_main.step_next()
                                            }).html('Next').appendTo( _frame.dom.footer )
            _frame.dom.global_steps = $()

            //if( debugmode )
            //	_frame.dom.debug_step_switcher = $('<div class="debug_step_switcher"/>').html('<h3>Step Switcher</h3>').appendTo( $body )

        // 创建步骤相关DOM
            for( var i in _frame.app_main.steps ){
                var num = parseInt(i)
                    ,id = 'global_steps_'+(num+1)

                _frame.dom.global_steps = _frame.dom.global_steps.add(
                    $('<input class="none" type="radio" name="global_steps" id="'+id+'" value="'+(num+1)+'"/>')
                        .prop('checked', i==0)
                        .on('change', function(e, input){
                            input = input || $(e.target)
                            if( input.prop('checked') )
                                _frame.app_main.step_changed( input )
                        })
                        .prependTo( _frame.dom.layout )
                    )

                $('<span data-step="'+(num+1)+'"/>').appendTo( _frame.dom.steps )

                var body = $('<div data-step="'+(num+1)+'"/>').appendTo( _frame.dom.main_wrapper )
                    ,wrapper = $('<div class="wrapper"/>').appendTo( body )

                try{
                    _frame.app_main[ _frame.app_main.steps[i] + '_init' ]( wrapper )
                }catch(e){}

                if( _frame.dom.debug_step_switcher && _frame.dom.debug_step_switcher.length )
                    $('<label for="'+id+'"/>')
                        .html((num+1))
                        .appendTo( _frame.dom.debug_step_switcher )
            }
            _frame.app_main.step_changed( _frame.dom.global_steps.filter(':checked') )

        _frame.app_main.is_init = true
    }
}

_frame.app_main.project_select_init = function( wrapper ){
    _g.gen_title( 'h2', 'Select directory' ).appendTo( wrapper )

    _frame.app_main.project_select_form = $('<form/>')
                .on('submit',function(e){
                    _frame.app_main.project_select_submit()
                    e.preventDefault()
                }).appendTo(wrapper)

    _frame.app_main.fields['project_directory']
        = _g.gen_form_line(
            'directory',
            'project_directory',
            'Project directory',
            null,
            null,
            {
                'required': 	true,
                'add': 			$('<span class="msg"/>'),
                'onchange': 	function(e){
                    var input = $(e.target)
                        ,file = node.path.join( input.val(), '/package.json' )
                        
                    function pass(){
                        package_path = input.val()
                        packageJSON_path = file
                        _frame.app_main.fields['project_directory'].removeClass('error')
                        _frame.app_main.fields['project_directory'].children('.msg').html('')
                        // read package.json for "nw-package"
                            packageJSON = node.jsonfile.readFileSync(file)
                            _g.init_options( packageJSON['nw-packager'] || {} )
                    }
                    
                    function fail(){
                        package_path = null
                        packageJSON_path = null
                        packageJSON = {}
                        _frame.app_main.fields['project_directory'].addClass('error')
                        _frame.app_main.fields['project_directory'].children('.msg')
                                .html('No package.json file found. Please make sure locating a valid NW.js project directory.')
                    }
                    
                    try{
                        var stat = node.fs.lstatSync( file )
                        if( stat && stat.isFile() ){
                            pass()
                        }else{
                            fail()
                        }
                    }catch(e){
                        fail()
                    }
                }
            }
        ).appendTo( _frame.app_main.project_select_form )

    _frame.app_main.fields['buildDir']
        = _g.gen_form_line(
            'directory',
            'buildDir',
            'Build output directory',
            null,
            null,
            {
                'required': 	true,
                'onchange': 	function(e){
                    /*
                    var input = $(e.target)
                        ,val = _g.relative_path(input.val())
                    input.val( val )
                    */
                    _g.update_options({
                        'buildDir': 	node.path.normalize( $(e.target).val() )
                    })
                }
            }
        ).appendTo( _frame.app_main.project_select_form )

    _frame.app_main.fields['save_to_packagejson']
        = _g.gen_form_line(
            'checkbox',
            'save_to_packagejson',
            'Preferances',
            _frame.app_main.option_save,
            'Save to package.json file',
            {
                'onchange': 	function(e){
                    _frame.app_main.option_save = $(e.target).prop('checked') ? true : false
                    _config.set('option_save', _frame.app_main.option_save)
                }
            }
        ).appendTo( _frame.app_main.project_select_form )
}



_frame.app_main.project_select_on = function(){
    console.log( 'project_select: ON' )
}



_frame.app_main.project_select_submit = function(){
    console.log( 'project_select: SUBMIT' )
    return !(_frame.app_main.project_select_form.find('.error').length)
}

_frame.app_main.nwbuild_options_init = function( wrapper ){
    _frame.app_main.nwbuild_options_form = $('<form/>')
                .on('submit',function(e){
                    _frame.app_main.nwbuild_options_submit()
                    e.preventDefault()
                }).appendTo(wrapper)

    // Menifest JSON
        _g.gen_title( 'h2', 'Menifest window object' ).appendTo( _frame.app_main.nwbuild_options_form )

        _frame.app_main.fields['menifest_window_icon']
            = _g.gen_form_line(
                'file',
                'menifest_window_icon',
                'PNG for icon, WINDOWS ONLY',
                null,
                null,
                {
                    'accept': 		'.png',
                    'onchange': 	function(e){
                        var input = $(e.target)
                            ,val = _g.relative_path(input.val())
                        input.val( val )
                        packageJSON['window']['icon'] = val
                        node.jsonfile.writeFileSync(packageJSON_path, packageJSON, {
                            spaces: 2
                        })
                    }
                }
            ).appendTo( _frame.app_main.nwbuild_options_form )

    // NwBuilder
        _g.gen_title( 'h2', 'NwBuilder options' ).appendTo( _frame.app_main.nwbuild_options_form )

        _frame.app_main.fields['version']
            = _g.gen_form_line(
                'select',
                'version',
                'NW.js version to build',
                _g.nwjsVersions,
                null,
                {
                    'default': 		'latest',
                    'onchange': 	function(e){
                        _g.update_options({
                            'version': 	$(e.target).val()
                        })
                    }
                }
            ).appendTo( _frame.app_main.nwbuild_options_form )

        // get nw.js versions
        // code from NwBuilder
            var searchRes
                ,scrapePtrn = /href="v?([0-9]+\.[0-9]+\.[0-9]+[^"]*)\/"/ig
                ,versions = []
            //<a href="v0.8.0/">
            node.request('http://dl.nwjs.io/', function(err, res, body){
                if( !err && res.statusCode == 200 ){
                    while( (searchRes = scrapePtrn.exec(body)) !== null ){
                        searchRes = searchRes[1]
                        if( node.semver.valid(searchRes) && $.inArray(searchRes, versions) < 0 ){
                            versions.push(searchRes)
                        }
                    }
                    versions = versions.sort(function(a,b){ return node.semver.compare(b,a); })
                }

                if( versions.length ){
                    let select = _frame.app_main.fields['version'].children('select')
                        ,group = $('<optgroup label="Available versions"/>').appendTo( select )
                    versions.splice(0, 0, 'latest')
                    if( versions.length ){
                        group.empty()
                        select.children('option').remove()
                    }
                    for( let i in versions ){
                        $('<option value="' + versions[i] + '"/>')
                            .html(versions[i])
                            .appendTo( group )
                    }
                }
            })

        _frame.app_main.fields['platforms']
            = _g.gen_form_line(
                'checkboxes',
                'platforms',
                'Platforms to build',
                [
                    ['win32', true],
                    ['win64', true],
                    ['osx32', true],
                    ['osx64', true],
                    ['linux32', false],
                    ['linux64', false]
                ],
                null,
                {
                    'onchange': 	function(e){
                        var value = []
                        _frame.app_main.fields['platforms'].children('input[name="platforms"]:checked').each(function(){
                            value.push( $(this).val() )
                        })
                        _g.update_options({
                            'platforms': 	value
                        }, true)
                    }
                }
            ).appendTo( _frame.app_main.nwbuild_options_form )

        // appName
            // overrite original ?

        // appVersion
            // overrite original ?

        // buildType

        // macCredits

        _frame.app_main.fields['macIcns']
            = _g.gen_form_line(
                'file',
                'macIcns',
                'ICNS for icon, MAC ONLY',
                null,
                null,
                {
                    'accept': 		'.icns',
                    'onchange': 	function(e){
                        var input = $(e.target)
                            ,val = _g.relative_path(input.val())
                        input.val( val )
                        _g.update_options({
                            'macIcns': 	val
                        })
                    }
                }
            ).appendTo( _frame.app_main.nwbuild_options_form )

        // macZip

        // macPlist

        _frame.app_main.fields['winIco']
            = _g.gen_form_line(
                'file',
                'winIco',
                'ICO for icon, WINDOWS ONLY',
                null,
                null,
                {
                    'accept': 		'.ico',
                    'onchange': 	function(e){
                        var input = $(e.target)
                            ,val = _g.relative_path(input.val())
                        input.val( val )
                        _g.update_options({
                            'winIco': 	val
                        })
                    }
                }
            ).appendTo( _frame.app_main.nwbuild_options_form )

        // platformOverrides

}



_frame.app_main.nwbuild_options_on = function(){
    console.log( 'nwbuild_options: ON' )
}



_frame.app_main.nwbuild_options_submit = function(){
    console.log( 'nwbuild_options: SUBMIT' )
    return true
}

/*
 * 步骤: Launcher 选项
 *
 * LAUNCHER *************************************************
 * 一个简易的启动器
 * 在启动时会将“数据包”解压缩到用户目录
 * 如果选择启用 Launcher 的选项，在该步骤时可以选择哪些文件夹为“数据包”
 * 这些数据包不会被编译入可执行文件，而是各自压缩为ZIP文件，放在最终程序的 data 目录下
 *
 */

_frame.app_main.launcher_splash_size = {width: 0, height: 0}

_frame.app_main.launcher_options_init = function( wrapper ){
    _g.gen_title( 'h2', 'Launcher' ).appendTo( wrapper )

    _frame.app_main.launcher_options_form = $('<form class="launcher_options"/>')
                .on('submit',function(e){
                    e.preventDefault()
                }).appendTo(wrapper)

    _frame.app_main.fields['enableLauncher']
        = _g.gen_form_line(
            'checkbox',
            'enableLauncher',
            'Enable launcher',
            builderOptions['enableLauncher'],
            'Enable to use launcher, which will extract Data Package to user folder when app launching. You can choose directories for Data Packages in next step.'
                + '<br />Data Packages will not be compiled, but to be zipped and be placed alongside final program under DATA directory.'
                + '<br /><br />When enabled, NW-Packager will install following node.js modules to original project:'
                + '<br /><em>adm-zip</em>, <em>jsonfile</em>, <em>mkdirp</em>, <em>q</em>',
            {
                'onchange': 	function(e){
                    var checked = $(e.target).prop('checked')
                    _g.update_options({
                        'enableLauncher': 	checked
                    })
                    if( checked )
                        _frame.app_main.files_select_table.addClass( 'enable_launcher' )
                    else
                        _frame.app_main.files_select_table.removeClass( 'enable_launcher' )
                }
            }
        ).appendTo( _frame.app_main.launcher_options_form )

    _frame.app_main.fields['launcherSplash']
        = _g.gen_form_line(
            'file',
            'launcherSplash',
            'Splash image',
            null,
            null,
            {
                'accept': 		'.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff',
                'onchange': 	function(e){
                    var input = $(e.target)
                        ,val = _g.relative_path(input.val())
                    input.val( val )
                    _g.update_options({
                        'launcherSplash': 	val
                    })
                    
                    let src = val.substr(0,1) == '.' ? node.path.join( package_path, val ) : val
                    _frame.app_main.launcher_options_splashimg.attr('src', src)
                }
            }
        ).appendTo( _frame.app_main.launcher_options_form )

    _frame.app_main.launcher_options_splashimg = $('<img/>')
        .on('load', function(e){
            if( _frame.app_main.launcher_options_splashimg.attr('src') ){
                _frame.app_main.launcher_splash_size = {
                    'width': 	e.target.naturalWidth,
                    'height': 	e.target.naturalHeight
                }
            }
        }).appendTo( _frame.app_main.launcher_options_form )
}



_frame.app_main.launcher_options_on = function(){
    console.log( 'launcher_options: ON' )
}



_frame.app_main.launcher_options_submit = function(){
    console.log( 'launcher_options: SUBMIT' )
    return true
}

/*
 * 步骤: 在项目目录中选择要编译的文件与文件夹
 *
 */

_frame.app_main.files_select_init = function( wrapper ){
	_g.gen_title( 'h2', 'Files for package' ).appendTo( wrapper )

	_frame.app_main.files_select_table = $('<table/>').appendTo(wrapper)
}



_frame.app_main.files_select_on = function(){
	// 每次进入该步骤时都会运行该函数
	console.log( 'data_select: ON' )

	// 清空表格，初始化表头
		_frame.app_main.files_select_table.html(
					'<thead>'
						+ '<tr>'
							+ '<th>Compile</th>'
							+ '<th class="datapackage">Data</th>'
							+ '<th></th>'
							+ '<th>Last Modified</th>'
						+ '</tr>'
					+ '<thead>'
				)

	// 初始化文件夹列表
	// 最终步骤时会检查该列表
		_frame.app_main.files_select_folders = []

	// 如果 package_path 变量非法，表明项目目录未正确选择，以下步骤不予执行
		if( !package_path )
			return false

	// 声明变量
		// list		项目目录下所有文件、文件夹的名称列表
		var list = node.fs.readdirSync(package_path)
			,folders = []
			,files = []
			,stats = {}
		_frame.app_main.files_select_checkbox_files = $()
		_frame.app_main.files_select_checkbox_data = $()

	// 遍历 list，确定项目为文件还是文件夹
		for( var i in list ){
			try{
				var stat = node.fs.lstatSync( node.path.join(package_path, list[i]) )
				if( stat ){
					stats[ list[i] ] = stat
					if( stat.isDirectory() ){
						folders.push( list[i] )
					}else if( stat.isFile() ){
						files.push( list[i] )
					}
				}
			}catch(e){}
		}

	// 排序
		folders.sort()
		files.sort()

	// 以下文件、文件夹为必定选择
		var filesRequired = ['node_modules', 'package.json']

	// 添加项目
	// name		项目名称
	// type		类型 file || folder
		function additem( name, type ){
			var row 	= $('<tr/>').appendTo( _frame.app_main.files_select_table )
				,mtime 	= new Date( stats[name].mtime )

				,checkbox_compile = $('<input type="checkbox" name="files" value="'+name+'"/>')
						.on('change', function(e){
							// 在任意 checkbox 更改时，即会更新全局选项中的 filesRelative
							// 该复选框与下一个复选框冲突
							var arr = []
							_frame.app_main.files_select_checkbox_files.filter(':checked').each(function(){
								arr.push( $(this).val() )
							})
							_g.update_options({
								'filesRelative': 	arr
							}, true)

							if( checkbox_compile.prop('checked') )
								checkbox_data.prop('checked', false).trigger('change')
						})
						.prop('checked', $.inArray(name, builderOptions.filesRelative) > -1)
						.prop('disabled', $.inArray(name, filesRequired) > -1)
						.appendTo( $('<th/>').appendTo(row) )
				,checkbox_data 	= $('<input type="checkbox" name="data" value="'+name+'"/>')
						.on('change', function(e){
							// 在任意 checkbox 更改时，即会更新全局选项中的 dataRelative
							// 该复选框与上一个复选框冲突
							var arr = []
							_frame.app_main.files_select_checkbox_data.filter(':checked').each(function(){
								arr.push( $(this).val() )
							})
							_g.update_options({
								'dataRelative': 	arr
							}, true)

							if( checkbox_data.prop('checked') ){
								checkbox_compile.prop('checked', false).trigger('change')
								row.addClass('isdatapackage')
							}else{
								row.removeClass('isdatapackage')
							}
						})
						.prop('checked', $.inArray(name, builderOptions.dataRelative) > -1)
						.prop('disabled', type=='file')
						.appendTo( $('<th class="datapackage"/>').appendTo(row) )

			if( checkbox_data.prop('checked') )
				row.addClass( 'isdatapackage' )

			_frame.app_main.files_select_checkbox_files = _frame.app_main.files_select_checkbox_files
				.add( checkbox_compile )
			_frame.app_main.files_select_checkbox_data = _frame.app_main.files_select_checkbox_data
				.add( checkbox_data )

			$('<td/>')
				.html('<span icon="'+type+'">'+name+'</span>')
				.append(
					$('<div/>').append(
						$('<input type="text" placeholder="Version"/>')
							.on('change', function(e){
								var d = {}
								d[name] = $(e.target).val()
								_g.update_options({
									'dataVersion': 	d
								})
							})
							.val( builderOptions.dataVersion[name] || '' )
					)
				)
				.appendTo(row)

			$('<td class="time"/>').html(mtime.toLocaleString()).appendTo(row)
		}

	for( var i in folders )
		additem( folders[i], 'folder' )

	for( var i in files )
		additem( files[i], 'file' )

	_frame.app_main.files_select_folders = folders
}



_frame.app_main.files_select_submit = function(){
	console.log( 'data_select: SUBMIT' )
	return true
}


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
                //builder.on('log', _frame.app_main.processing_log);
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