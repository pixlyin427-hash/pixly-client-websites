--[[
	TransitionController — the short fade between the terminal and the train.
	"Out": fade to black, show title/subtitle and the emblem.
	"In":  swap the caption, hold a moment, fade back in.
	No long cutscene: the whole sequence is about three seconds.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UIKit = require(script.Parent.Parent:WaitForChild("UI"):WaitForChild("UIKit"))
local GameConfig = require(ReplicatedStorage.Shared.Config.GameConfig)
local Remotes = require(ReplicatedStorage.Shared.Modules.Remotes)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)

local Theme = UIKit.Theme
local C = Theme.Colors
local T = GameConfig.Transition

local TransitionController = {}

local cover, title, subtitle, emblemHolder
local token = 0

local function setText(t, s)
	title.Text = t or ""
	subtitle.Text = s or ""
end

local function textAlpha(alpha, duration)
	UIKit.tween(title, duration, { TextTransparency = alpha })
	UIKit.tween(subtitle, duration, { TextTransparency = alpha })
	UIKit.tween(emblemHolder, duration, { GroupTransparency = alpha })
end

local function out(t, s)
	token = token + 1
	setText(t, s)
	cover.Visible = true
	UIKit.tween(cover, T.FadeOutTime, { BackgroundTransparency = 0 }, Enum.EasingStyle.Sine)
	task.delay(T.FadeOutTime * 0.5, function()
		textAlpha(0, 0.5)
	end)
end

local function fadeIn(t, s)
	token = token + 1
	local my = token
	if t then
		setText(t, s)
	end
	task.delay(0.5, function()
		if my ~= token then
			return
		end
		textAlpha(1, T.FadeInTime * 0.6)
		local tween = UIKit.tween(cover, T.FadeInTime, { BackgroundTransparency = 1 }, Enum.EasingStyle.Sine)
		tween.Completed:Connect(function()
			if my == token then
				cover.Visible = false
			end
		end)
	end)
end

function TransitionController.Init()
	local gui = UIKit.screen("LastTrainTransition", 100, true)
	cover = UIKit.create("Frame", {
		Name = "Cover",
		Parent = gui,
		BackgroundColor3 = Color3.fromRGB(8, 8, 9),
		BackgroundTransparency = 1,
		BorderSizePixel = 0,
		Size = UDim2.new(1, 0, 1, 0),
		Visible = false,
	})
	local center = UIKit.create("Frame", { Parent = cover, BackgroundTransparency = 1, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.new(0.5, 0, 0.5, 0), Size = UDim2.new(0, 420, 0, 190) })
	UIKit.scaled(center)
	emblemHolder = UIKit.create("CanvasGroup", { Parent = center, BackgroundTransparency = 1, GroupTransparency = 1, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.new(0.5, 0, 0, 0), Size = UDim2.new(0, 64, 0, 64) })
	Emblem.Create(emblemHolder, { Color = C.Brass, Thickness = 2 })
	title = UIKit.label({ Parent = center, Font = Theme.Fonts.Title, TextSize = 30, Color = C.Text, XAlign = Enum.TextXAlignment.Center, Position = UDim2.new(0, 0, 0, 84), Size = UDim2.new(1, 0, 0, 40), TextTransparency = 1 })
	subtitle = UIKit.label({ Parent = center, Font = Theme.Fonts.Label, TextSize = 15, Color = C.Accent, XAlign = Enum.TextXAlignment.Center, Position = UDim2.new(0, 0, 0, 130), Size = UDim2.new(1, 0, 0, 22), TextTransparency = 1 })

	Remotes.Get("Transition").OnClientEvent:Connect(function(phase, t, s)
		if phase == "Out" then
			out(t, s)
		elseif phase == "In" then
			fadeIn(t, s)
		end
	end)
end

return TransitionController
