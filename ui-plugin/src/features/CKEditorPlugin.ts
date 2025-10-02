import { triggerCreateFirstCandidateEvent } from './Events';

const CKEditorPlugin = (editor: CKEditor): void => {
    // Define Ctrl+Enter keystroke to trigger next node creation from inside the inline editor
    editor.keystrokes.set('Ctrl+Enter', (_event, cancel: () => void) => {
        triggerCreateFirstCandidateEvent();
        cancel();
        // Return false to ensure the event is fully handled
        return false;
    });
};

export default CKEditorPlugin;
