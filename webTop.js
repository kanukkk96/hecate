// 아바타 머리 위에 웹 엔티티 띄우기
// 웹 엔티티 -> obs와 ws 소켓 통신 시키기


var attachment = {

    useConfirmDialog: true,
    webURL: "https://docs.vircadia.com/",
    openIn: "interface",
    dimensions: {
        "width": 1600,
        "height": 900
      },
    jointName: "Head",
    translation: {"x": 0, "y": 0.25, "z": 0},
    rotation: {"x": 0, "y": 0, "z": 0, "w": 1},
    scale: 0.01,
    isSoft: false
};

 MyAvatar.attach(attachment.webURL,
                attachment.useConfirmDialog,
                attachment.openIn,
                attachment.dimensions,
                attachment.jointName,
                attachment.translation,
                 attachment.rotation,
                 attachment.scale,
                 attachment.isSoft);