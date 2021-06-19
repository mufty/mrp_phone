Config = {
    apps: {
        contact: {
            menuId: 'phone-icon-rep',
            template: 'contact/templates/screen.html',
            extraTemplates: ['contact/templates/contact.html'],
            scripts: ['contact/scripts/contact.js'],
            style: 'contact/style.css',
            locale: 'contact/locale.js'
        },
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
        contact: "Contacts",
        cancel: "Cancel",
        annonymous: "Annonymous",
        unknown: "Unknown"
    }
};