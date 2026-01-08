export class FlagsUtil {
    private _flags: string[] = [];
    
    get isEmpty(): boolean {
        return this._flags.length === 0;
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
