const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// URL de tu Google Sheet publicada como CSV (es más fácil de leer que el HTML)
// Nota: En Google Sheets ve a Archivo > Compartir > Publicar en la web > Valores separados por comas (.csv)
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTZiHReHZbPOXwssGTGf1kuMvXRfG1C7k8cvlZsyVoPVPLZ8DOgIqV_3jerRYO70CMzAs-RVUNnNrqg/pub?output=csv';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(SHEET_URL);
        const rows = response.data.split('\n').slice(1); // Ignoramos el encabezado

        let htmlContent = `
        <html>
        <head>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            <title>Revolucion Motos - Optimizador Ads</title>
        </head>
        <body class="container mt-4">
            <h1 class="mb-4">Estrategia de Mercado Ads 2025</h1>
            <table class="table table-striped">
                <thead class="table-dark">
                    <tr>
                        <th>Producto</th>
                        <th>BEROAS (Mínimo)</th>
                        <th>ROAS Actual</th>
                        <th>Estado</th>
                        <th>Acción Sugerida</th>
                    </tr>
                </thead>
                <tbody>`;

        rows.forEach(row => {
            const columns = row.split(',');
            if (columns.length < 5) return;

            const nombre = columns[0];
            const precio = parseFloat(columns[1]);
            const costoTotal = parseFloat(columns[2]) + parseFloat(columns[3]); // Costo + Comisiones
            const roasActual = parseFloat(columns[4]);

            // Cálculo del Margen y BEROAS
            const margenNeto = (precio - costoTotal) / precio;
            const beroas = (1 / margenNeto).toFixed(2);

            let estado = "";
            let accion = "";
            let badgeClass = "";

            // Lógica de decisión basada en los documentos estratégicos
            if (roasActual > beroas * 1.5) {
                estado = "Excelente";
                accion = "ESCALAR: Aumentar presupuesto 10-20%";
                badgeClass = "bg-success";
            } else if (roasActual >= beroas) {
                estado = "Rentable";
                accion = "MANTENER: Ajustar pujas levemente";
                badgeClass = "bg-warning text-dark";
            } else {
                estado = "PÉRDIDA";
                accion = "PAUSAR: Revisar costo o calidad de publicación";
                badgeClass = "bg-danger";
            }

            htmlContent += `
                <tr>
                    <td>${nombre}</td>
                    <td>${beroas}x</td>
                    <td>${roasActual}x</td>
                    <td><span class="badge ${badgeClass}">${estado}</span></td>
                    <td>${accion}</td>
                </tr>`;
        });

        htmlContent += `</tbody></table></body></html>`;
        res.send(htmlContent);

    } catch (error) {
        res.status(500).send("Error leyendo la planilla de Google. Revisá que esté publicada como CSV.");
    }
});

app.listen(PORT, () => {
    console.log(`App corriendo en puerto ${PORT}`);
});
