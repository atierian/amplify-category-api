export type DefinitionsDeployment2 = DefinitionsDeployment | DefinitionsDeployment1;
export type ListOrDict = {
    [k: string]: string | number | null;
} | string[];
export type DefinitionsGenericResources = {
    discrete_resource_spec?: {
        kind?: string;
        value?: number;
        [k: string]: unknown;
    };
    [k: string]: unknown;
}[];
export type DefinitionsDeployment1 = null;
export type ListOfStrings = string[];
export type StringOrList = string | ListOfStrings;
export type DefinitionsNetwork2 = DefinitionsNetwork | DefinitionsNetwork1;
export type DefinitionsNetwork1 = null;
export type DefinitionsVolume2 = DefinitionsVolume | DefinitionsVolume1;
export type DefinitionsVolume1 = null;
export interface ComposeSpecification {
    version?: string;
    services?: PropertiesServices;
    networks?: PropertiesNetworks;
    volumes?: PropertiesVolumes;
    secrets?: PropertiesSecrets;
    configs?: PropertiesConfigs;
    [k: string]: unknown;
}
export interface PropertiesServices {
    [k: string]: DefinitionsService;
}
export interface DefinitionsService {
    deploy?: DefinitionsDeployment2;
    build?: string | {
        context?: string;
        dockerfile?: string;
        args?: ListOrDict;
        labels?: ListOrDict;
        cache_from?: ListOfStrings;
        network?: string;
        target?: string;
        shm_size?: number | string;
        extra_hosts?: ListOrDict;
        isolation?: string;
        [k: string]: unknown;
    };
    blkio_config?: {
        device_read_bps?: BlkioLimit[];
        device_read_iops?: BlkioLimit[];
        device_write_bps?: BlkioLimit[];
        device_write_iops?: BlkioLimit[];
        weight?: number;
        weight_device?: BlkioWeight[];
    };
    cap_add?: string[];
    cap_drop?: string[];
    cgroup_parent?: string;
    command?: string | string[];
    configs?: (string | {
        source?: string;
        target?: string;
        uid?: string;
        gid?: string;
        mode?: number;
        [k: string]: unknown;
    })[];
    container_name?: string;
    cpu_count?: number;
    cpu_percent?: number;
    cpu_shares?: number | string;
    cpu_quota?: number | string;
    cpu_period?: number | string;
    cpu_rt_period?: number | string;
    cpu_rt_runtime?: number | string;
    cpus?: number | string;
    cpuset?: string;
    credential_spec?: {
        config?: string;
        file?: string;
        registry?: string;
        [k: string]: unknown;
    };
    depends_on?: ListOfStrings | {
        [k: string]: {
            condition: 'service_started' | 'service_healthy';
        };
    };
    device_cgroup_rules?: ListOfStrings;
    devices?: string[];
    dns?: StringOrList;
    dns_opt?: string[];
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
    external_links?: string[];
    extra_hosts?: ListOrDict;
    group_add?: (string | number)[];
    healthcheck?: DefinitionsHealthcheck;
    hostname?: string;
    image?: string;
    init?: boolean;
    ipc?: string;
    isolation?: string;
    labels?: ListOrDict;
    links?: string[];
    logging?: {
        driver?: string;
        options?: {
            [k: string]: string | number | null;
        };
        [k: string]: unknown;
    };
    mac_address?: string;
    mem_limit?: string;
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
            [k: string]: unknown;
        } | null;
    };
    oom_kill_disable?: boolean;
    oom_score_adj?: number;
    pid?: string | null;
    pids_limit?: number | string;
    platform?: string;
    ports?: (number | string | {
        mode?: string;
        target?: number;
        published?: number;
        protocol?: string;
        [k: string]: unknown;
    })[];
    privileged?: boolean;
    pull_policy?: 'always' | 'never' | 'if_not_present';
    read_only?: boolean;
    restart?: string;
    runtime?: string;
    scale?: number;
    security_opt?: string[];
    shm_size?: number | string;
    secrets?: (string | {
        source?: string;
        target?: string;
        uid?: string;
        gid?: string;
        mode?: number;
        [k: string]: unknown;
    })[];
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
            [k: string]: unknown;
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
            [k: string]: unknown;
        };
        volume?: {
            nocopy?: boolean;
            [k: string]: unknown;
        };
        tmpfs?: {
            size?: number;
            [k: string]: unknown;
        };
        [k: string]: unknown;
    })[];
    volumes_from?: string[];
    working_dir?: string;
    [k: string]: unknown;
}
export interface DefinitionsDeployment {
    mode?: string;
    endpoint_mode?: string;
    replicas?: number;
    labels?: ListOrDict;
    rollback_config?: {
        parallelism?: number;
        delay?: string;
        failure_action?: string;
        monitor?: string;
        max_failure_ratio?: number;
        order?: 'start-first' | 'stop-first';
        [k: string]: unknown;
    };
    update_config?: {
        parallelism?: number;
        delay?: string;
        failure_action?: string;
        monitor?: string;
        max_failure_ratio?: number;
        order?: 'start-first' | 'stop-first';
        [k: string]: unknown;
    };
    resources?: {
        limits?: {
            cpus?: number | string;
            memory?: string;
            [k: string]: unknown;
        };
        reservations?: {
            cpus?: number | string;
            memory?: string;
            generic_resources?: DefinitionsGenericResources;
            [k: string]: unknown;
        };
        [k: string]: unknown;
    };
    restart_policy?: {
        condition?: string;
        delay?: string;
        max_attempts?: number;
        window?: string;
        [k: string]: unknown;
    };
    placement?: {
        constraints?: string[];
        preferences?: {
            spread?: string;
            [k: string]: unknown;
        }[];
        max_replicas_per_node?: number;
        [k: string]: unknown;
    };
    [k: string]: unknown;
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
    test?: string | string[];
    timeout?: string;
    start_period?: string;
    [k: string]: unknown;
}
export interface PropertiesNetworks {
    [k: string]: DefinitionsNetwork2;
}
export interface DefinitionsNetwork {
    name?: string;
    driver?: string;
    driver_opts?: {
        [k: string]: string | number;
    };
    ipam?: {
        driver?: string;
        config?: {
            subnet?: string;
            ip_range?: string;
            gateway?: string;
            aux_addresses?: {
                [k: string]: string;
            };
            [k: string]: unknown;
        }[];
        options?: {
            [k: string]: string;
        };
        [k: string]: unknown;
    };
    external?: boolean | {
        name?: string;
        [k: string]: unknown;
    };
    internal?: boolean;
    enable_ipv6?: boolean;
    attachable?: boolean;
    labels?: ListOrDict;
    [k: string]: unknown;
}
export interface PropertiesVolumes {
    [k: string]: DefinitionsVolume2;
}
export interface DefinitionsVolume {
    name?: string;
    driver?: string;
    driver_opts?: {
        [k: string]: string | number;
    };
    external?: boolean | {
        name?: string;
        [k: string]: unknown;
    };
    labels?: ListOrDict;
    [k: string]: unknown;
}
export interface PropertiesSecrets {
    [k: string]: DefinitionsSecret;
}
export interface DefinitionsSecret {
    name?: string;
    file?: string;
    external?: boolean | {
        name?: string;
        [k: string]: unknown;
    };
    labels?: ListOrDict;
    driver?: string;
    driver_opts?: {
        [k: string]: string | number;
    };
    template_driver?: string;
    [k: string]: unknown;
}
export interface PropertiesConfigs {
    [k: string]: DefinitionsConfig;
}
export interface DefinitionsConfig {
    name?: string;
    file?: string;
    external?: boolean | {
        name?: string;
        [k: string]: unknown;
    };
    labels?: ListOrDict;
    template_driver?: string;
    [k: string]: unknown;
}
//# sourceMappingURL=v3.8.d.ts.map