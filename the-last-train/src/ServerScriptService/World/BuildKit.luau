--[[
	BuildKit
	Small, dependable helpers used by every world builder.

	Conventions
	  * Every part is anchored, smooth-surfaced and named.
	  * Positions are given in a local "frame" CFrame so whole structures can be
	    moved or rotated by changing one CFrame.
	  * Only long-standing Enum.Material values are used (no 2022+ materials),
	    so nothing breaks on older Studio builds.
	  * Written in the Lua 5.1 subset of Luau (tools/ runs it offline to
	    generate the browser preview and to catch errors).
]]

local CollectionService = game:GetService("CollectionService")

local Kit = {}

local rad = math.rad

-- PALETTE ---------------------------------------------------------------
local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end

Kit.C = {
	Charcoal = rgb(38, 40, 44),
	Iron = rgb(48, 50, 54),
	BlueSteel = rgb(54, 63, 74),
	BlueSteelDark = rgb(40, 46, 55),
	Burgundy = rgb(98, 31, 37),
	BurgundyDeep = rgb(72, 23, 29),
	Brass = rgb(164, 129, 74),
	BrassDark = rgb(120, 94, 56),
	WoodDark = rgb(62, 41, 28),
	Wood = rgb(94, 63, 42),
	WoodLight = rgb(132, 95, 62),
	WoodWorn = rgb(112, 84, 60),
	Stone = rgb(116, 108, 97),
	StoneDark = rgb(80, 75, 69),
	StoneLight = rgb(148, 138, 124),
	Floor = rgb(88, 82, 74),
	Plaster = rgb(170, 154, 128),
	Cream = rgb(190, 174, 144),
	Leather = rgb(96, 58, 38),
	FabricRed = rgb(116, 42, 44),
	FabricGreen = rgb(56, 74, 62),
	Canvas = rgb(152, 138, 106),
	Parchment = rgb(224, 208, 174),
	Ink = rgb(46, 36, 28),
	Glass = rgb(150, 172, 186),
	GlassDark = rgb(52, 64, 78),
	BulbWarm = rgb(255, 196, 128),
	BulbOff = rgb(58, 52, 46),
	LightWarm = rgb(255, 176, 104),
	LightCold = rgb(150, 180, 220),
	Ground = rgb(36, 41, 39),
	Silhouette = rgb(30, 36, 42),
	Mountain = rgb(44, 52, 66),
	Foliage = rgb(32, 46, 40),
	Bark = rgb(48, 36, 28),
}

Kit.M = {
	Smooth = Enum.Material.SmoothPlastic,
	Metal = Enum.Material.Metal,
	Corroded = Enum.Material.CorrodedMetal,
	Plate = Enum.Material.DiamondPlate,
	Wood = Enum.Material.Wood,
	Planks = Enum.Material.WoodPlanks,
	Slate = Enum.Material.Slate,
	Concrete = Enum.Material.Concrete,
	Brick = Enum.Material.Brick,
	Cobble = Enum.Material.Cobblestone,
	Granite = Enum.Material.Granite,
	Marble = Enum.Material.Marble,
	Fabric = Enum.Material.Fabric,
	Glass = Enum.Material.Glass,
	Neon = Enum.Material.Neon,
	Pebble = Enum.Material.Pebble,
	Ground = Enum.Material.Ground,
	Rock = Enum.Material.Rock,
	Foil = Enum.Material.Foil,
}

-- DETERMINISTIC RANDOM (same layout every build) ---------------------------
function Kit.rng(seed)
	local state = seed % 2147483647
	if state <= 0 then
		state = state + 2147483646
	end
	return function(lo, hi)
		state = (state * 16807) % 2147483647
		local t = (state - 1) / 2147483646
		if lo == nil then
			return t
		end
		return lo + (hi - lo) * t
	end
end

-- INSTANCES ------------------------------------------------------------------
function Kit.folder(parent, name)
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

function Kit.model(parent, name)
	local m = Instance.new("Model")
	m.Name = name
	m.Parent = parent
	return m
