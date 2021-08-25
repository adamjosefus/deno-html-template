import { ContentPart } from "./ContentPart.ts";
import { HtmlContentPart, html } from "./HtmlContentPart.ts";
import { JsContentPart, js } from "./JsContentPart.ts";
export { html } from "./HtmlContentPart.ts";
export { js } from "./JsContentPart.ts";
import { Marked as Markdown } from "https://deno.land/x/markdown/mod.ts";


// deno-lint-ignore-file
type TemplateParamType = {
    [name: string]: any
}

type FilterCallbackType = {
    (...args: any[]): any;
}

type FilterNormalizedCallbackType = {
    (context: RenderingContext, ...args: any[]): any;
}

type FilterListType = {
    name: string,
    callback: FilterNormalizedCallbackType,
}[]


const enum RenderingContext {
    HTML = 'html',
    JS = 'js'
}


export class Template {
    private _filters: FilterListType = [];


    constructor() {
        this._addNormalizedFilter('noescape', (ctx: RenderingContext, s: string) => {
            return this._createContentPartByContext(ctx, s);
        });

        this._addNormalizedFilter('json', (_ctx: RenderingContext, s: any) => {
            return this._createContentPartByContext(RenderingContext.JS, JSON.stringify(s));
        });

        this._addNormalizedFilter('markdown', (_ctx: RenderingContext, s: any) => {
            return this._createContentPartByContext(RenderingContext.HTML, Markdown.parse(s).content);
        });

        this.addFilter('trim', (s: string) => s.trim());

        this.addFilter('lower', (s: string) => s.toLowerCase());

        this.addFilter('upper', (s: string) => s.toUpperCase());

        this.addFilter('firstUpper', (s: string) => s.substring(0, 1).toUpperCase() + s.substring(1));

    }


    private _createContentPartByContext(context: RenderingContext, bases: string[] | string, values: any[] = []): ContentPart {
        switch (context) {
            case RenderingContext.HTML:
                return new HtmlContentPart(bases, values);

            case RenderingContext.JS:
                return new JsContentPart(bases, values);

            default:
                throw new Error(`Unknown renderning context "${context}"`);
        }
    }


    addFilter(name: string, callback: FilterCallbackType): void {
        this._addNormalizedFilter(name, (_tag, ...args) => callback(...args));
    }


    private _addNormalizedFilter(name: string, callback: FilterNormalizedCallbackType): void {
        if (this._hasFilter(name)) throw new Error(`Filter "${name}" is already exists.`);

        this._filters.push({ name, callback });
    }


    private _hasFilter(name: string): boolean {
        return this._findFilterItem(name) ? true : false;
    }


    private _getFilter(name: string): FilterNormalizedCallbackType {
        if (this._hasFilter(name)) {
            return this._findFilterItem(name)!.callback
        } else throw new Error(`Filter not found by name "${name}".`);
    }


    private _findFilterItem(name: string) {
        return this._filters.find(f => f.name == name);
    }


    render(templatePath: string, templateParams: TemplateParamType = {}): string {
        const raw = Deno.readTextFileSync(templatePath);

        const scriptContentReplace = /(?<openTag>\<script.*?\>)(?<scriptContent>.+?)(?<closeTag><\/script>)/gs;

        const sliceIndexes: number[] = [];

        const scriptContents: string[] = []

        // TODO: Metoda "reaplce" nedává smysl. Nijak se neodchytává výsledný string. Absolutně by stašil while cyklus s exec regulárním výrazem. Jen jsem neměl odvahu to teď v novi měnit.
        raw.replace(scriptContentReplace, (substring: string, g1: string, g2: string, g3: string, i: number, all: string, groups: any, ...exec: any[]) => {
            const openTagGroup = groups.openTag as string;
            const scriptContentGroup = groups.scriptContent as string;

            const contentStart = i + openTagGroup.length;
            const contentEnd = i + openTagGroup.length + scriptContentGroup.length;

            sliceIndexes.push(contentStart, contentEnd);

            const result = scriptContentGroup;

            scriptContents.push(result);
            return result;
        });

        const htmlContents = ((s, borders) => {
            const arr: string[] = [];

            for (let i = 0; i < borders.length; i += 2) {
                const start = borders[i];
                const end = borders[i + 1];

                arr.push(s.substring(start, end));
            }

            return arr;
        })(raw, [0, ...sliceIndexes])


        const final = (() => {
            const arr: string[] = [];

            for (let i = 0; i < htmlContents.length; i++) {
                const html = htmlContents[i];
                arr.push(this._processRenderString(RenderingContext.HTML, html, templateParams));

                if (scriptContents[i]) {
                    const js = scriptContents[i];
                    arr.push(this._processRenderString(RenderingContext.JS, js, templateParams));
                }
            }

            return arr.join('');
        })()

        return final;
    }


    private _processRenderString(context: RenderingContext, s: string, templateParams: TemplateParamType = {}) {
        const paramsReplacer = /\{\$(?<name>[a-z_]+[A-z0-9_]*)(\((?<args>.*)\)){0,1}(?<filters>(\|[a-z_]+)*)\}/gi;

        return s.replace(paramsReplacer, (_match: string, ...exec: any[]) => {
            const [_g1, _g2, _g3, _g4, _g5, _pos, _content, groups] = exec;
            const paramName = groups.name as string;

            const paramFilters: string[] = ((s) => {
                return s
                    .split('|')
                    .map(v => v.trim())
                    .filter(v => v !== '')
                    .filter((v, i, arr) => arr.indexOf(v) == i);
            })(groups.filters as string);

            const paramInput = templateParams[paramName]

            // Args
            const paramArgs: any[] | null = ((s: string | undefined) => {
                if (s !== undefined) return JSON.parse(`[${s}]`);
                else return null;
            })(groups.args)


            // Value
            // TODO: Opravit volán funkce bez parametru
            const value = (() => {
                if (paramInput !== undefined) {
                    if (paramArgs !== null) {
                        if (typeof paramInput === 'function') return paramInput(...paramArgs);
                        else throw new Error(`Param "${paramName}" is not a function.`);
                    } else return paramInput;
                } else throw new Error(`Value of param "${paramName}" is undefined.`);
            })()


            // Filters
            const filters = ((names) => {
                const arr = names.reduce((acc: FilterNormalizedCallbackType[], n) => {
                    acc.push(this._getFilter(n));

                    return acc;
                }, []);

                return arr;
            })(paramFilters)


            const raw = ((v, filters) => {
                return filters.reduce((v, f) => f(context, v), v);
            })(value, filters);


            // Final value
            const contentPart = ((s) => {
                switch (context) {
                    case RenderingContext.HTML:
                        return html`${s}`;

                    case RenderingContext.JS:
                        return js`${s}`;

                    default: throw new Error(`Unknown renderning context "${context}"`);
                }
            })(raw)

            return contentPart.toString();
        });
    }
}
