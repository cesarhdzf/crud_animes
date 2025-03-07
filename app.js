// app.js (BACKEND)
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "n0m3l0",
    database: "anime_listas"
});

con.connect(err => {
    if (err) return console.error("Error al conectar con MySQL:", err);
    console.log("Conectado a MySQL");
});

// Validación Anti-XSS
const validarEntrada = texto => texto.replace(/<[^>]*>?/gm, "");

// Agregar Anime
app.post("/agregarAnime", (req, res) => {
    let { titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;

    [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion] =
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion].map(validarEntrada);

    const sql = `INSERT INTO animes (titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    con.query(sql, [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion], err => {
        if (err) return res.status(500).send("Error en base de datos");
        res.sendStatus(200);
    });
});

// Obtener Animes
app.get('/obtenerAnimes', (req, res) => {
    con.query("SELECT * FROM animes", (err, resultados) => {
        if (err) return res.status(500).send("Error al obtener animes");
        res.json(resultados);
    });
});

// Eliminar Anime
app.post('/eliminarAnime', (req, res) => {
    const id = req.body.id;
    con.query("DELETE FROM animes WHERE id = ?", [id], err => {
        if (err) return res.status(500).send("Error al eliminar");
        res.sendStatus(200);
    });
});

// Editar Anime
app.post('/editarAnime', (req, res) => {
    let { id, titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;

    [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion] =
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion].map(validarEntrada);

    const sql = `UPDATE animes SET titulo=?, estado=?, plataforma=?, genero=?, personaje_favorito=?, soundtrack=?, calidad_animacion=?, calificacion=? WHERE id=?`;

    con.query(sql, [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, id], err => {
        if (err) return res.status(500).send("Error al editar anime");
        res.sendStatus(200);
    });
});

app.listen(5000, () => console.log("Servidor corriendo en puerto 5000"));