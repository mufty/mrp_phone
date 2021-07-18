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
        this.manageMenuOpen = false;
        this.dataOpened = null;
        this.editEmployeeOpened = false;
        this.employOpened = false;
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

        for (let employee of data) {

            let html = $(Mustache.render(this.cfg.extraTemplates[1], employee));

            html.find('.edit').click(function() {
                this.editEmployee(employee);
            }.bind(this));

            jobHTML.append(html);
        }

        $('#phone #jobDetails .business-detail').html(jobHTML);
    }

    editEmployee(employee) {
        $('#employeeDetails').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');

        this.editEmployeeOpened = true;
        this.detailsOpen = false;

        let data = {};

        Object.assign(data, employee, {
            locale: this.locale
        });

        let html = $(Mustache.render(this.cfg.extraTemplates[2], data));

        $('#phone #employeeDetails .container').html(html);

        $('#phone #employeeDetails #job_fire').click(function() {
            $.post('http://mrp_phone/fire_employee', JSON.stringify(employee));
            this.back();
        }.bind(this));
        $('#phone #employeeDetails #job_save').click(function() {
            let roleValue = $('#employeeDetails #rolesCombo').val();
            if (roleValue)
                employee.employment.role = $('#employeeDetails #rolesCombo').val().replaceAll("_", " ");

            $.post('http://mrp_phone/update_role', JSON.stringify(employee));
            this.back();
        }.bind(this));

        $('#employeeDetails .editRole').show();
        $('#employeeDetails #rolesCombo').empty();
        if (this.dataOpened && this.dataOpened.business && this.dataOpened.business.roles) {
            for (let role of this.dataOpened.business.roles) {
                let safeName = role.name.replaceAll(" ", "_");
                let optionHTML = $('<option value="' + safeName + '">' + role.name + '</option>');
                $('#employeeDetails #rolesCombo').append(optionHTML);
            }
            let safeName = employee.employment.role.replaceAll(" ", "_");
            $('#employeeDetails #rolesCombo').val(safeName);
        } else {
            $('#employeeDetails .editRole').hide();
        }
    }

    showDetails(job) {
        $('#jobDetails').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
        this.detailsOpen = true;
        this.dataOpened = job;

        $('.head-screen .businessLabel').html(job.business.name);

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
        this.dataOpened = null;
        if (this.manageMenuOpen)
            this.toggleManageMenu();
    }

    hideEditEmployee() {
        $('#employeeDetails').removeClass('active');
        this.editEmployeeOpened = false;
    }

    back() {
        if (this.detailsOpen) {
            this.hideJobDetails();
            $('#job').addClass('active');
            $('.screen *').attr('disabled', 'disabled');
            $('.screen.active *').removeAttr('disabled');
        } else if (this.editEmployeeOpened) {
            this.hideEditEmployee();
            this.showDetails(this.dataOpened);
        } else if (this.employOpened) {
            this.hideEmployForm();
            this.showDetails(this.dataOpened);
        } else {
            this.hideJobs();
        }
    }

    msgBack() {
        this.hideJobDetails();
    }

    toggleManageMenu() {
        this.manageMenuOpen = !this.manageMenuOpen;
        if (this.manageMenuOpen)
            $('#jobDetails .dropdown').show();
        else
            $('#jobDetails .dropdown').hide();
    }

    hideEmployForm() {
        $('#employForm').removeClass('active');
        this.employOpened = false;
    }

    showEmployForm() {
        this.toggleManageMenu();
        this.employOpened = true;
        this.detailsOpen = false;
        $('#employForm').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');

        $('#employForm .editRole').show();
        $('#employForm #employRole').empty();
        $('#employForm #stateId').val("");
        if (this.dataOpened && this.dataOpened.business && this.dataOpened.business.roles) {
            for (let role of this.dataOpened.business.roles) {
                let safeName = role.name.replaceAll(" ", "_");
                let optionHTML = $('<option value="' + safeName + '">' + role.name + '</option>');
                $('#employForm #employRole').append(optionHTML);
            }
        } else {
            $('#employForm .editRole').hide();
        }
    }

    employStateId() {
        let stateId = $('#employForm #stateId').val();
        let role = $('#employRole').val();

        let data = {
            stateId: parseInt(stateId),
            role: role,
            business: this.dataOpened.employmentBusiness
        };

        console.log(data);

        $.post('http://mrp_phone/employ', JSON.stringify(data), (data) => {
            this.back();
        });
    }

    showManageRoles() {
        //TODO
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //add actions
        html.find('.btn-head-back-jobs').click(this.back.bind(this));
        html.find('#btn-head-manage-business').click(this.toggleManageMenu.bind(this));
        html.find('p.employ').click(this.showEmployForm.bind(this));
        html.find('#employCharacter').click(this.employStateId.bind(this));
        html.find('#btn-head-manage-business .manageRoles').click(this.showManageRoles.bind(this));

        return html;
    }

    start() {
        $('#jobs').addClass('active');
        this.open = true;
    }
}

APP["jobs"] = new Jobs();