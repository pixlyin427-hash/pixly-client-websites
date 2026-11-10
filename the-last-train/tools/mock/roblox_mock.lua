--[[
	Minimal offline stand-in for the Roblox engine API (Lua 5.1, run via lupa).

	Purpose:
	  1. Execute the real world builders outside Studio, so typos in property
	     names, bad enums or nil errors are caught before you open the place.
	  2. Export the built geometry for the browser preview (preview/world.json).
	  3. Drive the real server services in multiplayer simulations (tests).

	Property names are checked against a whitelist per class: assigning an
	unknown property raises an error, exactly like Roblox would.
]]

local M = {}

---------------------------------------------------------------------------
-- Vector3
---------------------------------------------------------------------------
local Vector3 = {}
local V3 = {}

local function v3(x, y, z)
	return setmetatable({ _x = x or 0, _y = y or 0, _z = z or 0, __type = "Vector3" }, V3)
end

V3.__index = function(v, k)
	if k == "X" then return v._x end
	if k == "Y" then return v._y end
	if k == "Z" then return v._z end
	if k == "Magnitude" then return math.sqrt(v._x * v._x + v._y * v._y + v._z * v._z) end
	if k == "Unit" then
		local m = math.sqrt(v._x * v._x + v._y * v._y + v._z * v._z)
		if m == 0 then return v3(0, 0, 0) end
		return v3(v._x / m, v._y / m, v._z / m)
	end
	if k == "Dot" then return function(a, b) return a._x * b._x + a._y * b._y + a._z * b._z end end
	if k == "Cross" then
		return function(a, b)
			return v3(a._y * b._z - a._z * b._y, a._z * b._x - a._x * b._z, a._x * b._y - a._y * b._x)
		end
	end
	if k == "Lerp" then
		return function(a, b, t)
			return v3(a._x + (b._x - a._x) * t, a._y + (b._y - a._y) * t, a._z + (b._z - a._z) * t)
		end
	end
	error("Vector3 has no member " .. tostring(k), 2)
end
V3.__add = function(a, b) return v3(a._x + b._x, a._y + b._y, a._z + b._z) end
V3.__sub = function(a, b) return v3(a._x - b._x, a._y - b._y, a._z - b._z) end
V3.__mul = function(a, b)
	if type(a) == "number" then return v3(b._x * a, b._y * a, b._z * a) end
	if type(b) == "number" then return v3(a._x * b, a._y * b, a._z * b) end
	return v3(a._x * b._x, a._y * b._y, a._z * b._z)
end
V3.__div = function(a, b)
	if type(b) == "number" then return v3(a._x / b, a._y / b, a._z / b) end
	return v3(a._x / b._x, a._y / b._y, a._z / b._z)
end
V3.__unm = function(a) return v3(-a._x, -a._y, -a._z) end
V3.__eq = function(a, b) return a._x == b._x and a._y == b._y and a._z == b._z end
V3.__tostring = function(a) return string.format("%g, %g, %g", a._x, a._y, a._z) end

Vector3.new = function(x, y, z) return v3(x, y, z) end
Vector3.zero = v3(0, 0, 0)
Vector3.one = v3(1, 1, 1)
Vector3.xAxis = v3(1, 0, 0)
Vector3.yAxis = v3(0, 1, 0)
Vector3.zAxis = v3(0, 0, 1)

---------------------------------------------------------------------------
-- CFrame (rows r00..r22 + position)
---------------------------------------------------------------------------
local CFrame = {}
local CF = {}

local function cf(x, y, z, r00, r01, r02, r10, r11, r12, r20, r21, r22)
	return setmetatable({
		x = x, y = y, z = z,
		r00 = r00, r01 = r01, r02 = r02,
		r10 = r10, r11 = r11, r12 = r12,
		r20 = r20, r21 = r21, r22 = r22,
		__type = "CFrame",
	}, CF)
end

local function mulRot(a, b)
	return
		a.r00 * b.r00 + a.r01 * b.r10 + a.r02 * b.r20,
		a.r00 * b.r01 + a.r01 * b.r11 + a.r02 * b.r21,
		a.r00 * b.r02 + a.r01 * b.r12 + a.r02 * b.r22,
		a.r10 * b.r00 + a.r11 * b.r10 + a.r12 * b.r20,
		a.r10 * b.r01 + a.r11 * b.r11 + a.r12 * b.r21,
		a.r10 * b.r02 + a.r11 * b.r12 + a.r12 * b.r22,
		a.r20 * b.r00 + a.r21 * b.r10 + a.r22 * b.r20,
		a.r20 * b.r01 + a.r21 * b.r11 + a.r22 * b.r21,
		a.r20 * b.r02 + a.r21 * b.r12 + a.r22 * b.r22
