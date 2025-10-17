/* eslint-disable @typescript-eslint/ban-ts-comment */

import manifest from '@neos-project/neos-ui-extensibility';
// @ts-ignore
import { findNodeInGuestFrame } from '@neos-project/neos-ui-guest-frame';

import makeNextNodeToolbar from './features/AddNextNodeToolBar';
import CKEditorPlugin from './features/CKEditorPlugin';
import { actions } from './actions';

manifest('Shel.Neos.Next.Node:ToolBar', {}, (globalRegistry, { frontendConfiguration }) => {
    const guestFrameRegistry = globalRegistry.get('@neos-project/neos-ui-guest-frame');
    const ckEditorRegistry = globalRegistry.get('ckEditor5');
    const serverFeedbackHandlers = globalRegistry.get('serverFeedbackHandlers');
    const pluginConfiguration = frontendConfiguration['Shel.Neos.Next.Node:ToolBar'] as PluginConfiguration;

    // Create and register the toolbar component
    const Toolbar = makeNextNodeToolbar(pluginConfiguration);
    guestFrameRegistry.set('NodeToolbar/Buttons/AddNextNodeToolBar', Toolbar, 'before AddNode');

    // Register CKEditor plugin which provides the hotkey inside the inline editing mode
    const config = ckEditorRegistry.get('config');
    config.set('nextNode', (config) => {
        config.plugins = config.plugins || [];
        config.plugins.push(CKEditorPlugin);
        return config;
    });

    // Register hotkeys to trigger next node creation from anywhere in the UI
    globalRegistry.get('hotkeys').set('Shel.Neos.Next.Node:createPrimary', {
        description: 'Create next node',
        action: actions.createNextNode,
    });
    globalRegistry.get('hotkeys').set('Shel.Neos.Next.Node:createSecondary', {
        description: 'Create next node',
        action: actions.createNextNode,
    });

    // After a new node was created, we try to focus the first initialized editable inside of it
    serverFeedbackHandlers.set(
        'Neos.Neos.Ui:RenderContentOutOfBand/NextNode',
        async (feedbackPayload: RenderContentOutOfBandFeedbackPayload) => {
            const { contextPath, parentDomAddress } = feedbackPayload;
            // As we don't have a direct reference to the newly created node, we need to find it in the DOM
            const parentElement =
                parentDomAddress && findNodeInGuestFrame(parentDomAddress.contextPath, parentDomAddress.fusionPath);
            const newElement = parentElement.querySelector(`[data-__neos-node-contextpath="${contextPath}"]`);
            if (newElement) {
                const firstInitializedEditable = newElement.querySelector('[data-neos-inline-editor-is-initialized]');
                if (!firstInitializedEditable) {
                    return;
                }
                // Even though the element is marked as initialized, it might not be fully ready to be focused yet, so we wait a bit
                setTimeout(() => {
                    firstInitializedEditable.focus();
                }, 10);
            }
        },
        'after Main',
    );
});
