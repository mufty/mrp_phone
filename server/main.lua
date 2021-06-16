MRP = nil
local DisptachRequestId, PhoneNumbers = 0, {}

function UsePhoneNumber(phone_number, source, char)
    TriggerClientEvent('mrp_phone:setPhoneNumberSource', -1, phone_number, source)

	PhoneNumbers[phone_number] = {
		type          = 'player',
		hashDispatch  = false,
		sharePos      = false,
		hideNumber    = false,
		hidePosIfAnon = false,
		sources       = {[source] = true}
	}

	char.phoneNumber = phone_number
    TriggerEvent('mrp:updateCharacter', char)
    TriggerClientEvent('mrp:updateCharacter', source, char)
    
    MRP.read('phone', {phoneNumber = phone_number}, function(res)
        if PhoneNumbers[char.job.name] then
    		TriggerEvent('mrp_phone:addSource', char.job.name, source)
    	end
        
        TriggerClientEvent('mrp_phone:loaded', source, phone_number, res.contacts)
        
        --[[MRP.find('phone_message', {phoneNumber = phone_number}, {sort = 'date'}, {skip = false, limit = false}, function(res)
            TriggerClientEvent('mrp_phone:loadTextMessages', source, res)
        end)]]--
    end)
end

function LoadPlayer(source, char)
    if char == nil then
        char = MRP.getSpawnedCharacter(source)
    end

	for num,v in pairs(PhoneNumbers) do
		if tonumber(num) == num then -- if phonenumber is a player phone number
			for src,_ in pairs(v.sources) do
				TriggerClientEvent('mrp_phone:setPhoneNumberSource', source, num, tonumber(src))
			end
		end
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

	TriggerClientEvent('mrp_phone:setPhoneNumberSource', -1, phoneNumber, -1)
	PhoneNumbers[phoneNumber] = nil

	if PhoneNumbers[char.job.name] then
		TriggerEvent('mrp_phone:removeSource', char.job.name, source)
	end
end)

AddEventHandler('esx:setJob', function(source, job, lastJob)
	if PhoneNumbers[lastJob.name] then
		TriggerEvent('mrp_phone:removeSource', lastJob.name, source)
	end

	if PhoneNumbers[job.name] then
		TriggerEvent('mrp_phone:addSource', job.name, source)
	end
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
            TriggerClientEvent('mrp_phone:loaded', playerId, phone_number, res.contacts)
        else
            TriggerClientEvent('mrp:showNotification', playerId, _U('get_contacts_error'))
        end
        
        MRP.find('phone_message', {phoneNumber = phone_number}, {sort = 'date'}, {skip = false, limit = false}, function(res)
            TriggerClientEvent('mrp_phone:loadTextMessages', playerId, res)
        end)
    end)
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
        			local numType          = PhoneNumbers[phoneNumber].type
        			local numHasDispatch   = PhoneNumbers[phoneNumber].hasDispatch
        			local numHide          = PhoneNumbers[phoneNumber].hideNumber
        			local numHidePosIfAnon = PhoneNumbers[phoneNumber].hidePosIfAnon
        			local numPosition      = (PhoneNumbers[phoneNumber].sharePos and position or false)
        			local numSource        = tonumber(k)
        
        			if numHidePosIfAnon and anon then
        				numPosition = false
        			end
        
        			if numHasDispatch then
        				TriggerClientEvent('mrp_phone:onMessage', numSource, xPlayer.phoneNumber, message, numPosition, (numHide and true or anon), numType, GetDistpatchRequestId(), phoneNumber)
        			else
        				TriggerClientEvent('mrp_phone:onMessage', numSource, xPlayer.phoneNumber, message, numPosition, (numHide and true or anon), numType, false)
        			end
        		end
            end
        end)
    end)
end)

AddEventHandler('mrp_phone:registerNumber', function(number, type, sharePos, hasDispatch, hideNumber, hidePosIfAnon)
	local hideNumber    = hideNumber    or false
	local hidePosIfAnon = hidePosIfAnon or false

	PhoneNumbers[number] = {
		type          = type,
		sharePos      = sharePos,
		hasDispatch   = (hasDispatch or false),
		hideNumber    = hideNumber,
		hidePosIfAnon = hidePosIfAnon,
		sources       = {}
	}
end)

AddEventHandler('mrp_phone:removeNumber', function(number)
	PhoneNumbers[number] = nil
end)

AddEventHandler('mrp_phone:addSource', function(number, source)
	PhoneNumbers[number].sources[tostring(source)] = true
end)

AddEventHandler('mrp_phone:removeSource', function(number, source)
	PhoneNumbers[number].sources[tostring(source)] = nil
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
					TriggerClientEvent('mrp_phone:addContact', playerId, contactName, phone_number, true)
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

RegisterServerEvent('mrp_phone:stopDispatch')
AddEventHandler('mrp_phone:stopDispatch', function(dispatchRequestId)
	TriggerClientEvent('mrp_phone:stopDispatch', -1, dispatchRequestId, GetPlayerName(source))
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
