import { ContentPart } from "./ContentPart.ts";

export class JsContentPart extends ContentPart {
    
    escape(s: any): string {
        return JSON.stringify(s);
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this._bases.length; i++) {
            const base = this._bases[i];
            acc.push(base);

            if (this._values[i] !== undefined) {
                const value = this._values[i];

                if (value instanceof JsContentPart) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export function js(contents: TemplateStringsArray, ...expressions: any[]) {
    return new JsContentPart([...contents], expressions);
}