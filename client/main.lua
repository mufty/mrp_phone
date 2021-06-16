local GUI, PhoneData, CurrentActionData, PhoneNumberSources, CurrentDispatchRequestId = {}, {phoneNumber = 0, contacts = {}}, {}, {}, -1
local CurrentAction, CurrentActionMsg
GUI.PhoneIsShowed = false
GUI.MessagesIsShowed = false
GUI.AddContactIsShowed = false
MRP = nil

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
RegisterKeyMapping('togglePhone', 'Open phone', 'keyboard', 'UP')

function OpenPhone()
    local char = MRP.GetPlayerData()
    if char == nil then
        return
    end
    
	local playerPed = PlayerPedId()
	TriggerServerEvent('mrp_phone:reload', PhoneData.phoneNumber)

	SendNUIMessage({
		showPhone = true,
		phoneData = PhoneData
	})

	GUI.PhoneIsShowed = true

	SetNuiFocus(true, true)

	if not IsPedInAnyVehicle(playerPed, false) then
		TaskStartScenarioInPlace(playerPed, 'WORLD_HUMAN_STAND_MOBILE', 0, true)
	end
end

function ClosePhone()
	local playerPed = PlayerPedId()

	SendNUIMessage({
		showPhone = false
	})

	SetNuiFocus(false)
	GUI.PhoneIsShowed = false
	ClearPedTasks(playerPed)
end

RegisterNetEvent('mrp_phone:loaded')
AddEventHandler('mrp_phone:loaded', function(phoneNumber, contacts)
	PhoneData.phoneNumber = phoneNumber
	PhoneData.contacts = {}

	for i=1, #contacts, 1 do
		contacts[i].online = (PhoneNumberSources[contacts[i].number] == nil and false or NetworkIsPlayerActive(GetPlayerFromServerId(PhoneNumberSources[contacts[i].number]))),
		table.insert(PhoneData.contacts, contacts[i])
	end

	SendNUIMessage({
		reloadPhone = true,
		phoneData   = PhoneData
	})
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

RegisterNetEvent('mrp_phone:addSpecialContact')
AddEventHandler('mrp_phone:addSpecialContact', function(name, phoneNumber, base64Icon)
	SendNUIMessage({
		addSpecialContact = true,
		name              = name,
		number            = phoneNumber,
		base64Icon        = base64Icon
	})
end)

RegisterNetEvent('mrp_phone:removeSpecialContact')
AddEventHandler('mrp_phone:removeSpecialContact', function(phoneNumber)
	SendNUIMessage({
		removeSpecialContact = true,
		number               = phoneNumber
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

RegisterNetEvent('mrp_phone:onMessage')
AddEventHandler('mrp_phone:onMessage', function(phoneNumber, message, position, anon, job, dispatchRequestId, dispatchNumber)
	if dispatchNumber and phoneNumber == PhoneData.phoneNumber then
		TriggerEvent('mrp_phone:cancelMessage', dispatchNumber)

		if WasEventCanceled() then
			return
		end
	end

	if job == 'player' then
        MRP.Notification(_U('invalid_number', message), 10000)
	else
        MRP.Notification(('~b~%s:~s~ %s'):format(job, message), 10000)
	end

	PlaySound(-1, 'Menu_Accept', 'Phone_SoundSet_Default', false, 0, true)

	SendNUIMessage({
		newMessage  = true,
		phoneNumber = phoneNumber,
		message     = message,
		position    = position,
		anonyme     = anon,
		job         = job
	})

	if dispatchRequestId then
		CurrentAction            = 'dispatch'
		CurrentActionMsg         = _U('press_take_call', job)
		CurrentDispatchRequestId = dispatchRequestId

		CurrentActionData = {
			phoneNumber = phoneNumber,
			message     = message,
			position    = position,
			actions     = actions,
			anonyme     = anon,
			job         = job
		}

		MRP.SetTimeout(15000, function()
			CurrentAction = nil
		end)
	end
end)

RegisterNetEvent('mrp_phone:stopDispatch')
AddEventHandler('mrp_phone:stopDispatch', function(dispatchRequestId, playerName)
	if CurrentDispatchRequestId == dispatchRequestId and CurrentAction == 'dispatch' then
		CurrentAction = nil
		MRP.Notification(_U('taken_call', playerName), 10000)
	end
end)

RegisterNetEvent('mrp_phone:setPhoneNumberSource')
AddEventHandler('mrp_phone:setPhoneNumberSource', function(phoneNumber, source)
	if source == -1 then
		PhoneNumberSources[phoneNumber] = nil
	else
		PhoneNumberSources[phoneNumber] = source
	end
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

RegisterNUICallback('setGPS', function(data)
	SetNewWaypoint(data.x,  data.y)
	MRP.Notification(_U('gps_position'), 10000)
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

-- Key controls
Citizen.CreateThread(function()
	while true do
		Citizen.Wait(0)

		if CurrentAction then
			MRP.ShowHelpNotification(CurrentActionMsg)

			if IsControlJustReleased(0, 38) and IsInputDisabled(0) then
				if CurrentAction == 'dispatch' then
					TriggerServerEvent('mrp_phone:stopDispatch', CurrentDispatchRequestId)
					SetNewWaypoint(CurrentActionData.position.x, CurrentActionData.position.y)
				end

				CurrentAction = nil
			end
		else
			Citizen.Wait(500)
		end
	end
end)