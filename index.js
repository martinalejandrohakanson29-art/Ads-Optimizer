const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZiHReHZbPOXwssGTGf1kuMvXRfG1C7k8cvlZsyVoPVPLZ8DOgIqV_3jerRYO70CMzAs-RVUNnNrqg/pub?output=csv';

// Función para procesar CSV respetando comillas y saltos de línea internos
function parseCSV(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i+1];
        if (char === '"' && inQuotes && next === '"') { field += '"'; i++; }
        else if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { row.push(field); field = ""; }
        else if ((char === '\r' || char === '\n') && !inQuotes) {
            if (field || row.length) { row.push(field); rows.push(row); field = ""; row = []; }
            if (char === '\r' && next === '\n') i++;
        } else { field += char; }
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    return rows;
}

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(SHEET_URL);
        const allData = parseCSV(response.data);
        const rows = allData.slice(1); // Quitamos el encabezado

        let htmlRows = "";
        rows.forEach((columns) => {
            // MAPEO EXACTO SEGÚN TU ARCHIVO PRECIOS_ML.xlsx
            const nombre = columns[1]?.trim() || "Sin nombre";
            const gananciaNeta = parseFloat(columns[21]) || 0;
            const margenNetoReal = parseFloat(columns[22]) || 0;
            const beroas = parseFloat(columns[24]) || 0;
            
            // Columna Z (índice 25) para el ROAS que vos cargues manualmente
            const roasActual = parseFloat(columns[25]) || 0; 

            if (nombre === "Sin nombre" || beroas === 0) return;

            let badge = "bg-secondary";
            let accion = "Cargar ROAS (Col Z)";
            
            if (roasActual > 0) {
                if (roasActual < beroas) {
                    badge = "bg-danger"; accion = "PAUSAR: Estás perdiendo plata";
                } else if (roasActual > beroas * 1.5) {
                    badge = "bg-success"; accion = "ESCALAR: Subir presupuesto";
                } else {
                    badge = "bg-warning text-dark"; accion = "OPTIMIZAR: Punto de equilibrio";
                }
            }

            htmlRows += `
                <tr>
                    <td><strong>${nombre}</strong></td>
                    <td class="text-center bg-light">${beroas.toFixed(2)}x</td>
                    <td class="text-center fw-bold text-primary">${roasActual > 0 ? roasActual.toFixed(2) + 'x' : '-'}</td>
                    <td class="text-center"><span class="badge ${badge}">${roasActual > 0 ? 'ACTIVO' : 'S/D'}</span></td>
                    <td class="text-center text-success">$${gananciaNeta.toLocaleString('es-AR')}</td>
                    <td><small>${accion}</small></td>
                </tr>`;
        });

        res.send(`
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Revolucion Motos - Ads Optimizer</title>
        </head>
        <body class="container mt-4">
            <h2 class="mb-4">Monitor de Mercado Ads: Revolucion Motos</h2>
            <div class="table-responsive">
                <table class="table table-bordered table-striped align-middle">
                    <thead class="table-dark">
                        <tr>
                            <th>Producto (PRE)</th>
                            <th>BEROAS (Mínimo)</th>
                            <th>ROAS Actual</th>
                            <th>Estado</th>
                            <th>Ganancia Neta (POST)</th>
                            <th>Acción Sugerida</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows}</tbody>
                </table>
            </div>
        </body>
        </html>`);
    } catch (e) {
        res.status(500).send("Error leyendo la planilla: " + e.message);
    }
});

app.listen(PORT, () => console.log("Servidor listo"));
