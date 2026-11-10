#!/usr/bin/env python3
"""
Assembles build/TheLastTrain.rbxlx from src/ (no Rojo needed).

  src/ReplicatedStorage/...          -> ReplicatedStorage
  src/ServerScriptService/...        -> ServerScriptService
  src/StarterPlayer/StarterPlayerScripts/... -> StarterPlayer.StarterPlayerScripts
  *.server.luau -> Script, *.client.luau -> LocalScript, *.luau -> ModuleScript

The place only contains scripts and a few service settings; the world is
built by ServerScriptService.World.WorldBuilder when the game runs (or when
you run it once from the Studio command bar to bake it, see README).
"""
import os
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
OUT = os.path.join(ROOT, "build", "TheLastTrain.rbxlx")

_ref = [0]


def ref():
    _ref[0] += 1
    return "RBX%08X" % _ref[0]


def cdata(text):
    return "<![CDATA[" + text.replace("]]>", "]]]]><![CDATA[>") + "]]>"


def item(cls, name, props="", children=""):
    return (
        f'<Item class="{cls}" referent="{ref()}"><Properties>'
        f'<string name="Name">{escape(name)}</string>{props}</Properties>{children}</Item>'
    )


def script_item(path, filename):
    with open(path, encoding="utf-8") as f:
        source = f.read()
    if filename.endswith(".server.luau"):
        cls, name = "Script", filename[: -len(".server.luau")]
    elif filename.endswith(".client.luau"):
        cls, name = "LocalScript", filename[: -len(".client.luau")]
    else:
        cls, name = "ModuleScript", filename[: -len(".luau")]
    return item(cls, name, f'<ProtectedString name="Source">{cdata(source)}</ProtectedString>')


def folder_children(directory):
    parts = []
    for entry in sorted(os.listdir(directory)):
        full = os.path.join(directory, entry)
        if os.path.isdir(full):
            parts.append(item("Folder", entry, children=folder_children(full)))
        elif entry.endswith(".luau"):
            parts.append(script_item(full, entry))
    return "".join(parts)


def main():
    body = []
    body.append(item("Workspace", "Workspace", '<bool name="StreamingEnabled">false</bool>'))
    # Technology 3 = ShadowMap: good quality / mobile balance.
    body.append(item("Lighting", "Lighting", '<token name="Technology">3</token><bool name="GlobalShadows">true</bool>'))
    body.append(item("Players", "Players", '<bool name="CharacterAutoLoads">false</bool>'))
    body.append(item("ReplicatedStorage", "ReplicatedStorage", children=folder_children(os.path.join(SRC, "ReplicatedStorage"))))
    body.append(item("ServerScriptService", "ServerScriptService", children=folder_children(os.path.join(SRC, "ServerScriptService"))))
    sps = item("StarterPlayerScripts", "StarterPlayerScripts", children=folder_children(os.path.join(SRC, "StarterPlayer", "StarterPlayerScripts")))
    body.append(item("StarterPlayer", "StarterPlayer", '<float name="CameraMaxZoomDistance">26</float>', children=sps))
    xml = (
        '<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" '
        'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" '
        'xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">'
        "<External>null</External><External>nil</External>" + "".join(body) + "</roblox>\n"
    )
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(xml)
    print("wrote", OUT, os.path.getsize(OUT) // 1024, "KB,", _ref[0], "instances")


if __name__ == "__main__":
    main()
