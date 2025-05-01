import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const s3client = new S3Client();
const dynamodbClient = new DynamoDBClient();

export const handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const params = {
        Bucket: `bill-data-bucket`,
        Key: key,
    };

    try {
        const { Body } = await s3client.send(new GetObjectCommand(params));
        const fileContent = await streamToString(Body);
        const jsonDict = JSON.parse(fileContent);

        
        const bill = jsonDict.bill;

        const item = {
            name: { S: bill.name },
            amount: { N: bill.amount.toString() },
            dueDay: { N: bill.due_day.toString() }
        };

        const dbParams = {
            TableName: 'Bills', 
            Item: item,
        };

        await dynamodbClient.send(new PutItemCommand(dbParams));
        console.log('Bill data successfully inserted into DynamoDB');
    } catch (err) {
        console.error('Error processing S3 event:', err);
        const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
        console.error(message);
        throw new Error(message);
    }
};

// Helper function to convert a stream to a string
const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
