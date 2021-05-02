"use strict";
//
//  generator.js
//
//  Created by Alezia Kurdis, April 16th, 2021.
//  Copyright 2021 Vircadia and contributors.
//
//  Generate a 3d portals in-world based on the places api.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function(){ 

    //Fetch Data from Places API
    var placeApiUrl = "https://metaverse.vircadia.com/live/api/v1/places?current_page=1&per_page=1000"; 
    var placesHttpRequest = null;
    var placesData;
    var portalList = [];
    var ROOT = Script.resolvePath('').split("generator.js")[0];
    var hecatePortalModelUrl = ROOT + "hecate_portal4.fbx";
    var hecateParkModelUrl = ROOT + "hecate_belvedere.fbx";
    var hecateArrivalPlatformModelUrl = ROOT + "hecate_origine.fbx";
    var hecateDeadEndModelUrl = ROOT + "deadend.fbx";
    var hecateBuildingdModelUrl = ROOT + "hecate_Building_Wothal-B.fbx";
    var hecateAirSoundUrl = ROOT + "air.mp3";
    var airSound;
    var airSoundInjector = Uuid.NULL;
    var AIR_SOUND_VOLUME = 0.3;
    var hecateSkyUrl = ROOT + "sky.jpg";     
    var hecateMetalNormalUrl = ROOT + "metalNormal512c.jpg";
    var imagePlaceHolderUrl = ROOT + "placeholder.jpg";
    var tpScriptUrl = ROOT + "teleporter.js?version=" + Math.floor(Math.random() * 65000);
    var backScriptUrl = ROOT + "back.js";    
    var thisEntity = Uuid.NULL;
    var positionZero;
    var placeHistorySettingValue;
    var placeHistorySettingName = "3D_GOTO_PLACES_HISTORY";
    var defaultPlaceHistorySettingValue = { "visitedPlacesHistory": [] };
    var frequentPlaces = {};
    var MIN_FREQUENCY_TO_BE_CONSIDERED = 3;
    var MAX_PLACE_HISTORY_ELEMENTS = 30;
    var STEP_HEIGHT = 0.2;
    var PARK_INTERVAL = 22;
    
    this.preload = function(entityID) {
        thisEntity = entityID;
        
        airSound = SoundCache.getSound(hecateAirSoundUrl);
        
        var properties = Entities.getEntityProperties(entityID, ["position"]);
        positionZero = properties.position;
        
        placeHistorySettingValue = Settings.getValue(placeHistorySettingName, defaultPlaceHistorySettingValue);
        frequentPlaces = getFrequentPlaces(placeHistorySettingValue.visitedPlacesHistory);
        
        getPlacesContent(placeApiUrl + "&acash=" + Math.floor(Math.random() * 999999));
        
        if (airSound.downloaded) {
            playAirSound();
        } else {
            airSound.ready.connect(onSoundReady);
        }
    };    

    function onSoundReady() {
        airSound.ready.disconnect(onSoundReady);
        playAirSound();
    }
    
    function playAirSound() {
        airSoundInjector = Audio.playSound(airSound, {
            "loop": true,
            "localOnly": true,
            "volume": AIR_SOUND_VOLUME
        });
    }
    
    function getPlacesContent(apiUrl) {
        placesHttpRequest = new XMLHttpRequest();
        placesHttpRequest.requestComplete.connect(placesGetResponseStatus);
        placesHttpRequest.open("GET", apiUrl);
        placesHttpRequest.send();
    }
        
    function placesGetResponseStatus() {
        if (placesHttpRequest.status === 200) {
            placesData = placesHttpRequest.responseText;
            try {
                placesData = JSON.parse(placesHttpRequest.responseText);
            } catch(e) {
                placesData = {};
            }
        }
        
        placesHttpRequest.requestComplete.disconnect(placesGetResponseStatus);
        placesHttpRequest = null;
        
        processData();
        //print("HECATE portal: " + JSON.stringify(portalList));
        generatePortals();
    }
    
    //Parse and sort the data
    function processData(){
        //Get fundation data
        var isConnectedUser = AccountServices.isLoggedIn();
        var supportedProtocole = Window.protocolSignature();
   
        //Rules: 
            //score = 120 + crowd
            //wrong protocole = discaded
            //domain offline = discarded
            
            //visibility != "open" and "connections" while connected: score - 2 ???need clarification ???
            //visibility != "open" while NOT connected: score - 2 ???need clarification ???
            //visibility != "open" while NOT connected: score - 2 ???need clarification ???
            
            //No picture then score -4
            //No description then score -3
            //We add the 1st letter of the place name after teh score so it will secondary listed in alphabetic order.
            
        var places = placesData.data.places;
        for (var i = 0;i < places.length; i++) {
            var score = 99980;
            var category = "";
            var accessStatus = "NOBODY";
            
            var description = (places[i].description ? places[i].description : "");
            var thumbnail = (places[i].thumbnail ? places[i].thumbnail : "");
            
            score = score - places[i].current_attendance;
            
            if ( places[i].current_attendance > 0 ) {
                score = score - 20;
            }
            
            if ( places[i].domain.protocol_version === supportedProtocole ) {
                if ( places[i].domain.active ) {
                    //visibility rules would be here
                        //visibility != "open" and "connections" while connected: score + 2
                        //visibility != "open" while NOT connected: score + 2
                        //visibility != "open" while NOT connected: score + 2                        

                    if ( thumbnail.substr(0, 4).toLocaleLowerCase() !== "http") {
                        score = score + 4;
                    }

                    if (description === "") {
                        score = score + 3;
                    }

                    if (thumbnail.substr(0, 4).toLocaleLowerCase() !== "http" && description === "") {
                        category = "STONE";
                    } else {
                        if ( thumbnail.substr(0, 4).toLocaleLowerCase() !== "http" && description !== ""){
                            category = "IRON";
                        } else {
                            if (thumbnail.substr(0, 4).toLocaleLowerCase() === "http" && description === "") {
                                category = "BRONZE";
                            } else {
                                category = "SILVER";
                            }
                        }
                    }
                    
                    if (places[i].current_attendance > 0) {
                        category = "GOLD";
                        if (places[i].current_attendance >= 1000) {
                            accessStatus = "FULL";
                        } else {
                            accessStatus = "PEOPLE";
                        }
                    }
                    
                    if (frequentPlaces[places[i].id] >= MIN_FREQUENCY_TO_BE_CONSIDERED) {
                        score = MAX_PLACE_HISTORY_ELEMENTS - frequentPlaces[places[i].id];
                        category = "BLUESTEAL";
                    }                    
                    
                    var portal = {
                        "order": score + places[i].name,
                        "category": category,
                        "accessStatus": accessStatus,
                        "name": places[i].name,
                        "description": description,
                        "thumbnail": thumbnail,
                        "maturity": places[i].maturity,
                        "address": places[i].address,
                        "current_attendance": places[i].current_attendance,
                        "id": places[i].id,
                        "visibility": places[i].visibility,
                        "capacity": 1000
                    };
                    portalList.push(portal);   
                }
            }
        }
        
        //Elect the promoted Silver place (RUBY class)
        var randomItem;
        var n = 0;
        while (n < 100) {
            randomItem = Math.floor(Math.random() * portalList.length);
            if (portalList[randomItem].category === "SILVER") {
                portalList[randomItem].category = "RUBY";
                portalList[randomItem].order = "1A";
                break;
            }
            n++;
        }
        
        portalList.sort(sortOrder);
    }

    function sortOrder(a, b) {
        var orderA = a.order.toUpperCase();
        var orderB = b.order.toUpperCase();
        if (orderA > orderB) {
            return 1;    
        } else if (orderA < orderB) {
            return -1;
        }
        if (a.order > b.order) {
            return 1;    
        } else if (a.order < b.order) {
            return -1;
        }
        return 0;
    }
    
    //Generate the Portals
    function generatePortals() {
        var radius = 9;
        var espacement = 4.5;
        var angleRad = 0;
        var corridorFactor = 1.7;
        var coy = 0.0;
        
        for (var i = 0;i < portalList.length; i++) {
            
            var numbrePossiblePerRing, cox, coz, relativePosition;
            
            if ((i%PARK_INTERVAL) === 0 && i !== 0) {
                numbrePossiblePerRing = (radius * 2 * Math.PI) / espacement;
                radius = radius + (espacement/numbrePossiblePerRing) * corridorFactor;
                angleRad = angleRad + ((2 * Math.PI)/numbrePossiblePerRing);
                cox = Math.cos(angleRad) * radius;
                coz = Math.sin(angleRad) * radius;
                relativePosition = {"x": cox, "y": coy, "z": coz };
                
                var parkId = Entities.addEntity({
                    "type": "Model",
                    "name": "PARK-" + i,
                    "position": Vec3.sum(positionZero, relativePosition),
                    "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad + Math.PI, "z": 0.0} ),
                    "locked": true,
                    "dimensions": {
                        "x": 7.8822,
                        "y": 501.1473,
                        "z": 5.7883
                    },
                    "grab": {
                        "grabbable": false
                    },
                    "shapeType": "static-mesh",
                    "modelURL": hecateParkModelUrl,
                    "useOriginalPivot": true                
                    }, "domain");
                
                coy = coy - STEP_HEIGHT;                
            }
            
            
            numbrePossiblePerRing = (radius * 2 * Math.PI) / espacement;
            radius = radius + (espacement/numbrePossiblePerRing) * corridorFactor;
            angleRad = angleRad + ((2 * Math.PI)/numbrePossiblePerRing);
            cox = Math.cos(angleRad) * radius;
            coz = Math.sin(angleRad) * radius;
            relativePosition = {"x": cox, "y": coy, "z": coz };
            
            var portalId = Entities.addEntity({
                "type": "Model",
                "name": "PORTAL - " + portalList[i].name,
                "position": Vec3.sum(positionZero, relativePosition),
                "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad + Math.PI, "z": 0.0} ),
                "locked": true,
                "dimensions": {
                    "x": 8.0673,
                    "y": 505.7698,
                    "z": 5.7883
                },
                "grab": {
                    "grabbable": false
                },
                "shapeType": "static-mesh",
                "modelURL": hecatePortalModelUrl,
                "useOriginalPivot": true                
                }, "domain");
            
            coy = coy - STEP_HEIGHT;

            if (i == 0) {
                var platformId = Entities.addEntity({
                        "type": "Model",
                        "name": "ARRIVAL",
                        "locked": true,
                        "dimensions": {
                            "x": 6.3025,
                            "y": 7.6355,
                            "z": 4.9420
                        },
                        "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),
                        "position": positionZero,
                        "grab": {
                            "grabbable": false
                        },
                        "shapeType": "static-mesh",
                        "modelURL": hecateArrivalPlatformModelUrl,
                        "useOriginalPivot": true
                    },"domain");
                    
                //BACK
                if (location.canGoBack()) {
                    var tpBackId = Entities.addEntity({                
                        "type": "Box",
                        "locked": true,
                        "visible": false,
                        "name": "PORTAL_BACK",
                        "dimensions": {
                            "x": 1.5,
                            "y": 4,
                            "z": 1.5
                        },
                        "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),
                        "position": Vec3.sum(positionZero, Vec3.multiplyQbyV(Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),{"x": -2.5, "y": 2.0, "z": 0.0})),                   
                        "grab": {
                            "grabbable": false
                        },
                        "script": backScriptUrl,
                        "shape": "Cube",
                        "collisionless": true,
                        "ignoreForCollisions": true
                        },"domain");
                        
                    var tpBackStopperId = Entities.addEntity({                
                        "type": "Box",
                        "locked": true,
                        "visible": false,
                        "name": "PORTAL_BACK_STOPPER",
                        "dimensions": {
                            "x": 0.5,
                            "y": 4,
                            "z": 1.5
                        },
                        "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),
                        "position": Vec3.sum(positionZero, Vec3.multiplyQbyV(Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),{"x": -2.8, "y": 2.0, "z": 0.0})),                   
                        "grab": {
                            "grabbable": false
                        },
                        "shape": "Cube",
                        },"domain");
                        
                     var textBackId = Entities.addEntity({
                        "type": "Text",
                        "locked": true,
                        "name": "BACK_TEXT",
                        "dimensions": {
                            "x": 1,
                            "y": 0.5,
                            "z": 0.01
                        },
                        "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad + Math.PI, "z": (Math.PI/2)} ),
                        "position": Vec3.sum(positionZero, Vec3.multiplyQbyV(Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad, "z": 0.0} ),{"x": -2.5, "y": 2.0, "z": 0.0})),
                        "grab": {
                            "grabbable": false
                        },
                        "text": "BACK",
                        "textColor": {
                            "red": 0,
                            "green": 128,
                            "blue": 255
                        },
                        "lineHeight": 0.3,
                        "backgroundAlpha": 0.0,
                        "topMargin": 0.02,
                        "rightMargin": 0.02,
                        "leftMargin": 0.02,
                        "bottomMargin": 0.02,
                        "unlit": true,
                        "textEffectThickness": 0.25,
                        "alignment": "center",
                        "collisionless": true,
                        "ignoreForCollisions": true                        
                        },"domain");
                }
                    
            }

            //Material
            var metallic, roughness, albedo;
            
            switch(portalList[i].category) {
                case "GOLD":
                    metallic = 1;
                    roughness = 0.176;
                    albedo = [
                        1,
                        0.9372549019607843,
                        0.5411764705882353
                    ];
                    break;
                case "SILVER":
                    metallic = 1;
                    roughness = 0.176;
                    albedo = [
                        0.8627450980392157,
                        0.9215686274509803,
                        0.9254901960784314
                    ];
                    break;
                case "BRONZE":
                    metallic = 1;
                    roughness = 0.176;
                    albedo = [
                        0.9411764705882353,
                        0.6941176470588235,
                        0.5568627450980392
                    ];
                    break;
                case "IRON":
                    metallic = 1;
                    roughness = 0.176;
                    albedo = [
                        0.4117647058823529,
                        0.4235294117647059,
                        0.43137254901960786
                    ];
                    break;
                case "STONE":
                    metallic = 0.104;
                    roughness = 0.572;
                    albedo = [
                        0.32941176470588235, 
                        0.2980392156862745, 
                        0.2
                    ];
                    break;
                case "BLUESTEAL":
                    metallic = 1;
                    roughness = 0.15;
                    albedo = [
                        0.4745098039215686,
                        0.5725490196078431,
                        1
                    ];
                    break;
                case "RUBY":
                    metallic = 1;
                    roughness = 0.15;
                    albedo = [
                        1.0,
                        0.0,
                        0.0
                    ];
                    break;                     
            } 

            var placeImage = imagePlaceHolderUrl;
            if (portalList[i].thumbnail !== "") {
                placeImage = portalList[i].thumbnail;
            }
            
            var tpColor = [];

            switch(portalList[i].accessStatus) {
                case "NOBODY":
                    tpColor = [0.0, 0.6, 1.0 ];
                    tpColorBloom = [0.0, 1.116, 1.86];
                    break;
                case "PEOPLE":
                    tpColor = [0.0, 1.0, 0.0];
                    tpColorBloom = [0.0, 1.86, 0.0];
                    break;
                case "FULL":
                    tpColor = [1.0, 0.0, 0.0];
                    tpColorBloom = [1.86, 0.0, 0.0];
                    break;                    
            }
            
            var materialDataWalls = {
               "materialVersion":1,
               "materials":[
                    {
                        "name":"WALLS",
                        "albedo": albedo,
                        "metallic": metallic,
                        "roughness": roughness,
                        "normalMap": hecateMetalNormalUrl,
                        "cullFaceMode":"CULL_BACK",
                        "model":"hifi_pbr"
                    }
               ]
            };

            var materialDataImage = {
               "materialVersion":1,
               "materials":[
                    {
                        "name":"IMAGE",
                        "albedo":[ 1, 1, 1 ],
                        "metallic":0.01,
                        "roughness":0.07,
                        "albedoMap": placeImage,
                        "emissiveMap": placeImage,
                        "cullFaceMode":"CULL_BACK",
                        "model":"hifi_pbr"
                    }                
               ]
            };

            var materialDataTp = {
               "materialVersion":1,
               "materials":[
                    {
                        "name":"TP",
                        "albedo":tpColor,
                        "metallic":0.001,
                        "roughness":0.509,
                        "emissive": tpColorBloom,
                        "cullFaceMode":"CULL_BACK",
                        "model":"hifi_pbr"
                    }                  
               ]
            };
            
            var materialPortalWallsId = Entities.addEntity({
                    "type": "Material",
                    "name": "PORTAL_WALLS_MATERIAL - " + portalList[i].name,
                    "locked": true,
                    "grab": {
                        "grabbable": false
                    },
                    "materialURL": "materialData",
                    "priority": 1,
                    "parentMaterialName": "[mat::WALLS]",
                    "materialData": JSON.stringify(materialDataWalls),
                    "parentID": portalId,
                    "position": Vec3.sum(positionZero, {"x": cox, "y": 1.0, "z": coz})
                },"domain");

            var materialPortalImageId = Entities.addEntity({
                    "type": "Material",
                    "name": "PORTAL_IMAGE_MATERIAL - " + portalList[i].name,
                    "locked": true,
                    "grab": {
                        "grabbable": false
                    },
                    "materialURL": "materialData",
                    "priority": 1,
                    "parentMaterialName": "[mat::IMAGE]",
                    "materialData": JSON.stringify(materialDataImage),
                    "parentID": portalId,
                    "position": Vec3.sum(positionZero, {"x": cox, "y": 2.0, "z": coz})
                },"domain");
                
            var materialPortalTpId = Entities.addEntity({
                    "type": "Material",
                    "name": "PORTAL_TP_MATERIAL - " + portalList[i].name,
                    "locked": true,
                    "grab": {
                        "grabbable": false
                    },
                    "materialURL": "materialData",
                    "priority": 1,
                    "parentMaterialName": "[mat::TP]",
                    "materialData": JSON.stringify(materialDataTp),
                    "parentID": portalId,
                    "position": Vec3.sum(positionZero, {"x": cox, "y": 3.0, "z": coz})
                },"domain");
            
            //NAME text
            var textNamePortalId = Entities.addEntity({
                "type": "Text",
                "parentID": portalId,
                "locked": true,
                "name": "PORTAL_NAME_TEXT - " + portalList[i].name,
                "dimensions": {
                    "x": 2.4119091033935547,
                    "y": 0.2888250946998596,
                    "z": 0.009999999776482582
                },
                "localRotation": {
                    "x": 0,
                    "y": 0.7071067690849304,
                    "z": 0,
                    "w": 0.7071067690849304
                },
                "localPosition": {
                    "x": 1.28,
                    "y": 3.0775,
                    "z": 0
                },
                "grab": {
                    "grabbable": false
                },
                "text": portalList[i].name.toUpperCase(),
                "lineHeight": 0.17000000178813934,
                "backgroundAlpha": 0.7,
                "topMargin": 0.05999999865889549,
                "unlit": true,
                "textEffectThickness": 0.23999999463558197,
                "alignment": "center"
                },"domain");  

                //Description text
                var descriptionText = portalList[i].description;

                //By: author name would be added here
                
                descriptionText = descriptionText + "\n\nUsers: " + portalList[i].current_attendance;
                if (portalList[i].current_attendance >= portalList[i].capacity) {
                    descriptionText = descriptionText + " (FULL)";
                }
                
                //Capacity: portalList[i].capacity would be here.
                
                descriptionText = descriptionText + "\n\nMaturity: " + portalList[i].maturity.toUpperCase();
                
                if ( portalList[i].category === "RUBY" ) {
                    descriptionText = "*** FEATURED ***\n\n" + descriptionText;    
                }
                
                if ( portalList[i].category === "BLUESTEAL" ) {
                    descriptionText = "* FREQUENTLY VISITED *\n\n" + descriptionText;                     
                }
                
                var textNamePortalId = Entities.addEntity({
                    "type": "Text",
                    "parentID": portalId,
                    "locked": true,
                    "name": "PORTAL_DESC_TEXT - " + portalList[i].name,
                    "dimensions": {
                        "x": 0.9366,
                        "y": 1.8317,
                        "z": 0.01
                    },
                    "localRotation": {
                        "x": 0,
                        "y": 0.7071067690849304,
                        "z": 0,
                        "w": 0.7071067690849304
                    },
                    "localPosition": {
                        "x": 1.26,
                        "y": 1.8763,
                        "z": -0.7431
                    },
                    "grab": {
                        "grabbable": false
                    },
                    "text": descriptionText,
                    "lineHeight": 0.08,
                    "backgroundAlpha": 0.7,
                    "topMargin": 0.02,
                    "rightMargin": 0.02,
                    "leftMargin": 0.02,
                    "bottomMargin": 0.02,
                    "unlit": true,
                    "textEffectThickness": 0.25,
                    "alignment": "left"
                    },"domain");

                //TP
                var tpData = {
                    "placeID": portalList[i].id,
                    "address": portalList[i].address
                };
                
                var tpPortalId = Entities.addEntity({                
                    "type": "Box",
                    "parentID": portalId,
                    "locked": true,
                    "visible": false,
                    "name": "PORTAL_TPBOX - " + portalList[i].name,
                    "dimensions": {
                        "x": 3,
                        "y": 4,
                        "z": 2
                    },
                    "localRotation": {
                        "x": 0,
                        "y": 0.7071067690849304,
                        "z": 0,
                        "w": 0.7071067690849304
                    },
                    "localPosition": {
                        "x": 0.0,
                        "y": 2.0,
                        "z": 0.0
                    },                    
                    "grab": {
                        "grabbable": false
                    },
                    "script": tpScriptUrl,
                    "userData": JSON.stringify(tpData),
                    "shape": "Cube",
                    "collisionless": true,
                    "ignoreForCollisions": true
                    },"domain");
                
                if (i === (portalList.length - 1)) {
                    var deadEndId = Entities.addEntity({
                        "type": "Model",
                        "name": "DEADEND",
                        "position": Vec3.sum(positionZero, relativePosition),
                        "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": -angleRad + Math.PI, "z": 0.0} ),
                        "locked": true,
                        "dimensions": {
                            "x": 2.9488,
                            "y": 1.2709,
                            "z": 0.1825
                        },
                        "grab": {
                            "grabbable": false
                        },
                        "shapeType": "static-mesh",
                        "modelURL": hecateDeadEndModelUrl,
                        "useOriginalPivot": true                
                        }, "domain");    
                }

                    
        } 
         
        var d = new Date();
        var n = d.getTime();
        
        var sunOrientation = (n % 68400000) * 2 * Math.PI;
        
        var skyZoneId = Entities.addEntity({
            "type": "Zone",
            "name": "SKY",
            "dimensions": {
                "x": 10000,
                "y": 2000,
                "z": 10000
            },
            "grab": {
                "grabbable": false
            },
            "shapeType": "box",
            "keyLight": {
                "color": {
                    "red": 255,
                    "green": 244,
                    "blue": 199
                },
                "intensity": 3,
                "direction": {
                    "x": 0.0013233129866421223,
                    "y": -0.5563610196113586,
                    "z": -0.8309397101402283
                },
                "castShadows": true,
                "shadowBias": 0.02,
                "shadowMaxDistance": 60
            },
            "ambientLight": {
                "ambientIntensity": 0.6,
                "ambientURL": hecateSkyUrl
            },
            "skybox": {
                "color": {
                    "red": 255,
                    "green": 255,
                    "blue": 255
                },
                "url": hecateSkyUrl
            },
            "haze": {
                "hazeRange": 1000,
                "hazeColor": {
                    "red": 227,
                    "green": 187,
                    "blue": 138
                },
                "hazeGlareColor": {
                    "red": 255,
                    "green": 202,
                    "blue": 87
                },
                "hazeEnableGlare": true,
                "hazeGlareAngle": 30,
                "hazeAltitudeEffect": true,
                "hazeCeiling": -30,
                "hazeBaseRef": -250
            },
            "bloom": {
                "bloomIntensity": 0.5
            },
            "keyLightMode": "enabled",
            "ambientLightMode": "enabled",
            "skyboxMode": "enabled",
            "hazeMode": "enabled",
            "bloomMode": "enabled",
            "position": positionZero,
            "rotation": Quat.fromVec3Radians( {"x": 0.0, "y": sunOrientation, "z": 0.0} )
        }, "domain");
        
        //Buildings
        var nbrBuidling = Math.floor(Math.random() * 17) + 3;
        for (i=0; i < nbrBuidling; i++) {
            
            var buildingRotation = Quat.fromVec3Radians( {"x": 0.0, "y": (Math.random() * 2 * Math.PI), "z": 0.0} );
            
            var distance = Math.floor(Math.random() * 8000) + 600;
            var directionRad = Math.random() * 2 * Math.PI;
            var relativeBuidlingPosition = {"x": distance * Math.cos(directionRad), "y": (Math.floor(Math.random() * 600) - 350), "z": distance * Math.sin(directionRad)};
            var buildingPosition = Vec3.sum(positionZero, relativeBuidlingPosition);
            
            var buildingId = Entities.addEntity({
                    "type": "Model",
                    "name": "BUIDING-" + i,
                    "dimensions": {
                        "x": 328.3628845214844,
                        "y": 1978.876220703125,
                        "z": 313.246826171875
                    },
                    "grab": {
                        "grabbable": false
                    },
                    "shapeType": "static-mesh",
                    "modelURL": hecateBuildingdModelUrl,
                    "position": buildingPosition,
                    "rotation": buildingRotation,
                    "useOriginalPivot": true
                }, "domain");
            
            
        }
        
    }
    

    function getFrequentPlaces(list) {
        var count = {};
        list.forEach(function(list) {
            count[list] = (count[list] || 0) + 1;
        });
        return count;
    }

    this.unload = function(entityID) {
        if (airSoundInjector !== Uuid.NULL) {
            airSoundInjector.stop();
        }
    };  

})
