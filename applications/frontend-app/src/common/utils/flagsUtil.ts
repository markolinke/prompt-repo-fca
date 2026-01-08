export class FlagsUtil {
    private flags: string[] = [];
    
    isSet(flag: string): boolean {
        return this.flags.includes(flag);
    }

    set(flag: string): void {
        if (!this.flags.includes(flag))
            this.flags.push(flag);
    }

    unset(flag: string): void {
        this.flags = this.flags.filter(f => f !== flag);
    }

    clear(): void {
        this.flags = [];
    }
}