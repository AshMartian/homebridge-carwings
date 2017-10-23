'use strict'
import * as carwings from 'carwings-typescript'
import {ICarwingsSession, ICarwingsCheckStatus} from 'carwings-typescript'
import * as HAPNodeJS from 'hap-nodejs'
import Service = HAPNodeJS.Service;
var carwingsSession:ICarwingsSession = null;

declare let console, setInterval;
declare const Buffer;

let  Service: HAPNodeJS.Service,
    Characteristic: HAPNodeJS.Characteristic;

export = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-carwings", "Carwings", CarwingsAccessory);
}

var base64regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

var email, password, region;
function loginCarwings() {
  carwings.loginSession(email, password, region).then(function(session){
    carwingsSession = session;
    if (typeof carwingsSession === "function") {
      carwings.batteryStatusCheckRequest(carwingsSession);
    }    
  });
}

interface CarwingsConfig {
    name:string;
    password: string;
    region:string;
}

// class CarwingsAccessoryT extends HAPNodeJS.Accessory {
//     battery: HAPNodeJS.Service;
//     config: CarwingsConfig;
//     log: any;
//
//     constructor(log, config: CarwingsConfig){
//         super(config.name);
//         this.log = log;
//         this.displayName = config["name"];
//         this.config = config;
//         email = config["email"];
//         password = config["password"];
//         region = config["region"];
//         if(base64regex.test(password)){
//             password = Buffer.from(password, 'base64');
//         }
//
//         loginCarwings();
//
//         this.battery = new Service.BatteryService(this.name);
//         this.battery
//             .getCharacteristic(Characteristic.BatteryLevel)
//             .on('get', this.getLevel.bind(this));
//
//         this.battery
//             .getCharacteristic(Characteristic.ChargingState)
//             .on('get', this.getCharging.bind(this));
//
//
//         var updateInterval = config["updateInterval"] ? config["updateInterval"] : 600000;
//
//         if(updateInterval != "never") {
//             setInterval(function(){
//                 carwings.batteryStatusCheckRequest(carwingsSession).then(function(checkStatus){
//                     console.log("Got LEAF request on interval", checkStatus);
//                     if(checkStatus.status == 401) {
//                         loginCarwings();
//                     }
//                 });
//             }, 600000);
//         }
//     }
//
//     getLevel(callback){
//         console.log('GET LEVEL');
//         if (typeof carwingsSession !== "function") {
//             loginCarwings();
//             callback("no_response");
//             return;
//         }
//         try {
//             //console.log(this.battery.getCharacteristic(Characteristic.BatteryLevel));
//             carwings.batteryRecords(carwingsSession).then(function(status){
//                 console.log(status);
//                 if(status.status == 401) {
//                     loginCarwings();
//                     callback("no_response");
//                 } else {
//                     carwings.batteryStatusCheckRequest(carwingsSession);
//                     /*_this.battery.getCharacteristic(Characteristic.BatteryLevel).setProp({
//                       maxValue: status.BatteryStatusRecords.BatteryStatus.BatteryCapacity
//                     });*/
//                     //_this.battery.getCharacteristic(Characteristic.BatteryLevel).props.maxValue = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryCapacity);
//
//                     let currentCharge: number = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount);
//                     let chargePercent: number = Math.floor( currentCharge / 12 * 100);
//                     if(chargePercent > 100) chargePercent = 100;
//                     console.log("LEAF charge percent = ", chargePercent);
//                     callback(null, chargePercent);
//                 }
//
//             });
//         } catch (e) {
//             console.error('Carwings getLevel failed to get status ')
//             callback("no_response");
//         }
//
//     }
//
//     getCharging(callback: Function) {
//         if (typeof carwingsSession !== "function") {
//             loginCarwings();
//             callback("no_response");
//             return;
//         }
//         try {
//             carwings.batteryRecords(carwingsSession).then(function(status){
//                 //console.log(status);
//                 if(status.status == 401) {
//                     loginCarwings();
//                     callback("no_response");
//                 } else {
//                     let batteryChargingStatus = Characteristic.ChargingState.CHARGING;
//
//                     if(status.BatteryStatusRecords.PluginState === 'CONNECTED') {
//                         if(status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus === 'NOT_CHARGING') {
//                             batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGING
//                         }
//                     } else {
//                         batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGEABLE
//                     }
//                     callback(null, batteryChargingStatus)
//                 }
//                 ;
//             });
//         } catch(e) {
//             console.error('Carwings getCharging failed to get status ')
//             callback("no_response");
//         }
//
//     }
//
// }


