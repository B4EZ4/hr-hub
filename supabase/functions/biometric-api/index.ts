import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const url = new URL(req.url);
        const path = url.pathname.split('/').pop();

        // Endpoint: /poll-commands?device_id=ESP32-001
        if (path === 'poll-commands') {
            const device_id = url.searchParams.get('device_id');
            if (!device_id) throw new Error('Missing device_id');

            const { data, error } = await supabaseClient
                .from('device_commands')
                .select('*')
                .eq('device_id', device_id)
                .eq('status', 'pending')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows found"
                throw error;
            }

            if (!data) {
                return new Response(JSON.stringify({ command: null }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 200
                });
            }

            // Mark as processing
            await supabaseClient
                .from('device_commands')
                .update({ status: 'processing' })
                .eq('id', data.id);

            return new Response(JSON.stringify({ command: data }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Endpoint: /command-status
        if (path === 'command-status') {
            const { command_id, status, result } = await req.json();

            const updateData: any = { status };
            if (result) {
                updateData.payload = { ...updateData.payload, result };
            }

            const { error } = await supabaseClient
                .from('device_commands')
                .update(updateData)
                .eq('id', command_id);

            if (error) throw error;

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        // Endpoint: /attendance
        if (path === 'attendance') {
            const { biometric_id, device_id } = await req.json();
            if (!biometric_id) throw new Error('Missing biometric_id');

            // 1. Get user_id and work schedule from biometric_id
            const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('user_id, full_name, position_id, positions(work_start_time, work_end_time)')
                .eq('biometric_id', biometric_id)
                .single();

            if (profileError || !profile) {
                throw new Error('User not found for this biometric ID');
            }

            // Get work schedule from position or use defaults
            const positions = Array.isArray(profile.positions) ? profile.positions[0] : profile.positions;
            const scheduledStart = positions?.work_start_time || '09:00:00';
            const scheduledEnd = positions?.work_end_time || '18:00:00';

            // 2. Check existing attendance for today (Mexico City timezone)
            const now = new Date();
            // Mexico City is GMT-6 (or GMT-5 during DST, but we'll use GMT-6 for consistency)
            // Calculate Mexico time by subtracting 6 hours from UTC
            const mexicoOffsetMinutes = -6 * 60; // -360 minutes
            const mexicoTime = new Date(now.getTime() + (mexicoOffsetMinutes * 60 * 1000));
            const today = mexicoTime.toISOString().split('T')[0];

            console.log('UTC now:', now.toISOString());
            console.log('Mexico time:', mexicoTime.toISOString());
            console.log('Today date (Mexico):', today);

            const { data: existing } = await supabaseClient
                .from('attendance_records')
                .select('*')
                .eq('user_id', profile.user_id)
                .eq('attendance_date', today)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            let result;

            if (existing && !existing.check_out) {
                // Update as check_out
                const { error } = await supabaseClient
                    .from('attendance_records')
                    .update({
                        check_out: now.toISOString(),
                        status: 'completado'
                    })
                    .eq('id', existing.id);

                if (error) throw error;
                result = { type: 'Salida', timestamp: now, name: profile.full_name };
            } else {
                // Insert new check_in
                const { error } = await supabaseClient
                    .from('attendance_records')
                    .insert({
                        user_id: profile.user_id,
                        attendance_date: today,
                        scheduled_start: scheduledStart,
                        scheduled_end: scheduledEnd,
                        check_in: now.toISOString(),
                        status: 'presente',
                        notes: `Biometric: ${device_id || 'unknown'}`
                    });

                if (error) throw error;
                result = { type: 'Entrada', timestamp: now, name: profile.full_name };
            }

            return new Response(JSON.stringify(result), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            });
        }

        throw new Error('Invalid path');

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }
});
