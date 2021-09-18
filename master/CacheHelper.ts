function memoize(target: any, propertyKey: string, descriptor: PropertyDescriptor): any {
    let fn: Function = descriptor.value;
    let cache = {};
    descriptor.value = function (...args: any[]) {
        let key = args.join("-");
        if (!cache[key]) {
            cache[key] = fn.apply(target, args);
        } else {
        }
        return cache[key];
    }
    return descriptor;
}
