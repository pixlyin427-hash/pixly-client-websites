--[[
	PlayerService
	Characters are loaded manually (Players.CharacterAutoLoads = false) so no
	one can spawn before the world exists. Handles respawning after death.
]]

local Players = game:GetService("Players")

local PlayerService = {}

local function setup(player)
	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid", 10)
		if humanoid then
			humanoid.Died:Connect(function()
				task.delay(Players.RespawnTime, function()
					if player.Parent then
						player:LoadCharacter()
					end
				end)
			end)
		end
	end)
	player:LoadCharacter()
end

function PlayerService.Init()
	Players.CharacterAutoLoads = false
	Players.PlayerAdded:Connect(function(player)
		setup(player)
	end)
	for _, player in ipairs(Players:GetPlayers()) do
		if not player.Character then
			task.spawn(setup, player)
		end
	end
end

return PlayerService
