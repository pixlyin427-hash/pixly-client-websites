--[[
	EnvironmentBuilder — the world just outside the terminal, and the train
	teaser.

	Seen through the east windows: a cold, foggy railway yard where THE LAST
	TRAIN waits with its headlamp lit and steam rising. Players cannot reach
	the yard (the terminal is enclosed); it is a glimpse, not a level.
	Seen through the north windows: firs and a far ridge fading into fog.
]]

local Kit = require(script.Parent.BuildKit)
local TrainBuilder = require(script.Parent.TrainBuilder)

local C, M = Kit.C, Kit.M
local rad = math.rad

local EnvironmentBuilder = {}

local RAIL_Y = -11

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

-- Fir silhouette: trunk + two triangular tiers (wedge pairs), five parts.
-- The triangle faces local X: use yaw ~0 when seen along X, ~90 along Z.
function EnvironmentBuilder.Fir(parent, base, height, yaw, color)
	local m = parent
	local cf = CFrame.new(base) * CFrame.Angles(0, rad(yaw or 0), 0)
	Kit.cylY(m, height * 0.3, height * 0.06, cf * CFrame.new(0, height * 0.15, 0), C.Bark, M.Wood, { Name = "Trunk", CastShadow = false })
	local tiers = { { 0.18, 0.55, 0.46 }, { 0.5, 0.5, 0.32 } }
	for _, t in ipairs(tiers) do
		local y0, h, w = height * t[1], height * t[2], height * t[3]
		local thick = w * 0.8
		Kit.wedge(m, V(thick, h, w / 2), cf * CFrame.new(0, y0 + h / 2, -w / 4), color or C.Foliage, M.Smooth, { Name = "Foliage", CastShadow = false })
		Kit.wedge(m, V(thick, h, w / 2), cf * CFrame.new(0, y0 + h / 2, w / 4) * CFrame.Angles(0, rad(180), 0), color or C.Foliage, M.Smooth, { Name = "Foliage", CastShadow = false })
	end
end

-- Ridge silhouette: a long triangular prism, thin enough to stay cheap.
function EnvironmentBuilder.Ridge(parent, center, length, height, thickness, yaw, color)
	local cf = CFrame.new(center) * CFrame.Angles(0, rad(yaw or 0), 0)
	Kit.wedge(parent, V(thickness, height, length / 2), cf * CFrame.new(0, height / 2, -length / 4), color or C.Mountain, M.Smooth, { Name = "Ridge", CastShadow = false })
	Kit.wedge(parent, V(thickness, height, length / 2), cf * CFrame.new(0, height / 2, length / 4) * CFrame.Angles(0, rad(180), 0), color or C.Mountain, M.Smooth, { Name = "Ridge", CastShadow = false })
end

