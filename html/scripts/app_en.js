APP = {};

$(function() {

    function getDependencyCount(app) {
        let count = 0;
        if (app.template)
            count++;

        if (app.extraTemplates && app.extraTemplates.length > 0) {
            for (let tmplUrl of app.extraTemplates) {
                count++;
            }
        }

        if (app.scripts && app.scripts.length > 0) {
            for (let src of app.scripts) {
                count++;
            }
        }

        if (app.locale)
            count++;

        if (app.style)
            count++;

        return count;
    }

    function appLoaded(appName) {
        if (Config.apps[appName]) {
            // add app icon
            let iconHtml = `<li class="phone-icon" id="${Config.apps[appName].menuId}">${Locale[Config.locale][appName]}</li>`;
            iconHtml = $(iconHtml);
            iconHtml.click(() => {
                APP[appName].start();
            });
            $('.menu .home').append(iconHtml);
        }
    }

    function tryInit(appName, count) {
        if (Config.apps[appName]._dependencyCount <= count) {

            //set locale to app
            let mergedLocale = {};
            let globalLocale = Locale[Config.locale];
            mergedLocale = Object.assign(mergedLocale, globalLocale);
            let localAppLocale = Locale[appName][Config.locale];
            mergedLocale = Object.assign(mergedLocale, localAppLocale);
            APP[appName].locale = mergedLocale;

            //set configuration
            let appCfg = Config.apps[appName];
            APP[appName].cfg = appCfg;

            //call init and add HTML to container
            let html = APP[appName].init();
            $('#phoneApps').append(html);
            appLoaded(appName);
        }
    }

    //load apps
    for (let appName in Config.apps) {
        console.log(`Loading phone app: ${appName}`);
        let appCfg = Config.apps[appName];
        appCfg._dependencyCount = getDependencyCount(appCfg);
        let dependencyCount = 0;
        if (appCfg.template) {
            //load main template
            $.ajax(`apps/${appCfg.template}`).done(data => {
                appCfg.template = data;
                dependencyCount++;
                tryInit(appName, dependencyCount);
            });
        }
        if (appCfg.extraTemplates && appCfg.extraTemplates.length > 0) {
            for (let i in appCfg.extraTemplates) {
                let tmplUrl = appCfg.extraTemplates;
                //load extras templates
                $.ajax(`apps/${tmplUrl}`).done(data => {
                    appCfg.extraTemplates[i] = data;
                    dependencyCount++;
                    tryInit(appName, dependencyCount);
                });
            }
        }
        if (appCfg.scripts && appCfg.scripts.length > 0) {
            for (let src of appCfg.scripts) {
                //load scripts
                $.getScript(`apps/${src}`, (data, textStatus, jqxhr) => {
                    dependencyCount++;
                    tryInit(appName, dependencyCount);
                    if (jqxhr.status == 200) {
                        console.log(`script loaded ${src}`);
                    }
                });
            }
        }
        if (appCfg.locale) {
            //load locale
            $.getScript(`apps/${appCfg.locale}`, (data, textStatus, jqxhr) => {
                dependencyCount++;
                tryInit(appName, dependencyCount);
                if (jqxhr.status == 200) {
                    console.log(`locale loaded ${appCfg.locale}`);
                }
            });
        }

        if (appCfg.style) {
            //load style
            $('head').append(`<link rel="stylesheet" href="apps/${appCfg.style}" type="text/css" />`);
            dependencyCount++;
        }
    }

    let ContactTpl =
        '<div class="contact {{online}}">' +
        '<div class="sender-info">' +
        '<div class="center">' +
        '<span class="sender">{{sender}}</span><br/><span class="phone-number">#{{phoneNumber}}</span>' +
        '</div>' +
        '</div>' +
        '<div class="actions">' +
        '<span class="del-contact" data-contact-number="{{phoneNumberData}}" data-contact-name="{{senderData}}">X</span>' +
        '<span class="new-msg newMsg-btn" data-contact-number="{{phoneNumberData}}" data-contact-name="{{senderData}}"></span>' +
        '<span class="new-call newCall-btn" data-contact-number="{{phoneNumberData}}" data-contact-name="{{senderData}}"></span>' +
        '</div>' +
        '</div>';

    let SpecialContactTpl = '<li class="phone-icon" style="background-image: url(\'{{base64Icon}}\');" data-number="{{number}}" data-name="{{name}}">{{name}}</li>';

    let contacts = [];
    let specialContacts = [];
    let currentVal = null;
    let isMessagesOpen = false;
    let isPhoneShowed = false;

    let showMain = function() {
        $('.screen').removeClass('active');
        $('.screen *').attr('disabled', 'disabled');
    }

    let showRepertoire = function() {
        $('#repertoire').addClass('active');
    }

    let hideRepertoire = function() {
        $('#repertoire').removeClass('active');
    }

    let showAddContact = function() {
        $('#contact').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
    }

    let hideAddContact = function() {
        $('#contact').removeClass('active');
        $('#contact_name').val('');
        $('#contact_number').val('');
    }

    let renderContacts = function() {

        let contactHTML = '';

        if (contacts.length > 0) {

            for (let i = 0; i < contacts.length; i++) {

                let view = {
                    phoneNumber: contacts[i].value,
                    sender: contacts[i].label,
                    phoneNumberData: contacts[i].value,
                    senderData: contacts[i].label,
                    online: contacts[i].online ? 'online' : '',
                    anonyme: 'online'
                }

                let html = Mustache.render(ContactTpl, view);

                contactHTML += html;
            }

        } else {
            contactHTML = '<div class="contact no-item online"><p class="no-item">No contacts</p></div>';
        }

        $('#phone #repertoire .repertoire-list').html(contactHTML);

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

    $('.contact .new-msg').click(function() {
        APP.message.showNewMessage($(this).attr('data-contact-number'));
    });

    let reloadPhone = function(phoneData) {

        contacts = [];

        for (let i = 0; i < phoneData.contacts.length; i++) {
            contacts.push({
                label: phoneData.contacts[i].name,
                value: phoneData.contacts[i].number,
                online: phoneData.contacts[i].online
            })
        }

        renderContacts();

        $('#phone-number').text('#' + phoneData.phoneNumber);
    }

    let showPhone = function(phoneData) {
        reloadPhone(phoneData);
        $('#phone').show();
        showMain();
        isPhoneShowed = true;
    }

    let hidePhone = function() {
        $('#phone').hide();
        isPhoneShowed = false;
    }

    let addSpecialContact = function(name, number, base64Icon) {

        let found = false

        for (let i = 0; i < specialContacts.length; i++)
            if (specialContacts[i].number == number)
                found = true;

        if (!found) {

            specialContacts.push({
                name: name,
                number: number,
                base64Icon: base64Icon
            });

            specialContacts.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });

            renderSpecialContacts();

        }

    }

    let removeSpecialContact = function(number) {

        for (let i = 0; i < specialContacts.length; i++) {
            if (specialContacts[i].number == number) {
                specialContacts.splice(i, 1);
                break;
            }
        }

        renderSpecialContacts();

    }

    let renderSpecialContacts = function() {

        $('.phone-icon').unbind('click');

        $('#phone .menu .home').html(
            '<li class="phone-icon" id="phone-icon-rep">Contacts</li>' +
            '<li class="phone-icon" id="phone-icon-msg">Messages</li>'
        );

        for (let i = 0; i < specialContacts.length; i++) {
            let elem = $(Mustache.render(SpecialContactTpl, specialContacts[i]));
            $('#phone .menu .home').append(elem);
        }

        $('.phone-icon').click(function(event) {

            let id = $(this).attr('id');

            switch (id) {

                case 'phone-icon-rep': {
                    showRepertoire();
                    break;
                }

                default: {
                    break;
                }
            }

        });
    }

    $('#contact_send').click(function() {

        $.post('http://mrp_phone/add_contact', JSON.stringify({
            contactName: $('#contact_name').val(),
            phoneNumber: $('#contact_number').val()
        }))

    });

    // ACTIONS BTNS
    $('#btn-head-back-rep').click(function() {
        hideRepertoire();
    });

    $('#btn-head-back-contact, #contact_cancel').click(function() {
        hideAddContact();
    });

    $('#btn-head-new-contact').click(function() {
        showAddContact();
    });

    $('.phone-icon').click(function(event) {

        let id = $(this).attr('id');

        switch (id) {

            case 'phone-icon-rep': {
                showRepertoire();
                break;
            }

            default: {
                break;
            }
        }

    });

    window.onData = function(data) {

        if (data.app) {
            if (data.app == 'global') {
                //global data send to all apps
                for (let appName in APP) {
                    APP[appName].event(data);
                }
            } else {
                APP[data.app].event(data);
            }
        }

        if (data.reloadPhone === true) {
            reloadPhone(data.phoneData);
        }

        if (data.showPhone === true) {
            showPhone(data.phoneData);
        }

        if (data.showPhone === false) {
            hidePhone();
        }

        if (data.contactAdded === true) {
            reloadPhone(data.phoneData);
            hideAddContact();
        }

        if (data.contactRemoved === true) {
            reloadPhone(data.phoneData);
        }

        if (data.addSpecialContact === true) {
            addSpecialContact(data.name, data.number, data.base64Icon);
        }

        if (data.removeSpecialContact === true) {
            removeSpecialContact(data.number);
        }

    }

    window.onload = function(e) {
        window.addEventListener('message', function(event) {
            onData(event.data)
        });
    }

    $(document).keydown(function(e) {
        //on ESC close
        if (e.keyCode == 27 || e.keyCode == 120) {
            $.post('https://mrp_phone/escape', JSON.stringify({}));
        }
    });

});