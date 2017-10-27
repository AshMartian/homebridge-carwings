# Homebridge Carwings Platform Plugin (Typescript)

Note: This requires the latest version of hap-nodejs in order to import the typescript type definition files. 

This is an accessory plugin for [Homebridge](https://github.com/nfarina/homebridge) allowing to manage and control the Nissan Leaf. This gives Siri/homeKit the ability to get the HVAC status, battery level, and charge status.

## What does this plugin do?

This plugin connects to the carwings API using provided credentials, then adds an accessory with multiple services for Battery/Fan.

## Install

**Important: This plugin is using ES6. Please use an appropriate environment like NodeJS v7 or higher.**

If you have already installed homebridge globally, just install

```npm install -g homebridge-carwings-platform```

## Configuration

The plugin registers itself as `Carwings`. You have the following options:

| Option   | Default   |
| -------- | --------- |
| name     | empty |
| username     | empty |
| password     | empty      |
| updateInterval   | 600000      |
| region  | null |

Name is the initial name display in Homekit, this you can change in the Home app later.
Username is the email or a username (older carwings account) associated with your Nissan Carwings account.
Password must be base64 string of your password. On linux you can do ```echo -n "mypassword"|base64```

**Warning: Update Interval may spam your phone with charge notifications from the Nissan App.** You may want to turn these notifications off or set updateInterval to "never". This is currently experimental.

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
        "updateInterval": "never"
      }
  ]
}
```
Region options: NNA = USA [default], NE = Europe, NCI = Canada, NMA = Australia, NML = Japan.
([source](https://github.com/jdhorne/pycarwings2/blob/master/pycarwings2/pycarwings2.py#L19-L23))

## Screenshots

<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3822.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3823.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3819.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3820.PNG?raw=true" width="350px" />
<img src="https://github.com/blandman/homebridge-carwings/blob/screenshots/IMG_3824.PNG?raw=true" width="350px" />

## License
MIT
