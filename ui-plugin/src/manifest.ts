import manifest from '@neos-project/neos-ui-extensibility';

import makeNextNodeToolbar from './features/AddNextNodeToolBar';
import CKEditorPlugin from './features/CKEditorPlugin';
import { actions } from './actions';

manifest('Shel.Neos.Next.Node:ToolBar', {}, (globalRegistry, { frontendConfiguration }) => {
    const guestFrameRegistry = globalRegistry.get('@neos-project/neos-ui-guest-frame');
    const ckEditorRegistry = globalRegistry.get('ckEditor5');
    const pluginConfiguration = frontendConfiguration['Shel.Neos.Next.Node:ToolBar'];

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
});
