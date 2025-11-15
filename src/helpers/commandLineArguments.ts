interface IArguments {
    configPath?: string;
    dev?: boolean;
    secret?: string;
    docker?: boolean;
}

export const args: IArguments = {};

for (let i = 2; i < process.argv.length; ) {
    switch (process.argv[i++]) {
        case "--configPath":
            args.configPath = process.argv[i++];
            break;

        case "--dev":
            args.dev = true;
            break;

        case "--secret":
            args.secret = process.argv[i++];
            break;

        case "--docker":
            args.docker = true;
            break;
    }
}
