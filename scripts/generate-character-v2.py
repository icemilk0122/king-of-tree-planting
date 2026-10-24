"""Generate the stylized Shade Keeper character and modular wardrobe.

The design follows the approved concept: oversized curly hair, black glasses,
orange neckerchief, striped shirt, dark trousers and chunky sneakers.

Outputs:
  assets/blender/shade-keeper-character.blend
  public/models/char-base.glb
  public/models/equip-*.glb
  public/models/character-v2-preview.png
"""

import bpy
import math
import os
from mathutils import Vector


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
MODEL_DIR = os.path.join(PROJECT_DIR, "public", "models")
BLEND_DIR = os.path.join(PROJECT_DIR, "assets", "blender")
PREVIEW_PATH = os.path.join(MODEL_DIR, "character-v2-preview.png")
FACE_PREVIEW_PATH = os.path.join(MODEL_DIR, "character-v2-face-preview.png")
GUARDIAN_PREVIEW_PATH = os.path.join(MODEL_DIR, "character-guardian-preview.png")
VACATION_PREVIEW_PATH = os.path.join(MODEL_DIR, "character-vacation-preview.png")
BLEND_PATH = os.path.join(BLEND_DIR, "shade-keeper-character.blend")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(BLEND_DIR, exist_ok=True)


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures,
                       bpy.data.materials, bpy.data.cameras, bpy.data.lights):
        pass


