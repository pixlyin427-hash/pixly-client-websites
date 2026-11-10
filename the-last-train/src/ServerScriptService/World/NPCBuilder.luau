--[[
	NPCBuilder — The Station Keeper and The Conductor.

	Stylised figures built from parts (no Humanoid: they never move, so they
	cost no physics and show no default nameplate). Each one has:
	  * a recognisable silhouette (Keeper: wide-brim hat, long field coat,
	    lantern; Conductor: tall peaked cap, ankle-length frock coat)
	  * a face drawn on a SurfaceGui
	  * a ProximityPrompt (attribute DialogueId) handled by the client
	  * a small amber diamond indicator above the head
]]

local Kit = require(script.Parent.BuildKit)
local Props = require(script.Parent.Props)

local C, M = Kit.C, Kit.M
local rad = math.rad

local NPCBuilder = {}

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

local KINDS = {
	StationKeeper = {
		ObjectText = "The Station Keeper",
		Scale = 1.0,
		Coat = Color3.fromRGB(70, 80, 64),
		CoatLength = 1.9,
		Trousers = Color3.fromRGB(52, 42, 34),
		Skin = Color3.fromRGB(186, 142, 108),
		Hands = Color3.fromRGB(96, 64, 44), -- work gloves
	},
	Conductor = {
		ObjectText = "The Conductor",
		Scale = 1.08,
		Coat = Color3.fromRGB(34, 38, 48),
		CoatLength = 2.3,
		Trousers = Color3.fromRGB(28, 30, 36),
		Skin = Color3.fromRGB(172, 128, 98),
		Hands = Color3.fromRGB(220, 214, 200), -- white gloves
	},
}

local function face(head, kind, s)
	local plate = Kit.part(head.Parent, V(1.1 * s, 0.9 * s, 0.05), head.CFrame * CFrame.new(0, 0.05 * s, -0.71 * s), C.Glass, M.Smooth, { Name = "FacePlate", Transparency = 1, CanCollide = false, CastShadow = false })
	local g = Kit.surface(plate, Enum.NormalId.Front, 100, { LightInfluence = 1 })
	local ink = Color3.fromRGB(34, 26, 22)
	for _, x in ipairs({ 0.3, 0.7 }) do
		Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(x, 0, 0.36, 0), Size = UDim2.new(0.1, 0, kind == "Conductor" and 0.07 or 0.12, 0), BackgroundTransparency = 0, BackgroundColor3 = ink })
		Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(x, 0, 0.2, 0), Size = UDim2.new(0.2, 0, 0.045, 0), Rotation = x < 0.5 and 8 or -8, BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(110, 104, 98) })
	end
	if kind == "StationKeeper" then
		local stache = Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.64, 0), Size = UDim2.new(0.46, 0, 0.11, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(150, 146, 140) })
		Kit.corner(stache, 0.5, 0)
	else
		local beard = Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0.62, 0), Size = UDim2.new(0.62, 0, 0.36, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(96, 94, 92) })
		Kit.corner(beard, 0.4, 0)
		Kit.frame(g, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.7, 0), Size = UDim2.new(0.22, 0, 0.035, 0), BackgroundTransparency = 0, BackgroundColor3 = ink })
	end
end

local function indicator(head, s)
	local bb = Instance.new("BillboardGui")
	bb.Name = "TalkIndicator"
	bb.Size = UDim2.new(0, 22, 0, 22)
	bb.StudsOffset = Vector3.new(0, 1.9 * s, 0)
	bb.MaxDistance = 45
	bb.AlwaysOnTop = false
	bb.LightInfluence = 0
	bb.Parent = head
	local diamond = Kit.frame(bb, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(0, 11, 0, 11), Rotation = 45, BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(226, 168, 96) })
	Kit.stroke(diamond, Color3.fromRGB(40, 30, 20), 1.5, 0.2)
end

