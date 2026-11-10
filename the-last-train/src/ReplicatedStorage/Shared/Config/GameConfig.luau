--[[
	GameConfig
	Game-wide tuning values. Everything a designer is likely to tweak lives here
	so that systems never hard-code numbers.

	NOTE: shared/config modules are written in the Lua 5.1 subset of Luau so the
	offline test harness (tools/) can load them. Keep it that way.
]]

local GameConfig = {
	GameName = "THE LAST TRAIN",

	Expedition = {
		MinSize = 1, -- an expedition may depart with a single explorer
		MaxSize = 4,
		CountdownSeconds = 5, -- Duo / Squad / Crew
		SoloCountdownSeconds = 3, -- Solo departs a little faster
		ZoneCheckInterval = 0.2, -- seconds between server checks of who is standing in a cabin
		LeaveGraceSeconds = 0.6, -- stepping out for less than this does not drop you
		RejoinCooldownSeconds = 1.5, -- after leaving, ignore the cabin briefly
		ReopenDelaySeconds = 2.5, -- doors stay shut this long after a departure
	},

	Transition = {
		FadeOutTime = 0.8,
		HoldTime = 1.4, -- time spent on black while the group is moved
		FadeInTime = 1.0,
	},

	Train = {
		-- Scenery that scrolls past the windows (client only, only while aboard).
		ScenerySpeedNear = 44, -- studs / second
		ScenerySpeedMid = 16,
		SceneryWrapLength = 1400,
		HornIntervalMin = 120,
		HornIntervalMax = 240,
	},

	Camera = {
		TerminalMaxZoom = 26,
		TrainMaxZoom = 14, -- tighter inside carriages to avoid wall clipping
	},

	Clock = {
		StutterChance = 0.04, -- per second, the clock's second hand slips back one tick
	},

	Hints = {
		IntroHintDelay = 2.5,
		IntroHintText = "Choose an Expedition Cabin to begin.",
	},
}

return GameConfig
