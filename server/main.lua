MRP = nil
local DisptachRequestId, PhoneNumbers = 0, {}

function fillContactStates(contacts)
    local contactsWithState = {}
    for i, contact in pairs(contacts) do
        contact.online = PhoneNumbers[contact.number] ~= nil
        contactsWithState[i] = contact
    end
    return contactsWithState
end

function UsePhoneNumber(phone_number, source, char)
	PhoneNumbers[phone_number] = {
		sources       = {[source] = true}
	}

	char.phoneNumber = phone_number
    TriggerEvent('mrp:updateCharacter', char)
    TriggerClientEvent('mrp:updateCharacter', source, char)
    
    MRP.read('phone', {phoneNumber = phone_number}, function(res)
    	TriggerEvent('mrp_phone:addSource', phone_number, source)
        local contacts = fillContactStates(res.contacts)
        TriggerClientEvent('mrp_phone:loaded', source, phone_number, contacts)
    end)
end

function LoadPlayer(source, char)
    if char == nil then
        char = MRP.getSpawnedCharacter(source)
    end

	local phone_number = char.phoneNumber

	if phone_number == nil then
		GenerateUniquePhoneNumber(function(num)
            phone_number = num
            
            local updateObj = {
                phoneNumber = num
            }
            
            local query =  {
                stateId = char.stateId
            }
            
            MRP.update('character', updateObj, query, {}, function(result)
                if result.modifiedCount > 0 then
                    phone_number = num
                else
                    phone_number = "0"
                end
                
                if phone_number ~= "0" then
                    --create a new phone in DB
                    MRP.update('phone', {phoneNumber = phone_number, contacts = {}}, {phoneNumber = phone_number}, {upsert=true}, function(res)
                        UsePhoneNumber(phone_number, source, char)
                    end)
                else
                    UsePhoneNumber(phone_number, source, char)
                end
            end)
        end)
    else
        UsePhoneNumber(phone_number, source, char)
	end
end

TriggerEvent('mrp:getSharedObject', function(obj)
	MRP = obj

	local xPlayers = GetPlayers()

	for i=1, #xPlayers, 1 do
		LoadPlayer(xPlayers[i], nil)
	end
end)

function GenerateUniquePhoneNumber(cb)
	math.randomseed(GetGameTimer())
    local numBase0 = math.random(500,599)
    local numBase1 = math.random(0,999)
    local numBase2 = math.random(0,9999)
    local num = string.format("%03d-%03d-%04d", numBase0, numBase1, numBase2)

    MRP.count('character', {
        phoneNumber = num
    }, function(count)
        if count > 0 then
            GenerateUniquePhoneNumber(cb)
        else
            cb(num)
        end
    end)
end

function GetDistpatchRequestId()
	local requestId = DisptachRequestId

	if DisptachRequestId < 65535 then
		DisptachRequestId = DisptachRequestId + 1
	else
		DisptachRequestId = 0
	end

	return requestId
end

AddEventHandler('mrp_phone:getDistpatchRequestId', function(cb)
	cb(GetDistpatchRequestId())
end)

AddEventHandler('mrp:spawn', function(source, characterToUse, spawnPoint)
	LoadPlayer(source, characterToUse)
end)

AddEventHandler('playerDropped', function(reason)
	local char = MRP.getSpawnedCharacter(source)
	local phoneNumber = char.phoneNumber

	PhoneNumbers[phoneNumber] = nil
end)

RegisterServerEvent('mrp_phone:reload')
AddEventHandler('mrp_phone:reload', function(phone_number)
    local playerId = source
    local char = MRP.getSpawnedCharacter(source)
    
    if phone_number == nil or phone_number == 0 then
        phone_number = char.phoneNumber
    end
    
    MRP.read('phone', {phoneNumber = phone_number}, function(res)
        if res ~= nil then
            local contacts = fillContactStates(res.contacts)
            TriggerClientEvent('mrp_phone:loaded', playerId, phone_number, contacts)
        else
            TriggerClientEvent('mrp:showNotification', playerId, _U('get_contacts_error'))
        end
        
        MRP.find('phone_message', {phoneNumber = phone_number}, {sort = 'date'}, {skip = false, limit = false}, function(res)
            TriggerClientEvent('mrp_phone:loadTextMessages', playerId, res)
        end)
    end)
end)

RegisterServerEvent('mrp_phone:startCall')
AddEventHandler('mrp_phone:startCall', function(phoneNumber, fromPhoneNumber, name, callChannel)
    if PhoneNumbers[phoneNumber] then
        for k,v in pairs(PhoneNumbers[phoneNumber].sources) do
            local numSource = tonumber(k)
            
            PhoneNumbers[fromPhoneNumber].activeCallChannel = callChannel

            TriggerClientEvent('mrp_phone:incCall', numSource, fromPhoneNumber, name, callChannel)
        end
    end
end)

RegisterServerEvent('mrp_phone:pickupCall')
AddEventHandler('mrp_phone:pickupCall', function(callChannel)
    local xPlayer = MRP.getSpawnedCharacter(source)
    if PhoneNumbers[xPlayer.phoneNumber] then
        PhoneNumbers[xPlayer.phoneNumber].activeCallChannel = callChannel
    end
end)

