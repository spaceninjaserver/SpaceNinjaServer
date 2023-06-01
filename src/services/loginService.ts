import { Account } from "../models/loginModel";
import { IDatabaseAccount } from "../types/loginTypes";

const isCorrectPassword = (requestPassword: string, databasePassword: string): boolean => {
  return requestPassword === databasePassword;
};

const createAccount = async (accountData: IDatabaseAccount) => {
  console.log("test", accountData);
  const account = new Account(accountData);
  try {
    await account.save();
    return account.toJSON();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("error creating account that is not of instance Error");
  }
};

export { isCorrectPassword, createAccount };
