"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CarwingsAccessory = /** @class */ (function () {
    function CarwingsAccessory(name, uuid, log, config) {
        this.log = log;
        this.name = name;
        this.UUID = uuid;
        this.config = config;
        this.displayName = name;
        this.intervalUpdate;
        this.log.setDebugEnabled = this.config.debug;
    }
    CarwingsAccessory.prototype.initTimers = function () {
        // Delay first update so that login is completed;
        var self = this;
        self.log.debug('Init timers ' + this.name);
        setTimeout(self.requestUpdate.bind(self), 15000);
        if (this.config.updateInterval >= 10) {
            self.log.debug('Init timers interval ' + this.config.updateInterval + ' ' + this.name);
            var interval = this.config.updateInterval * 60 * 1000;
            this.intervalUpdate = setInterval(self.requestUpdate.bind(self), interval);
        }
    };
    CarwingsAccessory.prototype.getServices = function () {
        return [];
    };
    ;
    return CarwingsAccessory;
}());
exports.CarwingsAccessory = CarwingsAccessory;
