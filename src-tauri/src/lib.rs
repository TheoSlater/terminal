// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use portable_pty::{native_pty_system, Child, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{Read, Write};
use std::sync::{Arc, Mutex};
#[cfg(debug_assertions)]
use std::time::Instant;
use tauri::{AppHandle, Emitter, State};

struct PtySession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn MasterPty + Send>,
    _child: Box<dyn Child + Send + Sync>,
    killer: Box<dyn ChildKiller + Send + Sync>,
    _cwd: std::path::PathBuf,
}

type PtyHandle = Arc<Mutex<PtySession>>;
type SessionState = Arc<Mutex<HashMap<String, PtyHandle>>>;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PtyOutput {
    session_id: String,
    data: Vec<u8>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PtyExit {
    session_id: String,
    code: Option<i32>,
}

#[derive(Clone, Serialize)]
struct PtyDimensions {
    cols: u16,
    rows: u16,
}

#[tauri::command]
fn start_pty(
    app: AppHandle,
    state: State<'_, SessionState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<String, String> {
    if session_id.is_empty() {
        return Err("Terminal session ID is required".to_string());
    }
    let session_state = Arc::clone(state.inner());
    let sessions = state
        .lock()
        .map_err(|_| "PTY state is unavailable".to_string())?;
    if let Some(session) = sessions.get(&session_id) {
        let session = session
            .lock()
            .map_err(|_| "PTY session is unavailable".to_string())?;
        return Ok(session._cwd.to_string_lossy().into_owned());
    }
    drop(sessions);

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: rows.max(1),
            cols: cols.max(1),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|error| error.to_string())?;
    let cwd = std::env::current_dir().map_err(|error| error.to_string())?;
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());
    let mut command = CommandBuilder::new(shell);
    command.cwd(&cwd);
    command.env("TERM", "xterm-256color");
    command.env("COLORTERM", "truecolor");
    command.env("TERM_PROGRAM", "terminal");
    command.env("TERM_PROGRAM_VERSION", "1.0");
    let child = pair
        .slave
        .spawn_command(command)
        .map_err(|error| error.to_string())?;
    drop(pair.slave);
    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|error| error.to_string())?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|error| error.to_string())?;
    let killer = child.clone_killer();
    let session = Arc::new(Mutex::new(PtySession {
        writer,
        master: pair.master,
        _child: child,
        killer,
        _cwd: cwd.clone(),
    }));
    state
        .lock()
        .map_err(|_| "PTY state is unavailable".to_string())?
        .insert(session_id.clone(), Arc::clone(&session));

    std::thread::spawn(move || read_pty(app, session_state, session_id, reader, session));
    Ok(cwd.to_string_lossy().into_owned())
}

fn read_pty(
    app: AppHandle,
    state: SessionState,
    session_id: String,
    mut reader: Box<dyn Read + Send>,
    session: PtyHandle,
) {
    let mut buffer = [0_u8; 16 * 1024];
    loop {
        match reader.read(&mut buffer) {
            Ok(0) | Err(_) => break,
            Ok(length) => {
                let _ = app.emit(
                    "pty-output",
                    PtyOutput {
                        session_id: session_id.clone(),
                        data: buffer[..length].to_vec(),
                    },
                );
            }
        }
    }
    if let Ok(mut sessions) = state.lock() {
        if sessions
            .get(&session_id)
            .is_some_and(|current| Arc::ptr_eq(current, &session))
        {
            sessions.remove(&session_id);
        }
    }
    let _ = app.emit(
        "pty-exit",
        PtyExit {
            session_id,
            code: None,
        },
    );
}

fn get_session(state: &SessionState, session_id: &str) -> Result<PtyHandle, String> {
    state
        .lock()
        .map_err(|_| "PTY state is unavailable".to_string())?
        .get(session_id)
        .cloned()
        .ok_or_else(|| "PTY is not running".to_string())
}

#[tauri::command]
fn write_pty(
    state: State<'_, SessionState>,
    session_id: String,
    data: String,
) -> Result<(), String> {
    let session = get_session(state.inner(), &session_id)?;
    let mut pty = session
        .lock()
        .map_err(|_| "PTY session is unavailable".to_string())?;
    pty.writer
        .write_all(data.as_bytes())
        .map_err(|error| error.to_string())?;
    pty.writer.flush().map_err(|error| error.to_string())
}

#[tauri::command]
fn terminal_resize(
    state: State<'_, SessionState>,
    session_id: String,
    cols: u16,
    rows: u16,
) -> Result<PtyDimensions, String> {
    let session = get_session(state.inner(), &session_id)?;
    let pty = session
        .lock()
        .map_err(|_| "PTY session is unavailable".to_string())?;
    #[cfg(debug_assertions)]
    let started_at = Instant::now();
    let requested = PtySize {
        rows: rows.max(1),
        cols: cols.max(1),
        pixel_width: 0,
        pixel_height: 0,
    };
    pty.master
        .resize(requested)
        .map_err(|error| error.to_string())?;

    let applied = match pty.master.get_size() {
        Ok(applied) => {
            #[cfg(debug_assertions)]
            eprintln!(
                "[terminal][resize][pty] session={} cols={} rows={} pixels={}x{} duration_us={}",
                session_id,
                applied.cols,
                applied.rows,
                applied.pixel_width,
                applied.pixel_height,
                started_at.elapsed().as_micros()
            );
            applied
        }
        Err(error) => {
            #[cfg(debug_assertions)]
            eprintln!(
                "[terminal][resize][pty] session={} applied cols={} rows={} duration_us={} (readback failed: {})",
                session_id,
                requested.cols,
                requested.rows,
                started_at.elapsed().as_micros(),
                error
            );
            requested
        }
    };

    Ok(PtyDimensions {
        cols: applied.cols,
        rows: applied.rows,
    })
}

#[tauri::command]
fn stop_pty(state: State<'_, SessionState>, session_id: String) -> Result<(), String> {
    let session = state
        .lock()
        .map_err(|_| "PTY state is unavailable".to_string())?
        .remove(&session_id);
    if let Some(session) = session {
        let mut pty = session
            .lock()
            .map_err(|_| "PTY session is unavailable".to_string())?;
        pty.killer.kill().map_err(|error| error.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(Arc::new(Mutex::new(HashMap::new())) as SessionState)
        .invoke_handler(tauri::generate_handler![
            start_pty,
            write_pty,
            terminal_resize,
            stop_pty
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
