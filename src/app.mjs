import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from 'fs';
import path from 'path';

const s3client = new S3Client({});

// Upload file function
async function uploadFile(filePath) {
    const fileContent = fs.readFileSync(filePath); // Reads the file from the path
    const fileName = path.basename(filePath); // Reads the name of the file

    // The parameters of the file and bucket
    const parameters = {
        Bucket: "bill-data-bucket", 
        Key: fileName,
        Body: fileContent
    };

    // Error handling
    try {
        const data = await s3client.send(new PutObjectCommand(parameters));
        console.log("You have successfully uploaded the file!");
    } catch (err) {
        console.error("Error uploading the file: ", err);
    }
}

// Example usage
const filePath = process.argv[2]; // Get the file path from command line arguments
uploadFile(filePath);