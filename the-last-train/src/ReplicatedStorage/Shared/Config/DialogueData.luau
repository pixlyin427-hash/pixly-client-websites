--[[
	DialogueData
	Short, expandable dialogue. A ProximityPrompt with the attribute
	DialogueId = "<key>" opens the matching entry on the client.

	First = lines for the first conversation in a session.
	Repeat = lines for every later conversation (optional).
	Keep lines short: this is a world, not a novel.
]]

local DialogueData = {
	StationKeeper = {
		Speaker = "THE STATION KEEPER",
		First = {
			"First expedition?",
			"The cabins are ready.",
			"Choose your crew carefully.",
		},
		Repeat = {
			"The lower platform. Pick a cabin and step inside.",
			"And never mind the clock. It keeps its own time.",
		},
	},

	Conductor = {
		Speaker = "THE CONDUCTOR",
		First = {
			"All aboard.",
			"The route reveals itself to those who travel it.",
		},
		Repeat = {
			"We are making good time.",
		},
	},

	-- Inspect prompts reuse the same dialogue UI without a speaker portrait.
	MysteryDoor = {
		Speaker = "",
		First = {
			"The door is sealed.",
			"There is no keyhole. Only the emblem.",
		},
	},
}

return DialogueData
