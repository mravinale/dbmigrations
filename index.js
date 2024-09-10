const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
require('dotenv').config();  // Cargar las variables del archivo .env

// Configuración del repositorio
const GITHUB_TOKEN = process.env.CI_TOKEN; // Reemplaza con tu token de acceso personal
const REPO_URL = `https://mravinale:${GITHUB_TOKEN}@github.com/mravinale/dbmigrations.git`; // Reemplaza con tu repo y usuario
const REPO_DIR = './backup';  // Carpeta donde clonarás o ya tienes el repo

// Función para ejecutar el comando pg_dump y generar el archivo dump.sql
function generarDump(callback) {
    exec('dbmate dump', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error ejecutando pg_dump: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log('Archivo schema.sql generado con éxito.');
        callback();
    });
}

async function commitAndPushPgDump() {
    const git = simpleGit(REPO_DIR);
    const filePath = './db/schema.sql';  // Ruta correcta de tu archivo
    const destinationPath = `${REPO_DIR}/${generarNombreArchivo()}`;  // Ruta destino

    try {
        // Si el repositorio no está clonado, clonarlo
        if (!fs.existsSync(REPO_DIR)) {
            console.log(`Clonando el repositorio desde ${REPO_URL}...`);
            await git.clone(REPO_URL, REPO_DIR);
        } else {
            // Si el repositorio ya está clonado, hacer un pull autenticado para actualizarlo
            console.log(`El repositorio ya está clonado. Haciendo pull autenticado para actualizarlo...`);

            // Setear la URL remota autenticada antes del pull
            await git.addRemote('origin', REPO_URL).catch(() => {
                console.log("El remote ya está configurado.");
            });

            await git.pull('origin', 'main');
        }

        // Copiar el archivo al directorio de destino
        fs.copyFileSync(filePath, destinationPath);
        console.log(`Archivo copiado exitosamente a ${destinationPath}`);

        // Agregar el archivo al staging
        await git.add(`${generarNombreArchivo()}`);

        // Hacer commit con el mensaje que evita GitHub Actions
        await git.commit(`Agregado backup ${generarNombreArchivo()} [skip ci]`);

        // Push a la rama principal o la rama que elijas
        await git.push('origin', 'main');  // Puedes cambiar 'main' por la rama deseada

        console.log('Archivo committeado y pusheado con éxito sin disparar GitHub Actions.');
    } catch (error) {
        console.error('Error en el proceso de commit/push:', error);
    }
}

// Función para generar el nombre del archivo con el formato YYYYMMDD-schema.sql
function generarNombreArchivo() {
    const fechaActual = new Date();

    // Obtener el año, mes y día con ceros a la izquierda si es necesario
    const anio = fechaActual.getFullYear();
    const mes = String(fechaActual.getMonth() + 1).padStart(2, '0'); // Los meses en JavaScript son de 0-11, por eso sumamos 1
    const dia = String(fechaActual.getDate()).padStart(2, '0');

    // Crear el nombre del archivo con el formato YYYYMMDD-schema.sql
    const nombreArchivo = `${anio}${mes}${dia}-schema.sql`;

    return nombreArchivo;
}

// Función principal para generar el dump, luego hacer commit y push
async function main() {
    generarDump(async () => {
        await commitAndPushPgDump();
    });
}

main();
