import { $TSContext } from '@aws-amplify/amplify-cli-core';
export declare function start(context: $TSContext): Promise<void>;
interface InvokerOptions {
    timeout?: string;
}
export declare const timeConstrainedInvoker: <T>(promise: Promise<T>, options?: InvokerOptions) => Promise<T>;
interface InvokerOptions {
    timeout?: string;
}
export {};
//# sourceMappingURL=index.d.ts.map