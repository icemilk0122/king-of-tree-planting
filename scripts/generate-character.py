"""
Blender Python script to generate a Q-version (chibi) character
with idle and walk animations, exported as .glb

Usage:
  blender --background --python scripts/generate-character.py

Output:
  public/models/character.glb
"""

import bpy
import bmesh
import math
import os

# ── Clean scene ──────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for c in bpy.data.collections:
    bpy.data.collections.remove(c)

# ── Materials ────────────────────────────────────────────────
def make_mat(name, color, roughness=0.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = 0.0
    return mat

mat_skin = make_mat('Skin', (1.0, 0.88, 0.74), 0.4)
mat_body = make_mat('Body', (0.31, 0.76, 0.97), 0.5)       # light blue shirt
mat_pants = make_mat('Pants', (0.22, 0.28, 0.31), 0.7)      # dark grey pants
mat_shoe = make_mat('Shoes', (0.47, 0.33, 0.28), 0.8)       # brown shoes
mat_hair = make_mat('Hair', (0.36, 0.25, 0.22), 0.8)        # dark brown
mat_eye_white = make_mat('EyeWhite', (0.95, 0.95, 0.95), 0.3)
mat_eye_black = make_mat('EyePupil', (0.08, 0.08, 0.08), 0.2)
mat_mouth = make_mat('Mouth', (0.85, 0.45, 0.4), 0.5)
mat_hat = make_mat('Hat', (0.18, 0.49, 0.20), 0.6)          # green explorer hat
mat_backpack = make_mat('Backpack', (0.55, 0.40, 0.15), 0.7) # brown backpack

# ── Helper ───────────────────────────────────────────────────
def assign_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def smooth_shade(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

# ── Armature ─────────────────────────────────────────────────
bpy.ops.object.armature_add(enter_editmode=True)
armature_obj = bpy.context.object
armature_obj.name = 'CharacterArmature'
armature = armature_obj.data
armature.name = 'CharacterRig'

# Clear default bone
armature.edit_bones.remove(armature.edit_bones[0])

def add_bone(name, head, tail, parent_name=None):
    bone = armature.edit_bones.new(name)
    bone.head = head
    bone.tail = tail
    if parent_name and parent_name in armature.edit_bones:
        bone.parent = armature.edit_bones[parent_name]
    return bone

# Q-version proportions: big head, short body, short limbs
# Total height ~2.0 units
add_bone('Root',      (0, 0, 0),       (0, 0, 0.3))
add_bone('Spine',     (0, 0, 0.3),     (0, 0, 0.8),    'Root')
add_bone('Chest',     (0, 0, 0.8),     (0, 0, 1.1),    'Spine')
add_bone('Neck',      (0, 0, 1.1),     (0, 0, 1.2),    'Chest')
add_bone('Head',      (0, 0, 1.2),     (0, 0, 1.9),    'Neck')

# Arms
add_bone('UpperArm.L', (0.35, 0, 1.0),  (0.55, 0, 0.7),  'Chest')
add_bone('LowerArm.L', (0.55, 0, 0.7),  (0.7, 0, 0.45),  'UpperArm.L')
add_bone('UpperArm.R', (-0.35, 0, 1.0), (-0.55, 0, 0.7), 'Chest')
add_bone('LowerArm.R', (-0.55, 0, 0.7), (-0.7, 0, 0.45), 'UpperArm.R')

# Legs
add_bone('UpperLeg.L', (0.15, 0, 0.3),  (0.15, 0, 0.15), 'Root')
add_bone('LowerLeg.L', (0.15, 0, 0.15), (0.15, 0, 0.0),  'UpperLeg.L')
add_bone('UpperLeg.R', (-0.15, 0, 0.3), (-0.15, 0, 0.15),'Root')
add_bone('LowerLeg.R', (-0.15, 0, 0.15),(-0.15, 0, 0.0), 'UpperLeg.R')

bpy.ops.object.mode_set(mode='OBJECT')

# ── Mesh parts ───────────────────────────────────────────────
parts = []

# Head (big sphere for Q-version)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=24, ring_count=16, location=(0, 0, 1.55))
head = bpy.context.object
head.name = 'Head'
head.scale = (1.0, 0.95, 1.05)
bpy.ops.object.transform_apply(scale=True)
assign_mat(head, mat_skin)
smooth_shade(head)
parts.append(head)

# Hair (top half sphere)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.57, segments=24, ring_count=16, location=(0, 0, 1.58))
hair = bpy.context.object
hair.name = 'Hair'
# Delete bottom half
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(hair.data)
bm.verts.ensure_lookup_table()
to_remove = [v for v in bm.verts if v.co.z + 1.58 < 1.45]  # Below midpoint in local
bmesh.ops.delete(bm, geom=to_remove, context='VERTS')
bmesh.update_edit_mesh(hair.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(hair, mat_hair)
smooth_shade(hair)
parts.append(hair)

# Eyes (white + pupil, larger for cute look)
for side in [1, -1]:
    # Eye white
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=12, ring_count=8, location=(side * 0.2, -0.45, 1.58))
    eye_w = bpy.context.object
    eye_w.name = f'EyeWhite.{"L" if side > 0 else "R"}'
    eye_w.scale = (1.0, 0.6, 1.2)
    bpy.ops.object.transform_apply(scale=True)
    assign_mat(eye_w, mat_eye_white)
    smooth_shade(eye_w)
    parts.append(eye_w)

    # Pupil
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=10, ring_count=6, location=(side * 0.2, -0.52, 1.57))
    pupil = bpy.context.object
    pupil.name = f'Pupil.{"L" if side > 0 else "R"}'
    assign_mat(pupil, mat_eye_black)
    smooth_shade(pupil)
    parts.append(pupil)

# Mouth (small flattened sphere)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=8, ring_count=6, location=(0, -0.48, 1.4))
mouth = bpy.context.object
mouth.name = 'Mouth'
mouth.scale = (1.5, 0.5, 0.8)
bpy.ops.object.transform_apply(scale=True)
assign_mat(mouth, mat_mouth)
smooth_shade(mouth)
parts.append(mouth)

# Explorer hat
bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.06, location=(0, 0, 1.95))
hat_brim = bpy.context.object
hat_brim.name = 'HatBrim'
assign_mat(hat_brim, mat_hat)
smooth_shade(hat_brim)
parts.append(hat_brim)

