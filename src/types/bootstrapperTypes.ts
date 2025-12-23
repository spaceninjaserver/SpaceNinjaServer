// This is specific to the OpenWF Bootstrapper: https://openwf.io/bootstrapper-manual
export interface ITunables {
    prohibit_skip_mission_start_timer?: boolean;
    prohibit_fov_override?: boolean;
    prohibit_freecam?: boolean;
    prohibit_teleport?: boolean;
    prohibit_scripts?: boolean;
    disable_websocket?: boolean;
    motd?: string;
    token?: string;
    irc?: string;
    udp_proxy_upstream?: string;
}