function CarwingsAccessory(log, config: CarwingsConfig) {
    this.log = log;
    this.config = config;
    this.name = config["name"];
    email = config["email"];
    password = config["password"];
    region = config["region"];
    if(base64regex.test(password)){
      password = Buffer.from(password, 'base64');
    }

    loginCarwings();

    this.battery = new Service.BatteryService(this.name);

    this.battery
      .getCharacteristic(Characteristic.BatteryLevel)
      .on('get', this.getLevel.bind(this));

    this.battery
      .getCharacteristic(Characteristic.ChargingState)
      .on('get', this.getCharging.bind(this));

    this.hvac = new Service.Fanv2(this.name);

    this.hvac.getCharacteristic(Characteristic.Active)
      .on('get', this.getHVAC.bind(this))
      .on('set', this.setHVAC.bind(this));

    // this.heater = new Service.HeaterCooler(this.name);

    // this.heater.getCharacteristic(Characteristic.Active)
    //   .on('get', this.getHVAC.bind(this))
    //   .on('set', this.setHVAC.bind(this));

    // this.switch = new Service.Switch(this.name);

    // this.switch.getCharacteristic(Characteristic.On)
    //     .on('get', this.getHVAC.bind(this))
    //     .on('set', this.setHVAC.bind(this));

    var updateInterval = config["updateInterval"] ? config["updateInterval"] : 600000;

    if(updateInterval != "never") {
      setInterval(function(){
        carwings.batteryStatusCheckRequest(carwingsSession).then(function(checkStatus: ICarwingsCheckStatus){
          console.log("Got LEAF request on interval", checkStatus);
          if(checkStatus.status == 401) {
            loginCarwings();
          }
        });
      }, 600000);
    }
}

CarwingsAccessory.prototype.getLevel = function(callback: (result:any, chargingPercentage?: number) => {}) {
  console.log('GET LEVEL');
  if (typeof carwingsSession !== "function") {
      loginCarwings();
      callback("no_response");
      return;
  }
  try {
      //console.log(this.battery.getCharacteristic(Characteristic.BatteryLevel));
      var _this = this;
      carwings.batteryRecords(carwingsSession).then(function(status){
          console.log(status);
          if(status.status == 401) {
              loginCarwings();
              callback("no_response");
          } else {
            carwings.batteryStatusCheckRequest(carwingsSession);
            /*_this.battery.getCharacteristic(Characteristic.BatteryLevel).setProp({
              maxValue: status.BatteryStatusRecords.BatteryStatus.BatteryCapacity
            });*/
            //_this.battery.getCharacteristic(Characteristic.BatteryLevel).props.maxValue = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryCapacity);
  
            let currentCharge: number = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount);
            let chargePercent: number = Math.floor( currentCharge / 12 * 100);
            if(chargePercent > 100) chargePercent = 100;
            console.log("LEAF charge percent = ", chargePercent);
            callback(null, chargePercent);
          }

      });
  } catch (e) {
      console.error('Carwings getLevel failed to get status ')
      callback("no_response");
  }

}
CarwingsAccessory.prototype.getCharging = function(callback: (result: any, chargingState?: number) => void) {

  if (typeof carwingsSession !== "function") {
      loginCarwings();
      callback("no_response");
      return;
  }
  try {
      carwings.batteryRecords(carwingsSession).then(function(status){
          //console.log(status);
          if(status.status == 401) {
              loginCarwings();
              callback("no_response");
          } else {
            let batteryChargingStatus:number = Characteristic.ChargingState.CHARGING;
            
            if(status.BatteryStatusRecords.PluginState === 'CONNECTED') {
                if(status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus === 'NOT_CHARGING') {
                    batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGING
                }
            } else {
                batteryChargingStatus = Characteristic.ChargingState.NOT_CHARGEABLE
            }
            callback(null, batteryChargingStatus)
          }
;
      });
  } catch(e) {
      console.error('Carwings getCharging failed to get status ')
      callback("no_response");
  }

}

CarwingsAccessory.prototype.getHVAC = function(callback: (result: any, out?: boolean) => {}) {
  if (typeof carwingsSession !== "function") {
      loginCarwings();
      callback("no_response");
      return;
  }
  //console.log(this);
  try {
      carwings.hvacStatus(carwingsSession).then(function(status){
          //console.log(status);
          if(status.status == 401) {
              loginCarwings();
              callback("no_response");
          } else {
              callback(null, status.RemoteACRecords.RemoteACOperation !== 'STOP');
          }

      });
  } catch(e) {
      console.error('Carwings getHVAC failed to get status ')
      callback("no_response");
  }

};

CarwingsAccessory.prototype.setHVAC = function(on: boolean, callback: (result:any, hvacStatus?: boolean) =>{}) {
  if (typeof carwingsSession !== "function") {
      loginCarwings();
      callback("no_response");
      return;
  }
  try {
      if(on) {
          carwings.hvacOn(carwingsSession).then(function(status){
              //console.log(status);
              if(status.status == 401) {
                  loginCarwings();
                  callback("no_response");
              } else {
                  callback(null, true);
              }

          });
      } else {
          carwings.hvacOff(carwingsSession).then(function(status){
              //console.log(status);
              if(status.status == 401) {
                  loginCarwings();
                  callback("no_response");
              } else {
                  callback(null, false);
              }

          });
      }
  } catch (e) {
      console.error('Carwings setHVAC failed to set status ' + on)
      callback("no_response");
  }

};

CarwingsAccessory.prototype.getServices = function(): Service[] {
  return [
      this.battery,
      //this.heater,
      //this.switch,
      this.hvac
  ];
}

