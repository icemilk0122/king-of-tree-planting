"""
Blender Python script to generate modular Q-version character parts.
Each equipment slot is exported as a separate .glb sharing the same armature.

Usage:
  blender --background --python scripts/generate-character.py

Output:
  public/models/char-base.glb      (body + head + skin, with armature + animations)
  public/models/equip-hair-default.glb
  public/models/equip-hat-explorer.glb
  public/models/equip-hat-straw.glb
  public/models/equip-top-blue.glb
  public/models/equip-top-green.glb
  public/models/equip-bottom-grey.glb
  public/models/equip-bottom-khaki.glb
  public/models/equip-shoes-brown.glb
  public/models/equip-shoes-sneaker.glb
  public/models/equip-acc-backpack.glb
  public/models/equip-acc-camera.glb
"""

import bpy
import bmesh
import math
import os

# ── Output dir ───────────────────────────────────────────────
script_dir = os.path.dirname(os.path.abspath(__file__))
project_dir = os.path.dirname(script_dir)
output_dir = os.path.join(project_dir, 'public', 'models')
os.makedirs(output_dir, exist_ok=True)

# ── Helpers ──────────────────────────────────────────────────
def clean_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def make_mat(name, color, roughness=0.6):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*color, 1)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Metallic'].default_value = 0.0
    return mat

def assign_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def smooth_shade(obj):
    for poly in obj.data.polygons:
        poly.use_smooth = True

def subdivide(obj, levels=2):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_add(type='SUBSURF')
    obj.modifiers['Subdivision'].levels = levels
    bpy.ops.object.modifier_apply(modifier='Subdivision')

def delete_below(obj, z_threshold):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bm = bmesh.from_edit_mesh(obj.data)
    bm.verts.ensure_lookup_table()
    to_remove = [v for v in bm.verts if v.co.z < z_threshold]
    if to_remove:
        bmesh.ops.delete(bm, geom=to_remove, context='VERTS')
    bmesh.update_edit_mesh(obj.data)
    bpy.ops.object.mode_set(mode='OBJECT')

# ── Armature (shared across all parts) ───────────────────────
def create_armature():
    clean_scene()
    bpy.ops.object.armature_add(enter_editmode=True)
    armature_obj = bpy.context.object
    armature_obj.name = 'CharacterArmature'
    armature = armature_obj.data
    armature.name = 'CharacterRig'
    armature.edit_bones.remove(armature.edit_bones[0])

    def add_bone(name, head, tail, parent_name=None):
        bone = armature.edit_bones.new(name)
        bone.head = head
        bone.tail = tail
        if parent_name and parent_name in armature.edit_bones:
            bone.parent = armature.edit_bones[parent_name]
        return bone

    add_bone('Root',       (0, 0, 0),       (0, 0, 0.3))
    add_bone('Spine',      (0, 0, 0.3),     (0, 0, 0.8),    'Root')
    add_bone('Chest',      (0, 0, 0.8),     (0, 0, 1.1),    'Spine')
    add_bone('Neck',       (0, 0, 1.1),     (0, 0, 1.2),    'Chest')
    add_bone('Head',       (0, 0, 1.2),     (0, 0, 1.9),    'Neck')
    add_bone('UpperArm.L', (0.35, 0, 1.0),  (0.55, 0, 0.7), 'Chest')
    add_bone('LowerArm.L', (0.55, 0, 0.7),  (0.7, 0, 0.45), 'UpperArm.L')
    add_bone('UpperArm.R', (-0.35, 0, 1.0), (-0.55, 0, 0.7),'Chest')
    add_bone('LowerArm.R', (-0.55, 0, 0.7), (-0.7, 0, 0.45),'UpperArm.R')
    add_bone('UpperLeg.L', (0.15, 0, 0.3),  (0.15, 0, 0.15),'Root')
    add_bone('LowerLeg.L', (0.15, 0, 0.15), (0.15, 0, 0.0), 'UpperLeg.L')
    add_bone('UpperLeg.R', (-0.15, 0, 0.3), (-0.15, 0, 0.15),'Root')
    add_bone('LowerLeg.R', (-0.15, 0, 0.15),(-0.15, 0, 0.0),'UpperLeg.R')

    bpy.ops.object.mode_set(mode='OBJECT')
    return armature_obj


