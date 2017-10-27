_frame.app_main.nwbuild_options_init = function (wrapper) {
    _frame.app_main.nwbuild_options_form = $('<form/>')
        .on('submit', function (e) {
            _frame.app_main.nwbuild_options_submit()
            e.preventDefault()
        }).appendTo(wrapper)

    // Manifest JSON
    _g.gen_title('h2', 'Manifest window object').appendTo(_frame.app_main.nwbuild_options_form)

    _frame.app_main.fields['menifest_window_icon']
        = _g.gen_form_line(
            'file',
            'menifest_window_icon',
            '[WINDOWS ONLY] Icon file (.png)',
            null,
            null,
            {
                'accept': '.png',
                'onchange': function (e) {
                    var input = $(e.target)
                        , val = _g.relative_path(input.val())
                    input.val(val)
                    packageJSON['window']['icon'] = val
                    node.jsonfile.writeFileSync(packageJSON_path, packageJSON, {
                        spaces: 2
                    })
                }
            }
        ).appendTo(_frame.app_main.nwbuild_options_form)

    // NwBuilder
    _g.gen_title('h2', 'NwBuilder options').appendTo(_frame.app_main.nwbuild_options_form)

    _frame.app_main.fields['version']
        = (new Versions({
            label: 'NW.js version to build',
            onchange: function (e) {
                _g.update_options({
                    'version': $(e.target).val()
                })
            }
        }))
            .appendTo(_frame.app_main.nwbuild_options_form)

    _frame.app_main.fields['version_is_global']
        = _g.gen_form_line(
            'checkbox',
            'version_is_global',
            null,
            true,
            'Use version for all platforms',
            {
                'onchange': function (e) {
                    if ($(e.target).prop('checked')) {
                        _frame.app_main.fields['version'].show()
                        _frame.app_main.fields['platforms'].show()
                        _frame.app_main.fields['versions_platforms'].hide()
                        _frame.app_main.fields['version_is_global'].insertAfter(_frame.app_main.fields['version'].children(':first-child'))
                    } else {
                        _frame.app_main.fields['version'].hide()
                        _frame.app_main.fields['platforms'].hide()
                        _frame.app_main.fields['versions_platforms'].show()
                        _frame.app_main.fields['version_is_global'].insertAfter(_frame.app_main.fields['versions_platforms'].children(':first-child'))
                    }
                }
            }
        ).css({
            'margin-top': '0'
        }).insertAfter(_frame.app_main.fields['version'].children(':first-child'))

    _frame.app_main.fields['platforms']
        = _g.gen_form_line(
            'checkboxes',
            'platforms',
            'Platforms to build',
            _g.availablePlatforms.map(platform => [platform, false]),
            null,
            {
                'onchange': function (e, isFromOther) {
                    var value = []
                    _frame.app_main.fields['platforms'].children('input[name="platforms"]').each(function () {
                        const thisPlatform = $(this).val()
                        const isOn = $(this).prop('checked')
                        if (isOn) value.push(thisPlatform)
                        _frame.app_main.fields['versions_platforms'].find(`input[type="checkbox"][value="${thisPlatform}"]`)
                            .prop('checked', isOn)
                            .trigger(isFromOther ? '_' : 'change')
                    })
                    _g.update_options({
                        'platforms': value
                    }, true)
                }
            }
        ).appendTo(_frame.app_main.nwbuild_options_form)

    // version for platforms
    _frame.app_main.fields['versions_platforms']
        // = (new Versions({
        //     label: 'NW.js version to build for each platform',
        //     onchange: function (e) {
        //         _g.update_options({
        //             'version': $(e.target).val()
        //         })
        //     }
        // }))
        = _g.gen_form_line(
            undefined,
            undefined,
            'NW.js version to build for each platform'
        )
            .hide()
            .appendTo(_frame.app_main.nwbuild_options_form)
            .append('<span class="versions_platforms"/>')

    _g.availablePlatforms.forEach(platform => {
        let checked = false

        const pVersions = new Versions({
            label: platform,
            onchange: function (e) {
                _g.update_options({
                    'versions': {
                        [platform]: checked ? $(e.target).val() : false
                    }
                })
            }
        })
        $(`<span class="platform" data-platform="${platform}"/>`)
            .append(pVersions)
            .appendTo(_frame.app_main.fields['versions_platforms'].children('.versions_platforms'))

        const checkboxId = '_input_g' + _g.inputIndex++
        const titlelabel = pVersions.children('label[for]')
        const pVersionsSelect = pVersions.find('select')
        titlelabel.attr('for', checkboxId)
        pVersionsSelect.attr('disabled', true)

        const thisCheckbox = $(`<input type="checkbox" id="${checkboxId}" value="${platform}"/>`)
            .on('change', (e, isFromOther) => {
                checked = $(e.target).prop('checked')

                _frame.app_main.fields['platforms'].find(`input[type="checkbox"][value="${platform}"]`)
                    .prop('checked', checked)
                    .trigger('change', [true])

                if (checked) {
                    pVersionsSelect.removeAttr('disabled')
                } else {
                    pVersionsSelect.attr('disabled', true)
                }
            })
            .prependTo(titlelabel)
    })

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
                'accept': '.icns',
                'onchange': function (e) {
                    var input = $(e.target)
                        , val = _g.relative_path(input.val())
                    input.val(val)
                    _g.update_options({
                        'macIcns': val
                    })
                }
            }
        ).appendTo(_frame.app_main.nwbuild_options_form)

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
                'accept': '.ico',
                'onchange': function (e) {
                    var input = $(e.target)
                        , val = _g.relative_path(input.val())
                    input.val(val)
                    _g.update_options({
                        'winIco': val
                    })
                }
            }
        ).appendTo(_frame.app_main.nwbuild_options_form)

    // platformOverrides

}



_frame.app_main.nwbuild_options_on = function () {
    console.log('nwbuild_options: ON')
}



_frame.app_main.nwbuild_options_submit = function () {
    console.log('nwbuild_options: SUBMIT')
    return true
}
