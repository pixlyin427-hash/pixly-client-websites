--[[
	Emblem
	The train's original symbol, drawn with plain GUI frames so it needs no
	uploaded image: a double ring around a railway track that converges on a
	single diamond — a destination nobody has reached.

	Works inside SurfaceGuis (signs, locomotive, doors) and ScreenGuis (HUD).

	Emblem.Create(parent, {
		Size = UDim2, Position = UDim2, AnchorPoint = Vector2,
		Color = Color3, Thickness = number (ring stroke in pixels), ZIndex = number,
	})
]]

local Emblem = {}

local function bar(parent, name, color, size, position, rotation, zIndex)
	local f = Instance.new("Frame")
	f.Name = name
	f.BorderSizePixel = 0
	f.BackgroundColor3 = color
	f.AnchorPoint = Vector2.new(0.5, 0.5)
	f.Size = size
	f.Position = position
	f.Rotation = rotation or 0
	f.ZIndex = zIndex
	f.Parent = parent
	return f
end

local function ring(parent, name, color, scale, thickness, zIndex)
	local f = Instance.new("Frame")
	f.Name = name
	f.BackgroundTransparency = 1
	f.BorderSizePixel = 0
	f.AnchorPoint = Vector2.new(0.5, 0.5)
	f.Position = UDim2.new(0.5, 0, 0.5, 0)
	f.Size = UDim2.new(scale, 0, scale, 0)
	f.ZIndex = zIndex
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0.5, 0)
	corner.Parent = f
	local stroke = Instance.new("UIStroke")
	stroke.Color = color
	stroke.Thickness = thickness
	stroke.Parent = f
	f.Parent = parent
	return f
end

function Emblem.Create(parent, props)
	props = props or {}
	local color = props.Color or Color3.fromRGB(176, 140, 82)
	local thickness = props.Thickness or 3
	local z = props.ZIndex or 1

	local root = Instance.new("Frame")
	root.Name = "Emblem"
	root.BackgroundTransparency = 1
	root.BorderSizePixel = 0
	root.Size = props.Size or UDim2.new(1, 0, 1, 0)
	root.Position = props.Position or UDim2.new(0.5, 0, 0.5, 0)
	root.AnchorPoint = props.AnchorPoint or Vector2.new(0.5, 0.5)
	root.ZIndex = z

	ring(root, "OuterRing", color, 0.96, thickness, z)
	ring(root, "InnerRing", color, 0.8, math.max(1, thickness * 0.5), z)

	-- Two rails converging toward the horizon.
	bar(root, "RailLeft", color, UDim2.new(0.035, 0, 0.5, 0), UDim2.new(0.41, 0, 0.56, 0), 11, z)
	bar(root, "RailRight", color, UDim2.new(0.035, 0, 0.5, 0), UDim2.new(0.59, 0, 0.56, 0), -11, z)

	-- Sleepers shrink with distance.
	bar(root, "Sleeper1", color, UDim2.new(0.38, 0, 0.032, 0), UDim2.new(0.5, 0, 0.74, 0), 0, z)
	bar(root, "Sleeper2", color, UDim2.new(0.28, 0, 0.028, 0), UDim2.new(0.5, 0, 0.6, 0), 0, z)
	bar(root, "Sleeper3", color, UDim2.new(0.19, 0, 0.024, 0), UDim2.new(0.5, 0, 0.48, 0), 0, z)

	-- The destination.
	bar(root, "Destination", color, UDim2.new(0.11, 0, 0.11, 0), UDim2.new(0.5, 0, 0.29, 0), 45, z)

	root.Parent = parent
	return root
end

return Emblem