def add_animations(armature_obj):
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.mode_set(mode='POSE')

    def set_kf(bone_name, frame, loc=None, rot=None):
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

    armature_obj.animation_data_create()

    # Idle
    idle = bpy.data.actions.new('Idle')
    idle.use_fake_user = True
    armature_obj.animation_data.action = idle
    for f in [1, 25, 48]:
        phase = 0 if f in (1, 48) else 1
        set_kf('Chest', f, rot=(0.02 * phase, 0, 0))
        set_kf('Head',  f, rot=(0.015 * phase, 0, 0))
        set_kf('UpperArm.L', f, rot=(0.03 * phase, 0, 0))
        set_kf('UpperArm.R', f, rot=(0.03 * phase, 0, 0))

    # Walk
    walk = bpy.data.actions.new('Walk')
    walk.use_fake_user = True
    armature_obj.animation_data.action = walk
    walk_kf = {
        1:  {'UpperLeg.L': (-0.5,0,0), 'UpperLeg.R': (0.5,0,0),
             'LowerLeg.L': (0.3,0,0),  'LowerLeg.R': (-0.1,0,0),
             'UpperArm.L': (0.4,0,0),  'UpperArm.R': (-0.4,0,0),
             'Chest': (0.03,0,0.02),   'Head': (-0.02,0,0)},
        7:  {'UpperLeg.L': (0,0,0), 'UpperLeg.R': (0,0,0),
             'LowerLeg.L': (0,0,0), 'LowerLeg.R': (0,0,0),
             'UpperArm.L': (0,0,0), 'UpperArm.R': (0,0,0),
             'Chest': (0,0,0),      'Head': (0,0,0), 'Root': 'loc'},
        13: {'UpperLeg.L': (0.5,0,0),  'UpperLeg.R': (-0.5,0,0),
             'LowerLeg.L': (-0.1,0,0), 'LowerLeg.R': (0.3,0,0),
             'UpperArm.L': (-0.4,0,0), 'UpperArm.R': (0.4,0,0),
             'Chest': (0.03,0,-0.02),  'Head': (-0.02,0,0)},
        19: {'UpperLeg.L': (0,0,0), 'UpperLeg.R': (0,0,0),
             'LowerLeg.L': (0,0,0), 'LowerLeg.R': (0,0,0),
             'UpperArm.L': (0,0,0), 'UpperArm.R': (0,0,0),
             'Chest': (0,0,0),      'Head': (0,0,0), 'Root': 'loc'},
        24: {'UpperLeg.L': (-0.5,0,0), 'UpperLeg.R': (0.5,0,0),
             'LowerLeg.L': (0.3,0,0),  'LowerLeg.R': (-0.1,0,0),
             'UpperArm.L': (0.4,0,0),  'UpperArm.R': (-0.4,0,0),
             'Chest': (0.03,0,0.02),   'Head': (-0.02,0,0)},
    }
    for frame, bones in walk_kf.items():
        for bname, val in bones.items():
            if val == 'loc':
                set_kf(bname, frame, loc=(0, 0, 0.02))
            else:
                set_kf(bname, frame, rot=val)

    bpy.ops.object.mode_set(mode='OBJECT')

    # NLA tracks
    armature_obj.animation_data.action = None
    for action in [idle, walk]:
        track = armature_obj.animation_data.nla_tracks.new()
        track.name = action.name
        strip = track.strips.new(action.name, int(action.frame_range[0]), action)
        strip.name = action.name


def parent_to_armature(mesh_obj, armature_obj):
    bpy.ops.object.select_all(action='DESELECT')
    mesh_obj.select_set(True)
    armature_obj.select_set(True)
    bpy.context.view_layer.objects.active = armature_obj
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')


