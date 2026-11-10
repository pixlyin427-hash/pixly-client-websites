--[[
	ClientMain — the only LocalScript. Loads controllers in a fixed order,
	initialises them all (wiring, UI creation), then starts them (loops).
	Controllers talk to each other through the registry passed to Init.
]]

local Controllers = script.Parent:WaitForChild("Controllers")

local ORDER = {
	"SoundController",
	"InterfaceController",
	"TransitionController",
	"ExpeditionController",
	"CabinVisualsController",
	"DialogueController",
	"TrainHUDController",
	"ZoneController",
	"ClockController",
}

local registry = {}
for _, name in ipairs(ORDER) do
	registry[name] = require(Controllers:WaitForChild(name))
end

for _, name in ipairs(ORDER) do
	local controller = registry[name]
	if controller.Init then
		local ok, err = pcall(controller.Init, registry)
		if not ok then
			warn("[ClientMain] " .. name .. ".Init failed: " .. tostring(err))
		end
	end
end

for _, name in ipairs(ORDER) do
	local controller = registry[name]
	if controller.Start then
		task.spawn(function()
			local ok, err = pcall(controller.Start)
			if not ok then
				warn("[ClientMain] " .. name .. ".Start failed: " .. tostring(err))
			end
		end)
	end
end
