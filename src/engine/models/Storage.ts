import { NodeInstance } from "../contracts";

/**
 * Its a Cloud file Store System 
 * example: AWS S3, Google Cloud Storage, Azure Blob Storage, etc.
 * that stores files like png, jpg, docs, pdf, backups, etc...
 */
class StorageModel implements NodeInstance {
    id: string;
    name: string;
    type: string = "STORAGE";
    
    // key will be bucket name and values will be object file name with file content (content will be randomr for now)
    data: Map<string, {[key: string]: any}> = new Map();

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }

    /**
     * @param bucketName - bucket name to add
     * @returns true if bucket is added successfully, false otherwise
     */
    addBucket(bucketName: string): boolean{
        this.data.set(bucketName, {});
        return true;
    }

    /**
     * @param bucketName - bucket name to add file into
     * @param fileName - file name to add
     * @param fileContent - file content to add
     * @returns true if file is added successfully, false otherwise
     */
    addFileIntoBucket(bucketName: string, fileName: string, fileContent: any): boolean {
        const bucket = this.data.get(bucketName) || {};
        bucket[fileName] = fileContent || fileName
        return true;
    }

    /**
     * @param bucketName - bucket name to remove
     * @returns true if bucket is removed successfully, false otherwise
     */
    removeBucker(bucketName: string): boolean {
        return this.data.delete(bucketName);
    }

    /**
     * @param bucketName - bucket name to remove file from
     * @param fileName - file name to remove
     * @returns true if file is removed successfully, false otherwise
     */
    removeFileFromBucket(bucketName: string, fileName: string): boolean {
        const bucket = this.data.get(bucketName) || {};

        if (bucket && bucket[fileName]) {
            delete bucket[fileName];
            return true;
        }

        return false;
    }
}