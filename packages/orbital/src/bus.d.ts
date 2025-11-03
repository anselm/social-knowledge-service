type OnEntityFunction = (blob: any, bus: Bus) => Promise<any>;
export interface OnEntityConfig {
    filter?: string;
    resolve?: OnEntityFunction;
    priority?: number;
    (blob: any, bus: any): Promise<any>;
}
export interface Observer {
    meta?: {
        title: string;
    };
    on_entity: OnEntityFunction | OnEntityConfig;
}
export declare class Bus {
    observers: Observer[];
    bus(blob: any): Promise<any>;
}
export {};
//# sourceMappingURL=bus.d.ts.map