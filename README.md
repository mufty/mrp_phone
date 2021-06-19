# mrp_phone

originaly fork of esx_phone but it's now too far gone and is designed for normal people with the ability to add apps with ease

ensure mrp_phone

## creating your new app

- in html/apps/ create a new directory where you app will have it's code and everything it needs
- in html/apps/config.js add configuration for your app in Config.apps where the first field name is the application name example

```
Config = {
    apps: {
        myApp: {
            menuId: 'myapp-icon',                               //MANDATORY: This is an ID of the main app icon element for you to be able to style it including the icon
            template: 'myapp/templates/main.html',              //MANDATORY: This is the main HTML file for your application
            extraTemplates: ['myapp/templates/extra.html'],     //OPTIONAL: if you app needs more HTML files than the main one you can specify them here. This is useful for example for applicaitons that have multiple screens that you want switch between
            scripts: ['myapp/scripts/main.js'],                 //MANDATORY: this is where you application code will be implemented
            style: 'myapp/style.css',                           //OPTIONAL: if you want to have a separate CSS style file this is where you put it
            locale: 'myapp/locale.js'                           //OPTIONAL: your application locale file if needed
        }
};
```
In all your HTML files you can use [mustache.js](https://github.com/janl/mustache.js) for templates.

Now the application code itself has some rules and mandatory functions to follow. As this example:

```
class MyApp {
    constructor() {
        this.cfg = {};
        this.locale = {};
    }

    event(data) {
        //this function is called every time a message with data arrives from the client code with a app name that matches this application or a "global" event
        //data object represents the event object from the client
        //example of a client invoking this from lua would be
        /*
         SendNUIMessage({
            app        = 'myApp',
            message    = 'my cool message to my cool application'
         })
        */
    }

    init() {
        //this method has to return a html string or object
        //this is the first method called after the application has been loaded
        //this.cfg.template has the string of the HTML template loaded
        //this.cfg.extraTemplates is an similar HTML array with the loaded templates
        //this.locale has a merge of the "common" locale and the application specific locale the latter override the prior if they have keys with the same names
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        return html;
    }

    start() {
        
    }
}

APP["myApp"] = new MyApp(); //the string name of the applicaiton has to match the name from the configuration
```
