"""Generate story NPCs in the same toy-like style as the player character.

Usage:
  /Applications/Blender.app/Contents/MacOS/Blender --background \
    --python scripts/generate-npcs.py

Outputs:
  assets/blender/shade-keeper-npcs.blend
  public/models/npc-*.glb
  public/models/npc-*-preview.png
  public/models/npc-human-lineup-preview.png
  public/models/npc-tree-lineup-preview.png
"""

import bpy
import math
import os
import runpy
from mathutils import Vector


SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
MODEL_DIR = os.path.join(PROJECT_DIR, "public", "models")
BLEND_DIR = os.path.join(PROJECT_DIR, "assets", "blender")
BLEND_PATH = os.path.join(BLEND_DIR, "shade-keeper-npcs.blend")
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(BLEND_DIR, exist_ok=True)

# Reuse the approved protagonist's primitive language, proportions and material
# setup. runpy does not execute that file's __main__ block.
core = runpy.run_path(os.path.join(SCRIPT_DIR, "generate-character-v2.py"))
material = core["material"]
apply_material = core["apply_material"]
smooth = core["smooth"]
bevel = core["bevel"]
sphere = core["sphere"]
rounded_cube = core["rounded_cube"]
cylinder_between = core["cylinder_between"]
capsule_between = core["capsule_between"]
bullet_cylinder = core["bullet_cylinder"]
torus = core["torus"]
tube = core["tube"]
smooth_tube = core["smooth_tube"]
prism = core["prism"]
squircle_points = core["squircle_points"]
create_armature = core["create_armature"]
rigid_bind = core["rigid_bind"]
add_animations = core["add_animations"]


def clean_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def mark(objects, npc_id):
    for obj in objects:
        obj["npc_id"] = npc_id


def face_arc(name, center_x, y, center_z, width, height, mat, radius=.022, downward=False):
    points = []
    for index in range(13):
        t = math.pi * index / 12
        z_sign = -1 if downward else 1
        points.append((
            center_x + width * math.cos(t),
            y,
            center_z + z_sign * height * math.sin(t),
        ))
    return tube(name, points, radius, mat)


def leaf_badge(name, location, green, light):
    x, y, z = location
    objects = [
        sphere(name + ".L", (x-.027, y, z+.012), (.032, .014, .060), green, 16, 10),
        sphere(name + ".R", (x+.027, y, z+.012), (.032, .014, .060), light, 16, 10),
        cylinder_between(name + ".Stem", (x, y, z-.050), (x, y, z+.020), .010, green, 12),
    ]
    objects[0].rotation_euler.y = math.radians(-28)
    objects[1].rotation_euler.y = math.radians(28)
    return objects


