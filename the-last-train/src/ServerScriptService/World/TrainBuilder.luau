--[[
	TrainBuilder — THE LAST TRAIN (locomotive + carriage shells)

	Built from primitives only (no uploaded meshes), so it works the moment the
	place is opened. Silhouette features that make it recognisable at distance:
	  * oversized smokebox with a brass-ringed emblem door and high headlamp
	  * tall flared chimney, brass steam dome, burgundy V-shaped prow guard
	  * three large spoked driving wheels per side (spokes are drawn on the
	    wheel faces with GUI frames instead of geometry)
	  * porthole cab, lettered tender, segmented arched carriage roofs

	Local frame T: origin at rail level under the very front of the engine,
	the train extends toward +Z, the front faces -Z.

	TrainBuilder.Build(parent, T, opts) -> model, info
	  opts.Name       model name
	  opts.Carriages  carriage names behind the engine, front to back
	  opts.Interiors  true -> build interior linings, lamps, floors
	info.Carriages[name] = { Z0 = number, Frame = CFrame }
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.BuildKit)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)

local C, M = Kit.C, Kit.M
local rad = math.rad

local TrainBuilder = {}

TrainBuilder.CAR_LENGTH = 40
TrainBuilder.GAP = 2
TrainBuilder.LOCO_LENGTH = 64
TrainBuilder.FLOOR_Y = 6

local MYSTERY_METAL = Color3.fromRGB(30, 34, 42)

-- Per-carriage look. windows = z centres (0..40 along the carriage), w = width.
TrainBuilder.Styles = {
	Boarding = {
		Label = "BOARDING",
		Windows = { 4.5, 10.5, 16.5, 33, 37.5 },
		WindowWidth = 3.8,
		Doors = { 26.5 },
		Lining = { Lower = C.Wood, Upper = C.Cream, Ceiling = C.Cream, Floor = C.Wood, FloorMaterial = M.Planks, UpperMaterial = M.Smooth },
		Lamps = { 8, 21, 34 },
		LightColor = Color3.fromRGB(255, 180, 110),
		RearDeck = true,
	},
	Explorer = {
		Label = "EXPLORER",
		Windows = { 13, 20, 27 },
		WindowWidth = 4.2,
		Lining = { Lower = C.WoodWorn, Upper = C.BlueSteel, Ceiling = C.WoodLight, Floor = C.WoodWorn, FloorMaterial = M.Planks, UpperMaterial = M.Metal },
		Lamps = { 9, 31 },
		LightColor = Color3.fromRGB(255, 184, 116),
	},
	Discovery = {
		Label = "DISCOVERY",
		Windows = { 14, 20, 26 },
		WindowWidth = 3.6,
		Lining = { Lower = C.WoodDark, Upper = C.FabricGreen, Ceiling = C.WoodDark, Floor = C.WoodDark, FloorMaterial = M.Planks, UpperMaterial = M.Fabric },
		Lamps = { 8, 32 },
		LightColor = Color3.fromRGB(255, 212, 168),
	},
	Crew = {
		Label = "CREW",
		Windows = { 7, 16, 25, 34 },
		WindowWidth = 6.2,
		WindowHead = 14,
		Lining = { Lower = C.Wood, Upper = Color3.fromRGB(104, 44, 44), Ceiling = C.Cream, Floor = Color3.fromRGB(92, 62, 46), FloorMaterial = M.Fabric, UpperMaterial = M.Fabric },
		Lamps = { 12, 30 },
		LightColor = Color3.fromRGB(255, 166, 96),
	},
	Mystery = {
		Label = "",
		Windows = {},
		Shutters = { 7, 15, 25, 33 },
		Sealed = true,
	},
}

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

-- WHEELS ------------------------------------------------------------------------
local function spokes(part, face)
	local g = Kit.surface(part, face, 30, { LightInfluence = 1 })
	for i = 0, 5 do
		Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(0.07, 0, 0.84, 0), Rotation = i * 30, BackgroundTransparency = 0, BackgroundColor3 = C.Charcoal })
	end
	local ring = Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(0.9, 0, 0.9, 0) })
	Kit.corner(ring, 0.5, 0)
	Kit.stroke(ring, C.Charcoal, 5, 0)
	-- counterweight
	local cw = Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.27, 0), Size = UDim2.new(0.42, 0, 0.2, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Charcoal })
	Kit.corner(cw, 0.5, 0)
