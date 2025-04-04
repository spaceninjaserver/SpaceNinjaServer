export const parallelForeach = async <T>(data: T[], op: (datum: T) => Promise<void>): Promise<void> => {
    const promises: Promise<void>[] = [];
    for (const datum of data) {
        promises.push(op(datum));
    }
    await Promise.all(promises);
};