def build_human(npc_id, variant):
    """Build a rigged NPC using the protagonist's chibi proportions."""
    before = set(bpy.context.scene.objects)
    mats = {
        "skin": material(npc_id + " Skin", variant["skin"], .48),
        "skin_light": material(npc_id + " Skin Light", variant["skin_light"], .45),
        "blush": material(npc_id + " Blush", variant["blush"], .55),
        "hair": material(npc_id + " Hair", variant["hair"], .46),
        "hair_grey": material(npc_id + " Hair Grey", variant.get("hair_grey", (.32,.34,.34,1)), .52),
        "dark": material(npc_id + " Charcoal", (.035,.045,.048,1), .62),
        "white": material(npc_id + " Warm White", (.94,.92,.87,1), .58),
        "top": material(npc_id + " Top", variant["top"], .62),
        "top2": material(npc_id + " Top Accent", variant["top2"], .62),
        "bottom": material(npc_id + " Bottom", variant["bottom"], .66),
        "shoe": material(npc_id + " Shoe", variant["shoe"], .70),
        "accent": material(npc_id + " Accent", variant["accent"], .58),
        "bag": material(npc_id + " Bag", variant["bag"], .72),
    }

    rig = create_armature()
    rig.name = npc_id + "-rig"
    rig.data.name = npc_id + "-skeleton"
    objects = []

    def add(obj, bone):
        rigid_bind(obj, rig, bone)
        objects.append(obj)
        return obj

    # Face, ears and expression. The slightly oversized head matches the player.
    head_scale = variant.get("head_scale", (0.70, .60, .67))
    add(sphere(npc_id + ".Head", (0,0,2.56), head_scale, mats["skin"]), "Head")
    for sign, label in ((1,"L"),(-1,"R")):
        add(sphere(npc_id + ".Ear."+label, (sign*.67,0,2.55), (.145,.10,.18), mats["skin"]), "Head")
        add(sphere(npc_id + ".EarInner."+label, (sign*.685,-.078,2.55), (.068,.024,.095), mats["blush"]), "Head")
        add(sphere(npc_id + ".Cheek."+label, (sign*.38,-.575,2.38), (.12,.022,.060), mats["blush"]), "Head")
        if variant.get("closed_eyes", False):
            add(face_arc(npc_id+".Eye."+label, sign*.27, -.625, 2.58, .145, .045, mats["dark"], .021), "Head")
        else:
            add(sphere(npc_id+".EyeWhite."+label, (sign*.27,-.598,2.58), (.135,.040,.105), mats["white"], 24, 14), "Head")
            add(sphere(npc_id+".Pupil."+label, (sign*.27,-.660,2.58), (.050,.018,.064), mats["dark"], 20, 12), "Head")
        brow = face_arc(npc_id+".Brow."+label, sign*.27, -.620, 2.75, .16, .035, mats["hair"], .027)
        add(brow, "Head")
    add(sphere(npc_id+".Nose", (0,-.60,2.50), (.082,.052,.072), mats["skin_light"], 24, 14), "Head")
    add(face_arc(npc_id+".Smile", 0,-.625,2.33,.19,.085,mats["dark"],.025,downward=True), "Head")

    # Body and simple geometric limbs.
    add(cylinder_between(npc_id+".Neck", (0,0,1.90),(0,0,2.15),.155,mats["skin"]), "Neck")
    add(bullet_cylinder(npc_id+".Body", (0,0,1.43),.43,1.02,mats["skin"],.74), "Chest")
    for sign, label in ((1,"L"),(-1,"R")):
        shoulder=(sign*.48,0,1.73); elbow=(sign*.78,0,1.45); wrist=(sign*.99,0,1.10)
        add(capsule_between(npc_id+".UpperArm."+label,shoulder,elbow,.115,mats["skin"]),"UpperArm."+label)
        add(sphere(npc_id+".Elbow."+label,elbow,(.125,.125,.125),mats["skin"]),"LowerArm."+label)
        add(capsule_between(npc_id+".Forearm."+label,elbow,wrist,.105,mats["skin"]),"LowerArm."+label)
        add(sphere(npc_id+".Hand."+label,wrist,(.14,.11,.17),mats["skin"]),"Hand."+label)
        x=sign*.22
        add(capsule_between(npc_id+".UpperLeg."+label,(x,0,.76),(x,0,.42),.13,mats["skin"]),"UpperLeg."+label)
        add(capsule_between(npc_id+".LowerLeg."+label,(x,0,.40),(x,0,.12),.12,mats["skin"]),"LowerLeg."+label)

    # Hair silhouettes are distinct but share the same chunky sculpted language.
    if variant["hair_style"] == "wavy":
        add(sphere(npc_id+".HairCap",(0,.06,2.98),(.68,.56,.43),mats["hair"]),"Head")
        locks = (
            [(-.59,-.12,3.12),(-.54,-.58,3.32),(-.30,-.64,3.37),(-.17,-.15,3.18)],
            [(-.20,-.10,3.34),(.02,-.64,3.48),(.25,-.61,3.35),(.18,-.12,3.17)],
            [(.19,-.10,3.31),(.38,-.59,3.40),(.60,-.52,3.20),(.51,-.10,3.05)],
        )
        for i, points in enumerate(locks):
            add(smooth_tube(npc_id+f".HairLock.{i}",points,.095,mats["hair"],[.7,1,1,.7]),"Head")
    elif variant["hair_style"] == "sidepart":
        add(sphere(npc_id+".HairCap",(0,.055,2.98),(.68,.56,.42),mats["hair"]),"Head")
        add(smooth_tube(npc_id+".SidePart",[
            (-.62,-.08,3.10),(-.28,-.62,3.30),(.08,-.67,3.29),(.42,-.55,3.10),(.58,-.08,2.99)
        ],.085,mats["hair"],[.65,1,1,1,.65]),"Head")
        add(tube(npc_id+".PartLine",[(.08,-.655,3.28),(.24,-.60,3.40)],.018,mats["top2"]),"Head")
    else:  # short mature bob
        add(sphere(npc_id+".BobCap",(0,.06,2.96),(.70,.57,.44),mats["hair"]),"Head")
        for sign,label in ((1,"L"),(-1,"R")):
            add(smooth_tube(npc_id+".BobCurl."+label,[(sign*.54,-.05,3.15),(sign*.70,-.34,3.04),(sign*.70,-.38,2.78),(sign*.57,-.04,2.72)],.095,mats["hair"],[.7,1,1,.7]),"Head")
        add(smooth_tube(npc_id+".GreyStreak",[(-.22,-.53,3.30),(-.05,-.65,3.36),(.09,-.63,3.29)],.026,mats["hair_grey"],[.7,1,.7]),"Head")

    # Clothing.
    add(bullet_cylinder(npc_id+".Top",(0,0,1.43),.48,1.10,mats["top"],.75),"Chest")
    for sign,label in ((1,"L"),(-1,"R")):
        add(cylinder_between(npc_id+".Sleeve."+label,(sign*.48,0,1.72),(sign*.63,0,1.58),.158,mats["top"]),"UpperArm."+label)
    add(rounded_cube(npc_id+".Waist",(0,0,.82),(.48,.34,.20),mats["bottom"],.13),"Root")
    for sign,label in ((1,"L"),(-1,"R")):
        x=sign*.22
        if variant.get("shorts",False):
            add(cylinder_between(npc_id+".Short."+label,(x,0,.76),(x,0,.48),.19,mats["bottom"]),"UpperLeg."+label)
        else:
            add(bullet_cylinder(npc_id+".TrouserUpper."+label,(x,0,.61),.17,.38,mats["bottom"],.82),"UpperLeg."+label)
            add(bullet_cylinder(npc_id+".TrouserLower."+label,(x,0,.30),.155,.30,mats["bottom"],.82),"LowerLeg."+label)
        add(rounded_cube(npc_id+".Shoe."+label,(x,-.14,.09),(.20,.34,.12),mats["shoe"],.075),"Foot."+label)
        add(rounded_cube(npc_id+".Sole."+label,(x,-.15,.03),(.22,.36,.045),mats["white"],.03),"Foot."+label)

    if variant["detail"] == "volunteer":
        # Sand utility vest, leaf badge and cross-body field pouch.
        vest = bullet_cylinder(npc_id+".VolunteerVest",(0,.005,1.45),.495,1.02,mats["top2"],.75)
        add(vest,"Chest")
        opening = rounded_cube(npc_id+".VestOpening",(0,-.385,1.52),(.050,.010,.40),mats["top"],.015)
        add(opening,"Chest")
        for badge_obj in leaf_badge(npc_id+".LeafBadge",(-.25,-.402,1.64),mats["accent"],mats["top"]):
            add(badge_obj,"Chest")
        add(tube(npc_id+".BagStrap",[(-.38,-.38,1.83),(0,-.43,1.40),(.38,-.30,1.02)],.028,mats["bag"]),"Chest")
        add(rounded_cube(npc_id+".FieldPouch",(.43,-.15,1.00),(.20,.10,.16),mats["bag"],.055),"Chest")
    elif variant["detail"] == "office":
        for name,points in (
            ("Collar.L",[(-.31,1.88),(-.03,1.88),(-.10,1.67)]),
            ("Collar.R",[(.03,1.88),(.31,1.88),(.10,1.67)]),
        ):
            collar=prism(npc_id+"."+name,points,.035,mats["white"]); collar.location.y=-.382; add(collar,"Chest")
        for index,z in enumerate((1.63,1.50,1.37)):
            add(sphere(npc_id+f".Button.{index}",(0,-.405,z),(.022,.012,.022),mats["white"],16,10),"Chest")
        add(tube(npc_id+".CommuterStrap",[(-.34,-.29,1.82),(-.05,-.42,1.35),(.27,-.28,.95)],.030,mats["bag"]),"Chest")
        add(rounded_cube(npc_id+".CommuterBag",(.46,.12,1.02),(.24,.13,.30),mats["bag"],.07),"Chest")
        add(sphere(npc_id+".SweatDrop",(.55,-.55,2.66),(.027,.014,.065),mats["top2"],16,10),"Head")
    else:
        # Soft blouse neckline and a reusable grocery tote in the right hand.
        add(torus(npc_id+".BlouseCollar",(0,-.08,1.84),.27,.035,mats["top2"],scale=(1,.72,1)),"Chest")
        add(rounded_cube(npc_id+".GroceryTote",(-.98,.02,.76),(.25,.10,.30),mats["bag"],.045),"Hand.R")
        add(tube(npc_id+".ToteHandle",[(-1.14,-.02,.98),(-.98,-.08,1.15),(-.82,-.02,.98)],.025,mats["bag"]),"Hand.R")
        for i,(x,z,color) in enumerate(((-1.06,.80,mats["accent"]),(-.92,.72,mats["top2"]),(-.84,.84,mats["accent"]))):
            add(sphere(npc_id+f".Groceries.{i}",(x,-.11,z),(.055,.025,.075),color,16,10),"Hand.R")

    add_animations(rig)
    objects = [obj for obj in bpy.context.scene.objects if obj not in before and obj != rig]
    mark([rig,*objects],npc_id)
    return {"id":npc_id,"rig":rig,"objects":objects,"kind":"human"}


