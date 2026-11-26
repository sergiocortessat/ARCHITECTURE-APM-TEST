import sqlite3

DB_PATH = "bookings.sqlite"


def connect(path):
    connection = sqlite3.connect(path, check_same_thread=False)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


conn = connect(DB_PATH)


def init_db():
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            capacity INTEGER NOT NULL,
            description TEXT
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id TEXT PRIMARY KEY,
            room_id TEXT NOT NULL,
            start_at TEXT NOT NULL,
            end_at TEXT NOT NULL,
            booked_by TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms (id)
        );
        """
    )
    columns = [row["name"] for row in conn.execute("PRAGMA table_info(rooms)")]
    if "description" not in columns:
        conn.execute("ALTER TABLE rooms ADD COLUMN description TEXT")
    conn.commit()
