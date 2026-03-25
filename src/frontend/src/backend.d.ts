import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ClassificationRecord {
    id: bigint;
    classificationLabel: Label;
    message: string;
    timestamp: bigint;
    confidence: number;
}
export enum Label {
    ham = "ham",
    spam = "spam"
}
export interface backendInterface {
    addRecord(message: string, classificationLabel: Label, confidence: number): Promise<void>;
    clearHistory(): Promise<void>;
    getAllRecords(): Promise<Array<ClassificationRecord>>;
    seedDemoData(): Promise<void>;
}
