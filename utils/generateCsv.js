// utils/generateCSV.js
import { createObjectCsvStringifier } from 'csv-writer';

const generateCSV = (waitlistData) => {
    console.log("Generating CSV".grey);

    const csvStringifier = createObjectCsvStringifier({
        header: [
            { id: 'name', title: 'Name' },
            { id: 'email', title: 'Email' },
            { id: 'spaceLocation', title: 'Space Location' },
            { id: 'phoneNumber', title: 'Phone Number' },
        ]
    });

    const header = csvStringifier.getHeaderString();
    const records = csvStringifier.stringifyRecords(waitlistData);
    const csvContent = header + records;

    return csvContent;
}

export default generateCSV;
