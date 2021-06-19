class Message {
    constructor() {
        this.cfg = {};
        this.locale = {};
        this.open = false;
        this.messages = [];
        this.contacts = [];
    }

    event(data) {
        if (data.showMessageEditor === false) {
            this.hideNewMessage();
        }

        if (data.fillMessages === true) {
            if (data.messages && data.messages.length > 0) {
                for (let message of data.messages) {
                    this.addMessage(message.from, message.message, null, message.from == "anonymous", null);
                }
            }
        }

        if (data.newMessage === true) {
            this.addMessage(data.phoneNumber, data.message, data.position, data.anonyme, data.job);
        }

        if (data.reloadPhone === true) {
            this.reloadPhone(data.phoneData);
        }
    }

    reloadPhone(phoneData) {
        this.contacts = [];

        for (let i = 0; i < phoneData.contacts.length; i++) {
            this.contacts.push({
                label: phoneData.contacts[i].name,
                value: phoneData.contacts[i].number,
                online: phoneData.contacts[i].online
            })
        }
    }

    showNewMessage(cnum, cname) {
        $('#writer').addClass('active');
        $('#writer_number').val(cnum);
        $('#writer .header-title').html(cname);
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
    }

    addMessage(phoneNumber, pmessage, pposition, panonyme, pjob) {
        this.messages.push({
            value: phoneNumber,
            message: pmessage,
            position: pposition,
            anonyme: panonyme,
            job: pjob
        })

        let messageHTML = '';

        if (this.messages.length > 0) {

            for (let i = 0; i < this.messages.length; i++) {
                let fromName = this.locale.unknown;
                let fromNumber = this.messages[i].value;
                let anonyme = null;

                if (this.messages[i].anonyme) {

                    fromName = this.locale.annonymous;
                    fromNumber = this.locale.annonymous;
                    anonyme = 'anonyme';

                } else {

                    for (let j = 0; j < this.contacts.length; j++)
                        if (this.contacts[j].value == this.messages[i].value)
                            fromName = this.contacts[j].label;

                    anonyme = '';
                }

                let view = {
                    anonyme: anonyme,
                    phoneNumber: fromNumber,
                    sender: fromName,
                    message: this.messages[i].message,
                    phoneNumberData: fromNumber,
                    senderData: fromName
                }

                let html = Mustache.render(this.cfg.extraTemplates[0], view);

                messageHTML = html + messageHTML;
            }
        } else {
            messageHTML = '<div class="message no-item"><p class="no-item">' + this.locale.noMessages + '</p></div>';
        }

        $('#phone #messages .messages-list').html(messageHTML);

        let that = this;
        $('.message .new-msg').click(function() {
            that.showNewMessage($(this).attr('data-contact-number'), $(this).attr('data-contact-name'));
        });
    }

    hideMessages() {
        $('#messages').removeClass('active');
        this.open = false;
    }

    hideNewMessage() {
        $('#writer').removeClass('active');
        $('#writer_number').val('');
        $('#writer_message').val('');
        $('#writer .header-title').html('');
    }

    back() {
        this.hideNewMessage();
        this.hideMessages();
    }

    msgBack() {
        this.hideNewMessage();
    }

    sendMessage() {
        let phoneNumber = null

        if (typeof $('#writer_number').val() == 'number')
            phoneNumber = parseInt($('#writer_number').val());
        else if (typeof $('#writer_number').val() == 'string')
            phoneNumber = $('#writer_number').val();

        $.post('http://mrp_phone/send', JSON.stringify({
            message: $('#writer_message').val(),
            number: phoneNumber,
            anonyme: $('#writer_anonyme').is(':checked')
        }));
    }

    init() {
        console.log("init app message called!");
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //add actions
        html.find('#btn-head-back-msg').click(this.back.bind(this));
        html.find('#btn-head-back-writer, #writer_cancel').click(this.msgBack.bind(this));
        html.find('#writer_send').click(this.sendMessage.bind(this));

        return html;
    }

    start() {
        $('#messages').addClass('active');
        this.open = true;
    }
}

APP["message"] = new Message();