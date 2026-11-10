--[[
	CabinVisualsController — makes the cabins (and the departures board) react
	to server state. Purely visual; the server's cabin attributes are the
	single source of truth.

	Per state:            Idle        Boarding        Departing / Departed
	  doors               open        open            close
	  semaphore arm       level       raised          high
	  signal lamp         dark        amber           green
	  capacity bulbs      one bulb lit per explorer
	  counter plate       0 / N       n / N           DEPARTING 5..1
	A join (Pulse++) flashes the newest bulb and plays one positional click.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local CabinDefinitions = require(ReplicatedStorage.Shared.Config.CabinDefinitions)

local CabinVisualsController = {}

local controllers
local BULB_ON = Color3.fromRGB(255, 196, 128)
local BULB_OFF = Color3.fromRGB(58, 52, 46)
local LAMP_AMBER = Color3.fromRGB(255, 176, 92)
local LAMP_GREEN = Color3.fromRGB(150, 214, 150)
local DOOR_TWEEN = TweenInfo.new(0.9, Enum.EasingStyle.Quad, Enum.EasingDirection.InOut)
local ARM_TWEEN = TweenInfo.new(0.7, Enum.EasingStyle.Back, Enum.EasingDirection.Out, 0, false, 0)

local function statusText(state, count, capacity, countdown)
	if state == "Departing" then
		return "DEPARTING " .. tostring(countdown)
	elseif state == "Departed" then
		return "DEPARTED"
	elseif count >= capacity then
		return "FULL"
	elseif count > 0 then
		return "BOARDING"
	end
	return "AVAILABLE"
end

-- A small amber diamond over the current leader's head while a cabin is
-- boarding or departing: subtle, but everyone nearby can tell who leads.
local function leaderBadge(model)
	local badge = Instance.new("BillboardGui")
	badge.Name = "LeaderBadge_" .. tostring(model.Name)
	badge.Size = UDim2.new(0, 16, 0, 16)
	badge.StudsOffset = Vector3.new(0, 2.3, 0)
	badge.MaxDistance = 60
	badge.LightInfluence = 0
	badge.AlwaysOnTop = false
	badge.ResetOnSpawn = false
	local diamond = Instance.new("Frame")
	diamond.AnchorPoint = Vector2.new(0.5, 0.5)
	diamond.Position = UDim2.new(0.5, 0, 0.5, 0)
	diamond.Size = UDim2.new(0, 9, 0, 9)
	diamond.Rotation = 45
	diamond.BorderSizePixel = 0
	diamond.BackgroundColor3 = Color3.fromRGB(226, 168, 96)
	diamond.Parent = badge
	badge.Parent = Players.LocalPlayer:WaitForChild("PlayerGui")
	local function update()
		local userId = model:GetAttribute("LeaderUserId") or 0
		local state = model:GetAttribute("State")
		local leader = nil
		if userId ~= 0 and (state == "Boarding" or state == "Departing") then
			leader = Players:GetPlayerByUserId(userId)
		end
		local head = leader and leader.Character and leader.Character:FindFirstChild("Head")
		badge.Adornee = head
		badge.Enabled = head ~= nil
	end
	model:GetAttributeChangedSignal("LeaderUserId"):Connect(update)
	model:GetAttributeChangedSignal("State"):Connect(update)
	update()
end

local function setBulb(bulb, on)
	bulb.Material = on and Enum.Material.Neon or Enum.Material.Glass
	bulb.Color = on and BULB_ON or BULB_OFF
end

local function bindCabin(model, boardLabels)
	local capacity = model:GetAttribute("Capacity") or 1
	local cabinId = model:GetAttribute("CabinId")
	local display = model:FindFirstChild("CounterPlate") and model.CounterPlate:FindFirstChild("Display")
	local countLabel = display and display:FindFirstChild("Count")
	local statusLabel = display and display:FindFirstChild("Status")
	local bulbs = {}
	local bulbFolder = model:FindFirstChild("CapacityBulbs")
	for i = 1, capacity do
		bulbs[i] = bulbFolder and bulbFolder:FindFirstChild("Bulb" .. i)
	end
	local semaphore = model:FindFirstChild("Semaphore")
	local arm = semaphore and semaphore:FindFirstChild("Arm")
	local signalLamp = semaphore and semaphore:FindFirstChild("SignalLamp")
	local doors = { model:FindFirstChild("DoorLeft"), model:FindFirstChild("DoorRight") }
	local light = model:FindFirstChild("CabinLight") and model.CabinLight:FindFirstChildOfClass("PointLight")
	local baseBrightness = light and light.Brightness or 1
	local lastState = nil
	local lastPulse = model:GetAttribute("Pulse") or 0

	local function apply()
		local state = model:GetAttribute("State") or "Idle"
		local count = model:GetAttribute("Count") or 0
		local countdown = model:GetAttribute("Countdown") or 0
		local text = statusText(state, count, capacity, countdown)
		if countLabel then
			countLabel.Text = count .. " / " .. capacity
		end
		if statusLabel then
			statusLabel.Text = text
		end
		if boardLabels[cabinId] then
			boardLabels[cabinId].Text = text
		end
		for i, bulb in ipairs(bulbs) do
			if bulb then
				setBulb(bulb, i <= count)
			end
		end
		if state ~= lastState then
			local closed = state == "Departing" or state == "Departed"
			local wasClosed = lastState == "Departing" or lastState == "Departed"
			for _, door in ipairs(doors) do
				if door then
					local target = door:GetAttribute(closed and "ClosedCFrame" or "OpenCFrame")
					if target then
						if lastState == nil then
							door.CFrame = target
						else
							TweenService:Create(door, DOOR_TWEEN, { CFrame = target }):Play()
						end
					end
				end
			end
			if lastState ~= nil and closed ~= wasClosed and doors[1] then
				controllers.SoundController.PlayAt("DoorClose", doors[1].Position)
			end
			if arm then
				local key = (state == "Idle") and "CF_Idle" or (state == "Boarding" and "CF_Boarding" or "CF_Departing")
				local target = arm:GetAttribute(key)
				if target then
					TweenService:Create(arm, ARM_TWEEN, { CFrame = target }):Play()
				end
			end
			if signalLamp then
				if state == "Idle" then
					signalLamp.Material = Enum.Material.Glass
					signalLamp.Color = BULB_OFF
				else
					signalLamp.Material = Enum.Material.Neon
					signalLamp.Color = (state == "Boarding") and LAMP_AMBER or LAMP_GREEN
				end
			end
			if light then
				TweenService:Create(light, TweenInfo.new(0.8), { Brightness = closed and baseBrightness * 1.35 or baseBrightness, Color = closed and Color3.fromRGB(255, 212, 160) or Color3.fromRGB(255, 176, 104) }):Play()
			end
			lastState = state
		end
	end

	local function onPulse()
		local pulse = model:GetAttribute("Pulse") or 0
		if pulse == lastPulse then
			return
		end
		lastPulse = pulse
		local count = model:GetAttribute("Count") or 0
		local bulb = bulbs[math.clamp(count, 1, capacity)]
		if bulb then
			bulb.Color = Color3.fromRGB(255, 236, 200)
			TweenService:Create(bulb, TweenInfo.new(0.6), { Color = BULB_ON }):Play()
			controllers.SoundController.PlayAt("CabinJoin", bulb.Position)
		end
	end

	for _, attr in ipairs({ "State", "Count", "Countdown" }) do
		model:GetAttributeChangedSignal(attr):Connect(apply)
	end
	model:GetAttributeChangedSignal("Pulse"):Connect(onPulse)
	apply()
	leaderBadge(model)
end

function CabinVisualsController.Init(registry)
	controllers = registry
end

function CabinVisualsController.Start()
	local boardLabels = {}
	local lobby = workspace:WaitForChild("Lobby", 30)
	local board = lobby and lobby:FindFirstChild("InformationBoard")
	local panel = board and board:FindFirstChild("BoardPanel")
	if panel then
		for _, gui in ipairs(panel:GetChildren()) do
			if gui:IsA("SurfaceGui") then
				for _, def in ipairs(CabinDefinitions) do
					local label = gui:FindFirstChild("Status_" .. def.Id)
					if label then
						boardLabels[def.Id] = label
					end
				end
			end
		end
	end
	local folder = workspace:WaitForChild("ExpeditionCabins", 30)
	if not folder then
		warn("[CabinVisuals] No ExpeditionCabins folder")
		return
	end
	for _, def in ipairs(CabinDefinitions) do
		local model = folder:WaitForChild(def.Id, 10)
		if model then
			bindCabin(model, boardLabels)
		end
	end
end

return CabinVisualsController
