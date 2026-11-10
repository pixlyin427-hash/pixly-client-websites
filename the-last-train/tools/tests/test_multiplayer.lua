--[[
	Multiplayer simulation: the REAL ExpeditionService + TrainService running
	against the REAL built world in the mock engine. Players are simulated by
	moving their HumanoidRootPart; time is advanced deterministically.
]]

local M = mock
local SSS = M.services.ServerScriptService
local workspace = M.services.Workspace

local report = require(SSS.World.WorldBuilder).Build()
assert(#report.Errors == 0, "world build errors: " .. table.concat(report.Errors, "; "))

local TrainService = require(SSS.Services.TrainService)
local ES = require(SSS.Services.ExpeditionService)
local GameConfig = require(M.services.ReplicatedStorage.Shared.Config.GameConfig)
ES.Clock = function() return M.now end
TrainService.Init()
ES.Init({ TrainService = TrainService })

local checks = 0
local function check(cond, msg)
	if not cond then error("CHECK FAILED: " .. msg, 2) end
	checks = checks + 1
end

local roots = {}
local function makePlayer(name)
	local p = M.addPlayer(name)
	local char = Instance.new("Model")
	char.Name = name
	local root = Instance.new("Part")
	root.Name = "HumanoidRootPart"
	root.Size = Vector3.new(2, 2, 1)
	root.CFrame = CFrame.new(0, 3, -52)
	root.Parent = char
	char.PrimaryPart = root
	local hum = Instance.new("Humanoid")
	hum.Health = 100
	hum.Parent = char
	char.Parent = workspace
	p.Character = char
	roots[p] = root
	return p
end

local function zonePos(cabinId, dx)
	local z = workspace.ExpeditionCabins[cabinId].Zone
	return z.CFrame * Vector3.new(dx or 0, 0, 0)
end
local function moveTo(p, pos) roots[p].CFrame = CFrame.new(pos) end
local function lobby(p) moveTo(p, Vector3.new(0, 3, -40)) end

local function step(seconds)
	local t = 0
	while t < seconds - 1e-9 do
		M.advance(0.2)
		ES.Poll(M.now)
		t = t + 0.2
	end
end

local function attr(cabinId, name) return workspace.ExpeditionCabins[cabinId]:GetAttribute(name) end
local function inBoardingCarriage(p)
	local pos = roots[p].Position
	local spawns = workspace.ExpeditionTrain.TheLastTrain.BoardingCarriage.BoardingSpawns
	for _, s in ipairs(spawns:GetChildren()) do
		if (s.Position - pos).Magnitude < 8 then return true end
	end
	return false
end
local function notices(p)
	local out = {}
	for _, e in ipairs(M.remoteLog or {}) do
		if e.remote == "Notice" and e.player == p then table.insert(out, e.args[1]) end
	end
	return out
end
local function lastView(p)
	local v = "none"
	for _, e in ipairs(M.remoteLog or {}) do
		if e.remote == "ExpeditionState" and e.player == p then v = e.args[1] end
	end
	return v
end

local A, B, C, D, E = makePlayer("Ada"), makePlayer("Bram"), makePlayer("Cyra"), makePlayer("Dov"), makePlayer("Eli")

-- 1. SOLO --------------------------------------------------------------------------
moveTo(A, zonePos("Solo")) step(0.4)
check(ES.GetCabinOf(A) == "Solo", "A joined Solo")
check(attr("Solo", "Count") == 1 and attr("Solo", "LeaderName") == "Ada", "Solo count/leader attributes")
check(lastView(A).IsLeader == true, "A sees leader view")
moveTo(B, zonePos("Solo", 1.5)) step(0.4)
check(ES.GetCabinOf(B) == nil, "B rejected from full Solo")
check(notices(B)[1] == "This cabin is full.", "B told the cabin is full")
lobby(B) step(0.4)
check(ES.HandleRequest(A, "Start") == true, "A starts Solo")
check(attr("Solo", "State") == "Departing" and attr("Solo", "Countdown") == GameConfig.Expedition.SoloCountdownSeconds, "Solo counting down")
step(GameConfig.Expedition.SoloCountdownSeconds + 0.2)
check(TrainService.IsAboard(A), "A aboard after countdown")
check(attr("Solo", "State") == "Departed", "Solo doors shut after departure")
step(GameConfig.Transition.FadeOutTime + GameConfig.Transition.HoldTime + 0.4)
check(inBoardingCarriage(A), "A placed in Boarding Carriage")
step(GameConfig.Expedition.ReopenDelaySeconds)
check(attr("Solo", "State") == "Idle", "Solo reopened")

-- 2. CREW: capacity, leadership, leaving, disconnect during countdown ----------------
moveTo(B, zonePos("Crew", -4)) step(0.2)
moveTo(C, zonePos("Crew", -1)) step(0.2)
moveTo(D, zonePos("Crew", 2)) step(0.2)
moveTo(E, zonePos("Crew", 4)) step(0.4)
check(attr("Crew", "Count") == 4 and attr("Crew", "LeaderName") == "Bram", "Crew full, Bram leads")
local F = makePlayer("Fen")
moveTo(F, zonePos("Crew", 0)) step(0.4)
check(ES.GetCabinOf(F) == nil, "fifth explorer rejected")
lobby(F)
step(0.4)
check(ES.HandleRequest(C, "Start") == false, "non-leader cannot start")
step(0.4)
check(ES.HandleRequest(B, "Leave") == true, "leader leaves manually")
check(ES.GetCabinOf(B) == nil and attr("Crew", "LeaderName") == "Cyra", "leadership passed to Cyra")
step(0.6)
check(ES.GetCabinOf(B) == nil, "B not re-added (teleported out + cooldown)")
-- one player cannot be in two cabins: walk Dov into Duo
moveTo(D, zonePos("Duo")) step(0.4)
check(ES.GetCabinOf(D) == "Crew", "still Crew during grace period")
step(0.8)
check(ES.GetCabinOf(D) == "Duo", "now Duo only")
check(attr("Crew", "Count") == 2, "Crew count dropped to 2")
check(ES.HandleRequest(C, "Start") == true, "Cyra starts Crew")
step(1.2)
M.removePlayer(E) -- disconnect mid-countdown
step(0.2)
check(attr("Crew", "Count") == 1 and attr("Crew", "State") == "Departing", "countdown survives a disconnect")
step(GameConfig.Expedition.CountdownSeconds)
check(TrainService.IsAboard(C), "Cyra aboard")
check(not TrainService.IsAboard(B) and not TrainService.IsAboard(D), "others not aboard")

-- 3. Countdown cancelled when everyone leaves ----------------------------------------
moveTo(B, zonePos("Squad")) step(0.4)
check(ES.HandleRequest(B, "Start") == true, "Bram starts Squad")
step(1.0)
check(ES.HandleRequest(B, "Leave") == true, "Bram leaves during countdown")
check(attr("Squad", "State") == "Idle" and attr("Squad", "Count") == 0, "Squad reset, countdown cancelled")
step(GameConfig.Expedition.CountdownSeconds + 1)
check(not TrainService.IsAboard(B), "Bram did not depart")

-- 4. Duo group departs while others are already aboard: no overlapping spawns -------
step(GameConfig.Expedition.RejoinCooldownSeconds)
moveTo(B, zonePos("Duo", 2)) step(0.4)
check(attr("Duo", "Count") == 2, "Duo has Dov + Bram")
check(ES.HandleRequest(D, "Start") == true, "Dov (first in Duo) starts")
step(GameConfig.Expedition.CountdownSeconds + GameConfig.Transition.FadeOutTime + GameConfig.Transition.HoldTime + 0.6)
check(TrainService.IsAboard(B) and TrainService.IsAboard(D), "Duo aboard")
local aboard = { A, C, B, D }
for i = 1, #aboard do
	check(inBoardingCarriage(aboard[i]), aboard[i].Name .. " in Boarding Carriage")
	for j = i + 1, #aboard do
		local a, b = roots[aboard[i]].Position, roots[aboard[j]].Position
		check(Vector3.new(a.X - b.X, 0, a.Z - b.Z).Magnitude >= 2.5, "no overlap " .. aboard[i].Name .. "/" .. aboard[j].Name)
	end
end
local rec = TrainService.GetExpedition(B)
check(rec and #rec.Members == 2 and rec.Capacity == 2, "Duo membership intact aboard")
check(TrainService.GetExpedition(A) ~= rec, "separate expedition records")

-- 5. Return to terminal + disconnect aboard ------------------------------------------
check(TrainService.ReturnToTerminal(B) == true, "Bram returns")
step(GameConfig.Transition.FadeOutTime + GameConfig.Transition.HoldTime + 0.4)
check(not TrainService.IsAboard(B), "Bram no longer aboard")
check(roots[B].Position.Z < -30 and roots[B].Position.Y < 8, "Bram back in the terminal")
check(#rec.Members == 1, "Duo record shrank to 1")
M.removePlayer(D)
check(TrainService.GetExpedition(D) == nil, "disconnect aboard cleans up")

return checks .. " checks"
