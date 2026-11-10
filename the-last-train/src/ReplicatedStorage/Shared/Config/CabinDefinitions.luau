--[[
	CabinDefinitions
	The four expedition boarding cabins. The world builder reads the layout
	numbers, the ExpeditionService reads Id / Capacity / DisplayName.

	Order matters: cabins are placed left-to-right along the lower platform.
]]

local CabinDefinitions = {
	{
		Id = "Solo",
		DisplayName = "SOLO EXPEDITION",
		Capacity = 1,
		-- Interior footprint (studs): small and private.
		Width = 9,
		Depth = 9,
		Height = 11,
		DoorWidth = 4.5,
		Style = "Solo",
	},
	{
		Id = "Duo",
		DisplayName = "DUO EXPEDITION",
		Capacity = 2,
		Width = 12,
		Depth = 10,
		Height = 12,
		DoorWidth = 5.5,
		Style = "Duo",
	},
	{
		Id = "Squad",
		DisplayName = "SQUAD EXPEDITION",
		Capacity = 3,
		Width = 15,
		Depth = 11,
		Height = 13,
		DoorWidth = 6.5,
		Style = "Squad",
	},
	{
		Id = "Crew",
		DisplayName = "CREW EXPEDITION",
		Capacity = 4,
		Width = 19,
		Depth = 13,
		Height = 15,
		DoorWidth = 8,
		Style = "Crew",
	},
}

function CabinDefinitions.Get(id)
	for _, def in ipairs(CabinDefinitions) do
		if def.Id == id then
			return def
		end
	end
	return nil
end

function CabinDefinitions.CapacityLabel(capacity)
	if capacity == 1 then
		return "1 EXPLORER"
	end
	return tostring(capacity) .. " EXPLORERS"
end

return CabinDefinitions
