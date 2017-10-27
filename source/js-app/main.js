// node.js modules
node.require('mkdirp')
node.require('jsonfile')
node.require('rimraf')
node.require('fs-extra')
node.require('archiver')
node.require('request')
node.require('semver')

var NwBuilder = node.require('nw-builder')
    , glob = node.require('simple-glob')
    , Q = node.require('Q')





// Global Variables
_g.animate_duration_delay = 320;

_g.path = {}

_g.pathMakeObj = function (obj) {
    for (var i in obj) {
        if (typeof obj[i] == 'object') {
            _g.pathMakeObj(obj[i])
        } else {
            node.mkdirp.sync(obj[i])
        }
    }
}
_g.pathMakeObj(_g.path)

_g.nwjsVersions = [
    'latest',
    '0.12.0'
]
















// Global Functions
_g.gen_title = function (tagName, content) {
    return $('<' + tagName + ' data-content="' + content + '"/>').html(content)
}
_g.gen_input = function (type, name, id, value, options) {
    options = options || {}
    let input
    switch (type) {
        case 'text':
        case 'number':
        case 'hidden': {
            input = $('<input type="' + type + '" name="' + name + '" id="' + id + '" />').val(value)
            break;
        }
        case 'select': {
            input = $('<select name="' + name + '" id="' + id + '" />')
            const option_empty = $('<option value=""/>').html('').appendTo(input)
            let o_el
            for (const i in value) {
                if (typeof value[i] == 'object') {
                    o_el = $('<option value="' + (typeof value[i].val == 'undefined' ? value[i]['value'] : value[i].val) + '"/>')
                        .html(value[i]['title'] || value[i]['name'])
                        .appendTo(input)
                } else {
                    o_el = $('<option value="' + value[i] + '"/>')
                        .html(value[i])
                        .appendTo(input)
                }
                if (typeof options['default'] != 'undefined' && o_el.val() == options['default']) {
                    o_el.prop('selected', true)
                }
                if (!o_el.val()) {
                    o_el.attr('disabled', true)
                }
            }
            if (!value || !value.length) {
                option_empty.remove()
                $('<option value=""/>').html('...').appendTo(input)
            }
            if (options['new']) {
                $('<option value="" disabled/>').html('==========').insertAfter(option_empty)
                $('<option value="___new___"/>').html('+ 新建').insertAfter(option_empty)
                input.on('change.___new___', function () {
                    var select = $(this)
                    if (select.val() == '___new___') {
                        select.val('')
                        options['new'](input)
                    }
                })
            }
            break;
        }
        case 'select_group': {
            input = $('<select name="' + name + '" id="' + id + '" />')
            var option_empty = $('<option value=""/>').html('').appendTo(input)
            let o_el
            for (var i in value) {
                var group = $('<optgroup label="' + value[i][0] + '"/>').appendTo(input)
                for (var j in value[i][1]) {
                    var _v = value[i][1][j]
                    if (typeof _v == 'object') {
                        o_el = $('<option value="' + (typeof _v.val == 'undefined' ? _v['value'] : _v.val) + '"/>')
                            .html(_v['title'] || _v['name'])
                            .appendTo(group)
                    } else {
                        o_el = $('<option value="' + _v + '"/>')
                            .html(_v)
                            .appendTo(group)
                    }
                    if (typeof options['default'] != 'undefined' && o_el.val() == options['default']) {
                        o_el.prop('selected', true)
                    }
                    if (!o_el.val()) {
                        o_el.attr('disabled', true)
                    }
                }
            }
            if (!value || !value.length) {
                option_empty.remove()
                $('<option value=""/>').html('...').appendTo(input)
            }
            if (options['new']) {
                $('<option value="" disabled/>').html('==========').insertAfter(option_empty)
                $('<option value="___new___"/>').html('+ 新建').insertAfter(option_empty)
                input.on('change.___new___', function () {
                    var select = $(this)
                    if (select.val() == '___new___') {
                        select.val('')
                        options['new'](input)
                    }
                })
            }
            break;
        }
        case 'checkbox':
            input = $('<input type="' + type + '" name="' + name + '" id="' + id + '" />').prop('checked', value)
            break;
        case 'checkboxes': {
            input = $()
            for (const i in value) {
                var v = value[i]
                if (typeof v != 'object')
                    v = [v, false]

                if (parseInt(i)) {
                    _g.inputIndex++
                    id = '_input_g' + _g.inputIndex
                }

                input = input.add(
                    $('<input type="checkbox" name="' + name + '" id="' + id + '" value="' + v[0] + '" />').prop('checked', v[1])
                ).add($('<label for="' + id + '"/>').html(v[2] || v[0]))
            }
            break;
        }
        case 'directory':
        case 'file':
            input = $('<input type="text" name="' + name + '" id="' + id + '" />')
                .on({
                    'input': function () {
                        input.trigger('change')
                    },
                    'click': function () {
                        if (!input.val())
                            button.trigger('click')
                    }
                }).val(value)
            var fileinput = $('<input type="file" class="none"' + (type == 'directory' ? ' nwdirectory' : '') + ' />')
                .on('change', function () { input.val($(this).val()).trigger('change') })
                , button = $('<button type="button" value="Browse..."/>').html('Browse...')
                    .on('click', function () {
                        //console.log(123)
                        //if( type == 'file' )
                        fileinput.trigger('click')
                    })
                , inputAll = input.add(fileinput).add(button)
            if (options['accept'])
                fileinput.attr('accept', options['accept'])
            break;
    }

    if (options.required) {
        input.prop('required', true)
    }

    if (options.onchange) {
        input.on('change.___onchange___', options.onchange)
        if (options['default'])
            input.trigger('change')
    }

    if (!name)
        input.attr('name', null)

    if (inputAll)
        return inputAll

    return input
}
_g.gen_form_line = function (type, name, label, value, suffix, options) {
    options = options || {}

    var line = $('<p/>').addClass(type, options.className)
        , id = '_input_g' + _g.inputIndex

    switch (type) {
        case 'directory':
            $('<label/>').html(label).appendTo(line)
            break;
        default:
            if (suffix) {
                $('<label/>').html(label).appendTo(line)
            } else {
                $('<label for="' + id + '"/>').html(label).appendTo(line)
            }
            break;
    }

    if (type)
        _g.gen_input(type, name, id, value, options).appendTo(line)

    if (suffix) {
        if (type === 'checkbox' && Array.isArray(suffix)) {

        } else {
            $('<label for="' + id + '"/>').html(suffix).appendTo(line)
        }
    }

    if (options.add)
        line.append(options.add)

    _g.inputIndex++
    return line
}