def cone(name, location, radius1, radius2, depth, mat, vertices=32):
    bpy.ops.mesh.primitive_cone_add(vertices=vertices,radius1=radius1,radius2=radius2,depth=depth,location=location)
    obj=bpy.context.object; obj.name=name; apply_material(obj,mat); smooth(obj); bevel(obj,.055,4)
    return obj


def make_leaf(name, location, scale, rotation, mat, lobed=False):
    if not lobed:
        obj=sphere(name,location,scale,mat,20,12)
        obj.rotation_euler=rotation
        return obj
    # A broad, recognizably lobed breadfruit leaf, given a little thickness.
    points=[]
    count=18
    for i in range(count):
        angle=2*math.pi*i/count
        side=abs(math.sin(angle))
        lobes=.72 + .24*abs(math.cos(angle*3))
        x=math.cos(angle)*scale[0]*lobes
        z=math.sin(angle)*scale[2]*(.76+.24*side)
        points.append((x,z))
    obj=prism(name,points,scale[1],mat,.015)
    obj.location=location
    obj.rotation_euler=rotation
    return obj


def build_tree(npc_id, species):
    before=set(bpy.context.scene.objects)
    bark=material(npc_id+" Bark",(.26,.12,.055,1),.86)
    bark_light=material(npc_id+" Bark Light",(.48,.29,.13,1),.83)
    dark=material(npc_id+" Face",(.045,.035,.025,1),.60)
    white=material(npc_id+" Eye White",(.93,.91,.82,1),.64)
    blush=material(npc_id+" Blush",(.79,.24,.15,1),.62)
    leaf_dark=material(npc_id+" Leaf Dark",(.055,.24,.09,1),.78)
    leaf=material(npc_id+" Leaf",(.13,.42,.15,1),.76)
    leaf_light=material(npc_id+" Leaf Light",(.32,.58,.16,1),.72)
    fruit=material(npc_id+" Fruit",(.50,.66,.16,1),.82)
    objects=[]
    def add(obj): objects.append(obj); return obj

    if species=="camphor":
        add(cone(npc_id+".Trunk",(0,0,1.35),.52,.34,2.70,bark))
        add(sphere(npc_id+".TrunkPatch",(-.20,-.46,1.20),(.12,.025,.44),bark_light,18,12))
        branches=(((-.12,0,2.35),(-1.12,.06,3.15),.20),((.12,0,2.30),(1.12,.08,3.10),.21),((0,.04,2.42),(.18,.10,3.55),.23))
        for i,(start,end,radius) in enumerate(branches): add(cylinder_between(npc_id+f".Branch.{i}",start,end,radius,bark,24))
        canopy=((-1.02,.10,3.45,.78),(-.35,.08,3.78,.84),(.42,.10,3.78,.88),(1.10,.10,3.42,.76),(.05,.25,3.25,.95),(-.66,.28,3.20,.70),(.72,.30,3.16,.72))
        for i,(x,y,z,s) in enumerate(canopy): add(sphere(npc_id+f".Canopy.{i}",(x,y,z),(s,s*.72,s*.68),[leaf_dark,leaf,leaf_light][i%3],28,18))
        for i,(x,z,rot) in enumerate(((-1.42,3.55,-28),(-.82,4.00,18),(-.05,4.24,-8),(.70,4.05,24),(1.45,3.50,-18))):
            add(make_leaf(npc_id+f".Leaf.{i}",(x,-.62,z),(.18,.035,.34),(0,math.radians(rot),math.radians(rot)),leaf_light))
        face_z=1.72
        for sign,label in ((1,"L"),(-1,"R")):
            add(face_arc(npc_id+".Eye."+label,sign*.18,-.505,face_z,.11,.035,dark,.022))
            add(face_arc(npc_id+".ElderBrow."+label,sign*.19,-.500,face_z+.19,.14,.032,bark_light,.035))
        add(face_arc(npc_id+".Smile",0,-.515,face_z-.24,.18,.07,dark,.030,downward=True))
        add(sphere(npc_id+".Cheek.L",(.32,-.49,face_z-.10),(.08,.018,.045),blush,18,10))
        add(sphere(npc_id+".Cheek.R",(-.32,-.49,face_z-.10),(.08,.018,.045),blush,18,10))
    else:
        add(cone(npc_id+".Trunk",(0,0,1.34),.45,.28,2.68,bark))
        branches=(((-.08,0,2.30),(-.88,.04,3.02),.17),((.08,0,2.30),(.88,.04,3.05),.18),((0,.04,2.38),(.05,.08,3.40),.20))
        for i,(start,end,radius) in enumerate(branches): add(cylinder_between(npc_id+f".Branch.{i}",start,end,radius,bark,24))
        canopy=((-1.00,.15,3.32,.72),(-.42,.12,3.72,.78),(.30,.10,3.78,.82),(.98,.14,3.38,.72),(0,.28,3.20,.90))
        for i,(x,y,z,s) in enumerate(canopy): add(sphere(npc_id+f".Canopy.{i}",(x,y,z),(s,s*.68,s*.62),[leaf,leaf_dark,leaf_light][i%3],28,18))
        leaf_positions=((-1.35,-.58,3.55,-28),(-.85,-.62,3.95,18),(-.30,-.66,4.18,-10),(.30,-.66,4.18,12),(.85,-.62,3.94,-18),(1.35,-.58,3.52,26),(-.72,-.69,3.20,-42),(.72,-.69,3.22,40))
        for i,(x,y,z,rot) in enumerate(leaf_positions):
            add(make_leaf(npc_id+f".LobedLeaf.{i}",(x,y,z),(.24,.045,.46),(0,math.radians(rot),math.radians(rot)),[leaf_light,leaf][i%2],True))
        for i,(x,y,z,s) in enumerate(((-.62,-.54,3.27,.13),(.48,-.58,3.42,.15),(.92,-.36,3.10,.12))):
            add(sphere(npc_id+f".Breadfruit.{i}",(x,y,z),(s,s*.82,s*1.12),fruit,20,14))
        face_z=1.70
        for sign,label in ((1,"L"),(-1,"R")):
            add(face_arc(npc_id+".Eye."+label,sign*.18,-.445,face_z,.115,.060,dark,.024))
        add(face_arc(npc_id+".Smile",0,-.465,face_z-.23,.20,.09,dark,.030,downward=True))
        add(sphere(npc_id+".Cheek.L",(.31,-.44,face_z-.10),(.08,.018,.045),blush,18,10))
        add(sphere(npc_id+".Cheek.R",(-.31,-.44,face_z-.10),(.08,.018,.045),blush,18,10))

    objects=[obj for obj in bpy.context.scene.objects if obj not in before]
    mark(objects,npc_id)
    return {"id":npc_id,"rig":None,"objects":objects,"kind":"tree"}