bpy.ops.mesh.primitive_uv_sphere_add(radius=0.32, segments=16, ring_count=8, location=(0, 0, 2.05))
hat_top = bpy.context.object
hat_top.name = 'HatTop'
hat_top.scale = (1, 1, 0.6)
bpy.ops.object.transform_apply(scale=True)
# Delete bottom half
bpy.ops.object.mode_set(mode='EDIT')
bm = bmesh.from_edit_mesh(hat_top.data)
bm.verts.ensure_lookup_table()
to_remove = [v for v in bm.verts if v.co.z + 2.05 < 2.0]
bmesh.ops.delete(bm, geom=to_remove, context='VERTS')
bmesh.update_edit_mesh(hat_top.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(hat_top, mat_hat)
smooth_shade(hat_top)
parts.append(hat_top)

# Body (torso - short and round for Q-version)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.35, segments=16, ring_count=12, location=(0, 0, 0.75))
body = bpy.context.object
body.name = 'Body'
body.scale = (1.0, 0.8, 1.3)
bpy.ops.object.transform_apply(scale=True)
assign_mat(body, mat_body)
smooth_shade(body)
parts.append(body)

# Arms (short capsules)
for side, suffix in [(1, 'L'), (-1, 'R')]:
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.1, segments=10, ring_count=6, location=(side * 0.45, 0, 0.85))
    shoulder = bpy.context.object
    shoulder.name = f'Shoulder.{suffix}'
    assign_mat(shoulder, mat_body)
    smooth_shade(shoulder)
    parts.append(shoulder)

    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, location=(side * 0.55, 0, 0.68))
    upper_arm = bpy.context.object
    upper_arm.name = f'UpperArmMesh.{suffix}'
    upper_arm.rotation_euler = (0, 0.3 * side, 0)
    bpy.ops.object.transform_apply(rotation=True)
    assign_mat(upper_arm, mat_body)
    smooth_shade(upper_arm)
    parts.append(upper_arm)

    # Hand (skin-colored sphere)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=8, ring_count=6, location=(side * 0.62, 0, 0.48))
    hand = bpy.context.object
    hand.name = f'Hand.{suffix}'
    assign_mat(hand, mat_skin)
    smooth_shade(hand)
    parts.append(hand)

