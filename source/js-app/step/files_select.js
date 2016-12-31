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
		var filesRequired = [
			// 'node_modules',
			'package.json'
		]

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
