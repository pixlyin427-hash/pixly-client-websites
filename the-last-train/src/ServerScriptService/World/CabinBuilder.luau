--[[
	CabinBuilder — the four expedition boarding cabins on the lower platform.

	Each cabin is a Model under Workspace.ExpeditionCabins with attributes the
	server writes and the client reads:
	  CabinId, Capacity, DisplayName   (static)
	  State  = "Idle" | "Boarding" | "Departing" | "Departed"
	  Count, LeaderName, Countdown, Pulse (Pulse++ on every join)

	Named children the systems rely on:
	  Zone            invisible volume: standing inside = joining
	  ExitPoint       where "Leave" places you (outside the door)
	  DoorLeft/Right  pocket doors (attributes OpenCFrame / ClosedCFrame)
	  CounterPlate    status display (SurfaceGui "Display": Count/Status)
	  CapacityBulbs   Bulb1..BulbN, lit one per explorer
	  Semaphore.Arm   attributes CF_Idle / CF_Boarding / CF_Departing
	  Semaphore.SignalLamp, CabinLight (interior pendant bulb)

	Local frame of every cabin: origin = front-centre at platform level,
	+Z goes into the cabin (north), front wall occupies z 0..1.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.BuildKit)
local Props = require(script.Parent.Props)
local Graphics = require(script.Parent.Graphics)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)
local CabinDefinitions = require(ReplicatedStorage.Shared.Config.CabinDefinitions)

local C, M = Kit.C, Kit.M
local rad = math.rad

local CabinBuilder = {}

local DOOR_H = 7.5

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

local function pitchedRoof(model, F, hw, D, H, rise, overhang)
	local x0, x1 = -hw - 1 - overhang, hw + 1 + overhang
	local z0, z1 = -0.9, D + 2.9
	Kit.slabXY(model, F, x0, H - overhang * (rise / (hw + 1)), 0, H + rise, z0, z1, 0.5, C.BlueSteelDark, M.Metal, { Name = "Roof" })
	Kit.slabXY(model, F, 0, H + rise, x1, H - overhang * (rise / (hw + 1)), z0, z1, 0.5, C.BlueSteelDark, M.Metal, { Name = "Roof" })
	for _, z in ipairs({ 0.5, D + 1.5 }) do
		Kit.triXY(model, F, -hw - 1, 0, H, H + rise, z, 1, C.WoodDark, M.Planks, { Name = "Gable" })
		Kit.triXY(model, F, hw + 1, 0, H, H + rise, z, 1, C.WoodDark, M.Planks, { Name = "Gable" })
	end
	Kit.box(model, F, -0.35, H + rise + 0.1, z0, 0.35, H + rise + 0.6, z1, C.Brass, M.Metal, { Name = "RidgeCap" })
end

local function archedRoof(model, F, hw, D, H)
	local pts = { { -hw - 1.6, H - 0.2 }, { -hw * 0.5, H + 1.8 }, { hw * 0.5, H + 1.8 }, { hw + 1.6, H - 0.2 } }
	for i = 1, 3 do
		Kit.slabXY(model, F, pts[i][1], pts[i][2], pts[i + 1][1], pts[i + 1][2], -0.9, D + 2.9, 0.5, C.BlueSteelDark, M.Metal, { Name = "Roof" })
	end
	for _, z in ipairs({ 0.5, D + 1.5 }) do
		Kit.box(model, F, -hw * 0.5, H, z - 0.5, hw * 0.5, H + 1.8, z + 0.5, C.WoodDark, M.Planks, { Name = "RoofEnd" })
		Kit.triXY(model, F, -hw - 1, -hw * 0.5, H, H + 1.8, z, 1, C.WoodDark, M.Planks, { Name = "RoofEnd" })
		Kit.triXY(model, F, hw + 1, hw * 0.5, H, H + 1.8, z, 1, C.WoodDark, M.Planks, { Name = "RoofEnd" })
	end
