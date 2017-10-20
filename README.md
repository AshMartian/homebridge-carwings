# Homebridge Carwings Plugin (Typescript)

This is an accessory plugin for [Homebridge](https://github.com/nfarina/homebridge) allowing to manage and control the Nissan Leaf. This gives Siri/homeKit the ability to get the HVAC status, battery level, and charge status.

## What does this plugin do?

This plugin connects to the carwings API using provided credentials, then adds an accessory with multiple services for Battery/Fan.

## Install

**Important: This plugin is using ES6. Please use an appropriate environment like NodeJS v7 or higher.**

If you have already installed homebridge globally, just install

```npm install -g homebridge-carwings```

## Configuration

The plugin registers itself as `Carwings`. You have the following options:

| Option   | Default   |
| -------- | --------- |
| email     | empty |
| password     | empty      |
| updateInterval   | 600000      |
| region  | null |

Email is the email associated with your Nissan Carwings account.
Password can be plan text (not recommended), or a base64 string of your password.

**Warning: Update Interval may spam your phone with charge notifications from the Nissan App.** You may want to turn these notifications off or set updateInterval to "never". This is currently experimental.

Additionally you have the Homebridge options `accessory` (for the actual plugin) and `name` (for representation later).

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
    {
      "accessory": "Carwings",
      "name": "Leaf",
      "email": "example@youremail.com",
      "password": "TmljZVRyeSE=",
      "region": "NE",
      "updateInterval": "never"
    }
  ],
  "platforms": [
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
