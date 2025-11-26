# main.py
import time
import machine

# --- INICIO SEGURO ---
print("--- INICIO DEL SISTEMA ---")
print("Tienes 2 segundos para presionar Ctrl+C...")
time.sleep(2)
print("Iniciando lógica principal...")
# ---------------------

import urequests
import ujson
from machine import I2C, Pin, UART
from i2c_lcd import I2cLcd
from as608 import AS608

# --- CONFIGURACIÓN ---
SUPABASE_URL = "https://dzwxepnmyoawcikkldof.supabase.co/functions/v1/biometric-api"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d3hlcG5teW9hd2Npa2tsZG9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMjQ5NjIsImV4cCI6MjA3OTYwMDk2Mn0.GZvX51vt9FiYnzHtS1WecV46ImuVsh1jQJlT-ZQhJnE"
DEVICE_ID = "ESP32-001"

# --- PINES ---
try:
    uart = UART(2, baudrate=57600, tx=16, rx=17)
except Exception as e:
    print("Error UART:", e)

# LCD I2C
I2C_ADDR = 0x27
try:
    i2c = I2C(0, scl=Pin(22), sda=Pin(21), freq=100000)
except Exception as e:
    print("Error I2C:", e)

# --- GLOBALES ---
lcd = None
finger = None
enroll_id = 0
last_poll = 0
POLL_INTERVAL = 5000 

# Estados
IDLE = 0
ENROLLING = 1
current_state = IDLE

# --- FUNCIONES DE UI (AYUDA VISUAL) ---
def lcd_print(linea1, linea2=""):
    """Función auxiliar para escribir rápido en LCD"""
    if lcd:
        lcd.clear()
        lcd.putstr(linea1)
        if linea2:
            lcd.move_to(0, 1)
            lcd.putstr(linea2)

def mostrar_espera():
    """Muestra la pantalla por defecto de espera"""
    # Linea 0: Modo Actual, Linea 1: Instrucción
    lcd_print("MODO ASISTENCIA", "Coloque Dedo...")

def setup():
    global lcd, finger
    
    # 1. LCD
    try:
        lcd = I2cLcd(i2c, I2C_ADDR, 2, 16)
        lcd.backlight_on(True)
        lcd_print("Iniciando...", "Cargando Sistema")
    except Exception as e:
        print("Error LCD:", e)
    
    time.sleep(1)

    # 2. Sensor
    try:
        finger = AS608(uart)
        if finger.verify_password():
            print("Sensor OK")
            lcd_print("Chequeo Sistema", "Sensor: OK")
        else:
            print("Sensor NO encontrado")
            lcd_print("ERROR FATAL", "Sensor No Hallado")
            # while True: time.sleep(1) # Descomentar en producción
    except Exception as e:
        print("Excepción Sensor:", e)
        lcd_print("Excepcion", "Verificar Cables")

    time.sleep(1.5)
    mostrar_espera()

# --- COMUNICACIÓN SUPABASE ---

def poll_commands():
    global current_state, enroll_id
    url = f"{SUPABASE_URL}/poll-commands?device_id={DEVICE_ID}"
    headers = {"Authorization": f"Bearer {SUPABASE_KEY}"}
    
    try:
        # No imprimimos en LCD aquí para no parpadear la pantalla
        # a menos que encontremos algo.
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
                    print(f"Comando ENROLL ID {enroll_id}")
                    
                    current_state = ENROLLING
                    lcd_print("NUEVO REGISTRO", f"ID Asignado: {enroll_id}")
                    time.sleep(1)
                    
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
    if result: data["result"] = result
        
    try:
        res = urequests.post(url, headers=headers, json=data)
        res.close()
    except Exception as e:
        print("Error status update:", e)

