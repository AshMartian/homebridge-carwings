'use strict'

import * as carwings from 'carwings-typescript'
import {ICarwingsSession, CarwingsAuthenticator} from 'carwings-typescript'
import {CarwingsAccessory, ICarwingsConfig} from './ICarwings'

var carwingsSession:ICarwingsSession = null;
var carwingsAuthenticator: CarwingsAuthenticator = null;
var Homebridge;
var Service: HAPNodeJS.Service;
var Characteristic: HAPNodeJS.Characteristic;
var Accessory;

declare let console, setInterval;
declare const Buffer

class CarwingsPlatform {
    log;
    config: ICarwingsConfig;

    constructor(log, config) {
        this.log = log;
        this.config = config;

        carwingsAuthenticator = new CarwingsAuthenticator(this.config.username, this.config.password, this.config.region);
        carwingsAuthenticator.login().then((loginSession) => {
            console.log('LOGGED IN !!!')
            carwingsSession = loginSession;
        });
    }

    accessories(callback : (accessories: CarwingsAccessory[]) => void) {
        let acessoryNameHeater = this.config.name +' Heater';
        let heater = new CarwingsHeater(acessoryNameHeater, Homebridge.hap.uuid.generate(acessoryNameHeater), this.log);
        let acessoryNameBattery = this.config.name + ' Battery';
        let battery = new CarwingsBattery(acessoryNameBattery, Homebridge.hap.uuid.generate(acessoryNameBattery), this.log);
        callback([heater, battery]);

    }

}

class CarwingsHeater extends CarwingsAccessory {

    log;
    name: string;
    informationService: HAPNodeJS.Service;
    hvacService: HAPNodeJS.Service;

    getServices() {
        //console.log('getServices Heater');
        var uuid = Homebridge.hap.uuid.generate(this.name);

        this.hvacService = new Service.Fanv2(this.name);
        this.hvacService.getCharacteristic(Characteristic.Active)
            .on('get', this.getHvacState.bind(this))
            .on('set', this.setHvacState.bind(this));

        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Loftux Carwings')
            .setCharacteristic(Characteristic.Model, 'Heater-Cooler')

        return [this.hvacService, this.informationService];
    }

    getHvacState(callback) {
        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((loginSession => {
                carwingsSession = loginSession
            }));
            return callback("no_response");
        }
        try {
            carwings.hvacStatus(carwingsSession).then(function(status){

                if(status.status == 401) {
                    carwingsAuthenticator.login().then((loginSession => {
                        carwingsSession = loginSession
                    }));
                    return callback("no_response");
                } else {
                    if(status.RemoteACRecords && status.RemoteACRecords.RemoteACOperation) {
                        return callback(null, status.RemoteACRecords.RemoteACOperation !== 'STOP');
                    } else if (status.status == 200) {
                        // Carwings sometims only returns status 200 and not a complete RemoteACRecords when turned off
                        return callback(null, false);
                    } else {
                        console.error("get hvacStatus unknown response ", status);
                        return callback("no_response");
                    }

                }

            });
        } catch(e) {
            console.error('Carwings getHVAC failed to get status\n ' + e.message);
            return callback("no_response");
        }
    }

    setHvacState(value, callback) {
        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((loginSession => {
                carwingsSession = loginSession
            }));
            return callback("no_response");
        }
;
        try {
            if(value === 1) {
                carwings.hvacOn(carwingsSession).then(function(status){
                    //console.log(status);
                    if(status.status == 401) {
                        carwingsAuthenticator.login().then((loginSession => {
                            carwingsSession = loginSession
                        }));
                        return callback("no_response");
                    } else {
                        return callback(null, true);
                    }

                });
            } else {
                carwings.hvacOff(carwingsSession).then(function(status){
                    //console.log(status);
                    if(status.status == 401) {
                        carwingsAuthenticator.login().then((loginSession => {
                            carwingsSession = loginSession
                        }));
                        return callback("no_response");
                    } else {
                        return callback(null, false);
                    }

                });
            }
        } catch (e) {
            console.error('Carwings setHVAC failed to set status ' + value)
            return callback("no_response");
        }
    }
}

class CarwingsBattery extends CarwingsAccessory {
    switchService: HAPNodeJS.Service;

    log;
    name: string;
    informationService: HAPNodeJS.Service;
    batteryService: HAPNodeJS.Service;
    chargePercent: number = 0;
    statusLowBattery: number = 0;
    chargingState: number = 0;
    switchState: number = 0;

    getServices() {
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
    }

    getBatteryLevel(callback) {
        //console.info("returning battery level. 🔋" + this.chargePercent);
        callback(null, this.chargePercent);
    }

    getStatusLowBattery(callback) {
        //console.info("returning statusLowBattery level. 🔋" + this.statusLowBattery);
        callback(null, this.statusLowBattery);
    }

    getChargingState(callback) {
        //console.info("returning ChargingState level. 🔋" + this.chargingState);
        callback(null, this.chargingState);
    }

    getState(callback) {
        //console.info("returning Switch state. 🔋");

        if (typeof carwingsSession !== "function") {
            carwingsAuthenticator.login().then((loginSession => {
                carwingsSession = loginSession
            }));
            return callback("no_response");
        }
        try {
            var self = this;
            carwings.batteryRecords(carwingsSession).then(status =>  {
                if(status.status == 401) {
                    carwingsAuthenticator.login().then((loginSession => {
                        carwingsSession = loginSession
                    }));
                    return callback("no_response");
                } else {
                    self.updateBatteryProperties(status);
                    callback(null, this.switchState);
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
            } catch (err) {
                console.log(' ERROR LONG POLL ' + err.message);
            }


        } catch(e) {
            console.error('Carwings getCharging failed to get status \n ' + e.message);
            callback("no_response");
        }


    }

    setState(value, callback) {
        return callback();
    }

    updateBatteryProperties(status) {
        let batteryChargingStatus:number = Characteristic.ChargingState.CHARGING;

        if(status.BatteryStatusRecords.PluginState === 'CONNECTED') {
            if(status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus === 'NOT_CHARGING') {
                batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGING;
            }
        } else {
            batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGEABLE;
        }
        this.chargingState = batteryChargingStatus;

        let currentCharge: number = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount);
        let chargePercent: number = Math.floor( currentCharge / 12 * 100);
        if(chargePercent > 100) chargePercent = 100;
        this.chargePercent = chargePercent;

        this.statusLowBattery = (chargePercent < 20 ? 1 : 0);

        this.switchState = (batteryChargingStatus === Characteristic.ChargingState.CHARGING ? 1: 0);

        this.batteryService.setCharacteristic(Characteristic.BatteryLevel, this.chargePercent);
        this.batteryService.setCharacteristic(Characteristic.ChargingState, this.chargingState);
        this.batteryService.setCharacteristic(Characteristic.StatusLowBattery, this.statusLowBattery);
        this.switchService.setCharacteristic(Characteristic.On, this.switchState);
        //self.batteryService.setCharacteristic(Characteristic.StatusLowBattery, (chargePercent < 20 ? 1 : 0));
    }
}

export = function(homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    //Accessory = homebridge.platformAccessory;
    homebridge.registerPlatform("homebridge-carwings-platform", "Carwings Platform", CarwingsPlatform, false);
};