def export_glb(filepath, objects, armature_obj, with_animations=False):
    bpy.ops.object.select_all(action='DESELECT')
    armature_obj.select_set(True)
    for obj in objects:
        obj.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=filepath,
        export_format='GLB',
        use_selection=True,
        export_animations=with_animations,
        export_skins=True,
        export_yup=True,
        export_apply=True,
    )
    print(f'  ✅ {os.path.basename(filepath)}')


# ══════════════════════════════════════════════════════════════
# BUILD ALL PARTS
# ══════════════════════════════════════════════════════════════

print('\n🔨 Generating modular character parts...\n')

# ── 1. BASE (body + head + eyes + mouth + skin) ─────────────
clean_scene()
armature_obj = create_armature()

mat_skin = make_mat('Skin', (1.0, 0.88, 0.74), 0.4)
mat_eye_w = make_mat('EyeWhite', (0.95, 0.95, 0.95), 0.3)
mat_eye_b = make_mat('EyePupil', (0.08, 0.08, 0.08), 0.2)
mat_mouth = make_mat('Mouth', (0.85, 0.45, 0.4), 0.5)

base_parts = []

# Head
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=24, ring_count=16, location=(0, 0, 1.55))
head = bpy.context.object; head.name = 'Head'
head.scale = (1.0, 0.95, 1.05)
bpy.ops.object.transform_apply(scale=True)
assign_mat(head, mat_skin); smooth_shade(head); base_parts.append(head)

# Eyes
for side in [1, -1]:
    s = 'L' if side > 0 else 'R'
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.12, segments=12, ring_count=8, location=(side*0.2, -0.45, 1.58))
    ew = bpy.context.object; ew.name = f'EyeW.{s}'
    ew.scale = (1.0, 0.6, 1.2); bpy.ops.object.transform_apply(scale=True)
    assign_mat(ew, mat_eye_w); smooth_shade(ew); base_parts.append(ew)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.07, segments=10, ring_count=6, location=(side*0.2, -0.52, 1.57))
    pupil = bpy.context.object; pupil.name = f'Pupil.{s}'
    assign_mat(pupil, mat_eye_b); smooth_shade(pupil); base_parts.append(pupil)

# Mouth
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.06, segments=8, ring_count=6, location=(0, -0.48, 1.4))
mouth = bpy.context.object; mouth.name = 'Mouth'
mouth.scale = (1.5, 0.5, 0.8); bpy.ops.object.transform_apply(scale=True)
assign_mat(mouth, mat_mouth); smooth_shade(mouth); base_parts.append(mouth)

# Torso (skin base)
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.35, segments=16, ring_count=12, location=(0, 0, 0.75))
torso = bpy.context.object; torso.name = 'Torso'
torso.scale = (1.0, 0.8, 1.3); bpy.ops.object.transform_apply(scale=True)
assign_mat(torso, mat_skin); smooth_shade(torso); base_parts.append(torso)

# Arms (skin)
for side, s in [(1,'L'), (-1,'R')]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.08, depth=0.35, location=(side*0.55, 0, 0.68))
    arm = bpy.context.object; arm.name = f'Arm.{s}'
    assign_mat(arm, mat_skin); smooth_shade(arm); base_parts.append(arm)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.09, segments=8, ring_count=6, location=(side*0.62, 0, 0.48))
    hand = bpy.context.object; hand.name = f'Hand.{s}'
    assign_mat(hand, mat_skin); smooth_shade(hand); base_parts.append(hand)

# Legs (skin base)
for side, s in [(1,'L'), (-1,'R')]:
    bpy.ops.mesh.primitive_cylinder_add(radius=0.1, depth=0.25, location=(side*0.15, 0, 0.2))
    leg = bpy.context.object; leg.name = f'Leg.{s}'
    assign_mat(leg, mat_skin); smooth_shade(leg); base_parts.append(leg)

# Join base
bpy.ops.object.select_all(action='DESELECT')
for p in base_parts:
    p.select_set(True)
bpy.context.view_layer.objects.active = base_parts[0]
bpy.ops.object.join()
base_mesh = bpy.context.object
base_mesh.name = 'CharBase'

parent_to_armature(base_mesh, armature_obj)
add_animations(armature_obj)
export_glb(os.path.join(output_dir, 'char-base.glb'), [base_mesh], armature_obj, with_animations=True)


