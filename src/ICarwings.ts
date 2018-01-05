import {ICarwingsSession, CarwingsAuthenticator} from 'carwings-typescript'

export interface ICarwingsConfig {
    username:string;
    password: string;
    region:string;
    name: string;
    updateInterval: number;
    lowBattery: number;
    debug: boolean;
}

export interface ICarwingsAccessory {
    
    log;
    config;
    name: string;
    displayName: string;
    UUID: string;
    informationService;
    intervalUpdate;

    getServices();
    //checkIfAuthenticated(status:any, session:ICarwingsSession): boolean;
    requestUpdate(): void;

}

export abstract class CarwingsAccessory implements ICarwingsAccessory{
    
    log;
    config;
    name: string;
    displayName: string;
    UUID: string;
    informationService;
    intervalUpdate;

    constructor(name: string, uuid:string, log, config:ICarwingsConfig) {
        this.log = log;
        this.name = name;
        this.UUID = uuid;
        this.config = config;
        this.displayName = name;
        this.intervalUpdate;

        this.log.setDebugEnabled = this.config.debug;

    }

    initTimers(): void {

        // Delay first update so that login is completed;
        let self = this;
        self.log.debug('Init timers ' + this.name);
        setTimeout(self.requestUpdate.bind(self), 15000);

        if(this.config.updateInterval >= 10) {
            self.log.debug('Init timers interval ' + this.config.updateInterval + ' ' + this.name);
            let interval = this.config.updateInterval * 60 * 1000;
            this.intervalUpdate = setInterval(self.requestUpdate.bind(self), interval);
        }
    }
    getServices() {
        return [];
    };

    abstract requestUpdate(): void;
}