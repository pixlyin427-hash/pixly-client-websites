--[[
	ExpeditionService (server authority)
	Physical expedition cabins: walk in to join, walk out (or press Leave) to
	leave, first explorer leads, leader starts, countdown, departure.

	Design notes
	  * Membership is decided ONLY here. Clients can send just two requests:
	    "Start" and "Leave"; both are validated against server state.
	  * Who stands in which cabin is checked on a fixed interval (default 5x per
	    second) with a cheap point-in-box test. This is more reliable than
	    Touched/TouchEnded, needs no physics queries and has one loop total.
	  * A player can belong to at most one cabin (playerCabin map) and is
	    ignored entirely while aboard the train.
	  * Countdowns are timestamps checked by the same loop: no extra threads,
	    nothing to cancel — resetting a cabin simply clears its timestamp.
	  * Poll(now) is public so the offline tests can drive time precisely.
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("Shared")
local GameConfig = require(Shared.Config.GameConfig)
local CabinDefinitions = require(Shared.Config.CabinDefinitions)
local ExpeditionGroup = require(Shared.Modules.ExpeditionGroup)
local Remotes = require(Shared.Modules.Remotes)

local CFG = GameConfig.Expedition

local ExpeditionService = {}
ExpeditionService.Clock = os.clock

local cabins = {} -- array of cabin records
local playerCabin = {} -- [Player] = cabin record
local cooldownUntil = {} -- [Player] = time before which joining is ignored
local outsideSince = {} -- [Player] = time first seen outside own cabin
local lastNotice = {} -- [Player] = { cabin = record, at = time }
local lastRequest = {} -- [Player] = time of last accepted remote request
local remotes = {}
local trainService = nil

local NOTICE_TEXT = {
	Full = "This cabin is full.",
	Locked = "This expedition is departing.",
}

-- HELPERS -------------------------------------------------------------------------
local function rootOf(player)
	local character = player.Character
	if not character then
		return nil
	end
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health <= 0 then
		return nil
	end
	return character:FindFirstChild("HumanoidRootPart")
end

local function insideZone(zone, position)
	local rel = zone.CFrame:PointToObjectSpace(position)
	local half = zone.Size / 2
	return math.abs(rel.X) <= half.X and math.abs(rel.Y) <= half.Y and math.abs(rel.Z) <= half.Z
end

local function displayName(player)
	return player and (player.DisplayName or player.Name) or ""
end

local function writeAttributes(cabin)
	local model = cabin.Model
	model:SetAttribute("State", cabin.State)
	model:SetAttribute("Count", cabin.Group:Count())
	local leader = cabin.Group:GetLeader()
	model:SetAttribute("LeaderName", displayName(leader))
	model:SetAttribute("LeaderUserId", leader and leader.UserId or 0)
	model:SetAttribute("Countdown", cabin.Countdown)
end

local function viewFor(cabin, player)
	local leader = cabin.Group:GetLeader()
	return {
		CabinId = cabin.Id,
		Title = cabin.Def.DisplayName,
		Capacity = cabin.Def.Capacity,
		Count = cabin.Group:Count(),
		LeaderName = displayName(leader),
		IsLeader = leader == player,
		State = cabin.State,
		Countdown = cabin.Countdown,
	}
end

local function broadcast(cabin)
	writeAttributes(cabin)
	for _, member in ipairs(cabin.Group:GetMembers()) do
		remotes.ExpeditionState:FireClient(member, viewFor(cabin, member))
	end
end

local function feedback(cabin, kind)
	for _, member in ipairs(cabin.Group:GetMembers()) do
		remotes.CabinFeedback:FireClient(member, cabin.Id, kind)
	end
end

local function noticeOnce(player, cabin, reason, now)
	local last = lastNotice[player]
	if last and last.cabin == cabin and now - last.at < 4 then
		return
	end
	lastNotice[player] = { cabin = cabin, at = now }
	local text = NOTICE_TEXT[reason]
	if text then
		remotes.Notice:FireClient(player, text, "Info")
	end
end

local function resetCabin(cabin)
	cabin.Group:Reset()
	cabin.State = "Idle"
	cabin.DepartAt = nil
	cabin.Countdown = 0
	writeAttributes(cabin)
end

local function teleportOut(player, cabin)
	local character = player.Character
	if character and cabin.Exit then
		character:PivotTo(cabin.Exit.CFrame + Vector3.new(0, 3, 0))
	end
end

-- MEMBERSHIP ------------------------------------------------------------------------
local function join(player, cabin)
	local ok, reason = cabin.Group:Add(player)
	if not ok then
		return false, reason
	end
	playerCabin[player] = cabin
	outsideSince[player] = nil
	if cabin.State == "Idle" then
		cabin.State = "Boarding"
	end
	cabin.Model:SetAttribute("Pulse", (cabin.Model:GetAttribute("Pulse") or 0) + 1)
	remotes.CabinFeedback:FireClient(player, cabin.Id, "Joined")
	broadcast(cabin)
	return true
end

-- reason: "Manual" | "WalkedOut" | "Disconnected"
local function leave(player, reason, now)
	local cabin = playerCabin[player]
	if not cabin then
		return false
	end
	local _, leaderChanged = cabin.Group:Remove(player)
	playerCabin[player] = nil
	outsideSince[player] = nil
	if reason ~= "Disconnected" then
		remotes.ExpeditionState:FireClient(player, nil)
	end
	if cabin.Group:Count() == 0 then
		resetCabin(cabin) -- also cancels a running countdown
	else
		broadcast(cabin)
		if leaderChanged then
			remotes.Notice:FireClient(cabin.Group:GetLeader(), "You now lead this expedition.", "Info")
		end
	end
	if reason == "Manual" then
		cooldownUntil[player] = now + CFG.RejoinCooldownSeconds
		teleportOut(player, cabin)
	end
	return true
end

local function startExpedition(player, now)
	local cabin = playerCabin[player]
	if not cabin or cabin.State ~= "Boarding" then
		return false, "NotBoarding"
	end
	local ok, reason = cabin.Group:CanStart(player)
	if not ok then
		if reason == "NotLeader" then
			remotes.Notice:FireClient(player, "Only the expedition leader can start.", "Info")
		end
		return false, reason
	end
	cabin.Group:Lock()
	cabin.State = "Departing"
	local seconds = cabin.Def.Capacity == 1 and CFG.SoloCountdownSeconds or CFG.CountdownSeconds
	cabin.DepartAt = now + seconds
	cabin.Countdown = seconds
	feedback(cabin, "CountdownStart")
	broadcast(cabin)
	return true
end

local function depart(cabin, now)
	local members = cabin.Group:GetMembers()
	for _, member in ipairs(members) do
		playerCabin[member] = nil
		outsideSince[member] = nil
		remotes.CabinFeedback:FireClient(member, cabin.Id, "Depart")
		remotes.ExpeditionState:FireClient(member, nil)
	end
	local info = { CabinId = cabin.Id, Title = cabin.Def.DisplayName, Capacity = cabin.Def.Capacity }
	cabin.Group:Reset()
	cabin.State = "Departed" -- doors stay shut briefly, nobody can join
	cabin.DepartAt = nil
	cabin.Countdown = 0
	cabin.ReopenAt = now + CFG.ReopenDelaySeconds
	writeAttributes(cabin)
	if trainService then
		trainService.BoardExpedition(members, info)
	end
end

-- THE LOOP ---------------------------------------------------------------------------
function ExpeditionService.Poll(now)
	for _, player in ipairs(Players:GetPlayers()) do
		if not (trainService and trainService.IsAboard(player)) then
			local root = rootOf(player)
			local inCabin = nil
			if root then
				for _, cabin in ipairs(cabins) do
					if cabin.Zone and insideZone(cabin.Zone, root.Position) then
						inCabin = cabin
						break
					end
				end
			end
			local current = playerCabin[player]
			if current then
				if inCabin == current then
					outsideSince[player] = nil
				else
					outsideSince[player] = outsideSince[player] or now
					if now - outsideSince[player] >= CFG.LeaveGraceSeconds then
						leave(player, "WalkedOut", now)
					end
				end
			elseif inCabin and now >= (cooldownUntil[player] or 0) then
				if inCabin.State == "Idle" or inCabin.State == "Boarding" then
					local ok, reason = join(player, inCabin)
					if not ok then
						noticeOnce(player, inCabin, reason, now)
					end
				else
					noticeOnce(player, inCabin, "Locked", now)
				end
			end
		end
	end

	for _, cabin in ipairs(cabins) do
		if cabin.State == "Departing" and cabin.DepartAt then
			local remaining = math.max(0, math.ceil(cabin.DepartAt - now - 1e-6))
			if remaining ~= cabin.Countdown then
				cabin.Countdown = remaining
				if remaining > 0 then
					feedback(cabin, "Tick")
				end
				broadcast(cabin)
			end
			if now >= cabin.DepartAt then
				depart(cabin, now)
			end
		elseif cabin.State == "Departed" and now >= (cabin.ReopenAt or 0) then
			cabin.State = "Idle"
			writeAttributes(cabin)
		end
	end
end

-- PUBLIC -----------------------------------------------------------------------------
function ExpeditionService.GetCabinOf(player)
	local cabin = playerCabin[player]
	return cabin and cabin.Id or nil
end

function ExpeditionService.GetCabinState(cabinId)
	for _, cabin in ipairs(cabins) do
		if cabin.Id == cabinId then
			return cabin.State, cabin.Group:GetMembers(), cabin.Group:GetLeader()
		end
	end
	return nil
end

-- Exposed for tests and future systems (e.g. a menu "leave" button).
function ExpeditionService.HandleRequest(player, action)
	if type(action) ~= "string" then
		return false
	end
	local now = ExpeditionService.Clock()
	if lastRequest[player] and now - lastRequest[player] < 0.25 then
		return false -- simple spam guard
	end
	lastRequest[player] = now
	if action == "Start" then
		return startExpedition(player, now)
	elseif action == "Leave" then
		return leave(player, "Manual", now)
	end
	return false
end

function ExpeditionService.Init(deps)
	trainService = deps and deps.TrainService
	for _, name in ipairs({ "ExpeditionRequest", "ExpeditionState", "Notice", "CabinFeedback" }) do
		remotes[name] = Remotes.Get(name)
	end
	local folder = workspace:WaitForChild("ExpeditionCabins")
	for _, def in ipairs(CabinDefinitions) do
		local model = folder:FindFirstChild(def.Id)
		if model then
			local cabin = {
				Id = def.Id,
				Def = def,
				Model = model,
				Zone = model:FindFirstChild("Zone"),
				Exit = model:FindFirstChild("ExitPoint"),
				Group = ExpeditionGroup.new(def.Id, def.Capacity, CFG.MinSize),
				State = "Idle",
				Countdown = 0,
			}
			if not cabin.Zone then
				warn("[ExpeditionService] Cabin " .. def.Id .. " has no Zone part")
			end
			table.insert(cabins, cabin)
			writeAttributes(cabin)
		else
			warn("[ExpeditionService] Missing cabin model " .. def.Id)
		end
	end

	remotes.ExpeditionRequest.OnServerEvent:Connect(function(player, action)
		ExpeditionService.HandleRequest(player, action)
	end)
	Players.PlayerRemoving:Connect(function(player)
		leave(player, "Disconnected", ExpeditionService.Clock())
		cooldownUntil[player] = nil
		outsideSince[player] = nil
		lastNotice[player] = nil
		lastRequest[player] = nil
	end)
end

function ExpeditionService.Start()
	task.spawn(function()
		while true do
			task.wait(CFG.ZoneCheckInterval)
			local ok, err = pcall(ExpeditionService.Poll, ExpeditionService.Clock())
			if not ok then
				warn("[ExpeditionService] Poll error: " .. tostring(err))
			end
		end
	end)
end

return ExpeditionService
