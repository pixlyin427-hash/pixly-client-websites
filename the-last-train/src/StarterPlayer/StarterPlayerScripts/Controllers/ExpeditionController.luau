--[[
	ExpeditionController — the compact card shown while you stand in a cabin,
	and the departure countdown.

	Priority on the card: 1) expedition type  2) explorers  3) leader
	4) start status. START EXPEDITION only appears for the leader; LEAVE is
	always available (nobody is ever trapped).
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UIKit = require(script.Parent.Parent:WaitForChild("UI"):WaitForChild("UIKit"))
local Remotes = require(ReplicatedStorage.Shared.Modules.Remotes)

local Theme = UIKit.Theme
local C = Theme.Colors

local ExpeditionController = {}

local controllers
local requestRemote
local card, titleLabel, countLabel, unitLabel, leaderLabel, statusLabel, pipRow
local startButton, leaveButton
local countdownPanel, countdownNumber
local pips = {}
local current = nil
local lastCountdown = nil

local function play(key)
	controllers.SoundController.Play(key)
end

local function buildCard(gui)
	card = UIKit.panel({
		Name = "ExpeditionCard",
		Parent = gui,
		Size = UDim2.new(0, 300, 0, 176),
		Position = UDim2.new(1, -16, 0.47, 0),
		AnchorPoint = Vector2.new(1, 0.5),
		Corner = 10,
	})
	titleLabel = UIKit.label({ Parent = card, Font = Theme.Fonts.Label, TextSize = 15, Color = C.Accent, Position = UDim2.new(0, 18, 0, 14), Size = UDim2.new(1, -110, 0, 18) })
	pipRow = UIKit.create("Frame", { Parent = card, BackgroundTransparency = 1, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -18, 0, 17), Size = UDim2.new(0, 80, 0, 12) })
	countLabel = UIKit.label({ Parent = card, Font = Theme.Fonts.Title, TextSize = 26, Color = C.Text, Position = UDim2.new(0, 18, 0, 38), Size = UDim2.new(0, 80, 0, 32) })
	unitLabel = UIKit.label({ Parent = card, Font = Theme.Fonts.Label, TextSize = 14, Color = C.TextMuted, Position = UDim2.new(0, 100, 0, 46), Size = UDim2.new(1, -118, 0, 20) })
	leaderLabel = UIKit.label({ Parent = card, TextSize = 13, Color = C.TextMuted, Position = UDim2.new(0, 18, 0, 74), Size = UDim2.new(1, -36, 0, 18), RichText = true })
	statusLabel = UIKit.label({ Parent = card, Font = Theme.Fonts.Label, TextSize = 13, Color = C.Text, Position = UDim2.new(0, 18, 0, 94), Size = UDim2.new(1, -36, 0, 18) })
	startButton = UIKit.button({
		Parent = card,
		Text = "START EXPEDITION",
		Style = "Primary",
		Size = UDim2.new(1, -134, 0, Theme.ButtonHeight),
		Position = UDim2.new(0, 18, 1, -60),
		OnClick = function()
			play("UIConfirm")
			requestRemote:FireServer("Start")
		end,
	})
	leaveButton = UIKit.button({
		Parent = card,
		Text = "LEAVE",
		Style = "Danger",
		Size = UDim2.new(0, 98, 0, Theme.ButtonHeight),
		Position = UDim2.new(1, -116, 1, -60),
		OnClick = function()
			play("UICancel")
			requestRemote:FireServer("Leave")
		end,
	})
end

local function buildCountdown(gui)
	countdownPanel = UIKit.panel({
		Name = "Countdown",
		Parent = gui,
		Size = UDim2.new(0, 260, 0, 112),
		Position = UDim2.new(0.5, 0, 0, 70),
		AnchorPoint = Vector2.new(0.5, 0),
		Corner = 10,
		Transparency = 0.18,
	})
	UIKit.label({ Parent = countdownPanel, Text = "EXPEDITION DEPARTING", Font = Theme.Fonts.Label, TextSize = 14, Color = C.Accent, XAlign = Enum.TextXAlignment.Center, Position = UDim2.new(0, 0, 0, 12), Size = UDim2.new(1, 0, 0, 18) })
	countdownNumber = UIKit.label({ Parent = countdownPanel, Text = "5", Font = Theme.Fonts.Title, TextSize = 50, Color = C.Text, XAlign = Enum.TextXAlignment.Center, Position = UDim2.new(0, 0, 0, 34), Size = UDim2.new(1, 0, 0, 64) })
