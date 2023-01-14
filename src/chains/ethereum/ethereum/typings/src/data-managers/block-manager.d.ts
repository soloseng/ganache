/// <reference types="node" />
import Manager from "./manager";
import { Tag, QUANTITY } from "@ganache/ethereum-utils";
import { Quantity, Data } from "@ganache/utils";
import type { Common } from "@ethereumjs/common";
import Blockchain from "../blockchain";
import { Block } from "@ganache/ethereum-block";
import { GanacheLevelUp } from "../database";
export default class BlockManager extends Manager<Block> {
    #private;
    /**
     * The earliest block
     */
    earliest: Block;
    /**
     * The latest block
     */
    latest: Block;
    /**
     * The next block
     */
    pending: Block;
    static initialize(blockchain: Blockchain, common: Common, blockIndexes: GanacheLevelUp, base: GanacheLevelUp): Promise<BlockManager>;
    constructor(blockchain: Blockchain, common: Common, blockIndexes: GanacheLevelUp, base: GanacheLevelUp);
    static rawFromJSON(json: any, common: Common): Buffer;
    fromFallback: (tagOrBlockNumber: string | Quantity) => Promise<Buffer>;
    getBlockByTag(tag: Tag): Block;
    getEffectiveNumber(tagOrBlockNumber?: QUANTITY | Buffer | Tag): Quantity;
    getNumberFromHash(hash: string | Buffer | Tag): Promise<Buffer>;
    getByHash(hash: string | Buffer | Tag): Promise<Block>;
    getRawByBlockNumber(blockNumber: Quantity): Promise<Buffer>;
    get(tagOrBlockNumber: QUANTITY | Buffer | Tag): Promise<Block>;
    /**
     * Writes the block object to the underlying database.
     * @param block -
     */
    putBlock(number: Buffer, hash: Data, serialized: Buffer): Promise<void>;
    /**
     * Updates the "latest" index to point to the given number.
     * @param number the block number of the latest block
     */
    updateLatestIndex(number: Buffer): Promise<void>;
    /**
     * Updates the this.latest and this.earliest properties with data
     * from the database.
     */
    updateTaggedBlocks(): Promise<void>;
}
//# sourceMappingURL=block-manager.d.ts.map