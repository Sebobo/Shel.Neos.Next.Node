export const CREATE_NEXT_NODE_EVENT = 'shelNeosNextNode:createFirstCandidate';

export const triggerCreateFirstCandidateEvent = (): void => {
    const guestFrame: HTMLIFrameElement = globalThis.document.querySelector('[name="neos-content-main"]');
    if (guestFrame && guestFrame.contentWindow) {
        guestFrame.contentWindow.dispatchEvent(new CustomEvent(CREATE_NEXT_NODE_EVENT));
    }
};
