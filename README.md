# Homebridge Carwings Platform Plugin (Typescript)

Note: This requires the latest version of hap-nodejs in order to import the typescript type definition files. 

This is an accessory plugin for [Homebridge](https://github.com/nfarina/homebridge) allowing to manage and control the Nissan Leaf. This gives Siri/homeKit the ability to get the HVAC status, battery level, and charge status.

## What does this plugin do?

This plugin connects to the carwings API using provided credentials, then adds an accessory with multiple services for Battery/Fan.

## Install

**Important: This plugin is using ES6. Please use an appropriate environment like NodeJS v7 or higher.**

If you have already installed homebridge globally, just install

```
npm install -g bhagyas/carwings-typescript
npm install -g bhagyas/homebridge-carwings-platform
# You may have to use --unsafe-perms
```

### Debug
Run homebridge with -D parameter to turn on debug.

## Configuration

The plugin registers itself as `Carwings`. You have the following options:

| Option   | Default   | Comment  |
| -------- | --------- | --------- |
| name     | empty | |
| username     | empty | |
| password     | empty      | |
| updateInterval   | 60      | Time in minutes (number). Must be 10 or greater, lower values turns automatic updates off.|
| region  | NNA | Region options: NNA = USA, NE = Europe, NCI = Canada, NMA = Australia, NML = Japan. ([source](https://github.com/jdhorne/pycarwings2/blob/master/pycarwings2/pycarwings2.py#L19-L23))|
|lowBattery|26| Battery level in percent when low battery warning is shown. Note that percent is always in increments of 1/12|

Name is the initial name display in Homekit, this you can change in the Home app later.
Username is the email or a username (older carwings account) associated with your Nissan Carwings account.
Password must be base64 string of your password. On linux you can do ```echo -n "mypassword"|base64```

**NOTE: Put your configuration under platforms as shown below**
Previous versions that this project forked from added carwings as an accessory.

### Example config.json

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "AA:BB:CC:DD:EE:FF",
    "port": 51826,
    "pin": "031-45-154"
  },
  "description": "This is an example configuration file with carwings plugin.",
  "accessories": [
  ],
  "platforms": [
      {
        "platform": "Carwings Platform",
        "name": "Leaf",
        "email": "example@youremail.com",
        "password": "TmljZVRyeSE=",
        "region": "NE",
        "updateInterval": 0
        "lowBattery": 26
      }
  ]
}
```

## Login sessions and other Carwings apps.
Since you will be using the same login credentials you use in other Apps, the logged in session in homebridge-carwings-platform will be invalidated.
The result will initially be "No Response" in HomeKit, but the invalidated session will be detected and homebridge-carwings-platform creates an new loggged in session.

## Screenshots

<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3822.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3823.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3819.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3820.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3824.PNG?raw=true" width="350px" />

## License
MIT
