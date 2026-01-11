declare module 'adbkit-apkreader' {
    export class ApkReader {
        static open(file: string): Promise<ApkReader>;
        readManifest(): Promise<any>;
    }
    export default ApkReader;
}
