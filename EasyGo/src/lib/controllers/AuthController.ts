import { Account } from "../entityclass/Account";

export class AuthController {
    private account: Account;

    public constructor(account: Account) {
        this.account = account;
    }

    public login(): void {

    }

    public register(): void {

    }

    public resetPassword(newPw: string): void {

    }
}