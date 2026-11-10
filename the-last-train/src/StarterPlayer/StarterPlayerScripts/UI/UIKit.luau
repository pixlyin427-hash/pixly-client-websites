--[[
	UIKit — small helpers so every screen element shares one visual language.

	Responsive scaling: every panel gets its own UIScale registered here. One
	listener on the camera's ViewportSize rescales them all (0.8x on small
	phones up to 1.1x on large screens). Panels are anchored to the edge they
	sit against, so scaling never pushes them off-screen.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local Theme = require(ReplicatedStorage.Shared.Modules.UITheme)

local UIKit = {}
UIKit.Theme = Theme

local C = Theme.Colors
local scales = {}
local currentScale = 1

local function computeScale()
	local camera = workspace.CurrentCamera
	if not camera then
		return 1
	end
	local vp = camera.ViewportSize
	local s = math.min(vp.X / 1000, vp.Y / 560)
	return math.clamp(s, 0.8, 1.1)
end

local function applyScales()
	currentScale = computeScale()
	for scale in pairs(scales) do
		if scale.Parent then
			scale.Scale = currentScale
		else
			scales[scale] = nil
		end
	end
end

local cameraConnection = nil
local function watchCamera()
	if cameraConnection then
		cameraConnection:Disconnect()
	end
	local camera = workspace.CurrentCamera
	if camera then
		cameraConnection = camera:GetPropertyChangedSignal("ViewportSize"):Connect(applyScales)
	end
	applyScales()
end
workspace:GetPropertyChangedSignal("CurrentCamera"):Connect(watchCamera)
watchCamera()

function UIKit.GetScale()
	return currentScale
end

function UIKit.create(className, props)
	local inst = Instance.new(className)
	local parent = nil
	for k, v in pairs(props or {}) do
		if k == "Parent" then
			parent = v
		else
			inst[k] = v
		end
	end
	if parent then
		inst.Parent = parent
	end
	return inst
end

function UIKit.corner(inst, px)
	return UIKit.create("UICorner", { CornerRadius = UDim.new(0, px or Theme.CornerRadius), Parent = inst })
end

function UIKit.stroke(inst, color, thickness, transparency)
	return UIKit.create("UIStroke", {
		Color = color or C.Stroke,
		Thickness = thickness or 1,
		Transparency = transparency or Theme.StrokeTransparency,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
		Parent = inst,
	})
end

function UIKit.padding(inst, x, y)
	return UIKit.create("UIPadding", {
		PaddingLeft = UDim.new(0, x),
		PaddingRight = UDim.new(0, x),
		PaddingTop = UDim.new(0, y or x),
		PaddingBottom = UDim.new(0, y or x),
		Parent = inst,
	})
end

function UIKit.screen(name, displayOrder, fullScreen)
	local gui = Instance.new("ScreenGui")
	gui.Name = name
	gui.ResetOnSpawn = false
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.DisplayOrder = displayOrder or 0
	gui.IgnoreGuiInset = fullScreen == true
	if not fullScreen then
		gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	end
	gui.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")
	return gui
end

-- Registers a responsive UIScale on a panel.
function UIKit.scaled(inst)
	local s = Instance.new("UIScale")
	s.Scale = currentScale
	s.Parent = inst
	scales[s] = true
	return s
end

-- Dark panel that can fade as a whole (CanvasGroup).
function UIKit.panel(props)
	local p = UIKit.create("CanvasGroup", {
		Name = props.Name or "Panel",
		Size = props.Size,
		Position = props.Position,
		AnchorPoint = props.AnchorPoint or Vector2.new(0, 0),
		BackgroundColor3 = props.Color or C.Panel,
		BackgroundTransparency = props.Transparency or Theme.PanelTransparency,
		BorderSizePixel = 0,
		GroupTransparency = 1,
		Visible = false,
		Parent = props.Parent,
	})
	UIKit.corner(p, props.Corner)
	UIKit.stroke(p, props.StrokeColor or C.Stroke, 1, props.StrokeTransparency or Theme.StrokeTransparency)
	UIKit.scaled(p)
	p:SetAttribute("BasePosition", props.Position)
	return p
end

function UIKit.label(props)
	local l = UIKit.create("TextLabel", {
		Name = props.Name or "Label",
		BackgroundTransparency = 1,
		Text = props.Text or "",
		Font = props.Font or Theme.Fonts.Body,
		TextSize = props.TextSize or 16,
		TextColor3 = props.Color or C.Text,
		TextXAlignment = props.XAlign or Enum.TextXAlignment.Left,
		TextYAlignment = props.YAlign or Enum.TextYAlignment.Center,
		TextWrapped = props.Wrapped == true,
		TextTransparency = props.TextTransparency or 0,
		Size = props.Size or UDim2.new(1, 0, 0, 20),
		Position = props.Position or UDim2.new(0, 0, 0, 0),
		AnchorPoint = props.AnchorPoint or Vector2.new(0, 0),
		RichText = props.RichText == true,
		ZIndex = props.ZIndex or 1,
		Parent = props.Parent,
	})
	return l
end

local BUTTON_STYLES = {
	Primary = { Bg = C.Accent, BgHover = Color3.fromRGB(240, 186, 116), Text = C.AccentText, Stroke = C.AccentDeep, StrokeT = 0.2 },
	Secondary = { Bg = C.PanelRaised, BgHover = Color3.fromRGB(48, 44, 39), Text = C.Text, Stroke = C.Stroke, StrokeT = 0.45 },
	Danger = { Bg = C.PanelRaised, BgHover = Color3.fromRGB(56, 38, 34), Text = Color3.fromRGB(232, 186, 172), Stroke = C.Danger, StrokeT = 0.4 },
}

-- props: Text, Style, Size, Position, AnchorPoint, Parent, OnClick
function UIKit.button(props)
	local style = BUTTON_STYLES[props.Style or "Secondary"]
	local b = UIKit.create("TextButton", {
		Name = props.Name or "Button",
		AutoButtonColor = false,
		Text = props.Text or "",
		Font = Theme.Fonts.Label,
		TextSize = props.TextSize or 16,
		TextColor3 = style.Text,
		BackgroundColor3 = style.Bg,
		BorderSizePixel = 0,
		Size = props.Size or UDim2.new(0, 160, 0, Theme.ButtonHeight),
		Position = props.Position or UDim2.new(0, 0, 0, 0),
		AnchorPoint = props.AnchorPoint or Vector2.new(0, 0),
		Parent = props.Parent,
	})
	UIKit.corner(b, 6)
	UIKit.stroke(b, style.Stroke, 1, style.StrokeT)
	local info = TweenInfo.new(0.12, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	b.MouseEnter:Connect(function()
		TweenService:Create(b, info, { BackgroundColor3 = style.BgHover }):Play()
	end)
	b.MouseLeave:Connect(function()
		TweenService:Create(b, info, { BackgroundColor3 = style.Bg }):Play()
	end)
	if props.OnClick then
		local busy = false
		b.Activated:Connect(function()
			if busy then
				return
			end
			busy = true
			props.OnClick()
			task.delay(0.35, function()
				busy = false
			end)
		end)
	end
	return b
end

-- Fade + slight rise + gentle scale. Never bouncy.
function UIKit.show(panel, duration)
	duration = duration or 0.28
	local base = panel:GetAttribute("BasePosition") or panel.Position
	panel.Visible = true
	panel.Position = base + UDim2.new(0, 0, 0, 10)
	panel.GroupTransparency = 1
	local scale = panel:FindFirstChildOfClass("UIScale")
	if scale then
		scale.Scale = currentScale * 0.97
		TweenService:Create(scale, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Scale = currentScale }):Play()
	end
	TweenService:Create(panel, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), { Position = base, GroupTransparency = 0 }):Play()
end

function UIKit.hide(panel, duration)
	duration = duration or 0.2
	local base = panel:GetAttribute("BasePosition") or panel.Position
	local tween = TweenService:Create(panel, TweenInfo.new(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.In), { Position = base + UDim2.new(0, 0, 0, 8), GroupTransparency = 1 })
	tween.Completed:Connect(function(state)
		if state == Enum.PlaybackState.Completed and panel.GroupTransparency >= 0.99 then
			panel.Visible = false
		end
	end)
	tween:Play()
end

function UIKit.tween(inst, duration, goal, style)
	local t = TweenService:Create(inst, TweenInfo.new(duration, style or Enum.EasingStyle.Quad, Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

return UIKit
