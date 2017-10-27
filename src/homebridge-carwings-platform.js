'use strict';
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var carwings = require("carwings-typescript");
var carwings_typescript_1 = require("carwings-typescript");
var ICarwings_1 = require("./ICarwings");
var carwingsSession = null;
var carwingsAuthenticator = null;
var Homebridge;
var Service;
var Characteristic;
var Accessory;
var CarwingsPlatform = /** @class */ (function () {
    function CarwingsPlatform(log, config) {
        this.log = log;
        this.config = config;
        carwingsAuthenticator = new carwings_typescript_1.CarwingsAuthenticator(this.config.username, this.config.password, this.config.region);
        carwingsAuthenticator.login().then(function (loginSession) {
            console.log('LOGGED IN !!!');
            carwingsSession = loginSession;
        });
    }
    CarwingsPlatform.prototype.accessories = function (callback) {
        var acessoryNameHeater = this.config.name + ' Heater';
        var heater = new CarwingsHeater(acessoryNameHeater, Homebridge.hap.uuid.generate(acessoryNameHeater), this.log);
        var acessoryNameBattery = this.config.name + ' Battery';
        var battery = new CarwingsBattery(acessoryNameBattery, Homebridge.hap.uuid.generate(acessoryNameBattery), this.log);
        callback([heater, battery]);
    };
    return CarwingsPlatform;
}());
var CarwingsHeater = /** @class */ (function (_super) {
    __extends(CarwingsHeater, _super);
    function CarwingsHeater() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    CarwingsHeater.prototype.getServices = function () {
        //console.log('getServices Heater');
        var uuid = Homebridge.hap.uuid.generate(this.name);
        this.hvacService = new Service.Fanv2(this.name);
        this.hvacService.getCharacteristic(Characteristic.Active)
            .on('get', this.getHvacState.bind(this))
            .on('set', this.setHvacState.bind(this));
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Loftux Carwings')
            .setCharacteristic(Characteristic.Model, 'Heater-Cooler');
        return [this.hvacService, this.informationService];
    };
    CarwingsHeater.prototype.getHvacState = function (callback) {
        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((function (loginSession) {
                carwingsSession = loginSession;
            }));
            return callback("no_response");
        }
        try {
            carwings.hvacStatus(carwingsSession).then(function (status) {
                if (status.status == 401) {
                    carwingsAuthenticator.login().then((function (loginSession) {
                        carwingsSession = loginSession;
                    }));
                    return callback("no_response");
                }
                else {
                    if (status.RemoteACRecords && status.RemoteACRecords.RemoteACOperation) {
                        return callback(null, status.RemoteACRecords.RemoteACOperation !== 'STOP');
                    }
                    else if (status.status == 200) {
                        // Carwings sometims only returns status 200 and not a complete RemoteACRecords when turned off
                        return callback(null, false);
                    }
                    else {
                        console.error("get hvacStatus unknown response ", status);
                        return callback("no_response");
                    }
                }
            });
        }
        catch (e) {
            console.error('Carwings getHVAC failed to get status\n ' + e.message);
            return callback("no_response");
        }
    };
    CarwingsHeater.prototype.setHvacState = function (value, callback) {
        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((function (loginSession) {
                carwingsSession = loginSession;
            }));
            return callback("no_response");
        }
        ;
        try {
            if (value === 1) {
                carwings.hvacOn(carwingsSession).then(function (status) {
                    //console.log(status);
                    if (status.status == 401) {
                        carwingsAuthenticator.login().then((function (loginSession) {
                            carwingsSession = loginSession;
                        }));
                        return callback("no_response");
                    }
                    else {
                        return callback(null, true);
                    }
                });
            }
            else {
                carwings.hvacOff(carwingsSession).then(function (status) {
                    //console.log(status);
                    if (status.status == 401) {
                        carwingsAuthenticator.login().then((function (loginSession) {
                            carwingsSession = loginSession;
                        }));
                        return callback("no_response");
                    }
                    else {
                        return callback(null, false);
                    }
                });
            }
        }
        catch (e) {
            console.error('Carwings setHVAC failed to set status ' + value);
            return callback("no_response");
        }
    };
    return CarwingsHeater;
}(ICarwings_1.CarwingsAccessory));
var CarwingsBattery = /** @class */ (function (_super) {
    __extends(CarwingsBattery, _super);
    function CarwingsBattery() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.chargePercent = 0;
        _this.statusLowBattery = 0;
        _this.chargingState = 0;
        _this.switchState = 0;
        return _this;
    }
    CarwingsBattery.prototype.getServices = function () {
        var uuid = Homebridge.hap.uuid.generate(this.name);
        this.switchService = new Service.Switch(this.name, uuid, "switch");
        this.switchService.getCharacteristic(Characteristic.On)
            .on('get', this.getState.bind(this))
            .on('set', this.setState.bind(this));
        this.batteryService = new Service.BatteryService(this.name, uuid, "battery");
        this.batteryService.getCharacteristic(Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));
        this.batteryService.getCharacteristic(Characteristic.StatusLowBattery)
            .on('get', this.getStatusLowBattery.bind(this));
        this.batteryService.getCharacteristic(Characteristic.ChargingState)
            .on('get', this.getChargingState.bind(this));
        // Characteristic.BatteryLevel
        // Characteristic.StatusLowBattery
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Loftux Carwings')
            .setCharacteristic(Characteristic.Model, 'Battery');
        return [this.switchService, this.batteryService, this.informationService];
    };
    CarwingsBattery.prototype.getBatteryLevel = function (callback) {
        //console.info("returning battery level. 🔋" + this.chargePercent);
        callback(null, this.chargePercent);
    };
    CarwingsBattery.prototype.getStatusLowBattery = function (callback) {
        //console.info("returning statusLowBattery level. 🔋" + this.statusLowBattery);
        callback(null, this.statusLowBattery);
    };
    CarwingsBattery.prototype.getChargingState = function (callback) {
        //console.info("returning ChargingState level. 🔋" + this.chargingState);
        callback(null, this.chargingState);
    };
    CarwingsBattery.prototype.getState = function (callback) {
        //console.info("returning Switch state. 🔋");
        var _this = this;
        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((function (loginSession) {
                carwingsSession = loginSession;
            }));
            return callback("no_response");
        }
        try {
            var self = this;
            carwings.batteryRecords(carwingsSession).then(function (status) {
                if (status.status == 401) {
                    carwingsAuthenticator.login().then((function (loginSession) {
                        carwingsSession = loginSession;
                    }));
                    return callback("no_response");
                }
                else {
                    self.updateBatteryProperties(status);
                    callback(null, _this.switchState);
                }
            });
            try {
                carwings.batteryStatusCheckRequest(carwingsSession);
                // carwings.batteryStatusCheck(carwingsSession).then(status =>  {
                //     console.log('FIRST STEP LONG POLL');
                //     if(status.status == 401) {
                //         carwingsAuthenticator.login().then((loginSession => {
                //             carwingsSession = loginSession
                //         }));
                //     } else {
                //         carwings.batteryRecords(carwingsSession).then(status =>  {
                //             console.log('SECOND STEP LONG POLL');
                //             if(status.status == 401) {
                //                 carwingsAuthenticator.login().then((loginSession => {
                //                     carwingsSession = loginSession
                //                 }));
                //             } else {
                //                 self.updateBatteryProperties(status);
                //             }
                //
                //         });
                //     }
                //
                // });
            }
            catch (err) {
                console.log(' ERROR LONG POLL ' + err.message);
            }
        }
        catch (e) {
            console.error('Carwings getCharging failed to get status \n ' + e.message);
            callback("no_response");
        }
    };
    CarwingsBattery.prototype.setState = function (value, callback) {
        return callback();
    };
    CarwingsBattery.prototype.updateBatteryProperties = function (status) {
        var batteryChargingStatus = Characteristic.ChargingState.CHARGING;
        if (status.BatteryStatusRecords.PluginState === 'CONNECTED') {
            if (status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus === 'NOT_CHARGING') {
                batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGING;
            }
        }
        else {
            batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGEABLE;
        }
        this.chargingState = batteryChargingStatus;
        var currentCharge = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount);
        var chargePercent = Math.floor(currentCharge / 12 * 100);
        if (chargePercent > 100)
            chargePercent = 100;
        this.chargePercent = chargePercent;
        this.statusLowBattery = (chargePercent < 20 ? 1 : 0);
        this.switchState = (batteryChargingStatus === Characteristic.ChargingState.CHARGING ? 1 : 0);
        this.batteryService.setCharacteristic(Characteristic.BatteryLevel, this.chargePercent);
        this.batteryService.setCharacteristic(Characteristic.ChargingState, this.chargingState);
        this.batteryService.setCharacteristic(Characteristic.StatusLowBattery, this.statusLowBattery);
        this.switchService.setCharacteristic(Characteristic.On, this.switchState);
        //self.batteryService.setCharacteristic(Characteristic.StatusLowBattery, (chargePercent < 20 ? 1 : 0));
    };
    return CarwingsBattery;
}(ICarwings_1.CarwingsAccessory));
module.exports = function (homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    //Accessory = homebridge.platformAccessory;
    homebridge.registerPlatform("homebridge-carwings-platform", "Carwings Platform", CarwingsPlatform, false);
};
