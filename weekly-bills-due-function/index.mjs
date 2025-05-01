import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamodbClient = new DynamoDBClient({});

function getNextTwoFridays() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilNextFriday = dayOfWeek === 5 ? 0 : (5 - dayOfWeek + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilNextFriday);
    const fridayAfterNext = new Date(nextFriday);
    fridayAfterNext.setDate(nextFriday.getDate() + 7);

    return [nextFriday.toISOString(), fridayAfterNext.toISOString()];
}


export async function handler(event) {
    const today = new Date(); // Get the current date
    console.log(`Today's date is: ${today.toISOString()}`);   // Log the current date

    const params = {
        TableName: "Bills"
    };

   try {
        const data = await dynamodbClient.send(new ScanCommand(params));    // Scan the DynamoDB table
        
        // Add a fullDueDate property to each bill object
        const billsWithFullDueDate = data.Items.map(bill => {
            const dueDay = bill.dueDay.N; //dueDay is stored as a Number in DynamoDB
            const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
            if (dueDate < today) {
                dueDate.setMonth(dueDate.getMonth() + 1);
            }
            return {
                ...bill,
                fullDueDate: dueDate.toISOString(),
            };
        });

        console.log(billsWithFullDueDate);   // Log the bills with full due dates

        const [upcomingFriday, fridayAfterNext] = getNextTwoFridays();
        console.log(`The upcoming Friday is: ${upcomingFriday}`);
        console.log(`The Friday after next is: ${fridayAfterNext}`);

        // Convert upcomingFriday and fridayAfterNext back to Date objects for comparison
        const upcomingFridayDate = new Date(upcomingFriday);
        const fridayAfterNextDate = new Date(fridayAfterNext);

        // Filter bills due between the upcoming Friday and the Friday after next
        const billsDueBetweenFridays = billsWithFullDueDate.filter(bill => {
            const billDueDate = new Date(bill.fullDueDate);
            return billDueDate >= upcomingFridayDate && billDueDate < fridayAfterNextDate;
        });

        // Log the filtered bills to CloudWatch
        console.log(`Bills due from ${upcomingFriday} to ${fridayAfterNext}:`, billsDueBetweenFridays);

        
        return {
            statusCode: 200,
            body: JSON.stringify(billsWithFullDueDate),
        };
        
    } catch (error) {
        console.error(`Error querying DynamoDB: ${error}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to query DynamoDB" }),
        };
    }
}