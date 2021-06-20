class Settings {
    constructor() {
        this.cfg = {};
        this.locale = {};
    }

    event(data) {
        if (data.reloadPhone && data.phoneData) {
            $('#setting_phone_number').val(data.phoneData.phoneNumber);
            if (data.phoneData.settings) {
                let settings = data.phoneData.settings;
                this.cfg.background = settings.background;
                this.cfg.ringtone = settings.ringtone;
                this.cfg.notification = settings.notification;
                $('#settings_bg').css('background-image', `url("${settings.background}")`);
                $('#setting_background').val(settings.background);
                $('#setting_ringtone').val(settings.ringtone);
                $('#setting_notification').val(settings.notification);
            }
        }

        if (data.playNotificationSound) {
            this.playNotification();
        }

        if (data.startRinging) {
            this.startRinging();
        }

        if (data.stopRinging) {
            this.stopRinging();
        }
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale,
            cfg: this.cfg
        }));

        //set background from cfg
        html.closest('#settings_bg').css('background-image', `url("${this.cfg.background}")`);

        html.find('#setting_cancel').click(this.back.bind(this));
        html.find('#btn-settings-back').click(this.back.bind(this));
        html.find('#setting_save').click(this.save.bind(this));

        return html;
    }

    start() {
        $('.ringtone').html("");
        $('.notification').html("");

        $('#settings').addClass('active');

        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
    }

    back() {
        $('#settings').removeClass('active');
    }

    startRinging() {
        let videoId = this.cfg.ringtone.split("/");
        videoId = videoId[videoId.length - 1];
        let html = $(`<iframe width="560" height="315" src="${this.cfg.ringtone}?autoplay=1&loop=1&playlist=${videoId}" frameborder="0" allowfullscreen></iframe>`);
        $('.ringtone').html(html);
    }

    stopRinging() {
        $('.ringtone').html("");
    }

    playNotification() {
        $('.notification').html("");
        let html = $(`<iframe width="560" height="315" src="${this.cfg.notification}?autoplay=1" frameborder="0" allowfullscreen></iframe>`);
        $('.notification').html(html);
    }

    save() {
        let newBackground = $('#settings #setting_background').val();
        let newRingtone = $('#settings #setting_ringtone').val();
        let newNotification = $('#settings #setting_notification').val();
        let phone_number = $('#settings #setting_phone_number').val();

        $.post('http://mrp_phone/save_settings', JSON.stringify({
            background: newBackground,
            ringtone: newRingtone,
            notification: newNotification,
            number: phone_number
        }));

        this.back();
    }
}

APP["settings"] = new Settings();