var builderOptions = {
    'version': 'latest',
    'platforms': ['osx64', 'win32', 'win64'],
    'filesRelative': ['node_modules', 'package.json'],
    'dataVersion': {}
}
    , packageJSON = {}
    , package_path = null
    , packageJSON_path = null
_g.availablePlatforms = [
    'win32', 'win64',
    'osx64',
    'linux64'
]
_g.update_options = function (obj, overrite) {
    // console.log('update options')
    if (obj.versions) {
        let count = 0
        const newObj = {}
        for (const platform in obj.versions) {
            count++
            if (!!(obj.versions[platform])) newObj[platform] = obj.versions[platform]
        }
        if (!count) {
            delete obj.versions
            delete builderOptions.versions
        } else {
            obj.versions = Object.assign({}, builderOptions.versions || {}, newObj)
        }
    }

    if (overrite)
        $.extend(builderOptions, obj)
    else
        $.extend(true, builderOptions, obj)

    // console.log(builderOptions)

    // 如果存在 packageJSON_path，并且允许将选项写入，在此写入
    if (packageJSON_path && _frame.app_main.option_save) {
        packageJSON['nw-packager'] = builderOptions
        node.jsonfile.writeFileSync(packageJSON_path, packageJSON, {
            spaces: 2
        })
    }
}