end

local function flatRoof(model, F, hw, D, H)
	Kit.box(model, F, -hw - 1.8, H, -1.2, hw + 1.8, H + 0.7, D + 3, C.BlueSteelDark, M.Metal, { Name = "Roof" })
	Kit.box(model, F, -hw - 1.9, H + 0.7, -1.3, hw + 1.9, H + 0.95, D + 3.1, C.Brass, M.Metal, { Name = "Cornice" })
	Kit.box(model, F, -2.2, H + 0.95, D * 0.45, 2.2, H + 2.2, D * 0.45 + 3, C.Iron, M.Metal, { Name = "Ventilator" })
	Kit.box(model, F, -2.5, H + 2.2, D * 0.45 - 0.3, 2.5, H + 2.5, D * 0.45 + 3.3, C.BlueSteelDark, M.Metal, { Name = "VentilatorCap" })
	Kit.cylY(model, 3, 0.7, F * CFrame.new(hw - 1.2, H + 2.2, D), C.Iron, M.Metal, { Name = "Flue" })
end

local function semaphore(model, F, x, H)
	local sem = Kit.model(model, "Semaphore")
	local side = x < 0 and -1 or 1
	Kit.cylY(sem, 4.6, 0.45, F * CFrame.new(x, H + 2.0, -0.6), C.Iron, M.Metal, { Name = "Mast" })
	Kit.ball(sem, 0.6, F * CFrame.new(x, H + 4.4, -0.6), C.Brass, M.Metal, { Name = "MastCap" })
	local pivot = F * CFrame.new(x, H + 3.7, -0.95)
	local function armCF(angle)
		return pivot * CFrame.Angles(0, 0, rad(angle) * side) * CFrame.new(side * 1.4, 0, 0)
	end
	local arm = Kit.part(sem, V(2.8, 0.42, 0.16), armCF(0), C.Burgundy, M.Smooth, { Name = "Arm" })
	arm:SetAttribute("CF_Idle", armCF(0))
	arm:SetAttribute("CF_Boarding", armCF(38))
	arm:SetAttribute("CF_Departing", armCF(72))
	Kit.cylZ(sem, 0.3, 0.9, pivot * CFrame.new(0, 0, 0.1), C.Brass, M.Metal, { Name = "ArmHub" })
	-- the signal lamp below the arm changes colour with the cabin state
	local lampHousing = Kit.part(sem, V(0.9, 0.9, 0.6), F * CFrame.new(x, H + 2.6, -0.9), C.Iron, M.Metal, { Name = "LampHousing" })
	local lamp = Kit.cylZ(sem, 0.12, 0.6, lampHousing.CFrame * CFrame.new(0, 0, -0.32), C.BulbOff, M.Glass, { Name = "SignalLamp", CastShadow = false })
	-- small gear: the mechanism that drives the arm
	Kit.cylZ(sem, 0.3, 1.5, F * CFrame.new(x - side * 0.2, H + 1.1, -0.25), C.BrassDark, M.Metal, { Name = "Gear" })
	Kit.cylZ(sem, 0.34, 0.5, F * CFrame.new(x - side * 0.2, H + 1.1, -0.27), C.Iron, M.Metal, { Name = "GearHub" })
	return sem, lamp
end

