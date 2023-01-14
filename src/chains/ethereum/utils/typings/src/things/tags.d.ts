export declare enum InternalTag {
    earliest = "earliest",
    finalized = "finalized",
    latest = "latest",
    safe = "safe",
    pending = "pending"
}
export declare type Tag = keyof typeof InternalTag;
export declare namespace Tag {
    const earliest = "earliest";
    const finalized = "finalized";
    const latest = "latest";
    const safe = "safe";
    const pending = "pending";
}
//# sourceMappingURL=tags.d.ts.map