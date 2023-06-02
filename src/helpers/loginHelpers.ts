import { ILoginRequest } from "../types/loginTypes";
import { parseEmail, parseNumber, parseString } from "./general";

const toLoginRequest = (loginRequest: unknown): ILoginRequest => {
    if (!loginRequest || typeof loginRequest !== "object") {
        throw new Error("incorrect or missing login request data");
    }

    // TODO: function that checks whether every field of interface is in object
    if (
        "email" in loginRequest &&
        "password" in loginRequest &&
        "time" in loginRequest &&
        "s" in loginRequest &&
        "lang" in loginRequest &&
        "date" in loginRequest &&
        "ClientType" in loginRequest &&
        "PS" in loginRequest
    ) {
        return {
            email: parseEmail(loginRequest.email),
            password: parseString(loginRequest.password),
            time: parseNumber(loginRequest.time),
            s: parseString(loginRequest.s),
            lang: parseString(loginRequest.lang),
            date: parseNumber(loginRequest.date),
            ClientType: parseString(loginRequest.ClientType),
            PS: parseString(loginRequest.PS)
        };
    }

    throw new Error("incorrect login request");
};

export { toLoginRequest };