end

local function applyRot(a, vx, vy, vz)
	return a.r00 * vx + a.r01 * vy + a.r02 * vz, a.r10 * vx + a.r11 * vy + a.r12 * vz, a.r20 * vx + a.r21 * vy + a.r22 * vz
end

local function inverse(a)
	-- rotation is orthonormal: inverse = transpose
	local ix = -(a.r00 * a.x + a.r10 * a.y + a.r20 * a.z)
	local iy = -(a.r01 * a.x + a.r11 * a.y + a.r21 * a.z)
	local iz = -(a.r02 * a.x + a.r12 * a.y + a.r22 * a.z)
	return cf(ix, iy, iz, a.r00, a.r10, a.r20, a.r01, a.r11, a.r21, a.r02, a.r12, a.r22)
end

CF.__index = function(c, k)
	if k == "Position" or k == "p" then return v3(c.x, c.y, c.z) end
	if k == "X" then return c.x end
	if k == "Y" then return c.y end
	if k == "Z" then return c.z end
	if k == "LookVector" then return v3(-c.r02, -c.r12, -c.r22) end
	if k == "RightVector" then return v3(c.r00, c.r10, c.r20) end
	if k == "UpVector" then return v3(c.r01, c.r11, c.r21) end
	if k == "Rotation" then return cf(0, 0, 0, c.r00, c.r01, c.r02, c.r10, c.r11, c.r12, c.r20, c.r21, c.r22) end
	if k == "Inverse" then return inverse end
	if k == "ToWorldSpace" then return function(a, b) return a * b end end
	if k == "ToObjectSpace" then return function(a, b) return inverse(a) * b end end
	if k == "PointToWorldSpace" then return function(a, v) return a * v end end
	if k == "PointToObjectSpace" then return function(a, v) return inverse(a) * v end end
	if k == "VectorToWorldSpace" then return function(a, v) local x, y, z = applyRot(a, v._x, v._y, v._z) return v3(x, y, z) end end
	if k == "Lerp" then
		return function(a, b, t)
			-- position lerp, rotation snaps (good enough for the mock)
			local r = t < 0.5 and a or b
			return cf(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t, r.r00, r.r01, r.r02, r.r10, r.r11, r.r12, r.r20, r.r21, r.r22)
		end
	end
	if k == "GetComponents" then
		return function(a) return a.x, a.y, a.z, a.r00, a.r01, a.r02, a.r10, a.r11, a.r12, a.r20, a.r21, a.r22 end
	end
	error("CFrame has no member " .. tostring(k), 2)
end

CF.__mul = function(a, b)
	if getmetatable(b) == V3 then
		local x, y, z = applyRot(a, b._x, b._y, b._z)
		return v3(x + a.x, y + a.y, z + a.z)
	end
	local r00, r01, r02, r10, r11, r12, r20, r21, r22 = mulRot(a, b)
	local x, y, z = applyRot(a, b.x, b.y, b.z)
	return cf(x + a.x, y + a.y, z + a.z, r00, r01, r02, r10, r11, r12, r20, r21, r22)
end
CF.__add = function(a, v) return cf(a.x + v._x, a.y + v._y, a.z + v._z, a.r00, a.r01, a.r02, a.r10, a.r11, a.r12, a.r20, a.r21, a.r22) end
CF.__sub = function(a, v) return cf(a.x - v._x, a.y - v._y, a.z - v._z, a.r00, a.r01, a.r02, a.r10, a.r11, a.r12, a.r20, a.r21, a.r22) end

local function lookAt(at, target, up)
	up = up or v3(0, 1, 0)
	local f = (target - at).Unit
	local r = f:Cross(up).Unit
	local u = r:Cross(f)
	-- columns: right, up, back(-f)
	return cf(at._x, at._y, at._z, r._x, u._x, -f._x, r._y, u._y, -f._y, r._z, u._z, -f._z)
end

CFrame.new = function(a, b, c, ...)
	if a == nil then return cf(0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1) end
	if type(a) == "table" then
		if b ~= nil then return lookAt(a, b) end
		return cf(a._x, a._y, a._z, 1, 0, 0, 0, 1, 0, 0, 0, 1)
	end
	local rest = { ... }
	if #rest == 9 then
		return cf(a, b, c, rest[1], rest[2], rest[3], rest[4], rest[5], rest[6], rest[7], rest[8], rest[9])
	end
	return cf(a, b or 0, c or 0, 1, 0, 0, 0, 1, 0, 0, 0, 1)
end
CFrame.lookAt = lookAt