local function interior(model, def, F, hw, D, H)
	local style = def.Style
	local rng = Kit.rng(#def.Id * 131 + def.Capacity)
	local floorY = 0.5
	local backZ = D + 1
	local function at(x, z, yaw)
		return F * CFrame.new(x, floorY, z) * CFrame.Angles(0, rad(yaw or 0), 0)
	end
	if style == "Solo" then
		Props.armchair(model, at(0, backZ - 1.6), C.FabricGreen)
		Props.table(model, at(hw - 1.3, backZ - 4.2, 90), 2.6, 1.6, 2.6, C.Wood)
		Kit.part(model, V(1.1, 0.04, 1.4), at(hw - 1.4, backZ - 4.4, 18) * CFrame.new(0, 2.62, 0), C.Parchment, M.Smooth, { Name = "RouteDocument" })
		Kit.part(model, V(1.0, 0.04, 1.3), at(hw - 1.1, backZ - 4.0, -9) * CFrame.new(0, 2.64, 0), C.Cream, M.Smooth, { Name = "RouteDocument" })
		Props.lantern(model, at(hw - 1.3, backZ - 3.4) * CFrame.new(0, 2.6, 0), 0.8)
		Graphics.poster(Props.panel(model, at(-hw + 0.15, backZ - 4.5, -90) * CFrame.new(0, 4.6, 0), 3, 4.2, C.WoodDark, C.Parchment, 50), "Line")
		Props.suitcase(model, at(-hw + 1.2, backZ - 1.2, 15), 1.8, 1.3, 0.8, C.Burgundy)
	elseif style == "Duo" then
		Props.bench(model, at(0, backZ - 1.3), 6.4, C.Wood)
		Graphics.tableMap(Props.panel(model, at(0, backZ - 0.15) * CFrame.new(0, 6, 0), 5.2, 2.6, C.WoodDark, C.Parchment, 40), 21)
		Props.suitcase(model, at(-hw + 1.1, backZ - 3.8, 80), 2.2, 1.4, 0.9, C.Leather)
		Props.trunk(model, at(hw - 1.5, backZ - 4.2, -6), 2.2, 1.6, 1.6, C.FabricGreen)
		Kit.part(model, V(2.6, 0.2, 1.0), at(hw - 0.5, 0, 90) * CFrame.new(0, 5.4, 0), C.WoodDark, M.Wood, { Name = "WallShelf" })
		Props.lantern(model, at(hw - 0.6, backZ - 4.4) * CFrame.new(0, 5.5, 0), 0.7)
	elseif style == "Squad" then
		Props.bench(model, at(0, backZ - 1.3), 9, C.Wood)
		Graphics.poster(Props.panel(model, at(-hw + 0.15, backZ - 5, -90) * CFrame.new(0, 4.8, 0), 3.2, 4.4, C.WoodDark, C.Parchment, 50), "Fog")
		local ys = Props.shelf(model, at(hw - 0.75, backZ - 5, 90), 3.6, 5.2, 1.3, 2, C.WoodDark)
		Props.lantern(model, at(hw - 0.75, backZ - 5.8) * CFrame.new(0, ys[2], 0), 0.75)
		Props.ropeCoil(model, at(hw - 0.75, backZ - 4.2) * CFrame.new(0, ys[2], 0), 1.1)
		Props.crate(model, at(hw - 0.75, backZ - 5) * CFrame.new(0, ys[1], 0), 1.6, 1.2, 1.0, C.Wood)
		Props.trunk(model, at(-hw + 1.6, backZ - 2.0, 4), 2.4, 1.6, 1.6, C.Leather)
	else -- Crew: the largest and most impressive room
		Props.bench(model, at(-hw + 1.1, D / 2 + 1.4, -90), 7, C.Wood)
		Props.bench(model, at(hw - 1.1, D / 2 + 1.4, 90), 7, C.Wood)
		local top = Props.table(model, at(0, D / 2 + 1.6), 4, 2.6, 2.7, C.WoodDark)
		local mapPart = Kit.part(model, V(3.4, 2.1, 0.04), top.CFrame * CFrame.new(0, 0.17, 0) * CFrame.Angles(rad(90), 0, 0), C.Parchment, M.Smooth, { Name = "TableMap", CanCollide = false })
		Graphics.tableMap(Kit.surface(mapPart, Enum.NormalId.Front, 50), 77)
		Kit.cylY(model, 0.1, 0.6, top.CFrame * CFrame.new(1.4, 0.2, -0.7), C.Brass, M.Metal, { Name = "Compass" })
		Graphics.poster(Props.panel(model, at(0, backZ - 0.15) * CFrame.new(0, 5.2, 0), 3.6, 5, C.WoodDark, C.Parchment, 45), "Dusk")
		Props.lantern(model, at(-2.8, backZ - 0.8), 0.9)
		Props.lantern(model, at(2.8, backZ - 0.8), 0.9)
		-- overhead luggage racks with a few bags
		for _, sx in ipairs({ -1, 1 }) do
			local x = sx * (hw - 0.9)
			Kit.box(model, F, x - 0.9, 7.6, 2.5, x + 0.9, 7.75, D - 0.5, C.WoodLight, M.Planks, { Name = "LuggageRack" })
			Kit.box(model, F, x - sx * 0.85 - 0.1, 7.9, 2.5, x - sx * 0.85 + 0.1, 8.1, D - 0.5, C.Brass, M.Metal, { Name = "RackRail" })
		end
		Props.suitcase(model, F * CFrame.new(-(hw - 0.9), 7.75, 4.4) * CFrame.Angles(0, rad(90), 0), 2.2, 1.0, 1.2, C.Burgundy)
		Props.trunk(model, F * CFrame.new(hw - 0.9, 7.75, D - 2.4) * CFrame.Angles(0, rad(90), 0), 2.4, 1.2, 1.4, C.Leather)
		Props.sack(model, F * CFrame.new(hw - 0.9, 7.75, 4.8), 2.2, 1.0)
	end
	-- interior lining keeps the walls warm-toned inside
	Kit.box(model, F, -hw, 0.5, backZ - 0.15, hw, H - 0.6, backZ, C.Wood, M.Planks, { Name = "Lining" })
	return rng
end

local function buildCabin(folder, def, F)
	local W, D, H, DW = def.Width, def.Depth, def.Height, def.DoorWidth
	local hw = W / 2
	local model = Kit.model(folder, def.Id)
	model:SetAttribute("CabinId", def.Id)
	model:SetAttribute("Capacity", def.Capacity)
	model:SetAttribute("DisplayName", def.DisplayName)
	model:SetAttribute("State", "Idle")
	model:SetAttribute("Count", 0)
	model:SetAttribute("LeaderName", "")
	model:SetAttribute("Countdown", 0)
	model:SetAttribute("Pulse", 0)

	-- Plinth, floor and a step up.
	Kit.box(model, F, -hw - 1.6, 0, -2.2, hw + 1.6, 0.4, D + 2.6, C.StoneLight, M.Slate, { Name = "Plinth" })
	Kit.box(model, F, -hw, 0.4, 1, hw, 0.5, D + 1, C.WoodLight, M.Planks, { Name = "Floor" })
	Kit.box(model, F, -DW / 2 - 0.3, 0.4, -0.1, DW / 2 + 0.3, 0.5, 1, C.Brass, M.Plate, { Name = "Threshold" })

	-- Side walls with windows (Solo stays private: a porthole only).
	local sideHoles = {}
	if def.Style ~= "Solo" then
		local count = def.Capacity >= 3 and 2 or 1
		for i = 1, count do
			local zc = 1 + D * i / (count + 1)
			table.insert(sideHoles, { zc - 1.6, zc + 1.6, 3.6, 7 })
		end
	end
	for _, sx in ipairs({ -1, 1 }) do
		Kit.wallZ(model, F, sx * (hw + 0.5), 1, 0, D + 2, 0.4, H, sideHoles, C.WoodDark, M.Planks, { Name = "SideWall" })
		for _, h in ipairs(sideHoles) do
			Kit.part(model, V(0.15, h[4] - h[3], h[2] - h[1]), F * CFrame.new(sx * (hw + 0.5), (h[3] + h[4]) / 2, (h[1] + h[2]) / 2), C.Glass, M.Glass, { Name = "Window", Transparency = 0.55, CastShadow = false })
			Kit.box(model, F, sx * (hw + 0.5) - 0.65, h[3] - 0.25, h[1] - 0.2, sx * (hw + 0.5) + 0.65, h[3], h[2] + 0.2, C.Brass, M.Metal, { Name = "WindowSill" })
		end
	end
	if def.Style == "Solo" then
		Kit.cylX(model, 1.15, 2.2, F * CFrame.new(-hw - 0.5, 5.2, D / 2 + 1), C.Brass, M.Metal, { Name = "PortholeRim" })
		Kit.cylX(model, 1.25, 1.6, F * CFrame.new(-hw - 0.5, 5.2, D / 2 + 1), C.GlassDark, M.Glass, { Name = "Porthole" })
	end
	Kit.wallX(model, F, D + 1.5, 1, -hw - 1, hw + 1, 0.4, H, {}, C.WoodDark, M.Planks, { Name = "BackWall" })

	-- Front facade: dark aged metal with the door opening and (larger cabins) windows.
	local frontHoles = { { -DW / 2, DW / 2, 0.4, DOOR_H + 0.4 } }
	local frontWindows = {}
	if def.Style ~= "Solo" then
		local inner = DW / 2 + 0.9
		local outer = hw - 0.6
		if outer - inner > 1 then
			table.insert(frontHoles, { -outer, -inner, 3.8, 6.8 })
			table.insert(frontHoles, { inner, outer, 3.8, 6.8 })
			table.insert(frontWindows, { -outer, -inner })
			table.insert(frontWindows, { inner, outer })
		end
	end
	Kit.wallX(model, F, 0.5, 1, -hw - 1, hw + 1, 0.4, H, frontHoles, C.BlueSteelDark, M.Metal, { Name = "Facade" })
	for _, w in ipairs(frontWindows) do
		Kit.part(model, V(w[2] - w[1], 3, 0.15), F * CFrame.new((w[1] + w[2]) / 2, 5.3, 0.5), C.Glass, M.Glass, { Name = "Window", Transparency = 0.55, CastShadow = false })
		Kit.box(model, F, w[1] - 0.2, 3.55, -0.25, w[2] + 0.2, 3.8, 1, C.Brass, M.Metal, { Name = "WindowSill" })
	end
	Kit.box(model, F, -hw - 1.05, H - 1.3, -0.12, hw + 1.05, H - 0.9, 0, C.Burgundy, M.Smooth, { Name = "Beltline" })
	for _, sx in ipairs({ -1, 1 }) do
		Kit.box(model, F, sx * (hw + 0.5) - 0.65, 0.4, -0.25, sx * (hw + 0.5) + 0.65, H + 0.2, 1.1, C.Iron, M.Metal, { Name = "CornerPost" })
		Kit.box(model, F, sx * (hw + 0.5) - 0.65, 0.4, D + 0.9, sx * (hw + 0.5) + 0.65, H + 0.2, D + 2.25, C.Iron, M.Metal, { Name = "CornerPost" })
	end

	-- Door frame, sliding pocket doors (hidden inside the wall while open).
	Kit.box(model, F, -DW / 2 - 0.35, 0.4, -0.18, -DW / 2, DOOR_H + 0.75, 0.02, C.Brass, M.Metal, { Name = "DoorFrame" })
	Kit.box(model, F, DW / 2, 0.4, -0.18, DW / 2 + 0.35, DOOR_H + 0.75, 0.02, C.Brass, M.Metal, { Name = "DoorFrame" })
	Kit.box(model, F, -DW / 2 - 0.35, DOOR_H + 0.4, -0.18, DW / 2 + 0.35, DOOR_H + 0.75, 0.02, C.Brass, M.Metal, { Name = "DoorFrame" })
	local leafW = DW / 2 + 0.05
	for _, sx in ipairs({ -1, 1 }) do
		local closed = F * CFrame.new(sx * (leafW / 2 - 0.05), 0.4 + DOOR_H / 2, 0.5)
		local open = F * CFrame.new(sx * (DW / 2 + leafW / 2 + 0.06), 0.4 + DOOR_H / 2, 0.5)
		local leaf = Kit.part(model, V(leafW, DOOR_H, 0.3), open, C.Burgundy, M.Metal, { Name = sx < 0 and "DoorLeft" or "DoorRight" })
		leaf:SetAttribute("OpenCFrame", open)
		leaf:SetAttribute("ClosedCFrame", closed)
		local g = Kit.surface(leaf, Enum.NormalId.Front, 30)
		Kit.frame(g, { Position = UDim2.new(0.18, 0, 0.1, 0), Size = UDim2.new(0.64, 0, 0.32, 0), BackgroundTransparency = 0, BackgroundColor3 = C.GlassDark })
		Kit.stroke(Kit.frame(g, { Position = UDim2.new(0.12, 0, 0.5, 0), Size = UDim2.new(0.76, 0, 0.42, 0) }), C.BrassDark, 2, 0.2)
		Kit.frame(g, { Position = UDim2.new(sx < 0 and 0.84 or 0.08, 0, 0.5, 0), Size = UDim2.new(0.08, 0, 0.14, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
	end
	Kit.box(model, F, -DW - 0.4, DOOR_H + 0.8, -0.3, DW + 0.4, DOOR_H + 1.05, 0, C.Iron, M.Metal, { Name = "DoorRail" })

	-- Name sign above the door + capacity bulbs on top of it.
	local signW = W - 1
	local sy0, sy1 = DOOR_H + 1.25, math.min(H - 0.5, DOOR_H + 3.6)
	local sign = Kit.box(model, F, -signW / 2, sy0, -0.35, signW / 2, sy1, -0.05, C.Charcoal, M.Smooth, { Name = "Sign" })
	local CabinDefs = CabinDefinitions
	Graphics.signPlate(Kit.surface(sign, Enum.NormalId.Front, 40, { LightInfluence = 0.4, Brightness = 1.1 }), def.DisplayName, CabinDefs.CapacityLabel(def.Capacity), { TitleColor = C.Parchment })
	local bulbs = Kit.folder(model, "CapacityBulbs")
	for i = 1, def.Capacity do
		local bx = (i - (def.Capacity + 1) / 2) * 1.1
		Kit.cylY(bulbs, 0.3, 0.7, F * CFrame.new(bx, sy1 + 0.15, -0.2), C.BrassDark, M.Metal, { Name = "Socket" })
		Kit.ball(bulbs, 0.6, F * CFrame.new(bx, sy1 + 0.55, -0.2), C.BulbOff, M.Glass, { Name = "Bulb" .. i, CastShadow = false })
	end

	-- Status display beside the door (count + status), updated by the client.
	local plateW = math.min(2.4, hw - 0.2 - (DW / 2 + 0.35))
	local px0 = DW / 2 + 0.35
	local plate = Kit.box(model, F, px0, 4.0, -0.14, px0 + plateW, 5.7, -0.02, C.Charcoal, M.Smooth, { Name = "CounterPlate" })
	local display = Kit.surface(plate, Enum.NormalId.Front, 60, { Name = "Display", LightInfluence = 0.2, Brightness = 1.4 })
	Kit.frame(display, { Size = UDim2.new(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(22, 21, 20) })
	Kit.stroke(Kit.frame(display, { Size = UDim2.new(1, -6, 1, -6), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }), C.BrassDark, 2, 0.2)
	Kit.label(display, "0 / " .. def.Capacity, { Name = "Count", Position = UDim2.new(0.1, 0, 0.08, 0), Size = UDim2.new(0.8, 0, 0.46, 0), Font = Enum.Font.Merriweather, TextColor3 = C.Parchment })
	Kit.label(display, def.Capacity == 1 and "EXPLORER" or "EXPLORERS", { Name = "Unit", Position = UDim2.new(0.1, 0, 0.53, 0), Size = UDim2.new(0.8, 0, 0.16, 0), TextColor3 = C.Brass })
	Kit.label(display, "AVAILABLE", { Name = "Status", Position = UDim2.new(0.08, 0, 0.72, 0), Size = UDim2.new(0.84, 0, 0.18, 0), TextColor3 = C.Parchment })

	-- Exterior lamp by the door (no light object: the facade is lit by the platform).
	Props.sconce(model, F * CFrame.new(-DW / 2 - 1.1, DOOR_H - 0.3, 0) * CFrame.Angles(0, 0, 0), nil)

	-- Roof, by style.
	if def.Style == "Solo" then
		pitchedRoof(model, F, hw, D, H, 2.4, 0.8)
		local vent = Kit.cylZ(model, 0.3, 1.8, F * CFrame.new(0, H + 0.9, -0.05), C.Brass, M.Metal, { Name = "GableRoundel" })
		Emblem.Create(Kit.surface(vent, Enum.NormalId.Right, 60), { Color = C.Ink, Thickness = 3 })
	elseif def.Style == "Duo" then
		archedRoof(model, F, hw, D, H)
	elseif def.Style == "Squad" then
		flatRoof(model, F, hw, D, H)
	else
		pitchedRoof(model, F, hw, D, H, 5, 1.2)
		local roundel = Kit.cylZ(model, 0.3, 3.4, F * CFrame.new(0, H + 1.9, -0.05), C.Brass, M.Metal, { Name = "GableRoundel" })
		Emblem.Create(Kit.surface(roundel, Enum.NormalId.Right, 50), { Color = C.Ink, Thickness = 4 })
		-- roof lantern (clerestory) gives the Crew cabin its taller silhouette
		Kit.box(model, F, -1.4, H + 4.2, D * 0.35, 1.4, H + 6.4, D * 0.65, C.Iron, M.Metal, { Name = "RoofLantern" })
		Kit.box(model, F, -1.8, H + 6.4, D * 0.35 - 0.4, 1.8, H + 6.8, D * 0.65 + 0.4, C.BlueSteelDark, M.Metal, { Name = "RoofLanternCap" })
		Kit.box(model, F, -1.45, H + 4.9, D * 0.4, 1.45, H + 5.8, D * 0.6, C.BulbWarm, M.Neon, { Name = "RoofLanternGlow", Transparency = 0.35, CastShadow = false })
	end

	-- Semaphore boarding indicator on the left corner.
	semaphore(model, F, -hw - 0.5, H)

	-- Interior: lamp, furniture, the boarding zone and the exit point.
	local light = Props.pendant(model, F * CFrame.new(0, H - 0.3, D / 2 + 1), 1.4, 1.6, W + 8, 0.85)
	light.Name = "CabinLight"
	interior(model, def, F, hw, D, H)
	Kit.soundEmitter(Kit.marker(model, "HumSource", V(1, 1, 1), F * CFrame.new(0, 3, D + 0.5)), "CabinHum")
	Kit.marker(model, "Zone", V(W - 0.4, 8, D - 0.3), F * CFrame.new(0, 4.5, D / 2 + 1.05))
	Kit.marker(model, "ExitPoint", V(2, 1, 2), F * CFrame.new(0, 0.5, -5.5))
	Kit.tag(model, "ExpeditionCabin")
	return model
end

function CabinBuilder.Build(parent, platformY)
	local folder = Kit.folder(parent, "ExpeditionCabins")
	local gap = 5
	local total = -gap
	for _, def in ipairs(CabinDefinitions) do
		total = total + def.Width + 2 + gap
	end
	local x = -total / 2
	local frontZ = 46
	for _, def in ipairs(CabinDefinitions) do
		local ext = def.Width + 2
		buildCabin(folder, def, CFrame.new(x + ext / 2, platformY, frontZ))
		x = x + ext + gap
	end
	return folder
end

return CabinBuilder
