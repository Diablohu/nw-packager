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
                        node.jsonfile.writeFileSync(packageJSON_path, packageJSON)
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