# ── Helper: build equip part ────────────────────────────────
def build_equip(name, build_fn):
    """Build an equipment piece, parent to armature, export, then clean up the mesh."""
    mesh_parts = build_fn()
    if isinstance(mesh_parts, list):
        bpy.ops.object.select_all(action='DESELECT')
        for p in mesh_parts:
            p.select_set(True)
        bpy.context.view_layer.objects.active = mesh_parts[0]
        bpy.ops.object.join()
        mesh = bpy.context.object
    else:
        mesh = mesh_parts
    mesh.name = name
    parent_to_armature(mesh, armature_obj)
    export_glb(os.path.join(output_dir, f'equip-{name}.glb'), [mesh], armature_obj, with_animations=False)
    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    bpy.ops.object.delete()


# ── 2. HAIR ─────────────────────────────────────────────────

def hair_default():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.57, segments=24, ring_count=16, location=(0, 0, 1.58))
    h = bpy.context.object
    delete_below(h, -0.13)
    assign_mat(h, make_mat('HairDark', (0.36, 0.25, 0.22), 0.8))
    smooth_shade(h)
    return h

build_equip('hair-default', hair_default)

def hair_spiky():
    parts = []
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.56, segments=20, ring_count=12, location=(0, 0, 1.58))
    base = bpy.context.object
    delete_below(base, -0.13)
    mat = make_mat('HairBlond', (0.85, 0.72, 0.3), 0.7)
    assign_mat(base, mat); smooth_shade(base); parts.append(base)
    for i in range(6):
        angle = i * math.pi / 3
        x = math.sin(angle) * 0.3
        y = math.cos(angle) * 0.3
        bpy.ops.mesh.primitive_cone_add(radius1=0.12, depth=0.25, location=(x, y, 2.0))
        spike = bpy.context.object
        spike.rotation_euler = (math.sin(angle)*0.4, math.cos(angle)*0.4, 0)
        bpy.ops.object.transform_apply(rotation=True)
        assign_mat(spike, mat); smooth_shade(spike); parts.append(spike)
    return parts

build_equip('hair-spiky', hair_spiky)


# ── 3. HATS ─────────────────────────────────────────────────

def hat_explorer():
    parts = []
    mat = make_mat('HatGreen', (0.18, 0.49, 0.20), 0.6)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.45, depth=0.06, location=(0, 0, 1.95))
    brim = bpy.context.object; assign_mat(brim, mat); smooth_shade(brim); parts.append(brim)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.32, segments=16, ring_count=8, location=(0, 0, 2.05))
    top = bpy.context.object
    top.scale = (1, 1, 0.6); bpy.ops.object.transform_apply(scale=True)
    delete_below(top, -0.05)
    assign_mat(top, mat); smooth_shade(top); parts.append(top)
    return parts

build_equip('hat-explorer', hat_explorer)

def hat_straw():
    parts = []
    mat = make_mat('HatStraw', (0.85, 0.75, 0.5), 0.9)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.5, depth=0.04, location=(0, 0, 1.93))
    brim = bpy.context.object; assign_mat(brim, mat); smooth_shade(brim); parts.append(brim)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.28, depth=0.22, location=(0, 0, 2.04))
    crown = bpy.context.object; assign_mat(crown, mat); smooth_shade(crown); parts.append(crown)
    mat_ribbon = make_mat('Ribbon', (0.7, 0.15, 0.15), 0.5)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.29, depth=0.04, location=(0, 0, 1.97))
    ribbon = bpy.context.object; assign_mat(ribbon, mat_ribbon); smooth_shade(ribbon); parts.append(ribbon)
    return parts

build_equip('hat-straw', hat_straw)

