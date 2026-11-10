--[[
	TrainHUDController — a small, quiet status plate while aboard:
	  THE LAST TRAIN / EXPEDITION CREW n / max / • PREPARING ROUTE
	No currency, no levels, nothing unfinished pretending to work.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UIKit = require(script.Parent.Parent:WaitForChild("UI"):WaitForChild("UIKit"))
local Remotes = require(ReplicatedStorage.Shared.Modules.Remotes)
local Emblem = require(ReplicatedStorage.Shared.Modules.Emblem)

local Theme = UIKit.Theme
local C = Theme.Colors

local TrainHUDController = {}

local controllers
local hud, crewLabel, statusLabel

function TrainHUDController.Init(registry)
	controllers = registry
	local gui = UIKit.screen("LastTrainHUD", 5)
	hud = UIKit.panel({
		Name = "TrainHUD",
		Parent = gui,
		Size = UDim2.new(0, 236, 0, 76),
		Position = UDim2.new(0, 12, 0, 10),
		AnchorPoint = Vector2.new(0, 0),
		Corner = 8,
		Transparency = 0.15,
	})
	local icon = UIKit.create("Frame", { Parent = hud, BackgroundTransparency = 1, Position = UDim2.new(0, 12, 0.5, 0), AnchorPoint = Vector2.new(0, 0.5), Size = UDim2.new(0, 40, 0, 40) })
	Emblem.Create(icon, { Color = C.Brass, Thickness = 1.5 })
	UIKit.label({ Parent = hud, Text = "THE LAST TRAIN", Font = Theme.Fonts.Label, TextSize = 13, Color = C.Accent, Position = UDim2.new(0, 64, 0, 10), Size = UDim2.new(1, -74, 0, 16) })
	crewLabel = UIKit.label({ Parent = hud, Text = "", Font = Theme.Fonts.Body, TextSize = 15, Color = C.Text, Position = UDim2.new(0, 64, 0, 29), Size = UDim2.new(1, -74, 0, 18), RichText = true })
	statusLabel = UIKit.label({ Parent = hud, Text = "", Font = Theme.Fonts.Label, TextSize = 11, Color = C.TextFaint, Position = UDim2.new(0, 64, 0, 50), Size = UDim2.new(1, -74, 0, 14) })

	Remotes.Get("TrainState").OnClientEvent:Connect(function(view)
		if view == nil then
			if hud.Visible then
				UIKit.hide(hud)
			end
			controllers.InterfaceController.SetAboard(false)
			return
		end
		crewLabel.Text = 'EXPEDITION CREW  <font color="#E2A860">' .. view.CrewCount .. " / " .. view.CrewMax .. "</font>"
		statusLabel.Text = "•  " .. (view.Status or "")
		if not hud.Visible or hud.GroupTransparency > 0.5 then
			UIKit.show(hud, 0.5)
		end
		controllers.InterfaceController.SetAboard(true)
	end)
end

return TrainHUDController
