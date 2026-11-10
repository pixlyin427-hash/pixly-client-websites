--[[
	Props
	Reusable, low part-count props. Each prop is built at `cf`, which is the
	prop's floor-level centre; the prop's front faces cf.LookVector (-Z).
	Typical prop: 2-7 parts. Variety comes from size / colour / rotation
	parameters chosen by the caller, not from extra geometry.
]]

local Kit = require(script.Parent.BuildKit)

local C, M = Kit.C, Kit.M
local rad = math.rad

local Props = {}

local function V(x, y, z)
	return Vector3.new(x, y, z)
end

local function at(cf, x, y, z)
	return cf * CFrame.new(x, y, z)
end

function Props.crate(parent, cf, w, h, d, color)
	color = color or C.WoodLight
	local body = Kit.part(parent, V(w, h, d), at(cf, 0, h / 2, 0), color, M.Planks, { Name = "Crate" })
	Kit.part(parent, V(w + 0.12, 0.25, d + 0.12), at(cf, 0, h - 0.12, 0), C.WoodDark, M.Wood, { Name = "CrateRim" })
	Kit.part(parent, V(w + 0.12, 0.25, d + 0.12), at(cf, 0, 0.12, 0), C.WoodDark, M.Wood, { Name = "CrateRim" })
	return body
end

function Props.trunk(parent, cf, w, h, d, color)
	color = color or C.Leather
	local body = Kit.part(parent, V(w, h * 0.72, d), at(cf, 0, h * 0.36, 0), color, M.Fabric, { Name = "Trunk" })
	Kit.part(parent, V(w + 0.1, h * 0.28, d + 0.1), at(cf, 0, h * 0.86, 0), C.WoodDark, M.Wood, { Name = "TrunkLid" })
	Kit.part(parent, V(0.18, h + 0.04, d + 0.16), at(cf, -w * 0.3, h / 2, 0), C.BrassDark, M.Metal, { Name = "Strap" })
	Kit.part(parent, V(0.18, h + 0.04, d + 0.16), at(cf, w * 0.3, h / 2, 0), C.BrassDark, M.Metal, { Name = "Strap" })
	return body
end

function Props.suitcase(parent, cf, w, h, d, color)
	color = color or C.Leather
	local body = Kit.part(parent, V(w, h, d), at(cf, 0, h / 2, 0), color, M.Fabric, { Name = "Suitcase" })
	Kit.part(parent, V(w * 0.35, 0.18, 0.18), at(cf, 0, h + 0.09, 0), C.WoodDark, M.Smooth, { Name = "Handle" })
	Kit.part(parent, V(w + 0.04, 0.12, d + 0.04), at(cf, 0, h * 0.55, 0), C.BrassDark, M.Metal, { Name = "Band" })
	return body
end

function Props.sack(parent, cf, length, diameter, color)
	return Kit.cylX(parent, length, diameter, at(cf, 0, diameter / 2, 0), color or C.Canvas, M.Fabric, { Name = "Sack" })
end

function Props.ropeCoil(parent, cf, diameter)
	Kit.cylY(parent, 0.5, diameter, at(cf, 0, 0.25, 0), C.Canvas, M.Fabric, { Name = "RopeCoil" })
	Kit.cylY(parent, 0.52, diameter * 0.45, at(cf, 0, 0.25, 0), C.WoodDark, M.Smooth, { Name = "RopeCore" })
end

