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
        },
        settings: {
            menuId: 'phone-icon-settings',
            template: 'settings/templates/screen.html',
            scripts: ['settings/scripts/settings.js'],
            style: 'settings/style.css',
            locale: 'settings/locale.js',
            background: 'https://wallpapersfortech.com/wp-content/uploads/2020/08/GTA-Online-Los-Santos-Sunset-Phone-Wallpaper.jpg',
            ringtone: 'https://www.youtube.com/embed/pe1ZXh5_wk4',
            notification: 'https://www.youtube.com/embed/AiMbf0ovXT4'
        },
        jobs: {
            menuId: 'phone-icon-jobs',
            template: 'jobs/templates/screen.html',
            extraTemplates: ['jobs/templates/job.html', 'jobs/templates/businessDetails.html'],
            scripts: ['jobs/scripts/jobs.js'],
            style: 'jobs/style.css',
            locale: 'jobs/locale.js',
        },
        notifications: {
            template: 'notifications/templates/screen.html',
            extraTemplates: ['notifications/templates/notification.html'],
            scripts: ['notifications/scripts/notifications.js'],
            style: 'notifications/style.css',
            locale: 'notifications/locale.js',
            animationLength: 500,
            notificationLifetime: 10000
        }
    },
    locale: 'en'
};

Locale = {
    en: {
        message: "Messages",
        contact: "Contacts",
        settings: "Settings",
        jobs: "Jobs",
        cancel: "Cancel",
        annonymous: "Annonymous",
        unknown: "Unknown",
        save: "Save"
    }
};