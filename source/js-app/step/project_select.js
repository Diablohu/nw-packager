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
