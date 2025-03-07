// app.js (BACKEND)
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Conexión a MySQL usando variables de entorno
const connection = mysql.createConnection({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
});

// Conectar a la base de datos
connection.connect(error => {
    if (error) {
        console.error("Error al conectar con MySQL:", error);
        return;
    }
    console.log("Conectado a MySQL en la nube correctamente.");
});

// 🔹 Validación Anti-XSS
const validarEntrada = texto => texto.replace(/<[^>]*>?/gm, "");

// 🔹 Agregar Anime
app.post("/agregarAnime", (req, res) => {
    let { titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;

    [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(validarEntrada);

    const sql = `INSERT INTO animes (titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    
    connection.query(sql, [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion], err => {
        if (err) return res.status(500).send("Error en base de datos");
        res.sendStatus(200);
    });
});

// 🔹 Obtener Animes
app.get('/obtenerAnimes', (req, res) => {
    connection.query("SELECT * FROM animes", (err, resultados) => {
        if (err) return res.status(500).send("Error al obtener animes");
        res.json(resultados);
    });
});

// 🔹 Eliminar Anime
app.post('/eliminarAnime', (req, res) => {
    const id = req.body.id;
    connection.query("DELETE FROM animes WHERE id = ?", [id], err => {
        if (err) return res.status(500).send("Error al eliminar");
        res.sendStatus(200);
    });
});

// 🔹 Editar Anime
app.post('/editarAnime', (req, res) => {
    let { id, titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;

    [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(validarEntrada);

    const sql = `UPDATE animes SET titulo=?, estado=?, plataforma=?, genero=?, personaje_favorito=?, soundtrack=?, calidad_animacion=?, calificacion=? WHERE id=?`;

    connection.query(sql, [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, id], err => {
        if (err) return res.status(500).send("Error al editar anime");
        res.sendStatus(200);
    });
});

// Iniciar el servidor
app.listen(5000, () => console.log("Servidor corriendo en puerto 5000"));
