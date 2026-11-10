--[[
	ClockController — drives the station clock's hands (local time).
	Updates once per second, and only while the player is in the terminal.
	Now and then the second hand slips back a tick with a quiet mechanical
	sound. It is never explained.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage.Shared.Config.GameConfig)

local ClockController = {}

local controllers
local faces = {} -- { { hour = Frame, minute = Frame, second = Frame } }
local drum = nil

local function collect()
	local lobby = workspace:WaitForChild("Lobby", 30)
	local clock = lobby and lobby:WaitForChild("StationClock", 10)
	if not clock then
		return
	end
	drum = clock:FindFirstChild("Drum")
	for _, d in ipairs(clock:GetDescendants()) do
		if d:IsA("SurfaceGui") then
			local face = { hour = d:FindFirstChild("HourHand"), minute = d:FindFirstChild("MinuteHand"), second = d:FindFirstChild("SecondHand") }
			if face.hour and face.minute and face.second then
				table.insert(faces, face)
			end
		end
	end
end

local function setHands(h, m, s)
	for _, face in ipairs(faces) do
		face.hour.Rotation = ((h % 12) + m / 60) * 30
		face.minute.Rotation = (m + s / 60) * 6
		face.second.Rotation = s * 6
	end
end

function ClockController.Init(registry)
	controllers = registry
end

function ClockController.Start()
	collect()
	if #faces == 0 then
		return
	end
	while true do
		task.wait(1)
		if controllers.ZoneController.GetZone() ~= "Train" then
			local t = os.date("*t")
			local s = t.sec
			if math.random() < GameConfig.Clock.StutterChance then
				s = (s + 59) % 60
				if drum then
					controllers.SoundController.PlayAt("ClockMechanism", drum.Position)
				end
			end
			setHands(t.hour, t.min, s)
		end
	end
end

return ClockController
