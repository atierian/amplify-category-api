export type ListOrDict = {
    [k: string]: string | number | null;
} | string[];
export type Labels = {
    [k: string]: string;
} | string[];
export type ListOfStrings = string[];
export type StringOrList = string | ListOfStrings;
export type DefinitionsVolume = {
    [k: string]: any;
} | null;
export interface ConfigSchemaV24Json {
    version?: string;
    services?: PropertiesServices;
    networks?: PropertiesNetworks;
    volumes?: PropertiesVolumes;
    [k: string]: any;
}
export interface PropertiesServices {
    [k: string]: DefinitionsService;
}
export interface DefinitionsService {
    blkio_config?: {
        device_read_bps?: BlkioLimit[];
        device_read_iops?: BlkioLimit[];
        device_write_bps?: BlkioLimit[];
        device_write_iops?: BlkioLimit[];
        weight?: number;
        weight_device?: BlkioWeight[];
    };
    build?: string | {
        context?: string;
        dockerfile?: string;
        args?: ListOrDict;
        labels?: Labels;
        cache_from?: ListOfStrings;
        network?: string;
        target?: string;
        shm_size?: number | string;
        extra_hosts?: ListOrDict;
        isolation?: string;
    };
    cap_add?: ListOfStrings;
    cap_drop?: ListOfStrings;
    cgroup_parent?: string;
    command?: string | string[];
    container_name?: string;
    cpu_count?: number;
    cpu_percent?: number;
    cpu_shares?: number | string;
    cpu_quota?: number | string;
    cpu_period?: number | string;
    cpu_rt_period?: number | string;
    cpu_rt_runtime?: number | string;
    cpus?: number;
    cpuset?: string;
    depends_on?: ListOfStrings | {
        [k: string]: {
            condition: 'service_started' | 'service_healthy';
        };
    };
    device_cgroup_rules?: ListOfStrings;
    devices?: ListOfStrings;
    dns_opt?: string[];
    dns?: StringOrList;
    dns_search?: StringOrList;
    domainname?: string;
    entrypoint?: string | string[];
    env_file?: StringOrList;
    environment?: ListOrDict;
    expose?: (string | number)[];
    extends?: string | {
        service: string;
        file?: string;
    };
    external_links?: ListOfStrings;
    extra_hosts?: ListOrDict;
    group_add?: (string | number)[];
    healthcheck?: DefinitionsHealthcheck;
    hostname?: string;
    image?: string;
    init?: boolean | string;
    ipc?: string;
    isolation?: string;
    labels?: Labels;
    links?: ListOfStrings;
    logging?: {
        driver?: string;
        options?: {
            [k: string]: any;
        };
    };
    mac_address?: string;
    mem_limit?: number | string;
    mem_reservation?: string | number;
    mem_swappiness?: number;
    memswap_limit?: number | string;
    network_mode?: string;
    networks?: ListOfStrings | {
        [k: string]: {
            aliases?: ListOfStrings;
            ipv4_address?: string;
            ipv6_address?: string;
            link_local_ips?: ListOfStrings;
            priority?: number;
        } | null;
    };
    oom_kill_disable?: boolean;
    oom_score_adj?: number;
    pid?: string | null;
    platform?: string;
    ports?: (string | number)[];
    privileged?: boolean;
    read_only?: boolean;
    restart?: string;
    runtime?: string;
    scale?: number;
    security_opt?: ListOfStrings;
    shm_size?: number | string;
    sysctls?: ListOrDict;
    pids_limit?: number | string;
    stdin_open?: boolean;
    stop_grace_period?: string;
    stop_signal?: string;
    storage_opt?: {
        [k: string]: any;
    };
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
    volumes?: (string | {
        type: string;
        source?: string;
        target?: string;
        read_only?: boolean;
        consistency?: string;
        bind?: {
            propagation?: string;
            [k: string]: any;
        };
        volume?: {
            nocopy?: boolean;
            [k: string]: any;
        };
        tmpfs?: {
            size?: number | string;
            [k: string]: any;
        };
    })[];
    volume_driver?: string;
    volumes_from?: ListOfStrings;
    working_dir?: string;
    [k: string]: any;
}
export interface BlkioLimit {
    path?: string;
    rate?: number | string;
}
export interface BlkioWeight {
    path?: string;
    weight?: number;
}
export interface DefinitionsHealthcheck {
    disable?: boolean;
    interval?: string;
    retries?: number;
    start_period?: string;
    test?: string | string[];
    timeout?: string;
}
export interface PropertiesNetworks {
    [k: string]: DefinitionsNetwork;
}
export interface DefinitionsNetwork {
    driver?: string;
    driver_opts?: {
        [k: string]: string | number;
    };
    ipam?: {
        driver?: string;
        config?: DefinitionsIpamConfig[];
        options?: {
            [k: string]: string;
        };
    };
    external?: boolean | {
        [k: string]: any;
    };
    internal?: boolean;
    enable_ipv6?: boolean;
    labels?: Labels;
    name?: string;
    [k: string]: any;
}
export interface DefinitionsIpamConfig {
    subnet?: string;
    ip_range?: string;
    gateway?: string;
    aux_addresses?: {
        [k: string]: string;
    };
}
export interface PropertiesVolumes {
    [k: string]: DefinitionsVolume;
}
//# sourceMappingURL=v2.d.ts.map