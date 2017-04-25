import { Rule, Parser, Issue } from 'template-lint';
import { StartTagLocationInfo } from 'parse5';
/**
 *  Rule to ensure root element is the template element
 */
export declare class SlotRule extends Rule {
    controllers: string[];
    slots: Array<{
        name: string;
        loc: StartTagLocationInfo;
    }>;
    constructor(controllers?: string[]);
    init(parser: Parser): void;
    finalise(): Issue[];
}
