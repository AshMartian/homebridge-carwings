

export interface ICarwingsConfig {
    username:string;
    password: string;
    region:string;
    name: string;
}

export interface ICarwingsAccessory extends Partial<HAPNodeJS.Accessory> {
    
    log;
    name: string;
    UUID: string;
    informationService;

    getServices();
}

export abstract class CarwingsAccessory implements ICarwingsAccessory{
    
    log;
    name: string;
    UUID: string;
    informationService;

    constructor(name: string, uuid:string, log) {
        this.log = log;
        this.name = name;
        this.UUID = uuid;
    }

    getServices() {
        return [];
    };

}