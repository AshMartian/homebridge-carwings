'use strict'

import * as carwings from 'carwings-typescript'
import {ICarwingsSession, CarwingsAuthenticator} from 'carwings-typescript'
import {CarwingsAccessory, ICarwingsConfig} from './ICarwings'

var Homebridge;
var Service: HAPNodeJS.Service;
var Characteristic: HAPNodeJS.Characteristic;

var carwingsAuthenticator:CarwingsAuthenticator;
var carwingsSession:ICarwingsSession;

declare let console, setInterval;

class CarwingsPlatform {
    log;
    config: ICarwingsConfig;
    api;
    heater: CarwingsAccessory;
    battery: CarwingsAccessory;

    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.config.updateInterval = this.config.updateInterval || 0;
        this.config.region = this.config.region || 'NNA';
        this.config.lowBattery = this.config.lowBattery ||26;
        this.config.debug = this.config.debug || false;

        let self = this;
        carwingsAuthenticator = new CarwingsAuthenticator(this.config.username, this.config.password, this.config.region);
        carwingsAuthenticator.login().then((loginSession) => {
            self.log.info('Initial login complete')
            carwingsSession = loginSession;
        });
    }

    accessories(callback : (accessories: CarwingsAccessory[]) => void) {

        let acessoryNameHeater = this.config.name +' Heater';
        this.log.info('Adding Carwings accessory ' + acessoryNameHeater);
        let heater = new CarwingsHeater(acessoryNameHeater, Homebridge.hap.uuid.generate(acessoryNameHeater), this.log, this.config);
        let acessoryNameBattery = this.config.name + ' Battery';
        this.log.info('Adding Carwings accessory ' + acessoryNameBattery);
        let battery = new CarwingsBattery(acessoryNameBattery, Homebridge.hap.uuid.generate(acessoryNameBattery), this.log, this.config);

        // Init timers
        battery.initTimers();
        heater.initTimers();

        callback([heater, battery]);

    }

}

class CarwingsHeater extends CarwingsAccessory {

    log;
    name: string;
    informationService: HAPNodeJS.Service;
    hvacService: HAPNodeJS.Service;
    hvacState: number = 0;

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

