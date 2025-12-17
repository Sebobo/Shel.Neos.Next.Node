/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import React, { useMemo, useEffect } from 'react';
// @ts-ignore
import { connect } from 'react-redux';

// @ts-ignore
import { selectors, actions } from '@neos-project/neos-ui-redux-store';
// @ts-ignore
import { Button, Icon } from '@neos-project/react-ui-components';
// @ts-ignore
import { neos } from '@neos-project/neos-ui-decorators';

import { CREATE_NEXT_NODE_EVENT } from './Events';

import style from './AddNextNodeToolBar.module.css';
import { useEventCallback } from '../helpers/hooks';

const withReduxState = connect(
    (state: object) => ({
        node: selectors.CR.Nodes.focusedSelector(state),
        getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state),
        inspectorIsDirty: selectors.UI.Inspector.isDirty(state),
    }),
    {
        focusNode: actions.CR.Nodes.focus,
        moveNodes: actions.CR.Nodes.moveMultiple,
    },
);

const withNeosGlobals = neos((globalRegistry) => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository'),
}));

// Detect whether Neos has the new smaller toolbars and adjust button size accordingly
// @ts-ignore
export const NEOS_91_OR_NEWER = parseInt(CKEDITOR_VERSION) >= 47;
const BUTTON_SIZE = NEOS_91_OR_NEWER ? 'small' : 'regular';

const withPermissionContext = (component: React.FC) =>
    withNeosGlobals(
        connect(
            (_state, { nodeTypesRegistry }: { nodeTypesRegistry: NodeTypesRegistry }) => {
                const getAllowedSiblingNodeTypesSelector =
                    selectors.CR.Nodes.makeGetAllowedSiblingNodeTypesSelector(nodeTypesRegistry);

                return (state) => {
                    const focusedNodeContextPath = selectors.CR.Nodes.focusedNodePathSelector(state);
                    const getNodeByContextPathSelector =
                        selectors.CR.Nodes.makeGetNodeByContextPathSelector(focusedNodeContextPath);
                    const focusedNode = getNodeByContextPathSelector(state);

                    const role = focusedNode
                        ? nodeTypesRegistry.hasRole(focusedNode.nodeType, 'document')
                            ? 'document'
                            : 'content'
                        : null;
                    const allowedSiblingNodeTypes = focusedNode
                        ? getAllowedSiblingNodeTypesSelector(state, {
                              reference: focusedNodeContextPath,
                              role,
                          })
                        : [];

                    return {
                        allowedSiblingNodeTypes,
                        isAllowedToAddChildOrSiblingNodes: allowedSiblingNodeTypes.length > 0,
                    };
                };
            },
            {
                commenceNodeCreation: actions.CR.Nodes.commenceCreation,
            },
        )(component),
    );

type ComponentProps = {
    contextPath: string;
    fusionPath: string;
    commenceNodeCreation: (
        contextPath: string,
        fusionPath: string,
        position: 'after' | 'before' | 'inside',
        nodeTypeName: string,
    ) => void;
    isAllowedToAddChildOrSiblingNodes: boolean;
    allowedSiblingNodeTypes: string[];
    i18nRegistry: I18nRegistry;
    node: CRNode;
    nodeTypesRegistry: NodeTypesRegistry;
    inspectorIsDirty: boolean;
};

const makeAddNextNodeToolbar = (pluginConfiguration: PluginConfiguration) => {
    const AddNextNodeToolBar: React.FC<ComponentProps> = ({
        contextPath,
        fusionPath,
        commenceNodeCreation,
        isAllowedToAddChildOrSiblingNodes,
        allowedSiblingNodeTypes,
        i18nRegistry,
        node,
        nodeTypesRegistry,
        inspectorIsDirty,
    }) => {
        const nextNodeTypes: string[] = useMemo((): string[] => {
            const nodeType = node ? nodeTypesRegistry.getNodeType(node.nodeType) : [];
            const { nextNodeTypes } = nodeType.options;

            // Filter out the next node types which are disabled or not allowed as sibling nodes
            const nextNodeTypeCandidates = nextNodeTypes
                ? Object.keys(nextNodeTypes).filter((nodeTypeName) => {
                      return nextNodeTypes[nodeTypeName] && allowedSiblingNodeTypes.includes(nodeTypeName);
                  })
                : [];

            if (nextNodeTypeCandidates.length > 0) {
                return nextNodeTypeCandidates;
            }
            if (pluginConfiguration.currentNodeTypeAsFallback) {
                // Default to the current node type if no candidates for the next node type are available
                return [node.nodeType];
            }
            return [];
        }, [node?.nodeType, allowedSiblingNodeTypes]);

        // Callback to start the node creation process with the given node type already selected
        const handleCommenceNodeCreation = useEventCallback(
            (nodeTypeName: string) =>
                !inspectorIsDirty && commenceNodeCreation(contextPath, fusionPath, 'after', nodeTypeName),
        );

        useEffect(() => {
            const contentWindow = (document.querySelector('[name="neos-content-main"]') as HTMLIFrameElement)
                ?.contentWindow;

            if (node.isAutoCreated || !contentWindow) {
                return;
            }

            // Create a listener to open the creation dialog with the first candidate preselected (if available) when the event is fired (e.g. by the CKEditor plugin)
            const createFirstCandidateListener = (e: KeyboardEvent) => {
                const nextNodeType = nextNodeTypes.length > 0 ? nextNodeTypes[0] : null;
                if (e.type === CREATE_NEXT_NODE_EVENT) {
                    handleCommenceNodeCreation(nextNodeType);
                }
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    handleCommenceNodeCreation(nextNodeType);
                }
            };

            contentWindow.addEventListener(CREATE_NEXT_NODE_EVENT, createFirstCandidateListener);
            contentWindow.addEventListener('keydown', createFirstCandidateListener, true);

            return () => {
                contentWindow.removeEventListener(CREATE_NEXT_NODE_EVENT, createFirstCandidateListener);
                contentWindow.removeEventListener('keydown', createFirstCandidateListener, true);
            };
        }, [contextPath, handleCommenceNodeCreation]);

        return !node.isAutoCreated ? (
            <div className={style.addNextNodeButtons} id="neos-InlineToolbar-AddNextNode">
                {nextNodeTypes.map((nodeTypeName: string, index: number) => {
                    const nodeType = nodeTypesRegistry.getNodeType(nodeTypeName);
                    const nodeTypeLabel = nodeType ? i18nRegistry.translate(nodeType.label) : nodeTypeName;
                    const tooltip =
                        index === 0
                            ? i18nRegistry.translate(
                                  'Shel.Neos.Next.Node:Main:AddPrimaryNextNode',
                                  `Create "${nodeTypeLabel}" as next element (Ctrl+Enter | Cmd + Enter)`,
                                  { nodeTypeLabel },
                              )
                            : i18nRegistry.translate(
                                  'Shel.Neos.Next.Node:Main:AddNextNode',
                                  `Create "${nodeTypeLabel}" as next element`,
                                  { nodeTypeLabel },
                              );
                    return nodeType ? (
                        <Button
                            key={nodeTypeName}
                            className={style.addNextNodeButton}
                            disabled={!isAllowedToAddChildOrSiblingNodes}
                            onClick={() => handleCommenceNodeCreation(nodeTypeName)}
                            title={tooltip}
                            size={BUTTON_SIZE}
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
        ) : null;
    };

    return withReduxState(withPermissionContext(AddNextNodeToolBar as never));
};

export default makeAddNextNodeToolbar;