def select_only(objects):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.hide_set(False); obj.hide_render=False; obj.select_set(True)
    if objects: bpy.context.view_layer.objects.active=objects[0]


def export_model(model):
    export_objects=([model["rig"]] if model["rig"] else [])+model["objects"]
    select_only(export_objects)
    bpy.ops.export_scene.gltf(
        filepath=os.path.join(MODEL_DIR,model["id"]+".glb"),
        export_format="GLB",use_selection=True,
        export_animations=model["rig"] is not None,
        export_skins=model["rig"] is not None,
        export_yup=True,export_apply=True,
    )
    print("exported",model["id"]+".glb")


def point_at(obj,target):
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat("-Z","Y").to_euler()


def setup_render():
    ground_mat=material("NPC Preview Ground",(.035,.065,.042,1),.82)
    bpy.ops.mesh.primitive_plane_add(size=30,location=(0,0,-.035))
    ground=bpy.context.object; ground.name="Preview Ground"; apply_material(ground,ground_mat)
    for location,energy,size in (((-4,-5,7),1100,4.5),((4,-2,5),650,3.0),((0,5,6),850,3.5)):
        bpy.ops.object.light_add(type="AREA",location=location)
        light=bpy.context.object; light.data.energy=energy; light.data.shape="DISK"; light.data.size=size; point_at(light,(0,0,1.7))
    bpy.ops.object.camera_add(location=(4.6,-8.8,3.6))
    camera=bpy.context.object; camera.data.lens=67
    scene=bpy.context.scene; scene.camera=camera; scene.render.engine="BLENDER_EEVEE"
    scene.render.resolution_percentage=100; scene.render.image_settings.file_format="PNG"; scene.render.image_settings.color_mode="RGBA"
    scene.world.color=(.018,.03,.02); scene.view_settings.look="AgX - Medium High Contrast"
    return scene,camera,ground


