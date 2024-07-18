/* eslint-disable @typescript-eslint/no-invalid-void-type */
type CooldownFunction<T extends (...args: unknown[]) => unknown> = (...args: Parameters<T>) => ReturnType<T> | void;

function createCooldownFunction<T extends (...args: unknown[]) => unknown>(fn: T, cooldown: number): CooldownFunction<T> {
    let isCooldown = false;

    return function (...args: Parameters<T>): ReturnType<T> | void {
        if (!isCooldown) {
            const res = fn.apply(this, args);
            isCooldown = true;
            setTimeout(() => {
                isCooldown = false;
            }, cooldown * 1000);
            return res;
        }
    };
}

export { createCooldownFunction };
