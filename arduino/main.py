# main.py
import time
import machine

# --- INICIO SEGURO (ANTI-BUCLE) ---
print("--- INICIO DEL SISTEMA ---")
print("Tienes 2 segundos para presionar Ctrl+C si necesitas editar...")
time.sleep(2)
print("Iniciando lógica principal...")
# ----------------------------------

import urequests
import ujson
from machine import I2C, Pin, UART
from i2c_lcd import I2cLcd
from as608 import AS608

# --- CONFIGURACIÓN SUPABASE ---
SUPABASE_URL = "https://dzwxepnmyoawcikkldof.supabase.co/functions/v1/biometric-api"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d3hlcG5teW9hd2Npa2tsZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjQ5NjIsImV4cCI6MjA3OTYwMDk2Mn0.GZvX51vt9FiYnzHtS1WecV46ImuVsh1jQJlT-ZQhJnE"
DEVICE_ID = "ESP32-001"

# --- PINES ---
# Sensor Huella (UART2): TX(17) -> Sensor Verde, RX(16) -> Sensor Blanco
try:
    uart = UART(2, baudrate=57600, tx=17, rx=16)
except Exception as e:
    print("Error iniciando UART:", e)

# LCD I2C
I2C_ADDR = 0x27
try:
    i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=100000)
except Exception as e:
    print("Error iniciando I2C:", e)

# --- OBJETOS GLOBALES ---
lcd = None
finger = None
enroll_id = 0
last_poll = 0
POLL_INTERVAL = 5000 # ms

# Estados
IDLE = 0
ENROLLING = 1
current_state = IDLE

def setup():
    global lcd, finger
    
    # 1. Inicializar LCD
    try:
        lcd = I2cLcd(i2c, I2C_ADDR, 2, 16)
        lcd.backlight_on(True)
        lcd.clear()
        lcd.putstr("Sistema Init...")
    except Exception as e:
        print("Error LCD (verificar dirección I2C):", e)
        # Si falla LCD, seguimos por consola
    
    time.sleep(1)

    # 2. Inicializar Sensor
    try:
        finger = AS608(uart)
        if finger.verify_password():
            print("Sensor de huella: OK")
            if lcd: 
                lcd.move_to(0, 1)
                lcd.putstr("Sensor OK")
        else:
            print("Sensor de huella: NO ENCONTRADO")
            if lcd:
                lcd.move_to(0, 1)
                lcd.putstr("Error Sensor")
            # Bucle de seguridad si no hay sensor (opcional)
            # while True: time.sleep(1) 
    except Exception as e:
        print("Excepción al iniciar sensor:", e)

    time.sleep(1)
    if lcd:
        lcd.clear()
        lcd.putstr("Listo")

# --- FUNCIONES DE API SUPABASE ---

def poll_commands():
    global current_state, enroll_id
    url = f"{SUPABASE_URL}/poll-commands?device_id={DEVICE_ID}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}"}
    
    try:
        res = urequests.get(url, headers=headers)
        if res.status_code == 200:
            data = res.json()
            cmd = data.get("command")
            if cmd:
                cmd_type = cmd.get("command_type")
                cmd_id = cmd.get("id")
                
                if cmd_type == "ENROLL":
                    payload = cmd.get("payload", {})
                    enroll_id = payload.get("biometric_id", 0)
                    print(f"Comando recibido: ENROLL ID {enroll_id}")
                    
                    current_state = ENROLLING
                    if lcd:
                        lcd.clear()
                        lcd.putstr(f"Enrolar ID: {enroll_id}")
                    
                    update_command_status(cmd_id, "processing", "")
        res.close()
    except Exception as e:
        print("Error polling:", e)

def update_command_status(cmd_id, status, result=""):
    url = f"{SUPABASE_URL}/command-status"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    data = {"command_id": cmd_id, "status": status}
    if result:
        data["result"] = result
        
    try:
        res = urequests.post(url, headers=headers, json=data)
        res.close()
    except Exception as e:
        print("Error status update:", e)

