--[[
	TrainService (server authority)
	Receives departed expedition groups from ExpeditionService and moves them
	aboard THE LAST TRAIN (Workspace.ExpeditionTrain), keeping membership.

	Flow:  BoardExpedition(members) -> Transition "Out" (client fades to black)
	       -> after the fade, each member is placed on a free spawn point in
	       the Boarding Carriage -> Transition "In" -> crew HUD (TrainState).

	PHASE 2 LIMITATION (documented on purpose):
	  There is ONE physical train per server. If two expeditions depart in
	  the same server, both groups ride the same train. Each group keeps its
	  own membership, HUD count and leader-less crew record, and nothing one
	  group does changes the other group's state. Per-group train instances
	  (or reserved servers) are the planned next step.

	Leaving the train (development path): the Boarding Carriage's exit door
	prompt, or MENU > Return to Terminal.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local CollectionService = game:GetService("CollectionService")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local GameConfig = require(Shared.Config.GameConfig)
local Remotes = require(Shared.Modules.Remotes)

local TRANSITION = GameConfig.Transition
local MIN_SPAWN_GAP = 2.6

local TrainService = {}

local expeditions = {} -- [id] = { Id, Title, Capacity, CabinId, Members = { Player } }
local playerExpedition = {} -- [Player] = expedition record
local nextId = 0
local spawnPoints = {}
local returnPoint = nil
local remotes = {}

local function rootOf(player)
	local character = player.Character
	return character and character:FindFirstChild("HumanoidRootPart")
end

local function crewView(rec)
	return {
		Title = rec.Title,
		CrewCount = #rec.Members,
		CrewMax = rec.Capacity,
		Status = "PREPARING ROUTE",
	}
end

local function sendCrew(rec)
	for _, member in ipairs(rec.Members) do
		remotes.TrainState:FireClient(member, crewView(rec))
	end
end

local function removeMember(player)
	local rec = playerExpedition[player]
	if not rec then
		return nil
	end
	playerExpedition[player] = nil
	for i, member in ipairs(rec.Members) do
		if member == player then
			table.remove(rec.Members, i)
			break
		end
	end
	if #rec.Members == 0 then
		expeditions[rec.Id] = nil
	else
		sendCrew(rec)
	end
	return rec
end

-- Choose the first spawn point no other character is standing on.
local function pickSpawn(reserved)
	local occupied = {}
	for _, pos in ipairs(reserved) do
		table.insert(occupied, pos)
	end
	for _, other in ipairs(Players:GetPlayers()) do
		local root = rootOf(other)
		if root then
			table.insert(occupied, root.Position)
		end
	end
	for _, spawn in ipairs(spawnPoints) do
		local free = true
		for _, pos in ipairs(occupied) do
			local flat = Vector3.new(pos.X - spawn.Position.X, 0, pos.Z - spawn.Position.Z)
			if flat.Magnitude < MIN_SPAWN_GAP and math.abs(pos.Y - spawn.Position.Y) < 6 then
				free = false
				break
			end
		end
		if free then
			return spawn.CFrame
		end
	end
	-- Every point taken (more than 8 riders): stagger along the aisle.
	local n = #reserved
	return spawnPoints[1].CFrame * CFrame.new(((n % 3) - 1) * 2.4, 0, 3 + math.floor(n / 3) * 2.4)
end

local function placeAboard(player, reserved)
	local character = player.Character
	local root = rootOf(player)
	if not (character and root) then
		return false
	end
	local cf = pickSpawn(reserved)
	character:PivotTo(cf + Vector3.new(0, 3, 0))
	root.AssemblyLinearVelocity = Vector3.zero
	table.insert(reserved, cf.Position)
	return true
end

function TrainService.IsAboard(player)
	return playerExpedition[player] ~= nil
end

function TrainService.GetExpedition(player)
	return playerExpedition[player]
end

function TrainService.BoardExpedition(members, info)
	nextId = nextId + 1
	local rec = { Id = nextId, Title = info.Title, Capacity = info.Capacity, CabinId = info.CabinId, Members = {} }
	for _, player in ipairs(members) do
		if player.Parent then
			table.insert(rec.Members, player)
			playerExpedition[player] = rec
		end
	end
	if #rec.Members == 0 then
		return nil
	end
	expeditions[rec.Id] = rec
	for _, player in ipairs(rec.Members) do
		remotes.Transition:FireClient(player, "Out", "ALL ABOARD", info.Title)
	end
	task.delay(TRANSITION.FadeOutTime + TRANSITION.HoldTime * 0.5, function()
		local reserved = {}
		for _, player in ipairs(rec.Members) do
			placeAboard(player, reserved)
		end
		task.delay(TRANSITION.HoldTime * 0.5, function()
			for _, player in ipairs(rec.Members) do
				remotes.Transition:FireClient(player, "In", "THE LAST TRAIN", "BOARDING CARRIAGE")
			end
			sendCrew(rec)
		end)
	end)
	return rec
end

function TrainService.ReturnToTerminal(player)
	if not removeMember(player) then
		return false
	end
	remotes.Transition:FireClient(player, "Out", "THE TERMINAL", "")
	task.delay(TRANSITION.FadeOutTime + TRANSITION.HoldTime * 0.5, function()
		if not player.Parent then
			return
		end
		local character = player.Character
		if character and returnPoint then
			local n = #Players:GetPlayers()
			character:PivotTo(returnPoint.CFrame * CFrame.new(((n % 3) - 1) * 3, 3, 0))
		end
		remotes.TrainState:FireClient(player, nil)
		task.delay(TRANSITION.HoldTime * 0.5, function()
			if player.Parent then
				remotes.Transition:FireClient(player, "In", "EXPEDITION TERMINAL", "")
			end
		end)
	end)
	return true
end

local function hookCharacter(player)
	player.CharacterAdded:Connect(function(character)
		if not playerExpedition[player] then
			return
		end
		-- Respawned while aboard: bring them back to the train, not the lobby.
		task.spawn(function()
			local root = character:WaitForChild("HumanoidRootPart", 10)
			if root and playerExpedition[player] then
				placeAboard(player, {})
				remotes.TrainState:FireClient(player, crewView(playerExpedition[player]))
			end
		end)
	end)
end

function TrainService.Init()
	for _, name in ipairs({ "Transition", "TrainState", "TrainRequest" }) do
		remotes[name] = Remotes.Get(name)
	end
	local zone = workspace:WaitForChild("ExpeditionTrain")
	local train = zone:WaitForChild("TheLastTrain")
	local spawns = train:WaitForChild("BoardingCarriage"):WaitForChild("BoardingSpawns")
	for i = 1, 16 do
		local p = spawns:FindFirstChild("Spawn" .. i)
		if p then
			table.insert(spawnPoints, p)
		end
	end
	assert(#spawnPoints > 0, "TrainService: no boarding spawn points")
	returnPoint = workspace:WaitForChild("Lobby"):WaitForChild("Spawn"):WaitForChild("ReturnPoint")

	for _, door in ipairs(CollectionService:GetTagged("ReturnToTerminal")) do
		local prompt = door:FindFirstChildOfClass("ProximityPrompt")
		if prompt then
			prompt.Triggered:Connect(function(player)
				TrainService.ReturnToTerminal(player)
			end)
		end
	end
	remotes.TrainRequest.OnServerEvent:Connect(function(player, action)
		if action == "ReturnToTerminal" then
			TrainService.ReturnToTerminal(player)
		end
	end)

	Players.PlayerAdded:Connect(hookCharacter)
	for _, player in ipairs(Players:GetPlayers()) do
		hookCharacter(player)
	end
	Players.PlayerRemoving:Connect(removeMember)
end

return TrainService
