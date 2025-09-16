import manifest from '@neos-project/neos-ui-extensibility';
import makeNextNodeToolbar from './features/AddNextNodeToolBar';

manifest('Shel.Neos.Next.Node:ToolBar', {}, (globalRegistry, { frontendConfiguration }) => {
    const guestFrameRegistry = globalRegistry.get('@neos-project/neos-ui-guest-frame');
    const pluginConfiguration = frontendConfiguration['Shel.Neos.Next.Node:ToolBar'];

    const Toolbar = makeNextNodeToolbar(pluginConfiguration);

    guestFrameRegistry.set('NodeToolbar/Buttons/AddNextNodeToolBar', Toolbar, 'before AddNode');
});