def send_attendance(bio_id):
    # Feedback inmediato al usuario
    lcd_print("Procesando...", "Espere por favor")
    
    url = f"{SUPABASE_URL}/attendance"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {SUPABASE_KEY}"
    }
    data = {"biometric_id": bio_id, "device_id": DEVICE_ID}
    
    try:
        print(f"Enviando ID: {bio_id}...")
        res = urequests.post(url, headers=headers, json=data)
        
        if res.status_code == 200:
            res_data = res.json()
            name = res_data.get("name", "Usuario")
            tipo = res_data.get("type", "Registro")
            
            # Cortamos nombres largos para que quepan en 16 chars
            nombre_corto = name[:16]
            
            print(f"Resp: {tipo} - {name}")
            lcd_print(f"HOLA {nombre_corto}", "Registro Exitoso")
        else:
            print("Error HTTP:", res.status_code)
            lcd_print("Error Servidor", f"Codigo: {res.status_code}")
        res.close()
    except Exception as e:
        print("Error attendance:", e)
        lcd_print("Error de Red", "Sin conexion")

# --- LÓGICA DE HUELLA ---

def check_finger():
    if not finger: return

    # 1. Tomar imagen
    if finger.get_image() != 0x00:
        return

    # 2. Convertir
    if finger.image_2_tz(1) != 0x00:
        return

    # 3. Buscar
    lcd_print("Leyendo Huella", "Identificando...") # Feedback visual rápido
    found_id = finger.finger_fast_search()
    
    if found_id == -1:
        print("Huella desconocida")
        lcd_print("ACCESO DENEGADO", "Huella No Valida")
        time.sleep(1.5)
        mostrar_espera() # Volver a mensaje descriptivo
        return

    # Encontrado
    print(f"Encontrado ID #{found_id}")
    # Nota: send_attendance ya actualiza la pantalla
    send_attendance(found_id)
    
    time.sleep(2.5) # Tiempo para leer el nombre
    mostrar_espera() # Volver a mensaje descriptivo

def handle_enroll():
    global current_state
    if not finger: 
        current_state = IDLE
        return

    # Paso 1
    lcd_print("REGISTRO DE HUELLA", "Coloque Dedo...")
    
    while finger.get_image() != 0x00:
        time.sleep_ms(100)
    
    if finger.image_2_tz(1) != 0x00:
        lcd_print("Error Lectura", "Intente de nuevo"); time.sleep(1)
        return

    # Paso 2
    lcd_print("REGISTRO DE HUELLA", "Retire el dedo")
    time.sleep(2)
    while finger.get_image() == 0x00:
        time.sleep_ms(100)

    # Paso 3
    lcd_print("REGISTRO DE HUELLA", "Poner el MISMO")
    while finger.get_image() != 0x00:
        time.sleep_ms(100)

    if finger.image_2_tz(2) != 0x00:
        lcd_print("Error Lectura", "No coincide"); time.sleep(1)
        return

    # Paso 4
    if finger.create_model() != 0x00:
        lcd_print("Error Modelo", "Huellas distintas"); time.sleep(1)
        return
        
    # Paso 5
    if finger.store_model(enroll_id) == 0x00:
        lcd_print("REGISTRO EXITOSO", f"ID Guardado: {enroll_id}")
        print(f"Huella guardada en ID {enroll_id}")
        current_state = IDLE
    else:
        lcd_print("Error Guardado", "Fallo Memoria")
        
    time.sleep(2)
    mostrar_espera()

# --- EJECUCIÓN PRINCIPAL ---

setup()

print("Iniciando bucle...")

while True:
    now = time.ticks_ms()
    
    try:
        # 1. Polling (Asistencia)
        if current_state == IDLE:
            if time.ticks_diff(now, last_poll) > POLL_INTERVAL:
                poll_commands()
                last_poll = time.ticks_ms()
                
            check_finger()
            
        # 2. Registro
        elif current_state == ENROLLING:
            handle_enroll()
            
    except Exception as e:
        print("Error Loop:", e)
        time.sleep(1)
        
    time.sleep_ms(50)
