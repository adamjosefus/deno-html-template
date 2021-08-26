import { ContentPart } from "./ContentPart.ts";

export class HtmlContentPart extends ContentPart {

    escape(s: any): string {
        return s
            .toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    toString(): string {
        const acc: string[] = [];

        for (let i = 0; i < this._bases.length; i++) {
            const base = this._bases[i];
            acc.push(base);

            if (this._values[i] !== undefined) {
                const value = this._values[i];

                if (value instanceof HtmlContentPart) {
                    acc.push(value.toString());
                } else {
                    acc.push(this.escape(value));
                }
            }
        }

        return acc.join('');
    }
}


export function html(contents: TemplateStringsArray, ...expressions: any[]) {
    return new HtmlContentPart([...contents], expressions);
}