local function rx(t) local c, s = math.cos(t), math.sin(t) return cf(0, 0, 0, 1, 0, 0, 0, c, -s, 0, s, c) end
local function ry(t) local c, s = math.cos(t), math.sin(t) return cf(0, 0, 0, c, 0, s, 0, 1, 0, -s, 0, c) end
local function rz(t) local c, s = math.cos(t), math.sin(t) return cf(0, 0, 0, c, -s, 0, s, c, 0, 0, 0, 1) end

CFrame.Angles = function(x, y, z) return rx(x or 0) * ry(y or 0) * rz(z or 0) end
CFrame.fromEulerAnglesXYZ = CFrame.Angles
CFrame.fromEulerAnglesYXZ = function(x, y, z) return ry(y or 0) * rx(x or 0) * rz(z or 0) end
CFrame.identity = CFrame.new()

---------------------------------------------------------------------------
-- Small value types
---------------------------------------------------------------------------
local Color3 = {}
local C3 = { __index = function(c, k)
	if k == "R" then return c._r end
	if k == "G" then return c._g end
	if k == "B" then return c._b end
	if k == "Lerp" then return function(a, b, t) return Color3.new(a._r + (b._r - a._r) * t, a._g + (b._g - a._g) * t, a._b + (b._b - a._b) * t) end end
	error("Color3 has no member " .. tostring(k), 2)
end }
Color3.new = function(r, g, b) return setmetatable({ _r = r or 0, _g = g or 0, _b = b or 0, __type = "Color3" }, C3) end
Color3.fromRGB = function(r, g, b) return Color3.new((r or 0) / 255, (g or 0) / 255, (b or 0) / 255) end

local UDim = { new = function(s, o) return { Scale = s or 0, Offset = o or 0, __type = "UDim" } end }
local UDim2 = {}
UDim2.new = function(xs, xo, ys, yo) return { X = UDim.new(xs, xo), Y = UDim.new(ys, yo), __type = "UDim2" } end
UDim2.fromScale = function(x, y) return UDim2.new(x, 0, y, 0) end
UDim2.fromOffset = function(x, y) return UDim2.new(0, x, 0, y) end
local Vector2 = { new = function(x, y) return { X = x or 0, Y = y or 0, __type = "Vector2" } end }
Vector2.zero = Vector2.new(0, 0)
local NumberRange = { new = function(a, b) return { Min = a, Max = b or a, __type = "NumberRange" } end }
local NumberSequence = { new = function(a) return { v = a, __type = "NumberSequence" } end }
local NumberSequenceKeypoint = { new = function(t, v) return { Time = t, Value = v } end }
local ColorSequence = { new = function(a) return { v = a, __type = "ColorSequence" } end }
local ColorSequenceKeypoint = { new = function(t, v) return { Time = t, Value = v } end }
local TweenInfo = { new = function(...) return { args = { ... }, __type = "TweenInfo" } end }

---------------------------------------------------------------------------
-- Enum (strict for the enums whose typos would break the build)
---------------------------------------------------------------------------
local STRICT_ENUMS = {
	Material = { "Plastic", "SmoothPlastic", "Neon", "Wood", "WoodPlanks", "Marble", "Slate", "Concrete", "Granite", "Brick", "Pebble", "Cobblestone", "CorrodedMetal", "DiamondPlate", "Foil", "Metal", "Grass", "Sand", "Fabric", "Ice", "Glass", "Rock", "Basalt", "Ground", "Asphalt", "Pavement", "Limestone", "Sandstone", "Mud", "Snow", "Salt", "LeafyGrass", "Glacier", "CrackedLava", "ForceField" },
	Font = { "Legacy", "Arial", "ArialBold", "SourceSans", "SourceSansBold", "SourceSansSemibold", "SourceSansLight", "SourceSansItalic", "Bodoni", "Garamond", "Cartoon", "Code", "Highway", "SciFi", "Arcade", "Fantasy", "Antique", "Gotham", "GothamMedium", "GothamBold", "GothamBlack", "Merriweather", "Michroma", "Nunito", "Oswald", "Roboto", "RobotoCondensed", "RobotoMono", "SpecialElite", "TitilliumWeb", "Ubuntu", "Arimo", "ArimoBold" },
	PartType = { "Ball", "Block", "Cylinder", "Wedge", "CornerWedge" },
	NormalId = { "Top", "Bottom", "Front", "Back", "Left", "Right" },
	SurfaceType = { "Smooth", "Glue", "Weld", "Studs", "Inlet", "Universal", "Hinge", "Motor", "SteppingMotor", "SmoothNoOutlines" },
	ReverbType = { "NoReverb", "GenericReverb", "PaddedCell", "Room", "Bathroom", "LivingRoom", "StoneRoom", "Auditorium", "ConcertHall", "Cave", "Arena", "Hangar", "CarpettedHallway", "Hallway", "StoneCorridor", "Alley", "Forest", "City", "Mountains", "Quarry", "Plain", "ParkingLot", "SewerPipe", "UnderWater" },
}

