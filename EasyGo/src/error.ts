export class InvalidCredentialsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidCredentialsError';
        Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
    }
}

export class WeakPasswordError extends Error {
    reasons: ('length' | 'characters' | 'pwned')[];

    constructor(reasons: ("length" | "characters" | "pwned")[]) {
        super(reasons.join('\n'));
        this.name = 'WeakPasswordError';
        this.reasons = reasons;
    }
}

export function weakPwMessage(password: string): string {
    if (password.length < 8)
        return 'Password must include at least 8 characters';

    if (!/[0-9]/.test(password))
        return 'Password must include at least 1 numerical digit.';

    if (!/[A-Z]/.test(password))
        return 'Password must include at least one uppercase letter.';

    if (!/[!@#$%^&*]/.test(password))
        return 'Password must include at least 1 special character.';

    if (!/[a-z]/.test(password))
        return 'Password must include at least one lowercase letter.';

    if (/[^a-zA-Z0-9!@#$%^&*]/.test(password))
        return 'Password contains invalid characters.';
    return '';
}