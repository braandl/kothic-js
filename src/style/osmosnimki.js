(function (MapCSS) {
    'use strict';
    function restyle(style, tags, zoom, type, selector) {
        var s_default = {}, s_centerline = {}, s_ticks = {}, s_label = {};
        
        if (tags["surface"] === "background") 
		{
            s_default['fill-color'] = '#FFFFFF';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 1;
		}
		
        
		if (tags["surface"] === "floor") 
		{
            s_default['fill-color'] = '#F5F4FF';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 31;
		}
			
		if (tags["surface"] === "steps" && selector === "area") 
		{
            s_default['fill-color'] = '#FFA384';
            s_default['opacity'] = 1;
            s_default['z-index'] = 33;
		}
		
		if (tags["surface"] === "elevator" ) 
		{
            s_default['fill-color'] = '#CCA384';
            s_default['opacity'] = 1;
            s_default['z-index'] = 33;
		}
		
		if (tags["surface"] === "elevator" && selector === "area") 
		{
            s_default['fill-color'] = '#CCA384';
            s_default['opacity'] = 1;
            s_default['z-index'] = 33;
		}
		
		if (tags["highway"] === "steps") 
		{
            s_default['fill-color'] = '#FFA384';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 33;
		}
		
		
		if (tags["highway"] === "elevator") 
		{
            s_default['fill-color'] = '#CCA384';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 33;
		}
		
		
		if (tags["surface"] === "balcony" && selector === "area" ) 
		{
            s_default['fill-color'] = '#875646';
            s_default['fill-opacity'] = 0.6;
            s_default['z-index'] = 33;
		}
		
		if (tags["surface"] === "door" && selector == "line") 
		{
            s_default['color'] = '#DBDBDB';
            s_default['width'] = 1;
            s_default['z-index'] = 39;
		}
		
		if (tags["surface"] === "solid" && selector === "area" ) 
		{
			
            s_default['fill-color'] = '#0B0811';
            s_default['fill-opacity'] = 0.9;
            s_default['z-index'] = 30;
		}
		
		
		if (tags["surface"] === "transparent" && selector === "area" ) 
		{
			
            s_default['fill-color'] = '#FFF';
            s_default['fill-opacity'] = 0.4;
            s_default['z-index'] = 30;
		}
		
		
		if (tags["surface"] === "plant"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#83DF60';
            s_default['fill-opacity'] = 0.9;
            s_default['z-index'] = 30;
		}
		
		if (tags["surface"] === "sand"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#FDD485';
            s_default['color'] = '#000000';
            s_default['opacity'] = 0.8;
            s_default['fill-opacity'] = 0.9;
            s_default['width'] = 1.5;
            s_default['z-index'] = 30;
            s_default['dashes'] = [9, 9];
		}
		
		if (tags["surface"] === "concrete"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#DDDDDD';
            s_default['fill-opacity'] = 0.9;
            s_default['z-index'] = 30;
            s_default['color'] = '#222222';
            s_default['width'] = 1.5;
            s_default['opacity'] = 0.6;
            s_default['dashes'] = [9, 3];
		}	
		
		
		if (tags["surface"] === "paving_slab" && selector === "area" ) 
		{
            s_default['fill-color'] = '#E0D0DB';
            s_default['color'] = '#222222';
            s_default['fill-opacity'] = 0.6;
            s_default['width'] = 1.5;
            s_default['z-index'] = 30;
            s_default['dashes'] = [5, 2];
		}
		
		if (tags["surface"] === "door"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#607F84';
            s_default['fill-opacity'] = 0.6;
            s_default['color'] = '#000000';
            s_default['width'] = 1.5;
            s_default['z-index'] = 39;
		}
		
		if (tags["surface"] === "green"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#88C037';
            s_default['fill-opacity'] = 0.2;
            s_default['z-index'] = 30;
		}
		if (tags["surface"] === "window"  && selector === "area" ) 
		{
            s_default['fill-color'] = '#13C5CF';
            s_default['fill-opacity'] = 0.3;
            s_default['color'] = '#000000';
            s_default['width'] = 1.5;
            s_default['z-index'] = 35;
		}
		if (tags["surface"] == "sanitary"  && selector == "area") 
		{
            s_default['fill-color'] = '#EECFFC';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 36;
		}
		
		if (tags["surface"] == "beverages"  && selector == "area") 
		{
            s_default['fill-color'] = '#E3EFEA';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 36;
		}
		
		if(tags["surface"] == "room" && selector == "area") {
            s_default['fill-color'] = '#E9E9E9';
            s_default['fill-opacity'] = 1;
            s_default['z-index'] = 36;
		}
		
		if(tags["handrail"] === "yes") {
            s_default['color'] = '#111111';
            s_default['width'] = 1.5;
            s_default['z-index'] = 27;
            s_default['dashes'] = [5, 5];
		}
		
		if(type === 'way' && tags["wall"] === "yes" && zoom < 12 ) {
            s_default['color'] = '#000000';
            s_default['width'] = 0.5;
            s_default['z-index'] = 27;
		}
		
		if(tags["wall"] === "yes" && zoom < 16 && zoom >= 12) {
            s_default['color'] = '#000000';
            s_default['width'] = 1;
            s_default['z-index'] = 27;
		}
		
		if(tags["wall"] === "yes"  && zoom >= 16 ) {
            s_default['color'] = '#000000';
            s_default['width'] = 1.5;
            s_default['z-index'] = 27;
		}
		
		if(tags["wall"] >= 16 ) {
            s_default['color'] = '#000000';
            s_default['width'] = 1.5;
            s_default['z-index'] = 27;
		}
		
		if(tags["wall"] == "yes" && selector == "area") {
            s_default['fill-color'] = '#E9E9E9';
            s_default['fill-opacity'] = 2;
            s_default['z-index'] = 22;
		}
		
		if (tags["building"] === "yes" && selector == "area") 
		{
            s_default['fill-color'] = '#DDDAD3';
            s_default['fill-opacity'] = 1;
            s_default['color'] = '#CCC9C4';
            s_default['width'] = 1.5;
            s_default['z-index'] = 8;
		}
		
        if (((selector === 'area' && tags['natural'] === 'coastline'))) {
            s_default['fill-color'] = '#fcf8e4';
            s_default['-x-mapnik-layer'] = 'bottom';
        }
        
        if (((selector === 'area' && tags['natural'] === 'glacier'))) {
            s_default['fill-color'] = '#fcfeff';
        }

        if (((selector === 'area' && tags['leisure'] === 'park'))) {
            s_default['fill-color'] = '#c4e9a4';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['leisure'] === 'garden')) || ((selector === 'area' && tags['landuse'] === 'orchard'))) {
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['natural'] === 'scrub'))) {
            s_default['fill-color'] = '#e5f5dc';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['natural'] === 'heath'))) {
            s_default['fill-color'] = '#ecffe5';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['landuse'] === 'industrial')) || ((selector === 'area' && tags['landuse'] === 'military'))) {
            s_default['fill-color'] = '#ddd8da';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['amenity'] === 'parking'))) {
            s_default['fill-color'] = '#ecedf4';
            s_default['z-index'] = 3;
        }


        if (((selector === 'area' && tags['natural'] === 'forest')) || ((selector === 'area' && tags['natural'] === 'wood')) || ((selector === 'area' && tags['landuse'] === 'forest')) || ((selector === 'area' && tags['landuse'] === 'wood'))) {
            s_default['fill-color'] = '#d6f4c6';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['landuse'] === 'garages') && zoom >= 10)) {
            s_default['fill-color'] = '#ddd8da';
            s_default['z-index'] = 3;
        }

        if (((selector === 'area' && tags['natural'] === 'forest')) || ((selector === 'area' && tags['natural'] === 'wood') && zoom >= 10) || ((selector === 'area' && tags['landuse'] === 'forest')) || ((selector === 'area' && tags['landuse'] === 'wood'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 0;
            s_default['font-size'] = '10';
            s_default['font-family'] = 'DejaVu Serif Italic';
            s_default['text-color'] = 'green';
            s_default['text-allow-overlap'] = 'false';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['-x-mapnik-min-distance'] = '0 ';
        }

        if (((selector === 'area' && tags['landuse'] === 'grass')) || ((selector === 'area' && tags['natural'] === 'grass')) || ((selector === 'area' && tags['natural'] === 'meadow')) || ((selector === 'area' && tags['landuse'] === 'meadow')) || ((selector === 'area' && tags['landuse'] === 'recreation_ground'))) {
            s_default['fill-color'] = '#f4ffe5';
            s_default['z-index'] = 4;
        }

        if (((selector === 'area' && tags['natural'] === 'wetland'))) {
            s_default['z-index'] = 4;
        }

        if (((selector === 'area' && tags['landuse'] === 'farmland')) || ((selector === 'area' && tags['landuse'] === 'farm')) || ((selector === 'area' && tags['landuse'] === 'field'))) {
            s_default['fill-color'] = '#fff5c4';
            s_default['z-index'] = 5;
        }

        if (((selector === 'area' && tags['landuse'] === 'cemetery'))) {
            s_default['fill-color'] = '#e5f5dc';
            s_default['z-index'] = 5;
        }

        if (((selector === 'area' && tags['aeroway'] === 'aerodrome'))) {
            s_default['color'] = '#008ac6';
            s_default['width'] = 0.8;
            s_default['z-index'] = 5;
        }

        if (((selector === 'area' && tags['leisure'] === 'stadium')) || ((selector === 'area' && tags['leisure'] === 'pitch'))) {
            s_default['fill-color'] = '#e3deb1';
            s_default['z-index'] = 5;
        }

        if (((type === 'way' && tags['waterway'] === 'river'))) {
            s_default['color'] = '#C4D4F5';
            s_default['width'] = 0.9;
            s_default['z-index'] = 9;
        }

        if (((type === 'way' && tags['waterway'] === 'stream'))) {
            s_default['color'] = '#C4D4F5';
            s_default['width'] = 0.5;
            s_default['z-index'] = 9;
        }

        if (((type === 'way' && tags['waterway'] === 'canal'))) {
            s_default['color'] = '#abc4f5';
            s_default['width'] = 0.6;
            s_default['z-index'] = 9;
        }

        if (((selector === 'area' && tags['waterway'] === 'riverbank')) || ((selector === 'area' && tags['natural'] === 'water')) || ((selector === 'area' && tags['landuse'] === 'reservoir'))) {
            s_default['fill-color'] = '#C4D4F5';
            s_default['color'] = '#C4D4F5';
            s_default['width'] = 0.1;
            s_default['z-index'] = 9;
        }

        if (((selector === 'area' && tags['natural'] === 'water'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 1;
            s_default['font-size'] = '10';
            s_default['font-family'] = 'DejaVu Serif Italic';
            s_default['text-color'] = '#285fd1';
            s_default['text-allow-overlap'] = 'false';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
        }

        if (((type === 'way' && tags['highway'] === 'construction'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['width'] = 2;
            s_default['color'] = '#ffffff';
            s_default['z-index'] = 10;
            s_default['dashes'] = [9, 9];
        }

        if (((type === 'way' && tags['highway'] === 'construction'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['width'] = 3;
            s_default['color'] = '#ffffff';
            s_default['z-index'] = 10;
            s_default['dashes'] = [9, 9];
        }

        if (((type === 'way' && tags['highway'] === 'footway')) || ((type === 'way' && tags['highway'] === 'path')) || ((type === 'way' && tags['highway'] === 'cycleway')) || ((type === 'way' && tags['highway'] === 'pedestrian'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['casing-width'] = 0.3;
            s_default['casing-color'] = '#bf96ce';
            s_default['width'] = 0.2;
            s_default['color'] = '#ffffff';
            s_default['z-index'] = 10;
            s_default['dashes'] = [2, 2];
        }

        if (((type === 'way' && tags['highway'] === 'steps'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['casing-width'] = 0.3;
            s_default['casing-color'] = '#ffffff';
            s_default['width'] = 3;
            s_default['color'] = '#bf96ce';
            s_default['z-index'] = 10;
            s_default['dashes'] = [1, 1];
            s_default['linecap'] = 'butt';
        }

        if (((type === 'way' && tags['highway'] === 'road')) || ((type === 'way' && tags['highway'] === 'track'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 1.5;
            s_default['color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 9;
        }

        if (((type === 'way' && tags['highway'] === 'road')) || ((type === 'way' && tags['highway'] === 'track'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 2.5;
            s_default['color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 9;
        }
        
        if (type === 'way' && tags['highway'] === 'service') {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 1.2;
            s_default['color'] = '#ffffff';
            s_default['casing-width'] = 0.3;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 10;
        }

        if (((type === 'way' && tags['highway'] === 'residential') && zoom === 16) || ((type === 'way' && tags['highway'] === 'unclassified') && zoom === 16) || ((type === 'way' && tags['highway'] === 'living_street') && zoom === 16) || ((type === 'way' && tags['highway'] === 'service' && (tags['living_street'] === '-1' || tags['living_street'] === 'false' || tags['living_street'] === 'no') && tags['service'] !== 'parking_aisle') && zoom === 16)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 3.5;
            s_default['color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 10;
        }
        
        if (((type === 'way' && tags['highway'] === 'residential')) || ((type === 'way' && tags['highway'] === 'unclassified')) || ((type === 'way' && tags['highway'] === 'living_street')) || ((type === 'way' && tags['highway'] === 'service' && (tags['living_street'] === '-1' || tags['living_street'] === 'false' || tags['living_street'] === 'no') && tags['service'] !== 'parking_aisle'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 4.5;
            s_default['color'] = '#ffffff';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 10;
        }
        
        if (((type === 'way' && tags['highway'] === 'secondary') && zoom === 16) || ((type === 'way' && tags['highway'] === 'secondary_link') && zoom === 16) || ((type === 'way' && tags['highway'] === 'tertiary') && zoom === 16) || ((type === 'way' && tags['highway'] === 'tertiary_link') && zoom === 16)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 7;
            s_default['color'] = '#fcffd1';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 11;
        }

        if (((type === 'way' && tags['highway'] === 'secondary') && zoom === 17) || ((type === 'way' && tags['highway'] === 'secondary_link') && zoom === 17) || ((type === 'way' && tags['highway'] === 'tertiary') && zoom === 17) || ((type === 'way' && tags['highway'] === 'tertiary_link') && zoom === 17)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 8;
            s_default['color'] = '#fcffd1';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 11;
        }

        if (((type === 'way' && tags['highway'] === 'secondary') && zoom === 18) || ((type === 'way' && tags['highway'] === 'secondary_link') && zoom === 18) || ((type === 'way' && tags['highway'] === 'tertiary') && zoom === 18) || ((type === 'way' && tags['highway'] === 'tertiary_link') && zoom === 18)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 9;
            s_default['color'] = '#fcffd1';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 11;
        }

        if (((type === 'way' && tags['highway'] === 'primary') && zoom === 16) || ((type === 'way' && tags['highway'] === 'primary_link') && zoom === 16)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 9;
            s_default['color'] = '#fcea97';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 12;
        }

        if (((type === 'way' && tags['highway'] === 'primary') && zoom === 17) || ((type === 'way' && tags['highway'] === 'primary_link') && zoom === 17)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 10;
            s_default['color'] = '#fcea97';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 12;
        }

        if (((type === 'way' && tags['highway'] === 'primary') && zoom === 18) || ((type === 'way' && tags['highway'] === 'primary_link') && zoom === 18)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 11;
            s_default['color'] = '#fcea97';
            s_default['casing-width'] = 0.5;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 12;
        }

        if (((type === 'way' && tags['highway'] === 'trunk') && zoom === 17) || ((type === 'way' && tags['highway'] === 'trunk_link') && zoom === 17) || ((type === 'way' && tags['highway'] === 'motorway') && zoom === 17) || ((type === 'way' && tags['highway'] === 'motorway_link') && zoom === 17)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 12;
            s_default['color'] = '#ffd780';
            s_default['casing-width'] = 1;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 13;
        }

        if (((type === 'way' && tags['highway'] === 'trunk') && zoom === 18) || ((type === 'way' && tags['highway'] === 'trunk_link') && zoom === 18) || ((type === 'way' && tags['highway'] === 'motorway') && zoom === 18) || ((type === 'way' && tags['highway'] === 'motorway_link') && zoom === 18)) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-position'] = 'line';
            s_default['text-color'] = '#404040';
            s_default['font-family'] = 'DejaVu Sans Bold';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['width'] = 13;
            s_default['color'] = '#ffd780';
            s_default['casing-width'] = 1;
            s_default['casing-color'] = '#996703';
            s_default['z-index'] = 13;
        }
        
        if (((type === 'way' && tags['highway'] === 'trunk')) || ((type === 'way' && tags['highway'] === 'trunk_link')) || ((type === 'way' && tags['highway'] === 'motorway')) || ((type === 'way' && tags['highway'] === 'motorway_link')) || ((type === 'way' && tags['highway'] === 'primary')) || ((type === 'way' && tags['highway'] === 'primary_link'))) {
            s_centerline['width'] = 0.3;
            s_centerline['color'] = '#fa6478';
            s_centerline['z-index'] = 14;
            s_centerline['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && (tags['oneway'] === '1' || tags['oneway'] === 'true' || tags['oneway'] === 'yes')))) {
            s_default['line-style'] = 'arrows';
            s_default['z-index'] = 15;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((selector === 'line' && tags['railway'] === 'rail'))) {
            s_default['width'] = 1.4;
            s_default['color'] = '#606060';
            s_default['z-index'] = 15;
        }

        if (((selector === 'line' && tags['railway'] === 'rail'))) {
            s_ticks['width'] = 1;
            s_ticks['color'] = '#ffffff';
            s_ticks['dashes'] = [6, 6];
            s_ticks['z-index'] = 16;
        }

        if (((type === 'way' && tags['railway'] === 'subway'))) {
            s_default['width'] = 3;
            s_default['color'] = '#072889';
            s_default['z-index'] = 15;
            s_default['dashes'] = [3, 3];
            s_default['opacity'] = 0.3;
            s_default['linecap'] = 'butt';
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['barrier'] === 'fence'))) {
            s_default['width'] = 0.3;
            s_default['color'] = 'black';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['barrier'] === 'wall'))) {
            s_default['width'] = 0.5;
            s_default['color'] = 'black';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['marking'] === 'sport' && (!tags.hasOwnProperty('colour')) && (!tags.hasOwnProperty('color'))))) {
            s_default['width'] = 0.5;
            s_default['color'] = '#a0a0a0';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'white')) || ((type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'white'))) {
            s_default['width'] = 1;
            s_default['color'] = 'white';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'red')) || ((type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'red'))) {
            s_default['width'] = 1;
            s_default['color'] = '#c00000';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }

        if (((type === 'way' && tags['marking'] === 'sport' && tags['colour'] === 'black')) || ((type === 'way' && tags['marking'] === 'sport' && tags['color'] === 'black'))) {
            s_default['width'] = 1;
            s_default['color'] = 'black';
            s_default['z-index'] = 16;
            s_default['-x-mapnik-layer'] = 'top';
        }


        if (((type === 'node' && tags['amenity'] === 'place_of_worship'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-color'] = '#623f00';
            s_default['font-family'] = 'DejaVu Serif Italic';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-offset'] = 3;
            s_default['max-width'] = 70;
        }

        if (((selector === 'area' && tags['amenity'] === 'place_of_worship'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-color'] = '#623f00';
            s_default['font-family'] = 'DejaVu Serif Italic';
            s_default['font-size'] = '9';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-offset'] = 3;
            s_default['max-width'] = 70;
            s_default['z-index'] = 16;
            s_default['width'] = 0.1;
            s_default['color'] = '#111111';
            s_default['text-opacity'] = '1';
            s_default['fill-color'] = '#777777';
            s_default['fill-opacity'] = 0.5;
        }

     

        if (((selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '2'))) {
            s_default['width'] = 0.5;
            s_default['color'] = '#202020';
            s_default['dashes'] = [6, 4];
            s_default['opacity'] = 0.7;
            s_default['z-index'] = 16;
        }

        if (((selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '3'))) {
            s_default['width'] = 1.3;
            s_default['color'] = '#ff99cc';
            s_default['opacity'] = 0.5;
            s_default['z-index'] = 16;
        }

        if (((selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '6'))) {
            s_default['width'] = 0.5;
            s_default['color'] = '#101010';
            s_default['dashes'] = [1, 2];
            s_default['opacity'] = 0.6;
            s_default['z-index'] = 16.1;
        }


        if (((selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '4'))) {
            s_default['width'] = 0.7;
            s_default['color'] = '#000000';
            s_default['dashes'] = [1, 2];
            s_default['opacity'] = 0.8;
            s_default['z-index'] = 16.3;
        }

        if (((type === 'way' && tags['railway'] === 'tram'))) {
            s_default['z-index'] = 17;
        }

        if (((type === 'node' && tags['railway'] === 'station' && tags['transport'] !== 'subway'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 7;
            s_default['font-size'] = '9';
            s_default['font-family'] = 'DejaVu Sans Mono Book';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#000d6c';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
            s_default['-x-mapnik-min-distance'] = '0';
        }

        if (((type === 'node' && tags['railway'] === 'subway_entrance'))) {
            s_default['z-index'] = 17;
        }

        if (((type === 'node' && tags['railway'] === 'subway_entrance' && (tags.hasOwnProperty('name'))))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 11;
            s_default['font-size'] = '9';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['text-halo-radius'] = 2;
            s_default['text-color'] = '#1300bb';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
            s_default['-x-mapnik-min-distance'] = '0';
        }

        if (((type === 'node' && tags['aeroway'] === 'aerodrome'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 12;
            s_default['font-size'] = '9';
            s_default['font-family'] = 'DejaVu Sans Condensed Bold';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#1e7ca5';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
            s_default['z-index'] = 17;
        }
        
        if (((type === 'node' && tags['place'] === 'town'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['font-size'] = '80';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['text-color'] = '#101010';
            s_default['text-opacity'] = '0.2';
            s_default['text-allow-overlap'] = 'true';
            s_default['z-index'] = 20;
        }

        if (((type === 'node' && tags['place'] === 'city'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['font-size'] = '100';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['text-color'] = '#101010';
            s_default['text-opacity'] = '0.3';
            s_default['text-allow-overlap'] = 'true';
            s_default['z-index'] = 20;
        }

        if (((type === 'node' && tags['place'] === 'village'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 1;
            s_default['font-size'] = '9';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#606060';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
        }

        if (((type === 'node' && tags['place'] === 'hamlet'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 1;
            s_default['font-size'] = '8';
            s_default['font-family'] = 'DejaVu Sans Book';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#505050';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
        }

        if (((selector === 'area' && tags['landuse'] === 'nature_reserve')) || ((selector === 'area' && tags['leisure'] === 'park'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 1;
            s_default['font-size'] = '10';
            s_default['font-family'] = 'DejaVu Serif Italic';
            s_default['text-halo-radius'] = 0;
            s_default['text-color'] = '#3c8000';
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-allow-overlap'] = 'false';
        }

        if (((type === 'way' && tags['waterway'] === 'stream')) || ((type === 'way' && tags['waterway'] === 'river')) || ((type === 'way' && tags['waterway'] === 'canal'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['font-size'] = '9';
            s_default['font-family'] = 'DejaVu Sans Oblique';
            s_default['text-color'] = '#547bd1';
            s_default['text-halo-radius'] = 1;
            s_default['text-halo-color'] = '#ffffff';
            s_default['text-position'] = 'line';
        }

        if (((type === 'node' && tags['place'] === 'ocean'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 0;
            s_default['font-size'] = '11';
            s_default['font-family'] = 'DejaVu Sans Oblique';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#202020';
            s_default['text-halo-color'] = '#ffffff';
            s_default['z-index'] = -1;
            s_default['-x-mapnik-min-distance'] = '0';
        }
        
        if (((type === 'node' && tags['place'] === 'sea'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 0;
            s_default['font-size'] = '10';
            s_default['font-family'] = 'DejaVu Sans Oblique';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#4976d1';
            s_default['text-halo-color'] = '#ffffff';
            s_default['-x-mapnik-min-distance'] = '0';
        }

        if (((type === 'node' && tags['natural'] === 'peak'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = 3;
            s_default['font-size'] = '7';
            s_default['font-family'] = 'DejaVu Sans Mono Book';
            s_default['text-halo-radius'] = 0;
            s_default['text-color'] = '#664229';
            s_default['text-halo-color'] = '#ffffff';
            s_default['-x-mapnik-min-distance'] = '0';
        }

        if (((selector === 'area' && tags['boundary'] === 'administrative' && tags['admin_level'] === '6'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['text-offset'] = -10;
            s_default['font-size'] = '12';
            s_default['font-family'] = 'DejaVu Sans ExtraLight';
            s_default['text-halo-radius'] = 1;
            s_default['text-color'] = '#7848a0';
            s_default['text-halo-color'] = '#ffffff';
        }

        if (((type === 'node' && tags['place'] === 'suburb'))) {
            s_default['text'] = MapCSS.e_localize(tags, 'name');
            s_default['font-size'] = '12';
            s_default['font-family'] = 'DejaVu Sans ExtraLight';
            s_default['text-color'] = '#7848a0';
            s_default['z-index'] = 20;
        }

        if (((selector === 'area' && (tags.hasOwnProperty('building'))))) {
            s_default['width'] = 0.3;
            s_default['color'] = '#cca352';
            s_default['z-index'] = 17;
        }

        if (((selector === 'area' && (tags.hasOwnProperty('building'))) && zoom >= 19)) {
            s_default['text'] = MapCSS.e_localize(tags, 'addr:housenumber');
            s_default['text-halo-radius'] = 1;
            s_default['text-position'] = 'center';
            s_default['font-size'] = '8';
            s_default['-x-mapnik-min-distance'] = '10';
            s_default['opacity'] = 0.8;
        }

        if (((type === 'node' && tags['highway'] === 'milestone' && (tags.hasOwnProperty('pk'))))) {
            s_default['text'] = MapCSS.e_localize(tags, 'pk');
            s_default['font-size'] = '7';
            s_default['text-halo-radius'] = 5;
            s_default['-x-mapnik-min-distance'] = '0';
        }
       
        if(type === 'way' && selector === 'line' && tags['highway'] === undefined) {
            s_default['color'] = '#000000';
            s_default['width'] = 0.5;
		}
		
		if(type === 'way' && selector === 'line' && tags['highway'] === undefined) {
            s_default['color'] = '#000000';
            s_default['width'] = 1;
		}
		
		if(type === 'way' && selector === 'line' && tags['highway'] === undefined) {
            s_default['color'] = '#000000';
            s_default['width'] = 1.5;
		}
		
        if (Object.keys(s_default).length) {
            style['default'] = s_default;
        }
        if (Object.keys(s_centerline).length) {
            style['centerline'] = s_centerline;
        }
        if (Object.keys(s_ticks).length) {
            style['ticks'] = s_ticks;
        }
        if (Object.keys(s_label).length) {
            style['label'] = s_label;
        }
       
        return style;
    }

    var sprite_images = {
        
    }, external_images = [], presence_tags = ['shop'], value_tags = ['color', 'amenity', 'pk', 'building ', 'wall', 'surface', 'marking', 'service', 'addr:housenumber', 'population', 'leisure', 'waterway', 'aeroway', 'landuse', 'barrier', 'colour', 'railway', 'oneway', 'religion', 'tourism', 'admin_level', 'transport', 'name', 'building', 'place', 'residential', 'highway', 'ele', 'living_street', 'natural', 'boundary', 'capital'];

    MapCSS.loadStyle('styles/contagt', restyle, sprite_images, external_images, presence_tags, value_tags);
    MapCSS.preloadExternalImages('styles/contagt');
})(MapCSS);
