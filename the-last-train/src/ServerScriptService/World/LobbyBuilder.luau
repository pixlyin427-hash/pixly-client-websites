--[[
	LobbyBuilder — THE EXPEDITION TERMINAL

	Layout (top view, +Z is north, players spawn facing north):

	   z=66  ┌──────────── north wall (high windows) ────────────┐
	         │  [SOLO] [ DUO ] [ SQUAD ] [   CREW   ]   lower     │ east wall:
	         │                                         platform   │ tall arched
	   z=27  │            ═══ grand stairs ═══          (y=-6)    │ windows onto
	   z=16  │------------ balustrade -------------------------- │ the train yard
	         │  outfitters            (clock overhead)            │ (teaser train)
	         │  route map   kiosk+Keeper  info board   view bay    │
	         │                   ║ guidance path ║                │
	  z=-52  │                   ◎ spawn medallion                │
	  z=-64  └──────────── south wall: grand entrance ───────────┘
	        x=-44                                              x=44

	The concourse floor is y=0, the lower platform y=-6.
	Sightline from spawn: path -> clock -> platform sign -> cabins.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.BuildKit)
local Props = require(script.Parent.Props)
local Graphics = require(script.Parent.Graphics)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)
local CabinDefinitions = require(ReplicatedStorage.Shared.Config.CabinDefinitions)

local C, M = Kit.C, Kit.M
local rad = math.rad

local LobbyBuilder = {}

local O = CFrame.new()
local HX = 44
local CZ0, CZ1 = -64, 16
local PZ0, PZ1 = 27, 66
local PY = -6
local ROOF = { { -44, 30 }, { -34, 37 }, { -20, 42 }, { 0, 44 }, { 20, 42 }, { 34, 37 }, { 44, 30 } }
local TRUSS_Z = { -56, -40, -24, -8, 8, 24, 40, 56 }

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

local function roofY(x)
	for i = 1, #ROOF - 1 do
		local a, b = ROOF[i], ROOF[i + 1]
		if x >= a[1] and x <= b[1] then
			local t = (x - a[1]) / (b[1] - a[1])
			return a[2] + (b[2] - a[2]) * t
		end
	end
	return 30
end

-- FLOORS & STAIRS --------------------------------------------------------------
local function buildFloors(model)
	local floors = Kit.folder(model, "Floors")
	Kit.box(floors, O, -HX, PY, CZ0, HX, 0, CZ1, C.Floor, M.Slate, { Name = "ConcourseFloor" })
	Kit.box(floors, O, -HX, PY - 7, PZ0, HX, PY, PZ1, C.StoneDark, M.Slate, { Name = "PlatformFloor" })

	-- Guidance: a lighter stone runner with brass inlay leads from the spawn
	-- medallion straight to the stairs. No arrows needed.
	Kit.box(floors, O, -5, 0, -58, 5, 0.06, CZ1, C.StoneLight, M.Concrete, { Name = "GuidePath" })
	Kit.box(floors, O, -5.3, 0, -58, -5, 0.08, CZ1, C.Brass, M.Metal, { Name = "GuideInlay" })
	Kit.box(floors, O, 5, 0, -58, 5.3, 0.08, CZ1, C.Brass, M.Metal, { Name = "GuideInlay" })
	-- Border band where floor meets the walls.
	Kit.box(floors, O, -HX, 0, CZ0, HX, 0.04, CZ0 + 3, C.StoneDark, M.Slate, { Name = "Border" })

	-- Boardwalk in front of the cabins.
	Kit.box(floors, O, -41, PY, 39, 41, PY + 0.06, 46, C.Wood, M.Planks, { Name = "Boardwalk" })

	-- Grand stairs (z 16 -> 27, 0.5 stud rise per step).
	local stairs = Kit.folder(model, "Stairs")
	for i = 1, 11 do
		Kit.box(stairs, O, -12, PY, CZ1 + i - 1, 12, -0.5 * i, CZ1 + i, C.StoneLight, M.Slate, { Name = "Step" .. i })
	end
	for _, sx in ipairs({ -1, 1 }) do
		local x = sx * 12.6
		Kit.wedge(stairs, V(1.2, 6, 11), CFrame.new(x, PY + 4, CZ1 + 5.5) * CFrame.Angles(0, rad(180), 0), C.Stone, M.Slate, { Name = "StairCheek" })
		Kit.box(stairs, O, x - 0.6, PY, CZ1, x + 0.6, PY + 1, CZ1 + 11, C.Stone, M.Slate, { Name = "StairCheekBase" })
		Kit.box(stairs, O, x - 0.6, 0, CZ1 - 1.2, x + 0.6, 1.2, CZ1, C.Stone, M.Slate, { Name = "StairCheekTop" })
		Kit.beam(stairs, V(x, 2.5, CZ1 - 0.4), V(x, PY + 2.4, CZ1 + 11), 0.35, 0.35, C.Brass, M.Metal, { Name = "Handrail" })
		Kit.cylY(stairs, 3.2, 0.9, CFrame.new(x, 1.6, CZ1 - 0.6), C.Iron, M.Metal, { Name = "Newel" })
		Kit.ball(stairs, 1.0, CFrame.new(x, 3.4, CZ1 - 0.6), C.Brass, M.Metal, { Name = "NewelCap" })
	end

	-- Balustrade along the concourse edge.
	for _, sx in ipairs({ -1, 1 }) do
		local x0, x1 = sx * 13.2, sx * HX
		Kit.box(stairs, O, math.min(x0, x1), 0, CZ1 - 0.5, math.max(x0, x1), 1, CZ1 + 0.5, C.Stone, M.Slate, { Name = "BalustradeBase" })
		Kit.box(stairs, O, math.min(x0, x1), 3.0, CZ1 - 0.15, math.max(x0, x1), 3.3, CZ1 + 0.15, C.Brass, M.Metal, { Name = "BalustradeRail" })
		for k = 0, 5 do
			local x = x0 + (x1 - x0) * k / 5
			Kit.cylY(stairs, 2.1, 0.3, CFrame.new(x, 2.05, CZ1), C.Iron, M.Metal, { Name = "BalustradePost" })
		end
	end
