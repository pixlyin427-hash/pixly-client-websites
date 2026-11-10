--[[
	Graphics
	Asset-free artwork drawn with GUI frames on SurfaceGuis: travel posters,
	route maps, sign plates. No uploaded images are needed, so the place
	works the moment it is opened and nothing can fail to load.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Kit = require(script.Parent.BuildKit)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)

local C = Kit.C

local Graphics = {}

local function U(xs, xo, ys, yo)
	return UDim2.new(xs, xo or 0, ys, yo or 0)
end

local function fill(g, color)
	return Kit.frame(g, { Size = U(1, 0, 1, 0), BackgroundTransparency = 0, BackgroundColor3 = color, Name = "Background" })
end

local function text(parent, str, x, y, w, h, color, font, extra)
	local props = { Position = U(x, 0, y, 0), Size = U(w, 0, h, 0), TextColor3 = color, Font = font or Enum.Font.Oswald }
	if extra then
		for k, v in pairs(extra) do
			props[k] = v
		end
	end
	return Kit.label(parent, str, props)
end

local function rect(parent, x, y, w, h, color, rotation, transparency)
	return Kit.frame(parent, {
		Position = U(x, 0, y, 0),
		Size = U(w, 0, h, 0),
		AnchorPoint = Vector2.new(0.5, 0.5),
		BackgroundTransparency = transparency or 0,
		BackgroundColor3 = color,
		Rotation = rotation or 0,
	})
end

local function circle(parent, x, y, d, color, transparency)
	local f = rect(parent, x, y, d, d, color, 0, transparency)
	Kit.corner(f, 0.5, 0)
	return f
end

-- Dark sign plate with brass border: title + optional subtitle.
function Graphics.signPlate(g, title, subtitle, opts)
	opts = opts or {}
	fill(g, opts.Background or C.Charcoal)
	local border = Kit.frame(g, { Size = U(1, -10, 1, -10), Position = U(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) })
	Kit.stroke(border, opts.Border or C.Brass, opts.BorderThickness or 3, 0.15)
	if subtitle and subtitle ~= "" then
		text(g, title, 0.06, 0.1, 0.88, 0.5, opts.TitleColor or C.Parchment, opts.TitleFont or Enum.Font.Oswald)
		text(g, subtitle, 0.1, 0.62, 0.8, 0.26, opts.SubtitleColor or C.Brass, Enum.Font.Oswald)
	else
		text(g, title, 0.06, 0.16, 0.88, 0.68, opts.TitleColor or C.Parchment, opts.TitleFont or Enum.Font.Oswald)
	end
end

function Graphics.poster(g, design)
	if design == "Vale" then
		fill(g, Color3.fromRGB(56, 66, 90))
		circle(g, 0.5, 0.34, 0.34, Color3.fromRGB(232, 170, 102))
		local hills = Kit.frame(g, { Position = U(0, 0, 0.42, 0), Size = U(1, 0, 0.3, 0), ClipsDescendants = true })
		rect(hills, 0.28, 0.95, 0.62, 0.62, Color3.fromRGB(36, 44, 62), 45)
		rect(hills, 0.72, 1.05, 0.7, 0.7, Color3.fromRGB(30, 36, 52), 45)
		Kit.frame(g, { Position = U(0, 0, 0.72, 0), Size = U(1, 0, 0.28, 0), BackgroundTransparency = 0, BackgroundColor3 = Color3.fromRGB(24, 26, 32) })
		text(g, "THE SUNKEN VALE", 0.08, 0.75, 0.84, 0.11, C.Parchment)
		text(g, "EXPEDITIONS NOW BOARDING", 0.16, 0.87, 0.68, 0.06, Color3.fromRGB(232, 170, 102))
	elseif design == "Dusk" then
		fill(g, C.BurgundyDeep)
		Emblem.Create(g, { Size = U(0.62, 0, 0.42, 0), Position = U(0.5, 0, 0.36, 0), Color = Color3.fromRGB(214, 172, 104), Thickness = 4 })
		text(g, "EXPEDITIONS", 0.1, 0.66, 0.8, 0.1, C.Parchment)
		text(g, "DEPART AT DUSK", 0.1, 0.76, 0.8, 0.08, C.Parchment)
		text(g, "THE LAST TRAIN", 0.25, 0.88, 0.5, 0.05, Color3.fromRGB(214, 172, 104))
	elseif design == "Fog" then
		fill(g, Color3.fromRGB(88, 100, 112))
		for i = 0, 5 do
			rect(g, 0.5 + (i % 2) * 0.08 - 0.04, 0.16 + i * 0.085, 0.7 - (i % 3) * 0.12, 0.022, Color3.fromRGB(176, 186, 194), 0, 0.35)
		end
		rect(g, 0.38, 0.5, 0.28, 0.07, Color3.fromRGB(30, 32, 38))
		rect(g, 0.6, 0.5, 0.16, 0.06, Color3.fromRGB(30, 32, 38))
		rect(g, 0.27, 0.455, 0.035, 0.06, Color3.fromRGB(30, 32, 38))
		circle(g, 0.25, 0.49, 0.025, Color3.fromRGB(238, 196, 128))
		text(g, "MIND THE FOG", 0.1, 0.68, 0.8, 0.11, Color3.fromRGB(28, 30, 36))
		text(g, "STAY WITH YOUR CREW", 0.18, 0.8, 0.64, 0.06, Color3.fromRGB(44, 46, 52))
	else -- "Line"
		fill(g, C.Parchment)
		text(g, "THE HOLLOW LINE", 0.08, 0.06, 0.84, 0.1, C.Ink)
		rect(g, 0.3, 0.55, 0.018, 0.62, C.Burgundy)
		local stops = { { 0.3, "TERMINAL" }, { 0.45, "ASHFORD HALT" }, { 0.6, "GREYWATER" }, { 0.75, "?" } }
		for _, s in ipairs(stops) do
			circle(g, 0.3, s[1], 0.06, C.Burgundy)
			circle(g, 0.3, s[1], 0.03, C.Parchment)
			text(g, s[2], 0.38, s[1] - 0.03, 0.55, 0.06, C.Ink, Enum.Font.Oswald, { TextXAlignment = Enum.TextXAlignment.Left })
		end
		text(g, "ALL STATIONS UNCONFIRMED", 0.12, 0.9, 0.76, 0.05, C.Burgundy)
	end
end

-- Large wall mural: the routes that are known, fading into what is not.
function Graphics.routeMap(g)
	fill(g, C.Parchment)
	local unknown = Kit.frame(g, { Position = U(0.62, 0, 0, 0), Size = U(0.38, 0, 1, 0), BackgroundTransparency = 0.55, BackgroundColor3 = Color3.fromRGB(150, 134, 108) })
	for i = 1, 5 do
		Kit.frame(unknown, { Position = U(0, 0, i / 6, 0), Size = U(1, 0, 0.004, 0), BackgroundTransparency = 0.5, BackgroundColor3 = C.Ink })
		Kit.frame(unknown, { Position = U(i / 6, 0, 0, 0), Size = U(0.004, 0, 1, 0), BackgroundTransparency = 0.5, BackgroundColor3 = C.Ink })
	end
	-- coastline
	local coast = { { 0.04, 0.82, 0.16, -18 }, { 0.17, 0.74, 0.14, -40 }, { 0.27, 0.62, 0.12, -10 }, { 0.37, 0.6, 0.12, 25 }, { 0.47, 0.67, 0.12, -5 }, { 0.57, 0.64, 0.1, -35 } }
	for _, s in ipairs(coast) do
		rect(g, s[1] + s[3] / 2, s[2], s[3], 0.012, Color3.fromRGB(86, 96, 108), s[4])
	end
	-- the route, dashed, stations as rings
	local route = { { 0.12, 0.48 }, { 0.26, 0.4 }, { 0.4, 0.44 }, { 0.54, 0.34 }, { 0.66, 0.3 }, { 0.78, 0.22 } }
	for i = 1, #route - 1 do
		local a, b = route[i], route[i + 1]
		local dx, dy = (b[1] - a[1]), (b[2] - a[2]) * 0.55
		local len = math.sqrt(dx * dx + dy * dy)
		local angle = math.deg(math.atan2(dy, dx))
		local alpha = i >= 4 and 0.45 + (i - 4) * 0.25 or 0
		for k = 0, 3 do
			local t = (k + 0.5) / 4
			rect(g, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, len / 6, 0.012, C.Burgundy, angle, alpha)
		end
	end
	local names = { "TERMINAL", "ASHFORD HALT", "GREYWATER", "THE HOLLOW", "", "" }
	for i, p in ipairs(route) do
		if i <= 4 then
			circle(g, p[1], p[2], 0.036, C.Burgundy)
			circle(g, p[1], p[2], 0.018, C.Parchment)
			text(g, names[i], p[1] - 0.08, p[2] + 0.04, 0.16, 0.05, C.Ink)
		end
	end
	text(g, "?", 0.8, 0.12, 0.06, 0.12, C.Burgundy, Enum.Font.Merriweather)
	text(g, "KNOWN ROUTES", 0.04, 0.05, 0.4, 0.09, C.Ink, Enum.Font.Merriweather, { TextXAlignment = Enum.TextXAlignment.Left })
	text(g, "SURVEYED BY THE EXPEDITION OFFICE", 0.04, 0.14, 0.4, 0.04, C.Burgundy, Enum.Font.Oswald, { TextXAlignment = Enum.TextXAlignment.Left })
	text(g, "UNCHARTED", 0.66, 0.88, 0.3, 0.06, C.Ink, Enum.Font.Oswald)
	-- compass rose
	circle(g, 0.12, 0.2, 0.08, C.Ink, 0.6)
	rect(g, 0.12, 0.2, 0.01, 0.16, C.Ink)
	rect(g, 0.12, 0.2, 0.05, 0.005, C.Ink)
	text(g, "N", 0.105, 0.04, 0.03, 0.05, C.Ink)
end

-- Small table-top map (expedition planning).
function Graphics.tableMap(g, seed)
	local rng = Kit.rng(seed or 7)
	fill(g, Color3.fromRGB(214, 196, 158))
	for _ = 1, 9 do
		rect(g, rng(0.1, 0.9), rng(0.15, 0.85), rng(0.08, 0.22), 0.01, Color3.fromRGB(94, 104, 112), rng(-60, 60), 0.2)
	end
	local x, y = 0.15, rng(0.3, 0.7)
	for _ = 1, 6 do
		local nx, ny = x + rng(0.08, 0.14), math.max(0.15, math.min(0.85, y + rng(-0.15, 0.15)))
		local dx, dy = nx - x, ny - y
		rect(g, (x + nx) / 2, (y + ny) / 2, math.sqrt(dx * dx + dy * dy), 0.012, C.Burgundy, math.deg(math.atan2(dy, dx)))
		circle(g, nx, ny, 0.03, C.Burgundy)
		x, y = nx, ny
	end
	circle(g, 0.85, 0.2, 0.1, C.Ink, 0.7)
end

return Graphics
