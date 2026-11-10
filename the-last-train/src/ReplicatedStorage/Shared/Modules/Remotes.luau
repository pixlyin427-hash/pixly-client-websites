--[[
	Remotes
	Single source of truth for networking. The server creates every
	RemoteEvent under ReplicatedStorage.Shared.Remotes on first use; clients
	wait for them.

	Client -> Server
	  ExpeditionRequest(action: "Start" | "Leave")
	  TrainRequest(action: "ReturnToTerminal")

	Server -> Client
	  ExpeditionState(view | nil)     -- the card for the cabin you are in
	  Notice(text, kind)              -- short toast ("This cabin is full")
	  Transition(phase, title, sub)   -- "Out" fades to black, "In" fades back
	  TrainState(view | nil)          -- crew HUD while aboard
	  CabinFeedback(cabinId, kind)    -- "Joined" / "Tick" / "Depart" sounds
]]

local RunService = game:GetService("RunService")

local NAMES = {
	"ExpeditionRequest",
	"TrainRequest",
	"ExpeditionState",
	"Notice",
	"Transition",
	"TrainState",
	"CabinFeedback",
}

local Remotes = {}

local folder = nil

local function getFolder()
	if folder then
		return folder
	end
	local shared = script.Parent.Parent
	if RunService:IsServer() then
		folder = shared:FindFirstChild("Remotes")
		if not folder then
			folder = Instance.new("Folder")
			folder.Name = "Remotes"
			folder.Parent = shared
		end
		for _, name in ipairs(NAMES) do
			if not folder:FindFirstChild(name) then
				local remote = Instance.new("RemoteEvent")
				remote.Name = name
				remote.Parent = folder
			end
		end
	else
		folder = shared:WaitForChild("Remotes")
	end
	return folder
end

function Remotes.Get(name)
	local f = getFolder()
	if RunService:IsServer() then
		local remote = f:FindFirstChild(name)
		assert(remote, "Unknown remote " .. tostring(name))
		return remote
	end
	return f:WaitForChild(name)
end

return Remotes
