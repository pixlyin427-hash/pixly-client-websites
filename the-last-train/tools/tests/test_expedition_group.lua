-- Unit tests for the pure ExpeditionGroup module.
local Group = require(mock.services.ReplicatedStorage.Shared.Modules.ExpeditionGroup)

local function eq(a, b, msg)
	if a ~= b then
		error((msg or "mismatch") .. ": expected " .. tostring(b) .. ", got " .. tostring(a), 2)
	end
end

local A, B, C, D, E = { n = "A" }, { n = "B" }, { n = "C" }, { n = "D" }, { n = "E" }
local checks = 0
local function check(...) eq(...) checks = checks + 1 end

-- capacity + duplicate join
local g = Group.new("Duo", 2, 1)
check(g:Add(A), true, "A joins")
local ok, why = g:Add(A)
check(ok, false, "A cannot join twice") check(why, "AlreadyMember", "reason")
check(g:Add(B), true, "B joins")
ok, why = g:Add(C)
check(ok, false, "C rejected when full") check(why, "Full", "reason")
check(g:Count(), 2, "count")

-- leader is first joiner; transfers on leave
check(g:GetLeader(), A, "A leads")
local removed, changed = g:Remove(A)
check(removed, true, "A removed") check(changed, true, "leader changed")
check(g:GetLeader(), B, "B leads now")
removed, changed = g:Remove(C)
check(removed, false, "C was never a member")

-- start rules
check(g:CanStart(B), true, "leader can start with 1 member (min 1)")
check(select(2, g:CanStart(D)), "NotLeader", "non-member cannot start")
g:Lock()
ok, why = g:Add(D)
check(ok, false, "locked rejects") check(why, "Locked", "reason")
check(select(2, g:CanStart(B)), "Locked", "cannot start twice")
g:Reset()
check(g:Count(), 0, "reset empties") check(g:IsLocked(), false, "reset unlocks")

-- crew: four join in order, leadership follows join order
local crew = Group.new("Crew", 4, 1)
for _, p in ipairs({ A, B, C, D }) do crew:Add(p) end
check(crew:IsFull(), true, "crew full")
check(select(2, crew:Add(E)), "Full", "fifth rejected")
crew:Remove(B)
check(crew:GetLeader(), A, "removing a non-leader keeps leader")
crew:Remove(A)
check(crew:GetLeader(), C, "next in join order leads")
local members = crew:GetMembers()
table.remove(members, 1)
check(crew:Count(), 2, "GetMembers returns a copy")

return checks .. " checks"
