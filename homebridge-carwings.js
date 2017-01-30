var carwings = require('carwings');

var Service, Characteristic;
var carwingsSession = null;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerAccessory("homebridge-carwings", "Carwings", CarwingsAccessory);
}

var base64regex = /^(?:[A-Z0-9+\/]{4})*(?:[A-Z0-9+\/]{2}==|[A-Z0-9+\/]{3}=|[A-Z0-9+\/]{4})$/i;

function CarwingsAccessory(log, config) {
    this.log = log;
    this.config = config;
    this.name = config["name"];
    this.email = config["email"];
    this.password = config["password"];
    if(base64regex.test(this.password)){
      this.password = Buffer.from(this.password, 'base64');
    }

    carwings.loginSession(this.email, this.password).then(function(session){
      carwingsSession = session;
    });

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

    this.heater = new Service.HeaterCooler(this.name);

    this.heater.getCharacteristic(Characteristic.Active)
      .on('get', this.getHVAC.bind(this))
      .on('set', this.setHVAC.bind(this));

    this.switch = new Service.Switch(this.name);

    this.switch.getCharacteristic(Characteristic.On)
        .on('get', this.getHVAC.bind(this))
        .on('set', this.setHVAC.bind(this));

    var updateInterval = config["updateInterval"] ? config["updateInterval"] : 600000;
    if(updateInterval != "never") {
      setInterval(function(){
        carwings.batteryStatusCheckRequest(carwingsSession).then(function(checkStatus){
          console.log(checkStatus);
        });
      }, 600000);
    }
}

CarwingsAccessory.prototype.getLevel = function(callback) {
  //console.log(this.battery.getCharacteristic(Characteristic.BatteryLevel));
  var _this = this;
  carwings.batteryRecords(carwingsSession).then(function(status){
    console.log(status);
    /*_this.battery.getCharacteristic(Characteristic.BatteryLevel).setProp({
      maxValue: status.BatteryStatusRecords.BatteryStatus.BatteryCapacity
    });*/
    //_this.battery.getCharacteristic(Characteristic.BatteryLevel).props.maxValue = parseInt(status.BatteryStatusRecords.BatteryStatus.BatteryCapacity);
    callback(null, parseInt((status.BatteryStatusRecords.BatteryStatus.BatteryRemainingAmount / status.BatteryStatusRecords.BatteryStatus.BatteryCapacity) * 100));
  });
}

CarwingsAccessory.prototype.getCharging = function(callback) {
  carwings.batteryRecords(carwingsSession).then(function(status){
    console.log(status);
    callback(null, status.BatteryStatusRecords.BatteryStatus.BatteryChargingStatus.indexOf("CHARGING") !== -1);
  });
}

CarwingsAccessory.prototype.getHVAC = function(callback) {
  console.log(this);
  carwings.hvacStatus(carwingsSession).then(function(status){
    console.log(status);
    callback(null, status.RemoteACRecords.RemoteACOperation !== 'STOP');
  });
};

CarwingsAccessory.prototype.setHVAC = function(on, callback) {
  if(on) {
    carwings.hvacOn(carwingsSession).then(function(status){
      console.log(status);
      callback(null, true);
    });
  } else {
    carwings.hvacOff(carwingsSession).then(function(status){
      console.log(status);
      callback(null, false);
    });
  }
};

CarwingsAccessory.prototype.getServices = function() {
    return [this.battery, this.hvac, this.heater, this.switch];
}