end

-- WALLS ------------------------------------------------------------------------
local function glassPane(parent, cf, size)
	return Kit.part(parent, size, cf, C.Glass, M.Glass, { Name = "WindowGlass", Transparency = 0.62, CastShadow = false })
end

local function eastWindows(walls)
	local holes = {}
	local windows = {}
	for _, zc in ipairs({ -52, -36, -20, -4 }) do
		table.insert(holes, { zc - 5, zc + 5, 4, 22 })
		table.insert(windows, { zc, 4 })
	end
	for _, zc in ipairs({ 36, 52 }) do
		table.insert(holes, { zc - 5, zc + 5, -2, 22 })
		table.insert(windows, { zc, -2 })
	end
	Kit.wallZ(walls, O, HX + 1, 2, CZ0 - 2, PZ1 + 2, -13, 30, holes, C.Stone, M.Brick, { Name = "EastWall" })
	for _, w in ipairs(windows) do
		local zc, y0 = w[1], w[2]
		-- arched top corners
		Kit.wedge(walls, V(2, 2.5, 2.5), CFrame.new(HX + 1, 20.75, zc - 3.75) * CFrame.Angles(rad(180), 0, 0), C.Stone, M.Brick, { Name = "ArchCorner" })
		Kit.wedge(walls, V(2, 2.5, 2.5), CFrame.new(HX + 1, 20.75, zc + 3.75) * CFrame.Angles(0, 0, rad(180)), C.Stone, M.Brick, { Name = "ArchCorner" })
		glassPane(walls, CFrame.new(HX + 1, (y0 + 22) / 2, zc), V(0.2, 22 - y0, 10))
		Kit.box(walls, O, HX + 0.6, y0, zc - 0.15, HX + 1.4, 22, zc + 0.15, C.Iron, M.Metal, { Name = "Mullion" })
		for _, t in ipairs({ 0.36, 0.7 }) do
			local y = y0 + (22 - y0) * t
			Kit.box(walls, O, HX + 0.6, y - 0.15, zc - 5, HX + 1.4, y + 0.15, zc + 5, C.Iron, M.Metal, { Name = "Transom" })
		end
		Kit.box(walls, O, HX - 0.8, y0 - 0.3, zc - 5.6, HX, y0, zc + 5.6, C.StoneLight, M.Slate, { Name = "Sill" })
	end
	-- Pilasters between bays add depth to the long wall.
	for _, z in ipairs({ -60, -44, -28, -12, 4, 28, 44, 60 }) do
		local y0 = z > CZ1 and PY or 0
		Kit.box(walls, O, HX - 1.2, y0, z - 1, HX, 30, z + 1, C.StoneLight, M.Slate, { Name = "Pilaster" })
	end
end

local function westWall(walls)
	local holes = {
		{ -2, 12, 0, 10 }, -- outfitters alcove
		{ -56, -48, 17, 25 },
		{ -16, -8, 17, 25 },
		{ 48, 56, 17, 25 },
	}
	Kit.wallZ(walls, O, -HX - 1, 2, CZ0 - 2, PZ1 + 2, -13, 30, holes, C.Stone, M.Brick, { Name = "WestWall" })
	for _, zc in ipairs({ -52, -12, 52 }) do
		glassPane(walls, CFrame.new(-HX - 1, 21, zc), V(0.2, 8, 8))
		Kit.box(walls, O, -HX - 1.4, 20.85, zc - 4, -HX - 0.6, 21.15, zc + 4, C.Iron, M.Metal, { Name = "Transom" })
	end
	for _, z in ipairs({ -60, -46, -20, -4, 14, 28, 44, 60 }) do
		local y0 = z > CZ1 and PY or 0
		Kit.box(walls, O, -HX, y0, z - 1, -HX + 1.2, 30, z + 1, C.StoneLight, M.Slate, { Name = "Pilaster" })
	end

	-- Future cosmetic area: a closed outfitters shop front. Shutter down,
	-- no interaction yet — it simply exists in the world.
	local alcove = Kit.model(walls, "OutfittersAlcove")
	Kit.box(alcove, O, -52, PY, -2, -46, 0, 12, C.Floor, M.Slate, { Name = "AlcoveFloor" })
	Kit.box(alcove, O, -53, -1, -3, -52, 12, 13, C.Stone, M.Brick, { Name = "AlcoveBack" })
	Kit.box(alcove, O, -52, -1, -3, -46, 12, -2, C.Stone, M.Brick, { Name = "AlcoveSide" })
	Kit.box(alcove, O, -52, -1, 12, -46, 12, 13, C.Stone, M.Brick, { Name = "AlcoveSide" })
	Kit.box(alcove, O, -53, 10, -3, -46, 12, 13, C.Stone, M.Brick, { Name = "AlcoveCeiling" })
	local shutter = Kit.box(alcove, O, -44.9, 0, -2, -44.5, 9, 12, C.BlueSteelDark, M.Corroded, { Name = "Shutter" })
	local sg = Kit.surface(shutter, Enum.NormalId.Right, 20)
	for i = 0, 17 do
		Kit.frame(sg, { Position = UDim2.new(0, 0, i / 18, 0), Size = UDim2.new(1, 0, 0.012, 0), BackgroundTransparency = 0.3, BackgroundColor3 = C.Charcoal })
	end
	Kit.cylZ(alcove, 14.4, 1.4, CFrame.new(-44.4, 9.6, 5), C.Iron, M.Metal, { Name = "ShutterDrum" })
	local sign = Kit.box(alcove, O, -44, 10.6, 0.5, -43.7, 12.8, 9.5, C.Charcoal, M.Smooth, { Name = "OutfittersSign" })
	Graphics.signPlate(Kit.surface(sign, Enum.NormalId.Right, 40), "EXPEDITION OUTFITTERS", "", { TitleColor = C.Brass })
