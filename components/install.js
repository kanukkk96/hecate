"use strict";
//
//  install.js
//
//  Created by Alezia Kurdis, May 9th, 2021.
//  Copyright 2021 Vircadia and contributors.
//
//  Install the 3D Goto application when clicked.
//
//  Distributed under the Apache License, Version 2.0.
//  See the accompanying file LICENSE or http://www.apache.org/licenses/LICENSE-2.0.html
//
(function() {

    var MAX_CLICKABLE_DISTANCE_M = 10;

    // Constructor
    var _this = null;

    function clickableUI() {
        _this = this;
        this.entityID = null;
    }


    // Entity methods
    clickableUI.prototype = {
        preload: function (id) {
            _this.entityID = id;
            HMD.displayModeChanged.connect(this.displayModeChangedCallback);
        },

        displayModeChangedCallback: function() {
            if (_this && _this.entityID) {
                //Nothing
            }
        },

        mousePressOnEntity: function (entityID, event) {
            if (event.isPrimaryButton && 
                Vec3.distance(MyAvatar.position, Entities.getEntityProperties(_this.entityID, ["position"]).position) <= MAX_CLICKABLE_DISTANCE_M) {
                print("Clicked");
            }
        },

        unload: function () {
            HMD.displayModeChanged.disconnect(this.displayModeChangedCallback);
        }
    };

    
    return new clickableUI();
});
