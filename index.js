const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZiHReHZbPOXwssGTGf1kuMvXRfG1C7k8cvlZsyVoPVPLZ8DOgIqV_3jerRYO70CMzAs-RVUNnNrqg/pub?output=csv';

app.get('/', async (req, res) => {
    try {
        console.log("Iniciando descarga de datos...");
        const response = await axios.get(SHEET_URL);
        const data = response.data;

        // Separamos filas de forma inteligente (soporta \n y \r\n)
        // Usamos una expresión que solo corta la línea si no estamos dentro de comillas
        const rows = data.split(/\r?\n(?=(?:(?:[^"]*"){2})*[^"]*$)/).filter(r => r.trim() !== "").slice(1);
        
        console.log(`Se detectaron ${rows.length} productos.`);

        let htmlRows = "";

        rows.forEach((row, index) => {
            // Separador de comas que respeta el texto entre comillas
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            // MAPEO SEGÚN TU ARCHIVO REAL
            const nombre = columns[1]?.replace(/"/g, '').trim() || "Producto sin nombre";
            const margenNetoReal = parseFloat(columns[22]) || 0; 
            const beroasCalculado = parseFloat(columns[24]) || 0;
            const roasActual = parseFloat(columns[25]) || 0; // Columna Z que debés completar

            if (nombre === "Producto sin nombre" && beroasCalculado === 0) return;

            let badgeClass = "bg-secondary";
            let estado = "Esperando ROAS";
            let recomendacion = "Cargar ROAS en Columna Z";

            if (roasActual > 0) {
                if (roasActual < beroasCalculado) {
                    badgeClass = "bg-danger";
                    estado = "PÉRDIDA";
                    recomendacion = "PAUSAR: Estás quemando margen.";
                } else if (roasActual > (beroasCalculado * 1.5)) {
                    badgeClass = "bg-success";
                    estado = "EXCELENTE";
                    recomendacion = "ESCALAR: Subir presupuesto +10%.";
                } else {
                    badgeClass = "bg-warning text-dark";
                    estado = "RENTABLE";
                    recomendacion = "MANTENER: Ajustar pujas.";
                }
            }

            htmlRows += `
                <tr>
                    <td><strong>${nombre}</strong></td>
                    <td class="text-center">${beroasCalculado.toFixed(2)}x</td>
                    <td class="text-center text-primary fw-bold">${roasActual > 0 ? roasActual.toFixed(2) + 'x' : '-'}</td>
                    <td class="text-center"><span class="badge ${badgeClass}">${estado}</span></td>
                    <td class="text-center text-success">${(margenNetoReal * 100).toFixed(1)}%</td>
                    <td><small>${recomendacion}</small></td>
                </tr>`;
        });

        const finalHtml = `
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Revolucion Motos - Ads Monitor</title>
        </head>
        <body class="container mt-4">
            <h2 class="mb-4 text-center">Monitor de Rentabilidad - Revolucion Motos</h2>
            <div class="table-responsive">
                <table class="table table-striped table-bordered">
                    <thead class="table-dark">
                        <tr>
                            <th>Producto</th>
                            <th>BEROAS (Mínimo)</th>
                            <th>ROAS Actual</th>
                            <th>Estado</th>
                            <th>Margen Neto</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>${htmlRows || '<tr><td colspan="6" class="text-center">No se encontraron datos válidos en el Sheet.</td></tr>'}</tbody>
                </table>
            </div>
        </body>
        </html>`;

        res.send(finalHtml);

    } catch (error) {
        console.error("ERROR CRÍTICO:", error.message);
        res.status(500).send(`Error al leer los datos. Asegurate que el Sheet esté 'Publicado en la Web' como CSV.`);
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`App corriendo en puerto ${PORT}`);
});
