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
        if (Config.apps[appName] && Config.apps[appName].menuId) {
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
                let tmplUrl = appCfg.extraTemplates[i];
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

    isPhoneShowed = false;

    let showMain = function() {
        $('.screen').removeClass('active');
        $('.screen *').attr('disabled', 'disabled');
    }

    let reloadPhone = function(phoneData) {
        $('#phone-number').text('#' + phoneData.phoneNumber);
    }

    let showPhone = function(phoneData) {
        $('#phone').css('bottom', '0px');
        reloadPhone(phoneData);
        $('#phone').show();
        showMain();
        isPhoneShowed = true;
    }

    let hidePhone = function() {
        $('#phone').hide();
        isPhoneShowed = false;
    }

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