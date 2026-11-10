--[[
	ExpeditionGroup
	Pure membership state for one expedition cabin. No Roblox APIs are used,
	so it can be unit tested offline (tools/tests/test_expedition_group.lua).

	Rules:
	  * members are kept in join order
	  * the first member is the leader; when the leader leaves, the next
	    member in join order becomes leader
	  * a locked group accepts nobody (departure in progress)
	  * capacity is never exceeded
]]

local ExpeditionGroup = {}
ExpeditionGroup.__index = ExpeditionGroup

function ExpeditionGroup.new(id, capacity, minSize)
	assert(type(capacity) == "number" and capacity >= 1, "capacity must be >= 1")
	local self = setmetatable({}, ExpeditionGroup)
	self.Id = id
	self.Capacity = capacity
	self.MinSize = minSize or 1
	self._members = {}
	self._locked = false
	return self
end

function ExpeditionGroup:Count()
	return #self._members
end

function ExpeditionGroup:IsFull()
	return #self._members >= self.Capacity
end

function ExpeditionGroup:IsLocked()
	return self._locked
end

function ExpeditionGroup:Lock()
	self._locked = true
end

function ExpeditionGroup:Unlock()
	self._locked = false
end

function ExpeditionGroup:IsMember(player)
	for _, member in ipairs(self._members) do
		if member == player then
			return true
		end
	end
	return false
end

function ExpeditionGroup:GetLeader()
	return self._members[1]
end

function ExpeditionGroup:IsLeader(player)
	return player ~= nil and self._members[1] == player
end

-- Returns a copy so callers can iterate safely while the group changes.
function ExpeditionGroup:GetMembers()
	local copy = {}
	for i, member in ipairs(self._members) do
		copy[i] = member
	end
	return copy
end

function ExpeditionGroup:CanJoin(player)
	if player == nil then
		return false, "Invalid"
	end
	if self:IsMember(player) then
		return false, "AlreadyMember"
	end
	if self._locked then
		return false, "Locked"
	end
	if self:IsFull() then
		return false, "Full"
	end
	return true, nil
end

function ExpeditionGroup:Add(player)
	local ok, reason = self:CanJoin(player)
	if not ok then
		return false, reason
	end
	table.insert(self._members, player)
	return true, nil
end

-- Returns: removed (bool), leaderChanged (bool)
function ExpeditionGroup:Remove(player)
	for i, member in ipairs(self._members) do
		if member == player then
			table.remove(self._members, i)
			return true, i == 1 and #self._members > 0
		end
	end
	return false, false
end

function ExpeditionGroup:CanStart(player)
	if self._locked then
		return false, "Locked"
	end
	if not self:IsLeader(player) then
		return false, "NotLeader"
	end
	if #self._members < self.MinSize then
		return false, "NotEnough"
	end
	return true, nil
end

function ExpeditionGroup:Reset()
	self._members = {}
	self._locked = false
end

return ExpeditionGroup
