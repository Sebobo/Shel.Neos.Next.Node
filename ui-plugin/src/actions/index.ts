import { createAction } from 'redux-actions';
import { triggerCreateFirstCandidateEvent } from '../features/Events';

export const actionTypes = {
    CREATE_NEXT_NODE: 'CREATE_NEXT_NODE',
};

const createNextNode = createAction(actionTypes.CREATE_NEXT_NODE, () => {
    triggerCreateFirstCandidateEvent();
});

export const actions = {
    createNextNode,
};
