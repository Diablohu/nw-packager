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
            node.jsonfile.writeFileSync(packageJSON_path, packageJSON)
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
