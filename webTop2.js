(function () {
    "use strict";
    this.entityID = null;
    var _this = this;

    var overlayWebWindow;

    // User Data Functionality

    var defaultUserData = {
        "useConfirmDialog": true,
        "confirmDialogMessage": "Are you sure you want to open this link?",
        "url": "https://www.naver.com/",
        // options are "interface" and "browser"
        // "interface" opens an overlay, "browser" opens the OS' browser.
        "openIn": "interface",
        "dimensions": {
            "width": 800,
            "height": 600
        }
    }

    function getEntityUserData() {
        return Entities.getEntityProperties(_this.entityID, ["userData"]).userData;
    }

    function setDefaultUserData() {
        Entities.editEntity(_this.entityID, {
            userData: JSON.stringify(defaultUserData)
        });
    }

    function getAndParseUserData() {
        var userData = getEntityUserData();

        try {
            userData = Object(JSON.parse(userData)); 
        } catch (e) {
            userData = defaultUserData;
            setDefaultUserData();
        }

        return userData;
    }
    
    // Main Script Functionality
    
    function createOverlayWebWindow(url, height, width) {
        overlayWebWindow = new OverlayWebWindow({
            title: "Local Webcam",
            source: url,
            width: width,
            height: height
        });
    }

    function onMousePressOnEntity(pressedEntityID, event) {
        if (_this.entityID === pressedEntityID && event.isPrimaryButton) {
            var userData = getAndParseUserData();

            if (userData.useConfirmDialog === true) {
                if (Window.confirm(userData.confirmDialogMessage)) {
                    if (userData.openIn === "interface") {
                        createOverlayWebWindow(userData.url, userData.dimensions.height, userData.dimensions.width);
                    } else {
                        Window.openUrl(userData.url);
                    }
                }
            } else {
                if (userData.openIn === "interface") {
                    createOverlayWebWindow(userData.url, userData.dimensions.height, userData.dimensions.width);
                } else {
                    Window.openUrl(userData.url);
                }
            }
        }
    }


    // Standard preload and unload, initialize the entity script here.

    this.preload = function (ourID) {
        this.entityID = ourID;
        getAndParseUserData();
        
        Entities.mousePressOnEntity.connect(onMousePressOnEntity);
    };

    this.unload = function (entityID) {
        Entities.mousePressOnEntity.disconnect(onMousePressOnEntity);
    };

});