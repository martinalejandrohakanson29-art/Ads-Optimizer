const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu Google Sheet publicada como CSV
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZiHReHZbPOXwssGTGf1kuMvXRfG1C7k8cvlZsyVoPVPLZ8DOgIqV_3jerRYO70CMzAs-RVUNnNrqg/pub?output=csv';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(SHEET_URL);
        // Dividimos por filas y limpiamos espacios vacíos
        const rows = response.data.split('\n').filter(row => row.trim() !== '').slice(1);

        let htmlContent = `
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <style>
                .pre { background-color: #e3f2fd; } .during { background-color: #fff3e0; } .post { background-color: #f1f8e9; }
            </style>
            <title>Revolucion Motos - Ads Optimizer</title>
        </head>
        <body class="container mt-4">
            <h1 class="mb-4 text-primary">Panel de Optimización: ROAS-First</h1>
            <p class="text-muted">Estrategia 2025: Maximizando la rentabilidad de Revolucion Motos.</p>
            
            <table class="table table-hover border">
                <thead class="table-dark">
                    <tr>
                        <th class="pre">Producto (PRE)</th>
                        <th class="pre">BEROAS (Mínimo)</th>
                        <th class="during">ROAS Actual</th>
                        <th class="during">Estado</th>
                        <th class="post">Margen Neto (POST)</th>
                        <th>Acción Sugerida</th>
                    </tr>
                </thead>
                <tbody>`;

        rows.forEach(row => {
            // Usamos una expresión regular para separar por comas pero ignorar comas dentro de comillas
            const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            
            // MAPEO SEGÚN TU EXCEL "PRECIOS_ML.xlsx"
            const nombre = columns[1]?.replace(/"/g, ''); // Columna B
            const precioFinal = parseFloat(columns[10]); // Columna K
            const margenRealPorcentaje = parseFloat(columns[22]); // Columna W (MARGEN NETO REAL %)
            const beroasCalculado = parseFloat(columns[24]); // Columna Y (BEROAS)
            
            // IMPORTANTE: Necesitas agregar una columna en tu Sheet para el "ROAS Actual" 
            // que sacas de Mercado Ads. Aquí supongamos que es la columna Z (index 25)
            const roasActual = parseFloat(columns[25]) || 0; 

            if (!nombre || isNaN(precioFinal)) return;

            // Lógica de decisión basada en Reporte Estratégico
            let estado = "Analizando";
            let accion = "Cargar ROAS actual";
            let badgeClass = "bg-secondary";

            if (roasActual > 0) {
                if (roasActual < beroasCalculado) {
                    estado = "PÉRDIDA";
                    accion = "PAUSAR: Estás quemando margen";
                    badgeClass = "bg-danger";
                } else if (roasActual > beroasCalculado * 1.5) {
                    estado = "EXCELENTE";
                    accion = "ESCALAR: Aumentar presupuesto 10%";
                    badgeClass = "bg-success";
                } else {
                    estado = "RENTABLE";
                    accion = "MANTENER: Ajustar pujas levemente";
                    badgeClass = "bg-warning text-dark";
                }
            }

            htmlContent += `
                <tr>
                    <td class="pre"><strong>${nombre}</strong></td>
                    <td class="pre">${beroasCalculado.toFixed(2)}x</td>
                    <td class="during">${roasActual > 0 ? roasActual + 'x' : 'S/D'}</td>
                    <td class="during"><span class="badge ${badgeClass}">${estado}</span></td>
                    <td class="post">${(margenRealPorcentaje * 100).toFixed(2)}%</td>
                    <td><small>${accion}</small></td>
                </tr>`;
        });

        htmlContent += `</tbody></table></body></html>`;
        res.send(htmlContent);

    } catch (error) {
        console.error(error);
        res.status(500).send("Error al conectar con Google Sheets. Verificá que esté 'Publicado en la Web' como CSV.");
    }
});

app.listen(PORT, () => {
    console.log(`App lista en puerto ${PORT}`);
});
