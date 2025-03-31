require("dotenv").config();
const express = require("express");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

// Configuración
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const SECRET = process.env.JWT_SECRET || "clave-super-secreta";

// Conexión a PostgreSQL en Neon.tech
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Función para limpiar entradas y evitar etiquetas
const limpiarInput = texto => texto.replace(/<[^>]*>?/gm, "").trim();

// Middleware para autenticar token JWT
function autenticarToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ==================== AUTENTICACIÓN ==================== //

// Registro de usuario
app.post("/registro", async (req, res) => {
    try {
        let { username, password } = req.body;
        username = limpiarInput(username);

        if (!username || !password) {
            return res.status(400).send("Usuario y contraseña requeridos.");
        }

        const hash = await bcrypt.hash(password, 10);

        await pool.query(
            "INSERT INTO usuarios (username, password_hash) VALUES ($1, $2)",
            [username, hash]
        );

        res.sendStatus(201);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en registro.");
    }
});

// Inicio de sesión
app.post("/login", async (req, res) => {
    try {
        let { username, password } = req.body;
        username = limpiarInput(username);

        const result = await pool.query(
            "SELECT * FROM usuarios WHERE username = $1",
            [username]
        );

        if (result.rowCount === 0) {
            return res.status(401).send("Usuario no encontrado.");
        }

        const user = result.rows[0];
        const valido = await bcrypt.compare(password, user.password_hash);

        if (!valido) {
            return res.status(401).send("Contraseña incorrecta.");
        }

        // Generar token JWT (incluye id y username)
        const token = jwt.sign({ id: user.id, username: user.username }, SECRET, { expiresIn: "2h" });
        res.json({ token });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en login.");
    }
});

// ==================== CRUD DE ANIMES (RUTAS PROTEGIDAS) ==================== //

// Agregar Anime (sólo para usuario autenticado)
app.post("/agregarAnime", autenticarToken, async (req, res) => {
    try {
        let { titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(limpiarInput);

        if (calificacion < 0 || calificacion > 10) {
            return res.status(400).send("La calificación debe estar entre 0 y 10.");
        }

        // Se asocia el anime al usuario autenticado (req.user.id)
        await pool.query(
            `INSERT INTO animes (titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, user_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, req.user.id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error en base de datos");
    }
});

// Obtener Animes del usuario autenticado
app.get("/obtenerAnimes", autenticarToken, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT * FROM animes WHERE user_id = $1", [req.user.id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al obtener animes");
    }
});

// Eliminar Anime (verifica que pertenezca al usuario autenticado)
app.post("/eliminarAnime", autenticarToken, async (req, res) => {
    try {
        const { id } = req.body;

        // Verifica que el anime pertenezca al usuario
        const result = await pool.query("SELECT * FROM animes WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (result.rowCount === 0) {
            return res.status(403).send("No autorizado para eliminar este anime");
        }

        await pool.query("DELETE FROM animes WHERE id = $1", [id]);
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al eliminar");
    }
});

// Editar Anime (verifica que pertenezca al usuario autenticado)
app.post("/editarAnime", autenticarToken, async (req, res) => {
    try {
        let { id, titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion } = req.body;
        [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion] =
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion].map(limpiarInput);

        if (calificacion < 0 || calificacion > 10) {
            return res.status(400).send("La calificación debe estar entre 0 y 10.");
        }

        // Verificar que el anime pertenece al usuario
        const result = await pool.query("SELECT * FROM animes WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (result.rowCount === 0) {
            return res.status(403).send("No autorizado para editar este anime");
        }

        await pool.query(
            `UPDATE animes SET titulo=$1, estado=$2, plataforma=$3, genero=$4, personaje_favorito=$5,
             soundtrack=$6, calidad_animacion=$7, calificacion=$8 WHERE id=$9`,
            [titulo, estado, plataforma, genero, personaje_favorito, soundtrack, calidad_animacion, calificacion, id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al editar anime");
    }
});

// ==================== SERVIDOR ==================== //
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));