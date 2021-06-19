fx_version 'adamant'

game 'gta5'

description 'MRP Phone'

version '0.0.1'

server_scripts {
	'config.lua',
	'@mrp_core/shared/locale.lua',
	'locales/*.lua',
	'server/*.lua'
}

client_scripts {
	'@mrp_core/shared/locale.lua',
	'config.lua',
	'locales/*.lua',
	'client/*.lua'
}

ui_page 'html/ui.html'

files {
	'html/ui.html',

	'html/css/app.css',

	'html/scripts/mustache.min.js',
	'html/scripts/app.js',

	'html/img/*.png',

	'html/img/icons/*.png',
    'html/apps/**/*.js',
    'html/apps/**/*.html',
    'html/apps/**/*.css',
}

dependency 'mrp_core'
