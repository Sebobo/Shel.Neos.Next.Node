import React, { useEffect, useMemo } from 'react';
import { connect } from 'react-redux';

import type { SynchronousRegistry } from '@neos-project/neos-ui-extensibility';
import { actions, selectors } from '@neos-project/neos-ui-redux-store';
import { Button, Icon } from '@neos-project/react-ui-components';
import { neos } from '@neos-project/neos-ui-decorators';

import { CREATE_NEXT_NODE_EVENT } from './Events';
import { useEventCallback } from '../helpers/hooks';

import style from './AddNextNodeToolBar.module.css';

const withReduxState = connect(
    (state: object) => ({
        getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
        inspectorIsDirty: selectors.UI.Inspector.isDirty(state),
        node: selectors.CR.Nodes.focusedSelector(state)
    }),
    {
        focusNode: actions.CR.Nodes.focus,
        moveNodes: actions.CR.Nodes.moveMultiple
    }
);

const withNeosGlobals = neos((globalRegistry: SynchronousRegistry<unknown>) => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository')
}));

// oxlint-disable-next-line explicit-function-return-type
const withPermissionContext = (component: React.FC) =>
    withNeosGlobals(
        connect(
            (_state: GlobalState, { nodeTypesRegistry }: { nodeTypesRegistry: NodeTypesRegistry }) => {
                const getAllowedSiblingNodeTypesSelector =
                    selectors.CR.Nodes.makeGetAllowedSiblingNodeTypesSelector(nodeTypesRegistry);

                return (state: GlobalState): {
                    allowedSiblingNodeTypes: string[],
                    isAllowedToAddChildOrSiblingNodes: boolean
                } => {
                    const focusedNodeContextPath: string = selectors.CR.Nodes.focusedNodePathSelector(state);
                    const getNodeByContextPathSelector =
                        selectors.CR.Nodes.makeGetNodeByContextPathSelector(focusedNodeContextPath);
                    const focusedNode = getNodeByContextPathSelector(state);

                    let allowedSiblingNodeTypes: string[] = [];
                    if (focusedNode) {
                        let role = 'content';
                        if (nodeTypesRegistry.hasRole(focusedNode.nodeType, 'document')) {
                            role = 'document';
                        }
                        allowedSiblingNodeTypes = getAllowedSiblingNodeTypesSelector(state, {
                            reference: focusedNodeContextPath,
                            role
                        });
                    }
                    return {
                        allowedSiblingNodeTypes,
                        isAllowedToAddChildOrSiblingNodes: allowedSiblingNodeTypes.length > 0
                    };
                };
            },
            {
                commenceNodeCreation: actions.CR.Nodes.commenceCreation
            }
        )(component)
    );

interface ComponentProps {
    contextPath: string;
    fusionPath: string;
    commenceNodeCreation: (
        contextPath: string,
        fusionPath: string,
        position: 'after' | 'before' | 'inside',
        nodeTypeName: string
    ) => void;
    isAllowedToAddChildOrSiblingNodes: boolean;
    allowedSiblingNodeTypes: string[];
    i18nRegistry: I18nRegistry;
    node: CRNode;
    nodeTypesRegistry: NodeTypesRegistry;
    inspectorIsDirty: boolean;
}

