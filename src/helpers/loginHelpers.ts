import { ILoginRequest } from "@/src/types/loginTypes";
import { parseEmail, parseNumber, parseString } from "./general";

const toLoginRequest = (loginRequest: unknown): ILoginRequest => {
    if (!loginRequest || typeof loginRequest !== "object") {
        throw new Error("incorrect or missing login request data");
    }

    // TODO: function that checks whether every field of interface is in object
    if (
        "email" in loginRequest &&
        "password" in loginRequest
    ) {
        return {
            email: parseEmail(loginRequest.email),
            password: parseString(loginRequest.password)
        };
    }

    throw new Error("incorrect login request");
};

export { toLoginRequest };
