export class FlagsUtil {
    private _flags: string[] = [];
    
    get flags(): string[] {
        return [...this._flags];
    }

    isSet(flag: string): boolean {
        return this._flags.includes(flag);
    }

    set(flag: string): void {
        if (!this._flags.includes(flag))
            this._flags.push(flag);
    }

    unset(flag: string): void {
        this._flags = this._flags.filter(f => f !== flag);
    }

    clear(): void {
        this._flags = [];
    }
}
