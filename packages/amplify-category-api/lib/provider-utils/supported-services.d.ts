export declare const supportedServices: {
    AppSync: {
        inputs: ({
            key: string;
            type: string;
            question: string;
            validation: {
                operator: string;
                value: string;
                onErrorMsg: string;
            };
            required: boolean;
            options?: undefined;
        } | {
            key: string;
            type: string;
            question: string;
            required: boolean;
            validation?: undefined;
            options?: undefined;
        } | {
            key: string;
            type: string;
            question: string;
            options: {
                name: string;
                value: string;
            }[];
            required: boolean;
            validation?: undefined;
        } | {
            key: string;
            type: string;
            question: string;
            options: {
                name: string;
                value: string;
            }[];
            validation?: undefined;
            required?: undefined;
        })[];
        alias: string;
        serviceWalkthroughFilename: string;
        cfnFilename: string;
        provider: string;
    };
    'API Gateway': {
        inputs: ({
            key: string;
            question: string;
            required: boolean;
            type?: undefined;
        } | {
            key: string;
            question: string;
            type: string;
            required: string;
        } | {
            key: string;
            question: string;
            required: boolean;
            type: string;
        })[];
        alias: string;
        serviceWalkthroughFilename: string;
        provider: string;
    };
};
//# sourceMappingURL=supported-services.d.ts.map