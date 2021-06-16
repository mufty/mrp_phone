fx_version 'adamant'

game 'gta5'

description 'MRP Phone'

version '0.0.1'

server_scripts {
	'config.lua',
	'@mrp_core/shared/locale.lua',
	'locales/*.lua',
	'server/main.lua'
}

client_scripts {
	'@mrp_core/shared/locale.lua',
	'config.lua',
	'locales/*.lua',
	'client/main.lua'
}

ui_page 'html/ui_en.html'

files {
	'html/ui_en.html',

	'html/css/app.css',

	'html/scripts/mustache.min.js',
	'html/scripts/app_en.js',

	'html/img/*.png',

	'html/img/icons/*.png',
}

dependency 'mrp_core'