RegisterServerEvent('mrp_phone:endCall')
AddEventHandler('mrp_phone:endCall', function(callChannel)
    local xPlayer = MRP.getSpawnedCharacter(source)
    if PhoneNumbers[xPlayer.phoneNumber] then
        for k,v in pairs(PhoneNumbers) do
            if v.activeCallChannel ~= nil and v.activeCallChannel == callChannel then
                v.activeCallChannel = nil
                
                for i,s in pairs(v.sources) do
                    local numSource = tonumber(s)
                    TriggerClientEvent('mrp_phone:callEnded', numSource, callChannel)
                end
            end
        end
    end
end)

RegisterServerEvent('mrp_phone:send')
AddEventHandler('mrp_phone:send', function(phoneNumber, message, anon, position)
	local xPlayer = MRP.getSpawnedCharacter(source)
	print(('mrp_phone: MESSAGE => %s %s => %s: %s'):format(xPlayer.name, xPlayer.surname, phoneNumber, message))
    
    MRP.read('phone', {phoneNumber = phoneNumber}, function(phone)
        if phone == nil then
            return
        end
        
        local sender = xPlayer.phoneNumber
        if anon then
            sender = _U('annonymous')
        end
        
        local msgObj = {
            message = message,
            from = sender,
            seen = false,
            date = os.time(os.date("!*t")),
            phoneNumber = phoneNumber,
        }
        
        MRP.create('phone_message', msgObj, function(res)
            if PhoneNumbers[phoneNumber] then
                for k,v in pairs(PhoneNumbers[phoneNumber].sources) do
        			local numSource        = tonumber(k)
        
        			TriggerClientEvent('mrp_phone:onMessage', numSource, xPlayer.phoneNumber, message, anon)
        		end
            end
        end)
    end)
end)

AddEventHandler('mrp_phone:addSource', function(number, source)
	PhoneNumbers[number].sources[tostring(source)] = true
end)

RegisterServerEvent('mrp_phone:addPlayerContact')
AddEventHandler('mrp_phone:addPlayerContact', function(phone_number, contactName)
	local playerId = source
	local xPlayer = MRP.getSpawnedCharacter(playerId)

	if phone_number == nil then
		print(('mrp_phone: %s parsed invalid player contact number!'):format(xPlayer.surname))
		return
	end

    MRP.read('phone', {phoneNumber = phone_number}, function(result)
		if result ~= nil then
			if phone_number == xPlayer.phoneNumber then
				TriggerClientEvent('mrp:showNotification', playerId, _U('cannot_add_self'))
			else
				local contacts  = result.contacts

				-- already added player?
				for i=1, #contacts, 1 do
					if contacts[i].number == phone_number then
						TriggerClientEvent('mrp:showNotification', playerId, _U('number_in_contacts'))
						return
					end
				end

				table.insert(contacts, {
					name   = contactName,
					number = phone_number
				})
                
                MRP.update('phone', {phoneNumber = xPlayer.phoneNumber, contacts = contacts}, {phoneNumber = xPlayer.phoneNumber}, {upsert=true}, function(res)
                    TriggerClientEvent('esx:showNotification', playerId, _U('contact_added'))
					TriggerClientEvent('mrp_phone:addContact', playerId, contactName, phone_number, PhoneNumbers[phone_number] ~= nil)
                end)
			end
		else
			TriggerClientEvent('mrp:showNotification', playerId, _U('number_not_assigned'))
		end
	end)
end)

RegisterServerEvent('mrp_phone:removePlayerContact')
AddEventHandler('mrp_phone:removePlayerContact', function(phoneNumber, contactName)
	local playerId = source
	local xPlayer = MRP.getSpawnedCharacter(playerId)
	local foundNumber = false

	MRP.read('phone', {phoneNumber = xPlayer.phoneNumber}, function(result)
		if result ~= nil then
			foundNumber = true
		end

		if foundNumber then
			local contacts = result.contacts

			for key, value in pairs(contacts) do
				if value.name == contactName and value.number == phoneNumber then
					table.remove(contacts, key)
				end
			end

            result.contacts = contacts
            
            MRP.update('phone', result, {phoneNumber = xPlayer.phoneNumber}, {upsert=true}, function(res)
                TriggerClientEvent('esx:showNotification', playerId, _U('contact_removed'))
				TriggerClientEvent('mrp_phone:removeContact', playerId, contactName, phoneNumber)
            end)
		else
			TriggerClientEvent('esx:showNotification', playerId, _U('number_not_assigned'))
		end
	end)
end)

RegisterCommand('pn', function(source, args, rawCommand)
    local char = MRP.getSpawnedCharacter(source)
    if char == nil then
        return
    end
    
    TriggerClientEvent('mrp_phone:flashNumber', source)
end, false)

RegisterServerEvent('mrp_phone:broadcastNumber')
AddEventHandler('mrp_phone:broadcastNumber', function(source, target, name, phone)
    TriggerClientEvent('chat:addMessage', target, {
        template = '<div class="chat-message nonemergency">{0} : {1}</div>',
        args = {name, phone}
    })
end)
