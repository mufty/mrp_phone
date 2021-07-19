local GUI, PhoneData = {}, {phoneNumber = 0, contacts = {}}
GUI.PhoneIsShowed = false
GUI.MessagesIsShowed = false
GUI.AddContactIsShowed = false
MRP = nil
local isOnCall = false
local callChannel = -1
local incCall = false

Citizen.CreateThread(function()
	while MRP == nil do
		TriggerEvent('mrp:employment:getSharedObject', function(obj) MRP = obj end)
		Citizen.Wait(0)
	end
end)

RegisterCommand('togglePhone', function()
    TriggerEvent('mrp:inventory:client:hasItem', 'phone', function(count)
        if count >= 1 then
            GUI.PhoneIsShowed = not GUI.PhoneIsShowed
            if GUI.PhoneIsShowed then
                OpenPhone()
            else
                ClosePhone()
            end
        end
    end)
end, false)
RegisterKeyMapping('togglePhone', 'Open phone', 'keyboard', 'b')

RegisterCommand('triggerCall', function()
    if isOnCall and callChannel ~= -1 then --end call
        exports['pma-voice']:removePlayerFromCall(callChannel)
        TriggerEvent('mrp_phone:showNotification', _U('call_ended'), 'call_ended')
        TriggerServerEvent('mrp_phone:endCall', callChannel)
        callChannel = -1
        isOnCall = false
        PhonePlayText()
        Citizen.Wait(500)
        PhonePlayOut()
    end
    
    if incCall then
        SendNUIMessage({
            app         = 'settings',
    		stopRinging = true
    	})
        SendNUIMessage({
            app                = 'notifications',
    		removeNotification = true,
            id                 = 'call_inc'
            
    	})
        TriggerServerEvent('mrp_phone:pickupCall', callChannel)
        PhonePlayCall()
        exports['pma-voice']:setCallChannel(callChannel)
        isOnCall = true
        incCall = false
    end
end, false)
RegisterKeyMapping('triggerCall', 'Answer/Hangup call', 'keyboard', 'E')

function OpenPhone()
    local char = MRP.GetPlayerData()
    if char == nil then
        return
    end
    
	TriggerServerEvent('mrp_phone:reload', PhoneData.phoneNumber)
    
    PhoneData.employment = MRP.employment.getEmployment()

	SendNUIMessage({
		showPhone = true,
		phoneData = PhoneData
	})

	GUI.PhoneIsShowed = true

	SetNuiFocus(true, true)
    SetNuiFocusKeepInput(true)

    PhonePlayIn()
end

function ClosePhone()
	SendNUIMessage({
		showPhone = false
	})

	SetNuiFocus(false)
    SetNuiFocusKeepInput(false)
	GUI.PhoneIsShowed = false
	PhonePlayOut()
end

RegisterNetEvent('mrp_phone:loaded')
AddEventHandler('mrp_phone:loaded', function(phoneNumber, contacts, settings)
	PhoneData.phoneNumber = phoneNumber
	PhoneData.contacts = {}
    PhoneData.settings = settings
    PhoneData.employment = MRP.employment.getEmployment()
    
	for i=1, #contacts, 1 do
		table.insert(PhoneData.contacts, contacts[i])
	end

	SendNUIMessage({
        app         = 'global',
		reloadPhone = true,
		phoneData   = PhoneData
	})
end)

RegisterNetEvent('mrp_phone:callEnded')
AddEventHandler('mrp_phone:callEnded', function(call_channel)
    if callChannel ~= -1 then
        exports['pma-voice']:removePlayerFromCall(call_channel)
        callChannel = -1
        isOnCall = false
        incCall = false
        TriggerEvent('mrp_phone:showNotification', _U('call_ended'), 'call_ended')
        SendNUIMessage({
            app         = 'settings',
    		stopRinging = true
    	})
        PhonePlayText()
        if not GUI.PhoneIsShowed then
            ClosePhone()
        end
    end
end)

RegisterNetEvent('mrp_phone:addContact')
AddEventHandler('mrp_phone:addContact', function(name, phoneNumber, playerOnline)
	table.insert(PhoneData.contacts, {
		name   = name,
		number = phoneNumber,
		online = playerOnline
	})

	SendNUIMessage({
        app          = 'global',
		contactAdded = true,
		phoneData    = PhoneData
	})
end)