end

local function driver(m, T, x, z, r)
	local side = x < 0 and -1 or 1
	local face = side < 0 and Enum.NormalId.Left or Enum.NormalId.Right
	Kit.cylX(m, 0.6, r * 2, T * CFrame.new(x, r, z), C.Charcoal, M.Metal, { Name = "Tyre" })
	local centre = Kit.cylX(m, 0.75, r * 2 - 0.9, T * CFrame.new(x, r, z), C.Burgundy, M.Metal, { Name = "WheelCentre" })
	spokes(centre, face)
	Kit.cylX(m, 0.95, 1.2, T * CFrame.new(x, r, z), C.Brass, M.Metal, { Name = "Hub" })
	Kit.cylX(m, 0.5, 0.55, T * CFrame.new(x + side * 0.55, r - r * 0.47, z), C.Iron, M.Metal, { Name = "CrankPin" })
end

local function smallWheel(m, T, x, z, r)
	Kit.cylX(m, 0.5, r * 2, T * CFrame.new(x, r, z), C.Charcoal, M.Metal, { Name = "Wheel" })
	Kit.cylX(m, 0.6, r * 1.3, T * CFrame.new(x, r, z), C.BlueSteelDark, M.Metal, { Name = "WheelHub" })
end

local function bogie(m, T, zc)
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(m, T, sx * 4.5, 1.0, zc - 3.4, sx * 5.1, 2.8, zc + 3.4, C.Charcoal, M.Metal, { Name = "BogieFrame" })
		for _, dz in ipairs({ -2, 2 }) do
			Kit.cylX(m, 0.5, 3, T * CFrame.new(sx * 4.15, 1.5, zc + dz), C.Charcoal, M.Metal, { Name = "Wheel" })
		end
	end
	Kit.box(m, T, -4.5, 2.6, zc - 0.8, 4.5, 3.4, zc + 0.8, C.Iron, M.Metal, { Name = "Bolster" })
end

local function emblemDisc(parent, cf, diameter, color, faceSide)
	local disc = Kit.cylX(parent, 0.2, diameter, cf, C.BrassDark, M.Metal, { Name = "EmblemRoundel" })
	Emblem.Create(Kit.surface(disc, faceSide, 50), { Color = color or C.Ink, Thickness = 4, Size = UDim2.new(0.88, 0, 0.88, 0) })
	return disc
end

