export abstract class ContentPart {
    protected _bases: string[];
    protected _values: any[];

    constructor(bases: string[] | string, values: any[] = []) {
        this._bases = typeof bases == 'string' ? [bases] : bases;
        this._values = values;
    }

    abstract escape(s: any): string;

    abstract toString(): string;
}


export type contextTagType = {
    (contents: TemplateStringsArray, ...expressions: any[]): ContentPart
}