local enumItems = {}
local Enum = setmetatable({}, { __index = function(enumRoot, enumName)
	local strict = STRICT_ENUMS[enumName]
	local set = nil
	if strict then
		set = {}
		for i, n in ipairs(strict) do set[n] = i end
	end
	local e = setmetatable({}, { __index = function(_, itemName)
		if set and not set[itemName] then
			error("Enum." .. enumName .. "." .. tostring(itemName) .. " is not a valid EnumItem", 2)
		end
		local key = enumName .. "." .. itemName
		if not enumItems[key] then
			enumItems[key] = { Name = itemName, EnumType = enumName, Value = set and set[itemName] or 0, __type = "EnumItem" }
		end
		return enumItems[key]
	end })
	rawset(enumRoot, enumName, e)
	return e
end })

---------------------------------------------------------------------------
-- Signals
---------------------------------------------------------------------------
local function newSignal()
	local s = { _handlers = {} }
	function s:Connect(fn)
		local entry = { fn = fn, connected = true }
		table.insert(self._handlers, entry)
		return { Connected = true, Disconnect = function(c) entry.connected = false c.Connected = false end }
	end
	function s:Once(fn)
		local conn
		conn = self:Connect(function(...) conn:Disconnect() fn(...) end)
		return conn
	end
	function s:Fire(...)
		local list = {}
		for _, e in ipairs(self._handlers) do list[#list + 1] = e end
		for _, e in ipairs(list) do
			if e.connected then e.fn(...) end
		end
	end
	function s:Wait() error("Signal:Wait is not supported in the mock", 2) end
	return s
end
M.newSignal = newSignal

---------------------------------------------------------------------------
-- Instances
---------------------------------------------------------------------------
local BASE = { "Name", "Parent", "Archivable" }
local BASEPART = { "Size", "CFrame", "Position", "Orientation", "Color", "BrickColor", "Material", "Transparency", "Reflectance", "Anchored", "CanCollide", "CanTouch", "CanQuery", "CastShadow", "Massless", "Locked", "TopSurface", "BottomSurface", "LeftSurface", "RightSurface", "FrontSurface", "BackSurface", "AssemblyLinearVelocity", "AssemblyAngularVelocity", "CollisionGroup" }
local GUIOBJECT = { "Size", "Position", "AnchorPoint", "BackgroundColor3", "BackgroundTransparency", "BorderSizePixel", "BorderColor3", "Rotation", "ZIndex", "Visible", "ClipsDescendants", "LayoutOrder", "AutomaticSize", "Active", "Selectable", "SizeConstraint" }
local TEXT = { "Text", "TextColor3", "TextTransparency", "TextScaled", "TextSize", "Font", "TextXAlignment", "TextYAlignment", "TextWrapped", "RichText", "LineHeight", "TextStrokeTransparency", "TextStrokeColor3", "MaxVisibleGraphemes", "TextTruncate" }
local LIGHT = { "Brightness", "Range", "Color", "Shadows", "Enabled" }

local CLASS = {
	Folder = { base = "Instance", props = {} },
	Model = { base = "PVInstance", props = { "PrimaryPart", "WorldPivot" } },
	Part = { base = "BasePart", props = { "Shape" } },
	WedgePart = { base = "BasePart", props = {} },
	SpawnLocation = { base = "BasePart", props = { "Shape", "Duration", "Neutral", "AllowTeamChangeOnTouch", "Enabled" } },
	Seat = { base = "BasePart", props = { "Shape", "Disabled" } },
	PointLight = { base = "Light", props = {} },
	SpotLight = { base = "Light", props = { "Face", "Angle" } },
	SurfaceLight = { base = "Light", props = { "Face", "Angle" } },
	SurfaceGui = { base = "LayerCollector", props = { "Face", "SizingMode", "PixelsPerStud", "LightInfluence", "Brightness", "AlwaysOnTop", "ZIndexBehavior", "CanvasSize", "MaxDistance", "Adornee", "ResetOnSpawn", "ClipsDescendants", "Enabled" } },
	BillboardGui = { base = "LayerCollector", props = { "Size", "StudsOffset", "StudsOffsetWorldSpace", "AlwaysOnTop", "MaxDistance", "LightInfluence", "Adornee", "ResetOnSpawn", "ZIndexBehavior", "Enabled", "ClipsDescendants" } },
	Frame = { base = "GuiObject", props = {} },
	TextLabel = { base = "GuiObject", props = TEXT },
	UICorner = { base = "Instance", props = { "CornerRadius" } },
	UIStroke = { base = "Instance", props = { "Color", "Thickness", "Transparency", "ApplyStrokeMode", "LineJoinMode", "Enabled" } },
	UIGradient = { base = "Instance", props = { "Color", "Transparency", "Rotation", "Offset", "Enabled" } },
	Attachment = { base = "Instance", props = { "CFrame", "Position", "Orientation", "WorldPosition", "WorldCFrame", "Visible" } },
	ProximityPrompt = { base = "Instance", props = { "ActionText", "ObjectText", "HoldDuration", "MaxActivationDistance", "RequiresLineOfSight", "KeyboardKeyCode", "GamepadKeyCode", "Style", "UIOffset", "Exclusivity", "Enabled", "ClickablePrompt" } },
	Smoke = { base = "Instance", props = { "Color", "Opacity", "RiseVelocity", "Size", "TimeScale", "Enabled" } },
	Atmosphere = { base = "Instance", props = { "Density", "Offset", "Color", "Decay", "Glare", "Haze" } },
	BloomEffect = { base = "Instance", props = { "Intensity", "Size", "Threshold", "Enabled" } },
	ColorCorrectionEffect = { base = "Instance", props = { "Brightness", "Contrast", "Saturation", "TintColor", "Enabled" } },
	SunRaysEffect = { base = "Instance", props = { "Intensity", "Spread", "Enabled" } },
	Humanoid = { base = "Instance", props = { "DisplayDistanceType", "HealthDisplayType", "WalkSpeed", "Health", "MaxHealth", "DisplayName", "NameDisplayDistance" } },
	ModuleScript = { base = "Instance", props = {} },
	Script = { base = "Instance", props = { "Disabled", "Enabled" } },
	RemoteEvent = { base = "Instance", props = {} },
	Player = { base = "Instance", props = { "DisplayName", "UserId", "Character", "CameraMaxZoomDistance", "RespawnLocation" } },
	StringValue = { base = "Instance", props = { "Value" } },
}
local BASES = {
	Instance = {},
	PVInstance = {},
	BasePart = BASEPART,
	Light = LIGHT,
	GuiObject = GUIOBJECT,
	LayerCollector = {},
}
local PARENT_OF = { PVInstance = "Instance", BasePart = "PVInstance", Light = "Instance", GuiObject = "Instance", LayerCollector = "Instance", Instance = nil }

local allowed = {}
for className, def in pairs(CLASS) do
	local set = {}
	for _, p in ipairs(BASE) do set[p] = true end
	for _, p in ipairs(def.props) do set[p] = true end
	local b = def.base
	while b do
		for _, p in ipairs(BASES[b] or {}) do set[p] = true end
		b = PARENT_OF[b]
	end
	allowed[className] = set
end

local function isA(className, query)
	if className == query then return true end
	local def = CLASS[className]
	local b = def and def.base
	while b do
		if b == query then return true end
		b = PARENT_OF[b]
	end
	return query == "Instance"
end

local DEFAULTS = {
	Size = function() return v3(4, 1, 2) end,
	CFrame = function() return CFrame.new() end,
	Transparency = function() return 0 end,
	Anchored = function() return false end,
	CanCollide = function() return true end,
	Color = function() return Color3.fromRGB(163, 162, 165) end,
}

local Inst = {}
local instanceCount = 0
M.counts = {}

local methods = {}

local function newInstance(className)
	if not CLASS[className] then error("Instance.new: unknown or unsupported class '" .. tostring(className) .. "'", 3) end
	instanceCount = instanceCount + 1
	M.counts[className] = (M.counts[className] or 0) + 1
	local self = setmetatable({ __class = className, __props = { Name = className }, __children = {}, __attrs = {}, __tags = {}, __signals = {} }, Inst)
	return self
end

Inst.__index = function(self, k)
	local m = methods[k]
	if m then return m end
	local props = rawget(self, "__props")
	local className = rawget(self, "__class")
	if k == "ClassName" then return className end
	if k == "Parent" then return props.Parent end
	if k == "Position" and isA(className, "BasePart") then
		local c = props.CFrame or CFrame.new()
		return c.Position
	end
	if props[k] ~= nil then return props[k] end
	if allowed[className] and allowed[className][k] then
		if DEFAULTS[k] then return DEFAULTS[k]() end
		return nil
	end
	-- events
	local signals = rawget(self, "__signals")
	if k == "Triggered" or k == "OnServerEvent" or k == "OnClientEvent" or k == "Changed" or k == "CharacterAdded" or k == "CharacterRemoving" or k == "Died" or k == "ChildAdded" then
		signals[k] = signals[k] or newSignal()
		return signals[k]
	end
	for _, child in ipairs(rawget(self, "__children")) do
		if child.__props.Name == k then return child end
	end
	error(tostring(k) .. " is not a valid member of " .. className .. " \"" .. tostring(props.Name) .. "\"", 2)
end

Inst.__newindex = function(self, k, v)
	local className = rawget(self, "__class")
	local props = rawget(self, "__props")
	if k == "Parent" then
		local old = props.Parent
		if old then
			local list = rawget(old, "__children")
			for i, c in ipairs(list) do
				if c == self then table.remove(list, i) break end
			end
		end
		props.Parent = v
		if v then table.insert(rawget(v, "__children"), self) end
		return
	end
	if not (allowed[className] and allowed[className][k]) then
		error("Unable to assign property " .. tostring(k) .. ". Property " .. tostring(k) .. " is not a valid member of " .. className, 2)
	end
	if k == "Position" and isA(className, "BasePart") then
		local c = props.CFrame or CFrame.new()
		props.CFrame = cf(v._x, v._y, v._z, c.r00, c.r01, c.r02, c.r10, c.r11, c.r12, c.r20, c.r21, c.r22)
		return
	end
	if k == "Position" and className == "Attachment" then
		local c = props.CFrame or CFrame.new()
		props.CFrame = cf(v._x, v._y, v._z, c.r00, c.r01, c.r02, c.r10, c.r11, c.r12, c.r20, c.r21, c.r22)
		return
	end
	props[k] = v
end
Inst.__tostring = function(self) return rawget(self, "__props").Name end

function methods.IsA(self, q) return isA(rawget(self, "__class"), q) end
function methods.GetChildren(self)
	local out = {}
	for i, c in ipairs(rawget(self, "__children")) do out[i] = c end
	return out
end
function methods.GetDescendants(self)
	local out = {}
	local function walk(n)
		for _, c in ipairs(rawget(n, "__children")) do
			out[#out + 1] = c
			walk(c)
		end
	end
	walk(self)
	return out
end
function methods.FindFirstChild(self, name, recursive)
	for _, c in ipairs(rawget(self, "__children")) do
		if c.__props.Name == name then return c end
	end
	if recursive then
		for _, c in ipairs(rawget(self, "__children")) do
			local f = methods.FindFirstChild(c, name, true)
			if f then return f end
		end
	end
	return nil
end
function methods.WaitForChild(self, name)
	local c = methods.FindFirstChild(self, name)
	if not c then error("WaitForChild would yield forever: " .. tostring(name) .. " in " .. tostring(self.__props.Name), 2) end
	return c
end
function methods.FindFirstChildOfClass(self, className)
	for _, c in ipairs(rawget(self, "__children")) do
		if c.__class == className then return c end
	end
	return nil
end
function methods.FindFirstChildWhichIsA(self, className)
	for _, c in ipairs(rawget(self, "__children")) do
		if isA(c.__class, className) then return c end
	end
	return nil
end
function methods.FindFirstAncestor(self, name)
	local p = self.__props.Parent
	while p do
		if p.__props.Name == name then return p end
		p = p.__props.Parent
	end
	return nil
end
function methods.IsDescendantOf(self, ancestor)
	local p = self.__props.Parent
	while p do
		if p == ancestor then return true end
		p = p.__props.Parent
	end
	return false
end
function methods.SetAttribute(self, k, v) rawget(self, "__attrs")[k] = v end
function methods.GetAttribute(self, k) return rawget(self, "__attrs")[k] end
function methods.GetAttributes(self) return rawget(self, "__attrs") end
function methods.GetAttributeChangedSignal(self, k)
	local signals = rawget(self, "__signals")
	signals["attr:" .. k] = signals["attr:" .. k] or newSignal()
	return signals["attr:" .. k]
end
function methods.Destroy(self) self.Parent = nil end
function methods.ClearAllChildren(self)
	for _, c in ipairs(methods.GetChildren(self)) do c.Parent = nil end
end
function methods.Clone(self)
	local copy = newInstance(self.__class)
	for k, v in pairs(self.__props) do
		if k ~= "Parent" then copy.__props[k] = v end
	end
	for k, v in pairs(self.__attrs) do copy.__attrs[k] = v end
	for k, v in pairs(self.__tags) do copy.__tags[k] = v end
	for _, c in ipairs(self.__children) do
		local cc = methods.Clone(c)
		cc.Parent = copy
	end
	return copy
end
function methods.GetFullName(self)
	local names = {}
	local n = self
	while n and n.__class ~= "DataModel" do
		table.insert(names, 1, n.__props.Name)
		n = n.__props.Parent
	end
	return table.concat(names, ".")
end
-- PVInstance
function methods.GetPivot(self)
	if isA(self.__class, "BasePart") then return self.__props.CFrame or CFrame.new() end
	local pp = self.__props.PrimaryPart
	if pp then return pp.__props.CFrame end
	return self.__props.WorldPivot or CFrame.new()
end
function methods.PivotTo(self, target)
	if isA(self.__class, "BasePart") then self.__props.CFrame = target return end
	local pivot = methods.GetPivot(self)
	local delta = target * pivot:Inverse()
	for _, d in ipairs(methods.GetDescendants(self)) do
		if isA(d.__class, "BasePart") then
			d.__props.CFrame = delta * (d.__props.CFrame or CFrame.new())
		end
	end
	if not self.__props.PrimaryPart then self.__props.WorldPivot = target end
end
-- RemoteEvent
function methods.FireClient(self, player, ...)
	M.remoteLog = M.remoteLog or {}
	table.insert(M.remoteLog, { remote = self.__props.Name, player = player, args = { ... } })
end
function methods.FireAllClients(self, ...)
	M.remoteLog = M.remoteLog or {}
	table.insert(M.remoteLog, { remote = self.__props.Name, player = "*", args = { ... } })
end
-- Player
function methods.LoadCharacter(self)
	if M.onLoadCharacter then M.onLoadCharacter(self) end
end
function methods.Kick(self) end

local Instance = { new = function(className, parent)
	local i = newInstance(className)
	if parent then i.Parent = parent end
	return i
end }

---------------------------------------------------------------------------
-- Services / DataModel
---------------------------------------------------------------------------
local function service(name, className)
	local s = setmetatable({ __class = className or name, __props = { Name = name }, __children = {}, __attrs = {}, __tags = {}, __signals = {} }, Inst)
	allowed[className or name] = allowed[className or name] or {}
	return s
end

local Lighting = service("Lighting")
for _, p in ipairs({ "Ambient", "OutdoorAmbient", "Brightness", "ClockTime", "GeographicLatitude", "ColorShift_Top", "ColorShift_Bottom", "EnvironmentDiffuseScale", "EnvironmentSpecularScale", "GlobalShadows", "ShadowSoftness", "ExposureCompensation", "FogEnd", "FogStart", "FogColor" }) do
	allowed.Lighting[p] = true
end

local game = service("Game", "DataModel")
local services = {
	Workspace = service("Workspace"),
	Lighting = Lighting,
	ReplicatedStorage = service("ReplicatedStorage"),
	ServerScriptService = service("ServerScriptService"),
	ServerStorage = service("ServerStorage"),
	StarterPlayer = service("StarterPlayer"),
	SoundService = service("SoundService"),
	Players = service("Players"),
}
for name, s in pairs(services) do s.Parent = game end
allowed.Players.CharacterAutoLoads = true
allowed.Players.RespawnTime = true
allowed.SoundService.AmbientReverb = true

local tagged = {}
local CollectionService = {
	AddTag = function(_, inst, tag)
		inst.__tags[tag] = true
		tagged[tag] = tagged[tag] or {}
		table.insert(tagged[tag], inst)
	end,
	HasTag = function(_, inst, tag) return inst.__tags[tag] == true end,
	GetTagged = function(_, tag)
		local out = {}
		for _, i in ipairs(tagged[tag] or {}) do
			if i.__tags[tag] then out[#out + 1] = i end
		end
		return out
	end,
	GetInstanceAddedSignal = function() return newSignal() end,
}

local RunService = {
	IsServer = function() return true end,
	IsClient = function() return false end,
	IsStudio = function() return true end,
	IsRunning = function() return M.running == true end,
	Heartbeat = newSignal(),
}

local Players = services.Players
Players.__signals.PlayerAdded = newSignal()
Players.__signals.PlayerRemoving = newSignal()
local playerList = {}
methods.GetPlayers = function(self)
	if self == Players then
		local out = {}
		for i, p in ipairs(playerList) do out[i] = p end
		return out
	end
	error("GetPlayers on non-Players", 2)
end
local PlayersIndex = Inst.__index
Players.__props.PlayerAdded = Players.__signals.PlayerAdded
Players.__props.PlayerRemoving = Players.__signals.PlayerRemoving

M.addPlayer = function(name)
	local p = newInstance("Player")
	p.__props.Name = name
	p.__props.DisplayName = name
	p.__props.UserId = #playerList + 1
	p.__props.Parent = Players
	table.insert(Players.__children, p)
	table.insert(playerList, p)
	Players.__signals.PlayerAdded:Fire(p)
	return p
end
M.removePlayer = function(p)
	Players.__signals.PlayerRemoving:Fire(p)
	for i, q in ipairs(playerList) do
		if q == p then table.remove(playerList, i) break end
	end
	p.Parent = nil
end

local HttpService = { GenerateGUID = function() M.guid = (M.guid or 0) + 1 return "guid-" .. M.guid end }
local TweenService = { Create = function() return { Play = function() end, Completed = newSignal(), Cancel = function() end } end }

function methods.GetService(self, name)
	if name == "CollectionService" then return CollectionService end
	if name == "RunService" then return RunService end
	if name == "HttpService" then return HttpService end
	if name == "TweenService" then return TweenService end
	local s = services[name]
	if not s then error("Mock has no service " .. tostring(name), 2) end
	return s
end

---------------------------------------------------------------------------
-- task scheduler (manual, deterministic)
---------------------------------------------------------------------------
M.now = 0
local queue = {}
local task = {}
function task.delay(t, fn, ...)
	local args = { ... }
	table.insert(queue, { at = M.now + (t or 0), fn = function() fn(unpack(args)) end })
end
function task.defer(fn, ...)
	task.delay(0, fn, ...)
end
function task.spawn(fn, ...)
	-- run immediately; long-running loops must not be spawned in the mock
	fn(...)
end
function task.wait() error("task.wait cannot be used in mock-driven code paths", 2) end
M.advance = function(dt)
	local target = M.now + dt
	while true do
		table.sort(queue, function(a, b) return a.at < b.at end)
		local nextJob = queue[1]
		if not nextJob or nextJob.at > target then break end
		table.remove(queue, 1)
		M.now = nextJob.at
		nextJob.fn()
	end
	M.now = target
end

---------------------------------------------------------------------------
-- Module tree + require (a tiny Rojo)
---------------------------------------------------------------------------
local moduleCache = {}
M.mapFile = function(parent, name, className, path)
	local inst = newInstance(className)
	inst.__props.Name = name
	rawset(inst, "__file", path)
	inst.Parent = parent
	return inst
end
M.ensureFolder = function(parent, name)
	local f = methods.FindFirstChild(parent, name)
	if f then return f end
	local folder = newInstance("Folder")
	folder.__props.Name = name
	folder.Parent = parent
	return folder
end

local env
local function requireModule(inst)
	if moduleCache[inst] ~= nil then return moduleCache[inst] end
	local path = rawget(inst, "__file")
	if not path then error("require: instance has no source file", 2) end
	local chunk, err = loadfile(path)
	if not chunk then error(err, 0) end
	local menv = setmetatable({ script = inst }, { __index = env })
	setfenv(chunk, menv)
	local result = chunk()
	moduleCache[inst] = result
	return result
end
M.runScript = function(inst)
	local chunk, err = loadfile(rawget(inst, "__file"))
	if not chunk then error(err, 0) end
	setfenv(chunk, setmetatable({ script = inst }, { __index = env }))
	return chunk()
end

-- Luau helpers that plain Lua 5.1 lacks
local mathx = setmetatable({
	clamp = function(x, a, b) if x < a then return a elseif x > b then return b end return x end,
	round = function(x) return math.floor(x + 0.5) end,
	sign = function(x) if x > 0 then return 1 elseif x < 0 then return -1 end return 0 end,
}, { __index = math })
local tablex = setmetatable({
	find = function(t, v) for i, x in ipairs(t) do if x == v then return i end end return nil end,
	clear = function(t) for k in pairs(t) do t[k] = nil end end,
	clone = function(t) local c = {} for k, v in pairs(t) do c[k] = v end return c end,
}, { __index = table })

env = setmetatable({
	game = game,
	workspace = services.Workspace,
	Instance = Instance,
	Vector3 = Vector3,
	Vector2 = Vector2,
	CFrame = CFrame,
	Color3 = Color3,
	UDim = UDim,
	UDim2 = UDim2,
	Enum = Enum,
	NumberRange = NumberRange,
	NumberSequence = NumberSequence,
	NumberSequenceKeypoint = NumberSequenceKeypoint,
	ColorSequence = ColorSequence,
	ColorSequenceKeypoint = ColorSequenceKeypoint,
	TweenInfo = TweenInfo,
	task = task,
	require = requireModule,
	math = mathx,
	table = tablex,
	os = { clock = function() return M.now end, time = function() return 0 end, date = os.date },
	warn = function(...) M.warnings = M.warnings or {} table.insert(M.warnings, table.concat({ ... }, " ")) end,
	print = function() end,
	tick = function() return M.now end,
}, { __index = _G })

M.env = env
M.game = game
M.services = services
M.Players = Players
M.CollectionService = CollectionService
M.RunService = RunService
M.Vector3 = Vector3
M.CFrame = CFrame
M.instanceCount = function() return instanceCount end
M.isA = isA

return M