end

local function southWall(walls)
	Kit.wallX(walls, O, CZ0 - 1, 2, -HX - 2, HX + 2, -13, 30, { { -7, 7, 0, 15 } }, C.Stone, M.Brick, { Name = "SouthWall" })
	-- arched corners (right angle at the top outer corner of the opening)
	Kit.wedge(walls, V(2, 3, 3), CFrame.new(-5.5, 13.5, CZ0 - 1) * CFrame.Angles(0, rad(90), 0) * CFrame.Angles(rad(180), 0, 0), C.Stone, M.Brick, { Name = "ArchCorner" })
	Kit.wedge(walls, V(2, 3, 3), CFrame.new(5.5, 13.5, CZ0 - 1) * CFrame.Angles(0, rad(-90), 0) * CFrame.Angles(rad(180), 0, 0), C.Stone, M.Brick, { Name = "ArchCorner" })

	-- The grand entrance stays shut: players arrived by the terminal's own means.
	local doors = Kit.model(walls, "GrandEntrance")
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(doors, O, sx < 0 and -7 or 0.05, 0, CZ0 - 0.9, sx < 0 and -0.05 or 7, 15, CZ0 - 0.3, C.WoodDark, M.Wood, { Name = "DoorLeaf" })
		for _, y in ipairs({ 3, 8, 12.5 }) do
			Kit.box(doors, O, sx < 0 and -6.6 or 0.4, y, CZ0 - 0.3, sx < 0 and -0.4 or 6.6, y + 0.3, CZ0 - 0.2, C.BrassDark, M.Metal, { Name = "DoorStrap" })
		end
	end
	Kit.box(doors, O, -8, 15, CZ0 - 0.4, 8, 16, CZ0 + 0.2, C.StoneLight, M.Slate, { Name = "Lintel" })
	local disc = Kit.cylZ(doors, 0.3, 4.2, CFrame.new(0, 7.5, CZ0 - 0.1), C.Brass, M.Metal, { Name = "EntranceRoundel" })
	Emblem.Create(Kit.surface(disc, Enum.NormalId.Left, 60), { Color = C.Ink, Thickness = 5, Size = UDim2.new(0.9, 0, 0.9, 0) })

	-- Station name over the entrance (seen when players turn around).
	local plate = Kit.box(walls, O, -16, 18, CZ0 - 0.3, 16, 23.5, CZ0 + 0.1, C.Charcoal, M.Smooth, { Name = "StationNameplate" })
	Graphics.signPlate(Kit.surface(plate, Enum.NormalId.Back, 30), "THE LAST TRAIN", "EXPEDITION TERMINAL", { TitleFont = Enum.Font.Merriweather, TitleColor = C.Parchment })
end

local function northWall(walls)
	local holes = {}
	for _, xc in ipairs({ -30, -10, 10, 30 }) do
		table.insert(holes, { xc - 5, xc + 5, 12, 26 })
	end
	Kit.wallX(walls, O, PZ1 + 1, 2, -HX - 2, HX + 2, -13, 30, holes, C.Stone, M.Brick, { Name = "NorthWall" })
	for _, xc in ipairs({ -30, -10, 10, 30 }) do
		glassPane(walls, CFrame.new(xc, 19, PZ1 + 1), V(10, 14, 0.2))
		Kit.box(walls, O, xc - 0.15, 12, PZ1 + 0.6, xc + 0.15, 26, PZ1 + 1.4, C.Iron, M.Metal, { Name = "Mullion" })
		Kit.box(walls, O, xc - 5, 18.85, PZ1 + 0.6, xc + 5, 19.15, PZ1 + 1.4, C.Iron, M.Metal, { Name = "Transom" })
	end
end