def hat_cap():
    parts = []
    mat = make_mat('HatCap', (0.2, 0.3, 0.6), 0.5)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.38, segments=16, ring_count=8, location=(0, 0, 1.85))
    dome = bpy.context.object
    dome.scale = (1, 1, 0.55); bpy.ops.object.transform_apply(scale=True)
    delete_below(dome, -0.05)
    assign_mat(dome, mat); smooth_shade(dome); parts.append(dome)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.22, depth=0.03, location=(0, -0.35, 1.82))
    visor = bpy.context.object
    visor.rotation_euler = (0.5, 0, 0); bpy.ops.object.transform_apply(rotation=True)
    assign_mat(visor, mat); smooth_shade(visor); parts.append(visor)
    return parts

build_equip('hat-cap', hat_cap)


# ── 4. TOPS ─────────────────────────────────────────────────

def top_blue():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.36, segments=16, ring_count=12, location=(0, 0, 0.75))
    t = bpy.context.object
    t.scale = (1.02, 0.82, 1.32); bpy.ops.object.transform_apply(scale=True)
    assign_mat(t, make_mat('TopBlue', (0.31, 0.76, 0.97), 0.5)); smooth_shade(t)
    return t

build_equip('top-blue', top_blue)

def top_green():
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.36, segments=16, ring_count=12, location=(0, 0, 0.75))
    t = bpy.context.object
    t.scale = (1.02, 0.82, 1.32); bpy.ops.object.transform_apply(scale=True)
    assign_mat(t, make_mat('TopGreen', (0.2, 0.55, 0.25), 0.5)); smooth_shade(t)
    return t

build_equip('top-green', top_green)

def top_vest():
    parts = []
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.37, segments=16, ring_count=12, location=(0, 0, 0.75))
    t = bpy.context.object
    t.scale = (1.03, 0.83, 1.33); bpy.ops.object.transform_apply(scale=True)
    assign_mat(t, make_mat('TopVestBase', (0.9, 0.85, 0.75), 0.6)); smooth_shade(t); parts.append(t)
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0, -0.15, 0.75))
    vest = bpy.context.object
    vest.scale = (1.2, 0.3, 1.3); bpy.ops.object.transform_apply(scale=True)
    subdivide(vest, 1)
    assign_mat(vest, make_mat('VestOlive', (0.35, 0.4, 0.2), 0.7)); smooth_shade(vest); parts.append(vest)
    return parts

build_equip('top-vest', top_vest)


# ── 5. BOTTOMS ──────────────────────────────────────────────

def bottom_grey():
    parts = []
    mat = make_mat('PantsGrey', (0.22, 0.28, 0.31), 0.7)
    for side, s in [(1,'L'), (-1,'R')]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=0.26, location=(side*0.15, 0, 0.2))
        p = bpy.context.object; p.name = f'Pants.{s}'
        assign_mat(p, mat); smooth_shade(p); parts.append(p)
    return parts

build_equip('bottom-grey', bottom_grey)

def bottom_khaki():
    parts = []
    mat = make_mat('PantsKhaki', (0.65, 0.58, 0.42), 0.7)
    for side, s in [(1,'L'), (-1,'R')]:
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.22, location=(side*0.15, 0, 0.22))
        p = bpy.context.object; p.name = f'Shorts.{s}'
        assign_mat(p, mat); smooth_shade(p); parts.append(p)
    return parts

build_equip('bottom-khaki', bottom_khaki)


# ── 6. SHOES ────────────────────────────────────────────────

def shoes_brown():
    parts = []
    mat = make_mat('ShoeBrown', (0.47, 0.33, 0.28), 0.8)
    for side, s in [(1,'L'), (-1,'R')]:
        bpy.ops.mesh.primitive_cube_add(size=0.2, location=(side*0.15, -0.03, 0.06))
        sh = bpy.context.object; sh.name = f'Shoe.{s}'
        sh.scale = (1.0, 1.4, 0.6); bpy.ops.object.transform_apply(scale=True)
        subdivide(sh, 2)
        assign_mat(sh, mat); smooth_shade(sh); parts.append(sh)
    return parts

build_equip('shoes-brown', shoes_brown)

