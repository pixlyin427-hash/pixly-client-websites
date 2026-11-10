--[[
	LightingPresets
	The server applies "Terminal" at startup. The client's ZoneController
	blends to "Train" while the local player is aboard and back again.

	Design intent: warm practical lamps inside, a cool and uncertain world
	outside. Bloom is deliberately low; nothing should glare.
]]

local function rgb(r, g, b)
	return Color3.fromRGB(r, g, b)
end

local LightingPresets = {
	Terminal = {
		Lighting = {
			ClockTime = 18.85, -- late dusk: blue sky, last light on the horizon
			Brightness = 1.6,
			Ambient = rgb(74, 66, 62),
			OutdoorAmbient = rgb(104, 116, 138),
			ColorShift_Top = rgb(48, 52, 70),
			ColorShift_Bottom = rgb(0, 0, 0),
			EnvironmentDiffuseScale = 0.35,
			EnvironmentSpecularScale = 0.4,
			ExposureCompensation = 0.15,
		},
		Atmosphere = {
			Density = 0.32,
			Offset = 0.15,
			Color = rgb(156, 170, 192),
			Decay = rgb(92, 104, 128),
			Glare = 0,
			Haze = 1.6,
		},
		Bloom = { Intensity = 0.35, Size = 22, Threshold = 1.35 },
		ColorCorrection = { Brightness = 0.02, Contrast = 0.07, Saturation = -0.06, TintColor = rgb(255, 247, 238) },
	},

	Train = {
		Lighting = {
			ClockTime = 20.4, -- night has fallen once the train is under way
			Brightness = 1.2,
			Ambient = rgb(70, 62, 60),
			OutdoorAmbient = rgb(78, 90, 116),
			ColorShift_Top = rgb(30, 36, 56),
			ColorShift_Bottom = rgb(0, 0, 0),
			EnvironmentDiffuseScale = 0.3,
			EnvironmentSpecularScale = 0.35,
			ExposureCompensation = 0.2,
		},
		Atmosphere = {
			Density = 0.4,
			Offset = 0.2,
			Color = rgb(122, 140, 170),
			Decay = rgb(62, 74, 100),
			Glare = 0,
			Haze = 2.2,
		},
		Bloom = { Intensity = 0.32, Size = 22, Threshold = 1.35 },
		ColorCorrection = { Brightness = 0.03, Contrast = 0.06, Saturation = -0.08, TintColor = rgb(255, 246, 236) },
	},
}

return LightingPresets
