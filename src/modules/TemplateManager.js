export class TemplateManager {
    constructor() {
        this.templates = this.initializeTemplates();
    }

    initializeTemplates() {
        return {
            basic: {
                name: "Basic Shapes",
                templates: [
                    {
                        name: "Simple Cube",
                        description: "A basic cube with customizable dimensions",
                        code: `// Simple Cube
// Customize the dimensions below

width = 20;
height = 20;
depth = 20;

cube([width, height, depth], center=true);`
                    },
                    {
                        name: "Sphere",
                        description: "A sphere with adjustable radius and resolution",
                        code: `// Sphere
// Customize radius and resolution

radius = 10;
resolution = 32; // Higher = smoother

sphere(r=radius, $fn=resolution);`
                    },
                    {
                        name: "Cylinder",
                        description: "A cylinder with customizable dimensions",
                        code: `// Cylinder
// Customize dimensions and resolution

height = 20;
radius = 8;
resolution = 32;

cylinder(h=height, r=radius, center=true, $fn=resolution);`
                    }
                ]
            },
            intermediate: {
                name: "Intermediate Models",
                templates: [
                    {
                        name: "Rounded Box",
                        description: "A box with rounded corners using minkowski",
                        code: `// Rounded Box
// Uses minkowski operation for smooth corners

width = 30;
height = 20;
depth = 15;
corner_radius = 3;

minkowski() {
    cube([width-corner_radius*2, height-corner_radius*2, depth-corner_radius*2], center=true);
    sphere(r=corner_radius, $fn=16);
}`
                    },
                    {
                        name: "Hollow Container",
                        description: "A container with walls using difference operation",
                        code: `// Hollow Container
// Uses difference to create hollow interior

outer_width = 40;
outer_height = 30;
outer_depth = 25;
wall_thickness = 3;

difference() {
    // Outer shell
    cube([outer_width, outer_height, outer_depth], center=true);
    
    // Inner cavity
    translate([0, 0, wall_thickness])
    cube([
        outer_width - wall_thickness*2, 
        outer_height - wall_thickness*2, 
        outer_depth
    ], center=true);
}`
                    },
                    {
                        name: "Gear Wheel",
                        description: "A simple gear using for loops and union",
                        code: `// Simple Gear Wheel
// Uses for loop to create teeth

outer_radius = 20;
inner_radius = 8;
tooth_count = 12;
tooth_height = 3;
gear_thickness = 5;

union() {
    // Main gear body
    difference() {
        cylinder(h=gear_thickness, r=outer_radius, center=true, $fn=64);
        cylinder(h=gear_thickness+2, r=inner_radius, center=true, $fn=32);
    }
    
    // Gear teeth
    for(i = [0:tooth_count-1]) {
        rotate([0, 0, i * (360/tooth_count)])
        translate([outer_radius + tooth_height/2, 0, 0])
        cube([tooth_height, 2, gear_thickness], center=true);
    }
}`
                    }
                ]
            },
            advanced: {
                name: "Advanced Models",
                templates: [
                    {
                        name: "Parametric Bracket",
                        description: "A mounting bracket with multiple parameters",
                        code: `// Parametric Mounting Bracket
// Fully customizable bracket design

// Main parameters
bracket_width = 40;
bracket_height = 30;
bracket_depth = 15;
wall_thickness = 3;
mounting_hole_diameter = 4;
mounting_hole_spacing = 25;

// Calculated values
inner_width = bracket_width - wall_thickness * 2;
inner_height = bracket_height - wall_thickness;

difference() {
    union() {
        // Main bracket body
        cube([bracket_width, bracket_depth, bracket_height]);
        
        // Reinforcement ribs
        for(i = [0:2]) {
            translate([wall_thickness + i * (inner_width/2), 0, 0])
            cube([2, bracket_depth, bracket_height - wall_thickness]);
        }
    }
    
    // Main cavity
    translate([wall_thickness, wall_thickness, wall_thickness])
    cube([inner_width, bracket_depth, inner_height + 1]);
    
    // Mounting holes
    for(i = [0:1]) {
        translate([
            bracket_width/2 + (i-0.5) * mounting_hole_spacing,
            bracket_depth/2,
            -1
        ])
        cylinder(h=wall_thickness+2, d=mounting_hole_diameter, $fn=16);
    }
}`
                    },
                    {
                        name: "Spiral Vase",
                        description: "A vase created using rotate_extrude",
                        code: `// Spiral Vase
// Uses rotate_extrude for rotational geometry

vase_height = 50;
base_radius = 15;
top_radius = 12;
wall_thickness = 2;

// Create the vase profile
module vase_profile() {
    polygon([
        [base_radius - wall_thickness, 0],
        [base_radius, 0],
        [top_radius, vase_height],
        [top_radius - wall_thickness, vase_height]
    ]);
}

// Rotate the profile to create the vase
rotate_extrude($fn=64)
vase_profile();

// Add decorative rings
for(i = [1:4]) {
    translate([0, 0, i * vase_height/5])
    difference() {
        cylinder(h=2, r=base_radius + 1, center=true, $fn=64);
        cylinder(h=3, r=base_radius - 1, center=true, $fn=64);
    }
}`
                    },
                    {
                        name: "Threaded Bolt",
                        description: "A bolt with threads using linear_extrude and twist",
                        code: `// Threaded Bolt
// Uses linear_extrude with twist for threads

bolt_length = 30;
bolt_diameter = 8;
head_diameter = 12;
head_height = 5;
thread_pitch = 1.5;

// Calculate twist angle for threads
twist_angle = 360 * bolt_length / thread_pitch;

union() {
    // Bolt head (hexagonal)
    translate([0, 0, bolt_length])
    linear_extrude(height=head_height, $fn=6)
    circle(d=head_diameter);
    
    // Threaded shaft
    linear_extrude(height=bolt_length, twist=twist_angle, $fn=32)
    difference() {
        circle(d=bolt_diameter);
        // Thread groove
        for(i = [0:5]) {
            rotate([0, 0, i*60])
            translate([bolt_diameter/2 - 0.5, 0])
            circle(d=1);
        }
    }
}`
                    }
                ]
            },
            mechanical: {
                name: "Mechanical Parts",
                templates: [
                    {
                        name: "Bearing Housing",
                        description: "A bearing housing with precise tolerances",
                        code: `// Bearing Housing
// Precision bearing mount with tolerances

bearing_outer_diameter = 22;
bearing_inner_diameter = 8;
bearing_width = 7;
housing_wall = 4;
tolerance = 0.2;

housing_outer = bearing_outer_diameter + housing_wall * 2;
housing_height = bearing_width + housing_wall;

difference() {
    // Main housing
    cylinder(h=housing_height, d=housing_outer, $fn=64);
    
    // Bearing cavity
    translate([0, 0, housing_wall/2])
    cylinder(h=bearing_width + tolerance, d=bearing_outer_diameter + tolerance, $fn=64);
    
    // Center shaft hole
    cylinder(h=housing_height + 2, d=bearing_inner_diameter + tolerance, center=true, $fn=32);
    
    // Mounting holes
    for(i = [0:2]) {
        rotate([0, 0, i*120])
        translate([housing_outer/2 - 2, 0, -1])
        cylinder(h=housing_wall + 2, d=3, $fn=16);
    }
}`
                    },
                    {
                        name: "Universal Joint",
                        description: "A universal joint mechanism",
                        code: `// Universal Joint
// Mechanical universal joint design

joint_diameter = 20;
pin_diameter = 4;
pin_length = 25;
yoke_thickness = 6;
center_thickness = 8;

module yoke() {
    difference() {
        union() {
            // Main yoke arms
            for(i = [0:1]) {
                rotate([0, 0, i*180])
                translate([0, joint_diameter/2, 0])
                cube([yoke_thickness, joint_diameter, pin_length], center=true);
            }
        }
        
        // Pin holes
        for(i = [0:1]) {
            rotate([0, 0, i*180])
            translate([0, joint_diameter, 0])
            rotate([90, 0, 0])
            cylinder(h=yoke_thickness + 2, d=pin_diameter + 0.2, center=true, $fn=16);
        }
    }
}

// First yoke
yoke();

// Second yoke (rotated 90 degrees)
rotate([0, 0, 90])
yoke();

// Center cross pin
cylinder(h=joint_diameter + yoke_thickness, d=pin_diameter - 0.1, center=true, $fn=16);

// Perpendicular pin
rotate([90, 0, 0])
cylinder(h=joint_diameter + yoke_thickness, d=pin_diameter - 0.1, center=true, $fn=16);`
                    }
                ]
            },
            artistic: {
                name: "Artistic & Decorative",
                templates: [
                    {
                        name: "Voronoi Pattern",
                        description: "A decorative pattern using hull operations",
                        code: `// Voronoi-inspired Pattern
// Creates organic cell-like structures

pattern_size = 40;
cell_count = 8;
base_thickness = 3;
pattern_height = 2;

// Base plate
cube([pattern_size, pattern_size, base_thickness], center=true);

// Generate random-looking cells
for(i = [0:cell_count-1]) {
    for(j = [0:cell_count-1]) {
        x = (i - cell_count/2) * (pattern_size/cell_count) + sin(i*j*30) * 2;
        y = (j - cell_count/2) * (pattern_size/cell_count) + cos(i*j*45) * 2;
        
        translate([x, y, base_thickness/2 + pattern_height/2])
        hull() {
            cylinder(h=pattern_height, r=1, center=true, $fn=8);
            translate([sin(i*30)*3, cos(j*45)*3, 0])
            cylinder(h=pattern_height, r=0.5, center=true, $fn=6);
        }
    }
}`
                    },
                    {
                        name: "Celtic Knot",
                        description: "A decorative Celtic knot pattern",
                        code: `// Celtic Knot Pattern
// Interwoven decorative design

knot_size = 30;
strand_width = 3;
strand_height = 4;
weave_offset = 1;

module strand_segment(length, twist=0) {
    linear_extrude(height=strand_height, twist=twist, $fn=16)
    translate([0, -strand_width/2])
    square([length, strand_width]);
}

// Create interwoven pattern
for(i = [0:3]) {
    rotate([0, 0, i*90])
    union() {
        // Main curve
        translate([0, knot_size/3, 0])
        rotate([0, 0, -45])
        strand_segment(knot_size/2, 180);
        
        // Connecting segment
        translate([knot_size/4, knot_size/4, weave_offset * (i%2 ? 1 : -1)])
        rotate([0, 0, 45])
        strand_segment(knot_size/3);
    }
}

// Center decoration
translate([0, 0, strand_height/2])
cylinder(h=strand_height/2, r=strand_width, center=true, $fn=16);`
                    }
                ]
            }
        };
    }

    getCategories() {
        return Object.keys(this.templates).map(key => ({
            id: key,
            name: this.templates[key].name,
            count: this.templates[key].templates.length
        }));
    }

    getTemplatesInCategory(categoryId) {
        return this.templates[categoryId]?.templates || [];
    }

    getTemplate(categoryId, templateIndex) {
        const category = this.templates[categoryId];
        if (!category || !category.templates[templateIndex]) {
            return null;
        }
        return category.templates[templateIndex];
    }

    getAllTemplates() {
        const allTemplates = [];
        Object.keys(this.templates).forEach(categoryId => {
            const category = this.templates[categoryId];
            category.templates.forEach((template, index) => {
                allTemplates.push({
                    ...template,
                    categoryId,
                    categoryName: category.name,
                    index
                });
            });
        });
        return allTemplates;
    }

    searchTemplates(query) {
        const allTemplates = this.getAllTemplates();
        const searchTerm = query.toLowerCase();
        
        return allTemplates.filter(template => 
            template.name.toLowerCase().includes(searchTerm) ||
            template.description.toLowerCase().includes(searchTerm) ||
            template.code.toLowerCase().includes(searchTerm)
        );
    }

    addCustomTemplate(categoryId, template) {
        if (!this.templates[categoryId]) {
            this.templates[categoryId] = {
                name: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
                templates: []
            };
        }
        
        this.templates[categoryId].templates.push({
            name: template.name,
            description: template.description,
            code: template.code,
            isCustom: true
        });
    }

    removeCustomTemplate(categoryId, templateIndex) {
        const category = this.templates[categoryId];
        if (category && category.templates[templateIndex] && category.templates[templateIndex].isCustom) {
            category.templates.splice(templateIndex, 1);
            return true;
        }
        return false;
    }
}