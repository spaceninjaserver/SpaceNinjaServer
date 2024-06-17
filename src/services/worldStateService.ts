import { WorldState } from "@/src/models/worldStateModel";

export const createWorldState = async () => {
    const worldState = new WorldState();
    await worldState.save();
    return worldState;
};

export const getWorldState = async () => {
    let ws = await WorldState.findOne();
    if (!ws) {
        ws = await createWorldState();
    }

    return ws;
};
