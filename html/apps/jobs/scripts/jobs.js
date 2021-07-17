function isObjectIDEqual(id1, id2) {
    if (!id1 || !id2 || !id1.id || !id2.id)
        return false;

    let bufferArr = [];
    for (let i in id1.id) {
        bufferArr.push(id1.id[i]);
    }

    let idHash1 = ObjectID(bufferArr).toString();

    bufferArr = [];
    for (let i in id2.id) {
        bufferArr.push(id2.id[i]);
    }

    let idHash2 = ObjectID(bufferArr).toString();

    if (idHash1 == idHash2)
        return true;

    return false;
}

class Jobs {
    constructor() {
        this.cfg = {};
        this.locale = {};
        this.open = false;
        this.jobs = [];
        this.detailsOpen = false;
    }

    event(data) {
        if (data.reloadPhone === true) {
            this.reloadPhone(data.phoneData);
        }
    }

    reloadPhone(phoneData) {
        this.jobs = [];
        this.detailsOpen = false;
        if (phoneData.employment) {
            for (let emp of phoneData.employment.employment) {
                let business = null;
                if (typeof emp.business == 'string') {
                    business = {
                        name: emp.business
                    }
                } else {
                    for (let bus of phoneData.employment.businessRefs) {
                        if (isObjectIDEqual(bus._id, emp.business)) {
                            business = bus;
                        }
                    }
                }

                this.jobs.push({
                    role: emp.role,
                    employmentBusiness: emp.business,
                    business: business
                });
            }

            this.renderJobs();
        }
    }

    renderJobs() {
        let jobHTML = $('<div></div>');

        if (this.jobs.length > 0) {

            for (let job of this.jobs) {

                let view = {
                    businessName: job.business.name,
                    role: job.role
                }

                let html = $(Mustache.render(this.cfg.extraTemplates[0], view));

                let onclick = function() {
                    this.showDetails(job);
                };

                html.click(onclick.bind(this));

                jobHTML.append(html);
            }

        } else {
            jobHTML = $('<div class="job no-item"><p class="no-item">' + this.locale.unemployed + '</p></div>');
        }

        $('#phone #jobs .jobs-list').html(jobHTML);
    }

    renderDetails(data) {
        let jobHTML = $('<div></div>');

        console.log(data);
        for (let employee of data) {

            let html = $(Mustache.render(this.cfg.extraTemplates[1], employee));

            jobHTML.append(html);
        }

        $('#phone #jobDetails .business-detail').html(jobHTML);
    }

    showDetails(job) {
        $('#jobDetails').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
        this.detailsOpen = true;

        $('#jobDetails .head-screen .businessLabel').html(job.business.name);

        $.post('http://mrp_phone/business_get_employees', JSON.stringify(job), (data) => {
            if (data && data.length > 0)
                this.renderDetails(data);
        });
    }

    hideJobs() {
        $('#jobs').removeClass('active');
        this.open = false;
    }

    hideJobDetails() {
        $('#jobDetails').removeClass('active');
        this.detailsOpen = false;
    }

    back() {
        if (this.detailsOpen) {
            this.hideJobDetails();
            $('#job').addClass('active');
            $('.screen *').attr('disabled', 'disabled');
            $('.screen.active *').removeAttr('disabled');
        } else {
            this.hideJobs();
        }
    }

    msgBack() {
        this.hideJobDetails();
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //add actions
        html.find('#btn-head-back-msg').click(this.back.bind(this));
        /*html.find('#btn-head-back-writer, #writer_cancel').click(this.msgBack.bind(this));
        html.find('#writer_send').click(this.sendMessage.bind(this));*/

        return html;
    }

    start() {
        $('#jobs').addClass('active');
        this.open = true;
    }
}

APP["jobs"] = new Jobs();