export interface INamingConvention {
    toSymbol(path: string): string;
    toFile(symbol: string): string;
}
export declare class DefaultNamingConvention implements INamingConvention {
    toSymbol(path: string): string;
    toFile(symbol: string): string;
    toCamelCase(value: string): string;
    toDashCase(value: string): string;
}
