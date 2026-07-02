import mysql from 'mysql2/promise'

// Kita export 'db' agar bisa di-import dari file manapun
export const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ekitchy_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})