# Legs (short)
for side, suffix in [(1, 'L'), (-1, 'R')]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.25, location=(side * 0.15, 0, 0.2))
    leg = bpy.context.object
    leg.name = f'LegMesh.{suffix}'
    assign_mat(leg, mat_pants)
    smooth_shade(leg)
    parts.append(leg)

    # Shoe
    bpy.ops.mesh.primitive_cube_add(size=0.2, location=(side * 0.15, -0.03, 0.06))
    shoe = bpy.context.object
    shoe.name = f'Shoe.{suffix}'
    shoe.scale = (1.0, 1.4, 0.6)
    bpy.ops.object.transform_apply(scale=True)
    # Round the shoe
    bpy.ops.object.modifier_add(type='SUBSURF')
    shoe.modifiers['Subdivision'].levels = 2
    bpy.ops.object.modifier_apply(modifier='Subdivision')
    assign_mat(shoe, mat_shoe)
    smooth_shade(shoe)
    parts.append(shoe)

# Backpack
bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0, 0.3, 0.75))
backpack = bpy.context.object
backpack.name = 'Backpack'
backpack.scale = (0.8, 0.6, 1.0)
bpy.ops.object.transform_apply(scale=True)
bpy.ops.object.modifier_add(type='SUBSURF')
backpack.modifiers['Subdivision'].levels = 2
bpy.ops.object.modifier_apply(modifier='Subdivision')
assign_mat(backpack, mat_backpack)
smooth_shade(backpack)
parts.append(backpack)

# ── Join all mesh parts ──────────────────────────────────────
bpy.ops.object.select_all(action='DESELECT')
for p in parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = parts[0]
bpy.ops.object.join()
mesh_obj = bpy.context.object
mesh_obj.name = 'Character'

# ── Parent mesh to armature with automatic weights ───────────
bpy.ops.object.select_all(action='DESELECT')
mesh_obj.select_set(True)
armature_obj.select_set(True)
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# ── Animations ───────────────────────────────────────────────
bpy.context.view_layer.objects.active = armature_obj
bpy.ops.object.mode_set(mode='POSE')

FPS = 24

# ─── Idle animation ─────────────────────────────────────────
idle_action = bpy.data.actions.new('Idle')
idle_action.use_fake_user = True
armature_obj.animation_data_create()
armature_obj.animation_data.action = idle_action

idle_frames = 48  # 2 seconds at 24fps

def set_bone_keyframe(bone_name, frame, loc=None, rot=None):
    bone = armature_obj.pose.bones.get(bone_name)
    if not bone:
        return
    if loc:
        bone.location = loc
        bone.keyframe_insert('location', frame=frame)
    if rot:
        bone.rotation_mode = 'XYZ'
        bone.rotation_euler = rot
        bone.keyframe_insert('rotation_euler', frame=frame)

# Gentle breathing: slight chest rise and head bob
for f in [1, 25, 48]:
    phase = 0 if f == 1 or f == 48 else 1
    chest_rot = (0.02 * phase, 0, 0)
    head_rot = (0.015 * phase, 0, 0)
    set_bone_keyframe('Chest', f, rot=chest_rot)
    set_bone_keyframe('Head', f, rot=head_rot)
    set_bone_keyframe('UpperArm.L', f, rot=(0.03 * phase, 0, 0))
    set_bone_keyframe('UpperArm.R', f, rot=(0.03 * phase, 0, 0))

