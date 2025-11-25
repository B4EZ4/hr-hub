import https from 'https';

const options = {
    hostname: 'xvnncnddfnwdonqxaqrs.supabase.co',
    path: '/rest/v1/profiles?select=id,full_name,areas(name),positions(title)&limit=1',
    method: 'GET',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc'
    }
};

console.log('Sending request...');

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let data = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('BODY: ' + data);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