// 遍历全部选项项目，初始化所有页面上的可操作内容
_g.init_options = function (obj) {
    $.extend(true, builderOptions, obj)
    builderOptions.platforms = obj.platforms
    for (const i in builderOptions) {
        const value = builderOptions[i]
        console.log(i, value)
        switch (i) {
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
            case 'platforms': {
                // _frame.app_main.fields[i].children('input[value="' + builderOptions[i].join('"],[value="') + '"]')
                //     .prop('checked', true)
                //     .trigger('change')
                _frame.app_main.fields[i].children('input').each(function () {
                    const $el = $(this)
                    const name = $el.val()
                    $el.prop('checked', value.includes(name))
                        .trigger('change')
                })
                _frame.app_main.fields['versions_platforms'].find(`[data-platform]`).each(function () {
                    const $el = $(this)
                    const thisPlatform = $el.attr('data-platform')
                    const isOn = value.includes(thisPlatform)
                    $el.find('input[type="checkbox"]')
                        .prop('checked', isOn)
                        .trigger('change')
                })
                break;
            }
            case 'version': {
                if (!builderOptions.versions || !builderOptions.versions._size)
                    _frame.app_main.fields['version_is_global'].find('input[type="checkbox"]')
                        .prop('checked', true)
                        .trigger('change')
                Versions.initOption(value)
                break;
            }
            case 'versions': {
                if (builderOptions.versions._size) {
                    _frame.app_main.fields['version_is_global'].find('input[type="checkbox"]')
                        .prop('checked', false)
                        .trigger('change')
                    for (const platform in builderOptions.versions) {
                        const targetSelect = _frame.app_main.fields['versions_platforms']
                            .find(`[data-platform="${platform}"] select`)
                        const thisObj = targetSelect.data('Versions')
                        thisObj.initOption(builderOptions.versions[platform])
                    }
                }
                break;
            }
            default:
                if (_frame.app_main.fields[i] && _frame.app_main.fields[i].children) {
                    _frame.app_main.fields[i].children('input[type="text"],select')
                        .val(builderOptions[i])
                        .trigger('change')
                }
                break;
        }
    }
    if (packageJSON['window']['icon'])
        _frame.app_main.fields['menifest_window_icon'].children('input[type="text"]')
            .val(packageJSON['window']['icon'])
}

// 判断与主目录 (package_path) 的相对情况
// 如果为主目录的子目录/文件，则返回相对路径，否则返回 false
_g.relative_path = function (path_to_check) {
    if (path_to_check.substr(0, 1) == '.' || path_to_check.substr(0, 2) == './')
        return path_to_check

    var relative = node.path.relative(package_path, node.path.normalize(path_to_check))

    if (!/^[A-Za-z]\:/.test(relative) && !/^[\.]{2}/.test(relative))
        return './' + relative.replace(/\\/g, '/')

    return node.path.normalize(path_to_check)
}
















// Global Frame
_frame.app_main = {
    steps: [],

    // 是否存储选项至 package.json
    option_save: typeof _config.get('option_save') == 'undefined' ? true : (_config.get('option_save') == 'false' ? false : _config.get('option_save')),

    // 所有相关选项的 input/textarea/select 行元素
    fields: {},

    // 获取当前为第几步
    step_cur: function () {
        return parseInt(_frame.dom.global_steps.filter(':checked').val())
    },
    // 上一步
    step_prev: function () {
        _frame.app_main.step_goto(_frame.app_main.step_cur() - 1)
    },
    // 下一步
    step_next: function () {
        _frame.app_main.step_goto(_frame.app_main.step_cur() + 1)
    },
    // 跳到第n步
    step_goto: function (step) {
        // 处理当前步骤的结果
        // 如果返回false，不进行跳步操作
        var result = true
        try {
            result = _frame.app_main[_frame.app_main.steps[_frame.app_main.step_cur() - 1] + '_submit']()
        } catch (e) { }

        if (!result)
            return false

        step = step || 1
        if (step < 1)
            step = 1
        else if (step > _frame.dom.global_steps.length)
            step = _frame.dom.global_steps.length

        var input = _frame.dom.global_steps.filter('[value="' + step + '"]')
        input.prop('checked', true)
            .trigger('change', [input])
    },
    // 步骤完成
    step_changed: function (input) {
        if (input.val() == 1)
            _frame.dom.footer_prev.addClass('disabled')
        else
            _frame.dom.footer_prev.removeClass('disabled')

        if (input.val() == _frame.dom.global_steps.length)
            _frame.dom.footer_next.addClass('disabled')
        else
            _frame.dom.footer_next.removeClass('disabled')

        try {
            _frame.app_main[_frame.app_main.steps[parseInt(input.val()) - 1] + '_on']()
        } catch (e) { }
    },

    init: function () {
        if (_frame.app_main.is_init)
            return true

        // 创建基础框架
        _frame.dom.header = $('<header/>').appendTo(_frame.dom.layout)
        _frame.dom.title = $('<h1/>').html('NW-PACKAGER').appendTo(_frame.dom.header)
        _frame.dom.steps = $('<div class="steps"/>').appendTo(_frame.dom.header)
        _frame.dom.main = $('<main/>').appendTo(_frame.dom.layout)
        _frame.dom.main_wrapper = $('<div class="wrapper"/>').appendTo(_frame.dom.main)
        _frame.dom.footer = $('<footer/>').appendTo(_frame.dom.layout)
        _frame.dom.footer_prev = $('<button class="prev"/>').on('click', function (e) {
            if (!$(e.target).hasClass('disabled'))
                _frame.app_main.step_prev()
        }).html('Prev').appendTo(_frame.dom.footer)
        _frame.dom.footer_next = $('<button class="next"/>').on('click', function (e) {
            if (!$(e.target).hasClass('disabled'))
                _frame.app_main.step_next()
        }).html('Next').appendTo(_frame.dom.footer)
        _frame.dom.global_steps = $()

        //if( debugmode )
        //	_frame.dom.debug_step_switcher = $('<div class="debug_step_switcher"/>').html('<h3>Step Switcher</h3>').appendTo( $body )

        // 创建步骤相关DOM
        for (var i in _frame.app_main.steps) {
            var num = parseInt(i)
                , id = 'global_steps_' + (num + 1)

            _frame.dom.global_steps = _frame.dom.global_steps.add(
                $('<input class="none" type="radio" name="global_steps" id="' + id + '" value="' + (num + 1) + '"/>')
                    .prop('checked', i == 0)
                    .on('change', function (e, input) {
                        input = input || $(e.target)
                        if (input.prop('checked'))
                            _frame.app_main.step_changed(input)
                    })
                    .prependTo(_frame.dom.layout)
            )

            $('<span data-step="' + (num + 1) + '"/>').appendTo(_frame.dom.steps)

            var body = $('<div data-step="' + (num + 1) + '"/>').appendTo(_frame.dom.main_wrapper)
                , wrapper = $('<div class="wrapper"/>').appendTo(body)

            try {
                _frame.app_main[_frame.app_main.steps[i] + '_init'](wrapper)
            } catch (e) { }

            if (_frame.dom.debug_step_switcher && _frame.dom.debug_step_switcher.length)
                $('<label for="' + id + '"/>')
                    .html((num + 1))
                    .appendTo(_frame.dom.debug_step_switcher)
        }
        _frame.app_main.step_changed(_frame.dom.global_steps.filter(':checked'))

        Versions.init()

        _frame.app_main.is_init = true
    }
}


