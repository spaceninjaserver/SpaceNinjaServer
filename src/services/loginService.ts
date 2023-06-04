import { Account } from "@/src/models/loginModel";
import { createInventory } from "@/src/services/inventoryService";
import { IDatabaseAccount } from "@/src/types/loginTypes";

const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
    return requestPassword === databasePassword;
};

const createAccount = async (accountData: IDatabaseAccount) => {
    const account = new Account(accountData);
    try {
        await account.save();
        await createInventory(account._id);
        return account.toJSON();
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("error creating account that is not of instance Error");
    }
};

export { isCorrectPassword, createAccount };