local function track(parent, x, z0, z1, sleepers)
	Kit.box(parent, CFrame.new(), x - 7, RAIL_Y - 1.5, z0, x + 7, RAIL_Y - 0.55, z1, Color3.fromRGB(58, 56, 54), M.Pebble, { Name = "Ballast" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(parent, CFrame.new(), x + sx * 4 - 0.25, RAIL_Y - 0.55, z0, x + sx * 4 + 0.25, RAIL_Y, z1, Color3.fromRGB(90, 88, 86), M.Metal, { Name = "Rail" })
	end
	if sleepers then
		for z = z0 + 2, z1 - 2, 4 do
			Kit.box(parent, CFrame.new(), x - 6, RAIL_Y - 0.75, z - 0.6, x + 6, RAIL_Y - 0.45, z + 0.6, C.WoodDark, M.Wood, { Name = "Sleeper" })
		end
	end
end

function EnvironmentBuilder.Build(parent)
	local env = Kit.folder(parent, "Environment")
	local yard = Kit.folder(env, "TrainYard")

	-- Ground under everything outside.
	Kit.box(env, CFrame.new(), -700, -14, -700, 700, -13, 700, C.Ground, M.Ground, { Name = "Ground", CastShadow = false })
	Kit.box(yard, CFrame.new(), 46, -13, -150, 150, -12.4, 220, Color3.fromRGB(46, 47, 45), M.Pebble, { Name = "YardBed" })

	-- Tracks: the train's line (with sleepers in view) and an empty siding.
	track(yard, 76, -150, 220, false)
	for z = -70, 140, 4 do
		Kit.box(yard, CFrame.new(), 70, RAIL_Y - 0.75, z - 0.6, 82, RAIL_Y - 0.45, z + 0.6, C.WoodDark, M.Wood, { Name = "Sleeper" })
	end
	track(yard, 102, -150, 220, false)

	-- THE LAST TRAIN, waiting. Exterior only, engine + two carriages.
	local teaser = TrainBuilder.Build(env, CFrame.new(76, RAIL_Y, -40), {
		Name = "TrainTeaser",
		Carriages = { "Mystery", "Crew" },
		Interiors = false,
	})
	teaser:SetAttribute("Note", "Visual teaser only. The playable train is Workspace.ExpeditionTrain.")

	-- Yard furniture: a signal, a water crane, a cold yard lamp.
	local sig = Kit.model(yard, "Signal")
	Kit.cylY(sig, 12, 0.6, CFrame.new(90, RAIL_Y + 6, -56), C.Iron, M.Metal, { Name = "SignalPost" })
	Kit.part(sig, V(0.5, 0.6, 3.4), CFrame.new(90, RAIL_Y + 11, -57.6) * CFrame.Angles(rad(-20), 0, 0), C.Burgundy, M.Smooth, { Name = "SignalArm" })
	Kit.ball(sig, 0.7, CFrame.new(90.4, RAIL_Y + 10.2, -56), Color3.fromRGB(200, 58, 48), M.Neon, { Name = "SignalLamp", CastShadow = false })
	local crane = Kit.model(yard, "WaterCrane")
	Kit.cylY(crane, 10, 1.2, CFrame.new(91, RAIL_Y + 5, 14), C.Iron, M.Metal, { Name = "Column" })
	Kit.cylX(crane, 7, 0.9, CFrame.new(87.5, RAIL_Y + 9.6, 14), C.Iron, M.Metal, { Name = "Arm" })
	Kit.cylY(crane, 2.4, 0.7, CFrame.new(84.2, RAIL_Y + 8.2, 14), C.Iron, M.Metal, { Name = "Spout" })
	Kit.cylY(crane, 0.6, 2.2, CFrame.new(91, RAIL_Y + 0.3, 14), C.Iron, M.Metal, { Name = "Base" })
	local lamp = Kit.model(yard, "YardLamp")
	Kit.cylY(lamp, 14, 0.5, CFrame.new(60, RAIL_Y + 6.6, -12), C.Iron, M.Metal, { Name = "Post" })
	local head = Kit.part(lamp, V(1, 0.8, 1), CFrame.new(60, RAIL_Y + 13.8, -12), Color3.fromRGB(176, 200, 228), M.Neon, { Name = "Lamp", CastShadow = false })
	Kit.pointLight(head, 34, 0.9, C.LightCold)

	-- Distant silhouettes (static). East, beyond the yard.
	local far = Kit.folder(env, "Silhouettes")
	local rng = Kit.rng(2027)
	for i = 1, 14 do
		local z = -120 + i * 22 + rng(-8, 8)
		EnvironmentBuilder.Fir(far, V(150 + rng(0, 40), -13, z), rng(22, 38), rng(-25, 25), C.Silhouette)
	end
	EnvironmentBuilder.Ridge(far, V(420, -13, -60), 520, 150, 60, 0, C.Mountain)
	EnvironmentBuilder.Ridge(far, V(520, -13, 220), 600, 210, 70, 8, Color3.fromRGB(52, 60, 76))
	-- North, behind the cabins.
	for i = 1, 12 do
		local x = -110 + i * 18 + rng(-6, 6)
		EnvironmentBuilder.Fir(far, V(x, -13, 92 + rng(0, 50)), rng(26, 42), rng(65, 115), C.Silhouette)
	end
	EnvironmentBuilder.Ridge(far, V(-40, -13, 380), 700, 170, 60, 90, C.Mountain)
	return env
end

return EnvironmentBuilder