# ─── Walk animation ─────────────────────────────────────────
walk_action = bpy.data.actions.new('Walk')
walk_action.use_fake_user = True
armature_obj.animation_data.action = walk_action

walk_frames = 24  # 1 second cycle

# Walk cycle keyframes
walk_keyframes = {
    1:  {
        'UpperLeg.L': (-0.5, 0, 0), 'UpperLeg.R': (0.5, 0, 0),
        'LowerLeg.L': (0.3, 0, 0),  'LowerLeg.R': (-0.1, 0, 0),
        'UpperArm.L': (0.4, 0, 0),  'UpperArm.R': (-0.4, 0, 0),
        'Chest': (0.03, 0, 0.02),   'Head': (-0.02, 0, 0),
        'Root': None,
    },
    7:  {
        'UpperLeg.L': (0, 0, 0),    'UpperLeg.R': (0, 0, 0),
        'LowerLeg.L': (0, 0, 0),    'LowerLeg.R': (0, 0, 0),
        'UpperArm.L': (0, 0, 0),    'UpperArm.R': (0, 0, 0),
        'Chest': (0, 0, 0),         'Head': (0, 0, 0),
        'Root': (0, 0, 0.02),
    },
    13: {
        'UpperLeg.L': (0.5, 0, 0),  'UpperLeg.R': (-0.5, 0, 0),
        'LowerLeg.L': (-0.1, 0, 0), 'LowerLeg.R': (0.3, 0, 0),
        'UpperArm.L': (-0.4, 0, 0), 'UpperArm.R': (0.4, 0, 0),
        'Chest': (0.03, 0, -0.02),  'Head': (-0.02, 0, 0),
        'Root': None,
    },
    19: {
        'UpperLeg.L': (0, 0, 0),    'UpperLeg.R': (0, 0, 0),
        'LowerLeg.L': (0, 0, 0),    'LowerLeg.R': (0, 0, 0),
        'UpperArm.L': (0, 0, 0),    'UpperArm.R': (0, 0, 0),
        'Chest': (0, 0, 0),         'Head': (0, 0, 0),
        'Root': (0, 0, 0.02),
    },
    24: {
        'UpperLeg.L': (-0.5, 0, 0), 'UpperLeg.R': (0.5, 0, 0),
        'LowerLeg.L': (0.3, 0, 0),  'LowerLeg.R': (-0.1, 0, 0),
        'UpperArm.L': (0.4, 0, 0),  'UpperArm.R': (-0.4, 0, 0),
        'Chest': (0.03, 0, 0.02),   'Head': (-0.02, 0, 0),
        'Root': None,
    },
}

for frame, bones in walk_keyframes.items():
    for bone_name, rot in bones.items():
        if rot is None:
            continue
        if bone_name == 'Root' and rot == (0, 0, 0.02):
            set_bone_keyframe(bone_name, frame, loc=(0, 0, rot[2]))
        else:
            set_bone_keyframe(bone_name, frame, rot=rot)

bpy.ops.object.mode_set(mode='OBJECT')

# ── Set up NLA tracks for glTF export ────────────────────────
armature_obj.animation_data.action = None

# Push actions to NLA tracks
for action in [idle_action, walk_action]:
    track = armature_obj.animation_data.nla_tracks.new()
    track.name = action.name
    strip = track.strips.new(action.name, int(action.frame_range[0]), action)
    strip.name = action.name

# ── Export ───────────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
output_dir = os.path.join(project_dir, 'public', 'models')
os.makedirs(output_dir, exist_ok=True)
output_path = os.path.join(output_dir, 'character.glb')

bpy.ops.export_scene.gltf(
    filepath=output_path,
    export_format='GLB',
    export_animations=True,
    export_skins=True,
    export_yup=True,
    export_apply=True,
)

print(f'\n✅ Character exported to: {output_path}')
print(f'   Animations: Idle ({idle_frames} frames), Walk ({walk_frames} frames)')