-- Lantern. lightRange = nil -> unlit decorative lantern.
function Props.lantern(parent, cf, scale, lightRange, brightness)
	local s = scale or 1
	Kit.cylY(parent, 0.25 * s, 0.9 * s, at(cf, 0, 0.12 * s, 0), C.Iron, M.Metal, { Name = "LanternBase" })
	local core = Kit.part(parent, V(0.55 * s, 0.9 * s, 0.55 * s), at(cf, 0, 0.7 * s, 0), lightRange and C.BulbWarm or C.BulbOff, lightRange and M.Neon or M.Glass, { Name = "LanternGlass", CastShadow = false })
	Kit.part(parent, V(0.1 * s, 1.0 * s, 0.75 * s), at(cf, 0, 0.7 * s, 0), C.Iron, M.Metal, { Name = "LanternCage" })
	Kit.part(parent, V(0.75 * s, 1.0 * s, 0.1 * s), at(cf, 0, 0.7 * s, 0), C.Iron, M.Metal, { Name = "LanternCage" })
	Kit.cylY(parent, 0.3 * s, 0.8 * s, at(cf, 0, 1.3 * s, 0), C.Iron, M.Metal, { Name = "LanternCap" })
	if lightRange then
		Kit.pointLight(core, lightRange, brightness or 0.8)
	end
	return core
end

-- Cast-iron station bench. Sitters face cf.LookVector.
function Props.bench(parent, cf, length, woodColor, useSeat)
	woodColor = woodColor or C.Wood
	local seat
	if useSeat ~= false then
		seat = Instance.new("Seat")
		seat.Size = V(length, 0.35, 1.8)
		seat.CFrame = at(cf, 0, 1.6, 0)
		seat.Anchored = true
		seat.TopSurface = Enum.SurfaceType.Smooth
		seat.BottomSurface = Enum.SurfaceType.Smooth
		seat.Color = woodColor
		seat.Material = M.Planks
		seat.Name = "BenchSeat"
		seat.Parent = parent
	else
		seat = Kit.part(parent, V(length, 0.35, 1.8), at(cf, 0, 1.6, 0), woodColor, M.Planks, { Name = "BenchSeat" })
	end
	Kit.part(parent, V(length, 1.7, 0.25), at(cf, 0, 2.75, 0.85) * CFrame.Angles(rad(12), 0, 0), woodColor, M.Planks, { Name = "BenchBack" })
	for _, sx in ipairs({ -1, 1 }) do
		local x = sx * (length / 2 - 0.25)
		Kit.part(parent, V(0.3, 1.45, 1.6), at(cf, x, 0.72, 0.05), C.Iron, M.Metal, { Name = "BenchEnd" })
		Kit.part(parent, V(0.34, 0.22, 1.5), at(cf, x, 2.35, 0), C.Iron, M.Metal, { Name = "BenchArm" })
		Kit.part(parent, V(0.3, 2.3, 0.3), at(cf, x, 2.3, 0.85), C.Iron, M.Metal, { Name = "BenchPost" })
	end
	return seat
end

function Props.armchair(parent, cf, color)
	color = color or C.FabricRed
	local seat = Instance.new("Seat")
	seat.Size = V(2.6, 0.7, 2.4)
	seat.CFrame = at(cf, 0, 1.25, 0)
	seat.Anchored = true
	seat.TopSurface = Enum.SurfaceType.Smooth
	seat.BottomSurface = Enum.SurfaceType.Smooth
	seat.Color = color
	seat.Material = M.Fabric
	seat.Name = "ArmchairSeat"
	seat.Parent = parent
	Kit.part(parent, V(2.6, 0.9, 2.4), at(cf, 0, 0.45, 0), C.WoodDark, M.Wood, { Name = "ArmchairBase" })
	Kit.part(parent, V(2.6, 2.4, 0.5), at(cf, 0, 2.1, 1.0), color, M.Fabric, { Name = "ArmchairBack" })
	Kit.part(parent, V(0.45, 1.0, 2.4), at(cf, -1.3, 1.8, 0), color, M.Fabric, { Name = "ArmchairArm" })
	Kit.part(parent, V(0.45, 1.0, 2.4), at(cf, 1.3, 1.8, 0), color, M.Fabric, { Name = "ArmchairArm" })
	return seat
end

