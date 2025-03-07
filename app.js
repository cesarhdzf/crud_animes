// app.js (BACKEND para Render con PostgreSQL)
require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Configuración de conexión a PostgreSQL en Neon.tech
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Necesario para Neon
});

const validarEntrada = texto => texto.replace(/<[^>]*>?/gm, "");

// Agregar Anime
app.post("/agregarAnime", async (req, res) => {
    try {
        let { titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(validarEntrada);
        
        if (calificacion < 0 || calificacion > 10) {
            return res.status(400).send("La calificación debe estar entre 0 y 10.");
        }

        await pool.query(
            `INSERT INTO animes (titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en base de datos");
    }
});

// Obtener Animes
app.get("/obtenerAnimes", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM animes");
        res.json(rows);
    } catch (err) {
        res.status(500).send("Error al obtener animes");
    }
});

// Eliminar Anime
app.post("/eliminarAnime", async (req, res) => {
    try {
        const { id } = req.body;
        await pool.query("DELETE FROM animes WHERE id = $1", [id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send("Error al eliminar");
    }
});

// Editar Anime
app.post("/editarAnime", async (req, res) => {
    try {
        let { id, titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(validarEntrada);
        
        if (calificacion < 0 || calificacion > 10) {
            return res.status(400).send("La calificación debe estar entre 0 y 10.");
        }

        await pool.query(
            `UPDATE animes SET titulo=$1, estado=$2, plataforma=$3, genero=$4, personaje_favorito=$5, soundtrack=$6, calidad_animacion=$7, calificacion=$8 WHERE id=$9`,
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, id]
        );
        res.sendStatus(200);
    } catch (err) {
        res.status(500).send("Error al editar anime");
    }
});

// Iniciar el servidor en Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));