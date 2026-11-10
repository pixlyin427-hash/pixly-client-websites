--[[
	SoundController — every sound on the client goes through here.

	* Three SoundGroups (Ambience / Effects / Interface) whose volumes the
	  Settings panel controls.
	* Zone beds (Loop2D) cross-fade when the player moves between the
	  Terminal and the Train; nothing ever stacks or duplicates.
	* Positional emitters are created once per tagged Attachment.
	* Random one-shots share a single 1 Hz scheduler.
	* Any sound whose Id is "" in AudioConfig is skipped silently.
]]

local CollectionService = game:GetService("CollectionService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local AudioConfig = require(ReplicatedStorage.Shared.Config.AudioConfig)

local SoundController = {}

local groups = {}
local levels = { Ambience = 1, Effects = 1, Interface = 1 }
local oneShots = {} -- key -> Sound (2D)
local zoneBeds = {} -- zone -> { Sound }
local randoms = {} -- { key, def, sound, nextAt, zone }
local currentZone = nil

local function hasId(def)
	return def and type(def.Id) == "string" and def.Id ~= ""
end

local function makeSound(key, def, parent)
	local s = Instance.new("Sound")
	s.Name = key
	s.SoundId = def.Id
	s.Volume = def.Volume or 0.5
	s.Looped = def.Looped == true or def.Kind == "Loop2D"
	s.SoundGroup = groups[def.Group or "Effects"]
	if def.MaxDistance then
		s.RollOffMode = Enum.RollOffMode.InverseTapered
		s.RollOffMinDistance = 6
		s.RollOffMaxDistance = def.MaxDistance
	end
	s.Parent = parent
	return s
end

local function attachEmitter(attachment)
	if not attachment:IsA("Attachment") or attachment:FindFirstChildOfClass("Sound") then
		return
	end
	local key = attachment:GetAttribute("SoundKey")
	local def = AudioConfig.Sounds[key]
	if not hasId(def) then
		return
	end
	local s = makeSound(key, def, attachment)
	if s.Looped then
		s:Play()
	elseif def.Interval then
		table.insert(randoms, { def = def, sound = s, nextAt = os.clock() + math.random(def.Interval[1], def.Interval[2]) })
	end
end

function SoundController.Init()
	for name, volume in pairs(AudioConfig.Groups) do
		local g = SoundService:FindFirstChild("LT_" .. name) or Instance.new("SoundGroup")
		g.Name = "LT_" .. name
		g.Volume = volume
		g.Parent = SoundService
		groups[name] = g
	end
	local folder = Instance.new("Folder")
	folder.Name = "LastTrainSounds"
	folder.Parent = SoundService
	for key, def in pairs(AudioConfig.Sounds) do
		if hasId(def) then
			if def.Kind == "Loop2D" then
				local s = makeSound(key, def, folder)
				s:SetAttribute("TargetVolume", s.Volume)
				s.Volume = 0
				zoneBeds[def.Zone] = zoneBeds[def.Zone] or {}
				table.insert(zoneBeds[def.Zone], s)
			elseif def.Kind == "Random2D" then
				local s = makeSound(key, def, folder)
				table.insert(randoms, { def = def, sound = s, zone = def.Zone, nextAt = os.clock() + math.random(def.Interval[1], def.Interval[2]) })
			elseif def.Kind == "OneShot" then
				oneShots[key] = makeSound(key, def, folder)
			end
		end
	end
	for _, a in ipairs(CollectionService:GetTagged("SoundEmitter")) do
		attachEmitter(a)
	end
	CollectionService:GetInstanceAddedSignal("SoundEmitter"):Connect(attachEmitter)
end

function SoundController.Start()
	while true do
		task.wait(1)
		local now = os.clock()
		for _, r in ipairs(randoms) do
			if now >= r.nextAt then
				r.nextAt = now + math.random(r.def.Interval[1], r.def.Interval[2])
				if r.zone == nil or r.zone == currentZone then
					r.sound:Play()
				end
			end
		end
	end
end

-- 2D one-shot (UI, countdown, departure).
function SoundController.Play(key)
	local s = oneShots[key]
	if s then
		s.TimePosition = 0
		s:Play()
	end
end

-- Positional one-shot at a world position (cabin joins, doors, locked door).
function SoundController.PlayAt(key, position)
	local def = AudioConfig.Sounds[key]
	if not hasId(def) then
		return
	end
	local a = Instance.new("Attachment")
	a.WorldPosition = position
	a.Parent = workspace.Terrain
	local s = makeSound(key, def, a)
	s.RollOffMode = Enum.RollOffMode.InverseTapered
	s.RollOffMinDistance = 8
	s.RollOffMaxDistance = def.MaxDistance or 60
	s:Play()
	Debris:AddItem(a, 8)
end

function SoundController.SetZone(zone)
	if zone == currentZone then
		return
	end
	currentZone = zone
	local info = TweenInfo.new(1.6, Enum.EasingStyle.Sine, Enum.EasingDirection.InOut)
	for bedZone, list in pairs(zoneBeds) do
		for _, s in ipairs(list) do
			if bedZone == zone then
				if not s.IsPlaying then
					s:Play()
				end
				TweenService:Create(s, info, { Volume = s:GetAttribute("TargetVolume") }):Play()
			else
				TweenService:Create(s, info, { Volume = 0 }):Play()
			end
		end
	end
	SoundService.AmbientReverb = zone == "Train" and Enum.ReverbType.LivingRoom or Enum.ReverbType.StoneRoom
end

-- level: 0..1 multiplier set from the Settings panel.
function SoundController.SetLevel(groupName, level)
	levels[groupName] = level
	local g = groups[groupName]
	if g then
		g.Volume = (AudioConfig.Groups[groupName] or 1) * level
	end
end

function SoundController.GetLevel(groupName)
	return levels[groupName] or 1
end

return SoundController
