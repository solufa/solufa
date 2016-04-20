import { findConfiguration, findConfigurationPath, getRulesDirectories, loadConfigurationFromPath } from "./configuration";
import { ILinterOptions, LintResult } from "./lint";
declare class Linter {
    static VERSION: string;
    static findConfiguration: typeof findConfiguration;
    static findConfigurationPath: typeof findConfigurationPath;
    static getRulesDirectories: typeof getRulesDirectories;
    static loadConfigurationFromPath: typeof loadConfigurationFromPath;
    private fileName;
    private source;
    private options;
    constructor(fileName: string, source: string, options: ILinterOptions);
    lint(): LintResult;
    private containsRule(rules, rule);
    private computeFullOptions();
}
declare namespace Linter {
}
export = Linter;
