import { LuaError } from './LuaError';
import { Table } from './Table';
import { Config, LuaType } from './utils';
interface Script {
    exec: () => LuaType;
}
declare function createEnv(config?: Config): {
    parse: (script: string) => Script;
    parseFile: (path: string) => Script;
    loadLib: (name: string, value: Table) => void;
};
import * as utils from './utils';
export { LuaError, Table, createEnv, utils };
//# sourceMappingURL=index.d.ts.map