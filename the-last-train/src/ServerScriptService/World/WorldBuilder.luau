--[[
	WorldBuilder
	Builds the whole world from code when the server starts — unless it was
	already baked into the place.

	BAKING (recommended once you start hand-editing in Studio):
	  In Studio, Edit mode, run this in the Command Bar:
	    require(game.ServerScriptService.World.WorldBuilder).Build()
	  The Lobby, cabins, environment and train appear in Workspace. Save the
	  place. From then on the server sees Workspace.Lobby and skips building,
	  so your manual edits are kept.

	Each step runs protected: if one fails, the rest of the world still builds
	and the error is reported in Output with the step name.
]]

local World = script.Parent

local LightingBuilder = require(World.LightingBuilder)
local LobbyBuilder = require(World.LobbyBuilder)
local CabinBuilder = require(World.CabinBuilder)
local EnvironmentBuilder = require(World.EnvironmentBuilder)
local ExpeditionZoneBuilder = require(World.ExpeditionZoneBuilder)
local NPCBuilder = require(World.NPCBuilder)

local WorldBuilder = {}

function WorldBuilder.IsBuilt()
	return workspace:FindFirstChild("Lobby") ~= nil and workspace:FindFirstChild("ExpeditionCabins") ~= nil and workspace:FindFirstChild("ExpeditionTrain") ~= nil
end

function WorldBuilder.Build()
	local report = { Errors = {}, Baked = false }
	if WorldBuilder.IsBuilt() then
		report.Baked = true
		return report
	end

	local function step(name, fn)
		local ok, err = pcall(fn)
		if not ok then
			table.insert(report.Errors, name .. ": " .. tostring(err))
			warn("[WorldBuilder] " .. name .. " failed: " .. tostring(err))
		end
	end

	local lobbyInfo, zoneInfo
	step("Lighting", function()
		LightingBuilder.Build()
	end)
	step("Lobby", function()
		local _, info = LobbyBuilder.Build(workspace)
		lobbyInfo = info
	end)
	step("Cabins", function()
		CabinBuilder.Build(workspace, lobbyInfo and lobbyInfo.PlatformY or -6)
	end)
	step("Environment", function()
		EnvironmentBuilder.Build(workspace)
	end)
	step("ExpeditionTrain", function()
		local _, info = ExpeditionZoneBuilder.Build(workspace)
		zoneInfo = info
	end)
	step("NPCs", function()
		if lobbyInfo then
			NPCBuilder.Build(workspace.Lobby, lobbyInfo.KeeperCFrame, "StationKeeper")
		end
		if zoneInfo then
			NPCBuilder.Build(workspace.ExpeditionTrain, zoneInfo.ConductorCFrame, "Conductor")
		end
	end)
	return report
end

return WorldBuilder
