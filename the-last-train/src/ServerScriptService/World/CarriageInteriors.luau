--[[
	CarriageInteriors — furniture and purpose for each carriage.

	Order (front to back): ENGINE | MYSTERY | CREW | DISCOVERY | EXPLORER | BOARDING
	Carriage local frame: x across (interior -7..7), y from rail level
	(floor surface 6.1), z = 0 at the end facing the engine, 40 at the rear.

	Future hooks (nothing here pretends to work yet):
	  * Models tagged "FutureInteraction" with attribute FutureSystem =
	    "Equipment" | "Inventory" | "Upgrades" mark where those systems go.
	    Each has an unlit "Indicator" bulb that can be lit when it ships.
	  * Parts tagged "DiscoveryDisplaySlot" (attribute SlotId) are the empty
	    places discoveries will fill.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.BuildKit)
local Props = require(script.Parent.Props)
local Graphics = require(script.Parent.Graphics)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)

local C, M = Kit.C, Kit.M
local rad = math.rad
local FY = 6.1

local CarriageInteriors = {}

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

local function at(F, x, z, yaw, y)
	return F * CFrame.new(x, y or FY, z) * CFrame.Angles(0, rad(yaw or 0), 0)
end

-- Brass placard + unlit indicator marking a future system location.
local function futureStation(m, F, name, label, system, x, y, z, yaw)
	local station = Kit.model(m, name)
	station:SetAttribute("FutureSystem", system)
	Kit.tag(station, "FutureInteraction")
	local cf = at(F, x, z, yaw, y)
	local plate = Kit.part(station, V(2.8, 0.7, 0.1), cf, C.BrassDark, M.Metal, { Name = "Placard" })
	Graphics.signPlate(Kit.surface(plate, Enum.NormalId.Front, 60), label, "", { Background = C.BrassDark, Border = C.Ink, TitleColor = C.Ink, BorderThickness = 2 })
	Kit.ball(station, 0.35, cf * CFrame.new(1.75, 0, -0.05), C.BulbOff, M.Glass, { Name = "Indicator", CastShadow = false })
	return station
end

local function stool(m, cf)
	Kit.cylY(m, 0.3, 1.4, cf * CFrame.new(0, 1.85, 0), C.Leather, M.Fabric, { Name = "StoolSeat" })
	Kit.cylY(m, 1.7, 0.3, cf * CFrame.new(0, 0.85, 0), C.Iron, M.Metal, { Name = "StoolLeg" })
	Kit.cylY(m, 0.15, 1.1, cf * CFrame.new(0, 0.08, 0), C.Iron, M.Metal, { Name = "StoolFoot" })
end

