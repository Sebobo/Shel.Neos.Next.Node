declare module '*.module.css';
declare module '*.module.scss';

// ---------------------------
// Types from the Neos UI core
// ---------------------------
interface I18nRegistry {
    translate: (
        id?: string,
        fallback?: string,
        params?: Record<string, unknown> | string[],
        packageKey?: string,
        sourceName?: string,
    ) => string;
}

interface CRNode {
    isAutoCreated: boolean;
    identifier: string;
    contextPath: string;
    name: string;
    nodeType: string;
}

interface NodeTypesRegistry {
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
}

interface PluginConfiguration {
    currentNodeTypeAsFallback: boolean;
}

interface RenderContentOutOfBandFeedbackPayload {
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
}

interface GlobalState {
    system: object;
    user: object;
    cr: object;
    ui: object;
}

interface CKEditor {
    keystrokes: {
        set: (keyCombination: string, command: (event, cancel) => void) => void;
    };
}
