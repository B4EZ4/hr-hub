import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-token',
};
// Configuración de la empresa (luego se puede mover a una tabla)
const COMPANY_INFO = {
    name: 'EMPRESA DEMO S.A. DE C.V.',
    legal_representative: 'Director de RH',
    address: 'Av. Reforma 222, CDMX',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Verificar sesión
        const sessionToken = req.headers.get('x-session-token');
        if (!sessionToken) {
            return new Response(
                JSON.stringify({ error: 'No autorizado' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { data: session } = await supabase
            .from('user_sessions')
            .select('user_id')
            .eq('token', sessionToken)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (!session) {
            return new Response(
                JSON.stringify({ error: 'Sesión inválida o expirada' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Obtener datos del body
        const { contract_id } = await req.json();

        if (!contract_id) {
            return new Response(
                JSON.stringify({ error: 'contract_id es requerido' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Obtener datos del contrato
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select(`
        *,
        user:user_id (
          id,
          full_name,
          email
        )
      `)
            .eq('id', contract_id)
            .single();

        if (contractError || !contract) {
            return new Response(
                JSON.stringify({ error: 'Contrato no encontrado' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Obtener datos adicionales del candidato
        const { data: candidate } = await supabase
            .from('recruitment_candidates')
            .select('rfc, curp, nss, address')
            .eq('email', contract.user.email)
            .maybeSingle();

        // Generar PDF
        const doc = new jsPDF();

        // Configuración de fuente
        doc.setFont("helvetica");

        // Título
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('CONTRATO INDIVIDUAL DE TRABAJO POR TIEMPO INDETERMINADO', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        let y = 35;

        // Introducción
        const intro = `CONTRATO INDIVIDUAL DE TRABAJO POR TIEMPO INDETERMINADO QUE CELEBRAN POR UNA PARTE ${COMPANY_INFO.name}, REPRESENTADA EN ESTE ACTO POR ${COMPANY_INFO.legal_representative}, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ "EL PATRÓN", Y POR LA OTRA ${contract.user.full_name.toUpperCase()}, A QUIEN EN LO SUCESIVO SE LE DENOMINARÁ "EL TRABAJADOR", AL TENOR DE LAS SIGUIENTES DECLARACIONES Y CLÁUSULAS:`;

        const introLines = doc.splitTextToSize(intro, 180);
        doc.text(introLines, 15, y);
        y += introLines.length * 5 + 10;

        // DECLARACIONES
        doc.setFont(undefined, 'bold');
        doc.text('DECLARACIONES', 15, y);
        y += 8;

        doc.setFont(undefined, 'normal');
        doc.text('I. DECLARA "EL PATRÓN":', 15, y);
        y += 6;
        doc.text(`a) Ser una sociedad legalmente constituida conforme a las leyes mexicanas.`, 20, y);
        y += 5;
        doc.text(`b) Tener su domicilio en: ${COMPANY_INFO.address}.`, 20, y);
        y += 5;
        doc.text(`c) Que requiere los servicios de una persona para desempeñar el puesto de ${contract.position}.`, 20, y);
        y += 10;

        doc.text('II. DECLARA "EL TRABAJADOR":', 15, y);
        y += 6;
        doc.text(`a) Llamarse como ha quedado escrito, ser de nacionalidad mexicana.`, 20, y);
        y += 5;
        doc.text(`b) Tener su domicilio en: ${candidate?.address || 'México'}.`, 20, y);
        y += 5;
        doc.text(`c) Con Registro Federal de Contribuyentes (RFC): ${candidate?.rfc || 'N/A'}.`, 20, y);
        y += 5;
        doc.text(`d) Con Clave Única de Registro de Población (CURP): ${candidate?.curp || 'N/A'}.`, 20, y);
        y += 5;
        doc.text(`e) Con Número de Seguridad Social (NSS): ${candidate?.nss || 'N/A'}.`, 20, y);
        y += 12;

        // CLÁUSULAS
        doc.setFont(undefined, 'bold');
        doc.text('CLÁUSULAS', 15, y);
        y += 8;

        doc.setFont(undefined, 'normal');

        // PRIMERA
        doc.setFont(undefined, 'bold');
        doc.text('PRIMERA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const primera = `"EL PATRÓN" contrata a "EL TRABAJADOR" por tiempo indeterminado para prestar sus servicios personales y subordinados con el puesto de ${contract.position}.`;
        const primeraLines = doc.splitTextToSize(primera, 150);
        doc.text(primeraLines, 38, y);
        y += primeraLines.length * 5 + 5;

        // SEGUNDA
        doc.setFont(undefined, 'bold');
        doc.text('SEGUNDA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const segunda = `"EL TRABAJADOR" se obliga a prestar sus servicios en el domicilio de "EL PATRÓN" o en el lugar que este último le asigne.`;
        const segundaLines = doc.splitTextToSize(segunda, 150);
        doc.text(segundaLines, 38, y);
        y += segundaLines.length * 5 + 5;

        // TERCERA
        doc.setFont(undefined, 'bold');
        doc.text('TERCERA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const tercera = `La duración de la jornada de trabajo será de 48 horas semanales, distribuidas de acuerdo a las necesidades de "EL PATRÓN", disfrutando de un día de descanso por cada seis días de trabajo.`;
        const terceraLines = doc.splitTextToSize(tercera, 150);
        doc.text(terceraLines, 38, y);
        y += terceraLines.length * 5 + 5;

        // CUARTA
        doc.setFont(undefined, 'bold');
        doc.text('CUARTA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const salario = contract.salary ? `$${contract.salary.toLocaleString('es-MX')}` : '$0';
        const cuarta = `"EL TRABAJADOR" percibirá por la prestación de sus servicios un salario mensual bruto de ${salario} MXN, el cual será pagado los días 15 y 30 de cada mes.`;
        const cuartaLines = doc.splitTextToSize(cuarta, 150);
        doc.text(cuartaLines, 38, y);
        y += cuartaLines.length * 5 + 5;

        // QUINTA
        doc.setFont(undefined, 'bold');
        doc.text('QUINTA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const quinta = `"EL TRABAJADOR" disfrutará de las vacaciones, prima vacacional y aguinaldo conforme a lo establecido en la Ley Federal del Trabajo.`;
        const quintaLines = doc.splitTextToSize(quinta, 150);
        doc.text(quintaLines, 38, y);
        y += quintaLines.length * 5 + 5;

        // SEXTA
        doc.setFont(undefined, 'bold');
        doc.text('SEXTA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const sexta = `"EL PATRÓN" inscribirá a "EL TRABAJADOR" ante el Instituto Mexicano del Seguro Social (IMSS).`;
        const sextaLines = doc.splitTextToSize(sexta, 150);
        doc.text(sextaLines, 38, y);
        y += sextaLines.length * 5 + 5;

        // SÉPTIMA
        doc.setFont(undefined, 'bold');
        doc.text('SÉPTIMA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const septima = `Ambas partes convienen que lo no previsto en este contrato se regirá por lo dispuesto en la Ley Federal del Trabajo.`;
        const septimaLines = doc.splitTextToSize(septima, 150);
        doc.text(septimaLines, 38, y);
        y += septimaLines.length * 5 + 5;

        // OCTAVA
        doc.setFont(undefined, 'bold');
        doc.text('OCTAVA.-', 15, y);
        doc.setFont(undefined, 'normal');
        const startDate = new Date(contract.start_date).toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        const octava = `El presente contrato entra en vigor a partir del día ${startDate}.`;
        const octavaLines = doc.splitTextToSize(octava, 150);
        doc.text(octavaLines, 38, y);
        y += octavaLines.length * 5 + 15;

        // Firmas
        if (y > 240) {
            doc.addPage();
            y = 20;
        }

        doc.setFont(undefined, 'bold');
        doc.text('"EL PATRÓN"', 40, y);
        doc.text('"EL TRABAJADOR"', 130, y);
        y += 20;
        doc.line(25, y, 85, y);
        doc.line(115, y, 175, y);
        y += 5;
        doc.setFontSize(9);
        doc.text(COMPANY_INFO.legal_representative, 55, y, { align: 'center' });
        doc.text(contract.user.full_name, 145, y, { align: 'center' });

        // Convertir a buffer
        const pdfBuffer = doc.output('arraybuffer');
        const pdfArray = new Uint8Array(pdfBuffer);

        // Subir a Storage
        const fileName = `${contract.user_id}/${contract.contract_number}.pdf`;
        const { error: uploadError } = await supabase.storage
            .from('contracts')
            .upload(fileName, pdfArray, {
                contentType: 'application/pdf',
                upsert: true
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return new Response(
                JSON.stringify({ error: 'Error al subir PDF', details: uploadError }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('contracts')
            .getPublicUrl(fileName);

        // Actualizar contrato con file_url
        const { error: updateError } = await supabase
            .from('contracts')
            .update({ file_url: fileName })
            .eq('id', contract_id);

        if (updateError) {
            console.error('Update error:', updateError);
            return new Response(
                JSON.stringify({ error: 'Error al actualizar contrato' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Insertar en documents para que aparezca en el módulo Documentos
        const { error: docError } = await supabase
            .from('documents')
            .insert({
                title: `Contrato Laboral - ${contract.contract_number}`,
                category: 'contrato',
                description: `Contrato individual de trabajo por tiempo indeterminado`,
                file_path: fileName,
                employee_id: contract.user_id,
                uploaded_by: session.user_id,
                is_public: false,
                estado: 'validado',
            });

        if (docError) {
            console.error('Document insert error:', docError);
            // No falla si no se puede insertar en documents, pero lo reporta
        }

        return new Response(
            JSON.stringify({
                success: true,
                file_url: urlData.publicUrl,
                message: 'Contrato generado y registrado exitosamente'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error: any) {
        console.error('Error:', error);
        return new Response(
            JSON.stringify({ error: 'Error interno del servidor', details: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
