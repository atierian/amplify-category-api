export type DefinitionsDeployment = {
    [k: string]: any;
} | null;
export type ListOrDict = {
    [k: string]: string | number | null;
} | string[];
export type ListOfStrings = string[];
export type StringOrList = string | ListOfStrings;
export type Labels = {
    [k: string]: string;
} | string[];
export type DefinitionsNetwork = {
    [k: string]: any;
} | null;
export type DefinitionsVolume = {
    [k: string]: any;
} | null;
export interface ConfigSchemaV30Json {
    version: string;
    services?: PropertiesServices;
    networks?: PropertiesNetworks;
    volumes?: PropertiesVolumes;
}
export interface PropertiesServices {
    [k: string]: DefinitionsService;
}
export interface DefinitionsService {
    deploy?: DefinitionsDeployment;
    build?: string | {
        context?: string;
        dockerfile?: string;
        args?: ListOrDict;
    };
    cap_add?: string[];
    cap_drop?: string[];
    cgroup_parent?: string;
    command?: string | string[];
    container_name?: string;
    depends_on?: ListOfStrings;
    devices?: string[];
    dns?: StringOrList;
    dns_search?: StringOrList;
    domainname?: string;
    entrypoint?: string | string[];
    env_file?: StringOrList;
    environment?: ListOrDict;
    expose?: (string | number)[];
    external_links?: string[];
    extra_hosts?: ListOrDict;
    healthcheck?: DefinitionsHealthcheck;
    hostname?: string;
    image?: string;
    ipc?: string;
    labels?: Labels;
    links?: string[];
    logging?: {
        driver?: string;
        options?: {
            [k: string]: string | number | null;
        };
    };
    mac_address?: string;
    network_mode?: string;
    networks?: ListOfStrings | {
        [k: string]: {
            aliases?: ListOfStrings;
            ipv4_address?: string;
            ipv6_address?: string;
        } | null;
    };
    pid?: string | null;
    ports?: (string | number)[];
    privileged?: boolean;
    read_only?: boolean;
    restart?: string;
    security_opt?: string[];
    shm_size?: number | string;
    sysctls?: ListOrDict;
    stdin_open?: boolean;
    stop_grace_period?: string;
    stop_signal?: string;
    tmpfs?: StringOrList;
    tty?: boolean;
    ulimits?: {
        [k: string]: number | {
            hard: number;
            soft: number;
        };
    };
    user?: string;
    userns_mode?: string;
    volumes?: string[];
    working_dir?: string;
}
export interface DefinitionsHealthcheck {
    disable?: boolean;
    interval?: string;
    retries?: number;
    test?: string | string[];
    timeout?: string;
}
export interface PropertiesNetworks {
    [k: string]: DefinitionsNetwork;
}
export interface PropertiesVolumes {
    [k: string]: DefinitionsVolume;
}
//# sourceMappingURL=v3.d.ts.map