RegisterNetEvent('mrp_phone:removeContact')
AddEventHandler('mrp_phone:removeContact', function(name, phoneNumber)
	for key, value in pairs(PhoneData.contacts) do
		if value.name == name and value.number == phoneNumber then
			table.remove(PhoneData.contacts, key)
			break
		end
	end

	SendNUIMessage({
        app            = 'global',
		contactRemoved = true,
		phoneData      = PhoneData
	})
end)

RegisterNUICallback('add_contact', function(data, cb)
	local phoneNumber = data.phoneNumber
	local contactName = data.contactName

	if phoneNumber then
		TriggerServerEvent('mrp_phone:addPlayerContact', phoneNumber, contactName)
	else
        TriggerEvent('mrp_phone:showNotification', _U('invalid_number'), 'invalid_number')
	end
    cb({})
end)

RegisterNUICallback('remove_contact', function(data, cb)
	local phoneNumber = data.phoneNumber
	local contactName = data.contactName

	if phoneNumber then
		TriggerServerEvent('mrp_phone:removePlayerContact', phoneNumber, contactName)
	end
    cb({})
end)

RegisterNUICallback('business_get_employees', function(job, cb)
    MRP.TriggerServerCallback('mrp:employment:server:getEmployees', {job.employmentBusiness}, function(employees)
        cb(employees)
    end)
end)

AddEventHandler('mrp_phone:showNotification', function(message, id, sticky)
    SendNUIMessage({
        app              = 'notifications',
        showNotification = true,
        msg              = message,
        id               = id,
        sticky           = sticky
    })
end)

RegisterNUICallback('start_call', function(data, cb)
	local phoneNumber = data.phoneNumber
	local contactName = data.contactName
    local char = MRP.GetPlayerData()

	if phoneNumber then
        local serverId = GetPlayerServerId(PlayerId())
        exports['pma-voice']:setCallChannel(serverId)
        TriggerEvent('mrp_phone:showNotification', _U('call_started'), 'call_started')
        callChannel = serverId
        isOnCall = true
        ClosePhone()
        PhonePlayCall()
		TriggerServerEvent('mrp_phone:startCall', phoneNumber, char.phoneNumber, char.name .. ' ' .. char.surname, serverId)
	end
    cb({})
end)

RegisterNUICallback('save_settings', function(data, cb)
	local phoneNumber = data.number
    local notification = data.notification
    local ringtone = data.ringtone
    local background = data.background

	if phoneNumber then
		TriggerServerEvent('mrp_phone:updateSettings', phoneNumber, {
            notification = notification,
            ringtone = ringtone,
            background = background
        })
	end
    cb({})
end)

RegisterNetEvent('mrp_phone:incCall')
AddEventHandler('mrp_phone:incCall', function(fromPhoneNumber, name, call_channel)
    callChannel = call_channel
    incCall = true
    SendNUIMessage({
        app          = 'settings',
		startRinging = true
	})
    TriggerEvent('mrp_phone:showNotification', _U('call_inc', name, fromPhoneNumber), 'call_inc', true)
end)

RegisterNetEvent('mrp_phone:loadTextMessages')
AddEventHandler('mrp_phone:loadTextMessages', function(messages)
    SendNUIMessage({
        app = "message",
		fillMessages  = true,
		messages = messages,
	})
end)

RegisterNetEvent('mrp_phone:onMessage')
AddEventHandler('mrp_phone:onMessage', function(phoneNumber, message, anon)
    local msgFrom = anon and _U('annonymous') or phoneNumber
    
    --find name from contact list
    if not anon then
        for k, v in pairs(PhoneData.contacts) do
            if v.number == phoneNumber then
                msgFrom = v.name
            end
        end
    end
    
    SendNUIMessage({
        app                   = 'settings',
		playNotificationSound = true
	})

    TriggerEvent('mrp_phone:showNotification', ('%s: %s'):format(msgFrom, message), 'new_message')

	SendNUIMessage({
        app         = "message",
		newMessage  = true,
		phoneNumber = phoneNumber,
		message     = message,
		anonyme     = anon
	})
end)