function Props.sofa(parent, cf, length, color)
	color = color or C.FabricRed
	local seat = Instance.new("Seat")
	seat.Size = V(length - 0.8, 0.6, 2.4)
	seat.CFrame = at(cf, 0, 1.3, -0.1)
	seat.Anchored = true
	seat.TopSurface = Enum.SurfaceType.Smooth
	seat.BottomSurface = Enum.SurfaceType.Smooth
	seat.Color = color
	seat.Material = M.Fabric
	seat.Name = "SofaSeat"
	seat.Parent = parent
	Kit.part(parent, V(length, 1.0, 2.6), at(cf, 0, 0.5, 0), C.WoodDark, M.Wood, { Name = "SofaBase" })
	Kit.part(parent, V(length, 2.4, 0.6), at(cf, 0, 2.2, 1.1), color, M.Fabric, { Name = "SofaBack" })
	Kit.part(parent, V(0.5, 1.2, 2.6), at(cf, -length / 2 + 0.25, 1.6, 0), color, M.Fabric, { Name = "SofaArm" })
	Kit.part(parent, V(0.5, 1.2, 2.6), at(cf, length / 2 - 0.25, 1.6, 0), color, M.Fabric, { Name = "SofaArm" })
	return seat
end

function Props.table(parent, cf, w, d, h, color, material)
	color = color or C.Wood
	local top = Kit.part(parent, V(w, 0.3, d), at(cf, 0, h - 0.15, 0), color, material or M.Wood, { Name = "TableTop" })
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			Kit.part(parent, V(0.3, h - 0.3, 0.3), at(cf, sx * (w / 2 - 0.35), (h - 0.3) / 2, sz * (d / 2 - 0.35)), C.WoodDark, M.Wood, { Name = "TableLeg" })
		end
	end
	return top
end