def material(name, color, roughness=0.55, metallic=0.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.diffuse_color = (*color[:3], color[3] if len(color) > 3 else 1.0)
    mat.use_nodes = True
    shader = next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = mat.diffuse_color
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    return mat


def apply_material(obj, mat):
    if hasattr(obj.data, "materials"):
        obj.data.materials.clear()
        obj.data.materials.append(mat)


def smooth(obj):
    if obj.type == "MESH":
        for poly in obj.data.polygons:
            poly.use_smooth = True


def bevel(obj, width=0.06, segments=3):
    modifier = obj.modifiers.new("Soft edges", "BEVEL")
    modifier.width = width
    modifier.segments = segments
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def sphere(name, location, scale, mat, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, radius=1.0, location=location
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    smooth(obj)
    return obj


def rounded_cube(name, location, scale, mat, radius=0.08):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bevel(obj, radius, 4)
    apply_material(obj, mat)
    smooth(obj)
    return obj


def cylinder_between(name, start, end, radius, mat, vertices=20):
    start, end = Vector(start), Vector(end)
    delta = end - start
    midpoint = (start + end) * 0.5
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices, radius=radius, depth=delta.length, location=midpoint
    )
    obj = bpy.context.object
    obj.name = name
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    apply_material(obj, mat)
    smooth(obj)
    bevel(obj, min(radius * 0.28, 0.035), 3)
    return obj


def capsule_between(name, start, end, radius, mat, segments=28, rings=18):
    """A soft toy-like limb with rounded ends."""
    start, end = Vector(start), Vector(end)
    delta = end - start
    midpoint = (start + end) * 0.5
    obj = sphere(
        name,
        midpoint,
        (radius, radius, delta.length * 0.5 + radius * 0.30),
        mat,
        segments,
        rings,
    )
    obj.rotation_euler = delta.to_track_quat("Z", "Y").to_euler()
    return obj


def bullet_cylinder(name, location, radius, depth, mat, y_scale=0.76):
    """Straight-sided torso with softly rounded, toy-like caps."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=48, radius=radius, depth=depth, location=location
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale.y = y_scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    bevel(obj, min(radius * 0.26, depth * 0.18), 6)
    smooth(obj)
    return obj


def fedora_crown(name, location, bottom_radius, top_radius, depth, mat, y_scale=.82):
    """A softly beveled tapered crown with the proportions of a straw fedora."""
    bpy.ops.mesh.primitive_cone_add(
        vertices=48,
        radius1=bottom_radius,
        radius2=top_radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale.y = y_scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    bevel(obj, .055, 5)
    smooth(obj)
    return obj


def torus(name, location, major_radius, minor_radius, mat, scale=(1, 1, 1), rotation=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=40,
        minor_segments=10,
        location=location,
        rotation=rotation,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_material(obj, mat)
    smooth(obj)
    return obj


def tube(name, points, radius, mat, cyclic=False):
    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 2
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("POLY")
    spline.points.add(len(points) - 1)
    for p, co in zip(spline.points, points):
        p.co = (*co, 1.0)
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    apply_material(obj, mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    smooth(obj)
    return obj


def smooth_tube(name, points, radius, mat, radii=None, cyclic=False):
    """A soft Bézier tube used for chunky, readable sculpted hair locks."""
    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 5
    curve.render_resolution_u = 5
    curve.bevel_depth = radius
    curve.bevel_resolution = 5
    curve.resolution_v = 5
    curve.use_fill_caps = True
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    if radii is None:
        radii = [1.0] * len(points)
    for point, co, point_radius in zip(spline.bezier_points, points, radii):
        point.co = co
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
        point.radius = point_radius
    spline.use_cyclic_u = cyclic
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    apply_material(obj, mat)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    smooth(obj)
    return obj


def squircle_points(cx, y, cz, width, height, count=64, exponent=4.0):
    result = []
    for i in range(count):
        angle = 2 * math.pi * i / count
        c, s = math.cos(angle), math.sin(angle)
        x = cx + width * math.copysign(abs(c) ** (2.0 / exponent), c)
        z = cz + height * math.copysign(abs(s) ** (2.0 / exponent), s)
        result.append((x, y, z))
    return result


def prism(name, front_points, depth, mat, bevel_width=.018):
    # front_points are (x, z); front of the character faces negative Y.
    yf, yb = -depth * 0.5, depth * 0.5
    verts = [(x, yf, z) for x, z in front_points] + [(x, yb, z) for x, z in front_points]
    n = len(front_points)
    faces = [tuple(range(n)), tuple(range(n, n * 2))]
    for i in range(n):
        j = (i + 1) % n
        faces.append((i, j, n + j, n + i))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    apply_material(obj, mat)
    if bevel_width:
        bevel(obj, bevel_width, 2)
    return obj


def squircle_xz_points(cx, cz, width, height, count=48, exponent=3.2):
    points = []
    for i in range(count):
        angle = 2 * math.pi * i / count
        c, s = math.cos(angle), math.sin(angle)
        x = cx + width * math.copysign(abs(c) ** (2.0 / exponent), c)
        z = cz + height * math.copysign(abs(s) ** (2.0 / exponent), s)
        points.append((x, z))
    return points


def create_armature():
    armature_data = bpy.data.armatures.new("ShadeKeeperRig")
    armature = bpy.data.objects.new("CharacterArmature", armature_data)
    bpy.context.collection.objects.link(armature)
    bpy.context.view_layer.objects.active = armature
    armature.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")

    def bone(name, head, tail, parent=None):
        b = armature_data.edit_bones.new(name)
        b.head = head
        b.tail = tail
        if parent:
            b.parent = armature_data.edit_bones[parent]
        return b

    bone("Root", (0, 0, 0.12), (0, 0, 0.45))
    bone("Spine", (0, 0, 0.45), (0, 0, 1.25), "Root")
    bone("Chest", (0, 0, 1.25), (0, 0, 1.92), "Spine")
    bone("Neck", (0, 0, 1.92), (0, 0, 2.15), "Chest")
    bone("Head", (0, 0, 2.15), (0, 0, 2.92), "Neck")
    bone("UpperArm.L", (0.48, 0, 1.76), (0.78, 0, 1.45), "Chest")
    bone("LowerArm.L", (0.78, 0, 1.45), (0.98, 0, 1.10), "UpperArm.L")
    bone("Hand.L", (0.98, 0, 1.10), (1.03, 0, 0.95), "LowerArm.L")
    bone("UpperArm.R", (-0.48, 0, 1.76), (-0.78, 0, 1.45), "Chest")
    bone("LowerArm.R", (-0.78, 0, 1.45), (-0.98, 0, 1.10), "UpperArm.R")
    bone("Hand.R", (-0.98, 0, 1.10), (-1.03, 0, 0.95), "LowerArm.R")
    bone("UpperLeg.L", (0.22, 0, 0.78), (0.22, 0, 0.40), "Root")
    bone("LowerLeg.L", (0.22, 0, 0.40), (0.22, 0, 0.10), "UpperLeg.L")
    bone("Foot.L", (0.22, 0, 0.10), (0.22, -0.28, 0.08), "LowerLeg.L")
    bone("UpperLeg.R", (-0.22, 0, 0.78), (-0.22, 0, 0.40), "Root")
    bone("LowerLeg.R", (-0.22, 0, 0.40), (-0.22, 0, 0.10), "UpperLeg.R")
    bone("Foot.R", (-0.22, 0, 0.10), (-0.22, -0.28, 0.08), "LowerLeg.R")
    bpy.ops.object.mode_set(mode="OBJECT")
    return armature


def rigid_bind(obj, armature, bone_name):
    group = obj.vertex_groups.new(name=bone_name)
    group.add(list(range(len(obj.data.vertices))), 1.0, "REPLACE")
    modifier = obj.modifiers.new("Character rig", "ARMATURE")
    modifier.object = armature
    # glTF expects the armature to be the skinned mesh's parent.
    obj.parent = armature
    return obj


def add_animations(armature):
    armature.animation_data_create()

    def key(action, bone_name, frame, rotation=(0, 0, 0), location=None):
        armature.animation_data.action = action
        pose_bone = armature.pose.bones[bone_name]
        pose_bone.rotation_mode = "XYZ"
        pose_bone.rotation_euler = rotation
        pose_bone.keyframe_insert("rotation_euler", frame=frame)
        if location is not None:
            pose_bone.location = location
            pose_bone.keyframe_insert("location", frame=frame)

    idle = bpy.data.actions.new("Idle")
    idle.use_fake_user = True
    for frame, lift in ((1, 0.0), (24, 0.018), (48, 0.0)):
        key(idle, "Chest", frame, (0.015 + lift, 0, 0))
        key(idle, "Head", frame, (-0.01 - lift * 0.5, 0, 0))
        key(idle, "UpperArm.L", frame, (lift, 0, -0.02))
        key(idle, "UpperArm.R", frame, (lift, 0, 0.02))

    walk = bpy.data.actions.new("Walk")
    walk.use_fake_user = True
    phases = {
        1:  (0.48, -0.48, -0.42, 0.42),
        7:  (0.0, 0.0, 0.0, 0.0),
        13: (-0.48, 0.48, 0.42, -0.42),
        19: (0.0, 0.0, 0.0, 0.0),
        25: (0.48, -0.48, -0.42, 0.42),
    }
    for frame, (leg_l, leg_r, arm_l, arm_r) in phases.items():
        key(walk, "UpperLeg.L", frame, (leg_l, 0, 0))
        key(walk, "UpperLeg.R", frame, (leg_r, 0, 0))
        key(walk, "LowerLeg.L", frame, (max(0, -leg_l) * 0.55, 0, 0))
        key(walk, "LowerLeg.R", frame, (max(0, -leg_r) * 0.55, 0, 0))
        key(walk, "UpperArm.L", frame, (arm_l, 0, 0))
        key(walk, "UpperArm.R", frame, (arm_r, 0, 0))
        key(walk, "Chest", frame, (0.02, 0, math.sin(frame / 25 * math.pi * 2) * 0.025))

    armature.animation_data.action = None
    for action in (idle, walk):
        track = armature.animation_data.nla_tracks.new()
        track.name = action.name
        track.strips.new(action.name, int(action.frame_range[0]), action)


def make_character():
    clean_scene()

    skin = material("Skin", (0.96, 0.67, 0.50, 1), 0.48)
    skin_light = material("SkinLight", (1.0, 0.76, 0.60, 1), 0.45)
    blush = material("Blush", (1.0, 0.38, 0.32, 1), 0.55)
    hair_mat = material("DeepBrownHair", (0.018, 0.010, 0.008, 1), 0.42)
    dark = material("Charcoal", (0.035, 0.04, 0.045, 1), 0.62)
    white = material("WarmWhite", (0.93, 0.91, 0.86, 1), 0.55)
    orange = material("GuardianOrange", (1.0, 0.25, 0.035, 1), 0.48)
    mouth = material("Mouth", (0.012, 0.004, 0.003, 1), 0.58)
    tongue = material("Tongue", (0.85, 0.16, 0.18, 1), 0.5)
    green = material("ForestGreen", (0.12, 0.34, 0.16, 1), 0.65)
    khaki = material("Khaki", (0.58, 0.45, 0.27, 1), 0.72)
    blue = material("DenimBlue", (0.10, 0.24, 0.40, 1), 0.62)
    navy = material("GuardianNavy", (0.025, 0.055, 0.13, 1), 0.58)
    floral_blue = material("FloralNavy", (0.025, 0.10, 0.20, 1), 0.58)
    sky = material("FloralSky", (0.38, 0.68, 0.82, 1), 0.52)
    straw_band = material("StrawBand", (0.48, 0.27, 0.10, 1), 0.68)
    sole_grey = material("SoleGrey", (0.62, 0.65, 0.65, 1), 0.72)
    sunglass_mat = material("FlatSunglassLens", (0.008, 0.016, 0.028, 1), 0.25, 0.18)

    rig = create_armature()
    base = []
    equipment = {key: [] for key in (
        "hair-default", "hair-neat", "hair-spiky", "face-glasses", "face-sunglasses",
        "hat-explorer", "hat-straw", "hat-cap",
        "top-blue", "top-green", "top-vest", "top-polo-white", "top-floral",
        "bottom-grey", "bottom-khaki", "bottom-navy", "bottom-black-shorts",
        "shoes-brown", "shoes-sneaker", "shoes-white", "shoes-flipflops",
        "acc-backpack", "acc-camera", "acc-magnifier"
    )}

    def add_base(obj, bone):
        rigid_bind(obj, rig, bone)
        base.append(obj)
        return obj

    def add_equip(slot, obj, bone):
        rigid_bind(obj, rig, bone)
        equipment[slot].append(obj)
        return obj

    # Head and facial identity.
    add_base(sphere("Head", (0, 0, 2.56), (0.72, 0.61, 0.68), skin), "Head")
    add_base(sphere("Ear.L", (0.68, 0, 2.56), (0.15, 0.10, 0.19), skin), "Head")
    add_base(sphere("Ear.R", (-0.68, 0, 2.56), (0.15, 0.10, 0.19), skin), "Head")
    add_base(sphere("EarInner.L", (0.695, -0.078, 2.56), (0.07, 0.025, 0.10), blush), "Head")
    add_base(sphere("EarInner.R", (-0.695, -0.078, 2.56), (0.07, 0.025, 0.10), blush), "Head")
    add_base(sphere("Nose", (0, -0.60, 2.50), (0.085, 0.055, 0.075), skin_light), "Head")
    add_base(sphere("Cheek.L", (0.38, -0.575, 2.38), (0.13, 0.025, 0.065), blush), "Head")
    add_base(sphere("Cheek.R", (-0.38, -0.575, 2.38), (0.13, 0.025, 0.065), blush), "Head")

    # Closed happy eyes and brows.
    for side, label in ((1, "L"), (-1, "R")):
        cx = side * 0.27
        eye_pts = []
        brow_pts = []
        for i in range(13):
            t = math.pi * i / 12
            eye_pts.append((cx + 0.16 * math.cos(t), -0.624, 2.56 + 0.055 * math.sin(t)))
            brow_pts.append((cx + 0.18 * math.cos(t), -0.615, 2.76 + 0.045 * math.sin(t)))
        add_base(tube(f"Eye.{label}", eye_pts, 0.022, dark), "Head")
        add_base(tube(f"Brow.{label}", brow_pts, 0.032, hair_mat), "Head")

    # Glasses: rounded-square frames, bridge and temples.
    for side, label in ((1, "L"), (-1, "R")):
        frame = tube(
            f"Glasses.{label}",
            squircle_points(side * 0.285, -0.655, 2.58, 0.255, 0.205),
            0.028, dark, cyclic=True,
        )
        add_equip("face-glasses", frame, "Head")
    add_equip("face-glasses", tube("GlassesBridge", [(-0.03, -0.655, 2.60), (0.03, -0.655, 2.60)], 0.025, dark), "Head")
    add_equip("face-glasses", tube("GlassesTemple.L", [(0.53, -0.63, 2.62), (0.67, -0.25, 2.60)], 0.024, dark), "Head")
    add_equip("face-glasses", tube("GlassesTemple.R", [(-0.53, -0.63, 2.62), (-0.67, -0.25, 2.60)], 0.024, dark), "Head")

    # Vacation sunglasses fully replace the framed glasses. The lenses are
    # thin rounded planes rather than convex spheres or a second frame layer.
    for side, label in ((1, "L"), (-1, "R")):
        sunglass = prism(
            f"FlatSunglass.{label}",
            squircle_xz_points(side*.285, 2.59, .245, .195),
            .014,
            sunglass_mat,
            .004,
        )
        sunglass.location.y = -.652
        add_equip("face-sunglasses", sunglass, "Head")
    add_equip("face-sunglasses", tube("SunglassBridge", [(-.055,-.660,2.60),(.055,-.660,2.60)], .022, dark), "Head")
    add_equip("face-sunglasses", tube("SunglassTemple.L", [( .51,-.64,2.61),(.67,-.25,2.60)], .018, dark), "Head")
    add_equip("face-sunglasses", tube("SunglassTemple.R", [(-.51,-.64,2.61),(-.67,-.25,2.60)], .018, dark), "Head")

    # Smile with teeth and tongue.
    add_base(sphere("Smile", (0, -0.605, 2.32), (0.245, 0.034, 0.135), mouth), "Head")
    add_base(rounded_cube("Teeth", (0, -0.645, 2.37), (0.31, 0.022, 0.060), white, 0.026), "Head")
    add_base(sphere("Tongue", (0, -0.65, 2.25), (0.112, 0.018, 0.035), tongue), "Head")

    # Neck and body under clothing.
    add_base(cylinder_between("Neck", (0, 0, 1.90), (0, 0, 2.16), 0.16, skin), "Neck")
    add_base(bullet_cylinder("Body", (0, 0, 1.43), .43, 1.02, skin, .74), "Chest")

    # Arms in a game-friendly A-pose.
    arm_points = {
        "L": ((0.48, 0, 1.73), (0.78, 0, 1.45), (0.99, 0, 1.10)),
        "R": ((-0.48, 0, 1.73), (-0.78, 0, 1.45), (-0.99, 0, 1.10)),
    }
    for label, (shoulder, elbow, wrist) in arm_points.items():
        add_base(cylinder_between(f"UpperArm.{label}", shoulder, elbow, 0.12, skin), f"UpperArm.{label}")
        add_base(sphere(f"Elbow.{label}", elbow, (0.13, 0.13, 0.13), skin), f"LowerArm.{label}")
        add_base(cylinder_between(f"Forearm.{label}", elbow, wrist, 0.105, skin), f"LowerArm.{label}")
        add_base(sphere(f"Hand.{label}", wrist, (0.14, 0.11, 0.17), skin), f"Hand.{label}")

    # Bare legs under modular trousers and shoes.
    for x, label in ((0.22, "L"), (-0.22, "R")):
        add_base(capsule_between(f"UpperLegSkin.{label}", (x, 0, 0.76), (x, 0, 0.42), 0.13, skin), f"UpperLeg.{label}")
        add_base(capsule_between(f"LowerLegSkin.{label}", (x, 0, 0.40), (x, 0, 0.12), 0.12, skin), f"LowerLeg.{label}")

    # Curly signature hair. The cap supplies the overall mass while the thick
    # C/S-shaped locks make the silhouette read as short curls rather than a
    # cluster of separate balls.
    add_equip(
        "hair-default",
        sphere("HairCap", (0, 0.055, 2.96), (0.70, 0.57, 0.45), hair_mat),
        "Head",
    )
    curl_locks = [
        # Large front locks, each turning back into itself like a loose spiral.
        ("FrontCurl.L", [
            (-.64,-.12,3.01), (-.69,-.53,3.22), (-.57,-.61,3.39),
            (-.36,-.66,3.45), (-.18,-.68,3.34), (-.20,-.18,3.19),
        ], .108),
        ("FrontCurl.C", [
            (-.34,-.18,3.37), (-.18,-.65,3.55), (.05,-.68,3.57),
            (.23,-.69,3.44), (.22,-.71,3.29), (.08,-.72,3.20),
            (-.04,-.18,3.25),
        ], .112),
        ("FrontCurl.R", [
            (.16,-.18,3.36), (.32,-.65,3.50), (.53,-.61,3.43),
            (.66,-.54,3.25), (.61,-.58,3.09), (.46,-.16,3.03),
        ], .103),
        # Short comma-shaped fringe curls fill the forehead while keeping the
        # eyebrows and glasses unobstructed. Both ends tuck into the hair cap.
        ("FringeCurl.L", [
            (-.50,-.10,3.12), (-.47,-.63,3.10), (-.38,-.71,2.99),
            (-.25,-.70,2.95), (-.18,-.12,3.02),
        ], .074),
        ("FringeCurl.C", [
            (-.22,-.10,3.14), (-.16,-.67,3.08), (-.05,-.72,2.98),
            (.07,-.69,2.99), (.13,-.11,3.07),
        ], .078),
        ("FringeCurl.R", [
            (.10,-.10,3.13), (.18,-.67,3.07), (.30,-.71,2.97),
            (.42,-.66,3.00), (.49,-.10,3.08),
        ], .074),
        # Temple ringlets give the side silhouette a clear wave.
        ("TempleCurl.L", [
            (-.58,.02,3.19), (-.74,-.35,3.10), (-.78,-.40,2.92),
            (-.70,-.49,2.77), (-.58,.02,2.82),
        ], .095),
        ("TempleCurl.R", [
            (.58,.02,3.20), (.74,-.34,3.11), (.78,-.39,2.93),
            (.71,-.49,2.78), (.59,.02,2.82),
        ], .095),
        # Crown waves keep the top from reading as a smooth helmet in profile.
        ("CrownCurl.L", [
            (-.62,.06,3.18), (-.57,-.25,3.42), (-.38,-.27,3.55),
            (-.22,-.28,3.46), (-.25,.06,3.33),
        ], .110),
        ("CrownCurl.R", [
            (.08,.06,3.48), (.22,-.28,3.61), (.44,-.25,3.54),
            (.58,-.22,3.39), (.51,.06,3.27),
        ], .110),
    ]
    for name, points, radius in curl_locks:
        taper = [.72] + [1.0] * (len(points) - 2) + [.68]
        add_equip(
            "hair-default",
            smooth_tube(name, points, radius, hair_mat, taper),
            "Head",
        )

    # A lower-volume hairstyle designed specifically to sit beneath hats.
    add_equip("hair-neat", sphere("NeatHairCap", (0,.055,2.98),(.69,.56,.42),hair_mat), "Head")
    neat_fringe = [
        (-.58,-.16,3.08), (-.40,-.59,3.17), (-.12,-.65,3.24),
        (.16,-.64,3.18), (.42,-.55,3.05), (.57,-.14,2.98),
    ]
    add_equip("hair-neat", smooth_tube("NeatSideSweep", neat_fringe, .085, hair_mat, [.65,1,1,1,1,.65]), "Head")

    # Alternate spiky hair.
    add_equip("hair-spiky", sphere("SpikyCap", (0, 0.04, 2.98), (0.68, 0.57, 0.43), hair_mat), "Head")
    for idx in range(9):
        angle = (idx / 9.0) * math.pi * 1.35 - math.pi * .18
        x = math.cos(angle) * .48
        y = math.sin(angle) * .25 - .03
        spike = cylinder_between(f"Spike.{idx}", (x, y, 3.10), (x * 1.25, y * 1.2, 3.45), .10, hair_mat, 16)
        add_equip("hair-spiky", spike, "Head")

    # Orange neckerchief is part of the character identity.
    add_base(torus("ScarfCollar", (0, 0, 1.98), .27, .075, orange, scale=(1, .82, 1)), "Neck")
    scarf_front = prism("ScarfFront", [(-.27, 2.01), (.27, 2.01), (0, 1.71)], .045, orange)
    scarf_front.location.y = -0.37
    add_base(scarf_front, "Chest")
    add_base(sphere("ScarfKnot", (0.31, -0.30, 1.98), (.11, .09, .10), orange), "Neck")
    tail_a = prism("ScarfTailA", [(0.30, 2.00), (0.62, 2.08), (0.42, 1.82)], .045, orange)
    tail_a.location.y = -0.22
    add_base(tail_a, "Neck")
    tail_b = prism("ScarfTailB", [(0.32, 1.98), (0.61, 1.86), (0.39, 1.73)], .045, orange)
    tail_b.location.y = -0.18
    add_base(tail_b, "Neck")

    # Default striped shirt (keeps the historical top-blue asset id).
    shirt_center_z = 1.43
    add_equip("top-blue", bullet_cylinder("StripedShirt", (0, 0, shirt_center_z), .48, 1.10, white, .75), "Chest")
    stripe_zs = (1.08, 1.21, 1.34, 1.47, 1.60, 1.73)
    stripe_widths = (.72, .84, .88, .88, .84, .72)
    for i, (z, width) in enumerate(zip(stripe_zs, stripe_widths)):
        stripe = rounded_cube(
            f"ShirtStripe.{i}", (0, -.365, z), (width, .006, .040), dark, .018
        )
        add_equip("top-blue", stripe, "Chest")
    for label, sign in (("L", 1), ("R", -1)):
        sleeve = cylinder_between(f"Sleeve.{label}", (sign*.48, 0, 1.72), (sign*.62, 0, 1.58), .16, white)
        add_equip("top-blue", sleeve, f"UpperArm.{label}")
        for j, t in enumerate((.28, .62)):
            p1 = Vector((sign*.48, 0, 1.72)).lerp(Vector((sign*.62, 0, 1.58)), t)
            band = torus(f"SleeveStripe.{label}.{j}", p1, .14, .018, dark, rotation=(0, math.pi/4*sign, 0))
            add_equip("top-blue", band, f"UpperArm.{label}")

    # Alternate tops.
    add_equip("top-green", bullet_cylinder("GreenTop", (0, 0, 1.43), .48, 1.10, green, .75), "Chest")
    add_equip("top-vest", bullet_cylinder("OrangeVest", (0, .01, 1.43), .50, 1.12, orange, .75), "Chest")
    for label, sign in (("L", 1), ("R", -1)):
        add_equip("top-green", cylinder_between(f"GreenSleeve.{label}", (sign*.48,0,1.72),(sign*.62,0,1.58),.16,green), f"UpperArm.{label}")

    # Guardian uniform: a clean white polo with a small collar and buttons.
    add_equip("top-polo-white", bullet_cylinder("WhitePolo", (0, 0, 1.43), .48, 1.10, white, .75), "Chest")
    for label, sign in (("L", 1), ("R", -1)):
        add_equip(
            "top-polo-white",
            cylinder_between(f"PoloSleeve.{label}", (sign*.48,0,1.72),(sign*.63,0,1.58),.16,white),
            f"UpperArm.{label}",
        )
    for name, points in (
        ("PoloCollar.L", [(-.31,1.88),(-.03,1.88),(-.10,1.67)]),
        ("PoloCollar.R", [(.03,1.88),(.31,1.88),(.10,1.67)]),
    ):
        collar = prism(name, points, .035, sole_grey)
        collar.location.y = -.382
        add_equip("top-polo-white", collar, "Chest")
    for index, z in enumerate((1.69, 1.58)):
        add_equip("top-polo-white", sphere(f"PoloButton.{index}", (0,-.405,z),(.025,.012,.025),dark,16,10), "Chest")

    # Vacation shirt: navy short sleeves with simple leaf-shaped tropical print.
    add_equip("top-floral", bullet_cylinder("FloralShirt", (0, 0, 1.43), .49, 1.11, floral_blue, .75), "Chest")
    for label, sign in (("L", 1), ("R", -1)):
        add_equip(
            "top-floral",
            cylinder_between(f"FloralSleeve.{label}", (sign*.48,0,1.72),(sign*.64,0,1.57),.165,floral_blue),
            f"UpperArm.{label}",
        )
    leaf_clusters = (
        (-.30,1.68,18,white), (.06,1.70,-28,sky), (.31,1.48,14,white),
        (-.18,1.39,-34,sky), (.13,1.20,28,white), (-.31,1.08,-12,sky),
    )
    leaf_index = 0
    for cx, cz, base_angle, leaf_mat in leaf_clusters:
        for spread in (-36, 0, 36):
            angle = base_angle + spread
            offset_angle = math.radians(angle)
            x = cx + math.sin(offset_angle) * .035
            z = cz + math.cos(offset_angle) * .035
            leaf = sphere(f"FloralLeaf.{leaf_index}", (x,-.382,z),(.026,.010,.074),leaf_mat,16,10)
            leaf.rotation_euler.y = math.radians(angle)
            add_equip("top-floral", leaf, "Chest")
            leaf_index += 1

    # Trousers and shorts.
    add_equip("bottom-grey", rounded_cube("DarkWaist", (0, 0, .82), (.48, .34, .20), dark, .13), "Root")
    for x, label in ((.22, "L"), (-.22, "R")):
        add_equip("bottom-grey", bullet_cylinder(f"DarkTrouserUpper.{label}", (x,0,.61),.17,.38,dark,.82), f"UpperLeg.{label}")
        add_equip("bottom-grey", bullet_cylinder(f"DarkTrouserLower.{label}", (x,0,.30),.155,.30,dark,.82), f"LowerLeg.{label}")
        cuff = torus(f"TrouserCuff.{label}", (x,0,.18), .16, .025, dark, scale=(1,.85,1))
        add_equip("bottom-grey", cuff, f"LowerLeg.{label}")
    add_equip("bottom-khaki", rounded_cube("KhakiWaist", (0, 0, .82), (.48, .34, .20), khaki, .13), "Root")
    for x, label in ((.22, "L"), (-.22, "R")):
        add_equip("bottom-khaki", cylinder_between(f"KhakiShort.{label}", (x,0,.76),(x,0,.48),.19,khaki), f"UpperLeg.{label}")
    add_equip("bottom-navy", rounded_cube("NavyWaist", (0, 0, .82), (.48, .34, .20), navy, .13), "Root")
    for x, label in ((.22, "L"), (-.22, "R")):
        add_equip("bottom-navy", bullet_cylinder(f"NavyTrouserUpper.{label}", (x,0,.61),.17,.38,navy,.82), f"UpperLeg.{label}")
        add_equip("bottom-navy", bullet_cylinder(f"NavyTrouserLower.{label}", (x,0,.30),.155,.30,navy,.82), f"LowerLeg.{label}")
    add_equip("bottom-black-shorts", rounded_cube("BlackShortWaist", (0, 0, .82), (.48, .34, .20), dark, .13), "Root")
    for x, label in ((.22, "L"), (-.22, "R")):
        add_equip("bottom-black-shorts", cylinder_between(f"BlackShort.{label}", (x,0,.76),(x,0,.47),.19,dark), f"UpperLeg.{label}")

    # Chunky sneakers and brown shoes.
    for x, label in ((.22, "L"), (-.22, "R")):
        sneaker = rounded_cube(f"Sneaker.{label}", (x, -.12, .10), (.20, .34, .13), dark, .08)
        add_equip("shoes-sneaker", sneaker, f"Foot.{label}")
        sole = rounded_cube(f"SneakerSole.{label}", (x, -.14, .035), (.22, .36, .055), white, .035)
        add_equip("shoes-sneaker", sole, f"Foot.{label}")
        toe = rounded_cube(f"SneakerToe.{label}", (x, -.39, .12), (.19, .10, .09), white, .05)
        add_equip("shoes-sneaker", toe, f"Foot.{label}")
        for zi in (.11, .16):
            lace = rounded_cube(f"Lace.{label}.{zi}", (x, -.38, zi), (.13, .012, .009), white, .006)
            add_equip("shoes-sneaker", lace, f"Foot.{label}")
        shoe = rounded_cube(f"BrownShoe.{label}", (x, -.14, .09), (.20, .34, .12), khaki, .075)
        add_equip("shoes-brown", shoe, f"Foot.{label}")

        white_shoe = rounded_cube(f"WhiteShoe.{label}", (x, -.15, .09), (.20, .35, .12), white, .075)
        add_equip("shoes-white", white_shoe, f"Foot.{label}")
        white_sole = rounded_cube(f"WhiteSole.{label}", (x, -.15, .03), (.22, .37, .045), sole_grey, .03)
        add_equip("shoes-white", white_sole, f"Foot.{label}")
        for zi in (.10, .15):
            add_equip("shoes-white", rounded_cube(f"WhiteLace.{label}.{zi}", (x,-.40,zi),(.13,.012,.008),sole_grey,.005), f"Foot.{label}")

        flip_sole = rounded_cube(f"FlipFlopSole.{label}", (x,-.16,.035),(.19,.34,.035),dark,.025)
        add_equip("shoes-flipflops", flip_sole, f"Foot.{label}")
        add_equip("shoes-flipflops", sphere(f"BareFoot.{label}",(x,-.16,.105),(.16,.29,.075),skin,24,14), f"Foot.{label}")
        add_equip("shoes-flipflops", cylinder_between(f"FlipStrapA.{label}",(x,-.39,.15),(x+.12,-.17,.16),.020,sole_grey,14), f"Foot.{label}")
        add_equip("shoes-flipflops", cylinder_between(f"FlipStrapB.{label}",(x,-.39,.15),(x-.12,-.17,.16),.020,sole_grey,14), f"Foot.{label}")

    # Hats.
    add_equip("hat-explorer", torus("ExplorerBrim", (0, 0, 3.27), .57, .055, green, scale=(1,.83,1)), "Head")
    add_equip("hat-explorer", sphere("ExplorerCrown", (0, .02, 3.37), (.42,.34,.24), green), "Head")
    straw_brim = sphere("StrawBrim", (0,-.015,3.34), (.71,.53,.065), khaki, 48, 20)
    straw_brim.rotation_euler.x = math.radians(-3)
    add_equip("hat-straw", straw_brim, "Head")
    add_equip(
        "hat-straw",
        fedora_crown("StrawFedoraCrown", (0,.035,3.56), .405, .325, .43, khaki, .82),
        "Head",
    )
    add_equip("hat-straw", torus("StrawHatBand", (0,.015,3.43), .405, .034, straw_band, scale=(1,.82,1)), "Head")
    # A shallow top dent gives the crown the pinched fedora silhouette.
    dent = rounded_cube("FedoraTopDent", (0,-.10,3.775), (.17,.12,.025), straw_band, .025)
    dent.rotation_euler.z = math.radians(-6)
    add_equip("hat-straw", dent, "Head")
    add_equip("hat-cap", sphere("CapCrown", (0, .01, 3.25), (.48,.40,.27), blue), "Head")
    add_equip("hat-cap", rounded_cube("CapVisor", (0, -.39, 3.18), (.30,.22,.045), blue, .04), "Head")

    # Accessories.
    add_equip("acc-backpack", rounded_cube("Backpack", (0, .38, 1.40), (.38,.18,.48), orange, .13), "Chest")
    add_equip("acc-backpack", torus("BackpackTrim", (0, .57, 1.40), .25, .025, dark, scale=(1,.45,1), rotation=(math.pi/2,0,0)), "Chest")
    add_equip("acc-camera", rounded_cube("Camera", (0, -.48, 1.28), (.22,.10,.16), dark, .05), "Chest")
    lens = torus("CameraLens", (0, -.59, 1.28), .09, .025, blue, rotation=(math.pi/2,0,0))
    add_equip("acc-camera", lens, "Chest")
    add_equip("acc-camera", tube("CameraStrap", [(-.32,-.30,1.75),(0,-.42,1.25),(.32,-.30,1.75)], .025, orange), "Chest")
    ring = torus("MagnifierRing", (-.88,-.16,1.13), .12, .025, dark, rotation=(math.pi/2,0,0))
    add_equip("acc-magnifier", ring, "Hand.R")
    add_equip("acc-magnifier", cylinder_between("MagnifierHandle", (-.88,-.12,1.02),(-.97,-.04,.88),.025,khaki), "Hand.R")

    add_animations(rig)
    return rig, base, equipment


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False)
        obj.select_set(True)
    if objects:
        bpy.context.view_layer.objects.active = objects[0]


def export_glb(path, rig, objects, animations=False):
    select_only([rig, *objects])
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_animations=animations,
        export_skins=True,
        export_yup=True,
        export_apply=True,
    )
    print("exported", os.path.basename(path))


def point_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def render_preview(rig, base, equipment):
    bpy.context.scene.frame_set(1)
    visible = set(base)
    for key in ("hair-default", "face-glasses", "top-blue", "bottom-grey", "shoes-sneaker"):
        visible.update(equipment[key])
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "CURVE"}:
            obj.hide_render = obj not in visible
            obj.hide_set(obj not in visible)
    rig.hide_render = True
    rig.hide_set(True)

    ground_mat = material("PreviewGround", (0.035, 0.065, 0.042, 1), .8)
    bpy.ops.mesh.primitive_plane_add(size=20, location=(0, 0, -0.03))
    ground = bpy.context.object
    apply_material(ground, ground_mat)

    for location, energy, size in (
        ((-4, -5, 6), 950, 4.5),
        ((4, -2, 4), 550, 3.0),
        ((0, 4, 5), 750, 3.0),
    ):
        bpy.ops.object.light_add(type="AREA", location=location)
        light = bpy.context.object
        light.data.energy = energy
        light.data.shape = "DISK"
        light.data.size = size
        point_at(light, (0, 0, 1.55))

    bpy.ops.object.camera_add(location=(4.6, -8.8, 3.6))
    camera = bpy.context.object
    camera.data.lens = 67
    point_at(camera, (0, 0, 1.63))
    scene = bpy.context.scene
    scene.camera = camera
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = PREVIEW_PATH
    scene.world.color = (0.018, 0.03, 0.02)
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.color_mode = "RGBA"
    bpy.ops.render.render(write_still=True)

    # A second render is intentionally face-led because that is where the
    # character's identity and modeling detail live.
    camera.location = (2.55, -6.1, 3.05)
    camera.data.lens = 78
    point_at(camera, (0, 0, 2.58))
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 1000
    scene.render.filepath = FACE_PREVIEW_PATH
    bpy.ops.render.render(write_still=True)

    def show_outfit(equip_ids):
        outfit_visible = set(base)
        outfit_visible.add(ground)
        for equip_id in equip_ids:
            outfit_visible.update(equipment[equip_id])
        for obj in bpy.context.scene.objects:
            if obj.type in {"MESH", "CURVE"}:
                obj.hide_render = obj not in outfit_visible
                obj.hide_set(obj not in outfit_visible)

    camera.location = (4.6, -8.8, 3.6)
    camera.data.lens = 67
    point_at(camera, (0, 0, 1.63))
    scene.render.resolution_x = 900
    scene.render.resolution_y = 1200

    show_outfit(("hair-neat", "face-glasses", "hat-straw", "top-polo-white", "bottom-navy", "shoes-white"))
    scene.render.filepath = GUARDIAN_PREVIEW_PATH
    bpy.ops.render.render(write_still=True)

    show_outfit(("hair-default", "face-sunglasses", "top-floral", "bottom-black-shorts", "shoes-flipflops"))
    scene.render.filepath = VACATION_PREVIEW_PATH
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    rig, base, equipment = make_character()

    # Save a clean editable source with only the concept's default outfit visible.
    source_visible = set(base)
    for key in ("hair-default", "face-glasses", "top-blue", "bottom-grey", "shoes-sneaker"):
        source_visible.update(equipment[key])
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH":
            obj.hide_set(obj not in source_visible)
            obj.hide_render = obj not in source_visible
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)

    for obj in bpy.context.scene.objects:
        obj.hide_set(False)
        obj.hide_render = False
    export_glb(os.path.join(MODEL_DIR, "char-base.glb"), rig, base, animations=True)
    for equip_id, objects in equipment.items():
        export_glb(os.path.join(MODEL_DIR, f"equip-{equip_id}.glb"), rig, objects, animations=False)

    render_preview(rig, base, equipment)
    print("blend", BLEND_PATH)
    print("preview", PREVIEW_PATH)
    print("face preview", FACE_PREVIEW_PATH)
    print("guardian preview", GUARDIAN_PREVIEW_PATH)
    print("vacation preview", VACATION_PREVIEW_PATH)
