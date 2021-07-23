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
        this.manageRolesOpen = false;
        this.dataOpened = null;
        this.editEmployeeOpened = false;
        this.employOpened = false;
        this.rolesListOpened = false;
        this.roleEditOpened = false;
    }

    event(data) {
        if (data.reloadPhone === true) {
            this.reloadPhone(data.phoneData);
        }
        if (data.updateDetails && this.detailsOpen) {
            //refresh details
            this.showDetails(this.dataOpened);
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

        html.find('#job_fire').hide();
        html.find('#rolesCombo').prop('disabled', true);
        if (this.myRole && this.myRole.canFire)
            html.find('#job_fire').show();
        if (this.myRole && this.myRole.canPromote)
            html.find('#rolesCombo').prop('disabled', false);
    }

    setMyRole(job) {
        this.myRole = null;
        if (!job || !job.business || !job.business.roles)
            return;

        let myRoleName = job.role;

        for (let role of job.business.roles) {
            if (role.name == myRoleName)
                this.myRole = role;
        }
    }

    showDetails(job) {
        this.setMyRole(job);
        if (!$("#jobDetails").hasClass("active")) {
            $('#jobDetails').addClass('active');
        }
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');
        this.detailsOpen = true;
        this.dataOpened = job;

        $('.head-screen .businessLabel').html(job.business.name);

        $('p.employ').hide();

        if (this.myRole && this.myRole.canHire)
            $('p.employ').show();

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
        } else if (this.rolesListOpened) {
            this.hideManageRoles();
            this.showDetails(this.dataOpened);
        } else if (this.roleEditOpened) {
            this.hideEditRole();
            this.showManageRoles();
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

    toggleManageRolesMenu() {
        this.manageRolesOpen = !this.manageRolesOpen;
        if (this.manageRolesOpen)
            $('#jobRolesDetails .dropdown').show();
        else
            $('#jobRolesDetails .dropdown').hide();
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

        $.post('http://mrp_phone/employ', JSON.stringify(data), (data) => {
            this.back();
        });
    }

    hideManageRoles() {
        $('#jobRolesDetails .dropdown').hide();
        this.manageRolesOpen = false;
        $('#jobRolesDetails').removeClass('active');
        this.rolesListOpened = false;
    }

    showManageRoles() {
        this.manageMenuOpen = false;
        $('#jobDetails .dropdown').hide();
        this.rolesListOpened = true;
        this.detailsOpen = false;
        $('#jobRolesDetails').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');

        $('#jobRolesDetails .roles-list').empty();
        if (this.dataOpened && this.dataOpened.business && this.dataOpened.business.roles) {
            for (let role of this.dataOpened.business.roles) {
                let html = $(Mustache.render(this.cfg.extraTemplates[3], role));
                $('#jobRolesDetails .roles-list').append(html);
                html.find('.edit').click(function() {
                    this.editRole(role);
                }.bind(this));

                html.find('.edit').hide();
                if (this.myRole && this.myRole.canChangeRole)
                    html.find('.edit').show();
            }
        } else {
            $('#jobRolesDetails .editRole').hide();
        }

        $('#jobRolesDetails p.addRole').hide();
        if (this.myRole && this.myRole.canAddRole)
            $('#jobRolesDetails p.addRole').show();
    }

    hideEditRole() {
        $('#jobRolesDetails .dropdown').hide();
        this.manageRolesOpen = false;
        $('#jobRolesEdit').removeClass('active');
        this.roleEditOpened = false;
    }

    editRole(role) {
        this.rolesListOpened = false;
        this.roleEditOpened = true;
        $('#jobRolesEdit').addClass('active');
        $('.screen *').attr('disabled', 'disabled');
        $('.screen.active *').removeAttr('disabled');

        if (role) {
            if (role.name == 'owner')
                $('#deleteRole').hide();
            else
                $('#deleteRole').show();

            $('#roleName').prop("disabled", true);
            $('#roleName').val(role.name);
            $('#canHire').prop('checked', role.canHire);
            $('#canFire').prop('checked', role.canFire);
            $('#canAddRole').prop('checked', role.canAddRole);
            $('#canDeleteRole').prop('checked', role.canDeleteRole);
            $('#canChangeRole').prop('checked', role.canChangeRole);
            $('#canPromote').prop('checked', role.canPromote);
            $('#canCreateJobs').prop('checked', role.canCreateJobs);
            $('#isDefault').prop('checked', role.isDefault);
        } else {
            $('#deleteRole').hide();
            $('#roleName').prop("disabled", false);
            $('#roleName').val("");
            $('#canHire').prop('checked', false);
            $('#canFire').prop('checked', false);
            $('#canAddRole').prop('checked', false);
            $('#canDeleteRole').prop('checked', false);
            $('#canChangeRole').prop('checked', false);
            $('#canPromote').prop('checked', false);
            $('#canCreateJobs').prop('checked', false);
            $('#isDefault').prop('checked', false);
        }

        $('#deleteRole').hide();
        if (this.myRole && this.myRole.canDeleteRole && role)
            $('#deleteRole').show();
    }

    updateRoles(business, role, del) {
        if (!business || !role)
            return;

        if (!business.roles)
            business.roles = [];

        let newRoles = []
        let found = false;
        for (let r of business.roles) {
            if (r.name == role.name && !del) {
                newRoles.push(role);
                found = true;
            } else if (r.name != role.name) {
                if (role.isDefault && r.isDefault)
                    r.isDefault = false;
                newRoles.push(r);
            }
        }

        if ((newRoles.length == 0 && !del) || (!found && !del))
            newRoles.push(role);

        business.roles = newRoles;
    }

    saveRole() {
        let roleData = {
            name: $('#roleName').val(),
            canHire: $('#canHire').is(":checked"),
            canFire: $('#canFire').is(":checked"),
            canAddRole: $('#canAddRole').is(":checked"),
            canDeleteRole: $('#canDeleteRole').is(":checked"),
            canChangeRole: $('#canChangeRole').is(":checked"),
            canPromote: $('#canPromote').is(":checked"),
            canCreateJobs: $('#canCreateJobs').is(":checked"),
            isDefault: $('#isDefault').is(":checked")
        };

        this.updateRoles(this.dataOpened.business, roleData);

        $.post('http://mrp_phone/update_business', JSON.stringify(this.dataOpened.business));

        this.hideEditRole();
        this.showManageRoles();
    }

    deleteRole() {
        let roleData = {
            name: $('#roleName').val(),
            canHire: $('#canHire').is(":checked"),
            canFire: $('#canFire').is(":checked"),
            canAddRole: $('#canAddRole').is(":checked"),
            canDeleteRole: $('#canDeleteRole').is(":checked"),
            canChangeRole: $('#canChangeRole').is(":checked"),
            canCreateJobs: $('#canCreateJobs').is(":checked"),
            canPromote: $('#canPromote').is(":checked"),
            canCreateJobs: $('#canCreateJobs').is(":checked"),
            isDefault: $('#isDefault').is(":checked")
        };

        this.updateRoles(this.dataOpened.business, roleData, true);

        $.post('http://mrp_phone/update_business', JSON.stringify(this.dataOpened.business));

        this.hideEditRole();
        this.showManageRoles();
    }

    init() {
        let html = $(Mustache.render(this.cfg.template, {
            locale: this.locale
        }));

        //add actions
        html.find('.btn-head-back-jobs').click(this.back.bind(this));
        html.find('#btn-head-manage-business').click(this.toggleManageMenu.bind(this));
        html.find('#btn-head-manage-roles').click(this.toggleManageRolesMenu.bind(this));
        html.find('p.employ').click(this.showEmployForm.bind(this));
        html.find('#employCharacter').click(this.employStateId.bind(this));
        html.find('p.manageRoles').click(this.showManageRoles.bind(this));
        html.find('p.addRole').click(function() {
            this.editRole();
        }.bind(this));
        html.find('#saveRole').click(this.saveRole.bind(this));
        html.find('#deleteRole').click(this.deleteRole.bind(this));


        return html;
    }

    start() {
        $('#jobs').addClass('active');
        this.open = true;
    }
}

APP["jobs"] = new Jobs();