-- Open shelf unit against a wall (back at +Z).
function Props.shelf(parent, cf, w, h, d, levels, color)
	color = color or C.WoodDark
	Kit.part(parent, V(0.25, h, d), at(cf, -w / 2 + 0.125, h / 2, 0), color, M.Wood, { Name = "ShelfSide" })
	Kit.part(parent, V(0.25, h, d), at(cf, w / 2 - 0.125, h / 2, 0), color, M.Wood, { Name = "ShelfSide" })
	Kit.part(parent, V(w, h, 0.15), at(cf, 0, h / 2, d / 2 - 0.075), color, M.Wood, { Name = "ShelfBack" })
	local ys = {}
	for i = 0, levels do
		local y = 0.2 + (h - 0.4) * i / levels
		Kit.part(parent, V(w - 0.3, 0.2, d - 0.1), at(cf, 0, y, -0.05), color, M.Wood, { Name = "ShelfBoard" })
		ys[#ys + 1] = y + 0.1
	end
	return ys
end

-- A run of books standing on a shelf board, starting at the shelf's left.
function Props.books(parent, cf, width, rng, colors)
	colors = colors or { C.Burgundy, C.FabricGreen, C.Leather, C.BlueSteel, C.Canvas, C.WoodLight }
	local x = -width / 2
	while x < width / 2 - 0.6 do
		local run = math.min(width / 2 - x, rng(0.9, 2.2))
		local h = rng(1.1, 1.6)
		local col = colors[math.floor(rng(1, #colors + 0.99))]
		Kit.part(parent, V(run - 0.06, h, 0.95), at(cf, x + run / 2, h / 2, 0), col, M.Fabric, { Name = "Books" })
		x = x + run + rng(0.0, 0.5)
	end
end

function Props.lampPost(parent, cf, height, lightRange, brightness, color)
	Kit.cylY(parent, 0.8, 1.8, at(cf, 0, 0.4, 0), C.Iron, M.Metal, { Name = "PostBase" })
	Kit.cylY(parent, height, 0.45, at(cf, 0, height / 2, 0), C.Iron, M.Metal, { Name = "Post" })
	Kit.cylY(parent, 0.3, 0.9, at(cf, 0, height - 0.6, 0), C.BrassDark, M.Metal, { Name = "PostCollar" })
	Kit.part(parent, V(1.5, 0.25, 1.5), at(cf, 0, height + 0.1, 0), C.Iron, M.Metal, { Name = "LampFloor" })
	local core = Kit.part(parent, V(0.85, 1.25, 0.85), at(cf, 0, height + 0.85, 0), C.BulbWarm, M.Neon, { Name = "LampCore", CastShadow = false })
	Kit.part(parent, V(1.7, 0.3, 1.7), at(cf, 0, height + 1.6, 0), C.Iron, M.Metal, { Name = "LampRoof" })
	Kit.ball(parent, 0.5, at(cf, 0, height + 1.9, 0), C.BrassDark, M.Metal, { Name = "Finial" })
	if lightRange then
		Kit.pointLight(core, lightRange, brightness or 1, color)
	end
	return core
end

-- Hanging lamp. cf = the ceiling attach point.
function Props.pendant(parent, cf, drop, shadeDiameter, lightRange, brightness, color)
	Kit.cylY(parent, drop, 0.18, at(cf, 0, -drop / 2, 0), C.Iron, M.Metal, { Name = "PendantRod" })
	Kit.cylY(parent, 0.7, shadeDiameter, at(cf, 0, -drop - 0.2, 0), C.BrassDark, M.Metal, { Name = "PendantShade" })
	local bulb = Kit.bulb(parent, shadeDiameter * 0.35, at(cf, 0, -drop - 0.65, 0), C.BulbWarm)
	if lightRange then
		Kit.pointLight(bulb, lightRange, brightness or 1, color)
	end
	return bulb
end

-- Wall lamp. cf sits on the wall surface, LookVector pointing into the room.
function Props.sconce(parent, cf, lightRange, brightness)
	Kit.part(parent, V(0.5, 1.2, 0.2), at(cf, 0, 0, 0.1), C.BrassDark, M.Metal, { Name = "SconcePlate" })
	Kit.part(parent, V(0.18, 0.18, 1.0), at(cf, 0, 0, -0.5), C.Iron, M.Metal, { Name = "SconceArm" })
	local core = Kit.part(parent, V(0.6, 0.8, 0.6), at(cf, 0, 0.2, -1.1), C.BulbWarm, M.Neon, { Name = "SconceGlass", CastShadow = false })
	Kit.part(parent, V(0.85, 0.2, 0.85), at(cf, 0, 0.7, -1.1), C.Iron, M.Metal, { Name = "SconceCap" })
	if lightRange then
		Kit.pointLight(core, lightRange, brightness or 0.8)
	end
	return core
end

function Props.cart(parent, cf, w, d)
	Kit.part(parent, V(w, 0.35, d), at(cf, 0, 1.35, 0), C.WoodWorn, M.Planks, { Name = "CartBed" })
	Kit.part(parent, V(w - 0.4, 0.4, 0.3), at(cf, 0, 1.0, 0), C.Iron, M.Metal, { Name = "CartAxle" })
	for _, sx in ipairs({ -1, 1 }) do
		for _, sz in ipairs({ -1, 1 }) do
			Kit.cylX(parent, 0.3, 1.2, at(cf, sx * (w / 2 - 0.2), 0.6, sz * (d / 2 - 0.6)), C.Iron, M.Metal, { Name = "CartWheel" })
		end
	end
	Kit.part(parent, V(0.2, 2.6, 0.2), at(cf, -w / 2 + 0.2, 2.6, d / 2 - 0.1), C.Iron, M.Metal, { Name = "CartUpright" })
	Kit.part(parent, V(0.2, 2.6, 0.2), at(cf, w / 2 - 0.2, 2.6, d / 2 - 0.1), C.Iron, M.Metal, { Name = "CartUpright" })
	Kit.part(parent, V(w, 0.22, 0.22), at(cf, 0, 3.9, d / 2 - 0.1), C.BrassDark, M.Metal, { Name = "CartHandle" })
	return 1.52 -- deck height
end

function Props.locker(parent, cf, w, h, d, number, color)
	local body = Kit.part(parent, V(w, h, d), at(cf, 0, h / 2, 0), color or C.BlueSteel, M.Metal, { Name = "Locker" })
	local g = Kit.surface(body, Enum.NormalId.Front, 40)
	Kit.frame(g, { Size = UDim2.new(1, -6, 1, -6), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5), BackgroundTransparency = 1 })
	Kit.stroke(Kit.frame(g, { Size = UDim2.new(0.88, 0, 0.94, 0), Position = UDim2.new(0.5, 0, 0.5, 0), AnchorPoint = Vector2.new(0.5, 0.5) }), C.Charcoal, 3, 0.2)
	for i = 0, 4 do
		Kit.frame(g, { Size = UDim2.new(0.5, 0, 0.012, 0), Position = UDim2.new(0.25, 0, 0.1 + i * 0.03, 0), BackgroundTransparency = 0.2, BackgroundColor3 = C.Charcoal })
	end
	Kit.frame(g, { Size = UDim2.new(0.06, 0, 0.12, 0), Position = UDim2.new(0.78, 0, 0.5, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
	local plate = Kit.frame(g, { Size = UDim2.new(0.34, 0, 0.07, 0), Position = UDim2.new(0.33, 0, 0.3, 0), BackgroundTransparency = 0, BackgroundColor3 = C.Brass })
	Kit.label(plate, number or "", { TextColor3 = C.Ink, Font = Enum.Font.Oswald })
	return body
end

function Props.displayCase(parent, cf, w, h, d)
	Kit.part(parent, V(w, h * 0.62, d), at(cf, 0, h * 0.31, 0), C.WoodDark, M.Wood, { Name = "CaseBase" })
	Kit.part(parent, V(w + 0.12, 0.15, d + 0.12), at(cf, 0, h * 0.62, 0), C.BrassDark, M.Metal, { Name = "CaseTrim" })
	local glass = Kit.part(parent, V(w - 0.1, h * 0.38, d - 0.1), at(cf, 0, h * 0.62 + h * 0.19, 0), C.Glass, M.Glass, { Name = "CaseGlass", Transparency = 0.7, CastShadow = false })
	Kit.part(parent, V(w + 0.05, 0.12, d + 0.05), at(cf, 0, h + 0.03, 0), C.BrassDark, M.Metal, { Name = "CaseTop" })
	return glass
end

function Props.pedestal(parent, cf, h, topSize)
	topSize = topSize or 1.8
	Kit.part(parent, V(topSize + 0.6, 0.4, topSize + 0.6), at(cf, 0, 0.2, 0), C.StoneDark, M.Marble, { Name = "PedestalBase" })
	Kit.part(parent, V(topSize - 0.4, h - 0.8, topSize - 0.4), at(cf, 0, h / 2, 0), C.Stone, M.Marble, { Name = "PedestalColumn" })
	local top = Kit.part(parent, V(topSize, 0.4, topSize), at(cf, 0, h - 0.2, 0), C.StoneDark, M.Marble, { Name = "PedestalTop" })
	return top
end

-- Framed panel with a SurfaceGui on its front. Returns the SurfaceGui.
-- cf = centre of the panel, LookVector = facing direction.
function Props.panel(parent, cf, w, h, frameColor, faceColor, ppS)
	Kit.part(parent, V(w + 0.4, h + 0.4, 0.2), cf * CFrame.new(0, 0, 0.12), frameColor or C.WoodDark, M.Wood, { Name = "PanelFrame" })
	local face = Kit.part(parent, V(w, h, 0.1), cf, faceColor or C.Parchment, M.Smooth, { Name = "PanelFace" })
	return Kit.surface(face, Enum.NormalId.Front, ppS or 40)
end

return Props
