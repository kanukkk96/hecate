"use strict";
//
//  area_XX.js
//
//  Created by Alezia Kurdis, June 17th, 2021.
//  Copyright 2021 Vircadia and contributors.
//
//  Add customized content to a specific area of the 3D Goto (hecate) application.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function(){ 

    var AREA_NO = 40; //<===== UPDATE THIS VALUE FOR YOUR CHOSEN AREA TO CUSTOMIZE.
    
    
    var ROOT = Script.resolvePath('').split("area_" + AREA_NO + ".js")[0];
    var CONTENT_BASE_PATH = ROOT + "area_" + AREA_NO + "/";
    
    this.preload = function(entityID) {

        var properties = Entities.getEntityProperties(entityID, ["position"]);
        positionZero = properties.position;
        
        //Generate a Visibility Zone.
        var visibilityZoneId = Entities.addEntity({
            "name": "VISIBILITY_ZONE_AREA_" + AREA_NO,
            "locked": true,
            "parentID": entityID,
            "localPosition": {"x": 0.0, "y": 0.0, "z": 0.0},
            "localRotation": {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0},
            "dimensions": {"x": 30.0, "y": 20.0, "z": 60.0},
            "type": "Zone",
            "grab": {
                "grabbable": false
            },
            "shapeType": "box",
            "keyLightMode": "inherit",
            "ambientLightMode": "inherit",
            "skyboxMode": "inherit",
            "hazeMode": "inherit",
            "bloomMode": "inherit"
        },"domain");
        
        
        /*###### HERE IS WHERE YOU ADD YOUR CONTENT ############ 
        
        YOU MUST INCLUDE THE FOLLOWING ATTRIBUTE ON EACH ENTITIES YOU ADD
            "parentID": entityID,
            "renderWithZones": [visibilityZoneId],
            "locked": true,
        
        position and rotation must be based relative to the point centered in the Area, so use:
            "localPosition": 
            "localRotation": 
        Using local values will ensure a correct rendering in every cases.
        
        Also, we must create "domain" entities. 
        It will be simpler as we don't have to ensure the deletion.
        ###################### CONTENT #####################################*/
        
        var id = Entities.addEntity({
            "parentID": entityID,
            "renderWithZones": [visibilityZoneId],
            "locked": true,            
            "localPosition": {"x": 0.0, "y": 0.0, "z": 0.0},
            "localRotation": {"x": 0.0, "y": 0.0, "z": 0.0, "w": 1.0},
            "type": "Box",
            "shape": "Cube",
            "name": "Test_Custom Area",
            "dimensions": {
                "x": 0.20000000298023224,
                "y": 0.02,
                "z": 0.20000000298023224
            },
            "grab": {
                "grabbable": false
            },
            "color": {
                "red": 255,
                "green": 128,
                "blue": 0
            }
        },"domain");
        
        
        
        
        
        //################### END CONTENT ###################################*/
    };    

    this.unload = function(entityID) {
        //Termination proces
    };  

})