def set_model_visibility(models,visible_ids,ground):
    visible_ids=set(visible_ids)
    for model in models:
        show=model["id"] in visible_ids
        if model["rig"]:
            model["rig"].hide_render=True; model["rig"].hide_set(True)
        for obj in model["objects"]:
            obj.hide_render=not show; obj.hide_set(not show)
    ground.hide_render=False; ground.hide_set(False)


def shift_model(model,delta_x):
    if model["rig"]:
        # Human meshes are parented to the rig, so moving both would apply the
        # offset twice. Trees have no parent and are shifted mesh by mesh.
        model["rig"].location.x+=delta_x
    else:
        for obj in model["objects"]:
            obj.location.x+=delta_x


def render_previews(models):
    scene,camera,ground=setup_render()
    for model in models:
        set_model_visibility(models,[model["id"]],ground)
        if model["kind"]=="human":
            camera.location=(4.6,-8.8,3.6); camera.data.lens=67; point_at(camera,(0,0,1.63))
            scene.render.resolution_x=900; scene.render.resolution_y=1200
        else:
            camera.location=(5.8,-10.5,4.6); camera.data.lens=70; point_at(camera,(0,0,2.15))
            scene.render.resolution_x=1000; scene.render.resolution_y=1200
        scene.render.filepath=os.path.join(MODEL_DIR,model["id"]+"-preview.png")
        bpy.ops.render.render(write_still=True)

    humans=[model for model in models if model["kind"]=="human"]
    human_offsets=(-2.25,0,2.25)
    for model,offset in zip(humans,human_offsets): shift_model(model,offset)
    set_model_visibility(models,[model["id"] for model in humans],ground)
    camera.location=(6.8,-13.8,4.1); camera.data.lens=72; point_at(camera,(0,0,1.65))
    scene.render.resolution_x=1600; scene.render.resolution_y=1000
    scene.render.filepath=os.path.join(MODEL_DIR,"npc-human-lineup-preview.png")
    bpy.ops.render.render(write_still=True)
    for model,offset in zip(humans,human_offsets): shift_model(model,-offset)

    trees=[model for model in models if model["kind"]=="tree"]
    for model,offset in zip(trees,(-1.45,1.45)): shift_model(model,offset)
    set_model_visibility(models,[model["id"] for model in trees],ground)
    camera.location=(6.8,-14.0,5.2); camera.data.lens=72; point_at(camera,(0,0,2.1))
    scene.render.resolution_x=1400; scene.render.resolution_y=1000
    scene.render.filepath=os.path.join(MODEL_DIR,"npc-tree-lineup-preview.png")
    bpy.ops.render.render(write_still=True)
    for model,offset in zip(trees,(-1.45,1.45)): shift_model(model,-offset)

    ground.hide_render=True; ground.hide_set(True)
    camera.hide_render=True; camera.hide_set(True)
    for obj in bpy.context.scene.objects:
        if obj.type=="LIGHT": obj.hide_render=True; obj.hide_set(True)


