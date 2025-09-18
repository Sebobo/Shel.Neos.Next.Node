import { triggerCreateFirstCandidateEvent } from './Events';

export default function CKEditorPlugin(editor) {
    // Define Ctrl+Enter keystroke to trigger next node creation from inside the inline editor
    editor.keystrokes.set('Ctrl+Enter', (event, cancel) => {
        triggerCreateFirstCandidateEvent();
        cancel();
        // Return false to ensure the event is fully handled
        return false;
    });
}