local function gable(walls, z, roundWindow)
	local t = 2
	Kit.box(walls, O, -34, 30, z - t / 2, 34, 37, z + t / 2, C.Stone, M.Brick, { Name = "Gable" })
	Kit.box(walls, O, -20, 37, z - t / 2, 20, 42, z + t / 2, C.Stone, M.Brick, { Name = "Gable" })
	Kit.triXY(walls, O, -HX - 2, -34, 28.6, 37, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	Kit.triXY(walls, O, -34, -20, 37, 42, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	Kit.triXY(walls, O, -20, 0, 42, 44, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	Kit.triXY(walls, O, 20, 0, 42, 44, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	Kit.triXY(walls, O, 34, 20, 37, 42, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	Kit.triXY(walls, O, HX + 2, 34, 28.6, 37, z, t, C.Stone, M.Brick, { Name = "GableTri" })
	if roundWindow then
		Kit.cylZ(walls, t + 0.3, 8.4, CFrame.new(0, 36, z), C.Iron, M.Metal, { Name = "RoundWindowRim" })
		Kit.cylZ(walls, t + 0.5, 7.2, CFrame.new(0, 36, z), Color3.fromRGB(58, 74, 98), M.Glass, { Name = "RoundWindow" })
	end
end

-- ROOF -------------------------------------------------------------------------
local function buildRoof(model)
	local roof = Kit.folder(model, "Roof")
	local z0, z1 = CZ0 - 3, PZ1 + 3
	for i = 1, #ROOF - 1 do
		local a, b = ROOF[i], ROOF[i + 1]
		local xa, ya, xb, yb = a[1], a[2], b[1], b[2]
		if i == 1 then
			xa, ya = xa - 3, ya - 2.1
		elseif i == #ROOF - 1 then
			xb, yb = xb + 3, yb - 2.1
		end
		local glass = (i == 3 or i == 4)
		if glass then
			Kit.slabXY(roof, O, xa, ya, xb, yb, z0, z1, 0.4, Color3.fromRGB(70, 88, 110), M.Glass, { Name = "Skylight", Transparency = 0.45, CastShadow = false })
		else
			Kit.slabXY(roof, O, xa, ya, xb, yb, z0, z1, 1, C.WoodDark, M.Planks, { Name = "RoofSlab" })
		end
	end
	-- Ridge cap and glazing bars on the skylight.
	Kit.box(roof, O, -0.8, 44, z0, 0.8, 44.8, z1, C.Iron, M.Metal, { Name = "Ridge" })
	for z = z0 + 6, z1 - 6, 13 do
		Kit.beam(roof, V(-20, 41.95, z), V(0, 43.95, z), 0.3, 0.3, C.Iron, M.Metal, { Name = "GlazingBar" })
		Kit.beam(roof, V(0, 43.95, z), V(20, 41.95, z), 0.3, 0.3, C.Iron, M.Metal, { Name = "GlazingBar" })
	end

	-- Riveted arch trusses: the hall's rhythm and its strongest silhouette.
	for _, z in ipairs(TRUSS_Z) do
		local truss = Kit.model(roof, "Truss")
		for i = 1, #ROOF - 1 do
			local a, b = ROOF[i], ROOF[i + 1]
			Kit.beam(truss, V(a[1] * 0.985, a[2] - 0.9, z), V(b[1] * 0.985, b[2] - 0.9, z), 0.8, 1.4, C.Iron, M.Metal, { Name = "Rafter" })
		end
		Kit.beam(truss, V(-43.4, 30.3, z), V(43.4, 30.3, z), 0.4, 0.4, C.Iron, M.Metal, { Name = "Tie" })
		for _, x in ipairs({ -20, 0, 20 }) do
			Kit.beam(truss, V(x, 30.3, z), V(x, roofY(x) - 1.6, z), 0.3, 0.3, C.Iron, M.Metal, { Name = "Hanger" })
		end
		for _, sx in ipairs({ -1, 1 }) do
			Kit.beam(truss, V(sx * 43.2, 25, z), V(sx * 37, 33.2, z), 0.6, 0.9, C.Iron, M.Metal, { Name = "KneeBrace" })
			Kit.box(truss, O, sx * 43.9 - 0.9, 23.5, z - 1.1, sx * 43.9 + 0.9, 25, z + 1.1, C.StoneLight, M.Slate, { Name = "Corbel" })
		end
		Kit.cylZ(truss, 0.9, 1.6, CFrame.new(0, 30.3, z), C.BrassDark, M.Metal, { Name = "TieBoss" })
	end
end

-- THE STATION CLOCK (central landmark) ----------------------------------------
local ROMAN = { "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI" }

local function clockFace(g)
	local dial = Kit.frame(g, { Name = "Dial", Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Parchment })
	Kit.corner(dial, 0.5, 0)
	local rim = Kit.frame(g, { Size = UDim2.new(0.93, 0, 0.93, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) })
	Kit.corner(rim, 0.5, 0)
	Kit.stroke(rim, C.Ink, 4, 0.1)
	for i = 0, 59 do
		local major = (i % 5 == 0)
		local a = rad(i * 6)
		local r = 0.415
		Kit.frame(g, {
			Name = "Tick",
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(0.5 + r * math.sin(a), 0, 0.5 - r * math.cos(a), 0),
			Size = major and UDim2.new(0.014, 0, 0.055, 0) or UDim2.new(0.006, 0, 0.028, 0),
			Rotation = i * 6,
			BackgroundTransparency = 0,
			BackgroundColor3 = C.Ink,
		})
	end
	-- A thirteenth mark, between XI and XII. Nobody mentions it.
	Kit.frame(g, {
		Name = "Mark13",
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.new(0.5 + 0.415 * math.sin(rad(345)), 0, 0.5 - 0.415 * math.cos(rad(345)), 0),
		Size = UDim2.new(0.01, 0, 0.05, 0),
		Rotation = 345,
		BackgroundTransparency = 0,
		BackgroundColor3 = C.Burgundy,
	})
	for h = 1, 11 do
		local a = rad(h * 30)
		Kit.label(g, ROMAN[h], {
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.new(0.5 + 0.33 * math.sin(a), 0, 0.5 - 0.33 * math.cos(a), 0),
			Size = UDim2.new(0.13, 0, 0.085, 0),
			Font = Enum.Font.Merriweather,
			TextColor3 = C.Ink,
		})
	end
	Emblem.Create(g, { Size = UDim2.new(0.13, 0, 0.13, 0), Position = UDim2.new(0.5, 0, 0.17, 0), Color = C.Burgundy, Thickness = 2 })
	Kit.label(g, "THE LAST TRAIN", { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.66, 0), Size = UDim2.new(0.3, 0, 0.04, 0), TextColor3 = C.Burgundy })

	local function hand(name, width, length, color)
		local holder = Kit.frame(g, { Name = name, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(width, 0, length * 2, 0) })
		Kit.frame(holder, { Name = "Blade", Size = UDim2.new(1, 0, 0.5, 0), BackgroundTransparency = 0, BackgroundColor3 = color })
		return holder
	end
	hand("HourHand", 0.03, 0.24, C.Ink)
	hand("MinuteHand", 0.02, 0.36, C.Ink)
	hand("SecondHand", 0.008, 0.39, C.Burgundy)
	local cap = Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(0.05, 0, 0.05, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
	Kit.corner(cap, 0.5, 0)
end

local function buildClock(model)
	local clock = Kit.model(model, "StationClock")
	local cx, cy, cz = 0, 21, -24
	local center = CFrame.new(cx, cy, cz)
	local drum = Kit.cylZ(clock, 2.4, 12, center, C.Charcoal, M.Metal, { Name = "Drum" })
	for _, s in ipairs({ -1, 1 }) do
		Kit.cylZ(clock, 0.4, 12.8, center * CFrame.new(0, 0, s * 1.2), C.Brass, M.Metal, { Name = "Bezel" })
		local face = Kit.cylZ(clock, 0.06, 11, center * CFrame.new(0, 0, s * 1.42), C.Parchment, M.Smooth, { Name = s < 0 and "FaceSouth" or "FaceNorth", CastShadow = false })
		clockFace(Kit.surface(face, s < 0 and Enum.NormalId.Right or Enum.NormalId.Left, 44, { LightInfluence = 0.25, Brightness = 1.2, MaxDistance = 400 }))
	end
	Kit.part(clock, V(3.2, 1.1, 2.8), center * CFrame.new(0, 6.4, 0), C.Iron, M.Metal, { Name = "Crown" })
	Kit.ball(clock, 1.3, center * CFrame.new(0, 7.4, 0), C.Brass, M.Metal, { Name = "Finial" })
	Kit.ball(clock, 1.0, center * CFrame.new(0, -6.3, 0), C.Brass, M.Metal, { Name = "Pendant" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.beam(clock, V(cx + sx * 1.2, cy + 6.9, cz), V(cx + sx * 1.2, 30.3, cz), 0.25, 0.25, C.Iron, M.Metal, { Name = "Rod" })
		-- small lamps on scrolled arms light the dials softly
		Kit.beam(clock, V(cx + sx * 5.6, cy + 2.6, cz), V(cx + sx * 7.4, cy + 4.6, cz), 0.3, 0.3, C.Iron, M.Metal, { Name = "LampArm" })
		Kit.cylY(clock, 0.4, 1.1, CFrame.new(cx + sx * 7.4, cy + 5.0, cz), C.Iron, M.Metal, { Name = "LampCap" })
		Kit.bulb(clock, 0.8, CFrame.new(cx + sx * 7.4, cy + 4.4, cz), C.BulbWarm, 18, 0.9)
	end
	Kit.soundEmitter(drum, "ClockTick")
	return clock
end

-- INFORMATION BOARD, KIOSK, SIGNS ------------------------------------------------
local function buildInfoBoard(model)
	local board = Kit.model(model, "InformationBoard")
	local f = CFrame.new(-15, 0, -34) * CFrame.Angles(0, rad(-35), 0)
	for _, sx in ipairs({ -1, 1 }) do
		Kit.cylY(board, 11, 0.6, f * CFrame.new(sx * 6.6, 5.5, 0.1), C.Iron, M.Metal, { Name = "Post" })
		Kit.part(board, V(1.4, 0.6, 1.4), f * CFrame.new(sx * 6.6, 0.3, 0.1), C.Iron, M.Metal, { Name = "Foot" })
	end
	local panel = Kit.part(board, V(13, 6, 0.5), f * CFrame.new(0, 7, 0), C.Charcoal, M.Smooth, { Name = "BoardPanel" })
	Kit.part(board, V(14, 0.35, 2.2), f * CFrame.new(0, 10.4, -0.3) * CFrame.Angles(rad(-12), 0, 0), C.Iron, M.Metal, { Name = "Hood" })
	Kit.part(board, V(13.2, 0.25, 0.7), f * CFrame.new(0, 3.9, 0), C.Brass, M.Metal, { Name = "Trim" })
	Kit.bulb(board, 0.5, f * CFrame.new(-3.5, 10, -1.0), C.BulbWarm)
	Kit.bulb(board, 0.5, f * CFrame.new(3.5, 10, -1.0), C.BulbWarm, 14, 0.7)

	local g = Kit.surface(panel, Enum.NormalId.Front, 40, { LightInfluence = 0.35, Brightness = 1.1 })
	Kit.frame(g, { Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(26, 25, 24) })
	Kit.stroke(Kit.frame(g, { Size = UDim2.new(1, -10, 1, -10), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }), C.Brass, 2, 0.3)
	Kit.label(g, "THE LAST TRAIN", { Position = UDim2.new(0.1, 0, 0.07, 0), Size = UDim2.new(0.8, 0, 0.2, 0), Font = Enum.Font.Merriweather, TextColor3 = C.Parchment })
	Kit.label(g, "EXPEDITIONS DEPART FROM THE LOWER PLATFORM", { Position = UDim2.new(0.08, 0, 0.29, 0), Size = UDim2.new(0.84, 0, 0.09, 0), TextColor3 = C.Brass })
	Kit.frame(g, { Position = UDim2.new(0.08, 0, 0.43, 0), Size = UDim2.new(0.84, 0, 0.006, 0), BackgroundTransparency = 0.4, BackgroundColor3 = C.Brass })
	for i, def in ipairs(CabinDefinitions) do
		local y = 0.48 + (i - 1) * 0.12
		Kit.label(g, def.DisplayName, { Name = "Row_" .. def.Id, Position = UDim2.new(0.1, 0, y, 0), Size = UDim2.new(0.5, 0, 0.09, 0), TextXAlignment = Enum.TextXAlignment.Left, TextColor3 = C.Parchment })
		Kit.label(g, "AVAILABLE", { Name = "Status_" .. def.Id, Position = UDim2.new(0.6, 0, y, 0), Size = UDim2.new(0.3, 0, 0.09, 0), TextXAlignment = Enum.TextXAlignment.Right, TextColor3 = C.Brass })
	end
	local back = Kit.surface(panel, Enum.NormalId.Back, 30)
	Kit.frame(back, { Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(26, 25, 24) })
	Emblem.Create(back, { Size = UDim2.new(0.34, 0, 0.74, 0), Color = C.BrassDark, Thickness = 3 })
	Kit.tag(board, "DeparturesBoard")
	return board
end

local function buildKiosk(model)
	local kiosk = Kit.model(model, "StationOffice")
	local f = CFrame.new(-23, 0, -23) * CFrame.Angles(0, rad(-90), 0)
	local function b(x0, y0, z0, x1, y1, z1, col, mat, name)
		return Kit.box(kiosk, f, x0, y0, z0, x1, y1, z1, col, mat, { Name = name })
	end
	b(-3.5, 0, -3, -3, 9, 3, C.Wood, M.Planks, "Side")
	b(3, 0, -3, 3.5, 9, 3, C.Wood, M.Planks, "Side")
	b(-3.5, 0, 2.5, 3.5, 9, 3, C.Wood, M.Planks, "Back")
	b(-3.5, 0, -3, 3.5, 3.6, -2.5, C.WoodDark, M.Planks, "CounterFront")
	b(-3.5, 7, -3, 3.5, 9, -2.5, C.WoodDark, M.Planks, "Header")
	b(-3.8, 3.6, -3.6, 3.8, 3.9, -2.2, C.WoodLight, M.Wood, "Counter")
	b(-4.4, 9, -4, 4.4, 9.5, 4, C.Iron, M.Metal, "Roof")
	b(-4.6, 9.5, -4.2, 4.6, 9.8, -3.6, C.Brass, M.Metal, "RoofTrim")
	for _, x in ipairs({ -1.2, 1.2 }) do
		b(x - 0.08, 3.9, -2.8, x + 0.08, 7, -2.7, C.Iron, M.Metal, "WindowBar")
	end
	local header = b(-3.2, 7.2, -3.06, 3.2, 8.8, -3.0, C.Charcoal, M.Smooth, "OfficeSign")
	Graphics.signPlate(Kit.surface(header, Enum.NormalId.Front, 40), "STATION OFFICE", "", { TitleColor = C.Brass, BorderThickness = 2 })
	Kit.ball(kiosk, 0.5, f * CFrame.new(1.8, 4.15, -3.1), C.Brass, M.Metal, { Name = "CounterBell" })
	Props.pendant(kiosk, f * CFrame.new(0, 8.9, 0), 1.2, 1.4, 12, 0.7)
	Props.shelf(kiosk, f * CFrame.new(0, 0, 1.9), 5.6, 5.5, 1.1, 3, C.WoodDark)
	return kiosk
end

local function buildPlatformSign(model)
	local gantry = Kit.model(model, "PlatformGantry")
	for _, sx in ipairs({ -1, 1 }) do
		Kit.cylY(gantry, 13, 0.8, CFrame.new(sx * 13.8, 6.5, CZ1 - 0.6), C.Iron, M.Metal, { Name = "GantryPost" })
	end
	Kit.box(gantry, O, -14.4, 12.6, CZ1 - 1, 14.4, 13.4, CZ1 - 0.2, C.Iron, M.Metal, { Name = "GantryBeam" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.beam(gantry, V(sx * 5, 12.6, CZ1 - 0.6), V(sx * 5, 11.6, CZ1 - 0.6), 0.2, 0.2, C.Iron, M.Metal, { Name = "Hanger" })
	end
	local sign = Kit.box(gantry, O, -8.5, 8.6, CZ1 - 0.85, 8.5, 11.6, CZ1 - 0.35, C.Charcoal, M.Smooth, { Name = "PlatformSign" })
	Graphics.signPlate(Kit.surface(sign, Enum.NormalId.Front, 36), "LOWER PLATFORM", "EXPEDITION CABINS", { TitleColor = C.Parchment })
	Graphics.signPlate(Kit.surface(sign, Enum.NormalId.Back, 36), "CONCOURSE", "", { TitleColor = C.Parchment })
end

-- SPAWN -------------------------------------------------------------------------
local function buildSpawn(model)
	local spawnFolder = Kit.folder(model, "Spawn")
	local z = -52
	Kit.cylY(spawnFolder, 0.1, 13.2, CFrame.new(0, 0.05, z), C.BrassDark, M.Metal, { Name = "MedallionRing" })
	Kit.cylY(spawnFolder, 0.14, 12.2, CFrame.new(0, 0.07, z), C.StoneLight, M.Marble, { Name = "MedallionStone" })
	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "SpawnLocation"
	spawn.Size = V(6, 0.3, 6)
	spawn.CFrame = CFrame.lookAt(V(0, 0.05, z), V(0, 0.05, z + 10))
	spawn.Anchored = true
	spawn.Neutral = true
	spawn.Duration = 0 -- no forcefield bubble
	spawn.Color = C.Charcoal
	spawn.Material = M.Slate
	spawn.TopSurface = Enum.SurfaceType.Smooth
	spawn.BottomSurface = Enum.SurfaceType.Smooth
	spawn.Parent = spawnFolder
	local plate = Kit.part(spawnFolder, V(5.4, 5.4, 0.05), CFrame.new(0, 0.225, z) * CFrame.Angles(rad(90), 0, 0), C.Charcoal, M.Smooth, { Name = "EmblemPlate", CanCollide = false, CastShadow = false })
	Emblem.Create(Kit.surface(plate, Enum.NormalId.Front, 50, { LightInfluence = 0.8 }), { Color = C.Brass, Thickness = 5, Size = UDim2.new(0.92, 0, 0.92, 0) })
	-- Where players appear when they come back from the train.
	Kit.marker(spawnFolder, "ReturnPoint", V(6, 1, 6), CFrame.lookAt(V(0, 0.5, z + 4), V(0, 0.5, z + 14)))
	return spawn
end

-- FURNITURE, LIGHTS & STORYTELLING ---------------------------------------------------
local function buildFurnishing(model)
	local f = Kit.folder(model, "Furnishing")
	local rng = Kit.rng(1937)

	-- Benches (some for waiting, one for looking at the train).
	Props.bench(f, CFrame.new(16, 0, -44) * CFrame.Angles(0, rad(90), 0), 7)
	Props.bench(f, CFrame.new(16, 0, -10) * CFrame.Angles(0, rad(90), 0), 7)
	Props.bench(f, CFrame.new(-16, 0, -48) * CFrame.Angles(0, rad(-90), 0), 7)
	Props.bench(f, CFrame.new(37, 0, -20) * CFrame.Angles(0, rad(-90), 0), 6, C.WoodLight)
	Props.bench(f, CFrame.new(-24, PY, 33) * CFrame.Angles(0, rad(180), 0), 7)
	Props.bench(f, CFrame.new(24, PY, 33) * CFrame.Angles(0, rad(180), 0), 7)
	-- a coat left draped over a bench back
	Kit.part(f, V(1.6, 1.4, 0.3), CFrame.new(-16.9, 3.2, -46.5) * CFrame.Angles(0, rad(-90), rad(8)), C.FabricGreen, M.Fabric, { Name = "DrapedCoat" })
	Props.suitcase(f, CFrame.new(13.2, 0, -6.2) * CFrame.Angles(0, rad(12), 0), 2.4, 1.6, 0.8, C.Burgundy)

	-- Luggage cart heading for the platform.
	local cart = CFrame.new(-20, 0, 8) * CFrame.Angles(0, rad(20), 0)
	local deck = Props.cart(f, cart, 3.4, 6)
	Props.trunk(f, cart * CFrame.new(0, deck, -1.4), 3.0, 1.7, 2.0, C.Leather)
	Props.suitcase(f, cart * CFrame.new(-0.1, deck, 1.5) * CFrame.Angles(0, rad(8), 0), 2.6, 1.1, 1.6, C.FabricGreen)
	Props.suitcase(f, cart * CFrame.new(0.2, deck + 1.7, -1.3) * CFrame.Angles(0, rad(-14), 0), 1.8, 0.9, 1.2, C.Burgundy)

	-- Expedition supplies waiting by the east windows.
	Props.crate(f, CFrame.new(32, 0, 6) * CFrame.Angles(0, rad(4), 0), 4, 4, 4)
	Props.crate(f, CFrame.new(32.2, 4, 6.2) * CFrame.Angles(0, rad(19), 0), 2.8, 2.6, 2.8, C.Wood)
	Props.crate(f, CFrame.new(36.2, 0, 3.6) * CFrame.Angles(0, rad(-11), 0), 3.2, 2.4, 2.6)
	Props.sack(f, CFrame.new(30.8, 0, 10.2) * CFrame.Angles(0, rad(70), 0), 4, 1.4, C.Canvas)
	Props.lantern(f, CFrame.new(36.4, 2.4, 3.4), 1)
	Props.ropeCoil(f, CFrame.new(28.5, 0, 4.2), 2.2)

	-- Mail for the line, by the office.
	Props.sack(f, CFrame.new(-27, 0, -16.5) * CFrame.Angles(0, rad(30), 0), 3, 1.6)
	Props.sack(f, CFrame.new(-28.5, 0, -14.4) * CFrame.Angles(0, rad(-25), 0), 2.6, 1.4, C.StoneLight)
	Props.crate(f, CFrame.new(-25.3, 0, -14.8) * CFrame.Angles(0, rad(9), 0), 2, 1.6, 2)

	-- Viewing bay telescope, aimed at the waiting train.
	local head = V(40.6, 4.6, -14)
	for i = 0, 2 do
		local a = rad(i * 120 + 20)
		Kit.beam(f, head, V(40.6 + math.cos(a) * 1.5, 0, -14 + math.sin(a) * 1.5), 0.18, 0.18, C.WoodDark, M.Wood, { Name = "TripodLeg" })
	end
	Kit.cylZ(f, 3.4, 0.55, CFrame.lookAt(head, V(76, -2, -32)) * CFrame.new(0, 0.2, -0.6), C.Brass, M.Metal, { Name = "Telescope" })

	-- Platform: luggage and equipment beside the cabins.
	Props.suitcase(f, CFrame.new(-39.5, PY, 42) * CFrame.Angles(0, rad(-25), 0), 2.2, 1.5, 0.8, C.Leather)
	local cart2 = CFrame.new(-37, PY, 31) * CFrame.Angles(0, rad(80), 0)
	local deck2 = Props.cart(f, cart2, 3.2, 5.4)
	Props.crate(f, cart2 * CFrame.new(0, deck2, -1), 2.6, 2.2, 2.6, C.Wood)
	Props.sack(f, cart2 * CFrame.new(0, deck2, 1.6), 2.6, 1.2)
	Props.crate(f, CFrame.new(40, PY, 41) * CFrame.Angles(0, rad(-7), 0), 3.4, 3.2, 3.2)
	Props.trunk(f, CFrame.new(40.6, PY, 36.4) * CFrame.Angles(0, rad(84), 0), 3, 1.8, 2, C.FabricGreen)
	Props.ropeCoil(f, CFrame.new(37.6, PY, 38.4), 2)

	-- Lamps.
	for _, p in ipairs({ { -8, -47.5 }, { 8, -47.5 }, { -8, -8 }, { 8, -8 } }) do
		Props.lampPost(f, CFrame.new(p[1], 0, p[2]), 9, 22, 1.0)
	end
	for _, x in ipairs({ -25.5, -6.5, 15.5 }) do
		Props.lampPost(f, CFrame.new(x, PY, 41.5), 8, 20, 1.0)
	end
	Props.pendant(f, CFrame.new(0, 30.1, -40), 6.5, 2.6, 30, 1.1)
	Props.pendant(f, CFrame.new(0, 30.1, -8), 6.5, 2.6, 30, 1.1)
	Props.pendant(f, CFrame.new(-20, 30.1, 40), 12, 2.6, 28, 1.0)
	Props.pendant(f, CFrame.new(20, 30.1, 40), 12, 2.6, 28, 1.0)
	for _, x in ipairs({ -11, 11 }) do
		Props.sconce(f, CFrame.new(x, 9, CZ0) * CFrame.Angles(0, rad(180), 0), 16, 0.8)
	end
	Props.sconce(f, CFrame.new(-HX, 17.5, -33) * CFrame.Angles(0, rad(-90), 0), 20, 0.8)

	-- Posters and the route map: the terminal's quiet storytelling.
	local posters = {
		{ CFrame.new(-HX + 0.2, 7, -56) * CFrame.Angles(0, rad(-90), 0), "Vale" },
		{ CFrame.new(-HX + 0.2, 7, -11) * CFrame.Angles(0, rad(-90), 0), "Line" },
		{ CFrame.new(-24, 7, CZ0 + 0.2) * CFrame.Angles(0, rad(180), 0), "Dusk" },
		{ CFrame.new(24, 7, CZ0 + 0.2) * CFrame.Angles(0, rad(180), 0), "Fog" },
	}
	for _, p in ipairs(posters) do
		Graphics.poster(Props.panel(f, p[1], 5, 7, C.WoodDark, C.Parchment, 40), p[2])
	end
	Graphics.routeMap(Props.panel(f, CFrame.new(-HX + 0.3, 10, -33) * CFrame.Angles(0, rad(-90), 0), 22, 12, C.WoodDark, C.Parchment, 26))
	Kit.box(f, O, -HX + 1.6, 0, -44, -HX + 1.9, 2.6, -22, C.Brass, M.Metal, { Name = "MapRail" })
	for _, z in ipairs({ -44, -33, -22 }) do
		Kit.cylY(f, 2.6, 0.3, CFrame.new(-HX + 1.75, 1.3, z), C.Iron, M.Metal, { Name = "MapRailPost" })
	end
	return rng
end

function LobbyBuilder.Build(parent)
	local lobby = Kit.model(parent, "Lobby")
	buildFloors(lobby)
	local walls = Kit.folder(lobby, "Walls")
	eastWindows(walls)
	westWall(walls)
	southWall(walls)
	northWall(walls)
	gable(walls, CZ0 - 1, false)
	gable(walls, PZ1 + 1, true)
	buildRoof(lobby)
	buildClock(lobby)
	buildInfoBoard(lobby)
	buildKiosk(lobby)
	buildPlatformSign(lobby)
	local spawn = buildSpawn(lobby)
	buildFurnishing(lobby)
	local roomTone = Kit.marker(lobby, "Bounds", V(2 * HX + 16, 70, PZ1 - CZ0 + 20), CFrame.new(0, 12, (CZ0 + PZ1) / 2))
	roomTone:SetAttribute("Zone", "Terminal")
	Kit.tag(roomTone, "ZoneBounds")
	lobby.PrimaryPart = spawn
	return lobby, {
		KeeperCFrame = CFrame.new(-16.8, 0, -25.5) * CFrame.Angles(0, rad(-31), 0),
		PlatformY = PY,
	}
end

return LobbyBuilder