local function gauge(m, cf, d)
	local disc = Kit.cylX(m, 0.2, d, cf, C.Brass, M.Metal, { Name = "Gauge" })
	local g = Kit.surface(disc, Enum.NormalId.Left, 60)
	local face = Kit.frame(g, { Size = UDim2.new(0.8, 0, 0.8, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 0, BackgroundColor3 = C.Parchment })
	Kit.corner(face, 0.5, 0)
	Kit.frame(g, { Size = UDim2.new(0.03, 0, 0.36, 0), Position = UDim2.new(0.5, 0, 0.36, 0), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = 35, BackgroundTransparency = 0, BackgroundColor3 = C.Burgundy })
end

local function wallClock(m, cf)
	local disc = Kit.cylZ(m, 0.3, 1.8, cf, C.BrassDark, M.Metal, { Name = "WallClock" })
	local g = Kit.surface(disc, Enum.NormalId.Right, 60)
	local face = Kit.frame(g, { Size = UDim2.new(0.84, 0, 0.84, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 0, BackgroundColor3 = C.Parchment })
	Kit.corner(face, 0.5, 0)
	Kit.frame(g, { Size = UDim2.new(0.04, 0, 0.3, 0), Position = UDim2.new(0.5, 0, 0.36, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 0, BackgroundColor3 = C.Ink })
	Kit.frame(g, { Size = UDim2.new(0.04, 0, 0.22, 0), Position = UDim2.new(0.56, 0, 0.55, 0), AnchorPoint = Vector2.new(0.5, 0.5), Rotation = 125, BackgroundTransparency = 0, BackgroundColor3 = C.Ink })
end

-- BOARDING ----------------------------------------------------------------------
local function boarding(m, F)
	local rng = Kit.rng(404)
	local refs = {}

	-- Arrival space: eight spawn points (two rows), facing toward the engine.
	local spawns = Kit.folder(m, "BoardingSpawns")
	local i = 0
	for _, z in ipairs({ 13, 16.6 }) do
		for _, x in ipairs({ -4.5, -1.5, 1.5, 4.5 }) do
			i = i + 1
			Kit.marker(spawns, "Spawn" .. i, V(2, 1, 2), F * CFrame.new(x, FY + 0.5, z))
		end
	end
	refs.Spawns = spawns

	-- Compartment benches at the rear.
	for _, sx in ipairs({ -1, 1 }) do
		Props.bench(m, at(F, sx * 4.45, 30.7, 180), 5, C.FabricRed)
		Props.bench(m, at(F, sx * 4.45, 37.3, 0), 5, C.FabricRed)
	end

	-- Overhead luggage racks and small luggage storage.
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(m, F, sx * 5.3, 13.0, 2, sx * 7.0, 13.15, 22, C.WoodLight, M.Planks, { Name = "LuggageRack" })
		Kit.box(m, F, sx * 5.35 - 0.1, 13.35, 2, sx * 5.35 + 0.1, 13.5, 22, C.Brass, M.Metal, { Name = "RackRail" })
	end
	Props.suitcase(m, F * CFrame.new(-6.1, 13.15, 6) * CFrame.Angles(0, rad(90), 0), 2.4, 1.0, 1.2, C.Leather)
	Props.trunk(m, F * CFrame.new(6.1, 13.15, 9.5) * CFrame.Angles(0, rad(90), 0), 2.6, 1.2, 1.4, C.FabricGreen)
	Props.suitcase(m, F * CFrame.new(6.1, 13.15, 18) * CFrame.Angles(0, rad(90), 0), 2.0, 0.9, 1.1, C.Burgundy)
	local ys = Props.shelf(m, at(F, -6.35, 7.5, -90), 2.0, 3.2, 1.3, 2, C.WoodDark)
	Props.suitcase(m, at(F, -6.3, 7.5, -90, FY + ys[1]), 1.6, 1.0, 0.9, C.Burgundy)
	Props.suitcase(m, at(F, -6.3, 7.5, -90, FY + ys[2]), 1.4, 0.8, 0.8, C.Leather)
	Props.trunk(m, at(F, -5.6, 3.6, -80), 2.2, 1.4, 1.5, C.Leather)

	-- Route display over the doorway toward the rest of the train.
	local display = Kit.box(m, F, -4.6, 14.15, 1.2, 4.6, 15.35, 1.36, C.Charcoal, M.Smooth, { Name = "RouteDisplay" })
	local g = Kit.surface(display, Enum.NormalId.Back, 50, { LightInfluence = 0.2, Brightness = 1.3 })
	Kit.frame(g, { Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(20, 19, 18) })
	Kit.label(g, "ROUTE", { Position = UDim2.new(0.03, 0, 0.18, 0), Size = UDim2.new(0.14, 0, 0.64, 0), TextColor3 = C.Brass })
	for k = 0, 7 do
		local cell = Kit.frame(g, { Position = UDim2.new(0.2 + k * 0.058, 0, 0.16, 0), Size = UDim2.new(0.05, 0, 0.68, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(34, 32, 30) })
		Kit.label(cell, "-", { TextColor3 = C.Parchment })
	end
	Kit.label(g, "PREPARING ROUTE", { Name = "Status", Position = UDim2.new(0.68, 0, 0.22, 0), Size = UDim2.new(0.3, 0, 0.56, 0), TextColor3 = C.Parchment })

	-- Vestibule doors (closed while travelling). The right one is the
	-- development exit back to the terminal.
	for _, sx in ipairs({ -1, 1 }) do
		local leaf = Kit.box(m, F, sx * 7.4, 6.0, 24, sx * 7.8, 13.6, 29, C.Burgundy, M.Metal, { Name = sx > 0 and "ExitDoor" or "SideDoor" })
		for _, face in ipairs({ Enum.NormalId.Left, Enum.NormalId.Right }) do
			local dg = Kit.surface(leaf, face, 30)
			Kit.frame(dg, { Position = UDim2.new(0.2, 0, 0.12, 0), Size = UDim2.new(0.6, 0, 0.32, 0), BackgroundTransparency = 0, BackgroundColor3 = C.GlassDark })
			Kit.frame(dg, { Position = UDim2.new(0.84, 0, 0.5, 0), Size = UDim2.new(0.06, 0, 0.12, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
		end
		if sx > 0 then
			local prompt = Kit.prompt(leaf, "Return to Terminal", "Exit Door", 9)
			prompt.HoldDuration = 0.4
			Kit.tag(leaf, "ReturnToTerminal")
			refs.ExitDoor = leaf
		end
	end
	Kit.box(m, F, -7, FY, 24, 7, FY + 0.05, 29, C.Iron, M.Plate, { Name = "VestibuleMat" })

	-- A few purposeful touches.
	Graphics.poster(Props.panel(m, at(F, -5.1, 38.75, 0, 10.6), 2.6, 3.6, C.WoodDark, C.Parchment, 50), "Dusk")
	wallClock(m, F * CFrame.new(5.1, 11.2, 38.8))
	Props.lantern(m, at(F, 6.0, 37.8), 0.7)
	refs.ConductorCFrame = at(F, 4.6, 5.4, 180)
	return refs
end

-- EXPLORER ----------------------------------------------------------------------
local function explorer(m, F)
	local rng = Kit.rng(512)

	-- Lockers (left) and the equipment rack (right).
	for i = 1, 4 do
		Props.locker(m, at(F, -6.3, 1.9 + i * 1.95, -90), 1.9, 7.2, 1.3, "0" .. i, C.BlueSteel)
	end
	local equip = futureStation(m, F, "EquipmentStation", "EQUIPMENT", "Equipment", 6.85, 13.0, 6, 90)
	Kit.box(equip, F, 6.75, 7.0, 2.2, 6.98, 12.6, 9.8, C.WoodWorn, M.Planks, { Name = "Pegboard" })
	Kit.box(equip, F, 6.3, 11.9, 2.4, 6.75, 12.05, 9.6, C.Brass, M.Metal, { Name = "HangRail" })
	for k, z in ipairs({ 3.4, 5.6 }) do
		Kit.part(equip, V(0.9, 2.2, 1.5), at(F, 6.2, z, 0, 9.4), k == 1 and C.Canvas or C.FabricGreen, M.Fabric, { Name = "Backpack" })
		Kit.part(equip, V(0.95, 0.9, 1.55), at(F, 6.15, z, 0, 10.3), C.Leather, M.Fabric, { Name = "BackpackFlap" })
	end
	Kit.cylX(equip, 0.5, 2.0, at(F, 6.45, 7.8, 0, 10.6), C.Canvas, M.Fabric, { Name = "RopeCoil" })
	Kit.beam(equip, F * V(6.4, 8.0, 9.2), F * V(6.4, 10.8, 9.0), 0.2, 0.2, C.WoodDark, M.Wood, { Name = "PickHandle" })
	Kit.part(equip, V(0.25, 0.3, 1.6), at(F, 6.4, 9.0, 0, 10.9) * CFrame.Angles(rad(12), 0, 0), C.Iron, M.Metal, { Name = "PickHead" })
	Kit.box(equip, F, 5.7, 6.1, 2.4, 6.9, 7.2, 9.6, C.WoodDark, M.Planks, { Name = "GearChest" })

	-- Central planning table with the route map and instruments.
	local top = Props.table(m, at(F, 0, 20, 90), 7.4, 3.6, 2.9, C.WoodDark)
	local map = Kit.part(m, V(6.6, 3.0, 0.04), top.CFrame * CFrame.new(0, 0.17, 0) * CFrame.Angles(rad(90), 0, 0), C.Parchment, M.Smooth, { Name = "PlanningMap", CanCollide = false })
	Graphics.tableMap(Kit.surface(map, Enum.NormalId.Front, 40), 314)
	Kit.cylY(m, 0.12, 0.8, top.CFrame * CFrame.new(-1.0, 0.22, 2.4), C.Brass, M.Metal, { Name = "Compass" })
	Kit.cylZ(m, 0.4, 2.2, top.CFrame * CFrame.new(1.0, 0.35, -2.6), C.Canvas, M.Fabric, { Name = "RolledMap" })
	Props.lantern(m, top.CFrame * CFrame.new(0.9, 0.15, 2.8), 0.6, 12, 0.6)
	for _, p in ipairs({ { -2.6, 17.4 }, { -2.6, 22.6 }, { 2.6, 17.4 }, { 2.6, 22.6 } }) do
		stool(m, at(F, p[1], p[2]))
	end

	-- Inventory preparation bench (left) — future system location.
	local prep = futureStation(m, F, "PreparationBench", "PREPARATION", "Inventory", -6.85, 14.4, 20, -90)
	Props.table(prep, at(F, -5.7, 20, 90), 6, 2.2, 2.7, C.WoodWorn)
	Props.trunk(prep, at(F, -5.7, 18.4, 90, FY + 2.7), 2.0, 1.4, 1.4, C.Leather)
	Props.sack(prep, at(F, -5.6, 21.4, 10, FY + 2.7), 1.8, 1.0)
	Props.crate(prep, at(F, -5.5, 22.2, 4), 1.8, 1.6, 1.6)

	-- Route engineering desk (right) — future expedition upgrades.
	local eng = futureStation(m, F, "EngineeringDesk", "ROUTE ENGINEERING", "Upgrades", 6.85, 14.4, 20, 90)
	Props.table(eng, at(F, 5.7, 20, 90), 5.2, 2.2, 2.9, C.WoodDark)
	local board = Kit.part(eng, V(0.14, 2.4, 4.2), at(F, 5.9, 20, 0, 10.0) * CFrame.Angles(0, 0, rad(-24)), C.Parchment, M.Smooth, { Name = "DraftingBoard" })
	Graphics.tableMap(Kit.surface(board, Enum.NormalId.Left, 50), 99)
	gauge(eng, F * CFrame.new(6.88, 11.2, 16.6), 1.3)
	gauge(eng, F * CFrame.new(6.88, 11.2, 23.4), 1.3)

	-- Wall map beside the forward doorway.
	Graphics.routeMap(Props.panel(m, at(F, -5.0, 1.32, 180, 10.6), 3.4, 2.4, C.WoodDark, C.Parchment, 60))

	-- Storage at the rear.
	for _, sx in ipairs({ -1, 1 }) do
		local shelfCF = at(F, sx * 6.35, 33.8, sx * 90)
		local levels = Props.shelf(m, shelfCF, 6.4, 6.6, 1.3, 3, C.WoodDark)
		for li = 1, #levels - 1 do
			local y = levels[li]
			Props.crate(m, shelfCF * CFrame.new(-2.0 + rng(-0.2, 0.2), y, 0), 1.6, 1.3, 1.0, C.WoodLight)
			Props.crate(m, shelfCF * CFrame.new(0.4 + rng(-0.3, 0.3), y, 0), 1.2, 1.0, 0.9, C.Wood)
			Kit.cylY(m, 1.0, 0.7, shelfCF * CFrame.new(2.2, y + 0.5, 0), C.Glass, M.Glass, { Name = "Jar", Transparency = 0.3 })
		end
	end
	Props.crate(m, at(F, 4.6, 37.6, 8), 2.2, 2.0, 2.0)
	Props.crate(m, at(F, 4.6, 37.6, 21, FY + 2.0), 1.5, 1.3, 1.5, C.Wood)
	Kit.box(m, F, -1.6, FY, 1, 1.6, FY + 0.04, 39, C.Iron, M.Plate, { Name = "AisleRunner" })
end

-- DISCOVERY -----------------------------------------------------------------------
local function discovery(m, F)
	local rng = Kit.rng(77)
	local slot = 0
	local function tagSlot(part, id)
		part:SetAttribute("SlotId", id)
		Kit.tag(part, "DiscoveryDisplaySlot")
	end

	-- Archive bookshelves (front).
	for _, sx in ipairs({ -1, 1 }) do
		local shelfCF = at(F, sx * 6.35, 6.0, sx * 90)
		local levels = Props.shelf(m, shelfCF, 7.4, 8.6, 1.3, 4, C.WoodDark)
		for li = 1, #levels - 1 do
			Props.books(m, shelfCF * CFrame.new(0, levels[li], 0), 6.6, rng)
		end
	end

	-- Display cases beneath the windows: empty, waiting.
	for _, sx in ipairs({ -1, 1 }) do
		for _, z in ipairs({ 14, 20, 26 }) do
			slot = slot + 1
			local glass = Props.displayCase(m, at(F, sx * 5.65, z, 90), 3.4, 3.6, 1.6)
			tagSlot(glass, "Case" .. slot)
		end
	end

	-- The central pedestal: the most important empty place on the train.
	Kit.cylY(m, 0.6, 4.4, at(F, 0, 20, 0, FY + 0.3), C.StoneDark, M.Marble, { Name = "CentralBase" })
	Kit.cylY(m, 2.6, 2.4, at(F, 0, 20, 0, FY + 1.9), C.Stone, M.Marble, { Name = "CentralColumn" })
	Kit.cylY(m, 0.4, 3.2, at(F, 0, 20, 0, FY + 3.4), C.StoneDark, M.Marble, { Name = "CentralTop" })
	local cradle = Kit.cylY(m, 0.25, 1.5, at(F, 0, 20, 0, FY + 3.72), C.Brass, M.Metal, { Name = "Cradle" })
	Kit.cylY(m, 0.27, 0.9, at(F, 0, 20, 0, FY + 3.72), Color3.fromRGB(26, 24, 22), M.Smooth, { Name = "CradleHollow" })
	Kit.cylY(m, 2.6, 2.6, at(F, 0, 20, 0, FY + 5.0), C.Glass, M.Glass, { Name = "BellJar", Transparency = 0.82, CastShadow = false, CanCollide = false })
	tagSlot(cradle, "Central")
	local plaque = Kit.part(m, V(1.6, 0.6, 0.1), at(F, 0, 18.75, 0, FY + 1.5) * CFrame.Angles(rad(-15), 0, 0), C.Brass, M.Metal, { Name = "Plaque" })
	Kit.label(Kit.surface(plaque, Enum.NormalId.Front, 80), "UNCATALOGUED", { TextColor3 = C.Ink, Position = UDim2.new(0.08, 0, 0.2, 0), Size = UDim2.new(0.84, 0, 0.6, 0) })
	local spot = Kit.marker(m, "PedestalSpot", V(0.5, 0.5, 0.5), F * CFrame.new(0, 16.9, 20))
	Kit.spotLight(spot, Enum.NormalId.Bottom, 14, 1.4, 36, Color3.fromRGB(226, 232, 255))
	Kit.cylY(m, 0.5, 1.2, F * CFrame.new(0, 17.1, 20), C.BrassDark, M.Metal, { Name = "SpotHousing" })

	-- Smaller empty pedestals.
	for _, p in ipairs({ { 0, 12 }, { 0, 28 }, { -3.4, 33.5 }, { 3.4, 33.5 } }) do
		slot = slot + 1
		local pTop = Props.pedestal(m, at(F, p[1], p[2]), 3.4, 1.4)
		tagSlot(pTop, "Pedestal" .. slot)
	end

	-- Collection cabinets at the rear: specimen drawers and a map chest.
	local cab = Kit.part(m, V(1.4, 6.2, 7.0), at(F, -6.2, 34.6, 0, FY + 3.1), C.WoodDark, M.Wood, { Name = "SpecimenCabinet" })
	local cg = Kit.surface(cab, Enum.NormalId.Right, 30)
	for r = 0, 5 do
		for c = 0, 3 do
			local drawer = Kit.frame(cg, { Position = UDim2.new(0.04 + c * 0.24, 0, 0.04 + r * 0.16, 0), Size = UDim2.new(0.22, 0, 0.14, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(78, 52, 34) })
			Kit.frame(drawer, { Position = UDim2.new(0.38, 0, 0.42, 0), Size = UDim2.new(0.24, 0, 0.16, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
		end
	end
	Kit.part(m, V(1.6, 3.4, 7.0), at(F, 6.1, 34.6, 0, FY + 1.7), C.WoodDark, M.Wood, { Name = "MapChest" })
	Graphics.routeMap(Props.panel(m, at(F, 6.85, 34.6, 90, 11.4), 6, 3.4, C.BrassDark, C.Parchment, 40))
	Kit.box(m, F, -1.5, FY, 1, 1.5, FY + 0.05, 39, C.Burgundy, M.Fabric, { Name = "Runner" })
end

-- CREW ----------------------------------------------------------------------------
local function crew(m, F)
	local rng = Kit.rng(8)
	Kit.box(m, F, -6.6, FY, 8.5, 2.4, FY + 0.05, 21.5, Color3.fromRGB(110, 40, 42), M.Fabric, { Name = "Rug" })

	-- Lounge: sofa, armchairs and a low table with an unfinished game of cards.
	Props.sofa(m, at(F, -5.7, 15, -90), 7.4, C.FabricRed)
	Props.armchair(m, at(F, 2.6, 12.4, 90), C.FabricRed)
	Props.armchair(m, at(F, 2.6, 17.6, 90), C.FabricGreen)
	local low = Props.table(m, at(F, -1.4, 15, 0), 2.4, 4.2, 1.6, C.WoodDark)
	local cards = Kit.part(m, V(2.0, 3.6, 0.03), low.CFrame * CFrame.new(0, 0.16, 0) * CFrame.Angles(rad(90), 0, 0), C.WoodDark, M.Smooth, { Name = "Cards", CanCollide = false, Transparency = 1 })
	local cg = Kit.surface(cards, Enum.NormalId.Front, 60)
	for k = 0, 5 do
		Kit.frame(cg, { Position = UDim2.new(0.2 + (k % 3) * 0.22 + rng(-0.03, 0.03), 0, 0.25 + math.floor(k / 3) * 0.4, 0), Size = UDim2.new(0.18, 0, 0.16, 0), Rotation = rng(-25, 25), BackgroundTransparency = 0, BackgroundColor3 = C.Parchment })
	end
	Props.lantern(m, low.CFrame * CFrame.new(-0.6, 0.15, -1.3), 0.55, 10, 0.55)

	-- Card / map table with two chairs and a stool.
	Kit.cylY(m, 0.25, 3.8, at(F, 2.6, 31, 0, FY + 2.6), C.Wood, M.Wood, { Name = "RoundTableTop" })
	Kit.cylY(m, 2.4, 0.6, at(F, 2.6, 31, 0, FY + 1.25), C.WoodDark, M.Wood, { Name = "RoundTableLeg" })
	Kit.cylY(m, 0.2, 2.0, at(F, 2.6, 31, 0, FY + 0.1), C.WoodDark, M.Wood, { Name = "RoundTableFoot" })
	local mapTop = Kit.part(m, V(2.4, 1.6, 0.03), at(F, 2.6, 31, 15, FY + 2.75) * CFrame.Angles(rad(90), 0, 0), C.Parchment, M.Smooth, { Name = "TravelMap", CanCollide = false })
	Graphics.tableMap(Kit.surface(mapTop, Enum.NormalId.Front, 60), 5)
	Props.armchair(m, at(F, 2.6, 27.6, 180), C.FabricRed)
	Props.armchair(m, at(F, 2.6, 34.4, 0), C.FabricRed)
	stool(m, at(F, 5.6, 31))
	Props.lantern(m, at(F, 1.8, 30.4, 0, FY + 2.73), 0.55, 10, 0.5)

	-- Bookshelf between windows, travel gear, coat rack.
	local shelfCF = at(F, -6.35, 29.5, -90)
	local levels = Props.shelf(m, shelfCF, 2.6, 5.4, 1.3, 3, C.WoodDark)
	for li = 1, #levels - 1 do
		Props.books(m, shelfCF * CFrame.new(0, levels[li], 0), 2.2, rng)
	end
	Kit.cylY(m, 6.6, 0.3, at(F, -5.8, 3.4, 0, FY + 3.3), C.WoodDark, M.Wood, { Name = "CoatRack" })
	Kit.cylY(m, 0.2, 1.6, at(F, -5.8, 3.4, 0, FY + 0.1), C.WoodDark, M.Wood, { Name = "CoatRackFoot" })
	Kit.part(m, V(1.6, 3.2, 0.5), at(F, -5.8, 3.0, 20, FY + 4.3), C.FabricGreen, M.Fabric, { Name = "HangingCoat" })
	Kit.cylY(m, 0.12, 1.9, at(F, -5.8, 3.4, 0, FY + 6.7), C.Leather, M.Fabric, { Name = "HatBrim" })
	Kit.cylY(m, 0.7, 1.1, at(F, -5.8, 3.4, 0, FY + 7.1), C.Leather, M.Fabric, { Name = "HatCrown" })
	Props.trunk(m, at(F, 5.5, 3.6, -8), 2.6, 1.8, 1.6, C.Leather)
	Props.suitcase(m, at(F, 5.3, 6.0, 12), 1.8, 1.2, 0.8, C.Burgundy)
	Kit.cylY(m, 2.2, 0.8, at(F, 6.2, 37.8, 0, FY + 1.1), C.BrassDark, M.Metal, { Name = "UmbrellaStand" })
	Kit.cylY(m, 2.6, 0.2, at(F, 6.1, 37.7, 0, FY + 2.4), C.Ink, M.Fabric, { Name = "Umbrella" })
	Graphics.poster(Props.panel(m, at(F, -5.0, 38.75, 0, 10.8), 2.6, 3.6, C.WoodDark, C.Parchment, 50), "Vale")
end

-- MYSTERY (sealed) -------------------------------------------------------------------
local function mystery(m, F, L)
	local refs = {}
	local door = Kit.part(m, V(5.6, 8.2, 0.35), F * CFrame.new(0, 10.1, L + 0.17), Color3.fromRGB(34, 36, 42), M.Metal, { Name = "SealedDoor" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(m, F, sx * 2.8, 6.0, L, sx * 3.25, 14.6, L + 0.45, C.BrassDark, M.Metal, { Name = "DoorFrame" })
	end
	Kit.box(m, F, -3.25, 14.2, L, 3.25, 14.65, L + 0.45, C.BrassDark, M.Metal, { Name = "DoorFrame" })
	local roundel = Kit.cylZ(m, 0.25, 3.3, F * CFrame.new(0, 11.4, L + 0.42), C.BrassDark, M.Metal, { Name = "DoorEmblem" })
	Emblem.Create(Kit.surface(roundel, Enum.NormalId.Left, 60, { LightInfluence = 0.6 }), { Color = Color3.fromRGB(24, 26, 30), Thickness = 5, Size = UDim2.new(0.86, 0, 0.86, 0) })
	-- The lock: three notches, no keyhole.
	local lock = Kit.cylZ(m, 0.3, 1.6, F * CFrame.new(0, 8.2, L + 0.45), C.Brass, M.Metal, { Name = "Lock" })
	local lg = Kit.surface(lock, Enum.NormalId.Left, 80)
	local ring = Kit.frame(lg, { Size = UDim2.new(0.7, 0, 0.7, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) })
	Kit.corner(ring, 0.5, 0)
	Kit.stroke(ring, C.Ink, 4, 0)
	for k = 0, 2 do
		local a = rad(k * 120)
		Kit.frame(lg, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5 + 0.35 * math.sin(a), 0, 0.5 - 0.35 * math.cos(a), 0), Size = UDim2.new(0.1, 0, 0.18, 0), Rotation = k * 120, BackgroundTransparency = 0, BackgroundColor3 = C.Ink })
	end
	-- A cold lamp: the only light on the train that is not warm.
	Kit.box(m, F, -0.6, 14.9, L + 0.1, 0.6, 15.5, L + 0.9, C.Iron, M.Metal, { Name = "ColdLampHousing" })
	local cold = Kit.part(m, V(0.8, 0.5, 0.6), F * CFrame.new(0, 14.6, L + 0.55), Color3.fromRGB(150, 190, 230), M.Neon, { Name = "ColdLamp", CastShadow = false })
	Kit.pointLight(cold, 11, 0.75, Color3.fromRGB(140, 175, 225))
	local prompt = Kit.prompt(door, "Inspect", "Sealed Door", 9)
	door:SetAttribute("DialogueId", "MysteryDoor")
	door:SetAttribute("SoundKey", "LockedDoor")
	prompt:SetAttribute("DialogueId", "MysteryDoor")
	refs.Door = door
	return refs
end

function CarriageInteriors.Build(train, info)
	local L = 40
	local refs = {}
	local car = info.Carriages
	if car.Boarding then
		local r = boarding(train:FindFirstChild("BoardingCarriage"), car.Boarding.Frame)
		refs.Spawns = r.Spawns
		refs.ExitDoor = r.ExitDoor
		refs.ConductorCFrame = r.ConductorCFrame
	end
	if car.Explorer then
		explorer(train:FindFirstChild("ExplorerCarriage"), car.Explorer.Frame)
	end
	if car.Discovery then
		discovery(train:FindFirstChild("DiscoveryCarriage"), car.Discovery.Frame)
	end
	if car.Crew then
		crew(train:FindFirstChild("CrewCarriage"), car.Crew.Frame)
	end
	if car.Mystery then
		refs.MysteryDoor = mystery(train:FindFirstChild("MysteryCarriage"), car.Mystery.Frame, L).Door
	end
	return refs
end

return CarriageInteriors
