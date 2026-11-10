--[[
	LightingBuilder
	Applies the Terminal lighting preset and creates the post-processing
	effects once. Effects are named so the client can find and blend them.

	Lighting.Technology is not scriptable; the place file ships with
	ShadowMap (good quality / mobile cost balance). Change it in Studio if needed.
]]

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Lighting = game:GetService("Lighting")

local LightingPresets = require(ReplicatedStorage.Shared.Config.LightingPresets)

local LightingBuilder = {}

local function ensure(className, name)
	local existing = Lighting:FindFirstChild(name)
	if existing and existing:IsA(className) then
		return existing
	end
	local inst = Instance.new(className)
	inst.Name = name
	inst.Parent = Lighting
	return inst
end

function LightingBuilder.Apply(preset, atmosphere, bloom, colorCorrection)
	for k, v in pairs(preset.Lighting) do
		Lighting[k] = v
	end
	for k, v in pairs(preset.Atmosphere) do
		atmosphere[k] = v
	end
	for k, v in pairs(preset.Bloom) do
		bloom[k] = v
	end
	for k, v in pairs(preset.ColorCorrection) do
		colorCorrection[k] = v
	end
end

function LightingBuilder.Build()
	Lighting.GlobalShadows = true
	Lighting.ShadowSoftness = 0.3
	Lighting.GeographicLatitude = 38

	local atmosphere = ensure("Atmosphere", "LastTrainAtmosphere")
	local bloom = ensure("BloomEffect", "LastTrainBloom")
	local colorCorrection = ensure("ColorCorrectionEffect", "LastTrainColor")

	LightingBuilder.Apply(LightingPresets.Terminal, atmosphere, bloom, colorCorrection)
end

return LightingBuilder
