// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use portable_pty::{native_pty_system, Child, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, State};

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    _child: Box<dyn Child + Send + Sync>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

type SessionState = Arc<Mutex<Option<PtySession>>>;
const SESSION_ID: &str = "main";

#[derive(Clone, Serialize)]
struct PtyExit {
    code: Option<i32>,
}

#[tauri::command]
fn start_pty(app: AppHandle, state: State<'_, SessionState>, session_id: String, cols: u16, rows: u16) -> Result<(), String> {
    if session_id != SESSION_ID { return Err("Unknown terminal session".to_string()); }
    let mut session = state.lock().map_err(|_| "PTY state is unavailable".to_string())?;
    if session.is_some() {
        return Ok(());
    }

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize { rows: rows.max(1), cols: cols.max(1), pixel_width: 0, pixel_height: 0 })
        .map_err(|error| error.to_string())?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
    let mut command = CommandBuilder::new(shell);
    command.env("TERM", "xterm-256color");
    command.env("COLORTERM", "truecolor");
    command.env("TERM_PROGRAM", "terminal");
    command.env("TERM_PROGRAM_VERSION", "1.0");
    let child = pair.slave.spawn_command(command).map_err(|error| error.to_string())?;
    drop(pair.slave);
    let reader = pair.master.try_clone_reader().map_err(|error| error.to_string())?;
    let writer = pair.master.take_writer().map_err(|error| error.to_string())?;
    let killer = child.clone_killer();
    *session = Some(PtySession { writer, master: pair.master, _child: child, killer });
    drop(session);

    std::thread::spawn(move || read_pty(app, reader));
    Ok(())
}

fn read_pty(app: AppHandle, mut reader: Box<dyn Read + Send>) {
    let mut buffer = [0_u8; 16 * 1024];
    loop {
        match reader.read(&mut buffer) {
            Ok(0) | Err(_) => break,
            Ok(length) => {
                let _ = app.emit("pty-output", buffer[..length].to_vec());
            }
        }
    }
    let _ = app.emit("pty-exit", PtyExit { code: None });
}

#[tauri::command]
fn write_pty(state: State<'_, SessionState>, session_id: String, data: String) -> Result<(), String> {
    if session_id != SESSION_ID { return Err("Unknown terminal session".to_string()); }
    let mut session = state.lock().map_err(|_| "PTY state is unavailable".to_string())?;
    let pty = session.as_mut().ok_or_else(|| "PTY is not running".to_string())?;
    pty.writer.write_all(data.as_bytes()).map_err(|error| error.to_string())?;
    pty.writer.flush().map_err(|error| error.to_string())
}

#[tauri::command]
fn terminal_resize(state: State<'_, SessionState>, session_id: String, cols: u16, rows: u16) -> Result<(), String> {
    if session_id != SESSION_ID { return Err("Unknown terminal session".to_string()); }
    let session = state.lock().map_err(|_| "PTY state is unavailable".to_string())?;
    let pty = session.as_ref().ok_or_else(|| "PTY is not running".to_string())?;
    pty.master.resize(PtySize { rows: rows.max(1), cols: cols.max(1), pixel_width: 0, pixel_height: 0 }).map_err(|error| error.to_string())
}

#[tauri::command]
fn stop_pty(state: State<'_, SessionState>, session_id: String) -> Result<(), String> {
    if session_id != SESSION_ID { return Err("Unknown terminal session".to_string()); }
    let mut session = state.lock().map_err(|_| "PTY state is unavailable".to_string())?;
    if let Some(mut pty) = session.take() {
        pty.killer.kill().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(Mutex::new(None)) as SessionState)
        .invoke_handler(tauri::generate_handler![start_pty, write_pty, terminal_resize, stop_pty])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
