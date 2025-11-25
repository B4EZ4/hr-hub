const url = "https://xvnncnddfnwdonqxaqrs.supabase.co/rest/v1/profiles?select=id,full_name,areas(name),positions(title)&limit=1";
const headers = {
    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc"
};

console.log("Fetching from:", url);

try {
    const response = await fetch(url, { headers });
    console.log("Status:", response.status);
    const text = await response.text();
    console.log("Body:", text);
} catch (e) {
    console.error("Error:", e);
}
