module Events {
    export class EventBus {
        constructor() {
        }

        private handlers: { [s: string]: any[] } = {};

        private getClassName<T>(event: T): string {
            var evt = <any>event;
            return evt.constructor.name;
        }

        public fire<T>(event: T): void {
            var name = this.getClassName(event);
            if (name in this.handlers) {
                var handlers: { (event: T): void }[] = this.handlers[name];
                for (var i = 0; i < handlers.length; i++) {
                    handlers[i](event);
                }
            }
        }

        public register<T>(event: T, handler: (event: T) => void): void {
            var name = this.getClassName(event);
            if (!(name in this.handlers)) {
                this.handlers[name] = [];
            }
            this.handlers[name].push(handler);
        }

        public unregister<T>(event: T, handler: (event: T) => void): void {
            var name = this.getClassName(event);
            if (name in this.handlers) {
                var handlers: { (event: T): void }[] = this.handlers[name];
                for (var i = 0; i < handlers.length; i++) {
                    if (handlers[i] === handler) {
                        handlers.splice(i, 1);
                        i--;
                    }
                }
            }
        }
    }
}