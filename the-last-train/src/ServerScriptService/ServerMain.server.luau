--[[
	ServerMain — the only server Script. Everything else is a ModuleScript.

	Order matters:
	  1. Stop automatic spawning (nobody lands in an unbuilt world).
	  2. Build the world (or detect a baked one).
	  3. Start services. 4. Load characters.
]]

local Players = game:GetService("Players")
local ServerScriptService = game:GetService("ServerScriptService")

Players.CharacterAutoLoads = false

local WorldBuilder = require(ServerScriptService.World.WorldBuilder)
local report = WorldBuilder.Build()
if #report.Errors > 0 then
	warn("[ServerMain] World built with " .. #report.Errors .. " error(s); see warnings above.")
end

local Services = ServerScriptService.Services
local TrainService = require(Services.TrainService)
local ExpeditionService = require(Services.ExpeditionService)
local PlayerService = require(Services.PlayerService)

TrainService.Init()
ExpeditionService.Init({ TrainService = TrainService })
PlayerService.Init()
ExpeditionService.Start()
