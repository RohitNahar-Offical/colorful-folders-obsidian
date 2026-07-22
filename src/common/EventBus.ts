export type EventCallback = (...args: unknown[]) => void;

export class EventBus {
    private listeners: Map<string, Set<EventCallback>> = new Map();

    on(event: string, callback: EventCallback): void {
        let set = this.listeners.get(event);
        if (!set) {
            set = new Set();
            this.listeners.set(event, set);
        }
        set.add(callback);
    }

    off(event: string, callback: EventCallback): void {
        const set = this.listeners.get(event);
        if (set) {
            set.delete(callback);
        }
    }

    emit(event: string, ...args: unknown[]): void {
        const set = this.listeners.get(event);
        if (set) {
            for (const cb of set) {
                try {
                    cb(...args);
                } catch (e) {
                    console.error(`Colorful Folders: EventBus emit error on '${event}'`, e);
                }
            }
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}
