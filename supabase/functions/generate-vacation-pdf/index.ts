import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { request_id, status } = await req.json()

    // --- CLIENTE CON PERMISOS DE ADMIN ---
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';

    if (!serviceRoleKey) throw new Error("Falta SERVICE_ROLE_KEY");

    const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // --- OBTENER DATOS ---
    const { data: requestData, error: reqError } = await supabaseClient
      .from('vacation_requests')
      .select(`*, profiles(full_name, user_id, department, position, areas(name), positions(title))`)
      .eq('id', request_id)
      .maybeSingle()

    if (reqError || !requestData) throw new Error("Solicitud no encontrada.");

    // Preparar variables (con respaldo si están vacías)
    const profile = requestData.profiles || {};
    const deptName = profile.areas?.name || profile.department || 'General';
    const posTitle = profile.positions?.title || profile.position || 'General';
    const empNumber = profile.user_id ? String(profile.user_id) : 'S/N';
    
    // Formato de fechas limpio
    const formatDate = (dateStr) => {
        if(!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };
    const startDate = formatDate(requestData.start_date);
    const endDate = formatDate(requestData.end_date);

    // ==========================================
    //      AQUÍ EMPIEZA EL DISEÑO VISUAL
    // ==========================================
    
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage() // A4
    const { width, height } = page.getSize()
    
    // Fuentes
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Colores exactos de tu diseño
    const blueColor = rgb(0.15, 0.35, 0.85) // El azul brillante de tu captura
    const grayLight = rgb(0.96, 0.96, 0.96) // Fondo gris muy clarito
    const grayText = rgb(0.5, 0.5, 0.5)     // Texto secundario
    const black = rgb(0.1, 0.1, 0.1)

    // 1. MARCO AZUL (El borde de toda la hoja)
    page.drawRectangle({
        x: 25,
        y: 25,
        width: width - 50,
        height: height - 50,
        borderColor: blueColor,
        borderWidth: 2,
    })

    // 2. ENCABEZADO (Header)
    let cursorY = height - 70;
    
    // Título Izquierda
    page.drawText('RRHH', { x: 50, y: cursorY, size: 32, font: fontBold, color: blueColor })
    page.drawText('GESTIÓN DE CAPITAL HUMANO', { x: 50, y: cursorY - 15, size: 8, font: fontBold, color: grayText })

    // Título Derecha
    page.drawText('SOLICITUD DE VACACIONES', { x: width - 260, y: cursorY, size: 14, font: fontBold, color: black })
    page.drawText(`ID: ${request_id.slice(0,8).toUpperCase()}`, { x: width - 100, y: cursorY - 12, size: 8, font: font, color: grayText })
    
    // Etiqueta de Estado (Cajita redondeada simulada)
    const statusLabel = status === 'approved' ? 'AUTORIZADO' : 'RECHAZADO';
    const statusColor = status === 'approved' ? rgb(0, 0.6, 0) : rgb(0.9, 0.2, 0.2); // Verde o Rojo
    
    page.drawRectangle({
        x: width - 130,
        y: cursorY - 40,
        width: 80,
        height: 20,
        borderColor: grayText,
        borderWidth: 1,
    })
    page.drawText(statusLabel, { 
        x: width - 124, 
        y: cursorY - 34, 
        size: 9, 
        font: fontBold, 
        color: statusColor 
    })

    cursorY -= 100; // Bajamos para la siguiente sección

    // 3. SECCIÓN: INFORMACIÓN DEL COLABORADOR
    // Línea sutil y título azul
    page.drawText('INFORMACIÓN DEL COLABORADOR', { x: 75, y: cursorY, size: 9, font: fontBold, color: blueColor })
    // Icono simulado (un círculo pequeño)
    page.drawEllipse({ x: 60, y: cursorY + 3, xScale: 3, yScale: 3, borderColor: blueColor, borderWidth: 1.5 })
    
    page.drawLine({ start: { x: 50, y: cursorY - 10 }, end: { x: width - 50, y: cursorY - 10 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })

    // Caja de Datos (Fondo gris muy claro simulado)
    cursorY -= 20;
    const boxTop = cursorY;
    // page.drawRectangle({ x: 40, y: cursorY - 90, width: width - 80, height: 100, color: grayLight }) // Fondo opcional

    cursorY -= 20;
    const col1 = 60;
    const col2 = 300;

    // Fila 1: Nombre y No. Empleado
    page.drawText('NOMBRE COMPLETO', { x: col1, y: cursorY, size: 7, font: fontBold, color: grayText })
    page.drawText('NO. EMPLEADO', { x: col2, y: cursorY, size: 7, font: fontBold, color: grayText })
    cursorY -= 15;
    page.drawText(profile.full_name || '---', { x: col1, y: cursorY, size: 12, font: fontBold, color: black })
    page.drawText(empNumber, { x: col2, y: cursorY, size: 12, font: font, color: black })

    cursorY -= 30;
    // Fila 2: Depto y Puesto
    page.drawText('DEPARTAMENTO', { x: col1, y: cursorY, size: 7, font: fontBold, color: grayText })
    page.drawText('PUESTO', { x: col2, y: cursorY, size: 7, font: fontBold, color: grayText })
    cursorY -= 15;
    page.drawText(deptName, { x: col1, y: cursorY, size: 11, font: font, color: black })
    page.drawText(posTitle, { x: col2, y: cursorY, size: 11, font: font, color: black })


    cursorY -= 60;

    // 4. SECCIÓN: DETALLE DEL PERIODO
    page.drawText('DETALLE DEL PERIODO', { x: 75, y: cursorY, size: 9, font: fontBold, color: blueColor })
    page.drawEllipse({ x: 60, y: cursorY + 3, xScale: 3, yScale: 3, borderColor: blueColor, borderWidth: 1.5 })
    page.drawLine({ start: { x: 50, y: cursorY - 10 }, end: { x: width - 50, y: cursorY - 10 }, thickness: 0.5, color: rgb(0.9, 0.9, 0.9) })

    cursorY -= 40;

    // Cajas de Fechas (Bordes grises suaves)
    const boxY = cursorY - 30;
    const boxH = 60;
    
    // Caja 1: Desde
    page.drawRectangle({ x: 60, y: boxY, width: 140, height: boxH, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 })
    page.drawText('DESDE EL DÍA', { x: 95, y: boxY + 40, size: 7, font: fontBold, color: blueColor })
    page.drawText(startDate, { x: 90, y: boxY + 15, size: 14, font: fontBold, color: black })

    // Caja 2: Hasta
    page.drawRectangle({ x: 220, y: boxY, width: 140, height: boxH, borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 1 })
    page.drawText('HASTA EL DÍA', { x: 255, y: boxY + 40, size: 7, font: fontBold, color: blueColor })
    page.drawText(endDate, { x: 250, y: boxY + 15, size: 14, font: fontBold, color: black })

    // Caja 3: Días (Sin borde, solo texto grande)
    page.drawText('DÍAS SOLICITADOS', { x: 400, y: boxY + 40, size: 7, font: fontBold, color: grayText })
    page.drawText(String(requestData.days_requested), { x: 440, y: boxY + 10, size: 24, font: fontBold, color: grayText })


    cursorY -= 80;

    // 5. SECCIÓN: OBSERVACIONES
    page.drawText('OBSERVACIONES / MOTIVO', { x: 60, y: cursorY, size: 7, font: fontBold, color: grayText })
    cursorY -= 10;
    
    // Caja Grande de Texto
    page.drawRectangle({
        x: 60,
        y: cursorY - 70,
        width: width - 120,
        height: 70,
        borderColor: rgb(0.9, 0.9, 0.9),
        borderWidth: 1,
    })
    
    const comments = requestData.employee_note || "Sin observaciones registradas.";
    page.drawText(comments, { 
        x: 75, 
        y: cursorY - 25, 
        size: 10, 
        font: font, 
        color: rgb(0.4, 0.4, 0.4), // Gris itálico visualmente
        maxWidth: width - 150
    })


    // 6. FIRMAS (Al fondo)
    const firmY = 100; 
    // Línea 1
    page.drawLine({ start: { x: 80, y: firmY }, end: { x: 250, y: firmY }, thickness: 1.5, color: black })
    page.drawText(profile.full_name || 'Firma', { x: 80, y: firmY - 15, size: 9, font: fontBold, maxWidth: 170 })
    page.drawText('FIRMA COLABORADOR', { x: 80, y: firmY - 28, size: 6, font: font, color: grayText })

    // Línea 2
    page.drawLine({ start: { x: 350, y: firmY }, end: { x: 500, y: firmY }, thickness: 1.5, color: black })
    page.drawText('RECURSOS HUMANOS', { x: 350, y: firmY - 15, size: 9, font: fontBold })
    page.drawText('AUTORIZACIÓN', { x: 350, y: firmY - 28, size: 6, font: font, color: grayText })


    // 7. FOOTER
    page.drawText('DEPARTAMENTO DE RECURSOS HUMANOS • DOCUMENTO OFICIAL', { 
        x: 160, 
        y: 35, 
        size: 7, 
        font: fontBold, 
        color: blueColor 
    })

    // ==========================================
    //      FIN DEL DISEÑO - SUBIDA DE ARCHIVO
    // ==========================================

    const pdfBytes = await pdfDoc.save()
    
    // Ruta de archivo: general/solicitud_ID.pdf
    const fileName = `vacaciones/solicitud_${request_id}_${Date.now()}.pdf`

    const { error: uploadError } = await supabaseClient
      .storage
      .from('documents')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: false
      })

    if (uploadError) throw new Error(`Upload falló: ${uploadError.message}`);

    return new Response(
      JSON.stringify({ file_path: fileName, message: "Éxito" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error("Error:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})