RegisterNetEvent('mrp_phone:flashNumber')
AddEventHandler('mrp_phone:flashNumber', function()
	local char = MRP.GetPlayerData()
    if char == nil then
        return
    end
    
    local ped = PlayerPedId()
    local playerCoords = GetEntityCoords(ped)
    
    for key, value in pairs(exports.mrp_core:EnumeratePeds()) do
        local playerHandle = NetworkGetPlayerIndexFromPed(value)
        if NetworkIsPlayerActive(playerHandle) then
            local targetCoords = GetEntityCoords(value)
            
            local dist = Vdist(playerCoords.x, playerCoords.y, playerCoords.z, targetCoords.x, targetCoords.y, targetCoords.z)
            if dist <= Config.FlashNumberArea then
                local serverId = GetPlayerServerId(playerHandle)
                
                TriggerServerEvent('mrp_phone:broadcastNumber', GetPlayerServerId(PlayerId()), serverId, char.name .. ' ' .. char.surname, char.phoneNumber);
            end
        end
	end
end)

RegisterNUICallback('send', function(data)
	local phoneNumber = data.number
	local playerPed   = PlayerPedId()
	local coords      = GetEntityCoords(playerPed)

	if tonumber(phoneNumber) then
		phoneNumber = tonumber(phoneNumber)
	end

	TriggerServerEvent('mrp_phone:send', phoneNumber, data.message, data.anonyme, {
		x = coords.x,
		y = coords.y,
		z = coords.z
	})

	SendNUIMessage({
        app = "message",
		showMessageEditor = false
	})
    
    TriggerEvent('mrp_phone:showNotification', _U('message_sent'), 'message_sent')
end)

RegisterNUICallback('escape', function()
    ClosePhone()
end)

Citizen.CreateThread(function()
	while true do
		Citizen.Wait(0)

		if GUI.PhoneIsShowed then -- codes here: https://pastebin.com/guYd0ht4
			DisableControlAction(0, 1,    true) -- LookLeftRight
			DisableControlAction(0, 2,    true) -- LookUpDown
			DisableControlAction(0, 25,   true) -- Input Aim
			DisableControlAction(0, 106,  true) -- Vehicle Mouse Control Override

			DisableControlAction(0, 24,   true) -- Input Attack
			DisableControlAction(0, 140,  true) -- Melee Attack Alternate
			DisableControlAction(0, 141,  true) -- Melee Attack Alternate
			DisableControlAction(0, 142,  true) -- Melee Attack Alternate
			DisableControlAction(0, 257,  true) -- Input Attack 2
			DisableControlAction(0, 263,  true) -- Input Melee Attack
			DisableControlAction(0, 264,  true) -- Input Melee Attack 2

			DisableControlAction(0, 12,   true) -- Weapon Wheel Up Down
			DisableControlAction(0, 14,   true) -- Weapon Wheel Next
			DisableControlAction(0, 15,   true) -- Weapon Wheel Prev
			DisableControlAction(0, 16,   true) -- Select Next Weapon
			DisableControlAction(0, 17,   true) -- Select Prev Weapon
		end
	end
end)

AddEventHandler('onResourceStop', function(resource)
	if resource == GetCurrentResourceName() then
		if GUI.PhoneIsShowed then
            ClosePhone()
		end
	end
end)

RegisterNetEvent('mrp:employment:server:employmentChanged')
AddEventHandler('mrp:employment:server:employmentChanged', function(data)
    if GUI.PhoneIsShowed then
        SendNUIMessage({
            app           = 'jobs',
            updateDetails = true
        })
    end
end)

RegisterNUICallback('fire_employee', function(data, cb)
    TriggerServerEvent('mrp:employment:server:removeEmployment', GetPlayerServerId(PlayerId()), data.char.stateId, data.employment.business, data.employment.role)
    cb({})
end)

RegisterNUICallback('update_role', function(data, cb)
    TriggerServerEvent('mrp:employment:server:addEmployment', GetPlayerServerId(PlayerId()), data.char.stateId, data.employment.business, data.employment.role)
    cb({})
end)

RegisterNUICallback('employ', function(data, cb)
    TriggerServerEvent('mrp:employment:server:addEmployment', GetPlayerServerId(PlayerId()), data.stateId, data.business, data.role)
    cb({})
end)

RegisterNUICallback('update_business', function(data, cb)
    TriggerServerEvent('mrp:business:server:update', GetPlayerServerId(PlayerId()), data)
    cb({})
end)
