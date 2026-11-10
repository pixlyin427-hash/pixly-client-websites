--[[
	ZoneController — knows whether the local player is in the Terminal or on
	the Train (checked twice a second against parts tagged "ZoneBounds"), and
	switches what depends on it:
	  * lighting preset (smooth blend, client-only)
	  * ambience bed + reverb (SoundController)
	  * camera max zoom (tighter inside carriages to avoid wall clipping)
	  * scenery scrolling past the train windows (only while aboard)
]]

local CollectionService = game:GetService("CollectionService")
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TweenService = game:GetService("TweenService")

local GameConfig = require(ReplicatedStorage.Shared.Config.GameConfig)
local LightingPresets = require(ReplicatedStorage.Shared.Config.LightingPresets)

local player = Players.LocalPlayer

local ZoneController = {}

local controllers
local currentZone = nil
local scrollConnection = nil
local layers = nil

local function insideBox(part, position)
	local rel = part.CFrame:PointToObjectSpace(position)
	local half = part.Size / 2
	return math.abs(rel.X) <= half.X and math.abs(rel.Y) <= half.Y and math.abs(rel.Z) <= half.Z
end

local function blendLighting(presetName)
	local preset = LightingPresets[presetName]
	if not preset then
		return
	end
	local info = TweenInfo.new(2.0, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	TweenService:Create(Lighting, info, preset.Lighting):Play()
	local atmosphere = Lighting:FindFirstChild("LastTrainAtmosphere")
	if atmosphere then
		TweenService:Create(atmosphere, info, preset.Atmosphere):Play()
	end
	local bloom = Lighting:FindFirstChild("LastTrainBloom")
	if bloom then
		TweenService:Create(bloom, info, preset.Bloom):Play()
	end
	local cc = Lighting:FindFirstChild("LastTrainColor")
	if cc then
		TweenService:Create(cc, info, preset.ColorCorrection):Play()
	end
end

-- Scenery scrolling -------------------------------------------------------------------
local function collectLayers()
	local zone = workspace:FindFirstChild("ExpeditionTrain")
	local scenery = zone and zone:FindFirstChild("Scenery")
	if not scenery then
		return nil
	end
	local result = {}
	local speeds = { Near = GameConfig.Train.ScenerySpeedNear, Mid = GameConfig.Train.ScenerySpeedMid }
	for _, folder in ipairs(scenery:GetChildren()) do
		local layerName = folder:GetAttribute("Layer")
		local speed = layerName and speeds[layerName]
		if speed then
			local z0 = folder:GetAttribute("WrapZ0")
			local length = folder:GetAttribute("WrapLength") or GameConfig.Train.SceneryWrapLength
			local parts, cframes = {}, {}
			for _, d in ipairs(folder:GetDescendants()) do
				if d:IsA("BasePart") then
					table.insert(parts, d)
					table.insert(cframes, d.CFrame)
				end
			end
			if z0 == nil then
				z0 = math.huge
				for _, cf in ipairs(cframes) do
					z0 = math.min(z0, cf.Position.Z)
				end
				z0 = z0 - 10
			end
			table.insert(result, { parts = parts, cframes = cframes, speed = speed, z0 = z0, length = length })
		end
	end
	return result
end

local function startScenery()
	if scrollConnection then
		return
	end
	layers = layers or collectLayers()
	if not layers then
		return
	end
	scrollConnection = RunService.Heartbeat:Connect(function(dt)
		for _, layer in ipairs(layers) do
			local dz = layer.speed * dt
			local limit = layer.z0 + layer.length
			local cframes = layer.cframes
			for i = 1, #cframes do
				local cf = cframes[i] + Vector3.new(0, 0, dz)
				if cf.Position.Z > limit then
					cf = cf - Vector3.new(0, 0, layer.length)
				end
				cframes[i] = cf
			end
			workspace:BulkMoveTo(layer.parts, cframes, Enum.BulkMoveMode.FireCFrameChanged)
		end
	end)
end

local function stopScenery()
	if scrollConnection then
		scrollConnection:Disconnect()
		scrollConnection = nil
	end
end

-- Zone switching ------------------------------------------------------------------------
local function setZone(zone)
	if zone == currentZone then
		return
	end
	currentZone = zone
	blendLighting(zone)
	controllers.SoundController.SetZone(zone)
	player.CameraMaxZoomDistance = zone == "Train" and GameConfig.Camera.TrainMaxZoom or GameConfig.Camera.TerminalMaxZoom
	if zone == "Train" then
		startScenery()
	else
		stopScenery()
	end
end

function ZoneController.GetZone()
	return currentZone
end

function ZoneController.Init(registry)
	controllers = registry
end

function ZoneController.Start()
	setZone("Terminal")
	while true do
		task.wait(0.5)
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if root then
			local zone = "Terminal"
			for _, bounds in ipairs(CollectionService:GetTagged("ZoneBounds")) do
				if bounds:GetAttribute("Zone") == "Train" and insideBox(bounds, root.Position) then
					zone = "Train"
					break
				end
			end
			setZone(zone)
		end
	end
end

return ZoneController
