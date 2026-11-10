--[[
	AudioConfig
	Every sound the game uses, in one place.

	IMPORTANT: Id = "" means "not configured yet". The SoundController skips
	empty ids entirely (no Sound is created, nothing errors in Output), so the
	game runs silently until you paste real asset ids here.

	How to fill: Studio > Toolbox > Audio (or create.roblox.com Creator Store),
	search the text in `Search`, preview, then paste "rbxassetid://<number>".
	Only use audio you own or that is marked free / Roblox-licensed.

	Kind:
	  "Loop2D"     - looped, non-positional bed for a zone (Terminal / Train)
	  "Random2D"   - one-shot, played at random intervals while in a zone
	  "Emitter"    - looped or random, positional; plays from world attachments
	                 tagged "SoundEmitter" whose SoundKey attribute matches
	  "OneShot"    - played on demand (UI, cabin feedback, countdown)
]]

local AudioConfig = {
	-- Default volumes for the three SoundGroups. Player settings scale these.
	Groups = {
		Ambience = 0.7,
		Effects = 0.8,
		Interface = 0.6,
	},

	Sounds = {
		-- TERMINAL AMBIENCE ------------------------------------------------
		TerminalRoomTone = { Id = "", Kind = "Loop2D", Zone = "Terminal", Group = "Ambience", Volume = 0.22, Search = "large hall room tone / station interior ambience" },
		TerminalWind = { Id = "", Kind = "Loop2D", Zone = "Terminal", Group = "Ambience", Volume = 0.16, Search = "distant wind exterior soft" },
		DistantMetal = { Id = "", Kind = "Random2D", Zone = "Terminal", Group = "Ambience", Volume = 0.18, Interval = { 25, 60 }, Search = "distant metal clank railway yard" },
		ClockTick = { Id = "", Kind = "Emitter", Looped = true, Group = "Ambience", Volume = 0.35, MaxDistance = 70, Search = "old clock ticking loop" },
		ClockMechanism = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.4, Search = "clock mechanism clunk" },
		CabinHum = { Id = "", Kind = "Emitter", Looped = true, Group = "Ambience", Volume = 0.25, MaxDistance = 28, Search = "machinery hum soft / mechanical idle" },

		-- CABIN FEEDBACK ---------------------------------------------------
		CabinJoin = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.5, Search = "mechanical switch click soft / relay latch" },
		CountdownTick = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.45, Search = "mechanical signal tick / bell ding small" },
		DoorClose = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.5, Search = "sliding metal door close" },
		Departure = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.55, Search = "steam train whistle distant" },

		-- TRAIN AMBIENCE ---------------------------------------------------
		TrainRumble = { Id = "", Kind = "Loop2D", Zone = "Train", Group = "Ambience", Volume = 0.3, Search = "train interior rumble loop" },
		TrackClatter = { Id = "", Kind = "Loop2D", Zone = "Train", Group = "Ambience", Volume = 0.22, Search = "train wheels on tracks clickety loop" },
		WindowWind = { Id = "", Kind = "Loop2D", Zone = "Train", Group = "Ambience", Volume = 0.12, Search = "wind against window soft" },
		CarriageCreak = { Id = "", Kind = "Random2D", Zone = "Train", Group = "Ambience", Volume = 0.2, Interval = { 14, 35 }, Search = "wood creak train carriage" },
		TrainHorn = { Id = "", Kind = "Random2D", Zone = "Train", Group = "Ambience", Volume = 0.3, Interval = { 120, 240 }, Search = "distant steam train horn" },
		EngineIdle = { Id = "", Kind = "Emitter", Looped = true, Group = "Ambience", Volume = 0.4, MaxDistance = 90, Search = "steam engine idle chuff loop" },
		SteamRelease = { Id = "", Kind = "Emitter", Looped = false, Interval = { 18, 40 }, Group = "Ambience", Volume = 0.35, MaxDistance = 90, Search = "steam release hiss" },
		LockedDoor = { Id = "", Kind = "OneShot", Group = "Effects", Volume = 0.45, Search = "heavy locked door rattle" },

		-- INTERFACE --------------------------------------------------------
		UIClick = { Id = "", Kind = "OneShot", Group = "Interface", Volume = 0.4, Search = "ui click soft" },
		UIConfirm = { Id = "", Kind = "OneShot", Group = "Interface", Volume = 0.45, Search = "ui confirm soft" },
		UICancel = { Id = "", Kind = "OneShot", Group = "Interface", Volume = 0.4, Search = "ui cancel soft" },
	},
}

return AudioConfig
