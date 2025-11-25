import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xvnncnddfnwdonqxaqrs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bm5jbmRkZm53ZG9ucXhhcXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODMwMjcsImV4cCI6MjA3ODg1OTAyN30.CNWgWGmLrC6namgybBWCElphVBjy4w168ec-Bn8p2Vc';
const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log('--- Testing Profiles Query ---');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, areas(name), positions(title)')
        .limit(1);

    if (profilesError) {
        console.error('Profiles Error:', JSON.stringify(profilesError, null, 2));
    } else {
        console.log('Profiles Data:', profiles);
    }

    console.log('\n--- Testing Attendance Query ---');
    const { data: attendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*, profiles:profiles!attendance_records_user_id_fkey(full_name, areas(name), positions(title))')
        .limit(1);

    if (attendanceError) {
        console.error('Attendance Error:', JSON.stringify(attendanceError, null, 2));
    } else {
        console.log('Attendance Data:', attendance);
    }
}

debug();
