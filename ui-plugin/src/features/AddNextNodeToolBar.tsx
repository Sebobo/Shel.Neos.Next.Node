import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { selectors, actions } from '@neos-project/neos-ui-redux-store';
import { Button, Icon } from '@neos-project/react-ui-components';
import { neos } from '@neos-project/neos-ui-decorators';

import style from './AddNextNodeToolBar.module.css';

const withReduxState = connect((state) => ({
    // TODO: Implement an actual selector to get the focused node's fusion path (not the only spot where we don't use selectors but the raw state in the UI)
    focusedFusionPath: state?.cr?.nodes?.focused?.fusionPath,
    node: selectors.CR.Nodes.focusedSelector(state),
    getNodeByContextPath: selectors.CR.Nodes.nodeByContextPath(state)
}), {
    focusNode: actions.CR.Nodes.focus,
    moveNodes: actions.CR.Nodes.moveMultiple
});

const withNeosGlobals = neos((globalRegistry) => ({
    nodeTypesRegistry: globalRegistry.get('@neos-project/neos-ui-contentrepository')
}));

const withPermissionContext = (component: React.FC) => withNeosGlobals(
    connect((_state, { nodeTypesRegistry }: { nodeTypesRegistry: NodeTypesRegistry }) => {
        const isAllowedToAddChildOrSiblingNodesSelector = selectors.CR.Nodes.makeIsAllowedToAddChildOrSiblingNodes(nodeTypesRegistry);

        return (state) => {
            const focusedNodeContextPath = selectors.CR.Nodes.focusedNodePathSelector(state);
            const getNodeByContextPathSelector = selectors.CR.Nodes.makeGetNodeByContextPathSelector(focusedNodeContextPath);
            const focusedNode = getNodeByContextPathSelector(state);

            const role = focusedNode ? (nodeTypesRegistry.hasRole(focusedNode.nodeType, 'document') ? 'document' : 'content') : null;
            const isAllowedToAddChildOrSiblingNodes = isAllowedToAddChildOrSiblingNodesSelector(state, {
                reference: focusedNodeContextPath,
                role
            });

            return {
                isAllowedToAddChildOrSiblingNodes
            };
        };
    }, {
        commenceNodeCreation: actions.CR.Nodes.commenceCreation
    })(component));

type ComponentProps = {
    contextPath: string;
    fusionPath: string;
    commenceNodeCreation: (contextPath: string, fusionPath: string, position: 'after' | 'before' | 'inside', nodeTypeName: string) => void;
    isAllowedToAddChildOrSiblingNodes: boolean;
    i18nRegistry: I18nRegistry;
    node: CRNode;
    nodeTypesRegistry: NodeTypesRegistry;
};

const makeAddNextNodeToolbar = (pluginConfiguration: PluginOptions) => {
    const AddNextNodeToolBar: React.FC<ComponentProps> = ({
                                                              contextPath,
                                                              fusionPath,
                                                              commenceNodeCreation,
                                                              isAllowedToAddChildOrSiblingNodes,
                                                              i18nRegistry,
                                                              node,
                                                              nodeTypesRegistry
                                                          }) => {
        // Hide the button for auto created nodes like content collections
        if (node.isAutoCreated) {
            return null;
        }

        const nextNodeTypes: string[] = React.useMemo((): string[] => {
            const nodeType = node ? nodeTypesRegistry.getNodeType(node.nodeType) : [];
            let { nextNodeTypes } = nodeType.options;

            // Default to the current node type if no nextNodeTypes are defined
            if (!nextNodeTypes) {
                nextNodeTypes = { [node.nodeType]: true };
            }

            return Object
                .keys(nextNodeTypes)
                .filter((nodeTypeName) => nextNodeTypes[nodeTypeName]);
        }, [node?.nodeType]);

        // Callback to start the node creation process with the given node type already selected
        const handleCommenceNodeCreation = useCallback((nodeTypeName: string) => {
            commenceNodeCreation(
                contextPath,
                fusionPath,
                'after',
                nodeTypeName
            );
        }, [contextPath, fusionPath, commenceNodeCreation]);

        // TODO: Add second colored plus icon on buttons
        return (
            <div className={style.addNextNodeButtons} id="neos-InlineToolbar-AddNextNode">
                {nextNodeTypes.map((nodeTypeName: string) => {
                    const nodeType = nodeTypesRegistry.getNodeType(nodeTypeName);
                    const nodeTypeLabel = nodeType ? i18nRegistry.translate(nodeType.label) : nodeTypeName;
                    return nodeType ? (
                        <Button
                            key={nodeTypeName}
                            className={style.addNextNodeButton}
                            disabled={!isAllowedToAddChildOrSiblingNodes}
                            onClick={() => handleCommenceNodeCreation(nodeTypeName)}
                            title={i18nRegistry.translate('Shel.Neos.Next.Node:Main:AddNextNode', `Create "${nodeTypeLabel}" as next element`, { nodeTypeLabel })}
                        >
                            <span className="fa-layers fa-fw">
                                <Icon
                                    icon={nodeType.ui?.icon || 'plus'}
                                    hoverStyle="brand"
                                    size="lg"
                                />
                                <Icon icon="circle" color="primaryBlue" transform="shrink-3 down-10 right-10" />
                                <Icon icon="plus" transform="shrink-7 down-10 right-10" />
                            </span>
                        </Button>
                    ) : null;
                })}
            </div>
        );
    };

    return withReduxState(withPermissionContext(AddNextNodeToolBar as any));
};

export default makeAddNextNodeToolbar;
