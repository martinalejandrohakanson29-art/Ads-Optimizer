const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu Google Sheet (Asegúrate que sea la de formato CSV)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZiHReHZbPOXwssGTGf1kuMvXRfG1C7k8cvlZsyVoPVPLZ8DOgIqV_3jerRYO70CMzAs-RVUNnNrqg/pub?output=csv';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(SHEET_URL);
        const data = response.data;

        // Limpieza robusta: Eliminamos los saltos de línea dentro de las comillas 
        // para que no rompan las filas
        const cleanData = data.replace(/"([^"]*)"/g, (match, p1) => p1.replace(/\n/g, ' '));
        const rows = cleanData.split('\r\n').filter(row => row.trim() !== '').slice(1);

        let htmlContent = `
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Revolucion Motos - Control de Publicidad</title>
            <style>
                .fase-pre { background-color: #e3f2fd; }
                .fase-durante { background-color: #fff3e0; }
                .fase-post { background-color: #f1f8e9; }
                .table { font-size: 0.9rem; }
            </style>
        </head>
        <body class="container-fluid p-4">
            <h2 class="mb-4">Monitor Estratégico Mercado Ads</h2>
            <div class="table-responsive">
                <table class="table table-bordered align-middle">
                    <thead class="table-dark text-center">
                        <tr>
                            <th class="fase-pre">Producto (PRE)</th>
                            <th class="fase-pre">BEROAS (Mínimo)</th>
                            <th class="fase-durante text-primary">ROAS Actual</th>
                            <th class="fase-durante">Estado Ads</th>
                            <th class="fase-post">Margen Neto (POST)</th>
                            <th>Acción Sugerida</th>
                        </tr>
                    </thead>
                    <tbody>`;

        rows.forEach(row => {
            // Separador por comas que respeta las comillas
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            // MAPEO EXACTO SEGÚN TU ARCHIVO "PRECIOS_ML.xlsx"
            const nombre = columns[1]?.replace(/"/g, '').trim(); 
            const margenNetoReal = parseFloat(columns[22]); // Columna W (MARGEN NETO REAL %)
            const beroasCalculado = parseFloat(columns[24]); // Columna Y (BEROAS)
            
            // IMPORTANTE: Como en tu archivo no hay columna ROAS, la app leerá 
            // la columna Z (index 25) si la agregas en el Excel/Sheet.
            const roasActual = parseFloat(columns[25]) || 0; 

            if (!nombre || isNaN(beroasCalculado)) return;

            // Lógica de Semáforo Estratégico
            let badgeClass = "bg-secondary";
            let estado = "Sin Datos";
            let recomendacion = "Cargar ROAS en Columna Z";

            if (roasActual > 0) {
                if (roasActual < beroasCalculado) {
                    badgeClass = "bg-danger";
                    estado = "PÉRDIDA";
                    recomendacion = "<strong>PAUSAR:</strong> Pierdes dinero por venta.";
                } else if (roasActual > (beroasCalculado * 1.5)) {
                    badgeClass = "bg-success";
                    estado = "GANANCIA ALTA";
                    recomendacion = "<strong>ESCALAR:</strong> Sube presupuesto +15%.";
                } else {
                    badgeClass = "bg-warning text-dark";
                    estado = "PUNTO EQUILIBRIO";
                    recomendacion = "<strong>OPTIMIZAR:</strong> Revisa el costo del clic.";
                }
            }

            htmlContent += `
                <tr>
                    <td class="fase-pre"><strong>${nombre}</strong></td>
                    <td class="fase-pre text-center">${beroasCalculado.toFixed(2)}x</td>
                    <td class="fase-durante text-center fw-bold text-primary">${roasActual > 0 ? roasActual.toFixed(2) + 'x' : '-'}</td>
                    <td class="fase-durante text-center"><span class="badge ${badgeClass}">${estado}</span></td>
                    <td class="fase-post text-center text-success fw-bold">${(margenNetoReal * 100).toFixed(1)}%</td>
                    <td><small>${recomendacion}</small></td>
                </tr>`;
        });

        htmlContent += `</tbody></table></div></body></html>`;
        res.send(htmlContent);

    } catch (error) {
        console.error("Error detallado:", error.message);
        res.status(500).send("Error de conexión. Verifica que el Sheet esté publicado como CSV.");
    }
});

app.listen(PORT, () => console.log(`Monitor activo en puerto ${PORT}`));