def shoes_sneaker():
    parts = []
    mat_main = make_mat('SneakerWhite', (0.92, 0.92, 0.92), 0.4)
    mat_sole = make_mat('SneakerSole', (0.3, 0.3, 0.35), 0.8)
    for side, s in [(1,'L'), (-1,'R')]:
        bpy.ops.mesh.primitive_cube_add(size=0.2, location=(side*0.15, -0.03, 0.07))
        sh = bpy.context.object; sh.name = f'Sneaker.{s}'
        sh.scale = (1.0, 1.4, 0.55); bpy.ops.object.transform_apply(scale=True)
        subdivide(sh, 2)
        assign_mat(sh, mat_main); smooth_shade(sh); parts.append(sh)
        bpy.ops.mesh.primitive_cube_add(size=0.2, location=(side*0.15, -0.03, 0.02))
        sole = bpy.context.object; sole.name = f'Sole.{s}'
        sole.scale = (1.05, 1.5, 0.2); bpy.ops.object.transform_apply(scale=True)
        assign_mat(sole, mat_sole); smooth_shade(sole); parts.append(sole)
    return parts

build_equip('shoes-sneaker', shoes_sneaker)


# ── 7. ACCESSORIES ──────────────────────────────────────────

def acc_backpack():
    bpy.ops.mesh.primitive_cube_add(size=0.3, location=(0, 0.3, 0.75))
    bp = bpy.context.object; bp.name = 'Backpack'
    bp.scale = (0.8, 0.6, 1.0); bpy.ops.object.transform_apply(scale=True)
    subdivide(bp, 2)
    assign_mat(bp, make_mat('BackpackBrown', (0.55, 0.40, 0.15), 0.7))
    smooth_shade(bp)
    return bp

build_equip('acc-backpack', acc_backpack)

def acc_camera():
    parts = []
    mat = make_mat('CameraBlack', (0.15, 0.15, 0.15), 0.3)
    bpy.ops.mesh.primitive_cube_add(size=0.12, location=(0.3, -0.2, 0.65))
    body = bpy.context.object; body.name = 'CamBody'
    body.scale = (1.2, 0.8, 0.8); bpy.ops.object.transform_apply(scale=True)
    assign_mat(body, mat); smooth_shade(body); parts.append(body)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.04, depth=0.06, location=(0.3, -0.28, 0.65))
    lens = bpy.context.object; lens.name = 'CamLens'
    lens.rotation_euler = (math.pi/2, 0, 0); bpy.ops.object.transform_apply(rotation=True)
    assign_mat(lens, make_mat('LensGlass', (0.3, 0.35, 0.5), 0.1))
    smooth_shade(lens); parts.append(lens)
    return parts

build_equip('acc-camera', acc_camera)

def acc_magnifier():
    parts = []
    mat_handle = make_mat('MagHandle', (0.5, 0.35, 0.2), 0.7)
    mat_glass = make_mat('MagGlass', (0.8, 0.9, 1.0), 0.1)
    bpy.ops.mesh.primitive_cylinder_add(radius=0.02, depth=0.18, location=(-0.35, -0.15, 0.55))
    handle = bpy.context.object; handle.name = 'MagHandle'
    handle.rotation_euler = (0, 0.3, 0); bpy.ops.object.transform_apply(rotation=True)
    assign_mat(handle, mat_handle); smooth_shade(handle); parts.append(handle)
    bpy.ops.mesh.primitive_torus_add(major_radius=0.06, minor_radius=0.012, location=(-0.38, -0.15, 0.65))
    ring = bpy.context.object; ring.name = 'MagRing'
    assign_mat(ring, mat_handle); smooth_shade(ring); parts.append(ring)
    bpy.ops.mesh.primitive_circle_add(radius=0.055, location=(-0.38, -0.15, 0.65))
    glass = bpy.context.object; glass.name = 'MagGlass'
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.fill()
    bpy.ops.object.mode_set(mode='OBJECT')
    assign_mat(glass, mat_glass); parts.append(glass)
    return parts

build_equip('acc-magnifier', acc_magnifier)


print('\n🎉 All character parts generated!\n')
print('Files in public/models/:')
for f in sorted(os.listdir(output_dir)):
    if f.endswith('.glb'):
        size = os.path.getsize(os.path.join(output_dir, f))
        print(f'  {f} ({size/1024:.1f} KB)')
