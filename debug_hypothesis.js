import https from 'https';

const headers = {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc'
};

function makeRequest(label, path) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'xvnncnddfnwdonqxaqrs.supabase.co',
            path: path,
            method: 'GET',
            headers: headers
        };

        console.log(`\n--- TEST: ${label} ---`);
        console.log(`URL: ${path}`);

        const req = https.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.log(`ERROR BODY: ${data}`);
                } else {
                    console.log(`SUCCESS (Body length: ${data.length})`);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Request error: ${e.message}`);
            resolve();
        });
        req.end();
    });
}

async function runTests() {
    // 1. Test Profiles with Relations (The one failing)
    // If this fails, it proves the schema (areas/positions) is missing or inaccessible.
    await makeRequest(
        'Profiles WITH Relations (Current Code)',
        '/rest/v1/profiles?select=id,full_name,areas(name),positions(title)&limit=1'
    );

    // 2. Test Profiles WITHOUT Relations
    // If this works, it confirms the table 'profiles' exists but the relations 'areas'/'positions' are the problem.
    await makeRequest(
        'Profiles WITHOUT Relations (Control Test)',
        '/rest/v1/profiles?select=id,full_name&limit=1'
    );

    // 3. Test Attendance with Comma Order (User's suspect)
    // Using a simple select to isolate the order clause.
    await makeRequest(
        'Attendance with Comma Order',
        '/rest/v1/attendance_records?select=id&order=attendance_date.desc,check_in.asc&limit=1'
    );

    // 4. Test Attendance with Multiple Order Params (User's fix)
    await makeRequest(
        'Attendance with Multiple Order Params',
        '/rest/v1/attendance_records?select=id&order=attendance_date.desc&order=check_in.asc&limit=1'
    );

    // 5. Test Attendance with Relations (Current Code)
    await makeRequest(
        'Attendance WITH Relations',
        '/rest/v1/attendance_records?select=*,profiles(full_name,areas(name),positions(title))&limit=1'
    );
}

runTests();
