class Notifications {
    constructor() {
        this.cfg = {};
        this.locale = {};
        this.pendingNotifications = {};
    }

    event(data) {
        if (data.showNotification) {
            this.showNotification(data.msg, data.id, data.sticky);
        }

        if (data.removeNotification) {
            this.removeNotification(data.id);
        }
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale,
            cfg: this.cfg
        }));

        return html;
    }

    showPopupNotification(msg, id, sticky) {
        $('#phone').css('bottom', '-500px');
        $('#phone').show();

        $('#phone').animate({
            bottom: '-270px'
        }, this.cfg.animationLength, () => {
            //animation done show notification
            this.showNotification(msg, id, sticky, false);
        });
    }

    hideNonStickyNotification(id) {
        if (!isPhoneShowed) {
            if (Object.keys(this.pendingNotifications).length == 1) {
                $('#phone').animate({
                    bottom: '-500px'
                }, this.cfg.animationLength, () => {
                    //animation done remove notification
                    this.removeNotification(id);
                });
            } else {
                this.removeNotification(id);
            }
        } else {
            this.removeNotification(id);
        }
    }

    showNotification(msg, id, sticky, checkPhone = true) {
        if (!isPhoneShowed && checkPhone) {
            this.showPopupNotification(msg, id, sticky);
            return;
        }

        if (this.pendingNotifications[id]) {
            this.removeNotification(id);
        }

        let notification = $(Mustache.render(this.cfg.extraTemplates[0], {
            msg: msg
        }));
        $('#notifications').append(notification);
        notification.animate({
            top: '0px'
        }, this.cfg.animationLength);
        notification.click(() => {
            this.removeNotification(id);
        });

        this.pendingNotifications[id] = notification;

        if (!sticky) {
            //delete notification after some time
            setTimeout(() => {
                this.hideNonStickyNotification(id);
            }, this.cfg.notificationLifetime);
        }
    }

    removeNotification(id) {
        if (this.pendingNotifications[id]) {
            this.pendingNotifications[id].remove();
            delete this.pendingNotifications[id];
        }

        if (!isPhoneShowed && Object.keys(this.pendingNotifications).length == 0) {
            //no more notifications left and the phone is not opened hide it
            $('#phone').hide();
        }
    }
}

APP["notifications"] = new Notifications();