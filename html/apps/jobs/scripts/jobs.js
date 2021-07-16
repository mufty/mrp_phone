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
    }

    event(data) {
        if (data.reloadPhone === true) {
            this.reloadPhone(data.phoneData);
        }
    }

    reloadPhone(phoneData) {
        this.jobs = [];
        console.log(phoneData);
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
                    business: business
                });
            }

            this.renderJobs();
        }
    }

    renderJobs() {
        let jobHTML = '';

        if (this.jobs.length > 0) {

            for (let job of this.jobs) {

                let view = {
                    businessName: job.business.name,
                    role: job.role
                }

                let html = Mustache.render(this.cfg.extraTemplates[0], view);

                jobHTML += html;
            }

        } else {
            jobHTML = '<div class="job no-item"><p class="no-item">' + this.locale.unemployed + '</p></div>';
        }

        $('#phone #jobs .jobs-list').html(jobHTML);
    }

    hideJobs() {
        $('#jobs').removeClass('active');
        this.open = false;
    }

    hideJobDetails() {
        $('#jobDetails').removeClass('active');
    }

    back() {
        this.hideJobs();
        this.hideJobDetails();
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