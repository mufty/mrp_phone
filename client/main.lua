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
		TriggerEvent('mrp:getSharedObject', function(obj) MRP = obj end)
		Citizen.Wait(0)
	end

	--MRP.UI.Menu.RegisterType('phone', OpenPhone, ClosePhone)
end)

RegisterCommand('togglePhone', function()
    GUI.PhoneIsShowed = not GUI.PhoneIsShowed
    if GUI.PhoneIsShowed then
        OpenPhone()
    else
        ClosePhone()
    end
end, false)
RegisterKeyMapping('togglePhone', 'Open phone', 'keyboard', 'b')

RegisterCommand('triggerCall', function()
    if isOnCall and callChannel ~= -1 then --end call
        exports['pma-voice']:removePlayerFromCall(callChannel)
        callChannel = -1
        isOnCall = false
        MRP.Notification(_U('call_ended'), 10000)
        print('------------------')
        print('hangup call')
        print(PhoneData.phoneNumber)
        print(callChannel)
        print('------------------')
        TriggerServerEvent('mrp_phone:endCall', callChannel)
        PhonePlayText()
        Citizen.Wait(500)
        PhonePlayOut()
    end
    
    if incCall then
        print('------------------')
        print('client pickup call')
        print(PhoneData.phoneNumber)
        print(callChannel)
        print('------------------')
        TriggerServerEvent('mrp_phone:pickupCall', PhoneData.phoneNumber, callChannel)
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

	SendNUIMessage({
		showPhone = true,
		phoneData = PhoneData
	})

	GUI.PhoneIsShowed = true

	SetNuiFocus(true, true)

    PhonePlayIn()
end

function ClosePhone()
	SendNUIMessage({
		showPhone = false
	})

	SetNuiFocus(false)
	GUI.PhoneIsShowed = false
	PhonePlayOut()
end

RegisterNetEvent('mrp_phone:loaded')
AddEventHandler('mrp_phone:loaded', function(phoneNumber, contacts)
	PhoneData.phoneNumber = phoneNumber
	PhoneData.contacts = {}

	for i=1, #contacts, 1 do
		table.insert(PhoneData.contacts, contacts[i])
	end

	SendNUIMessage({
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
        MRP.Notification(_U('call_ended'), 10000)
        PhonePlayText()
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
		MRP.Notification(_U('invalid_number'), 10000)
	end
end)

RegisterNUICallback('remove_contact', function(data, cb)
	local phoneNumber = data.phoneNumber
	local contactName = data.contactName

	if phoneNumber then
		TriggerServerEvent('mrp_phone:removePlayerContact', phoneNumber, contactName)
	end
end)

RegisterNUICallback('start_call', function(data, cb)
	local phoneNumber = data.phoneNumber
	local contactName = data.contactName
    local char = MRP.GetPlayerData()

	if phoneNumber then
        local serverId = GetPlayerServerId(PlayerId())
        exports['pma-voice']:setCallChannel(serverId)
        MRP.Notification(_U('call_started'), 10000)
        callChannel = serverId
        isOnCall = true
        ClosePhone()
        PhonePlayCall()
		TriggerServerEvent('mrp_phone:startCall', phoneNumber, char.phoneNumber, char.name .. ' ' .. char.surname, serverId)
	end
end)

RegisterNetEvent('mrp_phone:incCall')
AddEventHandler('mrp_phone:incCall', function(fromPhoneNumber, name, call_channel)
    callChannel = call_channel
    incCall = true
    MRP.Notification(_U('call_inc', name, fromPhoneNumber), 10000)
end)

RegisterNetEvent('mrp_phone:loadTextMessages')
AddEventHandler('mrp_phone:loadTextMessages', function(messages)
    SendNUIMessage({
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

    MRP.Notification(('~b~%s:~s~ %s'):format(msgFrom, message), 10000)

	PlaySound(-1, 'Menu_Accept', 'Phone_SoundSet_Default', false, 0, true)

	SendNUIMessage({
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
		showMessageEditor = false
	})

	MRP.Notification(_U('message_sent'), 10000)
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
