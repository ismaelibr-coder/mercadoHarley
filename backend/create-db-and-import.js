import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import mysql from 'mysql2/promise';

dotenv.config();

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const DB_NAME = process.env.DB_NAME || 'mercado_harley';

const schemaPath = resolve(__dirname, '../schema.sql');

const run = async () => {
    try {
        console.log('Conectando ao MySQL em', DB_HOST);

        const connection = await mysql.createConnection({
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            port: DB_PORT,
            multipleStatements: true
        });

        console.log(`Criando banco de dados '${DB_NAME}' (se não existir)...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);

        // mudar para o DB criado
        await connection.changeUser({ database: DB_NAME });

        if (!fs.existsSync(schemaPath)) {
            console.log('Arquivo schema.sql não encontrado em:', schemaPath);
            await connection.end();
            process.exit(1);
        }

        console.log('Importando schema a partir de', schemaPath);
        const sql = fs.readFileSync(schemaPath, 'utf8');

        if (sql.trim()) {
            await connection.query(sql);
            console.log('Schema importado com sucesso.');
        } else {
            console.log('Schema vazio, nada para importar.');
        }

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error('Erro ao criar/importar banco:', err.message || err);
        process.exit(1);
    }
};

run();