        let self = this;
        self.log.debug('getHvacState');
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
        try {
            carwings.hvacStatus(carwingsSession).then(function(status){

                if(status.status == 401) {
                    callback("no_response");
                    self.log.debug('getHvacState 401');
                    carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                        carwingsSession = session;
                        return;
                    });
                } else {
                    if(status.RemoteACRecords && status.RemoteACRecords.RemoteACOperation) {
                        self.hvacState = (status.RemoteACRecords.RemoteACOperation !== 'STOP') ? 1 : 0;
                        return callback(null, status.RemoteACRecords.RemoteACOperation !== 'STOP');
                    } else if (status.status == 200) {
                        // Carwings sometims only returns status 200 and not a complete RemoteACRecords when turned off
                        self.hvacState = 0;
                        return callback(null, false);
                    } else {
                        console.error("get hvacStatus unknown response ", status);
                        return callback("no_response");
                    }

                }

            });
        } catch(e) {
            self.log.error('Carwings getHVAC failed to get status\n ' + e.message);
            return callback("no_response");
        }
    }

    setHvacState(value, callback) {
        
        let self = this;
        self.log.debug('setHvacState: ' + value);
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
;
        try {
            if(value === 1) {
                carwings.hvacOn(carwingsSession).then(function(status){

                    if(status.status == 401) {
                        callback("no_response");
                        self.log.debug('setHvacState 401');
                        carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                            carwingsSession = session;
                            return;
                        });
                    } else {
                        self.hvacState = 1;
                        return callback(null, true);
                    }

                });
            } else {
                carwings.hvacOff(carwingsSession).then(function(status){

                    if(status.status == 401) {
                        callback("no_response");
                        self.log.debug('setHvacState 401');
                        carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                            carwingsSession = session;
                            return;
                        });
                    } else {
                        self.hvacState = 1;
                        return callback(null, false);
                    }

                });
            }
        } catch (e) {
            self.log.error('Carwings setHVAC failed to set status ' + value)
            return callback("no_response");
        }
    }

    requestUpdate() {

        let self = this;
        self.log.debug('requestUpdate ' + self.name);
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
        try {
            carwings.hvacStatus(carwingsSession).then(function(status){

                if(status.status == 401) {
                    self.log.debug('requestUpdate 401 ' + self.name);
                    carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                        carwingsSession = session;
                        return;
                    });
                } else {
                    let hvacServiceCharacteristic = self.hvacService.getCharacteristic(Characteristic.Active)
                    if(status.RemoteACRecords && status.RemoteACRecords.RemoteACOperation) {
                        self.hvacState = (status.RemoteACRecords.RemoteACOperation !== 'STOP') ? 1 : 0;
                        hvacServiceCharacteristic.updateValue(self.hvacState);
                    } else if (status.status == 200) {
                        // Carwings sometimes only returns status 200 and not a complete RemoteACRecords when turned off
                        self.hvacState = 0;
                        hvacServiceCharacteristic.updateValue(self.hvacState);
                    } else {
                        self.log.error("requestUpdate unknown response " + self.name, status);
                    }

                }

            });
        } catch(e) {
            self.log.error('Carwings requestUpdate failed to get status\n ' + e.message);
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
            .on('set', this.setChargingState.bind(this));

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
        this.log.debug("returning battery level. 🔋" + this.chargePercent);
        callback(null, this.chargePercent);
    }

    getStatusLowBattery(callback) {
        this.log.debug("returning statusLowBattery level. 🔋" + this.statusLowBattery);
        callback(null, this.statusLowBattery);
    }

    getChargingState(callback) {
        this.log.debug("returning ChargingState level. 🔋" + this.chargingState);
        callback(null, this.chargingState);
    }

    getState(callback) {

        let self = this;
        self.log.debug('getState switch');
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
        try {
            carwings.batteryRecords(carwingsSession).then(status =>  {
                if(status.status == 401) {
                    callback("no_response");
                    self.log.debug('getState switch 401');
                    carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                        carwingsSession = session;
                        return;
                    });
                } else {
                    self.updateServiceCharacteristic(status);
                    callback(null, self.switchState);
                    self.requestUpdate();
                }

            });

        } catch(e) {
            console.error('Carwings getCharging failed to get status \n ' + e.message);
            callback("no_response");
        }


    }

    setChargingState(value, callback) {
        let self = this;
        self.log.debug('setChargingState ' +value);
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
        if(self.chargingState === Characteristic.ChargingState.NOT_CHARGEABLE ) {
            self.log.debug('setChargingState not chargeable');
            return callback("no_response");
        }

        try {
            if(value === 1||value == true) {

                carwings.batteryChargingRequest(carwingsSession).then(function(status){

                    self.log.debug('setChargingState request complete');
                    if(status.status == 401) {
                        callback("no_response");
                        self.log.debug('setChargingState 401');
                        carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                            carwingsSession = session;
                            return;
                        });
                    } else {
                        self.chargingState = Characteristic.ChargingState.CHARGING;
                        callback(null, true);
                    }
                    self.requestUpdate();
                });
            } else {
                // There is no turn off, so always return true if already charging.
                if(self.chargingState === Characteristic.ChargingState.CHARGING ) {
                    self.log.debug('setChargingState already charging ignore');
                    callback("no_response");
                    self.requestUpdate();
                    return;
                }
            }

            return;
        } catch (e) {
            self.log.error('Carwings setChargingState failed to set status ' + value)
            return callback("no_response");
        }
    }

    // Load update in background
    requestUpdate(): void  {
        let self = this;
        carwingsAuthenticator.validateSession(carwingsSession).then((session) =>{
            carwingsSession = session;
        });
        try {
            carwings.batteryStatusCheckRequest(carwingsSession);
            
            let self = this;
            let getUpdatedValues :  () => any = function(): void {
                self.log.debug('requestUpdate ---- '+ self.name);
                carwings.batteryRecords(carwingsSession).then(status =>  {
                    if(status.status == 401) {
                        self.log.debug('requestUpdate 401 ' + self.name);
                        carwingsAuthenticator.validateSession(carwingsSession, false).then((session) =>{
                            carwingsSession = session;
                            return;
                        });
                    } else if(status.status == 200) {
                        self.log.debug('requestUpdate 200 ' + self.name);
                        self.updateServiceCharacteristic(status);
                    }
                });
            };

            setTimeout(getUpdatedValues, 7000);
            setTimeout(getUpdatedValues, 15000);
            
        } catch (e) {

        }

        return;
    }

    updateServiceCharacteristic(status) {
        let batteryChargingStatus:number = Characteristic.ChargingState.CHARGING;

        if(status.BatteryStatusRecords.PluginState === 'CONNECTED') {
            if(status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus === 'NOT_CHARGING') {
                batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGING;
            }
        } else {
            batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGEABLE;
        }
        if(this.chargingState !== batteryChargingStatus) {
            this.chargingState = batteryChargingStatus;
            this.batteryService.getCharacteristic(Characteristic.ChargingState).updateValue(this.chargingState);
        }


        let currentCharge: number = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount);
        let chargePercent: number = Math.floor( currentCharge / 12 * 100);
        if(chargePercent > 100) chargePercent = 100;

        if(this.chargePercent !== chargePercent) {
            this.chargePercent = chargePercent;
            this.batteryService.getCharacteristic(Characteristic.BatteryLevel).updateValue(this.chargePercent);
        }


        let lowBatteryStatus = (chargePercent < this.config.lowBattery) ? 1 : 0;
        if(this.statusLowBattery !== lowBatteryStatus) {
            this.statusLowBattery = lowBatteryStatus;
            this.batteryService.getCharacteristic(Characteristic.StatusLowBattery).updateValue(this.statusLowBattery);
        }

        this.switchState = (batteryChargingStatus === Characteristic.ChargingState.CHARGING ? 1: 0);

        this.log.debug('updateServiceCharacteristic', status);
        this.log.debug('chargingState', this.chargingState);
        this.log.debug('chargePercent', this.chargePercent);
        this.log.debug('statusLowBattery', this.statusLowBattery);
        this.log.debug('switchState', this.switchState);

    }
}

export = function(homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    //Accessory = homebridge.platformAccessory;
    homebridge.registerPlatform("homebridge-carwings-platform", "Carwings Platform", CarwingsPlatform, false);
};