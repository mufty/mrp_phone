class Contact {
    constructor() {
        this.cfg = {};
        this.locale = {};
        this.open = false;
        this.contacts = [];
    }

    event(data) {
        if (data.reloadPhone === true) {
            this.reloadPhone(data.phoneData);
        }

        if (data.contactAdded === true) {
            this.reloadPhone(data.phoneData);
            this.cancelAddContact();
        }

        if (data.contactRemoved === true) {
            this.reloadPhone(data.phoneData);
        }
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //add actions
        html.find('#btn-head-back-rep').click(this.back.bind(this));
        html.find('#btn-head-new-contact').click(this.addContact.bind(this));
        html.find('#btn-head-back-contact, #contact_cancel').click(this.cancelAddContact.bind(this));
        html.find('#contact_send').click(this.saveContact.bind(this));

        return html;
    }

    saveContact() {
        $.post('http://mrp_phone/add_contact', JSON.stringify({
            contactName: $('#contact_name').val(),
            phoneNumber: $('#contact_number').val()
        }));
    }

    back() {
        $('#contacts').removeClass('active');
        this.open = false;
    }

    start() {
        $('#contacts').addClass('active');
        this.open = true;
    }

    cancelAddContact() {
        $('#contact').removeClass('active');
        $('#contact_name').val('');
        $('#contact_number').val('');
    }

    addContact() {
        $('#contact').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
    }

    renderContacts() {
        let contactHTML = '';

        if (this.contacts.length > 0) {

            for (let i = 0; i < this.contacts.length; i++) {

                let view = {
                    phoneNumber: this.contacts[i].value,
                    sender: this.contacts[i].label,
                    phoneNumberData: this.contacts[i].value,
                    senderData: this.contacts[i].label,
                    online: this.contacts[i].online ? 'online' : '',
                    anonyme: 'online'
                }

                let html = Mustache.render(this.cfg.extraTemplates[0], view);

                contactHTML += html;
            }

        } else {
            contactHTML = '<div class="contact no-item online"><p class="no-item">' + this.locale.noContacts + '</p></div>';
        }

        $('#phone #contacts .contacts-list').html(contactHTML);

        $('.contact .del-contact').click(function() {
            let name = $(this).attr('data-contact-name');
            let phoneNumber = $(this).attr('data-contact-number');

            $.post('http://mrp_phone/remove_contact', JSON.stringify({
                contactName: name,
                phoneNumber: phoneNumber
            }))
        });

        $('.contact .new-msg').click(function() {
            APP.message.showNewMessage($(this).attr('data-contact-number'), $(this).attr('data-contact-name'));
        });

        $('.contact .new-call').click(function() {
            let name = $(this).attr('data-contact-name');
            let phoneNumber = $(this).attr('data-contact-number');

            $.post('http://mrp_phone/start_call', JSON.stringify({
                contactName: name,
                phoneNumber: phoneNumber
            }))
        });
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

        this.renderContacts();

        $('#phone-number').text('#' + phoneData.phoneNumber);
    }
}

APP["contact"] = new Contact();