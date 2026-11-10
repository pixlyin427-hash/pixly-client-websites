--[[
	InterfaceController — the only permanent UI: two small buttons (MENU,
	SETTINGS) in the top-right corner. Also owns the intro hint and toasts.
	No currencies, no shop, no fake progression.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UIKit = require(script.Parent.Parent:WaitForChild("UI"):WaitForChild("UIKit"))
local GameConfig = require(ReplicatedStorage.Shared.Config.GameConfig)
local Remotes = require(ReplicatedStorage.Shared.Modules.Remotes)

local Theme = UIKit.Theme
local C = Theme.Colors

local InterfaceController = {}

local controllers
local gui
local menuPanel, settingsPanel, backdrop
local returnButton
local hint
local hintDismissed = false
local hintsEnabled = true
local toast, toastText
local toastToken = 0
local aboard = false

local function play(key)
	if controllers.SoundController then
		controllers.SoundController.Play(key)
	end
end

local function closePanels()
	for _, p in ipairs({ menuPanel, settingsPanel }) do
		if p.Visible then
			UIKit.hide(p)
		end
	end
	backdrop.Visible = false
end

local function openPanel(panel)
	local wasOpen = panel.Visible and panel.GroupTransparency < 0.5
	closePanels()
	if not wasOpen then
		backdrop.Visible = true
		UIKit.show(panel)
	end
end

local function modal(name, title, height)
	local p = UIKit.panel({
		Name = name,
		Parent = gui,
		Size = UDim2.new(0, 360, 0, height),
		Position = UDim2.new(0.5, 0, 0.5, 0),
		AnchorPoint = Vector2.new(0.5, 0.5),
		Corner = 10,
	})
	p.ZIndex = 5
	UIKit.label({ Parent = p, Text = title, Font = Theme.Fonts.Label, TextSize = 14, Color = C.Accent, Position = UDim2.new(0, 22, 0, 18), Size = UDim2.new(1, -44, 0, 18) })
	UIKit.create("Frame", { Parent = p, BackgroundColor3 = C.Stroke, BackgroundTransparency = 0.6, BorderSizePixel = 0, Position = UDim2.new(0, 22, 0, 44), Size = UDim2.new(1, -44, 0, 1) })
	return p
end

-- Segmented control: options = { {label, value}, ... }
local function segmented(parent, y, labelText, options, current, onChange)
	UIKit.label({ Parent = parent, Text = labelText, TextSize = 15, Color = C.Text, Position = UDim2.new(0, 22, 0, y), Size = UDim2.new(0.45, -22, 0, 40) })
	local row = UIKit.create("Frame", { Parent = parent, BackgroundColor3 = C.Background, BackgroundTransparency = 0.2, BorderSizePixel = 0, Position = UDim2.new(1, -22, 0, y), AnchorPoint = Vector2.new(1, 0), Size = UDim2.new(0.55, -22, 0, 40) })
	UIKit.corner(row, 6)
	UIKit.stroke(row, C.StrokeSoft, 1, 0.3)
	local buttons = {}
	local function refresh(value)
		for _, entry in ipairs(buttons) do
			local on = entry.value == value
			entry.button.BackgroundTransparency = on and 0 or 1
			entry.button.TextColor3 = on and C.AccentText or C.TextMuted
		end
	end
	for i, opt in ipairs(options) do
		local b = UIKit.create("TextButton", {
			Parent = row,
			AutoButtonColor = false,
			Text = opt[1],
			Font = Theme.Fonts.Label,
			TextSize = 14,
			BackgroundColor3 = C.Accent,
			BorderSizePixel = 0,
			Size = UDim2.new(1 / #options, -4, 1, -6),
			Position = UDim2.new((i - 1) / #options, 2, 0, 3),
		})
		UIKit.corner(b, 5)
		table.insert(buttons, { button = b, value = opt[2] })
		b.Activated:Connect(function()
			play("UIClick")
			refresh(opt[2])
			onChange(opt[2])
		end)
	end
	refresh(current)
end

local function buildTopBar()
	local bar = UIKit.create("Frame", {
		Name = "TopBar",
		Parent = gui,
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(1, 0),
		Position = UDim2.new(1, -12, 0, 10),
		Size = UDim2.new(0, 220, 0, 42),
	})
	UIKit.scaled(bar)
	local function pill(text, x, onClick)
		local b = UIKit.button({ Parent = bar, Text = text, TextSize = 14, Size = UDim2.new(0, 104, 0, 42), Position = UDim2.new(0, x, 0, 0), OnClick = onClick })
		b.BackgroundTransparency = 0.15
		return b
	end
	pill("MENU", 0, function()
		play("UIClick")
		openPanel(menuPanel)
	end)
	pill("SETTINGS", 116, function()
		play("UIClick")
		openPanel(settingsPanel)
	end)
end

local function buildMenu()
	menuPanel = modal("MenuPanel", "THE LAST TRAIN", 286)
	UIKit.label({
		Parent = menuPanel,
		Text = "Expeditions depart from the lower platform. Step into a cabin to form a crew. The first explorer aboard leads and decides when to depart.",
		TextSize = 15,
		Color = C.TextMuted,
		Wrapped = true,
		YAlign = Enum.TextYAlignment.Top,
		Position = UDim2.new(0, 22, 0, 58),
		Size = UDim2.new(1, -44, 0, 96),
	})
	returnButton = UIKit.button({
		Parent = menuPanel,
		Text = "RETURN TO TERMINAL",
		Style = "Secondary",
		Size = UDim2.new(1, -44, 0, Theme.ButtonHeight),
		Position = UDim2.new(0, 22, 1, -118),
		OnClick = function()
			play("UIConfirm")
			closePanels()
			Remotes.Get("TrainRequest"):FireServer("ReturnToTerminal")
		end,
	})
	returnButton.Visible = false
	UIKit.button({
		Parent = menuPanel,
		Text = "CLOSE",
		Style = "Secondary",
		Size = UDim2.new(1, -44, 0, Theme.ButtonHeight),
		Position = UDim2.new(0, 22, 1, -64),
		OnClick = function()
			play("UICancel")
			closePanels()
		end,
	})
end

local function buildSettings()
	settingsPanel = modal("SettingsPanel", "SETTINGS", 330)
	local sc = controllers.SoundController
	segmented(settingsPanel, 60, "Ambience", { { "OFF", 0 }, { "LOW", 0.45 }, { "FULL", 1 } }, 1, function(v)
		sc.SetLevel("Ambience", v)
	end)
	segmented(settingsPanel, 108, "Effects", { { "OFF", 0 }, { "LOW", 0.45 }, { "FULL", 1 } }, 1, function(v)
		sc.SetLevel("Effects", v)
	end)
	segmented(settingsPanel, 156, "Interface sounds", { { "OFF", 0 }, { "ON", 1 } }, 1, function(v)
		sc.SetLevel("Interface", v)
	end)
	segmented(settingsPanel, 204, "Hints", { { "OFF", false }, { "ON", true } }, true, function(v)
		hintsEnabled = v
		if not v and hint.Visible then
			UIKit.hide(hint)
		end
	end)
	UIKit.button({
		Parent = settingsPanel,
		Text = "CLOSE",
		Size = UDim2.new(1, -44, 0, Theme.ButtonHeight),
		Position = UDim2.new(0, 22, 1, -64),
		OnClick = function()
			play("UICancel")
			closePanels()
		end,
	})
end

local function buildHintAndToast()
	hint = UIKit.panel({
		Name = "IntroHint",
		Parent = gui,
		Size = UDim2.new(0, 340, 0, 40),
		Position = UDim2.new(0.5, 0, 0, 62),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 20,
		Transparency = 0.2,
	})
	UIKit.label({ Parent = hint, Text = GameConfig.Hints.IntroHintText, TextSize = 15, Color = C.Text, XAlign = Enum.TextXAlignment.Center, Size = UDim2.new(1, 0, 1, 0) })

	toast = UIKit.panel({
		Name = "Toast",
		Parent = gui,
		Size = UDim2.new(0, 320, 0, 38),
		Position = UDim2.new(0.5, 0, 0, 112),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 19,
		Color = C.PanelRaised,
	})
	toastText = UIKit.label({ Parent = toast, TextSize = 14, Color = C.Text, XAlign = Enum.TextXAlignment.Center, Size = UDim2.new(1, -24, 1, 0), Position = UDim2.new(0, 12, 0, 0) })
end

function InterfaceController.DismissHint()
	hintDismissed = true
	if hint and hint.Visible then
		UIKit.hide(hint, 0.4)
	end
end

function InterfaceController.Toast(text)
	toastToken = toastToken + 1
	local token = toastToken
	toastText.Text = text
	UIKit.show(toast, 0.22)
	task.delay(2.6, function()
		if token == toastToken then
			UIKit.hide(toast, 0.3)
		end
	end)
end

function InterfaceController.SetAboard(isAboard)
	aboard = isAboard
	if returnButton then
		returnButton.Visible = isAboard
	end
	if isAboard then
		InterfaceController.DismissHint()
	end
end

function InterfaceController.Init(registry)
	controllers = registry
	gui = UIKit.screen("LastTrainInterface", 10)
	backdrop = UIKit.create("TextButton", {
		Name = "Backdrop",
		Parent = gui,
		Text = "",
		AutoButtonColor = false,
		BackgroundColor3 = Color3.new(0, 0, 0),
		BackgroundTransparency = 0.55,
		Size = UDim2.new(1, 0, 1, 200),
		Position = UDim2.new(0, 0, 0, -100),
		Visible = false,
		ZIndex = 4,
	})
	backdrop.Activated:Connect(closePanels)
	buildTopBar()
	buildMenu()
	buildSettings()
	buildHintAndToast()
	Remotes.Get("Notice").OnClientEvent:Connect(function(text)
		if type(text) == "string" then
			InterfaceController.Toast(text)
		end
	end)
end

function InterfaceController.Start()
	task.wait(GameConfig.Hints.IntroHintDelay)
	if hintsEnabled and not hintDismissed and not aboard then
		UIKit.show(hint, 0.5)
	end
end

return InterfaceController
