type StoreItemType<ValueType> = {
    key: string,
    value: ValueType,
    modified: number | null,
}


export class Cache<ValueType> {

    private _store: StoreItemType<ValueType>[] = [];

    constructor() {
    }


    save(key: string, value: ValueType, modified: number | null = null): void {
        if (this.load(key, modified)) this.clear(key);

        this._store.push({
            key,
            value,
            modified: modified ?? null
        })
    }


    load(key: string, modified: number | null = null): ValueType | null {
        const item = this._store.find(item => item.key === key);

        if (!item) return null;

        const expired = (item.modified ?? 0) < (modified ?? 0);

        if (expired) {
            this.clear(key);
            return null;
        }

        return item.value;
    }


    clear(key: string): void {
        const index = this._store.findIndex(item => item.key === key);

        if (index >= 0) this._store.splice(index, 1);
    }


    clearAll(): void {
        this._store.forEach(item => {
            this.clear(item.key);
        });
    }
}