// oxlint-disable-next-line explicit-function-return-type explicit-module-boundary-types
const makeAddNextNodeToolbar = (pluginConfiguration: PluginConfiguration) => {
    const AddNextNodeToolBar: React.FC<ComponentProps> = ({
                                                              contextPath,
                                                              fusionPath,
                                                              commenceNodeCreation,
                                                              isAllowedToAddChildOrSiblingNodes,
                                                              allowedSiblingNodeTypes,
                                                              i18nRegistry,
                                                              node,
                                                              nodeTypesRegistry, inspectorIsDirty
                                                          }) => {
        const nextNodeTypes: string[] = useMemo((): string[] => {
            if (!node?.nodeType) {
                return [];
            }
            const nodeType = nodeTypesRegistry.getNodeType(node.nodeType);
            const { nextNodeTypes } = nodeType.options;

            // Filter out the next node types which are disabled or not allowed as sibling nodes
            const nextNodeTypeCandidates = nextNodeTypes
                ? Object.keys(nextNodeTypes).filter((nodeTypeName) =>
                    nextNodeTypes[nodeTypeName] && allowedSiblingNodeTypes.includes(nodeTypeName)
                ) : [];

            if (nextNodeTypeCandidates.length > 0) {
                return nextNodeTypeCandidates;
            }
            if (pluginConfiguration.currentNodeTypeAsFallback) {
                // Default to the current node type if no candidates for the next node type are available
                return [node.nodeType];
            }
            return [];
        }, [node?.nodeType, allowedSiblingNodeTypes, nodeTypesRegistry]);

        // Callback to start the node creation process with the given node type already selected
        const handleCommenceNodeCreation = useEventCallback(
            (nodeTypeName: string) =>
                !inspectorIsDirty && commenceNodeCreation(contextPath, fusionPath, 'after', nodeTypeName)
        );

        useEffect(() => {
            const contentWindow = (document.querySelector('[name="neos-content-main"]') as HTMLIFrameElement)
                ?.contentWindow;

            if (node.isAutoCreated || !contentWindow) {
                return;
            }

            // Create a listener to open the creation dialog with the first candidate preselected (if available) when the event is fired (e.g. by the CKEditor plugin)
            const createFirstCandidateListener = (event: KeyboardEvent): void => {
                if (nextNodeTypes.length === 0) {
                    return;
                }
                const [nextNodeType] = nextNodeTypes;
                if (event.type === CREATE_NEXT_NODE_EVENT) {
                    handleCommenceNodeCreation(nextNodeType);
                }
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    handleCommenceNodeCreation(nextNodeType);
                }
            };

            contentWindow.addEventListener(CREATE_NEXT_NODE_EVENT, createFirstCandidateListener);
            contentWindow.addEventListener('keydown', createFirstCandidateListener, true);

            return (): void => {
                contentWindow.removeEventListener(CREATE_NEXT_NODE_EVENT, createFirstCandidateListener);
                contentWindow.removeEventListener('keydown', createFirstCandidateListener, true);
            };
        }, [node, nextNodeTypes, contextPath, handleCommenceNodeCreation]);

        return node.isAutoCreated ? null : (
            <div className={style.addNextNodeButtons} id="neos-InlineToolbar-AddNextNode">
                {nextNodeTypes.map((nodeTypeName: string, index: number) => {
                    const nodeType = nodeTypesRegistry.getNodeType(nodeTypeName);
                    const nodeTypeLabel = nodeType ? i18nRegistry.translate(nodeType.label) : nodeTypeName;
                    const tooltip =
                        index === 0
                            ? i18nRegistry.translate(
                                'Shel.Neos.Next.Node:Main:AddPrimaryNextNode',
                                `Create "${nodeTypeLabel}" as next element (Ctrl+Enter | Cmd + Enter)`,
                                { nodeTypeLabel }
                            )
                            : i18nRegistry.translate(
                                'Shel.Neos.Next.Node:Main:AddNextNode',
                                `Create "${nodeTypeLabel}" as next element`,
                                { nodeTypeLabel }
                            );
                    return nodeType ? (
                        <Button
                            key={nodeTypeName}
                            className={style.addNextNodeButton}
                            disabled={!isAllowedToAddChildOrSiblingNodes}
                            onClick={() => handleCommenceNodeCreation(nodeTypeName)}
                            title={tooltip}
                        >
                            <span className="fa-layers fa-fw">
                                <Icon icon={nodeType.ui?.icon || 'plus'} hoverStyle="brand" size="lg" />
                                <Icon icon="circle" color="primaryBlue" transform="shrink-3 down-10 right-10" />
                                <Icon icon="plus" transform="shrink-7 down-10 right-10" />
                            </span>
                        </Button>
                    ) : null;
                })}
            </div>
        );
    };

    return withReduxState(withPermissionContext(AddNextNodeToolBar as never));
};

export default makeAddNextNodeToolbar;
