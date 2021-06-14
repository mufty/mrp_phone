fx_version 'adamant'

game 'gta5'

description 'ESX Phone'

version '1.1.0'

server_scripts {
	'config.lua',
	'@mrp_core/shared/locale.lua',
	'locales/de.lua',
	'locales/br.lua',
	'locales/en.lua',
	'locales/fr.lua',
	'locales/es.lua',
	'locales/sv.lua',
	'locales/pl.lua',
	'server/main.lua'
}

client_scripts {
	'@mrp_core/shared/locale.lua',
	'config.lua',
	'locales/de.lua',
	'locales/br.lua',
	'locales/en.lua',
	'locales/fr.lua',
	'locales/es.lua',
	'locales/sv.lua',
	'locales/pl.lua',
	'client/main.lua'
}

ui_page 'html/ui_en.html'

files {
	'html/ui_en.html',

	'html/css/app.css',

	'html/scripts/mustache.min.js',
	'html/scripts/app_en.js',

	'html/img/phone.png',

	'html/img/icons/signal.png',
	'html/img/icons/rep.png',
	'html/img/icons/msg.png',
	'html/img/icons/add.png',
	'html/img/icons/back.png',
	'html/img/icons/new-msg.png',
	'html/img/icons/reply.png',
	'html/img/icons/write.png',
	'html/img/icons/edit.png',
	'html/img/icons/location.png'
}

dependency 'mrp_core'