end

local function finish(p, color, material, extra)
	p.Anchored = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Color = color or Kit.C.Stone
	p.Material = material or Kit.M.Smooth
	if extra then
		for k, v in pairs(extra) do
			p[k] = v
		end
	end
end

-- Generic block. `extra` can set Name, Transparency, CanCollide, CastShadow...
function Kit.part(parent, size, cframe, color, material, extra)
	local p = Instance.new("Part")
	p.Size = size
	p.CFrame = cframe
	finish(p, color, material, extra)
	p.Parent = parent
	return p
end

-- Axis-aligned box between two corners, expressed inside `frame`.
function Kit.box(parent, frame, x0, y0, z0, x1, y1, z1, color, material, extra)
	local sx, sy, sz = math.abs(x1 - x0), math.abs(y1 - y0), math.abs(z1 - z0)
	if sx < 0.01 or sy < 0.01 or sz < 0.01 then
		return nil
	end
	local cf = frame * CFrame.new((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
	return Kit.part(parent, Vector3.new(sx, sy, sz), cf, color, material, extra)
end

function Kit.wedge(parent, size, cframe, color, material, extra)
	local p = Instance.new("WedgePart")
	p.Size = size
	p.CFrame = cframe
	finish(p, color, material, extra)
	p.Parent = parent
	return p
end

local function shaped(parent, shape, size, cframe, color, material, extra)
	local p = Instance.new("Part")
	p.Shape = shape
	p.Size = size
	p.CFrame = cframe
	finish(p, color, material, extra)
	p.Parent = parent
	return p
end

-- Cylinders: Roblox cylinders run along their local X axis.
function Kit.cylX(parent, length, diameter, cframe, color, material, extra)
	return shaped(parent, Enum.PartType.Cylinder, Vector3.new(length, diameter, diameter), cframe, color, material, extra)
end

function Kit.cylY(parent, height, diameter, cframe, color, material, extra)
	return shaped(parent, Enum.PartType.Cylinder, Vector3.new(height, diameter, diameter), cframe * CFrame.Angles(0, 0, rad(90)), color, material, extra)
end

function Kit.cylZ(parent, length, diameter, cframe, color, material, extra)
	return shaped(parent, Enum.PartType.Cylinder, Vector3.new(length, diameter, diameter), cframe * CFrame.Angles(0, rad(90), 0), color, material, extra)
end

function Kit.ball(parent, diameter, cframe, color, material, extra)
	return shaped(parent, Enum.PartType.Ball, Vector3.new(diameter, diameter, diameter), cframe, color, material, extra)
end

-- A beam (block) running from p0 to p1.
function Kit.beam(parent, p0, p1, width, height, color, material, extra)
	local length = (p1 - p0).Magnitude
	local mid = (p0 + p1) / 2
	local cf
	local dir = (p1 - p0).Unit
	if math.abs(dir.Y) > 0.99 then
		cf = CFrame.lookAt(mid, p1, Vector3.new(1, 0, 0))
	else
		cf = CFrame.lookAt(mid, p1)
	end
	return Kit.part(parent, Vector3.new(width, height, length), cf, color, material, extra)
end

-- Right-triangle wall piece lying in the frame's XY plane (thin along Z).
-- The triangle spans xLow..xHigh at yBase, and rises to yTop above xHigh.
function Kit.triXY(parent, frame, xLow, xHigh, yBase, yTop, z, thickness, color, material, extra)
	local w = math.abs(xHigh - xLow)
	local h = yTop - yBase
	local cx = (xLow + xHigh) / 2
	local yaw = xHigh > xLow and rad(90) or rad(-90)
	local cf = frame * CFrame.new(cx, yBase + h / 2, z) * CFrame.Angles(0, yaw, 0)
	return Kit.wedge(parent, Vector3.new(thickness, h, w), cf, color, material, extra)
end

-- Slab whose underside follows the segment (xa,ya)->(xb,yb) in the frame's
-- XY plane, extruded along Z from z0 to z1. Used for arched roofs.
function Kit.slabXY(parent, frame, xa, ya, xb, yb, z0, z1, thickness, color, material, extra)
	local dx, dy = xb - xa, yb - ya
	local len = math.sqrt(dx * dx + dy * dy)
	local angle = math.atan2(dy, dx)
	local nx, ny = -math.sin(angle), math.cos(angle) -- outward (upward) normal
	local mx = (xa + xb) / 2 + nx * thickness / 2
	local my = (ya + yb) / 2 + ny * thickness / 2
	local cf = frame * CFrame.new(mx, my, (z0 + z1) / 2) * CFrame.Angles(0, 0, angle)
	return Kit.part(parent, Vector3.new(len + 0.05, thickness, math.abs(z1 - z0)), cf, color, material, extra)
end

-- Invisible helper volume (zones, spawn markers, exit points).
function Kit.marker(parent, name, size, cframe)
	return Kit.part(parent, size, cframe, Kit.C.Brass, Kit.M.Smooth, {
		Name = name,
		Transparency = 1,
		CanCollide = false,
		CanTouch = false,
		CanQuery = false,
		CastShadow = false,
	})
end

-- Wall with rectangular holes. Splits the solid area into as few blocks as
-- possible. a = horizontal axis along the wall, b = vertical axis.
-- holes = { {a0, a1, b0, b1}, ... } (must lie inside the wall).
function Kit.solidRects(a0, a1, b0, b1, holes)
	local bs = { b0, b1 }
	for _, h in ipairs(holes) do
		table.insert(bs, math.max(b0, math.min(b1, h[3])))
		table.insert(bs, math.max(b0, math.min(b1, h[4])))
	end
	table.sort(bs)
	local rows = {}
	local last = nil
	for _, b in ipairs(bs) do
		if last == nil or b - last > 0.001 then
			table.insert(rows, b)
			last = b
		end
	end
	local rects = {}
	local open = {} -- key "a0:a1" -> rect being extended upward
	for i = 1, #rows - 1 do
		local rb0, rb1 = rows[i], rows[i + 1]
		local cuts = {}
		for _, h in ipairs(holes) do
			if h[3] <= rb0 + 0.001 and h[4] >= rb1 - 0.001 then
				table.insert(cuts, { h[1], h[2] })
			end
		end
		table.sort(cuts, function(x, y)
			return x[1] < y[1]
		end)
		local segs = {}
		local cursor = a0
		for _, c in ipairs(cuts) do
			if c[1] > cursor + 0.001 then
				table.insert(segs, { cursor, c[1] })
			end
			if c[2] > cursor then
				cursor = c[2]
			end
		end
		if a1 > cursor + 0.001 then
			table.insert(segs, { cursor, a1 })
		end
		local nextOpen = {}
		for _, s in ipairs(segs) do
			local key = string.format("%.3f:%.3f", s[1], s[2])
			local r = open[key]
			if r and math.abs(r[4] - rb0) < 0.001 then
				r[4] = rb1
			else
				r = { s[1], s[2], rb0, rb1 }
				table.insert(rects, r)
			end
			nextOpen[key] = r
		end
		open = nextOpen
	end
	return rects
end

-- Wall running along the frame's Z axis at x = xCenter (thickness along X).
function Kit.wallZ(parent, frame, xCenter, thickness, z0, z1, y0, y1, holes, color, material, extra)
	local parts = {}
	for _, r in ipairs(Kit.solidRects(z0, z1, y0, y1, holes or {})) do
		table.insert(parts, Kit.box(parent, frame, xCenter - thickness / 2, r[3], r[1], xCenter + thickness / 2, r[4], r[2], color, material, extra))
	end
	return parts
end

-- Wall running along the frame's X axis at z = zCenter (thickness along Z).
function Kit.wallX(parent, frame, zCenter, thickness, x0, x1, y0, y1, holes, color, material, extra)
	local parts = {}
	for _, r in ipairs(Kit.solidRects(x0, x1, y0, y1, holes or {})) do
		table.insert(parts, Kit.box(parent, frame, r[1], r[3], zCenter - thickness / 2, r[2], r[4], zCenter + thickness / 2, color, material, extra))
	end
	return parts
end

-- LIGHTS --------------------------------------------------------------------
function Kit.pointLight(part, range, brightness, color)
	local l = Instance.new("PointLight")
	l.Range = range
	l.Brightness = brightness
	l.Color = color or Kit.C.LightWarm
	l.Shadows = false
	l.Parent = part
	return l
end

function Kit.spotLight(part, face, range, brightness, angle, color)
	local l = Instance.new("SpotLight")
	l.Face = face
	l.Range = range
	l.Brightness = brightness
	l.Angle = angle
	l.Color = color or Kit.C.LightWarm
	l.Shadows = false
	l.Parent = part
	return l
end

-- A glowing bulb (Neon ball). Optional light.
function Kit.bulb(parent, diameter, cframe, color, lightRange, lightBrightness, lightColor)
	local b = Kit.ball(parent, diameter, cframe, color or Kit.C.BulbWarm, Kit.M.Neon, { Name = "Bulb", CastShadow = false, CanCollide = false })
	if lightRange then
		Kit.pointLight(b, lightRange, lightBrightness or 1, lightColor)
	end
	return b
end

-- GUI -------------------------------------------------------------------------
function Kit.surface(part, face, pixelsPerStud, props)
	local g = Instance.new("SurfaceGui")
	g.Face = face
	g.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	g.PixelsPerStud = pixelsPerStud or 50
	g.LightInfluence = 0.55
	g.Brightness = 1
	g.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	g.MaxDistance = 220
	if props then
		for k, v in pairs(props) do
			g[k] = v
		end
	end
	g.Parent = part
	return g
end

function Kit.frame(parent, props)
	local f = Instance.new("Frame")
	f.BorderSizePixel = 0
	f.BackgroundTransparency = 1
	for k, v in pairs(props or {}) do
		f[k] = v
	end
	f.Parent = parent
	return f
end

function Kit.label(parent, text, props)
	local t = Instance.new("TextLabel")
	t.BorderSizePixel = 0
	t.BackgroundTransparency = 1
	t.Text = text
	t.Font = Enum.Font.Oswald
	t.TextColor3 = Kit.C.Parchment
	t.TextScaled = true
	t.Size = UDim2.new(1, 0, 1, 0)
	for k, v in pairs(props or {}) do
		t[k] = v
	end
	t.Parent = parent
	return t
end

function Kit.corner(inst, scale, offset)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(scale or 0, offset or 0)
	c.Parent = inst
	return c
end

function Kit.stroke(inst, color, thickness, transparency)
	local s = Instance.new("UIStroke")
	s.Color = color
	s.Thickness = thickness or 2
	s.Transparency = transparency or 0
	s.Parent = inst
	return s
end

-- MISC ------------------------------------------------------------------------
function Kit.tag(inst, tag)
	CollectionService:AddTag(inst, tag)
	return inst
end

function Kit.attachment(part, name, localCFrame)
	local a = Instance.new("Attachment")
	a.Name = name
	a.CFrame = localCFrame or CFrame.new()
	a.Parent = part
	return a
end

-- Positional sound hook. The client creates the Sound if AudioConfig has an id.
function Kit.soundEmitter(part, soundKey, localCFrame)
	local a = Kit.attachment(part, "Sound_" .. soundKey, localCFrame)
	a:SetAttribute("SoundKey", soundKey)
	Kit.tag(a, "SoundEmitter")
	return a
end

function Kit.prompt(part, actionText, objectText, maxDistance)
	local p = Instance.new("ProximityPrompt")
	p.ActionText = actionText
	p.ObjectText = objectText
	p.MaxActivationDistance = maxDistance or 10
	p.RequiresLineOfSight = false
	p.HoldDuration = 0
	p.Parent = part
	return p
end

return Kit
