Config = {
    apps: {
        message: {
            menuId: 'phone-icon-msg',
            template: 'message/templates/screen.html',
            extraTemplates: ['message/templates/message.html'],
            scripts: ['message/scripts/message.js'],
            style: 'message/style.css',
            locale: 'message/locale.js'
        }
    },
    locale: 'en'
};

Locale = {
    en: {
        message: "Messages",
        cancel: "Cancel",
        annonymous: "Annonymous"
    }
};