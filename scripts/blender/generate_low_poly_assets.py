import bpy
import math
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "public" / "assets" / "generated" / "blender"
OUT.mkdir(parents=True, exist_ok=True)

def clear():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

def setup_camera():
    bpy.ops.object.light_add(type="AREA", location=(0, -3, 5))
    bpy.context.object.data.energy = 450
    bpy.context.object.data.size = 4
    bpy.ops.object.camera_add(location=(0, -7, 5), rotation=(math.radians(58), 0, 0))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.data.type = "ORTHO"
    bpy.context.object.data.ortho_scale = 4.6
    bpy.context.scene.render.resolution_x = 512
    bpy.context.scene.render.resolution_y = 512
    bpy.context.scene.eevee.taa_render_samples = 32

def material(name, color):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = color
    return mat

def cube(name, loc, scale, mat):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    return obj

def cone(name, loc, radius, depth, mat):
    bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(mat)
    return obj

def render_asset(asset_name, builder):
    clear()
    setup_camera()
    builder()
    bpy.context.scene.render.filepath = str(OUT / f"{asset_name}.png")
    bpy.ops.render.render(write_still=True)

stone = lambda: material("stone", (0.18, 0.22, 0.32, 1))
cyan = lambda: material("cyan", (0.1, 0.95, 0.85, 1))
gold = lambda: material("gold", (1.0, 0.66, 0.18, 1))
red = lambda: material("red", (0.95, 0.1, 0.28, 1))
purple = lambda: material("purple", (0.6, 0.25, 1.0, 1))

def floor(): cube("floor", (0, 0, 0), (1.8, 1.8, 0.08), stone())
def wall(): cube("wall", (0, 0, 0.8), (1.8, 0.25, 1.2), stone())
def chest():
    cube("base", (0, 0, 0.25), (1, .65, .35), gold())
    cube("lid", (0, 0, 0.7), (1.1, .7, .18), red())
def portal():
    cone("portal-a", (0, 0, 0.9), .7, 1.8, purple())
    cone("portal-b", (0, 0, 0.95), .45, 1.9, cyan())
def humanoid(mat_fn):
    cube("body", (0, 0, .65), (.45, .28, .65), mat_fn())
    cube("head", (0, 0, 1.25), (.32, .32, .32), mat_fn())
    cube("weapon", (.55, 0, .7), (.08, .08, .9), gold())
def goblin(): humanoid(lambda: material("green", (.22, .72, .28, 1)))
def boss():
    humanoid(purple)
    cube("horn-l", (-.28, 0, 1.58), (.1, .1, .45), red())
    cube("horn-r", (.28, 0, 1.58), (.1, .1, .45), red())

assets = {
    "low_poly_dungeon_floor": floor,
    "wall": wall,
    "treasure_chest": chest,
    "portal": portal,
    "knight": lambda: humanoid(cyan),
    "mage": lambda: humanoid(purple),
    "ranger": lambda: humanoid(gold),
    "goblin": goblin,
    "boss": boss,
}

for name, builder in assets.items():
    render_asset(name, builder)

print(f"Rendered {len(assets)} low poly assets to {OUT}")