end

local function setPips(count, capacity)
	if #pips ~= capacity then
		for _, p in ipairs(pips) do
			p:Destroy()
		end
		pips = {}
		for i = 1, capacity do
			local p = UIKit.create("Frame", { Parent = pipRow, BorderSizePixel = 0, AnchorPoint = Vector2.new(1, 0), Position = UDim2.new(1, -(capacity - i) * 18, 0, 0), Size = UDim2.new(0, 12, 0, 12) })
			UIKit.corner(p, 6)
			UIKit.stroke(p, C.Stroke, 1, 0.2)
			table.insert(pips, p)
		end
	end
	for i, p in ipairs(pips) do
		p.BackgroundColor3 = i <= count and C.Accent or C.Background
		p.BackgroundTransparency = i <= count and 0 or 0.3
	end
end

local function render(view)
	titleLabel.Text = view.Title
	countLabel.Text = view.Count .. " / " .. view.Capacity
	unitLabel.Text = view.Capacity == 1 and "EXPLORER" or "EXPLORERS"
	setPips(view.Count, view.Capacity)
	if view.IsLeader then
		leaderLabel.Text = '<font color="#E2A860">◆</font>  You lead this expedition'
	else
		leaderLabel.Text = '<font color="#E2A860">◆</font>  Leader: ' .. view.LeaderName
	end
	local departing = view.State == "Departing"
	if departing then
		statusLabel.Text = "DEPARTING IN " .. view.Countdown
		statusLabel.TextColor3 = C.Accent
	elseif view.IsLeader then
		statusLabel.Text = view.Count < view.Capacity and "READY WHEN YOU ARE" or "CREW COMPLETE  ·  READY"
		statusLabel.TextColor3 = C.Text
	else
		statusLabel.Text = "WAITING FOR EXPEDITION LEADER"
		statusLabel.TextColor3 = C.TextMuted
	end
	startButton.Visible = view.IsLeader and not departing
	if startButton.Visible then
		leaveButton.Size = UDim2.new(0, 98, 0, Theme.ButtonHeight)
		leaveButton.Position = UDim2.new(1, -116, 1, -60)
		leaveButton.Text = "LEAVE"
	else
		leaveButton.Size = UDim2.new(1, -36, 0, Theme.ButtonHeight)
		leaveButton.Position = UDim2.new(0, 18, 1, -60)
		leaveButton.Text = "LEAVE EXPEDITION"
	end

	if departing then
		if not countdownPanel.Visible or countdownPanel.GroupTransparency > 0.5 then
			UIKit.show(countdownPanel)
		end
		if lastCountdown ~= view.Countdown then
			lastCountdown = view.Countdown
			countdownNumber.Text = tostring(view.Countdown)
			countdownNumber.TextTransparency = 0.8
			countdownNumber.TextSize = 58
			UIKit.tween(countdownNumber, 0.35, { TextTransparency = 0, TextSize = 50 })
		end
	elseif countdownPanel.Visible then
		lastCountdown = nil
		UIKit.hide(countdownPanel)
	end
end

local function onState(view)
	if view == nil then
		current = nil
		lastCountdown = nil
		if card.Visible then
			UIKit.hide(card)
		end
		if countdownPanel.Visible then
			UIKit.hide(countdownPanel)
		end
		return
	end
	local wasHidden = current == nil
	current = view
	render(view)
	if wasHidden then
		UIKit.show(card)
		controllers.InterfaceController.DismissHint()
	end
end

local function onFeedback(_, kind)
	if kind == "Tick" then
		play("CountdownTick")
	elseif kind == "CountdownStart" then
		play("CountdownTick")
	elseif kind == "Depart" then
		play("Departure")
	end
end

function ExpeditionController.Init(registry)
	controllers = registry
	requestRemote = Remotes.Get("ExpeditionRequest")
	local gui = UIKit.screen("LastTrainExpedition", 20)
	buildCard(gui)
	buildCountdown(gui)
	Remotes.Get("ExpeditionState").OnClientEvent:Connect(onState)
	Remotes.Get("CabinFeedback").OnClientEvent:Connect(onFeedback)
end

return ExpeditionController