def send_attendance(bio_id):
    url = f"{SUPABASE_URL}/attendance"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    data = {"biometric_id": bio_id, "device_id": DEVICE_ID}
    
    try:
        print(f"Enviando asistencia ID: {bio_id}...")
        res = urequests.post(url, headers=headers, json=data)
        
        if res.status_code == 200:
            res_data = res.json()
            name = res_data.get("name", "Usuario")
            tipo = res_data.get("type", "Log")
            
            print(f"Respuesta: {tipo} - {name}")
            if lcd:
                lcd.move_to(0, 1)
                lcd.putstr(f"{tipo} {name}"[:16])
        else:
            print("Error HTTP:", res.status_code)
            if lcd:
                lcd.move_to(0, 1)
                lcd.putstr("Error Red")
        res.close()
    except Exception as e:
        print("Error attendance:", e)
        if lcd:
            lcd.move_to(0, 1)
            lcd.putstr("Error HTTP")

# --- LÓGICA DE HUELLA ---

def check_finger():
    if not finger: return

    # 1. Tomar imagen
    if finger.get_image() != 0x00:
        return

    # 2. Convertir a template
    if finger.image_2_tz(1) != 0x00:
        return

    # 3. Buscar
    found_id = finger.finger_fast_search()
    
    if found_id == -1:
        if lcd:
            lcd.clear()
            lcd.putstr("No encontrado")
        print("Huella no encontrada en base de datos local.")
        time.sleep(1.5)
        if lcd:
            lcd.clear()
            lcd.putstr("Listo")
        return

    # Encontrado
    print(f"¡Huella encontrada! ID Interno #{found_id}")
    if lcd:
        lcd.clear()
        lcd.putstr(f"ID: {found_id}")
    
    send_attendance(found_id)
    
    time.sleep(2)
    if lcd:
        lcd.clear()
        lcd.putstr("Listo")

def handle_enroll():
    global current_state
    if not finger: 
        current_state = IDLE
        return

    # Paso 1
    if lcd:
        lcd.move_to(0, 1)
        lcd.putstr("Poner dedo...")
    
    while finger.get_image() != 0x00:
        time.sleep_ms(100)
    
    if finger.image_2_tz(1) != 0x00:
        if lcd: lcd.putstr("Err IMG1"); time.sleep(1)
        return

    # Paso 2
    if lcd:
        lcd.clear(); lcd.putstr("Quitar dedo")
    time.sleep(2)
    while finger.get_image() == 0x00:
        time.sleep_ms(100)

    # Paso 3
    if lcd:
        lcd.clear(); lcd.putstr("Poner mismo")
    while finger.get_image() != 0x00:
        time.sleep_ms(100)

    if finger.image_2_tz(2) != 0x00:
        if lcd: lcd.putstr("Err IMG2"); time.sleep(1)
        return

    # Paso 4
    if finger.create_model() != 0x00:
        if lcd: lcd.putstr("Err Model"); time.sleep(1)
        return
        
    # Paso 5
    if finger.store_model(enroll_id) == 0x00:
        if lcd: lcd.clear(); lcd.putstr("Exito!")
        print(f"Huella guardada en ID {enroll_id}")
        current_state = IDLE
    else:
        if lcd: lcd.clear(); lcd.putstr("Fallo Store")
        
    time.sleep(2)
    if lcd: lcd.clear(); lcd.putstr("Listo")

# --- EJECUCIÓN PRINCIPAL ---

setup()

print("Iniciando bucle principal...")

while True:
    now = time.ticks_ms()
    
    try:
        # 1. Polling de comandos
        if current_state == IDLE:
            if time.ticks_diff(now, last_poll) > POLL_INTERVAL:
                poll_commands()
                last_poll = time.ticks_ms()
                
            check_finger()
            
        # 2. Enrollment
        elif current_state == ENROLLING:
            handle_enroll()
            
    except Exception as e:
        print("Error en bucle principal:", e)
        # Pequeña pausa para no saturar si hay error constante
        time.sleep(1)
        
    time.sleep_ms(50)