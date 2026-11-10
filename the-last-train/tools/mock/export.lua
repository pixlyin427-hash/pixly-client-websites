--[[
	Exports the mock Workspace into plain tables for preview/world.json.
	Parts: { shape, sx, sy, sz, x, y, z, r00..r22, r, g, b, material, transparency, name }
]]

return function(M)
	local workspace = M.services.Workspace
	local isA = M.isA
	local out = { parts = {}, lights = {}, guis = {}, smoke = {}, markers = {}, scroll = {} }
	local partIndex = {}

	local SHAPES = { Block = 0, Ball = 1, Cylinder = 2 }

	local function cfArray(c)
		return { c.x, c.y, c.z, c.r00, c.r01, c.r02, c.r10, c.r11, c.r12, c.r20, c.r21, c.r22 }
	end

	local function udim2(u)
		if not u then return nil end
		return { u.X.Scale, u.X.Offset, u.Y.Scale, u.Y.Offset }
	end

	local function color(c)
		if not c then return nil end
		return { c._r, c._g, c._b }
	end

	local function guiTree(inst)
		local p = inst.__props
		local node = { cls = inst.__class, kids = {} }
		node.pos = udim2(p.Position) or { 0, 0, 0, 0 }
		node.size = udim2(p.Size) or { 0, 100, 0, 100 }
		node.anchor = p.AnchorPoint and { p.AnchorPoint.X, p.AnchorPoint.Y } or { 0, 0 }
		node.rot = p.Rotation or 0
		node.bg = color(p.BackgroundColor3) or { 1, 1, 1 }
		node.bgT = p.BackgroundTransparency
		if node.bgT == nil then node.bgT = 0 end
		node.clip = p.ClipsDescendants == true
		node.z = p.ZIndex or 1
		if inst.__class == "TextLabel" then
			node.text = p.Text or ""
			node.tc = color(p.TextColor3) or { 0, 0, 0 }
			node.tT = p.TextTransparency or 0
			node.font = p.Font and p.Font.Name or "SourceSans"
			node.scaled = p.TextScaled == true
			node.tsize = p.TextSize or 14
			node.xa = p.TextXAlignment and p.TextXAlignment.Name or "Center"
		end
		for _, c in ipairs(inst.__children) do
			if c.__class == "UICorner" then
				local r = c.__props.CornerRadius
				node.corner = { r and r.Scale or 0, r and r.Offset or 8 }
			elseif c.__class == "UIStroke" then
				node.stroke = { color(c.__props.Color) or { 0, 0, 0 }, c.__props.Thickness or 1, c.__props.Transparency or 0 }
			elseif c.__class == "Frame" or c.__class == "TextLabel" then
				if c.__props.Visible ~= false then
					table.insert(node.kids, guiTree(c))
				end
			end
		end
		return node
	end

	for _, d in ipairs(workspace:GetDescendants()) do
		local p = d.__props
		if isA(d.__class, "BasePart") then
			local shape = 0
			if d.__class == "WedgePart" then
				shape = 3
			elseif p.Shape then
				shape = SHAPES[p.Shape.Name] or 0
			end
			local c = p.CFrame
			local sz = p.Size or M.Vector3.new(4, 1, 2)
			local col = p.Color or { _r = 0.64, _g = 0.64, _b = 0.65 }
			local entry = { shape, sz._x, sz._y, sz._z }
			for _, v in ipairs(cfArray(c)) do table.insert(entry, v) end
			table.insert(entry, col._r)
			table.insert(entry, col._g)
			table.insert(entry, col._b)
			table.insert(entry, p.Material and p.Material.Name or "Plastic")
			table.insert(entry, p.Transparency or 0)
			table.insert(entry, p.Name or "")
			table.insert(out.parts, entry)
			partIndex[d] = #out.parts - 1
			-- scenery layer (scrolls past the train windows)
			local anc = p.Parent
			while anc do
				local attrs = rawget(anc, "__attrs")
				if attrs and attrs.Layer then
					table.insert(out.scroll, { #out.parts - 1, attrs.Layer, attrs.WrapZ0 or false, attrs.WrapLength or 1400 })
					break
				end
				anc = anc.__props.Parent
			end
		end
	end

	for _, d in ipairs(workspace:GetDescendants()) do
		local p = d.__props
		local parent = p.Parent
		if (d.__class == "PointLight" or d.__class == "SpotLight") and parent and partIndex[parent] then
			local pc = parent.__props.CFrame
			local dir = { 0, 0, 0 }
			if d.__class == "SpotLight" then
				local f = p.Face and p.Face.Name or "Front"
				local lv = { Front = { 0, 0, -1 }, Back = { 0, 0, 1 }, Top = { 0, 1, 0 }, Bottom = { 0, -1, 0 }, Right = { 1, 0, 0 }, Left = { -1, 0, 0 } }
				local v = lv[f]
				dir = { pc.r00 * v[1] + pc.r01 * v[2] + pc.r02 * v[3], pc.r10 * v[1] + pc.r11 * v[2] + pc.r12 * v[3], pc.r20 * v[1] + pc.r21 * v[2] + pc.r22 * v[3] }
			end
			table.insert(out.lights, { d.__class == "SpotLight" and 1 or 0, pc.x, pc.y, pc.z, color(p.Color) or { 1, 1, 1 }, p.Brightness or 1, p.Range or 8, dir, p.Angle or 90 })
		elseif d.__class == "SurfaceGui" and parent and partIndex[parent] then
			local node = { part = partIndex[parent], face = p.Face and p.Face.Name or "Front", pps = p.PixelsPerStud or 50, kids = {} }
			for _, c in ipairs(d.__children) do
				if c.__class == "Frame" or c.__class == "TextLabel" then
					table.insert(node.kids, guiTree(c))
				end
			end
			table.insert(out.guis, node)
		elseif d.__class == "Smoke" and parent and partIndex[parent] then
			local pc = parent.__props.CFrame
			table.insert(out.smoke, { pc.x, pc.y, pc.z, p.Size or 1, p.Opacity or 0.5 })
		end
	end
	return out
end