def main():
    clean_scene()
    humans=(
        ("npc-guide-ashu",{
            "skin":(.93,.60,.42,1),"skin_light":(1,.72,.53,1),"blush":(.95,.34,.26,1),
            "hair":(.055,.025,.015,1),"top":(.12,.38,.18,1),"top2":(.69,.54,.29,1),
            "bottom":(.42,.32,.19,1),"shoe":(.09,.26,.15,1),"accent":(.93,.38,.04,1),"bag":(.45,.25,.10,1),
            "hair_style":"wavy","detail":"volunteer","shorts":True,"closed_eyes":False,
        }),
        ("npc-office-worker",{
            "skin":(.91,.61,.45,1),"skin_light":(1,.74,.57,1),"blush":(.92,.37,.31,1),
            "hair":(.025,.020,.018,1),"top":(.24,.43,.58,1),"top2":(.42,.72,.84,1),
            "bottom":(.08,.11,.16,1),"shoe":(.055,.060,.065,1),"accent":(.55,.74,.25,1),"bag":(.08,.16,.27,1),
            "hair_style":"sidepart","detail":"office","shorts":False,"closed_eyes":False,
            "head_scale":(.69,.59,.66),
        }),
        ("npc-neighborhood-aunt",{
            "skin":(.92,.62,.46,1),"skin_light":(1,.75,.58,1),"blush":(.92,.34,.30,1),
            "hair":(.12,.105,.095,1),"hair_grey":(.54,.54,.50,1),"top":(.78,.25,.18,1),"top2":(.96,.63,.30,1),
            "bottom":(.08,.38,.38,1),"shoe":(.30,.19,.12,1),"accent":(.28,.58,.18,1),"bag":(.73,.58,.27,1),
            "hair_style":"bob","detail":"aunt","shorts":False,"closed_eyes":True,
            "head_scale":(.72,.61,.68),
        }),
    )
    models=[build_human(npc_id,variant) for npc_id,variant in humans]
    models.append(build_tree("npc-heritage-557","camphor"))
    models.append(build_tree("npc-heritage-763","breadfruit"))
    for model in models: export_model(model)
    render_previews(models)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print("blend",BLEND_PATH)


if __name__=="__main__":
    main()