function NPCBuilder.Build(parent, cf, kind)
	local k = KINDS[kind]
	assert(k, "Unknown NPC kind " .. tostring(kind))
	local s = k.Scale
	local folder = parent:FindFirstChild("NPCs") or Kit.folder(parent, "NPCs")
	local m = Kit.model(folder, kind)
	local function P(name, size, x, y, z, color, material, extra)
		local props = { Name = name }
		if extra then
			for kk, vv in pairs(extra) do
				props[kk] = vv
			end
		end
		return Kit.part(m, size * s, cf * CFrame.new(x * s, y * s, z * s), color, material or M.Fabric, props)
	end

	-- Body.
	for _, sx in ipairs({ -1, 1 }) do
		P("Boot", V(0.95, 0.55, 1.35), sx * 0.5, 0.275, -0.12, Color3.fromRGB(40, 30, 24), M.Smooth)
		P("Leg", V(0.85, 2.4, 0.85), sx * 0.5, 1.75, 0, k.Trousers)
		P("Sleeve", V(0.72, 2.3, 0.82), sx * 1.48, 4.0, 0, k.Coat)
		P("Hand", V(0.55, 0.5, 0.6), sx * 1.48, 2.6, 0, k.Hands, M.Smooth)
	end
	local torso = P("Torso", V(2.2, 2.3, 1.15), 0, 4.1, 0, k.Coat)
	P("CoatSkirt", V(2.3, k.CoatLength, 1.3), 0, 2.95 - k.CoatLength / 2, 0.02, k.Coat)
	local head = Kit.ball(m, 1.45 * s, cf * CFrame.new(0, 6.1 * s, 0), k.Skin, M.Smooth, { Name = "Head" })
	face(head, kind, s)
	m.PrimaryPart = torso

	if kind == "StationKeeper" then
		P("Belt", V(2.32, 0.3, 1.32), 0, 3.05, 0, C.Leather, M.Smooth)
		P("Scarf", V(1.5, 0.45, 1.25), 0, 5.4, 0, C.Burgundy)
		P("ScarfTail", V(0.4, 1.3, 0.15), -0.45, 4.6, -0.62, C.Burgundy)
		Kit.cylY(m, 0.14 * s, 2.7 * s, cf * CFrame.new(0, 6.85 * s, 0), Color3.fromRGB(60, 48, 40), M.Fabric, { Name = "HatBrim" })
		Kit.cylY(m, 0.95 * s, 1.55 * s, cf * CFrame.new(0, 7.35 * s, 0), Color3.fromRGB(60, 48, 40), M.Fabric, { Name = "HatCrown" })
		Kit.cylY(m, 0.2 * s, 1.58 * s, cf * CFrame.new(0, 7.05 * s, 0), C.Burgundy, M.Fabric, { Name = "HatBand" })
		P("Satchel", V(0.6, 1.0, 1.1), 1.32, 3.1, 0.1, C.Leather)
		Kit.beam(m, cf * V(-0.9 * s, 5.2 * s, -0.6 * s), cf * V(0.95 * s, 3.4 * s, -0.6 * s), 0.18 * s, 0.1 * s, C.Leather, M.Fabric, { Name = "Strap" })
		Kit.beam(m, cf * V(-0.6 * s, 3.65 * s, -0.6 * s), cf * V(0.3 * s, 3.35 * s, -0.6 * s), 0.08 * s, 0.08 * s, C.Brass, M.Metal, { Name = "WatchChain" })
		-- He carries a lantern: a little warm light that follows the terminal's mood.
		Props.lantern(m, cf * CFrame.new(-1.48 * s, 0.95 * s, -0.15 * s), 0.6, 9, 0.6)
	else
		Kit.part(m, V(0.12, 4.0, 0.05) * s, cf * CFrame.new(0, 3.3 * s, -0.66 * s), C.Burgundy, M.Smooth, { Name = "Piping" })
		for _, sx in ipairs({ -1, 1 }) do
			for row = 0, 2 do
				Kit.ball(m, 0.2 * s, cf * CFrame.new(sx * 0.42 * s, (4.7 - row * 0.6) * s, -0.62 * s), C.Brass, M.Metal, { Name = "Button" })
			end
			P("Epaulette", V(0.8, 0.15, 0.9), sx * 1.3, 5.3, 0, C.BrassDark, M.Metal)
			P("Cuff", V(0.76, 0.3, 0.86), sx * 1.48, 3.0, 0, C.Burgundy)
		end
		P("Collar", V(1.2, 0.35, 1.0), 0, 5.4, 0, k.Coat)
		Kit.cylY(m, 0.6 * s, 1.6 * s, cf * CFrame.new(0, 7.0 * s, 0), Color3.fromRGB(28, 30, 38), M.Fabric, { Name = "CapBand" })
		Kit.cylY(m, 0.18 * s, 1.85 * s, cf * CFrame.new(0, 7.38 * s, 0), Color3.fromRGB(34, 36, 46), M.Fabric, { Name = "CapTop" })
		Kit.part(m, V(1.3, 0.1, 0.65) * s, cf * CFrame.new(0, 6.72 * s, -0.95 * s) * CFrame.Angles(rad(14), 0, 0), Color3.fromRGB(20, 20, 24), M.Smooth, { Name = "CapVisor" })
		Kit.cylZ(m, 0.08 * s, 0.42 * s, cf * CFrame.new(0, 7.05 * s, -0.82 * s), C.Brass, M.Metal, { Name = "CapBadge" })
		P("TicketPunch", V(0.25, 0.5, 0.6), 1.48, 2.2, -0.25, C.Brass, M.Metal)
	end

	local prompt = Kit.prompt(torso, "Talk", k.ObjectText, 10)
	prompt:SetAttribute("DialogueId", kind)
	indicator(head, s)
	Kit.tag(m, "NPC")
	return m
end

return NPCBuilder
