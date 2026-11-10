--[[
	ExpeditionZoneBuilder — the playable train and the night it travels through.

	Workspace.ExpeditionTrain (far from the terminal, z ≈ 4000):
	  TheLastTrain          locomotive + Mystery, Crew, Discovery, Explorer, Boarding
	  Scenery/Near|Mid      parts the client scrolls past the windows (+Z)
	  Scenery/Far           static ridges and one distant light
	  Bounds                zone volume (Zone = "Train") for client lighting / audio

	The train itself never moves: the world slides past it. That keeps physics
	trivial, players never slip, and it costs a single BulkMoveTo per frame on
	the client only while someone is aboard.
]]

local Kit = require(script.Parent.BuildKit)
local TrainBuilder = require(script.Parent.TrainBuilder)
local CarriageInteriors = require(script.Parent.CarriageInteriors)
local EnvironmentBuilder = require(script.Parent.EnvironmentBuilder)

local C, M = Kit.C, Kit.M
local rad = math.rad

local ExpeditionZoneBuilder = {}

ExpeditionZoneBuilder.ORIGIN = Vector3.new(0, 0, 4000)
ExpeditionZoneBuilder.SCENERY_Z0 = 3700 -- scenery lives in [Z0, Z0 + wrap]
ExpeditionZoneBuilder.SCENERY_WRAP = 1400
ExpeditionZoneBuilder.SLEEPER_Z0 = 4268
ExpeditionZoneBuilder.SLEEPER_WRAP = 336 -- multiple of the 4 stud spacing

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

function ExpeditionZoneBuilder.Build(parent)
	local zone = Kit.folder(parent, "ExpeditionTrain")
	local O = ExpeditionZoneBuilder.ORIGIN
	local T = CFrame.new(O)

	local train, info = TrainBuilder.Build(zone, T, {
		Name = "TheLastTrain",
		Carriages = { "Mystery", "Crew", "Discovery", "Explorer", "Boarding" },
		Interiors = true,
	})
	local refs = CarriageInteriors.Build(train, info)

	-- Static ground, ballast and rails (motion is invisible on uniform rails).
	local static = Kit.folder(zone, "Static")
	Kit.box(static, CFrame.new(), -900, -3.4, O.Z - 700, 900, -2.4, O.Z + 1100, Color3.fromRGB(30, 36, 34), M.Ground, { Name = "Ground", CastShadow = false })
	Kit.box(static, CFrame.new(), -7, -2.4, O.Z - 400, 7, -0.55, O.Z + 700, Color3.fromRGB(54, 52, 50), M.Pebble, { Name = "Ballast" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(static, CFrame.new(), sx * 4 - 0.25, -0.55, O.Z - 400, sx * 4 + 0.25, 0, O.Z + 700, Color3.fromRGB(96, 94, 92), M.Metal, { Name = "Rail" })
	end

	-- Scrolling scenery.
	local scenery = Kit.folder(zone, "Scenery")
	local near = Kit.folder(scenery, "Near")
	local mid = Kit.folder(scenery, "Mid")
	local far = Kit.folder(scenery, "Far")
	near:SetAttribute("Layer", "Near")
	mid:SetAttribute("Layer", "Mid")
	local Z0, WRAP = ExpeditionZoneBuilder.SCENERY_Z0, ExpeditionZoneBuilder.SCENERY_WRAP
	local rng = Kit.rng(4111)

	-- Sleepers behind the train, seen from the observation deck.
	local sleepers = Kit.folder(scenery, "Sleepers")
	sleepers:SetAttribute("Layer", "Near")
	sleepers:SetAttribute("WrapZ0", ExpeditionZoneBuilder.SLEEPER_Z0)
	sleepers:SetAttribute("WrapLength", ExpeditionZoneBuilder.SLEEPER_WRAP)
	for z = ExpeditionZoneBuilder.SLEEPER_Z0, ExpeditionZoneBuilder.SLEEPER_Z0 + ExpeditionZoneBuilder.SLEEPER_WRAP - 4, 4 do
		Kit.box(sleepers, CFrame.new(), -6, -0.75, z - 0.6, 6, -0.45, z + 0.6, C.WoodDark, M.Wood, { Name = "Sleeper", CastShadow = false })
	end

	-- Telegraph poles: the clearest sense of speed from a window.
	for z = Z0, Z0 + WRAP - 70, 70 do
		Kit.cylY(near, 15, 0.6, CFrame.new(19, 5, z), C.WoodDark, M.Wood, { Name = "Pole", CastShadow = false })
		Kit.part(near, V(0.4, 0.4, 4.6), CFrame.new(19, 11.8, z), C.WoodDark, M.Wood, { Name = "Crossarm", CastShadow = false })
	end
	-- Near firs and boulders on both sides.
	for i = 1, 26 do
		local z = Z0 + (i - 0.5) * WRAP / 26 + rng(-15, 15)
		local side = (i % 2 == 0) and 1 or -1
		EnvironmentBuilder.Fir(near, V(side * rng(26, 60), -2.4, z), rng(18, 34), rng(-30, 30), C.Foliage)
	end
	for i = 1, 10 do
		local z = Z0 + rng(0, WRAP)
		local d = rng(4, 9)
		Kit.ball(near, d, CFrame.new((i % 2 == 0 and 1 or -1) * rng(20, 45), -2.4 + d * 0.15, z), Color3.fromRGB(62, 64, 66), M.Rock, { Name = "Boulder", CastShadow = false })
	end
	-- Mid-distance forest.
	for i = 1, 30 do
		local z = Z0 + (i - 0.5) * WRAP / 30 + rng(-20, 20)
		local side = (i % 2 == 0) and 1 or -1
		EnvironmentBuilder.Fir(mid, V(side * rng(80, 190), -2.4, z), rng(30, 52), rng(-30, 30), C.Silhouette)
	end
	-- Far ridges stay put: the horizon should feel unreachable.
	for _, r in ipairs({ { -420, 3600, 900, 180 }, { 460, 3900, 1000, 230 }, { -520, 4500, 800, 160 }, { 400, 4700, 900, 200 } }) do
		EnvironmentBuilder.Ridge(far, V(r[1], -2.4, r[2]), r[3], r[4], 90, 0, C.Mountain)
	end
	-- One distant tower with a single cold light. Nobody on the train mentions it.
	Kit.part(far, V(8, 120, 8), CFrame.new(-380, 57, 3720), C.Silhouette, M.Smooth, { Name = "DistantTower", CastShadow = false })
	Kit.ball(far, 3.5, CFrame.new(-380, 119, 3720), Color3.fromRGB(150, 190, 236), M.Neon, { Name = "DistantLight", CastShadow = false })

	-- Zone volume for the client (lighting, ambience, camera).
	local bounds = Kit.marker(zone, "Bounds", V(60, 70, info.Length + 30), CFrame.new(O.X, 20, O.Z + info.Length / 2))
	bounds:SetAttribute("Zone", "Train")
	Kit.tag(bounds, "ZoneBounds")

	return zone, {
		Train = train,
		Spawns = refs.Spawns,
		ExitDoor = refs.ExitDoor,
		MysteryDoor = refs.MysteryDoor,
		ConductorCFrame = refs.ConductorCFrame,
	}
end

return ExpeditionZoneBuilder
