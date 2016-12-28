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
                + '<br />Data Packages will not be compiled, but to be zipped and be placed alongside final program under <i>/data</i> directory.'
                // + '<br /><br />When enabled, NW-Packager will install following node.js modules to original project:'
                // + '<br /><em>adm-zip</em>, <em>jsonfile</em>, <em>mkdirp</em>, <em>q</em>'
                ,
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
