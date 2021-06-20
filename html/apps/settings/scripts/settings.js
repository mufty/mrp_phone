class Settings {
    constructor() {
        this.cfg = {};
        this.locale = {};
    }

    event(data) {

    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //set background from cfg
        html.closest('#settings_bg').css('background-image', `url("${this.cfg.background}")`);

        html.find('#setting_cancel').click(this.back.bind(this));
        html.find('#btn-settings-back').click(this.back.bind(this));

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
        let html = $(`<iframe width="560" height="315" src="${this.cfg.notification}?autoplay=1" frameborder="0" allowfullscreen></iframe>`);
        $('.notification').html(html);
    }
}

APP["settings"] = new Settings();