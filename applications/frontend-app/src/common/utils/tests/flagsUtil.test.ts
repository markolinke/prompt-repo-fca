import { describe, it, expect } from 'vitest';
import { FlagsUtil } from '../FlagsUtil';

describe('flagsUtil', () => {

    it('should be empty when created', () => {
        const f = new FlagsUtil();
        expect(f.flags).toEqual([]);
        
        f.set('test');
        expect(f.flags).not.toEqual([]);
    });

    it('should return true if the flag is enabled', () => {
        const f = new FlagsUtil();

        expect(f.isSet('test')).toBe(false);
        f.set('test');
        expect(f.isSet('test')).toBe(true);
        f.unset('test');
        expect(f.isSet('test')).toBe(false);

        f.set('test');
        f.set('test');
        expect(f.isSet('test')).toBe(true);
        f.unset('test');
        expect(f.isSet('test')).toBe(false);
    });

    it('multiple sets of the same flag should be ignorred', () => {
        const f = new FlagsUtil();

        expect(f.isSet('test')).toBe(false);
        f.set('test');
        f.set('test');
        expect(f.isSet('test')).toBe(true);
        f.unset('test');
        expect(f.isSet('test')).toBe(false);
    });

    it('clear should remove all flags', () => {
        const f = new FlagsUtil();

        f.set('test');
        f.set('test2');
        expect(f.isSet('test')).toBe(true);
        expect(f.isSet('test2')).toBe(true);
        f.clear();
        expect(f.isSet('test')).toBe(false);
        expect(f.isSet('test2')).toBe(false);
    });
});