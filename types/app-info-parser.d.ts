declare module 'app-info-parser' {
    export default class AppInfoParser {
        constructor(filePath: string);
        parse(): Promise<any>;
    }
}
