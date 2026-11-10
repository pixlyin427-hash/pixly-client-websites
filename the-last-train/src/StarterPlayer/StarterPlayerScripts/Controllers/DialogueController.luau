--[[
	DialogueController — short NPC conversations and "inspect" lines.

	Any ProximityPrompt with attribute DialogueId = "<key>" (see
	Shared.Config.DialogueData) opens this box. Tap / click the box to advance.
	Walking away closes it. Everything is local to the player: a conversation
	never affects anyone else.
]]

local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local UIKit = require(script.Parent.Parent:WaitForChild("UI"):WaitForChild("UIKit"))
local DialogueData = require(ReplicatedStorage.Shared.Config.DialogueData)

local Theme = UIKit.Theme
local C = Theme.Colors
local player = Players.LocalPlayer

local DialogueController = {}

local controllers
local box, speakerLabel, bodyLabel, hintLabel
local active = nil -- { lines, index, prompt, anchor }
local talked = {}
local typeValue

local CLOSE_DISTANCE = 16

local function typeLine(text)
	bodyLabel.Text = text
	bodyLabel.MaxVisibleGraphemes = 0
	typeValue.Value = 0
	local duration = math.clamp(#text / 48, 0.25, 1.6)
	TweenService:Create(typeValue, TweenInfo.new(duration, Enum.EasingStyle.Linear), { Value = #text }):Play()
end

local function close()
	if not active then
		return
	end
	if active.prompt then
		active.prompt.Enabled = true
	end
	active = nil
	UIKit.hide(box)
end

local function advance()
	if not active then
		return
	end
	local line = active.lines[active.index]
	if bodyLabel.MaxVisibleGraphemes >= 0 and bodyLabel.MaxVisibleGraphemes < #line then
		bodyLabel.MaxVisibleGraphemes = -1 -- finish the line first
		return
	end
	active.index = active.index + 1
	if active.index > #active.lines then
		close()
		return
	end
	controllers.SoundController.Play("UIClick")
	typeLine(active.lines[active.index])
	hintLabel.Text = active.index == #active.lines and "Tap to close" or "Tap to continue"
end

local function open(id, prompt)
	local data = DialogueData[id]
	if not data then
		return
	end
	local lines = data.First
	if talked[id] and data.Repeat then
		lines = data.Repeat
	end
	talked[id] = true
	if active and active.prompt then
		active.prompt.Enabled = true
	end
	active = { lines = lines, index = 1, prompt = prompt, anchor = prompt.Parent }
	prompt.Enabled = false
	speakerLabel.Text = data.Speaker or ""
	speakerLabel.Visible = (data.Speaker or "") ~= ""
	hintLabel.Text = #lines == 1 and "Tap to close" or "Tap to continue"
	typeLine(lines[1])
	UIKit.show(box)
	local soundKey = prompt.Parent and prompt.Parent:GetAttribute("SoundKey")
	if soundKey and prompt.Parent:IsA("BasePart") then
		controllers.SoundController.PlayAt(soundKey, prompt.Parent.Position)
	end
end

function DialogueController.Init(registry)
	controllers = registry
	local gui = UIKit.screen("LastTrainDialogue", 30)
	box = UIKit.panel({
		Name = "DialogueBox",
		Parent = gui,
		Size = UDim2.new(0, 520, 0, 128),
		Position = UDim2.new(0.5, 0, 1, -24),
		AnchorPoint = Vector2.new(0.5, 1),
		Corner = 10,
	})
	local hit = UIKit.create("TextButton", { Parent = box, Text = "", BackgroundTransparency = 1, Size = UDim2.new(1, 0, 1, 0), ZIndex = 5 })
	hit.Activated:Connect(advance)
	speakerLabel = UIKit.label({ Parent = box, Font = Theme.Fonts.Label, TextSize = 14, Color = C.Accent, Position = UDim2.new(0, 22, 0, 14), Size = UDim2.new(1, -44, 0, 18) })
	bodyLabel = UIKit.label({ Parent = box, Font = Theme.Fonts.Body, TextSize = 19, Color = C.Text, Wrapped = true, YAlign = Enum.TextYAlignment.Top, Position = UDim2.new(0, 22, 0, 40), Size = UDim2.new(1, -44, 0, 54) })
	hintLabel = UIKit.label({ Parent = box, Font = Theme.Fonts.Label, TextSize = 12, Color = C.TextFaint, XAlign = Enum.TextXAlignment.Right, AnchorPoint = Vector2.new(1, 1), Position = UDim2.new(1, -18, 1, -10), Size = UDim2.new(0, 160, 0, 16) })
	typeValue = Instance.new("NumberValue")
	typeValue.Changed:Connect(function(v)
		if bodyLabel.MaxVisibleGraphemes ~= -1 then
			bodyLabel.MaxVisibleGraphemes = math.floor(v)
			if math.floor(v) >= #bodyLabel.Text then
				bodyLabel.MaxVisibleGraphemes = -1
			end
		end
	end)

	ProximityPromptService.PromptTriggered:Connect(function(prompt, who)
		if who ~= player then
			return
		end
		local id = prompt:GetAttribute("DialogueId")
		if id then
			open(id, prompt)
		end
	end)
end

function DialogueController.Start()
	-- Close the box when the player walks away (checked twice a second, only while open).
	while true do
		task.wait(0.5)
		if active and active.anchor and active.anchor:IsA("BasePart") then
			local character = player.Character
			local root = character and character:FindFirstChild("HumanoidRootPart")
			if not root or (root.Position - active.anchor.Position).Magnitude > CLOSE_DISTANCE then
				close()
			end
		end
	end
end

return DialogueController
