"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CarwingsAccessory = /** @class */ (function () {
    function CarwingsAccessory(name, uuid, log) {
        this.log = log;
        this.name = name;
        this.UUID = uuid;
    }
    CarwingsAccessory.prototype.getServices = function () {
        return [];
    };
    ;
    return CarwingsAccessory;
}());
exports.CarwingsAccessory = CarwingsAccessory;