// version selector
class Versions {
    constructor($el) {
        if ($el instanceof jQuery) {
            this.el = $el[0]
            this.$el = $el
        } else if (typeof $el === 'object' && $el.label) {
            const {
                label,
                onchange
            } = $el
            this.$el = _g.gen_form_line(
                'select_group',
                'version',
                label,
                [[
                    'Defaults',
                    _g.nwjsVersions
                ]],
                null,
                {
                    'default': 'latest',
                    'onchange': onchange
                }
            )
            this.el = this.$el[0]
        } else {
            this.el = $el
            this.$el = $($el)
        }

        this.$input = this.$el.find('select')
        this.$input.data('Versions', this)

        Versions.list.push(this)
        return this.$el
    }

    initOption(initVersion) {
        const select = this.$input
        const group = $('<optgroup label="Project"/>').append(
            $('<option>', {
                'value': initVersion,
                'html': initVersion,
                'checked': true
            })
        )

        select.find('option:empty').remove()
        select.prepend(group).val(initVersion)
    }
}
Versions.list = []
Versions.init = () => {
    let searchRes
    const scrapePtrn = /href="v?([0-9]+\.[0-9]+\.[0-9]+[^"]*)\/"/ig
    let versions = []

    //<a href="v0.8.0/">
    node.request('http://dl.nwjs.io/', function (err, res, body) {
        console.log(err)
        if (!err && res.statusCode == 200) {
            while ((searchRes = scrapePtrn.exec(body)) !== null) {
                searchRes = searchRes[1]
                if (node.semver.valid(searchRes) && $.inArray(searchRes, versions) < 0) {
                    versions.push(searchRes)
                }
            }
            versions = versions.sort(function (a, b) { return node.semver.compare(b, a); })
            console.log(versions)
        }

        if (versions.length) {
            Versions.list.forEach(thisVersion => {
                const select = thisVersion.$input
                const group = $('<optgroup label="Available"/>').appendTo(select)
                versions.splice(0, 0, 'latest')
                if (versions.length) {
                    group.empty()
                    select.find('option:empty').remove()
                }
                for (let i in versions) {
                    $('<option value="' + versions[i] + '"/>')
                        .html(versions[i])
                        .appendTo(group)
                }
                select.find('optgroup[label="Defaults"]').remove()
            })
        }
    })
}
Versions.initOption = (initVersion) => {
    Versions.list.forEach(thisVersion => {
        thisVersion.initOption(initVersion)
    })
}