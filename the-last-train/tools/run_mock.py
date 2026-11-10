#!/usr/bin/env python3
"""
Offline harness for THE LAST TRAIN (no Roblox needed).

  python3 tools/run_mock.py build   -> runs the real WorldBuilder in a mock
                                       engine, prints stats, writes
                                       preview/world.json
  python3 tools/run_mock.py test    -> runs tools/tests/*.lua
  python3 tools/run_mock.py syntax  -> compiles every .luau file (Lua 5.1 subset)

Requires: pip install lupa
"""
import json
import os
import sys

from lupa import lua51

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
MOCK = os.path.join(ROOT, "tools", "mock")


def new_runtime():
    lua = lua51.LuaRuntime(unpack_returned_tuples=True)
    mock = lua.execute(open(os.path.join(MOCK, "roblox_mock.lua")).read())
    services = mock.services
    roots = {
        "ReplicatedStorage": services.ReplicatedStorage,
        "ServerScriptService": services.ServerScriptService,
        "StarterPlayer": services.StarterPlayer,
    }
    for top, inst in roots.items():
        base = os.path.join(SRC, top)
        for dirpath, dirnames, filenames in os.walk(base):
            dirnames.sort()
            rel = os.path.relpath(dirpath, base)
            parent = inst
            if rel != ".":
                for part in rel.split(os.sep):
                    parent = mock.ensureFolder(parent, part)
            for fn in sorted(filenames):
                if not fn.endswith(".luau"):
                    continue
                path = os.path.join(dirpath, fn)
                if fn.endswith(".server.luau"):
                    mock.mapFile(parent, fn[: -len(".server.luau")], "Script", path)
                elif fn.endswith(".client.luau"):
                    mock.mapFile(parent, fn[: -len(".client.luau")], "Script", path)
                else:
                    mock.mapFile(parent, fn[: -len(".luau")], "ModuleScript", path)
    return lua, mock


def conv(x):
    t = lua51.lua_type(x)
    if t == "table":
        n = len(x)
        if n > 0 or len(list(x.keys())) == 0:
            return [conv(x[i]) for i in range(1, n + 1)]
        return {str(k): conv(v) for k, v in x.items()}
    if isinstance(x, float):
        return round(x, 3)
    return x


def build():
    lua, mock = new_runtime()
    wb = mock.env.require(mock.services.ServerScriptService.World.WorldBuilder)
    report = wb.Build()
    errors = conv(report.Errors)
    for w in conv(mock.warnings) if mock.warnings else []:
        print("WARN", w)
    if errors:
        for e in errors:
            print("BUILD ERROR:", e)
        sys.exit(1)
    exporter = lua.execute(open(os.path.join(MOCK, "export.lua")).read())
    data = conv(exporter(mock))
    counts = conv(mock.counts)
    parts = data["parts"]
    transparent = sum(1 for p in parts if 0 < p[20] < 1)
    print("instances:", mock.instanceCount())
    print("parts:", len(parts), " transparent(0<t<1):", transparent)
    print("lights:", len(data["lights"]), " surfaceGuis:", len(data["guis"]), " smoke:", len(data["smoke"]))
    by_class = {k: v for k, v in counts.items() if v >= 20}
    print("class counts:", dict(sorted(by_class.items(), key=lambda kv: -kv[1])))
    # per top-level folder part counts
    ws = mock.services.Workspace
    for child in ws.GetChildren(ws).values():
        n = sum(1 for d in child.GetDescendants(child).values() if mock.isA(d["__class"], "BasePart"))
        print(f"  {child.Name}: {n} parts")
    out = os.path.join(ROOT, "preview", "world.json")
    with open(out, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    print("wrote", out, os.path.getsize(out) // 1024, "KB")


def syntax():
    lua = lua51.LuaRuntime()
    bad = 0
    count = 0
    for dirpath, _, filenames in os.walk(SRC):
        for fn in filenames:
            if fn.endswith(".luau"):
                count += 1
                path = os.path.join(dirpath, fn)
                ok, err = lua.eval("function(src, name) local f, e = loadstring(src, name) return f ~= nil, e end")(open(path).read(), "@" + os.path.relpath(path, ROOT))
                if not ok:
                    bad += 1
                    print("SYNTAX:", err)
    print(f"{count} files checked, {bad} with syntax errors")
    if bad:
        sys.exit(1)


def test():
    failures = 0
    tests_dir = os.path.join(ROOT, "tools", "tests")
    for fn in sorted(os.listdir(tests_dir)):
        if not fn.endswith(".lua"):
            continue
        lua, mock = new_runtime()
        chunk = lua.eval("function(src, name, mock) local f, e = loadstring(src, name) if not f then error(e) end setfenv(f, setmetatable({ mock = mock }, { __index = mock.env })) return f() end")
        try:
            result = chunk(open(os.path.join(tests_dir, fn)).read(), "@" + fn, mock)
            print(f"PASS {fn}: {result}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            print(f"FAIL {fn}: {e}")
    if failures:
        sys.exit(1)


if __name__ == "__main__":
    {"build": build, "test": test, "syntax": syntax}[sys.argv[1] if len(sys.argv) > 1 else "build"]()
