--[[
	UITheme
	Visual language shared by screen UI and in-world signage.
	Deep charcoal surfaces, warm lamp-amber accents, aged brass strokes.
]]

local UITheme = {
	Colors = {
		Background = Color3.fromRGB(17, 16, 15),
		Panel = Color3.fromRGB(24, 22, 20),
		PanelRaised = Color3.fromRGB(36, 33, 29),
		Stroke = Color3.fromRGB(122, 98, 66),
		StrokeSoft = Color3.fromRGB(64, 57, 48),
		Accent = Color3.fromRGB(226, 168, 96), -- old train lamp
		AccentDeep = Color3.fromRGB(150, 104, 52),
		AccentText = Color3.fromRGB(28, 20, 12),
		Text = Color3.fromRGB(238, 228, 210),
		TextMuted = Color3.fromRGB(166, 154, 136),
		TextFaint = Color3.fromRGB(112, 104, 94),
		Danger = Color3.fromRGB(186, 92, 76),
		Proceed = Color3.fromRGB(128, 168, 112),
		Brass = Color3.fromRGB(176, 140, 82),
		Parchment = Color3.fromRGB(226, 212, 182),
		Ink = Color3.fromRGB(42, 34, 26),
	},

	Fonts = {
		Title = Enum.Font.Merriweather, -- serif, used sparingly for names / numerals
		Label = Enum.Font.Oswald, -- condensed railway signage, small caps labels
		Body = Enum.Font.GothamMedium,
		BodyBold = Enum.Font.GothamBold,
	},

	PanelTransparency = 0.06,
	StrokeTransparency = 0.45,
	CornerRadius = 8,
	ButtonHeight = 46, -- 37px on the smallest phones after scaling: still tappable
}

return UITheme