-- LOCOMOTIVE --------------------------------------------------------------------
local function locomotive(train, T)
	local m = Kit.model(train, "Locomotive")

	-- Prow guard: an original burgundy V-plough instead of a slatted cowcatcher.
	Kit.wedge(m, V(5.2, 3.6, 5), T * CFrame.new(-1.4, 2.1, 3.0) * CFrame.Angles(0, rad(25), 0), C.Burgundy, M.Metal, { Name = "Prow" })
	Kit.wedge(m, V(5.2, 3.6, 5), T * CFrame.new(1.4, 2.1, 3.0) * CFrame.Angles(0, rad(-25), 0), C.Burgundy, M.Metal, { Name = "Prow" })
	Kit.box(m, T, -5.2, 0.3, 4.3, 5.2, 0.7, 5.6, C.Charcoal, M.Metal, { Name = "ProwFoot" })
	Kit.box(m, T, -6, 3.6, 4.6, 6, 5.6, 5.6, C.Burgundy, M.Metal, { Name = "BufferBeam" })
	Kit.box(m, T, -6.1, 5.45, 4.5, 6.1, 5.7, 5.7, C.BrassDark, M.Metal, { Name = "BufferBeamTrim" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.cylZ(m, 1.4, 0.8, T * CFrame.new(sx * 4.6, 4.6, 3.9), C.Iron, M.Metal, { Name = "BufferShank" })
		Kit.cylZ(m, 0.3, 1.7, T * CFrame.new(sx * 4.6, 4.6, 3.2), C.Charcoal, M.Metal, { Name = "BufferHead" })
	end

	-- Chassis, running boards and the burgundy valance.
	Kit.box(m, T, -4.4, 3.0, 5.6, 4.4, 5.4, 47, C.Charcoal, M.Metal, { Name = "Frame" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(m, T, sx * 4.4, 7.0, 6, sx * 6.4, 7.4, 37.6, C.Charcoal, M.Metal, { Name = "RunningBoard" })
		Kit.box(m, T, sx * 6.25, 6.0, 6, sx * 6.45, 7.0, 37.6, C.Burgundy, M.Metal, { Name = "Valance" })
	end

	-- Leading truck, cylinders and the three great driving wheels.
	for _, z in ipairs({ 9, 13.4 }) do
		for _, sx in ipairs({ -1, 1 }) do
			smallWheel(m, T, sx * 4.2, z, 1.6)
		end
	end
	for _, sx in ipairs({ -1, 1 }) do
		Kit.cylZ(m, 5, 2.8, T * CFrame.new(sx * 5.0, 4.6, 14.2), C.BlueSteel, M.Metal, { Name = "Cylinder" })
		Kit.cylZ(m, 0.2, 2.2, T * CFrame.new(sx * 5.0, 4.6, 11.6), C.BrassDark, M.Metal, { Name = "CylinderCover" })
		Kit.box(m, T, sx * 5.15, 4.75, 16.6, sx * 5.45, 5.05, 21.2, C.Iron, M.Metal, { Name = "SlideBar" })
		for _, z in ipairs({ 20.5, 27.5, 34.5 }) do
			driver(m, T, sx * 4.5, z, 3.4)
		end
		Kit.box(m, T, sx * 5.05, 1.55, 20.2, sx * 5.4, 2.1, 34.8, C.Iron, M.Metal, { Name = "CouplingRod" })
		Kit.beam(m, T * V(sx * 5.4, 4.6, 17.6), T * V(sx * 5.4, 1.85, 27.5), 0.3, 0.6, C.Iron, M.Metal, { Name = "MainRod" })
	end

	-- Boiler, smokebox and emblem door.
	Kit.cylZ(m, 26.5, 9, T * CFrame.new(0, 12.1, 24.25), C.BlueSteel, M.Metal, { Name = "Boiler" })
	for _, z in ipairs({ 17, 23.5, 30, 36.5 }) do
		Kit.cylZ(m, 0.35, 9.25, T * CFrame.new(0, 12.1, z), C.BrassDark, M.Metal, { Name = "BoilerBand" })
	end
	Kit.cylZ(m, 4.8, 9.6, T * CFrame.new(0, 12.1, 8.9), C.Charcoal, M.Metal, { Name = "Smokebox" })
	Kit.box(m, T, -3.5, 5.4, 6.8, 3.5, 8.6, 11, C.Charcoal, M.Metal, { Name = "Saddle" })
	Kit.cylZ(m, 0.25, 8.3, T * CFrame.new(0, 12.1, 6.45), C.Brass, M.Metal, { Name = "DoorRim" })
	local door = Kit.cylZ(m, 0.3, 7.6, T * CFrame.new(0, 12.1, 6.3), C.Iron, M.Metal, { Name = "SmokeboxDoor" })
	Emblem.Create(Kit.surface(door, Enum.NormalId.Right, 40, { LightInfluence = 0.7 }), { Color = C.Brass, Thickness = 6, Size = UDim2.new(0.8, 0, 0.8, 0) })

	-- Chimney, domes, whistle.
	Kit.cylY(m, 2.6, 2.6, T * CFrame.new(0, 17.3, 8.6), C.Charcoal, M.Metal, { Name = "Chimney" })
	Kit.cylY(m, 0.9, 3.7, T * CFrame.new(0, 19.05, 8.6), C.BlueSteelDark, M.Metal, { Name = "ChimneyCrown" })
	Kit.cylY(m, 0.2, 2.9, T * CFrame.new(0, 19.55, 8.6), C.Charcoal, M.Smooth, { Name = "ChimneyMouth" })
	Kit.cylY(m, 1.6, 3.6, T * CFrame.new(0, 16.9, 21.5), C.BrassDark, M.Metal, { Name = "SteamDomeBase" })
	Kit.ball(m, 3.6, T * CFrame.new(0, 17.6, 21.5), C.BrassDark, M.Metal, { Name = "SteamDome" })
	Kit.cylY(m, 1.4, 3, T * CFrame.new(0, 16.8, 29.5), C.Charcoal, M.Metal, { Name = "SandDomeBase" })
	Kit.ball(m, 3, T * CFrame.new(0, 17.4, 29.5), C.Charcoal, M.Metal, { Name = "SandDome" })
	Kit.cylY(m, 1.6, 0.5, T * CFrame.new(1.3, 17.4, 36), C.Brass, M.Metal, { Name = "Whistle" })

	-- Headlamp, high on the smokebox: recognisable from far away.
	Kit.box(m, T, -0.6, 16.6, 5.6, 0.6, 17.4, 7.0, C.Iron, M.Metal, { Name = "LampBracket" })
	Kit.cylZ(m, 1.8, 2.4, T * CFrame.new(0, 18.4, 6.3), C.Charcoal, M.Metal, { Name = "LampHousing" })
	Kit.box(m, T, -1.3, 19.55, 5.0, 1.3, 19.75, 6.6, C.Iron, M.Metal, { Name = "LampVisor" })
	Kit.cylZ(m, 0.12, 1.8, T * CFrame.new(0, 18.4, 5.38), C.BulbWarm, M.Neon, { Name = "HeadlampLens", CastShadow = false })
	local beam = Kit.marker(m, "HeadlampBeam", V(0.5, 0.5, 0.5), T * CFrame.new(0, 18.4, 5.0))
	Kit.spotLight(beam, Enum.NormalId.Front, 70, 2.6, 38, Color3.fromRGB(255, 206, 150))
	Kit.pointLight(beam, 10, 0.6, Color3.fromRGB(255, 190, 130))

	-- Smoke deflectors with emblem roundels.
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(m, T, sx * 5.55, 8.2, 6.6, sx * 5.8, 15.6, 15.2, C.BlueSteelDark, M.Metal, { Name = "Deflector" })
		Kit.box(m, T, sx * 5.5, 15.4, 6.6, sx * 5.85, 15.7, 15.2, C.BrassDark, M.Metal, { Name = "DeflectorEdge" })
		emblemDisc(m, T * CFrame.new(sx * 5.92, 11.8, 10.9), 2.8, C.Ink, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right)
	end

	-- Cab with porthole windows.
	local CZ0, CZ1 = 37.6, 46.2
	Kit.box(m, T, -5.6, 7.4, CZ0, 5.6, 8.0, CZ1, C.WoodDark, M.Planks, { Name = "CabFloor" })
	Kit.wallX(m, T, CZ0 + 0.25, 0.5, -5.6, 5.6, 8.0, 19.2, {}, C.BlueSteel, M.Metal, { Name = "CabFront" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.wallZ(m, T, sx * 5.35, 0.5, CZ0, CZ1, 7.4, 19.2, { { 39.4, 43.6, 12.6, 16.6 } }, C.BlueSteel, M.Metal, { Name = "CabSide" })
		Kit.box(m, T, sx * 5.35 - 0.3, 7.4, CZ0, sx * 5.35 + 0.3, 10.2, CZ1, C.Burgundy, M.Metal, { Name = "CabPanel" })
		Kit.cylZ(m, 0.3, 2.4, T * CFrame.new(sx * 2.6, 15.2, CZ0 - 0.05), C.Brass, M.Metal, { Name = "PortholeRim" })
		Kit.cylZ(m, 0.36, 1.8, T * CFrame.new(sx * 2.6, 15.2, CZ0 - 0.05), Color3.fromRGB(255, 170, 96), M.Neon, { Name = "Porthole", Transparency = 0.25, CastShadow = false })
		emblemDisc(m, T * CFrame.new(sx * 5.72, 11.4, 41.9), 2.6, C.Ink, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right)
	end
	local cabRoof = { { -6.4, 18.9 }, { -3.2, 20.3 }, { 3.2, 20.3 }, { 6.4, 18.9 } }
	for i = 1, 3 do
		Kit.slabXY(m, T, cabRoof[i][1], cabRoof[i][2], cabRoof[i + 1][1], cabRoof[i + 1][2], CZ0 - 0.6, CZ1 + 0.8, 0.45, C.Charcoal, M.Metal, { Name = "CabRoof" })
	end
	Kit.box(m, T, -1.6, 8.0, CZ0 + 0.55, 1.6, 10.6, CZ0 + 0.8, Color3.fromRGB(255, 120, 52), M.Neon, { Name = "FireboxGlow", Transparency = 0.15, CastShadow = false })

	-- Tender, lettered on both sides.
	local TZ0, TZ1 = 47.2, 64
	Kit.box(m, T, -4.4, 3.0, TZ0, 4.4, 5.0, TZ1, C.Charcoal, M.Metal, { Name = "TenderFrame" })
	Kit.box(m, T, -5.3, 5.0, TZ0, 5.3, 15.0, TZ1 - 0.4, C.BlueSteel, M.Metal, { Name = "TenderBody" })
	Kit.box(m, T, -5.5, 14.6, TZ0 - 0.1, 5.5, 15.2, TZ1 - 0.3, C.Charcoal, M.Metal, { Name = "TenderCoaming" })
	Kit.box(m, T, -4.6, 15.0, TZ0 + 1, 4.6, 16.2, TZ0 + 10, Color3.fromRGB(26, 26, 28), M.Slate, { Name = "Coal" })
	Kit.cylY(m, 0.8, 2.2, T * CFrame.new(0, 15.4, TZ1 - 3), C.Iron, M.Metal, { Name = "WaterHatch" })
	for _, sx in ipairs({ -1, 1 }) do
		local band = Kit.box(m, T, sx * 5.3, 8.0, TZ0 + 0.6, sx * 5.42, 12.4, TZ1 - 1.0, C.Burgundy, M.Metal, { Name = "TenderPanel" })
		local g = Kit.surface(band, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right, 30, { LightInfluence = 0.8 })
		Kit.stroke(Kit.frame(g, { Size = UDim2.new(1, -10, 1, -10), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }), C.BrassDark, 2, 0.2)
		Kit.label(g, "THE LAST TRAIN", { Position = UDim2.new(0.08, 0, 0.22, 0), Size = UDim2.new(0.84, 0, 0.56, 0), Font = Enum.Font.Merriweather, TextColor3 = Color3.fromRGB(196, 158, 96) })
		Kit.box(m, T, sx * 4.6, 1.0, TZ0 + 1.5, sx * 5.1, 3.2, TZ1 - 1.5, C.Charcoal, M.Metal, { Name = "TenderSideFrame" })
		for _, z in ipairs({ 51, 56, 61 }) do
			smallWheel(m, T, sx * 4.2, z, 1.6)
		end
	end
	Kit.box(m, T, -5.6, 3.6, TZ1 - 0.6, 5.6, 5.4, TZ1, C.Burgundy, M.Metal, { Name = "RearBufferBeam" })

	-- Steam: soft and slow so it never hides the silhouette.
	local stack = Kit.marker(m, "SteamSource", V(1, 1, 1), T * CFrame.new(0, 20.2, 8.6))
	local smoke = Instance.new("Smoke")
	smoke.Color = Color3.fromRGB(196, 202, 210)
	smoke.Opacity = 0.12
	smoke.RiseVelocity = 5
	smoke.Size = 4
	smoke.Parent = stack
	for _, sx in ipairs({ -1, 1 }) do
		local cock = Kit.marker(m, "DrainCock", V(0.5, 0.5, 0.5), T * CFrame.new(sx * 5.2, 3.0, 11.6))
		local wisp = Instance.new("Smoke")
		wisp.Color = Color3.fromRGB(210, 214, 220)
		wisp.Opacity = 0.05
		wisp.RiseVelocity = 1
		wisp.Size = 1.6
		wisp.Parent = cock
	end
	Kit.soundEmitter(stack, "EngineIdle")
	Kit.soundEmitter(stack, "SteamRelease")
	return m
end

-- CARRIAGES -------------------------------------------------------------------------
local ROOF_OUT = { { -8.7, 15.1 }, { -6.2, 17.4 }, { -2.6, 18.5 }, { 2.6, 18.5 }, { 6.2, 17.4 }, { 8.7, 15.1 } }
local ROOF_IN = { { -7.05, 15.4 }, { -5.6, 16.55 }, { -2.4, 17.45 }, { 2.4, 17.45 }, { 5.6, 16.55 }, { 7.05, 15.4 } }

local function carriage(train, name, F, style, interiors)
	local m = Kit.model(train, name .. "Carriage")
	local L = TrainBuilder.CAR_LENGTH
	local sealed = style.Sealed == true
	local outerLower = sealed and MYSTERY_METAL or C.BlueSteel
	local outerUpper = sealed and MYSTERY_METAL or C.BlueSteelDark
	local lining = (interiors and not sealed) and style.Lining or nil
	local head = style.WindowHead or 13.4
	local deckLen = style.RearDeck and 5.5 or 0

	-- Running gear and floor.
	Kit.box(m, F, -6.2, 3.4, 1, 6.2, 5.0, L - 1, C.Charcoal, M.Metal, { Name = "Underframe" })
	Kit.box(m, F, -3, 2.6, 16, 3, 3.4, 24, C.Iron, M.Metal, { Name = "EquipmentBox" })
	bogie(m, F, 7)
	bogie(m, F, L - 7)
	Kit.box(m, F, -8, 5.0, 0, 8, 6.0, L + deckLen, C.BlueSteelDark, M.Metal, { Name = "Floor" })

	-- Side walls: exterior metal skin + warm interior lining.
	local holes = {}
	for _, zc in ipairs(style.Windows or {}) do
		table.insert(holes, { zc - style.WindowWidth / 2, zc + style.WindowWidth / 2, 9.4, head })
	end
	for _, zc in ipairs(style.Doors or {}) do
		table.insert(holes, { zc - 2.5, zc + 2.5, 6.0, 13.6 })
	end
	for _, sx in ipairs({ -1, 1 }) do
		for _, r in ipairs(Kit.solidRects(0, L, 5.0, 15.4, holes)) do
			local lower = r[4] <= 9.45
			Kit.box(m, F, sx * 7.2, r[3], r[1], sx * 8.0, r[4], r[2], lower and outerLower or outerUpper, M.Metal, { Name = "Skin" })
			if lining then
				local ly0 = math.max(r[3], 6.0)
				local lz0, lz1 = math.max(r[1], 1), math.min(r[2], L - 1)
				if r[4] > ly0 + 0.01 and lz1 > lz0 + 0.01 then
					Kit.box(m, F, sx * 7.0, ly0, lz0, sx * 7.2, r[4], lz1, lower and lining.Lower or lining.Upper, lower and M.Planks or lining.UpperMaterial, { Name = "Lining" })
				end
			end
		end
		for _, h in ipairs(holes) do
			if h[3] > 7 then
				Kit.part(m, V(0.12, h[4] - h[3], h[2] - h[1]), F * CFrame.new(sx * 7.6, (h[3] + h[4]) / 2, (h[1] + h[2]) / 2), C.Glass, M.Glass, { Name = "Window", Transparency = 0.5, CastShadow = false })
			end
		end
		if not sealed then
			Kit.box(m, F, sx * 8.0, 8.7, 0.2, sx * 8.12, 9.2, L - 0.2, C.Burgundy, M.Smooth, { Name = "Beltline" })
			Kit.box(m, F, sx * 8.0, 9.25, 0.2, sx * 8.2, 9.4, L - 0.2, C.BrassDark, M.Metal, { Name = "Sill" })
			if style.Label ~= "" then
				local board = Kit.box(m, F, sx * 8.0, 13.75, L / 2 - 6, sx * 8.08, 15.05, L / 2 + 6, outerUpper, M.Metal, { Name = "Nameboard" })
				local g = Kit.surface(board, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right, 30, { LightInfluence = 0.9 })
				Kit.label(g, style.Label, { Position = UDim2.new(0.2, 0, 0.1, 0), Size = UDim2.new(0.6, 0, 0.8, 0), TextColor3 = Color3.fromRGB(190, 152, 92) })
			end
			emblemDisc(m, F * CFrame.new(sx * 8.05, 7.2, L / 2), 2.4, C.Ink, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right)
		else
			-- Sealed carriage: shuttered windows and a large emblem. No name.
			for _, zc in ipairs(style.Shutters or {}) do
				local sh = Kit.box(m, F, sx * 8.0, 9.6, zc - 2, sx * 8.15, 13.2, zc + 2, Color3.fromRGB(40, 44, 52), M.Corroded, { Name = "Shutter" })
				local g = Kit.surface(sh, sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right, 20)
				for i = 1, 6 do
					Kit.frame(g, { Position = UDim2.new(0.05, 0, i / 7.5, 0), Size = UDim2.new(0.9, 0, 0.04, 0), BackgroundTransparency = 0.2, BackgroundColor3 = Color3.fromRGB(20, 22, 26) })
				end
			end
			emblemDisc(m, F * CFrame.new(sx * 8.05, 11.4, L / 2), 4.6, Color3.fromRGB(150, 120, 74), sx < 0 and Enum.NormalId.Left or Enum.NormalId.Right)
			Kit.box(m, F, sx * 8.0, 6.2, 1, sx * 8.06, 6.32, L - 1, Color3.fromRGB(120, 168, 210), M.Neon, { Name = "ColdSeam", Transparency = 0.55, CastShadow = false })
		end
	end

	-- End walls (doorways unless sealed).
	local endHole = sealed and {} or { { -3, 3, 6.0, 14.0 } }
	for _, zc in ipairs({ 0.5, L - 0.5 }) do
		Kit.wallX(m, F, zc, 1, -8, 8, 5.0, 15.4, endHole, outerUpper, M.Metal, { Name = "EndWall" })
		if lining then
			local inner = zc < L / 2 and zc + 0.6 or zc - 0.6
			Kit.wallX(m, F, inner, 0.2, -7, 7, 6.0, 15.4, endHole, lining.Lower, M.Planks, { Name = "EndLining" })
		end
		Kit.box(m, F, -7, 15.4, zc - 0.5, 7, 17.2, zc + 0.5, outerUpper, M.Metal, { Name = "EndGable" })
		Kit.box(m, F, -3.2, 17.2, zc - 0.5, 3.2, 18.3, zc + 0.5, outerUpper, M.Metal, { Name = "EndGable" })
	end

	-- Segmented arched roof (and a matching ceiling inside).
	for i = 1, #ROOF_OUT - 1 do
		local a, b = ROOF_OUT[i], ROOF_OUT[i + 1]
		Kit.slabXY(m, F, a[1], a[2], b[1], b[2], -0.3, L + 0.3 + deckLen, 0.5, sealed and Color3.fromRGB(26, 28, 34) or C.Charcoal, M.Metal, { Name = "Roof" })
		if lining then
			local c, d = ROOF_IN[i], ROOF_IN[i + 1]
			Kit.slabXY(m, F, c[1], c[2], d[1], d[2], 1, L - 1, 0.25, lining.Ceiling, M.Wood, { Name = "Ceiling" })
		end
	end
	Kit.box(m, F, -1.8, 18.5, 12, 1.8, 19.4, 16, C.Iron, M.Metal, { Name = "Ventilator" })
	Kit.box(m, F, -1.8, 18.5, L - 16, 1.8, 19.4, L - 12, C.Iron, M.Metal, { Name = "Ventilator" })

	if lining then
		Kit.box(m, F, -7, 6.0, 1, 7, 6.1, L - 1, lining.Floor, lining.FloorMaterial, { Name = "FloorCovering" })
		for _, z in ipairs(style.Lamps or {}) do
			local lamp = Instance.new("Model")
			lamp.Name = "CeilingLamp"
			lamp.Parent = m
			Kit.cylY(lamp, 0.25, 1.6, F * CFrame.new(0, 17.32, z), C.BrassDark, M.Metal, { Name = "Rose" })
			Kit.cylY(lamp, 1.1, 0.14, F * CFrame.new(0, 16.7, z), C.Iron, M.Metal, { Name = "Rod" })
			Kit.cylY(lamp, 0.6, 2.0, F * CFrame.new(0, 16.0, z), C.BrassDark, M.Metal, { Name = "Shade" })
			Kit.bulb(lamp, 0.8, F * CFrame.new(0, 15.55, z), C.BulbWarm, 22, 1.05, style.LightColor)
		end
	elseif not sealed then
		-- Exterior-only build (lobby teaser): fake a lit interior behind the glass.
		for _, sx in ipairs({ -1, 1 }) do
			Kit.box(m, F, sx * 6.4, 9.2, 2, sx * 6.6, 13.6, L - 2, Color3.fromRGB(196, 124, 64), M.Neon, { Name = "InteriorGlow", Transparency = 0.35, CastShadow = false })
		end
	end

	-- Rear observation deck (Boarding carriage only).
	if style.RearDeck then
		local d0, d1 = L, L + deckLen
		for _, sx in ipairs({ -1, 1 }) do
			Kit.box(m, F, sx * 7.4, 6.0, d0, sx * 7.6, 9.6, d1, C.Iron, M.Metal, { Name = "DeckRailSide" })
			Kit.box(m, F, sx * 7.3, 9.6, d0, sx * 7.7, 9.85, d1, C.Brass, M.Metal, { Name = "DeckRailTop" })
		end
		Kit.box(m, F, -7.6, 6.0, d1 - 0.2, 7.6, 9.6, d1, C.Iron, M.Metal, { Name = "DeckRailBack" })
		Kit.box(m, F, -7.7, 9.6, d1 - 0.3, 7.7, 9.85, d1 + 0.1, C.Brass, M.Metal, { Name = "DeckRailTop" })
		-- invisible guard: players can look out, but never fall off the train
		Kit.part(m, V(0.4, 9, deckLen), F * CFrame.new(-7.5, 14.1, (d0 + d1) / 2), C.Glass, M.Smooth, { Name = "DeckGuard", Transparency = 1, CastShadow = false })
		Kit.part(m, V(0.4, 9, deckLen), F * CFrame.new(7.5, 14.1, (d0 + d1) / 2), C.Glass, M.Smooth, { Name = "DeckGuard", Transparency = 1, CastShadow = false })
		Kit.part(m, V(15.4, 9, 0.4), F * CFrame.new(0, 14.1, d1), C.Glass, M.Smooth, { Name = "DeckGuard", Transparency = 1, CastShadow = false })
		Kit.ball(m, 0.6, F * CFrame.new(5.6, 16.6, d1 + 0.1), Color3.fromRGB(200, 60, 52), M.Neon, { Name = "TailLamp", CastShadow = false })
		Kit.ball(m, 0.6, F * CFrame.new(-5.6, 16.6, d1 + 0.1), Color3.fromRGB(200, 60, 52), M.Neon, { Name = "TailLamp", CastShadow = false })
	end
	return m
end

local function gangway(train, T, z0, z1)
	local g = Kit.model(train, "Gangway")
	local col = Color3.fromRGB(34, 32, 30)
	Kit.box(g, T, -3.9, 6.0, z0, -3.0, 14.6, z1, col, M.Fabric, { Name = "Bellows" })
	Kit.box(g, T, 3.0, 6.0, z0, 3.9, 14.6, z1, col, M.Fabric, { Name = "Bellows" })
	Kit.box(g, T, -3.9, 14.0, z0, 3.9, 14.6, z1, col, M.Fabric, { Name = "Bellows" })
	Kit.box(g, T, -3.0, 5.7, z0 - 0.3, 3.0, 6.0, z1 + 0.3, C.Iron, M.Plate, { Name = "BridgePlate" })
	return g
end

function TrainBuilder.Build(parent, T, opts)
	opts = opts or {}
	local train = Kit.model(parent, opts.Name or "TheLastTrain")
	locomotive(train, T)
	local info = { Carriages = {}, Order = {} }
	local z = TrainBuilder.LOCO_LENGTH + TrainBuilder.GAP
	local prevEnd = TrainBuilder.LOCO_LENGTH
	for _, name in ipairs(opts.Carriages or {}) do
		local style = TrainBuilder.Styles[name]
		local F = T * CFrame.new(0, 0, z)
		carriage(train, name, F, style, opts.Interiors)
		if prevEnd ~= TrainBuilder.LOCO_LENGTH then
			gangway(train, T, prevEnd, z)
		end
		info.Carriages[name] = { Z0 = z, Frame = F }
		table.insert(info.Order, name)
		prevEnd = z + TrainBuilder.CAR_LENGTH
		z = prevEnd + TrainBuilder.GAP
	end
	info.Length = prevEnd
	return train, info
end

return TrainBuilder
