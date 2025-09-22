declare module '*.module.css';
declare module '*.module.scss';

// ---------------------------
// Types from the Neos UI core
// ---------------------------
type I18nRegistry = {
    translate: (
        id?: string,
        fallback?: string,
        params?: Record<string, unknown> | string[],
        packageKey?: string,
        sourceName?: string,
    ) => string;
};

type CRNode = {
    identifier: string;
    contextPath: string;
    name: string;
    nodeType: string;
};

type NodeTypesRegistry = {
    getNodeType: (nodeTypeName: string) => {
        nodeType: string;
        options?: {
            nextNodeTypes?: Record<string, boolean>;
        };
        ui?: {
            icon?: string;
        };
        label: string;
    };
    hasRole: (nodeTypeName: string, role: string) => boolean;
};

type PluginConfiguration = {
    currentNodeTypeAsFallback: boolean;
};

type RenderContentOutOfBandFeedbackPayload = {
    contextPath: string;
    parentDomAddress?: {
        contextPath: string;
        fusionPath: string;
    };
    renderedContent: string;
    siblingDomAddress?: {
        contextPath: string;
        fusionPath: string;
    };
    mode: 'before' | 'after' | 'replace';
};
